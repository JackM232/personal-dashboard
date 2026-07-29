import { useQuery } from "@tanstack/react-query";
import { queries } from "../../../api/queries";
import { queryKeys } from "../../../api/queryKeys";
import { investmentsApi } from "../../investments/api";
import { formatMoney, formatPercent, formatSigned } from "../../investments/labels";
import { summarizeInvestments } from "../summaries";
import {
  PreviewFailed,
  PreviewHero,
  PreviewNote,
  PreviewRow,
  PreviewRows,
  PreviewSkeleton,
} from "../PreviewParts";

// Matches the server's quote cache TTL, same as the module page — asking more
// often would only re-serve the same prices. The card doesn't poll, though: the
// home page is a summary, not a ticker.
const QUOTE_STALE_MS = 60_000;

export function InvestmentsPreview() {
  const accountsQuery = useQuery(queries.investmentAccounts);
  const transactionsQuery = useQuery(queries.investmentTransactions);
  // Parameterised, so it is not in the registry — the key and fetcher are the
  // same pair InvestmentsPage uses for "all accounts", which is what makes this
  // and that page share one cache entry.
  const portfolioQuery = useQuery({
    queryKey: queryKeys.investments.portfolio(null),
    queryFn: () => investmentsApi.getPortfolio(null),
    staleTime: QUOTE_STALE_MS,
  });

  if (accountsQuery.isPending || transactionsQuery.isPending || portfolioQuery.isPending) {
    return <PreviewSkeleton />;
  }
  if (accountsQuery.error || transactionsQuery.error || portfolioQuery.error || !portfolioQuery.data) {
    return <PreviewFailed />;
  }

  const accounts = accountsQuery.data ?? [];
  const transactions = transactionsQuery.data ?? [];

  if (accounts.length === 0) return <PreviewNote>No accounts yet.</PreviewNote>;
  if (transactions.length === 0) return <PreviewNote>No transactions recorded yet.</PreviewNote>;

  const summary = summarizeInvestments(portfolioQuery.data);
  const dayTone = summary.dayChange === 0 ? undefined : summary.dayChange > 0 ? "up" : "down";

  return (
    <>
      <PreviewHero value={formatMoney(summary.marketValue)} label="portfolio value" />

      <PreviewRows>
        <PreviewRow
          label="Today"
          value={`${formatSigned(summary.dayChange)} (${formatPercent(summary.dayChangePercent)})`}
          tone={dayTone}
        />
        <PreviewRow
          label="Top position"
          value={
            summary.topPosition
              ? `${summary.topPosition.symbol} · ${formatMoney(summary.topPositionValue)}`
              : "No open positions"
          }
        />
        <PreviewRow
          label="Positions"
          value={summary.positionCount === 0 ? "All closed" : summary.positionCount}
        />
        {/* Without a quote provider every figure above is cost basis. Say so
            rather than presenting stale numbers as live ones. */}
        {summary.quotesStale && <PreviewRow label="Prices unavailable — at cost basis" />}
      </PreviewRows>
    </>
  );
}
