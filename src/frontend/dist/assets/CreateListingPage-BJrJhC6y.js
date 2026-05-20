import { c as createLucideIcon, r as reactExports, F as useComposedRefs, j as jsxRuntimeExports, o as cn, b as useLocale, M as LoaderCircle, q as useInternetIdentity, f as useAuth, p as useActor, N as useUploadFile, s as useQueryClient, u as useNavigate, d as detectLocale, m as ItemCondition, K as TradeToken, l as useQuery, O as ListingCategory, t, v as ue, S as Skeleton, B as Button, Q as legacyToListingCategoryKey, R as RefreshCw, e as categoryLabel, C as getCategoryById, h as LogIn, x as createActor } from "./index-B5zdxtVX.js";
import { I as Input } from "./input-DHN02rGb.js";
import { L as Label } from "./label-BtVhwz-T.js";
import { u as useControllableState, P as Primitive, c as composeEventHandlers, b as createContextScope } from "./index-BNCFcFUZ.js";
import { u as usePrevious } from "./select-CLWV2fSS.js";
import { u as useSize } from "./index-DR2cXKlE.js";
import { T as Textarea } from "./textarea-CO2VWUtE.js";
import { C as CircleAlert } from "./circle-alert-CMrXmYvG.js";
import { X } from "./Combination-BdycxqGU.js";
import { C as ChevronDown } from "./chevron-up-Dv3EV01C.js";
import { C as CircleCheck } from "./circle-check-DpfL7oJ3.js";
import { A as ACTIVE_PHYSICAL_SHIPPING_CARRIER, S as ShippingProviderSelector, g as getPhysicalShippingMethods } from "./ShippingProviderSelector-CwGlKtLf.js";
import { C as CategoryPicker } from "./CategoryPicker-DXUDsMZG.js";
import { a as asMarketplaceActor, o as optNat } from "./marketplaceActor-CZKqJ5E6.js";
import { A as ArrowLeft } from "./arrow-left-Br_e3Wvc.js";
import { C as Copy } from "./copy-C7AyuFsT.js";
import { C as ChevronLeft } from "./chevron-left-CBxTSC68.js";
import { C as ChevronRight } from "./chevron-right-Cnbj-FPT.js";
import { U as Upload } from "./upload-CH54-AXy.js";
import { P as Package } from "./package-BoWRrszV.js";
import { C as Camera } from "./camera-DqcgR-Cb.js";
import { I as ImagePlus } from "./image-plus-DqxWNw7J.js";
import "./index-BrewpA67.js";
import "./index-G6S72QUb.js";
import "./index-B-Ax1TuK.js";
import "./check-Ckd98-EH.js";
import "./map-pin-DTZTie51.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  ["line", { x1: "12", x2: "12", y1: "2", y2: "22", key: "7eqyqh" }],
  ["path", { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", key: "1b0p4s" }]
];
const DollarSign = createLucideIcon("dollar-sign", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["circle", { cx: "9", cy: "12", r: "1", key: "1vctgf" }],
  ["circle", { cx: "9", cy: "5", r: "1", key: "hp0tcf" }],
  ["circle", { cx: "9", cy: "19", r: "1", key: "fkjjf6" }],
  ["circle", { cx: "15", cy: "12", r: "1", key: "1tmaij" }],
  ["circle", { cx: "15", cy: "5", r: "1", key: "19l28e" }],
  ["circle", { cx: "15", cy: "19", r: "1", key: "f4zoj3" }]
];
const GripVertical = createLucideIcon("grip-vertical", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2", key: "1w4ew1" }],
  ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4", key: "fwvmzm" }]
];
const Lock = createLucideIcon("lock", __iconNode);
var SWITCH_NAME = "Switch";
var [createSwitchContext] = createContextScope(SWITCH_NAME);
var [SwitchProvider, useSwitchContext] = createSwitchContext(SWITCH_NAME);
var Switch$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeSwitch,
      name,
      checked: checkedProp,
      defaultChecked,
      required,
      disabled,
      value = "on",
      onCheckedChange,
      form,
      ...switchProps
    } = props;
    const [button, setButton] = reactExports.useState(null);
    const composedRefs = useComposedRefs(forwardedRef, (node) => setButton(node));
    const hasConsumerStoppedPropagationRef = reactExports.useRef(false);
    const isFormControl = button ? form || !!button.closest("form") : true;
    const [checked, setChecked] = useControllableState({
      prop: checkedProp,
      defaultProp: defaultChecked ?? false,
      onChange: onCheckedChange,
      caller: SWITCH_NAME
    });
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(SwitchProvider, { scope: __scopeSwitch, checked, disabled, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Primitive.button,
        {
          type: "button",
          role: "switch",
          "aria-checked": checked,
          "aria-required": required,
          "data-state": getState(checked),
          "data-disabled": disabled ? "" : void 0,
          disabled,
          value,
          ...switchProps,
          ref: composedRefs,
          onClick: composeEventHandlers(props.onClick, (event) => {
            setChecked((prevChecked) => !prevChecked);
            if (isFormControl) {
              hasConsumerStoppedPropagationRef.current = event.isPropagationStopped();
              if (!hasConsumerStoppedPropagationRef.current) event.stopPropagation();
            }
          })
        }
      ),
      isFormControl && /* @__PURE__ */ jsxRuntimeExports.jsx(
        SwitchBubbleInput,
        {
          control: button,
          bubbles: !hasConsumerStoppedPropagationRef.current,
          name,
          value,
          checked,
          required,
          disabled,
          form,
          style: { transform: "translateX(-100%)" }
        }
      )
    ] });
  }
);
Switch$1.displayName = SWITCH_NAME;
var THUMB_NAME = "SwitchThumb";
var SwitchThumb = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeSwitch, ...thumbProps } = props;
    const context = useSwitchContext(THUMB_NAME, __scopeSwitch);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.span,
      {
        "data-state": getState(context.checked),
        "data-disabled": context.disabled ? "" : void 0,
        ...thumbProps,
        ref: forwardedRef
      }
    );
  }
);
SwitchThumb.displayName = THUMB_NAME;
var BUBBLE_INPUT_NAME = "SwitchBubbleInput";
var SwitchBubbleInput = reactExports.forwardRef(
  ({
    __scopeSwitch,
    control,
    checked,
    bubbles = true,
    ...props
  }, forwardedRef) => {
    const ref = reactExports.useRef(null);
    const composedRefs = useComposedRefs(ref, forwardedRef);
    const prevChecked = usePrevious(checked);
    const controlSize = useSize(control);
    reactExports.useEffect(() => {
      const input = ref.current;
      if (!input) return;
      const inputProto = window.HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(
        inputProto,
        "checked"
      );
      const setChecked = descriptor.set;
      if (prevChecked !== checked && setChecked) {
        const event = new Event("click", { bubbles });
        setChecked.call(input, checked);
        input.dispatchEvent(event);
      }
    }, [prevChecked, checked, bubbles]);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        type: "checkbox",
        "aria-hidden": true,
        defaultChecked: checked,
        ...props,
        tabIndex: -1,
        ref: composedRefs,
        style: {
          ...props.style,
          ...controlSize,
          position: "absolute",
          pointerEvents: "none",
          opacity: 0,
          margin: 0
        }
      }
    );
  }
);
SwitchBubbleInput.displayName = BUBBLE_INPUT_NAME;
function getState(checked) {
  return checked ? "checked" : "unchecked";
}
var Root = Switch$1;
var Thumb = SwitchThumb;
function Switch({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Root,
    {
      "data-slot": "switch",
      className: cn(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Thumb,
        {
          "data-slot": "switch-thumb",
          className: cn(
            "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
          )
        }
      )
    }
  );
}
function CascadingLocationPicker({
  value,
  onChange,
  disabled = false,
  hasError = false
}) {
  var _a;
  const { t: tl } = useLocale();
  const [regions, setRegions] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [fetchError, setFetchError] = reactExports.useState(false);
  const [selectedRegion, setSelectedRegion] = reactExports.useState(null);
  const [selectedCity, setSelectedCity] = reactExports.useState(null);
  const [isLegacy, setIsLegacy] = reactExports.useState(false);
  const initializedRef = reactExports.useRef(false);
  reactExports.useEffect(() => {
    fetch("/assets/ua_regions.json").then((r) => r.json()).then((data) => {
      setRegions(data.regions);
      setLoading(false);
    }).catch(() => {
      setFetchError(true);
      setLoading(false);
    });
  }, []);
  reactExports.useEffect(() => {
    if (loading || initializedRef.current || regions.length === 0) return;
    initializedRef.current = true;
    if (!value) return;
    const commaIdx = value.indexOf(",");
    if (commaIdx !== -1) {
      const city = value.slice(0, commaIdx).trim();
      const region = value.slice(commaIdx + 1).trim();
      const matchedRegion = regions.find((r) => r.name === region);
      if (matchedRegion == null ? void 0 : matchedRegion.cities.includes(city)) {
        setSelectedRegion(region);
        setSelectedCity(city);
        return;
      }
    }
    const exactRegion = regions.find((r) => r.name === value);
    if (exactRegion) {
      setSelectedRegion(value);
      return;
    }
    setIsLegacy(true);
  }, [regions, value, loading]);
  const filteredCities = selectedRegion ? ((_a = regions.find((r) => r.name === selectedRegion)) == null ? void 0 : _a.cities) ?? [] : [];
  function handleRegionChange(regionName) {
    setSelectedRegion(regionName);
    setSelectedCity(null);
    setIsLegacy(false);
    onChange(regionName);
  }
  function handleCityChange(cityName) {
    setSelectedCity(cityName);
    onChange(`${cityName}, ${selectedRegion}`);
  }
  function handleClear() {
    setSelectedRegion(null);
    setSelectedCity(null);
    setIsLegacy(false);
    onChange("");
  }
  function handleLegacyClear() {
    setIsLegacy(false);
    setSelectedRegion(null);
    setSelectedCity(null);
    onChange("");
  }
  const baseSelect = "w-full appearance-none bg-background border rounded-md px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
  const errorBorder = "border-destructive";
  const normalBorder = "border-input";
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-muted-foreground text-sm py-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        tl("location.selectOblast"),
        "…"
      ] })
    ] });
  }
  if (fetchError) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-destructive text-sm py-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-4 h-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: tl("location.failedToLoadRegions") })
    ] });
  }
  if (isLegacy) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs", children: tl("location.legacyPrefix") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-foreground truncate", children: value }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: handleLegacyClear,
          disabled,
          className: "text-muted-foreground hover:text-foreground transition-colors flex-shrink-0",
          "aria-label": tl("location.clearSelection"),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
        }
      )
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "select",
        {
          value: selectedRegion ?? "",
          onChange: (e) => handleRegionChange(e.target.value),
          disabled,
          className: [
            baseSelect,
            hasError && !selectedRegion ? errorBorder : normalBorder
          ].join(" "),
          "data-ocid": "location-region-select",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", disabled: true, children: tl("location.selectOblast") }),
            regions.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: r.name, children: r.name }, r.name))
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "select",
        {
          value: selectedCity ?? "",
          onChange: (e) => handleCityChange(e.target.value),
          disabled: disabled || !selectedRegion,
          className: [
            baseSelect,
            !selectedRegion ? "opacity-50 cursor-not-allowed" : "",
            hasError && selectedRegion && !selectedCity ? errorBorder : normalBorder
          ].join(" "),
          "data-ocid": "location-city-select",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", disabled: true, children: selectedRegion ? tl("location.selectCity") : tl("location.selectOblastFirst") }),
            filteredCities.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: c, children: c }, c))
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" })
    ] }),
    (selectedRegion || selectedCity) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: handleClear,
        disabled,
        className: "text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors",
        "data-ocid": "location-clear-button",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-3 h-3" }),
          tl("location.clearSelection")
        ]
      }
    )
  ] });
}
const USDT_NETWORKS = [
  { id: "USDT_TRC20", label: "TRC20", subLabel: "Tron" },
  { id: "USDT_BEP20", label: "BEP20", subLabel: "BSC (Binance Smart Chain)" },
  { id: "USDT_ERC20", label: "ERC20", subLabel: "Ethereum" }
];
const USDC_NETWORKS = [
  { id: "USDC_ERC20", label: "ERC20", subLabel: "Ethereum" }
];
function NetworkSelectionDialog({
  open,
  baseToken,
  currentNetwork,
  onSelect,
  onClose
}) {
  const { t: tl } = useLocale();
  const networks = baseToken === "USDT" ? USDT_NETWORKS : USDC_NETWORKS;
  reactExports.useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);
  if (!open) return null;
  const title = tl("network.selectTitle").replace("{token}", baseToken);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "fixed inset-0 z-50 flex items-center justify-center p-4",
      "data-ocid": "network-dialog",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute inset-0 bg-black/60 backdrop-blur-sm",
            onClick: onClose,
            onKeyDown: (e) => {
              if (e.key === "Enter" || e.key === " ") onClose();
            },
            role: "button",
            tabIndex: -1,
            "aria-label": "Close dialog"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "dialog",
          {
            open: true,
            className: "relative z-10 w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl overflow-hidden p-0 m-0",
            "aria-label": title,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-5 py-4 border-b border-border", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-semibold text-foreground", children: title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: onClose,
                    className: "text-muted-foreground hover:text-foreground transition-colors rounded-full p-1 hover:bg-muted",
                    "aria-label": "Close",
                    "data-ocid": "network-dialog-close",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-5 h-5" })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-2", children: networks.map((net) => {
                const isSelected = currentNetwork === net.id;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      onSelect(net.id);
                      onClose();
                    },
                    className: [
                      "w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors",
                      isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                    ].join(" "),
                    "data-ocid": `network-option-${net.id.toLowerCase()}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-sm", children: net.label }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "p",
                          {
                            className: [
                              "text-xs mt-0.5",
                              isSelected ? "text-primary/70" : "text-muted-foreground"
                            ].join(" "),
                            children: net.subLabel
                          }
                        )
                      ] }),
                      isSelected && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "w-5 h-5 text-primary flex-shrink-0" })
                    ]
                  },
                  net.id
                );
              }) })
            ]
          }
        )
      ]
    }
  );
}
const TOKENS = [
  {
    value: TradeToken.USDT_TRC20,
    label: "USDT",
    network: "TRC20",
    base: "USDT"
  },
  {
    value: TradeToken.USDT_BEP20,
    label: "USDT",
    network: "BEP20",
    base: "USDT"
  },
  {
    value: TradeToken.USDT_ERC20,
    label: "USDT",
    network: "ERC20",
    base: "USDT"
  },
  {
    value: TradeToken.USDC_ERC20,
    label: "USDC",
    network: "ERC20",
    base: "USDC"
  }
];
const STEP_ICONS = [Package, DollarSign, Camera];
const MAX_PHOTOS = 10;
function isPreviewDeployment() {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h.includes("preview") || h.includes("draft") || h === "localhost" || h === "127.0.0.1" || h.startsWith("192.168.") || h.endsWith(".localhost");
}
async function withRetry(fn, maxRetries = 3) {
  let lastErr;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 1e3 * 2 ** attempt));
      }
    }
  }
  throw lastErr;
}
async function processUploadQueue(items, uploadFn, maxConcurrent = 2) {
  const queue = [...items];
  const inFlight = /* @__PURE__ */ new Set();
  while (queue.length > 0 || inFlight.size > 0) {
    while (inFlight.size < maxConcurrent && queue.length > 0) {
      const item = queue.shift();
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
const MAX_DESC = 2e3;
const MAX_LOCATION = 100;
const MAX_PRICE_USD = 1e6;
const PHOTO_ACCEPT = "image/*,image/heic,image/heif,image/hevc";
function StepIndicator({ current }) {
  const { t: tl } = useLocale();
  const STEPS = [
    { label: tl("create.step.basic"), icon: STEP_ICONS[0] },
    { label: tl("create.step.pricing"), icon: STEP_ICONS[1] },
    { label: tl("create.step.photos"), icon: STEP_ICONS[2] }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "flex items-center justify-center gap-0 mb-8",
      "data-ocid": "step-indicator",
      children: STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isActive = idx === current;
        const isDone = idx < current;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: [
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-smooth",
                isActive ? "bg-accent text-accent-foreground shadow-md" : isDone ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              ].join(" "),
              children: [
                isDone ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "w-4 h-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-4 h-4" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: step.label }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sm:hidden", children: idx + 1 })
              ]
            }
          ),
          idx < STEPS.length - 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: [
                "h-0.5 w-6 sm:w-12 mx-1 transition-smooth",
                isDone ? "bg-primary" : "bg-border"
              ].join(" ")
            }
          )
        ] }, step.label);
      })
    }
  );
}
function AuthPrompt() {
  const { login, isLoggingIn } = useInternetIdentity();
  const locale = detectLocale();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-20 h-20 rounded-full bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LogIn, { className: "w-9 h-9 text-muted-foreground" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-semibold text-foreground mb-2", children: t(locale, "create.signInRequired") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground max-w-xs", children: t(locale, "create.signInDesc") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        size: "lg",
        className: "button-primary gap-2",
        onClick: login,
        disabled: isLoggingIn,
        "data-ocid": "auth-login-btn",
        children: [
          isLoggingIn ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(LogIn, { className: "w-4 h-4" }),
          t(locale, "create.connect")
        ]
      }
    )
  ] });
}
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
  onRetry
}) {
  const { t: tl } = useLocale();
  const locale = detectLocale();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      draggable: photo.uploadStatus === "done",
      onDragStart,
      onDragOver,
      onDrop,
      onDragEnd,
      className: [
        "relative group rounded-lg overflow-hidden border aspect-square transition-smooth",
        photo.uploadStatus === "done" ? "cursor-grab active:cursor-grabbing" : "cursor-default",
        isDragging ? "opacity-40 scale-95" : "opacity-100",
        isDragOver && !isDragging ? "border-accent ring-2 ring-accent/50" : "border-border",
        idx === 0 ? "ring-2 ring-accent/40" : ""
      ].join(" "),
      "data-ocid": `photo-thumb-${idx}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: photo.previewUrl,
            alt: `Listing item ${idx + 1}`,
            className: "w-full h-full object-cover"
          }
        ),
        photo.uploadStatus === "uploading" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-5 h-5 animate-spin text-accent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-medium text-foreground", children: [
            photo.uploadProgress,
            "%"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-3/4 h-1 bg-border rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "h-full bg-accent transition-all duration-300",
              style: { width: `${photo.uploadProgress}%` }
            }
          ) })
        ] }),
        photo.uploadStatus === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 bg-amber-500/20 flex flex-col items-center justify-center gap-1 p-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-5 h-5 text-amber-700 dark:text-amber-300" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-amber-800 dark:text-amber-200 text-center leading-tight font-medium", children: locale === "uk" ? "Очікує завантаження" : "Awaiting upload" })
        ] }),
        photo.uploadStatus === "error" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 bg-destructive/20 flex flex-col items-center justify-center gap-1 p-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-5 h-5 text-destructive" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-destructive text-center leading-tight", children: photo.uploadError ?? tl("create.photos.uploadFailedFallback") }),
          photo.file && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: (e) => {
                e.stopPropagation();
                onRetry();
              },
              className: "mt-0.5 text-[10px] font-semibold text-accent underline underline-offset-2",
              "data-ocid": `photo-retry-${idx}`,
              children: tl("create.photos.retryBtn")
            }
          )
        ] }),
        photo.uploadStatus === "done" && idx === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute bottom-1 left-1 text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded font-semibold", children: tl("create.photos.cover") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-smooth", children: /* @__PURE__ */ jsxRuntimeExports.jsx(GripVertical, { className: "w-4 h-4 text-foreground/80 drop-shadow" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: onRemove,
            className: "absolute top-1 right-1 w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth hover:bg-destructive hover:text-destructive-foreground",
            "aria-label": tl("create.photos.removeBtn"),
            "data-ocid": `photo-remove-${idx}`,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-3.5 h-3.5" })
          }
        )
      ]
    }
  );
}
function PhotoZone({
  photos,
  onAdd,
  onRemove,
  onReorder,
  onRetry,
  error
}) {
  const { t: tl } = useLocale();
  const inputRef = reactExports.useRef(null);
  const [isDraggingOver, setIsDraggingOver] = reactExports.useState(false);
  const [draggingIdx, setDraggingIdx] = reactExports.useState(null);
  const [dragOverIdx, setDragOverIdx] = reactExports.useState(null);
  const handleDrop = reactExports.useCallback(
    (e) => {
      e.preventDefault();
      setIsDraggingOver(false);
      if (e.dataTransfer.files.length) onAdd(e.dataTransfer.files);
    },
    [onAdd]
  );
  const handleThumbnailDrop = (e, toIdx) => {
    e.preventDefault();
    if (draggingIdx !== null && draggingIdx !== toIdx) {
      onReorder(draggingIdx, toIdx);
    }
    setDraggingIdx(null);
    setDragOverIdx(null);
  };
  const uploadingCount = photos.filter(
    (p) => p.uploadStatus === "uploading"
  ).length;
  const errorCount = photos.filter((p) => p.uploadStatus === "error").length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    photos.length < MAX_PHOTOS && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: [
          "w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-smooth",
          isDraggingOver ? "border-accent bg-accent/10" : error ? "border-destructive/50 bg-destructive/5" : "border-border bg-muted/20 hover:border-accent/50 hover:bg-accent/5"
        ].join(" "),
        onDragOver: (e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        },
        onDragLeave: () => setIsDraggingOver(false),
        onDrop: handleDrop,
        onClick: () => {
          var _a;
          return (_a = inputRef.current) == null ? void 0 : _a.click();
        },
        "data-ocid": "photo-dropzone",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: inputRef,
              type: "file",
              accept: PHOTO_ACCEPT,
              multiple: true,
              className: "hidden",
              onChange: (e) => {
                if (e.target.files) onAdd(e.target.files);
                e.target.value = "";
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ImagePlus, { className: "w-10 h-10 mx-auto mb-3 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium text-foreground", children: [
            tl("create.photos.dropzone"),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-accent", children: tl("create.photos.browse") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: tl("create.photos.hint").replace("{max}", String(MAX_PHOTOS)) })
        ]
      }
    ),
    uploadingCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center gap-2 text-sm text-muted-foreground",
        "data-ocid": "upload-status",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin text-accent" }),
          tl("create.photos.uploading").replace(
            "{count}",
            String(uploadingCount)
          )
        ]
      }
    ),
    errorCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "p",
      {
        className: "flex items-center gap-1.5 text-xs text-destructive",
        "data-ocid": "upload-errors",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-3.5 h-3.5" }),
          tl("create.photos.errors").replace("{count}", String(errorCount))
        ]
      }
    ),
    error && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 text-xs text-destructive", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-3.5 h-3.5" }),
      error
    ] }),
    photos.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "grid grid-cols-3 sm:grid-cols-5 gap-3",
        "data-ocid": "photo-grid",
        children: photos.map((photo, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          PhotoThumb,
          {
            photo,
            idx,
            isDragging: draggingIdx === idx,
            isDragOver: dragOverIdx === idx && draggingIdx !== idx,
            onDragStart: () => setDraggingIdx(idx),
            onDragOver: (e) => {
              e.preventDefault();
              setDragOverIdx(idx);
            },
            onDrop: (e) => handleThumbnailDrop(e, idx),
            onDragEnd: () => {
              setDraggingIdx(null);
              setDragOverIdx(null);
            },
            onRemove: () => onRemove(photo.id),
            onRetry: () => onRetry(photo.id)
          },
          photo.id
        ))
      }
    )
  ] });
}
function CreateListingPage() {
  var _a, _b, _c;
  const { identity, isInitializing } = useInternetIdentity();
  const { isAuthenticated, principal } = useAuth();
  const { actor, isFetching } = useActor(createActor);
  const { uploadFile } = useUploadFile(identity);
  const isAuthenticatedRef = reactExports.useRef(isAuthenticated);
  isAuthenticatedRef.current = isAuthenticated;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const locale = detectLocale();
  const { t: tl } = useLocale();
  const CONDITIONS = [
    {
      value: ItemCondition.new_,
      label: tl("condition.new"),
      desc: tl("condition.new.desc")
    },
    {
      value: ItemCondition.likeNew,
      label: tl("condition.likeNew"),
      desc: tl("condition.likeNew.desc")
    },
    {
      value: ItemCondition.good,
      label: tl("condition.good"),
      desc: tl("condition.good.desc")
    },
    {
      value: ItemCondition.fair,
      label: tl("condition.fair"),
      desc: tl("condition.fair.desc")
    },
    {
      value: ItemCondition.poor,
      label: tl("condition.poor"),
      desc: tl("condition.poor.desc")
    }
  ];
  const params = new URLSearchParams(window.location.search);
  const editId = params.get("edit");
  const isEditMode = Boolean(editId);
  const [step, setStep] = reactExports.useState(0);
  const [photos, setPhotos] = reactExports.useState([]);
  const [errors, setErrors] = reactExports.useState({});
  const [isSubmitting, setIsSubmitting] = reactExports.useState(false);
  const [submitError, setSubmitError] = reactExports.useState(null);
  const [liabilityBlocked, setLiabilityBlocked] = reactExports.useState(false);
  const [selectedCarrier, setSelectedCarrier] = reactExports.useState(ACTIVE_PHYSICAL_SHIPPING_CARRIER);
  const [networkDialogOpen, setNetworkDialogOpen] = reactExports.useState(false);
  const [pendingBaseToken, setPendingBaseToken] = reactExports.useState(
    "USDT"
  );
  const [showDiscardDialog, setShowDiscardDialog] = reactExports.useState(false);
  const [editLoadError, setEditLoadError] = reactExports.useState(null);
  const [form, setForm] = reactExports.useState({
    title: "",
    category: "",
    categoryId: null,
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
    meestSenderPudoRef: ""
  });
  const {
    data: existingListing,
    isLoading: isLoadingListing,
    isSuccess: isListingLoaded
  } = useQuery({
    queryKey: ["listing", editId],
    queryFn: async () => {
      if (!actor || !editId) return null;
      return actor.getListing(BigInt(editId));
    },
    enabled: !!actor && !isFetching && isEditMode
  });
  reactExports.useEffect(() => {
    if (isEditMode && isListingLoaded && existingListing === null) {
      setEditLoadError("loadError");
    }
  }, [isEditMode, isListingLoaded, existingListing]);
  reactExports.useEffect(() => {
    if (!actor || !principal || isFetching) return;
    actor.getSellerLiability(principal).then((result) => {
      if (result.__kind__ === "ok") {
        const balanceCents = Number(result.ok);
        setLiabilityBlocked(
          balanceCents < 0 && Math.abs(balanceCents) > 1e4
        );
      }
    }).catch(() => {
    });
  }, [actor, principal, isFetching]);
  reactExports.useEffect(() => {
    if (!existingListing) return;
    if (principal && existingListing.sellerPrincipal !== void 0 && existingListing.sellerPrincipal.toString() !== principal.toString()) {
      setEditLoadError("notOwner");
      return;
    }
    const pkg = existingListing.packageDetails;
    const npConfig = existingListing.novaPoshtaConfig;
    const ukConfig = existingListing.ukrposhtaConfig;
    const meestCfg = existingListing.meestConfig;
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
      priceAmount: existingListing.priceAmount.toString(),
      priceToken: existingListing.priceToken,
      location: existingListing.location,
      shippingWeightKg: "1",
      shippingFromCity: "",
      shippingToCity: "",
      packageWeight: pkg ? Number(pkg.weight ?? 0) / 1e3 : 0,
      packageLength: pkg ? Number(pkg.length ?? 0) : 0,
      packageWidth: pkg ? Number(pkg.width ?? 0) : 0,
      packageHeight: pkg ? Number(pkg.height ?? 0) : 0,
      packagePlaces: pkg ? Number(pkg.places ?? 1) : 1,
      novaPoshtaEnabled: (npConfig == null ? void 0 : npConfig.enabled) ?? false,
      novaPoshtaDeliveryTypes: (npConfig == null ? void 0 : npConfig.deliveryTypes) ?? ["branch"],
      novaPoshtaSenderBranchRef: (npConfig == null ? void 0 : npConfig.senderBranchRef) ?? "",
      ukrposhtaEnabled: (ukConfig == null ? void 0 : ukConfig.enabled) ?? false,
      ukrposhtaDeliveryTypes: (ukConfig == null ? void 0 : ukConfig.deliveryTypes) ?? ["branch_to_office"],
      ukrposhtaSenderOfficeRef: (ukConfig == null ? void 0 : ukConfig.senderOfficeRef) ?? "",
      meestEnabled: (meestCfg == null ? void 0 : meestCfg.enabled) ?? false,
      meestDeliveryTypes: (meestCfg == null ? void 0 : meestCfg.deliveryTypes) ?? ["pudo"],
      meestSenderPudoRef: (meestCfg == null ? void 0 : meestCfg.senderPudoRef) ?? ""
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
          uploadError: null
        }))
      );
    }
  }, [existingListing, principal]);
  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: void 0 }));
  };
  const mapUploadError = reactExports.useCallback(
    (rawMsg) => {
      if (rawMsg.includes("403 Forbidden: Invalid payload") || rawMsg.includes("Invalid payload")) {
        return t(locale, "upload.error403Auth");
      }
      if (rawMsg.includes("403") || rawMsg.includes("403 Forbidden")) {
        return t(locale, "upload.error403Auth");
      }
      if (rawMsg.includes("CANISTER_ID_BACKEND") || rawMsg.includes("not set") && rawMsg.toLowerCase().includes("canister")) {
        return t(locale, "upload.errorCanisterId");
      }
      if (rawMsg.includes("preview") || rawMsg.includes("draft")) {
        return t(locale, "upload.errorPreviewDeployment");
      }
      if (rawMsg.includes("NetworkError") || rawMsg.includes("Failed to fetch") || rawMsg.includes("network")) {
        return t(locale, "upload.errorNetwork");
      }
      if (rawMsg.toLowerCase().includes("budget") || rawMsg.toLowerCase().includes("payment") || rawMsg.includes("402") || rawMsg.toLowerCase().includes("insufficient")) {
        return t(locale, "upload.errorBudget");
      }
      if (rawMsg.includes("CANISTER_ID_BACKEND не налаштовано") || rawMsg.includes("Анонімна ідентифікація") || rawMsg.includes("Internet Identity") || rawMsg.includes("Потрібна авторизація")) {
        return tl("create.signInRequired");
      }
      return t(locale, "upload.errorFailed");
    },
    [locale, tl]
  );
  const addPhotos = reactExports.useCallback(
    (files) => {
      if (!isAuthenticatedRef.current) {
        ue.error(tl("create.signInRequired"), {
          description: tl("create.signInDesc")
        });
        return;
      }
      const ALLOWED_EXTENSIONS = /\.(avif|gif|heic|heif|jpeg|jpg|png|webp)$/i;
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      const invalidType = Array.from(files).find(
        (f) => !f.type.startsWith("image/") && !ALLOWED_EXTENSIONS.test(f.name)
      );
      if (invalidType) {
        setErrors((e) => ({
          ...e,
          photos: tl("create.validation.photoType") || "Unsupported file type. Use JPG, PNG, WEBP, HEIC, or GIF."
        }));
        return;
      }
      const oversized = Array.from(files).find((f) => f.size > MAX_FILE_SIZE);
      if (oversized) {
        setErrors((e) => ({
          ...e,
          photos: tl("create.validation.photoSize") || "File too large. Maximum size is 10 MB."
        }));
        return;
      }
      const allowed = MAX_PHOTOS - photos.length;
      const toAdd = Array.from(files).slice(0, allowed);
      if (toAdd.length === 0) {
        setErrors((e) => ({
          ...e,
          photos: t(locale, "validation.photos.max")
        }));
        return;
      }
      const newItems = toAdd.map((f) => ({
        id: `${Date.now()}-${Math.random()}`,
        previewUrl: URL.createObjectURL(f),
        file: f,
        persistentUrl: null,
        uploadStatus: "uploading",
        uploadProgress: 0,
        uploadError: null
      }));
      setPhotos((prev) => [...prev, ...newItems]);
      if (errors.photos) setErrors((e) => ({ ...e, photos: void 0 }));
      processUploadQueue(
        newItems.map((item) => ({ id: item.id, file: item.file })),
        async ({ id, file }) => {
          const onProgress = (pct) => {
            setPhotos(
              (prev) => prev.map(
                (p) => p.id === id ? { ...p, uploadProgress: Math.round(pct) } : p
              )
            );
          };
          try {
            const url = await withRetry(() => uploadFile(file, onProgress));
            setPhotos(
              (prev) => prev.map(
                (p) => p.id === id ? {
                  ...p,
                  persistentUrl: url,
                  uploadStatus: "done",
                  uploadProgress: 100
                } : p
              )
            );
          } catch (err) {
            const rawMsg = err instanceof Error ? err.message : String(err);
            console.error(
              "[CreateListing] uploadFile failed — raw error:",
              err
            );
            const userMsg = mapUploadError(rawMsg);
            ue.error(tl("create.error.uploadFailed"), {
              description: userMsg
            });
            setPhotos(
              (prev) => prev.map(
                (p) => p.id === id ? {
                  ...p,
                  uploadStatus: "error",
                  uploadError: userMsg
                } : p
              )
            );
          }
        }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [photos.length, uploadFile, tl, errors.photos, locale, mapUploadError]
  );
  const removePhoto = (id) => {
    setPhotos((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found && !found.id.startsWith("existing-") && found.previewUrl) {
        URL.revokeObjectURL(found.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  };
  const reorderPhotos = (from, to) => {
    setPhotos((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };
  const retryPhoto = reactExports.useCallback(
    (id) => {
      const photo = photos.find((p) => p.id === id);
      if (!(photo == null ? void 0 : photo.file)) return;
      if (!isAuthenticatedRef.current) {
        ue.error(tl("create.signInRequired"));
        return;
      }
      setPhotos(
        (prev) => prev.map(
          (p) => p.id === id ? {
            ...p,
            uploadStatus: "uploading",
            uploadProgress: 0,
            uploadError: null,
            persistentUrl: null
          } : p
        )
      );
      const onProgress = (pct) => {
        setPhotos(
          (prev) => prev.map(
            (p) => p.id === id ? { ...p, uploadProgress: Math.round(pct) } : p
          )
        );
      };
      withRetry(() => uploadFile(photo.file, onProgress)).then((url) => {
        setPhotos(
          (prev) => prev.map(
            (p) => p.id === id ? {
              ...p,
              persistentUrl: url,
              uploadStatus: "done",
              uploadProgress: 100
            } : p
          )
        );
      }).catch((err) => {
        const rawMsg = err instanceof Error ? err.message : String(err);
        console.error("[CreateListing] retry uploadFile failed:", err);
        const userMsg = mapUploadError(rawMsg);
        ue.error(tl("create.error.uploadFailed"), {
          description: userMsg
        });
        setPhotos(
          (prev) => prev.map(
            (p) => p.id === id ? {
              ...p,
              uploadStatus: "error",
              uploadError: userMsg
            } : p
          )
        );
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [photos, uploadFile, tl, mapUploadError]
  );
  const validateStep = (s) => {
    const errs = {};
    if (s === 0) {
      if (!form.title.trim()) errs.title = tl("create.validation.title");
      else if (form.title.trim().length < MIN_TITLE)
        errs.title = t(locale, "validation.title.min");
      else if (form.title.length > MAX_TITLE)
        errs.title = t(locale, "validation.title.max");
      if (form.categoryId == null) errs.category = tl("create.validation.category");
      if (!form.condition) errs.condition = tl("create.validation.condition");
      if (!form.description.trim())
        errs.description = tl("create.validation.description");
      else if (form.description.length > MAX_DESC)
        errs.description = t(locale, "validation.description.max");
      if (form.isDigital && !form.digitalFileUrl.trim())
        errs.digitalFileUrl = tl("create.validation.digitalUrl");
      if (form.packageWeight > 0) {
        if (form.packageWeight > 30)
          errs.packageWeight = tl("listing.validation.weightMax");
        const maxDim = Math.max(
          form.packageLength,
          form.packageWidth,
          form.packageHeight
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
      if (!form.isDigital && selectedCarrier !== ACTIVE_PHYSICAL_SHIPPING_CARRIER)
        errs.carrier = tl("create.validation.carrier");
    }
    if (s === 2) {
      const uploadingPhotos = photos.filter(
        (p) => p.uploadStatus === "uploading"
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
    return Object.keys(errs).length === 0;
  };
  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setTimeout(() => {
        const firstError = document.querySelector(
          '[data-error="true"], .text-destructive[class*="text-xs"]'
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
  const handleCarrierSelect = (carrier, _option) => {
    setSelectedCarrier(carrier);
    if (errors.carrier) setErrors((e) => ({ ...e, carrier: void 0 }));
  };
  const handleSubmit = async () => {
    console.log("[CreateListing] handleSubmit called", {
      step,
      photoCount: photos.length,
      actorReady: !!actor,
      isFetching
    });
    setSubmitError(null);
    if (!actor) {
      const msg = locale === "uk" ? "Немає з'єднання — будь ласка, оновіть сторінку." : "Not connected — please refresh the page.";
      setSubmitError(msg);
      ue.error(msg);
      return;
    }
    if (isFetching) {
      const msg = tl("create.connectingWait");
      setSubmitError(tl("create.notConnected"));
      ue.error(tl("create.notConnected"), { description: msg });
      return;
    }
    const step0Valid = validateStep(0);
    if (!step0Valid) {
      setStep(0);
      const msg = locale === "uk" ? "Заповніть обов'язкові поля на першому кроці." : "Please complete all required fields in step 1.";
      setSubmitError(msg);
      ue.error(msg);
      return;
    }
    const step1Valid = validateStep(1);
    if (!step1Valid) {
      setStep(1);
      const msg = locale === "uk" ? "Заповніть обов'язкові поля: ціна та місцезнаходження." : "Please complete step 2: price and location.";
      setSubmitError(msg);
      ue.error(msg);
      return;
    }
    if (!validateStep(2)) {
      const uploadingCount = photos.filter(
        (p) => p.uploadStatus === "uploading"
      ).length;
      const errorCount = photos.filter(
        (p) => p.uploadStatus === "error"
      ).length;
      const doneCount = photos.filter((p) => p.uploadStatus === "done").length;
      let msg;
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
      ue.error(msg);
      console.log("[CreateListing] validateStep(2) failed", {
        uploadingCount,
        errorCount,
        doneCount
      });
      return;
    }
    const pendingPhotos = photos.filter(
      (p) => p.uploadStatus === "uploading" || p.uploadStatus === "pending"
    );
    const failedPhotos = photos.filter(
      (p) => p.uploadStatus === "error" || p.persistentUrl === null
    );
    if (pendingPhotos.length > 0) {
      const msg = tl("create.photos.waitForUpload");
      setSubmitError(msg);
      ue.error(msg);
      return;
    }
    if (failedPhotos.length > 0) {
      const msg = tl("create.photos.fixFailedUploads");
      setSubmitError(msg);
      ue.error(msg);
      return;
    }
    setIsSubmitting(true);
    try {
      const photoUrls = photos.filter((p) => p.uploadStatus === "done" && p.persistentUrl !== null).map((p) => p.persistentUrl);
      console.log("[CreateListing] photoUrls collected:", photoUrls);
      if (photoUrls.length === 0) {
        const diagnostic = photos.map(
          (p, i) => `[${i}] status=${p.uploadStatus} url=${p.persistentUrl ?? "null"}`
        ).join("; ");
        const msg = `${tl("create.photoUrlsMissing")} — діагностика: ${diagnostic}`;
        console.error(
          "[CreateListing] photoUrls empty despite done status:",
          diagnostic
        );
        setSubmitError(msg);
        ue.error(tl("create.photoUrlsMissing"), {
          description: diagnostic,
          duration: 1e4
        });
        setIsSubmitting(false);
        return;
      }
      const shippingMethodsPayload = form.isDigital ? [] : getPhysicalShippingMethods();
      const priceAmt = BigInt(
        Math.round(Number.parseFloat(form.priceAmount) * 100)
      );
      const packageDetailsPayload = null;
      const novaPoshtaConfigPayload = null;
      const ukrposhtaConfigPayload = null;
      const meestConfigPayload = null;
      const isErr = (r) => {
        const x = r;
        return x.__kind__ === "err" || x.__kind__ === void 0 && "err" in x;
      };
      if (isEditMode && editId) {
        console.log("[CreateListing] calling actor.updateListing");
        const mp = asMarketplaceActor(actor);
        const res = await mp.updateListing(
          BigInt(editId),
          form.title.trim(),
          form.description.trim(),
          form.category,
          optNat(form.categoryId),
          priceAmt,
          form.priceToken,
          form.condition,
          photoUrls,
          form.location.trim(),
          shippingMethodsPayload,
          form.isDigital && form.digitalFileUrl ? form.digitalFileUrl : null,
          form.isDigital && form.digitalFileHash.trim() ? form.digitalFileHash.trim() : null,
          form.isDigital && form.digitalPasswordEnabled && form.digitalPassword.trim() ? form.digitalPassword.trim() : null,
          packageDetailsPayload,
          novaPoshtaConfigPayload,
          ukrposhtaConfigPayload,
          meestConfigPayload
        );
        console.log("[CreateListing] updateListing response:", res);
        if (isErr(res)) {
          console.error("[CreateListing] updateListing error:", res);
          const errVariant = res.err;
          let errDesc = JSON.stringify(errVariant);
          let isNoProfile = false;
          let isUnauthorizedUpdate = false;
          if (typeof errVariant === "object" && errVariant !== null) {
            const kind = errVariant.__kind__;
            if (kind === "not_found") {
              errDesc = tl("create.error.noProfile");
              isNoProfile = true;
            } else if (kind === "unauthorized") {
              errDesc = tl("errors.anonymousNotAllowed");
              isUnauthorizedUpdate = true;
            } else if (kind === "invalid_input") {
              errDesc = String(
                errVariant.invalid_input ?? errDesc
              );
            }
          }
          setSubmitError(errDesc);
          ue.error(t(locale, "create.updateFailed"), {
            description: errDesc,
            duration: 8e3
          });
          if (isNoProfile) {
            setTimeout(() => navigate({ to: "/onboarding" }), 1500);
          } else if (isUnauthorizedUpdate) {
            setTimeout(() => navigate({ to: "/" }), 1500);
          }
        } else {
          setSubmitError(null);
          ue.success(tl("create.updated"));
          await queryClient.invalidateQueries({
            queryKey: ["listing", editId]
          });
          await queryClient.invalidateQueries({ queryKey: ["listings"] });
          await queryClient.invalidateQueries({ queryKey: ["myListings"] });
          navigate({ to: "/listings/$id", params: { id: editId } });
        }
      } else {
        console.log("[CreateListing] calling actor.createListing");
        const mp = asMarketplaceActor(actor);
        const res = await mp.createListing(
          form.title.trim(),
          form.description.trim(),
          form.category,
          optNat(form.categoryId),
          priceAmt,
          form.priceToken,
          form.condition,
          photoUrls,
          form.location.trim(),
          shippingMethodsPayload,
          form.isDigital,
          form.isDigital && form.digitalFileUrl ? form.digitalFileUrl : null,
          form.isDigital && form.digitalFileHash.trim() ? form.digitalFileHash.trim() : null,
          form.isDigital && form.digitalPasswordEnabled && form.digitalPassword.trim() ? form.digitalPassword.trim() : null,
          packageDetailsPayload,
          novaPoshtaConfigPayload,
          ukrposhtaConfigPayload,
          meestConfigPayload
        );
        console.log("[CreateListing] createListing response:", res);
        if (isErr(res)) {
          console.error("[CreateListing] createListing error:", res);
          const errVariant = res.err;
          let errDesc = JSON.stringify(errVariant);
          let isNoProfile = false;
          let isUnauthorized = false;
          if (typeof errVariant === "object" && errVariant !== null) {
            const kind = errVariant.__kind__;
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
            } else if (kind === "invalid_input") {
              errDesc = String(
                errVariant.invalid_input ?? errDesc
              );
            }
          }
          setSubmitError(errDesc);
          ue.error(t(locale, "create.submitFailed"), {
            description: errDesc,
            duration: 8e3
          });
          if (isNoProfile) {
            console.log(
              "[CreateListing] no profile found — redirecting to /onboarding"
            );
            setTimeout(() => navigate({ to: "/onboarding" }), 1500);
          } else if (isUnauthorized) {
            setTimeout(() => navigate({ to: "/" }), 1500);
          }
        } else {
          const okRes = res;
          console.log(
            "[CreateListing] createListing success, id:",
            okRes.ok.id
          );
          setSubmitError(null);
          ue.success(tl("create.published"));
          await queryClient.invalidateQueries({ queryKey: ["myListings"] });
          const newId = okRes.ok.id.toString();
          navigate({ to: "/listings/$id", params: { id: newId } });
        }
      }
    } catch (e) {
      console.error("[CreateListing] Unexpected error:", e);
      const errMsg = String(e);
      setSubmitError(errMsg);
      ue.error(tl("create.error.generic"), {
        description: errMsg,
        duration: 8e3
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
      const isErr = (r) => r.__kind__ === "err" || r.__kind__ === void 0 && "err" in r;
      if (isErr(res)) {
        ue.error(tl("create.deactivateFailed"));
      } else {
        ue.success(tl("create.deactivated"));
        await queryClient.invalidateQueries({ queryKey: ["myListings"] });
        navigate({ to: "/listings" });
      }
    } catch (e) {
      console.error("[CreateListing] deactivateListing error:", e);
      ue.error(String(e));
    } finally {
      setIsSubmitting(false);
    }
  };
  const hasUploadingPhotos = photos.some((p) => p.uploadStatus === "uploading");
  if (isInitializing) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-xl mx-auto px-4 py-12 space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-48 mx-auto" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-12 w-full" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-48 w-full" })
    ] });
  }
  if (!identity || identity.getPrincipal().isAnonymous()) return /* @__PURE__ */ jsxRuntimeExports.jsx(AuthPrompt, {});
  if (isEditMode && isLoadingListing) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-xl mx-auto px-4 py-12 space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-48 mx-auto" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-12 w-full" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-48 w-full" })
    ] });
  }
  if (isEditMode && editLoadError !== null) {
    const errorMsg = editLoadError === "notOwner" ? t(locale, "create.editMode.notOwnerError") : t(locale, "create.editMode.loadError");
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background flex items-center justify-center px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md w-full rounded-2xl border border-border bg-card shadow-sm p-8 text-center space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-7 h-7 text-destructive" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-display font-bold text-foreground mb-2", children: errorMsg }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "outline",
          className: "gap-2",
          onClick: () => navigate({ to: "/listings" }),
          "data-ocid": "edit-error-back-btn",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4" }),
            t(locale, "create.editMode.backToListing")
          ]
        }
      )
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto px-4 py-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "h1",
          {
            className: "text-2xl font-display font-bold text-foreground",
            "data-ocid": "page-title",
            children: isEditMode ? t(locale, "create.editMode.heading") : t(locale, "create.title")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: isEditMode ? t(locale, "create.subtitleEdit") : t(locale, "create.subtitle") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StepIndicator, { current: step }),
      liabilityBlocked && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "mb-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4",
          "data-ocid": "liability-blocked-banner",
          role: "alert",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-5 h-5 text-destructive mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-destructive leading-snug", children: tl("liability.create.blocked") })
          ]
        }
      ),
      !actor && !isFetching && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "mb-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4",
          "data-ocid": "no-actor-banner",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-5 h-5 text-destructive mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground", children: tl("create.notConnected") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: locale === "uk" ? "Оновіть сторінку щоб відновити з'єднання." : "Refresh the page to reconnect." })
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 sm:p-8", children: [
          step === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", "data-ocid": "step-basic-info", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "title", className: "text-label", children: tl("create.field.title") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "span",
                  {
                    className: `text-xs tabular-nums ${form.title.length > MAX_TITLE * 0.9 ? "text-destructive" : "text-muted-foreground"}`,
                    children: [
                      form.title.length,
                      "/",
                      MAX_TITLE
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "title",
                  value: form.title,
                  onChange: (e) => set("title", e.target.value),
                  maxLength: MAX_TITLE,
                  placeholder: tl("create.placeholder.title"),
                  className: errors.title ? "border-destructive" : "",
                  "data-ocid": "input-title"
                }
              ),
              errors.title && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-destructive flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-3.5 h-3.5" }),
                errors.title
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", "data-ocid": "select-category", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-label", children: tl("create.field.category") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                CategoryPicker,
                {
                  valueId: form.categoryId,
                  allowAny: false,
                  onChange: (id, node) => {
                    setForm((f) => ({
                      ...f,
                      categoryId: id,
                      category: node ? legacyToListingCategoryKey(node.legacy) : "",
                      isDigital: (node == null ? void 0 : node.slug.includes("tsifrovye")) ?? f.isDigital
                    }));
                  }
                }
              ),
              errors.category && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-destructive flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-3.5 h-3.5" }),
                errors.category
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-label", children: tl("create.field.condition") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2", children: CONDITIONS.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => set("condition", c.value),
                  className: [
                    "text-left px-4 py-3 rounded-lg border transition-smooth",
                    form.condition === c.value ? "border-accent bg-accent/10 ring-1 ring-accent" : "border-border bg-background hover:border-accent/40 hover:bg-muted/30"
                  ].join(" "),
                  "data-ocid": `condition-${c.value}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground", children: c.label }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: c.desc })
                  ]
                },
                c.value
              )) }),
              errors.condition && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-destructive flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-3.5 h-3.5" }),
                errors.condition
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "description", className: "text-label", children: tl("create.field.description") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "span",
                  {
                    className: `text-xs tabular-nums ${form.description.length > MAX_DESC * 0.9 ? "text-destructive" : "text-muted-foreground"}`,
                    children: [
                      form.description.length,
                      "/",
                      MAX_DESC
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Textarea,
                {
                  id: "description",
                  value: form.description,
                  onChange: (e) => set("description", e.target.value),
                  maxLength: MAX_DESC,
                  placeholder: tl("create.placeholder.description"),
                  rows: 5,
                  className: errors.description ? "border-destructive resize-none" : "resize-none",
                  "data-ocid": "input-description"
                }
              ),
              errors.description && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-destructive flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-3.5 h-3.5" }),
                errors.description
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground", children: tl("create.field.digitalItem") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: tl("create.field.digitalItemDesc") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Switch,
                {
                  checked: form.isDigital,
                  onCheckedChange: (v) => {
                    set("isDigital", v);
                    if (v === true) {
                      setSelectedCarrier(null);
                      if (errors.carrier)
                        setErrors((e) => ({ ...e, carrier: void 0 }));
                    } else {
                      setSelectedCarrier(ACTIVE_PHYSICAL_SHIPPING_CARRIER);
                    }
                  },
                  "data-ocid": "toggle-digital"
                }
              )
            ] }),
            form.isDigital && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "digitalFileUrl", className: "text-label", children: tl("create.field.digitalUrl") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "digitalFileUrl",
                    value: form.digitalFileUrl,
                    onChange: (e) => set("digitalFileUrl", e.target.value),
                    placeholder: "https://...",
                    className: errors.digitalFileUrl ? "border-destructive" : "",
                    "data-ocid": "input-digital-url"
                  }
                ),
                errors.digitalFileUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-destructive flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-3.5 h-3.5" }),
                  errors.digitalFileUrl
                ] }),
                form.digitalFileUrl.trim() && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "p",
                  {
                    className: "flex items-center gap-1.5 text-xs text-primary/80 mt-0.5",
                    "data-ocid": "digital-encryption-notice",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "w-3 h-3 shrink-0" }),
                      tl("digital.encryptionNotice")
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "digitalFileHash", className: "text-label", children: tl("digital.field.fileHash") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "digitalFileHash",
                    value: form.digitalFileHash,
                    onChange: (e) => set("digitalFileHash", e.target.value),
                    placeholder: tl("digital.field.fileHashPlaceholder"),
                    className: "font-mono text-sm",
                    "data-ocid": "input-digital-hash"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "w-4 h-4 text-muted-foreground" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: tl("digital.field.passwordProtection") })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: form.digitalPasswordEnabled,
                      onChange: (e) => set("digitalPasswordEnabled", e.target.checked),
                      className: "w-4 h-4 accent-primary cursor-pointer",
                      "data-ocid": "checkbox-digital-password"
                    }
                  )
                ] }),
                form.digitalPasswordEnabled && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: "digitalPassword",
                      value: form.digitalPassword,
                      onChange: (e) => set("digitalPassword", e.target.value),
                      placeholder: tl("digital.field.password"),
                      className: "font-mono text-sm",
                      "data-ocid": "input-digital-password"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      type: "button",
                      variant: "outline",
                      size: "sm",
                      className: "shrink-0 gap-1.5",
                      onClick: () => {
                        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
                        const pwd = Array.from(
                          { length: 16 },
                          () => chars[Math.floor(Math.random() * chars.length)]
                        ).join("");
                        set("digitalPassword", pwd);
                      },
                      "data-ocid": "btn-generate-password",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-3.5 h-3.5" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      type: "button",
                      variant: "ghost",
                      size: "sm",
                      className: "shrink-0",
                      onClick: () => {
                        if (form.digitalPassword) {
                          navigator.clipboard.writeText(
                            form.digitalPassword
                          );
                        }
                      },
                      disabled: !form.digitalPassword,
                      "aria-label": tl("digital.delivery.copyPassword"),
                      "data-ocid": "btn-copy-password",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-3.5 h-3.5" })
                    }
                  )
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground",
                "data-ocid": "delivery-integrations-locked",
                children: tl("shipping.pickupOnly.lockedNotice")
              }
            )
          ] }),
          step === 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", "data-ocid": "step-pricing-shipping", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-label", children: tl("create.field.price") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      type: "number",
                      min: "0",
                      step: "0.01",
                      value: form.priceAmount,
                      onChange: (e) => set("priceAmount", e.target.value),
                      placeholder: "0.00",
                      className: errors.priceAmount ? "border-destructive" : "",
                      "data-ocid": "input-price"
                    }
                  ),
                  errors.priceAmount && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-destructive flex items-center gap-1 mt-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-3.5 h-3.5" }),
                    errors.priceAmount
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5 min-w-[120px]", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1.5", children: ["USDT", "USDC"].map((base) => {
                    const isActive = form.priceToken.startsWith(base);
                    return /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => {
                          setPendingBaseToken(base);
                          setNetworkDialogOpen(true);
                        },
                        disabled: isSubmitting,
                        className: [
                          "flex-1 px-3 py-2 rounded-md text-sm font-semibold border transition-colors",
                          isActive ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-input hover:border-primary/60 hover:text-foreground"
                        ].join(" "),
                        "data-ocid": `token-base-${base.toLowerCase()}`,
                        children: base
                      },
                      base
                    );
                  }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => {
                        setPendingBaseToken(
                          form.priceToken.startsWith("USDT") ? "USDT" : "USDC"
                        );
                        setNetworkDialogOpen(true);
                      },
                      disabled: isSubmitting,
                      className: "text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors px-1",
                      "data-ocid": "token-change-network",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: ((_a = TOKENS.find((t2) => t2.value === form.priceToken)) == null ? void 0 : _a.network) ?? "TRC20" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "opacity-60", children: "↗" })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  NetworkSelectionDialog,
                  {
                    open: networkDialogOpen,
                    baseToken: pendingBaseToken,
                    currentNetwork: form.priceToken,
                    onSelect: (tokenId) => set("priceToken", tokenId),
                    onClose: () => setNetworkDialogOpen(false)
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "location", className: "text-label", children: tl("create.field.location") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                CascadingLocationPicker,
                {
                  value: form.location,
                  onChange: (v) => set("location", v),
                  disabled: isSubmitting,
                  hasError: !!errors.location
                }
              ),
              errors.location && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-destructive flex items-center gap-1 mt-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-3.5 h-3.5" }),
                errors.location
              ] })
            ] }),
            !form.isDigital && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-label", children: tl("create.field.carrier") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: [
                    "rounded-xl border bg-muted/10 p-4",
                    errors.carrier ? "border-destructive ring-1 ring-destructive/30" : "border-border"
                  ].join(" "),
                  "data-error": errors.carrier ? "true" : void 0,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    ShippingProviderSelector,
                    {
                      selectedCarrier,
                      onSelect: handleCarrierSelect,
                      showInputForm: true,
                      locale
                    }
                  )
                }
              ),
              errors.carrier && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-destructive flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-3.5 h-3.5" }),
                errors.carrier
              ] })
            ] })
          ] }),
          step === 2 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", "data-ocid": "step-photos", children: [
            isPreviewDeployment() && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4",
                "data-ocid": "preview-upload-banner",
                role: "alert",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-5 h-5 text-amber-700 dark:text-amber-300 mt-0.5 shrink-0" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-amber-800 dark:text-amber-200 leading-snug", children: t(locale, "upload.previewBanner") })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-label mb-1", children: tl("create.photos.upload") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mb-4", children: tl("create.photos.uploadDesc") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                PhotoZone,
                {
                  photos,
                  onAdd: isPreviewDeployment() ? () => {
                    ue.error(
                      t(locale, "upload.errorPreviewDeployment")
                    );
                  } : addPhotos,
                  onRemove: removePhoto,
                  onReorder: reorderPhotos,
                  onRetry: retryPhoto,
                  error: errors.photos
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-muted/20 p-4 space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-foreground", children: tl("create.review.title") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-x-4 gap-y-2 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: tl("create.field.title") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground truncate", children: form.title || "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: tl("create.field.category") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: form.categoryId != null ? categoryLabel(
                  getCategoryById(form.categoryId),
                  locale === "uk" ? "uk" : "en"
                ) : "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: tl("create.field.condition") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: ((_b = CONDITIONS.find((c) => c.value === form.condition)) == null ? void 0 : _b.label) ?? "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: tl("create.field.price") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-bold text-foreground", children: form.priceAmount ? `${form.priceAmount} ${(_c = TOKENS.find((tk) => tk.value === form.priceToken)) == null ? void 0 : _c.label}` : "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: tl("create.field.location") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground truncate", children: form.location || "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: tl("create.review.carrier") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: selectedCarrier ? selectedCarrier.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: tl("create.field.photos") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-foreground", children: [
                  photos.filter((p) => p.uploadStatus === "done").length,
                  " /",
                  " ",
                  photos.length,
                  hasUploadingPhotos && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-3 h-3 inline ml-1 animate-spin text-accent" })
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border px-6 py-4 bg-muted/20 rounded-b-2xl", children: [
          submitError && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "mb-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3",
              "data-ocid": "submit-error-banner",
              role: "alert",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-4 h-4 text-destructive mt-0.5 shrink-0" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-destructive leading-snug break-words min-w-0", children: submitError }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setSubmitError(null),
                    className: "ml-auto shrink-0 text-destructive/60 hover:text-destructive",
                    "aria-label": "Dismiss error",
                    "data-ocid": "submit-error-dismiss",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: handleBack,
                disabled: step === 0 || isSubmitting,
                className: "gap-2",
                "data-ocid": "btn-back",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "w-4 h-4" }),
                  t(locale, "create.back")
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              isEditMode && /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  onClick: () => setShowDiscardDialog(true),
                  disabled: isSubmitting,
                  className: "text-muted-foreground hover:text-foreground",
                  "data-ocid": "btn-cancel-edit",
                  children: t(locale, "create.editMode.cancelBtn")
                }
              ),
              isEditMode && step === 2 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "destructive",
                  onClick: handleDeactivate,
                  disabled: isSubmitting,
                  className: "gap-2",
                  "data-ocid": "btn-deactivate",
                  children: [
                    isSubmitting && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }),
                    t(locale, "create.deactivate")
                  ]
                }
              ),
              step < 2 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  onClick: handleNext,
                  className: "gap-2 button-primary",
                  "data-ocid": "btn-next",
                  children: [
                    t(locale, "create.continue"),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-4 h-4" })
                  ]
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  onClick: handleSubmit,
                  disabled: isSubmitting || hasUploadingPhotos || liabilityBlocked,
                  className: "gap-2 button-primary min-w-[140px]",
                  "data-ocid": "btn-submit",
                  title: liabilityBlocked ? tl("liability.create.blocked") : hasUploadingPhotos ? tl("create.photosStillUploading") : void 0,
                  children: isSubmitting ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }),
                    isEditMode ? tl("create.updating") : tl("create.publishing")
                  ] }) : isFetching ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }),
                    tl("create.connecting")
                  ] }) : hasUploadingPhotos ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }),
                    tl("create.photosStillUploading")
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "w-4 h-4" }),
                    isEditMode ? tl("create.editMode.saveBtn") : tl("create.publish")
                  ] })
                }
              )
            ] })
          ] })
        ] })
      ] })
    ] }),
    showDiscardDialog && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4",
        "data-ocid": "discard-dialog",
        onKeyDown: (e) => {
          if (e.key === "Escape") setShowDiscardDialog(false);
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl p-6 space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-display font-bold text-foreground", children: t(locale, "create.editMode.discardConfirm.title") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t(locale, "create.editMode.discardConfirm.description") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-3 pt-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: () => setShowDiscardDialog(false),
                "data-ocid": "discard-dialog-keep-editing",
                children: t(locale, "create.editMode.discardConfirm.keepEditing")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "destructive",
                onClick: () => {
                  setShowDiscardDialog(false);
                  navigate({
                    to: "/listings/$id",
                    params: { id: editId }
                  });
                },
                "data-ocid": "discard-dialog-confirm",
                children: t(locale, "create.editMode.discardConfirm.confirm")
              }
            )
          ] })
        ] })
      }
    )
  ] });
}
export {
  CreateListingPage as default
};
