# NutriPing (PHP)

Personalised diet planning PWA: email + mobile registration with an emailed
activation code, a multi-step profile wizard (BMI/BMR/calorie deficit/body-fat
estimate computed automatically), AI-parsed recipes, an AI-generated weekly
meal plan (blended with an optional dietitian PDF), PDF export, and nightly
delivery over **WhatsApp via Meta's Business Cloud API** (not Twilio).

Stack: **Laravel 12 + MySQL**, **Anthropic Claude API**, Tailwind v4, a
service-worker PWA shell. No Render, Vercel, or other PaaS — built to run on
standard PHP + MySQL hosting (e.g. Hostinger) with phpMyAdmin.

## Local development

Requires PHP 8.4+, Composer, Node 18+, and a MySQL/MariaDB server.

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
# edit .env: DB_DATABASE/DB_USERNAME/DB_PASSWORD for your local MySQL
php artisan migrate
php artisan storage:link
npm run build   # or `npm run dev` while iterating on styles
php artisan serve
```

Visit `http://localhost:8000`. Without `ANTHROPIC_API_KEY` set, recipe
parsing and plan generation fail gracefully with an on-screen error;
everything else (auth, profile, calculations, PWA shell) works standalone.

## Environment variables

See `.env.example` for the full list. The ones specific to this app:

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | Claude API — recipe parsing & weekly plan generation |
| `META_WHATSAPP_TOKEN`, `META_PHONE_NUMBER_ID`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN` | Meta WhatsApp Business Cloud API credentials (from the Meta App Dashboard) |
| `WHATSAPP_TEMPLATE_NAME` | Name of your approved WhatsApp Utility template (single `{{1}}` body variable — the nightly message is sent as that one parameter, since proactive/business-initiated sends require an approved template outside the 24h session window) |
| `MAIL_*` | Hostinger mailbox SMTP, for activation-code emails |

## Deploying to Hostinger (PHP + MySQL hosting)

1. **Database**: in hPanel → Databases → MySQL Databases, create a database
   and user, note the host/name/user/password (phpMyAdmin uses the same
   credentials).
2. **Code**: either `git clone` this repo directly on the server (if you have
   SSH access) or upload the files via File Manager/FTP. Composer and SSH are
   required — confirm your Hostinger plan includes them (Business/Premium
   tiers typically do; the cheapest Starter tier may not).
3. **Install dependencies** (over SSH, in the project directory):
   ```bash
   composer install --no-dev --optimize-autoloader
   npm install && npm run build
   ```
4. **Configure `.env`**: copy `.env.example` to `.env`, fill in the MySQL
   credentials from step 1, the Hostinger mailbox SMTP credentials, your
   `ANTHROPIC_API_KEY`, and the Meta WhatsApp credentials. Set `APP_URL` to
   your real domain and `APP_ENV=production`, `APP_DEBUG=false`.
5. **Generate the app key, migrate, link storage**:
   ```bash
   php artisan key:generate
   php artisan migrate --force
   php artisan storage:link
   php artisan config:cache && php artisan route:cache && php artisan view:cache
   ```
6. **Web root**: point your domain's document root at this project's
   `public/` directory (in hPanel → Domains, or via a symlink if your plan
   only lets you choose `public_html`). Everything outside `public/` must
   stay outside the web-servable root.
7. **Cron for scheduled tasks** (nightly WhatsApp delivery): in hPanel →
   Advanced → Cron Jobs, add a job that runs every minute:
   ```
   * * * * * php /home/<user>/path-to-project/artisan schedule:run >> /dev/null 2>&1
   ```
8. **Meta WhatsApp webhook**: in the Meta App Dashboard, set the webhook URL
   to `https://yourdomain/webhooks/whatsapp` and the verify token to match
   `META_WEBHOOK_VERIFY_TOKEN`. Subscribe to the `messages` field.
9. Visit your domain and register an account to confirm email delivery,
   then complete the profile wizard to confirm the database connection.

## Architecture notes

- **Auth**: `app/Http/Controllers/Auth/*` — registration creates an
  unverified user, emails a 6-digit code (`ActivationCodeMail`), and only
  logs the user in once the code is verified.
- **Profile wizard**: `app/Http/Controllers/ProfileSetupController.php`,
  five steps, each saved immediately to the `users` table.
- **Calculations**: `app/Services/NutritionCalculator.php` — BMI, Mifflin-St
  Jeor BMR/TDEE, calorie target/deficit, macros, a Deurenberg-formula body-fat
  estimate (clearly labelled as an estimate, not a measurement), and a
  workout recommendation.
- **AI**: `app/Services/Anthropic/AnthropicClient.php` is a thin wrapper over
  the Messages API (text + PDF document input). `RecipeParser` turns pasted
  recipe text into structured data; `DietPlanGenerator` builds the full week,
  optionally blending an uploaded dietitian PDF sent as a document to Claude.
- **WhatsApp**: `app/Services/WhatsApp/*` — Meta Cloud API only. Proactive
  sends use an approved template (`sendTemplate`); replies within an active
  session can use freeform text (`sendText`). `WhatsAppWebhookController`
  handles Meta's verification handshake and signed webhook POSTs.
- **Scheduler**: `app/Console/Commands/SendNightlyPlans.php`, registered in
  `routes/console.php`, runs every 15 minutes and sends each user their
  tomorrow's plan at their chosen local `dispatch_hour`.
- **PDF export**: `barryvdh/laravel-dompdf`, `resources/views/meal-plan/pdf.blade.php`.
- **PWA**: `public/manifest.webmanifest`, `public/sw.js` (network-first —
  never masks a new deploy behind a stale cached page).
