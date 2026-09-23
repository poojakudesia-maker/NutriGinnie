<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Registration: email + mobile number required up front; a 6-digit code is emailed
            // and must be entered to verify before the account is usable. email_verified_at
            // (Laravel's default column) doubles as "activation complete" once the code matches.
            $table->string('mobile_number')->unique()->after('email');
            $table->string('email_activation_code', 6)->nullable()->after('email_verified_at');
            $table->timestamp('email_activation_code_expires_at')->nullable()->after('email_activation_code');

            // Basic profile (nullable: filled in during the onboarding wizard after registration)
            $table->unsignedTinyInteger('age')->nullable();
            $table->enum('gender', ['MALE', 'FEMALE'])->nullable();
            $table->string('ethnicity')->nullable();
            $table->float('height_cm')->nullable();
            $table->float('weight_kg')->nullable();
            $table->float('target_weight_kg')->nullable();
            $table->enum('activity_level', ['SEDENTARY', 'LIGHT', 'MODERATE', 'HIGH'])->nullable();
            $table->string('profile_photo_path')->nullable();

            // Health inputs
            $table->json('medical_conditions')->nullable();
            $table->boolean('is_glp1')->default(false);
            $table->string('glp1_medication')->nullable();
            $table->float('glp1_dosage_mg')->nullable();
            $table->enum('glp1_dosing_day', ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])->nullable();

            // Food preferences
            $table->enum('diet_type', ['VEG', 'EGGETARIAN', 'NON_VEG', 'VEGAN'])->default('VEG');
            $table->json('allergies')->nullable();
            $table->json('cuisine_preference')->nullable();
            $table->text('food_likes')->nullable();
            $table->text('food_dislikes')->nullable();

            // Dietitian
            $table->boolean('has_dietitian')->default(false);
            $table->string('dietitian_name')->nullable();
            $table->string('dietitian_contact')->nullable();

            // WhatsApp + delivery preferences
            $table->json('whatsapp_numbers')->nullable();
            $table->string('timezone')->default('Asia/Kolkata');
            $table->unsignedTinyInteger('dispatch_hour')->default(19);
            $table->boolean('whatsapp_reminders_enabled')->default(true);

            // Calculation engine outputs
            $table->enum('calorie_source', ['CALCULATED', 'MANUAL'])->default('CALCULATED');
            $table->float('bmi')->nullable();
            $table->float('bmr')->nullable();
            $table->float('tdee')->nullable();
            $table->float('calorie_target')->nullable();
            $table->float('protein_target_g')->nullable();
            $table->float('carb_target_g')->nullable();
            $table->float('fat_target_g')->nullable();
            $table->float('deficit_kcal')->nullable();
            $table->float('body_fat_percent_estimate')->nullable();
            $table->text('workout_recommendation')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'mobile_number', 'email_activation_code', 'email_activation_code_expires_at',
                'age', 'gender', 'ethnicity', 'height_cm', 'weight_kg', 'target_weight_kg',
                'activity_level', 'profile_photo_path',
                'medical_conditions', 'is_glp1', 'glp1_medication', 'glp1_dosage_mg', 'glp1_dosing_day',
                'diet_type', 'allergies', 'cuisine_preference', 'food_likes', 'food_dislikes',
                'has_dietitian', 'dietitian_name', 'dietitian_contact',
                'whatsapp_numbers', 'timezone', 'dispatch_hour', 'whatsapp_reminders_enabled',
                'calorie_source', 'bmi', 'bmr', 'tdee', 'calorie_target', 'protein_target_g',
                'carb_target_g', 'fat_target_g', 'deficit_kcal', 'body_fat_percent_estimate',
                'workout_recommendation',
            ]);
        });
    }
};
