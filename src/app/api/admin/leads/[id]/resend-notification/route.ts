import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLeadAdministratorNotification } from "@/lib/lead-email";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Non autorisé — réservé aux administrateurs." }, { status: 403 });

  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { property: { include: { agent: { select: { email: true } } } } },
  });
  if (!lead) return NextResponse.json({ error: "Lead introuvable." }, { status: 404 });

  const result = await sendLeadAdministratorNotification(lead, session.user.id);
  if (!result.accepted) return NextResponse.json({ error: "Le fournisseur email n’a pas accepté l’envoi.", recipientCount: result.recipientCount, reason: result.reason }, { status: 502 });
  return NextResponse.json({ ok: true, recipientCount: result.recipientCount, messageId: result.messageId });
}
