// Derived math for the investments module. Transactions are the source of truth
// and positions are folded out of them, so every number the portfolio shows —
// quantity, cost basis, realised gain — is computed here and nowhere else.
//
// Deliberately free of Express and Prisma: it takes plain rows and returns plain
// numbers, so the arithmetic is readable and independently testable, exactly like
// gym/metrics.ts.

import { TransactionType } from "../../generated/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

// Share counts are floats (fractional shares are normal), so an exact === 0 test
// on a fully closed position would fail on accumulated binary dust.
const EPSILON = 1e-9;

// Trades and payouts are date-only facts. Storing them at UTC midnight keeps the
// ledger's ordering exact no matter which timezone the caller submitted from.
export function toUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export type ParsedDay =
  | { ok: true; value: Date }
  | { ok: false; error: string };

// A date-only string parses as UTC midnight, so allow a day of slack before
// calling it "future" — otherwise today's date rejects for users ahead of UTC.
export function parseDayInput(value: unknown, field: string): ParsedDay {
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: `Invalid ${field}` };
  }
  if (date.getTime() > Date.now() + DAY_MS) {
    return { ok: false, error: `${field} cannot be in the future` };
  }
  return { ok: true, value: toUtcDay(date) };
}

// Only the fields the fold actually reads, so this works on a Prisma row or a
// hand-built fixture alike.
export interface PositionTransaction {
  symbol: string;
  type: TransactionType;
  tradedAt: Date;
  quantity: number;
  pricePerShare: number;
  fees: number;
}

export interface Position {
  symbol: string;
  /** Shares still held. Zero means the position is closed. */
  quantity: number;
  /** Average-cost basis of the shares still held, fees included. */
  costBasis: number;
  averageCost: number;
  /** Locked in by sales — survives the position closing. */
  realizedGain: number;
  dividendIncome: number;
  /** A SELL asked for more shares than were held at that point in the ledger. */
  oversold: boolean;
}

// Same-day rows have to fold in a sensible order or buying and selling on one
// day would read as a sale from an empty position. Buys settle first, sales last.
const TYPE_ORDER: Record<TransactionType, number> = {
  BUY: 0,
  DIVIDEND: 1,
  SELL: 2,
};

function byLedgerOrder(a: PositionTransaction, b: PositionTransaction): number {
  const byDate = a.tradedAt.getTime() - b.tradedAt.getTime();
  if (byDate !== 0) return byDate;
  return TYPE_ORDER[a.type] - TYPE_ORDER[b.type];
}

// Average cost basis, not FIFO/specific-lot. It is the convention that survives
// an incomplete ledger: a user who back-fills a few trades still gets a sane
// number, where FIFO would need every lot to be present and in order.
//
// - BUY   raises quantity and cost basis, fees included in the basis.
// - SELL  lowers both, taking cost out in proportion to the shares sold, and
//         books the difference as realised gain (fees come off the proceeds).
// - DIVIDEND touches neither quantity nor basis; it accumulates as income.
//
// A sale larger than the holding is rejected at the controller before it can be
// written. This still clamps and flags it, so a ledger that somehow reached that
// state produces a wrong-but-bounded number rather than negative shares.
export function foldPosition(symbol: string, transactions: PositionTransaction[]): Position {
  let quantity = 0;
  let costBasis = 0;
  let realizedGain = 0;
  let dividendIncome = 0;
  let oversold = false;

  for (const tx of [...transactions].sort(byLedgerOrder)) {
    switch (tx.type) {
      case "BUY": {
        quantity += tx.quantity;
        costBasis += tx.quantity * tx.pricePerShare + tx.fees;
        break;
      }
      case "SELL": {
        if (tx.quantity > quantity + EPSILON) oversold = true;

        const sold = Math.min(tx.quantity, quantity);
        const fraction = quantity > EPSILON ? sold / quantity : 0;
        const costOut = costBasis * fraction;

        realizedGain += sold * tx.pricePerShare - tx.fees - costOut;
        costBasis -= costOut;
        quantity -= sold;

        // Fully exited: drop the float dust rather than carrying 1e-16 shares.
        if (quantity <= EPSILON) {
          quantity = 0;
          costBasis = 0;
        }
        break;
      }
      case "DIVIDEND": {
        // quantity = shares the payout covered, pricePerShare = payout per share.
        dividendIncome += tx.quantity * tx.pricePerShare - tx.fees;
        break;
      }
    }
  }

  return {
    symbol,
    quantity,
    costBasis,
    averageCost: quantity > EPSILON ? costBasis / quantity : 0,
    realizedGain,
    dividendIncome,
    oversold,
  };
}

// One fold per symbol. Callers that mix accounts should fold each account
// separately and combine with `mergePositions` — average cost is only meaningful
// within the account whose shares it describes.
export function foldPositions(transactions: PositionTransaction[]): Position[] {
  const bySymbol = new Map<string, PositionTransaction[]>();
  for (const tx of transactions) {
    const rows = bySymbol.get(tx.symbol);
    if (rows) rows.push(tx);
    else bySymbol.set(tx.symbol, [tx]);
  }

  return [...bySymbol.entries()]
    .map(([symbol, rows]) => foldPosition(symbol, rows))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
}

// Combines the same symbol held across several accounts. Quantities and basis
// add up; the blended average cost falls out of the totals.
export function mergePositions(symbol: string, positions: Position[]): Position {
  let quantity = 0;
  let costBasis = 0;
  let realizedGain = 0;
  let dividendIncome = 0;
  let oversold = false;

  for (const position of positions) {
    quantity += position.quantity;
    costBasis += position.costBasis;
    realizedGain += position.realizedGain;
    dividendIncome += position.dividendIncome;
    oversold ||= position.oversold;
  }

  return {
    symbol,
    quantity,
    costBasis,
    averageCost: quantity > EPSILON ? costBasis / quantity : 0,
    realizedGain,
    dividendIncome,
    oversold,
  };
}

// A position with no shares left is closed: it drops off the holdings list, but
// its realised gain and dividends stay in the totals.
export function isOpen(position: Position): boolean {
  return position.quantity > EPSILON;
}

// Money on the wire is rounded once, at the edge, so the JSON never carries
// binary dust. Ratios keep more places than dollars.
export function round(value: number, places: number): number {
  const scale = 10 ** places;
  return Math.round(value * scale) / scale;
}
