import { defineConfig } from "vitest/config";

// Every date-only column in this app is stored at UTC midnight and every
// comparison over one is meant to be UTC. Under TZ=UTC a local-time bug is
// invisible — `Date.UTC(...getUTCDate())` and a local-midnight constructor agree
// — so the suite runs at UTC-7/-8 instead, where the two differ for part of
// every day. summaries.test.ts asserts the offset is non-zero so this cannot
// silently stop applying.
//
// Set here rather than as `TZ=... vitest` in the npm script: that prefix is
// POSIX shell syntax and npm runs scripts through cmd.exe on Windows. Node
// re-reads process.env.TZ, and the child processes the pool forks inherit it.
process.env.TZ = "America/Los_Angeles";

export default defineConfig({
  test: {
    // Nothing under test touches the DOM, so no jsdom — these are all plain
    // function calls. previews.tsx pulls its React components in transitively,
    // but only its catalog/arrangement exports are exercised.
    environment: "node",
    env: { TZ: "America/Los_Angeles" },
    include: ["src/**/*.test.ts"],
  },
});
