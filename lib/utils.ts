import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** Monday-anchored ISO date (UTC midnight) for the week containing `date`. */
export function weekStartDate(date: Date = new Date()): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  return d;
}

export const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function dayIndexFromDate(date: Date, weekStart: Date): number {
  // Normalize to UTC midnight first: callers often pass a Date that still carries the current
  // time-of-day (e.g. `new Date()` plus a day added), which would otherwise skew the rounded
  // day-diff whenever "now" is past noon UTC.
  const normalized = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const diffMs = normalized.getTime() - weekStart.getTime();
  return Math.max(0, Math.min(6, Math.round(diffMs / 86_400_000)));
}

/** The calendar date + wall-clock time in `timezone` for the given instant, e.g. for deciding
 *  "is it this user's 7 PM yet" regardless of what the server's own clock/timezone is. */
export function localDateParts(instant: Date, timezone: string): { year: number; month: number; day: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}

/** UTC-midnight Date for "today + addDays" as seen in `timezone` — used to compute a user's
 *  local "tomorrow" for the nightly send regardless of the server's own timezone. */
export function localDateUTCMidnight(instant: Date, timezone: string, addDays = 0): Date {
  const { year, month, day } = localDateParts(instant, timezone);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + addDays);
  return d;
}
