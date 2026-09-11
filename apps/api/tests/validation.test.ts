import assert from 'node:assert/strict';
import test from 'node:test';
import { loginSchema, registerSchema, tradeSchema } from '../src/validation';

test('registration normalizes email and accepts a valid account', () => {
  const result = registerSchema.parse({ name: 'Demo Investor', email: '  DEMO@EXAMPLE.COM ', password: 'Demo@12345' });
  assert.equal(result.email, 'demo@example.com');
});

test('registration rejects short passwords', () => {
  assert.throws(() => registerSchema.parse({ name: 'Demo', email: 'demo@example.com', password: 'short' }));
});

test('login requires a valid email', () => {
  assert.throws(() => loginSchema.parse({ email: 'not-an-email', password: 'Demo@12345' }));
});

test('trade input applies a date default and rejects negative values', () => {
  const result = tradeSchema.parse({ stockId: 1, quantity: 2, pricePerShare: 100 });
  assert.ok(result.tradeDate instanceof Date);
  assert.throws(() => tradeSchema.parse({ stockId: 1, quantity: -1, pricePerShare: 100 }));
});
