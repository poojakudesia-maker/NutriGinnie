# NutriPing

A production-ready Progressive Web App that turns a user's health profile, uploaded diet PDFs, and
pasted recipes into a personalized, AI-generated 7-day Indian diet plan — with daily WhatsApp
reminders (text + voice) for the meal plan and grocery list.

## Tech stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, installable/offline-capable PWA
- **Backend:** Next.js Route Handlers (Node.js), PostgreSQL via Prisma ORM
- **AI:** Anthropic Claude — PDF parsing, recipe structuring, diet plan generation
- **Messaging:** Twilio WhatsApp API (text + voice notes), Meta Cloud API as an alternative
- **Voice:** ElevenLabs TTS (Google Cloud TTS as a fallback)
- **Scheduler:** Vercel Cron (`vercel.json`) or a standalone `node-cron` worker for Railway/Render

## Project structure

```
app/
  (app)/                  Authenticated shell (bottom nav) — redirects to /onboarding or
                          /onboarding/complete-profile when there's no session / an incomplete profile
    dashboard/            BMI/BMR/TDEE/calorie dashboard, PDF/DOCX upload, recipe/video-link input,
                          "Generate my weekly plan"
    plan/                 Weekly plan grid
    plan/[day]/           Daily meal breakdown, per-meal "Swap" button, "send to WhatsApp" button
    log/                  Daily Meal Logger — confirm the planned meal, log a photo, or log a custom swap
    grocery/              Grocery list (prev/next day navigation)
    progress/             Weight trend, adherence %, calorie-consistency ring, GLP-1 check-in log
    settings/             WhatsApp numbers, delivery preferences, PDF/DOCX upload, recipe paste, saved recipes, log out
  onboarding/             Email/password signup form (+ "Continue with Google") + health/food profile
  onboarding/complete-profile/  Health/food profile step for accounts created via Google (no password)
  login/                  Email/password login + "Continue with Google"
  api/
    users/                Create profile (+ calculation engine), fetch/update profile & settings
    auth/login/, auth/logout/    Email/password session endpoints
    auth/google/, auth/google/callback/  Google OAuth 2.0 authorization-code flow
    uploads/pdf/           PDF/DOCX upload -> parses with AI, returns dishes for review (nothing saved yet)
    uploads/pdf/confirm/   Saves the (possibly user-edited) dishes from the review step
    recipes/               Paste recipe text / Instagram / YouTube link -> AI structuring
    diet-plan/             Generate + fetch the 7-day diet plan
    diet-plan/swap-meal/   Replace a single meal slot without regenerating the whole week
    grocery/                Generate + fetch a day's aggregated grocery list
    meal-log/               Record what was actually eaten for a slot (confirm-planned / photo / custom text)
    glp1-log/                GLP-1 side-effect check-in entries
    whatsapp/send/          Manual "send now" trigger (diet plan or grocery list)
    whatsapp/webhook/       Twilio delivery-status callback
    whatsapp/inbound/       Twilio inbound-message webhook — reply with a photo to log a meal
    tts/voice/              Public audio endpoint Twilio fetches for the voice note
    cron/nightly-plan/      Per-user nightly job: sends tomorrow's diet plan + grocery list at each
                            user's own configured local time
    weight/                 Weigh-in log, surfaced on /progress
  manifest.ts             PWA manifest (installable)
lib/
  calculations.ts         BMI / BMR (Mifflin-St Jeor) / TDEE / deficit / protein targets + GLP-1 rules,
                          plus applyCalorieBudget() for the "I know my own budget" manual-entry path
  ai/                     Claude client, PDF parser, DOCX parser, recipe parser (+ scanned-PDF fallback via
                          Claude's native document input), diet plan generator, meal-photo estimator
  whatsapp/               Twilio/Meta client (provider-aware, template-compliant), message templates, send dispatcher
  tts/                    ElevenLabs / Google TTS client
  grocery/aggregator.ts   Dedupes + sums ingredients across a day's meals, categorized
  plan/buildPlanFromRecipes.ts  Zero-AI weekly plan builder + recipe-shortage warnings
  validation/schemas.ts   Zod schemas (onboarding, complete-profile, phone numbers, recipes, meal-log, etc.)
  session.ts              Cookie-based "current user" session + isProfileComplete() gate
  auth/password.ts        bcrypt password hashing/verification
  auth/google.ts           Google OAuth 2.0 helper (auth URL, code exchange, userinfo)
  api/errors.ts           Turns thrown errors (e.g. a missing API key) into clean JSON error responses
  utils.ts                Date helpers, incl. localDateParts/localDateUTCMidnight for per-user timezone logic
  timezones.ts            Curated IANA timezone list for the delivery-preferences dropdown
prisma/schema.prisma      Users, Recipes, MealPlans, Groceries, WhatsAppLogs, WeightLogs, WaterLogs,
                          MealLogs, Glp1Logs
public/sw.js              Service worker (offline cache for diet plan / grocery list)
scripts/scheduler.ts      node-cron worker for platforms without native cron (Railway/Render)
vercel.json               Vercel Cron schedule (every 30 min — see "Scheduler" below)
```

## How the pieces fit together

1. **Sign up** (`/onboarding`) collects an email + password alongside the health/food profile and
   POSTs to `/api/users`, which hashes the password (bcrypt, `lib/auth/password.ts`), runs
   `lib/calculations.ts` to compute BMI/BMR/TDEE/calorie target/protein target (applying the GLP-1
   protocol and a safe-calorie floor), and stores everything on the `User` row. A session cookie
   (`nutriping_user_id`) is set on success. Returning users log in at `/login`
   (`/api/auth/login`), which verifies the password and sets the same cookie; `/api/auth/logout`
   (wired to the Settings screen) clears it. `passwordHash` is never included in any API response.
   **"Continue with Google"** (`/api/auth/google` → `/api/auth/google/callback`) runs a standard
   OAuth 2.0 authorization-code flow (`lib/auth/google.ts`) and creates a minimal `User` row
   (email + name only, `authProvider: GOOGLE`, no password); the `(app)` layout then redirects to
   **`/onboarding/complete-profile`** until the health/food fields are filled in
   (`isProfileComplete()` in `lib/session.ts` is the gate every authenticated screen checks). Both
   forms include a calorie-budget choice — **"Calculate for me"** (the usual BMR/TDEE pipeline) or
   **"I know my budget"** (type in a dietitian-given calorie/protein/carb/fat target directly,
   `calorieSource: MANUAL`, `lib/calculations.ts`'s `applyCalorieBudget()`) — and a delivery-
   preferences step (timezone, auto-detected via the browser and overridable, + what local hour the
   nightly WhatsApp reminder should fire).
2. **Dashboard** (`/dashboard`) is where the diet plan gets built: upload a diet-plan **PDF or
   DOCX** (`lib/ai/pdfParser.ts` / `lib/ai/docParser.ts`) — a scanned/handwritten chart that
   extracts to near-empty text is automatically retried by sending the raw PDF to Claude as a
   native document input, which reads the page image directly instead of failing — or add one or
   more Instagram/YouTube links / pasted recipes at once (`RecipeForm` — "+ Add another" for a
   batch submission, each entry processed and reported independently so one bad link doesn't block
   the rest). For **YouTube**, `lib/ai/youtubeTranscript.ts` auto-fetches the video's caption track
   (no API key — same public endpoint the YouTube player itself uses) so pasting text is optional;
   if the video has no captions, the API returns a clear error asking for pasted text instead.
   **Instagram** has no public unauthenticated API for this, so its caption/description must always
   be pasted. Either way, the resulting text is handed to Claude (`lib/ai/recipeParser.ts`), which
   returns structured dishes — including a best-guess `mealType` (breakfast/snack/lunch/dinner) —
   with ingredients/macros/micros (AI-estimated when the source doesn't state them, flagged via
   `aiEstimated`). **PDF/DOCX uploads stop at a review step first**: `POST /api/uploads/pdf` parses
   and returns the extracted dishes without saving anything; the UI shows each one with an
   editable meal-slot dropdown and an include/exclude checkbox, and only `POST
   /api/uploads/pdf/confirm` actually persists them as `Recipe` rows. Everything saved here becomes
   the input to the diet-plan generator (see #3).
3. **Weekly Plan** (`/plan`) calls `/api/diet-plan/generate`. **If the user has any saved recipes**
   (from an uploaded PDF/DOCX or pasted Instagram/YouTube links), the plan is built **entirely from
   those — no AI call** (`lib/plan/buildPlanFromRecipes.ts`): recipes are grouped by `mealType` and
   rotated through the 7×5 grid of slots so every recipe is used before any repeat, with day totals
   simply summing whatever the user's own recipes add up to (not tuned to calorieTarget, since
   nothing is invented) — if a meal-type pool is empty or too small to cover the week without heavy
   repetition, the response includes plain-language `warnings` the UI surfaces right after
   generating. **If the user has no saved recipes**, the button becomes "Generate AI Diet Plan" and
   falls back to Claude (`lib/ai/dietPlanGenerator.ts`) to invent a full week matched to
   calorie/protein targets. Either way the result persists as 7 `MealPlan` rows (keyed by
   `weekStartDate` + `dayIndex`); a "generate with AI instead" option is also available even when
   recipes exist, via `mode: "AI"` on the same endpoint. Each meal card shows a source tag ("From
   your diet plan PDF" / "From Instagram" / "AI generated", linked back to the source when there is
   one) and a per-meal **"Swap"** button (`/api/diet-plan/swap-meal`) that replaces just that one
   slot — from another unused recipe of the same meal type if one exists, or a single Claude-
   generated alternative if not — without touching the rest of the week.
4. **Grocery List** (`/grocery`) aggregates a single day's ingredients (`lib/grocery/aggregator.ts`) —
   dedup + sum by name/unit, categorized (produce/dairy/grains/protein/spices/other).
5. **Daily Meal Logger** (`/log`) is how adherence actually gets recorded: for each of today's five
   slots, tap **"Ate Planned Meal"** to copy that slot's planned macros straight into a `MealLog`
   row, **"Log with photo"** to snap a plate (client-side resized/compressed, then sent to Claude
   vision via `lib/ai/mealPhotoEstimator.ts` for a dish name + macro estimate), or **"Log something
   else"** to type a quick swap description (estimated the same way, from text). You can also just
   reply to a WhatsApp reminder with a photo of your plate — the inbound webhook
   (`/api/whatsapp/inbound`) runs the same Claude-vision estimate, infers which slot it's for from
   the time of day, saves the `MealLog`, and texts back a confirmation.
6. **Progress** (`/progress`) turns those logs into three things: an adherence ring (logged vs.
   planned slots over the last 7 days), a calorie-consistency ring (today's logged calories vs.
   `calorieTarget`), and a weight trend chart (`WeightLog`, with a simple log-weight form — the
   `/api/weight` endpoint already existed but had no UI before now). If `isGlp1` is set, a GLP-1
   check-in form (nausea 0-5, hydration, protein-target-hit) is shown too, backed by a new
   `Glp1Log` model.
7. **WhatsApp**: `lib/whatsapp/dispatch.ts` sends the formatted text (`lib/whatsapp/templates.ts`)
   via a provider-aware `sendWhatsAppMessage()` (`lib/whatsapp/client.ts` — Twilio freeform by
   default, or an approved Meta Cloud **Utility template** when `WHATSAPP_PROVIDER=meta_template` is
   set, since WhatsApp policy only allows freeform business-initiated text within a 24h reply
   window), plus a voice note whose media URL points at `/api/tts/voice` (generated on-demand). The
   nightly cron job (`/api/cron/nightly-plan`) runs every 30 minutes and, for each user, checks
   whether **their own** local time (per `User.timezone`) currently falls in **their own**
   configured `dispatchHour` window (default 7 PM, editable on Settings or at onboarding, alongside
   an auto-detected timezone) — when it does, it sends that user's next calendar day's diet plan +
   grocery list combined into one WhatsApp message. The UI's "Send now" buttons (on a daily plan
   page / the grocery page) run the diet-only or grocery-only code path manually, for testing.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `DATABASE_URL` at minimum to run the app locally; AI/WhatsApp/TTS keys are only needed to
exercise those specific features (see `.env.example` for the full list and where to get each key).

### 3. Database

```bash
npx prisma migrate deploy   # applies the existing migrations to your Postgres instance
npm run db:studio           # optional: browse data
```

(Use `npx prisma migrate reset` instead if you want to wipe and reapply from scratch — useful when
testing from a clean slate.)

Works unmodified against Supabase, Neon, or Railway Postgres — just paste their connection string
into `DATABASE_URL`.

### 4. Run the app

```bash
npm run dev
```

Visit `http://localhost:3000` — you'll land on `/onboarding` until a profile exists.

### 5. Enable AI features

Set `ANTHROPIC_API_KEY` (get one at console.anthropic.com). Without it, PDF/DOCX upload, recipe
parsing, and diet plan generation return a clear JSON error instead of crashing or hanging.

### 6. Enable Google Sign-In (optional)

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an **OAuth
   2.0 Client ID** of type "Web application".
2. Add an **Authorized redirect URI**: `<APP_URL>/api/auth/google/callback` (e.g.
   `http://localhost:3000/api/auth/google/callback` for local dev).
3. Copy the Client ID/Secret into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
4. Restart the dev server. The "Continue with Google" button on `/login` and `/onboarding` now
   works; without these env vars it redirects back with a friendly "not set up yet" message instead
   of erroring.

A brand-new Google sign-in only has an email and name — it's routed to
`/onboarding/complete-profile` to fill in the rest before the dashboard unlocks.

## WhatsApp integration steps (Twilio)

1. Create a Twilio account and open the [WhatsApp sandbox](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn) (or apply for a production WhatsApp Business sender for real users).
2. Copy `Account SID` and `Auth Token` into `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`.
3. Set `TWILIO_WHATSAPP_FROM` to the sandbox number shown in the console (e.g. `+14155238886`) or
   your approved sender.
4. In the Twilio console, set the WhatsApp sender's **status callback URL** to
   `https://<your-app>/api/whatsapp/webhook` so delivery/read receipts update `WhatsAppLog` rows.
5. Each user must send the sandbox's join code (e.g. `join <word-pair>`) once from WhatsApp before
   Twilio is allowed to message them — a sandbox-only requirement, not needed on a production sender.
6. Add each user's number (with country code) from the app's Settings screen. Test with
   "Send now" on a daily plan page before relying on the 7 PM nightly cron job.

7. **Inbound photo replies:** in the same Twilio console, set the sender's **"A message comes in"**
   webhook to `https://<your-app>/api/whatsapp/inbound` so a user can reply to their reminder with a
   photo of their plate to log it automatically.

**Going to production — WhatsApp template compliance:** WhatsApp Business policy only allows
freeform business-initiated text within a 24-hour window after the user last messaged in. The
nightly reminder is proactive and nobody necessarily replied first, so outside the Twilio sandbox
it needs a pre-approved **Utility-category template** instead, or it will simply get rejected. To
switch: create a template in Meta Business Manager whose body is a single `{{1}}` variable (e.g.
`"Here's your plan for tomorrow: {{1}}"`), wait for approval, then set `WHATSAPP_PROVIDER=meta_template`,
`WHATSAPP_TEMPLATE_NAME=<your template name>`, and `META_WHATSAPP_TOKEN` / `META_PHONE_NUMBER_ID`.
`lib/whatsapp/client.ts`'s `sendWhatsAppMessage()` picks the right transport automatically based on
`WHATSAPP_PROVIDER` — no other code changes needed. (Voice notes still go via Twilio either way.)

## Scheduler

Delivery is **per-user**: each user has their own `timezone` (IANA string, auto-detected at
onboarding with a manual override) and `dispatchHour` (0-23, default 19 = 7 PM), editable later on
Settings. `/api/cron/nightly-plan` is designed to be hit every 30 minutes — each run checks every
user's *own* current local time against their *own* configured hour and only sends to whoever is
currently in that half-hour window, so a user in `America/New_York` and one in `Asia/Kolkata` both
get their reminder at their own 7 PM, independent of each other and of the server's clock.

- **Vercel:** `vercel.json` declares a `*/30 * * * *` cron schedule. **Note:** Vercel's Hobby (free)
  plan only allows daily-cadence cron jobs — this every-30-minutes schedule needs a Pro plan to
  actually fire that often. Set `CRON_SECRET` in your Vercel project env vars — Vercel automatically
  sends it as `Authorization: Bearer <CRON_SECRET>`, which `lib/cron/auth.ts` verifies.
- **Railway / Render / Hobby-tier Vercel / running locally (no frequent native cron):** run
  `npm run worker` as a second always-on process instead — e.g. a second terminal tab alongside
  `npm run dev` when testing locally. It hits the same `/api/cron/nightly-plan` route every 30
  minutes using `node-cron` (and once immediately on startup, so you get instant feedback instead
  of waiting up to 30 minutes), giving you real per-timezone delivery regardless of platform.
  It loads `.env` itself via Node's `--env-file` flag (needs Node 20.6+) since — unlike `next dev` —
  a standalone script doesn't load `.env` automatically; if it exits immediately with "APP_URL and
  CRON_SECRET must be set", check your Node version with `node -v`.

## Deployment

- **Frontend + API:** Vercel (`vercel --prod`), or any Node host (Railway/Render) since API routes are
  just Node route handlers.
- **Database:** Supabase or Neon (serverless Postgres) — paste the pooled connection string into
  `DATABASE_URL` and run `npm run db:deploy` (applies migrations without prompting) as part of your
  deploy step.
- Remember to set `APP_URL` / `NEXT_PUBLIC_APP_URL` to the deployed URL — it's used to build the
  publicly-fetchable TTS voice-note link that Twilio downloads.

## Validation & safety rules already enforced

- Calorie targets can never go below 1500 kcal (male) / 1200 kcal (female), and a warning is
  surfaced if the requested deficit would exceed 1000 kcal/day or push the target below 80% of BMR
  (`lib/calculations.ts`).
- GLP-1 users automatically get a smaller 300–400 kcal deficit and a higher protein target
  (1.6 g/kg) instead of the standard 500 kcal deficit / 1.2 g/kg.
- WhatsApp numbers are validated as E.164 (`+` + country code + digits) and capped at 2 per user.
- Recipes with no explicit nutrition data are AI-estimated and flagged (`aiEstimated: true`) instead
  of silently defaulting to zero.

## Bonus features included

- Water intake tracking (`/api/water`) — implemented as an API but not currently wired into a
  screen. Weight tracking (`/api/weight`) now has a UI on `/progress`.
- Offline-cached diet plan / grocery list via the service worker (`public/sw.js`), so the app remains
  usable with spotty connectivity once a plan has been loaded once.

## Known gaps / deliberately not implemented

- **Phone/OTP login and Apple ID sign-in** aren't wired up — both need a vendor decision only you
  can make (which SMS provider for OTP; an Apple Developer account for Sign in with Apple) before
  there's anything real to build against, unlike Google OAuth which just needed API keys.
- **Video-audio transcription** (Whisper-style) for Reels/Shorts with no captions and no usable
  caption text isn't implemented — it would need a download step (yt-dlp or similar) with its own
  ToS considerations, on top of an audio-transcription API. YouTube still auto-fetches captions when
  they exist; both platforms fall back to asking the user to paste text.
