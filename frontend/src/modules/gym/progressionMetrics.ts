export type ProgressionMetric = "topSetWeight" | "estimated1RM" | "totalVolume";

export const PROGRESSION_METRICS: ProgressionMetric[] = [
  "topSetWeight",
  "estimated1RM",
  "totalVolume",
];

export const METRIC_LABELS: Record<ProgressionMetric, string> = {
  topSetWeight: "Top Set Weight",
  estimated1RM: "Est. 1RM",
  totalVolume: "Total Volume",
};
