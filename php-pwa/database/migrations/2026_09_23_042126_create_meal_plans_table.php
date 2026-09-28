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
        Schema::create('meal_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->date('week_start_date'); // Monday of the plan week
            $table->unsignedTinyInteger('day_index'); // 0..6 (0 = week_start_date)
            $table->string('day_label'); // "Monday", "Tuesday", ...

            $table->json('meals'); // { breakfast, snack1, lunch, snack2, dinner }

            $table->float('total_calories');
            $table->float('total_protein_g');
            $table->float('total_carbs_g');
            $table->float('total_fat_g');

            $table->timestamps();
            $table->unique(['user_id', 'week_start_date', 'day_index']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meal_plans');
    }
};
