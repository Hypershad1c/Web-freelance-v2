import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendEmail, emailLayout } from "@/lib/email";
import { getSiteSettings } from "@/lib/data/settings";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { syncInboundAppointment } from "@/lib/crm";

const AppointmentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  date: z.string(),
  notes: z.string().optional(),
  propertyId: z.string().optional(),
  agentId: z.string().optional(),
  website: z.string().optional(), // honeypot
  turnstileToken: z.string().optional(),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = rateLimit(`appointments:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json({ error: "Trop de demandes. Merci de réessayer plus tard." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = AppointmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  if (parsed.data.website) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const verification = await verifyTurnstile({ token: parsed.data.turnstileToken, remoteIp: ip, expectedAction: "appointment" });
  if (!verification.ok) {
    return NextResponse.json({ error: "La vérification de sécurité a échoué. Merci de réessayer." }, { status: 400 });
  }

  const session = await auth();
  const { date, website, turnstileToken, ...rest } = parsed.data;
  void website;
  void turnstileToken;

  const appointment = await prisma.appointment.create({
    data: {
      ...rest,
      date: new Date(date),
      userId: session?.user?.id,
    },
    include: { property: true, agent: true },
  });

  syncInboundAppointment(appointment).catch((e) => console.error("[appointments] CRM sync failed:", e));
  notifyNewAppointment(appointment).catch((e) => console.error("[appointments] notification failed:", e));

  return NextResponse.json(appointment, { status: 201 });
}

type AppointmentWithRelations = {
  name: string;
  email: string;
  date: Date;
  property?: { title: string } | null;
  agent?: { email: string | null } | null;
};

async function notifyNewAppointment(appointment: AppointmentWithRelations) {
  const settings = await getSiteSettings();
  const recipientEmail = appointment.agent?.email || settings.contact_email;
  const formattedDate = new Intl.DateTimeFormat("fr-MA", { dateStyle: "long", timeStyle: "short" }).format(
    appointment.date
  );

  await sendEmail({
    to: recipientEmail,
    subject: `Nouvelle demande de visite — ${appointment.property?.title ?? "bien"}`,
    html: emailLayout(
      "Nouvelle demande de visite",
      `<p><strong>${appointment.name}</strong> (${appointment.email}) souhaite visiter <strong>${
        appointment.property?.title ?? "un bien"
      }</strong> le <strong>${formattedDate}</strong>.</p><p>Connectez-vous à l'admin pour confirmer ce rendez-vous.</p>`
    ),
  });

  await sendEmail({
    to: appointment.email,
    subject: "Votre demande de visite est bien enregistrée — Domify",
    html: emailLayout(
      "Demande de visite reçue",
      `<p>Bonjour ${appointment.name},</p><p>Votre demande de visite pour le <strong>${formattedDate}</strong> a bien été enregistrée. Vous recevrez une confirmation de notre agent très prochainement.</p>`
    ),
  });
}
