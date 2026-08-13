import { CrmDealStage, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CrmAccess = { userId: string; role: "ADMIN" | "EDITOR" | "AGENT" };

const contactInclude = {
  owner: { select: { id: true, name: true, email: true } },
  deals: {
    include: {
      property: { select: { id: true, title: true, reference: true } },
      owner: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" as const },
  },
  _count: { select: { leads: true, appointments: true, messages: true, activities: true } },
};

function contactScope(access: CrmAccess): Prisma.CrmContactWhereInput {
  return access.role === "AGENT" ? { ownerId: access.userId } : {};
}

function dealScope(access: CrmAccess): Prisma.CrmDealWhereInput {
  return access.role === "AGENT" ? { OR: [{ ownerId: access.userId }, { contact: { ownerId: access.userId } }] } : {};
}

export async function getCrmWorkspace(access: CrmAccess) {
  const scope = contactScope(access);
  const dealWhere = dealScope(access);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [contacts, deals, followUps, activeDeals, wonThisMonth] = await Promise.all([
    prisma.crmContact.findMany({
      where: scope,
      include: contactInclude,
      orderBy: { updatedAt: "desc" },
      take: 80,
    }),
    prisma.crmDeal.findMany({
      where: dealWhere,
      include: {
        contact: { select: { id: true, name: true, email: true, phone: true } },
        property: { select: { id: true, title: true, reference: true } },
        owner: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 150,
    }),
    prisma.crmActivity.findMany({
      where: {
        completedAt: null,
        dueAt: { not: null, lte: nextWeek },
        ...(access.role === "AGENT" ? { OR: [{ contact: { ownerId: access.userId } }, { deal: { ownerId: access.userId } }] } : {}),
      },
      include: {
        contact: { select: { id: true, name: true, phone: true } },
        deal: { select: { id: true, title: true } },
      },
      orderBy: { dueAt: "asc" },
      take: 20,
    }),
    prisma.crmDeal.findMany({
      where: { ...dealWhere, stage: { notIn: [CrmDealStage.WON, CrmDealStage.LOST] } },
      select: { value: true, probability: true },
    }),
    prisma.crmDeal.findMany({
      where: { ...dealWhere, stage: CrmDealStage.WON, wonAt: { gte: monthStart } },
      select: { value: true },
    }),
  ]);

  const forecast = activeDeals.reduce((sum, deal) => sum + Math.round((deal.value || 0) * (deal.probability / 100)), 0);
  const activeValue = activeDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  const wonValue = wonThisMonth.reduce((sum, deal) => sum + (deal.value || 0), 0);

  return {
    contacts,
    deals,
    followUps,
    metrics: {
      activeDeals: activeDeals.length,
      activeValue,
      forecast,
      wonValue,
    },
  };
}

export async function getCrmContactById(id: string, access: CrmAccess) {
  const contact = await prisma.crmContact.findFirst({
    where: { id, ...contactScope(access) },
    include: {
      ...contactInclude,
      leads: { include: { property: { select: { id: true, title: true, reference: true } } }, orderBy: { createdAt: "desc" } },
      appointments: { include: { property: { select: { id: true, title: true } }, agent: { select: { name: true } } }, orderBy: { date: "desc" } },
      messages: { orderBy: { createdAt: "desc" } },
      activities: {
        include: {
          actor: { select: { name: true, email: true } },
          deal: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      },
    },
  });

  return contact;
}

export const CRM_STAGES: Array<{ value: CrmDealStage; label: string; tone: string }> = [
  { value: CrmDealStage.NEW, label: "Nouveaux", tone: "border-sky-200 bg-sky-50" },
  { value: CrmDealStage.QUALIFIED, label: "Qualifiés", tone: "border-violet-200 bg-violet-50" },
  { value: CrmDealStage.VIEWING, label: "Visites", tone: "border-amber-200 bg-amber-50" },
  { value: CrmDealStage.OFFER, label: "Offres", tone: "border-orange-200 bg-orange-50" },
  { value: CrmDealStage.NEGOTIATION, label: "Négociation", tone: "border-fuchsia-200 bg-fuchsia-50" },
  { value: CrmDealStage.WON, label: "Gagnés", tone: "border-emerald-200 bg-emerald-50" },
  { value: CrmDealStage.LOST, label: "Perdus", tone: "border-stone-200 bg-stone-50" },
];
