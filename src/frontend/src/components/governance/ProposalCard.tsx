import { Clock, ThumbsDown, ThumbsUp, User, Vote } from "lucide-react";
import { useLocale } from "../../hooks/useLocale";
import { t } from "../../i18n";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import type { Proposal } from "./types";
import { getProposalTypeLabel, getStatusKey } from "./types";

interface ProposalCardProps {
  proposal: Proposal;
  onVote: () => void;
  isAuthenticated: boolean;
}

const statusStyles: Record<string, string> = {
  active: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  passed: "bg-green-500/10 text-green-600 border-green-500/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  executed: "bg-muted text-muted-foreground border-border",
  expired: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
};

function formatCountdown(deadlineNs: bigint): string {
  const nowMs = Date.now();
  const deadlineMs = Number(deadlineNs / 1_000_000n);
  const diffMs = deadlineMs - nowMs;
  if (diffMs <= 0) return "0h";
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  return `${hours}h`;
}

function VoteBar({ yes, no }: { yes: bigint; no: bigint }) {
  const total = yes + no;
  const yesPct = total === 0n ? 50 : Math.round(Number((yes * 100n) / total));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <ThumbsUp className="h-3 w-3 text-green-500" />
          {String(yes)}
        </span>
        <span className="flex items-center gap-1">
          {String(no)}
          <ThumbsDown className="h-3 w-3 text-destructive" />
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-500"
          style={{ width: `${yesPct}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{yesPct}% Yes</span>
        <span>{100 - yesPct}% No</span>
      </div>
    </div>
  );
}

export default function ProposalCard({
  proposal,
  onVote,
  isAuthenticated,
}: ProposalCardProps) {
  const { locale } = useLocale();
  const statusKey = getStatusKey(proposal.status);
  const isActive = statusKey === "active";
  const typeLabel = getProposalTypeLabel(proposal.proposalType);

  return (
    <Card
      className="transition-smooth hover:shadow-md border-border"
      data-ocid={`proposal-card-${String(proposal.id)}`}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <Badge variant="outline" className="font-mono text-xs shrink-0">
              #{String(proposal.id)}
            </Badge>
            <Badge variant="outline" className="text-xs shrink-0">
              {t(locale, `gov.type.${typeLabel}` as Parameters<typeof t>[1])}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs font-semibold shrink-0 ${statusStyles[statusKey]}`}
            >
              {t(locale, `gov.status.${statusKey}` as Parameters<typeof t>[1])}
            </Badge>
          </div>
          {isActive && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Clock className="h-3 w-3" />
              {formatCountdown(proposal.deadline)}
            </span>
          )}
        </div>

        <p className="mt-2 text-sm font-medium text-foreground leading-relaxed line-clamp-3">
          {proposal.description}
        </p>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate font-mono">{proposal.proposer}</span>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        <VoteBar yes={proposal.yesVotes} no={proposal.noVotes} />

        {isActive && isAuthenticated && (
          <Button
            size="sm"
            className="w-full gap-2"
            onClick={onVote}
            data-ocid={`proposal-vote-btn-${String(proposal.id)}`}
          >
            <Vote className="h-4 w-4" />
            {t(locale, "gov.voteBtn")}
          </Button>
        )}
        {isActive && !isAuthenticated && (
          <p className="text-xs text-center text-muted-foreground">
            {t(locale, "gov.loginToVote")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
