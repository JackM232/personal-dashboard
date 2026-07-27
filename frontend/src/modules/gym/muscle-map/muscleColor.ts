// The volume → colour mapping. Sequential encoding: one hue, light→dark, with a
// neutral zero.
//
// Five discrete bins rather than a continuous interpolation, because bins are
// legendable and inline SVG can consume `fill="var(--heat-3)"` directly — the
// whole ramp stays theme-aware in CSS with no JS colour maths.

export const HEAT_BINS = [1, 2, 3, 4, 5] as const;

// 0 is its own bin: "never trained in this window" is a different statement
// from "trained least", and must not read as the faintest green.
export function heatVar(intensity: number): string {
  if (intensity <= 0) return "var(--muscle-untrained)";
  const bin = Math.min(5, Math.max(1, Math.ceil(intensity * 5)));
  return `var(--heat-${bin})`;
}
