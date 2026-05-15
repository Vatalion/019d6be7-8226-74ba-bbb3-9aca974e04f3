import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import type { Identity } from "@icp-sdk/core/agent";
import type { Principal } from "@icp-sdk/core/principal";

export interface AuthState {
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoggingIn: boolean;
  identity: Identity | undefined;
  principal: Principal | undefined;
  login: () => void;
  logout: () => void;
}

/**
 * Convenience wrapper around useInternetIdentity.
 * Exposes a clean, stable interface for auth state and actions.
 */
export function useAuth(): AuthState {
  const { identity, login, clear, isInitializing, isLoggingIn } =
    useInternetIdentity();

  // Derive auth state directly from identity — loginStatus can be stale
  // after II redirect flow completes and must not be the sole check.
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const principal = identity?.getPrincipal();

  return {
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    identity,
    principal,
    login,
    logout: clear,
  };
}
