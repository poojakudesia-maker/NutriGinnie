<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\NutritionCalculator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class ProfileSetupController extends Controller
{
    /** @var array<int, string> */
    protected const STEPS = ['basics', 'health', 'diet', 'dietitian', 'photo'];

    public function show(Request $request): View
    {
        return view('profile.show', ['user' => $request->user()]);
    }

    public function edit(Request $request, string $step): View|RedirectResponse
    {
        if (! in_array($step, self::STEPS, true)) {
            abort(404);
        }

        return view('profile.' . $step, [
            'user' => $request->user(),
            'step' => $step,
            'stepIndex' => array_search($step, self::STEPS, true),
            'totalSteps' => count(self::STEPS),
            'nextStep' => $this->nextStep($step),
            'editMode' => $request->boolean('edit'),
        ]);
    }

    public function update(Request $request, string $step): RedirectResponse
    {
        if (! in_array($step, self::STEPS, true)) {
            abort(404);
        }

        $user = $request->user();

        match ($step) {
            'basics' => $this->updateBasics($request, $user),
            'health' => $this->updateHealth($request, $user),
            'diet' => $this->updateDiet($request, $user),
            'dietitian' => $this->updateDietitian($request, $user),
            'photo' => $this->updatePhoto($request, $user),
        };

        $this->recalculate($user);

        // Editing an already-complete profile from the Settings hub always
        // returns there, regardless of step order — only fresh onboarding
        // (no "edit" flag) walks through the wizard step by step.
        if ($request->boolean('edit')) {
            return redirect()->route('profile.show')->with('status', 'Saved!');
        }

        $next = $this->nextStep($step);

        if ($next === null) {
            return redirect()->route('dashboard')->with('status', 'Profile setup complete!');
        }

        return redirect()->route('profile.edit', $next);
    }

    protected function updateBasics(Request $request, User $user): void
    {
        $validated = $request->validate([
            'age' => ['required', 'integer', 'min:10', 'max:100'],
            'gender' => ['required', Rule::in(['MALE', 'FEMALE'])],
            'ethnicity_choice' => ['nullable', 'string', 'max:255'],
            'ethnicity_other' => ['nullable', 'required_if:ethnicity_choice,OTHER', 'string', 'max:255'],
            'height_cm' => ['required', 'numeric', 'min:100', 'max:250'],
            'weight_kg' => ['required', 'numeric', 'min:30', 'max:300'],
            'target_weight_kg' => ['nullable', 'numeric', 'min:30', 'max:300'],
            'activity_level' => ['required', Rule::in(['SEDENTARY', 'LIGHT', 'MODERATE', 'HIGH'])],
        ]);

        $ethnicity = $validated['ethnicity_choice'] ?? null;
        if ($ethnicity === 'OTHER') {
            $ethnicity = $validated['ethnicity_other'] ?? null;
        }

        $user->fill([
            'age' => $validated['age'],
            'gender' => $validated['gender'],
            'ethnicity' => $ethnicity,
            'height_cm' => $validated['height_cm'],
            'weight_kg' => $validated['weight_kg'],
            'target_weight_kg' => $validated['target_weight_kg'] ?? null,
            'activity_level' => $validated['activity_level'],
        ])->save();
    }

    protected function updateHealth(Request $request, User $user): void
    {
        $validated = $request->validate([
            'medical_conditions' => ['nullable', 'string', 'max:2000'],
            'is_glp1' => ['nullable', 'boolean'],
            'glp1_medication' => ['nullable', 'required_if:is_glp1,1', 'string', 'max:255'],
            'glp1_dosage_mg' => ['nullable', 'required_if:is_glp1,1', 'numeric', 'min:0', 'max:100'],
            'glp1_dosing_day' => ['nullable', 'required_if:is_glp1,1', Rule::in(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])],
        ]);

        $isGlp1 = $request->boolean('is_glp1');

        $user->fill([
            'medical_conditions' => $this->splitList($validated['medical_conditions'] ?? null),
            'is_glp1' => $isGlp1,
            'glp1_medication' => $isGlp1 ? $validated['glp1_medication'] : null,
            'glp1_dosage_mg' => $isGlp1 ? $validated['glp1_dosage_mg'] : null,
            'glp1_dosing_day' => $isGlp1 ? $validated['glp1_dosing_day'] : null,
        ])->save();
    }

    protected function updateDiet(Request $request, User $user): void
    {
        $validated = $request->validate([
            'diet_type' => ['required', Rule::in(['VEG', 'EGGETARIAN', 'NON_VEG', 'VEGAN'])],
            'allergies' => ['nullable', 'string', 'max:1000'],
            'cuisine_preference' => ['nullable', 'string', 'max:1000'],
            'food_likes' => ['nullable', 'string', 'max:2000'],
            'food_dislikes' => ['nullable', 'string', 'max:2000'],
        ]);

        $user->fill([
            'diet_type' => $validated['diet_type'],
            'allergies' => $this->splitList($validated['allergies'] ?? null),
            'cuisine_preference' => $this->splitList($validated['cuisine_preference'] ?? null),
            'food_likes' => $validated['food_likes'] ?? null,
            'food_dislikes' => $validated['food_dislikes'] ?? null,
        ])->save();
    }

    protected function updateDietitian(Request $request, User $user): void
    {
        $validated = $request->validate([
            'has_dietitian' => ['nullable', 'boolean'],
            'dietitian_name' => ['nullable', 'required_if:has_dietitian,1', 'string', 'max:255'],
            'dietitian_contact' => ['nullable', 'required_if:has_dietitian,1', 'string', 'max:255'],
            'diet_pdf' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
        ]);

        $hasDietitian = $request->boolean('has_dietitian');

        $pdfPath = $user->dietitian_pdf_path;
        if ($request->hasFile('diet_pdf')) {
            if ($pdfPath) {
                Storage::disk('public')->delete($pdfPath);
            }
            $pdfPath = $request->file('diet_pdf')->store('dietitian-plans/' . $user->id, 'public');
        }

        $user->fill([
            'has_dietitian' => $hasDietitian,
            'dietitian_name' => $hasDietitian ? ($validated['dietitian_name'] ?? null) : null,
            'dietitian_contact' => $hasDietitian ? ($validated['dietitian_contact'] ?? null) : null,
            'dietitian_pdf_path' => $hasDietitian ? $pdfPath : null,
        ])->save();
    }

    public function editWhatsapp(Request $request): View
    {
        return view('profile.whatsapp', ['user' => $request->user()]);
    }

    public function updateWhatsapp(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'mobile_number' => ['required', 'string', 'max:20', Rule::unique('users', 'mobile_number')->ignore($user->id)],
            'whatsapp_numbers' => ['array', 'max:2'],
            'whatsapp_numbers.*' => ['nullable', 'string', 'max:20'],
        ]);

        $numbers = array_values(array_filter(array_map('trim', $validated['whatsapp_numbers'] ?? [])));

        $user->fill([
            'mobile_number' => $validated['mobile_number'],
            'whatsapp_numbers' => $numbers ?: null,
        ])->save();

        return redirect()->route('profile.show')->with('status', 'WhatsApp numbers updated!');
    }

    protected function updatePhoto(Request $request, User $user): void
    {
        $validated = $request->validate([
            'profile_photo' => ['nullable', 'file', 'image', 'max:5120'],
        ]);

        if ($request->hasFile('profile_photo')) {
            if ($user->profile_photo_path) {
                Storage::disk('public')->delete($user->profile_photo_path);
            }

            $path = $request->file('profile_photo')->store('profile-photos/' . $user->id, 'public');
            $user->forceFill(['profile_photo_path' => $path])->save();
        }
    }

    protected function recalculate(User $user): void
    {
        if ($user->calorie_source === 'MANUAL') {
            return;
        }

        $results = NutritionCalculator::calculate($user->fresh());

        if ($results !== null) {
            $user->forceFill($results)->save();
        }
    }

    protected function splitList(?string $value): ?array
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        return array_values(array_filter(array_map('trim', explode(',', $value))));
    }

    protected function nextStep(string $step): ?string
    {
        $index = array_search($step, self::STEPS, true);

        return self::STEPS[$index + 1] ?? null;
    }
}
