import { Button } from "@/components/ui/button";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { useLocale } from "@/hooks/useLocale";
import {
  buildShareTargets,
  canUseNativeShare,
  openNativeShare,
} from "@/lib/shareIntents";
import { Copy, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type ShareListingButtonProps = {
  url: string;
  title: string;
  label: string;
  className?: string;
  ocid?: string;
};

export function ShareListingButton({
  url,
  title,
  label,
  className,
  ocid = "share-listing-btn",
}: ShareListingButtonProps) {
  const { t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const targets = useMemo(() => buildShareTargets(url, title), [url, title]);

  const shareData: ShareData = useMemo(
    () => ({ title, url, text: title }),
    [title, url],
  );

  const openIntentMenu = () => setMenuOpen(true);

  const handleShareClick = async () => {
    if (canUseNativeShare(shareData)) {
      try {
        await openNativeShare(shareData);
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    openIntentMenu();
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        throw new Error("clipboard_unavailable");
      }
      toast.success(t("detail.linkCopied"));
      setMenuOpen(false);
    } catch {
      toast.error(t("detail.shareError"));
    }
  };

  return (
    <Popover open={menuOpen} onOpenChange={setMenuOpen}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={className ?? "gap-1.5"}
        onClick={() => void handleShareClick()}
        data-ocid={ocid}
      >
        <Share2 className="h-3.5 w-3.5" />
        {label}
      </Button>
      <PopoverContent align="start" className="w-56 p-2">
        <p className="px-2 py-1.5 text-sm font-medium text-foreground">
          {t("detail.shareVia")}
        </p>
        <ul className="flex flex-col gap-0.5">
          {targets.map((target) => (
            <li key={target.id}>
              <a
                href={target.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent"
                onClick={() => setMenuOpen(false)}
                data-ocid={`share-intent-${target.id}`}
              >
                <Share2 className="h-4 w-4 shrink-0 opacity-70" />
                {t(target.labelKey)}
              </a>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent"
              onClick={() => void handleCopyLink()}
              data-ocid="share-intent-copy"
            >
              <Copy className="h-4 w-4 shrink-0 opacity-70" />
              {t("detail.share.copyLink")}
            </button>
          </li>
        </ul>
      </PopoverContent>
    </Popover>
  );
}
