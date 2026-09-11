import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  phone: z.string().trim().max(30).optional(),
});

export const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });
export const companySchema = z.object({ name: z.string().trim().min(2).max(160), sector: z.string().trim().max(100).optional() });
export const stockSchema = z.object({
  companyId: z.number().int().positive(),
  symbol: z.string().trim().toUpperCase().min(1).max(20),
  exchange: z.string().trim().toUpperCase().min(1).max(30),
  currency: z.string().trim().toUpperCase().length(3).default('INR'),
  currentPrice: z.number().nonnegative().default(0),
});
export const tradeSchema = z.object({
  stockId: z.number().int().positive(),
  quantity: z.number().positive(),
  pricePerShare: z.number().nonnegative(),
  tradeDate: z.coerce.date().default(() => new Date()),
});

export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  return schema.parse(body);
}
