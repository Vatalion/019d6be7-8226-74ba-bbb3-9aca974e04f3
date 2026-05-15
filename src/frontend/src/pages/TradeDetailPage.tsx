import { ShippingCarrier, TradeStatus, type TradeToken } from "@/backend.d";
import type {
  DigitalDelivery,
  DisputeView,
  ListingCard,
  TradeView,
} from "@/backend.d";
import { DisputeStatus, ResolutionOutcome } from "@/backend.d";
import PaymentVerificationWidget from "@/components/shared/PaymentVerificationWidget";
import { ChatPanel } from "@/components/trade/ChatPanel";
import { DisputeModal } from "@/components/trade/DisputeModal";
import { EscrowTimeline } from "@/components/trade/EscrowTimeline";
import { ShippingTracker } from "@/components/trade/ShippingTracker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBackend } from "@/hooks/useBackend";
import { useLocale } from "@/hooks/useLocale";
import { useVisiblePolling } from "@/hooks/useVisiblePolling";
import { handleResultError } from "@/utils/errorHandler";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Gavel,
  Info,
  Loader2,
  Package,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function formatAmount(amount: bigint, token: TradeToken): string {
  const n = Number(amount) / 1e8;
  return `${n.toFixed(n < 0.01 ? 6 : 4)} ${token}`;
}

function truncatePrincipal(p: string): string {
  if (p.length <= 16) return p;
  return `${p.slice(0, 8)}…${p.slice(-6)}`;
}

function StatusBadge({ status }: { status: TradeStatus }) {
  const { t: tl } = useLocale();
  const map: Record<TradeStatus, { labelKey: string; cls: string }> = {
    pending: {
      labelKey: "trade.status.pending",
      cls: "status-badge-pending",
    },
    funded: { labelKey: "trade.status.funded", cls: "status-badge-funded" },
    awaiting_approval: {
      labelKey: "trade.status.awaiting_approval",
      cls: "status-badge-pending",
    },
    buyer_confirmed: {
      labelKey: "trade.status.buyer_confirmed",
      cls: "status-badge-confirmed",
    },
    payment_verified: {
      labelKey: "trade.status.payment_verified",
      cls: "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-500/25 text-green-700 dark:text-green-200",
    },
    complete: {
      labelKey: "trade.status.complete",
      cls: "status-badge-confirmed",
    },
    refunded: {
      labelKey: "trade.status.refunded",
      cls: "status-badge-pending",
    },
    disputed: {
      labelKey: "trade.status.disputed",
      cls: "status-badge-dispute",
    },
    cancelled: {
      labelKey: "trade.status.cancelled",
      cls: "status-badge-pending",
    },
  };
  const { labelKey, cls } = map[status] ?? {
    labelKey: "trade.status.pending",
    cls: "status-badge-pending",
  };
  return (
    <span className={cls}>{tl(labelKey as Parameters<typeof tl>[0])}</span>
  );
}

function ListingSummaryCard({ listing }: { listing: ListingCard }) {
  const { t: tl } = useLocale();
  return (
    <div
      className="card-elevated p-4 space-y-3"
      data-ocid="listing-summary-card"
    >
      {/* Photo */}
      <div className="w-full h-40 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
        {listing.photos?.[0] ? (
          <img
            src={listing.photos[0]}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="w-10 h-10 text-muted-foreground" />
        )}
      </div>
      <div>
        <h3 className="font-semibold text-foreground text-sm leading-tight">
          {listing.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {listing.category}
        </p>
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {tl("create.field.price")}
        </span>
        <span className="token-chip text-xs">
          {formatAmount(listing.priceAmount, listing.priceToken)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {tl("create.field.condition")}
        </span>
        <Badge variant="secondary" className="text-xs">
          {listing.condition}
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {tl("create.field.location")}
        </span>
        <span className="text-xs text-foreground">{listing.location}</span>
      </div>
    </div>
  );
}

// ─── Network Instruction Panel ───────────────────────────────────────────────

const NETWORK_CONFIG: Record<
  string,
  { accent: string; border: string; bg: string }
> = {
  USDT_TRC20: {
    accent: "text-green-700 dark:text-green-300",
    border: "border-green-500/40",
    bg: "bg-green-500/8",
  },
  USDT_BEP20: {
    accent: "text-yellow-700 dark:text-yellow-300",
    border: "border-yellow-500/40",
    bg: "bg-yellow-500/8",
  },
  USDT_ERC20: {
    accent: "text-blue-700 dark:text-blue-300",
    border: "border-blue-500/40",
    bg: "bg-blue-500/8",
  },
  USDC_ERC20: {
    accent: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-500/40",
    bg: "bg-indigo-500/8",
  },
};

function NetworkInstructionPanel({ token }: { token: TradeToken }) {
  const { t: tl } = useLocale();
  const tokenKey = String(token) as keyof typeof NETWORK_CONFIG;
  const cfg = NETWORK_CONFIG[tokenKey] ?? NETWORK_CONFIG.USDT_TRC20;

  // Only render for approved 4 tokens
  const approved = ["USDT_TRC20", "USDT_BEP20", "USDT_ERC20", "USDC_ERC20"];
  if (!approved.includes(String(token))) return null;

  const titleKey = `trade.instructions.${tokenKey}.title` as Parameters<
    typeof tl
  >[0];
  const bodyKey = `trade.instructions.${tokenKey}.body` as Parameters<
    typeof tl
  >[0];
  const warnKey = `trade.instructions.${tokenKey}.warning` as Parameters<
    typeof tl
  >[0];

  return (
    <div
      className={`rounded-lg border ${cfg.border} ${cfg.bg} p-4 space-y-2`}
      data-ocid="network-instruction-panel"
    >
      <div className={`flex items-center gap-2 ${cfg.accent}`}>
        <Info className="w-4 h-4 shrink-0" />
        <p className="text-sm font-semibold">{tl(titleKey)}</p>
      </div>
      <p className="text-sm text-foreground leading-relaxed">{tl(bodyKey)}</p>
      <div className="flex items-start gap-2 pt-1">
        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <p className="text-sm font-medium text-destructive">{tl(warnKey)}</p>
      </div>
    </div>
  );
}

// ─── Seller Reminder Panel ────────────────────────────────────────────────────

function SellerReminderPanel({
  amount,
  token,
}: {
  amount: bigint;
  token: TradeToken;
}) {
  const { t: tl } = useLocale();
  const displayAmount = formatAmount(amount, token);
  const displayToken = String(token).replace(/_/g, "-");

  const body = tl("trade.sellerReminder.body")
    .replace("{amount}", displayAmount)
    .replace("{token}", displayToken);

  return (
    <div
      className="rounded-lg border border-amber-500/40 bg-amber-500/8 p-4 space-y-2"
      data-ocid="seller-reminder-panel"
    >
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <p className="text-sm font-semibold">
          {tl("trade.sellerReminder.title")}
        </p>
      </div>
      <p className="text-sm text-foreground leading-relaxed">{body}</p>
      <div className="flex items-start gap-2 pt-1">
        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <p className="text-sm font-medium text-destructive">
          {tl("trade.sellerReminder.warning")}
        </p>
      </div>
    </div>
  );
}

function TradeActions({
  trade,
  isBuyer,
  onDisputeOpen,
}: {
  trade: TradeView;
  isBuyer: boolean;
  onDisputeOpen: () => void;
}) {
  const { actor, isFetching: actorFetching } = useBackend();
  const qc = useQueryClient();
  const { t: tl } = useLocale();
  const { isVisible } = useVisiblePolling();

  const navigate = useNavigate();

  // Fetch unified tracking info so we can show the delivery confirmation button
  const { data: trackingInfo } = useQuery({
    queryKey: ["trackingInfo", trade.id.toString()],
    queryFn: async () => {
      const res = await actor!.getUnifiedTrackingInfo(trade.id);
      if (res.__kind__ === "ok") return res.ok;
      return null;
    },
    enabled:
      !!actor &&
      !actorFetching &&
      !isBuyer &&
      (trade.status === TradeStatus.payment_verified ||
        trade.status === TradeStatus.buyer_confirmed ||
        trade.status === TradeStatus.funded),
    staleTime: 20_000,
    refetchInterval: isVisible ? 60_000 : false,
  });

  async function doAction(
    fn: () => Promise<
      { __kind__: "ok"; ok: unknown } | { __kind__: "err"; err: unknown }
    >,
    successMsg: string,
  ) {
    try {
      const res = await fn();
      if (res.__kind__ === "ok") {
        toast.success(successMsg);
        qc.invalidateQueries({ queryKey: ["trade", trade.id.toString()] });
      } else {
        // Delegate all error kinds (rate_limited, unauthorized, invalid_input,
        // escrow_error, banned) to the shared handler.
        handleResultError(
          res as { __kind__?: "err"; err?: Record<string, unknown> },
          navigate,
        );
      }
    } catch {
      toast.error("Unexpected error");
    }
  }

  const s = trade.status;
  const isTerminal = [
    TradeStatus.complete,
    TradeStatus.refunded,
    TradeStatus.cancelled,
  ].includes(s);

  if (isTerminal) return null;

  return (
    <div className="flex flex-col gap-3 mt-4" data-ocid="trade-actions">
      {/* Buyer instruction panel: shown for pending/funded states */}
      {isBuyer && (s === TradeStatus.pending || s === TradeStatus.funded) && (
        <NetworkInstructionPanel token={trade.token as TradeToken} />
      )}

      {/* Seller reminder: shown when buyer_confirmed and awaiting seller confirmation */}
      {!isBuyer && s === TradeStatus.buyer_confirmed && (
        <SellerReminderPanel
          amount={trade.amount}
          token={trade.token as TradeToken}
        />
      )}

      {/* Buyer: confirm payment sent */}
      {isBuyer && s === TradeStatus.pending && (
        <div className="space-y-2">
          <Button
            className="w-full gap-2"
            onClick={() =>
              doAction(
                () => actor!.confirmPaymentSent(trade.id),
                tl("trade.action.buyerSent"),
              )
            }
            data-ocid="btn-payment-sent"
          >
            <Banknote className="w-4 h-4" />
            {tl("trade.action.buyerSent")}
          </Button>
          <p className="text-xs text-muted-foreground text-center px-2">
            {tl("trade.hint.sendOffChain")}
          </p>
        </div>
      )}

      {/* Buyer: verify on blockchain after confirming sent */}
      {isBuyer && s === TradeStatus.buyer_confirmed && (
        <PaymentVerificationWidget
          tradeId={trade.id}
          token={trade.token as TradeToken}
        />
      )}

      {/* Seller: "Confirm Delivery & Release Funds" — shown when tracking says delivered */}
      {!isBuyer &&
        trackingInfo?.isDelivered &&
        (s === TradeStatus.payment_verified ||
          s === TradeStatus.buyer_confirmed) && (
          <Button
            className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
            onClick={() =>
              doAction(
                () => actor!.confirmPaymentReceived(trade.id),
                tl("trade.confirmDeliveryReleaseFunds"),
              )
            }
            data-ocid="confirm-delivery-release-funds-btn"
          >
            <CheckCircle2 className="w-4 h-4" />
            {tl("trade.confirmDeliveryReleaseFunds")}
          </Button>
        )}

      {/* Seller: confirm receipt when payment is verified on-chain (fallback when no tracking delivery) */}
      {!isBuyer &&
        s === TradeStatus.payment_verified &&
        !trackingInfo?.isDelivered && (
          <div className="space-y-2">
            <Button
              className="w-full gap-2"
              onClick={() =>
                doAction(
                  () => actor!.confirmPaymentReceived(trade.id),
                  tl("trade.action.sellerReceived"),
                )
              }
              data-ocid="btn-payment-received-verified"
            >
              <CheckCircle2 className="w-4 h-4" />
              {tl("trade.action.sellerReceived")}
            </Button>
            <p className="text-xs text-muted-foreground text-center px-2">
              {tl("trade.hint.verifyOffChain")}
            </p>
          </div>
        )}

      {/* Seller: manual confirm when funded (pre-verification fallback) */}
      {!isBuyer && s === TradeStatus.funded && !trackingInfo?.isDelivered && (
        <div className="space-y-2">
          <Button
            className="w-full gap-2"
            onClick={() =>
              doAction(
                () => actor!.confirmPaymentReceived(trade.id),
                tl("trade.action.sellerReceived"),
              )
            }
            data-ocid="btn-payment-received"
          >
            <CheckCircle2 className="w-4 h-4" />
            {tl("trade.action.sellerReceived")}
          </Button>
          <p className="text-xs text-muted-foreground text-center px-2">
            {tl("trade.hint.verifyOffChain")}
          </p>
        </div>
      )}

      {isBuyer &&
        [
          TradeStatus.funded,
          TradeStatus.buyer_confirmed,
          TradeStatus.payment_verified,
        ].includes(s) && (
          <Button
            variant="destructive"
            className="w-full gap-2"
            onClick={onDisputeOpen}
            data-ocid="btn-open-dispute"
          >
            <AlertTriangle className="w-4 h-4" />
            {tl("dispute.form.title")}
          </Button>
        )}

      {isBuyer && s === TradeStatus.disputed && (
        <div
          className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5"
          data-ocid="dispute-already-opened"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-sm text-amber-700 dark:text-amber-300">
            {tl("dispute.alreadyOpened")}
          </span>
        </div>
      )}

      {isBuyer && s === TradeStatus.funded && (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() =>
            doAction(
              () => actor!.requestRefund(trade.id),
              tl("trade.status.refunded"),
            )
          }
          data-ocid="btn-request-refund"
        >
          <RotateCcw className="w-4 h-4" />
          {tl("trade.status.refunded")}
        </Button>
      )}

      {[TradeStatus.pending, TradeStatus.funded].includes(s) && (
        <Button
          variant="ghost"
          className="w-full gap-2 text-muted-foreground hover:text-foreground"
          onClick={() =>
            doAction(
              () => actor!.proposeCancelTrade(trade.id),
              tl("trade.cancel"),
            )
          }
          data-ocid="btn-propose-cancel"
        >
          <XCircle className="w-4 h-4" />
          {tl("trade.cancel")}
        </Button>
      )}
    </div>
  );
}

// ─── TTN Controls (seller only) ──────────────────────────────────────────────

const ACTIVE_SHIPPING_STATUSES: TradeStatus[] = [
  TradeStatus.funded,
  TradeStatus.buyer_confirmed,
  TradeStatus.payment_verified,
  TradeStatus.complete,
];

/** Returns the shipping provider string from the trade's shippingSelection, or 'nova_poshta' as fallback */
function getShippingProvider(trade: TradeView): string {
  const sel = trade.shippingSelection;
  if (Array.isArray(sel) && sel.length > 0) return sel[0].provider;
  if (sel && typeof sel === "object" && "provider" in sel)
    return (sel as { provider: string }).provider;
  return "nova_poshta";
}

function TTNControls({
  trade,
  isSeller,
  onManualTTNSaved,
}: {
  trade: TradeView;
  isSeller: boolean;
  onManualTTNSaved?: (ttn: string) => void;
}) {
  const { actor } = useBackend();
  const qc = useQueryClient();
  const { t: tl } = useLocale();
  const [manualTTN, setManualTTN] = useState("");
  const [savedManualTTN, setSavedManualTTN] = useState("");

  const realTrackingNumber: string | null = trade.ttnNumber ?? null;
  const provider = getShippingProvider(trade);

  // Map provider to the section header i18n key
  const ttnSectionKey =
    provider === "ukrposhta"
      ? "trade.ttnSection.ukrposhta"
      : provider === "meest"
        ? "trade.ttnSection.meest"
        : provider === "nova_poshta"
          ? "trade.ttnSection.nova_poshta"
          : "trade.ttnSection.default";

  // Extract variant key from the TTNStatus object
  const ttnStatusKey = Object.keys(trade.ttnCreationStatus)[0] as
    | "Pending"
    | "InProgress"
    | "Success"
    | "Failed";
  const ttnIsPending = ttnStatusKey === "Pending";
  const ttnIsInProgress = ttnStatusKey === "InProgress";
  const ttnIsFailed = ttnStatusKey === "Failed";
  const ttnIsSuccess = ttnStatusKey === "Success";

  const isActiveForShipping = ACTIVE_SHIPPING_STATUSES.includes(trade.status);

  // Route create mutation to correct carrier endpoint
  const createMutation = useMutation({
    mutationFn: () => {
      if (provider === "ukrposhta") return actor!.createUkrposhtaTTN(trade.id);
      if (provider === "meest") return actor!.createMeestTTN(trade.id);
      return actor!.createNovaPoshtaTTN(trade.id);
    },
    onSuccess: (res) => {
      if ("ok" in res) {
        toast.success(tl("trade.ttnSuccess"));
        qc.invalidateQueries({ queryKey: ["trade", trade.id.toString()] });
      } else {
        const errObj = res.err as Record<string, unknown>;
        const errMsg =
          (errObj.invalid_input as string) ??
          (errObj.escrow_error as string) ??
          tl("trade.ttnFailed");
        toast.error(errMsg);
      }
    },
    onError: () => toast.error(tl("trade.ttnFailed")),
  });

  // Route retry mutation to correct carrier endpoint
  const retryMutation = useMutation({
    mutationFn: () => {
      if (provider === "ukrposhta")
        return actor!.retryUkrposhtaTTNCreation(trade.id);
      if (provider === "meest") return actor!.retryMeestTTNCreation(trade.id);
      return actor!.retryTTNCreation(trade.id);
    },
    onSuccess: (res) => {
      if ("ok" in res) {
        toast.success(tl("trade.ttnSuccess"));
        qc.invalidateQueries({ queryKey: ["trade", trade.id.toString()] });
      } else {
        const errObj = res.err as Record<string, unknown>;
        const errMsg =
          (errObj.invalid_input as string) ??
          (errObj.escrow_error as string) ??
          tl("trade.ttnFailed");
        toast.error(errMsg);
      }
    },
    onError: () => toast.error(tl("trade.ttnFailed")),
  });

  // Only show TTN controls for seller in active shipping statuses
  if (!isSeller || !isActiveForShipping) {
    // Non-seller can still see the real tracking number if present
    if (realTrackingNumber) {
      return (
        <div
          className="card-elevated p-4 space-y-2"
          data-ocid="ttn-number-section"
        >
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
            {tl(ttnSectionKey as Parameters<typeof tl>[0])}
          </p>
          <p className="text-sm font-mono text-foreground font-medium">
            {realTrackingNumber}
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="card-elevated p-4 space-y-3" data-ocid="ttn-controls">
      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
        {tl(ttnSectionKey as Parameters<typeof tl>[0])}
      </p>

      {/* If backend TTN exists, show it prominently */}
      {realTrackingNumber && (
        <div
          className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2"
          data-ocid="ttn-backend-number"
        >
          <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm font-mono text-foreground font-medium">
            {realTrackingNumber}
          </span>
        </div>
      )}

      {/* InProgress: spinner */}
      {ttnIsInProgress && (
        <div
          className="flex items-center gap-2 text-muted-foreground"
          data-ocid="ttn-loading-state"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">{tl("trade.ttnCreating")}</span>
        </div>
      )}

      {/* Pending: create button */}
      {ttnIsPending && !ttnIsSuccess && (
        <Button
          size="sm"
          className="w-full gap-2"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          data-ocid="ttn-create-button"
        >
          {createMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Package className="w-4 h-4" />
          )}
          {tl("trade.ttnCreate")}
        </Button>
      )}

      {/* Failed: retry button */}
      {ttnIsFailed && (
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-2"
          onClick={() => retryMutation.mutate()}
          disabled={retryMutation.isPending}
          data-ocid="ttn-retry-button"
        >
          {retryMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RotateCcw className="w-4 h-4" />
          )}
          {tl("trade.ttnRetry")}
        </Button>
      )}

      {/* Manual TTN entry fallback — always visible for seller in active statuses */}
      {!ttnIsInProgress && (
        <div className="space-y-2 pt-1" data-ocid="ttn-manual-section">
          <label
            htmlFor="ttn-manual-input"
            className="text-xs text-muted-foreground"
          >
            {tl("shipping.manualTTN.label")}
          </label>
          {!savedManualTTN ? (
            <div className="flex gap-2">
              <Input
                id="ttn-manual-input"
                value={manualTTN}
                onChange={(e) => setManualTTN(e.target.value)}
                placeholder={tl("shipping.manualTTN.placeholder")}
                className="text-sm h-8"
                data-ocid="ttn-manual-input"
              />
              <Button
                size="sm"
                variant="secondary"
                className="h-8 shrink-0"
                disabled={!manualTTN.trim()}
                onClick={() => {
                  if (manualTTN.trim()) {
                    setSavedManualTTN(manualTTN.trim());
                    onManualTTNSaved?.(manualTTN.trim());
                    toast.success(tl("trade.manualTTNSave"));
                  }
                }}
                data-ocid="ttn-manual-save-button"
              >
                {tl("trade.manualTTNSave")}
              </Button>
            </div>
          ) : (
            <div
              className="flex items-center justify-between"
              data-ocid="ttn-manual-saved"
            >
              <p className="text-sm font-mono text-foreground">
                {savedManualTTN}
              </p>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSavedManualTTN("");
                  setManualTTN("");
                  onManualTTNSaved?.("");
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Digital Delivery Card ────────────────────────────────────────────────────

function CopyButton({
  text,
  label,
  ocid,
}: {
  text: string;
  label: string;
  ocid: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="ml-2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
      aria-label={label}
      data-ocid={ocid}
    >
      {copied ? (
        <CheckCircle2 className="w-4 h-4 text-primary" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}

function DigitalDeliveryCard({
  delivery,
  isBuyer,
  tradeId,
  actor,
}: {
  delivery: DigitalDelivery;
  isBuyer: boolean;
  tradeId: bigint;
  actor: import("../backend.d").backendInterface | null;
}) {
  const { t: tl } = useLocale();
  const qc = useQueryClient();
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState<"item_differs" | "other">(
    "item_differs",
  );
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0 });
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Convert nanosecond timestamp to ms, compute countdown
  useEffect(() => {
    function tick() {
      if (!delivery.inspectionDeadline) {
        setIsExpired(true);
        return;
      }
      const deadlineMs = Number(delivery.inspectionDeadline) / 1_000_000;
      const nowMs = Date.now();
      const diffMs = deadlineMs - nowMs;
      if (diffMs <= 0) {
        setIsExpired(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
        // Trigger auto-release check
        if (actor) {
          actor.checkDigitalInspectionDeadline(tradeId).catch(() => {});
        }
      } else {
        const totalMinutes = Math.floor(diffMs / 60_000);
        setCountdown({
          hours: Math.floor(totalMinutes / 60),
          minutes: totalMinutes % 60,
        });
        setIsExpired(false);
      }
    }
    tick();
    intervalRef.current = setInterval(tick, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [delivery.inspectionDeadline, actor, tradeId]);

  const disputeMutation = useMutation({
    mutationFn: () =>
      actor!.openDigitalDispute(
        tradeId,
        disputeReason === "item_differs" ? "item_differs" : "other",
      ),
    onSuccess: (res) => {
      if ("ok" in res) {
        toast.success(tl("digital.dispute.button"));
        setDisputeOpen(false);
        qc.invalidateQueries({ queryKey: ["trade", tradeId.toString()] });
      } else {
        const errObj = res.err as Record<string, unknown>;
        toast.error(
          (errObj.invalid_input as string) ?? "Failed to open dispute",
        );
      }
    },
    onError: () => toast.error("Failed to open dispute"),
  });

  return (
    <div
      className="card-elevated p-5 space-y-4 border-primary/20"
      data-ocid="digital-delivery-card"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Download className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          {tl("digital.delivery.title")}
        </h3>
      </div>

      <Separator />

      {/* File URL */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {tl("digital.delivery.fileUrl")}
        </p>
        <div className="flex items-center rounded-lg border border-border bg-muted/30 px-3 py-2">
          <a
            href={delivery.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary font-mono truncate flex-1 min-w-0 flex items-center gap-1.5 hover:underline"
            data-ocid="digital-delivery-file-link"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{delivery.fileUrl}</span>
          </a>
          <CopyButton
            text={delivery.fileUrl}
            label={tl("digital.delivery.copyUrl")}
            ocid="digital-delivery-copy-url"
          />
        </div>
      </div>

      {/* Password */}
      {delivery.password && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {tl("digital.delivery.password")}
          </p>
          <div className="flex items-center rounded-lg border border-border bg-muted/30 px-3 py-2">
            <span className="text-sm font-mono text-foreground flex-1 min-w-0 truncate">
              {delivery.password}
            </span>
            <CopyButton
              text={delivery.password}
              label={tl("digital.delivery.copyPassword")}
              ocid="digital-delivery-copy-password"
            />
          </div>
        </div>
      )}

      {/* File hash */}
      {delivery.fileHash && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {tl("digital.delivery.fileHash")}
          </p>
          <div className="flex items-center rounded-lg border border-border bg-muted/30 px-3 py-2">
            <span className="text-xs font-mono text-foreground flex-1 min-w-0 break-all">
              {delivery.fileHash}
            </span>
            <CopyButton
              text={delivery.fileHash}
              label="Copy hash"
              ocid="digital-delivery-copy-hash"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {tl("digital.delivery.hashNote")}
          </p>
        </div>
      )}

      {/* Inspection countdown or expired */}
      {isBuyer && isExpired && (
        <div
          className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2.5"
          data-ocid="digital-inspection-expired"
        >
          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            {tl("digital.delivery.inspectionExpired")}
          </p>
        </div>
      )}
      {isBuyer && !isExpired && (
        <div className="space-y-3">
          <div
            className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5"
            data-ocid="digital-inspection-countdown"
          >
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {tl("digital.delivery.inspectionCountdown")
                .replace("{hours}", String(countdown.hours))
                .replace("{minutes}", String(countdown.minutes))}
            </p>
          </div>

          {/* Open dispute button */}
          {!disputeOpen ? (
            <Button
              variant="destructive"
              size="sm"
              className="w-full gap-2"
              onClick={() => setDisputeOpen(true)}
              data-ocid="digital-dispute-open-button"
            >
              <ShieldAlert className="w-4 h-4" />
              {tl("digital.dispute.button")}
            </Button>
          ) : (
            <div
              className="rounded-lg border border-border bg-card p-4 space-y-3"
              data-ocid="digital-dispute-panel"
            >
              <p className="text-sm font-semibold text-foreground">
                {tl("digital.dispute.title")}
              </p>
              <div className="flex flex-col gap-2">
                {(
                  [
                    {
                      value: "item_differs" as const,
                      label: tl("digital.dispute.reasonItemDiffers"),
                    },
                    {
                      value: "other" as const,
                      label: tl("digital.dispute.reasonOther"),
                    },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setDisputeReason(r.value)}
                    className={[
                      "text-left px-3 py-2.5 rounded-lg border text-sm transition-colors",
                      disputeReason === r.value
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : "border-border bg-background text-foreground hover:border-destructive/40",
                    ].join(" ")}
                    data-ocid={`digital-dispute-reason-${r.value}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setDisputeOpen(false)}
                  data-ocid="digital-dispute-cancel-button"
                >
                  {tl("detail.cancel")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => disputeMutation.mutate()}
                  disabled={disputeMutation.isPending}
                  data-ocid="digital-dispute-submit-button"
                >
                  {disputeMutation.isPending && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {tl("digital.dispute.submit")}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Dispute Status Card ─────────────────────────────────────────────────────

function useJuryDeadlineCountdown(deadlineNs: bigint | undefined): {
  hoursLeft: number;
  expired: boolean;
} {
  const [hoursLeft, setHoursLeft] = useState(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!deadlineNs) {
      setExpired(true);
      return;
    }
    function tick() {
      const deadlineMs = Number(deadlineNs) / 1_000_000;
      const diffMs = deadlineMs - Date.now();
      if (diffMs <= 0) {
        setExpired(true);
        setHoursLeft(0);
      } else {
        setExpired(false);
        setHoursLeft(Math.floor(diffMs / 3_600_000));
      }
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [deadlineNs]);

  return { hoursLeft, expired };
}

function DisputeStatusCard({ dispute }: { dispute: DisputeView }) {
  const { t: tl } = useLocale();
  const juryDeadline = dispute.jury?.deadline;
  const { hoursLeft, expired } = useJuryDeadlineCountdown(juryDeadline);

  const buyerVotes =
    dispute.jury?.votes.filter((v) => v.vote === "buyerWins").length ?? 0;
  const sellerVotes =
    dispute.jury?.votes.filter((v) => v.vote === "sellerWins").length ?? 0;
  const totalJurors = dispute.jury?.jurors.length ?? 0;

  // Resolved
  if (dispute.status === DisputeStatus.resolved && dispute.resolution) {
    const res = dispute.resolution;
    const outcomeKey =
      res.outcome === ResolutionOutcome.buyer_wins
        ? "disputes.resolution.buyerWins"
        : res.outcome === ResolutionOutcome.seller_wins
          ? "disputes.resolution.sellerWins"
          : "disputes.resolution.split";
    return (
      <div
        className="card-elevated p-4 space-y-3 border-primary/30"
        data-ocid="dispute-resolved-card"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {tl(outcomeKey)}
          </span>
        </div>
        {res.notes && (
          <div className="rounded-lg bg-muted/40 px-3 py-2.5 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {tl("disputes.resolution.notes")}
            </p>
            <p className="text-sm text-foreground">{res.notes}</p>
          </div>
        )}
        {dispute.resolvedAt && (
          <p className="text-xs text-muted-foreground">
            {new Date(Number(dispute.resolvedAt) / 1_000_000).toLocaleString()}
          </p>
        )}
      </div>
    );
  }

  // Escalated to admin
  if (dispute.status === DisputeStatus.escalated_to_admin) {
    return (
      <div
        className="card-elevated p-4 space-y-2 border-destructive/30"
        data-ocid="dispute-escalated-card"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <span className="text-sm font-semibold text-foreground">
            {tl("disputes.jury.escalatedToAdmin")}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {tl("disputes.jury.noConsensus")}
        </p>
      </div>
    );
  }

  // Under jury review (opened / under_review)
  return (
    <div
      className="card-elevated p-4 space-y-3 border-amber-500/30"
      data-ocid="dispute-jury-review-card"
    >
      <div className="flex items-center gap-2">
        <Gavel className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <span className="text-sm font-semibold text-foreground">
          {tl("disputes.jury.underReview")}
        </span>
      </div>

      {/* Deadline countdown */}
      {juryDeadline && (
        <div
          className={`flex items-center gap-1.5 text-xs ${expired ? "text-destructive" : "text-amber-600 dark:text-amber-400"}`}
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {expired
            ? tl("disputes.jury.noConsensus")
            : tl("disputes.jury.deadlineCountdown").replace(
                "{{hours}}",
                String(hoursLeft),
              )}
        </div>
      )}

      {/* Vote tally */}
      {totalJurors > 0 && (
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">
            {tl("disputes.jury.voteTally")
              .replace("{{buyer}}", String(buyerVotes))
              .replace("{{seller}}", String(sellerVotes))}
          </div>
          <Badge variant="outline" className="text-[10px]">
            {buyerVotes + sellerVotes}/{totalJurors}
          </Badge>
        </div>
      )}

      {/* Warning: do not release funds */}
      <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-300">
          {tl("disputes.doNotRelease")}
        </p>
      </div>
    </div>
  );
}

function TradeSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </div>
  );
}

export default function TradeDetailPage() {
  const { id: tradeId } = useParams({ from: "/trades/$id" });
  const navigate = useNavigate();
  const { actor, isFetching } = useBackend();
  const { identity } = useInternetIdentity();
  const { t: tl } = useLocale();
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"escrow" | "chat" | "shipping">(
    "escrow",
  );
  const [manualTTNFromControls, setManualTTNFromControls] = useState("");
  const { isVisible, justBecameVisible } = useVisiblePolling();

  const id = BigInt(tradeId);

  const { data: myProfile } = useQuery({
    queryKey: ["myProfile"],
    queryFn: () => actor!.getMyProfile(),
    enabled: !!actor && !isFetching,
  });

  const {
    data: trade,
    isLoading: tradeLoading,
    refetch: refetchTrade,
  } = useQuery({
    queryKey: ["trade", tradeId],
    queryFn: () => actor!.getTrade(id),
    enabled: !!actor && !isFetching,
    refetchInterval: isVisible ? 30_000 : false,
  });

  const { data: listing } = useQuery({
    queryKey: ["listing", trade?.listing?.toString()],
    queryFn: () => actor!.getListing(trade!.listing),
    enabled: !!actor && !isFetching && !!trade,
  });

  const { data: unreadCounts = [] } = useQuery({
    queryKey: ["unreadCounts"],
    queryFn: () => actor!.getUnreadCount(),
    enabled: !!actor && !isFetching,
  });

  // Determine buyer/seller before digital delivery query (hooks must be unconditional)
  const myPrincipal = myProfile?.id?.toString() ?? "";
  const isBuyerCheck = trade ? trade.buyer.toString() === myPrincipal : false;

  // Digital delivery query — always called, but enabled only when conditions are met
  const { data: queriedDelivery, refetch: refetchDelivery } = useQuery({
    queryKey: ["digitalDelivery", trade?.id?.toString() ?? ""],
    queryFn: async () => {
      const res = await actor!.getDigitalDelivery(trade!.id);
      if ("ok" in res) return res.ok;
      return null;
    },
    enabled:
      !!actor &&
      !isFetching &&
      !!trade &&
      isBuyerCheck &&
      trade.status === TradeStatus.complete,
  });

  // Dispute info query — fetch when trade is disputed, poll every 60s for vote tally updates
  const { data: disputes, refetch: refetchDisputes } = useQuery({
    queryKey: ["tradeDisputes", tradeId],
    queryFn: () => actor!.getDisputesByTrade(id),
    enabled:
      !!actor &&
      !isFetching &&
      !!trade &&
      trade.status === TradeStatus.disputed,
    refetchInterval: isVisible ? 60_000 : false,
  });

  // Catch up on missed updates when tab becomes visible after > 30s hidden
  useEffect(() => {
    if (justBecameVisible) {
      void refetchTrade();
      void refetchDisputes();
      void refetchDelivery();
    }
  }, [justBecameVisible, refetchTrade, refetchDisputes, refetchDelivery]);

  if (tradeLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border px-6 py-4">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <TradeSkeleton />
        </div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <span className="text-5xl">🔍</span>
        <p className="text-foreground font-semibold">{tl("detail.notFound")}</p>
        <Button variant="outline" onClick={() => navigate({ to: "/trades" })}>
          {tl("trades.title")}
        </Button>
      </div>
    );
  }

  const isBuyer = isBuyerCheck;
  const isSeller = trade.seller.toString() === myPrincipal;
  const counterparty = isBuyer ? trade.seller : trade.buyer;

  const unreadForTrade =
    unreadCounts.find(([tid]) => tid === trade.id)?.[1] ?? 0n;

  const hasShipping =
    (listing?.shippingMethods?.length ?? 0) > 0 &&
    listing?.shippingMethods?.[0]?.carrier !== ShippingCarrier.digital &&
    listing?.shippingMethods?.[0]?.carrier !== ShippingCarrier.self_pickup;

  const carrier =
    listing?.shippingMethods?.[0]?.carrier ?? ShippingCarrier.nova_poshta;

  // Real tracking number from backend TTN, or manual fallback from TTNControls
  const realTrackingNumber: string | null = trade.ttnNumber ?? null;
  // The effective tracking number: backend TTN takes precedence, else manual TTN entered by seller
  const effectiveTrackingNumber =
    realTrackingNumber ?? (manualTTNFromControls || null);

  // Detect digital trade: either from trade.digitalDelivery, or listing carrier flag
  const isDigitalTrade = !!(
    trade.digitalDelivery ||
    listing?.shippingMethods?.[0]?.carrier === ShippingCarrier.digital
  );

  const digitalDelivery: import("../backend.d").DigitalDelivery | null =
    trade.digitalDelivery ?? queriedDelivery ?? null;

  const activeDispute: DisputeView | null = disputes?.[0] ?? null;

  return (
    <div className="min-h-screen bg-background" data-ocid="trade-detail-page">
      {/* Header */}
      <div className="bg-card border-b border-border px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={() => navigate({ to: "/trades" })}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          aria-label="Back to trades"
          data-ocid="trade-back-btn"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        {/* Mobile: compact single-line header */}
        <div className="flex-1 min-w-0 sm:hidden">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-foreground">
              #{trade.id.toString()}
            </span>
            <StatusBadge status={trade.status} />
            <span className="token-chip text-xs">
              {formatAmount(trade.amount, trade.token)}
            </span>
          </div>
        </div>
        {/* Desktop: original layout */}
        <div className="hidden sm:block flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-semibold text-foreground">
              Trade #{trade.id.toString()}
            </h1>
            <StatusBadge status={trade.status} />
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {isBuyer ? tl("trades.tab.buying") : tl("trades.tab.selling")}:{" "}
            {truncatePrincipal(counterparty.toString())}
          </p>
        </div>
        <div className="hidden sm:block flex-shrink-0">
          <span className="token-chip text-xs">
            {formatAmount(trade.amount, trade.token)}
          </span>
        </div>
      </div>

      {/* Desktop: 3 columns */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-6">
        <div className="hidden lg:grid grid-cols-[280px_1fr_320px] gap-5 h-[calc(100vh-10rem)]">
          {/* Left: Listing summary */}
          <div className="overflow-y-auto space-y-4">
            {listing ? (
              <ListingSummaryCard listing={listing} />
            ) : (
              <div className="card-elevated p-4">
                <Skeleton className="h-40 w-full rounded-lg mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            )}

            {/* Counterparty info */}
            <div className="card-elevated p-4 space-y-2">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                {isBuyer
                  ? tl("detail.viewSellerProfile")
                      .replace("View ", "")
                      .replace(" profile", "")
                  : "Buyer"}
              </p>
              <p className="text-xs font-mono text-foreground break-all">
                {counterparty.toString()}
              </p>
            </div>
          </div>

          {/* Center: Trade timeline + actions */}
          <div className="overflow-y-auto space-y-4">
            <div className="card-elevated p-6">
              <h2 className="text-sm font-semibold text-foreground mb-5">
                {tl("trade.step.initiated")}
              </h2>
              <EscrowTimeline
                status={trade.status}
                createdAt={trade.createdAt}
                fundedAt={trade.fundedAt}
                confirmedAt={trade.confirmedAt}
                completedAt={trade.completedAt}
              />

              <Separator className="my-4" />

              <TradeActions
                trade={trade}
                isBuyer={isBuyer}
                onDisputeOpen={() => setDisputeOpen(true)}
              />
            </div>

            {hasShipping && (
              <TTNControls
                trade={trade}
                isSeller={isSeller}
                onManualTTNSaved={setManualTTNFromControls}
              />
            )}

            {/* Dispute status card — shown when trade is disputed */}
            {trade.status === TradeStatus.disputed && activeDispute && (
              <DisputeStatusCard dispute={activeDispute} />
            )}

            {/* Digital delivery card */}
            {isDigitalTrade &&
              trade.status === TradeStatus.complete &&
              isBuyer &&
              digitalDelivery && (
                <DigitalDeliveryCard
                  delivery={digitalDelivery}
                  isBuyer={isBuyer}
                  tradeId={trade.id}
                  actor={actor}
                />
              )}

            {/* ShippingTracker: shown when there's a real or manual tracking number */}
            {hasShipping && effectiveTrackingNumber && (
              <ShippingTracker
                carrier={carrier}
                trackingNumber={effectiveTrackingNumber}
                tradeId={id}
              />
            )}
          </div>

          {/* Right: Chat */}
          <div className="h-full flex flex-col gap-2">
            {/* Chat status banners — always visible for terminal states */}
            {trade.status === TradeStatus.disputed && (
              <div
                className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5"
                data-ocid="chat-dispute-banner"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {tl("trade.dispute.chatBanner")}
                </p>
              </div>
            )}
            {(trade.status === TradeStatus.cancelled ||
              trade.status === TradeStatus.refunded) && (
              <div
                className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5"
                data-ocid="chat-cancelled-banner"
              >
                <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  {tl("trade.cancelled.chatBanner")}
                </p>
              </div>
            )}
            <div className="flex-1 min-h-0">
              <ChatPanel
                tradeId={trade.id}
                myPrincipal={myPrincipal}
                unreadCount={Number(unreadForTrade)}
                identity={identity ?? undefined}
              />
            </div>
          </div>
        </div>

        {/* Mobile: Tabbed layout */}
        <div className="lg:hidden">
          <Tabs
            value={mobileTab}
            onValueChange={(v) => setMobileTab(v as typeof mobileTab)}
          >
            <TabsList className="w-full mb-3" data-ocid="trade-mobile-tabs">
              <TabsTrigger value="escrow" className="flex-1 text-xs gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {tl("trade.step.initiated")}
              </TabsTrigger>
              <TabsTrigger
                value="chat"
                className="flex-1 text-xs relative gap-1"
              >
                <span className="inline-block w-3.5 h-3.5">💬</span>
                {tl("chat.title")}
                {Number(unreadForTrade) > 0 && (
                  <span className="ml-1 status-badge-funded text-[10px] px-1.5 py-0">
                    {Number(unreadForTrade)}
                  </span>
                )}
              </TabsTrigger>
              {hasShipping && (
                <TabsTrigger value="shipping" className="flex-1 text-xs gap-1">
                  <Package className="w-3.5 h-3.5" />
                  {tl("detail.shipping")}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="escrow" className="space-y-3">
              {listing && <ListingSummaryCard listing={listing} />}

              <div className="card-elevated p-3 sm:p-5">
                <h2 className="text-sm font-semibold text-foreground mb-4">
                  {tl("trade.step.initiated")}
                </h2>
                <EscrowTimeline
                  status={trade.status}
                  createdAt={trade.createdAt}
                  fundedAt={trade.fundedAt}
                  confirmedAt={trade.confirmedAt}
                  completedAt={trade.completedAt}
                />
                <Separator className="my-3" />
                <TradeActions
                  trade={trade}
                  isBuyer={isBuyer}
                  onDisputeOpen={() => setDisputeOpen(true)}
                />
              </div>

              {/* Digital delivery card in escrow tab (mobile) */}
              {isDigitalTrade &&
                trade.status === TradeStatus.complete &&
                isBuyer &&
                digitalDelivery && (
                  <DigitalDeliveryCard
                    delivery={digitalDelivery}
                    isBuyer={isBuyer}
                    tradeId={trade.id}
                    actor={actor}
                  />
                )}

              {/* Dispute status card in escrow tab (mobile) */}
              {trade.status === TradeStatus.disputed && activeDispute && (
                <DisputeStatusCard dispute={activeDispute} />
              )}
            </TabsContent>

            <TabsContent
              value="chat"
              className="flex flex-col gap-2 h-[calc(100vh-13rem)]"
            >
              {/* Chat status banners */}
              {trade.status === TradeStatus.disputed && (
                <div
                  className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 flex-shrink-0"
                  data-ocid="chat-dispute-banner-mobile"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {tl("trade.dispute.chatBanner")}
                  </p>
                </div>
              )}
              {(trade.status === TradeStatus.cancelled ||
                trade.status === TradeStatus.refunded) && (
                <div
                  className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5 flex-shrink-0"
                  data-ocid="chat-cancelled-banner-mobile"
                >
                  <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    {tl("trade.cancelled.chatBanner")}
                  </p>
                </div>
              )}
              <div className="flex-1 min-h-0">
                <ChatPanel
                  tradeId={trade.id}
                  myPrincipal={myPrincipal}
                  unreadCount={Number(unreadForTrade)}
                  identity={identity ?? undefined}
                />
              </div>
            </TabsContent>

            {hasShipping && (
              <TabsContent value="shipping" className="space-y-3">
                <TTNControls
                  trade={trade}
                  isSeller={isSeller}
                  onManualTTNSaved={setManualTTNFromControls}
                />
                {effectiveTrackingNumber && (
                  <ShippingTracker
                    carrier={carrier}
                    trackingNumber={effectiveTrackingNumber}
                    tradeId={id}
                  />
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Dispute modal */}
      {disputeOpen && (
        <DisputeModal
          open={disputeOpen}
          onClose={() => setDisputeOpen(false)}
          tradeId={trade.id}
        />
      )}
    </div>
  );
}
