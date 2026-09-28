<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Checks every 15 minutes for users whose local dispatch hour has just arrived
// and sends them tomorrow's diet + grocery plan over WhatsApp. Requires the
// server cron to run `php artisan schedule:run` every minute (see README).
Schedule::command('app:send-nightly-plans')->everyFifteenMinutes();
