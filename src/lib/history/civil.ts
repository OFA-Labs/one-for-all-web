/** Civil-date helpers shared by the History data layer and the calendar feature. */
export const DEFAULT_TIME_ZONE = "Asia/Kolkata";

const formatters = new Map<string, Intl.DateTimeFormat>();
function dateFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** The `YYYY-MM-DD` calendar date of an instant in an IANA zone. */
export function civilDateInZone(
  instant: Date | string | number,
  timeZone: string = DEFAULT_TIME_ZONE,
): string {
  const parts = dateFormatter(timeZone).formatToParts(new Date(instant));
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
