/**
 * Standalone wallet-link actor bindings (E4.S7).
 * Manual IDL — caffeine-bindgen unavailable; matches src/backend/dist/backend.did.
 */
import { Actor, HttpAgent, type Identity } from "@icp-sdk/core/agent";
import { IDL, type IDL as IDLNamespace } from "@icp-sdk/core/candid";
import type {
  LinkedExternalWallet,
  WalletLinkChallengeView,
} from "../backend.d";
import {
  WalletChain as BackendWalletChain,
  WalletLinkPurpose as BackendWalletLinkPurpose,
} from "../backend.d";
import type { WalletChain, WalletLinkPurpose } from "./walletLink";
import { walletChainToCandid, walletPurposeToCandid } from "./walletLink";

const IC_MAINNET_HOST = "https://icp-api.io";

const Timestamp = IDL.Int;
const Error_ = IDL.Variant({
  already_exists: IDL.Null,
  banned: IDL.Null,
  dispute_already_open: IDL.Null,
  escrow_error: IDL.Text,
  insufficient_funds: IDL.Null,
  invalid_input: IDL.Text,
  not_found: IDL.Null,
  rate_limited: IDL.Null,
  unauthorized: IDL.Null,
});

const WalletChainIdl = IDL.Variant({
  tron: IDL.Null,
  evm_bsc: IDL.Null,
  evm_eth: IDL.Null,
});

const WalletLinkPurposeIdl = IDL.Variant({
  payment: IDL.Null,
  payout: IDL.Null,
  stake: IDL.Null,
});

const WalletLinkChallengeViewIdl = IDL.Record({
  challengeId: IDL.Nat,
  message: IDL.Text,
  expiresAt: Timestamp,
  sessionId: IDL.Text,
  chain: WalletChainIdl,
  address: IDL.Text,
  purpose: WalletLinkPurposeIdl,
});

const LinkedExternalWalletIdl = IDL.Record({
  id: IDL.Nat,
  chain: WalletChainIdl,
  address: IDL.Text,
  purpose: WalletLinkPurposeIdl,
  linkedAt: Timestamp,
  sessionId: IDL.Text,
  messageHash: IDL.Text,
});

const WalletLinkChallengeResult = IDL.Variant({
  ok: WalletLinkChallengeViewIdl,
  err: Error_,
});

const LinkedWalletResult = IDL.Variant({
  ok: LinkedExternalWalletIdl,
  err: Error_,
});

const UnitResult = IDL.Variant({
  ok: IDL.Null,
  err: Error_,
});

const walletLinkIdlFactory: IDLNamespace.InterfaceFactory = ({ IDL: I }) =>
  I.Service({
    requestWalletLinkNonce: I.Func(
      [WalletChainIdl, I.Text, WalletLinkPurposeIdl, I.Text],
      [WalletLinkChallengeResult],
      [],
    ),
    linkExternalWallet: I.Func(
      [I.Nat, I.Text, I.Text],
      [LinkedWalletResult],
      [],
    ),
    getLinkedWallets: I.Func([], [I.Vec(LinkedExternalWalletIdl)], ["query"]),
    unlinkExternalWallet: I.Func([I.Nat], [UnitResult], []),
  });

type WalletLinkActor = {
  requestWalletLinkNonce: (
    chain: ReturnType<typeof walletChainToCandid>,
    address: string,
    purpose: ReturnType<typeof walletPurposeToCandid>,
    sessionId: string,
  ) => Promise<
    { ok: RawWalletLinkChallengeView } | { err: Record<string, unknown> }
  >;
  linkExternalWallet: (
    challengeId: bigint,
    signatureHex: string,
    signedMessage: string,
  ) => Promise<
    { ok: RawLinkedExternalWallet } | { err: Record<string, unknown> }
  >;
  getLinkedWallets: () => Promise<RawLinkedExternalWallet[]>;
  unlinkExternalWallet: (
    walletLinkId: bigint,
  ) => Promise<{ ok: null } | { err: Record<string, unknown> }>;
};

type RawWalletLinkChallengeView = {
  challengeId: bigint;
  message: string;
  expiresAt: bigint;
  sessionId: string;
  chain: Record<string, null>;
  address: string;
  purpose: Record<string, null>;
};

type RawLinkedExternalWallet = {
  id: bigint;
  chain: Record<string, null>;
  address: string;
  purpose: Record<string, null>;
  linkedAt: bigint;
  sessionId: string;
  messageHash: string;
};

function rawChainToWalletChain(chain: Record<string, null>): WalletChain {
  if ("tron" in chain) return "tron";
  if ("evm_bsc" in chain) return "evm_bsc";
  return "evm_eth";
}

function rawPurposeToWalletPurpose(
  purpose: Record<string, null>,
): WalletLinkPurpose {
  if ("payout" in purpose) return "payout";
  if ("stake" in purpose) return "stake";
  return "payment";
}

function mapChallenge(
  raw: RawWalletLinkChallengeView,
): WalletLinkChallengeView {
  const chainKey = rawChainToWalletChain(raw.chain);
  const purposeKey = rawPurposeToWalletPurpose(raw.purpose);
  return {
    challengeId: raw.challengeId,
    message: raw.message,
    expiresAt: raw.expiresAt,
    sessionId: raw.sessionId,
    chain: BackendWalletChain[chainKey],
    address: raw.address,
    purpose: BackendWalletLinkPurpose[purposeKey],
  };
}

function mapLinked(raw: RawLinkedExternalWallet): LinkedExternalWallet {
  const chainKey = rawChainToWalletChain(raw.chain);
  const purposeKey = rawPurposeToWalletPurpose(raw.purpose);
  return {
    id: raw.id,
    chain: BackendWalletChain[chainKey],
    address: raw.address,
    purpose: BackendWalletLinkPurpose[purposeKey],
    linkedAt: raw.linkedAt,
    sessionId: raw.sessionId,
    messageHash: raw.messageHash,
  };
}

async function createWalletLinkActor(
  backendCanisterId: string,
  identity: Identity,
  host = IC_MAINNET_HOST,
): Promise<WalletLinkActor> {
  const agent = new HttpAgent({ host, identity });
  return Actor.createActor<WalletLinkActor>(walletLinkIdlFactory, {
    agent,
    canisterId: backendCanisterId,
  });
}

export async function requestWalletLinkNonceViaClient(
  backendCanisterId: string,
  identity: Identity,
  chain: WalletChain,
  address: string,
  purpose: WalletLinkPurpose,
  sessionId: string,
): Promise<WalletLinkChallengeView | null> {
  try {
    const actor = await createWalletLinkActor(backendCanisterId, identity);
    const result = await actor.requestWalletLinkNonce(
      walletChainToCandid(chain),
      address.trim(),
      walletPurposeToCandid(purpose),
      sessionId,
    );
    if ("ok" in result) return mapChallenge(result.ok);
    return null;
  } catch {
    return null;
  }
}

export async function linkExternalWalletViaClient(
  backendCanisterId: string,
  identity: Identity,
  challengeId: bigint,
  signatureHex: string,
  signedMessage: string,
): Promise<LinkedExternalWallet | null> {
  try {
    const actor = await createWalletLinkActor(backendCanisterId, identity);
    const result = await actor.linkExternalWallet(
      challengeId,
      signatureHex,
      signedMessage,
    );
    if ("ok" in result) return mapLinked(result.ok);
    return null;
  } catch {
    return null;
  }
}

export async function getLinkedWalletsViaClient(
  backendCanisterId: string,
  identity: Identity,
): Promise<LinkedExternalWallet[]> {
  try {
    const actor = await createWalletLinkActor(backendCanisterId, identity);
    const raw = await actor.getLinkedWallets();
    return raw.map(mapLinked);
  } catch {
    return [];
  }
}

export async function unlinkExternalWalletViaClient(
  backendCanisterId: string,
  identity: Identity,
  walletLinkId: bigint,
): Promise<boolean> {
  try {
    const actor = await createWalletLinkActor(backendCanisterId, identity);
    const result = await actor.unlinkExternalWallet(walletLinkId);
    return "ok" in result;
  } catch {
    return false;
  }
}
