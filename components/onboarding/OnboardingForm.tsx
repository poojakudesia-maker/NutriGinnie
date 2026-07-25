"use client";

import { useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { onboardingSchema, type OnboardingInput } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const MEDICAL_CONDITIONS = ["Diabetes", "Hypertension", "PCOS/PCOD", "Thyroid", "Heart Disease", "High Cholesterol"];
const CUISINES = ["Indian", "South Indian", "North Indian", "Gujarati", "Punjabi", "Continental"];

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";
const errorClass = "mt-1 text-xs text-red-600";

export default function OnboardingForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
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
    },
  });

  const isGlp1 = watch("isGlp1");

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
        <h2 className="mb-3 text-base font-semibold text-slate-900">Basic profile</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={labelClass}>Name</label>
            <input className={inputClass} {...register("name")} />
            {errors.name && <p className={errorClass}>{errors.name.message}</p>}
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
        <h2 className="mb-3 text-base font-semibold text-slate-900">Health inputs</h2>
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
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      checked ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-slate-300 text-slate-600"
                    }`}
                  >
                    {condition}
                  </button>
                );
              })}
            </div>
          )}
        />

        <div className="rounded-lg bg-amber-50 p-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <input type="checkbox" {...register("isGlp1")} className="h-4 w-4" />
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
        <h2 className="mb-3 text-base font-semibold text-slate-900">Food preferences</h2>
        <label className={labelClass}>Diet type</label>
        <div className="mb-3 flex gap-2">
          {(["VEG", "EGGETARIAN", "NON_VEG"] as const).map((type) => (
            <label
              key={type}
              className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-slate-300 px-2 py-2 text-sm has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50"
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
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      checked ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-slate-300 text-slate-600"
                    }`}
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
        <h2 className="mb-1 text-base font-semibold text-slate-900">WhatsApp numbers</h2>
        <p className="mb-3 text-xs text-slate-500">Add up to 2 numbers with country code, e.g. +919876543210</p>
        <div className="space-y-2">
          <input className={inputClass} placeholder="+91XXXXXXXXXX" {...register("whatsappNumbers.0")} />
          <input className={inputClass} placeholder="+91XXXXXXXXXX (optional)" {...register("whatsappNumbers.1")} />
        </div>
        {errors.whatsappNumbers && <p className={errorClass}>{errors.whatsappNumbers.message as string}</p>}
      </Card>

      <p className="text-xs text-slate-500">
        You&apos;ll be able to upload your diet plan PDF and paste recipes from the Settings screen after this step.
      </p>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Creating your plan…" : "Create my profile"}
      </Button>
    </form>
  );
}
