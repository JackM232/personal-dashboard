import { useMemo } from "react";
import { SortHeaders } from "../../components/SortableTable";
import { useSortedRows } from "../../components/useSortableTable";
import type { SortableColumn } from "../../components/useSortableTable";
import { AllocationChart } from "./AllocationChart";
import {
  formatMoney,
  formatPercent,
  formatQuantity,
  formatSigned,
  gainClass,
} from "./labels";
import type { Portfolio, PortfolioPosition } from "./types";

interface StatTileProps {
  label: string;
  value: string;
  /** Secondary line — the percent beside a dollar gain. */
  detail?: string;
  /** Signed amount the tile reports, for colouring. Zero stays neutral. */
  amount?: number | null;
}

// Class names are module-prefixed on purpose: CSS here is global, and the Gym
// module's `.stat-tile` colours "up" red, which is the opposite of what a gain
// means on this page.
function StatTile({ label, value, detail, amount }: StatTileProps) {
  const tone = amount === undefined ? "" : ` ${gainClass(amount)}`;
  return (
    <div className="investments-stat-tile">
      <div className="investments-stat-tile-label">{label}</div>
      <div className={`investments-stat-tile-value${tone}`}>{value}</div>
      {detail && <div className={`investments-stat-tile-detail${tone}`}>{detail}</div>}
    </div>
  );
}

// Built per render because the Accounts column only exists in the combined view.
function buildColumns(combined: boolean): SortableColumn<PortfolioPosition>[] {
  const columns: SortableColumn<PortfolioPosition>[] = [
    { key: "symbol", label: "Symbol", type: "text", value: (p) => p.symbol },
    { key: "quantity", label: "Quantity", type: "number", value: (p) => p.quantity },
    { key: "averageCost", label: "Avg Cost", type: "number", value: (p) => p.averageCost },
    { key: "price", label: "Price", type: "number", value: (p) => p.price },
    { key: "marketValue", label: "Market Value", type: "number", value: (p) => p.marketValue },
    { key: "dayChange", label: "Day Change", type: "number", value: (p) => p.dayChange },
    {
      key: "unrealizedGain",
      label: "Unrealised Gain",
      type: "number",
      value: (p) => p.unrealizedGain,
    },
  ];

  if (combined) {
    columns.push({ key: "accounts", label: "Accounts" });
  }
  return columns;
}

interface PortfolioTabProps {
  portfolio: Portfolio;
  /** True in the "All Accounts" view, which is the only one that shows holders. */
  combined: boolean;
}

export function PortfolioTab({ portfolio, combined }: PortfolioTabProps) {
  const columns = useMemo(() => buildColumns(combined), [combined]);
  const { sorted: visible, sort, setSort } = useSortedRows(portfolio.positions, columns);

  const { totals } = portfolio;

  return (
    <div>
      <div className="investments-stat-tiles">
        <StatTile label="Market Value" value={formatMoney(totals.marketValue)} />
        <StatTile label="Total Cost" value={formatMoney(totals.costBasis)} />
        <StatTile
          label="Unrealised Gain"
          value={formatSigned(totals.unrealizedGain)}
          detail={formatPercent(totals.unrealizedGainPercent)}
          amount={totals.unrealizedGain}
        />
        <StatTile label="Day Change" value={formatSigned(totals.dayChange)} amount={totals.dayChange} />
        <StatTile
          label="Realised Gain"
          value={formatSigned(totals.realizedGain)}
          detail={
            totals.dividendIncome !== 0
              ? `${formatSigned(totals.dividendIncome)} dividends`
              : undefined
          }
          amount={totals.realizedGain}
        />
      </div>

      {/* Missing prices are a degraded read, not a failure — say so quietly and
          keep showing the cost-basis numbers. */}
      {portfolio.quotesStale && (
        <p className="investments-note">
          Live prices are unavailable for at least one holding — those rows fall back to cost basis.
        </p>
      )}

      {portfolio.positions.length === 0 ? (
        <p className="investments-muted">
          No open positions. Log a buy on the Transactions tab and it will show up here.
        </p>
      ) : (
        <>
          <AllocationChart positions={portfolio.positions} />

          <h2 className="investments-section-heading">Positions</h2>
          <table>
            <thead>
              <SortHeaders columns={columns} sort={sort} onSortChange={setSort} />
            </thead>
            <tbody>
              {visible.map((position) => (
                <tr key={position.symbol}>
                  <td className="investments-symbol">{position.symbol}</td>
                  <td>{formatQuantity(position.quantity)}</td>
                  <td>{formatMoney(position.averageCost)}</td>
                  <td>{formatMoney(position.price)}</td>
                  <td>{formatMoney(position.marketValue)}</td>
                  <td className={gainClass(position.dayChange)}>
                    {formatSigned(position.dayChange)}
                    {position.dayChangePercent !== null && (
                      <span className="investments-secondary">
                        {" "}
                        {formatPercent(position.dayChangePercent)}
                      </span>
                    )}
                  </td>
                  <td className={gainClass(position.unrealizedGain)}>
                    {formatSigned(position.unrealizedGain)}
                    {position.unrealizedGainPercent !== null && (
                      <span className="investments-secondary">
                        {" "}
                        {formatPercent(position.unrealizedGainPercent)}
                      </span>
                    )}
                  </td>
                  {combined && (
                    <td className="investments-secondary">
                      {position.accounts.map((account) => account.name).join(", ") || "—"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
