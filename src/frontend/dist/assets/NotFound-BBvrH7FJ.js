import { j as jsxRuntimeExports, B as Button, L as Link } from "./index-B5zdxtVX.js";
import { H as House } from "./house-BR16Fwk-.js";
import { S as Search } from "./search-DsaBUJqe.js";
function NotFound() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6 text-center",
      "data-ocid": "not-found-page",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-8xl font-bold text-gray-500 select-none", children: "404" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-semibold text-foreground", children: "Page not found" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground max-w-sm", children: "This page doesn't exist or has been removed." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              asChild: true,
              className: "button-primary gap-2",
              "data-ocid": "btn-go-home",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(House, { className: "h-4 w-4" }),
                "Go home"
              ] })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              asChild: true,
              variant: "outline",
              className: "gap-2",
              "data-ocid": "btn-browse-listings",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/listings", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4" }),
                "Browse listings"
              ] })
            }
          )
        ] })
      ]
    }
  );
}
export {
  NotFound as default
};
