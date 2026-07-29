import type { Application, ApplicationStatus, Interview } from "../../api/applications";
import type { BodyweightEntry, WorkoutSession } from "../../api/gym";
import type { Difficulty, LeetCodeEntry, LeetCodeProblem } from "../leetcode/types";
import type { Portfolio, PortfolioPosition } from "../investments/types";
import type { Project, ProjectMilestone } from "../projects/types";
import type { CookLog, Recipe, RecipeFavorite } from "../recipes/types";
import type { Task, TaskList, TaskPriority } from "../tasks/types";

// Every number on the home page is derived here, off plain rows — nothing in
// this file imports React or fetches anything, so a preview component is only
// ever markup around one of these results.
//
// Dates are UTC midnight on both sides of the API, so every window below is
// built from UTC parts. A local-time midnight would land a few hours off and
// misclassify anything logged either side of it.

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfTodayUtc(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

// Monday, matching how a training week is normally counted. getUTCDay() is
// Sunday-based, so Sunday has to wrap back six days rather than forward one.
export function startOfWeekUtc(): number {
  const today = startOfTodayUtc();
  const weekday = new Date(today).getUTCDay();
  return today - ((weekday + 6) % 7) * DAY_MS;
}

function daysAgoUtc(days: number): number {
  return startOfTodayUtc() - days * DAY_MS;
}

function isSameUtcDay(value: string, dayStart: number): boolean {
  return Date.parse(value) >= dayStart && Date.parse(value) < dayStart + DAY_MS;
}

// ─────────────────────────────────────────
// Tasks
// ─────────────────────────────────────────

export interface TasksSummary {
  /** Not done, on today's list or due today — the three most urgent, for display. */
  upcoming: Task[];
  outstandingToday: number;
  doneToday: number;
  totalToday: number;
  /** Every unfinished task, so a day with nothing scheduled still has a number. */
  outstandingTotal: number;
  /** Across every list, not just today's — a missed task is the point of the card. */
  overdue: number;
  hasTasks: boolean;
}

// High first: the card shows a dot per task and the urgent ones have to be the
// ones that survive the cut to three.
const PRIORITY_RANK: Record<TaskPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export function summarizeTasks(tasks: Task[], lists: TaskList[]): TasksSummary {
  const today = startOfTodayUtc();
  const todayListIds = new Set(
    lists.filter((list) => isSameUtcDay(list.date, today)).map((list) => list.id),
  );

  // "Today" is either list membership or a due date — a task dated today but
  // sitting unsorted still belongs on today's card.
  const todayTasks = tasks.filter(
    (task) =>
      (task.listId !== null && todayListIds.has(task.listId)) ||
      (task.dueDate !== null && isSameUtcDay(task.dueDate, today)),
  );

  const outstanding = todayTasks.filter((task) => !task.done);
  const upcoming = [...outstanding].sort((a, b) => {
    const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (byPriority !== 0) return byPriority;
    // Undated tasks sink below dated ones rather than sorting as epoch zero.
    const aDue = a.dueDate ? Date.parse(a.dueDate) : Number.POSITIVE_INFINITY;
    const bDue = b.dueDate ? Date.parse(b.dueDate) : Number.POSITIVE_INFINITY;
    return aDue - bDue;
  });

  return {
    upcoming: upcoming.slice(0, 3),
    outstandingToday: outstanding.length,
    doneToday: todayTasks.length - outstanding.length,
    totalToday: todayTasks.length,
    outstandingTotal: tasks.filter((task) => !task.done).length,
    // An undated task is never overdue — "no due date" is not "missed the date".
    overdue: tasks.filter(
      (task) => !task.done && task.dueDate !== null && Date.parse(task.dueDate) < today,
    ).length,
    hasTasks: tasks.length > 0,
  };
}

// ─────────────────────────────────────────
// Gym
// ─────────────────────────────────────────

export interface GymSummary {
  lastSession: WorkoutSession | null;
  lastSessionExercises: number;
  sessionsThisWeek: number;
  latestWeight: BodyweightEntry | null;
  /** Latest weigh-in minus the one nearest 30 days before it; null without a pair. */
  weightChange: number | null;
}

export function summarizeGym(
  sessions: WorkoutSession[],
  bodyweight: BodyweightEntry[],
): GymSummary {
  // The API already sorts these, but the summary shouldn't depend on it — a
  // wrong "last session" is worse than a redundant sort of a short list.
  const byDate = [...sessions].sort((a, b) => Date.parse(b.performedAt) - Date.parse(a.performedAt));
  const lastSession = byDate[0] ?? null;

  const weekStart = startOfWeekUtc();
  const weighIns = [...bodyweight].sort(
    (a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt),
  );
  const latestWeight = weighIns[0] ?? null;

  return {
    lastSession,
    lastSessionExercises: lastSession?.exercises.length ?? 0,
    sessionsThisWeek: sessions.filter((session) => Date.parse(session.performedAt) >= weekStart)
      .length,
    latestWeight,
    weightChange: latestWeight ? weightChangeOver(weighIns, 30) : null,
  };
}

// The comparison point is the most recent weigh-in at least `days` old, not one
// exactly that far back — weigh-ins are sporadic, and an exact-date lookup would
// report nothing for most people.
function weightChangeOver(descending: BodyweightEntry[], days: number): number | null {
  const latest = descending[0];
  const cutoff = Date.parse(latest.recordedAt) - days * DAY_MS;
  const earlier = descending.find((entry) => Date.parse(entry.recordedAt) <= cutoff);
  return earlier ? latest.weight - earlier.weight : null;
}

// ─────────────────────────────────────────
// LeetCode
// ─────────────────────────────────────────

export interface LeetCodeSummary {
  solvedByDifficulty: Record<Difficulty, number>;
  solvedTotal: number;
  /** Entries touched in the last 7 days — a solve *or* a re-attempt counts. */
  recentCount: number;
  recent: { id: string; label: string; difficulty: Difficulty | null; status: string }[];
  hasEntries: boolean;
}

export function summarizeLeetCode(
  entries: LeetCodeEntry[],
  problems: LeetCodeProblem[],
): LeetCodeSummary {
  const byId = new Map(problems.map((problem) => [problem.id, problem]));
  const solvedByDifficulty: Record<Difficulty, number> = { EASY: 0, MEDIUM: 0, HARD: 0 };

  for (const entry of entries) {
    if (entry.status !== "COMPLETED") continue;
    // The entry carries its problem on some reads and not others; the problems
    // list is the fallback so the counts don't depend on which shape arrived.
    const problem = byId.get(entry.problemId) ?? entry.problem;
    if (problem) solvedByDifficulty[problem.difficulty] += 1;
  }

  const cutoff = daysAgoUtc(7);
  const recent = [...entries].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

  return {
    solvedByDifficulty,
    solvedTotal:
      solvedByDifficulty.EASY + solvedByDifficulty.MEDIUM + solvedByDifficulty.HARD,
    recentCount: entries.filter((entry) => Date.parse(entry.updatedAt) >= cutoff).length,
    recent: recent.slice(0, 3).map((entry) => {
      const problem = byId.get(entry.problemId) ?? entry.problem;
      return {
        id: entry.id,
        label: problem ? `#${problem.number} ${problem.name}` : "Unknown problem",
        difficulty: problem?.difficulty ?? null,
        status: entry.status,
      };
    }),
    hasEntries: entries.length > 0,
  };
}

// ─────────────────────────────────────────
// Applications
// ─────────────────────────────────────────

export interface ApplicationsSummary {
  counts: Record<ApplicationStatus, number>;
  /** Everything still alive: not rejected, not withdrawn. */
  active: number;
  total: number;
  nextInterview: Interview | null;
}

// Closed states, so "active" is defined in one place rather than as a filter
// spelled out at the call site.
const CLOSED_STATUSES: ApplicationStatus[] = ["REJECTED", "WITHDRAWN"];

export function summarizeApplications(
  applications: Application[],
  interviews: Interview[],
): ApplicationsSummary {
  const counts = {
    SAVED: 0,
    APPLIED: 0,
    ONLINE_ASSESSMENT: 0,
    INTERVIEWING: 0,
    OFFER: 0,
    REJECTED: 0,
    WITHDRAWN: 0,
  } as Record<ApplicationStatus, number>;

  for (const application of applications) counts[application.status] += 1;

  // scheduledAt is a timestamp, not a date — "upcoming" is measured from now,
  // not from midnight, so an interview later today still counts.
  const now = Date.now();
  const upcoming = interviews
    .filter((interview) => Date.parse(interview.scheduledAt) >= now)
    .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));

  return {
    counts,
    active: applications.filter((app) => !CLOSED_STATUSES.includes(app.status)).length,
    total: applications.length,
    nextInterview: upcoming[0] ?? null,
  };
}

// ─────────────────────────────────────────
// Investments
// ─────────────────────────────────────────

export interface InvestmentsSummary {
  marketValue: number;
  dayChange: number;
  /** null when the prior close works out to zero — a percentage of nothing. */
  dayChangePercent: number | null;
  topPosition: PortfolioPosition | null;
  topPositionValue: number | null;
  positionCount: number;
  /** True when at least one holding fell back to cost basis (no quote). */
  quotesStale: boolean;
}

// Without a Finnhub key every position's price is null and marketValue is the
// cost basis, so the card reads the same either way — it just says so.
function positionValue(position: PortfolioPosition): number {
  return position.marketValue ?? position.costBasis;
}

export function summarizeInvestments(portfolio: Portfolio): InvestmentsSummary {
  const { positions, totals } = portfolio;

  const topPosition = positions.reduce<PortfolioPosition | null>(
    (best, position) => (best === null || positionValue(position) > positionValue(best) ? position : best),
    null,
  );

  // The totals carry the day change in dollars but not as a percentage; it is
  // measured against yesterday's close, which is today's value less the change.
  const priorClose = totals.marketValue - totals.dayChange;

  return {
    marketValue: totals.marketValue,
    dayChange: totals.dayChange,
    dayChangePercent: priorClose > 0 ? (totals.dayChange / priorClose) * 100 : null,
    topPosition,
    topPositionValue: topPosition ? positionValue(topPosition) : null,
    positionCount: positions.length,
    quotesStale: portfolio.quotesStale,
  };
}

// ─────────────────────────────────────────
// Projects
// ─────────────────────────────────────────

export interface ProjectsSummary {
  active: number;
  total: number;
  /** The three nearest outstanding milestones that have a target date. */
  upcoming: ProjectMilestone[];
  overdue: number;
}

export function summarizeProjects(
  projects: Project[],
  milestones: ProjectMilestone[],
): ProjectsSummary {
  const outstanding = milestones.filter(
    (milestone) => milestone.completedAt === null && milestone.targetDate !== null,
  );
  const byTarget = [...outstanding].sort(
    (a, b) => Date.parse(a.targetDate!) - Date.parse(b.targetDate!),
  );

  return {
    active: projects.filter((project) => project.status === "IN_PROGRESS").length,
    total: projects.length,
    upcoming: byTarget.slice(0, 3),
    // Undated milestones are excluded above, so nothing here can be overdue for
    // want of a target — same rule as the Projects module's own tab.
    overdue: byTarget.filter((milestone) => Date.parse(milestone.targetDate!) < startOfTodayUtc())
      .length,
  };
}

// ─────────────────────────────────────────
// Recipes
// ─────────────────────────────────────────

export interface RecipesSummary {
  cooksLast30Days: number;
  favorites: number;
  lastCook: CookLog | null;
  /** Resolved off the recipes list when the log didn't carry its recipe. */
  lastCookName: string | null;
  recipeCount: number;
}

export function summarizeRecipes(
  recipes: Recipe[],
  cookLogs: CookLog[],
  favorites: RecipeFavorite[],
): RecipesSummary {
  const cutoff = daysAgoUtc(30);
  const byDate = [...cookLogs].sort((a, b) => Date.parse(b.cookedAt) - Date.parse(a.cookedAt));
  const lastCook = byDate[0] ?? null;
  const byId = new Map(recipes.map((recipe) => [recipe.id, recipe]));

  return {
    cooksLast30Days: cookLogs.filter((log) => Date.parse(log.cookedAt) >= cutoff).length,
    favorites: favorites.length,
    lastCook,
    lastCookName: lastCook
      ? (byId.get(lastCook.recipeId)?.name ?? lastCook.recipe?.name ?? null)
      : null,
    recipeCount: recipes.length,
  };
}
