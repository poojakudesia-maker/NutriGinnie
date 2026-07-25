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
  const diffMs = date.getTime() - weekStart.getTime();
  return Math.max(0, Math.min(6, Math.round(diffMs / 86_400_000)));
}
