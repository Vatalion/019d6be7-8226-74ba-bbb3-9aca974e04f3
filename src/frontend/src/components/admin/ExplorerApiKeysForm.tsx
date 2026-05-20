import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useBackend } from "../../hooks/useBackend";
import { useLocale } from "../../hooks/useLocale";
import type { TranslationKey } from "../../i18n";

type KeyField = "tronGrid" | "bscScan" | "infura";

export default function ExplorerApiKeysForm() {
  const { actor, isFetching } = useBackend();
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState<Record<KeyField, string>>({
    tronGrid: "",
    bscScan: "",
    infura: "",
  });

  const { data: status, isLoading, isError: statusQueryFailed } = useQuery({
    queryKey: ["explorerApiKeyStatus"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getExplorerApiKeyStatus();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });

  const saveMutation = useMutation({
    mutationFn: async (field: KeyField) => {
      if (!actor) throw new Error("No actor");
      const value = draft[field].trim();
      if (!value) throw new Error("empty");
      switch (field) {
        case "tronGrid":
          return actor.setTronGridApiKey(value);
        case "bscScan":
          return actor.setBscScanApiKey(value);
        case "infura":
          return actor.setInfuraApiKey(value);
      }
    },
    onSuccess: (_data, field) => {
      toast.success(t("admin.explorerKeys.saved"));
      setDraft((prev) => ({ ...prev, [field]: "" }));
      queryClient.invalidateQueries({ queryKey: ["explorerApiKeyStatus"] });
    },
    onError: () => toast.error(t("admin.explorerKeys.saveFailed")),
  });

  const fields: {
    id: KeyField;
    labelKey: TranslationKey;
    hintKey: TranslationKey;
    ocid: string;
    configured?: boolean;
  }[] = [
    {
      id: "tronGrid",
      labelKey: "admin.explorerKeys.tronGrid",
      hintKey: "admin.explorerKeys.tronGridHint",
      ocid: "explorer-key-trongrid",
      configured: status?.tronGridConfigured,
    },
    {
      id: "bscScan",
      labelKey: "admin.explorerKeys.bscScan",
      hintKey: "admin.explorerKeys.bscScanHint",
      ocid: "explorer-key-bscscan",
      configured: status?.bscScanConfigured,
    },
    {
      id: "infura",
      labelKey: "admin.explorerKeys.infura",
      hintKey: "admin.explorerKeys.infuraHint",
      ocid: "explorer-key-infura",
      configured: status?.infuraConfigured,
    },
  ];

  return (
    <div
      className="rounded-lg border border-border bg-card p-6 space-y-4"
      data-ocid="explorer-api-keys-panel"
    >
      <ExplorerKeysHeader title={t("admin.explorerKeys.title")} />
      <p className="text-xs text-muted-foreground leading-relaxed">
        {t("admin.explorerKeys.intro")}
      </p>
      {statusQueryFailed ? (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {t("admin.explorerKeys.statusPendingDeploy")}
        </p>
      ) : null}

      {isLoading ? (
        <ExplorerKeysSkeletonList />
      ) : (
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2" data-ocid={field.ocid}>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`key-${field.id}`}>{t(field.labelKey)}</Label>
                <span
                  className={`text-xs font-medium ${
                    field.configured
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                  data-ocid={`${field.ocid}-status`}
                >
                  {field.configured
                    ? t("admin.explorerKeys.configured")
                    : t("admin.explorerKeys.notConfigured")}
                </span>
              </div>
              <p className="text-caption">{t(field.hintKey)}</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id={`key-${field.id}`}
                  type="password"
                  autoComplete="off"
                  placeholder={t("admin.explorerKeys.placeholder")}
                  value={draft[field.id]}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      [field.id]: e.target.value,
                    }))
                  }
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={
                    saveMutation.isPending || !draft[field.id].trim()
                  }
                  onClick={() => saveMutation.mutate(field.id)}
                  data-ocid={`${field.ocid}-save`}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saveMutation.isPending
                    ? t("admin.explorerKeys.saving")
                    : t("admin.explorerKeys.save")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExplorerKeysHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2">
      <KeyRound className="h-5 w-5 text-accent" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  );
}

function ExplorerKeysSkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
