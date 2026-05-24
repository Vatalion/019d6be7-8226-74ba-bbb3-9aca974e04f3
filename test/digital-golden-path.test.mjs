/**
 * Digital golden path E2E — upload → pay → download → inspection (X-W2-03).
 * Mock backend state machine; validates AC ordering without live canister.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

/** Minimal digital trade state machine for golden-path regression. */
function digitalGoldenPath(initial) {
  const state = { ...initial };

  return {
    uploadFile(blobHash) {
      assert.match(blobHash, /^sha256:[0-9a-f]{64}$/);
      state.listingStatus = "draft";
      state.blobHash = blobHash;
      return state;
    },
    publishWithStake() {
      assert.ok(state.blobHash, "file required");
      state.listingStatus = "active";
      return state;
    },
    buyerStartTrade() {
      state.tradeStatus = "awaiting_seller_handshake";
      return state;
    },
    sellerConfirmHandshake() {
      state.tradeStatus = "payment_intent";
      return state;
    },
    verifyPayment() {
      state.tradeStatus = "payment_verified";
      return state;
    },
    autoDeliver() {
      assert.equal(state.tradeStatus, "payment_verified");
      state.tradeStatus = "digital_delivered";
      state.deliveryRecordAt = state.now;
      state.inspectionDeadline = state.now + 86_400_000_000_000n;
      return state;
    },
    buyerDownload() {
      assert.ok(state.decryptKeyGranted !== true);
      state.decryptKeyGranted = true;
      // Redownload must not reset inspection timer (E7.S2)
      return state;
    },
    openDisputeWithinWindow() {
      assert.ok(state.now <= state.inspectionDeadline);
      state.tradeStatus = "disputed";
      state.payoutFrozen = true;
      return state;
    },
    inspectionExpireComplete() {
      if (state.tradeStatus === "disputed") {
        throw new Error("auto-complete blocked while disputed");
      }
      assert.ok(state.now > state.inspectionDeadline);
      state.tradeStatus = "complete";
      return state;
    },
    tick(ns) {
      state.now += ns;
      return state;
    },
    get() {
      return { ...state };
    },
  };
}

describe("Digital golden path E2E (mock)", () => {
  it("upload → pay → download → inspection → complete", () => {
    const flow = digitalGoldenPath({
      now: 1_000_000n,
      listingStatus: "draft",
      tradeStatus: "none",
    });

    flow.uploadFile(
      "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );
    flow.publishWithStake();
    flow.buyerStartTrade();
    flow.sellerConfirmHandshake();
    flow.verifyPayment();
    flow.autoDeliver();
    flow.buyerDownload();

    const mid = flow.get();
    assert.equal(mid.tradeStatus, "digital_delivered");
    assert.equal(mid.inspectionDeadline, 1_000_000n + 86_400_000_000_000n);

    flow.tick(86_400_000_000_001n);
    flow.inspectionExpireComplete();
    assert.equal(flow.get().tradeStatus, "complete");
  });

  it("dispute within inspection window freezes payout", () => {
    const flow = digitalGoldenPath({
      now: 0n,
      listingStatus: "active",
      tradeStatus: "digital_delivered",
      deliveryRecordAt: 0n,
      inspectionDeadline: 86_400_000_000_000n,
    });

    flow.openDisputeWithinWindow();
    const s = flow.get();
    assert.equal(s.tradeStatus, "disputed");
    assert.equal(s.payoutFrozen, true);
    assert.throws(() => flow.inspectionExpireComplete());
  });

  it("blocks download before payment verified", () => {
    const flow = digitalGoldenPath({
      now: 0n,
      tradeStatus: "payment_intent",
    });
    assert.throws(() => flow.autoDeliver());
  });
});
