import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ConversationSchema = z.object({
  propertyId: z.string().min(1),
  subject: z.string().trim().max(160).optional(),
});

const STAFF_ROLES = ["ADMIN", "EDITOR", "AGENT"] as const;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });

  const role = session.user.role;
  const where = role === "USER"
    ? { ownerId: session.user.id }
    : role === "AGENT"
      ? {
          OR: [
            { assignedAgentId: session.user.id },
            { property: { agent: { userId: session.user.id } } },
          ],
        }
      : STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])
        ? {}
        : { id: "__none__" };

  const conversations = await prisma.portalConversation.findMany({
    where,
    include: {
      property: { select: { id: true, title: true, reference: true, agent: { select: { name: true, userId: true } } } },
      owner: { select: { id: true, name: true, email: true } },
      assignedAgent: { select: { id: true, name: true, email: true } },
      messages: {
        where: { senderId: { not: session.user.id }, readAt: null },
        select: { id: true },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  return NextResponse.json({
    conversations: conversations.map(({ messages, ...conversation }) => ({ ...conversation, unreadCount: messages.length })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "USER") return NextResponse.json({ error: "Seul le propriétaire peut ouvrir une conversation." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }
  const parsed = ConversationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const property = await prisma.property.findFirst({
    where: { id: parsed.data.propertyId, submittedById: session.user.id },
    select: { id: true, title: true, agent: { select: { userId: true } } },
  });
  if (!property) return NextResponse.json({ error: "Bien introuvable ou non autorisé." }, { status: 404 });

  const conversation = await prisma.portalConversation.upsert({
    where: { propertyId_ownerId: { propertyId: property.id, ownerId: session.user.id } },
    create: { propertyId: property.id, ownerId: session.user.id, assignedAgentId: property.agent?.userId ?? null, subject: parsed.data.subject || null },
    update: { subject: parsed.data.subject || undefined, assignedAgentId: property.agent?.userId ?? undefined },
    include: { property: { select: { id: true, title: true, reference: true } } },
  });

  return NextResponse.json({ conversation }, { status: 201 });
}
