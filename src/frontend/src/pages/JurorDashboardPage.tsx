import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Gavel,
  LogIn,
  Scale,
  ShieldAlert,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type {
  DisputeId,
  JurorDashboardEntry,
  JurorVoteChoice,
  JuryView,
} from "../backend.d";
import { useAuth } from "../hooks/useAuth";
import { useBackend } from "../hooks/useBackend";
import { useLocale } from "../hooks/useLocale";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCountdown(deadlineNs: bigint): {
  label: string;
  expired: boolean;
} {
  const nowMs = Date.now();
  const deadlineMs = Number(deadlineNs / 1_000_000n);
  const diffMs = deadlineMs - nowMs;
  if (diffMs <= 0) return { label: "", expired: true };
  const hours = Math.floor(diffMs / 3_600_000);
  const mins = Math.floor((diffMs % 3_600_000) / 60_000);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return { label: `${days}d ${hours % 24}h`, expired: false };
  }
  return { label: `${hours}h ${mins}m`, expired: false };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface VoteDialogProps {
  open: boolean;
  entry: JurorDashboardEntry | null;
  onClose: () => void;
  onSubmit: (
    disputeId: DisputeId,
    vote: JurorVoteChoice,
    reasoning: string,
  ) => void;
  isSubmitting: boolean;
  juryView: JuryView | null;
}

function VoteDialog({
  open,
  entry,
  onClose,
  onSubmit,
  isSubmitting,
  juryView,
}: VoteDialogProps) {
  const { t } = useLocale();
  const [selectedVote, setSelectedVote] = useState<JurorVoteChoice | null>(
    null,
  );
  const [reasoning, setReasoning] = useState("");

  const handleSubmit = () => {
    if (!entry || !selectedVote) return;
    onSubmit(entry.disputeId, selectedVote, reasoning);
  };

  const handleClose = () => {
    setSelectedVote(null);
    setReasoning("");
    onClose();
  };

  const totalJurors = juryView?.jurors.length ?? 3;
  const votedCount = juryView?.votes.length ?? 0;
  const buyerVotesInDialog =
    juryView?.votes.filter((v) => v.vote === "buyerWins").length ?? 0;
  const sellerVotesInDialog =
    juryView?.votes.filter((v) => v.vote === "sellerWins").length ?? 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md" data-ocid="vote-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-4 w-4 text-accent" aria-hidden="true" />
            {t("jurors.voteConfirmTitle")}
          </DialogTitle>
          <DialogDescription>{t("jurors.voteConfirmDesc")}</DialogDescription>
        </DialogHeader>

        {entry && (
          <div className="space-y-4 py-2">
            {/* Dispute info */}
            <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm space-y-1">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">
                  {t("jurors.caseDispute")}:
                </span>{" "}
                #{entry.disputeId.toString()}
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">
                  {t("jurors.caseTrade")}:
                </span>{" "}
                #{entry.tradeId.toString()}
              </p>
              {juryView && (
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {t("jurors.consensus")}:
                    </span>{" "}
                    {votedCount} / {totalJurors}
                  </p>
                  {(buyerVotesInDialog > 0 || sellerVotesInDialog > 0) && (
                    <p className="text-muted-foreground text-xs">
                      {t("disputes.jury.voteTally")
                        .replace("{{buyer}}", String(buyerVotesInDialog))
                        .replace("{{seller}}", String(sellerVotesInDialog))}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Vote buttons */}
            <fieldset>
              <legend className="sr-only">{t("jurors.voteFor")}</legend>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  data-ocid="vote-btn-buyer"
                  onClick={() =>
                    setSelectedVote("buyerWins" as JurorVoteChoice)
                  }
                  aria-pressed={selectedVote === "buyerWins"}
                  className={`jury-vote-card rounded-xl border-2 p-4 text-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    selectedVote === "buyerWins"
                      ? "jury-vote-card-active border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:border-primary/40 hover:bg-primary/5 text-foreground"
                  }`}
                >
                  <div className="text-2xl mb-1" aria-hidden="true">
                    🧑‍💼
                  </div>
                  <p className="font-semibold text-sm">
                    {t("jurors.voteBuyer")}
                  </p>
                </button>
                <button
                  type="button"
                  data-ocid="vote-btn-seller"
                  onClick={() =>
                    setSelectedVote("sellerWins" as JurorVoteChoice)
                  }
                  aria-pressed={selectedVote === "sellerWins"}
                  className={`jury-vote-card rounded-xl border-2 p-4 text-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    selectedVote === "sellerWins"
                      ? "jury-vote-card-active border-accent bg-accent/10 text-accent"
                      : "border-border bg-card hover:border-accent/40 hover:bg-accent/5 text-foreground"
                  }`}
                >
                  <div className="text-2xl mb-1" aria-hidden="true">
                    🏪
                  </div>
                  <p className="font-semibold text-sm">
                    {t("jurors.voteSeller")}
                  </p>
                </button>
              </div>
            </fieldset>

            {/* Reasoning */}
            <div>
              <label
                htmlFor="vote-reasoning-input"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                {t("jurors.voteReasoning")}{" "}
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
              </label>
              <Textarea
                id="vote-reasoning-input"
                data-ocid="vote-reasoning"
                placeholder={t("disputes.jury.reasoningPlaceholder")}
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                rows={3}
                className="resize-none"
                required
              />
              {!reasoning.trim() && selectedVote && (
                <p
                  className="text-xs text-destructive mt-1"
                  data-ocid="vote-reasoning-error"
                >
                  {t("disputes.jury.reasoningPlaceholder")}
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {t("detail.cancel")}
          </Button>
          <Button
            data-ocid="btn-submit-vote"
            onClick={handleSubmit}
            disabled={!selectedVote || !reasoning.trim() || isSubmitting}
            className="button-primary gap-2"
          >
            <Gavel className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? t("jurors.submitting") : t("jurors.submitVote")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Case Card ────────────────────────────────────────────────────────────────

interface CaseCardProps {
  entry: JurorDashboardEntry;
  onVote: (entry: JurorDashboardEntry) => void;
}

function CaseCard({ entry, onVote }: CaseCardProps) {
  const { t } = useLocale();
  const { actor, isFetching } = useBackend();
  const [expanded, setExpanded] = useState(false);
  const { label, expired } = formatCountdown(entry.deadline);

  const { data: dispute } = useQuery({
    queryKey: ["dispute", entry.disputeId.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDispute(entry.disputeId);
    },
    enabled: !!actor && !isFetching && expanded,
  });

  const { data: juryView } = useQuery({
    queryKey: ["juryView", entry.disputeId.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDisputeJurors(entry.disputeId);
    },
    enabled: !!actor && !isFetching,
  });

  const votedCount = juryView?.votes.length ?? 0;
  const totalJurors = juryView?.jurors.length ?? 3;
  const buyerVotes =
    juryView?.votes.filter((v) => v.vote === "buyerWins").length ?? 0;
  const sellerVotes =
    juryView?.votes.filter((v) => v.vote === "sellerWins").length ?? 0;

  const expandLabel = expanded
    ? t("jurors.collapseCase")
    : t("jurors.expandCase");

  return (
    <div
      className={`rounded-xl border bg-card transition-all ${
        entry.hasVoted
          ? "border-border opacity-80"
          : "border-border hover:border-primary/40"
      }`}
      data-ocid={`case-card-${entry.disputeId}`}
    >
      {/* Header row */}
      <button
        type="button"
        className="flex items-center gap-3 p-4 cursor-pointer w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-t-xl"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls={`case-details-${entry.disputeId}`}
        aria-label={`${expandLabel} — ${t("jurors.caseDispute")} #${entry.disputeId.toString()}`}
      >
        <div
          className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
            entry.hasVoted
              ? "bg-accent/15 text-accent"
              : "bg-primary/10 text-primary"
          }`}
        >
          {entry.hasVoted ? (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Scale className="h-4 w-4" aria-hidden="true" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground text-sm">
              {t("jurors.caseDispute")} #{entry.disputeId.toString()}
            </span>
            <Badge
              variant={entry.hasVoted ? "secondary" : "outline"}
              className="text-[11px] shrink-0"
            >
              {entry.hasVoted
                ? t("jurors.caseStatus.voted")
                : t("jurors.caseStatus.pending")}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("jurors.caseTrade")} #{entry.tradeId.toString()}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Countdown */}
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              expired ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {expired ? t("jurors.expired") : label}
          </div>

          {/* Consensus */}
          <div className="text-xs text-muted-foreground hidden sm:block">
            {votedCount}/{totalJurors} {t("jurors.consensus")}
          </div>

          {expanded ? (
            <ChevronUp
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
          ) : (
            <ChevronDown
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
          )}
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            id={`case-details-${entry.disputeId}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
              {/* Evidence summary */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  {t("jurors.evidenceSummary")}
                </p>
                {dispute ? (
                  <div className="rounded-lg bg-muted/40 p-3 text-sm text-foreground">
                    <p className="mb-2">
                      {dispute.description || t("jurors.noEvidence")}
                    </p>
                    {dispute.evidenceUrls.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {dispute.evidenceUrls.map((url) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-accent underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                          >
                            {url.split("/").pop() ?? url}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="rounded-lg bg-muted/40 p-3 h-12 animate-pulse"
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Vote action */}
              {!entry.hasVoted && !expired && (
                <Button
                  data-ocid={`btn-vote-${entry.disputeId}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onVote(entry);
                  }}
                  className="w-full button-primary gap-2"
                >
                  <Gavel className="h-4 w-4" aria-hidden="true" />
                  {t("jurors.voteFor")}
                </Button>
              )}

              {/* Vote tally breakdown */}
              {juryView && (buyerVotes > 0 || sellerVotes > 0) && (
                <div
                  className="flex items-center gap-3 text-xs text-muted-foreground"
                  data-ocid={`vote-tally-${entry.disputeId}`}
                >
                  <span className="flex items-center gap-1">
                    <span className="text-primary font-medium">
                      {buyerVotes}
                    </span>{" "}
                    {t("jurors.voteBuyer").toLowerCase()}
                  </span>
                  <span className="text-border">·</span>
                  <span className="flex items-center gap-1">
                    <span className="text-accent font-medium">
                      {sellerVotes}
                    </span>{" "}
                    {t("jurors.voteSeller").toLowerCase()}
                  </span>
                  <span className="text-border">·</span>
                  <span>
                    {votedCount}/{totalJurors}
                  </span>
                </div>
              )}

              {entry.hasVoted && (
                <div
                  className="flex items-center gap-2 text-sm text-accent"
                  data-ocid={`voted-badge-${entry.disputeId}`}
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {t("jurors.voteSubmitted")}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Join CTA ─────────────────────────────────────────────────────────────────

function JoinJuryPoolCard() {
  const { t } = useLocale();
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const result = await actor.registerAsJuror(0);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
    },
    onSuccess: () => {
      toast.success(t("jurors.joinBtn"));
      queryClient.invalidateQueries({ queryKey: ["jurorDashboard"] });
    },
    onError: () => toast.error(t("jurors.registrationError")),
  });

  const FEATURES = [
    { icon: "⚖️", labelKey: "jurors.feature.fairVoting" as const },
    { icon: "🔒", labelKey: "jurors.feature.onChain" as const },
    { icon: "⭐", labelKey: "jurors.feature.reputation" as const },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto"
    >
      <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-5 shadow-sm">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-accent/15 flex items-center justify-center">
          <Scale className="h-8 w-8 text-accent" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold text-foreground">
            {t("jurors.joinTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {t("jurors.joinDesc")}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center py-2">
          {FEATURES.map((item) => (
            <div
              key={item.labelKey}
              className="rounded-lg bg-muted/40 py-3 px-2"
            >
              <div className="text-xl mb-1" aria-hidden="true">
                {item.icon}
              </div>
              <p className="text-xs text-muted-foreground">
                {t(item.labelKey)}
              </p>
            </div>
          ))}
        </div>

        <Button
          data-ocid="btn-register-juror"
          onClick={() => registerMutation.mutate()}
          disabled={registerMutation.isPending}
          className="w-full button-primary gap-2"
          size="lg"
        >
          <UserCheck className="h-4 w-4" aria-hidden="true" />
          {registerMutation.isPending
            ? t("jurors.joining")
            : t("jurors.joinBtn")}
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function JurorDashboardPage() {
  const { t } = useLocale();
  const { isAuthenticated, isInitializing, login } = useAuth();
  const { actor, isFetching } = useBackend();
  const queryClient = useQueryClient();
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const [voteDialogEntry, setVoteDialogEntry] =
    useState<JurorDashboardEntry | null>(null);

  // Load dashboard with 30s polling so vote tallies stay fresh
  const {
    data: dashboardResult,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["jurorDashboard"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyJurorDashboard();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    refetchInterval: 30_000,
  });

  // Jury view for vote dialog
  const { data: voteJuryView } = useQuery({
    queryKey: ["juryView", voteDialogEntry?.disputeId.toString()],
    queryFn: async () => {
      if (!actor || !voteDialogEntry) return null;
      return actor.getDisputeJurors(voteDialogEntry.disputeId);
    },
    enabled: !!actor && !isFetching && !!voteDialogEntry,
  });

  const voteMutation = useMutation({
    mutationFn: async ({
      disputeId,
      vote,
      reasoning,
    }: {
      disputeId: DisputeId;
      vote: JurorVoteChoice;
      reasoning: string;
    }) => {
      if (!actor) throw new Error("No actor");
      const result = await actor.submitJurorVote(disputeId, vote, reasoning);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
    },
    onSuccess: () => {
      toast.success(t("jurors.voteSubmitted"));
      // Announce to screen readers
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = t("jurors.voteSubmittedLive");
      }
      setVoteDialogEntry(null);
      queryClient.invalidateQueries({ queryKey: ["jurorDashboard"] });
    },
    onError: () => toast.error(t("jurors.voteError")),
  });

  const unregisterMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const result = await actor.unregisterJuror();
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
    },
    onSuccess: () => {
      toast.success(t("jurors.leavePool"));
      queryClient.invalidateQueries({ queryKey: ["jurorDashboard"] });
    },
    onError: () => toast.error(t("jurors.unregisterError")),
  });

  // ── Auth gate ──
  if (!isAuthenticated && !isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-16">
        <div className="max-w-sm w-full text-center space-y-5">
          <div className="mx-auto h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Scale className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-display font-semibold text-foreground">
            {t("jurors.signInRequired")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("jurors.signInDesc")}
          </p>
          <Button
            data-ocid="btn-login-jurors"
            onClick={login}
            className="w-full button-primary gap-2"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            {t("jurors.signIn")}
          </Button>
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (isLoading || isFetching) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 px-4">
        <AlertTriangle
          className="h-8 w-8 text-destructive"
          aria-hidden="true"
        />
        <p className="text-muted-foreground text-sm">{t("jurors.loadError")}</p>
      </div>
    );
  }

  // ── Not a juror yet ──
  if (!dashboardResult || dashboardResult.__kind__ === "err") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t("jurors.pageTitle")}
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {t("jurors.pageSubtitle")}
          </p>
        </div>
        <JoinJuryPoolCard />
      </div>
    );
  }

  const entries: JurorDashboardEntry[] = dashboardResult.ok;
  const resolvedCount = entries.filter((e) => e.hasVoted).length;
  const pendingCount = entries.filter((e) => !e.hasVoted).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 pb-24 md:pb-8">
      {/* Aria live region for vote submission announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-ocid="vote-live-region"
      />

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Scale className="h-6 w-6 text-accent" aria-hidden="true" />
            {t("jurors.pageTitle")}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("jurors.pageSubtitle")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          data-ocid="btn-leave-jury"
          onClick={() => unregisterMutation.mutate()}
          disabled={unregisterMutation.isPending}
          className="shrink-0 text-muted-foreground hover:text-destructive hover:border-destructive"
        >
          {unregisterMutation.isPending
            ? t("jurors.leaving")
            : t("jurors.leavePool")}
        </Button>
      </motion.div>

      {/* Stats strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-3"
        data-ocid="juror-stats"
      >
        {[
          {
            icon: (
              <CheckCircle2
                className="h-4 w-4 text-accent"
                aria-hidden="true"
              />
            ),
            label: t("jurors.stats.resolved"),
            value: resolvedCount,
          },
          {
            icon: <Scale className="h-4 w-4 text-primary" aria-hidden="true" />,
            label: t("jurors.stats.active"),
            value: pendingCount,
          },
          {
            icon: (
              <TrendingUp className="h-4 w-4 text-chart-1" aria-hidden="true" />
            ),
            label: t("jurors.stats.successRate"),
            value: `${entries.length > 0 ? Math.round((resolvedCount / entries.length) * 100) : 0}%`,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-card border border-border px-4 py-3 space-y-1"
          >
            <div className="flex items-center gap-1.5">
              {stat.icon}
              <span className="text-xs text-muted-foreground">
                {stat.label}
              </span>
            </div>
            <p className="text-xl font-display font-bold text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Active cases */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {t("jurors.activeCases")}
        </h2>

        {entries.length === 0 ? (
          <div
            className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center"
            data-ocid="empty-state-cases"
          >
            <ShieldAlert
              className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2"
              aria-hidden="true"
            />
            <p className="font-medium text-foreground text-sm">
              {t("jurors.noCases")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("jurors.noCasesDesc")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, i) => (
              <motion.div
                key={entry.disputeId.toString()}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <CaseCard entry={entry} onVote={setVoteDialogEntry} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Vote dialog */}
      <VoteDialog
        open={!!voteDialogEntry}
        entry={voteDialogEntry}
        onClose={() => setVoteDialogEntry(null)}
        juryView={voteJuryView ?? null}
        isSubmitting={voteMutation.isPending}
        onSubmit={(disputeId, vote, reasoning) =>
          voteMutation.mutate({ disputeId, vote, reasoning })
        }
      />
    </div>
  );
}
