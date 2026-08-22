import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/workflow";

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" || !session.user.id) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  if (request.headers.get("x-domify-confirmation") !== "CLEAR_ALL_LEADS") {
    return NextResponse.json({ error: "Confirmation de suppression requise." }, { status: 400 });
  }

  const before = await prisma.lead.count();
  const deleted = await prisma.lead.deleteMany({});

  await recordAudit({
    actorId: session.user.id,
    action: "LEADS_CLEARED",
    entityType: "Lead",
    entityId: "all",
    summary: `${deleted.count} lead(s) supprimé(s) définitivement par un administrateur.`,
  });

  return NextResponse.json({ ok: true, before, deleted: deleted.count, after: before - deleted.count });
}
