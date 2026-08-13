import { CrmActivityType, CrmDealStage, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CrmInboundContact = {
  name: string;
  email: string;
  phone?: string | null;
  source?: string | null;
  ownerId?: string | null;
};

export async function upsertCrmContact(input: CrmInboundContact) {
  return prisma.crmContact.upsert({
    where: { email: input.email.toLowerCase() },
    create: {
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone || null,
      source: input.source || null,
      ownerId: input.ownerId || null,
    },
    update: {
      name: input.name,
      ...(input.phone ? { phone: input.phone } : {}),
      ...(input.source ? { source: input.source } : {}),
      ...(input.ownerId ? { ownerId: input.ownerId } : {}),
    },
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
  property?: { title: string; agent?: { userId?: string | null } | null } | null;
}) {
  const contact = await upsertCrmContact({
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    source: lead.source || "property_lead",
    ownerId: lead.property?.agent?.userId,
  });

  const deal = await prisma.crmDeal.create({
    data: {
      title: lead.property ? `${lead.property.title} — ${lead.name}` : `Projet immobilier — ${lead.name}`,
      stage: CrmDealStage.NEW,
      source: `lead:${lead.id}`,
      probability: 10,
      contactId: contact.id,
      propertyId: lead.propertyId || undefined,
      ownerId: lead.property?.agent?.userId || undefined,
    },
  });

  await prisma.$transaction([
    prisma.lead.update({ where: { id: lead.id }, data: { crmContactId: contact.id } }),
    prisma.crmActivity.create({
      data: {
        type: CrmActivityType.SYSTEM,
        body: `Lead reçu${lead.message ? ` : ${lead.message}` : ""}`,
        contactId: contact.id,
        dealId: deal.id,
      },
    }),
  ]);

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
  const contact = await upsertCrmContact({
    name: appointment.name,
    email: appointment.email,
    phone: appointment.phone,
    source: "appointment",
    ownerId: appointment.agent?.userId,
  });

  await prisma.$transaction([
    prisma.appointment.update({ where: { id: appointment.id }, data: { crmContactId: contact.id } }),
    prisma.crmActivity.create({
      data: {
        type: CrmActivityType.MEETING,
        body: `Visite demandée le ${new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(appointment.date)}${appointment.notes ? ` : ${appointment.notes}` : ""}`,
        contactId: contact.id,
      },
    }),
  ]);

  return contact;
}

export async function syncInboundMessage(message: {
  id: string;
  name: string;
  email: string;
  subject?: string | null;
  body: string;
}) {
  const contact = await upsertCrmContact({ name: message.name, email: message.email, source: "message" });

  await prisma.$transaction([
    prisma.message.update({ where: { id: message.id }, data: { crmContactId: contact.id } }),
    prisma.crmActivity.create({
      data: {
        type: CrmActivityType.SYSTEM,
        body: `Message reçu${message.subject ? ` — ${message.subject}` : ""} : ${message.body}`,
        contactId: contact.id,
      },
    }),
  ]);

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
  const probability: Record<CrmDealStage, number> = {
    NEW: 10,
    QUALIFIED: 30,
    VIEWING: 55,
    OFFER: 70,
    NEGOTIATION: 85,
    WON: 100,
    LOST: 0,
  };
  return {
    stage,
    probability: probability[stage],
    wonAt: stage === CrmDealStage.WON ? new Date() : null,
  };
}
