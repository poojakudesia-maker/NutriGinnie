"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function RecipeForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isYouTube = /youtube\.com|youtu\.be/.test(videoUrl);

  const submit = async () => {
    if (!text.trim() && !videoUrl.trim()) {
      setMessage("Paste a recipe/video link, or the recipe text itself.");
      return;
    }
    if (!text.trim() && videoUrl.trim() && !isYouTube) {
      setMessage("Paste the caption/recipe text too — we can only auto-fetch YouTube transcripts.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, text, videoUrl: videoUrl || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error ?? "Could not process this recipe.");
        return;
      }
      setMessage(`Saved ${json.recipes.length} recipe(s).`);
      setText("");
      setVideoUrl("");
      router.refresh();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <h2 className="mb-2 text-sm font-semibold text-slate-900">Add a recipe</h2>
      <p className="mb-3 text-xs text-slate-500">
        Paste a YouTube link and we&apos;ll auto-fetch its transcript. For Instagram (or any raw
        recipe), paste the caption/text too. AI structures it into ingredients and macros — this
        becomes part of your diet plan.
      </p>
      <input
        className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        placeholder="Instagram or YouTube link (optional)"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
      />
      <textarea
        className="mb-2 h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        placeholder={isYouTube ? "Optional — leave blank to auto-fetch the transcript" : "Paste the recipe text / caption here..."}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button variant="secondary" onClick={submit} disabled={saving}>
        {saving ? "Structuring with AI…" : "Add recipe"}
      </Button>
      {message && <p className="mt-2 text-xs text-slate-600">{message}</p>}
    </Card>
  );
}
