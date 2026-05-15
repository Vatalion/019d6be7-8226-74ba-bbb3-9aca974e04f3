import { TradeStatus } from "@/backend.d";
import type { Timestamp } from "@/backend.d";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useLocale } from "../../hooks/useLocale";

interface EscrowTimelineProps {
  status: TradeStatus;
  createdAt?: Timestamp;
  fundedAt?: Timestamp;
  confirmedAt?: Timestamp;
  completedAt?: Timestamp;
}

type StepState = "completed" | "active" | "upcoming";

// Map TradeStatus to a 0-based step index in the 6-step manual flow
// Steps: 0=initiated, 1=awaitingPayment, 2=buyerConfirmed, 3=awaitingSeller, 4=sellerConfirmed, 5=complete
function getActiveStepIndex(status: TradeStatus): number {
  switch (status) {
    case TradeStatus.pending:
      return 0;
    case TradeStatus.funded:
      return 1;
    case TradeStatus.buyer_confirmed:
      return 3; // buyer confirmed → step 3 (buyer confirmed shown as completed at 2, seller awaiting at 3)
    case TradeStatus.payment_verified:
      return 4;
    case TradeStatus.complete:
      return 5;
    // terminal: show all steps up to last meaningful step as completed
    case TradeStatus.cancelled:
    case TradeStatus.refunded:
    case TradeStatus.disputed:
      return -1; // handled separately
    default:
      return 0;
  }
}

function getStepState(stepIndex: number, status: TradeStatus): StepState {
  const isTerminal = [
    TradeStatus.cancelled,
    TradeStatus.refunded,
    TradeStatus.disputed,
  ].includes(status);

  if (isTerminal) {
    // For terminal states, mark steps before the last meaningful point as completed
    const lastMeaningful = status === TradeStatus.buyer_confirmed ? 2 : 1;
    if (stepIndex < lastMeaningful) return "completed";
    return "upcoming";
  }

  const activeIdx = getActiveStepIndex(status);
  if (stepIndex < activeIdx) return "completed";
  if (stepIndex === activeIdx) return "active";
  return "upcoming";
}

function formatTs(ts?: Timestamp): string | undefined {
  if (!ts) return undefined;
  return new Date(Number(ts) / 1_000_000).toLocaleString();
}

export function EscrowTimeline({
  status,
  createdAt,
  fundedAt,
  confirmedAt,
  completedAt,
}: EscrowTimelineProps) {
  const { t } = useLocale();

  const mainSteps = [
    {
      icon: <ShieldCheck className="w-4 h-4" />,
      label: t("trade.step.initiated"),
      description: t("escrow.step.accepted.desc"),
      subText: undefined as string | undefined,
      timestamp: createdAt,
    },
    {
      icon: <Clock className="w-4 h-4" />,
      label: t("trade.step.awaitingPayment"),
      description: t("escrow.step.pending.desc"),
      subText: t("trade.hint.sendOffChain"),
      timestamp: fundedAt,
    },
    {
      icon: <Banknote className="w-4 h-4" />,
      label: t("trade.step.buyerConfirmed"),
      description: t("escrow.step.funded.desc"),
      subText: undefined as string | undefined,
      timestamp: confirmedAt,
    },
    {
      icon: <Clock className="w-4 h-4" />,
      label: t("trade.step.awaitingSeller"),
      description: t("escrow.step.buyer_confirmed.desc"),
      subText: t("trade.hint.verifyOffChain"),
      timestamp: undefined,
    },
    {
      icon: <CheckCircle2 className="w-4 h-4" />,
      label: t("trade.step.sellerConfirmed"),
      description: t("escrow.step.buyer_confirmed.desc"),
      subText: undefined as string | undefined,
      timestamp: undefined,
    },
    {
      icon: <CheckCircle2 className="w-4 h-4" />,
      label: t("trade.step.complete"),
      description: t("escrow.step.complete.desc"),
      subText: undefined as string | undefined,
      timestamp: completedAt,
    },
  ];

  const isTerminal = [
    TradeStatus.cancelled,
    TradeStatus.refunded,
    TradeStatus.disputed,
  ].includes(status);

  const terminalMap: Record<
    string,
    { icon: React.ReactNode; label: string; description: string; cls: string }
  > = {
    [TradeStatus.disputed]: {
      icon: <AlertTriangle className="w-4 h-4" />,
      label: t("escrow.terminal.disputed.label"),
      description: t("escrow.terminal.disputed.desc"),
      cls: "text-destructive border-destructive bg-destructive/10",
    },
    [TradeStatus.refunded]: {
      icon: <RotateCcw className="w-4 h-4" />,
      label: t("escrow.terminal.refunded.label"),
      description: t("escrow.terminal.refunded.desc"),
      cls: "text-chart-2 border-chart-2 bg-chart-2/10",
    },
    [TradeStatus.cancelled]: {
      icon: <XCircle className="w-4 h-4" />,
      label: t("escrow.terminal.cancelled.label"),
      description: t("escrow.terminal.cancelled.desc"),
      cls: "text-muted-foreground border-muted-foreground/40 bg-muted/30",
    },
  };

  const STEP_KEYS = [
    "initiated",
    "awaitingPayment",
    "buyerConfirmed",
    "awaitingSeller",
    "sellerConfirmed",
    "complete",
  ] as const;

  return (
    <div className="relative flex flex-col gap-0" data-ocid="escrow-timeline">
      {mainSteps.map((step, i) => {
        const state = getStepState(i, status);
        const isLast = i === mainSteps.length - 1;

        const dotCls =
          state === "completed"
            ? "bg-accent border-accent text-accent-foreground"
            : state === "active"
              ? "bg-primary border-primary text-primary-foreground ring-2 ring-primary/30"
              : "bg-muted border-border text-muted-foreground";

        const lineCls =
          state === "completed" || (state === "active" && i > 0)
            ? "bg-accent/50"
            : "bg-border";

        return (
          <div key={STEP_KEYS[i]} className="flex items-start gap-3">
            {/* Dot + line */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${dotCls}`}
              >
                {step.icon}
              </div>
              {!isLast && !isTerminal && (
                <div
                  className={`w-0.5 h-8 mt-0 ${lineCls} transition-colors`}
                />
              )}
              {!isLast && isTerminal && state !== "upcoming" && (
                <div className="w-0.5 h-8 mt-0 bg-accent/50 transition-colors" />
              )}
              {!isLast && isTerminal && state === "upcoming" && (
                <div className="w-0.5 h-8 mt-0 bg-border" />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 pt-1 min-w-0">
              <p
                className={`text-sm font-semibold leading-tight ${
                  state === "active"
                    ? "text-foreground"
                    : state === "completed"
                      ? "text-foreground/80"
                      : "text-muted-foreground"
                }`}
              >
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step.description}
              </p>
              {/* Sub-text hint — only shown when this step is active */}
              {step.subText && state === "active" && (
                <p className="text-xs text-primary/80 mt-1 italic">
                  {step.subText}
                </p>
              )}
              {step.timestamp && (
                <p className="text-xs text-accent mt-1 font-mono">
                  {formatTs(step.timestamp)}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Terminal step */}
      {isTerminal && terminalMap[status] && (
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center flex-shrink-0">
            <div
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${terminalMap[status].cls}`}
            >
              {terminalMap[status].icon}
            </div>
          </div>
          <div className="pb-2 pt-1">
            <p className="text-sm font-semibold text-foreground">
              {terminalMap[status].label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {terminalMap[status].description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
