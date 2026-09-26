-- Run these statements in MySQL Workbench, Railway Data, or the mysql CLI.
SHOW TABLES;

SELECT * FROM users ORDER BY id;
SELECT * FROM companies ORDER BY id;
SELECT * FROM stocks ORDER BY id;
SELECT * FROM buy_transactions ORDER BY id;
SELECT * FROM sell_transactions ORDER BY id;
SELECT * FROM portfolio ORDER BY id;
SELECT * FROM registration_otps ORDER BY id;

SHOW FULL TABLES WHERE Table_type = 'VIEW';
SELECT * FROM v_current_portfolio;
SELECT * FROM v_transaction_history ORDER BY trade_date DESC;
