import { redirect } from "next/navigation";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { PortalMessaging } from "@/components/portal/PortalMessaging";
import { UnifiedAgentInbox } from "@/components/admin/UnifiedAgentInbox";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminMessagingPage() {
  const session = await auth();
  if (!session?.user?.role || !["ADMIN", "EDITOR", "AGENT"].includes(session.user.role)) redirect("/admin");

  const agent = session.user.role === "AGENT" ? await prisma.agent.findUnique({ where: { userId: session.user.id }, select: { id: true } }) : null;
  const agentId = agent?.id || "__no_agent__";
  const agentPropertyWhere = session.user.role === "AGENT" ? { agentId } : {};
  const agentAppointmentWhere = session.user.role === "AGENT" ? { agentId } : {};

  const [portalConversations, leads, appointments, contactMessages] = await Promise.all([
    prisma.portalConversation.findMany({
      where: session.user.role === "AGENT" ? { OR: [{ assignedAgentId: session.user.id }, { property: { agentId } }] } : {},
      select: {
        id: true,
        lastMessageAt: true,
        property: { select: { title: true, reference: true } },
        owner: { select: { name: true, email: true } },
        messages: { where: { senderId: { not: session.user.id }, readAt: null }, select: { id: true } },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 25,
    }),
    prisma.lead.findMany({ where: { property: agentPropertyWhere }, select: { id: true, name: true, status: true, message: true, createdAt: true, property: { select: { title: true } } }, orderBy: { createdAt: "desc" }, take: 25 }),
    prisma.appointment.findMany({ where: agentAppointmentWhere, select: { id: true, name: true, status: true, date: true, createdAt: true, property: { select: { title: true } } }, orderBy: { date: "asc" }, take: 25 }),
    session.user.role === "AGENT" ? Promise.resolve([]) : prisma.message.findMany({ where: { read: false }, select: { id: true, name: true, subject: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 25 }),
  ]);

  const events = [
    ...portalConversations.map((conversation) => ({ id: conversation.id, kind: "portal" as const, title: conversation.property.title, subtitle: `${conversation.owner.name || conversation.owner.email} · ${conversation.property.reference}`, createdAt: conversation.lastMessageAt.toISOString(), href: "/admin/messagerie", unread: conversation.messages.length > 0 })),
    ...leads.map((lead) => ({ id: lead.id, kind: "lead" as const, title: lead.name, subtitle: `${lead.property?.title || "Demande générale"} · ${lead.status}`, createdAt: lead.createdAt.toISOString(), href: "/admin/leads", unread: lead.status === "NEW" })),
    ...appointments.map((appointment) => ({ id: appointment.id, kind: "appointment" as const, title: appointment.name, subtitle: `${appointment.property?.title || "Visite Domify"} · ${appointment.status}`, createdAt: appointment.date.toISOString(), href: "/admin/appointments", unread: appointment.status === "PENDING" })),
    ...contactMessages.map((message) => ({ id: message.id, kind: "contact" as const, title: message.name, subtitle: message.subject || "Message de contact", createdAt: message.createdAt.toISOString(), href: "/admin/messages", unread: true })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 40);

  return (
    <>
      <AdminTopbar title="Messagerie portails" />
      <div className="space-y-6 p-4 sm:p-6 lg:p-10">
        <UnifiedAgentInbox events={events} />
        <PortalMessaging mode="staff" />
      </div>
    </>
  );
}
