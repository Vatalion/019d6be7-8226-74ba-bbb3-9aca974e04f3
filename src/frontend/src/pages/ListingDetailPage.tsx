import { type Backend, type TradeCapTierCheck, createActor } from "@/backend";
import {
  ItemCondition,
  ShippingCarrier,
  type ShippingOption,
  TradeCapTier,
  type TradeFeeQuote,
  TradeToken,
  TrustLevel,
  type UserProfile,
  UserRole,
} from "@/backend.d";
import { FavoriteButton } from "@/components/marketplace/FavoriteButton";
import { ListingInquiryPanel } from "@/components/marketplace/ListingInquiryPanel";
import { ShareListingButton } from "@/components/marketplace/ShareListingButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { asEngagementActor, isResultErr } from "@/lib/engagementActor";
import type { ListingCard } from "@/types";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flag,
  Loader2,
  LogIn,
  MapPin,
  PackageSearch,
  Pencil,
  PowerOff,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShippingProviderSelector } from "../components/shared/ShippingProviderSelector";
import { useLocale } from "../hooks/useLocale";
import { detectLocale, t } from "../i18n";
import { ACTIVE_PHYSICAL_SHIPPING_CARRIER } from "../lib/deliveryPolicy";
import { initiateListingTrade } from "../lib/initiateListingTrade";
import { formatTokenAmount, toTradeFeeQuoteView } from "../lib/tradeFeeQuote";

const TOKEN_COLORS: Record<string, string> = {
  USDT_TRC20:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border-emerald-500/30",
  USDT_BEP20:
    "bg-green-500/15 text-green-700 dark:text-green-200 border-green-500/30",
  USDT_ERC20:
    "bg-teal-500/15 text-teal-700 dark:text-teal-200 border-teal-500/30",
  USDC_ERC20:
    "bg-blue-500/15 text-blue-700 dark:text-blue-200 border-blue-500/30",
};

const TRUST_CLASSES: Record<TrustLevel, string> = {
  [TrustLevel.new_]: "badge-tier-new",
  [TrustLevel.bronze]: "badge-tier-bronze",
  [TrustLevel.silver]: "badge-tier-silver",
  [TrustLevel.gold]: "badge-tier-gold",
};

const CONDITION_LABEL_KEYS: Record<ItemCondition, string> = {
  [ItemCondition.new_]: "condition.new",
  [ItemCondition.likeNew]: "condition.likeNew",
  [ItemCondition.good]: "condition.good",
  [ItemCondition.fair]: "condition.fair",
  [ItemCondition.poor]: "condition.poor",
};

const CONDITION_COLORS: Record<ItemCondition, string> = {
  [ItemCondition.new_]:
    "bg-green-500/15 text-green-700 dark:text-green-200 border-green-500/30",
  [ItemCondition.likeNew]:
    "bg-teal-500/15 text-teal-700 dark:text-teal-200 border-teal-500/30",
  [ItemCondition.good]:
    "bg-blue-500/15 text-blue-700 dark:text-blue-200 border-blue-500/30",
  [ItemCondition.fair]:
    "bg-yellow-500/15 text-yellow-700 dark:text-yellow-200 border-yellow-500/30",
  [ItemCondition.poor]:
    "bg-red-500/15 text-red-700 dark:text-red-200 border-red-500/30",
};

// Only approved stablecoins shown in payment methods
const APPROVED_TOKENS: TradeToken[] = [
  TradeToken.USDT_TRC20,
  TradeToken.USDT_BEP20,
  TradeToken.USDT_ERC20,
  TradeToken.USDC_ERC20,
];

const TOKEN_DISPLAY: Record<string, string> = {
  USDT_TRC20: "USDT · TRC20",
  USDT_BEP20: "USDT · BEP20",
  USDT_ERC20: "USDT · ERC20",
  USDC_ERC20: "USDC · ERC20",
};

const CARRIER_LABEL_KEYS: Partial<Record<ShippingCarrier, string>> = {
  [ShippingCarrier.self_pickup]: "carrier.self_pickup",
  [ShippingCarrier.nova_poshta]: "carrier.nova_poshta",
  [ShippingCarrier.ukrposhta]: "carrier.ukrposhta",
  [ShippingCarrier.meest]: "carrier.meest",
  [ShippingCarrier.digital]: "carrier.digital",
};

function fallbackFeeQuote(
  priceAmount: bigint,
  priceToken: TradeToken,
): TradeFeeQuote {
  const platformFeeAmount = (priceAmount * 300n + 9999n) / 10000n;
  return {
    itemPrice: priceAmount,
    platformFeeAmount,
    platformFeeBps: 300n,
    totalBuyerAmount: priceAmount + platformFeeAmount,
    token: priceToken,
    usesDefaultFeeBps: true,
  };
}

function formatTokenDisplay(token: TradeToken | string): string {
  return TOKEN_DISPLAY[String(token)] ?? String(token);
}

function formatPrice(amount: bigint, token: TradeToken): string {
  return formatTokenAmount(amount, token);
}

function tradeCapTierBand(
  check: TradeCapTierCheck,
): "standard" | "elevated" | "highValueCk" | "rejected" {
  if (check.tier === TradeCapTier.rejected) return "rejected";
  if (check.tier === TradeCapTier.high_value_ck) return "highValueCk";
  if (check.tier === TradeCapTier.elevated) return "elevated";
  return "standard";
}

function tradeCapMessageKey(check: TradeCapTierCheck): string {
  const band = tradeCapTierBand(check);
  if (!check.allowed) {
    if (band === "rejected") return "detail.tradeCap.rejected";
    if (band === "highValueCk" && check.gateCRequired) {
      return "detail.tradeCap.gateCOff";
    }
    if (band === "elevated") return "detail.tradeCap.elevatedStakeMissing";
    return "detail.tradeCap.blocked";
  }
  switch (band) {
    case "rejected":
      return "detail.tradeCap.rejected";
    case "highValueCk":
      return "detail.tradeCap.highValueCk";
    case "elevated":
      return check.sellerVerifiedTierOk
        ? "detail.tradeCap.elevatedVerifiedOk"
        : check.sellerStakeOk
          ? "detail.tradeCap.elevatedStakeOk"
          : "detail.tradeCap.elevated";
    default:
      return "detail.tradeCap.standard";
  }
}

function TradeCapRequirementsPanel({
  check,
}: {
  check: TradeCapTierCheck;
}) {
  const { t: tl } = useLocale();
  const band = tradeCapTierBand(check);
  const messageKey = tradeCapMessageKey(check);
  const isWarning = !check.allowed || band !== "standard";

  if (!isWarning && band === "standard") {
    return null;
  }

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-xs ${
        check.allowed
          ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200"
          : "border-destructive/40 bg-destructive/10 text-destructive"
      }`}
      data-ocid={`trade-cap-tier-${band}`}
    >
      <p className="font-semibold">{tl("detail.tradeCap.title")}</p>
      <p className="mt-1">{tl(messageKey as Parameters<typeof tl>[0])}</p>
      {(check.blockReason?.length ?? 0) > 0 && (
        <p className="mt-1 opacity-90">{check.blockReason?.[0]}</p>
      )}
    </div>
  );
}

function PhotoCarousel({ photos, title }: { photos: string[]; title: string }) {
  const { t: tl } = useLocale();
  const [idx, setIdx] = useState(0);
  const total = photos.length;

  if (total === 0) {
    return (
      <div className="aspect-[4/3] w-full bg-muted rounded-lg flex items-center justify-center">
        <PackageSearch className="h-16 w-16 text-muted-foreground opacity-30" />
      </div>
    );
  }

  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-[4/3] w-full bg-muted rounded-lg overflow-hidden"
        data-ocid="photo-carousel"
      >
        <img
          src={photos[idx]}
          alt={`${title} — view ${idx + 1}`}
          className="w-full h-full object-cover"
        />
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-card transition-colors"
              aria-label={tl("detail.carousel.prev")}
              data-ocid="carousel-prev"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-card transition-colors"
              aria-label={tl("detail.carousel.next")}
              data-ocid="carousel-next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="absolute bottom-2 right-2 text-xs bg-background/80 text-foreground px-2 py-0.5 rounded-full border border-border">
              {idx + 1} / {total}
            </span>
          </>
        )}
      </div>
      {total > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((src, i) => (
            <button
              key={src || `thumb-${String(i)}`}
              type="button"
              onClick={() => setIdx(i)}
              className={`shrink-0 h-14 w-14 rounded-md overflow-hidden border-2 transition-colors ${i === idx ? "border-accent" : "border-border"}`}
              aria-label={tl("detail.carousel.thumb").replace(
                "{n}",
                String(i + 1),
              )}
              data-ocid={`carousel-thumb-${i}`}
            >
              <img
                src={src}
                alt={`${title} — view ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SellerCard({
  profile,
  sellerPrincipalText,
}: {
  profile: UserProfile;
  sellerPrincipalText?: string;
}) {
  const { t: tl } = useLocale();
  const navigate = useNavigate();
  return (
    <div
      className="bg-muted/30 rounded-lg border border-border p-4 space-y-3"
      data-ocid="seller-card"
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile.avatarUrl} alt={profile.username} />
          <AvatarFallback className="bg-muted font-semibold">
            {profile.username?.[0]?.toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground truncate">
              {profile.username}
            </span>
            <span className={TRUST_CLASSES[profile.trustLevel]}>
              {profile.trustLevel}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {profile.bio || tl("detail.marketplaceMember")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
          <span className="text-foreground font-medium">
            {(Number(profile.reputationScore) / 10).toFixed(1)}
          </span>
          <span>{tl("detail.reputation")}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-accent" />
          <span className="text-foreground font-medium">
            {tl("detail.verified")}
          </span>
        </div>
      </div>
      {sellerPrincipalText && (
        <button
          type="button"
          onClick={() =>
            navigate({
              to: "/profile/$id",
              params: { id: sellerPrincipalText },
            })
          }
          className="flex items-center gap-1.5 text-xs text-accent hover:underline underline-offset-2 transition-colors"
          data-ocid="seller-profile-link"
        >
          <ExternalLink className="h-3 w-3" />
          {tl("detail.viewSellerProfile")}
        </button>
      )}
    </div>
  );
}

// Compact listing card for "other listings by seller"
function OtherListingCard({ listing }: { listing: ListingCard }) {
  const navigate = useNavigate();
  const photo = listing.photos[0];
  return (
    <button
      type="button"
      onClick={() =>
        navigate({
          to: "/listings/$id",
          params: { id: listing.id.toString() },
        })
      }
      className="flex flex-col overflow-hidden rounded-lg border border-border bg-card hover:border-accent/60 transition-colors text-left"
      data-ocid="other-listing-card"
    >
      <div className="aspect-[4/3] bg-muted overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PackageSearch className="h-6 w-6 text-muted-foreground opacity-30" />
          </div>
        )}
      </div>
      <div className="p-2 space-y-0.5">
        <p className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">
          {listing.title}
        </p>
        <p className="text-xs font-bold text-accent">
          {formatPrice(listing.priceAmount, listing.priceToken)}
        </p>
      </div>
    </button>
  );
}

export default function ListingDetailPage() {
  const navigate = useNavigate();
  const params = useParams({ from: "/listings/$id" });
  const listingId = BigInt(params.id);
  const locale = detectLocale();
  const { t: tl } = useLocale();
  const queryClient = useQueryClient();

  const { actor, isFetching } = useActor(createActor);
  const { identity, login } = useInternetIdentity();
  const isAuthed = !!identity && !identity.getPrincipal().isAnonymous();

  const [selectedCarrier, setSelectedCarrier] =
    useState<ShippingCarrier | null>(ACTIVE_PHYSICAL_SHIPPING_CARRIER);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const {
    data: listing,
    isLoading,
    isError,
    isFetched,
    refetch: refetchListing,
  } = useQuery<ListingCard | null>({
    queryKey: ["listing", params.id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getListing(listingId) as Promise<ListingCard | null>;
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!actor || !listing) return;
    void actor.incrementListingView(listingId).catch(() => {});
  }, [actor, listing, listingId]);

  const { data: platformFlags } = useQuery({
    queryKey: ["platformFlags"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPlatformFlags();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });

  const { data: tradeCapCheck } = useQuery<TradeCapTierCheck | null>({
    queryKey: ["tradeCapTierCheck", params.id, listing?.priceToken],
    queryFn: async () => {
      if (!actor || !listing) return null;
      return actor.tradeCapTierCheck(listingId, listing.priceToken);
    },
    enabled: !!actor && !!listing && !isFetching,
    staleTime: 60_000,
  });

  const tradeCapBlocked = tradeCapCheck != null && !tradeCapCheck.allowed;

  const { data: myProfile } = useQuery<UserProfile | null>({
    queryKey: ["myProfile"],
    queryFn: async () => {
      if (!actor || !isAuthed) return null;
      return actor.getMyProfile();
    },
    enabled: !!actor && isAuthed && !isFetching,
  });

  // Determine if the current viewer is the listing owner (by principal comparison)
  const isOwner =
    isAuthed &&
    myProfile != null &&
    listing != null &&
    myProfile.id.toText() === listing.sellerPrincipal.toText();

  // Owner's principal text — used for profile link and fetching other listings
  const ownerPrincipalText = listing
    ? listing.sellerPrincipal.toText()
    : undefined;

  // Fetch seller's other active listings (available to all viewers once listing is loaded)
  const { data: otherListings = [], isLoading: otherListingsLoading } =
    useQuery<ListingCard[]>({
      queryKey: ["sellerListings", ownerPrincipalText, params.id],
      queryFn: async () => {
        if (!actor || !listing) return [];
        const results = (await actor.getListingsByUser(
          listing.sellerPrincipal,
          BigInt(0),
          BigInt(5),
        )) as ListingCard[];
        // Filter out the current listing
        return results.filter((l) => l.id.toString() !== params.id);
      },
      enabled: !!actor && !!listing && !isFetching,
    });

  const isAdmin =
    myProfile?.role === UserRole.admin ||
    myProfile?.role === UserRole.moderator;

  const { data: feeQuoteRaw, isLoading: feeQuoteLoading } =
    useQuery<TradeFeeQuote | null>({
      queryKey: ["tradeFeeQuote", params.id],
      queryFn: async () => {
        if (!actor) return null;
        return actor.getTradeFeeQuote(listingId);
      },
      enabled: !!actor && checkoutOpen && !isFetching,
      staleTime: 60_000,
    });

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !listing) throw new Error("Not ready");
      const reason = reportReason.trim();
      if (!reason) throw new Error("empty");
      return actor.reportListing(listing.id, reason);
    },
    onSuccess: (res) => {
      const isErr = (r: { __kind__?: string; err?: unknown }) =>
        r.__kind__ === "err" || (r.__kind__ === undefined && "err" in r);
      if (isErr(res)) {
        toast.error(tl("detail.reportError"));
        return;
      }
      toast.success(tl("detail.reportSuccess"));
      setReportOpen(false);
      setReportReason("");
    },
    onError: () => toast.error(tl("detail.reportError")),
  });

  const bumpMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !listing) throw new Error("Not ready");
      const a = asEngagementActor(actor);
      if (!a.bumpListing) throw new Error("Bump not available");
      return a.bumpListing(listing.id);
    },
    onSuccess: (res) => {
      if (isResultErr(res)) {
        toast.error("Bump failed — try again in 24 hours");
        return;
      }
      toast.success("Listing bumped to the top");
      queryClient.invalidateQueries({ queryKey: ["listing", params.id] });
    },
    onError: () => toast.error("Could not bump listing"),
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !listing) throw new Error("Not ready");
      await actor.removeListingByAdmin(
        listing.id,
        "Removed by admin via detail page",
      );
    },
    onSuccess: () => {
      toast.success(tl("detail.removedSuccess"));
      navigate({ to: "/listings" });
    },
    onError: () => toast.error(tl("detail.removedError")),
  });

  const deactivateMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !listing) throw new Error("Not ready");
      return actor.deactivateListing(listing.id);
    },
    onSuccess: (res) => {
      const isErr = (r: { __kind__?: string; err?: unknown }) =>
        r.__kind__ === "err" || (r.__kind__ === undefined && "err" in r);
      if (isErr(res)) {
        toast.error(tl("detail.deactivateError"));
        return;
      }
      toast.success(tl("detail.deactivateSuccess"));
      void queryClient.invalidateQueries({ queryKey: ["myListings"] });
      void queryClient.invalidateQueries({ queryKey: ["listings"] });
      navigate({ to: "/listings" });
    },
    onError: (e: unknown) => {
      toast.error(
        e instanceof Error ? e.message : tl("detail.deactivateErrorGeneric"),
      );
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !listing) throw new Error("Not ready");
      return actor.reactivateListing(listing.id);
    },
    onSuccess: (res) => {
      const isErr = (r: unknown): boolean => {
        if (r == null || typeof r !== "object") return false;
        const record = r as Record<string, unknown>;
        return (
          record.__kind__ === "err" ||
          (record.__kind__ === undefined && "err" in record)
        );
      };
      if (isErr(res)) {
        toast.error(tl("detail.reactivateError"));
        return;
      }
      toast.success(tl("detail.reactivateSuccess"));
      void queryClient.invalidateQueries({ queryKey: ["listing", params.id] });
      void queryClient.invalidateQueries({ queryKey: ["myListings"] });
      void queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
    onError: () => {
      toast.error(tl("detail.reactivateError"));
    },
  });

  const startTradeMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !listing) throw new Error("not ready");
      const carrier = selectedCarrier ?? ACTIVE_PHYSICAL_SHIPPING_CARRIER;
      const tradeId = await initiateListingTrade(
        actor as Backend,
        listingId,
        listing.priceToken,
        carrier,
        {
          navigate,
          identity: identity ?? undefined,
          amount: listing.priceAmount,
        },
      );
      if (tradeId == null) throw new Error("initiate_failed");
      return tradeId;
    },
    onSuccess: (tradeId) => {
      setCheckoutOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["myTrades"] });
      navigate({
        to: "/trades/$id",
        params: { id: String(tradeId) },
      });
    },
    onError: () => {
      toast.error(tl("detail.buyError"));
    },
  });

  const handleBuyNow = () => {
    if (!isAuthed) {
      login();
      return;
    }
    if (!selectedCarrier) {
      toast.error(tl("detail.selectShippingAndBuy"));
      return;
    }
    setCheckoutOpen(true);
  };

  const handleConfirmCheckout = () => {
    startTradeMutation.mutate();
  };

  const handleCarrierSelect = (
    carrier: ShippingCarrier,
    _option: ShippingOption,
  ) => {
    setSelectedCarrier(carrier);
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4"
        data-ocid="listing-load-error"
      >
        <AlertTriangle className="h-12 w-12 text-destructive opacity-80" />
        <h2 className="text-xl font-semibold text-foreground">
          {tl("detail.loadError")}
        </h2>
        <Button variant="outline" onClick={() => void refetchListing()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {tl("detail.retry")}
        </Button>
      </div>
    );
  }

  if (isFetched && !listing) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4"
        data-ocid="listing-not-found"
      >
        <PackageSearch className="h-16 w-16 text-muted-foreground opacity-30" />
        <h2 className="text-xl font-semibold text-foreground">
          {tl("detail.notFound")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {tl("detail.notFoundDesc")}
        </p>
        <Button variant="outline" onClick={() => navigate({ to: "/listings" })}>
          {tl("detail.browseListings")}
        </Button>
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  // Derive shipping city from listing location for the selector
  const fromCity = listing.location?.split(",")[0]?.trim() ?? "";

  // Payment methods — show only approved stablecoins
  const paymentTokens = APPROVED_TOKENS.filter(
    (tk) =>
      tk === listing.priceToken || APPROVED_TOKENS.includes(tk as TradeToken),
  ).slice(0, 4);

  const feeQuoteSource =
    feeQuoteRaw ?? fallbackFeeQuote(listing.priceAmount, listing.priceToken);
  const feeQuoteView = toTradeFeeQuoteView(feeQuoteSource);
  const carrierLabelKey = selectedCarrier
    ? CARRIER_LABEL_KEYS[selectedCarrier]
    : undefined;
  const deliveryLabel = carrierLabelKey
    ? t(locale, carrierLabelKey as Parameters<typeof t>[1])
    : "—";

  return (
    <div className="bg-background min-h-screen" data-ocid="listing-detail-page">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => navigate({ to: "/listings" })}
            className="hover:text-foreground transition-colors"
            data-ocid="breadcrumb-listings"
          >
            {tl("detail.breadcrumb.listings")}
          </button>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground truncate max-w-[200px]">
            {listing.title}
          </span>
        </nav>

        {/* Inactive banner — shown for ALL viewers when listing is inactive */}
        {(listing as ListingCard & { status?: string }).status ===
          "inactive" && (
          <div
            className="flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3"
            data-ocid="inactive-banner"
          >
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {tl("detail.inactiveBanner")}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: photos */}
          <div>
            <PhotoCarousel photos={listing.photos} title={listing.title} />
          </div>

          {/* Right: details */}
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-start gap-2 justify-between">
                <h1 className="text-xl font-bold text-foreground leading-snug">
                  {listing.title}
                </h1>
                <Badge
                  variant="outline"
                  className={`shrink-0 text-xs border ${CONDITION_COLORS[listing.condition]}`}
                >
                  {t(
                    locale,
                    CONDITION_LABEL_KEYS[listing.condition] as Parameters<
                      typeof t
                    >[1],
                  )}
                </Badge>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-2xl font-bold text-accent">
                  {formatPrice(listing.priceAmount, listing.priceToken)}
                </span>
                <span
                  className={`token-chip text-xs ${TOKEN_COLORS[listing.priceToken] ?? ""}`}
                  data-ocid="price-token"
                >
                  {formatTokenDisplay(listing.priceToken)}
                </span>
              </div>
              {listing.location && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{listing.location}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {(listing as ListingCard & { isPromoted?: boolean })
                  .isPromoted && (
                  <Badge className="gap-1 bg-amber-500/20 text-amber-700 border-amber-500/40">
                    <Sparkles className="h-3 w-3" />
                    Promoted
                  </Badge>
                )}
                <ShareListingButton
                  url={
                    typeof window !== "undefined" ? window.location.href : ""
                  }
                  title={listing.title}
                  label={tl("detail.shareLink")}
                />
                {!isOwner && <FavoriteButton listingId={listing.id} />}
                {!isOwner && (
                  <ListingInquiryPanel listingId={listing.id} isOwner={false} />
                )}
                {!isOwner && (
                  <AlertDialog open={reportOpen} onOpenChange={setReportOpen}>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        data-ocid="report-listing-btn"
                      >
                        <Flag className="h-3.5 w-3.5" />
                        {tl("detail.reportListing")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent
                      className="bg-card border-border"
                      data-ocid="report-listing-dialog"
                    >
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {tl("detail.reportTitle")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                          {isAuthed
                            ? tl("detail.reportDesc")
                            : tl("detail.signInToReport")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      {isAuthed ? (
                        <div className="space-y-2 py-2">
                          <Label htmlFor="report-reason">
                            {tl("detail.reportReason")}
                          </Label>
                          <Textarea
                            id="report-reason"
                            data-ocid="report-reason-input"
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            rows={4}
                            maxLength={500}
                          />
                        </div>
                      ) : null}
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-border">
                          {tl("detail.cancel")}
                        </AlertDialogCancel>
                        {isAuthed ? (
                          <AlertDialogAction
                            onClick={() => reportMutation.mutate()}
                            disabled={
                              reportMutation.isPending || !reportReason.trim()
                            }
                            data-ocid="report-submit-btn"
                          >
                            {tl("detail.reportSubmit")}
                          </AlertDialogAction>
                        ) : (
                          <AlertDialogAction
                            onClick={() => login()}
                            data-ocid="report-login-btn"
                          >
                            <LogIn className="h-4 w-4 mr-1" />
                            {tl("nav.connect")}
                          </AlertDialogAction>
                        )}
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              {platformFlags?.trustlessEscrowEnabled &&
                (listing.priceToken === TradeToken.ckUSDC ||
                  listing.priceToken === TradeToken.ckUSDT) && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    {tl("detail.onChainEscrowBeta")}
                  </p>
                )}
            </div>

            <Separator />

            <SellerCard
              profile={
                {
                  username: listing.sellerUsername,
                  trustLevel: listing.sellerTrustLevel,
                  reputationScore: listing.sellerRating,
                  avatarUrl: "",
                  bio: "",
                  role: UserRole.user,
                } as UserProfile
              }
              sellerPrincipalText={ownerPrincipalText}
            />

            {/* Owner actions — Edit + Deactivate/Reactivate */}
            {isOwner &&
              (() => {
                const isInactive =
                  (listing as ListingCard & { status?: string }).status ===
                  "inactive";
                return (
                  <div
                    className="flex flex-wrap gap-2 pt-1"
                    data-ocid="owner-actions"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                        navigate({
                          to: "/listings/create",
                          search: { edit: String(params.id) },
                        })
                      }
                      data-ocid="edit-listing-btn"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      {tl("detail.editListing")}
                    </Button>

                    {!isInactive && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={bumpMutation.isPending}
                        onClick={() => bumpMutation.mutate()}
                        data-ocid="bump-listing-btn"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Bump listing
                      </Button>
                    )}

                    {isInactive ? (
                      /* Reactivate button — shown when listing is inactive */
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-green-700 dark:text-green-400 border-green-500/40 hover:bg-green-500/10"
                            disabled={reactivateMutation.isPending}
                            data-ocid="reactivate-button"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            {tl("detail.reactivateListing")}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent
                          className="bg-card border-border"
                          data-ocid="reactivate-dialog"
                        >
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {tl("detail.reactivateConfirm")}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                              {tl("detail.reactivateDesc")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              className="border-border"
                              data-ocid="reactivate-cancel-btn"
                            >
                              {tl("detail.cancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-green-600 text-white hover:opacity-90"
                              onClick={() => reactivateMutation.mutate()}
                              disabled={reactivateMutation.isPending}
                              data-ocid="reactivate-confirm-btn"
                            >
                              {tl("detail.reactivateListing")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      /* Deactivate button — shown when listing is active */
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-destructive border-destructive/40 hover:bg-destructive/10"
                            disabled={deactivateMutation.isPending}
                            data-ocid="deactivate-listing-btn"
                          >
                            <PowerOff className="h-3.5 w-3.5" />
                            {tl("detail.deactivateListing")}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent
                          className="bg-card border-border"
                          data-ocid="deactivate-dialog"
                        >
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {tl("detail.deactivateConfirm")}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                              {tl("detail.deactivateDesc")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              className="border-border"
                              data-ocid="deactivate-cancel-btn"
                            >
                              {tl("detail.cancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:opacity-90"
                              onClick={() => deactivateMutation.mutate()}
                              disabled={deactivateMutation.isPending}
                              data-ocid="deactivate-confirm-btn"
                            >
                              {deactivateMutation.isPending
                                ? tl("detail.deactivating")
                                : tl("detail.deactivateListing")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                );
              })()}

            {/* Payment methods — approved stablecoins only */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                {tl("detail.paymentMethods")}
              </h3>
              <div className="flex flex-wrap gap-2" data-ocid="payment-methods">
                {paymentTokens.map((token) => (
                  <span
                    key={token}
                    className={`token-chip text-xs ${TOKEN_COLORS[token] ?? ""}`}
                  >
                    {formatTokenDisplay(token)}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA — hidden for owner AND for inactive listings (non-owner viewers) */}
            {!isOwner &&
              (listing as ListingCard & { status?: string }).status !==
                "inactive" && (
                <div className="flex flex-col gap-2 pt-2">
                  {tradeCapCheck && (
                    <TradeCapRequirementsPanel check={tradeCapCheck} />
                  )}
                  <Button
                    className="w-full h-11 bg-accent text-accent-foreground hover:opacity-90 font-semibold text-base"
                    onClick={handleBuyNow}
                    disabled={startTradeMutation.isPending || tradeCapBlocked}
                    data-ocid="buy-now"
                  >
                    {isAuthed ? (
                      startTradeMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {tl("detail.startingTrade")}
                        </span>
                      ) : selectedCarrier ? (
                        tl("detail.proceedCheckout")
                      ) : (
                        tl("detail.selectShippingAndBuy")
                      )
                    ) : (
                      <span
                        className="flex items-center gap-2"
                        data-ocid="buy-now-signin"
                      >
                        <LogIn className="h-4 w-4" />
                        {tl("detail.signInToBuy")}
                      </span>
                    )}
                  </Button>
                  {!isAuthed && (
                    <p className="text-xs text-center text-muted-foreground">
                      {tl("detail.escrowNote")}
                    </p>
                  )}
                </div>
              )}

            {/* Admin actions */}
            {isAdmin && (
              <div
                className="pt-2 border-t border-border"
                data-ocid="admin-actions"
              >
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                      data-ocid="admin-remove-listing"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      {tl("detail.removeListingBtn")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {tl("detail.removeListingConfirm")}
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
                        {tl("detail.removeListingDesc")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-border">
                        {tl("detail.cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:opacity-90"
                        onClick={() => removeMutation.mutate()}
                        disabled={removeMutation.isPending}
                        data-ocid="confirm-remove-listing"
                      >
                        {removeMutation.isPending
                          ? tl("detail.removing")
                          : tl("detail.remove")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            {tl("detail.description")}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {listing.description
              ? listing.description
              : tl("detail.noDescription")}
          </p>
        </div>

        {listing.attributes && listing.attributes.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-5 space-y-3">
            <h2 className="text-base font-semibold text-foreground">
              {tl("create.categoryAttributes.title")}
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {listing.attributes.map((attr) => (
                <div key={attr.key}>
                  <dt className="text-xs text-muted-foreground uppercase tracking-wide">
                    {attr.key}
                  </dt>
                  <dd className="text-sm font-medium text-foreground">
                    {attr.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Shipping comparison */}
        {!isOwner && isAuthed && (
          <div
            className="bg-card border border-border rounded-lg p-5"
            data-ocid="shipping-comparison-section"
          >
            <ShippingProviderSelector
              weight={1}
              fromCity={fromCity}
              toCity=""
              selectedCarrier={selectedCarrier}
              onSelect={handleCarrierSelect}
              showInputForm
              locale={locale}
            />
            {selectedCarrier && (
              <div className="mt-4 pt-4 border-t border-border">
                <Button
                  className="w-full h-11 bg-accent text-accent-foreground hover:opacity-90 font-semibold"
                  onClick={handleBuyNow}
                  disabled={startTradeMutation.isPending}
                  data-ocid="proceed-checkout-btn"
                >
                  {startTradeMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {tl("detail.startingTrade")}
                    </span>
                  ) : (
                    tl("detail.proceedCheckout")
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Other listings by seller (shown to all viewers once sellerPrincipal is available) */}
        {!!listing?.sellerPrincipal && (
          <div
            className="bg-card border border-border rounded-lg p-5 space-y-4"
            data-ocid="seller-other-listings"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                {tl("detail.otherListings")}
              </h2>
              {ownerPrincipalText && (
                <button
                  type="button"
                  onClick={() =>
                    navigate({
                      to: "/profile/$id",
                      params: { id: ownerPrincipalText },
                    })
                  }
                  className="text-xs text-accent hover:underline underline-offset-2 flex items-center gap-1"
                  data-ocid="seller-all-listings-link"
                >
                  {tl("detail.allListings")}
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>

            {otherListingsLoading ? (
              <div
                className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                data-ocid="other-listings-loading"
              >
                {(["a", "b", "c"] as const).map((k) => (
                  <div
                    key={k}
                    className="rounded-lg overflow-hidden border border-border"
                  >
                    <Skeleton className="aspect-[4/3] w-full" />
                    <div className="p-2 space-y-1">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : otherListings.length === 0 ? (
              <p
                className="text-sm text-muted-foreground"
                data-ocid="other-listings-empty"
              >
                {tl("detail.noOtherListings")}
              </p>
            ) : (
              <div
                className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                data-ocid="other-listings-grid"
              >
                {otherListings.slice(0, 3).map((l) => (
                  <OtherListingCard key={l.id.toString()} listing={l} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <AlertDialogContent
          className="bg-card border-border max-w-md"
          data-ocid="buy-checkout-dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{tl("detail.checkout.title")}</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {listing.title}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-2 text-sm" data-ocid="buy-fee-breakdown">
            {tradeCapCheck && (
              <TradeCapRequirementsPanel check={tradeCapCheck} />
            )}
            {feeQuoteLoading ? (
              <p className="text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {tl("detail.checkout.loading")}
              </p>
            ) : (
              <>
                {!feeQuoteRaw && (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {tl("detail.checkout.unavailable")}
                  </p>
                )}
                {feeQuoteSource.usesDefaultFeeBps && (
                  <p className="text-xs text-muted-foreground">
                    {tl("detail.checkout.defaultFeeNote")}
                  </p>
                )}
                <dl className="space-y-2">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">
                      {tl("detail.checkout.itemPrice")}
                    </dt>
                    <dd className="font-medium text-foreground">
                      {feeQuoteView.itemPriceFormatted}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">
                      {tl("detail.checkout.platformFee").replace(
                        "{percent}",
                        feeQuoteView.feePercentLabel,
                      )}
                    </dt>
                    <dd className="font-medium text-foreground">
                      {feeQuoteView.platformFeeFormatted}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">
                      {tl("detail.checkout.network")}
                    </dt>
                    <dd className="font-medium text-foreground">
                      {formatTokenDisplay(listing.priceToken)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">
                      {tl("detail.checkout.delivery")}
                    </dt>
                    <dd className="font-medium text-foreground text-right">
                      {deliveryLabel}
                    </dd>
                  </div>
                  <Separator />
                  <div className="flex justify-between gap-4 text-base">
                    <dt className="font-semibold text-foreground">
                      {tl("detail.checkout.total")}
                    </dt>
                    <dd className="font-bold text-accent">
                      {feeQuoteView.totalFormatted}
                    </dd>
                  </div>
                </dl>
                <p className="text-xs text-muted-foreground">
                  {tl("detail.checkout.fundsNotLocked")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tl("detail.checkout.manualNote")}
                </p>
              </>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">
              {tl("detail.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-accent text-accent-foreground hover:opacity-90"
              onClick={handleConfirmCheckout}
              disabled={
                startTradeMutation.isPending ||
                feeQuoteLoading ||
                tradeCapBlocked
              }
              data-ocid="buy-checkout-confirm"
            >
              {startTradeMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tl("detail.startingTrade")}
                </span>
              ) : (
                tl("detail.checkout.confirm")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
