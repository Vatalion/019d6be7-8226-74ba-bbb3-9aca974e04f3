import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { t } from "../../i18n";
import type { Locale } from "../../i18n";

interface VaultAddressDisplayProps {
  address: string;
  locale: Locale;
  "data-ocid"?: string;
}

export function VaultAddressDisplay({
  address,
  locale,
  "data-ocid": ocid,
}: VaultAddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const truncated =
    address.length > 20
      ? `${address.slice(0, 10)}…${address.slice(-8)}`
      : address;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silent
    }
  };

  return (
    <div className="flex items-center gap-2 min-w-0" data-ocid={ocid}>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <code className="font-mono text-xs bg-muted px-2 py-1 rounded border border-border truncate max-w-[160px] cursor-default select-all">
              {truncated}
            </code>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-xs break-all font-mono text-xs"
          >
            {address}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={handleCopy}
        aria-label={t(locale, "vault.copyAddress")}
        data-ocid={ocid ? `${ocid}-copy` : "vault-address-copy"}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-accent" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}
