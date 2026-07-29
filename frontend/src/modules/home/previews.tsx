import type { ComponentType } from "react";
import type { ModuleTheme } from "..";
import type { DashboardLayout } from "./types";
import { ApplicationsPreview } from "./previews/ApplicationsPreview";
import { GymPreview } from "./previews/GymPreview";
import { InvestmentsPreview } from "./previews/InvestmentsPreview";
import { LeetCodePreview } from "./previews/LeetCodePreview";
import { ProjectsPreview } from "./previews/ProjectsPreview";
import { RecipesPreview } from "./previews/RecipesPreview";
import { TasksPreview } from "./previews/TasksPreview";

export interface PreviewDefinition {
  id: string; // stored server-side; renaming one strands every saved layout
  label: string;
  path: string; // the module this card opens
  theme: ModuleTheme; // applied to the card, not the layout — see HomePage.css
  component: ComponentType;
}

/** The grid is fixed at 3×2; showing a seventh card has to displace one. */
export const VISIBLE_SLOTS = 6;

// The single source of truth for which previews exist. Declaration order is the
// shipped default order, and the ids are what the server stores — it knows
// nothing else about this list.
//
// Home is deliberately not a module in the registry: an entry with path "/"
// would make moduleForPath match every route and mis-theme the whole app.
export const previews: PreviewDefinition[] = [
  { id: "tasks", label: "Tasks", path: "/tasks", theme: "indigo", component: TasksPreview },
  { id: "gym", label: "Gym", path: "/gym", theme: "green", component: GymPreview },
  { id: "leetcode", label: "LeetCode", path: "/leetcode", theme: "purple", component: LeetCodePreview },
  { id: "applications", label: "Applications", path: "/applications", theme: "blue", component: ApplicationsPreview },
  { id: "investments", label: "Investments", path: "/investments", theme: "teal", component: InvestmentsPreview },
  { id: "projects", label: "Projects", path: "/projects", theme: "pink", component: ProjectsPreview },
  // Seventh of seven, so it is the one off by default — the six above are the
  // ones worth a glance every day.
  { id: "recipes", label: "Recipes", path: "/recipes", theme: "orange", component: RecipesPreview },
];

const previewsById = new Map(previews.map((preview) => [preview.id, preview]));

export function previewById(id: string): PreviewDefinition | undefined {
  return previewsById.get(id);
}

// Kept in step with the backend's copy, which only exists so a first-time GET
// returns something usable.
export const defaultLayout: DashboardLayout = {
  order: previews.map((preview) => preview.id),
  hidden: ["recipes"],
};

// Hidden ids always sit after the visible ones in `order`, so the visible cards
// are a prefix and an unhidden preview lands at the end of the grid — which is
// where the empty slot the user just made is. Every operation below re-imposes
// that, so nothing else has to think about it.
function rebuild(order: string[], hidden: Iterable<string>): DashboardLayout {
  const hiddenSet = new Set(hidden);
  const visible = order.filter((id) => !hiddenSet.has(id));
  const rest = order.filter((id) => hiddenSet.has(id));
  return { order: [...visible, ...rest], hidden: rest };
}

export function visibleIds(layout: DashboardLayout): string[] {
  const hidden = new Set(layout.hidden);
  return layout.order.filter((id) => !hidden.has(id));
}

// The saved layout is opaque ids from an older version of this catalog, so it
// can name previews that no longer exist and omit ones that now do. Dropping and
// appending here is what stops adding an eighth module from stranding every
// existing user on a stale arrangement.
export function reconcile(saved: DashboardLayout | undefined): DashboardLayout {
  const source = saved ?? defaultLayout;

  const known = source.order.filter((id) => previewsById.has(id));
  const seen = new Set(known);
  const order = [
    ...known,
    ...previews.filter((preview) => !seen.has(preview.id)).map((preview) => preview.id),
  ];

  const hidden = new Set(source.hidden.filter((id) => previewsById.has(id)));

  // A preview appended above arrives visible, which can push the grid past six;
  // one removed from the catalog can leave it short. Both are resolved by
  // walking the order and taking the first six as the visible set.
  const visible = order.filter((id) => !hidden.has(id));
  if (visible.length > VISIBLE_SLOTS) {
    for (const id of visible.slice(VISIBLE_SLOTS)) hidden.add(id);
  }
  else {
    for (const id of order) {
      if (visible.length >= VISIBLE_SLOTS) break;
      if (!hidden.has(id)) continue;
      hidden.delete(id);
      visible.push(id);
    }
  }

  return rebuild(order, hidden);
}

/** Swap a visible card one slot earlier (-1) or later (+1). */
export function movePreview(layout: DashboardLayout, id: string, delta: number): DashboardLayout {
  const visible = visibleIds(layout);
  const from = visible.indexOf(id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= visible.length) return layout;

  const next = [...visible];
  [next[from], next[to]] = [next[to], next[from]];
  return rebuild([...next, ...layout.hidden], layout.hidden);
}

export function hidePreview(layout: DashboardLayout, id: string): DashboardLayout {
  if (layout.hidden.includes(id)) return layout;
  return rebuild(layout.order, [...layout.hidden, id]);
}

// Refused rather than displacing anything when the grid is full — the tray says
// what to do about it, so a card never disappears without being asked to.
export function showPreview(layout: DashboardLayout, id: string): DashboardLayout {
  if (!layout.hidden.includes(id)) return layout;
  if (visibleIds(layout).length >= VISIBLE_SLOTS) return layout;
  return rebuild(layout.order, layout.hidden.filter((hiddenId) => hiddenId !== id));
}

// Dropping onto a card puts the dragged one in that card's slot and shifts the
// rest along — the same result in both directions, which is why the insert index
// is the target's original one rather than the post-removal one.
export function dropPreview(
  layout: DashboardLayout,
  draggedId: string,
  targetId: string,
): DashboardLayout {
  if (draggedId === targetId) return layout;

  const visible = visibleIds(layout);
  const to = visible.indexOf(targetId);
  if (to < 0) return layout;

  const hidden = new Set(layout.hidden);
  if (hidden.has(draggedId)) {
    if (visible.length >= VISIBLE_SLOTS) return layout;
    hidden.delete(draggedId);
  }

  const next = visible.filter((id) => id !== draggedId);
  next.splice(to, 0, draggedId);
  return rebuild([...next, ...hidden], hidden);
}
