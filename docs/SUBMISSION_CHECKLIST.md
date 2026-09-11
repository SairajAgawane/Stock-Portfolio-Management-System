# Submission Checklist

- [x] Relational schema with primary keys and foreign keys.
- [x] Constraints, indexes, CRUD endpoints, and SQL reporting views.
- [x] User authentication with hashed passwords.
- [x] Buy and sell transaction modules.
- [x] Sell-overdraft validation inside a database transaction.
- [x] Portfolio, history, and P/L reporting.
- [x] React dashboard and responsive layout.
- [x] Prisma migration and reproducible local runbook.
- [x] API validation tests and smoke-test command.
- [ ] Run the full application against MySQL after Docker Desktop is installed.
- [ ] Capture screenshots of Workbench schema, dashboard, buy, sell, and reports.

## Suggested demonstration sequence

1. Register a new user.
2. Open the stock catalog.
3. Buy five shares of a seeded stock.
4. Confirm the holding and portfolio value.
5. Sell two shares.
6. Confirm transaction history and updated quantity.
7. Attempt to sell more than the remaining quantity and show the validation error.
8. Run the SQL views in MySQL Workbench and show the results.
