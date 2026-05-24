import { createActor } from "@/backend";
import { Button } from "@/components/ui/button";
import { asEngagementActor, isResultErr } from "@/lib/engagementActor";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";

type Props = {
  listingId: bigint;
  className?: string;
};

export function FavoriteButton({ listingId, className }: Props) {
  const { actor } = useActor(createActor);
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthed = identity != null && !identity.getPrincipal().isAnonymous();

  const { data: isFavorite = false } = useQuery({
    queryKey: ["listing-favorite", listingId.toString()],
    enabled: isAuthed && actor != null,
    queryFn: async () => {
      const a = asEngagementActor(actor);
      if (!a.isListingFavorite) return false;
      return a.isListingFavorite(listingId);
    },
  });

  const toggle = useMutation({
    mutationFn: async () => {
      const a = asEngagementActor(actor);
      if (!a.addFavorite || !a.removeFavorite) {
        throw new Error("Favorites not available on this deployment");
      }
      if (isFavorite) {
        const r = await a.removeFavorite(listingId);
        if (isResultErr(r)) throw new Error("favorite failed");
      } else {
        const r = await a.addFavorite(listingId);
        if (isResultErr(r)) throw new Error("favorite failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["listing-favorite", listingId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["favorite-listings"] });
    },
    onError: () => toast.error("Could not update favorites"),
  });

  if (!isAuthed) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      disabled={toggle.isPending}
      onClick={() => toggle.mutate()}
      data-ocid="favorite-listing-btn"
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isFavorite}
    >
      <Heart
        className={`h-3.5 w-3.5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
      />
    </Button>
  );
}
