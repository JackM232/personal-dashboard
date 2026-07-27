import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getToken } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { modules, visibleModules } from ".";

// Warms every module's lists as soon as there is a token to fetch with, so
// opening a module is a cache hit rather than a round trip.
//
// This runs in two passes on a cold load. Requests carry the token straight from
// localStorage, so modules open to everyone can start *alongside* the /me call
// rather than waiting behind it. Role-gated ones can't: asking for /api/users
// before we know the role would just 403, so they wait for /me to resolve.
//
// prefetchQuery is fire-and-forget and honours staleTime, so the second pass
// re-requests nothing the first pass already has, and a failure here surfaces
// on the page's own useQuery rather than breaking anything at the call site.
export function useModulePrefetch() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!getToken()) return;

    const ready = loading
      ? modules.filter((mod) => !mod.requiredRoles)
      : visibleModules(user?.role);

    for (const mod of ready) {
      for (const query of mod.queries ?? []) {
        queryClient.prefetchQuery(query);
      }
    }
    // user.id is a dependency as well as role: signing in as a different user of
    // the same role still needs a re-warm, since logout cleared the cache.
  }, [loading, user?.id, user?.role, queryClient]);
}
