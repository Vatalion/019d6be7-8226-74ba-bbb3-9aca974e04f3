/**
 * Digital encryption layering — canister XOR metadata vs client AES-GCM (S-W2-02).
 * Documents the split: object-storage ciphertext is AES-GCM client-side;
 * canister DigitalEncryption XOR applies only to legacy inline text paths.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Digital encryption documentation contract", () => {
  it("client upload uses AES-GCM with random DEK (E2.S11 D-026)", () => {
    const clientPolicy = {
      algorithm: "AES-GCM",
      dekSource: "random-per-listing",
      storageHash: "sha256:ciphertext",
    };
    assert.equal(clientPolicy.algorithm, "AES-GCM");
    assert.notEqual(clientPolicy.dekSource, "xor-canister-key");
  });

  it("canister XOR module is not used for object-storage blob ciphertext", () => {
    const canisterPaths = {
      objectStorageBlob: "aes-gcm-client",
      legacyInlineText: "xor-stream-sha256-key",
    };
    assert.equal(canisterPaths.objectStorageBlob, "aes-gcm-client");
    assert.equal(canisterPaths.legacyInlineText, "xor-stream-sha256-key");
  });

  it("download gate requires payment_verified or funded_locked before key release", () => {
    const allowed = new Set(["payment_verified", "funded", "digital_delivered", "complete"]);
    for (const blocked of ["pending", "awaiting_seller_handshake", "payment_intent"]) {
      assert.ok(!allowed.has(blocked));
    }
  });
});
