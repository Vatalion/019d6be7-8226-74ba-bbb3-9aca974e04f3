import { c as createLucideIcon, e as useLocale, i as ListingCategory, k as ItemCondition, l as ShippingCarrier, j as jsxRuntimeExports, B as Button, r as reactExports, m as cn, u as useNavigate, n as useActor, h as useQuery, P as PackageSearch, S as Skeleton, o as TrustLevel, p as createActor } from "./index-BWWoZgQl.js";
import { B as Badge } from "./badge-BoDWZNmE.js";
import { I as Input } from "./input-CR8lQ-TV.js";
import { L as Label } from "./label-B1jsMbQH.js";
import { S as Separator } from "./separator-BOhQH1Xi.js";
import { R as RotateCcw } from "./rotate-ccw-BOfrB9Hq.js";
import { S as Search } from "./search-3AlRQ99c.js";
import { X } from "./x-RshHEse-.js";
import { A as Avatar, a as AvatarFallback } from "./avatar-BNId46vL.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CY6VZ8xn.js";
import { R as Root, T as Trigger, C as Content, a as Close, P as Portal, O as Overlay } from "./index-CKX98P69.js";
import { C as ChevronRight } from "./chevron-right-DQoKpkxJ.js";
import { M as MapPin } from "./map-pin-Di7aBuvz.js";
import { S as Star } from "./star-BlZYgWTS.js";
import "./index-DdS8yIT6.js";
import "./index-CIHuk7Oq.js";
import "./index-C4j9Z2CH.js";
import "./index-BtGz3Xz6.js";
import "./index-DMxnWT8f.js";
import "./Combination-KjsUWUSh.js";
import "./index-nGcM_Tz3.js";
import "./chevron-up-DDm1bD-d.js";
import "./check-BldUydcH.js";
import "./index-ClPJ4lzh.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["line", { x1: "21", x2: "14", y1: "4", y2: "4", key: "obuewd" }],
  ["line", { x1: "10", x2: "3", y1: "4", y2: "4", key: "1q6298" }],
  ["line", { x1: "21", x2: "12", y1: "12", y2: "12", key: "1iu8h1" }],
  ["line", { x1: "8", x2: "3", y1: "12", y2: "12", key: "ntss68" }],
  ["line", { x1: "21", x2: "16", y1: "20", y2: "20", key: "14d8ph" }],
  ["line", { x1: "12", x2: "3", y1: "20", y2: "20", key: "m0wm8r" }],
  ["line", { x1: "14", x2: "14", y1: "2", y2: "6", key: "14e1ph" }],
  ["line", { x1: "8", x2: "8", y1: "10", y2: "14", key: "1i6ji0" }],
  ["line", { x1: "16", x2: "16", y1: "18", y2: "22", key: "1lctlv" }]
];
const SlidersHorizontal = createLucideIcon("sliders-horizontal", __iconNode);
function setOne(arr, item) {
  return arr.length === 1 && arr[0] === item ? [] : [item];
}
function FilterSection({
  title,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-foreground", children: title }),
    children
  ] });
}
function RadioOption({ id, label, checked, onChange, ocid }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        type: "radio",
        id,
        checked,
        onChange,
        "data-ocid": ocid,
        className: "h-3.5 w-3.5 accent-primary cursor-pointer shrink-0"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Label,
      {
        htmlFor: id,
        className: "text-sm text-foreground cursor-pointer font-normal",
        children: label
      }
    )
  ] });
}
function FilterPanel({
  filters,
  onChange,
  onReset,
  activeCount
}) {
  const { t } = useLocale();
  const CATEGORIES = [
    { value: ListingCategory.electronics, label: t("category.electronics") },
    { value: ListingCategory.clothing, label: t("category.clothing") },
    { value: ListingCategory.books, label: t("category.books") },
    { value: ListingCategory.digital, label: t("category.digital") },
    { value: ListingCategory.services, label: t("category.services") },
    { value: ListingCategory.other, label: t("category.other") }
  ];
  const CONDITIONS = [
    { value: ItemCondition.new_, label: t("condition.new") },
    { value: ItemCondition.likeNew, label: t("condition.likeNew") },
    { value: ItemCondition.good, label: t("condition.good") },
    { value: ItemCondition.fair, label: t("condition.fair") },
    { value: ItemCondition.poor, label: t("condition.poor") }
  ];
  const CARRIERS = [
    { value: ShippingCarrier.self_pickup, label: t("carrier.self_pickup") }
  ];
  const TOKENS = [
    { value: "USDT_TRC20", key: "filter.token.USDT_TRC20" },
    { value: "USDT_BEP20", key: "filter.token.USDT_BEP20" },
    { value: "USDT_ERC20", key: "filter.token.USDT_ERC20" },
    { value: "USDC_ERC20", key: "filter.token.USDC_ERC20" }
  ];
  const updateCategories = (cat) => onChange({ ...filters, categories: setOne(filters.categories, cat) });
  const updateConditions = (cond) => onChange({ ...filters, conditions: setOne(filters.conditions, cond) });
  const updateCarriers = (carrier) => onChange({ ...filters, carriers: setOne(filters.carriers, carrier) });
  const updateToken = (tok) => onChange({ ...filters, token: tok });
  const isPriceRangeInvalid = filters.priceMin !== "" && filters.priceMax !== "" && Number(filters.priceMin) > Number(filters.priceMax);
  const handlePriceMinChange = (val) => {
    onChange({ ...filters, priceMin: val });
  };
  const handlePriceMaxChange = (val) => {
    onChange({ ...filters, priceMax: val });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "aside",
    {
      className: "w-full bg-card border border-border rounded-lg p-4 space-y-5",
      "data-ocid": "filter-panel",
      "aria-label": t("filter.listings"),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersHorizontal, { className: "h-4 w-4 text-accent" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-foreground", children: t("filter.title") }),
            activeCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs h-5 px-1.5", children: activeCount })
          ] }),
          activeCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: onReset,
              className: "h-7 text-xs text-muted-foreground hover:text-foreground gap-1",
              "data-ocid": "filter-reset",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "h-3 w-3" }),
                t("filter.reset")
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(FilterSection, { title: t("filter.category"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", "data-ocid": "filter-category", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            RadioOption,
            {
              id: "cat-any",
              label: t("filter.any"),
              checked: filters.categories.length === 0,
              onChange: () => onChange({ ...filters, categories: [] }),
              ocid: "filter-category-any"
            }
          ),
          CATEGORIES.map(({ value, label }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            RadioOption,
            {
              id: `cat-${value}`,
              label,
              checked: filters.categories[0] === value,
              onChange: () => updateCategories(value),
              ocid: `filter-category-${value}`
            },
            value
          ))
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(FilterSection, { title: t("filter.priceRange"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", "data-ocid": "filter-price", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                placeholder: "Min",
                value: filters.priceMin,
                onChange: (e) => handlePriceMinChange(e.target.value),
                className: `h-8 text-sm bg-background ${isPriceRangeInvalid ? "border-destructive" : "border-input"}`,
                min: 0,
                "data-ocid": "filter-price-min",
                "aria-label": t("filter.price.min")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-sm shrink-0", children: "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                placeholder: "Max",
                value: filters.priceMax,
                onChange: (e) => handlePriceMaxChange(e.target.value),
                className: `h-8 text-sm bg-background ${isPriceRangeInvalid ? "border-destructive" : "border-input"}`,
                min: 0,
                "data-ocid": "filter-price-max",
                "aria-label": t("filter.price.max")
              }
            )
          ] }),
          isPriceRangeInvalid && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              className: "text-xs text-destructive",
              role: "alert",
              "data-ocid": "filter-price-error",
              children: t("filter.price.errorRange")
            }
          )
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(FilterSection, { title: t("filter.condition"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", "data-ocid": "filter-condition", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            RadioOption,
            {
              id: "cond-any",
              label: t("filter.any"),
              checked: filters.conditions.length === 0,
              onChange: () => onChange({ ...filters, conditions: [] }),
              ocid: "filter-condition-any"
            }
          ),
          CONDITIONS.map(({ value, label }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            RadioOption,
            {
              id: `cond-${value}`,
              label,
              checked: filters.conditions[0] === value,
              onChange: () => updateConditions(value),
              ocid: `filter-condition-${value}`
            },
            value
          ))
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(FilterSection, { title: t("filter.shipping"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", "data-ocid": "filter-shipping", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            RadioOption,
            {
              id: "ship-any",
              label: t("filter.any"),
              checked: filters.carriers.length === 0,
              onChange: () => onChange({ ...filters, carriers: [] }),
              ocid: "filter-shipping-any"
            }
          ),
          CARRIERS.map(({ value, label }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            RadioOption,
            {
              id: `ship-${value}`,
              label,
              checked: filters.carriers[0] === value,
              onChange: () => updateCarriers(value),
              ocid: `filter-shipping-${value}`
            },
            value
          ))
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(FilterSection, { title: t("filter.token.title"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", "data-ocid": "filter-token", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            RadioOption,
            {
              id: "token-any",
              label: t("filter.token.any"),
              checked: filters.token === null,
              onChange: () => updateToken(null),
              ocid: "filter-token-any"
            }
          ),
          TOKENS.map(({ value, key }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            RadioOption,
            {
              id: `token-${value}`,
              label: t(key),
              checked: filters.token === value,
              onChange: () => updateToken(filters.token === value ? null : value),
              ocid: `filter-token-${value}`
            },
            value
          ))
        ] }) })
      ]
    }
  );
}
function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder
}) {
  const { t } = useLocale();
  const inputRef = reactExports.useRef(null);
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSubmit == null ? void 0 : onSubmit();
    }
  };
  const handleClear = () => {
    var _a;
    onChange("");
    (_a = inputRef.current) == null ? void 0 : _a.focus();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex items-center w-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Search,
      {
        className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none",
        "aria-hidden": "true"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Input,
      {
        ref: inputRef,
        type: "search",
        value,
        onChange: (e) => onChange(e.target.value),
        onKeyDown: handleKeyDown,
        placeholder: placeholder ?? t("search.placeholder"),
        className: "pl-9 pr-9 bg-card border-border focus-visible:ring-ring h-10",
        "data-ocid": "search-input",
        "aria-label": t("search.ariaLabel")
      }
    ),
    value && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick: handleClear,
        className: "absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors",
        "aria-label": t("search.clearAriaLabel"),
        "data-ocid": "search-clear",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" })
      }
    )
  ] });
}
function Sheet({ ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Root, { "data-slot": "sheet", ...props });
}
function SheetTrigger({
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Trigger, { "data-slot": "sheet-trigger", ...props });
}
function SheetPortal({
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Portal, { "data-slot": "sheet-portal", ...props });
}
function SheetOverlay({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Overlay,
    {
      "data-slot": "sheet-overlay",
      className: cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      ),
      ...props
    }
  );
}
function SheetContent({
  className,
  children,
  side = "right",
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetPortal, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SheetOverlay, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Content,
      {
        "data-slot": "sheet-content",
        className: cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === "right" && "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          side === "left" && "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          side === "top" && "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
          side === "bottom" && "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
          className
        ),
        ...props,
        children: [
          children,
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Close, { className: "ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Close" })
          ] })
        ]
      }
    )
  ] });
}
const PAGE_SIZE = 12;
const APPROVED_TOKENS = /* @__PURE__ */ new Set([
  "USDT_TRC20",
  "USDT_BEP20",
  "USDT_ERC20",
  "USDC_ERC20"
]);
const EMPTY_FILTERS = {
  categories: [],
  conditions: [],
  carriers: [],
  priceMin: "",
  priceMax: "",
  token: null
};
const TOKEN_COLORS = {
  USDT_TRC20: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border-emerald-500/30",
  USDT_BEP20: "bg-green-500/15 text-green-700 dark:text-green-200 border-green-500/30",
  USDT_ERC20: "bg-teal-500/15 text-teal-700 dark:text-teal-200 border-teal-500/30",
  USDC_ERC20: "bg-blue-500/15 text-blue-700 dark:text-blue-200 border-blue-500/30"
};
const TOKEN_DISPLAY = {
  USDT_TRC20: "USDT · TRC20",
  USDT_BEP20: "USDT · BEP20",
  USDT_ERC20: "USDT · ERC20",
  USDC_ERC20: "USDC · ERC20"
};
const TRUST_CLASSES = {
  [TrustLevel.new_]: "badge-tier-new",
  [TrustLevel.bronze]: "badge-tier-bronze",
  [TrustLevel.silver]: "badge-tier-silver",
  [TrustLevel.gold]: "badge-tier-gold"
};
function formatPrice(amount, _token) {
  const n = Number(amount);
  return `$${(n / 1e6).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function filtersToSearchParams(filters, sort, query) {
  const sp = new URLSearchParams();
  if (query) sp.set("q", query);
  if (sort !== "newest") sp.set("sort", sort);
  if (filters.categories.length > 0)
    sp.set("category", filters.categories.join(","));
  if (filters.conditions.length > 0)
    sp.set("condition", filters.conditions.join(","));
  if (filters.carriers.length > 0)
    sp.set("shipping", filters.carriers.join(","));
  if (filters.priceMin) sp.set("priceMin", filters.priceMin);
  if (filters.priceMax) sp.set("priceMax", filters.priceMax);
  if (filters.token !== null) sp.set("token", String(filters.token));
  return sp;
}
function searchParamsToFilters(sp) {
  const categoriesRaw = sp.get("category") ?? "";
  const conditionsRaw = sp.get("condition") ?? "";
  const shippingRaw = sp.get("shipping") ?? "";
  const allConditions = Object.values(ItemCondition);
  const categories = categoriesRaw ? categoriesRaw.split(",").filter(Boolean) : [];
  const conditions = conditionsRaw ? conditionsRaw.split(",").filter((v) => allConditions.includes(v)) : [];
  const carriers = shippingRaw ? shippingRaw.split(",").filter(Boolean) : [];
  const sortRaw = sp.get("sort") ?? "newest";
  const sort = sortRaw === "price-asc" || sortRaw === "price-desc" ? sortRaw : "newest";
  const tokenRaw = sp.get("token");
  const token = tokenRaw && APPROVED_TOKENS.has(tokenRaw) ? tokenRaw : null;
  return {
    filters: {
      categories,
      conditions,
      carriers,
      priceMin: sp.get("priceMin") ?? "",
      priceMax: sp.get("priceMax") ?? "",
      token
    },
    sort,
    query: sp.get("q") ?? ""
  };
}
function ListingCardItem({
  listing,
  onClick
}) {
  var _a, _b;
  const photo = listing.photos[0];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      className: "card-elevated flex flex-col overflow-hidden cursor-pointer group w-full text-left",
      onClick,
      onKeyDown: (e) => e.key === "Enter" && onClick(),
      "aria-label": listing.title,
      "data-ocid": "listing-card",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative aspect-[4/3] bg-muted overflow-hidden", children: [
          photo ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: photo,
              alt: listing.title,
              className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full flex items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PackageSearch, { className: "h-10 w-10 opacity-30" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: `absolute top-2 right-2 ${TRUST_CLASSES[listing.sellerTrustLevel]}`,
              children: listing.sellerTrustLevel
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 p-3 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-foreground line-clamp-2 leading-tight min-w-0", children: listing.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base font-bold text-accent", children: formatPrice(listing.priceAmount, listing.priceToken) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: `token-chip text-xs py-0.5 px-2 ${TOKEN_COLORS[listing.priceToken] ?? ""}`,
                children: TOKEN_DISPLAY[listing.priceToken] ?? String(listing.priceToken)
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3 w-3 shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate min-w-0", children: listing.location || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-auto pt-2 border-t border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { className: "h-5 w-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "text-[10px] bg-muted", children: ((_b = (_a = listing.sellerUsername) == null ? void 0 : _a[0]) == null ? void 0 : _b.toUpperCase()) ?? "?" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground truncate max-w-[80px]", children: listing.sellerUsername })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-0.5 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-3 w-3 fill-accent text-accent" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: Number(listing.sellerRating) / 10 })
            ] })
          ] })
        ] })
      ]
    }
  );
}
function ListingCardSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-elevated overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "aspect-[4/3] w-full" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-3/4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-1/2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-2/3" })
    ] })
  ] });
}
function sortListings(listings, sort) {
  return [...listings].sort((a, b) => {
    if (sort === "newest") return Number(b.createdAt - a.createdAt);
    if (sort === "price-asc") return Number(a.priceAmount - b.priceAmount);
    if (sort === "price-desc") return Number(b.priceAmount - a.priceAmount);
    return 0;
  });
}
function ActiveFilterChips({
  filters,
  onRemoveCategory,
  onRemoveCondition,
  onRemoveCarrier,
  onRemoveToken,
  onRemovePrice,
  onClearAll
}) {
  const { t } = useLocale();
  const chips = [];
  if (filters.categories[0]) {
    chips.push({
      key: "category",
      label: `${t("filter.category")}: ${filters.categories[0]}`,
      onRemove: onRemoveCategory,
      ocid: "chip-category"
    });
  }
  if (filters.conditions[0]) {
    chips.push({
      key: "condition",
      label: `${t("filter.condition")}: ${filters.conditions[0]}`,
      onRemove: onRemoveCondition,
      ocid: "chip-condition"
    });
  }
  if (filters.carriers[0]) {
    chips.push({
      key: "carrier",
      label: `${t("filter.shipping")}: ${filters.carriers[0]}`,
      onRemove: onRemoveCarrier,
      ocid: "chip-carrier"
    });
  }
  if (filters.token) {
    const tokenI18nKey = `filter.token.${filters.token}`;
    chips.push({
      key: "token",
      label: `${t("filter.token.title")}: ${t(tokenI18nKey)}`,
      onRemove: onRemoveToken,
      ocid: "chip-token"
    });
  }
  if (filters.priceMin || filters.priceMax) {
    const priceLabel = filters.priceMin && filters.priceMax ? `$${filters.priceMin} — $${filters.priceMax}` : filters.priceMin ? `≥ $${filters.priceMin}` : `≤ $${filters.priceMax}`;
    chips.push({
      key: "price",
      label: priceLabel,
      onRemove: onRemovePrice,
      ocid: "chip-price"
    });
  }
  if (chips.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "flex flex-wrap items-center gap-2",
      "data-ocid": "active-filter-chips",
      "aria-label": t("filter.activeFilters"),
      children: [
        chips.map(({ key, label, onRemove, ocid }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "span",
          {
            className: "inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/25 rounded-full px-3 py-1 text-xs font-medium",
            "data-ocid": ocid,
            children: [
              label,
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: onRemove,
                  className: "hover:text-foreground transition-colors rounded-full",
                  "aria-label": `Remove ${label}`,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
                }
              )
            ]
          },
          key
        )),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: onClearAll,
            className: "h-7 text-xs text-muted-foreground hover:text-foreground px-2",
            "data-ocid": "chip-clear-all",
            children: t("filter.chips.clearAll")
          }
        )
      ]
    }
  );
}
function ListingsPage() {
  const navigate = useNavigate();
  const { actor, isFetching } = useActor(createActor);
  const { t } = useLocale();
  const {
    filters: initialFilters,
    sort: initialSort,
    query: initialQuery
  } = searchParamsToFilters(new URLSearchParams(window.location.search));
  const [query, setQuery] = reactExports.useState(initialQuery);
  const [committedQuery, setCommittedQuery] = reactExports.useState(initialQuery);
  const [sort, setSort] = reactExports.useState(initialSort);
  const [filters, setFilters] = reactExports.useState(initialFilters);
  const [offset, setOffset] = reactExports.useState(0);
  const [allResults, setAllResults] = reactExports.useState([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = reactExports.useState(false);
  const syncToUrl = reactExports.useCallback(
    (nextFilters, nextSort, nextQuery) => {
      const sp = filtersToSearchParams(nextFilters, nextSort, nextQuery);
      const searchStr = sp.toString();
      void navigate({
        to: "/listings",
        search: searchStr ? `?${searchStr}` : "",
        replace: true
      });
    },
    [navigate]
  );
  const activeCount = reactExports.useMemo(
    () => filters.categories.length + filters.conditions.length + filters.carriers.length + (filters.priceMin ? 1 : 0) + (filters.priceMax ? 1 : 0) + (filters.token !== null ? 1 : 0),
    [filters]
  );
  const isPriceRangeInvalid = filters.priceMin !== "" && filters.priceMax !== "" && Number(filters.priceMin) > Number(filters.priceMax);
  const queryKey = [
    "listings",
    committedQuery,
    filters.categories[0] ?? null,
    filters.priceMin,
    filters.priceMax,
    filters.conditions[0] ?? null,
    filters.carriers[0] ?? null,
    filters.token,
    // token in queryKey for cache correctness
    offset
  ];
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!actor) return [];
      const results = await actor.searchListings(
        committedQuery || null,
        filters.categories.length === 1 ? filters.categories[0] : null,
        filters.priceMin ? BigInt(Math.floor(Number.parseFloat(filters.priceMin) * 1e6)) : null,
        filters.priceMax ? BigInt(Math.floor(Number.parseFloat(filters.priceMax) * 1e6)) : null,
        null,
        filters.conditions.length === 1 ? filters.conditions[0] : null,
        filters.carriers.length === 1 ? filters.carriers[0] : null,
        BigInt(offset),
        BigInt(PAGE_SIZE)
      );
      const filtered = filters.token !== null ? results.filter((l) => l.priceToken === filters.token) : results;
      if (offset === 0) {
        setAllResults(filtered);
      } else {
        setAllResults((prev) => [...prev, ...filtered]);
      }
      return filtered;
    },
    enabled: !!actor && !isFetching && !isPriceRangeInvalid
  });
  const sorted = reactExports.useMemo(
    () => sortListings(allResults, sort),
    [allResults, sort]
  );
  const hasMore = ((data == null ? void 0 : data.length) ?? 0) === PAGE_SIZE;
  const handleSearch = reactExports.useCallback(() => {
    setOffset(0);
    setAllResults([]);
    setCommittedQuery(query);
    syncToUrl(filters, sort, query);
  }, [query, filters, sort, syncToUrl]);
  const handleFilterChange = reactExports.useCallback(
    (next) => {
      setFilters(next);
      setOffset(0);
      setAllResults([]);
      syncToUrl(next, sort, committedQuery);
    },
    [sort, committedQuery, syncToUrl]
  );
  const handleSortChange = reactExports.useCallback(
    (next) => {
      setSort(next);
      syncToUrl(filters, next, committedQuery);
    },
    [filters, committedQuery, syncToUrl]
  );
  const handleReset = reactExports.useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setOffset(0);
    setAllResults([]);
    setCommittedQuery("");
    setQuery("");
    void navigate({ to: "/listings", replace: true });
  }, [navigate]);
  const handleLoadMore = () => setOffset((prev) => prev + PAGE_SIZE);
  const removeCategory = reactExports.useCallback(
    () => handleFilterChange({ ...filters, categories: [] }),
    [filters, handleFilterChange]
  );
  const removeCondition = reactExports.useCallback(
    () => handleFilterChange({ ...filters, conditions: [] }),
    [filters, handleFilterChange]
  );
  const removeCarrier = reactExports.useCallback(
    () => handleFilterChange({ ...filters, carriers: [] }),
    [filters, handleFilterChange]
  );
  const removeToken = reactExports.useCallback(
    () => handleFilterChange({ ...filters, token: null }),
    [filters, handleFilterChange]
  );
  const removePrice = reactExports.useCallback(
    () => handleFilterChange({ ...filters, priceMin: "", priceMax: "" }),
    [filters, handleFilterChange]
  );
  const filterPanel = /* @__PURE__ */ jsxRuntimeExports.jsx(
    FilterPanel,
    {
      filters,
      onChange: handleFilterChange,
      onReset: handleReset,
      activeCount
    }
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-card border-b border-border sticky top-0 z-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto px-4 py-3 flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        SearchBar,
        {
          value: query,
          onChange: setQuery,
          onSubmit: handleSearch
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Select,
        {
          value: sort,
          onValueChange: (v) => handleSortChange(v),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              SelectTrigger,
              {
                className: "w-36 h-10 bg-card border-border text-sm shrink-0",
                "data-ocid": "sort-select",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "newest", children: "Newest" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "price-asc", children: "Price: Low → High" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "price-desc", children: "Price: High → Low" })
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Sheet, { open: mobileFiltersOpen, onOpenChange: setMobileFiltersOpen, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            className: "lg:hidden h-10 gap-1.5 border-border",
            "data-ocid": "mobile-filter-trigger",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersHorizontal, { className: "h-4 w-4" }),
              activeCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "h-4 text-[10px] px-1", children: activeCount })
            ]
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SheetContent,
          {
            side: "left",
            className: "w-72 bg-card border-border p-4 overflow-y-auto",
            children: filterPanel
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-7xl mx-auto px-4 py-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden lg:block w-56 shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sticky top-[72px]", children: filterPanel }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            className: "text-sm text-muted-foreground",
            "data-ocid": "result-count",
            children: isLoading ? t("listings.searching") : `${sorted.length} ${sorted.length !== 1 ? t("listings.foundPlural") : t("listings.found")} ${t("listings.found.suffix")}`
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ActiveFilterChips,
          {
            filters,
            onRemoveCategory: removeCategory,
            onRemoveCondition: removeCondition,
            onRemoveCarrier: removeCarrier,
            onRemoveToken: removeToken,
            onRemovePrice: removePrice,
            onClearAll: handleReset
          }
        ),
        isLoading && offset === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4", children: ["a", "b", "c", "d", "e", "f"].map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(ListingCardSkeleton, {}, id)) }) : isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex flex-col items-center justify-center py-20 gap-3 text-center",
            "data-ocid": "listings-error",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(PackageSearch, { className: "h-12 w-12 text-muted-foreground opacity-40" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground font-medium", children: t("listings.loadFailed.short") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("listings.loadFailed.retry") })
            ]
          }
        ) : sorted.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex flex-col items-center justify-center py-20 gap-3 text-center",
            "data-ocid": "listings-empty",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(PackageSearch, { className: "h-12 w-12 text-muted-foreground opacity-40" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground font-medium", children: t("listings.noFound") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("listings.noFoundSub") }),
              activeCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: handleReset, children: t("listings.clearFilters") })
            ]
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4", children: sorted.map((listing) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          ListingCardItem,
          {
            listing,
            onClick: () => navigate({ to: `/listings/${listing.id}` })
          },
          String(listing.id)
        )) }),
        hasMore && !isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            onClick: handleLoadMore,
            disabled: isLoading,
            className: "gap-2 border-border",
            "data-ocid": "load-more",
            children: [
              t("listings.loadMore"),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" })
            ]
          }
        ) })
      ] })
    ] }) })
  ] });
}
export {
  ListingsPage as default
};
