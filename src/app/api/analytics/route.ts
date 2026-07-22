import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const EventSchema = z.object({
  type: z.enum(["page_view", "lead", "search", "favorite"]),
  path: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = EventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { type, path, meta } = parsed.data;

  await prisma.analyticsEvent.create({
    data: {
      type,
      path,
      meta: meta as Prisma.InputJsonValue | undefined,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}