<?php

namespace App\Services;

use App\Models\User;

class NutritionCalculator
{
    protected const ACTIVITY_MULTIPLIERS = [
        'SEDENTARY' => 1.2,
        'LIGHT' => 1.375,
        'MODERATE' => 1.55,
        'HIGH' => 1.725,
    ];

    /**
     * Derive BMI/BMR/TDEE/calorie targets/macros/body-fat estimate/workout guidance
     * from the user's profile. Returns null when required inputs are missing.
     *
     * @return array<string, float|string>|null
     */
    public static function calculate(User $user): ?array
    {
        if ($user->age === null || $user->gender === null || $user->height_cm === null || $user->weight_kg === null || $user->activity_level === null) {
            return null;
        }

        $heightM = $user->height_cm / 100;
        $bmi = round($user->weight_kg / ($heightM * $heightM), 1);

        $isMale = $user->gender === 'MALE';

        $bmr = (10 * $user->weight_kg) + (6.25 * $user->height_cm) - (5 * $user->age) + ($isMale ? 5 : -161);
        $bmr = round($bmr);

        $multiplier = self::ACTIVITY_MULTIPLIERS[$user->activity_level] ?? 1.2;
        $tdee = round($bmr * $multiplier);

        $deficitKcal = 0;
        if ($user->target_weight_kg !== null) {
            $diff = $user->weight_kg - $user->target_weight_kg;
            if ($diff > 0.5) {
                $deficitKcal = 500;
            } elseif ($diff < -0.5) {
                $deficitKcal = -300;
            }
        }

        $safetyFloor = $isMale ? 1500 : 1200;
        $calorieTarget = max($safetyFloor, $tdee - $deficitKcal);
        $deficitKcal = $tdee - $calorieTarget;

        $proteinTargetG = round($user->weight_kg * 1.8);
        $fatTargetG = round(($calorieTarget * 0.25) / 9);
        $remainingKcal = max(0, $calorieTarget - ($proteinTargetG * 4) - ($fatTargetG * 9));
        $carbTargetG = round($remainingKcal / 4);

        $bodyFatPercent = (1.20 * $bmi) + (0.23 * $user->age) - (10.8 * ($isMale ? 1 : 0)) - 5.4;
        $bodyFatPercent = round(max(3, min(60, $bodyFatPercent)), 1);

        return [
            'bmi' => $bmi,
            'bmr' => $bmr,
            'tdee' => $tdee,
            'calorie_target' => $calorieTarget,
            'deficit_kcal' => $deficitKcal,
            'protein_target_g' => $proteinTargetG,
            'carb_target_g' => $carbTargetG,
            'fat_target_g' => $fatTargetG,
            'body_fat_percent_estimate' => $bodyFatPercent,
            'workout_recommendation' => self::workoutRecommendation($user, $deficitKcal),
        ];
    }

    protected static function workoutRecommendation(User $user, float $deficitKcal): string
    {
        $cardio = match ($user->activity_level) {
            'SEDENTARY' => '120-150 minutes',
            'LIGHT' => '150-180 minutes',
            'MODERATE' => '180-220 minutes',
            default => '200-250 minutes',
        };

        $recommendation = "Aim for {$cardio} of moderate cardio per week (brisk walking, cycling, or swimming), "
            . 'plus 2-3 strength training sessions to preserve muscle mass.';

        if ($user->is_glp1) {
            $recommendation .= ' Since you\'re on GLP-1 medication, prioritise protein intake and resistance training to minimise muscle loss while losing fat.';
        }

        if ($deficitKcal > 0) {
            $recommendation .= sprintf(' Your current plan targets roughly a %d kcal/day deficit for gradual, sustainable weight loss.', $deficitKcal);
        } elseif ($deficitKcal < 0) {
            $recommendation .= sprintf(' Your current plan targets roughly a %d kcal/day surplus to support healthy weight gain.', abs($deficitKcal));
        }

        return $recommendation;
    }
}
