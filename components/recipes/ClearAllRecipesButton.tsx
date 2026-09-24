"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ClearAllRecipesButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [clearing, setClearing] = useState(false);

  const clearAll = async () => {
    if (!confirm("Delete ALL saved recipes? This clears everything from uploaded PDFs and pasted links so you can start over — it can't be undone.")) {
      return;
    }
    setClearing(true);
    try {
      const res = await fetch(`/api/recipes?userId=${userId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else setClearing(false);
    } catch {
      setClearing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={clearAll}
      disabled={clearing}
      className="text-xs font-medium text-red-600 underline decoration-dotted disabled:opacity-50"
    >
      {clearing ? "Clearing…" : "Clear all"}
    </button>
  );
}
