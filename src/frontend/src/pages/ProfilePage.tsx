import type { LiabilityEvent, UserProfile } from "@/backend.d";
import { TrustLevel } from "@/backend.d";
import { FeedbackList } from "@/components/profile/FeedbackList";
import { ReputationStats } from "@/components/profile/ReputationStats";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useBackend } from "@/hooks/useBackend";
import { formatPrincipal, formatTimestamp } from "@/lib/format";
import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  LayoutGrid,
  LinkIcon,
  Pencil,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getPaymentMethodsFromBackend } from "../hooks/useBackend";
import type { AddressVerification, PaymentMethod } from "../hooks/useBackend";
import { useLocale } from "../hooks/useLocale";
import { type TranslationKey, detectLocale, t as tStatic } from "../i18n";
import { TOKEN_LABELS } from "../utils/addressDetector";

// ─── Helpers ────────────────────────────────────────────────────────────────

function trustLevelClass(level: TrustLevel): string {
  switch (level) {
    case TrustLevel.gold:
      return "badge-tier-gold text-base px-3 py-1.5";
    case TrustLevel.silver:
      return "badge-tier-silver text-base px-3 py-1.5";
    case TrustLevel.bronze:
      return "badge-tier-bronze text-base px-3 py-1.5";
    default:
      return "badge-tier-new text-base px-3 py-1.5";
  }
}

function trustLevelLabel(level: TrustLevel): string {
  switch (level) {
    case TrustLevel.gold:
      return "⭐ Gold";
    case TrustLevel.silver:
      return "🥈 Silver";
    case TrustLevel.bronze:
      return "🥉 Bronze";
    default:
      return "🆕 New";
  }
}

function avatarInitials(username: string, principalStr: string): string {
  if (username && username.trim().length > 0) {
    const parts = username.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return username.slice(0, 2).toUpperCase();
  }
  return principalStr.slice(0, 2).toUpperCase();
}

function formatTokenDisplay(token: string): string {
  return token;
}

// ─── Payment Methods Verification Badge ──────────────────────────────────────

function AddressVerificationBadge({
  verification,
}: {
  verification: AddressVerification | undefined;
}) {
  const { t } = useLocale();

  if (!verification) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-muted-foreground"
        title={t("payment.badge.unverified")}
      >
        <Shield className="h-3 w-3" />
        {t("payment.badge.unverified")}
      </span>
    );
  }

  if (verification.active && Number(verification.txCount) > 0) {
    const verifiedDate = new Date(
      Number(verification.verifiedAt) / 1_000_000,
    ).toLocaleDateString();
    const expiresDate = new Date(
      Number(verification.expiresAt) / 1_000_000,
    ).toLocaleDateString();
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400"
        title={`${t("payment.badge.level2")} · ${Number(verification.txCount)} tx · verified ${verifiedDate} · expires ${expiresDate}`}
      >
        <Shield className="h-3 w-3 fill-green-500/20" />
        {t("payment.badge.level2")}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400"
      title={t("payment.badge.formatValid")}
    >
      <Shield className="h-3 w-3" />
      {t("payment.badge.formatValid")}
    </span>
  );
}

// ─── Payment Methods Card ─────────────────────────────────────────────────────

function PaymentMethodsCard({ methods }: { methods: PaymentMethod[] }) {
  const { t } = useLocale();

  return (
    <div
      className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
      data-ocid="payment-methods-card"
    >
      <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          {t("payment.savedMethods")}
        </h3>
      </div>

      {methods.length === 0 ? (
        <div
          className="px-4 py-6 text-center"
          data-ocid="payment-methods-empty"
        >
          <p className="text-sm text-muted-foreground">
            {t("payment.noPaymentMethods")}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {methods.map((method, idx) => (
            <div
              key={`${method.token as string}-${method.address}`}
              className="flex items-center justify-between gap-3 px-4 py-3"
              data-ocid={`profile-payment-method.${idx + 1}`}
            >
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  {TOKEN_LABELS[method.token as string] ??
                    (method.token as string)}
                </p>
                <code className="text-xs text-muted-foreground font-mono block truncate">
                  {method.address.length > 20
                    ? `${method.address.slice(0, 10)}…${method.address.slice(-8)}`
                    : method.address}
                </code>
                <AddressVerificationBadge verification={method.verification} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Liability Balance Card ───────────────────────────────────────────────────

function formatReasonLabel(reason: string): string {
  const locale = detectLocale();
  const key = `liability.reason.${reason}`;
  try {
    const translated = tStatic(locale, key as TranslationKey);
    if (translated === key) {
      return reason.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return translated;
  } catch {
    return reason.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

function LiabilityCard({
  liabilityBalance,
  liabilityHistory,
}: {
  liabilityBalance: bigint;
  liabilityHistory: LiabilityEvent[];
}) {
  const { t: tl } = useLocale();
  const navigate = useNavigate();

  const balanceCents = Number(liabilityBalance);
  const balanceDollars = Math.abs(balanceCents) / 100;
  const isNegative = balanceCents < 0;
  const isPositive = balanceCents > 0;

  return (
    <div
      className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
      data-ocid="liability-card"
    >
      <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          {tl("liability.balance.title")}
        </h3>
      </div>

      <div className="px-4 py-4">
        {isNegative ? (
          <div
            className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3"
            data-ocid="liability-negative-badge"
          >
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive leading-snug">
              {tl("liability.balance.negative").replace(
                "{{amount}}",
                `$${balanceDollars.toFixed(2)}`,
              )}
            </p>
          </div>
        ) : isPositive ? (
          <div
            className="flex items-center gap-2 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3"
            data-ocid="liability-positive-badge"
          >
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">
              {tl("liability.balance.positive").replace(
                "{{amount}}",
                `$${balanceDollars.toFixed(2)}`,
              )}
            </p>
          </div>
        ) : (
          <div
            className="flex items-center gap-2 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3"
            data-ocid="liability-zero-badge"
          >
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">
              {tl("liability.balance.zero")}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-border">
        <div className="px-4 py-2.5 bg-muted/10">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {tl("liability.history.title")}
          </p>
        </div>

        {liabilityHistory.length === 0 ? (
          <div
            className="px-4 py-6 text-center"
            data-ocid="liability-history-empty"
          >
            <p className="text-sm text-muted-foreground">
              {tl("liability.history.empty")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto" data-ocid="liability-history-table">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">
                    {tl("liability.history.col.date")}
                  </th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">
                    {tl("liability.history.col.amount")}
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">
                    {tl("liability.history.col.reason")}
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">
                    {tl("liability.history.col.trade")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {liabilityHistory.map((ev, idx) => {
                  const evCents = Number(ev.amount);
                  const evDollars = Math.abs(evCents) / 100;
                  const isCharge = evCents > 0;
                  const date = new Date(Number(ev.timestamp) / 1_000_000);
                  const rowKey = `${ev.timestamp.toString()}-${idx}`;
                  return (
                    <tr
                      key={rowKey}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                      data-ocid={`liability-history-row.${idx + 1}`}
                    >
                      <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {date.toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right font-mono text-xs font-semibold whitespace-nowrap ${isCharge ? "text-destructive" : "text-green-600 dark:text-green-400"}`}
                      >
                        {isCharge ? "+" : "-"}${evDollars.toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-foreground">
                        {formatReasonLabel(ev.reason)}
                      </td>
                      <td className="px-4 py-2.5 text-xs">
                        {ev.tradeId != null ? (
                          <button
                            type="button"
                            onClick={() =>
                              navigate({
                                to: `/trades/${ev.tradeId?.toString()}`,
                              })
                            }
                            className="text-accent hover:underline font-mono"
                            data-ocid={`liability-trade-link.${idx + 1}`}
                          >
                            #{ev.tradeId.toString()}
                          </button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Listing Card (inline, minimal) ─────────────────────────────────────────

interface ListingCardLike {
  id: bigint;
  title: string;
  photos: string[];
  priceAmount: bigint;
  priceToken: unknown;
  location: string;
  // status may be present at runtime even if not in the TS type
  status?: string;
}

function ListingCardItem({
  listing,
  showInactiveBadge,
}: {
  listing: ListingCardLike;
  showInactiveBadge?: boolean;
}) {
  const { t } = useLocale();
  const navigate = useNavigate();
  const photo = listing.photos[0];
  const price = Number(listing.priceAmount) / 1e8;

  return (
    <button
      type="button"
      data-ocid="profile-listing-card"
      onClick={() => navigate({ to: `/listings/${listing.id}` })}
      className="card-elevated overflow-hidden text-left transition-smooth hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring relative"
    >
      <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <LayoutGrid className="h-8 w-8 text-muted-foreground/30" />
        )}
      </div>
      {showInactiveBadge && (
        <span
          className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-amber-500/90 text-white text-[10px] font-semibold px-2 py-0.5 shadow-sm"
          data-ocid="inactive-listing-badge"
        >
          {t("listings.inactiveBadge")}
        </span>
      )}
      <div className="p-3 space-y-1">
        <p className="text-sm font-semibold text-foreground truncate">
          {listing.title}
        </p>
        <div className="flex items-center justify-between gap-2">
          <span className="token-chip text-xs py-0.5">
            {price.toFixed(price < 0.001 ? 6 : 4)}{" "}
            {formatTokenDisplay(listing.priceToken as string)}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {listing.location}
          </span>
        </div>
      </div>
    </button>
  );
}

const LISTING_SKELETON_KEYS = [
  "lsk1",
  "lsk2",
  "lsk3",
  "lsk4",
  "lsk5",
  "lsk6",
] as const;

function ListingsGrid({
  listings,
  isLoading,
  showInactiveNote,
  markInactive,
}: {
  listings: ListingCardLike[];
  isLoading: boolean;
  showInactiveNote?: boolean;
  markInactive?: boolean;
}) {
  const { t } = useLocale();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {LISTING_SKELETON_KEYS.map((key) => (
          <div key={key} className="card-elevated overflow-hidden">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div
        data-ocid="listings-empty"
        className="card-elevated flex flex-col items-center justify-center py-16 text-center px-4"
      >
        <LayoutGrid className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <h3 className="text-foreground font-semibold mb-1">
          {t("listings.noListings")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("listings.noFoundSub")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        data-ocid="profile-listings-grid"
      >
        {listings.map((l) => (
          <ListingCardItem
            key={l.id.toString()}
            listing={l}
            showInactiveBadge={markInactive || l.status === "inactive"}
          />
        ))}
      </div>
      {showInactiveNote && (
        <p
          className="text-xs text-muted-foreground text-center"
          data-ocid="profile-inactive-note"
        >
          {t("profile.listings.inactiveHidden")}
        </p>
      )}
    </div>
  );
}

// ─── Edit Profile Dialog ─────────────────────────────────────────────────────

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
}

function EditProfileDialog({ open, onClose, profile }: EditProfileDialogProps) {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.setMyProfile(
        username.trim(),
        bio.trim(),
        avatarUrl.trim(),
        null,
      );
      if (result.__kind__ === "err") throw new Error("Failed to save profile");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      toast.success("Profile updated");
      onClose();
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" data-ocid="edit-profile-dialog">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="ep-username" data-ocid="edit-username-label">
              Display Name
            </Label>
            <Input
              id="ep-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your display name"
              maxLength={64}
              data-ocid="edit-username-input"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ep-bio">Bio</Label>
            <Textarea
              id="ep-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell buyers about yourself…"
              rows={3}
              maxLength={280}
              className="resize-none"
              data-ocid="edit-bio-input"
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/280
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ep-avatar">Avatar URL</Label>
            <Input
              id="ep-avatar"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://…"
              data-ocid="edit-avatar-input"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !username.trim()}
            data-ocid="edit-profile-save"
          >
            {mutation.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Error States ─────────────────────────────────────────────────────────────

function ProfileErrorCard({
  icon: Icon,
  title,
  description,
  btnLabel,
  btnHref,
  ocid,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  btnLabel: string;
  btnHref: string;
  ocid: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div
        className="card-elevated max-w-md w-full text-center py-12 px-8 space-y-4"
        data-ocid={ocid}
      >
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button
          onClick={() => navigate({ to: btnHref })}
          data-ocid={`${ocid}-browse-btn`}
        >
          {btnLabel}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { id } = useParams({ strict: false }) as { id?: string };
  const { actor, isFetching } = useBackend();
  const { principal } = useAuth();
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"listings" | "feedback">(
    "listings",
  );
  const [ownerListingTab, setOwnerListingTab] = useState<"active" | "inactive">(
    "active",
  );

  // ── Parse principal from route — detect invalid link ──
  const isMe = id === "me" || !id;
  let targetPrincipal: ReturnType<typeof Principal.fromText> | undefined;
  let invalidLink = false;

  if (isMe) {
    targetPrincipal = principal ?? undefined;
  } else {
    try {
      targetPrincipal = Principal.fromText(id);
    } catch {
      invalidLink = true;
    }
  }

  const isOwn =
    !invalidLink && targetPrincipal?.toText() === principal?.toText();

  // ── Queries — always called (hooks must not be conditional) ──
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = useQuery({
    queryKey: ["userProfile", targetPrincipal?.toText()],
    queryFn: () => actor!.getUserProfile(targetPrincipal!),
    enabled: !!actor && !isFetching && !!targetPrincipal,
    staleTime: 30_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const { data: reputationStats, isLoading: statsLoading } = useQuery({
    queryKey: ["reputationStats", targetPrincipal?.toText()],
    queryFn: () => actor!.getUserReputationStats(targetPrincipal!),
    enabled: !!actor && !isFetching && !!targetPrincipal,
    staleTime: 30_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data: allListings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ["userListings", targetPrincipal?.toText()],
    queryFn: () =>
      actor!.getListingsByUser(targetPrincipal!, BigInt(0), BigInt(50)),
    enabled: !!actor && !isFetching && !!targetPrincipal,
    staleTime: 30_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data: feedback = [], isLoading: feedbackLoading } = useQuery({
    queryKey: ["userFeedback", targetPrincipal?.toText()],
    queryFn: () => actor!.getUserFeedback(targetPrincipal!),
    enabled: !!actor && !isFetching && !!targetPrincipal,
    staleTime: 30_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Payment methods — only for own profile
  const { data: paymentMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ["paymentMethods"],
    queryFn: () => getPaymentMethodsFromBackend(actor!),
    enabled: !!actor && !isFetching && isOwn,
    staleTime: 30_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // ── Copy principal (own only) ──
  const handleCopyPrincipal = () => {
    const text = targetPrincipal?.toText() ?? "";
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Loading state ──
  // First: render error for invalid link (after all hooks)
  if (invalidLink) {
    return (
      <ProfileErrorCard
        icon={LinkIcon}
        title={t("profile.invalidLink.title")}
        description={t("profile.invalidLink.description")}
        btnLabel={t("profile.invalidLink.browseBtn")}
        btnHref="/listings"
        ocid="profile-invalid-link"
      />
    );
  }

  if (profileLoading && !profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border px-6 py-8">
          <div className="max-w-3xl mx-auto flex gap-5 items-start">
            <Skeleton className="h-20 w-20 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(["sk1", "sk2", "sk3", "sk4"] as const).map((key) => (
              <Skeleton key={key} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Not found state (after query settled) ──
  if (!profileLoading && (profileError || !profile)) {
    return (
      <ProfileErrorCard
        icon={AlertTriangle}
        title={t("profile.notFound.title")}
        description={t("profile.notFound.description")}
        btnLabel={t("profile.notFound.browseBtn")}
        btnHref="/listings"
        ocid="profile-not-found"
      />
    );
  }

  // ── Build public-safe profile (strip private fields for !isOwn) ──
  // We assert profile is defined here (checked above)
  const safeProfile = profile!;

  const publicProfile = isOwn
    ? safeProfile
    : {
        ...safeProfile,
        // Strip private financial/identity fields for public view
        liabilityBalance: BigInt(0),
        liabilityHistory: [] as typeof safeProfile.liabilityHistory,
        // Strip any potential email/phone if they exist
        ...("email" in safeProfile ? { email: undefined } : {}),
        ...("phone" in safeProfile ? { phone: undefined } : {}),
      };

  // ── Resolve display values ──
  const principalStr = targetPrincipal?.toText() ?? "";
  const rawUsername = safeProfile.username ?? "";
  const username = profileLoading
    ? "Unknown User"
    : rawUsername.trim().length > 0
      ? rawUsername
      : isOwn
        ? "Unknown User"
        : t("profile.anonymousSeller");

  const bio = safeProfile.bio ?? "";
  const trustLevel = safeProfile.trustLevel ?? TrustLevel.new_;
  const memberSince = safeProfile.createdAt
    ? formatTimestamp(safeProfile.createdAt)
    : null;

  // ── Filter listings for public view ──
  // ListingCard has no `status` field in the current type, but we apply a
  // runtime-safe filter: cast to check the optional runtime property.
  const typedAllListings = allListings as (ListingCardLike & {
    status?: string;
  })[];

  // Public view: only active listings
  const publicListings: ListingCardLike[] = typedAllListings.filter((l) => {
    const s = l.status;
    if (s === undefined) return true;
    return s === "active";
  });

  // Owner sub-filters
  const ownerActiveListings = typedAllListings.filter(
    (l) => !l.status || l.status === "active",
  );
  const ownerInactiveListings = typedAllListings.filter(
    (l) => l.status === "inactive",
  );

  const listings: ListingCardLike[] = isOwn ? typedAllListings : publicListings;

  const inactiveWereFiltered =
    !isOwn && typedAllListings.length > publicListings.length;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header card ── */}
      <div className="bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex gap-5 items-start">
            {/* Avatar */}
            <Avatar className="h-20 w-20 flex-shrink-0 text-xl font-bold border-2 border-border">
              {safeProfile.avatarUrl ? (
                <img
                  src={safeProfile.avatarUrl}
                  alt={username}
                  className="h-full w-full object-cover rounded-full"
                />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                {avatarInitials(username, principalStr)}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1.5">
                <h1
                  className="text-xl font-bold text-foreground truncate"
                  data-ocid="profile-username"
                >
                  {username}
                </h1>
                <span
                  className={trustLevelClass(trustLevel)}
                  data-ocid="profile-trust-badge"
                >
                  {trustLevelLabel(trustLevel)}
                </span>
                {isOwn && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditOpen(true)}
                    className="gap-1.5 h-7 text-xs"
                    data-ocid="edit-profile-btn"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit Profile
                  </Button>
                )}
              </div>

              {/* Principal — shown ONLY to own profile */}
              {isOwn && (
                <div className="flex items-center gap-1.5 mb-2">
                  <span
                    className="font-mono text-xs text-muted-foreground truncate max-w-[220px]"
                    title={principalStr}
                  >
                    {formatPrincipal(principalStr, 8, 6)}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPrincipal}
                    className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Copy principal ID"
                    data-ocid="copy-principal-btn"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-accent" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              )}

              {/* Member since */}
              {memberSince && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Member since{" "}
                  {memberSince.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                  })}
                </div>
              )}

              {/* Bio — only render if non-empty */}
              {bio.trim().length > 0 && (
                <p
                  className="text-sm text-muted-foreground leading-snug break-words line-clamp-3"
                  data-ocid="profile-bio"
                >
                  {bio}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Reputation stats row */}
        <ReputationStats stats={reputationStats} isLoading={statsLoading} />

        {/* Liability balance — only shown to own profile, data never passed when !isOwn */}
        {isOwn && (
          <LiabilityCard
            liabilityBalance={publicProfile.liabilityBalance}
            liabilityHistory={publicProfile.liabilityHistory}
          />
        )}

        {/* Payment methods — only shown to own profile */}
        {isOwn && <PaymentMethodsCard methods={paymentMethods} />}

        <Separator />

        {/* Tabs: Listings / Feedback */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "listings" | "feedback")}
          data-ocid="profile-tabs"
        >
          <TabsList className="w-full mb-4">
            <TabsTrigger
              value="listings"
              className="flex-1"
              data-ocid="tab-listings"
            >
              {isOwn ? t("nav.profile").replace("My ", "") : ""}
              {!isOwn ? "Listings" : "Listings"}
              {isOwn
                ? ownerActiveListings.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {ownerActiveListings.length}
                    </Badge>
                  )
                : listings.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {listings.length}
                    </Badge>
                  )}
            </TabsTrigger>
            <TabsTrigger
              value="feedback"
              className="flex-1"
              data-ocid="tab-feedback"
            >
              Feedback
              {feedback.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {feedback.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="mt-0">
            {isOwn ? (
              /* Owner view: Active / Inactive sub-tabs */
              <div className="space-y-3">
                <div
                  className="flex gap-1 p-1 bg-muted/40 rounded-lg w-fit"
                  data-ocid="owner-listing-subtabs"
                >
                  <button
                    type="button"
                    onClick={() => setOwnerListingTab("active")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      ownerListingTab === "active"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-ocid="owner-listing-tab-active"
                  >
                    {t("profile.tabs.active")}
                    {ownerActiveListings.length > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold w-4 h-4">
                        {ownerActiveListings.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOwnerListingTab("inactive")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      ownerListingTab === "inactive"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-ocid="owner-listing-tab-inactive"
                  >
                    {t("profile.tabs.inactive")}
                    {ownerInactiveListings.length > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold w-4 h-4">
                        {ownerInactiveListings.length}
                      </span>
                    )}
                  </button>
                </div>

                {ownerListingTab === "active" ? (
                  <ListingsGrid
                    listings={ownerActiveListings}
                    isLoading={listingsLoading}
                  />
                ) : (
                  <ListingsGrid
                    listings={ownerInactiveListings}
                    isLoading={listingsLoading}
                    markInactive
                  />
                )}
              </div>
            ) : (
              /* Public view: active only */
              <ListingsGrid
                listings={publicListings}
                isLoading={listingsLoading}
                showInactiveNote={inactiveWereFiltered}
              />
            )}
          </TabsContent>

          <TabsContent value="feedback" className="mt-0">
            <FeedbackList items={feedback} isLoading={feedbackLoading} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Dialog — only for own profile */}
      {isOwn && safeProfile && editOpen && (
        <EditProfileDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          profile={safeProfile}
        />
      )}
    </div>
  );
}
