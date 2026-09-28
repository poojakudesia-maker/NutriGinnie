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
        Schema::create('glp1_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->timestamp('logged_at');
            $table->unsignedTinyInteger('nausea_level')->nullable(); // 0 (none) - 5 (severe)
            $table->unsignedInteger('hydration_ml')->nullable();
            $table->boolean('protein_compliant')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('glp1_logs');
    }
};
