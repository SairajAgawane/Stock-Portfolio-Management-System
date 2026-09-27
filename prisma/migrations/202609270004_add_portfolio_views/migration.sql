CREATE OR REPLACE VIEW `v_current_portfolio` AS
SELECT
  buys.user_id,
  buys.stock_id,
  stocks.symbol,
  stocks.exchange,
  stocks.currency,
  companies.name AS company_name,
  stocks.current_price,
  buys.total_quantity - COALESCE(sells.total_quantity, 0) AS quantity_held,
  buys.total_cost - COALESCE(sells.total_quantity, 0) * (buys.total_cost / NULLIF(buys.total_quantity, 0)) AS remaining_cost,
  stocks.current_price * (buys.total_quantity - COALESCE(sells.total_quantity, 0)) AS market_value
FROM (
  SELECT user_id, stock_id, SUM(quantity) AS total_quantity, SUM(quantity * price_per_share) AS total_cost
  FROM buy_transactions
  GROUP BY user_id, stock_id
) AS buys
JOIN stocks ON stocks.id = buys.stock_id
JOIN companies ON companies.id = stocks.company_id
LEFT JOIN (
  SELECT user_id, stock_id, SUM(quantity) AS total_quantity
  FROM sell_transactions
  GROUP BY user_id, stock_id
) AS sells ON sells.user_id = buys.user_id AND sells.stock_id = buys.stock_id
WHERE buys.total_quantity - COALESCE(sells.total_quantity, 0) > 0;

CREATE OR REPLACE VIEW `v_transaction_history` AS
SELECT user_id, stock_id, quantity, price_per_share, trade_date, created_at, 'BUY' AS transaction_type
FROM buy_transactions
UNION ALL
SELECT user_id, stock_id, quantity, price_per_share, trade_date, created_at, 'SELL' AS transaction_type
FROM sell_transactions;
