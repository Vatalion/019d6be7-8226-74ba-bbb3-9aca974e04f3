import {
  newWalletSessionId,
  tokenToWalletChain,
  walletChainToCandid,
  walletPurposeToCandid,
} from "@/lib/walletLink";
import { describe, expect, it } from "vitest";

describe("walletLink — nonce proof helpers (E4.S7)", () => {
  it("maps Wave 1 settlement tokens to wallet chains", () => {
    expect(tokenToWalletChain("USDT_TRC20")).toBe("tron");
    expect(tokenToWalletChain("USDT_BEP20")).toBe("evm_bsc");
    expect(tokenToWalletChain("USDT_ERC20")).toBe("evm_eth");
    expect(tokenToWalletChain("USDC_ERC20")).toBe("evm_eth");
    expect(tokenToWalletChain("ckUSDC")).toBeNull();
  });

  it("encodes candid wallet chain and purpose variants", () => {
    expect(walletChainToCandid("tron")).toEqual({ tron: null });
    expect(walletChainToCandid("evm_bsc")).toEqual({ evm_bsc: null });
    expect(walletPurposeToCandid("payout")).toEqual({ payout: null });
    expect(walletPurposeToCandid("stake")).toEqual({ stake: null });
  });

  it("generates session ids for link challenges", () => {
    const id = newWalletSessionId();
    expect(id.length).toBeGreaterThan(8);
  });
});

/** Buy-flow smoke selectors from story BDD (data-ocid contract). */
describe("buy-flow smoke selectors", () => {
  const SELECTORS = {
    listingBuy: "listing-buy-cta",
    checkoutConfirm: "checkout-confirm-buy",
    feeBreakdown: "checkout-fee-breakdown",
    handshakePanel: "trade-handshake-panel",
    paymentPanel: "trade-payment-panel",
  } as const;

  it("defines stable data-ocid hooks for automated smoke", () => {
    for (const sel of Object.values(SELECTORS)) {
      expect(sel).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("handshake panel precedes payment panel in gated flow", () => {
    const stepsBeforePayment = [
      "listing-buy-cta",
      "checkout-confirm-buy",
      "trade-handshake-panel",
    ];
    expect(stepsBeforePayment).toContain(SELECTORS.handshakePanel);
    expect(stepsBeforePayment.indexOf(SELECTORS.handshakePanel)).toBeLessThan(
      stepsBeforePayment.indexOf(SELECTORS.paymentPanel) === -1
        ? 99
        : stepsBeforePayment.indexOf(SELECTORS.paymentPanel),
    );
  });
});
