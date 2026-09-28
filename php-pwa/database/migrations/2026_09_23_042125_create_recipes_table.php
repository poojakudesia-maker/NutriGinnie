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
        Schema::create('recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('name');
            $table->enum('source', ['PDF', 'DOCX', 'INSTAGRAM', 'YOUTUBE', 'MANUAL_TEXT', 'AI_GENERATED']);
            $table->string('source_url')->nullable();
            $table->text('raw_input')->nullable();

            // Best-effort classification (e.g. a PDF's "Breakfast:" heading). Null when the
            // source gives no hint — the deterministic weekly-plan builder treats null as
            // "usable in any slot".
            $table->enum('meal_type', ['BREAKFAST', 'SNACK', 'LUNCH', 'DINNER'])->nullable();

            $table->json('ingredients'); // [{ name, quantity, unit }]
            $table->text('instructions')->nullable();

            $table->float('calories')->nullable();
            $table->float('protein_g')->nullable();
            $table->float('carbs_g')->nullable();
            $table->float('fat_g')->nullable();
            $table->float('fiber_g')->nullable();
            $table->float('iron_mg')->nullable();
            $table->float('calcium_mg')->nullable();
            $table->json('micros')->nullable();

            $table->boolean('ai_estimated')->default(false);

            $table->timestamps();
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recipes');
    }
};
