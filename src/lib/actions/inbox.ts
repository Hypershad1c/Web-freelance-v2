"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notifyUsers, recordAudit } from "@/lib/workflow";
import { crmDealUpdateForStage, crmStageFromLeadStatus } from "@/lib/crm";

async function requireStaff() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "EDITOR" && role !== "AGENT")) {
    throw new Error("Non autorisé");
  }
  return session;
}

async function requireAdminOrEditor() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "EDITOR")) {
    throw new Error("Non autorisé");
  }
  return session;
}

async function getOwnAgentId(userId: string) {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  return agent?.id;
}

const LeadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"] as const;
const LeadStatusSchema = z.enum(LeadStatuses);

export async function updateLeadStatus(id: string, status: string) {
  const session = await requireStaff();
  const parsed = LeadStatusSchema.safeParse(status);
  if (!parsed.success) throw new Error("Statut invalide");

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { property: { include: { agent: { select: { userId: true } } } } },
  });
  if (!lead) throw new Error("Lead introuvable");
  if (session.user.role === "AGENT") {
    const agentId = await getOwnAgentId(session.user.id);
    if (!agentId || lead.property?.agentId !== agentId) throw new Error("Non autorisé");
  }

  const lastLead = await prisma.lead.findFirst({
    where: { status: parsed.data, id: { not: id } },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  await prisma.lead.update({
    where: { id },
    data: { status: parsed.data, position: (lastLead?.position ?? -1) + 1 },
  });

  const crmStage = crmStageFromLeadStatus(parsed.data);
  await prisma.crmDeal.updateMany({
    where: { source: `lead:${id}` },
    data: crmDealUpdateForStage(crmStage.stage),
  });
  if (lead.crmContactId) {
    await prisma.crmActivity.create({
      data: {
        type: "SYSTEM",
        body: `Lead déplacé vers « ${leadStatusLabel(parsed.data)} » dans le pipeline.`,
        contactId: lead.crmContactId,
        actorId: session.user.id,
      },
    });
  }

  const recipients = [lead.userId, lead.property?.agent?.userId].filter((id): id is string => Boolean(id && id !== session.user.id));
  await notifyUsers({
    userIds: recipients,
    type: "LEAD_STATUS",
    title: "Statut de lead mis à jour",
    body: `Le lead de ${lead.name} est maintenant « ${leadStatusLabel(parsed.data)} ».`,
    href: "/admin/leads",
  });
  await recordAudit({
    actorId: session.user.id,
    action: "LEAD_STATUS_UPDATED",
    entityType: "Lead",
    entityId: id,
    summary: `Lead ${lead.name} : ${leadStatusLabel(lead.status)} → ${leadStatusLabel(parsed.data)}`,
  });
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
}

export async function deleteLead(id: string) {
  const session = await requireAdminOrEditor();
  const lead = await prisma.lead.findUnique({ where: { id }, select: { name: true } });
  await prisma.lead.delete({ where: { id } });
  await recordAudit({ actorId: session.user.id, action: "LEAD_DELETED", entityType: "Lead", entityId: id, summary: `Suppression du lead ${lead?.name ?? id}` });
  revalidatePath("/admin/leads");
}

const AppointmentStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] as const;
const AppointmentStatusSchema = z.enum(AppointmentStatuses);

export async function updateAppointmentStatus(id: string, status: string) {
  const session = await requireStaff();
  const parsed = AppointmentStatusSchema.safeParse(status);
  if (!parsed.success) throw new Error("Statut invalide");

  const appointment = await prisma.appointment.findUnique({ where: { id }, include: { property: { select: { title: true } } } });
  if (!appointment) throw new Error("Rendez-vous introuvable");
  if (session.user.role === "AGENT") {
    const agentId = await getOwnAgentId(session.user.id);
    if (!agentId || appointment.agentId !== agentId) throw new Error("Non autorisé");
  }

  await prisma.appointment.update({ where: { id }, data: { status: parsed.data } });
  await recordAudit({ actorId: session.user.id, action: "APPOINTMENT_STATUS_UPDATED", entityType: "Appointment", entityId: id, summary: `Rendez-vous ${appointment.property?.title ?? id} : ${parsed.data}` });
  revalidatePath("/admin/appointments");
  revalidatePath("/admin");
}

export async function deleteAppointment(id: string) {
  const session = await requireAdminOrEditor();
  await prisma.appointment.delete({ where: { id } });
  await recordAudit({ actorId: session.user.id, action: "APPOINTMENT_DELETED", entityType: "Appointment", entityId: id, summary: "Suppression d’un rendez-vous" });
  revalidatePath("/admin/appointments");
}

const AvailabilitySchema = z.object({ agentId: z.string().min(1), startsAt: z.string().min(1), endsAt: z.string().min(1), capacity: z.coerce.number().int().min(1).max(12).default(1), location: z.string().max(240).optional() });
export async function createAgentAvailability(formData: FormData) {
  const session = await requireStaff();
  const data = AvailabilitySchema.parse(Object.fromEntries(formData));
  const ownAgentId = session.user.role === "AGENT" ? await getOwnAgentId(session.user.id) : null;
  if (session.user.role === "AGENT" && ownAgentId !== data.agentId) throw new Error("Vous pouvez uniquement gérer vos disponibilités");
  const startsAt = new Date(data.startsAt); const endsAt = new Date(data.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt || startsAt <= new Date()) throw new Error("Créneau invalide");
  const item = await prisma.agentAvailability.create({ data: { ...data, startsAt, endsAt, location: data.location || null } });
  await recordAudit({ actorId: session.user.id, action: "AGENT_AVAILABILITY_CREATED", entityType: "AgentAvailability", entityId: item.id, summary: `Créneau disponible le ${startsAt.toLocaleString("fr-MA")}` });
  revalidatePath("/admin/appointments"); revalidatePath("/admin/appointments/disponibilites");
}

export async function toggleAgentAvailability(id: string, active: boolean) {
  const session = await requireStaff();
  const item = await prisma.agentAvailability.findUnique({ where: { id } });
  if (!item) throw new Error("Créneau introuvable");
  if (session.user.role === "AGENT" && (await getOwnAgentId(session.user.id)) !== item.agentId) throw new Error("Non autorisé");
  await prisma.agentAvailability.update({ where: { id }, data: { active } });
  await recordAudit({ actorId: session.user.id, action: "AGENT_AVAILABILITY_UPDATED", entityType: "AgentAvailability", entityId: id, summary: active ? "Créneau activé" : "Créneau retiré" });
  revalidatePath("/admin/appointments"); revalidatePath("/admin/appointments/disponibilites");
}

export async function toggleMessageRead(id: string, read: boolean) {
  const session = await requireAdminOrEditor();
  await prisma.message.update({ where: { id }, data: { read } });
  await recordAudit({ actorId: session.user.id, action: read ? "MESSAGE_READ" : "MESSAGE_UNREAD", entityType: "Message", entityId: id, summary: read ? "Message marqué comme lu" : "Message marqué comme non lu" });
  revalidatePath("/admin/messages");
}

export async function deleteMessage(id: string) {
  const session = await requireAdminOrEditor();
  await prisma.message.delete({ where: { id } });
  await recordAudit({ actorId: session.user.id, action: "MESSAGE_DELETED", entityType: "Message", entityId: id, summary: "Suppression d’un message" });
  revalidatePath("/admin/messages");
}

function leadStatusLabel(status: (typeof LeadStatuses)[number]) {
  return {
    NEW: "Nouveau",
    CONTACTED: "Contacté",
    QUALIFIED: "Qualifié",
    CONVERTED: "Converti",
    LOST: "Perdu",
  }[status];
}
