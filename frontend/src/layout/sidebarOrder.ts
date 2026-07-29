import type { DashboardModule } from "../modules";

const STORAGE_KEY_PREFIX = "sidebar-order:";

// The sidebar renders before the saved order round-trips from the server, so
// without this the first paint uses the alphabetical default and then jumps
// to the real one a moment later. Caching the last known order per user (a
// page reload doesn't persist the query cache) lets the first paint already
// be right.
export function readCachedSidebarOrder(userId: string): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + userId);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [];
  }
  catch {
    return [];
  }
}

export function writeCachedSidebarOrder(userId: string, order: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + userId, JSON.stringify(order));
  }
  catch {
    // Private browsing / full quota — the cache is only a paint-time
    // optimisation, so failing silently is fine.
  }
}

// The saved order is opaque module paths from an older version of the
// registry, so it can name modules that no longer exist and omit ones that
// now do. New accounts (and modules added since the last save) fall back to
// alphabetical — the empty-order case is exactly a brand new account.
export function reconcileSidebarOrder(saved: string[], modules: DashboardModule[]): DashboardModule[] {
  const byPath = new Map(modules.map((mod) => [mod.path, mod]));
  const alphabetical = [...modules].sort((a, b) => a.name.localeCompare(b.name));

  const known = saved.map((path) => byPath.get(path)).filter((mod): mod is DashboardModule => !!mod);
  const seen = new Set(known.map((mod) => mod.path));

  return [...known, ...alphabetical.filter((mod) => !seen.has(mod.path))];
}

// Moves `draggedPath` so it lands immediately before `beforePath` (or at the
// end when `beforePath` is null, for a drop after the last item).
export function reorderModules(
  order: DashboardModule[],
  draggedPath: string,
  beforePath: string | null,
): DashboardModule[] {
  if (draggedPath === beforePath) return order;

  const next = order.filter((mod) => mod.path !== draggedPath);
  const dragged = order.find((mod) => mod.path === draggedPath);
  if (!dragged) return order;

  const insertAt = beforePath === null ? next.length : next.findIndex((mod) => mod.path === beforePath);
  if (insertAt < 0) return order;

  next.splice(insertAt, 0, dragged);
  return next;
}
