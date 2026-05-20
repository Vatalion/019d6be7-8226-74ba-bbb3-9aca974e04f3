import { n as ShippingCarrier, W as ShippingServiceType, d as detectLocale, j as jsxRuntimeExports, t, B as Button } from "./index-B5zdxtVX.js";
import { M as MapPin } from "./map-pin-DTZTie51.js";
import { C as CircleCheck } from "./circle-check-DpfL7oJ3.js";
const ACTIVE_PHYSICAL_SHIPPING_CARRIER = ShippingCarrier.self_pickup;
[
  ShippingCarrier.nova_poshta,
  ShippingCarrier.ukrposhta,
  ShippingCarrier.meest
];
const PICKUP_ONLY_SHIPPING_OPTION = {
  carrier: ACTIVE_PHYSICAL_SHIPPING_CARRIER,
  cost: 0,
  costNat: 0n,
  deliveryDays: 0n,
  available: true
};
function getPhysicalShippingMethods() {
  return [
    {
      carrier: ACTIVE_PHYSICAL_SHIPPING_CARRIER,
      type: ShippingServiceType.standard,
      estimatedDays: 0n
    }
  ];
}
[
  {
    carrier: "nova_poshta",
    cost: 0,
    costNat: BigInt(8500),
    // 85.00 UAH
    deliveryDays: BigInt(1),
    available: true
  },
  {
    carrier: "ukrposhta",
    cost: 0,
    costNat: BigInt(5500),
    // 55.00 UAH
    deliveryDays: BigInt(3),
    available: true
  },
  {
    carrier: "meest",
    cost: 0,
    costNat: BigInt(7e3),
    // 70.00 UAH
    deliveryDays: BigInt(2),
    available: true
  }
];
({
  costNat: BigInt(0),
  deliveryDays: BigInt(0)
});
function PickupOnlyShippingProviderSelector({
  selectedCarrier,
  onSelect,
  locale
}) {
  const isSelected = selectedCarrier === PICKUP_ONLY_SHIPPING_OPTION.carrier;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", "data-ocid": "shipping-provider-selector", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-foreground", children: t(locale, "shipping.pickupOnly.title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t(locale, "shipping.pickupOnly.subtitle") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: [
          "rounded-lg border bg-card p-4 transition-smooth",
          isSelected ? "border-green-500/60 ring-2 ring-green-500/20" : "border-border hover:border-accent/40"
        ].join(" "),
        "data-ocid": "carrier-card-self_pickup",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-700 dark:text-green-300", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground", children: t(locale, "carrier.self_pickup") }),
                isSelected && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded border border-green-500/25 bg-green-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-green-600 dark:text-green-300", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-2.5 w-2.5" }),
                  t(locale, "shipping.compare.selected")
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs leading-snug text-muted-foreground", children: t(locale, "shipping.pickupOnly.description") })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              size: "sm",
              variant: isSelected ? "default" : "outline",
              className: [
                "mt-4 w-full text-xs",
                isSelected ? "bg-accent text-accent-foreground hover:opacity-90" : ""
              ].join(" "),
              onClick: () => onSelect == null ? void 0 : onSelect(
                PICKUP_ONLY_SHIPPING_OPTION.carrier,
                PICKUP_ONLY_SHIPPING_OPTION
              ),
              "data-ocid": "carrier-select-self_pickup",
              children: isSelected ? t(locale, "shipping.compare.selected") : t(locale, "shipping.pickupOnly.select")
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "p",
      {
        className: "rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs leading-snug text-muted-foreground",
        "data-ocid": "shipping-carriers-disabled-note",
        children: t(locale, "shipping.pickupOnly.lockedNotice")
      }
    )
  ] });
}
function ShippingProviderSelector(props) {
  const locale = props.locale ?? detectLocale();
  {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(PickupOnlyShippingProviderSelector, { ...props, locale });
  }
}
export {
  ACTIVE_PHYSICAL_SHIPPING_CARRIER as A,
  ShippingProviderSelector as S,
  getPhysicalShippingMethods as g
};
