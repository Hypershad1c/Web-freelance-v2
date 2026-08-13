"use server";

import { CrmActivityType, CrmDealStage } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { crmDealUpdateForStage } from "@/lib/crm";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/workflow";

const DealStages = ["NEW", "QUALIFIED", "VIEWING", "OFFER", "NEGOTIATION", "WON", "LOST"] as const;
const ActivityTypes = ["NOTE", "CALL", "EMAIL", "WHATSAPP", "MEETING", "TASK"] as const;

type CrmRole = "ADMIN" | "EDITOR" | "AGENT";

async function requireCrmStaff() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "EDITOR" && role !== "AGENT")) throw new Error("Non autorisé");
  return { ...session, user: { ...session.user, role: role as CrmRole } };
}

async function assertContactAccess(contactId: string, session: Awaited<ReturnType<typeof requireCrmStaff>>) {
  const contact = await prisma.crmContact.findUnique({ where: { id: contactId } });
  if (!contact) throw new Error("Contact introuvable");
  if (session.user.role === "AGENT" && contact.ownerId !== session.user.id) throw new Error("Non autorisé");
  return contact;
}

function refreshCrm(contactId?: string) {
  revalidatePath("/admin/crm");
  if (contactId) revalidatePath(`/admin/crm/contacts/${contactId}`);
  revalidatePath("/admin");
}

const ContactSchema = z.object({
  name: z.string().min(2, "Le nom est requis").max(160),
  email: z.string().email("Email invalide").max(254),
  phone: z.string().max(40).optional(),
  source: z.string().max(80).optional(),
  preferredLocation: z.string().max(160).optional(),
  budgetMin: z.coerce.number().int().min(0).optional(),
  budgetMax: z.coerce.number().int().min(0).optional(),
  notes: z.string().max(4000).optional(),
});

export async function createCrmContact(formData: FormData) {
  const session = await requireCrmStaff();
  const parsed = ContactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Données invalides");
  if (parsed.data.budgetMin && parsed.data.budgetMax && parsed.data.budgetMin > parsed.data.budgetMax) throw new Error("Le budget minimum doit être inférieur au budget maximum");

  const data = parsed.data;
  const contact = await prisma.crmContact.upsert({
    where: { email: data.email.toLowerCase() },
    create: {
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      source: data.source || "manual",
      preferredLocation: data.preferredLocation || null,
      budgetMin: data.budgetMin || null,
      budgetMax: data.budgetMax || null,
      notes: data.notes || null,
      ownerId: session.user.id,
    },
    update: {
      name: data.name,
      phone: data.phone || null,
      source: data.source || "manual",
      preferredLocation: data.preferredLocation || null,
      budgetMin: data.budgetMin || null,
      budgetMax: data.budgetMax || null,
      notes: data.notes || null,
      ...(session.user.role !== "AGENT" ? {} : { ownerId: session.user.id }),
    },
  });

  await prisma.crmActivity.create({
    data: { type: CrmActivityType.SYSTEM, body: "Fiche contact créée ou enrichie manuellement.", contactId: contact.id, actorId: session.user.id },
  });
  await recordAudit({ actorId: session.user.id, action: "CRM_CONTACT_SAVED", entityType: "CrmContact", entityId: contact.id, summary: `Contact CRM : ${contact.name}` });
  refreshCrm(contact.id);
  return contact.id;
}

export async function updateCrmContact(contactId: string, formData: FormData) {
  const session = await requireCrmStaff();
  await assertContactAccess(contactId, session);
  const parsed = ContactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Données invalides");
  if (parsed.data.budgetMin && parsed.data.budgetMax && parsed.data.budgetMin > parsed.data.budgetMax) throw new Error("Le budget minimum doit être inférieur au budget maximum");

  const data = parsed.data;
  const contact = await prisma.crmContact.update({
    where: { id: contactId },
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      source: data.source || null,
      preferredLocation: data.preferredLocation || null,
      budgetMin: data.budgetMin || null,
      budgetMax: data.budgetMax || null,
      notes: data.notes || null,
    },
  });
  await recordAudit({ actorId: session.user.id, action: "CRM_CONTACT_UPDATED", entityType: "CrmContact", entityId: contact.id, summary: `Contact CRM mis à jour : ${contact.name}` });
  refreshCrm(contact.id);
}

const DealSchema = z.object({
  title: z.string().min(3, "Le titre est requis").max(180),
  propertyId: z.string().optional(),
  value: z.coerce.number().int().min(0).optional(),
  stage: z.enum(DealStages).default("NEW"),
  nextFollowUpAt: z.string().optional(),
  expectedCloseAt: z.string().optional(),
});

export async function createCrmDeal(contactId: string, formData: FormData) {
  const session = await requireCrmStaff();
  const contact = await assertContactAccess(contactId, session);
  const parsed = DealSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Données invalides");
  const data = parsed.data;
  const stageValues = crmDealUpdateForStage(data.stage as CrmDealStage);

  const deal = await prisma.crmDeal.create({
    data: {
      title: data.title,
      contactId,
      propertyId: data.propertyId || null,
      value: data.value || null,
      stage: data.stage,
      probability: Number(stageValues.probability),
      nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
      expectedCloseAt: data.expectedCloseAt ? new Date(data.expectedCloseAt) : null,
      ownerId: contact.ownerId || session.user.id,
    },
  });
  await prisma.crmActivity.create({ data: { type: CrmActivityType.SYSTEM, body: `Opportunité créée : ${deal.title}.`, contactId, dealId: deal.id, actorId: session.user.id } });
  await recordAudit({ actorId: session.user.id, action: "CRM_DEAL_CREATED", entityType: "CrmDeal", entityId: deal.id, summary: `Opportunité CRM : ${deal.title}` });
  refreshCrm(contactId);
}

export async function updateCrmDealStage(dealId: string, stage: string) {
  const session = await requireCrmStaff();
  const parsed = z.enum(DealStages).safeParse(stage);
  if (!parsed.success) throw new Error("Étape invalide");
  const deal = await prisma.crmDeal.findUnique({ where: { id: dealId }, include: { contact: true } });
  if (!deal) throw new Error("Opportunité introuvable");
  if (session.user.role === "AGENT" && deal.ownerId !== session.user.id && deal.contact.ownerId !== session.user.id) throw new Error("Non autorisé");

  const update = crmDealUpdateForStage(parsed.data);
  await prisma.crmDeal.update({ where: { id: dealId }, data: update });
  await prisma.crmActivity.create({
    data: { type: CrmActivityType.SYSTEM, body: `Étape de l’opportunité : ${deal.stage} → ${parsed.data}.`, contactId: deal.contactId, dealId, actorId: session.user.id },
  });
  await recordAudit({ actorId: session.user.id, action: "CRM_DEAL_STAGE_UPDATED", entityType: "CrmDeal", entityId: dealId, summary: `${deal.title} : ${deal.stage} → ${parsed.data}` });
  refreshCrm(deal.contactId);
}

const ActivitySchema = z.object({
  type: z.enum(ActivityTypes),
  body: z.string().min(2, "Le contenu est requis").max(4000),
  dueAt: z.string().optional(),
  dealId: z.string().optional(),
});

export async function createCrmActivity(contactId: string, formData: FormData) {
  const session = await requireCrmStaff();
  await assertContactAccess(contactId, session);
  const parsed = ActivitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Données invalides");
  const data = parsed.data;

  if (data.dealId) {
    const deal = await prisma.crmDeal.findFirst({ where: { id: data.dealId, contactId } });
    if (!deal) throw new Error("Opportunité invalide");
  }

  const activity = await prisma.crmActivity.create({
    data: {
      type: data.type,
      body: data.body,
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
      contactId,
      dealId: data.dealId || null,
      actorId: session.user.id,
    },
  });
  await recordAudit({ actorId: session.user.id, action: "CRM_ACTIVITY_CREATED", entityType: "CrmActivity", entityId: activity.id, summary: `Activité CRM ${data.type} créée` });
  refreshCrm(contactId);
}

export async function completeCrmActivity(activityId: string) {
  const session = await requireCrmStaff();
  const activity = await prisma.crmActivity.findUnique({ where: { id: activityId }, include: { contact: true, deal: true } });
  if (!activity) throw new Error("Activité introuvable");
  if (session.user.role === "AGENT" && activity.contact.ownerId !== session.user.id && activity.deal?.ownerId !== session.user.id) throw new Error("Non autorisé");

  await prisma.crmActivity.update({ where: { id: activityId }, data: { completedAt: activity.completedAt ? null : new Date() } });
  await recordAudit({ actorId: session.user.id, action: "CRM_ACTIVITY_TOGGLED", entityType: "CrmActivity", entityId: activityId, summary: activity.completedAt ? "Tâche CRM réouverte" : "Tâche CRM terminée" });
  refreshCrm(activity.contactId);
}
