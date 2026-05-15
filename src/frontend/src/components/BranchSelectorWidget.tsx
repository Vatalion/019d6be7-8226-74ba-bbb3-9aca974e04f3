import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, MapPin, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "../hooks/useLocale";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BranchInfo {
  ref: string;
  name: string;
  address: string;
  schedule?: string;
}

interface BranchSelectorWidgetProps {
  cityName: string;
  selectedRef: string;
  onSelect: (branch: BranchInfo) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actor: any;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BranchSelectorWidget({
  cityName,
  selectedRef,
  onSelect,
  actor,
}: BranchSelectorWidgetProps) {
  const { t: tl } = useLocale();
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input — 400ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchText]);

  // Fetch branches when cityName or debouncedSearch changes
  useEffect(() => {
    if (!actor || !cityName.trim()) {
      setBranches([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const searchArg = debouncedSearch.trim() ? [debouncedSearch.trim()] : [];

    actor
      .getNovaPoshtaBranches(cityName.trim(), searchArg, [BigInt(50)])
      .then(
        (
          result:
            | {
                ok: Array<{
                  ref: string;
                  name: string;
                  address: string;
                  schedule: [] | [string];
                }>;
              }
            | { err: unknown },
        ) => {
          if (cancelled) return;
          if ("ok" in result) {
            setBranches(
              result.ok.map((b) => ({
                ref: b.ref,
                name: b.name,
                address: b.address,
                schedule: b.schedule.length > 0 ? b.schedule[0] : undefined,
              })),
            );
          } else {
            setError(tl("shipping.branchNoResults"));
          }
          setIsLoading(false);
        },
      )
      .catch(() => {
        if (cancelled) return;
        setError(tl("shipping.branchNoResults"));
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [actor, cityName, debouncedSearch, tl]);

  return (
    <div className="space-y-3" data-ocid="branch-selector-widget">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder={tl("shipping.branchSearchPlaceholder")}
          className="pl-9"
          aria-label={tl("shipping.branchSearch")}
          data-ocid="branch-search-input"
        />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div
          className="flex items-center gap-2 text-sm text-muted-foreground py-2"
          data-ocid="branch-loading-state"
        >
          <Loader2 className="w-4 h-4 animate-spin text-accent" />
          {tl("shipping.branchLoading")}
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <p
          className="text-sm text-muted-foreground py-2"
          data-ocid="branch-error-state"
        >
          {error}
        </p>
      )}

      {/* Empty state */}
      {!isLoading && !error && branches.length === 0 && cityName.trim() && (
        <p
          className="text-sm text-muted-foreground py-2"
          data-ocid="branch-empty-state"
        >
          {tl("shipping.branchNoResults")}
        </p>
      )}

      {/* No city prompt */}
      {!isLoading && !cityName.trim() && (
        <p className="text-sm text-muted-foreground py-2">
          {tl("shipping.branchSelect")}
        </p>
      )}

      {/* Branch list */}
      {!isLoading && branches.length > 0 && (
        <div
          className="max-h-64 overflow-y-auto rounded-lg border border-border divide-y divide-border"
          data-ocid="branch-list"
        >
          {branches.map((branch, idx) => {
            const isSelected = branch.ref === selectedRef;
            return (
              <div key={branch.ref} data-ocid={`branch-item.${idx + 1}`}>
                <button
                  type="button"
                  onClick={() => onSelect(branch)}
                  aria-pressed={isSelected}
                  className={[
                    "w-full text-left px-4 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
                    isSelected
                      ? "bg-accent/10 text-foreground"
                      : "hover:bg-muted/40 text-foreground",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug truncate">
                        {branch.name}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{branch.address}</span>
                      </p>
                      {branch.schedule && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {branch.schedule}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
