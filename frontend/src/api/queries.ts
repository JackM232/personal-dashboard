import { queryKeys } from "./queryKeys";
import { applicationsApi, interviewsApi } from "./applications";
import { gymApi } from "./gym";
import { usersApi } from "./users";
import { leetcodeApi } from "../modules/leetcode/api";
import { recipesApi } from "../modules/recipes/api";
import { investmentsApi } from "../modules/investments/api";
import { projectsApi } from "../modules/projects/api";
import { tasksApi } from "../modules/tasks/api";

// One definition per list endpoint, shared by the module page that renders it,
// the dashboard preview that summarises it, and the prefetcher that warms it on
// login. They must agree on key *and* fetcher or the same data ends up cached
// twice under different keys, so there is exactly one of each here.
//
// Parameterised queries (progression, muscle volume, a single recipe, the
// portfolio for a selected account) are not listed: their inputs come from
// component state and there is no useful set to prefetch, so they stay inline
// where they are used.
export const queries = {
  leetcodeEntries: {
    queryKey: queryKeys.leetcode.entries,
    queryFn: () => leetcodeApi.listEntries(),
  },
  leetcodeProblems: {
    queryKey: queryKeys.leetcode.problems,
    queryFn: () => leetcodeApi.listProblems(),
  },
  applications: {
    queryKey: queryKeys.applications.applications,
    queryFn: () => applicationsApi.listApplications(),
  },
  interviews: {
    queryKey: queryKeys.applications.interviews,
    queryFn: () => interviewsApi.listInterviews(),
  },
  gymSessions: {
    queryKey: queryKeys.gym.sessions,
    queryFn: () => gymApi.listSessions(),
  },
  gymExercises: {
    queryKey: queryKeys.gym.exercises,
    queryFn: () => gymApi.listExercises(),
  },
  gymBodyweight: {
    queryKey: queryKeys.gym.bodyweight,
    queryFn: () => gymApi.listBodyweightEntries(),
  },
  recipes: {
    queryKey: queryKeys.recipes.list,
    queryFn: () => recipesApi.listRecipes(),
  },
  cookLogs: {
    queryKey: queryKeys.recipes.cookLogs,
    queryFn: () => recipesApi.listCookLogs(),
  },
  recipeFavorites: {
    queryKey: queryKeys.recipes.favorites,
    queryFn: () => recipesApi.listFavorites(),
  },
  investmentAccounts: {
    queryKey: queryKeys.investments.accounts,
    queryFn: () => investmentsApi.listAccounts(),
  },
  investmentTransactions: {
    queryKey: queryKeys.investments.transactions,
    queryFn: () => investmentsApi.listTransactions(),
  },
  watchlist: {
    queryKey: queryKeys.investments.watchlist,
    queryFn: () => investmentsApi.listWatchlist(),
  },
  projects: {
    queryKey: queryKeys.projects.list,
    queryFn: () => projectsApi.listProjects(),
  },
  projectMilestones: {
    queryKey: queryKeys.projects.milestones,
    queryFn: () => projectsApi.listMilestones(),
  },
  tasks: {
    queryKey: queryKeys.tasks.tasks,
    queryFn: () => tasksApi.listTasks(),
  },
  taskLists: {
    queryKey: queryKeys.tasks.lists,
    queryFn: () => tasksApi.listTaskLists(),
  },
  users: {
    queryKey: queryKeys.users.list,
    queryFn: () => usersApi.listUsers(),
  },
};

// What the prefetcher can hand to queryClient.prefetchQuery without caring which
// module it came from.
export type ModuleQuery = {
  queryKey: readonly unknown[];
  queryFn: () => Promise<unknown>;
};
