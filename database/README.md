# Database demonstration guide

This project stores its data in MySQL. Prisma manages the schema and migrations; the API reads and writes the same database.

## Local database

From the repository root in PowerShell:

```powershell
docker compose up -d db
pnpm prisma:deploy
pnpm prisma:seed
pnpm prisma studio
```

Open the Prisma Studio URL shown in the terminal (normally `http://localhost:5555`). The left side lists every table, including `users`, `companies`, `stocks`, `stock_price_history`, `buy_transactions`, `sell_transactions`, `portfolio`, and `registration_otps`.

If Prisma Studio displays an error, first run `pnpm prisma:generate`, stop any old Studio process with `Ctrl+C`, and run `pnpm prisma studio` again. The SQL commands below are an alternative that does not depend on Studio.

## Show every table and its rows

```powershell
docker exec stock-portfolio-mysql mysql -uportfolio_app -pportfolio_password stock_portfolio -e "SHOW TABLES;"
docker exec stock-portfolio-mysql mysql -uportfolio_app -pportfolio_password stock_portfolio -e "SELECT * FROM users; SELECT * FROM companies; SELECT * FROM stocks; SELECT * FROM buy_transactions; SELECT * FROM sell_transactions; SELECT * FROM portfolio; SELECT * FROM registration_otps;"
```

For a clear professor demonstration, show `SHOW TABLES`, then open each table with `SELECT * FROM table_name;`. The seed command creates the demo admin, demo user, and three stocks.

## Railway production database

In Railway, open the MySQL service, then use its **Data** tab or connect with the MySQL connection variables. The production API health endpoint confirms the API is connected:

`https://stock-portfolio-api-production-36e3.up.railway.app/api/health`

Never put the production database password or `DATABASE_URL` in the frontend, screenshots, GitHub, or a public API response. Use the Railway MySQL Data tab for the live demonstration.

## OTP email configuration

Account creation now works in two steps. The API stores only a hashed OTP in `registration_otps`; it creates a row in `users` only after the correct OTP is entered. Configure these variables on the Railway API service:

```text
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-sender@gmail.com
SMTP_PASS=your-16-character-Gmail-app-password
SMTP_FROM=your-sender@gmail.com
OTP_EXPIRY_MINUTES=10
```

For Gmail, use a Google **App Password**, not your normal Gmail password. After adding the variables, redeploy the API and test with a new email address. A wrong code returns `Invalid OTP` and does not insert the account into `users`.
