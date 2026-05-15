import { c as createLucideIcon, j as jsxRuntimeExports, B as Button, am as Link } from "./index-BWWoZgQl.js";
import { S as Search } from "./search-3AlRQ99c.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8", key: "5wwlr5" }],
  [
    "path",
    {
      d: "M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
      key: "1d0kgt"
    }
  ]
];
const House = createLucideIcon("house", __iconNode);
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
