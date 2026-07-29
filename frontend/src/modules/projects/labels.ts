import type { ProjectKind, ProjectStatus } from "./types";

// Declaration order is the pipeline order, matching the enum in schema.prisma —
// SortableTable's "enum" columns sort by position in this array.
export const PROJECT_STATUSES: ProjectStatus[] = [
  "IDEA", "PLANNING", "IN_PROGRESS", "PAUSED", "SHIPPED", "ARCHIVED",
];

export const PROJECT_KINDS: ProjectKind[] = [
  "WEB_APP", "MOBILE_APP", "CLI", "LIBRARY", "API",
  "GAME", "DATA", "MACHINE_LEARNING", "AUTOMATION", "OTHER",
];

// SCREAMING_SNAKE reads badly on screen; Title Case by default and special-case
// the handful where that produces the wrong result.
const LABEL_OVERRIDES: Record<string, string> = {
  CLI: "CLI",
  API: "API",
  MACHINE_LEARNING: "ML",
  WEB_APP: "Web App",
  MOBILE_APP: "Mobile App",
};

export function humanize(value: string): string {
  if (value in LABEL_OVERRIDES) return LABEL_OVERRIDES[value];
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Dates are stored at UTC midnight, so they are read back in UTC — otherwise
// anyone west of Greenwich sees the previous day.
export function formatDay(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function toDateInput(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

export function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

// The form takes tech as one comma-separated line rather than a repeating field —
// it's how you'd write the list anyway, and the server does the deduping.
export function parseTechStack(value: string): string[] {
  return value.split(",").map((entry) => entry.trim()).filter(Boolean);
}

export function formatTechStack(values: string[]): string {
  return values.join(", ");
}

// Undated milestones are never overdue — "no target" is not "missed the target".
export function isOverdue(milestone: { targetDate: string | null; completedAt: string | null }): boolean {
  if (milestone.completedAt || !milestone.targetDate) return false;
  return Date.parse(milestone.targetDate) < Date.now();
}

// How long a project has been going, or how long it took if it shipped. Both are
// read off the same pair of dates, so one helper covers the row and the tile.
export function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt) return "—";
  const end = completedAt ? Date.parse(completedAt) : Date.now();
  const days = Math.max(0, Math.round((end - Date.parse(startedAt)) / (24 * 60 * 60 * 1000)));
  if (days < 31) return `${days}d`;
  const months = Math.round(days / 30.44);
  return months < 12 ? `${months}mo` : `${(months / 12).toFixed(1)}y`;
}
