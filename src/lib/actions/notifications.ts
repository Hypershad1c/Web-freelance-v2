"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireNotificationUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non autorisé");
  return session.user.id;
}

export async function markNotificationRead(id: string) {
  const userId = await requireNotificationUser();
  await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/admin", "layout");
}

export async function markAllNotificationsRead() {
  const userId = await requireNotificationUser();
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/admin", "layout");
}
