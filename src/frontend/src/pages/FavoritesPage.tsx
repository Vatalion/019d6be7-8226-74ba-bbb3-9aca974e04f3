import { createActor } from "@/backend";
import { Skeleton } from "@/components/ui/skeleton";
import { asEngagementActor } from "@/lib/engagementActor";
import type { ListingCard } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Heart, PackageSearch } from "lucide-react";

export default function FavoritesPage() {
  const { actor } = useActor(createActor);
  const navigate = useNavigate();

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["favorite-listings"],
    queryFn: async () => {
      const a = asEngagementActor(actor);
      if (!a.getFavoriteListings) return [];
      return (await a.getFavoriteListings()) as ListingCard[];
    },
  });

  return (
    <div className="page-container py-8 space-y-6" data-ocid="favorites-page">
      <div className="flex items-center gap-2">
        <Heart className="h-6 w-6 text-red-500" />
        <h1 className="text-2xl font-bold">Favorites</h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {["a", "b", "c", "d", "e", "f"].map((id) => (
            <Skeleton key={id} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <p className="text-muted-foreground">No favorite listings yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <button
              key={String(listing.id)}
              type="button"
              className="card-elevated overflow-hidden text-left"
              onClick={() =>
                navigate({
                  to: "/listings/$id",
                  params: { id: String(listing.id) },
                })
              }
            >
              <div className="aspect-[4/3] bg-muted relative">
                {listing.photos[0] ? (
                  <img
                    src={listing.photos[0]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <PackageSearch className="h-10 w-10 opacity-30" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold line-clamp-2">{listing.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {listing.location}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
