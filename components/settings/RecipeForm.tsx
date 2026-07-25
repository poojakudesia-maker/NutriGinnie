"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function RecipeForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [instagramUrl, setInstagramUrl] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async () => {
    if (!text.trim()) {
      setMessage("Paste the recipe text or the Instagram caption.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, text, instagramUrl: instagramUrl || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error ?? "Could not process this recipe.");
        return;
      }
      setMessage(`Saved ${json.recipes.length} recipe(s).`);
      setText("");
      setInstagramUrl("");
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
        Paste an Instagram link + its caption, or just paste a raw recipe. AI will structure it into ingredients and
        macros.
      </p>
      <input
        className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        placeholder="Instagram link (optional)"
        value={instagramUrl}
        onChange={(e) => setInstagramUrl(e.target.value)}
      />
      <textarea
        className="mb-2 h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        placeholder="Paste the recipe text / caption here..."
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
