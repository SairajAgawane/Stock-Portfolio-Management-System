import crypto from 'node:crypto';
import { Router } from 'express';
import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma';
import { hashPassword, signToken, verifyPassword } from '../lib/auth';
import { loginSchema, parseBody, registerSchema, verifyOtpSchema } from '../validation';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

export const authRouter = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: 'Too many login attempts, please try again later' });
const otpLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false, message: 'Too many OTP requests, please try again later' });

async function createFirebaseAccount(email: string, password: string) {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) throw Object.assign(new Error('Firebase authentication is not configured.'), { name: 'FIREBASE_NOT_CONFIGURED' });
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const payload = await response.json() as { email?: string; error?: { message?: string } };
  if (!response.ok) {
    const code = payload.error?.message ?? 'FIREBASE_AUTH_FAILED';
    if (code === 'EMAIL_EXISTS') throw Object.assign(new Error('Email is already registered'), { name: 'EMAIL_EXISTS' });
    if (code.startsWith('WEAK_PASSWORD')) throw Object.assign(new Error('Password is too weak'), { name: 'WEAK_PASSWORD' });
    throw Object.assign(new Error('Firebase could not create the account.'), { name: 'FIREBASE_AUTH_FAILED' });
  }
  return payload.email ?? email;
}

function setSession(res: import('express').Response, user: { id: number; email: string; name: string; role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' }) {
  // Vercel hosts the web app while Railway hosts the API, so the session
  // cookie must be allowed on cross-site fetches in production.
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('portfolio_token', signToken(user), {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function otpHash(otp: string) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

async function sendEmail(email: string, subject: string, text: string, html: string) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASS;
  if (!host || !user || !password) {
    if (process.env.OTP_DEV_MODE === 'true') {
      console.log(`[DEV EMAIL] To: ${email} | Subject: ${subject}\nBody: ${text}`);
      return;
    }
    const error = new Error('Email delivery is not configured. Add SMTP_HOST, SMTP_USER, and SMTP_PASS.');
    error.name = 'EMAIL_NOT_CONFIGURED';
    throw error;
  }
  const port = Number(process.env.SMTP_PORT ?? 465);
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
    auth: { user, pass: password },
  });
  await transport.sendMail({
    from: process.env.SMTP_FROM ?? user,
    to: email,
    subject,
    text,
    html,
  });
  await transport.close();
}

async function requestRegistrationOtp(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
  try {
    const input = parseBody(registerSchema, req.body);
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) return res.status(409).json({ code: 'EMAIL_EXISTS', message: 'Email is already registered' });
    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES ?? 10);
    await prisma.registrationOtp.upsert({
      where: { email: input.email },
      update: {
        name: input.name,
        phone: input.phone,
        passwordHash: await hashPassword(input.password),
        otpHash: otpHash(otp),
        expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
        attempts: 0,
      },
      create: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash: await hashPassword(input.password),
        otpHash: otpHash(otp),
        expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
      },
    });
    const text = `Your verification code is ${otp}. It expires in ${expiryMinutes} minutes.`;
    const html = `<p>Your verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:8px">${otp}</p><p>This code expires in ${expiryMinutes} minutes.</p>`;
    await sendEmail(input.email, 'Your Stock Portfolio verification code', text, html);
    const response: { message: string; devOtp?: string } = { message: `Verification code sent to ${input.email}` };
    if (process.env.OTP_DEV_MODE === 'true' && process.env.NODE_ENV !== 'production') response.devOtp = otp;
    return res.status(202).json(response);
  } catch (error) { return next(error); }
}

authRouter.post('/register/request-otp', otpLimiter, requestRegistrationOtp);
authRouter.post('/register', otpLimiter, requestRegistrationOtp);

authRouter.post('/firebase-register', authLimiter, async (req, res, next) => {
  try {
    const input = parseBody(registerSchema, req.body);
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) return res.status(409).json({ code: 'EMAIL_EXISTS', message: 'Email is already registered' });
    await createFirebaseAccount(input.email, input.password);
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, phone: input.phone, passwordHash: await hashPassword(input.password) },
      select: { id: true, name: true, email: true, role: true },
    });
    setSession(res, user);
    await prisma.auditLog.create({ data: { userId: user.id, action: 'REGISTER', ipAddress: req.ip ?? req.socket.remoteAddress } });
    return res.status(201).json({ user });
  } catch (error) { return next(error); }
});

authRouter.post('/register/verify-otp', authLimiter, async (req, res, next) => {
  try {
    const input = parseBody(verifyOtpSchema, req.body);
    const pending = await prisma.registrationOtp.findUnique({ where: { email: input.email } });
    if (!pending || pending.expiresAt.getTime() < Date.now()) {
      if (pending) await prisma.registrationOtp.delete({ where: { email: input.email } }).catch(() => undefined);
      return res.status(400).json({ code: 'OTP_EXPIRED', message: 'OTP is invalid or expired. Request a new OTP.' });
    }
    if (pending.attempts >= 5) return res.status(429).json({ code: 'OTP_ATTEMPTS_EXCEEDED', message: 'Too many incorrect OTP attempts. Request a new OTP.' });
    if (otpHash(input.otp) !== pending.otpHash) {
      await prisma.registrationOtp.update({ where: { email: input.email }, data: { attempts: { increment: 1 } } });
      return res.status(400).json({ code: 'INVALID_OTP', message: 'Invalid OTP' });
    }
    const user = await prisma.$transaction(async transaction => {
      const existing = await transaction.user.findUnique({ where: { email: pending.email } });
      if (existing) throw Object.assign(new Error('Email is already registered'), { name: 'EMAIL_EXISTS' });
      const created = await transaction.user.create({
        data: { name: pending.name, email: pending.email, phone: pending.phone, passwordHash: pending.passwordHash },
        select: { id: true, name: true, email: true },
      });
      await transaction.registrationOtp.delete({ where: { email: pending.email } });
      await transaction.auditLog.create({ data: { userId: created.id, action: 'REGISTER', ipAddress: req.ip ?? req.socket.remoteAddress } });
      return created;
    });
    setSession(res, { ...user, role: 'USER' });
    return res.status(201).json({ user });
  } catch (error) { return next(error); }
});

authRouter.post('/login', authLimiter, async (req, res, next) => {
  try {
    const input = parseBody(loginSchema, req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' });
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    setSession(res, safeUser);
    await prisma.auditLog.create({ data: { userId: user.id, action: 'LOGIN', ipAddress: req.ip ?? req.socket.remoteAddress } });
    return res.json({ user: safeUser });
  } catch (error) { return next(error); }
});

authRouter.post('/admin-login', authLimiter, async (req, res, next) => {
  try {
    const input = parseBody(loginSchema, req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') || !(await verifyPassword(input.password, user.passwordHash))) {
      return res.status(401).json({ code: 'INVALID_ADMIN_CREDENTIALS', message: 'Admin email or password is incorrect' });
    }
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    setSession(res, safeUser);
    await prisma.auditLog.create({ data: { userId: user.id, action: 'ADMIN_LOGIN', ipAddress: req.ip ?? req.socket.remoteAddress } });
    return res.json({ user: safeUser });
  } catch (error) { return next(error); }
});

const requestResetSchema = z.object({ email: z.string().email() });
const resetPasswordSchema = z.object({ token: z.string(), password: z.string().min(8) });

authRouter.post('/password-reset/request', otpLimiter, async (req, res, next) => {
  try {
    const { email } = parseBody(requestResetSchema, req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      await prisma.passwordResetToken.create({
        data: {
          email,
          tokenHash: otpHash(token),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000)
        }
      });
      const resetLink = `${process.env.WEB_ORIGIN ?? 'http://localhost:5173'}/reset-password?token=${token}`;
      await sendEmail(email, 'Password Reset Request', `Click to reset your password: ${resetLink}`, `<a href="${resetLink}">Reset Password</a>`);
      await prisma.auditLog.create({ data: { userId: user.id, action: 'PASSWORD_RESET_REQUEST', ipAddress: req.ip ?? req.socket.remoteAddress } });
    }
    return res.json({ message: 'If the email exists, a reset link has been sent.' });
  } catch (error) { return next(error); }
});

authRouter.post('/password-reset', authLimiter, async (req, res, next) => {
  try {
    const { token, password } = parseBody(resetPasswordSchema, req.body);
    const tokenHash = otpHash(token);
    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } }
    });
    if (!resetRecord) return res.status(400).json({ code: 'INVALID_TOKEN', message: 'Token is invalid or expired.' });
    
    await prisma.user.update({
      where: { email: resetRecord.email },
      data: { passwordHash: await hashPassword(password) }
    });
    await prisma.passwordResetToken.deleteMany({ where: { email: resetRecord.email } });
    
    const user = await prisma.user.findUnique({ where: { email: resetRecord.email } });
    if (user) await prisma.auditLog.create({ data: { userId: user.id, action: 'PASSWORD_RESET_SUCCESS', ipAddress: req.ip ?? req.socket.remoteAddress } });
    
    return res.json({ message: 'Password has been reset successfully.' });
  } catch (error) { return next(error); }
});

authRouter.post('/logout', (_req, res) => res.clearCookie('portfolio_token').status(204).send());
