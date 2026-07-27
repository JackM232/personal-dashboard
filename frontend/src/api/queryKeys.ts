// Every cache key in one place, so a mutation in a tab component and the query
// that owns the list can't drift apart. Keys are hierarchical: invalidating
// ["recipes"] invalidates every recipes query beneath it.
export const queryKeys = {
  leetcode: {
    entries: ["leetcode", "entries"] as const,
    problems: ["leetcode", "problems"] as const,
  },
  applications: {
    applications: ["applications", "applications"] as const,
    interviews: ["applications", "interviews"] as const,
  },
  gym: {
    sessions: ["gym", "sessions"] as const,
    exercises: ["gym", "exercises"] as const,
    bodyweight: ["gym", "bodyweight"] as const,
    // Derived server-side from sessions, so these carry their inputs in the key
    // and get invalidated whenever a session changes.
    progression: (exerciseId: string, rangeKey: string) =>
      ["gym", "progression", exerciseId, rangeKey] as const,
    muscleVolume: (days: number) => ["gym", "muscle-volume", days] as const,
  },
  recipes: {
    list: ["recipes", "list"] as const,
    detail: (id: string) => ["recipes", "detail", id] as const,
    cookLogs: ["recipes", "cook-logs"] as const,
    favorites: ["recipes", "favorites"] as const,
  },
  users: {
    list: ["users", "list"] as const,
  },
};
