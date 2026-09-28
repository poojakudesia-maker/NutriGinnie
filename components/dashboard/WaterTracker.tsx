"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const DAILY_GOAL_ML = 2500;

export default function WaterTracker({ userId, totalMl }: { userId: string; totalMl: number }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const log = async (amountMl: number) => {
    setSaving(true);
    await fetch("/api/water", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amountMl }),
    });
    setSaving(false);
    router.refresh();
  };

  const pct = Math.min(100, Math.round((totalMl / DAILY_GOAL_ML) * 100));

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-charcoal">💧 Water intake</h3>
        <span className="text-xs text-charcoal-muted">
          {totalMl}ml / {DAILY_GOAL_ML}ml
        </span>
      </div>
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-cream-deep">
        <div className="h-full bg-sky-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={saving} onClick={() => log(250)}>
          + 250ml
        </Button>
        <Button variant="secondary" disabled={saving} onClick={() => log(500)}>
          + 500ml
        </Button>
      </div>
    </Card>
  );
}
