/**
 * Standalone cron worker for deployments where the platform-native scheduler
 * (Vercel Cron) isn't available — e.g. Railway or Render running the app as
 * a long-lived Node process. Run with `npm run worker`.
 *
 * Calls the same /api/cron/* route handlers the Vercel cron config uses, so
 * there's exactly one implementation of "send today's diet plan" / "send
 * tomorrow's grocery list" regardless of which platform triggers it.
 */
import cron from "node-cron";

const APP_URL = process.env.APP_URL;
const CRON_SECRET = process.env.CRON_SECRET;

if (!APP_URL || !CRON_SECRET) {
  console.error("APP_URL and CRON_SECRET must be set to run the scheduler.");
  process.exit(1);
}

async function trigger(path: string) {
  try {
    const res = await fetch(`${APP_URL}${path}`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const body = await res.text();
    console.log(`[${new Date().toISOString()}] ${path} -> ${res.status} ${body}`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ${path} failed:`, err);
  }
}

// 8:00 AM IST daily diet plan (IST = UTC+5:30 -> 02:30 UTC)
cron.schedule("30 2 * * *", () => trigger("/api/cron/daily-diet"), { timezone: "UTC" });

// 5:00 PM IST grocery reminder for the next day (11:30 UTC)
cron.schedule("30 11 * * *", () => trigger("/api/cron/grocery-reminder"), { timezone: "UTC" });

console.log("NutriPing scheduler running: daily-diet @ 08:00 IST, grocery-reminder @ 17:00 IST.");
