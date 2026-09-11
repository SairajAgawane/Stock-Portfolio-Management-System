import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../lib/auth';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.portfolio_token;
  if (!token) return res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Login required' });

  try {
    req.authUser = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ code: 'INVALID_SESSION', message: 'Session is invalid or expired' });
  }
}
