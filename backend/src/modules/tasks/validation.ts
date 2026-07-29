// Shared by both controllers in this module — a list's date and a task's due
// date parse the same way.

export function isEnumValue<T extends Record<string, string>>(enumObj: T, value: unknown): value is T[keyof T] {
  return typeof value === "string" && value in enumObj;
}

export type ParsedDay = { ok: true; value: Date | null | undefined } | { ok: false; error: string };

// Normalised to UTC midnight so a date-only input reads back as the same day
// everywhere. `undefined` means "not in the payload" and leaves the column
// alone; null/"" clears it.
export function parseDay(value: unknown, field: string): ParsedDay {
  if (value === undefined) return { ok: true, value: undefined };
  if (value === null || value === "") return { ok: true, value: null };

  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: `Invalid ${field}` };
  }
  return {
    ok: true,
    value: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())),
  };
}

export function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
