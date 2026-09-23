<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\VerifyCodeController;
use App\Http\Controllers\MealPlanController;
use App\Http\Controllers\ProfileSetupController;
use App\Http\Controllers\RecipeController;
use App\Http\Controllers\WhatsAppWebhookController;
use Illuminate\Support\Facades\Route;

Route::get('/webhooks/whatsapp', [WhatsAppWebhookController::class, 'verify']);
Route::post('/webhooks/whatsapp', [WhatsAppWebhookController::class, 'handle']);

Route::get('/', function () {
    return auth()->check() ? redirect()->route('dashboard') : redirect()->route('login.create');
});

Route::middleware('guest')->group(function () {
    Route::get('/register', [RegisterController::class, 'create'])->name('register.create');
    Route::post('/register', [RegisterController::class, 'store'])->name('register.store');

    Route::get('/verify-code', [VerifyCodeController::class, 'create'])->name('verify-code.create');
    Route::post('/verify-code', [VerifyCodeController::class, 'store'])->name('verify-code.store');
    Route::post('/verify-code/resend', [RegisterController::class, 'resend'])->name('verify-code.resend');

    Route::get('/login', [LoginController::class, 'create'])->name('login.create');
    Route::post('/login', [LoginController::class, 'store'])->name('login.store');
});

Route::post('/logout', [LoginController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware('auth')->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile/{step}', [ProfileSetupController::class, 'edit'])->name('profile.edit');
    Route::post('/profile/{step}', [ProfileSetupController::class, 'update'])->name('profile.update');

    Route::get('/recipes', [RecipeController::class, 'index'])->name('recipes.index');
    Route::post('/recipes', [RecipeController::class, 'store'])->name('recipes.store');
    Route::delete('/recipes/{recipe}', [RecipeController::class, 'destroy'])->name('recipes.destroy');

    Route::get('/meal-plan', [MealPlanController::class, 'show'])->name('meal-plan.show');
    Route::post('/meal-plan/generate', [MealPlanController::class, 'generate'])->name('meal-plan.generate');
    Route::post('/meal-plan/send-now', [MealPlanController::class, 'sendNow'])->name('meal-plan.send-now');
    Route::get('/meal-plan/pdf', [MealPlanController::class, 'downloadPdf'])->name('meal-plan.pdf');
});
