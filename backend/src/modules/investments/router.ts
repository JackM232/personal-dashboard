import { Router } from "express";
import * as controller from "./controller";
import { requireAuth } from "../auth/middleware";

// Accounts, the transaction ledger, the derived portfolio and the watchlist live
// on one router; it's mounted at /api by the registry.
//
// There is no shared catalog here — every row belongs to one user — so nothing
// is role-gated beyond requiring a login.
export const investmentsRouter = Router();

// Per-user accounts
investmentsRouter.get("/investment-accounts", requireAuth, controller.listAccounts);
investmentsRouter.post("/investment-accounts", requireAuth, controller.createAccount);
investmentsRouter.put("/investment-accounts/:id", requireAuth, controller.updateAccount);
investmentsRouter.delete("/investment-accounts/:id", requireAuth, controller.deleteAccount);

// The ledger — positions are derived from these rows, never stored
investmentsRouter.get("/investment-transactions", requireAuth, controller.listTransactions);
investmentsRouter.post("/investment-transactions", requireAuth, controller.createTransaction);
investmentsRouter.put("/investment-transactions/:id", requireAuth, controller.updateTransaction);
investmentsRouter.delete("/investment-transactions/:id", requireAuth, controller.deleteTransaction);

// Derived read — ?accountId= scopes to one account, omitted combines them all
investmentsRouter.get("/investments/portfolio", requireAuth, controller.getPortfolio);

// Per-user watchlist — deleted by symbol, not row id
investmentsRouter.get("/watchlist", requireAuth, controller.listWatchlist);
investmentsRouter.post("/watchlist", requireAuth, controller.createWatchlistItem);
investmentsRouter.delete("/watchlist/:symbol", requireAuth, controller.deleteWatchlistItem);
