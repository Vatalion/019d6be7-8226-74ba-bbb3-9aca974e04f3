import { Variant_all_seller_buyer } from "@/backend.d";
import type { JurorDashboardEntry, TradeId, TradeView } from "@/backend.d";
import { useBackend } from "@/hooks/useBackend";
import { useVisiblePolling } from "@/hooks/useVisiblePolling";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useLocale } from "../hooks/useLocale";
import { t as translate } from "../i18n";

// ── Constants ────────────────────────────────────────────────────────────────

const POLL_INTERVAL = 30_000; // 30 seconds
const PENDING_DEADLINE_MS = 24 * 60 * 60 * 1_000; // 24 hours
const FUNDED_DEADLINE_MS = 48 * 60 * 60 * 1_000; // 48 hours
const JURY_WARN_MS = 12 * 60 * 60 * 1_000; // 12 hours

// ── Context ───────────────────────────────────────────────────────────────────

interface NotificationContextValue {
  tradesRequiringAction: number;
  unreadMessages: number;
}

const NotificationContext = createContext<NotificationContextValue>({
  tradesRequiringAction: 0,
  unreadMessages: 0,
});

export function useNotifications(): NotificationContextValue {
  return useContext(NotificationContext);
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { actor, isFetching } = useBackend();
  const { isAuthenticated } = useAuth();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const { isVisible, justBecameVisible } = useVisiblePolling();

  // Track previous state between polls
  const prevTradeStatusRef = useRef<Map<string, string>>(new Map()); // tradeId → status
  const prevUnreadRef = useRef<Map<string, number>>(new Map()); // tradeId → count

  // Track which toast keys have already been shown this session
  const shownToastsRef = useRef<Set<string>>(new Set());

  const isEnabled = isAuthenticated && !!actor && !isFetching;

  // ── Poll: trades ─────────────────────────────────────────────────────────

  const { data: trades = [], refetch: refetchTrades } = useQuery<TradeView[]>({
    queryKey: ["myTrades", "notifications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyTrades(Variant_all_seller_buyer.all);
    },
    enabled: isEnabled,
    refetchInterval: isVisible ? POLL_INTERVAL : false,
  });

  // ── Poll: unread counts ───────────────────────────────────────────────────

  const { data: unreadCounts = [], refetch: refetchUnread } = useQuery<
    Array<[TradeId, bigint]>
  >({
    queryKey: ["unreadCount", "notifications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUnreadCount();
    },
    enabled: isEnabled,
    refetchInterval: isVisible ? POLL_INTERVAL : false,
  });

  // ── Poll: juror dashboard ─────────────────────────────────────────────────

  const { data: jurorCases = [], refetch: refetchJuror } = useQuery<
    JurorDashboardEntry[]
  >({
    queryKey: ["jurorDashboard", "notifications"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getJurorDashboard();
      } catch {
        return [];
      }
    },
    enabled: isEnabled,
    refetchInterval: isVisible ? POLL_INTERVAL : false,
  });

  // ── Catch up when tab becomes visible after > 30s hidden ──────────────────

  useEffect(() => {
    if (justBecameVisible && isEnabled) {
      void refetchTrades();
      void refetchUnread();
      void refetchJuror();
    }
  }, [
    justBecameVisible,
    isEnabled,
    refetchTrades,
    refetchUnread,
    refetchJuror,
  ]);

  // ── Helper: fire toast with trade navigation ──────────────────────────────

  const showToast = useCallback(
    (
      type: "success" | "info" | "warning" | "error",
      message: string,
      tradeId: string,
      toastKey: string,
    ) => {
      if (shownToastsRef.current.has(toastKey)) return;
      shownToastsRef.current.add(toastKey);

      const action = {
        label: translate(locale, "toast.view_trade"),
        onClick: () => navigate({ to: "/trades/$id", params: { id: tradeId } }),
      };

      switch (type) {
        case "success":
          toast.success(message, { action, duration: 5000 });
          break;
        case "warning":
          toast.warning(message, { action, duration: 6000 });
          break;
        case "error":
          toast.error(message, { action, duration: 7000 });
          break;
        default:
          toast.info(message, { action, duration: 5000 });
      }
    },
    [locale, navigate],
  );

  // ── Detect trade status changes ───────────────────────────────────────────

  useEffect(() => {
    if (!trades.length) return;

    const now = Date.now();

    for (const trade of trades) {
      const id = trade.id.toString();
      const status = trade.status;
      const prev = prevTradeStatusRef.current.get(id);

      // Status change detection — only fire for known transitions
      if (prev !== undefined && prev !== status) {
        const toastKey = `${id}:${prev}->${status}`;

        if (prev === "pending" && status === "funded") {
          showToast(
            "success",
            `${translate(locale, "notification.trade_funded")} #${id}`,
            id,
            toastKey,
          );
        } else if (prev === "funded" && status === "buyer_confirmed") {
          showToast(
            "info",
            `${translate(locale, "notification.buyer_confirmed")} #${id}`,
            id,
            toastKey,
          );
        } else if (
          prev === "buyer_confirmed" &&
          status === "payment_verified"
        ) {
          showToast(
            "success",
            `${translate(locale, "notification.payment_verified")} #${id}`,
            id,
            toastKey,
          );
        } else if (prev === "payment_verified" && status === "complete") {
          showToast(
            "success",
            `${translate(locale, "notification.trade_complete")} #${id}`,
            id,
            toastKey,
          );
        } else if (status === "disputed") {
          showToast(
            "warning",
            `${translate(locale, "notification.trade_disputed")} #${id}`,
            id,
            toastKey,
          );
        } else if (status === "refunded") {
          showToast(
            "info",
            `${translate(locale, "notification.trade_refunded")} #${id}`,
            id,
            toastKey,
          );
        }
      }

      // Update previous status
      prevTradeStatusRef.current.set(id, status);

      // Deadline warnings — gate with shown set to avoid repeats each session
      const createdAt = Number(trade.createdAt) / 1_000_000; // ns → ms
      const ageMs = now - createdAt;

      if (status === "pending" && ageMs > PENDING_DEADLINE_MS) {
        const key = `deadline:${id}:pending_24h`;
        showToast(
          "warning",
          `${translate(locale, "notification.deadline_pending_24h")} #${id}`,
          id,
          key,
        );
      }

      if (status === "funded" && ageMs > FUNDED_DEADLINE_MS) {
        const key = `deadline:${id}:funded_48h`;
        showToast(
          "warning",
          `${translate(locale, "notification.deadline_funded_48h")} #${id}`,
          id,
          key,
        );
      }
    }
  }, [trades, locale, showToast]);

  // ── Detect unread message changes ─────────────────────────────────────────

  useEffect(() => {
    if (!unreadCounts.length) return;

    for (const [tradeId, count] of unreadCounts) {
      const id = tradeId.toString();
      const current = Number(count);
      const prev = prevUnreadRef.current.get(id) ?? 0;

      if (current > prev) {
        const toastKey = `msg:${id}:${current}`;
        showToast(
          "info",
          `${translate(locale, "notification.new_message")} #${id}`,
          id,
          toastKey,
        );
      }

      prevUnreadRef.current.set(id, current);
    }
  }, [unreadCounts, locale, showToast]);

  // ── Juror deadline warnings ───────────────────────────────────────────────

  useEffect(() => {
    if (!jurorCases.length) return;

    const now = Date.now();

    for (const jurorCase of jurorCases) {
      if (jurorCase.hasVoted) continue;

      const deadlineMs = Number(jurorCase.deadline) / 1_000_000; // ns → ms
      const timeLeft = deadlineMs - now;

      if (timeLeft > 0 && timeLeft < JURY_WARN_MS) {
        const id = jurorCase.tradeId.toString();
        const key = `deadline:${id}:jury_12h`;
        showToast(
          "error",
          `${translate(locale, "notification.deadline_jury_12h")} #${id}`,
          id,
          key,
        );
      }
    }
  }, [jurorCases, locale, showToast]);

  // ── Derived counts ────────────────────────────────────────────────────────

  const tradesRequiringAction = trades.filter(
    (tr) =>
      tr.status === "pending" ||
      tr.status === "funded" ||
      tr.status === "buyer_confirmed",
  ).length;

  const unreadMessages = unreadCounts.reduce(
    (sum, [, count]) => sum + Number(count),
    0,
  );

  return (
    <NotificationContext.Provider
      value={{ tradesRequiringAction, unreadMessages }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
