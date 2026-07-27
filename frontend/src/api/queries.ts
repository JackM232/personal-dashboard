import { queryKeys } from "./queryKeys";
import { applicationsApi, interviewsApi } from "./applications";
import { gymApi } from "./gym";
import { usersApi } from "./users";
import { leetcodeApi } from "../modules/leetcode/api";
import { recipesApi } from "../modules/recipes/api";

// One definition per list endpoint, shared by the module page that renders it,
// the dashboard preview that summarises it, and the prefetcher that warms it on
// login. They must agree on key *and* fetcher or the same data ends up cached
// twice under different keys, so there is exactly one of each here.
//
// Parameterised queries (progression, muscle volume, a single recipe) are not
// listed: their inputs come from component state and there is no useful set to
// prefetch, so they stay inline where they are used.
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
