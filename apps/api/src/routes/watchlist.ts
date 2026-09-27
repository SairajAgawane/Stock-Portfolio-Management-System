import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { parseBody } from '../validation';

export const watchlistRouter = Router();

const watchlistSchema = z.object({ stockId: z.number().int().positive() });

watchlistRouter.get('/', async (req, res, next) => {
  try {
    const watchlists = await prisma.watchlist.findMany({
      where: { userId: req.authUser!.id },
      include: { stock: { include: { company: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ watchlists });
  } catch (error) { return next(error); }
});

watchlistRouter.post('/', async (req, res, next) => {
  try {
    const { stockId } = parseBody(watchlistSchema, req.body);
    const existing = await prisma.watchlist.findUnique({ where: { userId_stockId: { userId: req.authUser!.id, stockId } } });
    if (existing) return res.status(409).json({ message: 'Stock already in watchlist' });
    
    const watchlist = await prisma.watchlist.create({
      data: { userId: req.authUser!.id, stockId }
    });
    return res.status(201).json({ watchlist });
  } catch (error) { return next(error); }
});

watchlistRouter.delete('/:stockId', async (req, res, next) => {
  try {
    const stockId = parseInt(req.params.stockId, 10);
    if (isNaN(stockId)) return res.status(400).json({ message: 'Invalid stock ID' });
    
    await prisma.watchlist.deleteMany({
      where: { userId: req.authUser!.id, stockId }
    });
    return res.status(204).send();
  } catch (error) { return next(error); }
});
