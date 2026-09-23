<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable([
    'name', 'email', 'mobile_number', 'password',
    'age', 'gender', 'ethnicity', 'height_cm', 'weight_kg', 'target_weight_kg', 'activity_level', 'profile_photo_path',
    'medical_conditions', 'is_glp1', 'glp1_medication', 'glp1_dosage_mg', 'glp1_dosing_day',
    'diet_type', 'allergies', 'cuisine_preference', 'food_likes', 'food_dislikes',
    'has_dietitian', 'dietitian_name', 'dietitian_contact', 'dietitian_pdf_path',
    'whatsapp_numbers', 'timezone', 'dispatch_hour', 'whatsapp_reminders_enabled',
    'calorie_source', 'bmi', 'bmr', 'tdee', 'calorie_target', 'protein_target_g',
    'carb_target_g', 'fat_target_g', 'deficit_kcal', 'body_fat_percent_estimate', 'workout_recommendation',
])]
#[Hidden(['password', 'remember_token', 'email_activation_code'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'email_activation_code_expires_at' => 'datetime',
            'password' => 'hashed',
            'medical_conditions' => 'array',
            'allergies' => 'array',
            'cuisine_preference' => 'array',
            'whatsapp_numbers' => 'array',
            'is_glp1' => 'boolean',
            'has_dietitian' => 'boolean',
            'whatsapp_reminders_enabled' => 'boolean',
        ];
    }

    /** True once the profile-setup wizard has been completed (gate for every authenticated screen). */
    public function hasCompleteProfile(): bool
    {
        return $this->age !== null
            && $this->gender !== null
            && $this->height_cm !== null
            && $this->weight_kg !== null
            && $this->activity_level !== null;
    }

    public function recipes()
    {
        return $this->hasMany(Recipe::class);
    }

    public function mealPlans()
    {
        return $this->hasMany(MealPlan::class);
    }

    public function groceries()
    {
        return $this->hasMany(Grocery::class);
    }

    public function whatsappLogs()
    {
        return $this->hasMany(WhatsappLog::class);
    }

    public function mealLogs()
    {
        return $this->hasMany(MealLog::class);
    }

    public function glp1Logs()
    {
        return $this->hasMany(Glp1Log::class);
    }

    public function weightLogs()
    {
        return $this->hasMany(WeightLog::class);
    }
}
