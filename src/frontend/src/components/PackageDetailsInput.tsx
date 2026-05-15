import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Info } from "lucide-react";
import { useLocale } from "../hooks/useLocale";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PackageDetailsValue {
  weight: number; // kg (display); backend stores grams
  length: number; // cm
  width: number; // cm
  height: number; // cm
  places: number; // default 1
}

interface PackageDetailsInputProps {
  value: PackageDetailsValue;
  onChange: (val: PackageDetailsValue) => void;
  errors?: {
    weight?: string;
    length?: string;
    width?: string;
    height?: string;
  };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function parsePositive(raw: string): number {
  const n = Number.parseFloat(raw);
  return Number.isNaN(n) || n < 0 ? 0 : n;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-destructive mt-1">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      {message}
    </p>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PackageDetailsInput({
  value,
  onChange,
  errors = {},
}: PackageDetailsInputProps) {
  const { t: tl } = useLocale();

  const set = (field: keyof PackageDetailsValue, raw: string) => {
    const n = parsePositive(raw);
    onChange({ ...value, [field]: n });
  };

  // Volumetric weight: (L × W × H) / 4000 kg
  const volumetricWeight =
    value.length > 0 && value.width > 0 && value.height > 0
      ? ((value.length * value.width * value.height) / 4000).toFixed(2)
      : null;

  return (
    <div className="space-y-4" data-ocid="package-details-input">
      {/* Section header */}
      <h4 className="text-sm font-semibold text-foreground">
        {tl("shipping.packageDetails")}
      </h4>

      {/* Weight row */}
      <div className="space-y-1.5">
        <Label htmlFor="pkg-weight" className="text-label">
          {tl("shipping.weight")}
        </Label>
        <Input
          id="pkg-weight"
          type="number"
          min="0"
          max="30"
          step="0.1"
          value={value.weight === 0 ? "" : value.weight}
          onChange={(e) => set("weight", e.target.value)}
          placeholder="0.0"
          className={errors.weight ? "border-destructive" : ""}
          data-ocid="package-weight-input"
        />
        <FieldError message={errors.weight} />
      </div>

      {/* L / W / H row */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground">
          {tl("shipping.length")} / {tl("shipping.width")} /{" "}
          {tl("shipping.height")}
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Input
              id="pkg-length"
              type="number"
              min="0"
              max="120"
              step="1"
              value={value.length === 0 ? "" : value.length}
              onChange={(e) => set("length", e.target.value)}
              placeholder="L"
              className={errors.length ? "border-destructive" : ""}
              data-ocid="package-length-input"
            />
            <FieldError message={errors.length} />
          </div>
          <div>
            <Input
              id="pkg-width"
              type="number"
              min="0"
              max="120"
              step="1"
              value={value.width === 0 ? "" : value.width}
              onChange={(e) => set("width", e.target.value)}
              placeholder="W"
              className={errors.width ? "border-destructive" : ""}
              data-ocid="package-width-input"
            />
            <FieldError message={errors.width} />
          </div>
          <div>
            <Input
              id="pkg-height"
              type="number"
              min="0"
              max="120"
              step="1"
              value={value.height === 0 ? "" : value.height}
              onChange={(e) => set("height", e.target.value)}
              placeholder="H"
              className={errors.height ? "border-destructive" : ""}
              data-ocid="package-height-input"
            />
            <FieldError message={errors.height} />
          </div>
        </div>
      </div>

      {/* Places row */}
      <div className="space-y-1.5">
        <Label htmlFor="pkg-places" className="text-label">
          {tl("shipping.places")}
        </Label>
        <Input
          id="pkg-places"
          type="number"
          min="1"
          max="99"
          step="1"
          value={value.places === 0 ? "" : value.places}
          onChange={(e) => set("places", e.target.value)}
          placeholder="1"
          data-ocid="package-places-input"
        />
      </div>

      {/* Volumetric weight info row */}
      {volumetricWeight !== null && (
        <div
          className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2"
          data-ocid="package-volumetric-weight"
        >
          <Info className="w-3.5 h-3.5 shrink-0 text-accent" />
          <span>
            {tl("shipping.volumetricWeight").replace("{0}", volumetricWeight)}
          </span>
        </div>
      )}
    </div>
  );
}
