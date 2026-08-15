import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUsers, recordAudit } from "@/lib/workflow";
import { sendPortalMessageNotificationEmail } from "@/lib/email";
import { sendTwilioWhatsApp } from "@/lib/twilio-whatsapp";
import { publishPortalMessage } from "@/lib/realtime";

const MessageSchema = z.object({
  body: z.string().trim().min(1, "Le message ne peut pas être vide.").max(4000, "Le message est trop long."),
});

async function getConversationForUser(id: string, userId: string, role: string) {
  const conversation = await prisma.portalConversation.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, title: true, reference: true, submittedById: true, agent: { select: { id: true, name: true, userId: true, email: true, phone: true } } } },
      owner: { select: { id: true, name: true, email: true, phone: true } },
      assignedAgent: { select: { id: true, name: true, email: true, phone: true } },
      messages: {
        include: { sender: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
        take: 200,
      },
    },
  });
  if (!conversation) return null;

  const isOwner = conversation.ownerId === userId;
  const isAssignedAgent = conversation.assignedAgentId === userId || conversation.property.agent?.userId === userId;
  const isStaff = role === "ADMIN" || role === "EDITOR";
  if (!isOwner && !isAssignedAgent && !isStaff) return null;
  return conversation;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const { id } = await params;
  const conversation = await getConversationForUser(id, session.user.id, session.user.role);
  if (!conversation) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  return NextResponse.json({ conversation });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const { id } = await params;
  const conversation = await getConversationForUser(id, session.user.id, session.user.role);
  if (!conversation) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  if (conversation.status === "CLOSED") return NextResponse.json({ error: "Cette conversation est fermée." }, { status: 409 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }
  const parsed = MessageSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.portalMessage.create({
      data: { conversationId: conversation.id, senderId: session.user.id, body: parsed.data.body },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });
    await tx.portalConversation.update({ where: { id: conversation.id }, data: { lastMessageAt: created.createdAt } });
    return created;
  });

  void publishPortalMessage({ conversationId: conversation.id, message }).catch((error) => console.error("[portal-messaging] Realtime publish failed", error));

  const recipients = [...new Set([conversation.ownerId, conversation.assignedAgentId, conversation.property.agent?.userId])]
    .filter((value): value is string => Boolean(value && value !== session.user.id));
  await notifyUsers({
    userIds: recipients,
    type: "MESSAGE",
    title: "Nouveau message immobilier",
    body: `${conversation.property.title} — ${session.user.name || "Nouveau message"}`,
    href: session.user.role === "USER" ? "/espace-vendeur" : "/admin/messagerie",
  });

  const recipientProfiles = [conversation.owner, conversation.assignedAgent, conversation.property.agent]
    .filter((recipient): recipient is { id: string; name: string | null; email: string; phone: string | null } => Boolean(recipient && recipient.id !== session.user.id));
  await Promise.all(recipientProfiles.map(async (recipient) => {
    const recipientPath = recipient.id === conversation.owner.id ? "/espace-vendeur" : "/admin/messagerie";
    const deliveries: Promise<unknown>[] = [
      sendPortalMessageNotificationEmail({
        to: recipient.email,
        recipientName: recipient.name,
        propertyTitle: conversation.property.title,
        propertyReference: conversation.property.reference,
        senderName: session.user.name || "Un membre de votre équipe Domify",
        portalPath: recipientPath,
      }),
    ];
    if (recipient.phone) {
      deliveries.push(sendTwilioWhatsApp({
        to: recipient.phone,
        body: `Domify — Nouveau message de ${session.user.name || "votre interlocuteur"} concernant ${conversation.property.title} (${conversation.property.reference}). Consultez votre espace : ${(process.env.NEXTAUTH_URL || "https://domify.ma").replace(/\/$/, "")}${recipientPath}`,
      }));
    }
    const results = await Promise.allSettled(deliveries);
    results.filter((result): result is PromiseRejectedResult => result.status === "rejected").forEach((result) => console.error("[portal-messaging] External notification failed", result.reason));
  }));
  await recordAudit({
    actorId: session.user.id,
    action: "PORTAL_MESSAGE_SENT",
    entityType: "PortalConversation",
    entityId: conversation.id,
    summary: `Message envoyé pour « ${conversation.property.title} »`,
  });

  return NextResponse.json({ message }, { status: 201 });
}

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const { id } = await params;
  const conversation = await getConversationForUser(id, session.user.id, session.user.role);
  if (!conversation) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });

  await prisma.portalMessage.updateMany({
    where: { conversationId: id, senderId: { not: session.user.id }, readAt: null },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
