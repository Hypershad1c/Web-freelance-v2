import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { emailLayout, sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { sendTwilioWhatsApp } from "@/lib/twilio-whatsapp";

async function authorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const bearer = request.headers.get("authorization");
  if (cronSecret && bearer === `Bearer ${cronSecret}`) return true;
  const session = await auth();
  return session?.user?.role === "ADMIN" || session?.user?.role === "EDITOR";
}

async function processSavedSearchAlerts() {
  const searches = await prisma.crmSavedSearch.findMany({ where: { active: true }, include: { user: { select: { id: true, email: true, name: true } }, city: { select: { name: true } }, propertyType: { select: { name: true } } }, orderBy: { updatedAt: "asc" } });
  let sent = 0;
  let matched = 0;
  for (const search of searches) {
    const properties = await prisma.property.findMany({
      where: {
        status: "PUBLISHED",
        approvalStatus: "APPROVED",
        createdAt: search.lastNotifiedAt ? { gt: search.lastNotifiedAt } : { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        ...(search.listingType ? { listingType: search.listingType } : {}),
        ...(search.minPrice !== null ? { price: { gte: search.minPrice } } : {}),
        ...(search.maxPrice !== null ? { price: { lte: search.maxPrice } } : {}),
        ...(search.bedrooms !== null ? { bedrooms: { gte: search.bedrooms } } : {}),
        ...(search.cityId ? { cityId: search.cityId } : {}),
        ...(search.propertyTypeId ? { propertyTypeId: search.propertyTypeId } : {}),
      },
      include: { city: { select: { name: true } }, propertyType: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    if (properties.length === 0) continue;
    matched += properties.length;
    const subject = `${properties.length} nouvelle${properties.length > 1 ? "s" : ""} opportunité${properties.length > 1 ? "s" : ""} pour « ${search.name} »`;
    const links = properties.map((property) => `<li><a href="https://domify.ma/proprietes/${property.id}">${property.title}</a> — ${new Intl.NumberFormat("fr-MA").format(property.price)} MAD · ${property.city.name}</li>`).join("");
    if (search.channel === "EMAIL") {
      const result = await sendEmail({ to: search.user.email, subject, html: emailLayout(subject, `<p>Bonjour ${search.user.name || ""},</p><p>Voici les nouvelles annonces correspondant à votre recherche :</p><ul>${links}</ul><p><a href="https://domify.ma/compte#alertes">Gérer mes alertes</a></p>`) });
      if (!result.skipped) sent += 1;
    } else if (search.channel === "IN_APP") {
      await prisma.notification.create({ data: { userId: search.user.id, type: "SAVED_SEARCH_MATCH", title: subject, body: properties.map((property) => property.title).join(" · "), href: "/compte#alertes", meta: { searchId: search.id, propertyIds: properties.map((property) => property.id) } } });
      sent += 1;
    }
    await prisma.crmSavedSearch.update({ where: { id: search.id }, data: { lastNotifiedAt: new Date() } });
  }
  return { searches: searches.length, matched, sent };
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
    } else if (item.channel === "WHATSAPP") {
      if (!item.contact.whatsappOptIn || !item.contact.phone) { skipped += 1; continue; }
      try {
        const result = await sendTwilioWhatsApp({ to: item.contact.phone, body: item.body });
        if (result.skipped) { skipped += 1; continue; }
        await prisma.crmCommunication.update({ where: { id: item.id }, data: { status: "SENT", sentAt: new Date(), externalId: result.sid } });
        sent += 1;
      } catch (error) {
        await prisma.crmCommunication.update({ where: { id: item.id }, data: { status: "FAILED" } });
        console.error("[crm automation] WhatsApp delivery failed", error);
      }
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
  const [followUps, savedSearchAlerts] = await Promise.all([processQueuedFollowUps(), processSavedSearchAlerts()]);
  return NextResponse.json({ followUps, savedSearchAlerts });
}

// Vercel Cron invokes the configured production path with GET and attaches CRON_SECRET as a Bearer token.
export async function GET(request: Request) { return run(request); }
// Administrators can also run the processor on demand from an authenticated session.
export async function POST(request: Request) { return run(request); }
