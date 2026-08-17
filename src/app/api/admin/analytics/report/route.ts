import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { emailLayout, sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/data/settings";

async function authorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") === `Bearer ${cronSecret}`) return true;
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

function dayWindow() {
  const end = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  return { start, end };
}

export async function GET(request: Request) {
  if (!(await authorized(request))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { start, end } = dayWindow();
  const [summaryRows, topPropertyRows, admins, settings] = await Promise.all([
    prisma.$queryRaw<{ visitors: number; sessions: number; pageViews: number; leads: number; searches: number; favorites: number; appointments: number; whatsapp: number }[]>`
      SELECT
        COUNT(DISTINCT "visitorId") FILTER (WHERE type = 'page_view' AND "visitorId" IS NOT NULL)::int AS visitors,
        COUNT(DISTINCT "sessionId") FILTER (WHERE type = 'page_view' AND "sessionId" IS NOT NULL)::int AS sessions,
        COUNT(*) FILTER (WHERE type = 'page_view')::int AS "pageViews",
        COUNT(*) FILTER (WHERE type = 'lead')::int AS leads,
        COUNT(*) FILTER (WHERE type = 'search')::int AS searches,
        COUNT(*) FILTER (WHERE type = 'favorite')::int AS favorites,
        COUNT(*) FILTER (WHERE type = 'appointment')::int AS appointments,
        COUNT(*) FILTER (WHERE type = 'whatsapp')::int AS whatsapp
      FROM "AnalyticsEvent" WHERE "createdAt" >= ${start} AND "createdAt" < ${end}
    `,
    prisma.$queryRaw<{ propertyId: string; views: number; leads: number }[]>`
      SELECT "propertyId", COUNT(*) FILTER (WHERE type = 'page_view')::int AS views, COUNT(*) FILTER (WHERE type = 'lead')::int AS leads
      FROM "AnalyticsEvent" WHERE "createdAt" >= ${start} AND "createdAt" < ${end} AND "propertyId" IS NOT NULL
      GROUP BY "propertyId" ORDER BY views DESC LIMIT 3
    `,
    prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } }),
    getSiteSettings(),
  ]);

  const summary = summaryRows[0] ?? { visitors: 0, sessions: 0, pageViews: 0, leads: 0, searches: 0, favorites: 0, appointments: 0, whatsapp: 0 };
  const highInterestNoConversion = summary.pageViews >= 25 && summary.leads === 0;
  const periodKey = start.toISOString().slice(0, 10);
  const title = `Analytics Domify — ${periodKey}`;
  let notificationsCreated = 0;

  for (const admin of admins) {
    const existing = await prisma.notification.findFirst({ where: { userId: admin.id, type: "SYSTEM", title } });
    if (!existing) {
      await prisma.notification.create({ data: { userId: admin.id, type: "SYSTEM", title, body: highInterestNoConversion ? "Audience élevée sans lead détectée sur les dernières 24 heures." : "Le rapport analytics quotidien est disponible.", href: "/admin/analytics", meta: { periodStart: start.toISOString(), periodEnd: end.toISOString(), visitors: summary.visitors, pageViews: summary.pageViews, leads: summary.leads } } });
      notificationsCreated += 1;
    }
  }

  const recipient = settings.contact_email;
  let emailSent = false;
  if (recipient) {
    const alert = highInterestNoConversion ? `<p style="background:#FFF4E5;padding:12px 16px;border-radius:8px;"><strong>Attention :</strong> le site a enregistré ${summary.pageViews} pages vues mais aucun lead sur les dernières 24 heures.</p>` : "";
    const result = await sendEmail({ to: recipient, subject: `Rapport analytics Domify — ${periodKey}`, html: emailLayout("Rapport analytics quotidien", `${alert}<ul><li>Visiteurs uniques : <strong>${summary.visitors}</strong></li><li>Sessions : <strong>${summary.sessions}</strong></li><li>Pages vues : <strong>${summary.pageViews}</strong></li><li>Leads : <strong>${summary.leads}</strong></li><li>Recherches : <strong>${summary.searches}</strong></li><li>Favoris : <strong>${summary.favorites}</strong></li><li>Rendez-vous : <strong>${summary.appointments}</strong></li><li>WhatsApp : <strong>${summary.whatsapp}</strong></li></ul><p>Consultez le tableau de bord analytics pour les sources, biens et villes les plus demandés.</p>`) });
    emailSent = !result.skipped;
  }

  return NextResponse.json({ ok: true, periodStart: start.toISOString(), periodEnd: end.toISOString(), summary, topProperties: topPropertyRows, notificationsCreated, emailSent });
}

export async function POST(request: Request) {
  return GET(request);
}
