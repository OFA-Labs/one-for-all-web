import type { NextRequest } from "next/server";

/**
 * Same-origin proxy to the History API. The browser calls /api/history/*; this handler adds
 * the server-side bearer token, so no credential reaches the browser and no CORS is needed.
 *
 * Read-only: only GET and only the exact routes below. HISTORY_API_URL / HISTORY_API_TOKEN are
 * server-only (never NEXT_PUBLIC_*) and are read per request.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Same rule as the backend: must start with a letter, digit or underscore (never "." / "..").
const ID = "([A-Za-z0-9_][A-Za-z0-9_.:-]{0,127})";
const ROUTES: readonly [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^tasks$/, () => "/v1/tasks"],
  [new RegExp(`^tasks/${ID}$`), (m) => `/v1/tasks/${m[1]}`],
  [new RegExp(`^tasks/${ID}/export$`), (m) => `/v1/tasks/${m[1]}/export`],
  [/^history\/calendar$/, () => "/v1/history/calendar"],
  [/^history\/period$/, () => "/v1/history/period"],
];
const TIMEOUT_MS = 10_000;

function failure(status: number, code: string, message: string): Response {
  return Response.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const base = process.env.HISTORY_API_URL;
  const token = process.env.HISTORY_API_TOKEN;
  if (!base || !token)
    return failure(503, "service_unavailable", "History is not configured.");

  const joined = (await context.params).path.join("/");
  let target: string | null = null;
  for (const [pattern, build] of ROUTES) {
    const match = joined.match(pattern);
    if (match) {
      target = build(match);
      break;
    }
  }
  if (!target) return failure(404, "not_found", "Not found.");

  // Only the query string is forwarded; no browser headers, cookies or credentials are.
  const upstream =
    base.replace(/\/+$/, "") + target + new URL(request.url).search;
  let response: Response;
  try {
    response = await fetch(upstream, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return failure(503, "service_unavailable", "History is unavailable.");
  }

  const headers = new Headers({ "Cache-Control": "private, no-store" });
  headers.set(
    "Content-Type",
    response.headers.get("Content-Type") ?? "application/json",
  );
  const disposition = response.headers.get("Content-Disposition");
  if (disposition) headers.set("Content-Disposition", disposition);
  return new Response(response.body, { status: response.status, headers });
}
