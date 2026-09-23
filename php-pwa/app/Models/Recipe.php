<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'user_id', 'name', 'source', 'source_url', 'raw_input', 'meal_type',
    'ingredients', 'instructions', 'calories', 'protein_g', 'carbs_g', 'fat_g',
    'fiber_g', 'iron_mg', 'calcium_mg', 'micros', 'ai_estimated',
])]
class Recipe extends Model
{
    protected function casts(): array
    {
        return [
            'ingredients' => 'array',
            'micros' => 'array',
            'ai_estimated' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
