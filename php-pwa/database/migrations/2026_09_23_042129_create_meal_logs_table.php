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
        Schema::create('meal_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->date('for_date');
            $table->enum('slot', ['BREAKFAST', 'SNACK1', 'LUNCH', 'SNACK2', 'DINNER']);
            $table->enum('method', ['PLANNED_CONFIRM', 'PHOTO', 'CUSTOM']);

            $table->string('description')->nullable();
            $table->string('photo_path')->nullable();

            $table->float('calories');
            $table->float('protein_g');
            $table->float('carbs_g');
            $table->float('fat_g');
            $table->boolean('ai_estimated')->default(false);

            $table->timestamps();
            $table->unique(['user_id', 'for_date', 'slot']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meal_logs');
    }
};
