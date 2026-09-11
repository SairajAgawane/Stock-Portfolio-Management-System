import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { companySchema, parseBody, stockSchema } from '../validation';

export const catalogRouter = Router();

catalogRouter.get('/companies', async (_req, res, next) => {
  try { return res.json({ companies: await prisma.company.findMany({ include: { stocks: true }, orderBy: { name: 'asc' } }) }); } catch (error) { return next(error); }
});

catalogRouter.post('/companies', async (req, res, next) => {
  try { return res.status(201).json({ company: await prisma.company.create({ data: parseBody(companySchema, req.body) }) }); } catch (error) { return next(error); }
});

catalogRouter.patch('/companies/:id', async (req, res, next) => {
  try { return res.json({ company: await prisma.company.update({ where: { id: Number(req.params.id) }, data: parseBody(companySchema.partial(), req.body) }) }); } catch (error) { return next(error); }
});

catalogRouter.delete('/companies/:id', async (req, res, next) => {
  try { await prisma.company.delete({ where: { id: Number(req.params.id) } }); return res.status(204).send(); } catch (error) { return next(error); }
});

catalogRouter.get('/stocks', async (req, res, next) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const stocks = await prisma.stock.findMany({ where: search ? { OR: [{ symbol: { contains: search } }, { company: { name: { contains: search } } }] } : undefined, include: { company: true }, orderBy: { symbol: 'asc' } });
    return res.json({ stocks });
  } catch (error) { return next(error); }
});

catalogRouter.post('/stocks', async (req, res, next) => {
  try { return res.status(201).json({ stock: await prisma.stock.create({ data: parseBody(stockSchema, req.body) }) }); } catch (error) { return next(error); }
});

catalogRouter.patch('/stocks/:id', async (req, res, next) => {
  try { return res.json({ stock: await prisma.stock.update({ where: { id: Number(req.params.id) }, data: parseBody(stockSchema.partial(), req.body) }) }); } catch (error) { return next(error); }
});

catalogRouter.delete('/stocks/:id', async (req, res, next) => {
  try { await prisma.stock.delete({ where: { id: Number(req.params.id) } }); return res.status(204).send(); } catch (error) { return next(error); }
});
