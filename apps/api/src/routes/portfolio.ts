import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { parseBody, tradeSchema } from '../validation';

export const portfolioRouter = Router();

portfolioRouter.get('/', async (req, res, next) => {
  try {
    const rows = await prisma.$queryRaw(Prisma.sql`SELECT * FROM v_current_portfolio WHERE user_id = ${req.authUser!.id} ORDER BY market_value DESC`);
    return res.json({ portfolio: rows });
  } catch (error) { return next(error); }
});

portfolioRouter.get('/transactions', async (req, res, next) => {
  try {
    const rows = await prisma.$queryRaw(Prisma.sql`SELECT h.*, s.symbol, c.name AS company_name FROM v_transaction_history h JOIN stocks s ON s.id = h.stock_id JOIN companies c ON c.id = s.company_id WHERE h.user_id = ${req.authUser!.id} ORDER BY h.trade_date DESC, h.created_at DESC`);
    return res.json({ transactions: rows });
  } catch (error) { return next(error); }
});

portfolioRouter.post('/buy', async (req, res, next) => {
  try {
    const input = parseBody(tradeSchema, req.body);
    const transaction = await prisma.buyTransaction.create({ data: { ...input, tradeDate: input.tradeDate ?? new Date(), userId: req.authUser!.id } });
    return res.status(201).json({ transaction });
  } catch (error) { return next(error); }
});

portfolioRouter.post('/sell', async (req, res, next) => {
  try {
    const input = parseBody(tradeSchema, req.body);
    const transaction = await prisma.$transaction(async (tx) => {
      const [buys, sells] = await Promise.all([
        tx.buyTransaction.aggregate({ where: { userId: req.authUser!.id, stockId: input.stockId }, _sum: { quantity: true } }),
        tx.sellTransaction.aggregate({ where: { userId: req.authUser!.id, stockId: input.stockId }, _sum: { quantity: true } }),
      ]);
      const available = Number(buys._sum.quantity ?? 0) - Number(sells._sum.quantity ?? 0);
      if (input.quantity > available) {
        const error = new Error(`Insufficient holdings. Available quantity: ${available}`);
        error.name = 'INSUFFICIENT_HOLDINGS';
        throw error;
      }
      return tx.sellTransaction.create({ data: { ...input, tradeDate: input.tradeDate ?? new Date(), userId: req.authUser!.id } });
    });
    return res.status(201).json({ transaction });
  } catch (error) { return next(error); }
});

portfolioRouter.get('/reports/summary', async (req, res, next) => {
  try {
    const [summary] = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        COALESCE(SUM(quantity_held * (remaining_cost / NULLIF(quantity_held, 0))), 0) AS invested_amount,
        COALESCE(SUM(market_value), 0) AS market_value,
        COALESCE(SUM(market_value - remaining_cost), 0) AS unrealized_pnl
      FROM v_current_portfolio WHERE user_id = ${req.authUser!.id}
    `);
    const [realized] = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT COALESCE(SUM(s.quantity * s.price_per_share), 0) - COALESCE(SUM(s.quantity * (
        SELECT COALESCE(SUM(b.quantity * b.price_per_share) / NULLIF(SUM(b.quantity), 0), 0)
        FROM buy_transactions b WHERE b.user_id = s.user_id AND b.stock_id = s.stock_id
      )), 0) AS realized_pnl
      FROM sell_transactions s WHERE s.user_id = ${req.authUser!.id}
    `);
    return res.json({ summary: { ...summary, realizedPnl: realized?.realized_pnl ?? 0 } });
  } catch (error) { return next(error); }
});
