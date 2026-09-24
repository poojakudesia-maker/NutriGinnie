"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { MealEntry } from "@/lib/ai/types";

type Slot = "BREAKFAST" | "SNACK1" | "LUNCH" | "SNACK2" | "DINNER";

interface ExistingLog {
  method: "PLANNED_CONFIRM" | "PHOTO" | "CUSTOM";
  description: string | null;
  calories: number;
  proteinG: number;
}

const METHOD_LABEL: Record<ExistingLog["method"], string> = {
  PLANNED_CONFIRM: "Ate as planned",
  PHOTO: "Logged from photo",
  CUSTOM: "Logged (custom)",
};

/** Downscales + JPEG-compresses a photo client-side before it's base64-encoded and sent to the
 *  server — an uncompressed phone photo can be several MB, too big for a text DB column. */
async function fileToCompressedDataUrl(file: File, maxDimension = 1024, quality = 0.7): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

export function MealLogSlotCard({
  userId,
  forDate,
  slot,
  label,
  icon,
  plannedMeal,
  existingLog,
}: {
  userId: string;
  forDate: string;
  slot: Slot;
  label: string;
  icon: string;
  plannedMeal: MealEntry | null;
  existingLog: ExistingLog | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customText, setCustomText] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState<"confirm" | "photo" | "custom" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const post = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/meal-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, forDate, slot, ...body }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Could not save this log.");
    router.refresh();
  };

  const confirmPlanned = async () => {
    setLoading("confirm");
    setError(null);
    try {
      await post({ method: "PLANNED_CONFIRM" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const submitCustom = async () => {
    if (!customText.trim()) return;
    setLoading("custom");
    setError(null);
    try {
      await post({ method: "CUSTOM", description: customText.trim() });
      setCustomText("");
      setShowCustomInput(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const onPhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLoading("photo");
    setError(null);
    try {
      const photoDataUrl = await fileToCompressedDataUrl(file);
      await post({ method: "PHOTO", photoDataUrl });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-semibold text-charcoal">
          <span className="mr-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-light align-middle">
            {icon}
          </span>
          {label}
        </p>
        {plannedMeal && <p className="text-xs text-charcoal-muted">Planned: {plannedMeal.name}</p>}
      </div>

      {existingLog ? (
        <div className="rounded-xl bg-sage-light p-2.5 text-sm text-sage">
          ✅ {METHOD_LABEL[existingLog.method]} — {existingLog.description ?? "meal"} ({Math.round(existingLog.calories)} kcal,{" "}
          {Math.round(existingLog.proteinG)}g protein)
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {plannedMeal && (
              <Button variant="secondary" onClick={confirmPlanned} disabled={loading !== null}>
                {loading === "confirm" ? "Saving…" : "Ate Planned Meal"}
              </Button>
            )}
            <Button variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={loading !== null}>
              {loading === "photo" ? "Analyzing photo…" : "📷 Log with photo"}
            </Button>
            <Button variant="ghost" onClick={() => setShowCustomInput((v) => !v)} disabled={loading !== null}>
              ✏️ Log something else
            </Button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhotoSelected} />
          {showCustomInput && (
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-warm-border bg-cream px-3 py-2 text-sm text-charcoal focus:border-orange focus:outline-none"
                placeholder="What did you eat instead?"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
              />
              <Button onClick={submitCustom} disabled={loading !== null}>
                {loading === "custom" ? "…" : "Log"}
              </Button>
            </div>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </Card>
  );
}
