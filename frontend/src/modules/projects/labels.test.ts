import { afterEach, describe, expect, it, vi } from "vitest";
import { formatDuration, isOverdue } from "./labels";

// 02:00Z on Tuesday the 28th is 19:00 on Monday the 27th in America/Los_Angeles.
const TUESDAY = "2026-07-28T02:00:00.000Z";
const TODAY_UTC = "2026-07-28T00:00:00.000Z";

function pin(iso: string): void {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(iso));
}

afterEach(() => {
  vi.useRealTimers();
});

function milestone(targetDate: string | null, completedAt: string | null = null) {
  return { targetDate, completedAt };
}

describe("isOverdue", () => {
  it("is true for a target date before now", () => {
    pin(TUESDAY);
    expect(isOverdue(milestone("2026-07-27T00:00:00.000Z"))).toBe(true);
  });

  it("is false for a target date in the future", () => {
    pin(TUESDAY);
    expect(isOverdue(milestone("2026-07-29T00:00:00.000Z"))).toBe(false);
  });

  it("is false once the milestone is completed, however late", () => {
    pin(TUESDAY);
    expect(isOverdue(milestone("2026-01-01T00:00:00.000Z", "2026-06-01T00:00:00.000Z"))).toBe(false);
  });

  it("is never true without a target date", () => {
    pin(TUESDAY);
    expect(isOverdue(milestone(null))).toBe(false);
    expect(isOverdue(milestone(null, "2026-06-01T00:00:00.000Z"))).toBe(false);
  });

  // Documents current behaviour, which is NOT the same rule summarizeProjects
  // applies: this compares against Date.now() while the home card's `overdue`
  // count compares against startOfTodayUtc(). A milestone targeted at today's
  // UTC midnight is therefore flagged here but not counted there — see the
  // report accompanying these tests.
  it("treats a milestone targeted today as already overdue", () => {
    pin(TUESDAY);
    expect(isOverdue(milestone(TODAY_UTC))).toBe(true);
  });

  it("flips within the target day rather than at a day boundary", () => {
    // Exactly at UTC midnight it is not yet overdue; a millisecond later it is.
    pin(TODAY_UTC);
    expect(isOverdue(milestone(TODAY_UTC))).toBe(false);

    pin("2026-07-28T00:00:00.001Z");
    expect(isOverdue(milestone(TODAY_UTC))).toBe(true);
  });
});

describe("formatDuration", () => {
  it("has no duration without a start date", () => {
    pin(TUESDAY);
    expect(formatDuration(null, null)).toBe("—");
    expect(formatDuration(null, TODAY_UTC)).toBe("—");
  });

  it("measures an unfinished project against now", () => {
    pin(TUESDAY);
    expect(formatDuration("2026-07-18T00:00:00.000Z", null)).toBe("10d");
  });

  it("measures a shipped project against its completion date", () => {
    pin(TUESDAY);
    // The clock is months past completion, so a start-to-now measurement would
    // report something much larger.
    expect(formatDuration("2026-01-01T00:00:00.000Z", "2026-01-15T00:00:00.000Z")).toBe("14d");
  });

  it("switches from days to months at 31 days", () => {
    pin(TUESDAY);
    expect(formatDuration("2026-06-28T00:00:00.000Z", TODAY_UTC)).toBe("30d");
    expect(formatDuration("2026-06-27T00:00:00.000Z", TODAY_UTC)).toBe("1mo");
  });

  it("reports months up to a year", () => {
    pin(TUESDAY);
    expect(formatDuration("2026-01-09T00:00:00.000Z", TODAY_UTC)).toBe("7mo");
  });

  it("switches to years at twelve months, to one decimal", () => {
    pin(TUESDAY);
    expect(formatDuration("2025-07-28T00:00:00.000Z", TODAY_UTC)).toBe("1.0y");
    expect(formatDuration("2024-01-28T00:00:00.000Z", TODAY_UTC)).toBe("2.5y");
  });

  it("clamps a start date in the future to zero rather than going negative", () => {
    pin(TUESDAY);
    expect(formatDuration("2026-08-15T00:00:00.000Z", null)).toBe("0d");
  });

  it("is unaffected by a DST transition inside the span", () => {
    // Both ends are absolute instants, so the 23-hour local day in March must
    // not round the day count down.
    pin(TUESDAY);
    expect(formatDuration("2026-03-01T00:00:00.000Z", "2026-03-20T00:00:00.000Z")).toBe("19d");
  });
});
