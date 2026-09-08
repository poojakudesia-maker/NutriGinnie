"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function GeneratePlanButton({
  userId,
  hasRecipes,
  regenerate = false,
}: {
  userId: string;
  hasRecipes: boolean;
  regenerate?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"AUTO" | "AI" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const generate = async (mode: "AUTO" | "AI") => {
    setLoading(mode);
    setError(null);
    setWarnings([]);
    try {
      const res = await fetch("/api/diet-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, mode }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not generate plan.");
        return;
      }
      setWarnings(json.warnings ?? []);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof SyntaxError
          ? "This took too long and the server timed out generating your plan. Please try again."
          : "Network error. Please check your connection and try again."
      );
    } finally {
      setLoading(null);
    }
  };

  const primaryLabel = hasRecipes
    ? regenerate
      ? "Regenerate from my recipes"
      : "Generate my weekly plan"
    : "Generate AI Diet Plan";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => generate("AUTO")} disabled={loading !== null}>
          {loading === "AUTO" ? (hasRecipes ? "Building your plan…" : "Generating with AI… (~20s)") : primaryLabel}
        </Button>
        {hasRecipes && (
          <Button variant="ghost" onClick={() => generate("AI")} disabled={loading !== null}>
            {loading === "AI" ? "Generating with AI… (~20s)" : "or generate with AI instead"}
          </Button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {warnings.length > 0 && (
        <ul className="mt-2 space-y-1 rounded-xl bg-orange-light p-2.5 text-xs text-orange-dark">
          {warnings.map((w, i) => (
            <li key={i}>⚠️ {w}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
