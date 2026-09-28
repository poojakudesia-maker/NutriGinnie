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
        Schema::create('whatsapp_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('phone_number');
            $table->enum('message_type', ['DIET_TEXT', 'GROCERY_TEXT']);
            $table->enum('status', ['QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED'])->default('QUEUED');
            $table->string('provider_message_id')->nullable();
            $table->text('error_message')->nullable();
            $table->string('payload_preview')->nullable();

            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whatsapp_logs');
    }
};
