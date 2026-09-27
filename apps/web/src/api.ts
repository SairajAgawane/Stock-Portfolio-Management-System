export type User = { id: number; name: string; email: string; role: 'USER' | 'ADMIN' };
export type AdminOverview = { counts: { users: number; companies: number; stocks: number; buys: number; sells: number; activePortfolios: number }; users: Array<{ id: number; name: string; email: string; role: string; createdAt: string }>; portfolios: Array<{ user: { name: string; email: string }; stock: { symbol: string; company: { name: string } }; quantityHeld: number | string; averageCost: number | string }> };
export type Stock = { id: number; symbol: string; exchange: string; currency: string; currentPrice: number | string; company: { name: string; sector?: string } };
export type PricePoint = { tradeDate: string; closingPrice: number | string; dailyChange: number | string; stock: Stock };
export type Holding = { symbol: string; exchange: string; company_name: string; currency: string; current_price: number | string; quantity_held: number | string; remaining_cost: number | string; market_value: number | string };
export type Transaction = { stock_id: number; symbol: string; company_name: string; transaction_type: 'BUY' | 'SELL'; quantity: number | string; price_per_share: number | string; trade_date: string };
export type Summary = { invested_amount: number | string; market_value: number | string; unrealized_pnl: number | string; realizedPnl: number | string };

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const configuredApiUrl = import.meta.env.VITE_API_URL;
  const productionApiUrl = 'https://stock-portfolio-api-production-36e3.up.railway.app';
  const apiBaseUrl = (configuredApiUrl ?? (window.location.hostname.includes('localhost') ? '' : productionApiUrl)).replace(/\/$/, '');
  if (!apiBaseUrl && !window.location.hostname.includes('localhost')) {
    throw new Error('Backend API is not configured for this deployment.');
  }
  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) } });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? `Request failed (${response.status})`);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const api = {
  requestOtp: (body: object) => request<{ message: string; devOtp?: string }>('/api/auth/register/request-otp', { method: 'POST', body: JSON.stringify(body) }),
  firebaseRegister: (body: object) => request<{ user: User }>('/api/auth/firebase-register', { method: 'POST', body: JSON.stringify(body) }),
  verifyOtp: (body: object) => request<{ user: User }>('/api/auth/register/verify-otp', { method: 'POST', body: JSON.stringify(body) }),
  register: (body: object) => request<{ user: User }>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: object) => request<{ user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  adminLogin: (body: object) => request<{ user: User }>('/api/auth/admin-login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  requestPasswordReset: (body: object) => request<{ message: string }>('/api/auth/password-reset/request', { method: 'POST', body: JSON.stringify(body) }),
  resetPassword: (body: object) => request<{ message: string }>('/api/auth/password-reset', { method: 'POST', body: JSON.stringify(body) }),
  stocks: () => request<{ stocks: Stock[] }>('/api/catalog/stocks'),
  marketHistory: (stockId: number, days = 30) => request<{ history: PricePoint[] }>(`/api/catalog/history?stockId=${stockId}&days=${days}`),
  portfolio: () => request<{ portfolio: Holding[] }>('/api/portfolio'),
  transactions: () => request<{ transactions: Transaction[] }>('/api/portfolio/transactions'),
  summary: () => request<{ summary: Summary & { sectorAllocation?: Array<{ sector: string; percentage: number; value: number }> } }>('/api/portfolio/reports/summary'),
  trade: (type: 'buy' | 'sell', body: object) => request(`/api/portfolio/${type}`, { method: 'POST', body: JSON.stringify(body) }),
  watchlist: () => request<{ watchlists: Array<{ id: number; stock: Stock }> }>('/api/watchlist'),
  addToWatchlist: (body: { stockId: number }) => request('/api/watchlist', { method: 'POST', body: JSON.stringify(body) }),
  removeFromWatchlist: (stockId: number) => request(`/api/watchlist/${stockId}`, { method: 'DELETE' }),
  adminOverview: () => request<AdminOverview>('/api/admin/overview'),
  adminAuditLogs: () => request<{ logs: Array<{ id: number; action: string; ipAddress: string; createdAt: string; user?: { name: string; email: string } }> }>('/api/admin/audit-logs'),
  adminRefreshMarket: () => request<{ message: string }>('/api/admin/refresh-market', { method: 'POST' }),
};
