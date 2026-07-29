import { describe, expect, it } from "vitest";
import type { MeasurementUnit, RecipeIngredient } from "./types";
import { formatQuantity, ingredientText, unitLabel } from "./labels";

function ingredient(
  quantity: number | null,
  unit: MeasurementUnit | null,
  name: string,
): RecipeIngredient {
  return { quantity, unit, name } as RecipeIngredient;
}

describe("formatQuantity", () => {
  it("snaps a scaled third to a vulgar fraction", () => {
    // 2 cups scaled from 3 servings to 4 is 2.6666666666666665 — the float this
    // rounding exists to keep off the screen.
    expect(formatQuantity(2.6666666666666665)).toBe("2⅔");
    expect(formatQuantity(0.3333333333333333)).toBe("⅓");
    expect(formatQuantity(1.3333333333333333)).toBe("1⅓");
  });

  it("snaps the other kitchen fractions", () => {
    expect(formatQuantity(0.125)).toBe("⅛");
    expect(formatQuantity(0.25)).toBe("¼");
    expect(formatQuantity(0.5)).toBe("½");
    expect(formatQuantity(2.5)).toBe("2½");
    expect(formatQuantity(0.75)).toBe("¾");
  });

  it("rounds to a whole number just below the 0.06 threshold", () => {
    expect(formatQuantity(3.05)).toBe("3");
    expect(formatQuantity(3)).toBe("3");
    // A whole of 0 has to print "0", not the empty string a falsy check gives.
    expect(formatQuantity(0.05)).toBe("0");
  });

  it("rounds up to the next whole above the 0.94 threshold", () => {
    expect(formatQuantity(3.95)).toBe("4");
    expect(formatQuantity(0.95)).toBe("1");
  });

  it("snaps a remainder that is within 0.04 of a fraction", () => {
    expect(formatQuantity(0.09)).toBe("⅛"); // 0.035 from ⅛
    expect(formatQuantity(3.72)).toBe("3¾"); // 0.03 from ¾
  });

  it("falls back to a decimal when no fraction is within 0.04", () => {
    // 0.19 sits in the gap between ⅛ and ¼ — 0.06 from the nearer of the two.
    expect(formatQuantity(1.19)).toBe("1.2");
    expect(formatQuantity(0.45)).toBe("0.5");
  });

  it("rounds anything from 10 up to a whole number", () => {
    // Large amounts are weights or volumes; an eighth of a gram helps nobody.
    expect(formatQuantity(10)).toBe("10");
    expect(formatQuantity(10.4)).toBe("10");
    expect(formatQuantity(12.6)).toBe("13");
  });

  it("renders nothing for a non-finite quantity", () => {
    expect(formatQuantity(Number.NaN)).toBe("");
    expect(formatQuantity(Number.POSITIVE_INFINITY)).toBe("");
  });
});

describe("unitLabel", () => {
  it("pluralises the countable units above one", () => {
    expect(unitLabel("CUP", 2)).toBe("cups");
    expect(unitLabel("CUP", 1)).toBe("cup");
    expect(unitLabel("CUP", 0.5)).toBe("cup");
  });

  it("title-cases a unit with no label override", () => {
    // CLOVE, SLICE, PINCH, CAN and BUNCH are not in LABEL_OVERRIDES, so they
    // come back from humanize() capitalised — "3 Cloves garlic" next to
    // "2 cups flour". Documents current behaviour; see the accompanying report.
    expect(unitLabel("CLOVE", 3)).toBe("Cloves");
    expect(unitLabel("PINCH", 1)).toBe("Pinch");
  });

  it("never pluralises a metric unit", () => {
    expect(unitLabel("G", 500)).toBe("g");
    expect(unitLabel("ML", 250)).toBe("ml");
  });

  it("renders PIECE as nothing so the line reads '3 eggs'", () => {
    expect(unitLabel("PIECE", 3)).toBe("");
  });

  it("renders nothing without a unit", () => {
    expect(unitLabel(null, 3)).toBe("");
  });

  it("leaves the label singular when there is no quantity to judge", () => {
    expect(unitLabel("CUP", null)).toBe("cup");
  });

  it("spells 'to taste' in lower case", () => {
    expect(unitLabel("TO_TASTE", null)).toBe("to taste");
  });
});

describe("ingredientText", () => {
  it("puts 'to taste' after the ingredient, not before it", () => {
    expect(ingredientText(ingredient(null, "TO_TASTE", "Salt"), 1)).toBe("Salt, to taste");
  });

  it("ignores the scale for a 'to taste' ingredient", () => {
    expect(ingredientText(ingredient(2, "TO_TASTE", "Pepper"), 3)).toBe("Pepper, to taste");
  });

  it("scales the quantity and snaps it to a fraction", () => {
    expect(ingredientText(ingredient(2, "CUP", "flour"), 4 / 3)).toBe("2⅔ cups flour");
  });

  it("drops the plural when scaling down past one", () => {
    expect(ingredientText(ingredient(2, "CUP", "flour"), 0.5)).toBe("1 cup flour");
  });

  it("omits the unit for a countable ingredient", () => {
    expect(ingredientText(ingredient(3, "PIECE", "eggs"), 1)).toBe("3 eggs");
  });

  it("is just the name when there is no quantity or unit", () => {
    expect(ingredientText(ingredient(null, null, "Olive oil"), 2)).toBe("Olive oil");
  });
});
