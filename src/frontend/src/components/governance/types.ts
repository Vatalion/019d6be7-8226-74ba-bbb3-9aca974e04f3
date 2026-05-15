// Governance domain types — mirrors canister Motoko types

export type ProposalType =
  | { __kind: "ParameterChange" }
  | { __kind: "TreasuryTransfer" }
  | { __kind: "TextResolution" };

export type ProposalStatus =
  | { active: null }
  | { passed: null }
  | { rejected: null }
  | { executed: null }
  | { expired: null };

export interface Proposal {
  id: bigint;
  proposer: string;
  proposalType: ProposalType;
  description: string;
  yesVotes: bigint;
  noVotes: bigint;
  deadline: bigint; // nanoseconds timestamp
  status: ProposalStatus;
  createdAt: bigint;
}

export interface Withdrawal {
  id: bigint;
  tradeId: string;
  amount: bigint;
  timestamp: bigint;
  recipient: string;
}

export type ProposalStatusKey =
  | "active"
  | "passed"
  | "rejected"
  | "executed"
  | "expired";

export function getStatusKey(status: ProposalStatus): ProposalStatusKey {
  if ("active" in status) return "active";
  if ("passed" in status) return "passed";
  if ("rejected" in status) return "rejected";
  if ("executed" in status) return "executed";
  return "expired";
}

export function getProposalTypeLabel(type: ProposalType): string {
  if ("__kind" in type) {
    switch (type.__kind) {
      case "ParameterChange":
        return "ParameterChange";
      case "TreasuryTransfer":
        return "TreasuryTransfer";
      case "TextResolution":
        return "TextResolution";
    }
  }
  return "Unknown";
}
