"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { notifyAdministrators, notifyUsers, recordAudit } from "@/lib/workflow";

const PropertySchema = z.object({
  reference: z.string().min(2, "Référence requise"),
  title: z.string().min(3, "Titre requis"),
  slug: z.string().min(3, "Slug requis"),
  description: z.string().min(10, "Description requise"),
  listingType: z.enum(["VENTE", "LOCATION"]),
  status: z.enum(["DRAFT", "PUBLISHED", "UNDER_OFFER", "SOLD", "ARCHIVED"]),
  price: z.coerce.number().int().positive("Le prix doit être positif"),
  surfaceArea: z.coerce.number().positive("La surface doit être positive"),
  bedrooms: z.coerce.number().int().min(0).default(0),
  bathrooms: z.coerce.number().int().min(0).default(0),
  floors: z.coerce.number().int().optional().nullable(),
  yearBuilt: z.coerce.number().int().optional().nullable(),
  address: z.string().optional(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  featured: z.coerce.boolean().default(false),
  cityId: z.string().min(1, "Ville requise"),
  neighborhoodId: z.string().optional(),
  propertyTypeId: z.string().min(1, "Type de bien requis"),
  agencyId: z.string().optional(),
  agentId: z.string().optional(),
  amenityIds: z.array(z.string()).default([]),
  imageUrls: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

const BulkPropertyActionSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Sélectionnez au moins une propriété."),
  action: z.enum(["publish", "draft", "archive", "feature", "unfeature", "delete"]),
});

const CsvPropertySchema = z.object({
  reference: z.string().min(2),
  title: z.string().min(3),
  slug: z.string().optional(),
  description: z.string().min(10),
  listingType: z.enum(["VENTE", "LOCATION"]),
  status: z.enum(["DRAFT", "PUBLISHED", "UNDER_OFFER", "SOLD", "ARCHIVED"]),
  price: z.number().int().positive(),
  surfaceArea: z.number().positive(),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  floors: z.number().int().nullable(),
  yearBuilt: z.number().int().nullable(),
  address: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  featured: z.boolean(),
  city: z.string().min(1),
  propertyType: z.string().min(1),
  agency: z.string().nullable(),
  agent: z.string().nullable(),
  amenities: z.array(z.string()),
  imageUrls: z.array(z.string()),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
});

export type PropertyFormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export type CsvImportState = {
  message?: string;
  created?: number;
  updated?: number;
  errors?: string[];
};

async function requirePropertyEditor() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "EDITOR" && role !== "AGENT")) {
    throw new Error("Non autorisé");
  }
  return session;
}

async function requirePropertyManager() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "EDITOR")) {
    throw new Error("Non autorisé");
  }
  return session;
}

async function getAgentScope(userId: string, role?: string) {
  if (role !== "AGENT") return null;
  const agent = await prisma.agent.findUnique({ where: { userId }, select: { id: true, agencyId: true } });
  if (!agent) throw new Error("Profil agent introuvable");
  return agent;
}

function parseFormData(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const rawSlug = String(formData.get("slug") ?? "");
  return {
    reference: formData.get("reference"),
    title,
    slug: slugify(rawSlug || title),
    description: formData.get("description"),
    listingType: formData.get("listingType"),
    status: formData.get("status"),
    price: formData.get("price"),
    surfaceArea: formData.get("surfaceArea"),
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
    floors: formData.get("floors") || undefined,
    yearBuilt: formData.get("yearBuilt") || undefined,
    address: formData.get("address") || undefined,
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
    featured: formData.get("featured") === "on",
    cityId: formData.get("cityId"),
    neighborhoodId: formData.get("neighborhoodId") || undefined,
    propertyTypeId: formData.get("propertyTypeId"),
    agencyId: formData.get("agencyId") || undefined,
    agentId: formData.get("agentId") || undefined,
    amenityIds: formData.getAll("amenityIds") as string[],
    imageUrls: formData.get("imageUrls") || undefined,
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
  };
}

function parseImageUrls(raw?: string) {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function createProperty(_prev: PropertyFormState, formData: FormData): Promise<PropertyFormState> {
  const session = await requirePropertyEditor();
  const agentScope = await getAgentScope(session.user.id, session.user.role);

  const parsed = PropertySchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, message: "Merci de corriger les erreurs ci-dessous." };
  }

  const { amenityIds, imageUrls, ...data } = parsed.data;
  const urls = parseImageUrls(imageUrls);

  let property;
  try {
    property = await prisma.property.create({
      data: {
        ...data,
        neighborhoodId: data.neighborhoodId || null,
        agencyId: agentScope?.agencyId ?? (data.agencyId || null),
        agentId: agentScope?.id ?? (data.agentId || null),
        submittedById: session.user.id,
        approvalStatus: session.user.role === "ADMIN" && data.status === "PUBLISHED" ? "APPROVED" : "DRAFT",
        approvedById: session.user.role === "ADMIN" && data.status === "PUBLISHED" ? session.user.id : null,
        approvedAt: session.user.role === "ADMIN" && data.status === "PUBLISHED" ? new Date() : null,
        status: session.user.role === "ADMIN" ? data.status : "DRAFT",
        amenities: { connect: amenityIds.map((id) => ({ id })) },
        media: {
          create: urls.map((url, order) => ({ url, order, type: "image" })),
        },
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { message: "Cette référence ou ce slug existe déjà." };
    }
    throw error;
  }

  await recordAudit({ actorId: session.user.id, action: "PROPERTY_CREATED", entityType: "Property", entityId: property.id, summary: `Création de la propriété « ${property.title} »` });
  revalidatePropertyViews();
  redirect(`/admin/properties/${property.id}`);
}

export async function updateProperty(
  id: string,
  _prev: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  const session = await requirePropertyEditor();
  const agentScope = await getAgentScope(session.user.id, session.user.role);
  if (agentScope) {
    const existing = await prisma.property.findUnique({ where: { id }, select: { agentId: true } });
    if (!existing || existing.agentId !== agentScope.id) throw new Error("Non autorisé");
  }

  const parsed = PropertySchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, message: "Merci de corriger les erreurs ci-dessous." };
  }

  const { amenityIds, imageUrls, ...data } = parsed.data;
  const urls = parseImageUrls(imageUrls);

  await prisma.property.update({
    where: { id },
    data: {
      ...data,
      neighborhoodId: data.neighborhoodId || null,
      agencyId: agentScope?.agencyId ?? (data.agencyId || null),
      agentId: agentScope?.id ?? (data.agentId || null),
      ...(session.user.role !== "ADMIN" ? {
        status: "DRAFT" as const,
        approvalStatus: "DRAFT" as const,
        submittedById: session.user.id,
        approvedAt: null,
        approvedById: null,
        rejectionReason: null,
      } : {}),
      amenities: { set: amenityIds.map((amenityId) => ({ id: amenityId })) },
    },
  });

  await prisma.media.deleteMany({ where: { propertyId: id, type: "image" } });
  if (urls.length > 0) {
    await prisma.media.createMany({
      data: urls.map((url, order) => ({ url, order, type: "image", propertyId: id })),
    });
  }

  await recordAudit({ actorId: session.user.id, action: "PROPERTY_UPDATED", entityType: "Property", entityId: id, summary: "Mise à jour des informations de la propriété" });
  revalidatePropertyViews(id);
  return { message: "Bien mis à jour avec succès." };
}

export async function deleteProperty(id: string) {
  const session = await requirePropertyManager();
  await prisma.property.delete({ where: { id } });
  await recordAudit({ actorId: session.user.id, action: "PROPERTY_DELETED", entityType: "Property", entityId: id, summary: "Suppression de la propriété" });
  revalidatePropertyViews();
}

export async function bulkUpdateProperties(input: z.infer<typeof BulkPropertyActionSchema>) {
  const session = await requirePropertyManager();
  const parsed = BulkPropertyActionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Sélection invalide." };
  }

  const { ids, action } = parsed.data;
  if (action === "delete") {
    const result = await prisma.property.deleteMany({ where: { id: { in: ids } } });
    await recordAudit({ actorId: session.user.id, action: "PROPERTY_BULK_DELETED", entityType: "Property", entityId: ids.join(","), summary: `Suppression groupée de ${result.count} propriété(s)` });
    revalidatePropertyViews();
    return { ok: true, message: `${result.count} propriété(s) supprimée(s).` };
  }

  const data =
    action === "publish" ? { status: "PUBLISHED" as const } :
    action === "draft" ? { status: "DRAFT" as const } :
    action === "archive" ? { status: "ARCHIVED" as const } :
    action === "feature" ? { featured: true } :
    { featured: false };

  const result = await prisma.property.updateMany({ where: { id: { in: ids } }, data });
  await recordAudit({ actorId: session.user.id, action: `PROPERTY_BULK_${action.toUpperCase()}`, entityType: "Property", entityId: ids.join(","), summary: `Action groupée « ${action} » sur ${result.count} propriété(s)` });
  revalidatePropertyViews();
  return { ok: true, message: `${result.count} propriété(s) mise(s) à jour.` };
}

export async function importPropertiesFromCsv(_previous: CsvImportState, formData: FormData): Promise<CsvImportState> {
  const session = await requirePropertyManager();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { message: "Sélectionnez un fichier CSV non vide." };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { message: "Le fichier CSV ne peut pas dépasser 8 Mo." };
  }

  const rows = parseCsv(await file.text());
  if (rows.length < 2) {
    return { message: "Le fichier CSV doit contenir un en-tête et au moins une ligne." };
  }

  const headers = rows[0].map((header) => normalizeHeader(header));
  const requiredHeaders = ["reference", "title", "description", "city", "propertytype", "price", "surfacearea"];
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length > 0) {
    return { message: `Colonnes obligatoires absentes : ${missingHeaders.join(", ")}.` };
  }

  const [cities, propertyTypes, agencies, agents, amenities] = await Promise.all([
    prisma.city.findMany({ select: { id: true, name: true, slug: true } }),
    prisma.propertyType.findMany({ select: { id: true, name: true, slug: true } }),
    prisma.agency.findMany({ select: { id: true, name: true, slug: true } }),
    prisma.agent.findMany({ select: { id: true, name: true, slug: true } }),
    prisma.amenity.findMany({ select: { id: true, name: true, slug: true } }),
  ]);

  const cityByName = createLookup(cities);
  const typeByName = createLookup(propertyTypes);
  const agencyByName = createLookup(agencies);
  const agentByName = createLookup(agents);
  const amenityByName = createLookup(amenities);
  const errors: string[] = [];
  let created = 0;
  let updated = 0;

  for (const [rowIndex, row] of rows.slice(1).entries()) {
    if (row.every((cell) => !cell.trim())) continue;
    const source = Object.fromEntries(headers.map((header, columnIndex) => [header, row[columnIndex]?.trim() ?? ""]));
    const line = rowIndex + 2;

    try {
      const city = cityByName.get(normalizeKey(source.city));
      const propertyType = typeByName.get(normalizeKey(source.propertytype));
      const agency = source.agency ? agencyByName.get(normalizeKey(source.agency)) : undefined;
      const agent = source.agent ? agentByName.get(normalizeKey(source.agent)) : undefined;
      const amenityIds = splitList(source.amenities)
        .map((name) => amenityByName.get(normalizeKey(name)))
        .filter((id): id is string => Boolean(id));
      const unresolvedAmenities = splitList(source.amenities).filter((name) => !amenityByName.has(normalizeKey(name)));

      if (!city || !propertyType) {
        throw new Error("La ville ou le type de bien ne correspond à aucune donnée existante.");
      }
      if (source.agency && !agency) throw new Error(`Agence inconnue : ${source.agency}.`);
      if (source.agent && !agent) throw new Error(`Agent inconnu : ${source.agent}.`);
      if (unresolvedAmenities.length > 0) throw new Error(`Équipements inconnus : ${unresolvedAmenities.join(", ")}.`);

      const parsed = CsvPropertySchema.safeParse({
        reference: source.reference,
        title: source.title,
        slug: source.slug || undefined,
        description: source.description,
        listingType: source.listingtype || "VENTE",
        status: source.status || "DRAFT",
        price: parseNumber(source.price),
        surfaceArea: parseNumber(source.surfacearea),
        bedrooms: parseNumber(source.bedrooms, 0),
        bathrooms: parseNumber(source.bathrooms, 0),
        floors: parseNullableNumber(source.floors),
        yearBuilt: parseNullableNumber(source.yearbuilt),
        address: source.address || null,
        latitude: parseNullableNumber(source.latitude),
        longitude: parseNullableNumber(source.longitude),
        featured: parseBoolean(source.featured),
        city: source.city,
        propertyType: source.propertytype,
        agency: source.agency || null,
        agent: source.agent || null,
        amenities: splitList(source.amenities),
        imageUrls: splitList(source.imageurls),
        seoTitle: source.seotitle || null,
        seoDescription: source.seodescription || null,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues.map((issue) => issue.message).join(" "));
      }

      const value = parsed.data;
      const existing = await prisma.property.findUnique({ where: { reference: value.reference }, select: { id: true } });
      const propertyData = {
        reference: value.reference,
        title: value.title,
        slug: value.slug ? slugify(value.slug) : `${slugify(value.title)}-${slugify(value.reference)}`,
        description: value.description,
        listingType: value.listingType,
        status: value.status,
        price: value.price,
        surfaceArea: value.surfaceArea,
        bedrooms: value.bedrooms,
        bathrooms: value.bathrooms,
        floors: value.floors,
        yearBuilt: value.yearBuilt,
        address: value.address,
        latitude: value.latitude,
        longitude: value.longitude,
        featured: value.featured,
        cityId: city,
        propertyTypeId: propertyType,
        agencyId: agency ?? null,
        agentId: agent ?? null,
        seoTitle: value.seoTitle,
        seoDescription: value.seoDescription,
      };

      if (existing) {
        await prisma.property.update({
          where: { id: existing.id },
          data: { ...propertyData, amenities: { set: amenityIds.map((id) => ({ id })) } },
        });
        if (value.imageUrls.length > 0) {
          await prisma.media.deleteMany({ where: { propertyId: existing.id, type: "image" } });
          await prisma.media.createMany({
            data: value.imageUrls.map((url, order) => ({ url, order, type: "image", propertyId: existing.id })),
          });
        }
        updated += 1;
      } else {
        await prisma.property.create({
          data: {
            ...propertyData,
            amenities: { connect: amenityIds.map((id) => ({ id })) },
            media: { create: value.imageUrls.map((url, order) => ({ url, order, type: "image" })) },
          },
        });
        created += 1;
      }
    } catch (error) {
      errors.push(`Ligne ${line} : ${error instanceof Error ? error.message : "erreur inconnue"}`);
    }
  }

  await recordAudit({ actorId: session.user.id, action: "PROPERTY_CSV_IMPORTED", entityType: "Property", entityId: "csv-import", summary: `Import CSV : ${created} création(s), ${updated} mise(s) à jour, ${errors.length} erreur(s)` });
  revalidatePropertyViews();
  return {
    message: errors.length > 0 ? "Import terminé avec des lignes à corriger." : "Import terminé avec succès.",
    created,
    updated,
    errors: errors.slice(0, 20),
  };
}

const ApprovalDecisionSchema = z.enum(["approve", "reject"]);

export async function submitPropertyForApproval(id: string) {
  const session = await requirePropertyEditor();
  const agentScope = await getAgentScope(session.user.id, session.user.role);
  const property = await prisma.property.findUnique({ where: { id }, select: { id: true, title: true, submittedById: true } });
  if (!property) throw new Error("Propriété introuvable");
  if ((session.user.role === "EDITOR" || session.user.role === "AGENT") && property.submittedById && property.submittedById !== session.user.id) throw new Error("Non autorisé");
  if (agentScope) {
    const ownedProperty = await prisma.property.findUnique({ where: { id }, select: { agentId: true } });
    if (ownedProperty?.agentId !== agentScope.id) throw new Error("Non autorisé");
  }

  await prisma.property.update({
    where: { id },
    data: {
      status: "DRAFT",
      approvalStatus: "PENDING",
      submittedAt: new Date(),
      submittedById: session.user.id,
      approvedAt: null,
      approvedById: null,
      rejectionReason: null,
    },
  });
  await notifyAdministrators({
    type: "APPROVAL_REQUEST",
    title: "Propriété à approuver",
    body: `« ${property.title} » attend votre validation.`,
    href: `/admin/properties/${id}`,
  });
  await recordAudit({ actorId: session.user.id, action: "PROPERTY_SUBMITTED", entityType: "Property", entityId: id, summary: `Soumission de « ${property.title} » pour validation` });
  revalidatePropertyViews(id);
  revalidatePath("/admin/approvals");
}

export async function reviewPropertyApproval(id: string, decision: "approve" | "reject", rejectionReason?: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") throw new Error("Non autorisé");
  const parsed = ApprovalDecisionSchema.safeParse(decision);
  if (!parsed.success) throw new Error("Décision invalide");
  if (parsed.data === "reject" && !rejectionReason?.trim()) throw new Error("Veuillez indiquer le motif du refus.");

  const property = await prisma.property.findUnique({ where: { id }, select: { id: true, title: true, submittedById: true } });
  if (!property) throw new Error("Propriété introuvable");

  const approved = parsed.data === "approve";
  await prisma.property.update({
    where: { id },
    data: {
      approvalStatus: approved ? "APPROVED" : "REJECTED",
      status: approved ? "PUBLISHED" : "DRAFT",
      approvedAt: approved ? new Date() : null,
      approvedById: approved ? session.user.id : null,
      rejectionReason: approved ? null : rejectionReason!.trim(),
    },
  });
  await notifyUsers({
    userIds: property.submittedById ? [property.submittedById] : [],
    type: "APPROVAL_DECISION",
    title: approved ? "Propriété approuvée" : "Propriété à corriger",
    body: approved ? `« ${property.title} » est désormais publiée.` : rejectionReason!.trim(),
    href: `/admin/properties/${id}`,
  });
  await recordAudit({ actorId: session.user.id, action: approved ? "PROPERTY_APPROVED" : "PROPERTY_REJECTED", entityType: "Property", entityId: id, summary: approved ? `Validation de « ${property.title} »` : `Refus de « ${property.title} »` });
  revalidatePropertyViews(id);
  revalidatePath("/admin/approvals");
}

function revalidatePropertyViews(id?: string) {
  revalidatePath("/admin/properties");
  if (id) revalidatePath(`/admin/properties/${id}`);
  revalidatePath("/proprietes");
  if (id) revalidatePath(`/proprietes/${id}`);
  revalidatePath("/");
}

function normalizeKey(value: string) {
  return value.trim().toLocaleLowerCase("fr-FR");
}

function normalizeHeader(value: string) {
  return normalizeKey(value).replace(/[^a-z0-9]/g, "");
}

function createLookup(items: Array<{ id: string; name: string; slug: string }>) {
  const lookup = new Map<string, string>();
  for (const item of items) {
    lookup.set(normalizeKey(item.name), item.id);
    lookup.set(normalizeKey(item.slug), item.id);
  }
  return lookup;
}

function splitList(value: string | undefined) {
  return (value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumber(value: string | undefined, fallback = Number.NaN) {
  const normalized = (value ?? "").trim().replace(/\s/g, "").replace(/,/g, ".");
  return normalized ? Number(normalized) : fallback;
}

function parseNullableNumber(value: string | undefined) {
  const parsed = parseNumber(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBoolean(value: string | undefined) {
  return ["1", "true", "yes", "oui", "vrai"].includes((value ?? "").trim().toLocaleLowerCase("fr-FR"));
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (inQuotes && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (inQuotes) throw new Error("Le fichier CSV contient une chaîne entre guillemets non fermée.");
  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  if (rows[0]?.[0]) rows[0][0] = rows[0][0].replace(/^\uFEFF/, "");
  return rows;
}
