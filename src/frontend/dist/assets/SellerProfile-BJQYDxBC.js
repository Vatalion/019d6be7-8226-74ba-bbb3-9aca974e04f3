import { c as createLucideIcon, r as reactExports, j as jsxRuntimeExports, a3 as formatTimestamp, B as Button, S as Skeleton, b as useLocale, D as TrustLevel, i as ShieldCheck, J as useParams, k as useBackend, f as useAuth, a4 as Principal, l as useQuery, a5 as formatPrincipal, u as useNavigate, a6 as CreditCard, s as useQueryClient, v as ue, d as detectLocale, t, a7 as getPaymentMethodsFromBackend } from "./index-B5zdxtVX.js";
import { A as Avatar, a as AvatarFallback } from "./avatar-Tui4ofRV.js";
import { M as MessageSquare } from "./message-square-BXqZQPf9.js";
import { C as ChevronLeft } from "./chevron-left-CBxTSC68.js";
import { C as ChevronRight } from "./chevron-right-Cnbj-FPT.js";
import { S as Star } from "./star-wJAL47u3.js";
import { T as TrendingUp } from "./trending-up-H9W4xjlD.js";
import { T as TriangleAlert } from "./triangle-alert-o1odUVxS.js";
import { B as Badge } from "./badge-qfLaSFgU.js";
import { D as Dialog, c as DialogContent, d as DialogHeader, e as DialogTitle, i as DialogFooter } from "./dialog-CK1oAFS1.js";
import { I as Input } from "./input-DHN02rGb.js";
import { L as Label } from "./label-BtVhwz-T.js";
import { S as Separator } from "./separator-B3vjI6IU.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-DcJy3Qed.js";
import { T as Textarea } from "./textarea-CO2VWUtE.js";
import { u as useMutation } from "./useMutation-rp8clqKq.js";
import { T as TOKEN_LABELS } from "./addressDetector-JQdSiwAQ.js";
import { P as Pencil } from "./pencil-COAU5tgw.js";
import { C as Check } from "./check-Ckd98-EH.js";
import { C as Copy } from "./copy-C7AyuFsT.js";
import { C as CircleCheck } from "./circle-check-DpfL7oJ3.js";
import { S as Shield } from "./shield-CPybkuzJ.js";
import "./index-DQ35GCHn.js";
import "./index-BNCFcFUZ.js";
import "./index-BrewpA67.js";
import "./index-B-Ax1TuK.js";
import "./Combination-BdycxqGU.js";
import "./index-Bd_GsmbO.js";
import "./index-G6S72QUb.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  ["path", { d: "M8 2v4", key: "1cmpym" }],
  ["path", { d: "M16 2v4", key: "4m81vk" }],
  ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
  ["path", { d: "M3 10h18", key: "8toen8" }],
  ["path", { d: "M8 14h.01", key: "6423bh" }],
  ["path", { d: "M12 14h.01", key: "1etili" }],
  ["path", { d: "M16 14h.01", key: "1gbofw" }],
  ["path", { d: "M8 18h.01", key: "lrp35t" }],
  ["path", { d: "M12 18h.01", key: "mhygvu" }],
  ["path", { d: "M16 18h.01", key: "kzsmim" }]
];
const CalendarDays = createLucideIcon("calendar-days", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["rect", { width: "7", height: "7", x: "3", y: "3", rx: "1", key: "1g98yp" }],
  ["rect", { width: "7", height: "7", x: "14", y: "3", rx: "1", key: "6d4xhi" }],
  ["rect", { width: "7", height: "7", x: "14", y: "14", rx: "1", key: "nxv5o0" }],
  ["rect", { width: "7", height: "7", x: "3", y: "14", rx: "1", key: "1bb6yr" }]
];
const LayoutGrid = createLucideIcon("layout-grid", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71", key: "1cjeqo" }],
  ["path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71", key: "19qd67" }]
];
const Link = createLucideIcon("link", __iconNode);
const PAGE_SIZE = 8;
const STAR_KEYS$1 = ["s1", "s2", "s3", "s4", "s5"];
const SKELETON_KEYS$1 = ["sk1", "sk2", "sk3", "sk4"];
function StarRating$1({ value }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "flex items-center gap-0.5",
      "aria-label": `${value} out of 5 stars`,
      children: STAR_KEYS$1.map((key, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        Star,
        {
          className: `h-3 w-3 ${i < value ? "fill-accent text-accent" : "text-muted-foreground/30"}`
        },
        key
      ))
    }
  );
}
function principalInitials(p) {
  return p.slice(0, 2).toUpperCase();
}
function truncatePrincipal(p) {
  if (p.length <= 12) return p;
  return `${p.slice(0, 6)}…${p.slice(-4)}`;
}
function FeedbackItemSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 p-4 border-b border-border last:border-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-9 rounded-full flex-shrink-0" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-40" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-full max-w-sm" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-24" })
    ] })
  ] });
}
function FeedbackList({ items, isLoading }) {
  const [page, setPage] = reactExports.useState(0);
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const pageItems = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "card-elevated overflow-hidden", children: SKELETON_KEYS$1.map((key) => /* @__PURE__ */ jsxRuntimeExports.jsx(FeedbackItemSkeleton, {}, key)) });
  }
  if (items.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "feedback-empty",
        className: "card-elevated flex flex-col items-center justify-center py-16 text-center px-4",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-10 w-10 text-muted-foreground/30 mb-3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-foreground font-semibold mb-1", children: "No reviews yet" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Completed trades leave a review trail here" })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "card-elevated overflow-hidden", "data-ocid": "feedback-list", children: pageItems.map((fb) => {
      const reviewerStr = fb.reviewer.toString();
      const rating = Number(fb.rating);
      const date = formatTimestamp(fb.createdAt);
      const tradeLabel = `Trade #${fb.trade.toString()}`;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          "data-ocid": "feedback-item",
          className: "flex gap-3 p-4 border-b border-border last:border-0 hover:bg-muted/20 transition-colors",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { className: "h-9 w-9 flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "bg-secondary text-secondary-foreground text-xs font-bold", children: principalInitials(reviewerStr) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: "text-xs font-mono text-muted-foreground truncate",
                    title: reviewerStr,
                    children: truncatePrincipal(reviewerStr)
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(StarRating$1, { value: rating }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "token-chip text-[10px] leading-none py-0.5 px-2", children: tradeLabel })
              ] }),
              fb.comment ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-foreground/90 leading-snug break-words line-clamp-3", children: fb.comment }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground italic", children: "No comment left" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: date.toLocaleDateString(void 0, {
                year: "numeric",
                month: "short",
                day: "numeric"
              }) })
            ] })
          ]
        },
        fb.id.toString()
      );
    }) }),
    totalPages > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center justify-between mt-4 px-1",
        "data-ocid": "feedback-pagination",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
            page * PAGE_SIZE + 1,
            "–",
            Math.min((page + 1) * PAGE_SIZE, items.length),
            " of ",
            items.length
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "icon",
                className: "h-8 w-8",
                onClick: () => setPage((p) => p - 1),
                disabled: page === 0,
                "aria-label": "Previous page",
                "data-ocid": "feedback-prev",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground px-1", children: [
              page + 1,
              " / ",
              totalPages
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "icon",
                className: "h-8 w-8",
                onClick: () => setPage((p) => p + 1),
                disabled: page >= totalPages - 1,
                "aria-label": "Next page",
                "data-ocid": "feedback-next",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" })
              }
            )
          ] })
        ]
      }
    )
  ] });
}
const STAR_KEYS = ["s1", "s2", "s3", "s4", "s5"];
const SKELETON_KEYS = [
  "sk-trades",
  "sk-rating",
  "sk-trust",
  "sk-disputes"
];
function StarRating({
  value,
  ariaLabel
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-0.5", "aria-label": ariaLabel, children: STAR_KEYS.map((key, i) => {
    const filled = i < Math.floor(value);
    const partial = !filled && i < value;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Star,
      {
        className: `h-3.5 w-3.5 ${filled ? "fill-accent text-accent" : partial ? "fill-accent/40 text-accent" : "text-muted-foreground/30"}`
      },
      key
    );
  }) });
}
function trustLevelClass$1(level) {
  switch (level) {
    case TrustLevel.gold:
      return "badge-tier-gold";
    case TrustLevel.silver:
      return "badge-tier-silver";
    case TrustLevel.bronze:
      return "badge-tier-bronze";
    default:
      return "badge-tier-new";
  }
}
function ReputationStats({ stats, isLoading }) {
  const { t: t2 } = useLocale();
  function trustLevelLabel2(level) {
    switch (level) {
      case TrustLevel.gold:
        return t2("trust.tier.gold");
      case TrustLevel.silver:
        return t2("trust.tier.silver");
      case TrustLevel.bronze:
        return t2("trust.tier.bronze");
      default:
        return t2("trust.tier.new");
    }
  }
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3", children: SKELETON_KEYS.map((key) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-elevated p-4 space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-24" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-7 w-16" })
    ] }, key)) });
  }
  const completedTrades = stats ? Number(stats.completedTrades) : 0;
  const avgRating = (stats == null ? void 0 : stats.averageRating) ?? 0;
  const trustLevel = (stats == null ? void 0 : stats.trustLevel) ?? TrustLevel.new_;
  const disputeRate = (stats == null ? void 0 : stats.disputeRate) ?? 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "grid grid-cols-2 sm:grid-cols-4 gap-3",
      "data-ocid": "reputation-stats",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-elevated p-4 flex flex-col gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground font-medium", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-3.5 w-3.5" }),
            t2("reputation.completedTrades")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              className: "text-2xl font-bold text-foreground",
              "data-ocid": "stat-trades",
              children: completedTrades
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-elevated p-4 flex flex-col gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground font-medium", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-3.5 w-3.5" }),
            t2("reputation.averageRating")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", "data-ocid": "stat-rating", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold text-foreground", children: avgRating.toFixed(1) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              StarRating,
              {
                value: avgRating,
                ariaLabel: t2("reputation.ratingAriaLabel").replace(
                  "{value}",
                  avgRating.toFixed(1)
                )
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-elevated p-4 flex flex-col gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground font-medium", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-3.5 w-3.5" }),
            t2("reputation.trustLevel")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center", "data-ocid": "stat-trust", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `${trustLevelClass$1(trustLevel)} text-sm`, children: trustLevelLabel2(trustLevel) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-elevated p-4 flex flex-col gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground font-medium", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-3.5 w-3.5" }),
            t2("reputation.disputeRate")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "p",
            {
              className: `text-2xl font-bold ${disputeRate > 5 ? "text-destructive" : "text-foreground"}`,
              "data-ocid": "stat-dispute-rate",
              children: [
                disputeRate.toFixed(1),
                "%"
              ]
            }
          )
        ] })
      ]
    }
  );
}
function trustLevelClass(level) {
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
function trustLevelLabel(level) {
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
function avatarInitials(username, principalStr) {
  if (username && username.trim().length > 0) {
    const parts = username.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return username.slice(0, 2).toUpperCase();
  }
  return principalStr.slice(0, 2).toUpperCase();
}
function formatTokenDisplay(token) {
  return token;
}
function AddressVerificationBadge({
  verification
}) {
  const { t: t2 } = useLocale();
  if (!verification) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "span",
      {
        className: "inline-flex items-center gap-1 text-xs text-muted-foreground",
        title: t2("payment.badge.unverified"),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-3 w-3" }),
          t2("payment.badge.unverified")
        ]
      }
    );
  }
  if (verification.active && Number(verification.txCount) > 0) {
    const verifiedDate = new Date(
      Number(verification.verifiedAt) / 1e6
    ).toLocaleDateString();
    const expiresDate = new Date(
      Number(verification.expiresAt) / 1e6
    ).toLocaleDateString();
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "span",
      {
        className: "inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400",
        title: `${t2("payment.badge.level2")} · ${Number(verification.txCount)} tx · verified ${verifiedDate} · expires ${expiresDate}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-3 w-3 fill-green-500/20" }),
          t2("payment.badge.level2")
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "span",
    {
      className: "inline-flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400",
      title: t2("payment.badge.formatValid"),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-3 w-3" }),
        t2("payment.badge.formatValid")
      ]
    }
  );
}
function PaymentMethodsCard({ methods }) {
  const { t: t2 } = useLocale();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "rounded-xl border border-border bg-card shadow-sm overflow-hidden",
      "data-ocid": "payment-methods-card",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-3 border-b border-border bg-muted/20 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-foreground", children: t2("payment.savedMethods") })
        ] }),
        methods.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "px-4 py-6 text-center",
            "data-ocid": "payment-methods-empty",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t2("payment.noPaymentMethods") })
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-border", children: methods.map((method, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "flex items-center justify-between gap-3 px-4 py-3",
            "data-ocid": `profile-payment-method.${idx + 1}`,
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 space-y-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: TOKEN_LABELS[method.token] ?? method.token }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-xs text-muted-foreground font-mono block truncate", children: method.address.length > 20 ? `${method.address.slice(0, 10)}…${method.address.slice(-8)}` : method.address }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(AddressVerificationBadge, { verification: method.verification })
            ] })
          },
          `${method.token}-${method.address}`
        )) })
      ]
    }
  );
}
function formatReasonLabel(reason) {
  const locale = detectLocale();
  const key = `liability.reason.${reason}`;
  try {
    const translated = t(locale, key);
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
  liabilityHistory
}) {
  const { t: tl } = useLocale();
  const navigate = useNavigate();
  const balanceCents = Number(liabilityBalance);
  const balanceDollars = Math.abs(balanceCents) / 100;
  const isNegative = balanceCents < 0;
  const isPositive = balanceCents > 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "rounded-xl border border-border bg-card shadow-sm overflow-hidden",
      "data-ocid": "liability-card",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-3 border-b border-border bg-muted/20 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-foreground", children: tl("liability.balance.title") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-4", children: isNegative ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3",
            "data-ocid": "liability-negative-badge",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4 text-destructive mt-0.5 shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-destructive leading-snug", children: tl("liability.balance.negative").replace(
                "{{amount}}",
                `$${balanceDollars.toFixed(2)}`
              ) })
            ]
          }
        ) : isPositive ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-center gap-2 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3",
            "data-ocid": "liability-positive-badge",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4 text-green-600 shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-green-700 dark:text-green-400 font-medium", children: tl("liability.balance.positive").replace(
                "{{amount}}",
                `$${balanceDollars.toFixed(2)}`
              ) })
            ]
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-center gap-2 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3",
            "data-ocid": "liability-zero-badge",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4 text-green-600 shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-green-700 dark:text-green-400 font-medium", children: tl("liability.balance.zero") })
            ]
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-2.5 bg-muted/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide", children: tl("liability.history.title") }) }),
          liabilityHistory.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "px-4 py-6 text-center",
              "data-ocid": "liability-history-empty",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: tl("liability.history.empty") })
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", "data-ocid": "liability-history-table", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border bg-muted/10", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left px-4 py-2 text-xs font-medium text-muted-foreground", children: tl("liability.history.col.date") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right px-4 py-2 text-xs font-medium text-muted-foreground", children: tl("liability.history.col.amount") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left px-4 py-2 text-xs font-medium text-muted-foreground", children: tl("liability.history.col.reason") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left px-4 py-2 text-xs font-medium text-muted-foreground", children: tl("liability.history.col.trade") })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: liabilityHistory.map((ev, idx) => {
              const evCents = Number(ev.amount);
              const evDollars = Math.abs(evCents) / 100;
              const isCharge = evCents > 0;
              const date = new Date(Number(ev.timestamp) / 1e6);
              const rowKey = `${ev.timestamp.toString()}-${idx}`;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "tr",
                {
                  className: "border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors",
                  "data-ocid": `liability-history-row.${idx + 1}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap", children: date.toLocaleDateString(void 0, {
                      year: "numeric",
                      month: "short",
                      day: "numeric"
                    }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "td",
                      {
                        className: `px-4 py-2.5 text-right font-mono text-xs font-semibold whitespace-nowrap ${isCharge ? "text-destructive" : "text-green-600 dark:text-green-400"}`,
                        children: [
                          isCharge ? "+" : "-",
                          "$",
                          evDollars.toFixed(2)
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-2.5 text-xs text-foreground", children: formatReasonLabel(ev.reason) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-2.5 text-xs", children: ev.tradeId != null ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => {
                          var _a;
                          return navigate({
                            to: `/trades/${(_a = ev.tradeId) == null ? void 0 : _a.toString()}`
                          });
                        },
                        className: "text-accent hover:underline font-mono",
                        "data-ocid": `liability-trade-link.${idx + 1}`,
                        children: [
                          "#",
                          ev.tradeId.toString()
                        ]
                      }
                    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "—" }) })
                  ]
                },
                rowKey
              );
            }) })
          ] }) })
        ] })
      ]
    }
  );
}
function ListingCardItem({
  listing,
  showInactiveBadge
}) {
  const { t: t2 } = useLocale();
  const navigate = useNavigate();
  const photo = listing.photos[0];
  const price = Number(listing.priceAmount) / 1e8;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      "data-ocid": "profile-listing-card",
      onClick: () => navigate({ to: `/listings/${listing.id}` }),
      className: "card-elevated overflow-hidden text-left transition-smooth hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring relative",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden", children: photo ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: photo,
            alt: listing.title,
            className: "w-full h-full object-cover"
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx(LayoutGrid, { className: "h-8 w-8 text-muted-foreground/30" }) }),
        showInactiveBadge && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: "absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-amber-500/90 text-white text-[10px] font-semibold px-2 py-0.5 shadow-sm",
            "data-ocid": "inactive-listing-badge",
            children: t2("listings.inactiveBadge")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground truncate", children: listing.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "token-chip text-xs py-0.5", children: [
              price.toFixed(price < 1e-3 ? 6 : 4),
              " ",
              formatTokenDisplay(listing.priceToken)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground truncate", children: listing.location })
          ] })
        ] })
      ]
    }
  );
}
const LISTING_SKELETON_KEYS = [
  "lsk1",
  "lsk2",
  "lsk3",
  "lsk4",
  "lsk5",
  "lsk6"
];
function ListingsGrid({
  listings,
  isLoading,
  showInactiveNote,
  markInactive
}) {
  const { t: t2 } = useLocale();
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3", children: LISTING_SKELETON_KEYS.map((key) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-elevated overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "aspect-[4/3] w-full" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-3/4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-1/2" })
      ] })
    ] }, key)) });
  }
  if (listings.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "listings-empty",
        className: "card-elevated flex flex-col items-center justify-center py-16 text-center px-4",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LayoutGrid, { className: "h-10 w-10 text-muted-foreground/30 mb-3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-foreground font-semibold mb-1", children: t2("listings.noListings") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t2("listings.noFoundSub") })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "grid grid-cols-2 sm:grid-cols-3 gap-3",
        "data-ocid": "profile-listings-grid",
        children: listings.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          ListingCardItem,
          {
            listing: l,
            showInactiveBadge: markInactive || l.status === "inactive"
          },
          l.id.toString()
        ))
      }
    ),
    showInactiveNote && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "p",
      {
        className: "text-xs text-muted-foreground text-center",
        "data-ocid": "profile-inactive-note",
        children: t2("profile.listings.inactiveHidden")
      }
    )
  ] });
}
function EditProfileDialog({ open, onClose, profile }) {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  const [username, setUsername] = reactExports.useState(profile.username);
  const [bio, setBio] = reactExports.useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = reactExports.useState(profile.avatarUrl);
  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.setMyProfile(
        username.trim(),
        bio.trim(),
        avatarUrl.trim(),
        null
      );
      if (result.__kind__ === "err") throw new Error("Failed to save profile");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      ue.success("Profile updated");
      onClose();
    },
    onError: () => {
      ue.error("Failed to update profile");
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: (v) => !v && onClose(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-md", "data-ocid": "edit-profile-dialog", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Edit Profile" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "ep-username", "data-ocid": "edit-username-label", children: "Display Name" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "ep-username",
            value: username,
            onChange: (e) => setUsername(e.target.value),
            placeholder: "Your display name",
            maxLength: 64,
            "data-ocid": "edit-username-input"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "ep-bio", children: "Bio" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            id: "ep-bio",
            value: bio,
            onChange: (e) => setBio(e.target.value),
            placeholder: "Tell buyers about yourself…",
            rows: 3,
            maxLength: 280,
            className: "resize-none",
            "data-ocid": "edit-bio-input"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground text-right", children: [
          bio.length,
          "/280"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "ep-avatar", children: "Avatar URL" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "ep-avatar",
            type: "url",
            value: avatarUrl,
            onChange: (e) => setAvatarUrl(e.target.value),
            placeholder: "https://…",
            "data-ocid": "edit-avatar-input"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "outline",
          onClick: onClose,
          disabled: mutation.isPending,
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          onClick: () => mutation.mutate(),
          disabled: mutation.isPending || !username.trim(),
          "data-ocid": "edit-profile-save",
          children: mutation.isPending ? "Saving…" : "Save"
        }
      )
    ] })
  ] }) });
}
function ProfileErrorCard({
  icon: Icon,
  title,
  description,
  btnLabel,
  btnHref,
  ocid
}) {
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background flex items-center justify-center px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "card-elevated max-w-md w-full text-center py-12 px-8 space-y-4",
      "data-ocid": ocid,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-16 w-16 rounded-full bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-8 w-8 text-muted-foreground" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-foreground", children: title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: description }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: () => navigate({ to: btnHref }),
            "data-ocid": `${ocid}-browse-btn`,
            children: btnLabel
          }
        )
      ]
    }
  ) });
}
function ProfilePage() {
  const { id } = useParams({ strict: false });
  const { actor, isFetching } = useBackend();
  const { principal } = useAuth();
  const { t: t2 } = useLocale();
  const [copied, setCopied] = reactExports.useState(false);
  const [editOpen, setEditOpen] = reactExports.useState(false);
  const [activeTab, setActiveTab] = reactExports.useState(
    "listings"
  );
  const [ownerListingTab, setOwnerListingTab] = reactExports.useState(
    "active"
  );
  const isMe = id === "me" || !id;
  let targetPrincipal;
  let invalidLink = false;
  if (isMe) {
    targetPrincipal = principal ?? void 0;
  } else {
    try {
      targetPrincipal = Principal.fromText(id);
    } catch {
      invalidLink = true;
    }
  }
  const isOwn = !invalidLink && (targetPrincipal == null ? void 0 : targetPrincipal.toText()) === (principal == null ? void 0 : principal.toText());
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError
  } = useQuery({
    queryKey: ["userProfile", targetPrincipal == null ? void 0 : targetPrincipal.toText()],
    queryFn: () => actor.getUserProfile(targetPrincipal),
    enabled: !!actor && !isFetching && !!targetPrincipal,
    staleTime: 3e4,
    gcTime: 3e5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1
  });
  const { data: reputationStats, isLoading: statsLoading } = useQuery({
    queryKey: ["reputationStats", targetPrincipal == null ? void 0 : targetPrincipal.toText()],
    queryFn: () => actor.getUserReputationStats(targetPrincipal),
    enabled: !!actor && !isFetching && !!targetPrincipal,
    staleTime: 3e4,
    gcTime: 3e5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
  const { data: allListings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ["userListings", targetPrincipal == null ? void 0 : targetPrincipal.toText()],
    queryFn: () => actor.getListingsByUser(targetPrincipal, BigInt(0), BigInt(50)),
    enabled: !!actor && !isFetching && !!targetPrincipal,
    staleTime: 3e4,
    gcTime: 3e5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
  const { data: feedback = [], isLoading: feedbackLoading } = useQuery({
    queryKey: ["userFeedback", targetPrincipal == null ? void 0 : targetPrincipal.toText()],
    queryFn: () => actor.getUserFeedback(targetPrincipal),
    enabled: !!actor && !isFetching && !!targetPrincipal,
    staleTime: 3e4,
    gcTime: 3e5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: () => getPaymentMethodsFromBackend(actor),
    enabled: !!actor && !isFetching && isOwn,
    staleTime: 3e4,
    gcTime: 3e5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
  const handleCopyPrincipal = () => {
    const text = (targetPrincipal == null ? void 0 : targetPrincipal.toText()) ?? "";
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2e3);
    });
  };
  if (invalidLink) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      ProfileErrorCard,
      {
        icon: Link,
        title: t2("profile.invalidLink.title"),
        description: t2("profile.invalidLink.description"),
        btnLabel: t2("profile.invalidLink.browseBtn"),
        btnHref: "/listings",
        ocid: "profile-invalid-link"
      }
    );
  }
  if (profileLoading && !profile) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-card border-b border-border px-6 py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-3xl mx-auto flex gap-5 items-start", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-20 w-20 rounded-full flex-shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-48" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-72" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-32" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-3xl mx-auto px-4 py-6 space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3", children: ["sk1", "sk2", "sk3", "sk4"].map((key) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-24 rounded-lg" }, key)) }) })
    ] });
  }
  if (!profileLoading && (profileError || !profile)) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      ProfileErrorCard,
      {
        icon: TriangleAlert,
        title: t2("profile.notFound.title"),
        description: t2("profile.notFound.description"),
        btnLabel: t2("profile.notFound.browseBtn"),
        btnHref: "/listings",
        ocid: "profile-not-found"
      }
    );
  }
  const safeProfile = profile;
  const publicProfile = isOwn ? safeProfile : {
    ...safeProfile,
    // Strip private financial/identity fields for public view
    liabilityBalance: BigInt(0),
    liabilityHistory: [],
    // Strip any potential email/phone if they exist
    ..."email" in safeProfile ? { email: void 0 } : {},
    ..."phone" in safeProfile ? { phone: void 0 } : {}
  };
  const principalStr = (targetPrincipal == null ? void 0 : targetPrincipal.toText()) ?? "";
  const rawUsername = safeProfile.username ?? "";
  const username = profileLoading ? "Unknown User" : rawUsername.trim().length > 0 ? rawUsername : isOwn ? "Unknown User" : t2("profile.anonymousSeller");
  const bio = safeProfile.bio ?? "";
  const trustLevel = safeProfile.trustLevel ?? TrustLevel.new_;
  const memberSince = safeProfile.createdAt ? formatTimestamp(safeProfile.createdAt) : null;
  const typedAllListings = allListings;
  const publicListings = typedAllListings.filter((l) => {
    const s = l.status;
    if (s === void 0) return true;
    return s === "active";
  });
  const ownerActiveListings = typedAllListings.filter(
    (l) => !l.status || l.status === "active"
  );
  const ownerInactiveListings = typedAllListings.filter(
    (l) => l.status === "inactive"
  );
  const listings = isOwn ? typedAllListings : publicListings;
  const inactiveWereFiltered = !isOwn && typedAllListings.length > publicListings.length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-card border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-3xl mx-auto px-4 py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-5 items-start", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Avatar, { className: "h-20 w-20 flex-shrink-0 text-xl font-bold border-2 border-border", children: [
        safeProfile.avatarUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: safeProfile.avatarUrl,
            alt: username,
            className: "h-full w-full object-cover rounded-full"
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "bg-primary/10 text-primary font-bold text-2xl", children: avatarInitials(username, principalStr) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3 mb-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "h1",
            {
              className: "text-xl font-bold text-foreground truncate",
              "data-ocid": "profile-username",
              children: username
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: trustLevelClass(trustLevel),
              "data-ocid": "profile-trust-badge",
              children: trustLevelLabel(trustLevel)
            }
          ),
          isOwn && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: () => setEditOpen(true),
              className: "gap-1.5 h-7 text-xs",
              "data-ocid": "edit-profile-btn",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3 w-3" }),
                "Edit Profile"
              ]
            }
          )
        ] }),
        isOwn && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: "font-mono text-xs text-muted-foreground truncate max-w-[220px]",
              title: principalStr,
              children: formatPrincipal(principalStr, 8, 6)
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: handleCopyPrincipal,
              className: "h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors",
              "aria-label": "Copy principal ID",
              "data-ocid": "copy-principal-btn",
              children: copied ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3 text-accent" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3 w-3" })
            }
          )
        ] }),
        memberSince && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs text-muted-foreground mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarDays, { className: "h-3.5 w-3.5" }),
          "Member since",
          " ",
          memberSince.toLocaleDateString(void 0, {
            year: "numeric",
            month: "long"
          })
        ] }),
        bio.trim().length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            className: "text-sm text-muted-foreground leading-snug break-words line-clamp-3",
            "data-ocid": "profile-bio",
            children: bio
          }
        )
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-3xl mx-auto px-4 py-6 space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ReputationStats, { stats: reputationStats, isLoading: statsLoading }),
      isOwn && /* @__PURE__ */ jsxRuntimeExports.jsx(
        LiabilityCard,
        {
          liabilityBalance: publicProfile.liabilityBalance,
          liabilityHistory: publicProfile.liabilityHistory
        }
      ),
      isOwn && /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentMethodsCard, { methods: paymentMethods }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Tabs,
        {
          value: activeTab,
          onValueChange: (v) => setActiveTab(v),
          "data-ocid": "profile-tabs",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "w-full mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                TabsTrigger,
                {
                  value: "listings",
                  className: "flex-1",
                  "data-ocid": "tab-listings",
                  children: [
                    isOwn ? t2("nav.profile").replace("My ", "") : "",
                    !isOwn ? "Listings" : "Listings",
                    isOwn ? ownerActiveListings.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "ml-2 text-xs", children: ownerActiveListings.length }) : listings.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "ml-2 text-xs", children: listings.length })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                TabsTrigger,
                {
                  value: "feedback",
                  className: "flex-1",
                  "data-ocid": "tab-feedback",
                  children: [
                    "Feedback",
                    feedback.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "ml-2 text-xs", children: feedback.length })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "listings", className: "mt-0", children: isOwn ? (
              /* Owner view: Active / Inactive sub-tabs */
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: "flex gap-1 p-1 bg-muted/40 rounded-lg w-fit",
                    "data-ocid": "owner-listing-subtabs",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: () => setOwnerListingTab("active"),
                          className: `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${ownerListingTab === "active" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`,
                          "data-ocid": "owner-listing-tab-active",
                          children: [
                            t2("profile.tabs.active"),
                            ownerActiveListings.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1.5 inline-flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold w-4 h-4", children: ownerActiveListings.length })
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: () => setOwnerListingTab("inactive"),
                          className: `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${ownerListingTab === "inactive" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`,
                          "data-ocid": "owner-listing-tab-inactive",
                          children: [
                            t2("profile.tabs.inactive"),
                            ownerInactiveListings.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1.5 inline-flex items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold w-4 h-4", children: ownerInactiveListings.length })
                          ]
                        }
                      )
                    ]
                  }
                ),
                ownerListingTab === "active" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ListingsGrid,
                  {
                    listings: ownerActiveListings,
                    isLoading: listingsLoading
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ListingsGrid,
                  {
                    listings: ownerInactiveListings,
                    isLoading: listingsLoading,
                    markInactive: true
                  }
                )
              ] })
            ) : (
              /* Public view: active only */
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ListingsGrid,
                {
                  listings: publicListings,
                  isLoading: listingsLoading,
                  showInactiveNote: inactiveWereFiltered
                }
              )
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "feedback", className: "mt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FeedbackList, { items: feedback, isLoading: feedbackLoading }) })
          ]
        }
      )
    ] }),
    isOwn && safeProfile && editOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(
      EditProfileDialog,
      {
        open: editOpen,
        onClose: () => setEditOpen(false),
        profile: safeProfile
      }
    )
  ] });
}
export {
  ProfilePage as default
};
