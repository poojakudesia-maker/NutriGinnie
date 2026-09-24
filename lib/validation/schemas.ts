import { z } from "zod";

/** E.164-ish phone validation: optional leading +, 8-15 digits, country code required. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, "Phone number must include a country code, e.g. +919876543210");

/** Drops blank entries before validation so an unfilled optional phone field never blocks submit. */
const optionalPhoneList = z.preprocess(
  (val) => (Array.isArray(val) ? val.filter((v) => typeof v === "string" && v.trim().length > 0) : val),
  z.array(phoneSchema).max(2, "You can add up to 2 WhatsApp numbers")
);

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be under 72 characters");

/** Shared by onboarding + complete-profile: "CALCULATED" derives targets from BMR/TDEE;
 *  "MANUAL" means the user typed in a dietitian-given calorie/macro budget directly. */
const calorieBudgetFields = {
  calorieSource: z.enum(["CALCULATED", "MANUAL"]).default("CALCULATED"),
  manualCalorieTarget: z.coerce.number().min(800).max(6000).optional(),
  manualProteinTargetG: z.coerce.number().min(0).max(500).optional(),
  manualCarbTargetG: z.coerce.number().min(0).max(1000).optional(),
  manualFatTargetG: z.coerce.number().min(0).max(500).optional(),
};

const timezoneFields = {
  timezone: z.string().trim().min(1).max(100).default("Asia/Kolkata"),
  dispatchHour: z.coerce.number().int().min(0).max(23).default(19),
};

const CALORIE_BUDGET_REFINEMENT = {
  check: (data: { calorieSource: string; manualCalorieTarget?: number; manualProteinTargetG?: number }) =>
    data.calorieSource !== "MANUAL" || (data.manualCalorieTarget != null && data.manualProteinTargetG != null),
  opts: { message: "Enter your calorie and protein budget", path: ["manualCalorieTarget"] },
};

export const onboardingSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
    age: z.coerce.number().int().min(13, "Age must be at least 13").max(100, "Age must be under 100"),
    gender: z.enum(["MALE", "FEMALE"]),
    heightCm: z.coerce.number().min(100, "Height must be at least 100cm").max(250),
    weightKg: z.coerce.number().min(30, "Weight must be at least 30kg").max(300),
    targetWeightKg: z.coerce.number().min(30).max(300),
    activityLevel: z.enum(["SEDENTARY", "LIGHT", "MODERATE", "HIGH"]),

    medicalConditions: z.array(z.string()).default([]),
    isGlp1: z.boolean().default(false),
    glp1Medication: z.string().trim().max(100).optional().nullable(),
    glp1DosageMg: z.coerce.number().min(0).max(50).optional().nullable(),

    dietType: z.enum(["VEG", "EGGETARIAN", "NON_VEG"]),
    allergies: z.array(z.string()).default([]),
    cuisinePreference: z.array(z.string()).default(["Indian"]),

    whatsappNumbers: optionalPhoneList.default([]),
    ...calorieBudgetFields,
    ...timezoneFields,
  })
  .refine((data) => Math.abs(data.targetWeightKg - data.weightKg) <= 60, {
    message: "Target weight looks unrealistic relative to current weight.",
    path: ["targetWeightKg"],
  })
  .refine((data) => !data.isGlp1 || (data.glp1Medication && data.glp1Medication.length > 0), {
    message: "Please specify the GLP-1 medication name",
    path: ["glp1Medication"],
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(CALORIE_BUDGET_REFINEMENT.check, CALORIE_BUDGET_REFINEMENT.opts);

export type OnboardingInput = z.infer<typeof onboardingSchema>;

/** Used by /onboarding/complete-profile — same health/food fields as onboarding, minus email/password (already set via Google). */
export const completeProfileSchema = z
  .object({
    age: z.coerce.number().int().min(13, "Age must be at least 13").max(100, "Age must be under 100"),
    gender: z.enum(["MALE", "FEMALE"]),
    heightCm: z.coerce.number().min(100, "Height must be at least 100cm").max(250),
    weightKg: z.coerce.number().min(30, "Weight must be at least 30kg").max(300),
    targetWeightKg: z.coerce.number().min(30).max(300),
    activityLevel: z.enum(["SEDENTARY", "LIGHT", "MODERATE", "HIGH"]),

    medicalConditions: z.array(z.string()).default([]),
    isGlp1: z.boolean().default(false),
    glp1Medication: z.string().trim().max(100).optional().nullable(),
    glp1DosageMg: z.coerce.number().min(0).max(50).optional().nullable(),

    dietType: z.enum(["VEG", "EGGETARIAN", "NON_VEG"]),
    allergies: z.array(z.string()).default([]),
    cuisinePreference: z.array(z.string()).default(["Indian"]),

    whatsappNumbers: optionalPhoneList.default([]),
    ...calorieBudgetFields,
    ...timezoneFields,
  })
  .refine((data) => Math.abs(data.targetWeightKg - data.weightKg) <= 60, {
    message: "Target weight looks unrealistic relative to current weight.",
    path: ["targetWeightKg"],
  })
  .refine((data) => !data.isGlp1 || (data.glp1Medication && data.glp1Medication.length > 0), {
    message: "Please specify the GLP-1 medication name",
    path: ["glp1Medication"],
  })
  .refine(CALORIE_BUDGET_REFINEMENT.check, CALORIE_BUDGET_REFINEMENT.opts);

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;

/** Used for lightweight Settings-screen PATCHes that don't touch the rest of the health profile. */
export const settingsSchema = z.object({
  whatsappNumbers: optionalPhoneList.optional(),
  timezone: z.string().trim().min(1).max(100).optional(),
  dispatchHour: z.coerce.number().int().min(0).max(23).optional(),
  whatsappRemindersEnabled: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

/** Treats a blank/whitespace-only string as "not provided" instead of failing the min-length check. */
const optionalNonEmptyString = (schema: z.ZodString) =>
  z.preprocess((val) => (typeof val === "string" && val.trim().length === 0 ? undefined : val), schema.optional());

const recipeEntrySchema = z.object({
  name: optionalNonEmptyString(z.string().trim().min(1).max(200)),
  text: optionalNonEmptyString(z.string().trim().min(10, "Paste the full recipe text").max(20000)),
  videoUrl: optionalNonEmptyString(z.string().url()),
}).refine((data) => !!data.text || !!data.videoUrl, {
  message: "Provide either recipe text or a video link",
  path: ["text"],
});

/** POST /api/recipes accepts a batch — one or more links/pastes added in a single submission. */
export const rawRecipeBatchSchema = z.object({
  userId: z.string().min(1),
  entries: z.array(recipeEntrySchema).min(1, "Add at least one recipe").max(10, "Add at most 10 at a time"),
});

/** Best-effort platform detection for a pasted recipe video link, used to label/categorize the saved recipe. */
export function detectVideoPlatform(url: string): "INSTAGRAM" | "YOUTUBE" | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("instagram.com")) return "INSTAGRAM";
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "YOUTUBE";
    return null;
  } catch {
    return null;
  }
}

const structuredIngredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.coerce.number(),
  unit: z.string(),
});

const structuredRecipeSchema = z.object({
  name: z.string().trim().min(1).max(200),
  mealType: z.enum(["BREAKFAST", "SNACK", "LUNCH", "DINNER"]).nullable(),
  ingredients: z.array(structuredIngredientSchema),
  instructions: z.string().max(2000),
  calories: z.coerce.number().min(0),
  proteinG: z.coerce.number().min(0),
  carbsG: z.coerce.number().min(0),
  fatG: z.coerce.number().min(0),
  fiberG: z.coerce.number().min(0),
  ironMg: z.coerce.number().min(0),
  calciumMg: z.coerce.number().min(0),
  micros: z.record(z.string(), z.number()).optional(),
  aiEstimated: z.boolean(),
});

/** POST /api/uploads/pdf/confirm — saves the (possibly user-edited) dishes returned by the parse
 *  step (POST /api/uploads/pdf), after the "review extracted meals" screen. */
export const confirmUploadSchema = z.object({
  userId: z.string().min(1),
  source: z.enum(["PDF", "DOCX"]),
  rawInputPreview: z.string().max(5000),
  recipes: z.array(structuredRecipeSchema).min(1, "No dishes to save").max(60),
});

export const swapMealSchema = z.object({
  userId: z.string().min(1),
  weekStartDate: z.string(), // ISO date
  dayIndex: z.coerce.number().int().min(0).max(6),
  slot: z.enum(["breakfast", "snack1", "lunch", "snack2", "dinner"]),
});

export const generatePlanSchema = z.object({
  userId: z.string().min(1),
  // AUTO: use the user's own recipes if they have any, AI otherwise. AI: force AI generation
  // even if the user has recipes (offered explicitly when they have none, or on request).
  mode: z.enum(["AUTO", "AI"]).default("AUTO"),
});

export const sendWhatsAppSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(["DIET", "GROCERY"]),
  day: z.string().optional(), // ISO date, defaults to today/tomorrow depending on type
});

const MEAL_LOG_SLOTS = ["BREAKFAST", "SNACK1", "LUNCH", "SNACK2", "DINNER"] as const;

/** POST /api/meal-log — one of three ways a user records what they actually ate for a slot. */
export const mealLogSchema = z.discriminatedUnion("method", [
  z.object({
    userId: z.string().min(1),
    forDate: z.string(), // ISO date
    slot: z.enum(MEAL_LOG_SLOTS),
    method: z.literal("PLANNED_CONFIRM"),
  }),
  z.object({
    userId: z.string().min(1),
    forDate: z.string(),
    slot: z.enum(MEAL_LOG_SLOTS),
    method: z.literal("CUSTOM"),
    description: z.string().trim().min(2, "Describe what you ate").max(500),
  }),
  z.object({
    userId: z.string().min(1),
    forDate: z.string(),
    slot: z.enum(MEAL_LOG_SLOTS),
    method: z.literal("PHOTO"),
    photoDataUrl: z.string().startsWith("data:image/", "Expected an image data URL"),
    description: z.string().trim().max(500).optional(),
  }),
]);
