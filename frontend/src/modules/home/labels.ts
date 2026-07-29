// Display helpers the previews need and the modules they summarise don't export.
// Anything a module already formats (money, trade dates, session dates, task
// days) is imported from that module's own labels instead — this file only
// covers the gaps.

// SCREAMING_SNAKE reads badly on a card; Title Case by default and special-case
// the handful where that produces the wrong result.
const LABEL_OVERRIDES: Record<string, string> = {
  ONLINE_ASSESSMENT: "Online assessment",
};

export function humanize(value: string): string {
  if (value in LABEL_OVERRIDES) return LABEL_OVERRIDES[value];
  const words = value.toLowerCase().split("_");
  return [words[0].charAt(0).toUpperCase() + words[0].slice(1), ...words.slice(1)].join(" ");
}

// Cards are narrow, so dates drop the year — "Jul 27", not "Jul 27, 2026". Read
// in UTC because every date-only column is stored at UTC midnight.
export function formatShortDay(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// An interview is a real point in time rather than a date-only value, so this
// one is deliberately local — matching how the Applications module shows it.
export function formatScheduled(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
