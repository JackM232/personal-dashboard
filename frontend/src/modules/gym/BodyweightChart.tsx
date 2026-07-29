import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BodyweightEntry } from "../../api/gym";
import { formatAxisDate, useChartTheme } from "./chartTheme";
import { formatSessionDate } from "./labels";

interface TooltipEntry {
  payload: BodyweightEntry;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0].payload;

  return (
    <div className="progression-tooltip">
      <div className="progression-tooltip-date">{formatSessionDate(entry.recordedAt)}</div>
      <div className="progression-tooltip-value">
        {entry.weight.toLocaleString(undefined, { maximumFractionDigits: 1 })} lb
      </div>
      {entry.notes && <div className="progression-tooltip-context">{entry.notes}</div>}
    </div>
  );
}

interface BodyweightChartProps {
  entries: BodyweightEntry[];
}

// Same conventions as ProgressionChart: one series, no legend, 2px stroke.
export function BodyweightChart({ entries }: BodyweightChartProps) {
  const theme = useChartTheme();

  return (
    <>
      <div className="bodyweight-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={entries} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="recordedAt"
              tickFormatter={formatAxisDate}
              stroke={theme.grid}
              tick={{ fill: theme.axis, fontSize: 12 }}
            />
            {/* Not zero-based: bodyweight varies within a narrow band, and a
                zero-based axis flattens every trend into a straight line. */}
            <YAxis
              domain={["auto", "auto"]}
              width={56}
              stroke={theme.grid}
              tick={{ fill: theme.axis, fontSize: 12 }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="weight"
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

      {entries.length < 2 && (
        <p className="gym-muted">Add another weigh-in to see a trend.</p>
      )}
    </>
  );
}
