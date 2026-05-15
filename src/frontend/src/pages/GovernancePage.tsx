import { History, Landmark, Plus, Vote } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import CreateProposalModal from "../components/governance/CreateProposalModal";
import ExecutionHistoryTable from "../components/governance/ExecutionHistoryTable";
import ProposalCard from "../components/governance/ProposalCard";
import TreasuryPanel from "../components/governance/TreasuryPanel";
import VotingModal from "../components/governance/VotingModal";
import type { Proposal, Withdrawal } from "../components/governance/types";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useAuth } from "../hooks/useAuth";
import { useBackend } from "../hooks/useBackend";
import { useLocale } from "../hooks/useLocale";
import { t } from "../i18n";

export default function GovernancePage() {
  const { locale } = useLocale();
  const { actor, isFetching } = useBackend();
  const { isAuthenticated } = useAuth();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [executedProposals, setExecutedProposals] = useState<Proposal[]>([]);
  const [treasuryBalance, setTreasuryBalance] = useState<bigint>(0n);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [votingProposal, setVotingProposal] = useState<Proposal | null>(null);
  const [activeTab, setActiveTab] = useState("active");

  const fetchData = useCallback(async () => {
    if (!actor) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = actor as unknown as Record<
      string,
      (...args: unknown[]) => Promise<unknown>
    >;
    try {
      const [propsRes, historyRes, balanceRes, withdrawalsRes] =
        await Promise.all([
          a.getProposals(),
          a.getExecutionHistory(),
          a.getTreasuryBalance(),
          a.getTreasuryWithdrawals(),
        ]);
      setProposals(propsRes as Proposal[]);
      setExecutedProposals(historyRes as Proposal[]);
      setTreasuryBalance(balanceRes as bigint);
      setWithdrawals(withdrawalsRes as Withdrawal[]);
    } catch {
      // silent — show stale data
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (!actor || isFetching) return;
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [actor, isFetching, fetchData]);

  const activeProposals = proposals.filter((p) => "active" in p.status);

  return (
    <main
      className="mx-auto max-w-5xl px-4 py-8 space-y-6"
      data-ocid="governance-page"
    >
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            {t(locale, "gov.pageTitle")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t(locale, "gov.pageSubtitle")}
          </p>
        </div>
        {isAuthenticated && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="gap-2 self-start sm:self-auto"
            data-ocid="gov-create-proposal-btn"
          >
            <Plus className="h-4 w-4" />
            {t(locale, "gov.createProposal")}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} data-ocid="gov-tabs">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger
            value="active"
            className="gap-2"
            data-ocid="gov-tab-active"
          >
            <Vote className="h-4 w-4" />
            {t(locale, "gov.tab.active")}
            {activeProposals.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                {activeProposals.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="gap-2"
            data-ocid="gov-tab-history"
          >
            <History className="h-4 w-4" />
            {t(locale, "gov.tab.history")}
          </TabsTrigger>
          <TabsTrigger
            value="treasury"
            className="gap-2"
            data-ocid="gov-tab-treasury"
          >
            <Landmark className="h-4 w-4" />
            {t(locale, "gov.tab.treasury")}
          </TabsTrigger>
        </TabsList>

        {/* Active Proposals */}
        <TabsContent value="active" className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
            </div>
          ) : activeProposals.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-16 text-center"
              data-ocid="gov-empty-state"
            >
              <Vote className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium text-foreground">
                {t(locale, "gov.noActive")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(locale, "gov.noActiveDesc")}
              </p>
              {isAuthenticated && (
                <Button
                  variant="outline"
                  className="mt-4 gap-2"
                  onClick={() => setShowCreateModal(true)}
                  data-ocid="gov-empty-create-btn"
                >
                  <Plus className="h-4 w-4" />
                  {t(locale, "gov.createProposal")}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4" data-ocid="gov-proposals-list">
              {activeProposals.map((proposal) => (
                <ProposalCard
                  key={String(proposal.id)}
                  proposal={proposal}
                  onVote={() => setVotingProposal(proposal)}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Execution History */}
        <TabsContent value="history" className="mt-6">
          <ExecutionHistoryTable
            proposals={executedProposals}
            loading={loading}
          />
        </TabsContent>

        {/* Treasury */}
        <TabsContent value="treasury" className="mt-6">
          <TreasuryPanel
            balance={treasuryBalance}
            withdrawals={withdrawals}
            loading={loading}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showCreateModal && (
        <CreateProposalModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchData();
          }}
        />
      )}

      {votingProposal && (
        <VotingModal
          proposal={votingProposal}
          onClose={() => setVotingProposal(null)}
          onVoted={() => {
            setVotingProposal(null);
            fetchData();
          }}
        />
      )}
    </main>
  );
}
