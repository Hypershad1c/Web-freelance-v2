import { NextResponse } from "next/server";
import { CrmCommunicationChannel, CrmCommunicationDirection, CrmCommunicationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizedPhone, validateTwilioWebhook } from "@/lib/twilio-whatsapp";

export const runtime = "nodejs";

function requestUrl(request: Request) {
  const source = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || source.host;
  const protocol = request.headers.get("x-forwarded-proto") || source.protocol.replace(":", "");
  return `${protocol}://${host}${source.pathname}${source.search}`;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const params = Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value)]));
  if (!validateTwilioWebhook({ signature: request.headers.get("x-twilio-signature"), url: requestUrl(request), params })) return new NextResponse("Forbidden", { status: 403 });

  const from = params.From || "";
  const body = (params.Body || "").trim();
  const messageSid = params.MessageSid || params.SmsMessageSid;
  if (!from || !messageSid) return new NextResponse("<Response></Response>", { headers: { "Content-Type": "text/xml" } });
  const digits = normalizedPhone(from);
  const suffix = digits.slice(-8);
  const candidates = suffix ? await prisma.crmContact.findMany({ where: { phone: { contains: suffix } }, select: { id: true, phone: true, ownerId: true, whatsappOptIn: true } }) : [];
  const contact = candidates.find((item) => item.phone && normalizedPhone(item.phone) === digits);
  if (contact?.whatsappOptIn) {
    const duplicate = await prisma.crmCommunication.findFirst({ where: { externalId: messageSid }, select: { id: true } });
    if (!duplicate) await prisma.crmCommunication.create({ data: { channel: CrmCommunicationChannel.WHATSAPP, direction: CrmCommunicationDirection.INBOUND, status: CrmCommunicationStatus.LOGGED, body: body || "Message WhatsApp reçu", externalId: messageSid, sentAt: new Date(), contactId: contact.id, ownerId: contact.ownerId } });
    await prisma.crmContact.update({ where: { id: contact.id }, data: { lastContactedAt: new Date(), slaDueAt: new Date(Date.now() + 60 * 60 * 1000) } });
  }
  return new NextResponse("<Response></Response>", { headers: { "Content-Type": "text/xml" } });
}
