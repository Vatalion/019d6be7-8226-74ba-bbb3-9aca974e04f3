import { PaymentVerificationStatus, type TradeToken } from "@/backend.d";
import type { PaymentVerificationResult } from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBackend } from "@/hooks/useBackend";
import { useLocale } from "@/hooks/useLocale";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Search, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { TranslationKey } from "../../i18n";

/** Map a TradeToken to its i18n key — only the 4 approved tokens */
function networkLabelKey(token: TradeToken): TranslationKey {
  const map: Partial<Record<string, TranslationKey>> = {
    USDT_TRC20: "network.USDT_TRC20",
    USDT_BEP20: "network.USDT_BEP20",
    USDT_ERC20: "network.USDT_ERC20",
    USDC_ERC20: "network.USDC_ERC20",
  };
  return (map[String(token)] ?? "network.USDT_TRC20") as TranslationKey;
}

interface VerificationStatusProps {
  result: PaymentVerificationResult;
}

function VerificationStatus({ result }: VerificationStatusProps) {
  const { t } = useLocale();

  if (result.status === PaymentVerificationStatus.pending) {
    return (
      <div
        className={cn(
          "verification-indicator verification-pending pulse-subtle gap-2",
        )}
        data-ocid="verification-status-pending"
        aria-live="polite"
        aria-atomic="true"
      >
        <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
        <div className="min-w-0">
          <p className="font-semibold text-sm">{t("verify.statusPending")}</p>
          <p className="text-xs opacity-80 mt-0.5">
            {t("verify.statusPendingDesc")}
          </p>
        </div>
      </div>
    );
  }

  if (result.status === PaymentVerificationStatus.verified) {
    return (
      <div
        className={cn(
          "verification-indicator verification-verified flex-col items-start",
        )}
        data-ocid="verification-status-verified"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 w-full">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <p className="font-semibold text-sm">{t("verify.statusVerified")}</p>
        </div>
        <p className="text-xs opacity-80 mt-1">
          {t("verify.statusVerifiedDesc")}
        </p>
        {result.blockNumber > 0n && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs w-full">
            <span className="opacity-70">{t("verify.blockNumber")}</span>
            <span className="font-mono">{result.blockNumber.toString()}</span>
            {result.confirmedAmount > 0 && (
              <>
                <span className="opacity-70">
                  {t("verify.confirmedAmount")}
                </span>
                <span className="font-mono">{result.confirmedAmount}</span>
              </>
            )}
            {result.confirmedRecipient && (
              <>
                <span className="opacity-70">
                  {t("verify.confirmedRecipient")}
                </span>
                <span className="font-mono truncate">
                  {result.confirmedRecipient}
                </span>
              </>
            )}
          </div>
        )}
        <p className="text-xs font-medium mt-2 opacity-90">
          {t("verify.sellerCanConfirm")}
        </p>
      </div>
    );
  }

  // failed
  return (
    <div
      className={cn(
        "verification-indicator verification-failed flex-col items-start",
      )}
      data-ocid="verification-status-failed"
      aria-live="assertive"
    >
      <div className="flex items-center gap-2 w-full">
        <XCircle className="w-4 h-4 shrink-0" />
        <p className="font-semibold text-sm">{t("verify.statusFailed")}</p>
      </div>
      {result.errorReason && (
        <p className="text-xs opacity-80 mt-1 font-mono break-all">
          {result.errorReason}
        </p>
      )}
      <p className="text-xs mt-1 opacity-70">{t("verify.statusFailedRetry")}</p>
    </div>
  );
}

interface PaymentVerificationWidgetProps {
  tradeId: bigint;
  token: TradeToken;
}

export default function PaymentVerificationWidget({
  tradeId,
  token,
}: PaymentVerificationWidgetProps) {
  const { t } = useLocale();
  const { actor, isFetching } = useBackend();
  const qc = useQueryClient();
  const [txHash, setTxHash] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll verification status every 5s while pending
  const { data: verificationResult } = useQuery({
    queryKey: ["paymentVerification", tradeId.toString()],
    queryFn: () => actor!.getPaymentVerificationStatus(tradeId),
    enabled: !!actor && !isFetching && submitted,
    refetchInterval: (query) => {
      const result = query.state.data;
      if (!result) return 5000;
      return result.status === PaymentVerificationStatus.pending ? 5000 : false;
    },
  });

  // When verification reaches a terminal state, refresh the trade
  useEffect(() => {
    if (
      verificationResult?.status === PaymentVerificationStatus.verified ||
      verificationResult?.status === PaymentVerificationStatus.failed
    ) {
      qc.invalidateQueries({ queryKey: ["trade", tradeId.toString()] });
    }
  }, [verificationResult?.status, qc, tradeId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      const res = await actor.verifyPayment(tradeId, txHash.trim(), token);
      if (res.__kind__ === "err") {
        throw new Error(JSON.stringify(res.err));
      }
      return res.ok;
    },
    onSuccess: () => {
      setSubmitted(true);
      qc.invalidateQueries({
        queryKey: ["paymentVerification", tradeId.toString()],
      });
    },
    onError: () => {
      toast.error(t("verify.errorSubmit"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txHash.trim()) return;
    submitMutation.mutate();
  };

  const isPending =
    verificationResult?.status === PaymentVerificationStatus.pending;
  const isVerified =
    verificationResult?.status === PaymentVerificationStatus.verified;

  return (
    <div
      className="card-elevated p-5 space-y-4"
      data-ocid="payment-verification-widget"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-primary/10 shrink-0">
          <Search className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            {t("verify.title")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("verify.subtitle")}
          </p>
        </div>
      </div>

      {/* Network display */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground font-medium">
          {t("verify.networkLabel")}
        </span>
        <span className="token-chip text-xs self-start">
          {t(networkLabelKey(token))}
        </span>
        <span className="text-[10px] text-muted-foreground italic">
          {t("verify.networkAutoDetected")}
        </span>
      </div>

      {/* Input form — hide once verified */}
      {!isVerified && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label
              htmlFor="txHash"
              className="text-xs font-medium text-foreground"
            >
              {t("verify.txHashLabel")}
            </Label>
            <Input
              id="txHash"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder={t("verify.txHashPlaceholder")}
              className="font-mono text-xs"
              disabled={submitMutation.isPending || isPending}
              data-ocid="input-tx-hash"
              aria-label={t("verify.txHashLabel")}
            />
          </div>
          <Button
            type="submit"
            className="w-full gap-2"
            disabled={!txHash.trim() || submitMutation.isPending || isPending}
            data-ocid="btn-verify-payment"
          >
            {submitMutation.isPending || isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("verify.verifying")}
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                {t("verify.submitBtn")}
              </>
            )}
          </Button>
        </form>
      )}

      {/* Verification result */}
      {verificationResult && <VerificationStatus result={verificationResult} />}
    </div>
  );
}
