import crypto from 'node:crypto';
import { Router } from 'express';
import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma';
import { hashPassword, signToken, verifyPassword } from '../lib/auth';
import { loginSchema, parseBody, registerSchema, verifyOtpSchema } from '../validation';

export const authRouter = Router();

function setSession(res: import('express').Response, user: { id: number; email: string; name: string; role: 'USER' | 'ADMIN' }) {
  res.cookie('portfolio_token', signToken(user), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });
}

function otpHash(otp: string) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

async function sendOtpEmail(email: string, otp: string) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASS;
  if (!host || !user || !password) {
    if (process.env.OTP_DEV_MODE === 'true') return;
    const error = new Error('OTP email delivery is not configured. Add SMTP_HOST, SMTP_USER, and SMTP_PASS.');
    error.name = 'OTP_EMAIL_NOT_CONFIGURED';
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
    subject: 'Your Stock Portfolio verification code',
    text: `Your verification code is ${otp}. It expires in ${process.env.OTP_EXPIRY_MINUTES ?? '10'} minutes. If you did not request this, ignore this email.`,
    html: `<p>Your Stock Portfolio verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:8px">${otp}</p><p>This code expires in ${process.env.OTP_EXPIRY_MINUTES ?? '10'} minutes.</p>`,
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
    await sendOtpEmail(input.email, otp);
    const response: { message: string; devOtp?: string } = { message: `Verification code sent to ${input.email}` };
    if (process.env.OTP_DEV_MODE === 'true' && process.env.NODE_ENV !== 'production') response.devOtp = otp;
    return res.status(202).json(response);
  } catch (error) { return next(error); }
}

authRouter.post('/register/request-otp', requestRegistrationOtp);
// Keep the original endpoint useful for older clients: it now starts verification instead of creating an account.
authRouter.post('/register', requestRegistrationOtp);

authRouter.post('/register/verify-otp', async (req, res, next) => {
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
      return created;
    });
    setSession(res, { ...user, role: 'USER' });
    return res.status(201).json({ user });
  } catch (error) { return next(error); }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const input = parseBody(loginSchema, req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' });
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    setSession(res, safeUser);
    return res.json({ user: safeUser });
  } catch (error) { return next(error); }
});

authRouter.post('/admin-login', async (req, res, next) => {
  try {
    const input = parseBody(loginSchema, req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || user.role !== 'ADMIN' || !(await verifyPassword(input.password, user.passwordHash))) {
      return res.status(401).json({ code: 'INVALID_ADMIN_CREDENTIALS', message: 'Admin email or password is incorrect' });
    }
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    setSession(res, safeUser);
    return res.json({ user: safeUser });
  } catch (error) { return next(error); }
});

authRouter.post('/logout', (_req, res) => res.clearCookie('portfolio_token').status(204).send());
