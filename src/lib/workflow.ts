import { prisma } from "@/lib/prisma";

export async function recordAudit({
  actorId,
  action,
  entityType,
  entityId,
  summary,
}: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: actorId ?? null,
      action,
      entityType,
      entityId,
      summary,
    },
  });
}

export async function notifyUsers({
  userIds,
  type,
  title,
  body,
  href,
}: {
  userIds: string[];
  type: "APPROVAL_REQUEST" | "APPROVAL_DECISION" | "LEAD_STATUS" | "MESSAGE" | "SYSTEM";
  title: string;
  body?: string;
  href?: string;
}) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return;

  await prisma.notification.createMany({
    data: uniqueIds.map((userId) => ({ userId, type, title, body, href })),
  });
}

export async function notifyAdministrators({
  type,
  title,
  body,
  href,
}: Omit<Parameters<typeof notifyUsers>[0], "userIds">) {
  const administrators = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  await notifyUsers({ userIds: administrators.map((administrator) => administrator.id), type, title, body, href });
}

export async function notifyReviewers({
  type,
  title,
  body,
  href,
}: Omit<Parameters<typeof notifyUsers>[0], "userIds">) {
  const reviewers = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "EDITOR", "AGENT"] } },
    select: { id: true },
  });
  await notifyUsers({ userIds: reviewers.map((reviewer) => reviewer.id), type, title, body, href });
}
