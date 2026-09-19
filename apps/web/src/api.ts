export type User = { id: number; name: string; email: string; role: 'USER' | 'ADMIN' };
export type AdminOverview = { counts: { users: number; companies: number; stocks: number; buys: number; sells: number; activePortfolios: number }; users: Array<{ id: number; name: string; email: string; role: string; createdAt: string }>; portfolios: Array<{ user: { name: string; email: string }; stock: { symbol: string; company: { name: string } }; quantityHeld: number | string; averageCost: number | string }> };
export type Stock = { id: number; symbol: string; exchange: string; currency: string; currentPrice: number | string; company: { name: string; sector?: string } };
export type Holding = { symbol: string; exchange: string; company_name: string; currency: string; current_price: number | string; quantity_held: number | string; remaining_cost: number | string; market_value: number | string };
export type Transaction = { stock_id: number; symbol: string; company_name: string; transaction_type: 'BUY' | 'SELL'; quantity: number | string; price_per_share: number | string; trade_date: string };
export type Summary = { invested_amount: number | string; market_value: number | string; unrealized_pnl: number | string; realizedPnl: number | string };

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) } });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? 'Request failed');
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const api = {
  register: (body: object) => request<{ user: User }>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: object) => request<{ user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  adminLogin: (body: object) => request<{ user: User }>('/api/auth/admin-login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  stocks: () => request<{ stocks: Stock[] }>('/api/catalog/stocks'),
  portfolio: () => request<{ portfolio: Holding[] }>('/api/portfolio'),
  transactions: () => request<{ transactions: Transaction[] }>('/api/portfolio/transactions'),
  summary: () => request<{ summary: Summary }>('/api/portfolio/reports/summary'),
  trade: (type: 'buy' | 'sell', body: object) => request(`/api/portfolio/${type}`, { method: 'POST', body: JSON.stringify(body) }),
  adminOverview: () => request<AdminOverview>('/api/admin/overview'),
};
