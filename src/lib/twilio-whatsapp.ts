import twilio from "twilio";

function e164(phone: string) {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  return `+${digits}`;
}

function whatsappAddress(phone: string) {
  const value = phone.startsWith("whatsapp:") ? phone.slice("whatsapp:".length) : phone;
  return `whatsapp:${e164(value)}`;
}

export function isTwilioWhatsAppConfigured() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM);
}

export async function sendTwilioWhatsApp({ to, body }: { to: string; body: string }) {
  if (!isTwilioWhatsAppConfigured()) return { skipped: true as const, reason: "Twilio WhatsApp n’est pas configuré" };
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  const baseUrl = (process.env.NEXTAUTH_URL || process.env.AUTH_URL || "").replace(/\/$/, "");
  const message = await client.messages.create({
    from: whatsappAddress(process.env.TWILIO_WHATSAPP_FROM!),
    to: whatsappAddress(to),
    body,
    ...(baseUrl ? { statusCallback: `${baseUrl}/api/webhooks/twilio/status` } : {}),
  });
  return { skipped: false as const, sid: message.sid, status: message.status };
}

export function validateTwilioWebhook({ signature, url, params }: { signature: string | null; url: string; params: Record<string, string> }) {
  if (!process.env.TWILIO_AUTH_TOKEN || !signature) return false;
  return twilio.validateRequest(process.env.TWILIO_AUTH_TOKEN, signature, url, params);
}

export function normalizedPhone(phone: string) { return e164(phone).replace(/\D/g, ""); }
