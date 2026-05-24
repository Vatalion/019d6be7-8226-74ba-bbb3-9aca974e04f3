import type { LinkPreview } from "@/backend.d";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackend } from "@/hooks/useBackend";
import { safeHttpUrl } from "@/utils/safeUrl";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

interface LinkPreviewCardProps {
  url: string;
}

export function LinkPreviewCard({ url }: LinkPreviewCardProps) {
  const { actor, isFetching } = useBackend();
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const safeUrl = safeHttpUrl(url);

  useEffect(() => {
    if (!actor || isFetching || !safeUrl) {
      setLoading(false);
      setError(!safeUrl);
      return;
    }
    setLoading(true);
    setError(false);

    actor
      .getLinkPreview(safeUrl)
      .then((res) => {
        if (res.__kind__ === "ok" && res.ok.title) {
          setPreview(res.ok);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [safeUrl, actor, isFetching]);

  if (!safeUrl) return null;

  if (loading) {
    return (
      <div
        className="mt-1.5 p-2.5 rounded-lg border border-border bg-muted/30 flex gap-2.5 animate-pulse"
        data-ocid="link-preview-card"
      >
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-2.5 w-20 rounded" />
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-2.5 w-3/4 rounded" />
        </div>
        <Skeleton className="w-16 h-14 rounded flex-shrink-0" />
      </div>
    );
  }

  if (error || !preview || !preview.title) return null;

  const title = preview.title ?? "";
  const description = preview.description ?? "";
  const siteName = preview.siteName ?? "";
  const imageUrl = preview.imageUrl ? safeHttpUrl(preview.imageUrl) : undefined;

  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1.5 flex gap-2.5 p-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors group block"
      data-ocid="link-preview-card"
    >
      <div className="flex-1 min-w-0 space-y-0.5">
        {siteName && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <ExternalLink className="w-2.5 h-2.5" />
            {siteName}
          </p>
        )}
        <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </p>
        {description && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
            {description}
          </p>
        )}
      </div>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={title}
          className="w-16 h-14 object-cover rounded flex-shrink-0"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      )}
    </a>
  );
}
