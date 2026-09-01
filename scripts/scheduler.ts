/**
 * Standalone cron worker for deployments where the platform-native scheduler
 * (Vercel Cron) isn't available — e.g. Railway or Render running the app as
 * a long-lived Node process. Run with `npm run worker`.
 *
 * Calls the same /api/cron/* route handler the Vercel cron config uses, so
 * there's exactly one implementation of "send each user's next day's diet
 * plan + grocery list at their own configured local time." The route itself
 * figures out per-user which timezone/hour to fire in — this worker just
 * needs to call it often enough (every 30 min) to catch every user's window.
 *
 * Note: Vercel's Hobby (free) plan only allows daily-cadence cron jobs, so
 * the every-30-minutes schedule in vercel.json needs a Pro plan to actually
 * fire that often; on Hobby, run this worker instead (Railway/Render/any
 * always-on host) to get real per-timezone delivery.
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

// Every 30 minutes: the route checks each user's own timezone/dispatchHour and only sends to
// whoever's local time currently falls in their configured window.
cron.schedule("*/30 * * * *", () => trigger("/api/cron/nightly-plan"), { timezone: "UTC" });

console.log("NutriPing scheduler running: nightly-plan every 30 min (per-user local-time diet + grocery send).");
