import { CrmActivityType, CrmCommunicationChannel, CrmCommunicationStatus, CrmDealStage, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CrmInboundContact = {
  name: string;
  email: string;
  phone?: string | null;
  source?: string | null;
  ownerId?: string | null;
  cityId?: string | null;
  propertyTypeId?: string | null;
};

export async function resolveCrmAssignee(input: Pick<CrmInboundContact, "source" | "cityId" | "propertyTypeId" | "ownerId">) {
  if (input.ownerId) return input.ownerId;
  const rules = await prisma.crmAssignmentRule.findMany({ where: { active: true }, orderBy: { priority: "asc" } });
  const match = rules.find((rule) =>
    (!rule.source || rule.source === input.source) &&
    (!rule.cityId || rule.cityId === input.cityId) &&
    (!rule.propertyTypeId || rule.propertyTypeId === input.propertyTypeId)
  );
  return match?.assigneeId || null;
}

export async function upsertCrmContact(input: CrmInboundContact) {
  const ownerId = await resolveCrmAssignee(input);
  const contact = await prisma.crmContact.upsert({
    where: { email: input.email.toLowerCase() },
    create: {
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone || null,
      source: input.source || null,
      ownerId,
      slaDueAt: new Date(Date.now() + 60 * 60 * 1000),
    },
    update: {
      name: input.name,
      ...(input.phone ? { phone: input.phone } : {}),
      ...(input.source ? { source: input.source } : {}),
      ...(ownerId ? { ownerId } : {}),
    },
  });
  await recomputeCrmLeadScore(contact.id);
  return contact;
}

export async function recomputeCrmLeadScore(contactId: string) {
  const contact = await prisma.crmContact.findUnique({
    where: { id: contactId },
    include: { _count: { select: { leads: true, appointments: true, messages: true, activities: true } } },
  });
  if (!contact) return null;
  const score = Math.min(100,
    20
    + (contact.phone ? 15 : 0)
    + (contact.budgetMax ? 15 : 0)
    + (contact.preferredLocation ? 10 : 0)
    + Math.min(15, contact._count.leads * 5)
    + Math.min(20, contact._count.appointments * 10)
    + Math.min(5, contact._count.messages * 2)
  );
  const reason = `${contact.phone ? "Téléphone" : "Profil"} · ${contact._count.leads} lead(s) · ${contact._count.appointments} visite(s) · ${contact._count.messages} message(s)`;
  await prisma.crmContact.update({ where: { id: contactId }, data: { leadScore: score, scoreReason: reason } });
  return score;
}

export async function queueCrmAutomations(contactId: string, trigger: string, dealId?: string) {
  const contact = await prisma.crmContact.findUnique({ where: { id: contactId } });
  if (!contact) return;
  const templates = await prisma.crmAutomationTemplate.findMany({ where: { active: true, trigger } });
  const deliverable = templates.filter((template) =>
    (template.channel === CrmCommunicationChannel.EMAIL && contact.emailOptIn) ||
    (template.channel === CrmCommunicationChannel.WHATSAPP && contact.whatsappOptIn) ||
    template.channel === CrmCommunicationChannel.IN_APP
  );
  if (!deliverable.length) return;
  await prisma.crmCommunication.createMany({
    data: deliverable.map((template) => ({
      channel: template.channel,
      direction: "OUTBOUND",
      status: CrmCommunicationStatus.QUEUED,
      subject: template.subject,
      body: template.body.replaceAll("{{contact_name}}", contact.name),
      contactId,
      dealId,
      ownerId: contact.ownerId,
    })),
  });
}

export async function syncInboundLead(lead: {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  source?: string | null;
  propertyId?: string | null;
  property?: { title: string; cityId?: string | null; propertyTypeId?: string | null; agent?: { userId?: string | null } | null } | null;
}) {
  const contact = await upsertCrmContact({
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    source: lead.source || "property_lead",
    ownerId: lead.property?.agent?.userId,
    cityId: lead.property?.cityId,
    propertyTypeId: lead.property?.propertyTypeId,
  });
  const deal = await prisma.crmDeal.create({
    data: {
      title: lead.property ? `${lead.property.title} — ${lead.name}` : `Projet immobilier — ${lead.name}`,
      stage: CrmDealStage.NEW,
      source: `lead:${lead.id}`,
      probability: 10,
      contactId: contact.id,
      propertyId: lead.propertyId || undefined,
      ownerId: contact.ownerId || undefined,
    },
  });
  await prisma.$transaction([
    prisma.lead.update({ where: { id: lead.id }, data: { crmContactId: contact.id } }),
    prisma.crmActivity.create({ data: { type: CrmActivityType.SYSTEM, body: `Lead reçu${lead.message ? ` : ${lead.message}` : ""}`, contactId: contact.id, dealId: deal.id } }),
  ]);
  await queueCrmAutomations(contact.id, "lead_created", deal.id);
  await recomputeCrmLeadScore(contact.id);
  return { contact, deal };
}

export async function syncInboundAppointment(appointment: {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  date: Date;
  notes?: string | null;
  agent?: { userId?: string | null } | null;
}) {
  const contact = await upsertCrmContact({ name: appointment.name, email: appointment.email, phone: appointment.phone, source: "appointment", ownerId: appointment.agent?.userId });
  await prisma.$transaction([
    prisma.appointment.update({ where: { id: appointment.id }, data: { crmContactId: contact.id } }),
    prisma.crmActivity.create({ data: { type: CrmActivityType.MEETING, body: `Visite demandée le ${new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(appointment.date)}${appointment.notes ? ` : ${appointment.notes}` : ""}`, contactId: contact.id } }),
  ]);
  await queueCrmAutomations(contact.id, "appointment_created");
  await recomputeCrmLeadScore(contact.id);
  return contact;
}

export async function syncInboundMessage(message: { id: string; name: string; email: string; subject?: string | null; body: string }) {
  const contact = await upsertCrmContact({ name: message.name, email: message.email, source: "message" });
  await prisma.$transaction([
    prisma.message.update({ where: { id: message.id }, data: { crmContactId: contact.id } }),
    prisma.crmActivity.create({ data: { type: CrmActivityType.SYSTEM, body: `Message reçu${message.subject ? ` — ${message.subject}` : ""} : ${message.body}`, contactId: contact.id } }),
  ]);
  await queueCrmAutomations(contact.id, "message_created");
  await recomputeCrmLeadScore(contact.id);
  return contact;
}

export function crmStageFromLeadStatus(status: "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST") {
  const map: Record<typeof status, { stage: CrmDealStage; probability: number }> = {
    NEW: { stage: CrmDealStage.NEW, probability: 10 },
    CONTACTED: { stage: CrmDealStage.QUALIFIED, probability: 30 },
    QUALIFIED: { stage: CrmDealStage.VIEWING, probability: 55 },
    CONVERTED: { stage: CrmDealStage.WON, probability: 100 },
    LOST: { stage: CrmDealStage.LOST, probability: 0 },
  };
  return map[status];
}

export function crmDealUpdateForStage(stage: CrmDealStage): Prisma.CrmDealUpdateManyMutationInput {
  const probability: Record<CrmDealStage, number> = { NEW: 10, QUALIFIED: 30, VIEWING: 55, OFFER: 70, NEGOTIATION: 85, WON: 100, LOST: 0 };
  return { stage, probability: probability[stage], wonAt: stage === CrmDealStage.WON ? new Date() : null };
}
