import { NextResponse } from "next/server";
import { CrmCommunicationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validateTwilioWebhook } from "@/lib/twilio-whatsapp";

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
  const sid = params.MessageSid || params.SmsMessageSid;
  if (!sid) return new NextResponse("OK");
  const providerStatus = (params.MessageStatus || "").toLowerCase();
  const status = ["delivered", "read", "sent"].includes(providerStatus) ? CrmCommunicationStatus.SENT : ["failed", "undelivered"].includes(providerStatus) ? CrmCommunicationStatus.FAILED : CrmCommunicationStatus.QUEUED;
  await prisma.crmCommunication.updateMany({ where: { externalId: sid }, data: { status, ...(status === CrmCommunicationStatus.SENT ? { sentAt: new Date() } : {}) } });
  return new NextResponse("OK");
}
