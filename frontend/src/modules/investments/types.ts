export type AccountType =
  | "BROKERAGE" | "ROTH_IRA" | "TRADITIONAL_IRA" | "RETIREMENT_401K"
  | "HSA" | "CRYPTO" | "OTHER";

export type TransactionType = "BUY" | "SELL" | "DIVIDEND";

export interface InvestmentAccount {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  institution: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // Accounts with transactions cannot be deleted — the server 409s.
  _count?: { transactions: number };
}

export interface InvestmentTransaction {
  id: string;
  accountId: string;
  symbol: string;
  type: TransactionType;
  tradedAt: string;
  quantity: number;
  pricePerShare: number;
  fees: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  account?: { id: string; name: string; type: AccountType };
}

export interface Quote {
  symbol: string;
  current: number;
  previousClose: number;
  change: number;
  changePercent: number;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  position: number;
  // null when the provider had no price — the card shows "—" rather than an error.
  quote: Quote | null;
}

// Everything price-derived is nullable: a symbol with no quote still reports its
// cost basis, and the page says so via `quotesStale` instead of failing.
export interface PortfolioPosition {
  symbol: string;
  quantity: number;
  averageCost: number;
  costBasis: number;
  price: number | null;
  marketValue: number | null;
  unrealizedGain: number | null;
  unrealizedGainPercent: number | null;
  dayChange: number | null;
  dayChangePercent: number | null;
  accounts: { id: string; name: string }[];
}

export interface PortfolioTotals {
  marketValue: number;
  costBasis: number;
  unrealizedGain: number;
  unrealizedGainPercent: number | null;
  dayChange: number;
  realizedGain: number;
  dividendIncome: number;
}

export interface Portfolio {
  positions: PortfolioPosition[];
  totals: PortfolioTotals;
  /** True when at least one holding fell back to cost basis. */
  quotesStale: boolean;
}
