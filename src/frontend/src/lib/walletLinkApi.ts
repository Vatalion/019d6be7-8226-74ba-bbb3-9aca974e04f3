import type { Identity } from "@icp-sdk/core/agent";
import type {
  LinkedExternalWallet,
  WalletLinkChallengeView,
} from "../backend.d";
import { resolveBackendCanisterId } from "./resolveBackendCanisterId";
import type { WalletChain, WalletLinkPurpose } from "./walletLink";
import {
  getLinkedWalletsViaClient,
  linkExternalWalletViaClient,
  requestWalletLinkNonceViaClient,
  unlinkExternalWalletViaClient,
} from "./walletLinkClient";

export async function requestWalletLinkNonce(
  identity: Identity,
  chain: WalletChain,
  address: string,
  purpose: WalletLinkPurpose,
  sessionId: string,
  backendCanisterId?: string,
): Promise<WalletLinkChallengeView | null> {
  const canisterId = backendCanisterId ?? (await resolveBackendCanisterId());
  if (!canisterId) return null;
  return requestWalletLinkNonceViaClient(
    canisterId,
    identity,
    chain,
    address,
    purpose,
    sessionId,
  );
}

export async function linkExternalWallet(
  identity: Identity,
  challengeId: bigint,
  signatureHex: string,
  signedMessage: string,
  backendCanisterId?: string,
): Promise<LinkedExternalWallet | null> {
  const canisterId = backendCanisterId ?? (await resolveBackendCanisterId());
  if (!canisterId) return null;
  return linkExternalWalletViaClient(
    canisterId,
    identity,
    challengeId,
    signatureHex,
    signedMessage,
  );
}

export async function getLinkedWallets(
  identity: Identity,
  backendCanisterId?: string,
): Promise<LinkedExternalWallet[]> {
  const canisterId = backendCanisterId ?? (await resolveBackendCanisterId());
  if (!canisterId) return [];
  return getLinkedWalletsViaClient(canisterId, identity);
}

export async function unlinkExternalWallet(
  identity: Identity,
  walletLinkId: bigint,
  backendCanisterId?: string,
): Promise<boolean> {
  const canisterId = backendCanisterId ?? (await resolveBackendCanisterId());
  if (!canisterId) return false;
  return unlinkExternalWalletViaClient(canisterId, identity, walletLinkId);
}
