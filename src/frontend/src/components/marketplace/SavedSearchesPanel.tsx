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
import {
  asEngagementActor,
  isResultErr,
  type SavedSearch,
} from "@/lib/engagementActor";
import type { FilterState } from "@/components/marketplace/FilterPanel";
import { filtersToListingsSearch } from "@/lib/listingsSearch";
import { createActor } from "@/backend";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Trash2 } from "lucide-react";
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
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const isAuthed =
    identity != null && !identity.getPrincipal().isAnonymous();

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
      const paramsJson = JSON.stringify(filtersToListingsSearch(filters, sort, query));
      const r = await a.saveSearch(name.trim(), paramsJson);
      if (isResultErr(r)) throw new Error("save failed");
    },
    onSuccess: () => {
      setName("");
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
      toast.success("Search saved");
    },
    onError: () => toast.error("Could not save search"),
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

  if (!isAuthed) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          <Bookmark className="h-3.5 w-3.5" />
          Saved searches
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>Saved searches</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="saved-search-name">Save current filters</Label>
            <div className="flex gap-2">
              <Input
                id="saved-search-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kyiv electronics"
                maxLength={80}
              />
              <Button
                type="button"
                disabled={!name.trim() || save.isPending}
                onClick={() => save.mutate()}
              >
                Save
              </Button>
            </div>
          </div>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {saved.map((s: SavedSearch) => (
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
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove.mutate(s.id)}
                  aria-label="Delete saved search"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
            {saved.length === 0 && (
              <p className="text-sm text-muted-foreground">No saved searches yet.</p>
            )}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
