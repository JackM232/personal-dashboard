import { Response } from "express";
import { prisma } from "../../lib/prisma";
import { AuthedRequest } from "../auth/middleware";
import { TransactionType } from "../../generated/prisma";
import { foldPosition, parseDayInput } from "./positions";
import type { PositionTransaction } from "./positions";

function isEnumValue<T extends Record<string, string>>(enumObj: T, value: unknown): value is T[keyof T] {
  return typeof value === "string" && value in enumObj;
}

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

// Tickers are stored uppercase so the ledger, the quote cache and the watchlist
// all agree on what "aapl" means. Class shares and crypto pairs need the dot,
// dash and colon; anything else is a typo, not a symbol.
function parseSymbol(value: unknown): Parsed<string> {
  if (typeof value !== "string") {
    return { ok: false, error: "symbol is required" };
  }
  const symbol = value.trim().toUpperCase();
  if (!symbol) {
    return { ok: false, error: "symbol is required" };
  }
  if (!/^[A-Z0-9.:-]{1,15}$/.test(symbol)) {
    return { ok: false, error: `Invalid symbol: ${value}` };
  }
  return { ok: true, value: symbol };
}

// Shared by create and update — the numeric fields have the same bounds either way.
function invalidNumbers(body: Record<string, unknown>): string | null {
  const { quantity, pricePerShare, fees } = body;

  if (quantity !== undefined) {
    if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0) {
      return "quantity must be a number greater than 0";
    }
  }
  if (pricePerShare !== undefined) {
    if (typeof pricePerShare !== "number" || !Number.isFinite(pricePerShare) || pricePerShare < 0) {
      return "pricePerShare must be zero or more";
    }
  }
  if (fees !== undefined && fees !== null) {
    if (typeof fees !== "number" || !Number.isFinite(fees) || fees < 0) {
      return "fees must be zero or more";
    }
  }
  return null;
}

const transactionInclude = {
  account: { select: { id: true, name: true, type: true } },
} as const;

const positionFields = {
  symbol: true,
  type: true,
  tradedAt: true,
  quantity: true,
  pricePerShare: true,
  fees: true,
} as const;

// Every write re-folds the affected (account, symbol) ledger and refuses the
// change if it would leave a sale of shares that were never held. The fold is the
// same one the portfolio uses, so validation and display can't disagree about
// what is holdable.
//
// `excludeId` drops the row being edited or deleted; `extra` is the row as it
// would be after the write.
async function wouldOversell(
  accountId: string,
  symbol: string,
  excludeId: string | null,
  extra?: PositionTransaction,
): Promise<boolean> {
  const existing = await prisma.investmentTransaction.findMany({
    where: {
      accountId,
      symbol,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: positionFields,
  });

  return foldPosition(symbol, extra ? [...existing, extra] : existing).oversold;
}

const OVERSOLD_ERROR = "Cannot sell more shares than are held in this account";

// ─────────────────────────────────────────
// /api/investment-transactions — the ledger everything else is derived from
// ─────────────────────────────────────────

export async function listTransactions(req: AuthedRequest, res: Response) {
  const accountId = req.query.accountId;

  if (accountId !== undefined && typeof accountId !== "string") {
    return res.status(400).json({ error: "Invalid accountId" });
  }

  try {
    const transactions = await prisma.investmentTransaction.findMany({
      // Transactions carry no userId of their own — the per-user filter runs
      // through the account relation, which is what keeps B out of A's ledger.
      where: {
        account: { userId: req.user!.id },
        ...(accountId ? { accountId } : {}),
      },
      orderBy: [{ tradedAt: "desc" }, { createdAt: "desc" }],
      include: transactionInclude,
    });
    res.json(transactions);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch investment transactions" });
  }
}

export async function createTransaction(req: AuthedRequest, res: Response) {
  const { accountId, symbol, type, tradedAt, quantity, pricePerShare, fees, notes } = req.body;

  if (!accountId || !symbol || !type || !tradedAt) {
    return res.status(400).json({ error: "accountId, symbol, type and tradedAt are required" });
  }
  if (!isEnumValue(TransactionType, type)) {
    return res.status(400).json({ error: "Invalid type" });
  }
  if (quantity === undefined || pricePerShare === undefined) {
    return res.status(400).json({ error: "quantity and pricePerShare are required" });
  }

  const parsedSymbol = parseSymbol(symbol);
  if (!parsedSymbol.ok) {
    return res.status(400).json({ error: parsedSymbol.error });
  }
  const parsedDay = parseDayInput(tradedAt, "tradedAt");
  if (!parsedDay.ok) {
    return res.status(400).json({ error: parsedDay.error });
  }
  const numberError = invalidNumbers(req.body);
  if (numberError) {
    return res.status(400).json({ error: numberError });
  }

  try {
    // Confirm the account is the caller's before writing to it — otherwise a
    // valid foreign key would let one user post into another's ledger.
    const account = await prisma.investmentAccount.findFirst({
      where: { id: accountId, userId: req.user!.id },
      select: { id: true },
    });
    if (!account) {
      return res.status(404).json({ error: "Investment account not found" });
    }

    const pending: PositionTransaction = {
      symbol: parsedSymbol.value,
      type,
      tradedAt: parsedDay.value,
      quantity,
      pricePerShare,
      fees: fees ?? 0,
    };
    if (await wouldOversell(account.id, parsedSymbol.value, null, pending)) {
      return res.status(400).json({ error: OVERSOLD_ERROR });
    }

    const transaction = await prisma.investmentTransaction.create({
      data: {
        accountId: account.id,
        symbol: parsedSymbol.value,
        type,
        tradedAt: parsedDay.value,
        quantity,
        pricePerShare,
        fees: fees ?? 0,
        notes: notes || null,
      },
      include: transactionInclude,
    });
    res.status(201).json(transaction);
  }
  catch (err: any) {
    if (err.code === "P2003") {
      return res.status(400).json({ error: "Invalid accountId" });
    }
    res.status(500).json({ error: "Failed to create investment transaction" });
  }
}

export async function updateTransaction(req: AuthedRequest, res: Response) {
  const { accountId, symbol, type, tradedAt, quantity, pricePerShare, fees, notes } = req.body;

  if (type !== undefined && !isEnumValue(TransactionType, type)) {
    return res.status(400).json({ error: "Invalid type" });
  }

  let symbolValue: string | undefined;
  if (symbol !== undefined) {
    const parsed = parseSymbol(symbol);
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }
    symbolValue = parsed.value;
  }

  let tradedAtValue: Date | undefined;
  if (tradedAt !== undefined) {
    const parsed = parseDayInput(tradedAt, "tradedAt");
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }
    tradedAtValue = parsed.value;
  }

  const numberError = invalidNumbers(req.body);
  if (numberError) {
    return res.status(400).json({ error: numberError });
  }

  try {
    const existing = await prisma.investmentTransaction.findFirst({
      where: { id: req.params.id as string, account: { userId: req.user!.id } },
      select: { id: true, accountId: true, ...positionFields },
    });
    if (!existing) {
      return res.status(404).json({ error: "Investment transaction not found" });
    }

    let nextAccountId = existing.accountId;
    if (accountId !== undefined && accountId !== existing.accountId) {
      const account = await prisma.investmentAccount.findFirst({
        where: { id: accountId, userId: req.user!.id },
        select: { id: true },
      });
      if (!account) {
        return res.status(404).json({ error: "Investment account not found" });
      }
      nextAccountId = account.id;
    }

    const updated: PositionTransaction = {
      symbol: symbolValue ?? existing.symbol,
      type: type ?? existing.type,
      tradedAt: tradedAtValue ?? existing.tradedAt,
      quantity: quantity ?? existing.quantity,
      pricePerShare: pricePerShare ?? existing.pricePerShare,
      fees: fees ?? existing.fees,
    };

    if (await wouldOversell(nextAccountId, updated.symbol, existing.id, updated)) {
      return res.status(400).json({ error: OVERSOLD_ERROR });
    }
    // Moving a row to another account or symbol takes its shares out of the old
    // ledger, which can strand a sale that used to be covered.
    const moved = nextAccountId !== existing.accountId || updated.symbol !== existing.symbol;
    if (moved && (await wouldOversell(existing.accountId, existing.symbol, existing.id))) {
      return res.status(400).json({ error: OVERSOLD_ERROR });
    }

    await prisma.investmentTransaction.update({
      where: { id: existing.id },
      data: {
        accountId: nextAccountId,
        symbol: symbolValue,
        type,
        tradedAt: tradedAtValue,
        quantity,
        pricePerShare,
        fees,
        notes: notes === undefined ? undefined : notes || null,
      },
    });

    res.status(204).send();
  }
  catch (err) {
    res.status(500).json({ error: "Failed to update investment transaction" });
  }
}

export async function deleteTransaction(req: AuthedRequest, res: Response) {
  try {
    const existing = await prisma.investmentTransaction.findFirst({
      where: { id: req.params.id as string, account: { userId: req.user!.id } },
      select: { id: true, accountId: true, symbol: true },
    });
    if (!existing) {
      return res.status(404).json({ error: "Investment transaction not found" });
    }

    // Removing a purchase can strand a later sale. Refusing keeps the invariant
    // the create path enforces true for the whole ledger, not just at write time.
    if (await wouldOversell(existing.accountId, existing.symbol, existing.id)) {
      return res.status(400).json({
        error: "Deleting this would leave a sale of more shares than are held — remove the sale first",
      });
    }

    await prisma.investmentTransaction.delete({ where: { id: existing.id } });
    res.status(204).send();
  }
  catch (err) {
    res.status(500).json({ error: "Failed to delete investment transaction" });
  }
}
