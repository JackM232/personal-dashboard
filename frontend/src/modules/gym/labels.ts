export function toDateInput(value: string): string {
  return value.slice(0, 10);
}

// performedAt/recordedAt are stored at UTC midnight, so they must be read back
// in UTC — otherwise anyone west of Greenwich sees yesterday's date on their
// own session.
export function formatSessionDate(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
