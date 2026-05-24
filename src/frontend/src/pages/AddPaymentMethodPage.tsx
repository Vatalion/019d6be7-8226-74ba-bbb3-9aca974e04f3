// AddPaymentMethodPage — manage seller payment methods (wallet addresses).
// Backend persistence via getPaymentMethods / addPaymentMethod endpoints.
// localStorage kept as fallback for unauthenticated / initializing state.

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  Shield,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AddressInputWithHints } from "../components/payment/AddressInputWithHints";
import { useAuth } from "../hooks/useAuth";
import { useBackend } from "../hooks/useBackend";
import {
  addPaymentMethodToBackend,
  getPaymentMethodsFromBackend,
  verifyAddress,
} from "../hooks/useBackend";
import type { AddressVerification, PaymentMethod } from "../hooks/useBackend";
import { useLocale } from "../hooks/useLocale";
import {
  newWalletSessionId,
  signWalletLinkMessage,
  tokenToWalletChain,
} from "../lib/walletLink";
import {
  linkExternalWallet,
  requestWalletLinkNonce,
} from "../lib/walletLinkApi";
import { NETWORK_HINTS, TOKEN_LABELS } from "../utils/addressDetector";

const STORAGE_KEY = "seller_payment_methods";

interface LegacySavedMethod {
  token: string;
  address: string;
  addedAt: string;
}

function loadLegacyMethods(): LegacySavedMethod[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LegacySavedMethod[];
  } catch {
    return [];
  }
}

function truncateAddress(addr: string): string {
  if (addr.length <= 20) return addr;
  return `${addr.slice(0, 10)}…${addr.slice(-8)}`;
}

type VerifyState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "active"; txCount: number }
  | { status: "inactive" }
  | { status: "failed" };

function VerificationBadge({
  verification,
}: {
  verification: AddressVerification | undefined;
}) {
  const { t } = useLocale();

  if (!verification) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-muted-foreground"
        title={t("payment.badge.unverified")}
      >
        <Shield className="h-3.5 w-3.5" />
        {t("payment.badge.unverified")}
      </span>
    );
  }

  if (verification.active && Number(verification.txCount) > 0) {
    const verifiedDate = new Date(
      Number(verification.verifiedAt) / 1_000_000,
    ).toLocaleDateString();
    const expiresDate = new Date(
      Number(verification.expiresAt) / 1_000_000,
    ).toLocaleDateString();
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400"
        title={`Level ${Number(verification.level)} · ${Number(verification.txCount)} tx · verified ${verifiedDate} · expires ${expiresDate}`}
      >
        <Shield className="h-3.5 w-3.5 fill-green-500/20" />
        {t("payment.badge.level2")}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400"
      title={t("payment.badge.formatValid")}
    >
      <Shield className="h-3.5 w-3.5" />
      {t("payment.badge.formatValid")}
    </span>
  );
}

export default function AddPaymentMethodPage() {
  const { t } = useLocale();
  const { isAuthenticated, isInitializing, login, identity } = useAuth();
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  const [address, setAddress] = useState("");
  const [selectedToken, setSelectedToken] = useState("USDT_TRC20");
  const [isLinkingWallet, setIsLinkingWallet] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [verifyState, setVerifyState] = useState<VerifyState>({
    status: "idle",
  });

  // Track current address/token in a ref so the verify handler always reads latest
  const addressRef = useRef(address);
  const tokenRef = useRef(selectedToken);
  useEffect(() => {
    addressRef.current = address;
    tokenRef.current = selectedToken;
    // Reset verify state when address/token changes
    setVerifyState({ status: "idle" });
  }, [address, selectedToken]);

  // Load payment methods from backend
  const { data: backendMethods, isLoading: methodsLoading } = useQuery<
    PaymentMethod[]
  >({
    queryKey: ["paymentMethods"],
    queryFn: () => getPaymentMethodsFromBackend(actor!),
    enabled: !!actor && isAuthenticated,
  });

  // Fallback to localStorage for unauthenticated state
  const [legacyMethods] = useState<LegacySavedMethod[]>(() =>
    loadLegacyMethods(),
  );

  // Derive displayed methods: backend for authenticated users only
  const isMethodsPending =
    isAuthenticated &&
    (!actor || methodsLoading || backendMethods === undefined);

  const displayMethods: PaymentMethod[] = isAuthenticated
    ? (backendMethods ?? [])
    : legacyMethods.map((m) => ({
        token: m.token as PaymentMethod["token"],
        address: m.address,
        addedAt: BigInt(0),
        verification: undefined,
        walletLinkId: 0n,
      }));

  // Real-time address validation check
  const hint = NETWORK_HINTS[selectedToken];
  const isAddressValid = hint ? hint.validate(address.trim()) : false;

  // Auth gate loading
  if (isInitializing) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-[60vh] items-center justify-center px-4">
        <div className="text-center max-w-sm space-y-4">
          <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">
            {t("vault.signInRequired")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("vault.signInDesc")}
          </p>
          <Button
            onClick={login}
            className="w-full"
            data-ocid="payment.sign_in_button"
          >
            {t("nav.connect")}
          </Button>
        </div>
      </div>
    );
  }

  const handleVerify = async () => {
    if (!actor || !isAddressValid) return;
    setVerifyState({ status: "loading" });
    const result = await verifyAddress(
      actor,
      tokenRef.current,
      addressRef.current,
    );
    if (!result) {
      setVerifyState({ status: "failed" });
      return;
    }
    if (result.txCount > 0 && result.active) {
      setVerifyState({ status: "active", txCount: result.txCount });
    } else {
      setVerifyState({ status: "inactive" });
    }
  };

  const handleWalletLinkProof = async () => {
    const trimmed = address.trim();
    if (!trimmed || !identity || identity.getPrincipal().isAnonymous()) return;
    const chain = tokenToWalletChain(selectedToken);
    if (!chain) {
      toast.error(t("walletLink.unsupportedToken"));
      return;
    }
    setIsLinkingWallet(true);
    try {
      const sessionId = newWalletSessionId();
      const challenge = await requestWalletLinkNonce(
        identity,
        chain,
        trimmed,
        "payout",
        sessionId,
      );
      if (!challenge) {
        toast.error(t("walletLink.challengeFailed"));
        return;
      }
      const signature = await signWalletLinkMessage(
        chain,
        trimmed,
        challenge.message,
      );
      const linked = await linkExternalWallet(
        identity,
        challenge.challengeId,
        signature,
        challenge.message,
      );
      if (!linked) {
        toast.error(t("walletLink.linkFailed"));
        return;
      }
      toast.success(t("walletLink.linked"));
      await queryClient.invalidateQueries({ queryKey: ["linkedWallets"] });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("walletLink.linkFailed"),
      );
    } finally {
      setIsLinkingWallet(false);
    }
  };

  const handleSave = async () => {
    const trimmed = address.trim();
    if (!trimmed || !actor) return;

    // Prevent duplicates
    const isDuplicate = displayMethods.some(
      (m) => (m.token as string) === selectedToken && m.address === trimmed,
    );
    if (isDuplicate) {
      toast.error(t("payment.save"));
      return;
    }

    setIsSaving(true);
    try {
      const saved = await addPaymentMethodToBackend(
        actor,
        selectedToken,
        trimmed,
        false,
      );
      if (!saved) {
        toast.error(t("payment.verificationFailed"));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
      setAddress("");
      setVerifyState({ status: "idle" });
      toast.success(t("payment.saved"), { duration: 4000 });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            {t("payment.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("payment.savedMethods")}
          </p>
        </div>

        {/* Add form */}
        <Card data-ocid="payment.add_form_card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("payment.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddressInputWithHints
              value={address}
              onChange={setAddress}
              selectedToken={selectedToken}
              onTokenChange={setSelectedToken}
            />

            {/* Verify Address button — shown when address is valid */}
            {isAddressValid && address.trim() && (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleVerify}
                  disabled={verifyState.status === "loading"}
                  className="gap-1.5"
                  data-ocid="payment.verify_button"
                >
                  {verifyState.status === "loading" ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {t("payment.verifying")}
                    </>
                  ) : (
                    <>
                      <Shield className="h-3.5 w-3.5" />
                      {t("payment.verifyButton")}
                    </>
                  )}
                </Button>

                {/* Verification result */}
                {verifyState.status === "active" && (
                  <p
                    className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1"
                    data-ocid="payment.verify_success_state"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    {t("payment.verifiedActive").replace(
                      "{{count}}",
                      String(verifyState.txCount),
                    )}
                  </p>
                )}
                {verifyState.status === "inactive" && (
                  <p
                    className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1"
                    data-ocid="payment.verify_inactive_state"
                  >
                    <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                    {t("payment.verifiedInactive")}
                  </p>
                )}
                {verifyState.status === "failed" && (
                  <p
                    className="text-xs text-muted-foreground flex items-center gap-1"
                    data-ocid="payment.verify_error_state"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {t("payment.verificationFailed")}
                  </p>
                )}
              </div>
            )}

            {isAddressValid &&
              address.trim() &&
              tokenToWalletChain(selectedToken) && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {t("walletLink.antiphishing")}
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleWalletLinkProof}
                    disabled={isLinkingWallet}
                    className="gap-1.5"
                    data-ocid="payment.wallet_link_proof_button"
                  >
                    {isLinkingWallet ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {t("walletLink.signing")}
                      </>
                    ) : (
                      <>
                        <Wallet className="h-3.5 w-3.5" />
                        {t("walletLink.connectWithProof")}
                      </>
                    )}
                  </Button>
                </div>
              )}

            <Button
              type="button"
              onClick={handleSave}
              disabled={!address.trim() || isSaving}
              className="w-full sm:w-auto"
              data-ocid="payment.save_button"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  {t("payment.save")}
                </>
              ) : (
                t("payment.save")
              )}
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Saved methods list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            {t("payment.savedMethods")}
          </h2>

          {isMethodsPending ? (
            <div
              className="space-y-2"
              data-ocid="payment.methods_loading_state"
            >
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          ) : displayMethods.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-10 rounded-lg border border-dashed border-border gap-3 text-muted-foreground"
              data-ocid="payment.methods_empty_state"
            >
              <AlertCircle className="h-8 w-8 opacity-40" />
              <p className="text-sm">{t("payment.noPaymentMethods")}</p>
            </div>
          ) : (
            <div
              className="divide-y divide-border rounded-lg border border-border overflow-hidden"
              data-ocid="payment.methods_list"
            >
              {displayMethods.map((method, index) => (
                <div
                  key={`${method.token as string}-${method.address}-${method.addedAt.toString()}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 bg-card hover:bg-muted/30 transition-colors"
                  data-ocid={`payment.method_item.${index + 1}`}
                >
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-sm font-medium text-foreground truncate">
                      {TOKEN_LABELS[method.token as string] ??
                        (method.token as string)}
                    </p>
                    <code className="text-xs text-muted-foreground font-mono truncate block">
                      {truncateAddress(method.address)}
                    </code>
                    <VerificationBadge verification={method.verification} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
