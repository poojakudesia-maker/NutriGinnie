"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function WhatsAppSettingsForm({ userId, initialNumbers }: { userId: string; initialNumbers: string[] }) {
  const router = useRouter();
  const [numbers, setNumbers] = useState<string[]>([initialNumbers[0] ?? "", initialNumbers[1] ?? ""]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const cleaned = numbers.filter((n) => n.trim().length > 0);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatsappNumbers: cleaned }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(json.error ?? "Could not save. Check the phone number format (+countrycode...).");
      return;
    }
    setMessage("Saved!");
    router.refresh();
  };

  return (
    <Card>
      <h2 className="mb-2 text-sm font-semibold text-slate-900">WhatsApp numbers</h2>
      <p className="mb-3 text-xs text-slate-500">Up to 2 numbers, with country code (e.g. +919876543210).</p>
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <input
            key={i}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            placeholder="+91XXXXXXXXXX"
            value={numbers[i]}
            onChange={(e) => {
              const next = [...numbers];
              next[i] = e.target.value;
              setNumbers(next);
            }}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button variant="secondary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save numbers"}
        </Button>
        {message && <span className="text-xs text-slate-600">{message}</span>}
      </div>
    </Card>
  );
}
