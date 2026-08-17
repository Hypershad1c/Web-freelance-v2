import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const EventSchema = z.object({
  type: z.enum(["page_view", "lead", "search", "favorite", "appointment", "valuation", "whatsapp"]),
  path: z.string().max(500).optional(),
  source: z.string().max(160).optional(),
  medium: z.string().max(160).optional(),
  campaign: z.string().max(240).optional(),
  referrer: z.string().max(500).optional(),
  visitorId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  deviceType: z.enum(["mobile", "tablet", "desktop", "unknown"]).optional(),
  locale: z.enum(["fr", "en", "ar"]).optional(),
  propertyId: z.string().max(80).optional(),
  meta: z.record(z.string(), z.unknown()).refine((value) => Object.keys(value).length <= 25, "Too many metadata fields").optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (["ADMIN", "EDITOR", "AGENT"].includes(session?.user?.role ?? "")) {
    return NextResponse.json({ ok: true, skipped: "internal_role" }, { status: 202 });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 32_000) return NextResponse.json({ error: "Payload too large" }, { status: 413 });

  const { allowed } = rateLimit(`analytics:${getClientIp(request)}`, { limit: 60, windowMs: 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Too many events" }, { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = EventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const meta = parsed.data.meta ? JSON.parse(JSON.stringify(parsed.data.meta)) : undefined;

  await prisma.analyticsEvent.create({
    data: {
      type: parsed.data.type,
      path: parsed.data.path,
      source: parsed.data.source || null,
      medium: parsed.data.medium || null,
      campaign: parsed.data.campaign || null,
      referrer: parsed.data.referrer || null,
      visitorId: parsed.data.visitorId || null,
      sessionId: parsed.data.sessionId || null,
      deviceType: parsed.data.deviceType || null,
      locale: parsed.data.locale || null,
      propertyId: parsed.data.propertyId || null,
      meta,
    },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
