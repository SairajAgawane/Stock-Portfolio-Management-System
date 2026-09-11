import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      name: 'Demo Investor',
      email: 'demo@example.com',
      // Demo-only account. Change this password before any shared deployment.
      passwordHash: '$2a$12$6v0Wmuc27.qQmECu5LWIWe29hS2bVpDXJSAhiRrzX30gVajoaH3jK',
      phone: '+91-9000000000',
    },
  });

  const infos = [
    { name: 'Apple Inc.', sector: 'Technology', symbol: 'AAPL', exchange: 'NASDAQ', currency: 'USD', currentPrice: '225.00' },
    { name: 'Reliance Industries Ltd.', sector: 'Energy', symbol: 'RELIANCE', exchange: 'NSE', currency: 'INR', currentPrice: '1400.00' },
    { name: 'Tata Consultancy Services Ltd.', sector: 'Information Technology', symbol: 'TCS', exchange: 'NSE', currency: 'INR', currentPrice: '4200.00' },
  ];

  for (const info of infos) {
    const company = await prisma.company.upsert({
      where: { id: (await prisma.company.findFirst({ where: { name: info.name } }))?.id ?? -1 },
      update: { sector: info.sector },
      create: { name: info.name, sector: info.sector },
    });
    await prisma.stock.upsert({
      where: { symbol_exchange: { symbol: info.symbol, exchange: info.exchange } },
      update: { currentPrice: info.currentPrice, currency: info.currency, companyId: company.id },
      create: {
        companyId: company.id,
        symbol: info.symbol,
        exchange: info.exchange,
        currency: info.currency,
        currentPrice: info.currentPrice,
      },
    });
  }

  console.log(`Seeded demo user ${user.email} and ${infos.length} companies/stocks.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
