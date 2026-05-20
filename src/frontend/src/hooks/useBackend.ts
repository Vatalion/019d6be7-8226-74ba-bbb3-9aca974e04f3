import { useActor } from "@caffeineai/core-infrastructure";
import { StorageClient } from "@caffeineai/object-storage";
import type { Identity } from "@icp-sdk/core/agent";
import { HttpAgent, isV3ResponseBody } from "@icp-sdk/core/agent";
import { IDL } from "@icp-sdk/core/candid";
import { useCallback, useRef } from "react";
import { createActor } from "../backend";
import type {
  AddressVerification,
  PaymentMethod,
  TradeToken,
  backendInterface,
} from "../backend.d";
import { detectLocale, t } from "../i18n";

// ─── Re-export backend types used across the app ─────────────────────────────
export type { AddressVerification, PaymentMethod, TradeToken };

// ─── Address verification result (frontend-normalised) ───────────────────────
export interface VerifyAddressResult {
  active: boolean;
  txCount: number;
  verifiedAt: bigint;
}

// ─── Token → EVM network mapping ─────────────────────────────────────────────
export function tokenToEvmNetwork(token: string): string | null {
  switch (token) {
    case "USDT_BEP20":
      return "bsc";
    case "USDT_ERC20":
    case "USDC_ERC20":
      return "ethereum";
    case "USDT_POLYGON":
    case "USDC_POLYGON":
      return "polygon";
    case "USDT_AVAX":
    case "USDC_AVAX":
      return "avalanche";
    default:
      return null;
  }
}

// ─── Verify address via the canister ─────────────────────────────────────────
// All blockchain calls go through the Motoko canister — never call explorers
// directly from React. These functions call the actor's verify* endpoints which
// use HTTPS outcalls internally.

export async function verifyAddress(
  actor: backendInterface,
  token: string,
  address: string,
): Promise<VerifyAddressResult | null> {
  try {
    let result: Awaited<ReturnType<typeof actor.verifyTronAddress>>;

    if (token === "USDT_TRC20") {
      result = await actor.verifyTronAddress(address);
    } else if (token === "USDC_SPL") {
      result = await actor.verifySolanaAddress(address);
    } else {
      const network = tokenToEvmNetwork(token);
      if (!network) return null;
      result = await actor.verifyEvmAddress(address, network);
    }

    if (result.__kind__ === "ok") {
      return {
        active: result.ok.active,
        txCount: Number(result.ok.txCount),
        verifiedAt: result.ok.verifiedAt,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Add payment method to backend ───────────────────────────────────────────
export async function addPaymentMethodToBackend(
  actor: backendInterface,
  token: string,
  address: string,
  autoVerify: boolean,
): Promise<PaymentMethod | null> {
  try {
    const tradeToken = token as TradeToken;
    const result = await actor.addPaymentMethod(
      tradeToken,
      address,
      autoVerify,
    );
    if (result.__kind__ === "ok") return result.ok;
    return null;
  } catch {
    return null;
  }
}

// ─── Get payment methods from backend ────────────────────────────────────────
export async function getPaymentMethodsFromBackend(
  actor: backendInterface,
): Promise<PaymentMethod[]> {
  try {
    return await actor.getPaymentMethods();
  } catch {
    return [];
  }
}

/**
 * Returns the typed backend actor.
 * The actor handles identity from the Internet Identity context automatically.
 * Returns { actor, isFetching } — actor may be null while initializing.
 */
export function useBackend(): {
  actor: backendInterface | null;
  isFetching: boolean;
} {
  return useActor(createActor) as {
    actor: backendInterface | null;
    isFetching: boolean;
  };
}

// IC mainnet API endpoint — used explicitly so HttpAgent never falls back to
// localhost:4943 or a wrong host when running on non-IC domains (e.g. caffeine.ai).
// This is the canonical production IC API endpoint that supports v3 sync calls.
const IC_MAINNET_HOST = "https://icp-api.io";

// Default bucket name used by the Caffeine object-storage extension.
const DEFAULT_BUCKET_NAME = "default-bucket";
const DEFAULT_STORAGE_GATEWAY_URL = "https://blob.caffeine.ai";

// ---------------------------------------------------------------------------
// loadEnvConfig
//
// Fetches env.json at RUNTIME with cache: no-store. If the Caffeine platform
// did NOT substitute __PLACEHOLDER__ tokens (a known platform-level bug), we
// fall back to runtime sources before giving up:
//
//   1. env.json (primary) — platform should replace tokens at deploy time
//   2. ic_env cookie (fallback) — ICP asset canister sets this cookie with
//      "PUBLIC_CANISTER_ID:backend" when the app is deployed on the IC.
//      @icp-sdk/core/agent/canister-env is NOT available in this version, so
//      we parse the cookie manually.
//   3. Hardcoded known-good values as last resort (project_id, backend_host,
//      ii_derivation_origin only — backend_canister_id MUST come from runtime).
//
// Throws ONLY if backend_canister_id cannot be resolved after all fallbacks.
// ---------------------------------------------------------------------------

// Known project UUID — hardcoded as last-resort fallback for project_id only.
// This is the Caffeine project ID for CryptoMarket P2P.
const KNOWN_PROJECT_ID = "019d6be7-8226-74ba-bbb3-9aca974e04f3";

interface EnvConfig {
  backend_canister_id: string;
  backend_host: string;
  ii_derivation_origin: string;
  project_id: string;
  storage_gateway_url: string;
}

// Cache the loaded config to avoid redundant fetches during a session
let cachedEnvConfig: EnvConfig | null = null;

/**
 * Reads the ic_env cookie that the ICP asset canister sets at runtime.
 * Returns a map of { "PUBLIC_CANISTER_ID:backend": "<canister-id>", ... }
 * Returns an empty object if the cookie is absent or cannot be parsed.
 */
function readIcEnvCookie(): Record<string, string> {
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

async function loadEnvConfig(): Promise<EnvConfig> {
  if (cachedEnvConfig !== null) return cachedEnvConfig;

  const cacheScope =
    typeof window !== "undefined" ? window.location.hostname : "default";
  const CACHE_KEY = `caffeine_backend_canister_id:${cacheScope}`;
  const CACHE_TS_KEY = `caffeine_backend_canister_id_ts:${cacheScope}`;
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  // Step 0 — read localStorage cache (used as last-resort fallback below)
  let cachedCanisterId: string | null = null;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const cachedTs = Number.parseInt(
      localStorage.getItem(CACHE_TS_KEY) || "0",
      10,
    );
    if (cached && Date.now() - cachedTs < CACHE_TTL_MS) {
      cachedCanisterId = cached;
    }
  } catch {
    // localStorage not available (e.g. SSR or private mode)
  }

  const isPlaceholder = (v: string | undefined | null): boolean =>
    !v ||
    v.startsWith("__") ||
    v === "undefined" ||
    v === "null" ||
    v.includes("undefined");

  // Step 1 — fetch env.json
  let rawData: Partial<EnvConfig> = {};
  try {
    const resp = await fetch("/env.json", {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store" },
    });
    if (resp.ok) {
      rawData = (await resp.json()) as Partial<EnvConfig>;
    } else {
      console.warn(`[loadEnvConfig] env.json fetch returned ${resp.status}`);
    }
  } catch (fetchErr) {
    console.warn("[loadEnvConfig] env.json fetch failed:", fetchErr);
  }

  // Step 2 — for any placeholder values, try ic_env cookie fallback
  const icEnv = readIcEnvCookie();
  if (Object.keys(icEnv).length > 0) {
    console.log("[loadEnvConfig] ic_env cookie found:", Object.keys(icEnv));
  }

  // Resolve backend_canister_id
  let backend_canister_id = rawData.backend_canister_id;
  if (isPlaceholder(backend_canister_id)) {
    // Try the ic_env cookie — asset canister sets "PUBLIC_CANISTER_ID:backend"
    const fromCookie =
      icEnv["PUBLIC_CANISTER_ID:backend"] ?? icEnv.CANISTER_ID_BACKEND;
    if (fromCookie && !isPlaceholder(fromCookie)) {
      console.warn(
        "[loadEnvConfig] backend_canister_id resolved from ic_env cookie:",
        fromCookie,
      );
      backend_canister_id = fromCookie;
    } else if (cachedCanisterId) {
      // Step 3 — fall back to localStorage cache
      console.warn(
        "[loadEnvConfig] backend_canister_id resolved from localStorage cache:",
        cachedCanisterId,
      );
      backend_canister_id = cachedCanisterId;
    }
  }

  // Resolve project_id — use hardcoded known value as final fallback
  let project_id = rawData.project_id;
  if (isPlaceholder(project_id)) {
    console.warn(
      `[loadEnvConfig] project_id placeholder detected ("${project_id}") — using known project UUID fallback`,
    );
    project_id = KNOWN_PROJECT_ID;
  }

  // Resolve backend_host — always use IC mainnet as fallback
  let backend_host = rawData.backend_host;
  if (isPlaceholder(backend_host)) {
    console.warn(
      `[loadEnvConfig] backend_host placeholder detected ("${backend_host}") — using https://icp-api.io`,
    );
    backend_host = IC_MAINNET_HOST;
  }

  // Resolve storage_gateway_url — Caffeine injects it at runtime on deployed apps.
  let storage_gateway_url = rawData.storage_gateway_url;
  if (isPlaceholder(storage_gateway_url)) {
    storage_gateway_url = DEFAULT_STORAGE_GATEWAY_URL;
  }

  // Resolve ii_derivation_origin — use window.location.origin as fallback
  let ii_derivation_origin = rawData.ii_derivation_origin;
  if (isPlaceholder(ii_derivation_origin)) {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://id.ai";
    console.warn(
      `[loadEnvConfig] ii_derivation_origin placeholder detected — using ${origin}`,
    );
    ii_derivation_origin = origin;
  }

  // Step 4 — backend_canister_id is the only hard requirement; throw if still missing
  if (!backend_canister_id || isPlaceholder(backend_canister_id)) {
    throw new Error(
      "backend_canister_id could not be resolved. " +
        "env.json contains a placeholder and the ic_env cookie did not provide " +
        "'PUBLIC_CANISTER_ID:backend'. " +
        "Ensure the app is deployed via Caffeine with the backend canister configured.",
    );
  }

  // Cache the resolved canister ID in localStorage for future sessions
  try {
    localStorage.setItem(CACHE_KEY, backend_canister_id);
    localStorage.setItem(CACHE_TS_KEY, Date.now().toString());
  } catch {
    // ignore localStorage errors
  }

  const resolved: EnvConfig = {
    backend_canister_id: backend_canister_id!,
    backend_host: backend_host ?? IC_MAINNET_HOST,
    ii_derivation_origin:
      ii_derivation_origin ??
      (typeof window !== "undefined"
        ? window.location.origin
        : "https://id.ai"),
    project_id: project_id ?? KNOWN_PROJECT_ID,
    storage_gateway_url: storage_gateway_url ?? DEFAULT_STORAGE_GATEWAY_URL,
  };

  console.log("[loadEnvConfig] RESOLVED CONFIG:", {
    backend_canister_id: resolved.backend_canister_id,
    project_id: resolved.project_id,
    backend_host: resolved.backend_host,
    storage_gateway_url: resolved.storage_gateway_url,
    ii_derivation_origin: resolved.ii_derivation_origin,
    source: "env.json or fallback",
  });

  cachedEnvConfig = resolved;
  return resolved;
}

// ---------------------------------------------------------------------------
// useUploadFile
//
// Accepts `identity` as a parameter (from the calling component's single
// useInternetIdentity() call) — ONE source of truth for identity.
//
// Key correctness invariants:
// 1. projectId and backend_canister_id come from env.json (fetched at runtime
//    with cache: no-store) — NOT build-time variables. The platform substitutes
//    them in env.json at deploy time.
// 2. HttpAgent host is explicitly set from runtime env.json, falling back to IC mainnet.
// 3. Identity is always passed to the HttpAgent constructor BEFORE StorageClient
//    is created. Anonymous agents cannot receive v3 certified responses.
// 4. Backend uses Caffeine `MixinObjectStorage` — certificate is the v3 IC
//    response body from `_immutableObjectStorageCreateCertificate` (returns
//    { method: "upload"; blob_hash }, NOT CertifiedData.set).
// 5. StorageClient.getCertificate is patched to pass identity at the call site.
// 6. StorageClient is cached per principal text; rebuilt when identity changes.
// ---------------------------------------------------------------------------

let storageGatewayPrincipalsSynced = false;

async function syncStorageGatewayPrincipals(
  agent: HttpAgent,
  canisterId: string,
  identity: Identity,
): Promise<void> {
  if (storageGatewayPrincipalsSynced) return;
  try {
    await agent.call(
      canisterId,
      {
        methodName: "_immutableObjectStorageUpdateGatewayPrincipals",
        arg: IDL.encode([], []),
      },
      identity,
    );
    storageGatewayPrincipalsSynced = true;
    console.log("[useUploadFile] Gateway principals synced");
  } catch (e) {
    // Non-fatal: Caffeine production canisters have CAFFFEINE_STORAGE_CASHIER_PRINCIPAL set.
    console.warn("[useUploadFile] Gateway principal sync skipped:", e);
  }
}

export function useUploadFile(identity: Identity | undefined): {
  uploadFile: (
    file: File,
    onProgress?: (pct: number) => void,
  ) => Promise<string>;
} {
  const storageRef = useRef<StorageClient | null>(null);
  const identityRef = useRef<Identity | undefined>(undefined);
  // Track by principal text — useInternetIdentity() may return a new Identity
  // object with the same principal on each render; object-reference comparison
  // would wrongly rebuild the client on every render.
  const cachedPrincipalRef = useRef<string | null>(null);

  // Sync the ref on every render so the callback always reads the current identity.
  identityRef.current = identity;

  const uploadFile = useCallback(
    async (
      file: File,
      _onProgress?: (pct: number) => void,
    ): Promise<string> => {
      const currentIdentity = identityRef.current;

      // Guard: must be authenticated.
      if (!currentIdentity || currentIdentity.getPrincipal().isAnonymous()) {
        throw new Error(t(detectLocale(), "upload.errorAuthRequired"));
      }

      // Load env.json (cached after first call). Throws if backend_canister_id
      // is missing or still a placeholder.
      const envConfig = await loadEnvConfig();

      // Invalidate cached client when the user's principal changes.
      const currentPrincipalText = currentIdentity.getPrincipal().toText();
      if (
        storageRef.current !== null &&
        cachedPrincipalRef.current !== currentPrincipalText
      ) {
        storageRef.current = null;
        cachedPrincipalRef.current = null;
        cachedEnvConfig = null;
      }

      // Build StorageClient if not yet cached.
      if (storageRef.current === null) {
        try {
          const agentHost = envConfig.backend_host || IC_MAINNET_HOST;

          // ── DEBUG: log exact values used to construct StorageClient ──────────
          console.log("[useUploadFile] Constructing StorageClient with:", {
            bucket: DEFAULT_BUCKET_NAME,
            storageGatewayUrl: envConfig.storage_gateway_url,
            backendCanisterId: envConfig.backend_canister_id,
            projectId: envConfig.project_id,
            agentHost,
            principalText: currentPrincipalText,
            isAnonymous: currentIdentity.getPrincipal().isAnonymous(),
          });

          const isBackendIdPlaceholder =
            !envConfig.backend_canister_id ||
            envConfig.backend_canister_id.startsWith("__") ||
            envConfig.backend_canister_id === "undefined" ||
            envConfig.backend_canister_id === "null";

          if (isBackendIdPlaceholder) {
            console.error(
              "[useUploadFile] CRITICAL: backendCanisterId is still a placeholder:",
              envConfig.backend_canister_id,
            );
          }

          const agent = new HttpAgent({
            host: agentHost,
            identity: currentIdentity,
          });

          // StorageClient constructor: (bucket, storageGatewayUrl, backendCanisterId, projectId, agent)
          storageRef.current = new StorageClient(
            DEFAULT_BUCKET_NAME,
            envConfig.storage_gateway_url,
            envConfig.backend_canister_id,
            envConfig.project_id,
            agent,
          );

          // StorageClient v0.1.x does not pass identity at the call site.
          // Bind certificate creation to the active identity explicitly so
          // gateway authorization cannot drift to anonymous after auth changes.
          const patchAgent = agent;
          const patchCanisterId = envConfig.backend_canister_id;
          const patchIdentity = currentIdentity;

          await syncStorageGatewayPrincipals(
            agent,
            envConfig.backend_canister_id,
            currentIdentity,
          );

          // The cast bypasses the 'private' access modifier — necessary because
          // the library's getCertificate omits identity on agent.call.
          (
            storageRef.current as unknown as {
              getCertificate: (h: string) => Promise<Uint8Array>;
            }
          ).getCertificate = async (hashString: string) => {
            const result = await patchAgent.call(
              patchCanisterId,
              {
                methodName: "_immutableObjectStorageCreateCertificate",
                arg: IDL.encode([IDL.Text], [hashString]),
              },
              patchIdentity,
            );
            const body = result.response.body;
            if (!isV3ResponseBody(body)) {
              throw new Error(
                "[useUploadFile] Expected v3 response body with upload certificate",
              );
            }
            return body.certificate;
          };

          console.log(
            "[useUploadFile] StorageClient ready (official object-storage protocol)",
          );
          cachedPrincipalRef.current = currentPrincipalText;
        } catch (e) {
          storageRef.current = null;
          cachedPrincipalRef.current = null;
          throw new Error(
            `${t(detectLocale(), "upload.errorInitStorage")}${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }

      // Normalise file MIME type (iPhone/Safari HEIC compatibility).
      const resolvedFile = normaliseFileType(file);
      const bytes = new Uint8Array(await resolvedFile.arrayBuffer());

      let hash: string;
      try {
        console.log(
          "[useUploadFile] Calling putFile. bytes.length:",
          bytes.length,
          "file.type:",
          resolvedFile.type,
          "file.size:",
          resolvedFile.size,
        );
        const result = await storageRef.current.putFile(bytes, _onProgress);
        hash = result.hash;
        console.log("[useUploadFile] putFile succeeded. hash:", hash);
      } catch (e) {
        console.error("[useUploadFile] putFile failed:", e);
        console.error(
          "[useUploadFile] Upload failed. Common causes: wrong env.json canister id,",
          "anonymous II session, preview deployment, storage budget exhausted, or network.",
        );
        // Reset so next attempt reinitialises cleanly.
        storageRef.current = null;
        cachedPrincipalRef.current = null;
        cachedEnvConfig = null;
        throw new Error(e instanceof Error ? e.message : String(e));
      }

      const url = await storageRef.current.getDirectURL(hash);
      if (!url) {
        throw new Error(
          `${t(detectLocale(), "upload.errorEmptyUrl")} for hash: ${hash}`,
        );
      }

      return url;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { uploadFile };
}

// ---------------------------------------------------------------------------
// normaliseFileType
//
// iPhone/Safari sometimes returns files without a MIME type set (especially
// for HEIC/HEIF images picked from the photo library). The StorageClient
// uses application/octet-stream internally, but we normalise here for
// correctness.
// ---------------------------------------------------------------------------

function normaliseFileType(file: File): File {
  if (file.type) return file;

  const name = file.name.toLowerCase();
  let mimeType = "application/octet-stream";
  if (name.endsWith(".heic") || name.endsWith(".heif")) {
    mimeType = "image/heic";
  } else if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
    mimeType = "image/jpeg";
  } else if (name.endsWith(".png")) {
    mimeType = "image/png";
  } else if (name.endsWith(".webp")) {
    mimeType = "image/webp";
  } else if (name.endsWith(".gif")) {
    mimeType = "image/gif";
  } else if (name.endsWith(".mov")) {
    mimeType = "video/quicktime";
  } else if (name.endsWith(".mp4")) {
    mimeType = "video/mp4";
  }

  return new File([file], file.name, {
    type: mimeType,
    lastModified: file.lastModified,
  });
}
