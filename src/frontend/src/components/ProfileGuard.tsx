import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createActor } from "../backend";
import { useAuth } from "../hooks/useAuth";

interface ProfileGuardProps {
  children: React.ReactNode;
}

/**
 * ProfileGuard — wraps routes that require a completed profile.
 *
 * Logic:
 * - Not authenticated → render children as-is (each page handles its own auth gate).
 * - Authenticated + profile not yet loaded → show spinner (with 10s timeout safeguard).
 * - Authenticated + profile query errored → show error state with Refresh button.
 * - Authenticated + profile IS null (query succeeded) → redirect to /onboarding with toast.
 * - Authenticated + profile exists → render children normally.
 *
 * Applied only to routes that genuinely require a profile (create listing, trades, etc.).
 * Public routes like /, /listings, /listings/:id do NOT use this guard.
 */
export function ProfileGuard({ children }: ProfileGuardProps) {
  const { isAuthenticated, isInitializing } = useAuth();
  const { actor, isFetching } = useActor(createActor);
  const navigate = useNavigate();
  const [isTimedOut, setIsTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: profile,
    isLoading: isLoadingProfile,
    isFetched: isProfileFetched,
    isError: isProfileError,
    isSuccess: isProfileSuccess,
  } = useQuery({
    queryKey: ["myProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyProfile();
    },
    enabled: isAuthenticated && !!actor && !isFetching,
    staleTime: 60_000,
    retry: 1,
  });

  // 10-second timeout safeguard: if query is still loading after 10s, show Refresh button
  useEffect(() => {
    if (!isAuthenticated) return;
    if (isProfileFetched || isProfileError) return;

    timeoutRef.current = setTimeout(() => {
      setIsTimedOut(true);
    }, 10_000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isAuthenticated, isProfileFetched, isProfileError]);

  // Clear timeout once settled
  useEffect(() => {
    if (isProfileFetched || isProfileError) {
      setIsTimedOut(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [isProfileFetched, isProfileError]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (isInitializing || isFetching || isLoadingProfile) return;
    // Only redirect if query SUCCEEDED and profile is definitively null
    if (!!actor && isProfileSuccess && profile === null) {
      console.log(
        "[ProfileGuard] no profile found — redirecting to /onboarding",
      );
      toast.info(
        typeof window !== "undefined" && navigator.language.startsWith("uk")
          ? "Спочатку заповніть профіль"
          : "Please complete your profile first",
        { duration: 4000 },
      );
      navigate({ to: "/onboarding" });
    }
  }, [
    isAuthenticated,
    isInitializing,
    isFetching,
    isLoadingProfile,
    isProfileSuccess,
    profile,
    actor,
    navigate,
  ]);

  const isActivelyLoading =
    isAuthenticated &&
    (isInitializing || isFetching || (isLoadingProfile && !isProfileFetched));

  // Error state — query failed (not null, but threw). Do NOT redirect.
  if (isAuthenticated && isProfileError) {
    return (
      <div
        className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4"
        data-ocid="profile-guard.error_state"
      >
        <p className="text-sm text-destructive">
          {typeof window !== "undefined" && navigator.language.startsWith("uk")
            ? "Не вдалося завантажити профіль. Спробуйте ще раз."
            : "Could not load your profile. Please try again."}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          data-ocid="profile-guard.refresh_button"
        >
          <RefreshCw className="w-4 h-4" />
          {typeof window !== "undefined" && navigator.language.startsWith("uk")
            ? "Оновити"
            : "Refresh"}
        </button>
      </div>
    );
  }

  // Timed-out state — still loading after 10s
  if (isAuthenticated && isTimedOut && isActivelyLoading) {
    return (
      <div
        className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4"
        data-ocid="profile-guard.timeout_state"
      >
        <p className="text-sm text-muted-foreground">
          {typeof window !== "undefined" && navigator.language.startsWith("uk")
            ? "Завантаження займає більше часу ніж очікувалось."
            : "Loading is taking longer than expected."}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          data-ocid="profile-guard.timeout_refresh_button"
        >
          <RefreshCw className="w-4 h-4" />
          {typeof window !== "undefined" && navigator.language.startsWith("uk")
            ? "Оновити"
            : "Refresh"}
        </button>
      </div>
    );
  }

  // Spinner — still loading within timeout window
  if (isActivelyLoading) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        data-ocid="profile-guard.loading_state"
      >
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // Hide content while redirect to /onboarding is pending
  if (
    isAuthenticated &&
    !isFetching &&
    !!actor &&
    isProfileSuccess &&
    profile === null
  ) {
    return null;
  }

  return <>{children}</>;
}
