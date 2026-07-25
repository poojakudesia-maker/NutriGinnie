import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STATUS_MAP: Record<string, "SENT" | "DELIVERED" | "READ" | "FAILED"> = {
  sent: "SENT",
  delivered: "DELIVERED",
  read: "READ",
  failed: "FAILED",
  undelivered: "FAILED",
};

/**
 * POST /api/whatsapp/webhook — Twilio status callback (configure this URL as
 * the `statusCallback` / Messaging webhook in the Twilio console). Twilio
 * posts application/x-www-form-urlencoded data.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const messageSid = form.get("MessageSid")?.toString();
  const messageStatus = form.get("MessageStatus")?.toString();
  const errorMessage = form.get("ErrorMessage")?.toString();

  if (!messageSid || !messageStatus) {
    return NextResponse.json({ error: "Missing MessageSid/MessageStatus" }, { status: 400 });
  }

  const mappedStatus = STATUS_MAP[messageStatus.toLowerCase()];
  if (!mappedStatus) {
    return NextResponse.json({ ok: true }); // ignore statuses we don't track (queued, accepted, etc.)
  }

  await prisma.whatsAppLog.updateMany({
    where: { providerMessageId: messageSid },
    data: { status: mappedStatus, errorMessage: errorMessage ?? undefined },
  });

  return NextResponse.json({ ok: true });
}
