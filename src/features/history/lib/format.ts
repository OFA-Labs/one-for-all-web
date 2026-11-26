import { DEFAULT_TIME_ZONE } from "@/lib/history/civil";

/** "16 Nov 2026, 10:24 am" in the given IANA zone. */
export function formatInstant(
  instant: number,
  timeZone: string = DEFAULT_TIME_ZONE,
): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).format(new Date(instant));
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  const minutes = Math.round(ms / 60_000);
  return minutes < 60
    ? `${minutes} min`
    : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

/** A user-safe message for a failed History request; never echoes server text. */
export function describeError(error: unknown): string {
  const status = (error as { status?: number } | null)?.status;
  if (status === 0 || status === 503)
    return "History isn’t reachable right now. Check that the History service is running.";
  if (status === 401 || status === 403)
    return "History access isn’t configured for this workspace.";
  return "Something went wrong while loading history.";
}
