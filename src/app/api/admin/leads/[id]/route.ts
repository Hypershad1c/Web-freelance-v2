import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/workflow";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé — réservé aux administrateurs." }, { status: 403 });
  }

  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id }, select: { id: true, name: true, email: true } });
  if (!lead) return NextResponse.json({ error: "Lead introuvable." }, { status: 404 });

  await prisma.lead.delete({ where: { id: lead.id } });
  await recordAudit({
    actorId: session.user.id,
    action: "LEAD_DELETED",
    entityType: "Lead",
    entityId: lead.id,
    summary: `Lead ${lead.name} (${lead.email}) supprimé individuellement par un administrateur.`,
  }).catch((error) => console.error("[admin-leads] Failed to record lead deletion audit", error));

  return NextResponse.json({ ok: true, id: lead.id });
}
