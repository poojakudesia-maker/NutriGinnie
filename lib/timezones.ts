/** Curated list of common IANA timezones for the manual override dropdown — the actual value
 *  stored is whatever Intl.DateTimeFormat().resolvedOptions().timeZone auto-detects, which may
 *  not be in this list; the <select> below falls back to showing that raw value as an extra option. */
export const COMMON_TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Karachi",
  "Asia/Dhaka",
  "Asia/Kathmandu",
  "Asia/Colombo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Australia/Sydney",
  "Australia/Perth",
  "Pacific/Auckland",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "UTC",
] as const;
