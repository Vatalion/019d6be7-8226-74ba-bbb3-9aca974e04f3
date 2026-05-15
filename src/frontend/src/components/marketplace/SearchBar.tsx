import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useRef } from "react";
import { useLocale } from "../../hooks/useLocale";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder,
}: SearchBarProps) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit?.();
    }
  };

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex items-center w-full">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
        aria-hidden="true"
      />
      <Input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? t("search.placeholder")}
        className="pl-9 pr-9 bg-card border-border focus-visible:ring-ring h-10"
        data-ocid="search-input"
        aria-label={t("search.ariaLabel")}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={t("search.clearAriaLabel")}
          data-ocid="search-clear"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
