import {
  type LinkedExternalWallet,
  WalletChain,
  WalletLinkPurpose,
} from "@/backend.d";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { getLinkedWallets, unlinkExternalWallet } from "@/lib/walletLinkApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Loader2, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";

function chainLabel(chain: LinkedExternalWallet["chain"]): string {
  if (chain === WalletChain.tron) return "Tron";
  if (chain === WalletChain.evm_bsc) return "BSC";
  return "EVM";
}

function purposeLabel(purpose: LinkedExternalWallet["purpose"]): string {
  if (purpose === WalletLinkPurpose.payout) return "payout";
  if (purpose === WalletLinkPurpose.stake) return "stake";
  return "payment";
}

function truncateAddress(addr: string): string {
  if (addr.length <= 20) return addr;
  return `${addr.slice(0, 10)}…${addr.slice(-8)}`;
}

export function LinkedWalletsCard() {
  const { t } = useLocale();
  const { identity } = useAuth();
  const queryClient = useQueryClient();

  const { data: wallets = [], isLoading } = useQuery({
    queryKey: ["linkedWallets"],
    queryFn: () =>
      identity && !identity.getPrincipal().isAnonymous()
        ? getLinkedWallets(identity)
        : Promise.resolve([]),
    enabled: !!identity && !identity.getPrincipal().isAnonymous(),
    staleTime: 30_000,
  });

  const unlinkMutation = useMutation({
    mutationFn: async (walletLinkId: bigint) => {
      if (!identity) throw new Error("Not authenticated");
      const ok = await unlinkExternalWallet(identity, walletLinkId);
      if (!ok) throw new Error("unlink failed");
    },
    onSuccess: () => {
      toast.success(t("walletLink.unlinked"));
      void queryClient.invalidateQueries({ queryKey: ["linkedWallets"] });
    },
    onError: () => {
      toast.error(t("walletLink.unlinkFailed"));
    },
  });

  return (
    <div
      className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
      data-ocid="linked-wallets-card"
    >
      <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            {t("walletLink.profileTitle")}
          </h3>
        </div>
        <Button variant="outline" size="sm" asChild data-ocid="link-wallet-nav">
          <Link to="/add-payment-method">{t("walletLink.addWallet")}</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="px-4 py-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : wallets.length === 0 ? (
        <div
          className="px-4 py-6 text-center space-y-2"
          data-ocid="linked-wallets-empty"
        >
          <p className="text-sm text-muted-foreground">
            {t("walletLink.profileEmpty")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("walletLink.antiphishing")}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {wallets.map((w) => (
            <div
              key={w.id.toString()}
              className="flex items-center justify-between gap-3 px-4 py-3"
              data-ocid={`linked-wallet.${w.id.toString()}`}
            >
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  {chainLabel(w.chain)} · {purposeLabel(w.purpose)}
                </p>
                <code className="text-xs text-muted-foreground font-mono block truncate">
                  {truncateAddress(w.address)}
                </code>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                disabled={unlinkMutation.isPending}
                data-ocid={`unlink-wallet.${w.id.toString()}`}
                onClick={() => unlinkMutation.mutate(w.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
