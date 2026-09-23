<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'for_date', 'items'])]
class Grocery extends Model
{
    protected function casts(): array
    {
        return [
            'for_date' => 'date',
            'items' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
