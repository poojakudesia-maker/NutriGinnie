<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'user_id', 'phone_number', 'message_type', 'status',
    'provider_message_id', 'error_message', 'payload_preview', 'sent_at',
])]
class WhatsappLog extends Model
{
    protected function casts(): array
    {
        return ['sent_at' => 'datetime'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
