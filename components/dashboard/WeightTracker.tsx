"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface WeightLog {
  id: string;
  weightKg: number;
  loggedAt: string;
}

export default function WeightTracker({
  userId,
  logs,
  targetWeightKg,
}: {
  userId: string;
  logs: WeightLog[];
  targetWeightKg: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const points = logs.slice(-14);
  const sparkline = buildSparklinePath(points.map((p) => p.weightKg));

  const submit = async () => {
    const weightKg = Number(value);
    if (!Number.isFinite(weightKg) || weightKg <= 0) return;
    setSaving(true);
    await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, weightKg }),
    });
    setValue("");
    setSaving(false);
    router.refresh();
  };

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-charcoal">Weight progress</h3>
        <span className="text-xs text-charcoal-muted">Target: {targetWeightKg}kg</span>
      </div>
      {points.length > 1 && (
        <svg viewBox="0 0 100 30" className="mb-2 h-12 w-full text-orange">
          <polyline points={sparkline} fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )}
      <div className="flex gap-2">
        <input
          type="number"
          step="0.1"
          placeholder="Log today's weight (kg)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-xl border border-warm-border bg-cream px-3 py-2 text-sm text-charcoal focus:border-orange focus:outline-none"
        />
        <Button onClick={submit} disabled={saving || !value} variant="secondary">
          Log
        </Button>
      </div>
    </Card>
  );
}

function buildSparklinePath(values: number[]): string {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 30 - ((v - min) / range) * 28 - 1;
      return `${x},${y}`;
    })
    .join(" ");
}
