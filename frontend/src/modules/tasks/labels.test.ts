import { afterEach, describe, expect, it, vi } from "vitest";
import type { Task } from "./types";
import { formatDay, isDueToday, isOverdue, todayInput } from "./labels";

// 02:00Z on Tuesday the 28th is 19:00 on Monday the 27th in America/Los_Angeles.
// The whole point of the suite's timezone is that these two dates differ.
const TUESDAY = "2026-07-28T02:00:00.000Z";

// Local midnight for the 28th falls at 07:00Z. Crossing it must not change any
// classification below — only crossing 00:00Z may.
const BEFORE_LOCAL_MIDNIGHT = "2026-07-28T06:59:00.000Z";
const AFTER_LOCAL_MIDNIGHT = "2026-07-28T07:01:00.000Z";

const TODAY_UTC = "2026-07-28T00:00:00.000Z";
const YESTERDAY_UTC = "2026-07-27T00:00:00.000Z";
const TOMORROW_UTC = "2026-07-29T00:00:00.000Z";

function pin(iso: string): void {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(iso));
}

afterEach(() => {
  vi.useRealTimers();
});

function task(fields: Partial<Task>): Pick<Task, "done" | "dueDate"> {
  return { done: false, dueDate: null, ...fields };
}

describe("isDueToday", () => {
  it("is true for a due date at today's UTC midnight", () => {
    pin(TUESDAY);
    expect(isDueToday(task({ dueDate: TODAY_UTC }))).toBe(true);
  });

  it("is false either side of today", () => {
    pin(TUESDAY);
    expect(isDueToday(task({ dueDate: YESTERDAY_UTC }))).toBe(false);
    expect(isDueToday(task({ dueDate: TOMORROW_UTC }))).toBe(false);
  });

  it("does not change across local midnight", () => {
    // Both instants are the 28th in UTC. A local-midnight comparison would flip
    // this from false to true as the clock passed 07:00Z.
    pin(BEFORE_LOCAL_MIDNIGHT);
    expect(isDueToday(task({ dueDate: TODAY_UTC }))).toBe(true);

    pin(AFTER_LOCAL_MIDNIGHT);
    expect(isDueToday(task({ dueDate: TODAY_UTC }))).toBe(true);
  });

  it("is false for a done task and for one with no due date", () => {
    pin(TUESDAY);
    expect(isDueToday(task({ dueDate: TODAY_UTC, done: true }))).toBe(false);
    expect(isDueToday(task({}))).toBe(false);
  });
});

describe("isOverdue", () => {
  it("is false for a task due exactly at today's UTC midnight", () => {
    // Due today is not missed. The strict `<` is what separates the two, and
    // getting it wrong would flag every task on its own due date.
    pin(TUESDAY);
    expect(isOverdue(task({ dueDate: TODAY_UTC }))).toBe(false);
  });

  it("is true once the due date is a day behind", () => {
    pin(TUESDAY);
    expect(isOverdue(task({ dueDate: YESTERDAY_UTC }))).toBe(true);
  });

  it("does not change across local midnight", () => {
    pin(BEFORE_LOCAL_MIDNIGHT);
    expect(isOverdue(task({ dueDate: TODAY_UTC }))).toBe(false);
    expect(isOverdue(task({ dueDate: YESTERDAY_UTC }))).toBe(true);

    pin(AFTER_LOCAL_MIDNIGHT);
    expect(isOverdue(task({ dueDate: TODAY_UTC }))).toBe(false);
    expect(isOverdue(task({ dueDate: YESTERDAY_UTC }))).toBe(true);
  });

  it("is never true without a due date", () => {
    pin(TUESDAY);
    expect(isOverdue(task({}))).toBe(false);
    expect(isOverdue(task({ done: true }))).toBe(false);
  });

  it("is false for a done task however late it is", () => {
    pin(TUESDAY);
    expect(isOverdue(task({ dueDate: "2026-01-01T00:00:00.000Z", done: true }))).toBe(false);
  });

  it("agrees with isDueToday on which day a task belongs to", () => {
    pin(TUESDAY);
    const due = task({ dueDate: TODAY_UTC });
    expect(isOverdue(due)).toBe(false);
    expect(isDueToday(due)).toBe(true);
  });
});

describe("formatDay", () => {
  it("renders the stored UTC day, not the local one", () => {
    // Rendered at 19:00 the previous day locally; without timeZone: "UTC" this
    // would read "Jul 27" for anyone west of Greenwich.
    pin(TUESDAY);
    expect(formatDay(TODAY_UTC)).toContain("28");
    expect(formatDay(null)).toBe("—");
  });
});

describe("todayInput", () => {
  it("seeds the form with the UTC day", () => {
    pin(TUESDAY);
    expect(todayInput()).toBe("2026-07-28");
  });
});
