"use server";

import { CrmCommunicationChannel, CrmCommunicationDirection, CrmCommunicationStatus, CrmDocumentStatus, CrmDocumentType, CrmDocumentVisibility, CrmOfferStatus, CrmSellerCaseStage } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { recomputeCrmLeadScore } from "@/lib/crm";
import { sendLuminSignatureRequest } from "@/lib/lumin-sign";
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
function refresh(contactId?: string) { revalidatePath("/admin/crm"); revalidatePath("/admin/crm/operations"); revalidatePath("/compte"); revalidatePath("/espace-vendeur"); if (contactId) revalidatePath(`/admin/crm/contacts/${contactId}`); }

const CommunicationSchema = z.object({ channel: z.nativeEnum(CrmCommunicationChannel), direction: z.nativeEnum(CrmCommunicationDirection), subject: z.string().max(180).optional(), body: z.string().min(2).max(4000), dealId: z.string().optional() });
export async function logCrmCommunication(contactId: string, formData: FormData) {
  const session = await requireStaff();
  await assertContact(contactId, session.user.id, session.user.role);
  const data = CommunicationSchema.parse(Object.fromEntries(formData));
  if (data.dealId) { const deal = await prisma.crmDeal.findFirst({ where: { id: data.dealId, contactId } }); if (!deal) throw new Error("Opportunité invalide"); }
  const queuedForTwilio = data.channel === "WHATSAPP" && data.direction === "OUTBOUND";
  const item = await prisma.crmCommunication.create({ data: { channel: data.channel, direction: data.direction, status: queuedForTwilio ? CrmCommunicationStatus.QUEUED : CrmCommunicationStatus.LOGGED, subject: data.subject || null, body: data.body, sentAt: queuedForTwilio ? null : data.direction === "OUTBOUND" ? new Date() : null, contactId, dealId: data.dealId || null, ownerId: session.user.id } });
  await prisma.crmContact.update({ where: { id: contactId }, data: { lastContactedAt: new Date(), ...(data.direction === "OUTBOUND" ? { firstRespondedAt: new Date() } : {}) } });
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

const OfferSchema = z.object({ amount: z.coerce.number().int().positive(), dealId: z.string().min(1), propertyId: z.string().min(1), sellerCaseId: z.string().optional(), expiresAt: z.string().optional(), message: z.string().max(4000).optional(), conditions: z.string().max(4000).optional() });
export async function createCrmOffer(contactId: string, formData: FormData) {
  const session = await requireStaff();
  await assertContact(contactId, session.user.id, session.user.role);
  const data = OfferSchema.parse(Object.fromEntries(formData));
  const [deal, property] = await Promise.all([
    prisma.crmDeal.findFirst({ where: { id: data.dealId, contactId } }),
    prisma.property.findFirst({ where: { id: data.propertyId, ...(session.user.role === "AGENT" ? { agent: { userId: session.user.id } } : {}) } }),
  ]);
  if (!deal || !property || (deal.propertyId && deal.propertyId !== property.id)) throw new Error("Bien ou opportunité invalide");
  if (data.sellerCaseId) {
    const sellerCase = await prisma.crmSellerCase.findFirst({
      where: {
        id: data.sellerCaseId,
        ...(session.user.role === "AGENT" ? { OR: [{ ownerId: session.user.id }, { property: { agent: { userId: session.user.id } } }] } : {}),
      },
    });
    if (!sellerCase) throw new Error("Dossier vendeur invalide");
  }
  const item = await prisma.crmOffer.create({ data: { amount: data.amount, dealId: deal.id, propertyId: property.id, sellerCaseId: data.sellerCaseId || null, contactId, expiresAt: data.expiresAt ? new Date(data.expiresAt) : null, message: data.message || null, conditions: data.conditions || null, ownerId: session.user.id } });
  await prisma.$transaction([
    prisma.crmDeal.update({ where: { id: deal.id }, data: { stage: "OFFER", probability: Math.max(deal.probability, 60) } }),
    ...(data.sellerCaseId ? [prisma.crmSellerCase.update({ where: { id: data.sellerCaseId }, data: { stage: "OFFER_RECEIVED" } })] : []),
    prisma.crmActivity.create({ data: { type: "SYSTEM", body: `Offre reçue : ${new Intl.NumberFormat("fr-MA").format(data.amount)} MAD`, contactId, dealId: deal.id, actorId: session.user.id } }),
  ]);
  await recordAudit({ actorId: session.user.id, action: "CRM_OFFER_CREATED", entityType: "CrmOffer", entityId: item.id, summary: `Offre de ${new Intl.NumberFormat("fr-MA").format(data.amount)} MAD` });
  refresh(contactId);
}

export async function updateCrmOfferStatus(offerId: string, status: string) {
  const session = await requireStaff();
  const parsed = z.nativeEnum(CrmOfferStatus).safeParse(status); if (!parsed.success) throw new Error("Statut d’offre invalide");
  const item = await prisma.crmOffer.findUnique({ where: { id: offerId }, include: { contact: true, deal: true } });
  if (!item || (session.user.role === "AGENT" && item.contact.ownerId !== session.user.id && item.ownerId !== session.user.id)) throw new Error("Non autorisé");
  const isNegotiating = parsed.data === "COUNTERED" || parsed.data === "ACCEPTED";
  await prisma.$transaction([
    prisma.crmOffer.update({ where: { id: offerId }, data: { status: parsed.data, respondedAt: parsed.data === "SUBMITTED" ? null : new Date() } }),
    ...(isNegotiating ? [prisma.crmDeal.update({ where: { id: item.dealId }, data: { stage: "NEGOTIATION", probability: parsed.data === "ACCEPTED" ? 85 : 70 } })] : []),
    ...(item.sellerCaseId && isNegotiating ? [prisma.crmSellerCase.update({ where: { id: item.sellerCaseId }, data: { stage: "NEGOTIATION" } })] : []),
    prisma.crmActivity.create({ data: { type: "SYSTEM", body: `Offre mise à jour : ${parsed.data}`, contactId: item.contactId, dealId: item.dealId, actorId: session.user.id } }),
  ]);
  await recordAudit({ actorId: session.user.id, action: "CRM_OFFER_STATUS_UPDATED", entityType: "CrmOffer", entityId: offerId, summary: `Offre → ${parsed.data}` });
  refresh(item.contactId);
}

const DocumentSchema = z.object({ name: z.string().min(2).max(180), url: z.string().url().optional(), type: z.nativeEnum(CrmDocumentType), visibility: z.nativeEnum(CrmDocumentVisibility).default(CrmDocumentVisibility.INTERNAL), status: z.nativeEnum(CrmDocumentStatus).default(CrmDocumentStatus.UPLOADED), notes: z.string().max(2000).optional(), dealId: z.string().optional(), propertyId: z.string().optional() });
export async function addCrmDocument(contactId: string, formData: FormData) {
  const session = await requireStaff();
  await assertContact(contactId, session.user.id, session.user.role);
  const data = DocumentSchema.parse(Object.fromEntries(formData));
  if (data.status !== CrmDocumentStatus.REQUESTED && !data.url) throw new Error("Une URL sécurisée est requise pour un document téléversé");
  const item = await prisma.crmDocument.create({ data: { name: data.name, url: data.url || "https://domify.ma/document-request", type: data.type, visibility: data.visibility, status: data.status, requestedAt: data.status === CrmDocumentStatus.REQUESTED ? new Date() : null, notes: data.notes || null, contactId, dealId: data.dealId || null, propertyId: data.propertyId || null, uploadedById: session.user.id } });
  await recordAudit({ actorId: session.user.id, action: "CRM_DOCUMENT_ADDED", entityType: "CrmDocument", entityId: item.id, summary: `Document CRM : ${item.name}` });
  refresh(contactId);
}

const SignatureSchema = z.object({ title: z.string().min(3).max(255), documentId: z.string().min(1), sellerCaseId: z.string().optional(), offerId: z.string().optional(), expiresAt: z.string().optional() });
export async function sendCrmSignatureRequest(contactId: string, formData: FormData) {
  const session = await requireStaff();
  await assertContact(contactId, session.user.id, session.user.role);
  const data = SignatureSchema.parse(Object.fromEntries(formData));
  const [contact, document] = await Promise.all([prisma.crmContact.findUnique({ where: { id: contactId }, select: { name: true, email: true } }), prisma.crmDocument.findFirst({ where: { id: data.documentId, contactId }, select: { id: true, url: true } })]);
  if (!contact || !document || document.url === "https://domify.ma/document-request") throw new Error("Ajoutez d’abord un document HTTPS téléversé pour l’envoyer en signature.");
  if (data.sellerCaseId) { const sellerCase = await prisma.crmSellerCase.findFirst({ where: { id: data.sellerCaseId, contactId } }); if (!sellerCase) throw new Error("Dossier vendeur invalide"); }
  if (data.offerId) { const offer = await prisma.crmOffer.findFirst({ where: { id: data.offerId, contactId } }); if (!offer) throw new Error("Offre invalide"); }
  const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  if (expiresAt && (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date())) throw new Error("Date d’expiration invalide");
  const item = await prisma.crmSignatureRequest.create({ data: { title: data.title, provider: "LUMIN", status: "DRAFT", contactId, sellerCaseId: data.sellerCaseId || null, offerId: data.offerId || null, documentId: document.id, expiresAt } });
  try {
    const result = await sendLuminSignatureRequest({ title: data.title, fileUrl: document.url, signers: [{ name: contact.name, email: contact.email }], expiresAt });
    if (result.skipped) await prisma.crmSignatureRequest.update({ where: { id: item.id }, data: { status: "READY", error: result.reason } });
    else await prisma.crmSignatureRequest.update({ where: { id: item.id }, data: { status: "SENT", externalId: result.id, sentAt: new Date(), error: null } });
  } catch (cause) {
    await prisma.crmSignatureRequest.update({ where: { id: item.id }, data: { status: "FAILED", error: cause instanceof Error ? cause.message : "Échec Lumin Sign" } });
    throw cause;
  }
  await recordAudit({ actorId: session.user.id, action: "CRM_SIGNATURE_REQUEST_CREATED", entityType: "CrmSignatureRequest", entityId: item.id, summary: `Demande de signature : ${data.title}` });
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

export async function toggleCrmSavedSearch(searchId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non autorisé");
  const search = await prisma.crmSavedSearch.findFirst({ where: { id: searchId, userId: session.user.id }, select: { id: true, active: true, name: true } });
  if (!search) throw new Error("Recherche enregistrée introuvable");
  await prisma.crmSavedSearch.update({ where: { id: search.id }, data: { active: !search.active } });
  await recordAudit({ actorId: session.user.id, action: "SAVED_SEARCH_TOGGLED", entityType: "CrmSavedSearch", entityId: search.id, summary: `${search.name} → ${search.active ? "pause" : "active"}` });
  revalidatePath("/compte");
}

export async function deleteCrmSavedSearch(searchId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non autorisé");
  const search = await prisma.crmSavedSearch.findFirst({ where: { id: searchId, userId: session.user.id }, select: { id: true, name: true } });
  if (!search) throw new Error("Recherche enregistrée introuvable");
  await prisma.crmSavedSearch.delete({ where: { id: search.id } });
  await recordAudit({ actorId: session.user.id, action: "SAVED_SEARCH_DELETED", entityType: "CrmSavedSearch", entityId: search.id, summary: search.name });
  revalidatePath("/compte");
}
