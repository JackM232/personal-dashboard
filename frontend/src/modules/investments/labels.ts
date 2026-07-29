import type { AccountType, TransactionType } from "./types";

export const ACCOUNT_TYPES: AccountType[] = [
  "BROKERAGE", "ROTH_IRA", "TRADITIONAL_IRA", "RETIREMENT_401K", "HSA", "CRYPTO", "OTHER",
];

export const TRANSACTION_TYPES: TransactionType[] = ["BUY", "SELL", "DIVIDEND"];

// SCREAMING_SNAKE reads badly on screen; Title Case by default and special-case
// the handful where that produces the wrong result.
const LABEL_OVERRIDES: Record<string, string> = {
  ROTH_IRA: "Roth IRA",
  TRADITIONAL_IRA: "Traditional IRA",
  RETIREMENT_401K: "401(k)",
  HSA: "HSA",
};

export function humanize(value: string): string {
  if (value in LABEL_OVERRIDES) return LABEL_OVERRIDES[value];
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Money always shows both cents — a portfolio that rounds to whole dollars looks
// like an estimate.
export function formatMoney(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

// Gains and day changes carry their sign explicitly — "+$120.00" reads as a gain
// without relying on the colour, which is never the only cue.
export function formatSigned(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatMoney(Math.abs(value))}`;
}

export function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

// Fractional shares are normal, but trailing zeros on a whole number are noise.
export function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

// Zero is neutral, not green — the class is only applied when there is a
// direction to report.
export function gainClass(value: number | null): string {
  if (value === null || value === 0 || !Number.isFinite(value)) return "";
  return value > 0 ? "gain-positive" : "gain-negative";
}

// Trades are stored at UTC midnight, so they are read back in UTC — otherwise
// anyone west of Greenwich sees the previous day on their own trade.
export function formatTradeDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function toDateInput(value: string): string {
  return value.slice(0, 10);
}

export function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

// What a row cost or returned, fees included — the same number for every type,
// so the Transactions table has one Total column rather than three.
export function transactionTotal(tx: {
  type: TransactionType;
  quantity: number;
  pricePerShare: number;
  fees: number;
}): number {
  const gross = tx.quantity * tx.pricePerShare;
  return tx.type === "BUY" ? gross + tx.fees : gross - tx.fees;
}
