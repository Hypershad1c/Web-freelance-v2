import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/data/settings";
import { syncInboundLead } from "@/lib/crm";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { whatsappLink } from "@/lib/utils";

const ConciergeSchema = z.object({
  propertyId: z.string().min(1),
  placement: z.enum(["card", "detail"]),
});

const CRM_DEDUPLICATION_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = rateLimit(`whatsapp-concierge:${ip}`, { limit: 12, windowMs: 10 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json({ error: "Trop de demandes. Merci de réessayer dans quelques minutes." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = ConciergeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Demande WhatsApp invalide." }, { status: 400 });
  }

  const property = await prisma.property.findFirst({
    where: { id: parsed.data.propertyId, status: "PUBLISHED" },
    include: {
      city: { select: { name: true } },
      agent: { select: { phone: true, userId: true } },
      agency: { select: { phone: true } },
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Ce bien n'est plus disponible." }, { status: 404 });
  }

  const settings = await getSiteSettings();
  const phone = property.agent?.phone || property.agency?.phone || settings.whatsapp_number;
  if (!phone) {
    return NextResponse.json({ error: "Le service WhatsApp est momentanément indisponible." }, { status: 503 });
  }

  const origin = process.env.NEXTAUTH_URL || new URL(request.url).origin;
  const propertyUrl = `${origin}/proprietes/${property.id}`;
  const message = `Bonjour, j'aimerais être accompagné(e) pour « ${property.title} » (${property.reference}) à ${property.city.name}. Pouvez-vous m'aider ?\n\n${propertyUrl}`;
  const source = `whatsapp_${parsed.data.placement}`;
  const session = await auth();

  await prisma.analyticsEvent.create({
    data: {
      type: "whatsapp_concierge",
      path: `/proprietes/${property.id}`,
      meta: { propertyId: property.id, placement: parsed.data.placement, source },
    },
  }).catch((error) => console.error("[concierge] Failed to record WhatsApp click", error));

  const email = session?.user?.email?.toLowerCase();
  if (email) {
    const existingLead = await prisma.lead.findFirst({
      where: {
        email,
        propertyId: property.id,
        source,
        createdAt: { gte: new Date(Date.now() - CRM_DEDUPLICATION_WINDOW_MS) },
      },
      select: { id: true },
    });

    if (!existingLead) {
      const lead = await prisma.lead.create({
        data: {
          name: session?.user?.name || email.split("@")[0],
          email,
          propertyId: property.id,
          source,
          message: "Ouverture d'une conversation WhatsApp via le concierge Domify.",
          userId: session?.user?.id,
        },
        include: {
          property: {
            include: { agent: { select: { userId: true } } },
          },
        },
      });

      await syncInboundLead(lead).catch((error) => console.error("[concierge] CRM intake failed", error));
    }
  }

  return NextResponse.json({ url: whatsappLink(phone, message) });
}
