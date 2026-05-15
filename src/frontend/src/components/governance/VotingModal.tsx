import { Loader2, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { useBackend } from "../../hooks/useBackend";
import { useLocale } from "../../hooks/useLocale";
import { t } from "../../i18n";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import type { Proposal } from "./types";
import { getStatusKey } from "./types";

interface VotingModalProps {
  proposal: Proposal;
  onClose: () => void;
  onVoted: () => void;
}

export default function VotingModal({
  proposal,
  onClose,
  onVoted,
}: VotingModalProps) {
  const { locale } = useLocale();
  const { actor } = useBackend();
  const [selected, setSelected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = proposal.yesVotes + proposal.noVotes;
  const yesPct =
    total === 0n ? 50 : Math.round(Number((proposal.yesVotes * 100n) / total));
  const statusKey = getStatusKey(proposal.status);

  async function handleSubmit() {
    if (selected === null || !actor) return;
    setLoading(true);
    setError("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = actor as unknown as Record<
      string,
      (...args: unknown[]) => Promise<unknown>
    >;
    try {
      await a.voteOnProposal(proposal.id, selected);
      onVoted();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t(locale, "gov.voteError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md" data-ocid="voting-modal">
        <DialogHeader>
          <DialogTitle>{t(locale, "gov.voteModalTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Proposal summary */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono text-xs">
                #{String(proposal.id)}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${statusKey === "active" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : ""}`}
              >
                {t(
                  locale,
                  `gov.status.${statusKey}` as Parameters<typeof t>[1],
                )}
              </Badge>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {proposal.description}
            </p>
          </div>

          {/* Current tally */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t(locale, "gov.currentTally")}
            </p>
            <div className="flex gap-4">
              <div className="flex-1 rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {String(proposal.yesVotes)}
                </p>
                <p className="text-xs text-green-600/80 mt-0.5">
                  {t(locale, "gov.voteYes")} ({yesPct}%)
                </p>
              </div>
              <div className="flex-1 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center">
                <p className="text-2xl font-bold text-destructive">
                  {String(proposal.noVotes)}
                </p>
                <p className="text-xs text-destructive/80 mt-0.5">
                  {t(locale, "gov.voteNo")} ({100 - yesPct}%)
                </p>
              </div>
            </div>
          </div>

          {/* Vote selection */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t(locale, "gov.yourVote")}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelected(true)}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 p-4 text-sm font-semibold transition-smooth
                  ${
                    selected === true
                      ? "border-green-500 bg-green-500/15 text-green-600"
                      : "border-border bg-card text-foreground hover:border-green-500/50 hover:bg-green-500/5"
                  }`}
                data-ocid="vote-yes-btn"
              >
                <ThumbsUp className="h-5 w-5" />
                {t(locale, "gov.voteYes")}
              </button>
              <button
                type="button"
                onClick={() => setSelected(false)}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 p-4 text-sm font-semibold transition-smooth
                  ${
                    selected === false
                      ? "border-destructive bg-destructive/15 text-destructive"
                      : "border-border bg-card text-foreground hover:border-destructive/50 hover:bg-destructive/5"
                  }`}
                data-ocid="vote-no-btn"
              >
                <ThumbsDown className="h-5 w-5" />
                {t(locale, "gov.voteNo")}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive border border-destructive/20">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            data-ocid="vote-cancel-btn"
          >
            {t(locale, "gov.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selected === null || loading}
            className="gap-2"
            data-ocid="vote-submit-btn"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading
              ? t(locale, "gov.submitting")
              : t(locale, "gov.submitVote")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
