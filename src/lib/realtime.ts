import Pusher from "pusher";

export const PORTAL_CHANNEL_PREFIX = "private-portal-conversation-";

export function isRealtimeConfigured() {
  return Boolean(process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET && (process.env.PUSHER_CLUSTER || process.env.NEXT_PUBLIC_PUSHER_CLUSTER));
}

export function getPusherServer() {
  if (!isRealtimeConfigured()) return null;
  return new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER || process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    useTLS: true,
  });
}

export async function publishPortalMessage({ conversationId, message }: { conversationId: string; message: { id: string; body: string; createdAt: Date; sender: { id: string; name: string | null; role: string } } }) {
  const pusher = getPusherServer();
  if (!pusher) return { skipped: true as const };
  await pusher.trigger(`${PORTAL_CHANNEL_PREFIX}${conversationId}`, "message:new", {
    conversationId,
    message: { ...message, createdAt: message.createdAt.toISOString() },
  });
  return { skipped: false as const };
}
