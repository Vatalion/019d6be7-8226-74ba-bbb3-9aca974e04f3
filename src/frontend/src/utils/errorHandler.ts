/**
 * Shared backend error handler for CryptoMarket P2P.
 *
 * Backend returns Result<T> variants as:
 *   { __kind__: 'ok'; ok: T }
 *   { __kind__: 'err'; err: BackendError }
 *
 * BackendError.__kind__ is one of:
 *   'unauthorized' | 'not_found' | 'invalid_input' | 'rate_limited' |
 *   'escrow_error' | 'banned' | 'dispute_already_open'
 *
 * Invalid-input payload is carried as: err.invalid_input (string)
 * Escrow-error payload is carried as: err.escrow_error (string)
 */

import { toast } from "sonner";
import { type Locale, detectLocale, t } from "../i18n";

// ─── Type helpers ─────────────────────────────────────────────────────────────

type BackendError = {
  __kind__?: string;
  invalid_input?: string;
  escrow_error?: string;
  [key: string]: unknown;
};

type BackendResult =
  | { __kind__?: "ok"; ok?: unknown }
  | { __kind__?: "err"; err?: BackendError }
  | { err?: BackendError };

// ─── Result checkers ──────────────────────────────────────────────────────────

/** Returns true when the backend result is an error of any kind. */
export function isBackendError(result: BackendResult): boolean {
  if ((result as { __kind__?: string }).__kind__ === "err") return true;
  if (
    (result as { __kind__?: string }).__kind__ === undefined &&
    "err" in result
  )
    return true;
  return false;
}

/** Extracts the error variant object from a backend result, or null. */
export function extractError(result: BackendResult): BackendError | null {
  if (!isBackendError(result)) return null;
  return (result as { err?: BackendError }).err ?? null;
}

export function isRateLimited(result: BackendResult): boolean {
  const err = extractError(result);
  return err?.__kind__ === "rate_limited";
}

export function isInvalidInput(result: BackendResult): boolean {
  const err = extractError(result);
  return err?.__kind__ === "invalid_input";
}

export function isUnauthorized(result: BackendResult): boolean {
  const err = extractError(result);
  return err?.__kind__ === "unauthorized";
}

// ─── Main error handler ───────────────────────────────────────────────────────

/**
 * Translates a backend error variant into an appropriate toast notification
 * and, for `unauthorized` errors, optionally redirects to the login/home page.
 *
 * @param err      The error variant object from result.err
 * @param navigate Optional navigate function from @tanstack/react-router.
 *                 When provided and the error is `unauthorized`, the user is
 *                 redirected to '/' (which shows the login screen).
 * @param locale   Optional locale override — auto-detected when omitted.
 */
export function handleBackendError(
  err: BackendError | null | undefined,
  navigate?: (opts: { to: string }) => void,
  locale?: Locale,
): void {
  const loc = locale ?? detectLocale();

  if (!err) {
    toast.error(t(loc, "errors.generic"));
    return;
  }

  const kind = err.__kind__;

  switch (kind) {
    case "rate_limited":
      toast.error(t(loc, "errors.rateLimited"));
      break;

    case "invalid_input": {
      const msg =
        typeof err.invalid_input === "string" && err.invalid_input
          ? err.invalid_input
          : t(loc, "errors.invalidInput");
      toast.error(msg);
      break;
    }

    case "unauthorized":
      // If a navigate function is provided, redirect the user to login.
      // The home page acts as the login entry point (shows II login CTA).
      if (navigate) {
        toast.error(t(loc, "errors.anonymousNotAllowed"));
        navigate({ to: "/" });
      } else {
        toast.error(t(loc, "errors.unauthorized"));
      }
      break;

    case "escrow_error": {
      const msg =
        typeof err.escrow_error === "string" && err.escrow_error
          ? err.escrow_error
          : t(loc, "errors.escrowError");
      toast.error(msg);
      break;
    }

    case "banned":
      toast.error(t(loc, "errors.banned"));
      break;

    case "dispute_already_open":
      toast.error(t(loc, "errors.disputeAlreadyOpen"));
      break;

    default:
      toast.error(t(loc, "errors.generic"));
      break;
  }
}

/**
 * Convenience wrapper that reads the error from a full backend result object
 * and delegates to `handleBackendError`.
 *
 * Usage:
 *   const res = await actor.someCall();
 *   if (handleResultError(res, navigate)) return; // error was handled
 *   // proceed with res.ok ...
 *
 * @returns true if an error was found and handled, false if the result is ok.
 */
export function handleResultError(
  result: BackendResult,
  navigate?: (opts: { to: string }) => void,
  locale?: Locale,
): boolean {
  if (!isBackendError(result)) return false;
  const err = extractError(result);
  handleBackendError(err, navigate, locale);
  return true;
}
