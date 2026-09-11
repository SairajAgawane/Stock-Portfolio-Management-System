# API Reference

Base URL: `http://localhost:4000/api`

Authentication uses an HTTP-only `portfolio_token` cookie.

| Method | Endpoint | Auth | Purpose |
|---|---|---:|---|
| GET | `/health` | No | Check API and database connectivity |
| POST | `/auth/register` | No | Create a user account |
| POST | `/auth/login` | No | Start a session |
| POST | `/auth/logout` | No | Clear the session |
| GET | `/catalog/companies` | Yes | List companies and stocks |
| POST/PATCH/DELETE | `/catalog/companies` | Yes | Manage companies |
| GET | `/catalog/stocks` | Yes | Search/list stocks |
| POST/PATCH/DELETE | `/catalog/stocks` | Yes | Manage stocks |
| GET | `/portfolio` | Yes | Current holdings |
| GET | `/portfolio/transactions` | Yes | Combined buy/sell history |
| POST | `/portfolio/buy` | Yes | Record a purchase |
| POST | `/portfolio/sell` | Yes | Record a sale with holdings validation |
| GET | `/portfolio/reports/summary` | Yes | Investment and P/L summary |

Example buy body:

```json
{
  "stockId": 1,
  "quantity": 5,
  "pricePerShare": 225,
  "tradeDate": "2026-09-11T00:00:00.000Z"
}
```
