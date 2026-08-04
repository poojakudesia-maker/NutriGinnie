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
    plan/[day]/           Daily meal breakdown + "send to WhatsApp" button
    grocery/              Grocery list (prev/next day navigation)
    settings/             WhatsApp numbers, PDF/DOCX upload, recipe paste, saved recipes, log out
  onboarding/             Email/password signup form (+ "Continue with Google") + health/food profile
  onboarding/complete-profile/  Health/food profile step for accounts created via Google (no password)
  login/                  Email/password login + "Continue with Google"
  api/
    users/                Create profile (+ calculation engine), fetch/update profile & settings
    auth/login/, auth/logout/    Email/password session endpoints
    auth/google/, auth/google/callback/  Google OAuth 2.0 authorization-code flow
    uploads/pdf/           PDF or DOCX upload -> text extraction -> AI recipe structuring
    recipes/               Paste recipe text / Instagram / YouTube link -> AI structuring
    diet-plan/             Generate + fetch the 7-day AI diet plan
    grocery/                Generate + fetch a day's aggregated grocery list
    whatsapp/send/          Manual "send now" trigger (diet plan or grocery list)
    whatsapp/webhook/       Twilio delivery-status callback
    tts/voice/              Public audio endpoint Twilio fetches for the voice note
    cron/nightly-plan/      7 PM IST job: sends tomorrow's diet plan + grocery list (combined) to every user
    weight/, water/         Bonus trackers (API only — not surfaced on the dashboard currently)
  manifest.ts             PWA manifest (installable)
lib/
  calculations.ts         BMI / BMR (Mifflin-St Jeor) / TDEE / deficit / protein targets + GLP-1 rules
  ai/                     Claude client, PDF parser, DOCX parser, recipe parser, diet plan generator
  whatsapp/               Twilio client, message templates, send dispatcher
  tts/                    ElevenLabs / Google TTS client
  grocery/aggregator.ts   Dedupes + sums ingredients across a day's meals, categorized
  validation/schemas.ts   Zod schemas (onboarding, complete-profile, phone numbers, recipes, etc.)
  session.ts              Cookie-based "current user" session + isProfileComplete() gate
  auth/password.ts        bcrypt password hashing/verification
  auth/google.ts           Google OAuth 2.0 helper (auth URL, code exchange, userinfo)
  api/errors.ts           Turns thrown errors (e.g. a missing API key) into clean JSON error responses
prisma/schema.prisma      Users, Recipes, MealPlans, Groceries, WhatsAppLogs, WeightLogs, WaterLogs
public/sw.js              Service worker (offline cache for diet plan / grocery list)
scripts/scheduler.ts      node-cron worker for platforms without native cron (Railway/Render)
vercel.json               Vercel Cron schedule (7 PM IST)
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
   (`isProfileComplete()` in `lib/session.ts` is the gate every authenticated screen checks).
2. **Dashboard** (`/dashboard`) is where the diet plan gets built: upload a diet-plan **PDF or
   DOCX** (`lib/ai/pdfParser.ts` / `lib/ai/docParser.ts`), or add one or more Instagram/YouTube
   links / pasted recipes at once (`RecipeForm` — "+ Add another" for a batch submission, each entry
   processed and reported independently so one bad link doesn't block the rest). For **YouTube**,
   `lib/ai/youtubeTranscript.ts` auto-fetches the video's caption track (no API key — same public
   endpoint the YouTube player itself uses) so pasting text is optional; if the video has no
   captions, the API returns a clear error asking for pasted text instead. **Instagram** has no
   public unauthenticated API for this, so its caption/description must always be pasted. Either way,
   the resulting text is handed to Claude (`lib/ai/recipeParser.ts`), which returns structured
   `Recipe` rows — including a best-guess `mealType` (breakfast/snack/lunch/dinner) — with
   ingredients/macros/micros (AI-estimated when the source doesn't state them, flagged via
   `aiEstimated`). Everything saved here becomes the input to the diet-plan generator (see #3).
3. **Weekly Plan** (`/plan`) calls `/api/diet-plan/generate`. **If the user has any saved recipes**
   (from an uploaded PDF/DOCX or pasted Instagram/YouTube links), the plan is built **entirely from
   those — no AI call** (`lib/plan/buildPlanFromRecipes.ts`): recipes are grouped by `mealType` and
   rotated through the 7×5 grid of slots so every recipe is used before any repeat, with day totals
   simply summing whatever the user's own recipes add up to (not tuned to calorieTarget, since
   nothing is invented). **If the user has no saved recipes**, the button becomes "Generate AI Diet
   Plan" and falls back to Claude (`lib/ai/dietPlanGenerator.ts`) to invent a full week matched to
   calorie/protein targets. Either way the result persists as 7 `MealPlan` rows (keyed by
   `weekStartDate` + `dayIndex`); a "generate with AI instead" option is also available even when
   recipes exist, via `mode: "AI"` on the same endpoint.
4. **Grocery List** (`/grocery`) aggregates a single day's ingredients (`lib/grocery/aggregator.ts`) —
   dedup + sum by name/unit, categorized (produce/dairy/grains/protein/spices/other).
5. **WhatsApp**: `lib/whatsapp/dispatch.ts` sends the formatted text (`lib/whatsapp/templates.ts`) via
   Twilio, plus a voice note whose media URL points at `/api/tts/voice` (generated on-demand). A single
   nightly cron job (`/api/cron/nightly-plan`, 7 PM IST) sends the **next day's** diet plan and
   grocery list combined into one WhatsApp message — the message sent at 7 PM on Aug 4 covers Aug 5.
   The UI's "Send now" buttons (on a daily plan page / the grocery page) run the diet-only or
   grocery-only code path manually, for testing.

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
npx prisma migrate dev --name init   # creates tables in your Postgres instance
npm run db:studio                    # optional: browse data
```

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

**Switching to Meta's WhatsApp Cloud API instead:** `lib/whatsapp/client.ts` already includes
`sendMetaCloudTemplate`. Set `META_WHATSAPP_TOKEN` / `META_PHONE_NUMBER_ID`, create an approved
message template in Meta Business Manager, and swap the calls in `lib/whatsapp/dispatch.ts` to use it.

## Scheduler

- **Vercel:** `vercel.json` already declares the nightly cron job (7 PM IST / 13:30 UTC). Set
  `CRON_SECRET` in your Vercel project env vars — Vercel automatically sends it as
  `Authorization: Bearer <CRON_SECRET>`, which `lib/cron/auth.ts` verifies.
- **Railway / Render (no native cron):** run `npm run worker` as a second service/process. It hits
  the same `/api/cron/nightly-plan` route on an internal schedule using `node-cron`, so behavior is
  identical.

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

- Weight tracking (`/api/weight`) and water intake tracking (`/api/water`) — implemented as APIs +
  components (`components/dashboard/WeightTracker.tsx`, `WaterTracker.tsx`) but not currently wired
  into a screen, since the dashboard was repurposed as the "build your plan" hub (upload/recipes/
  generate). Drop the components back into any page to resurface them.
- Offline-cached diet plan / grocery list via the service worker (`public/sw.js`), so the app remains
  usable with spotty connectivity once a plan has been loaded once.
