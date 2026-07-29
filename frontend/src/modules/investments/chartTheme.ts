import { useEffect, useState } from "react";

// Chart chrome for the allocation donut. Same approach as gym/chartTheme.ts:
// recharts needs literal colour values in its `fill` props and cannot consume CSS
// custom properties, so the palette is resolved in JS.
//
// The categorical slots are assigned in fixed order and never cycled — a ninth
// holding folds into an "Other" slice rather than reusing a hue, because a
// repeated colour would read as the same entity twice.
//
// Both columns are validated against this app's own surfaces (#fff / #16171d):
// every slot clears the lightness band, the chroma floor, adjacent-pair CVD
// separation and the normal-vision floor. Three light slots sit under 3:1 against
// white, which is why the donut always ships a labelled legend and sits directly
// above the positions table — colour never carries identity on its own.

const DARK_QUERY = "(prefers-color-scheme: dark)";

export interface ChartTheme {
  /** Categorical slots, in assignment order. */
  series: string[];
  /** Ring between slices, so adjacent fills never touch — mirrors `--bg`. */
  surface: string;
  /** Tick and label ink — mirrors `--text`. */
  axis: string;
}

const LIGHT: ChartTheme = {
  series: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"],
  surface: "#ffffff",
  axis: "#6b6375",
};

// The same eight hues, stepped for the dark surface — not a separate palette.
const DARK: ChartTheme = {
  series: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"],
  surface: "#16171d",
  axis: "#9ca3af",
};

export const MAX_SLICES = LIGHT.series.length;

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
