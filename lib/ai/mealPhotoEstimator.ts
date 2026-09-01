import { askClaudeForJSON } from "./client";

export interface EstimatedMeal {
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export type SupportedImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

const SYSTEM = `You are a nutrition-estimation engine for a diet-tracking app. Given a photo of a plate of
food and an optional user note, identify the dish(es) and estimate calories/macros for the portion
actually visible — use plate size and typical serving cues to judge portion size like an experienced
dietitian would, rather than defaulting to an unusually large or small serving.
Return JSON matching exactly: { name: string; calories: number; proteinG: number; carbsG: number; fatG: number }`;

/** Used by the Daily Meal Logger's camera upload and the inbound-WhatsApp-photo handler. */
export async function estimateMealFromPhoto(
  base64Data: string,
  mediaType: SupportedImageMediaType,
  note?: string
): Promise<EstimatedMeal> {
  return askClaudeForJSON<EstimatedMeal>({
    system: SYSTEM,
    prompt: [
      { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } },
      { type: "text", text: note ? `User's note about this meal: ${note}` : "Estimate this meal." },
    ],
    maxTokens: 1024,
  });
}

/** Used by the "custom swap" text-log path when the user types what they actually ate. */
export async function estimateMealFromText(description: string): Promise<EstimatedMeal> {
  return askClaudeForJSON<EstimatedMeal>({
    system: SYSTEM.replace(
      "Given a photo of a plate of food and an optional user note",
      "Given a short text description of a meal"
    ),
    prompt: `Estimate macros for this meal: ${description}`,
    maxTokens: 512,
  });
}
