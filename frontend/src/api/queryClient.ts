import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data this fresh is served from cache with no request at all, which is
      // what makes switching back to a module render instantly.
      staleTime: 30_000,
      // Beyond staleTime the cached data still renders immediately and a
      // refetch runs behind it — the flash only returns once a module's data
      // has been evicted entirely, so keep it around well past staleTime.
      gcTime: 30 * 60_000,
      // A 401/404 won't fix itself on retry; only network/5xx failures might.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});
