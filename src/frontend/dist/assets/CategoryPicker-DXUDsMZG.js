import { b as useLocale, r as reactExports, C as getCategoryById, g as getL1Categories, V as getChildCategories, j as jsxRuntimeExports, e as categoryLabel } from "./index-B5zdxtVX.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CLWV2fSS.js";
function CategoryPicker({
  valueId,
  onChange,
  l1Ocid = "category-l1",
  l2Ocid = "category-l2",
  allowAny = true
}) {
  const { locale } = useLocale();
  const loc = locale === "uk" ? "uk" : "en";
  const selected = reactExports.useMemo(
    () => valueId != null ? getCategoryById(valueId) : void 0,
    [valueId]
  );
  const l1Id = selected == null ? null : selected.parentId == null ? selected.id : selected.parentId;
  const l1List = getL1Categories();
  const l2List = l1Id != null ? getChildCategories(l1Id) : [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Select,
      {
        value: l1Id != null ? String(l1Id) : allowAny ? "any" : "",
        onValueChange: (v) => {
          if (v === "any") {
            onChange(null, null);
            return;
          }
          const id = Number(v);
          onChange(id, getCategoryById(id) ?? null);
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { "data-ocid": l1Ocid, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "—" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            allowAny && /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "any", "data-ocid": `${l1Ocid}-any`, children: "—" }),
            l1List.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: String(c.id), children: categoryLabel(c, loc) }, c.id))
          ] })
        ]
      }
    ) }),
    l2List.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Select,
      {
        value: (selected == null ? void 0 : selected.parentId) != null ? String(selected.id) : "any-l2",
        onValueChange: (v) => {
          if (v === "any-l2" && l1Id != null) {
            onChange(l1Id, getCategoryById(l1Id) ?? null);
            return;
          }
          const id = Number(v);
          onChange(id, getCategoryById(id) ?? null);
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { "data-ocid": l2Ocid, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "—" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "any-l2", children: "—" }),
            l2List.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: String(c.id), children: categoryLabel(c, loc) }, c.id))
          ] })
        ]
      }
    ) })
  ] });
}
export {
  CategoryPicker as C
};
