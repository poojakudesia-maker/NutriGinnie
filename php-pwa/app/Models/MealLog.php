<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'user_id', 'for_date', 'slot', 'method', 'description', 'photo_path',
    'calories', 'protein_g', 'carbs_g', 'fat_g', 'ai_estimated',
])]
class MealLog extends Model
{
    protected function casts(): array
    {
        return [
            'for_date' => 'date',
            'ai_estimated' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
