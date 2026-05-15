import type { ListingCard as ListingCardType } from "@/backend";
import { ItemCondition, ShippingCarrier, TrustLevel } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { MapPin, Package, Star, Truck, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { detectLocale, t } from "../../i18n";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatPrice(amount: bigint, token: string): string {
  const num = Number(amount) / 1e8;
  const formatted = num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
  return `${formatted} ${token}`;
}

function conditionLabel(c: ItemCondition): string {
  const locale = detectLocale();
  const map: Record<ItemCondition, Parameters<typeof t>[1]> = {
    [ItemCondition.new_]: "condition.new",
    [ItemCondition.likeNew]: "condition.likeNew",
    [ItemCondition.good]: "condition.good",
    [ItemCondition.fair]: "condition.fair",
    [ItemCondition.poor]: "condition.poor",
  };
  return t(locale, map[c] ?? "condition.new");
}

function conditionVariant(
  c: ItemCondition,
): "default" | "secondary" | "outline" | "destructive" {
  if (c === ItemCondition.new_ || c === ItemCondition.likeNew) return "default";
  if (c === ItemCondition.good) return "secondary";
  return "outline";
}

function trustBadgeClass(level: TrustLevel): string {
  const map: Record<TrustLevel, string> = {
    [TrustLevel.new_]: "badge-tier-new",
    [TrustLevel.bronze]: "badge-tier-bronze",
    [TrustLevel.silver]: "badge-tier-silver",
    [TrustLevel.gold]: "badge-tier-gold",
  };
  return map[level] ?? "badge-tier-new";
}

function trustBadgeLabel(level: TrustLevel): string {
  const locale = detectLocale();
  const map: Record<TrustLevel, Parameters<typeof t>[1]> = {
    [TrustLevel.new_]: "trust.tier.new",
    [TrustLevel.bronze]: "trust.tier.bronze",
    [TrustLevel.silver]: "trust.tier.silver",
    [TrustLevel.gold]: "trust.tier.gold",
  };
  return t(locale, map[level] ?? "trust.tier.new");
}

function carrierTitle(carrier: ShippingCarrier): string {
  const locale = detectLocale();
  const map: Record<ShippingCarrier, Parameters<typeof t>[1]> = {
    [ShippingCarrier.nova_poshta]: "carrier.nova_poshta",
    [ShippingCarrier.ukrposhta]: "carrier.ukrposhta",
    [ShippingCarrier.meest]: "carrier.meest",
    [ShippingCarrier.self_pickup]: "carrier.self_pickup",
    [ShippingCarrier.digital]: "carrier.digital",
  };
  return t(locale, map[carrier] ?? "carrier.nova_poshta");
}

function CarrierIcon({ carrier }: { carrier: ShippingCarrier }): ReactNode {
  const title = carrierTitle(carrier);
  switch (carrier) {
    case ShippingCarrier.nova_poshta:
      return (
        <span title={title}>
          <Truck className="w-3 h-3" />
        </span>
      );
    case ShippingCarrier.ukrposhta:
      return (
        <span title={title}>
          <Package className="w-3 h-3" />
        </span>
      );
    case ShippingCarrier.meest:
      return (
        <span title={title}>
          <Zap className="w-3 h-3" />
        </span>
      );
    case ShippingCarrier.self_pickup:
      return (
        <span title={title}>
          <MapPin className="w-3 h-3" />
        </span>
      );
    case ShippingCarrier.digital:
      return (
        <span title={title}>
          <Zap className="w-3 h-3" />
        </span>
      );
    default:
      return (
        <span title={title}>
          <Package className="w-3 h-3" />
        </span>
      );
  }
}

// ─── component ──────────────────────────────────────────────────────────────

interface ListingCardProps {
  listing: ListingCardType;
}

export function ListingCard({ listing }: ListingCardProps) {
  const navigate = useNavigate();
  const photo = listing.photos[0] ?? "/assets/images/placeholder.svg";

  const uniqueCarriers = Array.from(
    new Set(listing.shippingMethods.map((m) => m.carrier)),
  );

  return (
    <Card
      data-ocid="listing-card"
      className="card-elevated group cursor-pointer overflow-hidden flex flex-col hover:border-accent/40 transition-smooth"
      onClick={() =>
        navigate({ to: "/listings/$id", params: { id: listing.id.toString() } })
      }
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={photo}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "/assets/images/placeholder.svg";
          }}
        />
        {/* Category pill */}
        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-card/80 backdrop-blur-sm text-[10px] sm:text-xs font-medium text-foreground border border-border capitalize">
          {listing.category}
        </span>
        {/* Condition badge */}
        <span className="absolute top-1.5 right-1.5">
          <Badge
            variant={conditionVariant(listing.condition)}
            className="text-[10px] sm:text-xs px-1.5 py-0"
          >
            {conditionLabel(listing.condition)}
          </Badge>
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 p-2.5 sm:p-3 flex-1">
        {/* Title — 1 line on mobile, 2 on sm+ */}
        <h3 className="font-medium sm:font-semibold text-foreground text-xs sm:text-sm leading-snug line-clamp-1 sm:line-clamp-2 sm:min-h-[2.5rem]">
          {listing.title}
        </h3>

        {/* Price — prominent on mobile */}
        <div className="token-chip self-start text-accent font-bold text-xs sm:text-sm">
          {formatPrice(listing.priceAmount, listing.priceToken)}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
          <span className="truncate">{listing.location}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-1.5 sm:pt-2 border-t border-border">
          {/* Seller */}
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-[10px] sm:text-xs text-foreground font-medium truncate max-w-[60px] sm:max-w-[80px]">
              {listing.sellerUsername}
            </span>
            {/* Trust badge: hidden on mobile to save space */}
            <span
              className={`hidden sm:inline ${trustBadgeClass(listing.sellerTrustLevel)}`}
            >
              {trustBadgeLabel(listing.sellerTrustLevel)}
            </span>
          </div>

          {/* Shipping + Rating */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Carrier icons: only first 1 on mobile, up to 3 on sm+ */}
            <div className="flex items-center gap-0.5 text-muted-foreground">
              {uniqueCarriers.slice(0, 1).map((carrier) => (
                <span key={carrier} className="sm:hidden">
                  <CarrierIcon carrier={carrier} />
                </span>
              ))}
              {uniqueCarriers.slice(0, 3).map((carrier) => (
                <span key={carrier} className="hidden sm:inline">
                  <CarrierIcon carrier={carrier} />
                </span>
              ))}
            </div>

            {/* Rating */}
            {listing.sellerRating > 0n && (
              <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-accent fill-accent" />
                <span>{Number(listing.sellerRating).toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── skeleton ───────────────────────────────────────────────────────────────

export function ListingCardSkeleton() {
  return (
    <Card className="card-elevated overflow-hidden flex flex-col">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="flex flex-col gap-1.5 p-2.5 sm:p-3">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-2.5 w-20" />
        <div className="flex justify-between pt-1.5 border-t border-border">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </Card>
  );
}
