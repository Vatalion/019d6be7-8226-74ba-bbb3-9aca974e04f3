import type {
  ListingId,
  ShippingCarrier,
  ShippingSelection,
  TradeId,
  TradeToken,
  backendInterface,
} from "@/backend.d";

type TradeFlowActor = Pick<
  backendInterface,
  "getPlatformFlags" | "initiateOnChainTrade" | "initiateTrade"
>;
import {
  extractError,
  handleBackendError,
  isBackendError,
} from "@/utils/errorHandler";
import { NOVA_POSHTA_SHIPPING_OPTION } from "./deliveryPolicy";
import { icrc2ApproveEscrowSpend } from "./icrcEscrow";
import {
  type PlatformFlags,
  isOnChainToken,
  ledgerCanisterIdForToken,
} from "./onChainTokens";
import { resolveBackendCanisterId } from "./resolveBackendCanisterId";

const IC_MAINNET_HOST = "https://icp-api.io";

export function buildShippingSelection(
  carrier: ShippingCarrier,
): ShippingSelection {
  return {
    provider: carrier,
    cost: NOVA_POSHTA_SHIPPING_OPTION.costNat,
    deliveryType: "warehouse",
  };
}

async function fetchPlatformFlags(
  actor: TradeFlowActor,
): Promise<PlatformFlags> {
  const raw = await actor.getPlatformFlags();
  return {
    trustlessEscrowEnabled: raw.trustlessEscrowEnabled,
    ckUsdcLedgerId: raw.ckUsdcLedgerId,
    ckUsdtLedgerId: raw.ckUsdtLedgerId,
  };
}

/** Post-handshake ck lock — buyer calls after seller PaymentIntent (#ck path). */
export async function lockOnChainTrade(
  actor: TradeFlowActor,
  tradeId: TradeId,
  token: TradeToken,
  lockAmount: bigint,
  options?: {
    navigate?: (opts: { to: string; params?: { id: string } }) => void;
    identity?: import("@icp-sdk/core/agent").Identity;
    host?: string;
  },
): Promise<boolean> {
  if (!options?.identity) {
    handleBackendError(
      { invalid_input: "Internet Identity required for on-chain escrow" },
      options?.navigate,
    );
    return false;
  }

  const flags = await fetchPlatformFlags(actor);

  const ledgerId = ledgerCanisterIdForToken(
    token,
    flags.ckUsdcLedgerId,
    flags.ckUsdtLedgerId,
  );
  if (!ledgerId) {
    handleBackendError(
      { escrow_error: "Token does not support on-chain escrow" },
      options?.navigate,
    );
    return false;
  }

  const backendCanisterId = await resolveBackendCanisterId();
  if (!backendCanisterId) {
    throw new Error("backend_canister_id not configured");
  }
  const host = options.host ?? IC_MAINNET_HOST;

  try {
    await icrc2ApproveEscrowSpend({
      ledgerCanisterId: ledgerId,
      backendCanisterId,
      amount: lockAmount,
      identity: options.identity,
      host,
    });
  } catch (e) {
    handleBackendError(
      {
        escrow_error: e instanceof Error ? e.message : "ICRC-2 approve failed",
      },
      options?.navigate,
    );
    return false;
  }

  const result = await actor.initiateOnChainTrade(tradeId);
  if (isBackendError(result)) {
    handleBackendError(extractError(result), options?.navigate);
    return false;
  }
  return true;
}

export async function initiateListingTrade(
  actor: TradeFlowActor,
  listingId: ListingId,
  priceToken: TradeToken,
  carrier: ShippingCarrier | null,
  options?: {
    navigate?: (opts: { to: string; params?: { id: string } }) => void;
    identity?: import("@icp-sdk/core/agent").Identity;
    amount?: bigint;
    host?: string;
  },
): Promise<bigint | null> {
  if (isOnChainToken(priceToken)) {
    const flags = await fetchPlatformFlags(actor);
    if (!flags.trustlessEscrowEnabled) {
      handleBackendError(
        {
          escrow_error:
            "On-chain ck escrow is disabled pending Gate C sign-off.",
        },
        options?.navigate,
      );
      return null;
    }
  }

  const shipping = carrier != null ? buildShippingSelection(carrier) : null;
  const result = await actor.initiateTrade(listingId, priceToken, shipping);
  if (isBackendError(result)) {
    handleBackendError(extractError(result), options?.navigate);
    return null;
  }
  const tradeId = (result as { ok?: bigint }).ok;
  if (tradeId == null) return null;
  return tradeId;
}
