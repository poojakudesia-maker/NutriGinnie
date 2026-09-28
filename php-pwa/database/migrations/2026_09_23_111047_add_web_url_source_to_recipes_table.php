<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE recipes MODIFY COLUMN source ENUM('PDF', 'DOCX', 'INSTAGRAM', 'YOUTUBE', 'MANUAL_TEXT', 'WEB_URL', 'AI_GENERATED') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE recipes MODIFY COLUMN source ENUM('PDF', 'DOCX', 'INSTAGRAM', 'YOUTUBE', 'MANUAL_TEXT', 'AI_GENERATED') NOT NULL");
    }
};
