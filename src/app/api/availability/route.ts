import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const QuerySchema = z.object({ propertyId: z.string().min(1).optional(), agentId: z.string().min(1).optional() });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({ propertyId: url.searchParams.get("propertyId") || undefined, agentId: url.searchParams.get("agentId") || undefined });
  if (!parsed.success) return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });

  let agentId = parsed.data.agentId;
  if (parsed.data.propertyId) {
    const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId }, select: { agentId: true, status: true } });
    if (!property || property.status !== "PUBLISHED") return NextResponse.json({ slots: [] });
    agentId = property.agentId || agentId;
  }
  if (!agentId) return NextResponse.json({ slots: [] });

  const now = new Date();
  const until = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const slots = await prisma.agentAvailability.findMany({
    where: { agentId, active: true, startsAt: { gt: now, lte: until } },
    include: { _count: { select: { appointments: { where: { status: { in: ["PENDING", "CONFIRMED"] } } } } } },
    orderBy: { startsAt: "asc" },
    take: 80,
  });

  return NextResponse.json({
    slots: slots.filter((slot) => slot._count.appointments < slot.capacity).map((slot) => ({ id: slot.id, startsAt: slot.startsAt, endsAt: slot.endsAt, location: slot.location, remaining: slot.capacity - slot._count.appointments })),
  });
}
