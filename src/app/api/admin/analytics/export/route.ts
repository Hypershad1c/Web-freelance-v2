import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_RANGES = new Set([7, 30, 90, 365]);

type DailyRow = { day: Date; visitors: number; sessions: number; pageViews: number; leads: number; searches: number; favorites: number; appointments: number; whatsapp: number };
type PropertyRow = { propertyId: string; views: number; favorites: number; leads: number; appointments: number; whatsapp: number };
type CampaignRow = { source: string | null; medium: string | null; campaign: string | null; events: number };

function csv(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export async function GET(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rangeValue = Number(new URL(request.url).searchParams.get("range") || 30);
  const range = ALLOWED_RANGES.has(rangeValue) ? rangeValue : 30;
  const end = new Date();
  const start = new Date(end.getTime() - range * 24 * 60 * 60 * 1000);
  const [dailyRows, propertyRows, campaignRows, retentionRows] = await Promise.all([
    prisma.$queryRaw<DailyRow[]>`
      SELECT date_trunc('day', "createdAt") AS day,
        COUNT(DISTINCT "visitorId") FILTER (WHERE type = 'page_view' AND "visitorId" IS NOT NULL)::int AS visitors,
        COUNT(DISTINCT "sessionId") FILTER (WHERE type = 'page_view' AND "sessionId" IS NOT NULL)::int AS sessions,
        COUNT(*) FILTER (WHERE type = 'page_view')::int AS "pageViews",
        COUNT(*) FILTER (WHERE type = 'lead')::int AS leads,
        COUNT(*) FILTER (WHERE type = 'search')::int AS searches,
        COUNT(*) FILTER (WHERE type = 'favorite')::int AS favorites,
        COUNT(*) FILTER (WHERE type = 'appointment')::int AS appointments,
        COUNT(*) FILTER (WHERE type = 'whatsapp')::int AS whatsapp
      FROM "AnalyticsEvent" WHERE "createdAt" >= ${start} AND "createdAt" < ${end}
      GROUP BY 1 ORDER BY 1 ASC
    `,
    prisma.$queryRaw<PropertyRow[]>`
      SELECT "propertyId",
        COUNT(*) FILTER (WHERE type = 'page_view')::int AS views,
        COUNT(*) FILTER (WHERE type = 'favorite')::int AS favorites,
        COUNT(*) FILTER (WHERE type = 'lead')::int AS leads,
        COUNT(*) FILTER (WHERE type = 'appointment')::int AS appointments,
        COUNT(*) FILTER (WHERE type = 'whatsapp')::int AS whatsapp
      FROM "AnalyticsEvent"
      WHERE "createdAt" >= ${start} AND "createdAt" < ${end} AND "propertyId" IS NOT NULL
      GROUP BY "propertyId" ORDER BY views DESC LIMIT 100
    `,
    prisma.$queryRaw<CampaignRow[]>`
      SELECT NULLIF(source, '') AS source, NULLIF(medium, '') AS medium, NULLIF(campaign, '') AS campaign, COUNT(*)::int AS events
      FROM "AnalyticsEvent"
      WHERE "createdAt" >= ${start} AND "createdAt" < ${end} AND (source IS NOT NULL OR medium IS NOT NULL OR campaign IS NOT NULL)
      GROUP BY 1, 2, 3 ORDER BY events DESC LIMIT 100
    `,
    prisma.$queryRaw<{ newVisitors: number; returningVisitors: number }[]>`
      WITH active AS (
        SELECT "visitorId" FROM "AnalyticsEvent"
        WHERE type = 'page_view' AND "visitorId" IS NOT NULL AND "createdAt" >= ${start} AND "createdAt" < ${end}
        GROUP BY "visitorId"
      ), first_seen AS (
        SELECT "visitorId", MIN("createdAt") AS first_seen FROM "AnalyticsEvent"
        WHERE type = 'page_view' AND "visitorId" IS NOT NULL GROUP BY "visitorId"
      )
      SELECT COUNT(*) FILTER (WHERE first_seen >= ${start})::int AS "newVisitors", COUNT(*) FILTER (WHERE first_seen < ${start})::int AS "returningVisitors"
      FROM active JOIN first_seen USING ("visitorId")
    `,
  ]);

  const propertyIds = propertyRows.map((row) => row.propertyId);
  const properties = await prisma.property.findMany({ where: { id: { in: propertyIds } }, select: { id: true, title: true, reference: true } });
  const propertyMap = new Map(properties.map((property) => [property.id, property]));
  const retention = retentionRows[0] ?? { newVisitors: 0, returningVisitors: 0 };

  const lines = [
    "section,date,unique_visitors,sessions,page_views,leads,searches,favorites,appointments,whatsapp",
    ...dailyRows.map((row) => ["daily", new Intl.DateTimeFormat("fr-CA").format(new Date(row.day)), row.visitors, row.sessions, row.pageViews, row.leads, row.searches, row.favorites, row.appointments, row.whatsapp].map(csv).join(",")),
    "",
    "section,property_id,property_reference,property_title,views,favorites,leads,appointments,whatsapp",
    ...propertyRows.map((row) => ["property", row.propertyId, propertyMap.get(row.propertyId)?.reference, propertyMap.get(row.propertyId)?.title, row.views, row.favorites, row.leads, row.appointments, row.whatsapp].map(csv).join(",")),
    "",
    "section,source,medium,campaign,events",
    ...campaignRows.map((row) => ["campaign", row.source || "Direct", row.medium || "", row.campaign || "", row.events].map(csv).join(",")),
    "",
    "section,new_visitors,returning_visitors",
    ["retention", retention.newVisitors, retention.returningVisitors].map(csv).join(","),
  ];

  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=domify-analytics-${range}d.csv`,
      "Cache-Control": "private, no-store",
    },
  });
}
