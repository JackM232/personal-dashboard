import { describe, expect, it } from "vitest";
import type { DashboardLayout } from "./types";
import {
  VISIBLE_SLOTS,
  defaultLayout,
  dropPreview,
  hidePreview,
  movePreview,
  previews,
  reconcile,
  showPreview,
} from "./previews";

// Every operation re-imposes this, and the rest of the module reads it back
// rather than recomputing — `visibleIds` is a prefix filter, and showPreview
// counts on an unhidden card landing in the empty slot at the end of the grid.
// Asserting it after each operation is what keeps that assumption honest.
function expectPrefixInvariant(layout: DashboardLayout): void {
  const hidden = new Set(layout.hidden);
  const visible = layout.order.filter((id) => !hidden.has(id));
  expect(layout.order.slice(0, visible.length)).toEqual(visible);
  expect(layout.order.slice(visible.length)).toEqual(layout.hidden);
}

function visible(layout: DashboardLayout): string[] {
  const hidden = new Set(layout.hidden);
  return layout.order.filter((id) => !hidden.has(id));
}

const CATALOG = previews.map((preview) => preview.id);

// The shipped arrangement, already reconciled — the starting point for every
// arrangement test below.
const base = reconcile(undefined);
const BASE_VISIBLE = ["tasks", "gym", "leetcode", "applications", "investments", "projects"];

describe("reconcile", () => {
  it("ships the default layout for a user who has never saved one", () => {
    const result = reconcile(undefined);
    expect(result.order).toEqual(defaultLayout.order);
    expect(result.hidden).toEqual(["recipes"]);
    expectPrefixInvariant(result);
  });

  it("drops a saved id that is no longer in the catalog", () => {
    // What an uninstalled module leaves behind: the server stores opaque ids and
    // never learns that one stopped existing.
    const result = reconcile({ order: ["ghost", "tasks", "gym"], hidden: ["ghost"] });
    expect(result.order).not.toContain("ghost");
    expect(result.hidden).not.toContain("ghost");
    expect(result.order).toEqual(CATALOG);
    expectPrefixInvariant(result);
  });

  it("appends a catalog preview the saved order has never seen", () => {
    // Adding an eighth module has to reach existing users; without this they
    // stay on the arrangement they saved before it existed.
    const saved = {
      order: ["tasks", "gym", "leetcode", "applications", "investments", "recipes"],
      hidden: ["recipes"],
    };
    const result = reconcile(saved);
    expect(result.order).toContain("projects");
    expect(visible(result)).toContain("projects");
    expect(result.hidden).toEqual(["recipes"]);
    expectPrefixInvariant(result);
  });

  it("hides the trailing previews when a saved layout shows more than six", () => {
    const result = reconcile({ order: [...CATALOG], hidden: [] });
    expect(visible(result)).toHaveLength(VISIBLE_SLOTS);
    expect(result.hidden).toEqual(["recipes"]);
    expectPrefixInvariant(result);
  });

  it("backfills from hidden when a saved layout shows fewer than six", () => {
    const result = reconcile({ order: [...CATALOG], hidden: ["projects", "recipes"] });
    expect(visible(result)).toHaveLength(VISIBLE_SLOTS);
    // Backfilled in `order` sequence, so the first hidden card is the one that
    // comes back rather than whichever was hidden most recently.
    expect(visible(result)).toContain("projects");
    expect(result.hidden).toEqual(["recipes"]);
    expectPrefixInvariant(result);
  });

  it("keeps only as many visible as the grid has slots, whatever the input", () => {
    const inputs: (DashboardLayout | undefined)[] = [
      undefined,
      { order: [], hidden: [] },
      { order: ["ghost"], hidden: ["ghost", "phantom"] },
      { order: [...CATALOG].reverse(), hidden: [] },
      { order: [...CATALOG], hidden: [...CATALOG] },
    ];
    for (const input of inputs) {
      const result = reconcile(input);
      expect(result.order).toHaveLength(CATALOG.length);
      expect(visible(result)).toHaveLength(VISIBLE_SLOTS);
      expectPrefixInvariant(result);
    }
  });

  it("is idempotent", () => {
    const once = reconcile({ order: ["ghost", "recipes", "tasks"], hidden: ["gym"] });
    expect(reconcile(once)).toEqual(once);
  });
});

describe("movePreview", () => {
  it("swaps a card one slot earlier", () => {
    const result = movePreview(base, "gym", -1);
    expect(visible(result).slice(0, 2)).toEqual(["gym", "tasks"]);
    expectPrefixInvariant(result);
  });

  it("swaps a card one slot later", () => {
    const result = movePreview(base, "gym", 1);
    expect(visible(result).slice(0, 3)).toEqual(["tasks", "leetcode", "gym"]);
    expectPrefixInvariant(result);
  });

  it("no-ops at the start of the grid", () => {
    expect(movePreview(base, "tasks", -1)).toBe(base);
  });

  it("no-ops at the end of the grid", () => {
    expect(movePreview(base, "projects", 1)).toBe(base);
  });

  it("no-ops for a card that is not on the grid", () => {
    expect(movePreview(base, "recipes", -1)).toBe(base);
  });
});

describe("hidePreview", () => {
  it("moves a visible card into hidden and frees a slot", () => {
    const result = hidePreview(base, "gym");
    expect(visible(result)).toHaveLength(VISIBLE_SLOTS - 1);
    expect(result.hidden).toContain("gym");
    expectPrefixInvariant(result);
  });

  it("no-ops for a card that is already hidden", () => {
    expect(hidePreview(base, "recipes")).toBe(base);
  });
});

describe("showPreview", () => {
  it("is refused when the grid is already full", () => {
    // Refused rather than displacing something — a card never disappears without
    // being asked to.
    expect(showPreview(base, "recipes")).toBe(base);
  });

  it("puts the card in the empty slot at the end of the grid", () => {
    const withRoom = hidePreview(base, "gym");
    const result = showPreview(withRoom, "recipes");
    expect(visible(result)).toHaveLength(VISIBLE_SLOTS);
    expect(visible(result).at(-1)).toBe("recipes");
    expectPrefixInvariant(result);
  });

  it("no-ops for a card that is already visible", () => {
    expect(showPreview(base, "tasks")).toBe(base);
  });
});

describe("dropPreview", () => {
  // Remove-then-insert shifts the indices differently by direction, so both have
  // to be checked: the insert index is the target's *original* slot, which is
  // only correct because the removal happens first.
  it("lands the dragged card in the target's slot dragging left to right", () => {
    const result = dropPreview(base, "tasks", "leetcode");
    expect(visible(result)).toEqual(["gym", "leetcode", "tasks", "applications", "investments", "projects"]);
    expect(visible(result)[BASE_VISIBLE.indexOf("leetcode")]).toBe("tasks");
    expectPrefixInvariant(result);
  });

  it("lands the dragged card in the target's slot dragging right to left", () => {
    const result = dropPreview(base, "projects", "leetcode");
    expect(visible(result)).toEqual(["tasks", "gym", "projects", "leetcode", "applications", "investments"]);
    expect(visible(result)[BASE_VISIBLE.indexOf("leetcode")]).toBe("projects");
    expectPrefixInvariant(result);
  });

  it("moves a card to the first slot", () => {
    const result = dropPreview(base, "investments", "tasks");
    expect(visible(result)[0]).toBe("investments");
    expectPrefixInvariant(result);
  });

  it("moves a card to the last slot", () => {
    const result = dropPreview(base, "tasks", "projects");
    expect(visible(result).at(-1)).toBe("tasks");
    expectPrefixInvariant(result);
  });

  it("refuses a hidden card when the grid is full", () => {
    expect(dropPreview(base, "recipes", "gym")).toBe(base);
  });

  it("accepts a hidden card when a slot is free", () => {
    const withRoom = hidePreview(base, "projects");
    const result = dropPreview(withRoom, "recipes", "gym");
    expect(visible(result)).toEqual(["tasks", "recipes", "gym", "leetcode", "applications", "investments"]);
    expect(result.hidden).toEqual(["projects"]);
    expectPrefixInvariant(result);
  });

  it("no-ops when dropped on itself", () => {
    expect(dropPreview(base, "gym", "gym")).toBe(base);
  });

  it("no-ops when the target is not on the grid", () => {
    expect(dropPreview(base, "gym", "recipes")).toBe(base);
  });

  it("keeps the grid full and the order complete after a drop", () => {
    const result = dropPreview(base, "tasks", "leetcode");
    expect(result.order).toHaveLength(CATALOG.length);
    expect([...result.order].sort()).toEqual([...CATALOG].sort());
    expect(visible(result)).toHaveLength(VISIBLE_SLOTS);
  });
});
