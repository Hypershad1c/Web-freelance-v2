import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { queueCrmAutomations, upsertCrmContact } from "@/lib/crm";

const ValuationSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(180),
  phone: z.string().max(40).optional(),
  propertyType: z.string().min(2).max(80),
  city: z.string().min(2).max(120),
  neighborhood: z.string().max(120).optional(),
  surfaceArea: z.coerce.number().positive().max(100000).optional(),
  bedrooms: z.coerce.number().int().min(0).max(50).optional(),
  desiredPrice: z.coerce.number().int().min(0).optional(),
  transactionType: z.enum(["VENTE", "LOCATION"]),
  timeline: z.enum(["ASAP", "THREE_MONTHS", "SIX_MONTHS", "EXPLORING"]),
  notes: z.string().max(4000).optional(),
  website: z.string().optional(),
  turnstileToken: z.string().optional(),
});

const TIMELINE_LABELS = {
  ASAP: "Dès que possible",
  THREE_MONTHS: "Sous 3 mois",
  SIX_MONTHS: "Sous 6 mois",
  EXPLORING: "Projet en réflexion",
};

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = rateLimit(`valuation:${ip}`, { limit: 4, windowMs: 10 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Trop de demandes. Merci de réessayer plus tard." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = ValuationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true }, { status: 201 });

  const verification = await verifyTurnstile({ token: parsed.data.turnstileToken, remoteIp: ip, expectedAction: "valuation" });
  if (!verification.ok) return NextResponse.json({ error: "La vérification de sécurité a échoué. Merci de réessayer." }, { status: 400 });

  const { website, turnstileToken, ...data } = parsed.data;
  void website;
  void turnstileToken;
  const session = await auth();
  const city = await prisma.city.findFirst({ where: { name: { equals: data.city.trim(), mode: "insensitive" } }, select: { id: true } });
  const propertyType = await prisma.propertyType.findFirst({ where: { name: { equals: data.propertyType.trim(), mode: "insensitive" } }, select: { id: true } });
  const details = [
    `Bien : ${data.propertyType}`,
    `Projet : ${data.transactionType === "VENTE" ? "Vente" : "Location"}`,
    `Ville : ${data.city}`,
    data.neighborhood && `Quartier : ${data.neighborhood}`,
    data.surfaceArea && `Surface : ${data.surfaceArea} m²`,
    data.bedrooms !== undefined && `Chambres : ${data.bedrooms}`,
    data.desiredPrice && `Valeur souhaitée : ${new Intl.NumberFormat("fr-MA").format(data.desiredPrice)} MAD`,
    `Échéance : ${TIMELINE_LABELS[data.timeline]}`,
    data.notes && `Notes : ${data.notes}`,
  ].filter(Boolean).join("\n");

  const contact = await upsertCrmContact({
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    source: "valuation_funnel",
    cityId: city?.id,
    propertyTypeId: propertyType?.id,
  });
  await prisma.crmContact.update({ where: { id: contact.id }, data: { lifecycle: "SELLER", preferredLocation: data.neighborhood || data.city } });

  const lead = await prisma.lead.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      message: `Demande d’estimation\n${details}`,
      source: "valuation_funnel",
      userId: session?.user?.id,
      crmContactId: contact.id,
    },
  });

  const sellerCase = await prisma.crmSellerCase.create({
    data: {
      title: `${data.transactionType === "VENTE" ? "Vente" : "Location"} ${data.propertyType} — ${data.city}`,
      estimatedValue: data.desiredPrice || null,
      notes: details,
      nextActionAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      contactId: contact.id,
      ownerId: contact.ownerId,
    },
  });

  await prisma.crmActivity.create({
    data: {
      type: "SYSTEM",
      body: "Demande d’estimation reçue depuis le formulaire vendeur.",
      contactId: contact.id,
      actorId: session?.user?.id || null,
    },
  });
  await queueCrmAutomations(contact.id, "seller_case_created").catch((error) => console.error("[valuation] Automation queue failed", error));

  return NextResponse.json({ ok: true, sellerCaseId: sellerCase.id, leadId: lead.id }, { status: 201 });
}
