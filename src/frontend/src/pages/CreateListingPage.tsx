import {
  CategoryAttributeFields,
  toAttributePayload,
} from "@/components/marketplace/CategoryAttributeFields";
import { CategoryPicker } from "@/components/marketplace/CategoryPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  categoryLabel,
  getCategoryById,
  legacyToListingCategoryKey,
} from "@/data/olxCategories";
import {
  categoryIdArg,
  fetchCategoryAttributeSchema,
} from "@/lib/marketplaceActor";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  GripVertical,
  ImagePlus,
  Loader2,
  Lock,
  LogIn,
  Package,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { createActor } from "../backend";
import { ItemCondition, ListingCategory, TradeToken } from "../backend.d";
import type {
  MeestConfig as MeestConfigType,
  NovaPoshtaConfig as NovaPoshtaConfigType,
  PackageDetails as PackageDetailsType,
  ShippingCarrier,
  ShippingOption,
  UkrposhtaConfig as UkrposhtaConfigType,
} from "../backend.d";
import { CascadingLocationPicker } from "../components/CascadingLocationPicker";
import { NetworkSelectionDialog } from "../components/NetworkSelectionDialog";
import { ShippingProviderSelector } from "../components/shared/ShippingProviderSelector";
import { useAuth } from "../hooks/useAuth";
import {
  registerDigitalFileOnListing,
  useUploadFile,
} from "../hooks/useBackend";
import { useLocale } from "../hooks/useLocale";
import { detectLocale, t } from "../i18n";
import {
  ACTIVE_PHYSICAL_SHIPPING_CARRIER,
  getPhysicalShippingMethods,
} from "../lib/deliveryPolicy";
import {
  encryptDigitalFile,
  validateDigitalFile,
} from "../lib/digitalFileCrypto";
import {
  chainAmountToDisplayPrice,
  formatStakeMicros,
  listingPriceToChainAmount,
  requiredListingStakeMicros,
} from "../lib/listingStake";
import { resolveBackendCanisterId } from "../lib/resolveBackendCanisterId";
import {
  depositListingStake,
  fetchMyStakeBalance,
  publishDraftListing,
} from "../lib/stakeClient";
import type { ListingCard } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadStatus = "pending" | "uploading" | "done" | "error";

interface PhotoItem {
  id: string;
  /** Local blob URL for preview only — never sent to backend */
  previewUrl: string;
  file: File | null;
  /** Persistent CDN URL returned from object-storage — sent to backend */
  persistentUrl: string | null;
  uploadStatus: UploadStatus;
  uploadProgress: number;
  uploadError: string | null;
}

interface FormState {
  title: string;
  category: ListingCategory | "";
  categoryId: number | null;
  categoryAttributes: Record<string, string>;
  condition: ItemCondition | "";
  description: string;
  isDigital: boolean;
  digitalFileUrl: string;
  digitalFileHash: string;
  digitalPassword: string;
  digitalPasswordEnabled: boolean;
  priceAmount: string;
  priceToken: TradeToken;
  location: string;
  shippingWeightKg: string;
  shippingFromCity: string;
  shippingToCity: string;
  // Package details
  packageWeight: number;
  packageLength: number;
  packageWidth: number;
  packageHeight: number;
  packagePlaces: number;
  // Nova Poshta config
  novaPoshtaEnabled: boolean;
  novaPoshtaDeliveryTypes: string[];
  novaPoshtaSenderBranchRef: string;
  // Ukrposhta config
  ukrposhtaEnabled: boolean;
  ukrposhtaDeliveryTypes: string[];
  ukrposhtaSenderOfficeRef: string;
  // Meest config
  meestEnabled: boolean;
  meestDeliveryTypes: string[];
  meestSenderPudoRef: string;
}

type ValidationErrors = Partial<
  Record<
    keyof FormState | "photos" | "carrier" | "packageWeight" | "packageDims",
    string
  >
>;

// ─── Constants ────────────────────────────────────────────────────────────────

// ── Active tokens: ONLY the 4 approved stablecoin networks ──────────────────
// Deferred: USDT_POLYGON, USDT_AVAX, USDC_SPL, USDC_POLYGON, USDC_AVAX
const TOKENS: {
  value: TradeToken;
  label: string;
  network: string;
  base: "USDT" | "USDC";
}[] = [
  {
    value: TradeToken.USDT_TRC20,
    label: "USDT",
    network: "TRC20",
    base: "USDT",
  },
  {
    value: TradeToken.USDT_BEP20,
    label: "USDT",
    network: "BEP20",
    base: "USDT",
  },
  {
    value: TradeToken.USDT_ERC20,
    label: "USDT",
    network: "ERC20",
    base: "USDT",
  },
  {
    value: TradeToken.USDC_ERC20,
    label: "USDC",
    network: "ERC20",
    base: "USDC",
  },
];

const STEP_ICONS = [Package, DollarSign, Camera];

const MAX_PHOTOS = 10;
// ─── Preview deployment detection ─────────────────────────────────────────────

function isPreviewDeployment(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return (
    h.includes("preview") ||
    h.includes("draft") ||
    h === "localhost" ||
    h === "127.0.0.1" ||
    h.startsWith("192.168.") ||
    h.endsWith(".localhost")
  );
}

// ─── Controlled upload queue (max 2 concurrent, 3 retries) ────────────────────

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      }
    }
  }
  throw lastErr;
}

async function processUploadQueue(
  items: { id: string; file: File }[],
  uploadFn: (item: { id: string; file: File }) => Promise<void>,
  maxConcurrent = 2,
): Promise<void> {
  const queue = [...items];
  const inFlight = new Set<Promise<void>>();
  while (queue.length > 0 || inFlight.size > 0) {
    while (inFlight.size < maxConcurrent && queue.length > 0) {
      const item = queue.shift()!;
      const promise = uploadFn(item).finally(() => inFlight.delete(promise));
      inFlight.add(promise);
    }
    if (inFlight.size > 0) {
      await Promise.race(inFlight);
    }
  }
}

const MAX_TITLE = 120;
const MIN_TITLE = 3;
const MAX_DESC = 2000;
const MAX_LOCATION = 100;
const MAX_PRICE_USD = 1_000_000;

// iPhone/iOS accepts image/* but doesn't reliably handle HEIC without explicit listing
const PHOTO_ACCEPT = "image/*,image/heic,image/heif,image/hevc";

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const { t: tl } = useLocale();
  const STEPS = [
    { label: tl("create.step.basic"), icon: STEP_ICONS[0] },
    { label: tl("create.step.pricing"), icon: STEP_ICONS[1] },
    { label: tl("create.step.photos"), icon: STEP_ICONS[2] },
  ];
  return (
    <div
      className="flex items-center justify-center gap-0 mb-8"
      data-ocid="step-indicator"
    >
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isActive = idx === current;
        const isDone = idx < current;
        return (
          <div key={step.label} className="flex items-center">
            <div
              className={[
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-smooth",
                isActive
                  ? "bg-accent text-accent-foreground shadow-md"
                  : isDone
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground",
              ].join(" ")}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{idx + 1}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={[
                  "h-0.5 w-6 sm:w-12 mx-1 transition-smooth",
                  isDone ? "bg-primary" : "bg-border",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Auth Gate ────────────────────────────────────────────────────────────────

function AuthPrompt() {
  const { login, isLoggingIn } = useInternetIdentity();
  const locale = detectLocale();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
        <LogIn className="w-9 h-9 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          {t(locale, "create.signInRequired")}
        </h2>
        <p className="text-muted-foreground max-w-xs">
          {t(locale, "create.signInDesc")}
        </p>
      </div>
      <Button
        size="lg"
        className="button-primary gap-2"
        onClick={login}
        disabled={isLoggingIn}
        data-ocid="auth-login-btn"
      >
        {isLoggingIn ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <LogIn className="w-4 h-4" />
        )}
        {t(locale, "create.connect")}
      </Button>
    </div>
  );
}

// ─── Photo Thumbnail ─────────────────────────────────────────────────────────

function PhotoThumb({
  photo,
  idx,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onRemove,
  onRetry,
}: {
  photo: PhotoItem;
  idx: number;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const { t: tl } = useLocale();
  const locale = detectLocale();
  return (
    <div
      draggable={photo.uploadStatus === "done"}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={[
        "relative group rounded-lg overflow-hidden border aspect-square transition-smooth",
        photo.uploadStatus === "done"
          ? "cursor-grab active:cursor-grabbing"
          : "cursor-default",
        isDragging ? "opacity-40 scale-95" : "opacity-100",
        isDragOver && !isDragging
          ? "border-accent ring-2 ring-accent/50"
          : "border-border",
        idx === 0 ? "ring-2 ring-accent/40" : "",
      ].join(" ")}
      data-ocid={`photo-thumb-${idx}`}
    >
      <img
        src={photo.previewUrl}
        alt={`Listing item ${idx + 1}`}
        className="w-full h-full object-cover"
      />

      {/* Upload progress overlay */}
      {photo.uploadStatus === "uploading" && (
        <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-1">
          <Loader2 className="w-5 h-5 animate-spin text-accent" />
          <span className="text-xs font-medium text-foreground">
            {photo.uploadProgress}%
          </span>
          <div className="w-3/4 h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${photo.uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Pending (not yet uploaded) overlay */}
      {photo.uploadStatus === "pending" && (
        <div className="absolute inset-0 bg-amber-500/20 flex flex-col items-center justify-center gap-1 p-2">
          <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-300" />
          <span className="text-[10px] text-amber-800 dark:text-amber-200 text-center leading-tight font-medium">
            {locale === "uk" ? "Очікує завантаження" : "Awaiting upload"}
          </span>
        </div>
      )}

      {/* Error overlay */}
      {photo.uploadStatus === "error" && (
        <div className="absolute inset-0 bg-destructive/20 flex flex-col items-center justify-center gap-1 p-2">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <span className="text-[10px] text-destructive text-center leading-tight">
            {photo.uploadError ?? tl("create.photos.uploadFailedFallback")}
          </span>
          {photo.file && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              className="mt-0.5 text-[10px] font-semibold text-accent underline underline-offset-2"
              data-ocid={`photo-retry-${idx}`}
            >
              {tl("create.photos.retryBtn")}
            </button>
          )}
        </div>
      )}

      {/* Done badge */}
      {photo.uploadStatus === "done" && idx === 0 && (
        <span className="absolute bottom-1 left-1 text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded font-semibold">
          {tl("create.photos.cover")}
        </span>
      )}

      <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-smooth">
        <GripVertical className="w-4 h-4 text-foreground/80 drop-shadow" />
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth hover:bg-destructive hover:text-destructive-foreground"
        aria-label={tl("create.photos.removeBtn")}
        data-ocid={`photo-remove-${idx}`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Photo Drop Zone ─────────────────────────────────────────────────────────

function PhotoZone({
  photos,
  onAdd,
  onRemove,
  onReorder,
  onRetry,
  error,
}: {
  photos: PhotoItem[];
  onAdd: (files: FileList) => void;
  onRemove: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  onRetry: (id: string) => void;
  error?: string;
}) {
  const { t: tl } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      if (e.dataTransfer.files.length) onAdd(e.dataTransfer.files);
    },
    [onAdd],
  );

  const handleThumbnailDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    if (draggingIdx !== null && draggingIdx !== toIdx) {
      onReorder(draggingIdx, toIdx);
    }
    setDraggingIdx(null);
    setDragOverIdx(null);
  };

  const uploadingCount = photos.filter(
    (p) => p.uploadStatus === "uploading",
  ).length;
  const errorCount = photos.filter((p) => p.uploadStatus === "error").length;

  return (
    <div className="space-y-4">
      {photos.length < MAX_PHOTOS && (
        <button
          type="button"
          className={[
            "w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-smooth",
            isDraggingOver
              ? "border-accent bg-accent/10"
              : error
                ? "border-destructive/50 bg-destructive/5"
                : "border-border bg-muted/20 hover:border-accent/50 hover:bg-accent/5",
          ].join(" ")}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          data-ocid="photo-dropzone"
        >
          <input
            ref={inputRef}
            type="file"
            accept={PHOTO_ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) onAdd(e.target.files);
              e.target.value = "";
            }}
          />
          <ImagePlus className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            {tl("create.photos.dropzone")}{" "}
            <span className="text-accent">{tl("create.photos.browse")}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {tl("create.photos.hint").replace("{max}", String(MAX_PHOTOS))}
          </p>
        </button>
      )}

      {/* Upload status summary */}
      {uploadingCount > 0 && (
        <div
          className="flex items-center gap-2 text-sm text-muted-foreground"
          data-ocid="upload-status"
        >
          <Loader2 className="w-4 h-4 animate-spin text-accent" />
          {tl("create.photos.uploading").replace(
            "{count}",
            String(uploadingCount),
          )}
        </div>
      )}

      {errorCount > 0 && (
        <p
          className="flex items-center gap-1.5 text-xs text-destructive"
          data-ocid="upload-errors"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          {tl("create.photos.errors").replace("{count}", String(errorCount))}
        </p>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}

      {photos.length > 0 && (
        <div
          className="grid grid-cols-3 sm:grid-cols-5 gap-3"
          data-ocid="photo-grid"
        >
          {photos.map((photo, idx) => (
            <PhotoThumb
              key={photo.id}
              photo={photo}
              idx={idx}
              isDragging={draggingIdx === idx}
              isDragOver={dragOverIdx === idx && draggingIdx !== idx}
              onDragStart={() => setDraggingIdx(idx)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverIdx(idx);
              }}
              onDrop={(e) => handleThumbnailDrop(e, idx)}
              onDragEnd={() => {
                setDraggingIdx(null);
                setDragOverIdx(null);
              }}
              onRemove={() => onRemove(photo.id)}
              onRetry={() => onRetry(photo.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const createListingRouteApi = getRouteApi("/listings/create");

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CreateListingPage() {
  const { identity, isInitializing } = useInternetIdentity();
  const { isAuthenticated, principal } = useAuth();
  const { actor, isFetching } = useActor(createActor);
  const { uploadFile, uploadFileWithHash } = useUploadFile(identity);
  const [digitalUploadFile, setDigitalUploadFile] = useState<File | null>(null);
  const isAuthenticatedRef = useRef(isAuthenticated);
  isAuthenticatedRef.current = isAuthenticated;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const locale = detectLocale();
  const { t: tl } = useLocale();

  const CONDITIONS: { value: ItemCondition; label: string; desc: string }[] = [
    {
      value: ItemCondition.new_,
      label: tl("condition.new"),
      desc: tl("condition.new.desc"),
    },
    {
      value: ItemCondition.likeNew,
      label: tl("condition.likeNew"),
      desc: tl("condition.likeNew.desc"),
    },
    {
      value: ItemCondition.good,
      label: tl("condition.good"),
      desc: tl("condition.good.desc"),
    },
    {
      value: ItemCondition.fair,
      label: tl("condition.fair"),
      desc: tl("condition.fair.desc"),
    },
    {
      value: ItemCondition.poor,
      label: tl("condition.poor"),
      desc: tl("condition.poor.desc"),
    },
  ];

  const { edit: editId } = createListingRouteApi.useSearch();
  const isEditMode = Boolean(editId);

  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [liabilityBlocked, setLiabilityBlocked] = useState(false);
  const [selectedCarrier, setSelectedCarrier] =
    useState<ShippingCarrier | null>(ACTIVE_PHYSICAL_SHIPPING_CARRIER);
  const [networkDialogOpen, setNetworkDialogOpen] = useState(false);
  const [pendingBaseToken, setPendingBaseToken] = useState<"USDT" | "USDC">(
    "USDT",
  );
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [isDepositingStake, setIsDepositingStake] = useState(false);
  const [backendCanisterId, setBackendCanisterId] = useState<string | null>(
    null,
  );
  const [editLoadError, setEditLoadError] = useState<
    "notOwner" | "loadError" | null
  >(null);

  const [form, setForm] = useState<FormState>({
    title: "",
    category: "",
    categoryId: null,
    categoryAttributes: {},
    condition: "",
    description: "",
    isDigital: false,
    digitalFileUrl: "",
    digitalFileHash: "",
    digitalPassword: "",
    digitalPasswordEnabled: false,
    priceAmount: "",
    priceToken: TradeToken.USDT_TRC20,
    location: "",
    shippingWeightKg: "1",
    shippingFromCity: "",
    shippingToCity: "",
    packageWeight: 0,
    packageLength: 0,
    packageWidth: 0,
    packageHeight: 0,
    packagePlaces: 1,
    novaPoshtaEnabled: false,
    novaPoshtaDeliveryTypes: ["branch"],
    novaPoshtaSenderBranchRef: "",
    ukrposhtaEnabled: false,
    ukrposhtaDeliveryTypes: ["branch_to_office"],
    ukrposhtaSenderOfficeRef: "",
    meestEnabled: false,
    meestDeliveryTypes: ["pudo"],
    meestSenderPudoRef: "",
  });

  const requiredStakeMicros = useMemo(() => {
    const priceAmt = listingPriceToChainAmount(
      form.priceAmount,
      form.priceToken,
    );
    if (priceAmt === null) return null;
    return requiredListingStakeMicros(priceAmt, form.priceToken);
  }, [form.priceAmount, form.priceToken]);

  const { data: stakeBalance, refetch: refetchStakeBalance } = useQuery({
    queryKey: ["stakeBalance", form.priceToken, principal?.toText()],
    queryFn: async () => {
      if (
        !identity ||
        identity.getPrincipal().isAnonymous() ||
        !backendCanisterId
      ) {
        return null;
      }
      return fetchMyStakeBalance(backendCanisterId, identity, form.priceToken);
    },
    enabled:
      !isEditMode &&
      !!identity &&
      !identity.getPrincipal().isAnonymous() &&
      !!backendCanisterId &&
      step >= 1,
  });

  const stakeShortfall = useMemo(() => {
    if (requiredStakeMicros === null || !stakeBalance) return null;
    if (stakeBalance.available >= requiredStakeMicros) return 0n;
    return requiredStakeMicros - stakeBalance.available;
  }, [requiredStakeMicros, stakeBalance]);

  const {
    data: existingListing,
    isLoading: isLoadingListing,
    isSuccess: isListingLoaded,
  } = useQuery<ListingCard | null>({
    queryKey: ["listing", editId],
    queryFn: async () => {
      if (!actor || !editId) return null;
      return actor.getListing(BigInt(editId)) as Promise<ListingCard | null>;
    },
    enabled: !!actor && !isFetching && isEditMode,
  });

  const [attributeErrors, setAttributeErrors] = useState<
    Record<string, string>
  >({});

  const { data: attributeSchema } = useQuery({
    queryKey: ["categoryAttributeSchema", form.categoryId, actor],
    queryFn: () =>
      form.categoryId != null && actor
        ? fetchCategoryAttributeSchema(actor, form.categoryId)
        : Promise.resolve([]),
    enabled: form.categoryId != null && form.categoryId > 0 && !!actor,
  });

  // ── When edit mode listing loads as null → show load error ────────────────
  useEffect(() => {
    if (isEditMode && isListingLoaded && existingListing === null) {
      setEditLoadError("loadError");
    }
  }, [isEditMode, isListingLoaded, existingListing]);

  useEffect(() => {
    resolveBackendCanisterId()
      .then((id) => {
        if (id) setBackendCanisterId(id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!actor || !principal || isFetching) return;
    actor
      .getSellerLiability(principal)
      .then((result) => {
        if (result.__kind__ === "ok") {
          const balanceCents = Number(result.ok);
          // Block if liability is negative AND abs value > 10000 cents ($100)
          setLiabilityBlocked(
            balanceCents < 0 && Math.abs(balanceCents) > 10000,
          );
        }
      })
      .catch(() => {
        // Silently ignore — don't block listing creation on error
      });
  }, [actor, principal, isFetching]);

  useEffect(() => {
    if (!existingListing) return;
    // Ownership check: only the seller can edit their own listing
    if (
      principal &&
      existingListing.sellerPrincipal !== undefined &&
      existingListing.sellerPrincipal.toString() !== principal.toString()
    ) {
      setEditLoadError("notOwner");
      return;
    }
    const pkg = (
      existingListing as {
        packageDetails?: {
          weight?: bigint;
          length?: bigint;
          width?: bigint;
          height?: bigint;
          places?: bigint;
        } | null;
      }
    ).packageDetails;
    const npConfig = (
      existingListing as {
        novaPoshtaConfig?: {
          enabled?: boolean;
          deliveryTypes?: string[];
          senderBranchRef?: string;
        } | null;
      }
    ).novaPoshtaConfig;
    const ukConfig = (
      existingListing as {
        ukrposhtaConfig?: {
          enabled?: boolean;
          deliveryTypes?: string[];
          senderOfficeRef?: string | null;
        } | null;
      }
    ).ukrposhtaConfig;
    const meestCfg = (
      existingListing as {
        meestConfig?: {
          enabled?: boolean;
          deliveryTypes?: string[];
          senderPudoRef?: string | null;
        } | null;
      }
    ).meestConfig;
    setForm((prev) => ({
      ...prev,
      title: existingListing.title,
      category: existingListing.category,
      condition: existingListing.condition,
      description: existingListing.description ?? "",
      isDigital: existingListing.category === ListingCategory.digital,
      digitalFileUrl: existingListing.digitalFileUrl ?? "",
      digitalFileHash: "",
      digitalPassword: "",
      digitalPasswordEnabled: false,
      priceAmount: chainAmountToDisplayPrice(
        existingListing.priceAmount,
        existingListing.priceToken,
      ),
      priceToken: existingListing.priceToken,
      location: existingListing.location,
      shippingWeightKg: "1",
      shippingFromCity: "",
      shippingToCity: "",
      packageWeight: pkg ? Number(pkg.weight ?? 0) / 1000 : 0,
      packageLength: pkg ? Number(pkg.length ?? 0) : 0,
      packageWidth: pkg ? Number(pkg.width ?? 0) : 0,
      packageHeight: pkg ? Number(pkg.height ?? 0) : 0,
      packagePlaces: pkg ? Number(pkg.places ?? 1) : 1,
      novaPoshtaEnabled: npConfig?.enabled ?? false,
      novaPoshtaDeliveryTypes: npConfig?.deliveryTypes ?? ["branch"],
      novaPoshtaSenderBranchRef: npConfig?.senderBranchRef ?? "",
      ukrposhtaEnabled: ukConfig?.enabled ?? false,
      ukrposhtaDeliveryTypes: ukConfig?.deliveryTypes ?? ["branch_to_office"],
      ukrposhtaSenderOfficeRef: ukConfig?.senderOfficeRef ?? "",
      meestEnabled: meestCfg?.enabled ?? false,
      meestDeliveryTypes: meestCfg?.deliveryTypes ?? ["pudo"],
      meestSenderPudoRef: meestCfg?.senderPudoRef ?? "",
    }));
    if (existingListing.category === ListingCategory.digital) {
      setSelectedCarrier(null);
    } else {
      setSelectedCarrier(ACTIVE_PHYSICAL_SHIPPING_CARRIER);
    }
    if (existingListing.photos.length > 0) {
      setPhotos(
        existingListing.photos.map((url, i) => ({
          id: `existing-${i}`,
          previewUrl: url,
          file: null,
          persistentUrl: url,
          uploadStatus: "done",
          uploadProgress: 100,
          uploadError: null,
        })),
      );
    }
  }, [existingListing, principal]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const mapUploadError = useCallback(
    (rawMsg: string): string => {
      if (
        rawMsg.includes("403 Forbidden: Invalid payload") ||
        rawMsg.includes("Invalid payload")
      ) {
        return t(locale, "upload.error403Auth");
      }
      if (rawMsg.includes("403") || rawMsg.includes("403 Forbidden")) {
        return t(locale, "upload.error403Auth");
      }
      if (
        rawMsg.includes("CANISTER_ID_BACKEND") ||
        (rawMsg.includes("not set") &&
          rawMsg.toLowerCase().includes("canister"))
      ) {
        return t(locale, "upload.errorCanisterId");
      }
      if (rawMsg.includes("preview") || rawMsg.includes("draft")) {
        return t(locale, "upload.errorPreviewDeployment");
      }
      if (
        rawMsg.includes("NetworkError") ||
        rawMsg.includes("Failed to fetch") ||
        rawMsg.includes("network")
      ) {
        return t(locale, "upload.errorNetwork");
      }
      if (
        rawMsg.toLowerCase().includes("budget") ||
        rawMsg.toLowerCase().includes("payment") ||
        rawMsg.includes("402") ||
        rawMsg.toLowerCase().includes("insufficient")
      ) {
        return t(locale, "upload.errorBudget");
      }
      if (
        rawMsg.includes("CANISTER_ID_BACKEND не налаштовано") ||
        rawMsg.includes("Анонімна ідентифікація") ||
        rawMsg.includes("Internet Identity") ||
        rawMsg.includes("Потрібна авторизація")
      ) {
        return tl("create.signInRequired");
      }
      return t(locale, "upload.errorFailed");
    },
    [locale, tl],
  );

  const addPhotos = useCallback(
    (files: FileList) => {
      if (!isAuthenticatedRef.current) {
        toast.error(tl("create.signInRequired"), {
          description: tl("create.signInDesc"),
        });
        return;
      }

      const ALLOWED_EXTENSIONS = /\.(avif|gif|heic|heif|jpeg|jpg|png|webp)$/i;
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

      const invalidType = Array.from(files).find(
        (f) => !f.type.startsWith("image/") && !ALLOWED_EXTENSIONS.test(f.name),
      );
      if (invalidType) {
        setErrors((e) => ({
          ...e,
          photos:
            tl("create.validation.photoType") ||
            "Unsupported file type. Use JPG, PNG, WEBP, HEIC, or GIF.",
        }));
        return;
      }

      const oversized = Array.from(files).find((f) => f.size > MAX_FILE_SIZE);
      if (oversized) {
        setErrors((e) => ({
          ...e,
          photos:
            tl("create.validation.photoSize") ||
            "File too large. Maximum size is 10 MB.",
        }));
        return;
      }

      const allowed = MAX_PHOTOS - photos.length;
      const toAdd = Array.from(files).slice(0, allowed);
      if (toAdd.length === 0) {
        setErrors((e) => ({
          ...e,
          photos: t(locale, "validation.photos.max"),
        }));
        return;
      }

      const newItems: PhotoItem[] = toAdd.map((f) => ({
        id: `${Date.now()}-${Math.random()}`,
        previewUrl: URL.createObjectURL(f),
        file: f,
        persistentUrl: null,
        uploadStatus: "uploading" as UploadStatus,
        uploadProgress: 0,
        uploadError: null,
      }));

      setPhotos((prev) => [...prev, ...newItems]);
      if (errors.photos) setErrors((e) => ({ ...e, photos: undefined }));

      // Controlled queue: max 2 concurrent uploads, 3 retries each
      processUploadQueue(
        newItems.map((item) => ({ id: item.id, file: item.file! })),
        async ({ id, file }) => {
          const onProgress = (pct: number) => {
            setPhotos((prev) =>
              prev.map((p) =>
                p.id === id ? { ...p, uploadProgress: Math.round(pct) } : p,
              ),
            );
          };

          try {
            const url = await withRetry(() => uploadFile(file, onProgress));
            setPhotos((prev) =>
              prev.map((p) =>
                p.id === id
                  ? {
                      ...p,
                      persistentUrl: url,
                      uploadStatus: "done" as UploadStatus,
                      uploadProgress: 100,
                    }
                  : p,
              ),
            );
          } catch (err: unknown) {
            const rawMsg = err instanceof Error ? err.message : String(err);
            console.error(
              "[CreateListing] uploadFile failed — raw error:",
              err,
            );
            const userMsg = mapUploadError(rawMsg);
            toast.error(tl("create.error.uploadFailed"), {
              description: userMsg,
            });
            setPhotos((prev) =>
              prev.map((p) =>
                p.id === id
                  ? {
                      ...p,
                      uploadStatus: "error" as UploadStatus,
                      uploadError: userMsg,
                    }
                  : p,
              ),
            );
          }
        },
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [photos.length, uploadFile, tl, errors.photos, locale, mapUploadError],
  );

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found && !found.id.startsWith("existing-") && found.previewUrl) {
        URL.revokeObjectURL(found.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const reorderPhotos = (from: number, to: number) => {
    setPhotos((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const retryPhoto = useCallback(
    (id: string) => {
      const photo = photos.find((p) => p.id === id);
      if (!photo?.file) return;

      if (!isAuthenticatedRef.current) {
        toast.error(tl("create.signInRequired"));
        return;
      }

      // Reset to uploading state
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                uploadStatus: "uploading",
                uploadProgress: 0,
                uploadError: null,
                persistentUrl: null,
              }
            : p,
        ),
      );

      const onProgress = (pct: number) => {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, uploadProgress: Math.round(pct) } : p,
          ),
        );
      };

      withRetry(() => uploadFile(photo.file!, onProgress))
        .then((url) => {
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === id
                ? {
                    ...p,
                    persistentUrl: url,
                    uploadStatus: "done" as UploadStatus,
                    uploadProgress: 100,
                  }
                : p,
            ),
          );
        })
        .catch((err: unknown) => {
          const rawMsg = err instanceof Error ? err.message : String(err);
          console.error("[CreateListing] retry uploadFile failed:", err);
          const userMsg = mapUploadError(rawMsg);
          toast.error(tl("create.error.uploadFailed"), {
            description: userMsg,
          });
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === id
                ? {
                    ...p,
                    uploadStatus: "error" as UploadStatus,
                    uploadError: userMsg,
                  }
                : p,
            ),
          );
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [photos, uploadFile, tl, mapUploadError],
  );

  const validateStep = (s: number): boolean => {
    const errs: ValidationErrors = {};
    let attrErrs: Record<string, string> = {};
    if (s === 0) {
      if (!form.title.trim()) errs.title = tl("create.validation.title");
      else if (form.title.trim().length < MIN_TITLE)
        errs.title = t(locale, "validation.title.min");
      else if (form.title.length > MAX_TITLE)
        errs.title = t(locale, "validation.title.max");
      if (form.categoryId == null)
        errs.category = tl("create.validation.category");
      if (!form.condition) errs.condition = tl("create.validation.condition");
      if (!form.description.trim())
        errs.description = tl("create.validation.description");
      else if (form.description.length > MAX_DESC)
        errs.description = t(locale, "validation.description.max");
      if (form.isDigital && !digitalUploadFile && !form.digitalFileUrl.trim())
        errs.digitalFileUrl = tl("create.validation.digitalFile");
      const attrErrsLocal: Record<string, string> = {};
      for (const field of attributeSchema ?? []) {
        if (field.required && !form.categoryAttributes[field.key]?.trim()) {
          attrErrsLocal[field.key] = tl("create.validation.requiredAttribute");
        }
      }
      attrErrs = attrErrsLocal;
      // Package details validation (only if weight > 0 — optional section)
      if (form.packageWeight > 0) {
        if (form.packageWeight > 30)
          errs.packageWeight = tl("listing.validation.weightMax");
        const maxDim = Math.max(
          form.packageLength,
          form.packageWidth,
          form.packageHeight,
        );
        if (maxDim > 120) errs.packageDims = tl("listing.validation.dimMax");
      } else if (form.packageWeight < 0) {
        errs.packageWeight = tl("listing.validation.weightRequired");
      }
    }
    if (s === 1) {
      const price = Number.parseFloat(form.priceAmount);
      if (!form.priceAmount || Number.isNaN(price) || price <= 0)
        errs.priceAmount = tl("create.validation.price");
      else if (price > MAX_PRICE_USD)
        errs.priceAmount = t(locale, "validation.price.range");
      if (!form.location.trim())
        errs.location = tl("create.validation.location");
      else if (form.location.trim().length > MAX_LOCATION)
        errs.location = t(locale, "validation.location.max");
      if (
        !form.isDigital &&
        selectedCarrier !== ACTIVE_PHYSICAL_SHIPPING_CARRIER
      )
        errs.carrier = tl("create.validation.carrier");
    }
    if (s === 2) {
      const uploadingPhotos = photos.filter(
        (p) => p.uploadStatus === "uploading",
      );
      const errorPhotos = photos.filter((p) => p.uploadStatus === "error");
      const donePhotos = photos.filter((p) => p.uploadStatus === "done");

      if (uploadingPhotos.length > 0) {
        errs.photos = tl("create.validation.photosUploading");
      } else if (errorPhotos.length > 0) {
        errs.photos = tl("create.validation.photosErrors");
      } else if (donePhotos.length === 0) {
        errs.photos = tl("create.validation.photosMin");
      }
    }
    setErrors(errs);
    setAttributeErrors(attrErrs);
    return Object.keys(errs).length === 0 && Object.keys(attrErrs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Scroll to the first visible error so the user knows what to fix
      setTimeout(() => {
        const firstError = document.querySelector<HTMLElement>(
          '[data-error="true"], .text-destructive[class*="text-xs"]',
        );
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
    }
  };
  const handleBack = () => {
    setErrors({});
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCarrierSelect = (
    carrier: ShippingCarrier,
    _option: ShippingOption,
  ) => {
    setSelectedCarrier(carrier);
    if (errors.carrier) setErrors((e) => ({ ...e, carrier: undefined }));
  };

  const handleDepositRequiredStake = async () => {
    if (!identity || isDepositingStake || requiredStakeMicros === null) return;
    const depositAmount =
      stakeShortfall !== null && stakeShortfall > 0n
        ? stakeShortfall
        : requiredStakeMicros;
    setIsDepositingStake(true);
    try {
      const result = await depositListingStake(
        identity,
        form.priceToken,
        depositAmount,
        backendCanisterId ?? undefined,
      );
      if ("err" in result) {
        toast.error(tl("create.stake.depositBtn"), {
          description: JSON.stringify(result.err),
        });
        return;
      }
      toast.success(tl("create.stake.depositOk"));
      await refetchStakeBalance();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setIsDepositingStake(false);
    }
  };

  const handleSubmit = async () => {
    console.log("[CreateListing] handleSubmit called", {
      step,
      photoCount: photos.length,
      actorReady: !!actor,
      isFetching,
    });

    // Clear any previous submit error
    setSubmitError(null);

    // ── Actor null guard ──────────────────────────────────────────────────────
    if (!actor) {
      const msg =
        locale === "uk"
          ? "Немає з'єднання — будь ласка, оновіть сторінку."
          : "Not connected — please refresh the page.";
      setSubmitError(msg);
      toast.error(msg);
      return;
    }

    // If still connecting, show a helpful message instead of silently doing nothing
    if (isFetching) {
      const msg = tl("create.connectingWait");
      setSubmitError(tl("create.notConnected"));
      toast.error(tl("create.notConnected"), { description: msg });
      return;
    }

    // ── Re-validate ALL steps before submission ───────────────────────────────
    // This catches cases where the user went forward without completing a step.
    const step0Valid = validateStep(0);
    if (!step0Valid) {
      setStep(0);
      const msg =
        locale === "uk"
          ? "Заповніть обов'язкові поля на першому кроці."
          : "Please complete all required fields in step 1.";
      setSubmitError(msg);
      toast.error(msg);
      return;
    }
    const step1Valid = validateStep(1);
    if (!step1Valid) {
      setStep(1);
      const msg =
        locale === "uk"
          ? "Заповніть обов'язкові поля: ціна та місцезнаходження."
          : "Please complete step 2: price and location.";
      setSubmitError(msg);
      toast.error(msg);
      return;
    }

    // Step 2 validation with explicit error feedback
    if (!validateStep(2)) {
      const uploadingCount = photos.filter(
        (p) => p.uploadStatus === "uploading",
      ).length;
      const errorCount = photos.filter(
        (p) => p.uploadStatus === "error",
      ).length;
      const doneCount = photos.filter((p) => p.uploadStatus === "done").length;

      let msg: string;
      if (uploadingCount > 0) {
        msg = tl("create.photosStillUploading");
      } else if (errorCount > 0) {
        msg = `${tl("create.photosHaveErrors")} ${tl("create.retryPhotoHint")}`;
      } else if (doneCount === 0) {
        msg = tl("create.noPhotos");
      } else {
        msg = tl("create.validation.photosMin");
      }
      setSubmitError(msg);
      toast.error(msg);
      console.log("[CreateListing] validateStep(2) failed", {
        uploadingCount,
        errorCount,
        doneCount,
      });
      return;
    }

    // ── Photo upload pre-submit guard ────────────────────────────────────────
    // Belt-and-suspenders check: verify every photo is fully uploaded before
    // hitting the backend. Catches edge cases where validateStep(2) may have
    // passed but a photo finished erroring between validation and submission.
    const pendingPhotos = photos.filter(
      (p) => p.uploadStatus === "uploading" || p.uploadStatus === "pending",
    );
    const failedPhotos = photos.filter(
      (p) => p.uploadStatus === "error" || p.persistentUrl === null,
    );

    if (pendingPhotos.length > 0) {
      const msg = tl("create.photos.waitForUpload");
      setSubmitError(msg);
      toast.error(msg);
      return;
    }

    if (failedPhotos.length > 0) {
      const msg = tl("create.photos.fixFailedUploads");
      setSubmitError(msg);
      toast.error(msg);
      return;
    }

    setIsSubmitting(true);
    try {
      // Collect persistent CDN URLs for all successfully uploaded photos
      const photoUrls: string[] = photos
        .filter((p) => p.uploadStatus === "done" && p.persistentUrl !== null)
        .map((p) => p.persistentUrl as string);

      console.log("[CreateListing] photoUrls collected:", photoUrls);

      if (photoUrls.length === 0) {
        // Diagnostic: show which photos have persistentUrl=null vs non-null
        const diagnostic = photos
          .map(
            (p, i) =>
              `[${i}] status=${p.uploadStatus} url=${p.persistentUrl ?? "null"}`,
          )
          .join("; ");
        const msg = `${tl("create.photoUrlsMissing")} — діагностика: ${diagnostic}`;
        console.error(
          "[CreateListing] photoUrls empty despite done status:",
          diagnostic,
        );
        setSubmitError(msg);
        toast.error(tl("create.photoUrlsMissing"), {
          description: diagnostic,
          duration: 10000,
        });
        setIsSubmitting(false);
        return;
      }

      const shippingMethodsPayload = form.isDigital
        ? []
        : getPhysicalShippingMethods();
      const priceAmt = listingPriceToChainAmount(
        form.priceAmount,
        form.priceToken,
      );
      if (priceAmt === null) {
        throw new Error(tl("create.validation.price"));
      }

      // Build optional package details payload
      const packageDetailsPayload: PackageDetailsType | null = null;

      // Build optional Nova Poshta config payload
      const novaPoshtaConfigPayload: NovaPoshtaConfigType | null = null;

      // Build optional Ukrposhta config payload
      const ukrposhtaConfigPayload: UkrposhtaConfigType | null = null;

      // Build optional Meest config payload
      const meestConfigPayload: MeestConfigType | null = null;

      // Helper: support both __kind__-based and plain {ok}/{err} Candid variants
      const isErr = (r: unknown) => {
        const x = r as { __kind__?: string; ok?: unknown; err?: unknown };
        return x.__kind__ === "err" || (x.__kind__ === undefined && "err" in x);
      };

      if (isEditMode && editId) {
        console.log("[CreateListing] calling actor.updateListing");
        const res = await actor.updateListing(
          BigInt(editId),
          form.title.trim(),
          form.description.trim(),
          form.category as ListingCategory,
          categoryIdArg(form.categoryId),
          priceAmt,
          form.priceToken,
          form.condition as ItemCondition,
          photoUrls,
          form.location.trim(),
          shippingMethodsPayload,
          form.isDigital && form.digitalFileUrl ? form.digitalFileUrl : null,
          form.isDigital && form.digitalFileHash.trim()
            ? form.digitalFileHash.trim()
            : null,
          null,
          packageDetailsPayload,
          novaPoshtaConfigPayload,
          ukrposhtaConfigPayload,
          meestConfigPayload,
          toAttributePayload(form.categoryAttributes),
        );
        console.log("[CreateListing] updateListing response:", res);
        if (isErr(res)) {
          console.error("[CreateListing] updateListing error:", res);
          const errVariant = (res as { err: unknown }).err;
          let errDesc = JSON.stringify(errVariant);
          let isNoProfile = false;
          let isUnauthorizedUpdate = false;
          if (typeof errVariant === "object" && errVariant !== null) {
            const kind = (errVariant as { __kind__?: string }).__kind__;
            if (kind === "not_found") {
              errDesc = tl("create.error.noProfile");
              isNoProfile = true;
            } else if (kind === "unauthorized") {
              errDesc = tl("errors.anonymousNotAllowed");
              isUnauthorizedUpdate = true;
            } else if (kind === "invalid_input") {
              errDesc = String(
                (errVariant as { invalid_input?: string }).invalid_input ??
                  errDesc,
              );
            }
          }
          setSubmitError(errDesc);
          toast.error(t(locale, "create.updateFailed"), {
            description: errDesc,
            duration: 8000,
          });
          if (isNoProfile) {
            setTimeout(() => navigate({ to: "/onboarding" }), 1500);
          } else if (isUnauthorizedUpdate) {
            setTimeout(() => navigate({ to: "/" }), 1500);
          }
        } else {
          setSubmitError(null);
          toast.success(tl("create.updated"));
          await queryClient.invalidateQueries({
            queryKey: ["listing", editId],
          });
          await queryClient.invalidateQueries({ queryKey: ["listings"] });
          await queryClient.invalidateQueries({ queryKey: ["myListings"] });
          navigate({ to: "/listings/$id", params: { id: editId! } });
        }
      } else {
        console.log("[CreateListing] calling actor.createListing");
        const res = await actor.createListing(
          form.title.trim(),
          form.description.trim(),
          form.category as ListingCategory,
          categoryIdArg(form.categoryId),
          priceAmt,
          form.priceToken,
          form.condition as ItemCondition,
          photoUrls,
          form.location.trim(),
          shippingMethodsPayload,
          form.isDigital,
          null,
          null,
          null,
          packageDetailsPayload,
          novaPoshtaConfigPayload,
          ukrposhtaConfigPayload,
          meestConfigPayload,
          toAttributePayload(form.categoryAttributes),
        );
        console.log("[CreateListing] createListing response:", res);
        if (isErr(res)) {
          console.error("[CreateListing] createListing error:", res);
          const errVariant = (res as { err: unknown }).err;
          // Translate backend error variants into human-readable messages
          let errDesc = JSON.stringify(errVariant);
          let isNoProfile = false;
          let isUnauthorized = false;
          if (typeof errVariant === "object" && errVariant !== null) {
            const kind = (errVariant as { __kind__?: string }).__kind__;
            if (kind === "not_found") {
              errDesc = tl("create.error.noProfile");
              isNoProfile = true;
            } else if (kind === "unauthorized") {
              errDesc = tl("errors.anonymousNotAllowed");
              isUnauthorized = true;
            } else if (kind === "banned") {
              errDesc = tl("create.error.banned");
            } else if (kind === "rate_limited") {
              errDesc = tl("create.error.rateLimited");
            } else if (kind === "insufficient_funds") {
              errDesc = tl("create.stake.insufficient");
            } else if (kind === "invalid_input") {
              errDesc = String(
                (errVariant as { invalid_input?: string }).invalid_input ??
                  errDesc,
              );
            }
          }
          setSubmitError(errDesc);
          toast.error(t(locale, "create.submitFailed"), {
            description: errDesc,
            duration: 8000,
          });
          // If user has no profile, redirect to onboarding immediately
          if (isNoProfile) {
            console.log(
              "[CreateListing] no profile found — redirecting to /onboarding",
            );
            setTimeout(() => navigate({ to: "/onboarding" }), 1500);
          } else if (isUnauthorized) {
            setTimeout(() => navigate({ to: "/" }), 1500);
          }
        } else {
          const okRes = res as unknown as { ok: ListingCard };
          console.log(
            "[CreateListing] createListing success, id:",
            okRes.ok.id,
          );
          setSubmitError(null);
          if (
            form.isDigital &&
            digitalUploadFile &&
            identity &&
            backendCanisterId
          ) {
            const enc = await encryptDigitalFile(digitalUploadFile);
            const cipherFile = new File(
              [enc.encryptedBytes.slice()],
              `${digitalUploadFile.name}.enc`,
              { type: "application/octet-stream" },
            );
            const { url, hash } = await uploadFileWithHash(cipherFile);
            await registerDigitalFileOnListing(
              identity,
              backendCanisterId,
              okRes.ok.id,
              hash,
              enc.mimeType,
              enc.sizeBytes,
              url,
              enc.dekHex,
              enc.contentHash,
            );
            const publishResult = await publishDraftListing(
              identity,
              okRes.ok.id,
              backendCanisterId,
            );
            if ("err" in publishResult) {
              throw new Error(JSON.stringify(publishResult.err));
            }
          }
          await queryClient.invalidateQueries({ queryKey: ["myListings"] });
          const newId = okRes.ok.id.toString();
          if (okRes.ok.status === "draft") {
            toast.info(tl("create.stake.draftSaved"), {
              description: tl("create.stake.insufficient"),
              duration: 10000,
            });
            navigate({ to: "/listings/create", search: { edit: newId } });
          } else {
            toast.success(tl("create.published"));
            navigate({ to: "/listings/$id", params: { id: newId } });
          }
        }
      }
    } catch (e) {
      console.error("[CreateListing] Unexpected error:", e);
      const errMsg = String(e);
      setSubmitError(errMsg);
      toast.error(tl("create.error.generic"), {
        description: errMsg,
        duration: 8000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!actor || !editId) return;
    setIsSubmitting(true);
    try {
      const res = await actor.deactivateListing(BigInt(editId));
      console.log("[CreateListing] deactivateListing response:", res);
      const isErr = (r: { __kind__?: string; err?: unknown }) =>
        r.__kind__ === "err" || (r.__kind__ === undefined && "err" in r);
      if (isErr(res)) {
        toast.error(tl("create.deactivateFailed"));
      } else {
        toast.success(tl("create.deactivated"));
        await queryClient.invalidateQueries({ queryKey: ["myListings"] });
        navigate({ to: "/listings" });
      }
    } catch (e) {
      console.error("[CreateListing] deactivateListing error:", e);
      toast.error(String(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Whether any photo is still uploading — used to disable submit
  const hasUploadingPhotos = photos.some((p) => p.uploadStatus === "uploading");

  if (isInitializing) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!identity || identity.getPrincipal().isAnonymous()) return <AuthPrompt />;

  if (isEditMode && isLoadingListing) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // ── Edit mode error state (not found or not owner) ───────────────────────
  if (isEditMode && editLoadError !== null) {
    const errorMsg =
      editLoadError === "notOwner"
        ? t(locale, "create.editMode.notOwnerError")
        : t(locale, "create.editMode.loadError");
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card shadow-sm p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground mb-2">
              {errorMsg}
            </h2>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate({ to: "/listings" })}
            data-ocid="edit-error-back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            {t(locale, "create.editMode.backToListing")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background"
      data-ocid={isEditMode ? "edit-listing-form" : "create-listing-form"}
    >
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1
            className="text-2xl font-display font-bold text-foreground"
            data-ocid="page-title"
          >
            {isEditMode
              ? t(locale, "create.editMode.heading")
              : t(locale, "create.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isEditMode
              ? t(locale, "create.subtitleEdit")
              : t(locale, "create.subtitle")}
          </p>
        </div>

        <StepIndicator current={step} />

        {/* ── Liability blocked banner ───────────────────────────────────── */}
        {liabilityBlocked && (
          <div
            className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4"
            data-ocid="liability-blocked-banner"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive leading-snug">
              {tl("liability.create.blocked")}
            </p>
          </div>
        )}

        {/* ── No actor / not connected banner ───────────────────────────── */}
        {!actor && !isFetching && (
          <div
            className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4"
            data-ocid="no-actor-banner"
          >
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {tl("create.notConnected")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {locale === "uk"
                  ? "Оновіть сторінку щоб відновити з'єднання."
                  : "Refresh the page to reconnect."}
              </p>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="p-6 sm:p-8">
            {/* ── Step 1: Basic Info ────────────────────── */}
            {step === 0 && (
              <div className="space-y-6" data-ocid="step-basic-info">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="title" className="text-label">
                      {tl("create.field.title")}
                    </Label>
                    <span
                      className={`text-xs tabular-nums ${form.title.length > MAX_TITLE * 0.9 ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {form.title.length}/{MAX_TITLE}
                    </span>
                  </div>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    maxLength={MAX_TITLE}
                    placeholder={tl("create.placeholder.title")}
                    className={errors.title ? "border-destructive" : ""}
                    data-ocid="input-title"
                  />
                  {errors.title && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.title}
                    </p>
                  )}
                </div>

                <div className="space-y-2" data-ocid="select-category">
                  <Label className="text-label">
                    {tl("create.field.category")}
                  </Label>
                  <CategoryPicker
                    valueId={form.categoryId}
                    allowAny={false}
                    onChange={(id, node) => {
                      setForm((f) => ({
                        ...f,
                        categoryId: id,
                        categoryAttributes: {},
                        category: node
                          ? (legacyToListingCategoryKey(
                              node.legacy,
                            ) as ListingCategory)
                          : "",
                        isDigital:
                          node?.slug.includes("tsifrovye") ?? f.isDigital,
                      }));
                    }}
                  />
                  {errors.category && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.category}
                    </p>
                  )}
                </div>

                <CategoryAttributeFields
                  categoryId={form.categoryId}
                  values={form.categoryAttributes}
                  errors={attributeErrors}
                  actor={actor}
                  onChange={(key, value) =>
                    setForm((f) => ({
                      ...f,
                      categoryAttributes: {
                        ...f.categoryAttributes,
                        [key]: value,
                      },
                    }))
                  }
                />

                <div className="space-y-2">
                  <Label className="text-label">
                    {tl("create.field.condition")}
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CONDITIONS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => set("condition", c.value)}
                        className={[
                          "text-left px-4 py-3 rounded-lg border transition-smooth",
                          form.condition === c.value
                            ? "border-accent bg-accent/10 ring-1 ring-accent"
                            : "border-border bg-background hover:border-accent/40 hover:bg-muted/30",
                        ].join(" ")}
                        data-ocid={`condition-${c.value}`}
                      >
                        <p className="text-sm font-semibold text-foreground">
                          {c.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                  {errors.condition && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.condition}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description" className="text-label">
                      {tl("create.field.description")}
                    </Label>
                    <span
                      className={`text-xs tabular-nums ${form.description.length > MAX_DESC * 0.9 ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {form.description.length}/{MAX_DESC}
                    </span>
                  </div>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    maxLength={MAX_DESC}
                    placeholder={tl("create.placeholder.description")}
                    rows={5}
                    className={
                      errors.description
                        ? "border-destructive resize-none"
                        : "resize-none"
                    }
                    data-ocid="input-description"
                  />
                  {errors.description && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {tl("create.field.digitalItem")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tl("create.field.digitalItemDesc")}
                    </p>
                  </div>
                  <Switch
                    checked={form.isDigital}
                    onCheckedChange={(v) => {
                      set("isDigital", v);
                      if (v === true) {
                        setSelectedCarrier(null);
                        if (errors.carrier)
                          setErrors((e) => ({ ...e, carrier: undefined }));
                      } else {
                        setSelectedCarrier(ACTIVE_PHYSICAL_SHIPPING_CARRIER);
                      }
                    }}
                    data-ocid="toggle-digital"
                  />
                </div>

                {form.isDigital && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="digitalFileInput" className="text-label">
                        {tl("create.field.digitalFile")}
                      </Label>
                      <Input
                        id="digitalFileInput"
                        type="file"
                        accept=".pdf,.zip,.png,.jpg,.jpeg,.epub,.mp4,application/pdf,application/zip,image/png,image/jpeg,application/epub+zip,video/mp4"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          if (!file) {
                            setDigitalUploadFile(null);
                            return;
                          }
                          const err = validateDigitalFile(file);
                          if (err) {
                            setDigitalUploadFile(null);
                            setErrors((prev) => ({
                              ...prev,
                              digitalFileUrl: err,
                            }));
                            return;
                          }
                          setDigitalUploadFile(file);
                          setErrors((prev) => ({
                            ...prev,
                            digitalFileUrl: undefined,
                          }));
                        }}
                        className={
                          errors.digitalFileUrl ? "border-destructive" : ""
                        }
                        data-ocid="input-digital-file"
                      />
                      {digitalUploadFile && (
                        <p className="text-xs text-muted-foreground">
                          {digitalUploadFile.name} (
                          {Math.round(digitalUploadFile.size / 1024)} KB)
                        </p>
                      )}
                      {errors.digitalFileUrl && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {errors.digitalFileUrl}
                        </p>
                      )}
                      {(digitalUploadFile || form.digitalFileUrl.trim()) && (
                        <p
                          className="flex items-center gap-1.5 text-xs text-primary/80 mt-0.5"
                          data-ocid="digital-encryption-notice"
                        >
                          <Lock className="w-3 h-3 shrink-0" />
                          {tl("digital.encryptionNotice")}
                        </p>
                      )}
                    </div>

                    {/* Legacy URL fallback hidden — file upload is primary (E2.S11) */}
                    <div className="hidden">
                      <Input
                        id="digitalFileUrl"
                        value={form.digitalFileUrl}
                        readOnly
                      />
                    </div>

                    {/* File Hash (optional) */}
                    <div className="space-y-2">
                      <Label htmlFor="digitalFileHash" className="text-label">
                        {tl("digital.field.fileHash")}
                      </Label>
                      <Input
                        id="digitalFileHash"
                        value={form.digitalFileHash}
                        onChange={(e) => set("digitalFileHash", e.target.value)}
                        placeholder={tl("digital.field.fileHashPlaceholder")}
                        className="font-mono text-sm"
                        data-ocid="input-digital-hash"
                      />
                    </div>
                  </div>
                )}

                <div
                  className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground"
                  data-ocid="delivery-integrations-locked"
                >
                  {tl("shipping.pickupOnly.lockedNotice")}
                </div>
              </div>
            )}

            {/* ── Step 2: Pricing & Shipping ────────────── */}
            {step === 1 && (
              <div className="space-y-6" data-ocid="step-pricing-shipping">
                <div className="space-y-2">
                  <Label className="text-label">
                    {tl("create.field.price")}
                  </Label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.priceAmount}
                        onChange={(e) => set("priceAmount", e.target.value)}
                        placeholder="0.00"
                        className={
                          errors.priceAmount ? "border-destructive" : ""
                        }
                        data-ocid="input-price"
                      />
                      {errors.priceAmount && (
                        <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {errors.priceAmount}
                        </p>
                      )}
                    </div>
                    {/* Token + network selector */}
                    <div className="flex flex-col gap-1.5 min-w-[120px]">
                      {/* Base token buttons */}
                      <div className="flex gap-1.5">
                        {(["USDT", "USDC"] as const).map((base) => {
                          const isActive = form.priceToken.startsWith(base);
                          return (
                            <button
                              key={base}
                              type="button"
                              onClick={() => {
                                setPendingBaseToken(base);
                                setNetworkDialogOpen(true);
                              }}
                              disabled={isSubmitting}
                              className={[
                                "flex-1 px-3 py-2 rounded-md text-sm font-semibold border transition-colors",
                                isActive
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background text-muted-foreground border-input hover:border-primary/60 hover:text-foreground",
                              ].join(" ")}
                              data-ocid={`token-base-${base.toLowerCase()}`}
                            >
                              {base}
                            </button>
                          );
                        })}
                      </div>
                      {/* Selected network chip */}
                      <button
                        type="button"
                        onClick={() => {
                          setPendingBaseToken(
                            form.priceToken.startsWith("USDT")
                              ? "USDT"
                              : "USDC",
                          );
                          setNetworkDialogOpen(true);
                        }}
                        disabled={isSubmitting}
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors px-1"
                        data-ocid="token-change-network"
                      >
                        <span className="font-mono">
                          {TOKENS.find((t) => t.value === form.priceToken)
                            ?.network ?? "TRC20"}
                        </span>
                        <span className="opacity-60">↗</span>
                      </button>
                    </div>

                    {/* Network dialog */}
                    <NetworkSelectionDialog
                      open={networkDialogOpen}
                      baseToken={pendingBaseToken}
                      currentNetwork={form.priceToken}
                      onSelect={(tokenId) =>
                        set("priceToken", tokenId as TradeToken)
                      }
                      onClose={() => setNetworkDialogOpen(false)}
                    />
                  </div>
                </div>

                {!isEditMode && requiredStakeMicros !== null && (
                  <div
                    className="rounded-xl border border-border bg-muted/20 px-4 py-4 space-y-3"
                    data-ocid="listing-stake-panel"
                  >
                    <div className="flex items-start gap-2">
                      <Lock className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {tl("create.stake.title")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tl("create.stake.rule")}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">
                          {tl("create.stake.required")}
                        </p>
                        <p className="font-semibold font-mono">
                          {formatStakeMicros(
                            requiredStakeMicros,
                            form.priceToken,
                          )}{" "}
                          {
                            TOKENS.find((tk) => tk.value === form.priceToken)
                              ?.label
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">
                          {tl("create.stake.available")}
                        </p>
                        <p className="font-semibold font-mono">
                          {stakeBalance
                            ? formatStakeMicros(
                                stakeBalance.available,
                                form.priceToken,
                              )
                            : "—"}{" "}
                          {
                            TOKENS.find((tk) => tk.value === form.priceToken)
                              ?.label
                          }
                        </p>
                        {stakeBalance && stakeBalance.locked > 0n && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {tl("create.stake.locked")}:{" "}
                            {formatStakeMicros(
                              stakeBalance.locked,
                              form.priceToken,
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    {stakeShortfall !== null && stakeShortfall > 0n && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {tl("create.stake.insufficient")}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {tl("create.stake.depositHint")}
                    </p>
                    {stakeShortfall !== null && stakeShortfall > 0n && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={isDepositingStake || isSubmitting}
                        onClick={handleDepositRequiredStake}
                        data-ocid="btn-deposit-stake"
                      >
                        {isDepositingStake ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {tl("create.stake.depositing")}
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            {tl("create.stake.depositBtn")}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-label">
                    {tl("create.field.location")}
                  </Label>
                  <CascadingLocationPicker
                    value={form.location}
                    onChange={(v) => set("location", v)}
                    disabled={isSubmitting}
                    hasError={!!errors.location}
                  />
                  {errors.location && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.location}
                    </p>
                  )}
                </div>

                {!form.isDigital && (
                  <div className="space-y-2">
                    <Label className="text-label">
                      {tl("create.field.carrier")}
                    </Label>
                    <div
                      className={[
                        "rounded-xl border bg-muted/10 p-4",
                        errors.carrier
                          ? "border-destructive ring-1 ring-destructive/30"
                          : "border-border",
                      ].join(" ")}
                      data-error={errors.carrier ? "true" : undefined}
                    >
                      <ShippingProviderSelector
                        selectedCarrier={selectedCarrier}
                        onSelect={handleCarrierSelect}
                        showInputForm
                        locale={locale}
                      />
                    </div>
                    {errors.carrier && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.carrier}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Step 3: Photos ────────────────────────── */}
            {step === 2 && (
              <div className="space-y-6" data-ocid="step-photos">
                {/* Preview deployment banner */}
                {isPreviewDeployment() && (
                  <div
                    className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4"
                    data-ocid="preview-upload-banner"
                    role="alert"
                  >
                    <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-300 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-800 dark:text-amber-200 leading-snug">
                      {t(locale, "upload.previewBanner")}
                    </p>
                  </div>
                )}
                <div>
                  <h3 className="text-label mb-1">
                    {tl("create.photos.upload")}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {tl("create.photos.uploadDesc")}
                  </p>
                  <PhotoZone
                    photos={photos}
                    onAdd={
                      isPreviewDeployment()
                        ? () => {
                            toast.error(
                              t(locale, "upload.errorPreviewDeployment"),
                            );
                          }
                        : addPhotos
                    }
                    onRemove={removePhoto}
                    onReorder={reorderPhotos}
                    onRetry={retryPhoto}
                    error={errors.photos}
                  />
                </div>

                {/* Summary */}
                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    {tl("create.review.title")}
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <span className="text-muted-foreground">
                      {tl("create.field.title")}
                    </span>
                    <span className="font-medium text-foreground truncate">
                      {form.title || "—"}
                    </span>
                    <span className="text-muted-foreground">
                      {tl("create.field.category")}
                    </span>
                    <span className="font-medium text-foreground">
                      {form.categoryId != null
                        ? categoryLabel(
                            getCategoryById(form.categoryId)!,
                            locale === "uk" ? "uk" : "en",
                          )
                        : "—"}
                    </span>
                    <span className="text-muted-foreground">
                      {tl("create.field.condition")}
                    </span>
                    <span className="font-medium text-foreground">
                      {CONDITIONS.find((c) => c.value === form.condition)
                        ?.label ?? "—"}
                    </span>
                    <span className="text-muted-foreground">
                      {tl("create.field.price")}
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {form.priceAmount
                        ? `${form.priceAmount} ${TOKENS.find((tk) => tk.value === form.priceToken)?.label}`
                        : "—"}
                    </span>
                    <span className="text-muted-foreground">
                      {tl("create.field.location")}
                    </span>
                    <span className="font-medium text-foreground truncate">
                      {form.location || "—"}
                    </span>
                    <span className="text-muted-foreground">
                      {tl("create.review.carrier")}
                    </span>
                    <span className="font-medium text-foreground">
                      {selectedCarrier
                        ? selectedCarrier
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase())
                        : "—"}
                    </span>
                    <span className="text-muted-foreground">
                      {tl("create.field.photos")}
                    </span>
                    <span className="font-medium text-foreground">
                      {photos.filter((p) => p.uploadStatus === "done").length} /{" "}
                      {photos.length}
                      {hasUploadingPhotos && (
                        <Loader2 className="w-3 h-3 inline ml-1 animate-spin text-accent" />
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer nav */}
          <div className="border-t border-border px-6 py-4 bg-muted/20 rounded-b-2xl">
            {/* ── Persistent submit error banner ────────────────────────── */}
            {submitError && (
              <div
                className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3"
                data-ocid="submit-error-banner"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive leading-snug break-words min-w-0">
                  {submitError}
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitError(null)}
                  className="ml-auto shrink-0 text-destructive/60 hover:text-destructive"
                  aria-label="Dismiss error"
                  data-ocid="submit-error-dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={step === 0 || isSubmitting}
                className="gap-2"
                data-ocid="btn-back"
              >
                <ChevronLeft className="w-4 h-4" />
                {t(locale, "create.back")}
              </Button>

              <div className="flex items-center gap-2">
                {/* Cancel button — edit mode only */}
                {isEditMode && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowDiscardDialog(true)}
                    disabled={isSubmitting}
                    className="text-muted-foreground hover:text-foreground"
                    data-ocid="btn-cancel-edit"
                  >
                    {t(locale, "create.editMode.cancelBtn")}
                  </Button>
                )}

                {isEditMode && step === 2 && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeactivate}
                    disabled={isSubmitting}
                    className="gap-2"
                    data-ocid="btn-deactivate"
                  >
                    {isSubmitting && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    {t(locale, "create.deactivate")}
                  </Button>
                )}

                {step < 2 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="gap-2 button-primary"
                    data-ocid="btn-next"
                  >
                    {t(locale, "create.continue")}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={
                      isSubmitting || hasUploadingPhotos || liabilityBlocked
                    }
                    className="gap-2 button-primary min-w-[140px]"
                    data-ocid="btn-submit"
                    title={
                      liabilityBlocked
                        ? tl("liability.create.blocked")
                        : hasUploadingPhotos
                          ? tl("create.photosStillUploading")
                          : undefined
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isEditMode
                          ? tl("create.updating")
                          : tl("create.publishing")}
                      </>
                    ) : isFetching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {tl("create.connecting")}
                      </>
                    ) : hasUploadingPhotos ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {tl("create.photosStillUploading")}
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        {isEditMode
                          ? tl("create.editMode.saveBtn")
                          : tl("create.publish")}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Discard Changes Confirmation Dialog ───────────────────────────── */}
      {showDiscardDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          data-ocid="discard-dialog"
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowDiscardDialog(false);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl p-6 space-y-4">
            <div className="space-y-1.5">
              <h2 className="text-lg font-display font-bold text-foreground">
                {t(locale, "create.editMode.discardConfirm.title")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t(locale, "create.editMode.discardConfirm.description")}
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDiscardDialog(false)}
                data-ocid="discard-dialog-keep-editing"
              >
                {t(locale, "create.editMode.discardConfirm.keepEditing")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setShowDiscardDialog(false);
                  navigate({
                    to: "/listings/$id",
                    params: { id: editId! },
                  });
                }}
                data-ocid="discard-dialog-confirm"
              >
                {t(locale, "create.editMode.discardConfirm.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
