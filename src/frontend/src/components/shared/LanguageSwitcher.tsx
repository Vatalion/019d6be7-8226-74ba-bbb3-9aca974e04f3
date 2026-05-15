import { useLocale } from "../../hooks/useLocale";
import type { Locale } from "../../i18n";
import { Button } from "../ui/button";

const LANG_OPTIONS: { value: Locale; label: string; flag: string }[] = [
  { value: "uk", label: "Укр", flag: "🇺🇦" },
  { value: "en", label: "Eng", flag: "🇺🇸" },
];

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex items-center gap-1" data-ocid="language-switcher">
      {LANG_OPTIONS.map(({ value, label, flag }) => (
        <Button
          key={value}
          variant="ghost"
          size="sm"
          onClick={() => setLocale(value)}
          aria-label={`Switch to ${label}`}
          aria-pressed={locale === value}
          className={[
            "h-7 px-2 text-xs font-medium gap-1 transition-smooth",
            locale === value
              ? "bg-accent/15 text-accent"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          ].join(" ")}
        >
          <span aria-hidden>{flag}</span>
          {!compact && <span>{label}</span>}
        </Button>
      ))}
    </div>
  );
}
