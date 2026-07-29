import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { MAX_SLICES, useChartTheme } from "./chartTheme";
import { formatMoney, formatPercent } from "./labels";
import type { PortfolioPosition } from "./types";

export type AllocationMode = "holding" | "account";

interface Slice {
  name: string;
  value: number;
}

// Market value is the only sensible allocation measure — cost basis would show
// what the portfolio *was*, not what it is. Positions with no quote contribute
// their cost basis, matching how the totals are built server-side.
function positionValue(position: PortfolioPosition): number {
  return position.marketValue ?? position.costBasis;
}

// Slices are ranked, then everything past the eighth folds into "Other". The
// palette is never cycled: a ninth hue would repeat a colour and read as the same
// holding twice.
function toSlices(slices: Slice[]): Slice[] {
  const ranked = [...slices].filter((slice) => slice.value > 0).sort((a, b) => b.value - a.value);
  if (ranked.length <= MAX_SLICES) return ranked;

  const shown = ranked.slice(0, MAX_SLICES - 1);
  const rest = ranked.slice(MAX_SLICES - 1);
  return [...shown, { name: "Other", value: rest.reduce((sum, slice) => sum + slice.value, 0) }];
}

interface TooltipEntry {
  payload: Slice & { share: number };
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const slice = payload[0].payload;

  return (
    <div className="investments-tooltip">
      <div className="investments-tooltip-name">{slice.name}</div>
      <div className="investments-tooltip-value">{formatMoney(slice.value)}</div>
      <div className="investments-tooltip-context">{slice.share.toFixed(1)}% of portfolio</div>
    </div>
  );
}

interface AllocationChartProps {
  positions: PortfolioPosition[];
}

export function AllocationChart({ positions }: AllocationChartProps) {
  const [mode, setMode] = useState<AllocationMode>("holding");
  const theme = useChartTheme();

  const data = useMemo(() => {
    if (mode === "holding") {
      return toSlices(
        positions.map((position) => ({ name: position.symbol, value: positionValue(position) })),
      );
    }

    // A holding sitting in two accounts is split evenly between them: the
    // portfolio endpoint reports which accounts hold a symbol, not how many
    // shares each one holds. Flagged in the caption so the number isn't
    // over-read.
    const byAccount = new Map<string, number>();
    for (const position of positions) {
      const accounts = position.accounts.length > 0 ? position.accounts : [{ id: "", name: "Unassigned" }];
      const share = positionValue(position) / accounts.length;
      for (const account of accounts) {
        byAccount.set(account.name, (byAccount.get(account.name) ?? 0) + share);
      }
    }
    return toSlices([...byAccount.entries()].map(([name, value]) => ({ name, value })));
  }, [positions, mode]);

  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const withShare = data.map((slice) => ({
    ...slice,
    share: total > 0 ? (slice.value / total) * 100 : 0,
  }));

  if (data.length === 0) return null;

  return (
    <div className="allocation-panel">
      <div className="allocation-header">
        <h2 className="investments-section-heading">Allocation</h2>
        <div className="investments-segmented">
          <button
            type="button"
            className={mode === "holding" ? "active" : ""}
            onClick={() => setMode("holding")}
          >
            By holding
          </button>
          <button
            type="button"
            className={mode === "account" ? "active" : ""}
            onClick={() => setMode("account")}
          >
            By account
          </button>
        </div>
      </div>

      <div className="allocation-body">
        <div className="allocation-chart">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={withShare}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="88%"
                // A 2px ring in the surface colour keeps adjacent fills from
                // touching, which is what makes similar hues separable.
                stroke={theme.surface}
                strokeWidth={2}
                paddingAngle={1}
                isAnimationActive={false}
              >
                {withShare.map((slice, index) => (
                  <Cell key={slice.name} fill={theme.series[index % theme.series.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* The legend is not optional: three light-mode slots sit under 3:1
            against white, so the label carries identity and the colour only
            reinforces it. */}
        <ul className="allocation-legend">
          {withShare.map((slice, index) => (
            <li key={slice.name}>
              <span
                className="allocation-swatch"
                style={{ background: theme.series[index % theme.series.length] }}
              />
              <span className="allocation-legend-name">{slice.name}</span>
              <span className="allocation-legend-value">
                {formatMoney(slice.value)} · {formatPercent(slice.share).replace("+", "")}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {mode === "account" && (
        <p className="investments-muted">
          A holding in more than one account is split evenly between them.
        </p>
      )}
    </div>
  );
}
