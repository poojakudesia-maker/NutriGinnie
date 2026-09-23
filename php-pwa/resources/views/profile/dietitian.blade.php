<x-layouts.app title="Dietitian plan · NutriPing">
    <div class="flex flex-col gap-4 pt-2">
        <x-profile.progress :step-index="$stepIndex" :total-steps="$totalSteps" />

        <div>
            <h1 class="text-xl font-bold text-[var(--color-charcoal)]">🩺 Working with a dietitian?</h1>
            <p class="mt-0.5 text-xs text-[var(--color-charcoal-muted)]">We'll blend their plan with AI suggestions</p>
        </div>

        <x-card>
            <form method="POST" action="{{ route('profile.update', 'dietitian') }}" enctype="multipart/form-data" class="flex flex-col gap-4">
                @csrf

                <div class="rounded-xl border border-[var(--color-warm-border)] p-3">
                    <label class="flex items-center gap-2 text-sm font-medium">
                        <input type="hidden" name="has_dietitian" value="0">
                        <input type="checkbox" name="has_dietitian" value="1" onchange="document.getElementById('dietitian-fields').classList.toggle('hidden', !this.checked)"
                            {{ old('has_dietitian', $user->has_dietitian) ? 'checked' : '' }}
                            class="rounded accent-[var(--color-orange)]">
                        Yes, I have a dietitian's plan
                    </label>

                    <div id="dietitian-fields" class="{{ old('has_dietitian', $user->has_dietitian) ? '' : 'hidden' }} mt-3 flex flex-col gap-3">
                        <div>
                            <label for="dietitian_name" class="mb-1 block text-sm font-medium">Dietitian's name</label>
                            <input id="dietitian_name" name="dietitian_name" type="text" value="{{ old('dietitian_name', $user->dietitian_name) }}"
                                class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                            @error('dietitian_name')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                        </div>
                        <div>
                            <label for="dietitian_contact" class="mb-1 block text-sm font-medium">Dietitian's contact</label>
                            <input id="dietitian_contact" name="dietitian_contact" type="text" placeholder="Phone or email" value="{{ old('dietitian_contact', $user->dietitian_contact) }}"
                                class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                            @error('dietitian_contact')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                        </div>
                        <div>
                            <label for="diet_pdf" class="mb-1 block text-sm font-medium">Upload your diet plan (PDF)</label>
                            <input id="diet_pdf" name="diet_pdf" type="file" accept="application/pdf"
                                class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-orange-light)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[var(--color-orange-dark)]">
                            @if ($user->dietitian_pdf_path)
                                <p class="mt-1 text-xs text-[var(--color-sage)]">A plan is already on file. Uploading a new one will replace it.</p>
                            @endif
                            @error('diet_pdf')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                        </div>
                    </div>
                </div>

                <x-button type="submit" class="mt-2">Continue</x-button>
            </form>
        </x-card>
    </div>
</x-layouts.app>
