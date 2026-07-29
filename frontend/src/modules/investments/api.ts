import { api } from "../../api/client";
import type {
  InvestmentAccount,
  InvestmentTransaction,
  Portfolio,
  WatchlistItem,
} from "./types";

export const investmentsApi = {
  listAccounts: () => api.get<InvestmentAccount[]>("/api/investment-accounts"),
  createAccount: (body: Partial<InvestmentAccount>) =>
    api.post<InvestmentAccount>("/api/investment-accounts", body),
  updateAccount: (id: string, body: Partial<InvestmentAccount>) =>
    api.put<void>(`/api/investment-accounts/${id}`, body),
  deleteAccount: (id: string) => api.delete<void>(`/api/investment-accounts/${id}`),

  listTransactions: () => api.get<InvestmentTransaction[]>("/api/investment-transactions"),
  createTransaction: (body: Partial<InvestmentTransaction>) =>
    api.post<InvestmentTransaction>("/api/investment-transactions", body),
  updateTransaction: (id: string, body: Partial<InvestmentTransaction>) =>
    api.put<void>(`/api/investment-transactions/${id}`, body),
  deleteTransaction: (id: string) => api.delete<void>(`/api/investment-transactions/${id}`),

  // Omitting accountId returns every account combined.
  getPortfolio: (accountId: string | null) =>
    api.get<Portfolio>(
      accountId ? `/api/investments/portfolio?accountId=${encodeURIComponent(accountId)}` : "/api/investments/portfolio",
    ),

  listWatchlist: () => api.get<WatchlistItem[]>("/api/watchlist"),
  addToWatchlist: (symbol: string) => api.post<WatchlistItem>("/api/watchlist", { symbol }),
  removeFromWatchlist: (symbol: string) =>
    api.delete<void>(`/api/watchlist/${encodeURIComponent(symbol)}`),
};
