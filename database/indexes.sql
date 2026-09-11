-- Prisma creates the primary, unique, and relation indexes from schema.prisma.
-- These composite indexes support the report and history query patterns.
CREATE INDEX idx_buy_user_stock_date ON buy_transactions (user_id, stock_id, trade_date);
CREATE INDEX idx_sell_user_stock_date ON sell_transactions (user_id, stock_id, trade_date);
