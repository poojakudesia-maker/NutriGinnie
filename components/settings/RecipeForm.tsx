"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Entry {
  videoUrl: string;
  text: string;
}

const emptyEntry = (): Entry => ({ videoUrl: "", text: "" });

export default function RecipeForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([emptyEntry()]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isYouTube = (url: string) => /youtube\.com|youtu\.be/.test(url);

  const updateEntry = (i: number, patch: Partial<Entry>) => {
    setEntries((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  };

  const addEntry = () => setEntries((prev) => [...prev, emptyEntry()]);
  const removeEntry = (i: number) => setEntries((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async () => {
    const usable = entries.filter((e) => e.videoUrl.trim() || e.text.trim());
    if (usable.length === 0) {
      setMessage("Add at least one link or paste some recipe text.");
      return;
    }
    const invalid = usable.find((e) => !e.text.trim() && e.videoUrl.trim() && !isYouTube(e.videoUrl));
    if (invalid) {
      setMessage("For Instagram (or non-YouTube) links, paste the caption/recipe text too.");
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          entries: usable.map((e) => ({ text: e.text.trim() || undefined, videoUrl: e.videoUrl.trim() || undefined })),
        }),
      });
      const json = await res.json();
      const succeeded = json.results?.filter((r: { ok: boolean }) => r.ok).length ?? 0;
      const failed = json.results?.filter((r: { ok: boolean }) => !r.ok) ?? [];

      if (!res.ok && succeeded === 0) {
        setMessage(json.error ?? failed[0]?.error ?? "Could not process these recipes.");
        return;
      }

      let summary = `Saved ${succeeded} of ${usable.length} recipe entr${usable.length === 1 ? "y" : "ies"}.`;
      if (failed.length > 0) summary += ` ${failed.length} failed: ${failed[0].error}`;
      setMessage(summary);
      setEntries([emptyEntry()]);
      router.refresh();
    } catch (err) {
      setMessage(
        err instanceof SyntaxError
          ? "This took too long to process and the server timed out. Try fewer entries at once, or try again."
          : "Network error. Please check your connection and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <h2 className="mb-2 text-sm font-semibold text-charcoal">Add recipes</h2>
      <p className="mb-3 text-xs text-charcoal-muted">
        Add as many Instagram/YouTube links or pasted recipes as you like, then save them all at
        once. YouTube transcripts auto-fetch. AI structures each into ingredients and macros — these
        become part of your diet plan.
      </p>

      <div className="space-y-3">
        {entries.map((entry, i) => (
          <div key={i} className="rounded-xl border border-warm-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-charcoal-muted">Recipe {i + 1}</span>
              {entries.length > 1 && (
                <button type="button" onClick={() => removeEntry(i)} className="text-xs text-red-600">
                  Remove
                </button>
              )}
            </div>
            <input
              className="mb-2 w-full rounded-xl border border-warm-border bg-cream px-3 py-2 text-sm text-charcoal focus:border-orange focus:outline-none"
              placeholder="Instagram or YouTube link (optional)"
              value={entry.videoUrl}
              onChange={(e) => updateEntry(i, { videoUrl: e.target.value })}
            />
            <textarea
              className="h-20 w-full rounded-xl border border-warm-border bg-cream px-3 py-2 text-sm text-charcoal focus:border-orange focus:outline-none"
              placeholder={
                isYouTube(entry.videoUrl) ? "Optional — leave blank to auto-fetch the transcript" : "Paste the recipe text / caption here..."
              }
              value={entry.text}
              onChange={(e) => updateEntry(i, { text: e.target.value })}
            />
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Button variant="ghost" type="button" onClick={addEntry}>
          + Add another
        </Button>
        <Button variant="secondary" onClick={submit} disabled={saving}>
          {saving ? "Structuring with AI…" : "Save recipes"}
        </Button>
      </div>
      {message && <p className="mt-2 text-xs text-charcoal-muted">{message}</p>}
    </Card>
  );
}
