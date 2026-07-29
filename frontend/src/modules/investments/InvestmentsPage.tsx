import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import { queries } from "../../api/queries";
import { investmentsApi } from "./api";
import { ManageAccountsModal } from "./ManageAccountsModal";
import { PortfolioTab } from "./PortfolioTab";
import { TransactionsTab } from "./TransactionsTab";
import { WatchlistStrip } from "./WatchlistStrip";
import type { InvestmentAccount, InvestmentTransaction, WatchlistItem } from "./types";
import "./InvestmentsPage.css";

type Tab = "portfolio" | "transactions";

// Prices go stale fast, so the two quote-backed reads refresh on a timer. 60s
// matches the server's quote cache TTL — polling faster would only re-serve the
// same cached prices.
const QUOTE_REFRESH_MS = 60_000;

export function InvestmentsPage() {
  const [tab, setTab] = useState<Tab>("portfolio");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [manageAccountsOpen, setManageAccountsOpen] = useState(false);
  const queryClient = useQueryClient();

  const accountsQuery = useQuery(queries.investmentAccounts);
  const transactionsQuery = useQuery(queries.investmentTransactions);
  // Same key and fetcher as the registry entry, so the prefetched cache entry is
  // reused; the interval is the only addition.
  const watchlistQuery = useQuery({ ...queries.watchlist, refetchInterval: QUOTE_REFRESH_MS });

  const accounts: InvestmentAccount[] = accountsQuery.data ?? [];
  const transactions: InvestmentTransaction[] = transactionsQuery.data ?? [];
  const watchlist: WatchlistItem[] = watchlistQuery.data ?? [];

  // An account can be deleted while it is selected; fall back to the combined
  // view rather than querying an id that no longer exists.
  const activeAccountId =
    selectedAccountId && accounts.some((account) => account.id === selectedAccountId)
      ? selectedAccountId
      : null;

  // Parameterised by the selection, so it stays inline rather than joining the
  // module registry's prefetched lists.
  const portfolioQuery = useQuery({
    queryKey: queryKeys.investments.portfolio(activeAccountId),
    queryFn: () => investmentsApi.getPortfolio(activeAccountId),
    staleTime: QUOTE_REFRESH_MS,
    refetchInterval: QUOTE_REFRESH_MS,
  });

  function loadPortfolio() {
    // Every cached account view is affected by a ledger change, not just the
    // one on screen — invalidate the whole branch.
    return queryClient.invalidateQueries({ queryKey: ["investments", "portfolio"] });
  }

  function loadAccounts() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.accounts }),
      loadPortfolio(),
    ]).then(() => {});
  }

  function loadTransactions() {
    // The account list carries a transaction count that gates deletion.
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.transactions }),
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.accounts }),
      loadPortfolio(),
    ]).then(() => {});
  }

  function loadWatchlist() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.investments.watchlist });
  }

  const error =
    accountsQuery.error ?? transactionsQuery.error ?? watchlistQuery.error ?? portfolioQuery.error;

  if (
    accountsQuery.isPending ||
    transactionsQuery.isPending ||
    watchlistQuery.isPending ||
    portfolioQuery.isPending
  ) {
    return <p>Loading...</p>;
  }
  if (error) return <p>Failed to load: {error.message}</p>;
  // Unreachable — a resolved, error-free query has data. Present so the tab below
  // takes a Portfolio rather than a maybe-Portfolio.
  if (!portfolioQuery.data) return <p>Loading...</p>;

  return (
    <div>
      <div className="investments-header">
        <h1>Investments</h1>
      </div>

      <WatchlistStrip items={watchlist} onWatchlistChanged={loadWatchlist} />

      <ManageAccountsModal
        open={manageAccountsOpen}
        onClose={() => setManageAccountsOpen(false)}
        accounts={accounts}
        onAccountsChanged={loadAccounts}
      />

      <div className="account-selector">
        <div className="investments-segmented">
          <button
            type="button"
            className={activeAccountId === null ? "active" : ""}
            onClick={() => setSelectedAccountId(null)}
          >
            All Accounts
          </button>
          {accounts.map((account) => (
            <button
              key={account.id}
              type="button"
              className={activeAccountId === account.id ? "active" : ""}
              onClick={() => setSelectedAccountId(account.id)}
            >
              {account.name}
            </button>
          ))}
        </div>
        <button type="button" className="link-button" onClick={() => setManageAccountsOpen(true)}>
          Manage accounts
        </button>
      </div>

      <div className="investments-tabs">
        <div className="investments-tabs-list">
          <button
            type="button"
            className={`investments-tab ${tab === "portfolio" ? "active" : ""}`}
            onClick={() => setTab("portfolio")}
          >
            Portfolio
          </button>
          <button
            type="button"
            className={`investments-tab ${tab === "transactions" ? "active" : ""}`}
            onClick={() => setTab("transactions")}
          >
            Transactions
          </button>
        </div>

        {tab === "transactions" && (
          <button
            type="button"
            className="add-button"
            disabled={accounts.length === 0}
            onClick={() => setAddTransactionOpen(true)}
          >
            Add Transaction
          </button>
        )}
      </div>

      {tab === "portfolio" ? (
        <PortfolioTab portfolio={portfolioQuery.data} combined={activeAccountId === null} />
      ) : (
        <TransactionsTab
          transactions={transactions}
          accounts={accounts}
          selectedAccountId={activeAccountId}
          onTransactionsChanged={loadTransactions}
          addOpen={addTransactionOpen}
          onAddOpenChange={setAddTransactionOpen}
        />
      )}
    </div>
  );
}
