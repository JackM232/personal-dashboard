import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ProgressionPoint } from "../../api/gym";
import { formatAxisDate, useChartTheme } from "./chartTheme";
import { formatSessionDate } from "./labels";
import { METRIC_LABELS } from "./progressionMetrics";
import type { ProgressionMetric } from "./progressionMetrics";

// Weight and e1RM live in a narrow band near the top of their range, so a
// zero-based axis would flatten every trend worth seeing. Total volume is an
// additive quantity and must start at zero.
const ZERO_BASED: Record<ProgressionMetric, boolean> = {
  topSetWeight: false,
  estimated1RM: false,
  totalVolume: true,
};

function formatValue(value: number): string {
  return `${value.toLocaleString()} lb`;
}

interface TooltipEntry {
  payload: ProgressionPoint;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  metric: ProgressionMetric;
}

function ChartTooltip({ active, payload, metric }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0].payload;
  const value = point[metric];

  return (
    <div className="progression-tooltip">
      <div className="progression-tooltip-date">{formatSessionDate(point.performedAt)}</div>
      <div className="progression-tooltip-value">
        {METRIC_LABELS[metric]}: {value === null ? "—" : formatValue(value)}
      </div>
      <div className="progression-tooltip-context">
        {point.workingSets} {point.workingSets === 1 ? "set" : "sets"} × {point.totalReps} reps
      </div>
    </div>
  );
}

interface ProgressionChartProps {
  points: ProgressionPoint[];
  metric: ProgressionMetric;
}

export function ProgressionChart({ points, metric }: ProgressionChartProps) {
  const theme = useChartTheme();

  if (points.length === 0) {
    return <p className="gym-muted">No working sets logged for this exercise in this range.</p>;
  }

  return (
    <>
      <div className="progression-chart">
        <ResponsiveContainer width="100%" height="100%">
          {/* One series at a time — the metric toggle swaps the dataKey. Top set
              weight (~200) and total volume (~5000) differ by an order of
              magnitude, so they must never share a chart with two Y-axes. */}
          <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="performedAt"
              tickFormatter={formatAxisDate}
              stroke={theme.grid}
              tick={{ fill: theme.axis, fontSize: 12 }}
            />
            <YAxis
              domain={ZERO_BASED[metric] ? [0, "auto"] : ["auto", "auto"]}
              width={56}
              stroke={theme.grid}
              tick={{ fill: theme.axis, fontSize: 12 }}
            />
            <Tooltip content={<ChartTooltip metric={metric} />} />
            {/* connectNulls={false}: a session where every set was unloaded breaks
                the line rather than implying a drop to zero. */}
            <Line
              type="monotone"
              dataKey={metric}
              stroke={theme.series}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* A one-point line chart is a dot in an empty box — say so rather than
          leaving the reader to wonder what happened to the trend. */}
      {points.length < 2 && (
        <p className="gym-muted">Log this exercise again to see a trend.</p>
      )}
    </>
  );
}
