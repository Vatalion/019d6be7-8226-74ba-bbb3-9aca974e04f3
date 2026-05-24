import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useBackend } from "../../hooks/useBackend";
import { useLocale } from "../../hooks/useLocale";

type ChecklistKey =
  | "testnetE2ePassed"
  | "rollbackTestsPassed"
  | "subaccountDesignReviewed"
  | "betaCapsConfigured";

const CHECKLIST_ITEMS: { key: ChecklistKey; labelKey: string }[] = [
  {
    key: "testnetE2ePassed",
    labelKey: "admin.trustlessEscrow.checklist.testnetE2e",
  },
  {
    key: "rollbackTestsPassed",
    labelKey: "admin.trustlessEscrow.checklist.rollbackTests",
  },
  {
    key: "subaccountDesignReviewed",
    labelKey: "admin.trustlessEscrow.checklist.subaccountDesign",
  },
  {
    key: "betaCapsConfigured",
    labelKey: "admin.trustlessEscrow.checklist.betaCaps",
  },
];

export default function TrustlessEscrowPanel() {
  const { actor, isFetching } = useBackend();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [signOffRef, setSignOffRef] = useState("");

  const { data: checklist, isLoading } = useQuery({
    queryKey: ["gateCChecklist"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.adminGetGateCChecklist();
    },
    enabled: !!actor && !isFetching,
  });

  const updateChecklist = useMutation({
    mutationFn: async (patch: Partial<Record<ChecklistKey, boolean>>) => {
      if (!actor) throw new Error("No actor");
      await actor.adminUpdateGateCChecklist(
        patch.testnetE2ePassed ?? null,
        patch.rollbackTestsPassed ?? null,
        patch.subaccountDesignReviewed ?? null,
        patch.betaCapsConfigured ?? null,
        null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gateCChecklist"] });
      queryClient.invalidateQueries({ queryKey: ["platformFlags"] });
    },
  });

  const enableMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!actor) throw new Error("No actor");
      return actor.adminSetTrustlessEscrowEnabled(
        enabled,
        enabled ? signOffRef.trim() : "",
      );
    },
    onSuccess: (res, enabled) => {
      if (res.__kind__ === "ok") {
        queryClient.invalidateQueries({ queryKey: ["gateCChecklist"] });
        queryClient.invalidateQueries({ queryKey: ["platformFlags"] });
        toast.success(
          enabled
            ? t("admin.trustlessEscrow.saved")
            : t("admin.trustlessEscrow.disabled"),
        );
      } else {
        toast.error(t("admin.trustlessEscrow.saveFailed"));
      }
    },
    onError: () => toast.error(t("admin.trustlessEscrow.saveFailed")),
  });

  const enabled = checklist?.trustlessEscrowEnabled ?? false;
  const canEnable =
    checklist?.checklistComplete && signOffRef.trim().length > 0;

  return (
    <section className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">
          {t("admin.trustlessEscrow.title")}
        </h3>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("admin.trustlessEscrow.hint")}
      </p>

      <div className="space-y-2 rounded-md border border-border/60 p-3">
        <p className="text-xs font-medium">
          {t("admin.trustlessEscrow.checklistTitle")}
        </p>
        {CHECKLIST_ITEMS.map(({ key, labelKey }) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <Label htmlFor={`gate-c-${key}`} className="text-xs font-normal">
              {t(labelKey as Parameters<typeof t>[0])}
            </Label>
            <Switch
              id={`gate-c-${key}`}
              checked={checklist?.[key] ?? false}
              disabled={isLoading || updateChecklist.isPending || enabled}
              onCheckedChange={(v) => updateChecklist.mutate({ [key]: v })}
            />
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          {t("admin.trustlessEscrow.betaCapLabel")}:{" "}
          {checklist ? Number(checklist.ckBetaCapUsdCents) / 100 : 500} USDT
        </p>
      </div>

      {!enabled && (
        <div className="space-y-2">
          <Label htmlFor="gate-c-signoff" className="text-xs">
            {t("admin.trustlessEscrow.signOffRef")}
          </Label>
          <Input
            id="gate-c-signoff"
            value={signOffRef}
            onChange={(e) => setSignOffRef(e.target.value)}
            placeholder={t("admin.trustlessEscrow.signOffPlaceholder")}
            className="text-sm"
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="trustless-escrow" className="text-sm">
          {t("admin.trustlessEscrow.enable")}
        </Label>
        <Switch
          id="trustless-escrow"
          checked={enabled}
          disabled={
            isLoading || enableMutation.isPending || (!enabled && !canEnable)
          }
          onCheckedChange={(v) => enableMutation.mutate(v)}
        />
      </div>

      {enabled && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {t("admin.trustlessEscrow.gateCWarning")}
        </p>
      )}

      {!enabled && checklist && !checklist.checklistComplete && (
        <p className="text-xs text-muted-foreground">
          {t("admin.trustlessEscrow.checklistIncomplete")}
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isLoading || enableMutation.isPending}
        onClick={() => {
          queryClient.invalidateQueries({ queryKey: ["gateCChecklist"] });
          queryClient.invalidateQueries({ queryKey: ["platformFlags"] });
        }}
      >
        {t("admin.trustlessEscrow.refresh")}
      </Button>
    </section>
  );
}
