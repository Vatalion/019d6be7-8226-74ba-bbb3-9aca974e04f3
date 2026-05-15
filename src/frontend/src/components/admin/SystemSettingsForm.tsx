import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Info, Save, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TradeToken } from "../../backend.d";
import { useBackend } from "../../hooks/useBackend";
import { useLocale } from "../../hooks/useLocale";

const ALL_TOKENS = Object.values(TradeToken);

// Only the 4 approved active stablecoin networks are shown in the display list.
// Deferred tokens (USDT_POLYGON, USDT_AVAX, USDC_SPL, USDC_POLYGON, USDC_AVAX)
// are excluded from UI display — backend enum retains all values for backward compat.
const DISPLAY_TOKENS = [
  TradeToken.USDT_TRC20,
  TradeToken.USDT_BEP20,
  TradeToken.USDT_ERC20,
  TradeToken.USDC_ERC20,
];

const TOKEN_LABELS: Record<TradeToken, string> = {
  [TradeToken.USDT_TRC20]: "USDT · TRC20",
  [TradeToken.USDT_BEP20]: "USDT · BEP20",
  [TradeToken.USDT_ERC20]: "USDT · ERC20",
  [TradeToken.USDT_AVAX]: "USDT · Avalanche",
  [TradeToken.USDT_POLYGON]: "USDT · Polygon",
  [TradeToken.USDC_SPL]: "USDC · Solana",
  [TradeToken.USDC_ERC20]: "USDC · ERC20",
  [TradeToken.USDC_AVAX]: "USDC · Avalanche",
  [TradeToken.USDC_POLYGON]: "USDC · Polygon",
  // Legacy ICP-native tokens retained for type completeness — not shown as payment options
  [TradeToken.ckUSDC]: "ckUSDC",
  [TradeToken.ckUSDT]: "ckUSDT",
};

const DEFAULT_CYCLES_THRESHOLD_T = 1; // 1T cycles = 1_000_000_000_000
const DEFAULT_ERROR_RATE_THRESHOLD = 5.0;

interface SettingsState {
  minTradeAmountUSD: string;
  paymentTimeoutHours: string;
  maxListingPriceUSD: string;
  allowedTokens: Set<TradeToken>;
  cyclesBalanceThresholdT: string; // display in T (trillions)
  errorRateThreshold: string;
}

export default function SystemSettingsForm() {
  const { actor, isFetching } = useBackend();
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["systemSettings"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getSystemSettings();
    },
    enabled: !!actor && !isFetching,
  });

  const [form, setForm] = useState<SettingsState>({
    minTradeAmountUSD: "",
    paymentTimeoutHours: "",
    maxListingPriceUSD: "",
    allowedTokens: new Set(ALL_TOKENS),
    cyclesBalanceThresholdT: DEFAULT_CYCLES_THRESHOLD_T.toString(),
    errorRateThreshold: DEFAULT_ERROR_RATE_THRESHOLD.toString(),
  });

  useEffect(() => {
    if (!settings) return;
    setForm({
      minTradeAmountUSD: settings.minTradeAmountUSD.toString(),
      paymentTimeoutHours: settings.paymentTimeoutHours.toString(),
      maxListingPriceUSD: settings.maxListingPriceUSD.toString(),
      allowedTokens: new Set(settings.allowedTokens as TradeToken[]),
      cyclesBalanceThresholdT: (
        Number(settings.cyclesBalanceThreshold) / 1e12
      ).toString(),
      errorRateThreshold: settings.errorRateThreshold.toString(),
    });
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const cyclesThresholdRaw = BigInt(
        Math.round(
          Number.parseFloat(form.cyclesBalanceThresholdT || "1") * 1e12,
        ),
      );
      const errorRateRaw = Number.parseFloat(form.errorRateThreshold || "5");
      return actor.updateSystemSettings(
        BigInt(form.minTradeAmountUSD || "0"),
        BigInt(form.paymentTimeoutHours || "24"),
        Array.from(form.allowedTokens),
        BigInt(form.maxListingPriceUSD || "0"),
        cyclesThresholdRaw,
        errorRateRaw,
      );
    },
    onSuccess: () => {
      toast.success("Settings updated");
      queryClient.invalidateQueries({ queryKey: ["systemSettings"] });
      queryClient.invalidateQueries({ queryKey: ["sysSettings"] });
    },
    onError: () => toast.error("Failed to update settings"),
  });

  function toggleToken(token: TradeToken) {
    setForm((prev) => {
      const next = new Set(prev.allowedTokens);
      if (next.has(token)) next.delete(token);
      else next.add(token);
      return { ...prev, allowedTokens: next };
    });
  }

  const isDirty =
    settings &&
    (form.minTradeAmountUSD !== settings.minTradeAmountUSD.toString() ||
      form.paymentTimeoutHours !== settings.paymentTimeoutHours.toString() ||
      form.maxListingPriceUSD !== settings.maxListingPriceUSD.toString() ||
      form.allowedTokens.size !== settings.allowedTokens.length ||
      Array.from(form.allowedTokens).some(
        (t) => !(settings.allowedTokens as TradeToken[]).includes(t),
      ) ||
      Number.parseFloat(form.cyclesBalanceThresholdT || "1") * 1e12 !==
        Number(settings.cyclesBalanceThreshold) ||
      Number.parseFloat(form.errorRateThreshold || "5") !==
        settings.errorRateThreshold);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">
          System Settings
        </h2>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton list
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate();
            }}
            className="space-y-6"
          >
            {/* Trade limits */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-foreground">
                Trade Limits
              </legend>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="min-trade">
                    Min Trade Amount (USD cents)
                  </Label>
                  <Input
                    id="min-trade"
                    data-ocid="setting-min-trade"
                    type="number"
                    min="0"
                    value={form.minTradeAmountUSD}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        minTradeAmountUSD: e.target.value,
                      }))
                    }
                    placeholder="e.g. 100"
                  />
                  <p className="text-caption">
                    Minimum trade value in USD cents
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="max-listing">
                    Max Listing Price (USD cents)
                  </Label>
                  <Input
                    id="max-listing"
                    data-ocid="setting-max-listing"
                    type="number"
                    min="0"
                    value={form.maxListingPriceUSD}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        maxListingPriceUSD: e.target.value,
                      }))
                    }
                    placeholder="e.g. 1000000"
                  />
                  <p className="text-caption">
                    Maximum listing price in USD cents
                  </p>
                </div>
              </div>
            </fieldset>

            {/* Payment timeout */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-foreground">
                Payment Window
              </legend>
              <div className="w-48 space-y-1.5">
                <Label htmlFor="timeout-hours">Payment Timeout (hours)</Label>
                <Input
                  id="timeout-hours"
                  data-ocid="setting-timeout-hours"
                  type="number"
                  min="1"
                  max="168"
                  value={form.paymentTimeoutHours}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      paymentTimeoutHours: e.target.value,
                    }))
                  }
                  placeholder="24"
                />
                <p className="text-caption">
                  Hours before trade auto-cancels after funding
                </p>
              </div>
            </fieldset>

            {/* Allowed tokens */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-foreground">
                Allowed Payment Tokens
              </legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {DISPLAY_TOKENS.map((token) => (
                  // biome-ignore lint/a11y/noLabelWithoutControl: label wraps checkbox
                  <label
                    key={token}
                    data-ocid={`token-toggle-${token}`}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 hover:bg-muted transition-colors"
                  >
                    <Checkbox
                      checked={form.allowedTokens.has(token)}
                      onCheckedChange={() => toggleToken(token)}
                    />
                    <span className="font-mono text-sm text-foreground">
                      {TOKEN_LABELS[token]}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-caption">
                {form.allowedTokens.size} of {ALL_TOKENS.length} tokens enabled
              </p>
              <div
                className="flex items-start gap-1.5 mt-1"
                data-ocid="admin-scope-note"
              >
                <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  {t("admin.scope.note")}
                </p>
              </div>
            </fieldset>

            {/* Alert Thresholds */}
            <fieldset className="space-y-4">
              <legend className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Bell className="h-4 w-4 text-accent" />
                {t("admin.settings.alertThresholds")}
              </legend>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cycles-threshold">
                    {t("admin.settings.cyclesThreshold")}
                  </Label>
                  <Input
                    id="cycles-threshold"
                    data-ocid="setting-cycles-threshold"
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.cyclesBalanceThresholdT}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        cyclesBalanceThresholdT: e.target.value,
                      }))
                    }
                    placeholder="1"
                  />
                  <p className="text-caption">
                    Alert when cycles balance drops below this value (in T
                    cycles)
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="error-rate-threshold">
                    {t("admin.settings.errorRateThreshold")}
                  </Label>
                  <Input
                    id="error-rate-threshold"
                    data-ocid="setting-error-rate-threshold"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.errorRateThreshold}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        errorRateThreshold: e.target.value,
                      }))
                    }
                    placeholder="5"
                  />
                  <p className="text-caption">
                    Alert when error rate exceeds this percentage
                  </p>
                </div>
              </div>
            </fieldset>

            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              {isDirty && (
                <p className="text-sm text-muted-foreground">
                  You have unsaved changes.
                </p>
              )}
              <Button
                type="submit"
                data-ocid="save-settings-btn"
                disabled={updateMutation.isPending || !isDirty}
              >
                <Save className="mr-2 h-4 w-4" />
                {updateMutation.isPending ? "Saving…" : "Save Settings"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
