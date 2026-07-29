// Shared by both controllers in this module — a project and its milestones parse
// the same date-only inputs and validate the same enums.

const DAY_MS = 24 * 60 * 60 * 1000;

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

// Same as parseDay but rejects the future — a start date or a completion is
// something that has happened. A day of slack, since a date-only string parses
// as UTC midnight and users ahead of UTC would otherwise fail on today's date.
export function parsePastDay(value: unknown, field: string): ParsedDay {
  const parsed = parseDay(value, field);
  if (!parsed.ok || !parsed.value) return parsed;
  if (parsed.value.getTime() > Date.now() + DAY_MS) {
    return { ok: false, error: `${field} cannot be in the future` };
  }
  return parsed;
}

export type ParsedTech = { ok: true; value: string[] | undefined } | { ok: false; error: string };

const MAX_TECH_ENTRIES = 20;

// Free text, so it needs the cleanup an enum would have given for free: trim,
// drop blanks, and fold case-insensitive duplicates ("React"/"react") to the
// first spelling used.
export function parseTechStack(value: unknown): ParsedTech {
  if (value === undefined) return { ok: true, value: undefined };
  if (value === null) return { ok: true, value: [] };
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    return { ok: false, error: "techStack must be an array of strings" };
  }

  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const entry of value as string[]) {
    const trimmed = entry.trim();
    if (!trimmed || seen.has(trimmed.toLowerCase())) continue;
    seen.add(trimmed.toLowerCase());
    cleaned.push(trimmed);
  }

  if (cleaned.length > MAX_TECH_ENTRIES) {
    return { ok: false, error: `techStack cannot have more than ${MAX_TECH_ENTRIES} entries` };
  }
  return { ok: true, value: cleaned };
}
