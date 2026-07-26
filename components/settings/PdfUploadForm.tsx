"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function PdfUploadForm({ userId }: { userId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);
    const form = new FormData();
    form.append("userId", userId);
    form.append("file", file);

    try {
      const res = await fetch("/api/uploads/pdf", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error ?? "Upload failed.");
        return;
      }
      setMessage(`Extracted ${json.recipes.length} dish(es) from your PDF.`);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <h2 className="mb-2 text-sm font-semibold text-slate-900">Upload your diet plan (PDF or DOCX)</h2>
      <p className="mb-3 text-xs text-slate-500">We&apos;ll extract dishes, ingredients and macros with AI.</p>
      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
          className="text-xs"
        />
        <Button variant="secondary" onClick={upload} disabled={uploading}>
          {uploading ? "Parsing with AI…" : "Upload"}
        </Button>
      </div>
      {message && <p className="mt-2 text-xs text-slate-600">{message}</p>}
    </Card>
  );
}
