<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'logged_at', 'nausea_level', 'hydration_ml', 'protein_compliant', 'notes'])]
class Glp1Log extends Model
{
    protected function casts(): array
    {
        return [
            'logged_at' => 'datetime',
            'protein_compliant' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
