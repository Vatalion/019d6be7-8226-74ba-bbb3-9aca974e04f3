import { b as useLocale, j as jsxRuntimeExports, B as Button, L as Link } from "./index-B5zdxtVX.js";
import { A as ArrowLeft } from "./arrow-left-Br_e3Wvc.js";
import { S as Shield } from "./shield-CPybkuzJ.js";
function PrivacyPage() {
  const { t } = useLocale();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background", "data-ocid": "privacy-page", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "gap-2 -ml-2", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
      t("privacy.backHome")
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-6 w-6 text-accent" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-display font-bold text-foreground", children: t("privacy.title") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: t("privacy.intro") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-foreground", children: t("privacy.pseudonymousTitle") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: t("privacy.pseudonymousBody") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-foreground", children: t("privacy.weStoreTitle") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm text-muted-foreground list-disc pl-5 space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: t("privacy.weStore1") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: t("privacy.weStore2") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: t("privacy.weStore3") })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-foreground", children: t("privacy.weDoNotTitle") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm text-muted-foreground list-disc pl-5 space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: t("privacy.weDoNot1") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: t("privacy.weDoNot2") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: t("privacy.weDoNot3") })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/how-payments-work", className: "text-accent hover:underline", children: t("privacy.paymentsLink") }) })
  ] }) });
}
export {
  PrivacyPage as default
};
