import { CheckCircle2, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useLocale } from "../hooks/useLocale";

type BaseToken = "USDT" | "USDC";

interface NetworkOption {
  id: string;
  label: string;
  subLabel: string;
}

// Active USDT networks — Polygon and Avalanche are deferred
const USDT_NETWORKS: NetworkOption[] = [
  { id: "USDT_TRC20", label: "TRC20", subLabel: "Tron" },
  { id: "USDT_BEP20", label: "BEP20", subLabel: "BSC (Binance Smart Chain)" },
  { id: "USDT_ERC20", label: "ERC20", subLabel: "Ethereum" },
];

// Active USDC networks — SPL, Polygon, Avalanche are deferred
const USDC_NETWORKS: NetworkOption[] = [
  { id: "USDC_ERC20", label: "ERC20", subLabel: "Ethereum" },
];

interface Props {
  open: boolean;
  baseToken: BaseToken;
  currentNetwork: string;
  onSelect: (tokenId: string) => void;
  onClose: () => void;
}

export function NetworkSelectionDialog({
  open,
  baseToken,
  currentNetwork,
  onSelect,
  onClose,
}: Props) {
  const { t: tl } = useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const networks = baseToken === "USDT" ? USDT_NETWORKS : USDC_NETWORKS;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;
    closeButtonRef.current?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => !el.hasAttribute("disabled"));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  const title = tl("network.selectTitle").replace("{token}", baseToken);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-ocid="network-dialog"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        tabIndex={-1}
        aria-label="Close dialog"
      />

      {/* Dialog panel */}
      <dialog
        ref={dialogRef}
        open
        className="relative z-10 w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl overflow-hidden p-0 m-0"
        aria-label={title}
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors rounded-full p-1 hover:bg-muted"
            aria-label="Close"
            data-ocid="network-dialog-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Network options */}
        <div className="py-2">
          {networks.map((net) => {
            const isSelected = currentNetwork === net.id;
            return (
              <button
                key={net.id}
                type="button"
                onClick={() => {
                  onSelect(net.id);
                  onClose();
                }}
                className={[
                  "w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors",
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-foreground",
                ].join(" ")}
                data-ocid={`network-option-${net.id.toLowerCase()}`}
              >
                <div>
                  <p className="font-semibold text-sm">{net.label}</p>
                  <p
                    className={[
                      "text-xs mt-0.5",
                      isSelected ? "text-primary/70" : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {net.subLabel}
                  </p>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </dialog>
    </div>
  );
}
