"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { Glp1Log } from "@prisma/client";

const NAUSEA_LABELS = ["None", "Mild", "Noticeable", "Uncomfortable", "Severe", "Very severe"];

export function Glp1LogForm({ userId, recentLogs }: { userId: string; recentLogs: Glp1Log[] }) {
  const router = useRouter();
  const [nauseaLevel, setNauseaLevel] = useState(0);
  const [hydrationMl, setHydrationMl] = useState("");
  const [proteinCompliant, setProteinCompliant] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/glp1-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          nauseaLevel,
          hydrationMl: hydrationMl ? Number(hydrationMl) : null,
          proteinCompliant,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not save.");
      setMessage("Logged!");
      setHydrationMl("");
      router.refresh();
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="mb-1 text-xs font-medium text-charcoal">Nausea today: {NAUSEA_LABELS[nauseaLevel]}</p>
      <input
        type="range"
        min={0}
        max={5}
        value={nauseaLevel}
        onChange={(e) => setNauseaLevel(Number(e.target.value))}
        className="mb-3 w-full accent-orange"
      />
      <div className="mb-3 grid grid-cols-2 gap-3">
        <input
          type="number"
          className="rounded-xl border border-warm-border bg-cream px-3 py-2 text-sm text-charcoal focus:border-orange focus:outline-none"
          placeholder="Water (ml)"
          value={hydrationMl}
          onChange={(e) => setHydrationMl(e.target.value)}
        />
        <label className="flex items-center gap-2 text-xs text-charcoal">
          <input
            type="checkbox"
            checked={proteinCompliant === true}
            onChange={(e) => setProteinCompliant(e.target.checked ? true : null)}
            className="h-4 w-4 accent-orange"
          />
          Hit my protein target
        </label>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Log today's check-in"}
        </Button>
        {message && <span className="text-xs text-charcoal-muted">{message}</span>}
      </div>

      {recentLogs.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-charcoal-muted">
          {recentLogs.slice(0, 5).map((log) => (
            <li key={log.id}>
              {new Date(log.loggedAt).toLocaleDateString()} — nausea: {log.nauseaLevel != null ? NAUSEA_LABELS[log.nauseaLevel] : "—"}
              {log.hydrationMl != null ? `, ${log.hydrationMl}ml water` : ""}
              {log.proteinCompliant ? ", hit protein target" : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
