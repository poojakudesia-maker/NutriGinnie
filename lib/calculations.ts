/**
 * NutriPing calculation engine: BMI, BMR (Mifflin-St Jeor), TDEE, calorie
 * deficit and protein targets — including the GLP-1 adjusted protocol.
 */

export type Gender = "MALE" | "FEMALE";
export type ActivityLevel = "SEDENTARY" | "LIGHT" | "MODERATE" | "HIGH";

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  HIGH: 1.725,
};

/** Safety floors so nobody is put on a dangerously low-calorie plan. */
export const MIN_SAFE_CALORIES: Record<Gender, number> = {
  MALE: 1500,
  FEMALE: 1200,
};

export const STANDARD_DEFICIT_KCAL = 500;
export const GLP1_MIN_DEFICIT_KCAL = 300;
export const GLP1_MAX_DEFICIT_KCAL = 400;

export const PROTEIN_G_PER_KG_MIN = 1.2;
export const PROTEIN_G_PER_KG_MAX = 1.6;
/** GLP-1 users get prioritized protein retention, so we lean to the top of the range. */
export const GLP1_PROTEIN_G_PER_KG = 1.6;

export interface CalorieInputs {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  isGlp1: boolean;
}

export interface CalorieResult {
  bmi: number;
  bmiCategory: "Underweight" | "Normal" | "Overweight" | "Obese";
  bmr: number;
  tdee: number;
  deficitKcal: number;
  calorieTarget: number;
  proteinTargetG: number;
  warnings: string[];
}

/** BMI = weight(kg) / height(m)^2 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return round1(weightKg / (heightM * heightM));
}

export function bmiCategory(bmi: number): CalorieResult["bmiCategory"] {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

/** Mifflin-St Jeor BMR. Male: 10W + 6.25H - 5A + 5. Female: 10W + 6.25H - 5A - 161. */
export function calculateBMR(gender: Gender, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return round1(gender === "MALE" ? base + 5 : base - 161);
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return round1(bmr * ACTIVITY_FACTORS[activityLevel]);
}

/**
 * Full pipeline: BMI -> BMR -> TDEE -> deficit -> calorie target -> protein target.
 * Applies the GLP-1 protocol (smaller deficit, higher protein) and enforces a
 * minimum safe calorie floor regardless of the requested deficit.
 */
export function computeCalorieProfile(input: CalorieInputs): CalorieResult {
  const warnings: string[] = [];

  const bmi = calculateBMI(input.weightKg, input.heightCm);
  const bmr = calculateBMR(input.gender, input.weightKg, input.heightCm, input.age);
  const tdee = calculateTDEE(bmr, input.activityLevel);

  const deficitKcal = input.isGlp1
    ? (GLP1_MIN_DEFICIT_KCAL + GLP1_MAX_DEFICIT_KCAL) / 2 // 350 kcal midpoint
    : STANDARD_DEFICIT_KCAL;

  let calorieTarget = round1(tdee - deficitKcal);

  const floor = MIN_SAFE_CALORIES[input.gender];
  if (calorieTarget < floor) {
    warnings.push(
      `Requested deficit would put the target below the safe minimum of ${floor} kcal/day. Calorie target was raised to ${floor} kcal.`
    );
    calorieTarget = floor;
  }
  if (calorieTarget < bmr * 0.8) {
    warnings.push(
      "Calorie target is significantly below BMR. Consider a smaller deficit or consult a physician."
    );
  }

  const proteinPerKg = input.isGlp1 ? GLP1_PROTEIN_G_PER_KG : PROTEIN_G_PER_KG_MIN;
  const proteinTargetG = round1(input.weightKg * proteinPerKg);

  return {
    bmi,
    bmiCategory: bmiCategory(bmi),
    bmr,
    tdee,
    deficitKcal: round1(tdee - calorieTarget),
    calorieTarget,
    proteinTargetG,
    warnings,
  };
}

/** Guardrail used by the onboarding form / API before persisting a profile. */
export function validateExtremeDeficit(gender: Gender, tdee: number, requestedCalorieTarget: number): string | null {
  const floor = MIN_SAFE_CALORIES[gender];
  if (requestedCalorieTarget < floor) {
    return `Calorie target of ${requestedCalorieTarget} kcal is below the safe minimum of ${floor} kcal/day.`;
  }
  if (tdee - requestedCalorieTarget > 1000) {
    return "Deficit exceeds 1000 kcal/day, which is not a safe rate of weight loss.";
  }
  return null;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
