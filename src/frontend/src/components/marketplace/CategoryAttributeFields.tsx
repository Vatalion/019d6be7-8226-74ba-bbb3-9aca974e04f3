import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/hooks/useLocale";
import { fetchCategoryAttributeSchema } from "@/lib/marketplaceActor";
import { useQuery } from "@tanstack/react-query";

export type CategoryAttributeValue = { key: string; value: string };

interface CategoryAttributeFieldsProps {
  categoryId: number | null;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  errors?: Record<string, string>;
  actor: unknown;
}

export function CategoryAttributeFields({
  categoryId,
  values,
  onChange,
  errors = {},
  actor,
}: CategoryAttributeFieldsProps) {
  const { locale, t } = useLocale();

  const { data: schema, isLoading } = useQuery({
    queryKey: ["categoryAttributeSchema", categoryId],
    queryFn: () =>
      categoryId != null
        ? fetchCategoryAttributeSchema(actor, categoryId)
        : Promise.resolve([]),
    enabled: categoryId != null && categoryId > 0,
  });

  if (categoryId == null || categoryId <= 0) return null;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!schema?.length) return null;

  return (
    <div className="space-y-4" data-ocid="category-attribute-fields">
      <p className="text-sm font-medium text-foreground">
        {t("create.categoryAttributes.title")}
      </p>
      {schema.map((field) => {
        const label = locale === "uk" ? field.labelUk : field.labelEn;
        const inputType = field.fieldType === "number" ? "number" : "text";
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={`attr-${field.key}`}>
              {label}
              {field.required ? " *" : ""}
            </Label>
            <Input
              id={`attr-${field.key}`}
              type={inputType}
              value={values[field.key] ?? ""}
              onChange={(e) => onChange(field.key, e.target.value)}
              data-ocid={`attr-input-${field.key}`}
            />
            {errors[field.key] && (
              <p className="text-xs text-destructive">{errors[field.key]}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function toAttributePayload(
  values: Record<string, string>,
): CategoryAttributeValue[] {
  return Object.entries(values)
    .filter(([, v]) => v.trim().length > 0)
    .map(([key, value]) => ({ key, value: value.trim() }));
}
