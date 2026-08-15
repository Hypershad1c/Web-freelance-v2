import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPusherServer, PORTAL_CHANNEL_PREFIX } from "@/lib/realtime";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const pusher = getPusherServer();
  if (!pusher) return NextResponse.json({ error: "Le temps réel n’est pas configuré." }, { status: 503 });

  const contentType = request.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.text()).split("&").map((part) => part.split("=").map(decodeURIComponent)));
  const socketId = typeof payload.socket_id === "string" ? payload.socket_id : "";
  const channelName = typeof payload.channel_name === "string" ? payload.channel_name : "";
  if (!socketId || !channelName.startsWith(PORTAL_CHANNEL_PREFIX)) return NextResponse.json({ error: "Canal invalide" }, { status: 400 });

  const conversationId = channelName.slice(PORTAL_CHANNEL_PREFIX.length);
  const conversation = await prisma.portalConversation.findUnique({
    where: { id: conversationId },
    select: {
      ownerId: true,
      assignedAgentId: true,
      property: { select: { agent: { select: { userId: true } } } },
    },
  });
  if (!conversation) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });

  const role = session.user.role || "USER";
  const isStaff = role === "ADMIN" || role === "EDITOR";
  const isParticipant = conversation.ownerId === session.user.id || conversation.assignedAgentId === session.user.id || conversation.property.agent?.userId === session.user.id;
  if (!isStaff && !isParticipant) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  return NextResponse.json(pusher.authorizeChannel(socketId, channelName));
}
