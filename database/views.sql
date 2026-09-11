CREATE OR REPLACE VIEW v_current_portfolio AS
SELECT
    u.id AS user_id,
    u.name AS user_name,
    s.id AS stock_id,
    s.symbol,
    s.exchange,
    c.name AS company_name,
    s.currency,
    s.current_price,
    COALESCE(b.total_bought_quantity, 0) - COALESCE(se.total_sold_quantity, 0) AS quantity_held,
    COALESCE(b.total_bought_value, 0) - (
        COALESCE(se.total_sold_quantity, 0) *
        (COALESCE(b.total_bought_value, 0) / NULLIF(b.total_bought_quantity, 0))
    ) AS remaining_cost,
    (COALESCE(b.total_bought_quantity, 0) - COALESCE(se.total_sold_quantity, 0)) * s.current_price AS market_value
FROM users u
CROSS JOIN stocks s
JOIN companies c ON c.id = s.company_id
LEFT JOIN (
    SELECT user_id, stock_id,
           SUM(quantity) AS total_bought_quantity,
           SUM(quantity * price_per_share) AS total_bought_value
    FROM buy_transactions
    GROUP BY user_id, stock_id
) b ON b.user_id = u.id AND b.stock_id = s.id
LEFT JOIN (
    SELECT user_id, stock_id,
           SUM(quantity) AS total_sold_quantity,
           SUM(quantity * price_per_share) AS total_sold_proceeds
    FROM sell_transactions
    GROUP BY user_id, stock_id
) se ON se.user_id = u.id AND se.stock_id = s.id
WHERE COALESCE(b.total_bought_quantity, 0) - COALESCE(se.total_sold_quantity, 0) > 0;

CREATE OR REPLACE VIEW v_transaction_history AS
SELECT user_id, stock_id, 'BUY' AS transaction_type, quantity, price_per_share, trade_date, created_at
FROM buy_transactions
UNION ALL
SELECT user_id, stock_id, 'SELL' AS transaction_type, quantity, price_per_share, trade_date, created_at
FROM sell_transactions;
