import {
  type OlxCategoryNode,
  categoryLabel,
  getL1Categories,
} from "@/data/olxCategories";
import { useLocale } from "@/hooks/useLocale";
import { Link } from "@tanstack/react-router";
import {
  Baby,
  Briefcase,
  Car,
  Gift,
  Home,
  Laptop,
  PawPrint,
  Repeat,
  Shirt,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "detskiy-mir": Baby,
  nedvizhimost: Home,
  transport: Car,
  zapchasti: Wrench,
  elektronika: Laptop,
  "dom-i-sad": Home,
  "moda-i-stil": Shirt,
  "hobbi-otdyh-i-sport": Gift,
  zhivotnye: PawPrint,
  rabota: Briefcase,
  "biznes-uslugi": Briefcase,
  "arenda-prokat": Repeat,
  "zhytlo-podobovo": Home,
  obmen: Repeat,
  "otdam-besplatno": Gift,
};

export function CategoryGrid() {
  const { locale, t } = useLocale();
  const loc = locale === "uk" ? "uk" : "en";
  const items = getL1Categories();

  return (
    <section className="space-y-4" data-ocid="category-grid">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-foreground">
          {t("home.categories.title")}
        </h2>
        <Link
          to="/listings"
          className="text-sm text-primary hover:underline"
          data-ocid="category-grid-all"
        >
          {t("home.categories.all")}
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {items.map((c) => (
          <CategoryTile key={c.id} node={c} locale={loc} />
        ))}
      </div>
    </section>
  );
}

function CategoryTile({
  node,
  locale,
}: { node: OlxCategoryNode; locale: "uk" | "en" }) {
  const slug = node.slug.split("/")[0] ?? node.slug;
  const Icon = ICONS[slug] ?? Gift;
  const label = categoryLabel(node, locale);

  return (
    <Link
      to="/listings"
      search={{ cat: node.slug }}
      className="card-elevated flex flex-col items-center gap-2 p-4 text-center hover:border-primary/40 transition-colors"
      data-ocid={`category-tile-${slug}`}
    >
      <Icon className="h-8 w-8 text-primary" aria-hidden />
      <span className="text-sm font-medium text-foreground leading-tight">
        {label}
      </span>
    </Link>
  );
}
