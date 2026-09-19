import { Router } from 'express';
import { prisma } from '../lib/prisma';

export const adminRouter = Router();

adminRouter.get('/overview', async (_req, res, next) => {
  try {
    const [users, companies, stocks, buys, sells, portfolios] = await Promise.all([
      prisma.user.findMany({ select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true }, orderBy: { createdAt: 'desc' } }),
      prisma.company.count(), prisma.stock.count(), prisma.buyTransaction.count(), prisma.sellTransaction.count(),
      prisma.portfolio.findMany({ where: { quantityHeld: { gt: 0 } }, include: { user: { select: { name: true, email: true } }, stock: { include: { company: true } } }, orderBy: { updatedAt: 'desc' } }),
    ]);
    return res.json({ counts: { users: users.length, companies, stocks, buys, sells, activePortfolios: portfolios.length }, users, portfolios });
  } catch (error) { return next(error); }
});

adminRouter.get('/transactions', async (_req, res, next) => {
  try {
    const [buys, sells] = await Promise.all([
      prisma.buyTransaction.findMany({ include: { user: { select: { name: true, email: true } }, stock: true }, orderBy: { tradeDate: 'desc' } }),
      prisma.sellTransaction.findMany({ include: { user: { select: { name: true, email: true } }, stock: true }, orderBy: { tradeDate: 'desc' } }),
    ]);
    return res.json({ buys, sells });
  } catch (error) { return next(error); }
});
