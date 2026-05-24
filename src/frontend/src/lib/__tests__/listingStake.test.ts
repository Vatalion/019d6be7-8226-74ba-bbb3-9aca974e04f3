import { describe, expect, it } from "vitest";
import {
  listingPriceToChainAmount,
  parseDisplayPriceToChainAmount,
} from "../listingStake";

describe("listingStake — safe decimal parsing (F-SWEEP4-003)", () => {
  it("parses 6-decimal prices without Number overflow", () => {
    expect(listingPriceToChainAmount("10.50", "USDT_TRC20" as never)).toBe(
      10_500_000n,
    );
    expect(listingPriceToChainAmount("0.000001", "USDT_TRC20" as never)).toBe(
      1n,
    );
  });

  it("parses 18-decimal prices using BigInt math", () => {
    const token = "USDT_BEP20" as never;
    expect(listingPriceToChainAmount("1", token)).toBe(10n ** 18n);
    expect(listingPriceToChainAmount("1.5", token)).toBe(
      1_500_000_000_000_000_000n,
    );
    expect(
      parseDisplayPriceToChainAmount("999999999999.999999999999999999", 18),
    ).toBe(999_999_999_999_999_999_999_999_999_999n);
  });

  it("rejects invalid or non-positive prices", () => {
    expect(listingPriceToChainAmount("", "USDT_TRC20" as never)).toBeNull();
    expect(listingPriceToChainAmount("abc", "USDT_TRC20" as never)).toBeNull();
    expect(listingPriceToChainAmount("0", "USDT_TRC20" as never)).toBeNull();
    expect(listingPriceToChainAmount("01.5", "USDT_TRC20" as never)).toBeNull();
  });
});
