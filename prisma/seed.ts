import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: { passwordHash: '$2a$12$X3DGbDLEps4tEW5E/DuLUeXk0LNpiVhxJiZJ8TIPuMoNNexTEhfRK' },
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
    update: { role: 'ADMIN', passwordHash: '$2a$12$uHkfIcQ6gl1lAXjmW0B6PutWJrteMNwfUPVU.VHh13d1UOwf3T9Q6' },
    create: {
      name: 'Portfolio Administrator', email: 'csai2007@gmail.com', phone: undefined,
      passwordHash: '$2a$12$uHkfIcQ6gl1lAXjmW0B6PutWJrteMNwfUPVU.VHh13d1UOwf3T9Q6', role: 'ADMIN',
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
    { name: 'Mahindra & Mahindra Ltd.', sector: 'Automotive', symbol: 'M&M', exchange: 'NSE', currency: 'INR', currentPrice: '3100.00' },
    { name: 'Larsen & Toubro Ltd.', sector: 'Industrials', symbol: 'LT', exchange: 'NSE', currency: 'INR', currentPrice: '3600.00' },
    { name: 'Asian Paints Ltd.', sector: 'Consumer Discretionary', symbol: 'ASIANPAINT', exchange: 'NSE', currency: 'INR', currentPrice: '2450.00' },
    { name: 'Maruti Suzuki India Ltd.', sector: 'Automotive', symbol: 'MARUTI', exchange: 'NSE', currency: 'INR', currentPrice: '12800.00' },
    { name: 'Bajaj Finance Ltd.', sector: 'Financial Services', symbol: 'BAJFINANCE', exchange: 'NSE', currency: 'INR', currentPrice: '9200.00' },
    { name: 'Kotak Mahindra Bank Ltd.', sector: 'Banking', symbol: 'KOTAKBANK', exchange: 'NSE', currency: 'INR', currentPrice: '2050.00' },
    { name: 'Axis Bank Ltd.', sector: 'Banking', symbol: 'AXISBANK', exchange: 'NSE', currency: 'INR', currentPrice: '1180.00' },
    { name: 'ITC Ltd.', sector: 'Consumer Staples', symbol: 'ITC', exchange: 'NSE', currency: 'INR', currentPrice: '430.00' },
    { name: 'Hindustan Unilever Ltd.', sector: 'Consumer Staples', symbol: 'HINDUNILVR', exchange: 'NSE', currency: 'INR', currentPrice: '2600.00' },
    { name: 'Sun Pharmaceutical Industries Ltd.', sector: 'Healthcare', symbol: 'SUNPHARMA', exchange: 'NSE', currency: 'INR', currentPrice: '1750.00' },
    { name: 'Dr. Reddy\'s Laboratories Ltd.', sector: 'Healthcare', symbol: 'DRREDDY', exchange: 'NSE', currency: 'INR', currentPrice: '6800.00' },
    { name: 'Cipla Ltd.', sector: 'Healthcare', symbol: 'CIPLA', exchange: 'NSE', currency: 'INR', currentPrice: '1550.00' },
    { name: 'Wipro Ltd.', sector: 'Information Technology', symbol: 'WIPRO', exchange: 'NSE', currency: 'INR', currentPrice: '520.00' },
    { name: 'HCL Technologies Ltd.', sector: 'Information Technology', symbol: 'HCLTECH', exchange: 'NSE', currency: 'INR', currentPrice: '1800.00' },
    { name: 'Tech Mahindra Ltd.', sector: 'Information Technology', symbol: 'TECHM', exchange: 'NSE', currency: 'INR', currentPrice: '1750.00' },
    { name: 'Adani Enterprises Ltd.', sector: 'Industrials', symbol: 'ADANIENT', exchange: 'NSE', currency: 'INR', currentPrice: '2900.00' },
    { name: 'Adani Ports and SEZ Ltd.', sector: 'Industrials', symbol: 'ADANIPORTS', exchange: 'NSE', currency: 'INR', currentPrice: '1450.00' },
    { name: 'Power Grid Corporation of India Ltd.', sector: 'Utilities', symbol: 'POWERGRID', exchange: 'NSE', currency: 'INR', currentPrice: '340.00' },
    { name: 'NTPC Ltd.', sector: 'Utilities', symbol: 'NTPC', exchange: 'NSE', currency: 'INR', currentPrice: '420.00' },
    { name: 'Tata Motors Ltd.', sector: 'Automotive', symbol: 'TATAMOTORS', exchange: 'NSE', currency: 'INR', currentPrice: '980.00' },
    { name: 'Tata Steel Ltd.', sector: 'Materials', symbol: 'TATASTEEL', exchange: 'NSE', currency: 'INR', currentPrice: '180.00' },
    { name: 'Tata Consumer Products Ltd.', sector: 'Consumer Staples', symbol: 'TATACONSUM', exchange: 'NSE', currency: 'INR', currentPrice: '1250.00' },
    { name: 'Bharat Electronics Ltd.', sector: 'Industrials', symbol: 'BEL', exchange: 'NSE', currency: 'INR', currentPrice: '380.00' },
    { name: 'Coal India Ltd.', sector: 'Energy', symbol: 'COALINDIA', exchange: 'NSE', currency: 'INR', currentPrice: '460.00' },
    { name: 'Oil & Natural Gas Corporation Ltd.', sector: 'Energy', symbol: 'ONGC', exchange: 'NSE', currency: 'INR', currentPrice: '290.00' },
    { name: 'Indian Oil Corporation Ltd.', sector: 'Energy', symbol: 'IOC', exchange: 'NSE', currency: 'INR', currentPrice: '175.00' },
    { name: 'Eicher Motors Ltd.', sector: 'Automotive', symbol: 'EICHERMOT', exchange: 'NSE', currency: 'INR', currentPrice: '5600.00' },
    { name: 'Apollo Hospitals Enterprise Ltd.', sector: 'Healthcare', symbol: 'APOLLOHOSP', exchange: 'NSE', currency: 'INR', currentPrice: '8200.00' },
    { name: 'SBI Life Insurance Company Ltd.', sector: 'Insurance', symbol: 'SBILIFE', exchange: 'NSE', currency: 'INR', currentPrice: '1900.00' },
    { name: 'Bajaj Auto Ltd.', sector: 'Automotive', symbol: 'BAJAJ-AUTO', exchange: 'NSE', currency: 'INR', currentPrice: '11000.00' },
    { name: 'Nestle India Ltd.', sector: 'Consumer Staples', symbol: 'NESTLEIND', exchange: 'NSE', currency: 'INR', currentPrice: '2400.00' },
    { name: 'Uber Technologies Inc.', sector: 'Technology', symbol: 'UBER', exchange: 'NYSE', currency: 'USD', currentPrice: '105.00' },
    { name: 'Meta Platforms Inc.', sector: 'Technology', symbol: 'META', exchange: 'NASDAQ', currency: 'USD', currentPrice: '740.00' },
    { name: 'Broadcom Inc.', sector: 'Semiconductors', symbol: 'AVGO', exchange: 'NASDAQ', currency: 'USD', currentPrice: '395.00' },
    { name: 'Oracle Corporation', sector: 'Technology', symbol: 'ORCL', exchange: 'NYSE', currency: 'USD', currentPrice: '250.00' },
    { name: 'Adobe Inc.', sector: 'Technology', symbol: 'ADBE', exchange: 'NASDAQ', currency: 'USD', currentPrice: '410.00' },
    { name: 'Salesforce Inc.', sector: 'Technology', symbol: 'CRM', exchange: 'NYSE', currency: 'USD', currentPrice: '325.00' },
    { name: 'Palantir Technologies Inc.', sector: 'Technology', symbol: 'PLTR', exchange: 'NASDAQ', currency: 'USD', currentPrice: '155.00' },
    { name: 'AMD Inc.', sector: 'Semiconductors', symbol: 'AMD', exchange: 'NASDAQ', currency: 'USD', currentPrice: '205.00' },
    { name: 'Qualcomm Inc.', sector: 'Semiconductors', symbol: 'QCOM', exchange: 'NASDAQ', currency: 'USD', currentPrice: '180.00' },
    { name: 'Intel Corporation', sector: 'Semiconductors', symbol: 'INTC', exchange: 'NASDAQ', currency: 'USD', currentPrice: '35.00' },
    { name: 'Cisco Systems Inc.', sector: 'Technology', symbol: 'CSCO', exchange: 'NASDAQ', currency: 'USD', currentPrice: '70.00' },
    { name: 'IBM Corporation', sector: 'Technology', symbol: 'IBM', exchange: 'NYSE', currency: 'USD', currentPrice: '285.00' },
    { name: 'Visa Inc.', sector: 'Financial Services', symbol: 'V', exchange: 'NYSE', currency: 'USD', currentPrice: '350.00' },
    { name: 'Mastercard Inc.', sector: 'Financial Services', symbol: 'MA', exchange: 'NYSE', currency: 'USD', currentPrice: '585.00' },
    { name: 'JPMorgan Chase & Co.', sector: 'Banking', symbol: 'JPM', exchange: 'NYSE', currency: 'USD', currentPrice: '310.00' },
    { name: 'Bank of America Corporation', sector: 'Banking', symbol: 'BAC', exchange: 'NYSE', currency: 'USD', currentPrice: '52.00' },
    { name: 'Wells Fargo & Company', sector: 'Banking', symbol: 'WFC', exchange: 'NYSE', currency: 'USD', currentPrice: '85.00' },
    { name: 'Goldman Sachs Group Inc.', sector: 'Financial Services', symbol: 'GS', exchange: 'NYSE', currency: 'USD', currentPrice: '780.00' },
    { name: 'Morgan Stanley', sector: 'Financial Services', symbol: 'MS', exchange: 'NYSE', currency: 'USD', currentPrice: '155.00' },
    { name: 'Berkshire Hathaway Inc.', sector: 'Financial Services', symbol: 'BRK.B', exchange: 'NYSE', currency: 'USD', currentPrice: '510.00' },
    { name: 'McDonald\'s Corporation', sector: 'Consumer Discretionary', symbol: 'MCD', exchange: 'NYSE', currency: 'USD', currentPrice: '320.00' },
    { name: 'Starbucks Corporation', sector: 'Consumer Discretionary', symbol: 'SBUX', exchange: 'NASDAQ', currency: 'USD', currentPrice: '95.00' },
    { name: 'Nike Inc.', sector: 'Consumer Discretionary', symbol: 'NKE', exchange: 'NYSE', currency: 'USD', currentPrice: '75.00' },
    { name: 'Home Depot Inc.', sector: 'Consumer Discretionary', symbol: 'HD', exchange: 'NYSE', currency: 'USD', currentPrice: '410.00' },
    { name: 'Costco Wholesale Corporation', sector: 'Consumer Staples', symbol: 'COST', exchange: 'NASDAQ', currency: 'USD', currentPrice: '980.00' },
    { name: 'PepsiCo Inc.', sector: 'Consumer Staples', symbol: 'PEP', exchange: 'NASDAQ', currency: 'USD', currentPrice: '150.00' },
    { name: 'Procter & Gamble Co.', sector: 'Consumer Staples', symbol: 'PG', exchange: 'NYSE', currency: 'USD', currentPrice: '170.00' },
    { name: 'Philip Morris International Inc.', sector: 'Consumer Staples', symbol: 'PM', exchange: 'NYSE', currency: 'USD', currentPrice: '185.00' },
    { name: 'Merck & Co. Inc.', sector: 'Healthcare', symbol: 'MRK', exchange: 'NYSE', currency: 'USD', currentPrice: '120.00' },
    { name: 'Pfizer Inc.', sector: 'Healthcare', symbol: 'PFE', exchange: 'NYSE', currency: 'USD', currentPrice: '30.00' },
    { name: 'UnitedHealth Group Inc.', sector: 'Healthcare', symbol: 'UNH', exchange: 'NYSE', currency: 'USD', currentPrice: '340.00' },
    { name: 'AbbVie Inc.', sector: 'Healthcare', symbol: 'ABBV', exchange: 'NYSE', currency: 'USD', currentPrice: '210.00' },
    { name: 'Eli Lilly and Company', sector: 'Healthcare', symbol: 'LLY', exchange: 'NYSE', currency: 'USD', currentPrice: '950.00' },
    { name: 'Walt Disney Company', sector: 'Entertainment', symbol: 'DIS', exchange: 'NYSE', currency: 'USD', currentPrice: '115.00' },
    { name: 'Comcast Corporation', sector: 'Communication Services', symbol: 'CMCSA', exchange: 'NASDAQ', currency: 'USD', currentPrice: '35.00' },
    { name: 'Verizon Communications Inc.', sector: 'Telecommunications', symbol: 'VZ', exchange: 'NYSE', currency: 'USD', currentPrice: '45.00' },
    { name: 'AT&T Inc.', sector: 'Telecommunications', symbol: 'T', exchange: 'NYSE', currency: 'USD', currentPrice: '29.00' },
    { name: 'Boeing Company', sector: 'Industrials', symbol: 'BA', exchange: 'NYSE', currency: 'USD', currentPrice: '225.00' },
    { name: 'Caterpillar Inc.', sector: 'Industrials', symbol: 'CAT', exchange: 'NYSE', currency: 'USD', currentPrice: '490.00' },
    { name: 'General Electric Company', sector: 'Industrials', symbol: 'GE', exchange: 'NYSE', currency: 'USD', currentPrice: '290.00' },
    { name: 'Honeywell International Inc.', sector: 'Industrials', symbol: 'HON', exchange: 'NASDAQ', currency: 'USD', currentPrice: '230.00' },
    { name: 'Lockheed Martin Corporation', sector: 'Industrials', symbol: 'LMT', exchange: 'NYSE', currency: 'USD', currentPrice: '560.00' },
    { name: 'Exxon Mobil Corporation', sector: 'Energy', symbol: 'XOM', exchange: 'NYSE', currency: 'USD', currentPrice: '115.00' },
    { name: 'Chevron Corporation', sector: 'Energy', symbol: 'CVX', exchange: 'NYSE', currency: 'USD', currentPrice: '160.00' },
    { name: 'ConocoPhillips', sector: 'Energy', symbol: 'COP', exchange: 'NYSE', currency: 'USD', currentPrice: '105.00' },
    { name: 'NextEra Energy Inc.', sector: 'Utilities', symbol: 'NEE', exchange: 'NYSE', currency: 'USD', currentPrice: '78.00' },
    { name: 'Duke Energy Corporation', sector: 'Utilities', symbol: 'DUK', exchange: 'NYSE', currency: 'USD', currentPrice: '120.00' },
    { name: 'United Parcel Service Inc.', sector: 'Industrials', symbol: 'UPS', exchange: 'NYSE', currency: 'USD', currentPrice: '110.00' },
    { name: 'FedEx Corporation', sector: 'Industrials', symbol: 'FDX', exchange: 'NYSE', currency: 'USD', currentPrice: '245.00' },
    { name: 'Airbnb Inc.', sector: 'Consumer Discretionary', symbol: 'ABNB', exchange: 'NASDAQ', currency: 'USD', currentPrice: '135.00' },
    { name: 'Booking Holdings Inc.', sector: 'Consumer Discretionary', symbol: 'BKNG', exchange: 'NASDAQ', currency: 'USD', currentPrice: '5400.00' },
    { name: 'PayPal Holdings Inc.', sector: 'Financial Services', symbol: 'PYPL', exchange: 'NASDAQ', currency: 'USD', currentPrice: '75.00' },
    { name: 'Shopify Inc.', sector: 'Technology', symbol: 'SHOP', exchange: 'NYSE', currency: 'USD', currentPrice: '145.00' },
    { name: 'Snowflake Inc.', sector: 'Technology', symbol: 'SNOW', exchange: 'NYSE', currency: 'USD', currentPrice: '220.00' },
    { name: 'Spotify Technology S.A.', sector: 'Entertainment', symbol: 'SPOT', exchange: 'NYSE', currency: 'USD', currentPrice: '720.00' },
    { name: 'Zoom Communications Inc.', sector: 'Technology', symbol: 'ZM', exchange: 'NASDAQ', currency: 'USD', currentPrice: '85.00' },
    { name: 'Ferrari N.V.', sector: 'Automotive', symbol: 'RACE', exchange: 'NYSE', currency: 'USD', currentPrice: '520.00' },
    { name: 'General Motors Company', sector: 'Automotive', symbol: 'GM', exchange: 'NYSE', currency: 'USD', currentPrice: '62.00' },
    { name: 'Ford Motor Company', sector: 'Automotive', symbol: 'F', exchange: 'NYSE', currency: 'USD', currentPrice: '12.00' },
    { name: 'LVMH Moet Hennessy', sector: 'Consumer Discretionary', symbol: 'LVMUY', exchange: 'OTC', currency: 'USD', currentPrice: '150.00' },
    { name: 'Sony Group Corporation', sector: 'Technology', symbol: 'SONY', exchange: 'NYSE', currency: 'USD', currentPrice: '110.00' },
    { name: 'Alibaba Group Holding Ltd.', sector: 'Technology', symbol: 'BABA', exchange: 'NYSE', currency: 'USD', currentPrice: '155.00' },
    { name: 'Taiwan Semiconductor Manufacturing', sector: 'Semiconductors', symbol: 'TSM', exchange: 'NYSE', currency: 'USD', currentPrice: '280.00' },
    { name: 'MercadoLibre Inc.', sector: 'Technology', symbol: 'MELI', exchange: 'NASDAQ', currency: 'USD', currentPrice: '2500.00' },
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
