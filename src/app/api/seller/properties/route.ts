import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { notifyReviewers, recordAudit } from "@/lib/workflow";
import { syncInboundLead } from "@/lib/crm";

const SecureImageUrl = z.string().url().refine((value) => value.startsWith("https://"), "Les images doivent utiliser une URL HTTPS.");

const SellerPropertySchema = z.object({
  title: z.string().trim().min(3, "Le titre doit contenir au moins 3 caractères.").max(120),
  description: z.string().trim().min(20, "Décrivez votre bien en au moins 20 caractères.").max(5000),
  listingType: z.enum(["VENTE", "LOCATION"]),
  price: z.coerce.number().int().positive("Le prix doit être positif.").max(2_000_000_000),
  surfaceArea: z.coerce.number().positive("La surface doit être positive.").max(1_000_000),
  bedrooms: z.coerce.number().int().min(0).max(100).default(0),
  bathrooms: z.coerce.number().int().min(0).max(100).default(0),
  address: z.string().trim().max(240).optional().default(""),
  phone: z.string().trim().min(8, "Un numéro de téléphone est requis.").max(30),
  cityId: z.string().min(1, "Sélectionnez une ville."),
  neighborhoodId: z.string().optional().nullable(),
  propertyTypeId: z.string().min(1, "Sélectionnez un type de bien."),
  imageUrls: z.array(SecureImageUrl).max(20, "Vous pouvez ajouter au maximum 20 images.").default([]),
  turnstileToken: z.string().optional(),
  consent: z.literal(true, { error: "Votre consentement est requis." }),
});

function createReference() {
  return `OWN-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Vous devez être connecté pour déposer un bien." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const { allowed } = rateLimit(`seller-property:${session.user.id}:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Trop de soumissions. Merci de réessayer plus tard." }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  const parsed = SellerPropertySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const verification = await verifyTurnstile({
    token: parsed.data.turnstileToken,
    remoteIp: ip,
    expectedAction: "seller_property",
  });
  if (!verification.ok) {
    return NextResponse.json({ error: "La vérification de sécurité a échoué. Merci de réessayer." }, { status: 400 });
  }

  const [city, propertyType, neighborhood] = await Promise.all([
    prisma.city.findUnique({ where: { id: parsed.data.cityId }, select: { id: true, name: true } }),
    prisma.propertyType.findUnique({ where: { id: parsed.data.propertyTypeId }, select: { id: true, name: true } }),
    parsed.data.neighborhoodId
      ? prisma.neighborhood.findUnique({ where: { id: parsed.data.neighborhoodId }, select: { id: true, cityId: true, name: true } })
      : Promise.resolve(null),
  ]);

  if (!city) return NextResponse.json({ error: "Ville introuvable." }, { status: 400 });
  if (!propertyType) return NextResponse.json({ error: "Type de bien introuvable." }, { status: 400 });
  if (parsed.data.neighborhoodId && (!neighborhood || neighborhood.cityId !== city.id)) {
    return NextResponse.json({ error: "Quartier invalide pour cette ville." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, email: true, phone: true } });
  if (!user) return NextResponse.json({ error: "Compte introuvable." }, { status: 401 });

  const title = parsed.data.title;
  const reference = createReference();
  const slug = `${slugify(title)}-${reference.toLowerCase()}`;
  const summary = [
    `Dépôt propriétaire — ${parsed.data.listingType === "VENTE" ? "vente" : "location"}`,
    `Prix : ${new Intl.NumberFormat("fr-MA").format(parsed.data.price)} MAD`,
    `Surface : ${parsed.data.surfaceArea} m²`,
    `Ville : ${city.name}`,
    neighborhood?.name ? `Quartier : ${neighborhood.name}` : null,
    parsed.data.address ? `Adresse : ${parsed.data.address}` : null,
    `Contact : ${parsed.data.phone}`,
    `Référence : ${reference}`,
  ].filter(Boolean).join("\n");

  const property = await prisma.property.create({
    data: {
      reference,
      title,
      slug,
      description: parsed.data.description,
      listingType: parsed.data.listingType,
      status: "DRAFT",
      approvalStatus: "PENDING",
      submittedAt: new Date(),
      submittedById: user.id,
      price: parsed.data.price,
      surfaceArea: parsed.data.surfaceArea,
      bedrooms: parsed.data.bedrooms,
      bathrooms: parsed.data.bathrooms,
      address: parsed.data.address || null,
      cityId: city.id,
      neighborhoodId: neighborhood?.id ?? null,
      propertyTypeId: propertyType.id,
      media: {
        create: parsed.data.imageUrls.map((url, order) => ({ url, order, type: "image", workflowStatus: "UPLOADED" })),
      },
    },
    include: {
      city: { select: { id: true, name: true } },
      propertyType: { select: { id: true, name: true } },
      agent: { select: { userId: true } },
    },
  });

  if (parsed.data.phone !== user.phone) {
    await prisma.user.update({ where: { id: user.id }, data: { phone: parsed.data.phone } });
  }

  const lead = await prisma.lead.create({
    data: {
      name: user.name || user.email,
      email: user.email,
      phone: parsed.data.phone,
      message: summary,
      source: "seller_property_submission",
      userId: user.id,
      propertyId: property.id,
    },
  });

  const crm = await syncInboundLead({
    ...lead,
    property: {
      title: property.title,
      cityId: property.cityId,
      propertyTypeId: property.propertyTypeId,
      agent: property.agent,
    },
  });
  await prisma.crmContact.update({ where: { id: crm.contact.id }, data: { lifecycle: "SELLER", phone: parsed.data.phone, source: "seller_property_submission" } });
  await prisma.crmSellerCase.create({
    data: {
      title: `Dépôt — ${title}`,
      stage: "ONBOARDING",
      notes: summary,
      contactId: crm.contact.id,
      propertyId: property.id,
    },
  });

  await notifyReviewers({
    type: "APPROVAL_REQUEST",
    title: "Nouveau dépôt propriétaire",
    body: `« ${title} » a été soumis par ${user.name || user.email} et attend une vérification.`,
    href: `/admin/properties/${property.id}`,
  });
  await recordAudit({
    actorId: user.id,
    action: "SELLER_PROPERTY_SUBMITTED",
    entityType: "Property",
    entityId: property.id,
    summary: `Dépôt vendeur/bailleur « ${title} » soumis pour validation`,
  });

  return NextResponse.json({
    ok: true,
    property: { id: property.id, reference: property.reference, title: property.title, approvalStatus: property.approvalStatus },
  }, { status: 201 });
}
