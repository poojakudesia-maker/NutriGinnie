"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function LogWeightForm({ userId, currentWeightKg }: { userId: string; currentWeightKg: number | null }) {
  const router = useRouter();
  const [weight, setWeight] = useState(currentWeightKg?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const weightKg = Number(weight);
    if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 400) {
      setError("Enter a valid weight in kg");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, weightKg }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not save weigh-in.");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="number"
          step="0.1"
          className="flex-1 rounded-xl border border-warm-border bg-cream px-3 py-2 text-sm text-charcoal focus:border-orange focus:outline-none"
          placeholder="Today's weight (kg)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <Button variant="secondary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Log weight"}
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
