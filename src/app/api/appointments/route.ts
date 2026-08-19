import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendEmail, emailLayout } from "@/lib/email";
import { getSiteSettings } from "@/lib/data/settings";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { syncInboundAppointment } from "@/lib/crm";
import { isValidContactEmail } from "@/lib/settings-validation";

const AppointmentSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(180),
  phone: z.string().max(40).optional(),
  date: z.string().optional(),
  notes: z.string().max(3000).optional(),
  propertyId: z.string().optional(),
  agentId: z.string().optional(),
  availabilitySlotId: z.string().optional(),
  source: z.string().max(100).optional(),
  utmSource: z.string().max(160).optional(),
  utmMedium: z.string().max(160).optional(),
  utmCampaign: z.string().max(240).optional(),
  website: z.string().optional(),
  turnstileToken: z.string().optional(),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = rateLimit(`appointments:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Trop de demandes. Merci de réessayer plus tard." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = AppointmentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true }, { status: 201 });

  const verification = await verifyTurnstile({ token: parsed.data.turnstileToken, remoteIp: ip, expectedAction: "appointment" });
  if (!verification.ok) return NextResponse.json({ error: "La vérification de sécurité a échoué. Merci de réessayer." }, { status: 400 });

  const session = await auth();
  const { website, turnstileToken, availabilitySlotId, date: requestedDate, ...data } = parsed.data;
  void website; void turnstileToken;

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      let date: Date;
      let durationMinutes = 45;
      let agentId = data.agentId || null;
      let location: string | null = null;

      if (availabilitySlotId) {
        const slot = await tx.agentAvailability.findUnique({ where: { id: availabilitySlotId }, include: { appointments: { where: { status: { in: ["PENDING", "CONFIRMED"] } }, select: { id: true } } } });
        if (!slot || !slot.active || slot.startsAt <= new Date() || slot.appointments.length >= slot.capacity) throw new Error("Ce créneau n’est plus disponible.");
        if (data.agentId && data.agentId !== slot.agentId) throw new Error("Le créneau ne correspond pas au conseiller sélectionné.");
        date = slot.startsAt;
        durationMinutes = Math.max(15, Math.round((slot.endsAt.getTime() - slot.startsAt.getTime()) / 60000));
        agentId = slot.agentId;
        location = slot.location;
      } else {
        if (!requestedDate) throw new Error("Choisissez une date de visite.");
        date = new Date(requestedDate);
        if (Number.isNaN(date.getTime()) || date <= new Date()) throw new Error("Choisissez une date future.");
      }

      return tx.appointment.create({
        data: { ...data, date, durationMinutes, location, agentId, availabilitySlotId: availabilitySlotId || null, userId: session?.user?.id },
        include: { property: true, agent: true },
      });
    });

    if (!["ADMIN", "EDITOR", "AGENT"].includes(session?.user?.role ?? "")) {
      await prisma.analyticsEvent.create({
        data: {
          type: "appointment",
          path: data.propertyId ? `/proprietes/${data.propertyId}` : "/rendez-vous",
          source: data.source || null,
          medium: data.utmMedium || null,
          campaign: data.utmCampaign || null,
          propertyId: data.propertyId || null,
          meta: { channel: "appointment_form" },
        },
      }).catch((error) => console.error("[appointments] Analytics event failed:", error));
    }

    syncInboundAppointment(appointment).catch((error) => console.error("[appointments] CRM sync failed:", error));
    notifyNewAppointment(appointment).catch((error) => console.error("[appointments] notification failed:", error));
    return NextResponse.json(appointment, { status: 201 });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Impossible d’enregistrer la visite." }, { status: 409 });
  }
}

type AppointmentWithRelations = { name: string; email: string; date: Date; property?: { title: string } | null; agent?: { email: string | null } | null };

async function notifyNewAppointment(appointment: AppointmentWithRelations) {
  const settings = await getSiteSettings();
  const recipientEmail = appointment.agent?.email || settings.contact_email;
  const formattedDate = new Intl.DateTimeFormat("fr-MA", { dateStyle: "long", timeStyle: "short" }).format(appointment.date);
  if (isValidContactEmail(recipientEmail)) {
    await sendEmail({ to: recipientEmail, subject: `Nouvelle demande de visite — ${appointment.property?.title ?? "bien"}`, html: emailLayout("Nouvelle demande de visite", `<p><strong>${appointment.name}</strong> (${appointment.email}) souhaite visiter <strong>${appointment.property?.title ?? "un bien"}</strong> le <strong>${formattedDate}</strong>.</p><p>Connectez-vous à l’admin pour confirmer ce rendez-vous.</p>`) });
  } else {
    console.warn("[appointments] Admin appointment email skipped: no valid agent or fallback recipient.");
  }
  await sendEmail({ to: appointment.email, subject: "Votre demande de visite est bien enregistrée — Domify", html: emailLayout("Demande de visite reçue", `<p>Bonjour ${appointment.name},</p><p>Votre demande de visite pour le <strong>${formattedDate}</strong> a bien été enregistrée. Vous recevrez une confirmation de notre agent très prochainement.</p>`) });
}
