import { Actor, HttpAgent, type Identity } from "@icp-sdk/core/agent";
import { IDL, type IDL as IDLNamespace } from "@icp-sdk/core/candid";
import type { TradeToken } from "../backend";
import { resolveBackendCanisterId } from "./resolveBackendCanisterId";

const IC_MAINNET_HOST = "https://icp-api.io";

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

const TradeTokenIdl = IDL.Variant({
  ckUSDC: IDL.Null,
  ckUSDT: IDL.Null,
  USDT_TRC20: IDL.Null,
  USDT_BEP20: IDL.Null,
  USDC_SPL: IDL.Null,
  USDT_ERC20: IDL.Null,
  USDC_ERC20: IDL.Null,
  USDT_POLYGON: IDL.Null,
  USDC_POLYGON: IDL.Null,
  USDT_AVAX: IDL.Null,
  USDC_AVAX: IDL.Null,
});

const StakeBalanceIdl = IDL.Record({
  available: IDL.Nat,
  locked: IDL.Nat,
});

const UnitResult = IDL.Variant({
  ok: IDL.Null,
  err: Error_,
});

const stakeIdlFactory: IDLNamespace.InterfaceFactory = ({ IDL: I }) =>
  I.Service({
    getRequiredListingStake: I.Func([I.Nat, TradeTokenIdl], [I.Nat], ["query"]),
    getMyStakeBalance: I.Func([TradeTokenIdl], [StakeBalanceIdl], ["query"]),
    depositStake: I.Func([TradeTokenIdl, I.Nat], [UnitResult], []),
    publishListing: I.Func([I.Nat], [UnitResult], []),
  });

export type StakeBalanceView = {
  available: bigint;
  locked: bigint;
};

type StakeActor = {
  getRequiredListingStake: (
    priceAmount: bigint,
    token: Record<string, null>,
  ) => Promise<bigint>;
  getMyStakeBalance: (token: Record<string, null>) => Promise<StakeBalanceView>;
  depositStake: (
    token: Record<string, null>,
    amount: bigint,
  ) => Promise<{ ok: null } | { err: unknown }>;
  publishListing: (
    listingId: bigint,
  ) => Promise<{ ok: null } | { err: unknown }>;
};

function tradeTokenToCandid(token: TradeToken): Record<string, null> {
  const key = Object.keys(token)[0] as keyof TradeToken;
  return { [key]: null } as Record<string, null>;
}

async function createStakeActor(
  backendCanisterId: string,
  identity: Identity,
): Promise<StakeActor> {
  const agent = new HttpAgent({ host: IC_MAINNET_HOST, identity });
  return Actor.createActor<StakeActor>(stakeIdlFactory, {
    agent,
    canisterId: backendCanisterId,
  });
}

export async function fetchRequiredListingStake(
  backendCanisterId: string,
  priceAmount: bigint,
  token: TradeToken,
): Promise<bigint | null> {
  try {
    const agent = new HttpAgent({ host: IC_MAINNET_HOST });
    const actor = Actor.createActor<StakeActor>(stakeIdlFactory, {
      agent,
      canisterId: backendCanisterId,
    });
    return await actor.getRequiredListingStake(
      priceAmount,
      tradeTokenToCandid(token),
    );
  } catch {
    return null;
  }
}

export async function fetchMyStakeBalance(
  backendCanisterId: string,
  identity: Identity,
  token: TradeToken,
): Promise<StakeBalanceView | null> {
  try {
    const actor = await createStakeActor(backendCanisterId, identity);
    return await actor.getMyStakeBalance(tradeTokenToCandid(token));
  } catch {
    return null;
  }
}

export async function depositListingStake(
  identity: Identity,
  token: TradeToken,
  amount: bigint,
  backendCanisterId?: string,
): Promise<{ ok: true } | { err: unknown }> {
  const canisterId = backendCanisterId ?? (await resolveBackendCanisterId());
  if (!canisterId)
    return { err: { invalid_input: "Missing backend canister id" } };
  try {
    const actor = await createStakeActor(canisterId, identity);
    const result = await actor.depositStake(tradeTokenToCandid(token), amount);
    if ("ok" in result) return { ok: true };
    return { err: result.err };
  } catch (e) {
    return { err: e };
  }
}

export async function publishDraftListing(
  identity: Identity,
  listingId: bigint,
  backendCanisterId?: string,
): Promise<{ ok: true } | { err: unknown }> {
  const canisterId = backendCanisterId ?? (await resolveBackendCanisterId());
  if (!canisterId)
    return { err: { invalid_input: "Missing backend canister id" } };
  try {
    const actor = await createStakeActor(canisterId, identity);
    const result = await actor.publishListing(listingId);
    if ("ok" in result) return { ok: true };
    return { err: result.err };
  } catch (e) {
    return { err: e };
  }
}
