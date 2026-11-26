import type { HistoryClient } from "./contracts";
import { createHttpHistoryClient } from "./http-client";
import { createMockHistoryClient } from "./mock-client";

export const LIVE_PREFIX = "/api/history";
export const OVERRIDE_KEY = "one-for-all-history-api";

/**
 * Only same-origin proxy paths select live mode. A full URL, a protocol-relative URL or any
 * other path is ignored, so the browser can never be pointed at the backend or a third party.
 */
export function sameOriginHistoryPath(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const clean = value.replace(/\/+$/, "");
  if (clean === LIVE_PREFIX) return clean;
  return clean.startsWith(LIVE_PREFIX + "/") &&
    !clean.includes("..") &&
    !clean.includes("//") &&
    !clean.includes("\\") &&
    !clean.includes("?")
    ? clean
    : null;
}

/**
 * The live proxy base, or null for preview. Browser-only (reads localStorage); the override
 * is for local dev and tests, and it is not a security boundary.
 */
export function resolveHistoryBase(): string | null {
  let override: string | null = null;
  try {
    override = window.localStorage.getItem(OVERRIDE_KEY);
  } catch {
    /* storage blocked: fall through to the build-time setting */
  }
  return (
    sameOriginHistoryPath(override) ??
    sameOriginHistoryPath(process.env.NEXT_PUBLIC_HISTORY_API_URL)
  );
}

export function createHistoryClient(base: string | null): HistoryClient {
  return base ? createHttpHistoryClient(base) : createMockHistoryClient();
}
