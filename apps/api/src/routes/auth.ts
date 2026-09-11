import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { hashPassword, signToken, verifyPassword } from '../lib/auth';
import { loginSchema, parseBody, registerSchema } from '../validation';

export const authRouter = Router();

function setSession(res: import('express').Response, user: { id: number; email: string; name: string }) {
  res.cookie('portfolio_token', signToken(user), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const input = parseBody(registerSchema, req.body);
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) return res.status(409).json({ code: 'EMAIL_EXISTS', message: 'Email is already registered' });
    const user = await prisma.user.create({ data: { ...input, passwordHash: await hashPassword(input.password) }, select: { id: true, name: true, email: true } });
    setSession(res, user);
    return res.status(201).json({ user });
  } catch (error) { return next(error); }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const input = parseBody(loginSchema, req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' });
    const safeUser = { id: user.id, name: user.name, email: user.email };
    setSession(res, safeUser);
    return res.json({ user: safeUser });
  } catch (error) { return next(error); }
});

authRouter.post('/logout', (_req, res) => res.clearCookie('portfolio_token').status(204).send());
