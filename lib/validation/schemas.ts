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

export const onboardingSchema = z.object({
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
  });

export type OnboardingInput = z.infer<typeof onboardingSchema>;

/** Used by /onboarding/complete-profile — same health/food fields as onboarding, minus email/password (already set via Google). */
export const completeProfileSchema = z.object({
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
})
  .refine((data) => Math.abs(data.targetWeightKg - data.weightKg) <= 60, {
    message: "Target weight looks unrealistic relative to current weight.",
    path: ["targetWeightKg"],
  })
  .refine((data) => !data.isGlp1 || (data.glp1Medication && data.glp1Medication.length > 0), {
    message: "Please specify the GLP-1 medication name",
    path: ["glp1Medication"],
  });

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;

export const settingsSchema = z.object({
  whatsappNumbers: optionalPhoneList,
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
