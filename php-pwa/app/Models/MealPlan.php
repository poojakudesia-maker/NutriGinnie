<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'user_id', 'week_start_date', 'day_index', 'day_label',
    'meals', 'total_calories', 'total_protein_g', 'total_carbs_g', 'total_fat_g',
])]
class MealPlan extends Model
{
    protected function casts(): array
    {
        return [
            'week_start_date' => 'date',
            'meals' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
