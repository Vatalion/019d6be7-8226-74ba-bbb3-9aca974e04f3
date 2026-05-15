import { cn } from "../../lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const SIZE_CLASSES = {
  sm: "h-4 w-4 border-2",
  md: "h-7 w-7 border-2",
  lg: "h-12 w-12 border-3",
};

export default function LoadingSpinner({
  size = "md",
  className,
  label,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className,
      )}
      aria-label={label ?? "Loading"}
      aria-live="polite"
      data-ocid="loading-spinner"
    >
      <div
        className={cn(
          "rounded-full border-border border-t-accent animate-spin",
          SIZE_CLASSES[size],
        )}
      />
      {label && (
        <p className="text-sm text-muted-foreground animate-pulse">{label}</p>
      )}
    </div>
  );
}

/**
 * Full-page loading overlay
 */
export function LoadingPage({ label }: { label?: string }) {
  return (
    <div
      className="flex h-full min-h-[50vh] items-center justify-center"
      data-ocid="loading-page"
    >
      <LoadingSpinner size="lg" label={label ?? "Loading…"} />
    </div>
  );
}

/**
 * Skeleton line for text content
 */
export function SkeletonLine({
  className,
  width = "full",
}: {
  className?: string;
  width?: "full" | "3/4" | "1/2" | "1/3";
}) {
  const widthClass = {
    full: "w-full",
    "3/4": "w-3/4",
    "1/2": "w-1/2",
    "1/3": "w-1/3",
  }[width];

  return (
    <div
      className={cn(
        "h-4 rounded-md bg-muted animate-pulse",
        widthClass,
        className,
      )}
    />
  );
}
