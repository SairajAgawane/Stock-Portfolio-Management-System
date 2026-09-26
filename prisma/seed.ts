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

  await prisma.user.upsert({
    where: { email: 'csai2007@gmail.com' },
    update: { role: 'ADMIN', passwordHash: '$2a$12$nCxO4rWbB6JcVjZlNdnH2.EqzKz7UdrJuU15s5bGyMGqCWq2QrHmq' },
    create: {
      name: 'Portfolio Administrator', email: 'csai2007@gmail.com', phone: undefined,
      passwordHash: '$2a$12$nCxO4rWbB6JcVjZlNdnH2.EqzKz7UdrJuU15s5bGyMGqCWq2QrHmq', role: 'ADMIN',
    },
  });

  const infos = [
    { name: 'Apple Inc.', sector: 'Technology', symbol: 'AAPL', exchange: 'NASDAQ', currency: 'USD', currentPrice: '225.00' },
    { name: 'Reliance Industries Ltd.', sector: 'Energy', symbol: 'RELIANCE', exchange: 'NSE', currency: 'INR', currentPrice: '1400.00' },
    { name: 'Tata Consultancy Services Ltd.', sector: 'Information Technology', symbol: 'TCS', exchange: 'NSE', currency: 'INR', currentPrice: '4200.00' },
    { name: 'Microsoft Corporation', sector: 'Technology', symbol: 'MSFT', exchange: 'NASDAQ', currency: 'USD', currentPrice: '510.00' },
    { name: 'Alphabet Inc.', sector: 'Communication Services', symbol: 'GOOGL', exchange: 'NASDAQ', currency: 'USD', currentPrice: '248.00' },
    { name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', symbol: 'AMZN', exchange: 'NASDAQ', currency: 'USD', currentPrice: '225.00' },
    { name: 'NVIDIA Corporation', sector: 'Semiconductors', symbol: 'NVDA', exchange: 'NASDAQ', currency: 'USD', currentPrice: '178.00' },
    { name: 'Tesla Inc.', sector: 'Automotive', symbol: 'TSLA', exchange: 'NASDAQ', currency: 'USD', currentPrice: '395.00' },
    { name: 'HDFC Bank Ltd.', sector: 'Banking', symbol: 'HDFCBANK', exchange: 'NSE', currency: 'INR', currentPrice: '1960.00' },
    { name: 'ICICI Bank Ltd.', sector: 'Banking', symbol: 'ICICIBANK', exchange: 'NSE', currency: 'INR', currentPrice: '1425.00' },
    { name: 'Infosys Ltd.', sector: 'Information Technology', symbol: 'INFY', exchange: 'NSE', currency: 'INR', currentPrice: '1560.00' },
    { name: 'Bharti Airtel Ltd.', sector: 'Telecommunications', symbol: 'BHARTIARTL', exchange: 'NSE', currency: 'INR', currentPrice: '1880.00' },
    { name: 'State Bank of India', sector: 'Banking', symbol: 'SBIN', exchange: 'NSE', currency: 'INR', currentPrice: '820.00' },
    { name: 'Coca-Cola Company', sector: 'Consumer Staples', symbol: 'KO', exchange: 'NYSE', currency: 'USD', currentPrice: '71.00' },
    { name: 'Johnson & Johnson', sector: 'Healthcare', symbol: 'JNJ', exchange: 'NYSE', currency: 'USD', currentPrice: '178.00' },
    { name: 'Walmart Inc.', sector: 'Consumer Staples', symbol: 'WMT', exchange: 'NYSE', currency: 'USD', currentPrice: '103.00' },
    { name: 'Netflix Inc.', sector: 'Entertainment', symbol: 'NFLX', exchange: 'NASDAQ', currency: 'USD', currentPrice: '1180.00' },
    { name: 'Toyota Motor Corp.', sector: 'Automotive', symbol: 'TM', exchange: 'NYSE', currency: 'USD', currentPrice: '190.00' },
  ];

  const stocks = new Map<string, { id: number; currentPrice: string; currency: string }>();
  for (const info of infos) {
    const company = await prisma.company.upsert({
      where: { id: (await prisma.company.findFirst({ where: { name: info.name } }))?.id ?? -1 },
      update: { sector: info.sector },
      create: { name: info.name, sector: info.sector },
    });
    const stock = await prisma.stock.upsert({
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
    stocks.set(info.symbol, { id: stock.id, currentPrice: info.currentPrice, currency: info.currency });

    const base = Number(info.currentPrice);
    const history = Array.from({ length: 45 }, (_, offset) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (44 - offset));
      const wave = Math.sin((offset + info.symbol.length) / 3.2) * 0.018;
      const drift = (offset - 22) * 0.0008;
      const closingPrice = base * (1 + wave + drift);
      const previous = offset === 0 ? base * (1 + Math.sin((info.symbol.length) / 3.2) * 0.018 - 0.0176) : base * (1 + Math.sin((offset - 1 + info.symbol.length) / 3.2) * 0.018 + ((offset - 1) - 22) * 0.0008);
      return { stockId: stock.id, tradeDate: date, closingPrice: closingPrice.toFixed(4), dailyChange: ((closingPrice - previous) / previous * 100).toFixed(4) };
    });
    await prisma.stockPriceHistory.createMany({ data: history, skipDuplicates: true });
  }

  if (await prisma.buyTransaction.count({ where: { userId: user.id } }) === 0) {
    const aapl = stocks.get('AAPL')!;
    const reliance = stocks.get('RELIANCE')!;
    const tcs = stocks.get('TCS')!;
    await prisma.buyTransaction.createMany({ data: [
      { userId: user.id, stockId: aapl.id, quantity: '5', pricePerShare: '205', tradeDate: new Date('2026-09-12') },
      { userId: user.id, stockId: reliance.id, quantity: '10', pricePerShare: '1320', tradeDate: new Date('2026-09-14') },
      { userId: user.id, stockId: tcs.id, quantity: '3', pricePerShare: '4050', tradeDate: new Date('2026-09-16') },
    ] });
  }

  console.log(`Seeded demo user ${user.email}, ${infos.length} companies/stocks, and 45 days of market history.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
