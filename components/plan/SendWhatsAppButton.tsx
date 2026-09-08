"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function SendWhatsAppButton({
  userId,
  type,
  day,
  hasNumbers,
}: {
  userId: string;
  type: "DIET" | "GROCERY";
  day: string;
  hasNumbers: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const send = async () => {
    setStatus("sending");
    setMessage(null);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, type, day }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(json.error ?? "Send failed.");
        return;
      }
      setStatus("sent");
    } catch {
      setStatus("error");
      setMessage("Network error.");
    }
  };

  if (!hasNumbers) {
    return <p className="text-xs text-charcoal-muted">Add a WhatsApp number in Settings to enable sending.</p>;
  }

  return (
    <div>
      <Button variant="secondary" onClick={send} disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : status === "sent" ? "Sent ✓" : `Send ${type === "DIET" ? "plan + groceries" : "grocery list"} now`}
      </Button>
      {message && <p className="mt-2 text-xs text-red-600">{message}</p>}
    </div>
  );
}
