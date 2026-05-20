import { p as useActor, u as useNavigate, l as useQuery, j as jsxRuntimeExports, H as Heart, S as Skeleton, P as PackageSearch, x as createActor } from "./index-B5zdxtVX.js";
import { a as asEngagementActor } from "./engagementActor-D1n_YDK5.js";
function FavoritesPage() {
  const { actor } = useActor(createActor);
  const navigate = useNavigate();
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["favorite-listings"],
    queryFn: async () => {
      const a = asEngagementActor(actor);
      if (!a.getFavoriteListings) return [];
      return await a.getFavoriteListings();
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-container py-8 space-y-6", "data-ocid": "favorites-page", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: "h-6 w-6 text-red-500" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "Favorites" })
    ] }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: ["a", "b", "c", "d", "e", "f"].map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-48 w-full rounded-lg" }, id)) }) : listings.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "No favorite listings yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: listings.map((listing) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: "card-elevated overflow-hidden text-left",
        onClick: () => navigate({ to: "/listings/$id", params: { id: String(listing.id) } }),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-[4/3] bg-muted relative", children: listing.photos[0] ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: listing.photos[0],
              alt: "",
              className: "w-full h-full object-cover"
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PackageSearch, { className: "h-10 w-10 opacity-30" }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold line-clamp-2", children: listing.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: listing.location })
          ] })
        ]
      },
      String(listing.id)
    )) })
  ] });
}
export {
  FavoritesPage as default
};
