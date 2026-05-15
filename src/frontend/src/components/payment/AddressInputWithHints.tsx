// AddressInputWithHints — address input with network detection, QR scanner,
// real-time validation and contextual hints.

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useLocale } from "../../hooks/useLocale";
import {
  NETWORK_HINTS,
  SUPPORTED_TOKENS,
  TOKEN_LABELS,
  detectAddressNetwork,
} from "../../utils/addressDetector";
import { WalletQRScanner } from "./WalletQRScanner";

interface AddressInputWithHintsProps {
  value: string;
  onChange: (v: string) => void;
  selectedToken: string;
  onTokenChange: (token: string) => void;
}

export function AddressInputWithHints({
  value,
  onChange,
  selectedToken,
  onTokenChange,
}: AddressInputWithHintsProps) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);

  // Real-time validation
  const hint = NETWORK_HINTS[selectedToken];
  const isValid = hint ? hint.validate(value) : false;
  const isEmpty = value.trim() === "";

  // Paste detection — fires on the input element
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pasted = e.clipboardData.getData("text").trim();
      if (!pasted) return;

      const detected = detectAddressNetwork(pasted);
      if (detected) {
        // Let React update the value naturally; the token update may cause
        // a brief mismatch so we schedule it after the event completes.
        setTimeout(() => {
          onTokenChange(detected.token);
          toast.success(
            t("payment.detectedNetwork")
              .replace("{label}", detected.label)
              .replace("{token}", detected.token),
          );
        }, 0);
      }
    },
    [t, onTokenChange],
  );

  // QR scan result — auto-detect network
  const handleQRDetected = useCallback(
    (address: string) => {
      onChange(address);
      const detected = detectAddressNetwork(address);
      if (detected) {
        onTokenChange(detected.token);
        toast.success(
          t("payment.detectedNetwork")
            .replace("{label}", detected.label)
            .replace("{token}", detected.token),
        );
      }
    },
    [onChange, onTokenChange, t],
  );

  // Derive hint text color
  let hintColor = "text-muted-foreground";
  if (!isEmpty) {
    hintColor = isValid
      ? "text-green-600 dark:text-green-400"
      : "text-destructive";
  }

  return (
    <div className="space-y-3">
      {/* Network / Token select */}
      <div className="space-y-1.5">
        <Label htmlFor="payment-token-select">{t("payment.selectToken")}</Label>
        <Select value={selectedToken} onValueChange={onTokenChange}>
          <SelectTrigger
            id="payment-token-select"
            className="w-full"
            data-ocid="payment.token_select"
          >
            <SelectValue placeholder={t("payment.selectToken")} />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_TOKENS.map((token) => (
              <SelectItem
                key={token}
                value={token}
                data-ocid={`payment.token_option.${token}`}
              >
                {TOKEN_LABELS[token]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Address input */}
      <div className="space-y-1.5">
        <Label htmlFor="payment-address-input">
          {t("payment.addressLabel")}
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-0">
            <Input
              ref={inputRef}
              id="payment-address-input"
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onPaste={handlePaste}
              placeholder={hint?.hint ?? t("payment.addressLabel")}
              className={[
                "font-mono text-sm pr-8",
                !isEmpty && isValid
                  ? "border-green-500 focus-visible:ring-green-500/30"
                  : "",
                !isEmpty && !isValid
                  ? "border-destructive focus-visible:ring-destructive/30"
                  : "",
              ].join(" ")}
              aria-describedby="payment-address-hint"
              aria-invalid={!isEmpty && !isValid}
              data-ocid="payment.address_input"
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
            />
            {/* Validation icon */}
            {!isEmpty && (
              <span
                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              >
                {isValid ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
              </span>
            )}
          </div>

          {/* QR Scanner */}
          <WalletQRScanner
            onAddressDetected={handleQRDetected}
            onClose={() => {}}
          />
        </div>

        {/* Contextual hint */}
        {hint && (
          <p
            id="payment-address-hint"
            className={`text-xs leading-snug transition-colors ${hintColor}`}
            data-ocid="payment.address_hint"
          >
            {!isEmpty && !isValid
              ? t("payment.invalidAddress")
              : !isEmpty && isValid
                ? t("payment.validAddress")
                : hint.hint}
          </p>
        )}
      </div>
    </div>
  );
}
