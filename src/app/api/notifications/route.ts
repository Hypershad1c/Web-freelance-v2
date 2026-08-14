import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ notifications: [], unread: 0 });
  const notifications = await prisma.notification.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 12 });
  const unread = await prisma.notification.count({ where: { userId: session.user.id, readAt: null } });
  return NextResponse.json({ notifications, unread });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { id?: string; all?: boolean } | null;
  if (body?.all) {
    await prisma.notification.updateMany({ where: { userId: session.user.id, readAt: null }, data: { readAt: new Date() } });
  } else if (body?.id) {
    await prisma.notification.updateMany({ where: { id: body.id, userId: session.user.id }, data: { readAt: new Date() } });
  } else {
    return NextResponse.json({ error: "Notification requise." }, { status: 400 });
  }
  return NextResponse.json({ updated: true });
}
