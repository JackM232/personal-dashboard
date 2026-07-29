import { afterEach, describe, expect, it, vi } from "vitest";
import type { Application, Interview } from "../../api/applications";
import type { BodyweightEntry, WorkoutSession } from "../../api/gym";
import type { LeetCodeEntry, LeetCodeProblem } from "../leetcode/types";
import type { Portfolio, PortfolioPosition, PortfolioTotals } from "../investments/types";
import type { Project, ProjectMilestone } from "../projects/types";
import type { CookLog, Recipe, RecipeFavorite } from "../recipes/types";
import type { Task, TaskList } from "../tasks/types";
import {
  startOfTodayUtc,
  startOfWeekUtc,
  summarizeApplications,
  summarizeGym,
  summarizeInvestments,
  summarizeLeetCode,
  summarizeProjects,
  summarizeRecipes,
  summarizeTasks,
} from "./summaries";

// 2026-07-28 is a Tuesday. At 02:00Z the local clock (America/Los_Angeles, UTC-7
// in July) reads 19:00 on Monday the 27th — so "today" is a different calendar
// day in each zone, and anything computed from local parts lands a day early.
const TUESDAY = "2026-07-28T02:00:00.000Z";

function pin(iso: string): void {
  // Only Date is faked: nothing under test schedules a timer, and leaving the
  // real ones alone keeps the runner's internals out of it.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(iso));
}

afterEach(() => {
  vi.useRealTimers();
});

// Fixtures carry only the fields each summary reads. The rest of the row shape
// is noise no assertion ever touches.
function task(fields: Partial<Task>): Task {
  return { id: "t", listId: null, done: false, priority: "MEDIUM", dueDate: null, ...fields } as Task;
}

function list(fields: Partial<TaskList>): TaskList {
  return { id: "l", title: null, date: "2026-07-28T00:00:00.000Z", ...fields } as TaskList;
}

function session(fields: Partial<WorkoutSession>): WorkoutSession {
  return { id: "s", performedAt: TUESDAY, exercises: [], ...fields } as WorkoutSession;
}

function weighIn(recordedAt: string, weight: number): BodyweightEntry {
  return { id: `w-${recordedAt}`, recordedAt, weight } as BodyweightEntry;
}

function problem(fields: Partial<LeetCodeProblem>): LeetCodeProblem {
  return { id: "p", number: 1, name: "Two Sum", difficulty: "EASY", ...fields } as LeetCodeProblem;
}

function entry(fields: Partial<LeetCodeEntry>): LeetCodeEntry {
  return { id: "e", problemId: "p", status: "COMPLETED", updatedAt: TUESDAY, ...fields } as LeetCodeEntry;
}

function position(fields: Partial<PortfolioPosition>): PortfolioPosition {
  return {
    symbol: "AAPL",
    quantity: 1,
    averageCost: 0,
    costBasis: 0,
    price: null,
    marketValue: null,
    unrealizedGain: null,
    dayChange: null,
    accounts: [],
    ...fields,
  } as PortfolioPosition;
}

function portfolio(
  positions: PortfolioPosition[],
  totals: Partial<PortfolioTotals>,
  quotesStale = false,
): Portfolio {
  return {
    positions,
    totals: { marketValue: 0, costBasis: 0, unrealizedGain: 0, dayChange: 0, ...totals } as PortfolioTotals,
    quotesStale,
  };
}

function milestone(fields: Partial<ProjectMilestone>): ProjectMilestone {
  return { id: "m", title: "M", targetDate: null, completedAt: null, ...fields } as ProjectMilestone;
}

describe("test environment", () => {
  // The premise of every date assertion below. If vitest.config.ts stops
  // applying its TZ, local-midnight bugs become undetectable and these tests
  // quietly stop proving anything — so pin the offset rather than settling for
  // "not UTC", which a developer's own machine would satisfy by accident.
  it("runs in America/Los_Angeles, not UTC", () => {
    expect(new Date("2026-07-28T02:00:00.000Z").getTimezoneOffset()).toBe(420); // PDT
    expect(new Date("2026-01-15T02:00:00.000Z").getTimezoneOffset()).toBe(480); // PST
  });
});

describe("startOfTodayUtc", () => {
  it("uses the UTC calendar day, not the local one", () => {
    pin(TUESDAY); // 19:00 Monday locally
    expect(startOfTodayUtc()).toBe(Date.UTC(2026, 6, 28));
  });
});

describe("startOfWeekUtc", () => {
  // getUTCDay() is Sunday-based, so Sunday is the case that has to wrap back six
  // days rather than forward one — the off-by-one this arithmetic exists to avoid.
  it("wraps Sunday back to the Monday six days earlier", () => {
    pin("2026-07-26T03:00:00.000Z"); // Sunday in UTC, Saturday evening locally
    expect(startOfWeekUtc()).toBe(Date.UTC(2026, 6, 20));
  });

  it("returns Monday itself on a Monday", () => {
    pin("2026-07-27T05:00:00.000Z"); // Monday in UTC, Sunday evening locally
    expect(startOfWeekUtc()).toBe(Date.UTC(2026, 6, 27));
  });

  it("returns the preceding Monday mid-week", () => {
    pin("2026-07-29T06:00:00.000Z"); // Wednesday in UTC, Tuesday evening locally
    expect(startOfWeekUtc()).toBe(Date.UTC(2026, 6, 27));
  });
});

describe("summarizeTasks", () => {
  const todayList = list({ id: "l-today", date: "2026-07-28T00:00:00.000Z" });
  const pastList = list({ id: "l-past", date: "2026-07-20T00:00:00.000Z" });

  // On today's list *and* due today. "Today" is either condition, so this row is
  // the one that would be counted twice by a filter written as a union of lists.
  const both = task({ id: "both", listId: "l-today", dueDate: "2026-07-28T00:00:00.000Z", priority: "HIGH" });
  const doneOnList = task({ id: "done", listId: "l-today", done: true });
  const dueUnsorted = task({ id: "unsorted", dueDate: "2026-07-28T00:00:00.000Z", priority: "LOW" });
  const missed = task({ id: "missed", listId: "l-past", dueDate: "2026-07-27T00:00:00.000Z" });
  const undated = task({ id: "undated" });

  const all = [both, doneOnList, dueUnsorted, missed, undated];

  it("counts a task that is both on today's list and due today once", () => {
    pin(TUESDAY);
    const summary = summarizeTasks(all, [todayList, pastList]);
    expect(summary.totalToday).toBe(3); // both, doneOnList, dueUnsorted
    expect(summary.outstandingToday).toBe(2);
    expect(summary.doneToday).toBe(1);
  });

  it("splits today's total into done and outstanding with nothing left over", () => {
    pin(TUESDAY);
    const summary = summarizeTasks(all, [todayList, pastList]);
    expect(summary.doneToday + summary.outstandingToday).toBe(summary.totalToday);
  });

  it("counts overdue across every list, not just today's", () => {
    pin(TUESDAY);
    // `missed` sits on a list from last week and never appears on today's card.
    expect(summarizeTasks(all, [todayList, pastList]).overdue).toBe(1);
  });

  it("never treats an undated task as overdue or due today", () => {
    pin(TUESDAY);
    const summary = summarizeTasks([undated], []);
    expect(summary.overdue).toBe(0);
    expect(summary.totalToday).toBe(0);
    expect(summary.outstandingTotal).toBe(1);
  });

  it("treats a due date at today's UTC midnight as today, not overdue", () => {
    // Locally it is still Monday evening; a local-midnight comparison would call
    // this due tomorrow and, hours later, overdue.
    pin(TUESDAY);
    const summary = summarizeTasks([task({ dueDate: "2026-07-28T00:00:00.000Z" })], []);
    expect(summary.totalToday).toBe(1);
    expect(summary.overdue).toBe(0);
  });

  it("classifies the same task identically either side of local midnight", () => {
    const due = [task({ dueDate: "2026-07-28T00:00:00.000Z" })];

    pin("2026-07-28T06:59:00.000Z"); // 23:59 on the 27th locally
    const before = summarizeTasks(due, []);

    pin("2026-07-28T07:01:00.000Z"); // 00:01 on the 28th locally
    const after = summarizeTasks(due, []);

    expect(before.totalToday).toBe(after.totalToday);
    expect(before.overdue).toBe(after.overdue);
    expect(after.totalToday).toBe(1);
  });

  it("orders upcoming by priority then due date, dateless last, capped at three", () => {
    pin(TUESDAY);
    const tasks = [
      task({ id: "low", listId: "l-today", priority: "LOW" }),
      task({ id: "high-late", listId: "l-today", priority: "HIGH", dueDate: "2026-08-01T00:00:00.000Z" }),
      task({ id: "high-undated", listId: "l-today", priority: "HIGH" }),
      task({ id: "high-soon", listId: "l-today", priority: "HIGH", dueDate: "2026-07-28T00:00:00.000Z" }),
      task({ id: "medium", listId: "l-today", priority: "MEDIUM" }),
    ];
    const summary = summarizeTasks(tasks, [todayList]);
    expect(summary.upcoming.map((row) => row.id)).toEqual(["high-soon", "high-late", "high-undated"]);
  });

  it("reports an empty task list as having none", () => {
    pin(TUESDAY);
    const summary = summarizeTasks([], []);
    expect(summary.hasTasks).toBe(false);
    expect(summary.outstandingTotal).toBe(0);
  });
});

describe("summarizeGym", () => {
  it("picks the most recent weigh-in at least 30 days older than the latest", () => {
    pin(TUESDAY);
    // Gaps of 14, 34 and 60 days back from the latest. Only the 34-day-old one
    // clears the cutoff first; an exact-30-day lookup would find nothing at all.
    const weighIns = [
      weighIn("2026-06-24T00:00:00.000Z", 206),
      weighIn("2026-07-28T00:00:00.000Z", 200),
      weighIn("2026-05-29T00:00:00.000Z", 210),
      weighIn("2026-07-14T00:00:00.000Z", 202),
    ];
    const summary = summarizeGym([], weighIns);
    expect(summary.latestWeight?.weight).toBe(200);
    expect(summary.weightChange).toBe(-6);
  });

  it("returns null rather than NaN when there is only one weigh-in", () => {
    pin(TUESDAY);
    const summary = summarizeGym([], [weighIn("2026-07-28T00:00:00.000Z", 200)]);
    expect(summary.weightChange).toBeNull();
  });

  it("returns null when every weigh-in is inside the 30-day window", () => {
    pin(TUESDAY);
    const summary = summarizeGym([], [
      weighIn("2026-07-28T00:00:00.000Z", 200),
      weighIn("2026-07-14T00:00:00.000Z", 202),
    ]);
    expect(summary.weightChange).toBeNull();
  });

  it("has no latest weight and no change without any weigh-ins", () => {
    pin(TUESDAY);
    const summary = summarizeGym([], []);
    expect(summary.latestWeight).toBeNull();
    expect(summary.weightChange).toBeNull();
  });

  it("takes the newest session regardless of input order", () => {
    pin(TUESDAY);
    const sessions = [
      session({ id: "old", performedAt: "2026-07-20T00:00:00.000Z" }),
      session({ id: "new", performedAt: "2026-07-27T00:00:00.000Z", exercises: [{}, {}] as WorkoutSession["exercises"] }),
      session({ id: "middle", performedAt: "2026-07-22T00:00:00.000Z" }),
    ];
    const summary = summarizeGym(sessions, []);
    expect(summary.lastSession?.id).toBe("new");
    expect(summary.lastSessionExercises).toBe(2);
  });

  it("counts this week from the UTC Monday", () => {
    pin(TUESDAY); // Monday 19:00 locally, so the local week has not started yet
    const sessions = [
      session({ id: "monday", performedAt: "2026-07-27T00:00:00.000Z" }),
      session({ id: "sunday", performedAt: "2026-07-26T23:00:00.000Z" }),
    ];
    // The Sunday session is 23:00 UTC — one hour before the week starts, but a
    // full day inside it if the boundary were built from local parts.
    expect(summarizeGym(sessions, []).sessionsThisWeek).toBe(1);
  });
});

describe("summarizeLeetCode", () => {
  const easy = problem({ id: "p-easy", number: 1, name: "Two Sum", difficulty: "EASY" });
  const hard = problem({ id: "p-hard", number: 42, name: "Trapping Rain Water", difficulty: "HARD" });

  it("counts only completed entries toward the difficulty buckets", () => {
    pin(TUESDAY);
    const entries = [
      entry({ id: "a", problemId: "p-easy" }),
      entry({ id: "b", problemId: "p-hard", status: "STARTED" }),
      entry({ id: "c", problemId: "p-hard" }),
    ];
    const summary = summarizeLeetCode(entries, [easy, hard]);
    expect(summary.solvedByDifficulty).toEqual({ EASY: 1, MEDIUM: 0, HARD: 1 });
    expect(summary.solvedTotal).toBe(2);
  });

  // schema.prisma has @@unique([userId, problemId]) on LeetCodeEntry, so one
  // user can hold at most one entry per problem — counting entries rather than
  // distinct problemIds cannot double-count a solve.
  it("has at most one entry per problem to count", () => {
    pin(TUESDAY);
    const entries = [entry({ id: "a", problemId: "p-easy" })];
    expect(summarizeLeetCode(entries, [easy, hard]).solvedByDifficulty.EASY).toBe(1);
  });

  it("falls back to the entry's embedded problem when the list has not loaded it", () => {
    pin(TUESDAY);
    const entries = [entry({ id: "a", problemId: "p-hard", problem: hard })];
    expect(summarizeLeetCode(entries, []).solvedByDifficulty.HARD).toBe(1);
  });

  it("counts entries touched in the last seven UTC days", () => {
    pin(TUESDAY); // cutoff is 2026-07-21T00:00:00Z
    const entries = [
      entry({ id: "inside", updatedAt: "2026-07-21T00:00:00.000Z", status: "STARTED" }),
      entry({ id: "outside", updatedAt: "2026-07-20T23:59:00.000Z", status: "STARTED" }),
    ];
    expect(summarizeLeetCode(entries, [easy]).recentCount).toBe(1);
  });

  it("labels an entry whose problem is missing rather than dropping it", () => {
    pin(TUESDAY);
    const summary = summarizeLeetCode([entry({ id: "orphan", problemId: "gone" })], []);
    expect(summary.recent).toEqual([
      { id: "orphan", label: "Unknown problem", difficulty: null, status: "COMPLETED" },
    ]);
  });

  it("lists the three most recently touched entries, newest first", () => {
    pin(TUESDAY);
    const entries = [
      entry({ id: "3rd", problemId: "p-easy", updatedAt: "2026-07-24T00:00:00.000Z" }),
      entry({ id: "1st", problemId: "p-easy", updatedAt: "2026-07-27T00:00:00.000Z" }),
      entry({ id: "4th", problemId: "p-easy", updatedAt: "2026-07-23T00:00:00.000Z" }),
      entry({ id: "2nd", problemId: "p-easy", updatedAt: "2026-07-26T00:00:00.000Z" }),
    ];
    const summary = summarizeLeetCode(entries, [easy]);
    expect(summary.recent.map((row) => row.id)).toEqual(["1st", "2nd", "3rd"]);
    expect(summary.recent[0].label).toBe("#1 Two Sum");
  });
});

describe("summarizeApplications", () => {
  const app = (status: Application["status"]) => ({ id: status, status }) as Application;
  const interview = (id: string, scheduledAt: string) => ({ id, scheduledAt }) as Interview;

  it("excludes rejected and withdrawn from the active count", () => {
    pin(TUESDAY);
    const summary = summarizeApplications(
      [app("SAVED"), app("APPLIED"), app("REJECTED"), app("WITHDRAWN"), app("OFFER")],
      [],
    );
    expect(summary.active).toBe(3);
    expect(summary.total).toBe(5);
    expect(summary.counts.REJECTED).toBe(1);
    expect(summary.counts.INTERVIEWING).toBe(0);
  });

  it("takes the soonest interview still in the future", () => {
    pin(TUESDAY); // 02:00Z
    const summary = summarizeApplications([], [
      interview("later-today", "2026-07-28T18:00:00.000Z"),
      interview("past", "2026-07-28T01:00:00.000Z"),
      interview("tomorrow", "2026-07-29T09:00:00.000Z"),
    ]);
    // Measured from now rather than midnight, so an interview later today counts
    // and one an hour ago does not.
    expect(summary.nextInterview?.id).toBe("later-today");
  });

  it("has no next interview when they are all in the past", () => {
    pin(TUESDAY);
    expect(summarizeApplications([], [interview("past", "2026-07-01T09:00:00.000Z")]).nextInterview).toBeNull();
  });
});

describe("summarizeInvestments", () => {
  it("reports the day change as a percentage of the prior close", () => {
    const summary = summarizeInvestments(portfolio([], { marketValue: 1020, dayChange: 20 }));
    expect(summary.dayChangePercent).toBeCloseTo(2, 10);
  });

  it("returns null instead of Infinity when the prior close is zero", () => {
    // marketValue == dayChange, i.e. everything was bought today at zero cost —
    // a percentage of nothing, not an infinite gain.
    const summary = summarizeInvestments(portfolio([], { marketValue: 50, dayChange: 50 }));
    expect(summary.dayChangePercent).toBeNull();
  });

  it("returns null instead of NaN for an empty portfolio", () => {
    const summary = summarizeInvestments(portfolio([], { marketValue: 0, dayChange: 0 }));
    expect(summary.dayChangePercent).toBeNull();
    expect(summary.topPosition).toBeNull();
    expect(summary.topPositionValue).toBeNull();
    expect(summary.positionCount).toBe(0);
  });

  it("ranks positions by cost basis when no quotes arrived", () => {
    // The shape of every portfolio when FINNHUB_API_KEY is unset: prices, market
    // values and day changes all null, so the card has to fall back throughout.
    const positions = [
      position({ symbol: "AAPL", quantity: 10, averageCost: 100, costBasis: 1000 }),
      position({ symbol: "MSFT", quantity: 5, averageCost: 500, costBasis: 2500 }),
      position({ symbol: "NVDA", quantity: 2, averageCost: 300, costBasis: 600 }),
    ];
    const summary = summarizeInvestments(
      portfolio(positions, { marketValue: 4100, costBasis: 4100, dayChange: 0 }, true),
    );
    expect(summary.topPosition?.symbol).toBe("MSFT");
    expect(summary.topPositionValue).toBe(2500);
    expect(summary.marketValue).toBe(4100);
    expect(summary.dayChange).toBe(0);
    expect(summary.dayChangePercent).toBeCloseTo(0, 10);
    expect(summary.positionCount).toBe(3);
    expect(summary.quotesStale).toBe(true);
  });

  it("prefers market value over cost basis when a quote is present", () => {
    // A small position that has run up outranks a larger one that has not, so
    // the fallback must not win when a real price exists.
    const positions = [
      position({ symbol: "AAPL", costBasis: 1000, marketValue: 3000, price: 300 }),
      position({ symbol: "MSFT", costBasis: 2500, marketValue: null }),
    ];
    const summary = summarizeInvestments(portfolio(positions, { marketValue: 5500, dayChange: 100 }, true));
    expect(summary.topPosition?.symbol).toBe("AAPL");
    expect(summary.topPositionValue).toBe(3000);
  });
});

describe("summarizeProjects", () => {
  const project = (status: Project["status"]) => ({ id: status, status }) as Project;

  it("counts only in-progress projects as active", () => {
    pin(TUESDAY);
    const summary = summarizeProjects(
      [project("IDEA"), project("IN_PROGRESS"), project("SHIPPED"), project("PAUSED")],
      [],
    );
    expect(summary.active).toBe(1);
    expect(summary.total).toBe(4);
  });

  it("lists the three nearest outstanding milestones that have a target", () => {
    pin(TUESDAY);
    const milestones = [
      milestone({ id: "d", targetDate: "2026-09-01T00:00:00.000Z" }),
      milestone({ id: "a", targetDate: "2026-07-29T00:00:00.000Z" }),
      milestone({ id: "undated" }),
      milestone({ id: "done", targetDate: "2026-07-30T00:00:00.000Z", completedAt: "2026-07-25T00:00:00.000Z" }),
      milestone({ id: "c", targetDate: "2026-08-15T00:00:00.000Z" }),
      milestone({ id: "b", targetDate: "2026-08-01T00:00:00.000Z" }),
    ];
    const summary = summarizeProjects([], milestones);
    expect(summary.upcoming.map((row) => row.id)).toEqual(["a", "b", "c"]);
  });

  it("does not count a milestone targeted at today's UTC midnight as overdue", () => {
    pin(TUESDAY); // still Monday evening locally
    const milestones = [
      milestone({ id: "today", targetDate: "2026-07-28T00:00:00.000Z" }),
      milestone({ id: "yesterday", targetDate: "2026-07-27T00:00:00.000Z" }),
      milestone({ id: "undated" }),
    ];
    expect(summarizeProjects([], milestones).overdue).toBe(1);
  });
});

describe("summarizeRecipes", () => {
  const recipe = (id: string, name: string) => ({ id, name }) as Recipe;
  const cook = (id: string, recipeId: string, cookedAt: string, embedded?: Recipe) =>
    ({ id, recipeId, cookedAt, recipe: embedded }) as CookLog;

  it("counts cooks inside the trailing 30 UTC days, inclusive of the boundary", () => {
    pin(TUESDAY); // cutoff is 2026-06-28T00:00:00Z
    const logs = [
      cook("edge", "r1", "2026-06-28T00:00:00.000Z"),
      cook("outside", "r1", "2026-06-27T23:59:00.000Z"),
      cook("inside", "r1", "2026-07-20T00:00:00.000Z"),
    ];
    expect(summarizeRecipes([], logs, []).cooksLast30Days).toBe(2);
  });

  it("names the last cook from the recipes list", () => {
    pin(TUESDAY);
    const logs = [
      cook("old", "r1", "2026-07-01T00:00:00.000Z"),
      cook("new", "r2", "2026-07-26T00:00:00.000Z"),
    ];
    const summary = summarizeRecipes([recipe("r1", "Chili"), recipe("r2", "Ramen")], logs, []);
    expect(summary.lastCook?.id).toBe("new");
    expect(summary.lastCookName).toBe("Ramen");
    expect(summary.recipeCount).toBe(2);
  });

  it("falls back to the log's embedded recipe, then to null", () => {
    pin(TUESDAY);
    const embedded = summarizeRecipes([], [cook("a", "r9", TUESDAY, recipe("r9", "Pho"))], []);
    expect(embedded.lastCookName).toBe("Pho");

    const orphan = summarizeRecipes([], [cook("a", "r9", TUESDAY)], []);
    expect(orphan.lastCookName).toBeNull();
  });

  it("has no last cook and no name without any logs", () => {
    pin(TUESDAY);
    const summary = summarizeRecipes([recipe("r1", "Chili")], [], [{ id: "f" } as RecipeFavorite]);
    expect(summary.lastCook).toBeNull();
    expect(summary.lastCookName).toBeNull();
    expect(summary.favorites).toBe(1);
  });
});
