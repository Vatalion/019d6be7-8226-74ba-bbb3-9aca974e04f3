import { b as useLocale, j as jsxRuntimeExports, B as Button, L as Link, i as ShieldCheck } from "./index-B5zdxtVX.js";
import { A as ArrowLeft } from "./arrow-left-Br_e3Wvc.js";
import { W as Wallet } from "./wallet-vmzndd0_.js";
function HowPaymentsWorkPage() {
  const { t } = useLocale();
  const phases = [
    {
      title: t("paymentsGuide.phase1.title"),
      body: t("paymentsGuide.phase1.body"),
      items: [
        t("paymentsGuide.phase1.item1"),
        t("paymentsGuide.phase1.item2"),
        t("paymentsGuide.phase1.item3")
      ]
    },
    {
      title: t("paymentsGuide.phase2.title"),
      body: t("paymentsGuide.phase2.body"),
      items: [
        t("paymentsGuide.phase2.item1"),
        t("paymentsGuide.phase2.item2")
      ]
    },
    {
      title: t("paymentsGuide.phase3.title"),
      body: t("paymentsGuide.phase3.body"),
      items: [t("paymentsGuide.phase3.item1")]
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background", "data-ocid": "how-payments-work-page", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "gap-2 -ml-2 mb-4", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4" }),
        t("paymentsGuide.backHome")
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl sm:text-3xl font-display font-bold text-foreground", children: t("paymentsGuide.title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-2 text-sm leading-relaxed", children: t("paymentsGuide.intro") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-amber-500/30 bg-amber-500/8 p-4 flex gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "w-5 h-5 text-amber-600 shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-foreground leading-relaxed", children: t("paymentsGuide.honestyBanner") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: phases.map((phase, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "section",
      {
        className: "card-elevated p-5 sm:p-6 space-y-3",
        "data-ocid": `payments-guide-phase-${idx + 1}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-lg font-semibold text-foreground flex items-center gap-2", children: [
            idx === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "w-5 h-5 text-accent" }),
            phase.title
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: phase.body }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "text-sm text-muted-foreground space-y-2 list-disc pl-5 marker:text-accent", children: phase.items.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: item }, item)) })
        ]
      },
      phase.title
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row gap-3 pt-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/listings", children: t("paymentsGuide.browseCta") }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", asChild: true, className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/trades", children: t("paymentsGuide.tradesCta") }) })
    ] })
  ] }) });
}
export {
  HowPaymentsWorkPage as default
};
