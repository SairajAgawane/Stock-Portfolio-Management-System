import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET ?? '';
if (!jwtSecret) throw new Error('JWT_SECRET is required');

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(user: { id: number; email: string; name: string; role: 'USER' | 'ADMIN' }) {
  return jwt.sign(user, jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, jwtSecret) as unknown as { id: number; email: string; name: string; role: 'USER' | 'ADMIN' };
}
