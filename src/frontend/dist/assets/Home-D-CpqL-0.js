import { c as createLucideIcon, j as jsxRuntimeExports, S as Skeleton, u as useNavigate, d as detectLocale, I as ItemCondition, t, T as TrustLevel, a as ShippingCarrier, b as useAuth, e as useLocale, B as Button, L as LogIn, f as ShieldCheck, g as useBackend, h as useQuery } from "./index-BWWoZgQl.js";
import { B as Badge } from "./badge-BoDWZNmE.js";
import { C as Card } from "./card-OgGjF7ui.js";
import { M as MapPin } from "./map-pin-Di7aBuvz.js";
import { S as Star } from "./star-BlZYgWTS.js";
import { P as Package } from "./package-CekRYaEV.js";
import { Z as Zap } from "./zap-Dnor7rJM.js";
import { T as Truck, F as FileText } from "./truck-BpVceF6V.js";
import { S as Separator } from "./separator-BOhQH1Xi.js";
import { m as motion } from "./proxy-DpDQb9_A.js";
import { W as Wallet } from "./wallet-Dz9U5owZ.js";
import "./index-DdS8yIT6.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "m12 5 7 7-7 7", key: "xquz4c" }]
];
const ArrowRight = createLucideIcon("arrow-right", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  [
    "path",
    {
      d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",
      key: "4pj2yx"
    }
  ],
  ["path", { d: "M20 3v4", key: "1olli1" }],
  ["path", { d: "M22 5h-4", key: "1gvqau" }],
  ["path", { d: "M4 17v2", key: "vumght" }],
  ["path", { d: "M5 18H3", key: "zchphs" }]
];
const Sparkles = createLucideIcon("sparkles", __iconNode);
function formatPrice(amount, token) {
  const num = Number(amount) / 1e8;
  const formatted = num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
  return `${formatted} ${token}`;
}
function conditionLabel(c) {
  const locale = detectLocale();
  const map = {
    [ItemCondition.new_]: "condition.new",
    [ItemCondition.likeNew]: "condition.likeNew",
    [ItemCondition.good]: "condition.good",
    [ItemCondition.fair]: "condition.fair",
    [ItemCondition.poor]: "condition.poor"
  };
  return t(locale, map[c] ?? "condition.new");
}
function conditionVariant(c) {
  if (c === ItemCondition.new_ || c === ItemCondition.likeNew) return "default";
  if (c === ItemCondition.good) return "secondary";
  return "outline";
}
function trustBadgeClass(level) {
  const map = {
    [TrustLevel.new_]: "badge-tier-new",
    [TrustLevel.bronze]: "badge-tier-bronze",
    [TrustLevel.silver]: "badge-tier-silver",
    [TrustLevel.gold]: "badge-tier-gold"
  };
  return map[level] ?? "badge-tier-new";
}
function trustBadgeLabel(level) {
  const locale = detectLocale();
  const map = {
    [TrustLevel.new_]: "trust.tier.new",
    [TrustLevel.bronze]: "trust.tier.bronze",
    [TrustLevel.silver]: "trust.tier.silver",
    [TrustLevel.gold]: "trust.tier.gold"
  };
  return t(locale, map[level] ?? "trust.tier.new");
}
function carrierTitle(carrier) {
  const locale = detectLocale();
  const map = {
    [ShippingCarrier.nova_poshta]: "carrier.nova_poshta",
    [ShippingCarrier.ukrposhta]: "carrier.ukrposhta",
    [ShippingCarrier.meest]: "carrier.meest",
    [ShippingCarrier.self_pickup]: "carrier.self_pickup",
    [ShippingCarrier.digital]: "carrier.digital"
  };
  return t(locale, map[carrier] ?? "carrier.nova_poshta");
}
function CarrierIcon({ carrier }) {
  const title = carrierTitle(carrier);
  switch (carrier) {
    case ShippingCarrier.nova_poshta:
      return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { title, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Truck, { className: "w-3 h-3" }) });
    case ShippingCarrier.ukrposhta:
      return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { title, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "w-3 h-3" }) });
    case ShippingCarrier.meest:
      return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { title, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-3 h-3" }) });
    case ShippingCarrier.self_pickup:
      return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { title, children: /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-3 h-3" }) });
    case ShippingCarrier.digital:
      return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { title, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-3 h-3" }) });
    default:
      return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { title, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "w-3 h-3" }) });
  }
}
function ListingCard({ listing }) {
  const navigate = useNavigate();
  const photo = listing.photos[0] ?? "/assets/images/placeholder.svg";
  const uniqueCarriers = Array.from(
    new Set(listing.shippingMethods.map((m) => m.carrier))
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      "data-ocid": "listing-card",
      className: "card-elevated group cursor-pointer overflow-hidden flex flex-col hover:border-accent/40 transition-smooth",
      onClick: () => navigate({ to: "/listings/$id", params: { id: listing.id.toString() } }),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative aspect-[4/3] overflow-hidden bg-muted", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: photo,
              alt: listing.title,
              className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500",
              onError: (e) => {
                e.currentTarget.src = "/assets/images/placeholder.svg";
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-card/80 backdrop-blur-sm text-[10px] sm:text-xs font-medium text-foreground border border-border capitalize", children: listing.category }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute top-1.5 right-1.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Badge,
            {
              variant: conditionVariant(listing.condition),
              className: "text-[10px] sm:text-xs px-1.5 py-0",
              children: conditionLabel(listing.condition)
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5 p-2.5 sm:p-3 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium sm:font-semibold text-foreground text-xs sm:text-sm leading-snug line-clamp-1 sm:line-clamp-2 sm:min-h-[2.5rem]", children: listing.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "token-chip self-start text-accent font-bold text-xs sm:text-sm", children: formatPrice(listing.priceAmount, listing.priceToken) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-2.5 h-2.5 flex-shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: listing.location })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-auto pt-1.5 sm:pt-2 border-t border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] sm:text-xs text-foreground font-medium truncate max-w-[60px] sm:max-w-[80px]", children: listing.sellerUsername }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: `hidden sm:inline ${trustBadgeClass(listing.sellerTrustLevel)}`,
                  children: trustBadgeLabel(listing.sellerTrustLevel)
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 flex-shrink-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-0.5 text-muted-foreground", children: [
                uniqueCarriers.slice(0, 1).map((carrier) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sm:hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CarrierIcon, { carrier }) }, carrier)),
                uniqueCarriers.slice(0, 3).map((carrier) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CarrierIcon, { carrier }) }, carrier))
              ] }),
              listing.sellerRating > 0n && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "w-2.5 h-2.5 sm:w-3 sm:h-3 text-accent fill-accent" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: Number(listing.sellerRating).toFixed(1) })
              ] })
            ] })
          ] })
        ] })
      ]
    }
  );
}
function ListingCardSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "card-elevated overflow-hidden flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "aspect-[4/3] w-full rounded-none" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5 p-2.5 sm:p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3.5 w-3/4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3.5 w-1/2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-24 rounded-full" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-2.5 w-20" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between pt-1.5 border-t border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-16" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-12" })
      ] })
    ] })
  ] });
}
function useFeaturedListings() {
  const { actor, isFetching } = useBackend();
  return useQuery({
    queryKey: ["listings", "featured"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.searchListings(
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          0n,
          6n
        );
      } catch (err) {
        console.warn("[useFeaturedListings] searchListings failed:", err);
        return [];
      }
    },
    enabled: !isFetching,
    retry: 2,
    retryDelay: (attempt) => Math.min(1e3 * 2 ** attempt, 1e4)
  });
}
function HeroSection() {
  const { identity, isAuthenticated, isLoggingIn, login } = useAuth();
  const { t: t2 } = useLocale();
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "section",
    {
      "data-ocid": "hero",
      className: "relative w-full flex items-center justify-center overflow-hidden min-h-[180px] sm:min-h-[420px]",
      style: {
        background: "linear-gradient(135deg, #0f0f1a 0%, #1a1040 40%, #0d1b2a 100%)"
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 text-center py-6 sm:py-16", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 16 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.5, ease: "easeOut" },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-sm font-medium mb-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-3.5 h-3.5" }),
                t2("hero.badge")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl sm:text-5xl lg:text-6xl font-display font-bold text-white leading-tight mb-2 sm:mb-5", children: [
                t2("hero.title"),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: "text-accent",
                    style: { textShadow: "0 0 40px oklch(0.72 0.18 145 / 0.5)" },
                    children: t2("hero.titleHighlight")
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "hidden sm:block text-lg text-white/80 max-w-xl mx-auto mb-8 leading-relaxed", children: t2("hero.subtitle") })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 12 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.5, delay: 0.12, ease: "easeOut" },
            className: "flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  "data-ocid": "hero-browse-cta",
                  size: "lg",
                  className: "button-primary group gap-2 text-sm sm:text-base px-5 sm:px-8 py-2.5 sm:py-3 h-auto w-full sm:w-auto",
                  onClick: () => navigate({ to: "/listings" }),
                  children: [
                    t2("hero.browseCta"),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-4 h-4 group-hover:translate-x-1 transition-transform" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden sm:block", children: isAuthenticated ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 px-4 py-2 rounded-md bg-card/60 backdrop-blur-sm border border-border text-sm text-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-2 h-2 rounded-full bg-green-500 flex-shrink-0" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: t2("hero.welcomeBack") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground font-mono text-xs truncate max-w-[120px]", children: [
                  identity == null ? void 0 : identity.getPrincipal().toText().slice(0, 8),
                  "…"
                ] })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  "data-ocid": "hero-login-cta",
                  variant: "outline",
                  size: "lg",
                  className: "gap-2 text-base px-6 py-3 h-auto bg-white text-gray-900 hover:bg-gray-100 font-semibold shadow-md border border-gray-200",
                  onClick: login,
                  disabled: isLoggingIn,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(LogIn, { className: "w-4 h-4" }),
                    isLoggingIn ? t2("nav.connecting") : t2("hero.loginCta")
                  ]
                }
              ) })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          motion.div,
          {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: 0.8, delay: 0.35 },
            className: "hidden lg:flex flex-wrap justify-center gap-2 mt-8",
            "aria-label": "Supported payment tokens",
            children: [
              "USDT · TRC20",
              "USDT · BEP20",
              "USDT · ERC20",
              "USDT · Solana",
              "USDC · ERC20",
              "USDC · Solana",
              "USDC · BEP20",
              "USDC · Polygon"
            ].map((token) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs text-white font-medium border border-white/40 bg-white/20 backdrop-blur-sm",
                children: token
              },
              token
            ))
          }
        )
      ] })
    }
  );
}
function FeaturedListings() {
  const { data: listings, isLoading, isError } = useFeaturedListings();
  const { t: t2 } = useLocale();
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "section",
    {
      "data-ocid": "featured-listings",
      className: "bg-background py-6 sm:py-16",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto px-3 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4 sm:mb-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base sm:text-2xl font-display font-semibold sm:font-bold text-foreground", children: t2("listings.featured") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs sm:text-sm mt-0.5", children: t2("listings.featuredSub") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              "data-ocid": "view-all-listings",
              variant: "outline",
              size: "sm",
              className: "gap-2 hidden sm:flex",
              onClick: () => navigate({ to: "/listings" }),
              children: [
                t2("listings.viewAll"),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-3.5 h-3.5" })
              ]
            }
          )
        ] }),
        isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            "data-ocid": "listings-loading",
            className: "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4",
            children: Array.from({ length: 6 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton list
              /* @__PURE__ */ jsxRuntimeExports.jsx(ListingCardSkeleton, {}, i)
            ))
          }
        ),
        isError && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            "data-ocid": "listings-error",
            className: "text-center py-12 text-muted-foreground",
            children: t2("listings.loadFailed")
          }
        ),
        !isLoading && !isError && listings && listings.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "listings-empty",
            className: "text-center py-12 flex flex-col items-center gap-4",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-full bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-7 h-7 text-muted-foreground" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-foreground", children: t2("listings.noListings") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm mt-1", children: t2("listings.noListingsFirst") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  "data-ocid": "create-first-listing",
                  onClick: () => navigate({ to: "/listings/create" }),
                  children: t2("listings.postFirst")
                }
              )
            ]
          }
        ),
        !isLoading && !isError && listings && listings.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4", children: listings.map((listing) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            motion.div,
            {
              initial: { opacity: 0, y: 12 },
              whileInView: { opacity: 1, y: 0 },
              viewport: { once: true },
              transition: { duration: 0.35 },
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(ListingCard, { listing })
            },
            listing.id.toString()
          )) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center mt-5 sm:hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              "data-ocid": "view-all-listings-mobile",
              variant: "outline",
              size: "sm",
              className: "w-full",
              onClick: () => navigate({ to: "/listings" }),
              children: t2("listings.viewAllListings")
            }
          ) })
        ] })
      ] })
    }
  );
}
function HowItWorks() {
  const { t: t2 } = useLocale();
  const HOW_IT_WORKS = [
    {
      icon: FileText,
      step: "01",
      title: t2("hiw.step1.title"),
      desc: t2("hiw.step1.desc")
    },
    {
      icon: Wallet,
      step: "02",
      title: t2("hiw.step2.title"),
      desc: t2("hiw.step2.desc")
    },
    {
      icon: ShieldCheck,
      step: "03",
      title: t2("hiw.step3.title"),
      desc: t2("hiw.step3.desc")
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "section",
    {
      "data-ocid": "how-it-works",
      className: "py-8 sm:py-16",
      style: { background: "oklch(0.18 0 0)" },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto px-3 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden sm:block text-center mb-12", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-display font-bold text-foreground mb-2", children: t2("hiw.title") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground max-w-lg mx-auto text-sm", children: t2("hiw.subtitle") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sm:hidden flex items-center justify-around gap-1 mb-1", children: HOW_IT_WORKS.map((item, idx) => {
          const Icon = item.icon;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": `how-it-works-step-mobile-${idx + 1}`,
              className: "flex flex-col items-center gap-1.5 flex-1 px-1",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-4 h-4 text-accent" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-center text-muted-foreground font-medium leading-tight", children: item.title })
              ]
            },
            item.step
          );
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden sm:grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8", children: HOW_IT_WORKS.map((item, idx) => {
          const Icon = item.icon;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.div,
            {
              "data-ocid": `how-it-works-step-${idx + 1}`,
              initial: { opacity: 0, y: 20 },
              whileInView: { opacity: 1, y: 0 },
              viewport: { once: true },
              transition: { duration: 0.5, delay: idx * 0.12 },
              className: "relative flex flex-col items-start gap-4 p-6 rounded-xl border border-border bg-card hover:border-accent/30 transition-smooth group",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between w-full", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:bg-accent/20 transition-smooth", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-5 h-5 text-accent" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-3xl font-bold text-muted/30 select-none", children: item.step })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-foreground mb-1.5", children: item.title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: item.desc })
                ] })
              ]
            },
            item.step
          );
        }) })
      ] })
    }
  );
}
function TrustBanner() {
  const { t: t2 } = useLocale();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "bg-background py-6 sm:py-10 border-t border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto px-3 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col sm:hidden gap-2", children: [
      { labelKey: "trust.escrow", icon: ShieldCheck },
      { labelKey: "trust.identity", icon: LogIn },
      { labelKey: "trust.multiToken", icon: Wallet }
    ].map(({ labelKey, icon: Icon }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center gap-2 text-muted-foreground text-xs",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-3.5 h-3.5 text-accent flex-shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t2(labelKey) })
        ]
      },
      labelKey
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden sm:flex flex-wrap justify-center gap-8 text-center", children: [
      { labelKey: "trust.escrow", icon: ShieldCheck },
      { labelKey: "trust.identity", icon: LogIn },
      { labelKey: "trust.multiToken", icon: Wallet }
    ].map(({ labelKey, icon: Icon }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center gap-2 text-muted-foreground text-sm",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-4 h-4 text-accent flex-shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t2(labelKey) })
        ]
      },
      labelKey
    )) })
  ] }) });
}
function HomePage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col min-h-screen", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(HeroSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(FeaturedListings, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, { className: "bg-border/50" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(HowItWorks, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TrustBanner, {})
  ] });
}
export {
  HomePage as default
};
