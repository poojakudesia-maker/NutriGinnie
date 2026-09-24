import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMetaWebhookHandshake, verifyMetaSignature, extractMetaStatuses } from "@/lib/whatsapp/metaWebhook";

const STATUS_MAP: Record<string, "SENT" | "DELIVERED" | "READ" | "FAILED"> = {
  sent: "SENT",
  delivered: "DELIVERED",
  read: "READ",
  failed: "FAILED",
};

/** GET /api/whatsapp/webhook — Meta's one-time webhook verification handshake, same as the inbound route. */
export async function GET(req: NextRequest) {
  const challenge = verifyMetaWebhookHandshake(req.nextUrl.searchParams);
  if (!challenge) return new NextResponse("Forbidden", { status: 403 });
  return new NextResponse(challenge, { status: 200 });
}

/**
 * POST /api/whatsapp/webhook — Meta WhatsApp Cloud API delivery-status callback (configure this
 * URL under WhatsApp -> Configuration -> Webhook, subscribed to the "messages" field — status
 * updates arrive on the same subscription as inbound messages, just a different payload shape).
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  if (!verifyMetaSignature(rawBody, req.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);
  const statuses = extractMetaStatuses(body);

  for (const status of statuses) {
    const mappedStatus = STATUS_MAP[status.status.toLowerCase()];
    if (!mappedStatus) continue; // ignore statuses we don't track (e.g. "deleted")

    await prisma.whatsAppLog.updateMany({
      where: { providerMessageId: status.id },
      data: {
        status: mappedStatus,
        errorMessage: status.errors?.[0] ? `${status.errors[0].title ?? ""}: ${status.errors[0].message ?? ""}`.trim() : undefined,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
