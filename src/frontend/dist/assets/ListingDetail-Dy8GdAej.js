import { c as createLucideIcon, j as jsxRuntimeExports, r as reactExports, q as useComposedRefs, m as cn, s as buttonVariants, u as useNavigate, v as useParams, d as detectLocale, e as useLocale, w as useQueryClient, n as useActor, x as useInternetIdentity, h as useQuery, U as UserRole, S as Skeleton, P as PackageSearch, B as Button, y as TradeToken, t, R as RefreshCw, L as LogIn, k as ItemCondition, f as ShieldCheck, z as ue, o as TrustLevel, p as createActor } from "./index-BWWoZgQl.js";
import { c as composeEventHandlers, a as createSlottable, b as createContextScope } from "./index-C4j9Z2CH.js";
import { R as Root, T as Trigger, W as WarningProvider, C as Content, b as Title, D as Description, a as Close, c as createDialogScope, P as Portal, O as Overlay } from "./index-CKX98P69.js";
import { A as Avatar, b as AvatarImage, a as AvatarFallback } from "./avatar-BNId46vL.js";
import { B as Badge } from "./badge-BoDWZNmE.js";
import { S as Separator } from "./separator-BOhQH1Xi.js";
import { u as useMutation } from "./useMutation-Cr40ksX4.js";
import { A as ACTIVE_PHYSICAL_SHIPPING_CARRIER, S as ShippingProviderSelector } from "./ShippingProviderSelector-CQrMAcvl.js";
import { C as ChevronRight } from "./chevron-right-DQoKpkxJ.js";
import { T as TriangleAlert } from "./triangle-alert--rioHFet.js";
import { M as MapPin } from "./map-pin-Di7aBuvz.js";
import { P as Pencil } from "./pencil-Btq9q4T-.js";
import { E as ExternalLink } from "./external-link-DV7EcUnL.js";
import { C as ChevronLeft } from "./chevron-left-gfFNT2WL.js";
import { S as Star } from "./star-BlZYgWTS.js";
import "./index-DMxnWT8f.js";
import "./Combination-KjsUWUSh.js";
import "./index-ClPJ4lzh.js";
import "./index-CIHuk7Oq.js";
import "./index-DdS8yIT6.js";
import "./circle-check-BhAvNT3V.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M18.36 6.64A9 9 0 0 1 20.77 15", key: "dxknvb" }],
  ["path", { d: "M6.16 6.16a9 9 0 1 0 12.68 12.68", key: "1x7qb5" }],
  ["path", { d: "M12 2v4", key: "3427ic" }],
  ["path", { d: "m2 2 20 20", key: "1ooewy" }]
];
const PowerOff = createLucideIcon("power-off", __iconNode);
var ROOT_NAME = "AlertDialog";
var [createAlertDialogContext] = createContextScope(ROOT_NAME, [
  createDialogScope
]);
var useDialogScope = createDialogScope();
var AlertDialog$1 = (props) => {
  const { __scopeAlertDialog, ...alertDialogProps } = props;
  const dialogScope = useDialogScope(__scopeAlertDialog);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Root, { ...dialogScope, ...alertDialogProps, modal: true });
};
AlertDialog$1.displayName = ROOT_NAME;
var TRIGGER_NAME = "AlertDialogTrigger";
var AlertDialogTrigger$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAlertDialog, ...triggerProps } = props;
    const dialogScope = useDialogScope(__scopeAlertDialog);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Trigger, { ...dialogScope, ...triggerProps, ref: forwardedRef });
  }
);
AlertDialogTrigger$1.displayName = TRIGGER_NAME;
var PORTAL_NAME = "AlertDialogPortal";
var AlertDialogPortal$1 = (props) => {
  const { __scopeAlertDialog, ...portalProps } = props;
  const dialogScope = useDialogScope(__scopeAlertDialog);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Portal, { ...dialogScope, ...portalProps });
};
AlertDialogPortal$1.displayName = PORTAL_NAME;
var OVERLAY_NAME = "AlertDialogOverlay";
var AlertDialogOverlay$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAlertDialog, ...overlayProps } = props;
    const dialogScope = useDialogScope(__scopeAlertDialog);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Overlay, { ...dialogScope, ...overlayProps, ref: forwardedRef });
  }
);
AlertDialogOverlay$1.displayName = OVERLAY_NAME;
var CONTENT_NAME = "AlertDialogContent";
var [AlertDialogContentProvider, useAlertDialogContentContext] = createAlertDialogContext(CONTENT_NAME);
var Slottable = createSlottable("AlertDialogContent");
var AlertDialogContent$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAlertDialog, children, ...contentProps } = props;
    const dialogScope = useDialogScope(__scopeAlertDialog);
    const contentRef = reactExports.useRef(null);
    const composedRefs = useComposedRefs(forwardedRef, contentRef);
    const cancelRef = reactExports.useRef(null);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      WarningProvider,
      {
        contentName: CONTENT_NAME,
        titleName: TITLE_NAME,
        docsSlug: "alert-dialog",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogContentProvider, { scope: __scopeAlertDialog, cancelRef, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Content,
          {
            role: "alertdialog",
            ...dialogScope,
            ...contentProps,
            ref: composedRefs,
            onOpenAutoFocus: composeEventHandlers(contentProps.onOpenAutoFocus, (event) => {
              var _a;
              event.preventDefault();
              (_a = cancelRef.current) == null ? void 0 : _a.focus({ preventScroll: true });
            }),
            onPointerDownOutside: (event) => event.preventDefault(),
            onInteractOutside: (event) => event.preventDefault(),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Slottable, { children }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(DescriptionWarning, { contentRef })
            ]
          }
        ) })
      }
    );
  }
);
AlertDialogContent$1.displayName = CONTENT_NAME;
var TITLE_NAME = "AlertDialogTitle";
var AlertDialogTitle$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAlertDialog, ...titleProps } = props;
    const dialogScope = useDialogScope(__scopeAlertDialog);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Title, { ...dialogScope, ...titleProps, ref: forwardedRef });
  }
);
AlertDialogTitle$1.displayName = TITLE_NAME;
var DESCRIPTION_NAME = "AlertDialogDescription";
var AlertDialogDescription$1 = reactExports.forwardRef((props, forwardedRef) => {
  const { __scopeAlertDialog, ...descriptionProps } = props;
  const dialogScope = useDialogScope(__scopeAlertDialog);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Description, { ...dialogScope, ...descriptionProps, ref: forwardedRef });
});
AlertDialogDescription$1.displayName = DESCRIPTION_NAME;
var ACTION_NAME = "AlertDialogAction";
var AlertDialogAction$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAlertDialog, ...actionProps } = props;
    const dialogScope = useDialogScope(__scopeAlertDialog);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Close, { ...dialogScope, ...actionProps, ref: forwardedRef });
  }
);
AlertDialogAction$1.displayName = ACTION_NAME;
var CANCEL_NAME = "AlertDialogCancel";
var AlertDialogCancel$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAlertDialog, ...cancelProps } = props;
    const { cancelRef } = useAlertDialogContentContext(CANCEL_NAME, __scopeAlertDialog);
    const dialogScope = useDialogScope(__scopeAlertDialog);
    const ref = useComposedRefs(forwardedRef, cancelRef);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Close, { ...dialogScope, ...cancelProps, ref });
  }
);
AlertDialogCancel$1.displayName = CANCEL_NAME;
var DescriptionWarning = ({ contentRef }) => {
  const MESSAGE = `\`${CONTENT_NAME}\` requires a description for the component to be accessible for screen reader users.

You can add a description to the \`${CONTENT_NAME}\` by passing a \`${DESCRIPTION_NAME}\` component as a child, which also benefits sighted users by adding visible context to the dialog.

Alternatively, you can use your own component as a description by assigning it an \`id\` and passing the same value to the \`aria-describedby\` prop in \`${CONTENT_NAME}\`. If the description is confusing or duplicative for sighted users, you can use the \`@radix-ui/react-visually-hidden\` primitive as a wrapper around your description component.

For more information, see https://radix-ui.com/primitives/docs/components/alert-dialog`;
  reactExports.useEffect(() => {
    var _a;
    const hasDescription = document.getElementById(
      (_a = contentRef.current) == null ? void 0 : _a.getAttribute("aria-describedby")
    );
    if (!hasDescription) console.warn(MESSAGE);
  }, [MESSAGE, contentRef]);
  return null;
};
var Root2 = AlertDialog$1;
var Trigger2 = AlertDialogTrigger$1;
var Portal2 = AlertDialogPortal$1;
var Overlay2 = AlertDialogOverlay$1;
var Content2 = AlertDialogContent$1;
var Action = AlertDialogAction$1;
var Cancel = AlertDialogCancel$1;
var Title2 = AlertDialogTitle$1;
var Description2 = AlertDialogDescription$1;
function AlertDialog({
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Root2, { "data-slot": "alert-dialog", ...props });
}
function AlertDialogTrigger({
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Trigger2, { "data-slot": "alert-dialog-trigger", ...props });
}
function AlertDialogPortal({
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Portal2, { "data-slot": "alert-dialog-portal", ...props });
}
function AlertDialogOverlay({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Overlay2,
    {
      "data-slot": "alert-dialog-overlay",
      className: cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      ),
      ...props
    }
  );
}
function AlertDialogContent({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogPortal, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogOverlay, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Content2,
      {
        "data-slot": "alert-dialog-content",
        className: cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        ),
        ...props
      }
    )
  ] });
}
function AlertDialogHeader({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-slot": "alert-dialog-header",
      className: cn("flex flex-col gap-2 text-center sm:text-left", className),
      ...props
    }
  );
}
function AlertDialogFooter({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-slot": "alert-dialog-footer",
      className: cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      ),
      ...props
    }
  );
}
function AlertDialogTitle({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Title2,
    {
      "data-slot": "alert-dialog-title",
      className: cn("text-lg font-semibold", className),
      ...props
    }
  );
}
function AlertDialogDescription({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Description2,
    {
      "data-slot": "alert-dialog-description",
      className: cn("text-muted-foreground text-sm", className),
      ...props
    }
  );
}
function AlertDialogAction({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Action,
    {
      className: cn(buttonVariants(), className),
      ...props
    }
  );
}
function AlertDialogCancel({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Cancel,
    {
      className: cn(buttonVariants({ variant: "outline" }), className),
      ...props
    }
  );
}
const TOKEN_COLORS = {
  USDT_TRC20: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border-emerald-500/30",
  USDT_BEP20: "bg-green-500/15 text-green-700 dark:text-green-200 border-green-500/30",
  USDT_ERC20: "bg-teal-500/15 text-teal-700 dark:text-teal-200 border-teal-500/30",
  USDC_ERC20: "bg-blue-500/15 text-blue-700 dark:text-blue-200 border-blue-500/30"
};
const TRUST_CLASSES = {
  [TrustLevel.new_]: "badge-tier-new",
  [TrustLevel.bronze]: "badge-tier-bronze",
  [TrustLevel.silver]: "badge-tier-silver",
  [TrustLevel.gold]: "badge-tier-gold"
};
const CONDITION_LABEL_KEYS = {
  [ItemCondition.new_]: "condition.new",
  [ItemCondition.likeNew]: "condition.likeNew",
  [ItemCondition.good]: "condition.good",
  [ItemCondition.fair]: "condition.fair",
  [ItemCondition.poor]: "condition.poor"
};
const CONDITION_COLORS = {
  [ItemCondition.new_]: "bg-green-500/15 text-green-700 dark:text-green-200 border-green-500/30",
  [ItemCondition.likeNew]: "bg-teal-500/15 text-teal-700 dark:text-teal-200 border-teal-500/30",
  [ItemCondition.good]: "bg-blue-500/15 text-blue-700 dark:text-blue-200 border-blue-500/30",
  [ItemCondition.fair]: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-200 border-yellow-500/30",
  [ItemCondition.poor]: "bg-red-500/15 text-red-700 dark:text-red-200 border-red-500/30"
};
const APPROVED_TOKENS = [
  TradeToken.USDT_TRC20,
  TradeToken.USDT_BEP20,
  TradeToken.USDT_ERC20,
  TradeToken.USDC_ERC20
];
const TOKEN_DISPLAY = {
  USDT_TRC20: "USDT · TRC20",
  USDT_BEP20: "USDT · BEP20",
  USDT_ERC20: "USDT · ERC20",
  USDC_ERC20: "USDC · ERC20"
};
function formatTokenDisplay(token) {
  return TOKEN_DISPLAY[String(token)] ?? String(token);
}
function formatPrice(amount, _token) {
  const n = Number(amount);
  return `$${(n / 1e6).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function PhotoCarousel({ photos, title }) {
  const { t: tl } = useLocale();
  const [idx, setIdx] = reactExports.useState(0);
  const total = photos.length;
  if (total === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-[4/3] w-full bg-muted rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PackageSearch, { className: "h-16 w-16 text-muted-foreground opacity-30" }) });
  }
  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "relative aspect-[4/3] w-full bg-muted rounded-lg overflow-hidden",
        "data-ocid": "photo-carousel",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: photos[idx],
              alt: `${title} — view ${idx + 1}`,
              className: "w-full h-full object-cover"
            }
          ),
          total > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: prev,
                className: "absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-card transition-colors",
                "aria-label": tl("detail.carousel.prev"),
                "data-ocid": "carousel-prev",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: next,
                className: "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-card transition-colors",
                "aria-label": tl("detail.carousel.next"),
                "data-ocid": "carousel-next",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "absolute bottom-2 right-2 text-xs bg-background/80 text-foreground px-2 py-0.5 rounded-full border border-border", children: [
              idx + 1,
              " / ",
              total
            ] })
          ] })
        ]
      }
    ),
    total > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 overflow-x-auto pb-1", children: photos.map((src, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick: () => setIdx(i),
        className: `shrink-0 h-14 w-14 rounded-md overflow-hidden border-2 transition-colors ${i === idx ? "border-accent" : "border-border"}`,
        "aria-label": tl("detail.carousel.thumb").replace(
          "{n}",
          String(i + 1)
        ),
        "data-ocid": `carousel-thumb-${i}`,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src,
            alt: `${title} — view ${i + 1}`,
            className: "w-full h-full object-cover"
          }
        )
      },
      src || `thumb-${String(i)}`
    )) })
  ] });
}
function SellerCard({
  profile,
  sellerPrincipalText
}) {
  var _a, _b;
  const { t: tl } = useLocale();
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "bg-muted/30 rounded-lg border border-border p-4 space-y-3",
      "data-ocid": "seller-card",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Avatar, { className: "h-10 w-10", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarImage, { src: profile.avatarUrl, alt: profile.username }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "bg-muted font-semibold", children: ((_b = (_a = profile.username) == null ? void 0 : _a[0]) == null ? void 0 : _b.toUpperCase()) ?? "?" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-foreground truncate", children: profile.username }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: TRUST_CLASSES[profile.trustLevel], children: profile.trustLevel })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground line-clamp-1", children: profile.bio || tl("detail.marketplaceMember") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-3.5 w-3.5 fill-accent text-accent" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground font-medium", children: (Number(profile.reputationScore) / 10).toFixed(1) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: tl("detail.reputation") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-3.5 w-3.5 text-accent" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground font-medium", children: tl("detail.verified") })
          ] })
        ] }),
        sellerPrincipalText && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => navigate({
              to: "/profile/$id",
              params: { id: sellerPrincipalText }
            }),
            className: "flex items-center gap-1.5 text-xs text-accent hover:underline underline-offset-2 transition-colors",
            "data-ocid": "seller-profile-link",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" }),
              tl("detail.viewSellerProfile")
            ]
          }
        )
      ]
    }
  );
}
function OtherListingCard({ listing }) {
  const navigate = useNavigate();
  const photo = listing.photos[0];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      onClick: () => navigate({
        to: "/listings/$id",
        params: { id: listing.id.toString() }
      }),
      className: "flex flex-col overflow-hidden rounded-lg border border-border bg-card hover:border-accent/60 transition-colors text-left",
      "data-ocid": "other-listing-card",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-[4/3] bg-muted overflow-hidden", children: photo ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: photo,
            alt: listing.title,
            className: "w-full h-full object-cover"
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PackageSearch, { className: "h-6 w-6 text-muted-foreground opacity-30" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 space-y-0.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-foreground line-clamp-2 leading-snug", children: listing.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-accent", children: formatPrice(listing.priceAmount, listing.priceToken) })
        ] })
      ]
    }
  );
}
function ListingDetailPage() {
  var _a, _b;
  const navigate = useNavigate();
  const params = useParams({ from: "/listings/$id" });
  const listingId = BigInt(params.id);
  const locale = detectLocale();
  const { t: tl } = useLocale();
  const queryClient = useQueryClient();
  const { actor, isFetching } = useActor(createActor);
  const { identity, login } = useInternetIdentity();
  const isAuthed = !!identity && !identity.getPrincipal().isAnonymous();
  const [selectedCarrier, setSelectedCarrier] = reactExports.useState(ACTIVE_PHYSICAL_SHIPPING_CARRIER);
  const {
    data: listing,
    isLoading,
    isError
  } = useQuery({
    queryKey: ["listing", params.id],
    queryFn: async () => {
      if (!actor) return null;
      await actor.incrementListingView(listingId);
      return actor.getListing(listingId);
    },
    enabled: !!actor && !isFetching
  });
  const { data: myProfile } = useQuery({
    queryKey: ["myProfile"],
    queryFn: async () => {
      if (!actor || !isAuthed) return null;
      return actor.getMyProfile();
    },
    enabled: !!actor && isAuthed && !isFetching
  });
  const isOwner = isAuthed && myProfile != null && listing != null && myProfile.id.toText() === listing.sellerPrincipal.toText();
  const ownerPrincipalText = listing ? listing.sellerPrincipal.toText() : void 0;
  const { data: otherListings = [], isLoading: otherListingsLoading } = useQuery({
    queryKey: ["sellerListings", ownerPrincipalText, params.id],
    queryFn: async () => {
      if (!actor || !listing) return [];
      const results = await actor.getListingsByUser(
        listing.sellerPrincipal,
        BigInt(0),
        BigInt(5)
      );
      return results.filter((l) => l.id.toString() !== params.id);
    },
    enabled: !!actor && !!listing && !isFetching
  });
  const isAdmin = (myProfile == null ? void 0 : myProfile.role) === UserRole.admin || (myProfile == null ? void 0 : myProfile.role) === UserRole.moderator;
  const removeMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !listing) throw new Error("Not ready");
      await actor.removeListingByAdmin(
        listing.id,
        "Removed by admin via detail page"
      );
    },
    onSuccess: () => {
      ue.success(tl("detail.removedSuccess"));
      navigate({ to: "/listings" });
    },
    onError: () => ue.error(tl("detail.removedError"))
  });
  const deactivateMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !listing) throw new Error("Not ready");
      return actor.deactivateListing(listing.id);
    },
    onSuccess: (res) => {
      const isErr = (r) => r.__kind__ === "err" || r.__kind__ === void 0 && "err" in r;
      if (isErr(res)) {
        ue.error(tl("detail.deactivateError"));
        return;
      }
      ue.success(tl("detail.deactivateSuccess"));
      void queryClient.invalidateQueries({ queryKey: ["myListings"] });
      void queryClient.invalidateQueries({ queryKey: ["listings"] });
      navigate({ to: "/listings" });
    },
    onError: (e) => {
      ue.error(
        e instanceof Error ? e.message : tl("detail.deactivateErrorGeneric")
      );
    }
  });
  const reactivateMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !listing) throw new Error("Not ready");
      return actor.reactivateListing(listing.id);
    },
    onSuccess: (res) => {
      const isErr = (r) => {
        if (r == null || typeof r !== "object") return false;
        const record = r;
        return record.__kind__ === "err" || record.__kind__ === void 0 && "err" in record;
      };
      if (isErr(res)) {
        ue.error(tl("detail.reactivateError"));
        return;
      }
      ue.success(tl("detail.reactivateSuccess"));
      void queryClient.invalidateQueries({ queryKey: ["listing", params.id] });
      void queryClient.invalidateQueries({ queryKey: ["myListings"] });
      void queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
    onError: () => {
      ue.error(tl("detail.reactivateError"));
    }
  });
  const handleBuyNow = () => {
    if (!isAuthed) {
      login();
      return;
    }
    navigate({ to: "/trades", search: { initiate: params.id } });
  };
  const handleCarrierSelect = (carrier, _option) => {
    setSelectedCarrier(carrier);
  };
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-5xl mx-auto px-4 py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "aspect-[4/3] w-full rounded-lg" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-3/4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-1/2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-full" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-2/3" })
      ] })
    ] }) });
  }
  if (isError || !listing) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4",
        "data-ocid": "listing-not-found",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(PackageSearch, { className: "h-16 w-16 text-muted-foreground opacity-30" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-semibold text-foreground", children: tl("detail.notFound") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: tl("detail.notFoundDesc") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => navigate({ to: "/listings" }), children: tl("detail.browseListings") })
        ]
      }
    );
  }
  const fromCity = ((_b = (_a = listing.location) == null ? void 0 : _a.split(",")[0]) == null ? void 0 : _b.trim()) ?? "";
  const paymentTokens = APPROVED_TOKENS.filter(
    (tk) => tk === listing.priceToken || APPROVED_TOKENS.includes(tk)
  ).slice(0, 4);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-background min-h-screen", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-5xl mx-auto px-4 py-6 space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => navigate({ to: "/listings" }),
          className: "hover:text-foreground transition-colors",
          "data-ocid": "breadcrumb-listings",
          children: tl("detail.breadcrumb.listings")
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-3.5 w-3.5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground truncate max-w-[200px]", children: listing.title })
    ] }),
    listing.status === "inactive" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3",
        "data-ocid": "inactive-banner",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-amber-700 dark:text-amber-300", children: tl("detail.inactiveBanner") })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(PhotoCarousel, { photos: listing.photos, title: listing.title }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold text-foreground leading-snug", children: listing.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                variant: "outline",
                className: `shrink-0 text-xs border ${CONDITION_COLORS[listing.condition]}`,
                children: t(
                  locale,
                  CONDITION_LABEL_KEYS[listing.condition]
                )
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-bold text-accent", children: formatPrice(listing.priceAmount, listing.priceToken) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: `token-chip text-xs ${TOKEN_COLORS[listing.priceToken] ?? ""}`,
                "data-ocid": "price-token",
                children: formatTokenDisplay(listing.priceToken)
              }
            )
          ] }),
          listing.location && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: listing.location })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SellerCard,
          {
            profile: {
              username: listing.sellerUsername,
              trustLevel: listing.sellerTrustLevel,
              reputationScore: listing.sellerRating,
              avatarUrl: "",
              bio: "",
              role: UserRole.user
            },
            sellerPrincipalText: ownerPrincipalText
          }
        ),
        isOwner && (() => {
          const isInactive = listing.status === "inactive";
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex flex-wrap gap-2 pt-1",
              "data-ocid": "owner-actions",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    variant: "outline",
                    size: "sm",
                    className: "gap-2",
                    onClick: () => navigate({
                      to: "/listings/create",
                      search: { edit: params.id }
                    }),
                    "data-ocid": "edit-listing-btn",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3.5 w-3.5" }),
                      tl("detail.editListing")
                    ]
                  }
                ),
                isInactive ? (
                  /* Reactivate button — shown when listing is inactive */
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Button,
                      {
                        variant: "outline",
                        size: "sm",
                        className: "gap-2 text-green-700 dark:text-green-400 border-green-500/40 hover:bg-green-500/10",
                        disabled: reactivateMutation.isPending,
                        "data-ocid": "reactivate-button",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3.5 w-3.5" }),
                          tl("detail.reactivateListing")
                        ]
                      }
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      AlertDialogContent,
                      {
                        className: "bg-card border-border",
                        "data-ocid": "reactivate-dialog",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: tl("detail.reactivateConfirm") }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { className: "text-muted-foreground", children: tl("detail.reactivateDesc") })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              AlertDialogCancel,
                              {
                                className: "border-border",
                                "data-ocid": "reactivate-cancel-btn",
                                children: tl("detail.cancel")
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              AlertDialogAction,
                              {
                                className: "bg-green-600 text-white hover:opacity-90",
                                onClick: () => reactivateMutation.mutate(),
                                disabled: reactivateMutation.isPending,
                                "data-ocid": "reactivate-confirm-btn",
                                children: tl("detail.reactivateListing")
                              }
                            )
                          ] })
                        ]
                      }
                    )
                  ] })
                ) : (
                  /* Deactivate button — shown when listing is active */
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Button,
                      {
                        variant: "outline",
                        size: "sm",
                        className: "gap-2 text-destructive border-destructive/40 hover:bg-destructive/10",
                        disabled: deactivateMutation.isPending,
                        "data-ocid": "deactivate-listing-btn",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(PowerOff, { className: "h-3.5 w-3.5" }),
                          tl("detail.deactivateListing")
                        ]
                      }
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      AlertDialogContent,
                      {
                        className: "bg-card border-border",
                        "data-ocid": "deactivate-dialog",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: tl("detail.deactivateConfirm") }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { className: "text-muted-foreground", children: tl("detail.deactivateDesc") })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              AlertDialogCancel,
                              {
                                className: "border-border",
                                "data-ocid": "deactivate-cancel-btn",
                                children: tl("detail.cancel")
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              AlertDialogAction,
                              {
                                className: "bg-destructive text-destructive-foreground hover:opacity-90",
                                onClick: () => deactivateMutation.mutate(),
                                disabled: deactivateMutation.isPending,
                                "data-ocid": "deactivate-confirm-btn",
                                children: deactivateMutation.isPending ? tl("detail.deactivating") : tl("detail.deactivateListing")
                              }
                            )
                          ] })
                        ]
                      }
                    )
                  ] })
                )
              ]
            }
          );
        })(),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-foreground", children: tl("detail.paymentMethods") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", "data-ocid": "payment-methods", children: paymentTokens.map((token) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: `token-chip text-xs ${TOKEN_COLORS[token] ?? ""}`,
              children: formatTokenDisplay(token)
            },
            token
          )) })
        ] }),
        !isOwner && listing.status !== "inactive" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 pt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              className: "w-full h-11 bg-accent text-accent-foreground hover:opacity-90 font-semibold text-base",
              onClick: handleBuyNow,
              "data-ocid": "buy-now",
              children: isAuthed ? selectedCarrier ? tl("detail.proceedCheckout") : tl("detail.selectShippingAndBuy") : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LogIn, { className: "h-4 w-4" }),
                tl("detail.signInToBuy")
              ] })
            }
          ),
          !isAuthed && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-center text-muted-foreground", children: tl("detail.escrowNote") })
        ] }),
        isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "pt-2 border-t border-border",
            "data-ocid": "admin-actions",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  variant: "destructive",
                  size: "sm",
                  className: "gap-2",
                  "data-ocid": "admin-remove-listing",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4" }),
                    tl("detail.removeListingBtn")
                  ]
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { className: "bg-card border-border", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: tl("detail.removeListingConfirm") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { className: "text-muted-foreground", children: tl("detail.removeListingDesc") })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { className: "border-border", children: tl("detail.cancel") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    AlertDialogAction,
                    {
                      className: "bg-destructive text-destructive-foreground hover:opacity-90",
                      onClick: () => removeMutation.mutate(),
                      disabled: removeMutation.isPending,
                      "data-ocid": "confirm-remove-listing",
                      children: removeMutation.isPending ? tl("detail.removing") : tl("detail.remove")
                    }
                  )
                ] })
              ] })
            ] })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-lg p-5 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-semibold text-foreground", children: tl("detail.description") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground leading-relaxed whitespace-pre-line", children: listing.description ? listing.description : tl("detail.noDescription") })
    ] }),
    !isOwner && isAuthed && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "bg-card border border-border rounded-lg p-5",
        "data-ocid": "shipping-comparison-section",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            ShippingProviderSelector,
            {
              weight: 1,
              fromCity,
              toCity: "",
              selectedCarrier,
              onSelect: handleCarrierSelect,
              showInputForm: true,
              locale
            }
          ),
          selectedCarrier && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 pt-4 border-t border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              className: "w-full h-11 bg-accent text-accent-foreground hover:opacity-90 font-semibold",
              onClick: () => navigate({ to: "/trades", search: { initiate: params.id } }),
              "data-ocid": "proceed-checkout-btn",
              children: tl("detail.proceedCheckout")
            }
          ) })
        ]
      }
    ),
    !!(listing == null ? void 0 : listing.sellerPrincipal) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "bg-card border border-border rounded-lg p-5 space-y-4",
        "data-ocid": "seller-other-listings",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-semibold text-foreground", children: tl("detail.otherListings") }),
            ownerPrincipalText && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => navigate({
                  to: "/profile/$id",
                  params: { id: ownerPrincipalText }
                }),
                className: "text-xs text-accent hover:underline underline-offset-2 flex items-center gap-1",
                "data-ocid": "seller-all-listings-link",
                children: [
                  tl("detail.allListings"),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" })
                ]
              }
            )
          ] }),
          otherListingsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "grid grid-cols-2 sm:grid-cols-3 gap-3",
              "data-ocid": "other-listings-loading",
              children: ["a", "b", "c"].map((k) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: "rounded-lg overflow-hidden border border-border",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "aspect-[4/3] w-full" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 space-y-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-3/4" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-1/2" })
                    ] })
                  ]
                },
                k
              ))
            }
          ) : otherListings.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              className: "text-sm text-muted-foreground",
              "data-ocid": "other-listings-empty",
              children: tl("detail.noOtherListings")
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "grid grid-cols-2 sm:grid-cols-3 gap-3",
              "data-ocid": "other-listings-grid",
              children: otherListings.slice(0, 3).map((l) => /* @__PURE__ */ jsxRuntimeExports.jsx(OtherListingCard, { listing: l }, l.id.toString()))
            }
          )
        ]
      }
    )
  ] }) });
}
export {
  ListingDetailPage as default
};
