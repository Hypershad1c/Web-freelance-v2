import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { CrmSignatureStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function validSignature(body: string, signature: string | null) {
  const secret = process.env.LUMIN_WEBHOOK_SIGNING_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const provided = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return provided.length === expectedBuffer.length && timingSafeEqual(provided, expectedBuffer);
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("x-signature"))) return new NextResponse("Forbidden", { status: 403 });
  const payload = JSON.parse(raw) as Record<string, unknown>;
  const eventType = String(payload.event_type || payload.type || "").toLowerCase();
  const data = (payload.data || payload.signature_request || {}) as Record<string, unknown>;
  const externalId = String(payload.signature_request_id || data.signature_request_id || data.id || "");
  if (!externalId) return new NextResponse("OK");
  const status = eventType.includes("approved") ? CrmSignatureStatus.SIGNED : eventType.includes("declined") || eventType.includes("cancel") ? CrmSignatureStatus.DECLINED : eventType.includes("expired") ? CrmSignatureStatus.EXPIRED : eventType.includes("view") ? CrmSignatureStatus.VIEWED : null;
  if (status) await prisma.crmSignatureRequest.updateMany({ where: { externalId }, data: { status, ...(status === CrmSignatureStatus.SIGNED ? { signedAt: new Date() } : {}) } });
  return new NextResponse("OK");
}
