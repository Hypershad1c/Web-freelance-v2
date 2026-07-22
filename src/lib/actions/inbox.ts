"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Admin & Editor manage everything. Agents may only update status on leads/
// appointments tied to their own listings — never delete, never touch others'.
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

// ---------- Leads ----------

const LeadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"] as const;
const LeadStatusSchema = z.enum(LeadStatuses);

export async function updateLeadStatus(id: string, status: string) {
  const session = await requireStaff();
  const parsed = LeadStatusSchema.safeParse(status);
  if (!parsed.success) throw new Error("Statut invalide");

  if (session.user.role === "AGENT") {
    const agentId = await getOwnAgentId(session.user.id);
    const lead = await prisma.lead.findUnique({ where: { id }, include: { property: true } });
    if (!agentId || lead?.property?.agentId !== agentId) throw new Error("Non autorisé");
  }

  await prisma.lead.update({ where: { id }, data: { status: parsed.data } });
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
}

export async function deleteLead(id: string) {
  await requireAdminOrEditor();
  await prisma.lead.delete({ where: { id } });
  revalidatePath("/admin/leads");
}

// ---------- Appointments ----------

const AppointmentStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] as const;
const AppointmentStatusSchema = z.enum(AppointmentStatuses);

export async function updateAppointmentStatus(id: string, status: string) {
  const session = await requireStaff();
  const parsed = AppointmentStatusSchema.safeParse(status);
  if (!parsed.success) throw new Error("Statut invalide");

  if (session.user.role === "AGENT") {
    const agentId = await getOwnAgentId(session.user.id);
    const appt = await prisma.appointment.findUnique({ where: { id } });
    if (!agentId || appt?.agentId !== agentId) throw new Error("Non autorisé");
  }

  await prisma.appointment.update({ where: { id }, data: { status: parsed.data } });
  revalidatePath("/admin/appointments");
  revalidatePath("/admin");
}

export async function deleteAppointment(id: string) {
  await requireAdminOrEditor();
  await prisma.appointment.delete({ where: { id } });
  revalidatePath("/admin/appointments");
}

// ---------- Messages (Admin/Editor only — not tied to any agent) ----------

export async function toggleMessageRead(id: string, read: boolean) {
  await requireAdminOrEditor();
  await prisma.message.update({ where: { id }, data: { read } });
  revalidatePath("/admin/messages");
}

export async function deleteMessage(id: string) {
  await requireAdminOrEditor();
  await prisma.message.delete({ where: { id } });
  revalidatePath("/admin/messages");
}
