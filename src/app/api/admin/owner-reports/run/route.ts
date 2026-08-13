import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { emailLayout, sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { formatMAD } from "@/lib/utils";

async function authorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") === `Bearer ${cronSecret}`) return true;
  const session = await auth();
  return session?.user?.role === "ADMIN" || session?.user?.role === "EDITOR";
}

function weekWindow() {
  const end = new Date(); end.setHours(0, 0, 0, 0);
  const start = new Date(end); start.setDate(start.getDate() - 7);
  return { start, end };
}

async function runReports() {
  const { start, end } = weekWindow();
  const sellerCases = await prisma.crmSellerCase.findMany({ where: { stage: { notIn: ["LOST"] } }, include: { contact: true, property: { include: { _count: { select: { favorites: true, leads: { where: { createdAt: { gte: start, lt: end } } }, appointments: { where: { createdAt: { gte: start, lt: end } } } } } } } } });
  let created = 0; let sent = 0; let skipped = 0;
  for (const item of sellerCases) {
    const summary = { propertyTitle: item.property?.title || null, propertyReference: item.property?.reference || null, stage: item.stage, estimatedValue: item.estimatedValue, views: item.property?.viewsCount || 0, favorites: item.property?._count.favorites || 0, leadsThisWeek: item.property?._count.leads || 0, viewingsThisWeek: item.property?._count.appointments || 0, nextActionAt: item.nextActionAt?.toISOString() || null };
    const report = await prisma.ownerReport.upsert({ where: { sellerCaseId_periodStart_periodEnd: { sellerCaseId: item.id, periodStart: start, periodEnd: end } }, create: { sellerCaseId: item.id, contactId: item.contactId, propertyId: item.propertyId, periodStart: start, periodEnd: end, summary }, update: { summary } });
    created += 1;
    if (!item.contact.emailOptIn) { await prisma.ownerReport.update({ where: { id: report.id }, data: { status: "SKIPPED", error: "Consentement email absent" } }); skipped += 1; continue; }
    const result = await sendEmail({ to: item.contact.email, subject: `Votre rapport propriétaire Domify — ${item.property?.title || item.title}`, html: emailLayout("Votre rapport propriétaire", `<p>Bonjour ${item.contact.name},</p><p>Voici le point de la semaine sur <strong>${item.property?.title || item.title}</strong>.</p><ul><li>Vues cumulées : <strong>${summary.views}</strong></li><li>Favoris : <strong>${summary.favorites}</strong></li><li>Nouvelles demandes : <strong>${summary.leadsThisWeek}</strong></li><li>Visites demandées : <strong>${summary.viewingsThisWeek}</strong></li>${summary.estimatedValue ? `<li>Estimation de référence : <strong>${formatMAD(summary.estimatedValue)}</strong></li>` : ""}</ul><p>Connectez-vous à votre espace vendeur pour suivre les étapes et les offres en cours.</p>`) });
    if (result.skipped) { await prisma.ownerReport.update({ where: { id: report.id }, data: { status: "SKIPPED", error: result.reason || "Email non disponible" } }); skipped += 1; }
    else { await prisma.ownerReport.update({ where: { id: report.id }, data: { status: "SENT", deliveredAt: new Date(), error: null } }); sent += 1; }
  }
  return { created, sent, skipped, periodStart: start.toISOString(), periodEnd: end.toISOString() };
}

async function handle(request: Request) { if (!(await authorized(request))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 }); return NextResponse.json(await runReports()); }
export async function GET(request: Request) { return handle(request); }
export async function POST(request: Request) { return handle(request); }
