"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SwapMealButton({
  userId,
  weekStartDate,
  dayIndex,
  slot,
}: {
  userId: string;
  weekStartDate: string;
  dayIndex: number;
  slot: "breakfast" | "snack1" | "lunch" | "snack2" | "dinner";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const swap = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/diet-plan/swap-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, weekStartDate, dayIndex, slot }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not swap this meal.");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={swap}
        disabled={loading}
        className="text-xs font-medium text-orange-dark underline decoration-dotted disabled:text-charcoal-muted"
      >
        {loading ? "Swapping…" : "🔄 Swap"}
      </button>
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
