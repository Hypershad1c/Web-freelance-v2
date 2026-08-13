import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { emailLayout, sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

async function authorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const bearer = request.headers.get("authorization");
  if (cronSecret && bearer === `Bearer ${cronSecret}`) return true;
  const session = await auth();
  return session?.user?.role === "ADMIN" || session?.user?.role === "EDITOR";
}

async function processQueuedFollowUps() {
  const queued = await prisma.crmCommunication.findMany({
    where: { status: "QUEUED" },
    include: { contact: true, owner: true },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  let sent = 0;
  let skipped = 0;
  for (const item of queued) {
    if (item.channel === "EMAIL") {
      const result = await sendEmail({
        to: item.contact.email,
        subject: item.subject || "Votre suivi Domify",
        html: emailLayout(item.subject || "Suivi Domify", `<p>${item.body.replace(/\n/g, "<br/>")}</p>`),
      });
      if (!result.skipped) {
        await prisma.crmCommunication.update({ where: { id: item.id }, data: { status: "SENT", sentAt: new Date() } });
        sent += 1;
      } else skipped += 1;
    } else if (item.channel === "IN_APP" && item.ownerId) {
      await prisma.notification.create({ data: { userId: item.ownerId, type: "SYSTEM", title: item.subject || "Suivi CRM", body: item.body, href: `/admin/crm/contacts/${item.contactId}` } });
      await prisma.crmCommunication.update({ where: { id: item.id }, data: { status: "SENT", sentAt: new Date() } });
      sent += 1;
    } else skipped += 1;
  }
  return { processed: queued.length, sent, skipped, pendingExternal: queued.length - sent - skipped };
}

async function run(request: Request) {
  if (!(await authorized(request))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json(await processQueuedFollowUps());
}

// Vercel Cron invokes the configured production path with GET and attaches CRON_SECRET as a Bearer token.
export async function GET(request: Request) { return run(request); }
// Administrators can also run the processor on demand from an authenticated session.
export async function POST(request: Request) { return run(request); }
