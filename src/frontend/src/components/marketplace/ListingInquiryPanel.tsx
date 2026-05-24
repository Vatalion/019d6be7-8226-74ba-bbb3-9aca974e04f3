import { createActor } from "@/backend";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type ListingInquiryMessage,
  asEngagementActor,
  isResultErr,
} from "@/lib/engagementActor";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import type { Principal } from "@dfinity/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  listingId: bigint;
  buyerPrincipal?: Principal;
  isOwner: boolean;
};

export function ListingInquiryPanel({
  listingId,
  buyerPrincipal,
  isOwner,
}: Props) {
  const { actor } = useActor(createActor);
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const caller = identity?.getPrincipal();
  const isAuthed = caller != null && !caller.isAnonymous();
  const inquiryBuyer = isOwner ? buyerPrincipal : caller;

  const { data: messages = [] } = useQuery({
    queryKey: [
      "listing-inquiry",
      listingId.toString(),
      inquiryBuyer?.toText() ?? "",
    ],
    enabled:
      open &&
      isAuthed &&
      actor != null &&
      inquiryBuyer != null &&
      !inquiryBuyer.isAnonymous(),
    queryFn: async () => {
      const a = asEngagementActor(actor);
      if (!a.getListingInquiryMessages || !inquiryBuyer) return [];
      const r = await a.getListingInquiryMessages(listingId, inquiryBuyer);
      if (isResultErr(r)) return [];
      return (r as { ok: ListingInquiryMessage[] }).ok ?? [];
    },
  });

  const send = useMutation({
    mutationFn: async (content: string) => {
      const a = asEngagementActor(actor);
      if (!a.sendListingInquiry || !a.sendListingInquiryReply) {
        throw new Error("Inquiries not available");
      }
      if (isOwner && buyerPrincipal) {
        const r = await a.sendListingInquiryReply(
          listingId,
          buyerPrincipal,
          content,
        );
        if (isResultErr(r)) throw new Error("send failed");
        return;
      }
      const r = await a.sendListingInquiry(listingId, content);
      if (isResultErr(r)) throw new Error("send failed");
    },
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({
        queryKey: ["listing-inquiry", listingId.toString()],
      });
    },
    onError: () => toast.error("Could not send message"),
  });

  if (!isAuthed || (isOwner && !buyerPrincipal)) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          data-ocid="listing-inquiry-btn"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {isOwner ? "Buyer messages" : "Ask seller"}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isOwner ? "Pre-trade chat" : "Message before buying"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-2 min-h-[120px] max-h-[240px] border rounded-md p-3 bg-muted/30">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages yet.</p>
          ) : (
            messages.map((m) => {
              const mine =
                caller != null && m.sender.compareTo(caller) === "eq";
              return (
                <div
                  key={String(m.id)}
                  className={`text-sm rounded-lg px-3 py-2 max-w-[85%] ${
                    mine
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {m.content}
                </div>
              );
            })
          )}
        </div>
        <div className="space-y-2 pt-2">
          <Label htmlFor="inquiry-draft">Your message</Label>
          <Textarea
            id="inquiry-draft"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            maxLength={2000}
          />
          <Button
            type="button"
            disabled={!draft.trim() || send.isPending}
            onClick={() => send.mutate(draft.trim())}
          >
            Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
