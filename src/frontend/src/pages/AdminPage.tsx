import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ClipboardList,
  LayoutDashboard,
  ListOrdered,
  LogIn,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { UserRole } from "../backend.d";
import AuditLogTable from "../components/admin/AuditLogTable";
import DisputeQueueTable from "../components/admin/DisputeQueueTable";
import MetricsDashboard from "../components/admin/MetricsDashboard";
import Phase2MetricsPanel from "../components/admin/Phase2MetricsPanel";
import SystemSettingsForm from "../components/admin/SystemSettingsForm";
import UserManagementTable from "../components/admin/UserManagementTable";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/useAuth";
import { useBackend } from "../hooks/useBackend";
import { useLocale } from "../hooks/useLocale";
import type { TranslationKey } from "../i18n";

type AdminTab =
  | "overview"
  | "users"
  | "disputes"
  | "listings"
  | "audit"
  | "settings";

const TAB_LABEL_KEYS: Record<AdminTab, TranslationKey> = {
  overview: "admin.tab.overview",
  users: "admin.tab.users",
  disputes: "admin.tab.disputes",
  listings: "admin.tab.listings",
  audit: "admin.tab.audit",
  settings: "admin.tab.settings",
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const navigate = useNavigate();
  const { isAuthenticated, isInitializing, login } = useAuth();
  const { actor, isFetching } = useBackend();
  const { t } = useLocale();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["myProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyProfile();
    },
    enabled: !!actor && !isFetching,
  });

  useEffect(() => {
    if (isInitializing || profileLoading || isFetching) return;
    if (!isAuthenticated) return; // handled by auth gate below
    if (
      profile &&
      profile.role !== UserRole.admin &&
      profile.role !== UserRole.moderator
    ) {
      navigate({ to: "/" });
    }
  }, [
    isAuthenticated,
    isInitializing,
    profile,
    profileLoading,
    isFetching,
    navigate,
  ]);

  // Auth gate — unauthenticated users see login prompt
  if (!isAuthenticated && !isInitializing) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-16"
        data-ocid="admin-auth-gate"
      >
        <div className="max-w-sm w-full text-center space-y-5">
          <div className="mx-auto h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-display font-semibold text-foreground">
            Тільки для адміністраторів / Admins only
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.signInDesc")}
          </p>
          <Button
            data-ocid="btn-login-admin"
            onClick={login}
            className="w-full gap-2"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            {t("admin.signIn")}
          </Button>
        </div>
      </div>
    );
  }

  if (isInitializing || profileLoading || isFetching) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (
    !profile ||
    (profile.role !== UserRole.admin && profile.role !== UserRole.moderator)
  ) {
    return null;
  }

  const TABS: { id: AdminTab; icon: React.ReactNode }[] = [
    {
      id: "overview",
      icon: <LayoutDashboard className="h-4 w-4" aria-hidden="true" />,
    },
    { id: "users", icon: <Users className="h-4 w-4" aria-hidden="true" /> },
    {
      id: "disputes",
      icon: <AlertTriangle className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: "listings",
      icon: <ListOrdered className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: "audit",
      icon: <ClipboardList className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: "settings",
      icon: <Settings className="h-4 w-4" aria-hidden="true" />,
    },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <ShieldCheck className="h-5 w-5 text-accent" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {t("admin.panel.title")}
            </p>
            <p className="text-caption capitalize">{profile.role}</p>
          </div>
        </div>
        <nav
          className="flex-1 space-y-0.5 p-3"
          aria-label={t("admin.tab.nav.label")}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-ocid={`admin-nav-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                activeTab === tab.id
                  ? "bg-accent/15 text-accent"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.icon}
              {t(TAB_LABEL_KEYS[tab.id])}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-card px-1 py-2 md:hidden"
        aria-label={t("admin.tab.nav.label")}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            aria-label={t(TAB_LABEL_KEYS[tab.id])}
            aria-current={activeTab === tab.id ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded ${
              activeTab === tab.id ? "text-accent" : "text-muted-foreground"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">
              {t(TAB_LABEL_KEYS[tab.id])}
            </span>
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-background pb-20 md:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <TabContent tab={activeTab} userRole={profile.role} />
        </div>
      </main>
    </div>
  );
}

function TabContent({ tab, userRole }: { tab: AdminTab; userRole: UserRole }) {
  const { t } = useLocale();

  switch (tab) {
    case "overview":
      return (
        <div className="space-y-8">
          <MetricsDashboard />
          <Phase2MetricsPanel />
        </div>
      );
    case "users":
      return <UserManagementTable />;
    case "disputes":
      return <DisputeQueueTable />;
    case "listings":
      return <ListingsTab />;
    case "audit":
      return <AuditLogTable />;
    case "settings":
      return userRole === UserRole.admin ? (
        <SystemSettingsForm />
      ) : (
        <div className="rounded-md border border-border bg-card p-6 text-center text-muted-foreground">
          {t("admin.settings.adminOnly")}
        </div>
      );
    default:
      return null;
  }
}

function ListingsTab() {
  const { actor, isFetching } = useBackend();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["adminListings"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExpiredListings(0n, 50n);
    },
    enabled: !!actor && !isFetching,
  });

  const removeMutation = useMutation({
    mutationFn: async (listingId: bigint) => {
      if (!actor) throw new Error("Not ready");
      await actor.removeListingByAdmin(listingId, "Removed by admin");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminListings"] });
    },
  });

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        {t("admin.listings.title")}
      </h2>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton list
            <div key={i} className="h-14 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div
          data-ocid="listings-empty"
          className="rounded-md border border-dashed border-border p-12 text-center"
        >
          <ListOrdered
            className="mx-auto mb-3 h-10 w-10 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="font-medium text-foreground">
            {t("admin.listings.noFlagged")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("admin.listings.allClean")}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  {t("admin.listings.colTitle")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  {t("admin.listings.colSeller")}
                </th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">
                  {t("admin.listings.colPrice")}
                </th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">
                  {t("admin.listings.colActions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr
                  key={listing.id.toString()}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="max-w-[200px] truncate px-4 py-3 font-medium">
                    {listing.title}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {listing.sellerUsername}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {listing.priceAmount.toString()}{" "}
                    {String(listing.priceToken)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      data-ocid="admin-remove-listing"
                      disabled={removeMutation.isPending}
                      onClick={() => removeMutation.mutate(listing.id)}
                      aria-label={`${t("admin.listings.remove")} ${listing.title}`}
                      className="rounded px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                    >
                      {removeMutation.isPending
                        ? t("admin.listings.removing")
                        : t("admin.listings.remove")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
