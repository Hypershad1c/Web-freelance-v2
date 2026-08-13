import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const EventSchema = z.object({
  type: z.enum(["page_view", "lead", "search", "favorite", "appointment", "valuation", "whatsapp"]),
  path: z.string().max(500).optional(),
  source: z.string().max(160).optional(),
  medium: z.string().max(160).optional(),
  campaign: z.string().max(240).optional(),
  referrer: z.string().max(500).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
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
      meta,
    },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
