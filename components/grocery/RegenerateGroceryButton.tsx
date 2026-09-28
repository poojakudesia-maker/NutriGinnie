"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function RegenerateGroceryButton({ userId, forDate }: { userId: string; forDate: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/grocery/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, forDate }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not generate grocery list.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button variant="secondary" onClick={regenerate} disabled={loading}>
        {loading ? "Building list…" : "Regenerate from plan"}
      </Button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
