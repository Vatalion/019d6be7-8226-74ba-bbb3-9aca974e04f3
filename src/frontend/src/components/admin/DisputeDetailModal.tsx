import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Gavel, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { DisputeView, Message } from "../../backend.d";
import { ResolutionOutcome } from "../../backend.d";
import { useBackend } from "../../hooks/useBackend";
import { formatPrincipal, formatTimestamp } from "../../lib/format";

interface Props {
  dispute: DisputeView;
  onClose: () => void;
}

const REASON_LABELS: Record<string, string> = {
  other: "Other",
  item_damaged: "Item Damaged",
  seller_unresponsive: "Seller Unresponsive",
  item_differs: "Item Differs",
  item_not_received: "Not Received",
};

export default function DisputeDetailModal({ dispute, onClose }: Props) {
  const [outcome, setOutcome] = useState<ResolutionOutcome>(
    ResolutionOutcome.buyer_wins,
  );
  const [notes, setNotes] = useState("");

  const { actor, isFetching } = useBackend();
  const queryClient = useQueryClient();

  const { data: thread = [], isLoading: threadLoading } = useQuery<Message[]>({
    queryKey: ["moderatorThread", dispute.trade.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getModeratorThread(dispute.trade);
    },
    enabled: !!actor && !isFetching,
  });

  const resolveMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.resolveDispute(dispute.id, outcome, notes);
    },
    onSuccess: (result) => {
      if (result.__kind__ === "err") {
        toast.error("Failed to resolve dispute");
        return;
      }
      toast.success("Dispute resolved");
      queryClient.invalidateQueries({ queryKey: ["openDisputeQueue"] });
      onClose();
    },
    onError: () => toast.error("Failed to resolve dispute"),
  });

  const reasonKey = String(
    (dispute.reason as unknown as Record<string, unknown>).__kind__ ??
      dispute.reason,
  );
  const statusKey = String(
    (dispute.status as unknown as Record<string, unknown>).__kind__ ??
      dispute.status,
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-accent" />
            Dispute #{dispute.id.toString()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Trade info */}
          <section className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Trade Info
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Trade ID: </span>
                <span className="font-mono text-foreground">
                  #{dispute.trade.toString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Initiator: </span>
                <span className="font-mono text-foreground">
                  {formatPrincipal(dispute.initiator)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Reason: </span>
                <span className="text-foreground">
                  {REASON_LABELS[reasonKey] ?? reasonKey}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Status: </span>
                <span className="font-semibold text-foreground capitalize">
                  {statusKey.replace("_", " ")}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Opened: </span>
                <span className="text-foreground">
                  {formatTimestamp(dispute.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </section>

          {/* Description */}
          <section>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Description
            </p>
            <p className="rounded-md border border-border bg-card p-3 text-sm text-foreground">
              {dispute.description || (
                <span className="italic text-muted-foreground">
                  No description provided.
                </span>
              )}
            </p>
          </section>

          {/* Evidence URLs */}
          {dispute.evidenceUrls.length > 0 && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Evidence ({dispute.evidenceUrls.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {dispute.evidenceUrls.map((url, idx) => (
                  <a
                    key={`ev-${url}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-ocid="evidence-link"
                    className="flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-accent hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Evidence {idx + 1}
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Moderator chat thread */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Moderator Thread
              </p>
            </div>
            {threadLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-3/4" />
              </div>
            ) : thread.length === 0 ? (
              <p className="text-sm italic text-muted-foreground">
                No moderator messages yet.
              </p>
            ) : (
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-border bg-muted/20 p-3">
                {thread.map((msg) => (
                  <div
                    key={msg.id.toString()}
                    data-ocid="moderator-thread-msg"
                    className="rounded-md bg-card p-2.5 text-sm"
                  >
                    <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">
                        {formatPrincipal(msg.sender)}
                      </span>
                      <span>·</span>
                      <span>
                        {formatTimestamp(msg.sentAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-foreground">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Resolution form */}
          {statusKey !== "resolved" && (
            <section className="rounded-lg border border-border bg-card p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Resolution
              </p>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="resolution-favor">Favor</Label>
                  <Select
                    value={outcome}
                    onValueChange={(v) => setOutcome(v as ResolutionOutcome)}
                  >
                    <SelectTrigger
                      id="resolution-favor"
                      data-ocid="resolution-outcome-select"
                      className="mt-1 w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ResolutionOutcome.buyer_wins}>
                        Buyer wins
                      </SelectItem>
                      <SelectItem value={ResolutionOutcome.seller_wins}>
                        Seller wins
                      </SelectItem>
                      <SelectItem value={ResolutionOutcome.split}>
                        Split
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="resolution-notes">Resolution note</Label>
                  <Textarea
                    id="resolution-notes"
                    data-ocid="resolution-notes-input"
                    placeholder="Explain the resolution reasoning…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    data-ocid="submit-resolution-btn"
                    disabled={!notes.trim() || resolveMutation.isPending}
                    onClick={() => resolveMutation.mutate()}
                  >
                    {resolveMutation.isPending
                      ? "Submitting…"
                      : "Submit Resolution"}
                  </Button>
                </div>
              </div>
            </section>
          )}

          {/* Existing resolution */}
          {dispute.resolution && (
            <section className="rounded-lg border border-border bg-card p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Resolution Applied
              </p>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Outcome: </span>
                  <span className="font-semibold capitalize text-accent">
                    {String(dispute.resolution.outcome).replace("_", " ")}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Notes: </span>
                  <span className="text-foreground">
                    {dispute.resolution.notes}
                  </span>
                </div>
              </div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
