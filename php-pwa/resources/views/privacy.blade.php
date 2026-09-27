<x-layouts.app title="Privacy Policy · NutriPing">
    <div class="flex flex-col gap-4 pt-2 pb-10 text-sm leading-relaxed text-[var(--color-charcoal)]">
        <div>
            <h1 class="text-xl font-bold text-[var(--color-charcoal)]">Privacy Policy</h1>
            <p class="mt-1 text-xs text-[var(--color-charcoal-muted)]">Last updated: {{ now()->format('F j, Y') }}</p>
        </div>

        <x-card>
            <p>
                NutriPing ("we", "us", "our") provides a personalised diet-planning service accessible at
                <strong>nutriping.in</strong> (the "Service"). This Privacy Policy explains what information we
                collect, how we use it, and the choices you have. By creating an account or using the Service,
                you agree to the practices described here.
            </p>
        </x-card>

        <x-card>
            <h2 class="mb-2 font-semibold">1. Information we collect</h2>
            <ul class="ml-4 flex list-disc flex-col gap-1.5">
                <li><strong>Account information:</strong> your name, email address, mobile number, and password (stored encrypted, never in plain text).</li>
                <li><strong>Profile and health information:</strong> age, gender, ethnicity, height, weight, target weight, activity level, medical conditions, and GLP-1 medication details (medication name, dose, dosing day) if you choose to provide them.</li>
                <li><strong>Food preferences:</strong> your diet type (vegetarian/non-vegetarian/vegan/eggetarian), allergies, cuisine preferences, and foods you like or dislike.</li>
                <li><strong>Dietitian information:</strong> your dietitian's name and contact details, and any diet-plan PDF you choose to upload.</li>
                <li><strong>Recipes:</strong> any recipe text or links you paste into the app.</li>
                <li><strong>Profile photo:</strong> if you choose to upload one.</li>
                <li><strong>Delivery emails:</strong> your account email and, if you add one, an additional email address to receive your daily plan.</li>
                <li><strong>Usage data:</strong> logs of meal plans generated, messages sent, and delivery status (e.g. sent/delivered/read/failed), used to operate and troubleshoot the Service.</li>
            </ul>
        </x-card>

        <x-card>
            <h2 class="mb-2 font-semibold">2. How we use your information</h2>
            <p class="mb-2">We use the information above to:</p>
            <ul class="ml-4 flex list-disc flex-col gap-1.5">
                <li>Create your account and verify your email address.</li>
                <li>Calculate your BMI, estimated body fat percentage, calorie targets, macronutrient targets, and workout recommendations.</li>
                <li>Generate a personalised weekly meal plan using an AI service (see Section 3), optionally combined with a diet plan provided by your own dietitian.</li>
                <li>Parse and structure recipes you provide, and estimate their nutritional content.</li>
                <li>Email your daily meal plan and grocery list to you and make a downloadable PDF available.</li>
                <li>Communicate service-related messages, such as your email activation code.</li>
            </ul>
        </x-card>

        <x-card>
            <h2 class="mb-2 font-semibold">3. Third-party services we use</h2>
            <ul class="ml-4 flex list-disc flex-col gap-1.5">
                <li><strong>Anthropic (Claude AI):</strong> your profile, food preferences, pasted recipes, and (if provided) your dietitian's PDF are sent to Anthropic's API to generate meal plans and parse recipes. Anthropic processes this data to return a result to us; see Anthropic's own privacy policy for how they handle API data.</li>
                <li><strong>Hosting and email:</strong> our hosting provider stores your account data and sends account-related emails (such as your activation code and daily plan) on our behalf.</li>
            </ul>
            <p class="mt-2">We do not sell your personal information to anyone.</p>
        </x-card>

        <x-card>
            <h2 class="mb-2 font-semibold">4. Email delivery and your consent</h2>
            <p>
                We send your daily diet plan and grocery list by email to your account email address and, if
                you add one, one additional email address you provide in Profile settings. By adding an
                additional email address, you consent to us sending your plan to it. You can stop this at any
                time by removing the address from your Profile settings, disabling plan reminders, or
                contacting us (Section 8).
            </p>
        </x-card>

        <x-card>
            <h2 class="mb-2 font-semibold">5. Data storage and security</h2>
            <p>
                Your password is stored using industry-standard one-way hashing and is never visible to us in
                plain text. Data is stored on our hosting provider's servers with access restricted to what's
                necessary to operate the Service. As with any online service, we cannot guarantee absolute
                security, but we take reasonable measures to protect your information.
            </p>
        </x-card>

        <x-card>
            <h2 class="mb-2 font-semibold">6. Your rights</h2>
            <p class="mb-2">You can, at any time:</p>
            <ul class="ml-4 flex list-disc flex-col gap-1.5">
                <li>Review and update most of your profile information yourself, in Profile settings.</li>
                <li>Request a copy of the personal data we hold about you.</li>
                <li>Request correction or deletion of your data, including full account deletion.</li>
                <li>Withdraw consent to additional-email delivery at any time (Section 4).</li>
            </ul>
            <p class="mt-2">To exercise any of these rights, contact us using the details in Section 8.</p>
        </x-card>

        <x-card>
            <h2 class="mb-2 font-semibold">7. Children's privacy</h2>
            <p>
                The Service is not directed at, and should not be used by, anyone under 18 years of age. We do
                not knowingly collect personal information from children.
            </p>
        </x-card>

        <x-card>
            <h2 class="mb-2 font-semibold">8. Contact us</h2>
            <p>
                If you have questions about this Privacy Policy or wish to exercise any of your rights, contact
                us at <strong>{{ config('mail.from.address', 'support@nutriping.in') }}</strong>.
            </p>
        </x-card>

        <x-card>
            <h2 class="mb-2 font-semibold">9. Changes to this policy</h2>
            <p>
                We may update this Privacy Policy from time to time. We'll update the "Last updated" date above
                when we do. Continued use of the Service after a change constitutes acceptance of the updated policy.
            </p>
        </x-card>
    </div>
</x-layouts.app>
