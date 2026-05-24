import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Coins,
  CreditCard,
  Heart,
  LayoutDashboard,
  ListPlus,
  LogIn,
  LogOut,
  PackageSearch,
  RefreshCw,
  Scale,
  ShieldCheck,
  User,
  Vote,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNotifications } from "../../contexts/NotificationContext";
import { useAuth } from "../../hooks/useAuth";
import { useBackend } from "../../hooks/useBackend";
import { useLocale } from "../../hooks/useLocale";
import type { TranslationKey } from "../../i18n";
import { formatPrincipal } from "../../lib/format";
import { LanguageSwitcher } from "../shared/LanguageSwitcher";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

const NAV_ITEMS: {
  to: string;
  labelKey: TranslationKey;
  ocid: string;
  icon: React.ElementType;
}[] = [
  {
    to: "/listings",
    labelKey: "nav.browse",
    ocid: "nav-browse",
    icon: PackageSearch,
  },
  {
    to: "/trades",
    labelKey: "nav.myTrades",
    ocid: "nav-my-trades",
    icon: ArrowLeftRight,
  },
  {
    to: "/listings/create",
    labelKey: "nav.sell",
    ocid: "nav-sell",
    icon: ListPlus,
  },
];

// Auth-only nav items (sidebar only)
const AUTH_NAV_ITEMS: {
  to: string;
  labelKey: TranslationKey;
  ocid: string;
  icon: React.ElementType;
}[] = [
  {
    to: "/favorites",
    labelKey: "nav.favorites",
    ocid: "nav-favorites",
    icon: Heart,
  },
  {
    to: "/jurors",
    labelKey: "nav.jurors",
    ocid: "nav-jurors",
    icon: Scale,
  },
  {
    to: "/governance",
    labelKey: "nav.governance",
    ocid: "nav-governance",
    icon: Vote,
  },
  {
    to: "/vault",
    labelKey: "nav.vault",
    ocid: "nav-vault",
    icon: Coins,
  },
  {
    to: "/add-payment-method",
    labelKey: "nav.paymentMethods",
    ocid: "nav-payment-methods",
    icon: CreditCard,
  },
];

/** Formats a balance value (in USD cents bigint) as "$X.XX" */
function formatBalance(cents: bigint): string {
  const dollars = Number(cents) / 100;
  return `$${dollars.toFixed(2)}`;
}

/** Fetches the sum of ckUSDC + ckUSDT from getDashboardMetrics (totalVolume proxy) */
function useStablecoinBalance() {
  const { actor, isFetching } = useBackend();
  const { isAuthenticated } = useAuth();
  const [balance, setBalance] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!actor || isFetching || !isAuthenticated) return;
    setLoading(true);
    setError(false);
    try {
      const metrics = await actor.getDashboardMetrics();
      const cents = BigInt(Math.round(metrics.totalVolume * 100));
      setBalance(cents);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [actor, isFetching, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setBalance(null);
      setError(false);
      return;
    }
    fetchBalance();
    intervalRef.current = setInterval(fetchBalance, 120_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchBalance, isAuthenticated]);

  return { balance, loading, error, refresh: fetchBalance };
}

/** Inline balance chip — desktop header only */
function BalanceChip() {
  const { t } = useLocale();
  const { balance, loading, error, refresh } = useStablecoinBalance();

  if (loading && balance === null) {
    return (
      <Skeleton
        className="h-7 w-24 rounded-full"
        aria-label={t("header.balance.loading")}
        data-ocid="header-balance-skeleton"
      />
    );
  }

  if (error && balance === null) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-1.5 bg-accent/10 border border-accent/25 rounded-full px-3 py-1 text-xs font-mono font-medium text-accent"
      data-ocid="header-balance-chip"
    >
      <Coins className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        {t("header.balance")}:{" "}
        {loading
          ? t("header.balance.refreshing")
          : balance !== null
            ? formatBalance(balance)
            : "—"}
      </span>
      <button
        type="button"
        onClick={refresh}
        disabled={loading}
        aria-label={
          loading ? t("header.balance.refreshing") : t("header.balance.refresh")
        }
        className="ml-0.5 opacity-60 hover:opacity-100 disabled:opacity-30 transition-smooth focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-full"
        data-ocid="header-balance-refresh"
      >
        <RefreshCw
          className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

/** Compact badge pill for navigation counters */
function NavBadge({
  count,
  ariaLabel,
}: {
  count: number;
  ariaLabel: string;
}) {
  if (count <= 0) return null;
  return (
    <span
      className="ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-bold leading-none text-white bg-destructive rounded-full"
      aria-label={ariaLabel}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

export default function Layout() {
  const {
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    principal,
    login,
    logout,
  } = useAuth();
  const { t } = useLocale();
  const location = useLocation();
  const { tradesRequiringAction, unreadMessages } = useNotifications();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);
  const isAdminRoute = isActive("/admin");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Skip to content (WCAG) ────────────────────────── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-md focus:bg-accent focus:text-accent-foreground focus:font-medium focus:text-sm focus:shadow-lg"
        data-ocid="skip-to-content"
      >
        {t("nav.skipToContent")}
      </a>

      {/* ── Sidebar (desktop) ─────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-60 bg-card border-r border-border shrink-0"
        data-ocid="sidebar-nav"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
            <ShieldCheck
              className="h-4 w-4 text-accent-foreground"
              aria-hidden="true"
            />
          </div>
          <Link
            to="/"
            className="font-display font-semibold text-foreground text-lg tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            P2P Market
          </Link>
        </div>

        {/* Nav links */}
        <nav
          className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map(({ to, labelKey, ocid, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              data-ocid={ocid}
              aria-current={isActive(to) ? "page" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isActive(to)
                  ? "bg-accent/15 text-accent"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t(labelKey)}
              {to === "/trades" && (
                <NavBadge
                  count={tradesRequiringAction}
                  ariaLabel={`${tradesRequiringAction} ${t("nav.badge_trades_action")}`}
                />
              )}
            </Link>
          ))}
          {isAuthenticated && (
            <>
              {AUTH_NAV_ITEMS.map(({ to, labelKey, ocid, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  data-ocid={ocid}
                  aria-current={isActive(to) ? "page" : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isActive(to)
                      ? "bg-accent/15 text-accent"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t(labelKey)}
                </Link>
              ))}
              <Link
                to="/admin"
                data-ocid="nav-admin"
                aria-current={isActive("/admin") ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isActive("/admin")
                    ? "bg-accent/15 text-accent"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <LayoutDashboard
                  className="h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                {t("nav.admin")}
              </Link>
            </>
          )}
        </nav>

        {/* Language switcher */}
        <div className="border-t border-border px-3 py-2">
          <LanguageSwitcher />
        </div>

        {/* Identity / Auth */}
        <div className="border-t border-border px-3 py-4 space-y-2">
          {isAuthenticated && principal ? (
            <>
              <Link
                to="/profile/$id"
                params={{ id: principal.toText() }}
                data-ocid="nav-profile"
                className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-muted transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <div className="relative h-8 w-8 shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" aria-hidden="true" />
                  </div>
                  {unreadMessages > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[1rem] h-4 px-1 text-[10px] font-bold leading-none text-white bg-destructive rounded-full"
                      aria-label={`${unreadMessages} ${t("nav.badge_unread_messages")}`}
                    >
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {t("nav.profile")}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">
                    {formatPrincipal(principal)}
                  </p>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                onClick={logout}
                data-ocid="btn-logout"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {t("nav.signOut")}
              </Button>
            </>
          ) : (
            <Button
              className="w-full gap-2 button-primary"
              onClick={login}
              disabled={isInitializing || isLoggingIn}
              data-ocid="btn-login"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {isLoggingIn ? t("nav.connecting") : t("nav.connect")}
            </Button>
          )}
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-3 md:px-6 h-14 bg-card border-b border-border shrink-0"
          data-ocid="top-header"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center">
              <ShieldCheck
                className="h-3.5 w-3.5 text-accent-foreground"
                aria-hidden="true"
              />
            </div>
            <Link
              to="/"
              className="font-display font-semibold text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              P2P Market
            </Link>
          </div>

          {/* Desktop: balance + language switcher */}
          <div className="hidden md:flex flex-1 items-center justify-end gap-3">
            {isAuthenticated && <BalanceChip />}
            <LanguageSwitcher />
          </div>

          {/* Mobile: right side — language + auth */}
          <div className="flex items-center gap-1 md:hidden">
            <LanguageSwitcher compact />
            {isAuthenticated ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                aria-label={t("nav.signOut")}
                data-ocid="btn-logout-mobile"
                className="h-8 w-8"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={login}
                disabled={isInitializing || isLoggingIn}
                data-ocid="btn-login-mobile"
                className="button-primary h-8 px-3 text-xs"
              >
                <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="ml-1">
                  {isLoggingIn ? t("nav.connecting") : t("nav.connect")}
                </span>
              </Button>
            )}
          </div>
        </header>

        {/* Page content — pb-16 on mobile to clear bottom nav */}
        <main
          id="main-content"
          className={`flex-1 overflow-y-auto bg-background md:pb-0 ${
            isAdminRoute ? "pb-0" : "pb-16"
          }`}
          data-ocid="main-content"
          tabIndex={-1}
        >
          <Outlet />
        </main>

        {/* Footer — hidden on mobile (bottom nav takes that space) */}
        <footer className="hidden md:block bg-card border-t border-border px-4 py-3 text-center shrink-0">
          <p className="text-xs text-muted-foreground">
            <Link
              to="/"
              hash="how-payments-work"
              className="text-accent hover:underline mr-3"
              data-ocid="footer-how-payments"
            >
              {t("paymentsGuide.learnMore")}
            </Link>
            <Link
              to="/privacy"
              className="text-accent hover:underline mr-3"
              data-ocid="footer-privacy"
            >
              {t("footer.privacy")}
            </Link>
            <Link
              to="/privacy"
              className="text-accent hover:underline mr-3"
              data-ocid="footer-privacy"
            >
              {t("footer.privacy")}
            </Link>
            © {new Date().getFullYear()}. {t("footer.builtWith")}{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== "undefined" ? window.location.hostname : "",
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>

      {/* ── Bottom nav (mobile) — 4 items: Browse, Trades, Sell, Profile ─── */}
      {!isAdminRoute && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 flex items-stretch justify-around"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          data-ocid="bottom-nav"
          aria-label="Mobile navigation"
        >
          {/* Browse */}
          <Link
            to="/listings"
            data-ocid="bottom-nav-browse"
            aria-current={isActive("/listings") ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[52px] text-[10px] font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isActive("/listings") && !isActive("/listings/create")
                ? "text-accent"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <PackageSearch className="h-5 w-5" aria-hidden="true" />
            <span>{t("nav.browse")}</span>
          </Link>

          {/* Trades */}
          <Link
            to="/trades"
            data-ocid="bottom-nav-trades"
            aria-current={isActive("/trades") ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[52px] text-[10px] font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isActive("/trades")
                ? "text-accent"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="relative">
              <ArrowLeftRight className="h-5 w-5" aria-hidden="true" />
              {tradesRequiringAction > 0 && (
                <span
                  className="absolute -top-1.5 -right-2 inline-flex items-center justify-center min-w-[1rem] h-4 px-1 text-[10px] font-bold leading-none text-white bg-destructive rounded-full"
                  aria-label={`${tradesRequiringAction} ${t("nav.badge_trades_action")}`}
                >
                  {tradesRequiringAction > 9 ? "9+" : tradesRequiringAction}
                </span>
              )}
            </div>
            <span>{t("nav.myTrades")}</span>
          </Link>

          {/* Sell — prominent center button */}
          <Link
            to="/listings/create"
            data-ocid="bottom-nav-sell"
            aria-current={isActive("/listings/create") ? "page" : undefined}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div
              className={`flex items-center justify-center w-9 h-9 rounded-full transition-smooth ${
                isActive("/listings/create")
                  ? "bg-accent text-accent-foreground"
                  : "bg-accent/15 text-accent hover:bg-accent/25"
              }`}
            >
              <ListPlus className="h-5 w-5" aria-hidden="true" />
            </div>
            <span
              className={`text-[10px] font-medium ${
                isActive("/listings/create")
                  ? "text-accent"
                  : "text-muted-foreground"
              }`}
            >
              {t("nav.sell")}
            </span>
          </Link>

          {/* Profile (or Login) */}
          {isAuthenticated && principal ? (
            <Link
              to="/profile/$id"
              params={{ id: principal.toText() }}
              data-ocid="bottom-nav-profile"
              aria-current={isActive("/profile") ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[52px] text-[10px] font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isActive("/profile")
                  ? "text-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <User className="h-5 w-5" aria-hidden="true" />
                {unreadMessages > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 inline-flex items-center justify-center min-w-[1rem] h-4 px-1 text-[10px] font-bold leading-none text-white bg-destructive rounded-full"
                    aria-label={`${unreadMessages} ${t("nav.badge_unread_messages")}`}
                  >
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </div>
              <span>{t("nav.profile")}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={login}
              disabled={isInitializing || isLoggingIn}
              data-ocid="bottom-nav-login"
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[52px] text-[10px] font-medium text-muted-foreground hover:text-foreground transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
            >
              <LogIn className="h-5 w-5" aria-hidden="true" />
              <span>
                {isLoggingIn ? t("nav.connecting") : t("nav.connect")}
              </span>
            </button>
          )}
        </nav>
      )}
    </div>
  );
}
