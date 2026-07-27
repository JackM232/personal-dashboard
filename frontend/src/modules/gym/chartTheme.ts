import { useEffect, useState } from "react";

// Chart chrome shared by every chart in this module — one place to change, no
// per-chart drift.
//
// Recharts needs literal colour values in its `stroke` / `fill` props and cannot
// consume CSS custom properties, so the palette is resolved in JS instead.

const DARK_QUERY = "(prefers-color-scheme: dark)";

export interface ChartTheme {
  /** Single-series line colour. */
  series: string;
  /** Grid lines — mirrors `--border` from index.css. */
  grid: string;
  /** Axis ticks and labels — mirrors `--text` from index.css. */
  axis: string;
}

// Deliberately blue, not the module's green: Phase 3/4 puts a line chart beside
// the green muscle heat map, and reusing green for both would make an identity
// colour and a magnitude ramp look like the same encoding.
const LIGHT: ChartTheme = {
  series: "#2a78d6",
  grid: "#e5e4e7",
  axis: "#6b6375",
};

const DARK: ChartTheme = {
  series: "#3987e5",
  grid: "#2e303a",
  axis: "#9ca3af",
};

// Dates are stored at UTC midnight, so ticks are read back in UTC — otherwise
// anyone west of Greenwich sees the previous day under their own data point.
export function formatAxisDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function useChartTheme(): ChartTheme {
  const [dark, setDark] = useState(() => window.matchMedia(DARK_QUERY).matches);

  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent) => setDark(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return dark ? DARK : LIGHT;
}
