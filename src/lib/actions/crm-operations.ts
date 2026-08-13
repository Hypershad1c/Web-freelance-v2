"use server";

import { CrmCommunicationChannel, CrmCommunicationDirection, CrmCommunicationStatus, CrmDocumentType, CrmSellerCaseStage } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { recomputeCrmLeadScore } from "@/lib/crm";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/workflow";

const staffRoles = new Set(["ADMIN", "EDITOR", "AGENT"]);
async function requireStaff() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role || !staffRoles.has(session.user.role)) throw new Error("Non autorisé");
  return session;
}
async function requireAdminOrEditor() {
  const session = await requireStaff();
  if (session.user.role === "AGENT") throw new Error("Non autorisé");
  return session;
}
async function assertContact(contactId: string, userId: string, role: string) {
  const contact = await prisma.crmContact.findUnique({ where: { id: contactId } });
  if (!contact || (role === "AGENT" && contact.ownerId !== userId)) throw new Error("Contact introuvable ou non autorisé");
  return contact;
}
function refresh(contactId?: string) { revalidatePath("/admin/crm"); revalidatePath("/admin/crm/operations"); if (contactId) revalidatePath(`/admin/crm/contacts/${contactId}`); }

const CommunicationSchema = z.object({ channel: z.nativeEnum(CrmCommunicationChannel), direction: z.nativeEnum(CrmCommunicationDirection), subject: z.string().max(180).optional(), body: z.string().min(2).max(4000), dealId: z.string().optional() });
export async function logCrmCommunication(contactId: string, formData: FormData) {
  const session = await requireStaff();
  await assertContact(contactId, session.user.id, session.user.role);
  const data = CommunicationSchema.parse(Object.fromEntries(formData));
  if (data.dealId) { const deal = await prisma.crmDeal.findFirst({ where: { id: data.dealId, contactId } }); if (!deal) throw new Error("Opportunité invalide"); }
  const item = await prisma.crmCommunication.create({ data: { channel: data.channel, direction: data.direction, status: CrmCommunicationStatus.LOGGED, subject: data.subject || null, body: data.body, sentAt: data.direction === "OUTBOUND" ? new Date() : null, contactId, dealId: data.dealId || null, ownerId: session.user.id } });
  await prisma.crmContact.update({ where: { id: contactId }, data: { lastContactedAt: new Date() } });
  await recomputeCrmLeadScore(contactId);
  await recordAudit({ actorId: session.user.id, action: "CRM_COMMUNICATION_LOGGED", entityType: "CrmCommunication", entityId: item.id, summary: `${data.channel} ${data.direction} enregistré` });
  refresh(contactId);
}

const SellerSchema = z.object({ title: z.string().min(3).max(180), estimatedValue: z.coerce.number().int().min(0).optional(), propertyId: z.string().optional(), nextActionAt: z.string().optional(), notes: z.string().max(4000).optional() });
export async function createCrmSellerCase(contactId: string, formData: FormData) {
  const session = await requireStaff();
  const contact = await assertContact(contactId, session.user.id, session.user.role);
  const data = SellerSchema.parse(Object.fromEntries(formData));
  const item = await prisma.crmSellerCase.create({ data: { title: data.title, estimatedValue: data.estimatedValue || null, propertyId: data.propertyId || null, nextActionAt: data.nextActionAt ? new Date(data.nextActionAt) : null, notes: data.notes || null, contactId, ownerId: contact.ownerId || session.user.id } });
  await prisma.crmContact.update({ where: { id: contactId }, data: { lifecycle: "SELLER" } });
  await recordAudit({ actorId: session.user.id, action: "CRM_SELLER_CASE_CREATED", entityType: "CrmSellerCase", entityId: item.id, summary: `Dossier vendeur : ${item.title}` });
  refresh(contactId);
}

export async function updateCrmSellerStage(caseId: string, stage: string) {
  const session = await requireStaff();
  const parsed = z.nativeEnum(CrmSellerCaseStage).safeParse(stage); if (!parsed.success) throw new Error("Étape invalide");
  const item = await prisma.crmSellerCase.findUnique({ where: { id: caseId }, include: { contact: true } });
  if (!item || (session.user.role === "AGENT" && item.ownerId !== session.user.id && item.contact.ownerId !== session.user.id)) throw new Error("Non autorisé");
  await prisma.crmSellerCase.update({ where: { id: caseId }, data: { stage: parsed.data } });
  await recordAudit({ actorId: session.user.id, action: "CRM_SELLER_CASE_STAGE_UPDATED", entityType: "CrmSellerCase", entityId: caseId, summary: `${item.title} → ${parsed.data}` });
  refresh(item.contactId);
}

const DocumentSchema = z.object({ name: z.string().min(2).max(180), url: z.string().url(), type: z.nativeEnum(CrmDocumentType), notes: z.string().max(2000).optional(), dealId: z.string().optional(), propertyId: z.string().optional() });
export async function addCrmDocument(contactId: string, formData: FormData) {
  const session = await requireStaff();
  await assertContact(contactId, session.user.id, session.user.role);
  const data = DocumentSchema.parse(Object.fromEntries(formData));
  const item = await prisma.crmDocument.create({ data: { name: data.name, url: data.url, type: data.type, notes: data.notes || null, contactId, dealId: data.dealId || null, propertyId: data.propertyId || null, uploadedById: session.user.id } });
  await recordAudit({ actorId: session.user.id, action: "CRM_DOCUMENT_ADDED", entityType: "CrmDocument", entityId: item.id, summary: `Document CRM : ${item.name}` });
  refresh(contactId);
}

const AssignmentSchema = z.object({ name: z.string().min(3).max(120), priority: z.coerce.number().int().min(1).max(999).default(100), source: z.string().max(80).optional(), cityId: z.string().optional(), propertyTypeId: z.string().optional(), assigneeId: z.string().min(1) });
export async function createCrmAssignmentRule(formData: FormData) {
  const session = await requireAdminOrEditor();
  const data = AssignmentSchema.parse(Object.fromEntries(formData));
  const item = await prisma.crmAssignmentRule.create({ data: { name: data.name, priority: data.priority, source: data.source || null, cityId: data.cityId || null, propertyTypeId: data.propertyTypeId || null, assigneeId: data.assigneeId } });
  await recordAudit({ actorId: session.user.id, action: "CRM_ASSIGNMENT_RULE_CREATED", entityType: "CrmAssignmentRule", entityId: item.id, summary: `Règle d’attribution : ${item.name}` });
  refresh();
}

const AutomationSchema = z.object({ name: z.string().min(3).max(120), trigger: z.string().min(3).max(80), delayHours: z.coerce.number().int().min(0).max(720).default(0), channel: z.nativeEnum(CrmCommunicationChannel), subject: z.string().max(180).optional(), body: z.string().min(2).max(4000) });
export async function createCrmAutomationTemplate(formData: FormData) {
  const session = await requireAdminOrEditor();
  const data = AutomationSchema.parse(Object.fromEntries(formData));
  const item = await prisma.crmAutomationTemplate.create({ data: { ...data, subject: data.subject || null, ownerId: session.user.id } });
  await recordAudit({ actorId: session.user.id, action: "CRM_AUTOMATION_TEMPLATE_CREATED", entityType: "CrmAutomationTemplate", entityId: item.id, summary: `Automatisation CRM : ${item.name}` });
  refresh();
}

const SearchSchema = z.object({ name: z.string().min(3).max(120), listingType: z.enum(["VENTE", "LOCATION"]).optional(), minPrice: z.coerce.number().int().min(0).optional(), maxPrice: z.coerce.number().int().min(0).optional(), bedrooms: z.coerce.number().int().min(0).max(20).optional(), cityId: z.string().optional(), propertyTypeId: z.string().optional(), channel: z.enum(["EMAIL", "WHATSAPP", "IN_APP"]).default("EMAIL") });
export async function createCrmSavedSearch(formData: FormData) {
  const session = await auth(); if (!session?.user?.id) throw new Error("Non autorisé");
  const data = SearchSchema.parse(Object.fromEntries(formData));
  if (data.minPrice && data.maxPrice && data.minPrice > data.maxPrice) throw new Error("La fourchette de prix est invalide");
  await prisma.crmSavedSearch.create({ data: { ...data, listingType: data.listingType || null, minPrice: data.minPrice || null, maxPrice: data.maxPrice || null, bedrooms: data.bedrooms || null, cityId: data.cityId || null, propertyTypeId: data.propertyTypeId || null, userId: session.user.id } });
  revalidatePath("/compte");
}
