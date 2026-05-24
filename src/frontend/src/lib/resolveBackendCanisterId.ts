function isPlaceholder(value: string | undefined | null): boolean {
  return (
    !value ||
    value.startsWith("__") ||
    value === "undefined" ||
    value === "null" ||
    value.includes("PLACEHOLDER")
  );
}

/**
 * Reads the ic_env cookie that the ICP asset canister sets at runtime.
 */
export function readIcEnvCookie(): Record<string, string> {
  try {
    if (typeof document === "undefined") return {};
    const match = document.cookie
      .split(";")
      .find((c) => c.trim().startsWith("ic_env="));
    if (!match) return {};
    const encoded = match.split("=").slice(1).join("=").trim();
    const parsed = JSON.parse(decodeURIComponent(encoded));
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, string>;
    }
    return {};
  } catch {
    return {};
  }
}

/** Resolves backend canister id from env.json with ic_env cookie fallback. */
export async function resolveBackendCanisterId(): Promise<string | null> {
  let backendCanisterId: string | undefined;

  try {
    const resp = await fetch("/env.json", {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store" },
    });
    if (resp.ok) {
      const data = (await resp.json()) as { backend_canister_id?: string };
      backendCanisterId = data.backend_canister_id?.trim();
    }
  } catch {
    // fall through to cookie fallback
  }

  if (!isPlaceholder(backendCanisterId)) {
    return backendCanisterId!;
  }

  const icEnv = readIcEnvCookie();
  const fromCookie =
    icEnv["PUBLIC_CANISTER_ID:backend"] ?? icEnv.CANISTER_ID_BACKEND;
  if (fromCookie && !isPlaceholder(fromCookie)) {
    return fromCookie;
  }

  return null;
}
