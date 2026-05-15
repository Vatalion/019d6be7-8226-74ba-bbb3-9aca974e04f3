import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  ShieldPlus,
  UserX,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../../backend.d";
import { TrustLevel, UserRole } from "../../backend.d";
import { useBackend } from "../../hooks/useBackend";
import { useLocale } from "../../hooks/useLocale";
import { formatPrincipal, formatTimestamp } from "../../lib/format";

const PAGE_SIZE = 20n;

type ModalAction = "suspend" | "ban" | "promote" | null;

function RoleBadge({ role }: { role: UserRole }) {
  const map: Record<UserRole, string> = {
    [UserRole.admin]: "bg-accent/20 text-accent border-accent/30",
    [UserRole.moderator]: "bg-primary/20 text-primary border-primary/30",
    [UserRole.user]: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${map[role]}`}
    >
      {role}
    </span>
  );
}

function TrustBadgeCell({ level }: { level: TrustLevel }) {
  const { t } = useLocale();
  const cls =
    level === TrustLevel.gold
      ? "badge-tier-gold"
      : level === TrustLevel.silver
        ? "badge-tier-silver"
        : level === TrustLevel.bronze
          ? "badge-tier-bronze"
          : "badge-tier-new";

  const label =
    level === TrustLevel.gold
      ? t("trust.tier.gold")
      : level === TrustLevel.silver
        ? t("trust.tier.silver")
        : level === TrustLevel.bronze
          ? t("trust.tier.bronze")
          : t("trust.tier.new");

  return <span className={cls}>{label}</span>;
}

export default function UserManagementTable() {
  const [page, setPage] = useState(0n);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [modalAction, setModalAction] = useState<ModalAction>(null);
  const [suspendDays, setSuspendDays] = useState("7");
  const [actionReason, setActionReason] = useState("");

  const { actor, isFetching } = useBackend();
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["adminUsers", page.toString()],
    queryFn: async () => {
      if (!actor)
        return { items: [], totalCount: 0n, page: 0n, pageSize: PAGE_SIZE };
      return actor.getAllUsers(page, PAGE_SIZE, {});
    },
    enabled: !!actor && !isFetching,
  });

  const banMutation = useMutation({
    mutationFn: async ({
      userId,
      reason,
    }: { userId: UserProfile["id"]; reason: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.banUser(userId, reason);
    },
    onSuccess: () => {
      toast.success(t("admin.users.banned"));
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      closeModal();
    },
    onError: () => toast.error(t("admin.users.banFailed")),
  });

  const suspendMutation = useMutation({
    mutationFn: async ({
      userId,
      days,
      reason,
    }: { userId: UserProfile["id"]; days: number; reason: string }) => {
      if (!actor) throw new Error("No actor");
      const until = BigInt(Date.now() + days * 86_400_000) * 1_000_000n;
      return actor.suspendUser(userId, until, reason);
    },
    onSuccess: () => {
      toast.success(t("admin.users.suspended"));
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      closeModal();
    },
    onError: () => toast.error(t("admin.users.suspendFailed")),
  });

  const promoteMutation = useMutation({
    mutationFn: async (userId: UserProfile["id"]) => {
      if (!actor) throw new Error("No actor");
      return actor.promoteToModerator(userId);
    },
    onSuccess: () => {
      toast.success(t("admin.users.promoted"));
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      closeModal();
    },
    onError: () => toast.error(t("admin.users.promoteFailed")),
  });

  const users = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0n;
  const totalPages =
    totalCount === 0n ? 1n : (totalCount + PAGE_SIZE - 1n) / PAGE_SIZE;

  function openAction(user: UserProfile, action: ModalAction) {
    setSelectedUser(user);
    setModalAction(action);
    setActionReason("");
    setSuspendDays("7");
  }

  function closeModal() {
    setSelectedUser(null);
    setModalAction(null);
  }

  function handleConfirm() {
    if (!selectedUser) return;
    if (modalAction === "ban") {
      banMutation.mutate({ userId: selectedUser.id, reason: actionReason });
    } else if (modalAction === "suspend") {
      suspendMutation.mutate({
        userId: selectedUser.id,
        days: Number(suspendDays),
        reason: actionReason,
      });
    } else if (modalAction === "promote") {
      promoteMutation.mutate(selectedUser.id);
    }
  }

  const isPending =
    banMutation.isPending ||
    suspendMutation.isPending ||
    promoteMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">
          {t("admin.users.title")}
        </h2>
        {!isLoading && (
          <Badge variant="secondary" className="ml-2 font-mono">
            {totalCount.toString()}
          </Badge>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }, (_, i) => `sk-${i}`).map((k) => (
              <Skeleton key={k} className="h-12 w-full" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div
            data-ocid="users-empty"
            className="p-12 text-center text-muted-foreground"
          >
            <UserX className="mx-auto mb-3 h-10 w-10" />
            <p>{t("admin.users.empty")}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  {t("admin.users.col.principal")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  {t("admin.users.col.username")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  {t("admin.users.col.role")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  {t("admin.users.col.trust")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  {t("admin.users.col.status")}
                </th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">
                  {t("admin.users.col.score")}
                </th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">
                  {t("admin.users.col.registered")}
                </th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">
                  {t("admin.users.col.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id.toString()}
                  data-ocid="admin-user-row"
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {formatPrincipal(user.id)}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {user.username || (
                      <span className="text-muted-foreground italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3">
                    <TrustBadgeCell level={user.trustLevel} />
                  </td>
                  <td className="px-4 py-3">
                    {user.isBanned ? (
                      <span className="status-badge-dispute">
                        {t("admin.users.status.banned")}
                      </span>
                    ) : user.suspendedUntil &&
                      user.suspendedUntil > BigInt(Date.now()) * 1_000_000n ? (
                      <span className="status-badge-funded">
                        {t("admin.users.status.suspended")}
                      </span>
                    ) : (
                      <span className="status-badge-confirmed">
                        {t("admin.users.status.active")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">
                    {user.reputationScore.toString()}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatTimestamp(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        data-ocid="user-action-suspend"
                        onClick={() => openAction(user, "suspend")}
                        className="rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        {t("admin.users.action.suspend")}
                      </button>
                      <button
                        type="button"
                        data-ocid="user-action-ban"
                        onClick={() => openAction(user, "ban")}
                        className="rounded px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        {t("admin.users.action.ban")}
                      </button>
                      {user.role === UserRole.user && (
                        <button
                          type="button"
                          data-ocid="user-action-promote"
                          onClick={() => openAction(user, "promote")}
                          className="rounded px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                        >
                          <ShieldPlus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("admin.users.page")} {(page / PAGE_SIZE + 1n).toString()}{" "}
          {t("admin.users.of")} {totalPages.toString()}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0n}
            onClick={() => setPage((p) => p - PAGE_SIZE)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page + PAGE_SIZE >= totalCount}
            onClick={() => setPage((p) => p + PAGE_SIZE)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Action modal */}
      <Dialog open={!!selectedUser && !!modalAction} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modalAction === "ban"
                ? t("admin.users.modal.ban")
                : modalAction === "suspend"
                  ? t("admin.users.modal.suspend")
                  : t("admin.users.modal.promote")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedUser && (
              <p className="text-sm text-muted-foreground">
                {t("admin.users.modal.user")}{" "}
                <span className="font-mono text-foreground">
                  {formatPrincipal(selectedUser.id)}
                </span>
                {selectedUser.username && <> ({selectedUser.username})</>}
              </p>
            )}
            {modalAction === "suspend" && (
              <div>
                <Label htmlFor="suspend-days">
                  {t("admin.users.modal.suspendDays")}
                </Label>
                <Input
                  id="suspend-days"
                  data-ocid="suspend-days-input"
                  type="number"
                  min="1"
                  max="365"
                  value={suspendDays}
                  onChange={(e) => setSuspendDays(e.target.value)}
                  className="mt-1 w-32"
                />
              </div>
            )}
            {(modalAction === "ban" || modalAction === "suspend") && (
              <div>
                <Label htmlFor="action-reason">
                  {t("admin.users.modal.reason")}
                </Label>
                <Input
                  id="action-reason"
                  data-ocid="action-reason-input"
                  placeholder={t("admin.users.modal.reasonPlaceholder")}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
            {modalAction === "promote" && (
              <p className="text-sm text-muted-foreground">
                {t("admin.users.modal.promoteDesc")}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              {t("admin.users.modal.cancel")}
            </Button>
            <Button
              data-ocid="action-confirm-btn"
              variant={modalAction === "ban" ? "destructive" : "default"}
              disabled={
                isPending ||
                ((modalAction === "ban" || modalAction === "suspend") &&
                  !actionReason.trim())
              }
              onClick={handleConfirm}
            >
              {isPending
                ? t("admin.users.modal.processing")
                : t("admin.users.modal.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
