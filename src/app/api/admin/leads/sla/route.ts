import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { emailLayout, sendEmail } from "@/lib/email";
import { getSiteSettings } from "@/lib/data/settings";
import { prisma } from "@/lib/prisma";

async function authorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") === `Bearer ${cronSecret}`) return true;
  const session = await auth();
  return session?.user?.role === "ADMIN" || session?.user?.role === "EDITOR";
}

export async function GET(request: Request) {
  if (!(await authorized(request))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const periodKey = now.toISOString().slice(0, 10);
  const [staleLeads, criticalLeads, admins, settings] = await Promise.all([
    prisma.lead.findMany({ where: { status: "NEW", createdAt: { lt: oneHourAgo } }, select: { id: true, name: true, createdAt: true, property: { select: { title: true, reference: true } } }, orderBy: { createdAt: "asc" }, take: 50 }),
    prisma.lead.count({ where: { status: "NEW", createdAt: { lt: oneDayAgo } } }),
    prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } }),
    getSiteSettings(),
  ]);

  const title = `SLA leads Domify — ${periodKey}`;
  let notificationsCreated = 0;
  for (const admin of admins) {
    const existing = await prisma.notification.findFirst({ where: { userId: admin.id, type: "SYSTEM", title } });
    if (!existing) {
      await prisma.notification.create({ data: { userId: admin.id, type: "SYSTEM", title, body: staleLeads.length ? `${staleLeads.length} lead(s) attendent une réponse depuis plus d’une heure.` : "Aucun lead ne dépasse le délai de réponse d’une heure.", href: "/admin/leads", meta: { staleCount: staleLeads.length, criticalCount: criticalLeads, periodKey } } });
      notificationsCreated += 1;
    }
  }

  let emailSent = false;
  if (settings.contact_email && staleLeads.length > 0) {
    const preview = staleLeads.slice(0, 8).map((lead) => `<li><strong>${lead.name}</strong>${lead.property ? ` — ${lead.property.title} (${lead.property.reference})` : ""} — ${new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(lead.createdAt)}</li>`).join("");
    const result = await sendEmail({ to: settings.contact_email, subject: `Action requise — ${staleLeads.length} lead(s) Domify en attente`, html: emailLayout("Alerte SLA des leads", `<p>${staleLeads.length} lead(s) nouveau(x) attendent une réponse depuis plus d’une heure.</p><ul>${preview}</ul>${criticalLeads ? `<p style="background:#FFF4E5;padding:12px 16px;border-radius:8px;"><strong>Priorité :</strong> ${criticalLeads} lead(s) dépassent 24 heures.</p>` : ""}<p>Ouvrez le pipeline des leads pour les assigner ou changer leur statut.</p>`) });
    emailSent = !result.skipped;
  }

  return NextResponse.json({ ok: true, staleCount: staleLeads.length, criticalCount: criticalLeads, notificationsCreated, emailSent });
}

export async function POST(request: Request) {
  return GET(request);
}
