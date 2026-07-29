import { Response } from "express";
import { prisma } from "../../lib/prisma";
import { AuthedRequest } from "../auth/middleware";
import { AccountType } from "../../generated/prisma";

function isEnumValue<T extends Record<string, string>>(enumObj: T, value: unknown): value is T[keyof T] {
  return typeof value === "string" && value in enumObj;
}

// ─────────────────────────────────────────
// /api/investment-accounts — per-user brokerage accounts
// ─────────────────────────────────────────

// The account selector needs to know which accounts are safe to delete, and the
// count is cheaper than shipping the transactions themselves.
const accountInclude = {
  _count: { select: { transactions: true } },
} as const;

export async function listAccounts(req: AuthedRequest, res: Response) {
  try {
    const accounts = await prisma.investmentAccount.findMany({
      where: { userId: req.user!.id },
      orderBy: { name: "asc" },
      include: accountInclude,
    });
    res.json(accounts);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch investment accounts" });
  }
}

export async function createAccount(req: AuthedRequest, res: Response) {
  const { name, type, institution, notes } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: "name and type are required" });
  }
  if (!isEnumValue(AccountType, type)) {
    return res.status(400).json({ error: "Invalid type" });
  }

  try {
    const account = await prisma.investmentAccount.create({
      data: {
        userId: req.user!.id,
        name: String(name).trim(),
        type,
        institution: institution || null,
        notes: notes || null,
      },
      include: accountInclude,
    });
    res.status(201).json(account);
  }
  catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "An account with this name already exists" });
    }
    res.status(500).json({ error: "Failed to create investment account" });
  }
}

export async function updateAccount(req: AuthedRequest, res: Response) {
  const { name, type, institution, notes } = req.body;

  if (type !== undefined && !isEnumValue(AccountType, type)) {
    return res.status(400).json({ error: "Invalid type" });
  }

  try {
    const result = await prisma.investmentAccount.updateMany({
      where: { id: req.params.id as string, userId: req.user!.id },
      data: {
        name: name === undefined ? undefined : String(name).trim(),
        type,
        institution: institution === undefined ? undefined : institution || null,
        notes: notes === undefined ? undefined : notes || null,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Investment account not found" });
    }

    res.status(204).send();
  }
  catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "An account with this name already exists" });
    }
    res.status(500).json({ error: "Failed to update investment account" });
  }
}

// The FK cascades, which would take the whole transaction history with it —
// refuse instead, so a mis-click can't silently erase the ledger.
export async function deleteAccount(req: AuthedRequest, res: Response) {
  try {
    const account = await prisma.investmentAccount.findFirst({
      where: { id: req.params.id as string, userId: req.user!.id },
      select: { id: true, _count: { select: { transactions: true } } },
    });
    if (!account) {
      return res.status(404).json({ error: "Investment account not found" });
    }
    if (account._count.transactions > 0) {
      return res.status(409).json({
        error: "Cannot delete an account that still has transactions",
      });
    }

    await prisma.investmentAccount.delete({ where: { id: account.id } });
    res.status(204).send();
  }
  catch (err) {
    res.status(500).json({ error: "Failed to delete investment account" });
  }
}
