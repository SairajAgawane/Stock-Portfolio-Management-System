# Stock Portfolio Management System - Build and Local Run Plan

## 1. Requirement interpretation

### Requirements stated in `PROJECT.pdf`

The document asks for a DBMS application that supports:

- User registration and profile management.
- Company/stock master data.
- Buy and sell transaction recording.
- Current portfolio/holdings tracking.
- Transaction history.
- Profit/loss calculation.
- Search, update, delete, CRUD, and report generation.
- SQL relationships using primary keys, foreign keys, constraints, joins, aggregates, views, and indexes.
- The listed software baseline is MySQL Server, MySQL Workbench, Windows 10/11, and optionally VS Code.

The document lists these tables: `Users`, `Companies`, `Stocks`, `Buy_Transactions`, `Sell_Transactions`, and `Portfolio`.

### Decisions added by this plan

The PDF does not specify a programming language, UI framework, authentication method, price source, or cost-basis rule. This plan assumes:

- Frontend: React + Vite + TypeScript.
- Backend: Node.js + Express + TypeScript.
- Database: MySQL 8.4 LTS for the first implementation.
- Database access: Prisma ORM with migrations, plus SQL views for DBMS demonstration.
- Authentication: bcrypt password hashing and JWT stored in an HTTP-only cookie.
- Phase-1 valuation: manually maintained latest price per stock; live market-data integration is optional.
- Phase-1 profit calculation: weighted-average cost basis. FIFO can be added later if transaction-level tax accounting is required.

## 2. Recommended architecture

Use a three-layer local application:

```text
React UI  ->  Express REST API  ->  Prisma  ->  MySQL
                         |
                         +-> validation, auth, business rules, reports
```

Keep all portfolio calculations on the server. The browser should display values returned by the API, not independently calculate holdings. This prevents inconsistent totals and makes the database the source of truth.

Suggested repository layout:

```text
stock-portfolio-management/
  apps/web/                 # React/Vite frontend
  apps/api/                 # Express/TypeScript backend
  prisma/schema.prisma      # schema and migrations
  prisma/seed.ts            # demo users, companies, stocks, transactions
  database/views.sql        # reporting views required by the project
  database/indexes.sql
  docs/                     # ER diagram, API notes, screenshots
  .env.example
  docker-compose.yml
  package.json
```

## 3. Database design

### Core entities

| Entity | Purpose | Important fields |
|---|---|---|
| `users` | Account and profile | `id`, `name`, `email`, `password_hash`, `phone`, timestamps |
| `companies` | Issuer/master data | `id`, `name`, `sector`, timestamps |
| `stocks` | Tradable instrument | `id`, `company_id`, `symbol`, `exchange`, `currency`, `current_price` |
| `buy_transactions` | Purchases | `id`, `user_id`, `stock_id`, `quantity`, `price_per_share`, `trade_date`, timestamps |
| `sell_transactions` | Sales | `id`, `user_id`, `stock_id`, `quantity`, `price_per_share`, `trade_date`, timestamps |
| `portfolio` | Optional cached holding summary | `id`, `user_id`, `stock_id`, `quantity_held`, `average_cost`, `updated_at` |

Use `DECIMAL(19,4)` for prices and money, never floating-point types. Use `DECIMAL(19,6)` for share quantities if fractional shares are allowed; otherwise use a positive integer quantity.

### Constraints and indexes

- `users.email` unique and normalized to lowercase.
- `stocks.symbol` unique together with `exchange`.
- All transaction foreign keys use `ON DELETE RESTRICT` so investment history cannot be accidentally orphaned.
- `quantity > 0` and `price_per_share >= 0` checks.
- Index `(user_id, trade_date)` on both transaction tables.
- Index `(user_id, stock_id)` on both transaction tables.
- Unique `(user_id, stock_id)` in the cached `portfolio` table.
- Index `companies.name`, `stocks.symbol`, and `stocks.company_id` for searches and joins.

### Important design choice: derived portfolio data

Treat transactions as the authoritative ledger. The current holding can be calculated as:

```text
quantity_held = total_bought_quantity - total_sold_quantity
average_cost = remaining_cost / quantity_held
market_value = quantity_held * current_price
unrealized_pnl = market_value - remaining_cost
```

For a student project, create a SQL view named `v_current_portfolio` and use it for reports. If performance later matters, maintain the `portfolio` table inside the same database transaction as each buy or sell and periodically reconcile it against the view.

### Sell validation rule

When a user sells stock, the API must start a database transaction, calculate current available shares, reject the request if the sale exceeds holdings, insert the sale, and commit. This prevents negative holdings and race-condition errors.

### Profit/loss terminology

- Realized P/L: proceeds from sold shares minus the cost basis of those sold shares.
- Unrealized P/L: current market value of remaining shares minus their remaining cost basis.
- Total P/L: realized plus unrealized P/L.

Show these separately in the UI and reports so the result is understandable.

## 4. Application modules and implementation order

### Phase 0 - Clarify and freeze scope

1. Confirm whether the application is for one user locally or multiple registered users.
2. Confirm whether fractional shares and multiple exchanges/currencies are needed.
3. Confirm that live prices are optional for the first version.
4. Choose weighted-average cost for the academic baseline.
5. Create the ER diagram and API contract before coding.

### Phase 1 - Project and database foundation

1. Create the monorepo and TypeScript configuration.
2. Add Docker Compose for MySQL and Adminer or use MySQL Workbench.
3. Configure Prisma and the `.env` database URL.
4. Create migrations for the six PDF tables.
5. Add constraints, indexes, reporting views, and seed data.
6. Verify the schema in MySQL Workbench and document the ER diagram.

### Phase 2 - Backend and database connectivity

Build the API in this order:

1. Health check: `GET /api/health`.
2. Authentication: register, login, logout, current-user endpoint.
3. Company and stock CRUD.
4. Buy transaction creation/list/update/delete.
5. Sell transaction creation/list/update/delete with holdings validation.
6. Portfolio endpoint backed by `v_current_portfolio`.
7. Transaction history endpoint combining buys and sells.
8. Reports endpoint for totals, company-wise investment, realized P/L, and unrealized P/L.

Every request should have schema validation with Zod or an equivalent validator. Return consistent error responses such as `{ code, message, details }`.

### Phase 3 - Frontend

Create these screens:

1. Login and registration.
2. Dashboard: portfolio value, invested amount, realized P/L, unrealized P/L.
3. Holdings table: symbol, company, quantity, average cost, current price, market value, P/L.
4. Buy form with stock search and validation.
5. Sell form showing available quantity before submission.
6. Transaction history with date, type, quantity, price, value, and search/filter.
7. Company/stock management screen.
8. Reports screen with export to CSV or printable report.

### Phase 4 - Security and correctness

- Hash passwords with bcrypt/argon2; never store plaintext passwords.
- Use parameterized queries/Prisma only; never concatenate SQL from user input.
- Protect every user-owned query with the authenticated `user_id`.
- Add CORS, secure cookies, request size limits, and rate limiting to auth routes.
- Do not allow users to edit another user's transactions.
- Use database transactions for buy/sell plus portfolio-cache updates.
- Use UTC timestamps in the database and format dates in the UI.

### Phase 5 - Testing and submission evidence

Test at least:

- Registration, duplicate email, login failure, logout.
- Company and stock CRUD.
- Buy creates a holding.
- Multiple buys calculate weighted average correctly.
- Selling all shares removes the holding from the current portfolio.
- Selling more than available shares is rejected and writes no partial data.
- Reports agree with raw transaction totals.
- User A cannot read or alter User B's data.
- Delete behavior respects foreign keys.

Include screenshots or SQL output demonstrating primary keys, foreign keys, joins, aggregate functions, views, indexes, and CRUD operations.

## 5. Local setup with MySQL

### Option A - Recommended repeatable setup: Docker

Install Docker Desktop, then create `docker-compose.yml` with a MySQL 8.4 service, persistent volume, database name, and non-root application user. Start it with:

```powershell
docker compose up -d db
docker compose ps
```

Use a connection string like:

```text
mysql://portfolio_app:portfolio_password@localhost:3306/stock_portfolio
```

### Option B - MySQL Installer and Workbench

Install MySQL Server 8.4 LTS and MySQL Workbench. Create the database and application user in Workbench, then use the same connection string format in `.env`.

### Application setup

Install Node.js 20+ and Git. From the repository root:

```powershell
corepack enable
pnpm install
Copy-Item .env.example .env
pnpm prisma migrate dev --name init
pnpm prisma db seed
pnpm dev
```

Recommended `.env` values:

```text
DATABASE_URL="mysql://portfolio_app:portfolio_password@localhost:3306/stock_portfolio"
JWT_SECRET="replace-with-a-long-local-development-secret"
API_PORT=4000
WEB_PORT=5173
```

Run frontend and backend concurrently through the root `pnpm dev` script, or run them separately with `pnpm --dir apps/api dev` and `pnpm --dir apps/web dev`.

Open `http://localhost:5173`. The frontend should call the API at `http://localhost:4000/api` through a Vite proxy so browser CORS issues are avoided during development.

### Database verification checklist

1. Open MySQL Workbench and confirm the schema exists.
2. Run `SHOW TABLES;`.
3. Inspect foreign keys and indexes.
4. Run the portfolio view for a seeded user.
5. Create a buy in the UI and confirm a row in `buy_transactions`.
6. Create a valid sell and confirm the holding decreases.
7. Attempt an oversized sell and confirm the API rejects it without a new row.
8. Run the report queries and compare them with the dashboard.

## 6. Database options

### MySQL 8.4 LTS - best fit for this brief

Choose this for the first implementation because the source document explicitly requires MySQL Server and Workbench. It is easy to demonstrate to an instructor, supports foreign keys, checks, views, indexes, transactions, and has strong Node.js ORM support. It also minimizes the risk that the submitted project differs from the stated software requirements.

### PostgreSQL - best technical alternative

Choose PostgreSQL if this is intended to grow beyond a classroom DBMS project. It has excellent SQL behavior, strong constraints, rich reporting features, and a very good developer ecosystem. It is my preferred production-grade relational database, but it would diverge from the PDF's MySQL requirement and would require PostgreSQL-specific setup instructions.

### SQLite - useful only for a lightweight prototype

SQLite is convenient for a single-user demo and has almost no setup, but it is not the best choice here because the brief explicitly asks for a server database and MySQL Workbench. Concurrency, user management, and production-like connectivity are also less representative.

### Cloud databases

PlanetScale, Aiven, Railway, Render, Supabase, and managed MySQL/PostgreSQL are useful after the local version works. Do not start with a cloud database for this project: local reproducibility, grading, and debugging are easier with Dockerized MySQL.

## 7. Final recommendation

Use MySQL 8.4 LTS locally, Docker Compose for repeatable startup, Express + TypeScript for the API, React + TypeScript for the UI, and Prisma for migrations and type-safe access. Keep the six PDF tables, add views and indexes explicitly, and make the transaction ledger authoritative. Build live market prices, FIFO accounting, charts, and cloud deployment only after the required CRUD, portfolio, P/L, and reports are correct.

## 8. Definition of done

The project is complete when a fresh machine can clone the repository, run one database startup command and the documented install/migration/seed commands, open the web app, register a user, create stocks, record buys and sells, view a correct portfolio, inspect transaction history, and generate the required reports without manually editing database rows.
