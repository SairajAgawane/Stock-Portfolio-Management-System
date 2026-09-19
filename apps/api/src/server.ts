import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { prisma } from './lib/prisma';
import { requireAdmin, requireAuth } from './middleware/auth';
import { authRouter } from './routes/auth';
import { catalogRouter } from './routes/catalog';
import { portfolioRouter } from './routes/portfolio';
import { adminRouter } from './routes/admin';
import { ZodError } from 'zod';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const port = Number(process.env.API_PORT ?? 4000);

app.use(cors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173', credentials: true }));
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/api/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: 'ok', database: 'connected' });
});
app.use('/api/auth', authRouter);
app.use('/api/catalog', requireAuth, catalogRouter);
app.use('/api/portfolio', requireAuth, portfolioRouter);
app.use('/api/admin', requireAuth, requireAdmin, adminRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Request validation failed', details: error.flatten() });
  if (error instanceof Error && error.name === 'INSUFFICIENT_HOLDINGS') return res.status(409).json({ code: error.name, message: error.message });
  console.error(error);
  return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Unexpected server error' });
});

const server = app.listen(port, () => console.log(`API listening on http://localhost:${port}`));

async function shutdown() {
  server.close();
  await prisma.$disconnect();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
