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

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
      router.refresh();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Card>
      <h2 className="mb-2 text-sm font-semibold text-charcoal">Upload your diet plan (PDF or DOCX)</h2>
      <p className="mb-3 text-xs text-charcoal-muted">We&apos;ll extract dishes, ingredients and macros with AI.</p>
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
        className="hidden"
        onChange={onFileSelected}
      />
      <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
        {uploading ? "Parsing with AI…" : "Select & Upload Diet Plan"}
      </Button>
      {message && <p className="mt-2 text-xs text-charcoal-muted">{message}</p>}
    </Card>
  );
}
