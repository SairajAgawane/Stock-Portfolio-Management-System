import { prisma } from './prisma';

const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY;

export async function fetchCurrentPrice(symbol: string): Promise<number | null> {
  if (!TWELVE_DATA_API_KEY) {
    console.warn('[MARKET DATA] TWELVE_DATA_API_KEY is not set. Using fallback/demo data.');
    return null;
  }
  try {
    const res = await fetch(`https://api.twelvedata.com/price?symbol=${symbol}&apikey=${TWELVE_DATA_API_KEY}`);
    const data = await res.json();
    if (data.price) return parseFloat(data.price);
  } catch (err) {
    console.error(`Failed to fetch price for ${symbol}`, err);
  }
  return null;
}

export async function updateAllStockPrices() {
  const stocks = await prisma.stock.findMany();
  let updatedCount = 0;
  for (const stock of stocks) {
    // Basic rate limit protection for free tier: 8 API calls per minute.
    // Wait 8 seconds between requests.
    if (TWELVE_DATA_API_KEY) await new Promise(resolve => setTimeout(resolve, 8000));
    
    let price = await fetchCurrentPrice(stock.symbol);
    if (!price) {
      // Fallback: simulate a random daily variation between -2% and +2%
      const variation = (Math.random() * 0.04) - 0.02;
      price = Number(stock.currentPrice) * (1 + variation);
    }

    await prisma.stock.update({
      where: { id: stock.id },
      data: { currentPrice: price }
    });

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const prevHistory = await prisma.stockPriceHistory.findFirst({
      where: { stockId: stock.id, tradeDate: { lt: today } },
      orderBy: { tradeDate: 'desc' }
    });
    
    const dailyChange = prevHistory ? (price - Number(prevHistory.closingPrice)) / Number(prevHistory.closingPrice) * 100 : 0;

    await prisma.stockPriceHistory.upsert({
      where: { stockId_tradeDate: { stockId: stock.id, tradeDate: today } },
      update: { closingPrice: price, dailyChange },
      create: { stockId: stock.id, tradeDate: today, closingPrice: price, dailyChange }
    });
    updatedCount++;
  }
  
  await prisma.auditLog.create({
    data: { action: 'SYSTEM_MARKET_UPDATE', details: { updatedCount } }
  });
  console.log(`[MARKET DATA] Updated prices for ${updatedCount} stocks.`);
}

// Automatically start background job
export function startMarketDataJob() {
  console.log('[MARKET DATA] Starting scheduled price refresh job...');
  // Run every 24 hours
  setInterval(updateAllStockPrices, 24 * 60 * 60 * 1000);
}
