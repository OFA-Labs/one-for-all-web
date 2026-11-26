import { civilDateInZone, DEFAULT_TIME_ZONE } from "@/lib/history/civil";

/** Calendar arithmetic uses UTC civil dates; display/event grouping takes the
 * selected display time zone as an explicit argument (default: Asia/Kolkata). */
export type CalendarView = "day" | "week" | "month" | "year";

export const TIME_ZONE_OPTIONS = [
  { value: "Asia/Kolkata", label: "India Standard Time (GMT+5:30)" },
  { value: "UTC", label: "UTC (GMT+0)" },
  { value: "Europe/London", label: "London (UK time)" },
  { value: "America/New_York", label: "New York (ET)" },
] as const;

function civilDate(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}
function parseCivilDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}
export function getTodayInZone(
  now: Date = new Date(),
  timeZone: string = DEFAULT_TIME_ZONE,
): string {
  return civilDateInZone(now, timeZone);
}
/** @deprecated Use getTodayInZone; kept so existing callers/tests keep working. */
export function getTodayInKolkata(now: Date = new Date()): string {
  return getTodayInZone(now, DEFAULT_TIME_ZONE);
}
export function addDays(value: string, amount: number): string {
  const date = parseCivilDate(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return civilDate(date);
}
export function shiftPeriod(
  anchor: string,
  view: CalendarView,
  amount: number,
): string {
  if (view === "day" || view === "week")
    return addDays(anchor, amount * (view === "week" ? 7 : 1));
  const date = parseCivilDate(anchor);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  if (view === "month") date.setUTCMonth(date.getUTCMonth() + amount);
  else date.setUTCFullYear(date.getUTCFullYear() + amount);
  const finalDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(day, finalDay));
  return civilDate(date);
}
export function startOfWeek(anchor: string): string {
  return addDays(anchor, -parseCivilDate(anchor).getUTCDay());
}
export function getMonthDays(anchor: string): string[] {
  const date = parseCivilDate(anchor);
  date.setUTCDate(1);
  const start = startOfWeek(civilDate(date));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}
export function getPeriodBounds(
  anchor: string,
  view: CalendarView,
): { start: string; end: string } {
  if (view === "day") return { start: anchor, end: addDays(anchor, 1) };
  if (view === "week") {
    const start = startOfWeek(anchor);
    return { start, end: addDays(start, 7) };
  }
  const date = parseCivilDate(anchor);
  date.setUTCDate(1);
  if (view === "year") date.setUTCMonth(0);
  const start = civilDate(date);
  return { start, end: shiftPeriod(start, view, 1) };
}
export function displayCivil(
  value: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat("en-IN", {
    ...options,
    timeZone: "UTC",
  }).format(parseCivilDate(value));
}
export function getPeriodLabel(
  anchor: string,
  view: CalendarView,
  today = getTodayInKolkata(),
): string {
  void today;
  if (view === "day")
    return displayCivil(anchor, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  if (view === "month")
    return displayCivil(anchor, { month: "long", year: "numeric" });
  if (view === "year") return anchor.slice(0, 4);
  const { start, end } = getPeriodBounds(anchor, view);
  const last = addDays(end, -1);
  // A shared month/year needs just one suffix, like Google Calendar.
  if (start.slice(0, 7) === last.slice(0, 7))
    return `${Number(start.slice(8))}–${displayCivil(last, { day: "numeric", month: "long", year: "numeric" })}`;
  return `${displayCivil(start, { day: "numeric", month: "short", ...(start.slice(0, 4) !== last.slice(0, 4) ? { year: "numeric" } : {}) })} – ${displayCivil(last, { day: "numeric", month: "short", year: "numeric" })}`;
}
export function relativeDay(
  anchor: string,
  today = getTodayInKolkata(),
): string {
  return anchor === today
    ? "Today"
    : anchor === addDays(today, -1)
      ? "Yesterday"
      : anchor === addDays(today, 1)
        ? "Tomorrow"
        : displayCivil(anchor, { weekday: "long" });
}
export type Instant = string | number | Date;
export function eventCivilDate(
  timestamp: Instant,
  timeZone: string = DEFAULT_TIME_ZONE,
): string {
  return civilDateInZone(timestamp, timeZone);
}
export function eventTime(
  timestamp: Instant,
  timeZone: string = DEFAULT_TIME_ZONE,
): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).format(new Date(timestamp));
}
export function eventMinutes(
  timestamp: Instant,
  timeZone: string = DEFAULT_TIME_ZONE,
): number {
  const p = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).formatToParts(new Date(timestamp));
  return (
    Number(p.find((x) => x.type === "hour")?.value) * 60 +
    Number(p.find((x) => x.type === "minute")?.value)
  );
}
