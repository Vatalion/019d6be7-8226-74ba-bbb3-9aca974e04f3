import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type OlxCategoryNode,
  categoryLabel,
  getCategoryById,
  getChildCategories,
  getL1Categories,
} from "@/data/olxCategories";
import { useLocale } from "@/hooks/useLocale";
import { useMemo } from "react";

type Props = {
  valueId: number | null;
  onChange: (id: number | null, node: OlxCategoryNode | null) => void;
  l1Ocid?: string;
  l2Ocid?: string;
  allowAny?: boolean;
};

export function CategoryPicker({
  valueId,
  onChange,
  l1Ocid = "category-l1",
  l2Ocid = "category-l2",
  allowAny = true,
}: Props) {
  const { locale } = useLocale();
  const loc = locale === "uk" ? "uk" : "en";

  const selected = useMemo(
    () => (valueId != null ? getCategoryById(valueId) : undefined),
    [valueId],
  );

  const l1Id =
    selected == null
      ? null
      : selected.parentId == null
        ? selected.id
        : selected.parentId;

  const l1List = getL1Categories();
  const l2List = l1Id != null ? getChildCategories(l1Id) : [];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        <Select
          value={l1Id != null ? String(l1Id) : allowAny ? "any" : ""}
          onValueChange={(v) => {
            if (v === "any") {
              onChange(null, null);
              return;
            }
            const id = Number(v);
            onChange(id, getCategoryById(id) ?? null);
          }}
        >
          <SelectTrigger data-ocid={l1Ocid}>
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            {allowAny && (
              <SelectItem value="any" data-ocid={`${l1Ocid}-any`}>
                —
              </SelectItem>
            )}
            {l1List.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {categoryLabel(c, loc)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {l2List.length > 0 && (
        <div className="space-y-2">
          <Select
            value={
              selected?.parentId != null ? String(selected.id) : "any-l2"
            }
            onValueChange={(v) => {
              if (v === "any-l2" && l1Id != null) {
                onChange(l1Id, getCategoryById(l1Id) ?? null);
                return;
              }
              const id = Number(v);
              onChange(id, getCategoryById(id) ?? null);
            }}
          >
            <SelectTrigger data-ocid={l2Ocid}>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any-l2">—</SelectItem>
              {l2List.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {categoryLabel(c, loc)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
