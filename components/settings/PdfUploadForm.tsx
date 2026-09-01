"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { StructuredRecipe } from "@/lib/ai/types";

const MEAL_TYPE_OPTIONS = [
  { value: "", label: "Unclassified" },
  { value: "BREAKFAST", label: "Breakfast" },
  { value: "SNACK", label: "Snack" },
  { value: "LUNCH", label: "Lunch" },
  { value: "DINNER", label: "Dinner" },
] as const;

interface ReviewItem extends StructuredRecipe {
  included: boolean;
}

export default function PdfUploadForm({ userId }: { userId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [review, setReview] = useState<{ source: "PDF" | "DOCX"; rawInputPreview: string; items: ReviewItem[] } | null>(null);

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);
    const form = new FormData();
    form.append("userId", userId);
    form.append("file", file);

    try {
      const res = await fetch("/api/uploads/pdf", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error ?? "Upload failed.");
        return;
      }
      if (json.recipes.length === 0) {
        setMessage("Couldn't find any dishes in that file.");
        return;
      }
      setReview({
        source: json.source,
        rawInputPreview: json.rawInputPreview,
        items: json.recipes.map((r: StructuredRecipe) => ({ ...r, included: true })),
      });
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const updateItem = (index: number, patch: Partial<ReviewItem>) => {
    setReview((r) => (r ? { ...r, items: r.items.map((item, i) => (i === index ? { ...item, ...patch } : item)) } : r));
  };

  const confirmSave = async () => {
    if (!review) return;
    const toSave = review.items.filter((item) => item.included);
    if (toSave.length === 0) {
      setMessage("Select at least one dish to save.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/uploads/pdf/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          source: review.source,
          rawInputPreview: review.rawInputPreview,
          recipes: toSave.map(({ included: _included, ...rest }) => rest),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error ?? "Could not save these recipes.");
        return;
      }
      setMessage(`Saved ${json.recipes.length} dish(es).`);
      setReview(null);
      router.refresh();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (review) {
    const includedCount = review.items.filter((i) => i.included).length;
    return (
      <Card>
        <h2 className="mb-1 text-sm font-semibold text-charcoal">Review extracted dishes</h2>
        <p className="mb-3 text-xs text-charcoal-muted">
          Check these before saving — uncheck anything wrong, and fix the meal slot if we guessed it wrong.
        </p>
        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {review.items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-warm-border p-2">
              <input
                type="checkbox"
                checked={item.included}
                onChange={(e) => updateItem(i, { included: e.target.checked })}
                className="h-4 w-4 shrink-0 accent-orange"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-charcoal">{item.name}</p>
                <p className="text-[11px] text-charcoal-muted">{Math.round(item.calories)} kcal · {Math.round(item.proteinG)}g protein</p>
              </div>
              <select
                className="shrink-0 rounded-lg border border-warm-border bg-cream px-2 py-1 text-xs text-charcoal"
                value={item.mealType ?? ""}
                onChange={(e) => updateItem(i, { mealType: (e.target.value || null) as ReviewItem["mealType"] })}
              >
                {MEAL_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button onClick={confirmSave} disabled={saving}>
            {saving ? "Saving…" : `Save ${includedCount} recipe${includedCount === 1 ? "" : "s"}`}
          </Button>
          <Button variant="ghost" onClick={() => setReview(null)} disabled={saving}>
            Cancel
          </Button>
        </div>
        {message && <p className="mt-2 text-xs text-red-600">{message}</p>}
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-2 text-sm font-semibold text-charcoal">Upload your diet plan (PDF or DOCX)</h2>
      <p className="mb-3 text-xs text-charcoal-muted">We&apos;ll extract dishes, ingredients and macros with AI — you&apos;ll review them before they&apos;re saved.</p>
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
        className="hidden"
        onChange={onFileSelected}
      />
      <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
        {uploading ? "Parsing with AI…" : "Select & Upload Diet Plan"}
      </Button>
      {message && <p className="mt-2 text-xs text-charcoal-muted">{message}</p>}
    </Card>
  );
}
