import { z } from "zod";

/** E.164-ish phone validation: optional leading +, 8-15 digits, country code required. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, "Phone number must include a country code, e.g. +919876543210");

export const onboardingSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
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

  whatsappNumbers: z.array(phoneSchema).max(2, "You can add up to 2 WhatsApp numbers").default([]),
})
  .refine((data) => Math.abs(data.targetWeightKg - data.weightKg) <= 60, {
    message: "Target weight looks unrealistic relative to current weight.",
    path: ["targetWeightKg"],
  })
  .refine((data) => !data.isGlp1 || (data.glp1Medication && data.glp1Medication.length > 0), {
    message: "Please specify the GLP-1 medication name",
    path: ["glp1Medication"],
  });

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const settingsSchema = z.object({
  whatsappNumbers: z.array(phoneSchema).max(2, "You can add up to 2 WhatsApp numbers"),
});

export const rawRecipeSchema = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(1).max(200).optional(),
  text: z.string().trim().min(10, "Paste the full recipe text").max(20000).optional(),
  instagramUrl: z.string().url().optional(),
}).refine((data) => !!data.text || !!data.instagramUrl, {
  message: "Provide either recipe text or an Instagram link",
  path: ["text"],
});

export const generatePlanSchema = z.object({
  userId: z.string().min(1),
});

export const sendWhatsAppSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(["DIET", "GROCERY"]),
  day: z.string().optional(), // ISO date, defaults to today/tomorrow depending on type
});
