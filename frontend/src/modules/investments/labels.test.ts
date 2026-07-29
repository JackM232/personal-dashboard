import { describe, expect, it } from "vitest";
import type { TransactionType } from "./types";
import { formatSigned, gainClass, transactionTotal } from "./labels";

function tx(type: TransactionType, quantity: number, pricePerShare: number, fees: number) {
  return { type, quantity, pricePerShare, fees };
}

describe("transactionTotal", () => {
  it("adds fees to a buy — they are part of what it cost", () => {
    expect(transactionTotal(tx("BUY", 10, 100, 4.95))).toBe(1004.95);
  });

  it("subtracts fees from a sell — they come out of the proceeds", () => {
    expect(transactionTotal(tx("SELL", 10, 100, 4.95))).toBe(995.05);
  });

  it("subtracts fees from a dividend, like a sell", () => {
    expect(transactionTotal(tx("DIVIDEND", 100, 0.24, 0))).toBe(24);
  });

  it("handles fractional shares", () => {
    expect(transactionTotal(tx("BUY", 0.5, 301.5, 0))).toBe(150.75);
  });

  it("is zero for a zero-quantity, zero-fee row rather than NaN", () => {
    expect(transactionTotal(tx("BUY", 0, 100, 0))).toBe(0);
  });
});

describe("formatSigned", () => {
  // formatMoney delegates to toLocaleString, whose currency output depends on
  // the runtime's default locale — assert the sign and the magnitude rather than
  // a literal "$120.00", so the suite does not depend on the machine's locale.
  it("marks a gain with a leading plus", () => {
    expect(formatSigned(120)).toMatch(/^\+.*120\.00$/);
  });

  it("marks a loss with a real minus sign, not a hyphen", () => {
    const result = formatSigned(-120);
    expect(result.startsWith("−")).toBe(true);
    // The value is formatted from its absolute value, so a locale-supplied "-"
    // would mean the sign was applied twice.
    expect(result).not.toContain("-");
    expect(result).toMatch(/120\.00$/);
  });

  it("leaves zero unsigned — there is no direction to report", () => {
    const result = formatSigned(0);
    expect(result.startsWith("+")).toBe(false);
    expect(result.startsWith("−")).toBe(false);
    expect(result).toMatch(/0\.00$/);
  });

  it("renders a dash for a missing or non-finite value", () => {
    expect(formatSigned(null)).toBe("—");
    expect(formatSigned(Number.NaN)).toBe("—");
    expect(formatSigned(Number.POSITIVE_INFINITY)).toBe("—");
  });

  it("always shows cents", () => {
    expect(formatSigned(5)).toMatch(/5\.00$/);
  });
});

describe("gainClass", () => {
  it("names the direction when there is one", () => {
    expect(gainClass(0.01)).toBe("gain-positive");
    expect(gainClass(-0.01)).toBe("gain-negative");
  });

  it("stays neutral for zero", () => {
    // Zero is not green: the class is only applied when something moved.
    expect(gainClass(0)).toBe("");
    expect(gainClass(-0)).toBe("");
  });

  it("stays neutral for a missing or non-finite value", () => {
    expect(gainClass(null)).toBe("");
    expect(gainClass(Number.NaN)).toBe("");
    expect(gainClass(Number.POSITIVE_INFINITY)).toBe("");
  });
});
