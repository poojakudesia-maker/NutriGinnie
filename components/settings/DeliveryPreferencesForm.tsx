"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { COMMON_TIMEZONES } from "@/lib/timezones";

const inputClass =
  "w-full rounded-xl border border-warm-border bg-cream px-3 py-2 text-sm text-charcoal focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange";

export default function DeliveryPreferencesForm({
  userId,
  initialTimezone,
  initialDispatchHour,
  initialEnabled,
}: {
  userId: string;
  initialTimezone: string;
  initialDispatchHour: number;
  initialEnabled: boolean;
}) {
  const router = useRouter();
  const [timezone, setTimezone] = useState(initialTimezone);
  const [dispatchHour, setDispatchHour] = useState(initialDispatchHour);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone, dispatchHour, whatsappRemindersEnabled: enabled }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(json.error ?? "Could not save.");
      return;
    }
    setMessage("Saved!");
    router.refresh();
  };

  return (
    <Card>
      <h2 className="mb-2 text-sm font-semibold text-charcoal">Delivery preferences</h2>
      <label className="mb-3 flex items-center gap-2 text-sm text-charcoal">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 accent-orange"
        />
        Send me nightly WhatsApp reminders
      </label>
      {enabled && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal-muted">Time</label>
            <select className={inputClass} value={dispatchHour} onChange={(e) => setDispatchHour(Number(e.target.value))}>
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal-muted">Timezone</label>
            <select className={inputClass} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {!COMMON_TIMEZONES.includes(timezone as (typeof COMMON_TIMEZONES)[number]) && (
                <option value={timezone}>{timezone}</option>
              )}
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      <div className="mt-3 flex items-center gap-3">
        <Button variant="secondary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save preferences"}
        </Button>
        {message && <span className="text-xs text-charcoal-muted">{message}</span>}
      </div>
    </Card>
  );
}
