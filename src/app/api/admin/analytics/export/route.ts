import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_RANGES = new Set([7, 30, 90, 365]);

type DailyRow = { day: Date; visitors: number; sessions: number; pageViews: number };

export async function GET(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rangeValue = Number(new URL(request.url).searchParams.get("range") || 30);
  const range = ALLOWED_RANGES.has(rangeValue) ? rangeValue : 30;
  const start = new Date(Date.now() - range * 24 * 60 * 60 * 1000);
  const rows = await prisma.$queryRaw<DailyRow[]>`
    SELECT date_trunc('day', "createdAt") AS day,
      COUNT(DISTINCT "visitorId")::int AS visitors,
      COUNT(DISTINCT "sessionId")::int AS sessions,
      COUNT(*)::int AS "pageViews"
    FROM "AnalyticsEvent"
    WHERE type = 'page_view' AND "createdAt" >= ${start}
    GROUP BY 1 ORDER BY 1 ASC
  `;

  const csv = [
    "date,unique_visitors,sessions,page_views",
    ...rows.map((row) => [new Intl.DateTimeFormat("fr-CA").format(new Date(row.day)), row.visitors, row.sessions, row.pageViews].join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=domify-analytics-${range}d.csv`,
      "Cache-Control": "private, no-store",
    },
  });
}
