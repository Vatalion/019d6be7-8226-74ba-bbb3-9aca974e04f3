import { AlertCircle, ChevronDown, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "../hooks/useLocale";

interface Region {
  name: string;
  cities: string[];
}

interface RegionsData {
  regions: Region[];
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
}

/**
 * Cascading location picker: Oblast → City
 * Backward-compatible: if value doesn't match any structured entry, shows legacy display.
 */
export function CascadingLocationPicker({
  value,
  onChange,
  disabled = false,
  hasError = false,
}: Props) {
  const { t: tl } = useLocale();
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [isLegacy, setIsLegacy] = useState(false);
  const initializedRef = useRef(false);

  // Fetch regions data on mount
  useEffect(() => {
    fetch("/assets/ua_regions.json")
      .then((r) => r.json())
      .then((data: RegionsData) => {
        setRegions(data.regions);
        setLoading(false);
      })
      .catch(() => {
        setFetchError(true);
        setLoading(false);
      });
  }, []);

  // Parse initial value once regions are loaded
  useEffect(() => {
    if (loading || initializedRef.current || regions.length === 0) return;
    initializedRef.current = true;

    if (!value) return;

    // Try to parse "City, Oblast" pattern
    const commaIdx = value.indexOf(",");
    if (commaIdx !== -1) {
      const city = value.slice(0, commaIdx).trim();
      const region = value.slice(commaIdx + 1).trim();
      const matchedRegion = regions.find((r) => r.name === region);
      if (matchedRegion?.cities.includes(city)) {
        setSelectedRegion(region);
        setSelectedCity(city);
        return;
      }
    }

    // Check if value is exactly a region name
    const exactRegion = regions.find((r) => r.name === value);
    if (exactRegion) {
      setSelectedRegion(value);
      return;
    }

    // Not matched — treat as legacy free-text
    setIsLegacy(true);
  }, [regions, value, loading]);

  const filteredCities = selectedRegion
    ? (regions.find((r) => r.name === selectedRegion)?.cities ?? [])
    : [];

  function handleRegionChange(regionName: string) {
    setSelectedRegion(regionName);
    setSelectedCity(null);
    setIsLegacy(false);
    onChange(regionName);
  }

  function handleCityChange(cityName: string) {
    setSelectedCity(cityName);
    onChange(`${cityName}, ${selectedRegion}`);
  }

  function handleClear() {
    setSelectedRegion(null);
    setSelectedCity(null);
    setIsLegacy(false);
    onChange("");
  }

  function handleLegacyClear() {
    setIsLegacy(false);
    setSelectedRegion(null);
    setSelectedCity(null);
    onChange("");
  }

  const baseSelect =
    "w-full appearance-none bg-background border rounded-md px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
  const errorBorder = "border-destructive";
  const normalBorder = "border-input";

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>{tl("location.selectOblast")}…</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center gap-2 text-destructive text-sm py-2">
        <AlertCircle className="w-4 h-4" />
        <span>{tl("location.failedToLoadRegions")}</span>
      </div>
    );
  }

  // Legacy display
  if (isLegacy) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-foreground text-xs">
            {tl("location.legacyPrefix")}
          </span>
          <span className="flex-1 text-foreground truncate">{value}</span>
          <button
            type="button"
            onClick={handleLegacyClear}
            disabled={disabled}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            aria-label={tl("location.clearSelection")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Oblast / Region select */}
      <div className="relative">
        <select
          value={selectedRegion ?? ""}
          onChange={(e) => handleRegionChange(e.target.value)}
          disabled={disabled}
          className={[
            baseSelect,
            hasError && !selectedRegion ? errorBorder : normalBorder,
          ].join(" ")}
          data-ocid="location-region-select"
        >
          <option value="" disabled>
            {tl("location.selectOblast")}
          </option>
          {regions.map((r) => (
            <option key={r.name} value={r.name}>
              {r.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      </div>

      {/* City select — enabled only after region */}
      <div className="relative">
        <select
          value={selectedCity ?? ""}
          onChange={(e) => handleCityChange(e.target.value)}
          disabled={disabled || !selectedRegion}
          className={[
            baseSelect,
            !selectedRegion ? "opacity-50 cursor-not-allowed" : "",
            hasError && selectedRegion && !selectedCity
              ? errorBorder
              : normalBorder,
          ].join(" ")}
          data-ocid="location-city-select"
        >
          <option value="" disabled>
            {selectedRegion
              ? tl("location.selectCity")
              : tl("location.selectOblastFirst")}
          </option>
          {filteredCities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      </div>

      {/* Clear button when something is selected */}
      {(selectedRegion || selectedCity) && (
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          data-ocid="location-clear-button"
        >
          <X className="w-3 h-3" />
          {tl("location.clearSelection")}
        </button>
      )}
    </div>
  );
}
