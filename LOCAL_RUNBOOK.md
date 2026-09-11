# Local Runbook

## First-time setup

Install Docker Desktop, Node.js 20+, and Git. Then run:

```powershell
corepack enable
pnpm install
Copy-Item .env.example .env
pnpm db:up
pnpm prisma:generate
pnpm prisma:deploy
pnpm prisma:seed
```

Run `database/views.sql` in MySQL Workbench after the migration. The Prisma migration already creates the core indexes.

## Start the application

Use two terminals:

```powershell
pnpm api:dev
pnpm --dir apps/web dev
```

Open `http://localhost:5173`.

## Verify connectivity

```powershell
Invoke-RestMethod http://localhost:4000/api/health
pnpm --dir apps/api test:smoke
```

The health response should report `status: ok` and `database: connected`.

## Useful commands

```powershell
pnpm prisma:studio
pnpm db:logs
pnpm db:down
pnpm api:build
pnpm --dir apps/web build
```

Never commit `.env`; use `.env.example` as the safe template.
