"use client";

import { useEffect, useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { onboardingSchema, type OnboardingInput } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { COMMON_TIMEZONES } from "@/lib/timezones";

const MEDICAL_CONDITIONS = ["Diabetes", "Hypertension", "PCOS/PCOD", "Thyroid", "Heart Disease", "High Cholesterol"];
const CUISINES = ["Indian", "South Indian", "North Indian", "Gujarati", "Punjabi", "Continental"];

const inputClass =
  "w-full rounded-xl border border-warm-border bg-cream px-3 py-2 text-sm text-charcoal focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange";
const labelClass = "mb-1 block text-sm font-medium text-charcoal";
const errorClass = "mt-1 text-xs text-red-600";
const chipClass = (checked: boolean) =>
  `rounded-full border px-3 py-1 text-xs font-medium ${
    checked ? "border-orange bg-orange-light text-orange-dark" : "border-warm-border text-charcoal-muted"
  }`;

export default function OnboardingForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema) as unknown as Resolver<OnboardingInput>,
    defaultValues: {
      gender: "FEMALE",
      activityLevel: "SEDENTARY",
      dietType: "VEG",
      medicalConditions: [],
      allergies: [],
      cuisinePreference: ["Indian"],
      whatsappNumbers: [""],
      isGlp1: false,
      calorieSource: "CALCULATED",
      timezone: "Asia/Kolkata",
      dispatchHour: 19,
    },
  });

  const isGlp1 = watch("isGlp1");
  const calorieSource = watch("calorieSource");

  // Auto-detect the browser's IANA timezone once on mount; the dropdown below lets the user override it.
  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) setValue("timezone", detected);
    } catch {
      // Intl unavailable — keep the Asia/Kolkata default.
    }
  }, [setValue]);

  const onSubmit = async (data: OnboardingInput) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const cleaned = {
        ...data,
        whatsappNumbers: data.whatsappNumbers.filter((n) => n && n.trim().length > 0),
      };
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleaned),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error ?? "Something went wrong. Please check your inputs.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Card>
        <h2 className="mb-3 text-base font-semibold text-charcoal">Basic profile</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={labelClass}>Name</label>
            <input className={inputClass} {...register("name")} />
            {errors.name && <p className={errorClass}>{errors.name.message}</p>}
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Email</label>
            <input type="email" className={inputClass} {...register("email")} />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <input type="password" className={inputClass} {...register("password")} />
            {errors.password && <p className={errorClass}>{errors.password.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Confirm password</label>
            <input type="password" className={inputClass} {...register("confirmPassword")} />
            {errors.confirmPassword && <p className={errorClass}>{errors.confirmPassword.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Age</label>
            <input type="number" className={inputClass} {...register("age")} />
            {errors.age && <p className={errorClass}>{errors.age.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Gender</label>
            <select className={inputClass} {...register("gender")}>
              <option value="FEMALE">Female</option>
              <option value="MALE">Male</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Height (cm)</label>
            <input type="number" step="0.1" className={inputClass} {...register("heightCm")} />
            {errors.heightCm && <p className={errorClass}>{errors.heightCm.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Weight (kg)</label>
            <input type="number" step="0.1" className={inputClass} {...register("weightKg")} />
            {errors.weightKg && <p className={errorClass}>{errors.weightKg.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Target weight (kg)</label>
            <input type="number" step="0.1" className={inputClass} {...register("targetWeightKg")} />
            {errors.targetWeightKg && <p className={errorClass}>{errors.targetWeightKg.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Activity level</label>
            <select className={inputClass} {...register("activityLevel")}>
              <option value="SEDENTARY">Sedentary</option>
              <option value="LIGHT">Light</option>
              <option value="MODERATE">Moderate</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 text-base font-semibold text-charcoal">Calorie &amp; macro budget</h2>
        <p className="mb-3 text-xs text-charcoal-muted">
          Already have a target from your dietitian? Enter it directly — otherwise we&apos;ll calculate one from your
          height/weight/activity above.
        </p>
        <div className="mb-3 flex gap-2">
          <label className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl border border-warm-border px-2 py-2 text-center text-sm has-[:checked]:border-orange has-[:checked]:bg-orange-light">
            <input type="radio" value="CALCULATED" {...register("calorieSource")} className="hidden" />
            Calculate for me
          </label>
          <label className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl border border-warm-border px-2 py-2 text-center text-sm has-[:checked]:border-orange has-[:checked]:bg-orange-light">
            <input type="radio" value="MANUAL" {...register("calorieSource")} className="hidden" />
            I know my budget
          </label>
        </div>
        {calorieSource === "MANUAL" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Calories/day</label>
              <input type="number" className={inputClass} {...register("manualCalorieTarget")} />
            </div>
            <div>
              <label className={labelClass}>Protein (g)</label>
              <input type="number" className={inputClass} {...register("manualProteinTargetG")} />
            </div>
            <div>
              <label className={labelClass}>Carbs (g, optional)</label>
              <input type="number" className={inputClass} {...register("manualCarbTargetG")} />
            </div>
            <div>
              <label className={labelClass}>Fat (g, optional)</label>
              <input type="number" className={inputClass} {...register("manualFatTargetG")} />
            </div>
            {errors.manualCalorieTarget && <p className={`${errorClass} col-span-2`}>{errors.manualCalorieTarget.message}</p>}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-base font-semibold text-charcoal">Health inputs</h2>
        <label className={labelClass}>Medical conditions</label>
        <Controller
          control={control}
          name="medicalConditions"
          render={({ field }) => (
            <div className="mb-3 flex flex-wrap gap-2">
              {MEDICAL_CONDITIONS.map((condition) => {
                const checked = field.value?.includes(condition);
                return (
                  <button
                    type="button"
                    key={condition}
                    onClick={() =>
                      field.onChange(
                        checked ? field.value.filter((c) => c !== condition) : [...field.value, condition]
                      )
                    }
                    className={chipClass(!!checked)}
                  >
                    {condition}
                  </button>
                );
              })}
            </div>
          )}
        />

        <div className="rounded-xl bg-sage-light p-3">
          <label className="flex items-center gap-2 text-sm font-medium text-charcoal">
            <input type="checkbox" {...register("isGlp1")} className="h-4 w-4 accent-orange" />
            Are you taking any GLP-1 medication (Ozempic, Semaglutide, etc.)?
          </label>
          {isGlp1 && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Medication name</label>
                <input className={inputClass} placeholder="e.g. Ozempic" {...register("glp1Medication")} />
                {errors.glp1Medication && <p className={errorClass}>{errors.glp1Medication.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Dosage (mg, optional)</label>
                <input type="number" step="0.1" className={inputClass} {...register("glp1DosageMg")} />
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-base font-semibold text-charcoal">Food preferences</h2>
        <label className={labelClass}>Diet type</label>
        <div className="mb-3 flex gap-2">
          {(["VEG", "EGGETARIAN", "NON_VEG"] as const).map((type) => (
            <label
              key={type}
              className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl border border-warm-border px-2 py-2 text-sm has-[:checked]:border-orange has-[:checked]:bg-orange-light"
            >
              <input type="radio" value={type} {...register("dietType")} className="hidden" />
              {type === "VEG" ? "Veg" : type === "EGGETARIAN" ? "Eggetarian" : "Non-veg"}
            </label>
          ))}
        </div>

        <label className={labelClass}>Allergies (comma-separated)</label>
        <Controller
          control={control}
          name="allergies"
          render={({ field }) => (
            <input
              className={`${inputClass} mb-3`}
              placeholder="peanuts, shellfish, gluten..."
              defaultValue={field.value?.join(", ")}
              onBlur={(e) => field.onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            />
          )}
        />

        <label className={labelClass}>Cuisine preference</label>
        <Controller
          control={control}
          name="cuisinePreference"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {CUISINES.map((cuisine) => {
                const checked = field.value?.includes(cuisine);
                return (
                  <button
                    type="button"
                    key={cuisine}
                    onClick={() =>
                      field.onChange(checked ? field.value.filter((c) => c !== cuisine) : [...field.value, cuisine])
                    }
                    className={chipClass(!!checked)}
                  >
                    {cuisine}
                  </button>
                );
              })}
            </div>
          )}
        />
      </Card>

      <Card>
        <h2 className="mb-1 text-base font-semibold text-charcoal">WhatsApp numbers</h2>
        <p className="mb-3 text-xs text-charcoal-muted">Add up to 2 numbers with country code, e.g. +919876543210</p>
        <div className="space-y-2">
          <input className={inputClass} placeholder="+91XXXXXXXXXX" {...register("whatsappNumbers.0")} />
          <input className={inputClass} placeholder="+91XXXXXXXXXX (optional)" {...register("whatsappNumbers.1")} />
        </div>
        {errors.whatsappNumbers && <p className={errorClass}>{errors.whatsappNumbers.message as string}</p>}
      </Card>

      <Card>
        <h2 className="mb-1 text-base font-semibold text-charcoal">Delivery preferences</h2>
        <p className="mb-3 text-xs text-charcoal-muted">
          Your next day&apos;s diet plan &amp; grocery list arrive on WhatsApp at this local time every night.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Time</label>
            <select className={inputClass} {...register("dispatchHour")}>
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Timezone</label>
            <Controller
              control={control}
              name="timezone"
              render={({ field }) => (
                <select className={inputClass} {...field}>
                  {!COMMON_TIMEZONES.includes(field.value as (typeof COMMON_TIMEZONES)[number]) && (
                    <option value={field.value}>{field.value} (detected)</option>
                  )}
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        </div>
      </Card>

      <p className="text-xs text-charcoal-muted">
        You&apos;ll be able to upload your diet plan PDF and paste recipes from the Dashboard after this step.
      </p>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Creating your plan…" : "Create my profile"}
      </Button>
    </form>
  );
}
