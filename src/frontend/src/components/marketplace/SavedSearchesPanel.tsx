import { createActor } from "@/backend";
import type { FilterState } from "@/components/marketplace/FilterPanel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLocale } from "@/hooks/useLocale";
import { t } from "@/i18n";
import {
  type SavedSearch,
  asEngagementActor,
  isResultErr,
} from "@/lib/engagementActor";
import { filtersToListingsSearch } from "@/lib/listingsSearch";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Bookmark, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  filters: FilterState;
  sort: import("@/lib/listingsSearch").SortKey;
  query: string;
  onApply: (paramsJson: string) => void;
};

export function SavedSearchesPanel({ filters, sort, query, onApply }: Props) {
  const { actor } = useActor(createActor);
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const isAuthed = identity != null && !identity.getPrincipal().isAnonymous();

  const { data: saved = [] } = useQuery({
    queryKey: ["saved-searches"],
    enabled: isAuthed && open && actor != null,
    queryFn: async () => {
      const a = asEngagementActor(actor);
      if (!a.getSavedSearches) return [];
      return a.getSavedSearches();
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const a = asEngagementActor(actor);
      if (!a.saveSearch) throw new Error("Saved searches not available");
      const paramsJson = JSON.stringify(
        filtersToListingsSearch(filters, sort, query),
      );
      const r = await a.saveSearch(name.trim(), paramsJson);
      if (isResultErr(r)) throw new Error("save failed");
    },
    onSuccess: () => {
      setName("");
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
      toast.success(t(locale, "savedSearch.saved"));
    },
    onError: () => toast.error(t(locale, "savedSearch.saveError")),
  });

  const remove = useMutation({
    mutationFn: async (id: bigint) => {
      const a = asEngagementActor(actor);
      if (!a.deleteSavedSearch) throw new Error("Not available");
      const r = await a.deleteSavedSearch(id);
      if (isResultErr(r)) throw new Error("delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
    },
  });

  const toggleAlerts = useMutation({
    mutationFn: async ({ id, enabled }: { id: bigint; enabled: boolean }) => {
      const a = asEngagementActor(actor);
      if (!a.setSavedSearchAlerts) throw new Error("Alerts not available");
      const r = await a.setSavedSearchAlerts(id, enabled);
      if (isResultErr(r)) throw new Error("toggle failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
    },
    onError: () => toast.error(t(locale, "savedSearch.alertToggleError")),
  });

  if (!isAuthed) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          <Bookmark className="h-3.5 w-3.5" />
          {t(locale, "savedSearch.title")}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>{t(locale, "savedSearch.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="saved-search-name">
              {t(locale, "savedSearch.saveCurrent")}
            </Label>
            <div className="flex gap-2">
              <Input
                id="saved-search-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t(locale, "savedSearch.namePlaceholder")}
                maxLength={80}
              />
              <Button
                type="button"
                disabled={!name.trim() || save.isPending}
                onClick={() => save.mutate()}
              >
                {t(locale, "savedSearch.saveButton")}
              </Button>
            </div>
          </div>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {saved.map((s: SavedSearch) => {
              const alertsSwitchId = `saved-search-alerts-${String(s.id)}`;
              return (
                <li
                  key={String(s.id)}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                >
                  <button
                    type="button"
                    className="text-sm font-medium text-left flex-1 hover:underline"
                    onClick={() => {
                      onApply(s.paramsJson);
                      setOpen(false);
                    }}
                  >
                    {s.name}
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <Label
                      htmlFor={alertsSwitchId}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                      title={t(locale, "savedSearch.alertsLabel")}
                    >
                      <Bell className="h-3.5 w-3.5" />
                      <span className="sr-only">
                        {t(locale, "savedSearch.alertsLabel")}
                      </span>
                    </Label>
                    <Switch
                      id={alertsSwitchId}
                      checked={s.alertsEnabled}
                      disabled={toggleAlerts.isPending}
                      onCheckedChange={(enabled) =>
                        toggleAlerts.mutate({ id: s.id, enabled })
                      }
                      aria-label={t(locale, "savedSearch.alertsLabel")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove.mutate(s.id)}
                      aria-label={t(locale, "savedSearch.delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
            {saved.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t(locale, "savedSearch.empty")}
              </p>
            )}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
