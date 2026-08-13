import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AvailabilityManager } from "@/components/admin/AvailabilityManager";

export default async function AvailabilityPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || !role || !["ADMIN", "EDITOR", "AGENT"].includes(role)) redirect("/connexion?callbackUrl=/admin/appointments/disponibilites");
  const ownAgent = role === "AGENT" ? await prisma.agent.findUnique({ where: { userId: session.user.id }, select: { id: true } }) : null;
  const scope = role === "AGENT" ? { agentId: ownAgent?.id || "__none__" } : {};
  const [agents, slots] = await Promise.all([
    prisma.agent.findMany({ where: role === "AGENT" ? { id: ownAgent?.id || "__none__" } : {}, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.agentAvailability.findMany({ where: { ...scope, startsAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, include: { agent: { select: { id: true, name: true } }, _count: { select: { appointments: { where: { status: { in: ["PENDING", "CONFIRMED"] } } } } } }, orderBy: { startsAt: "asc" }, take: 150 }),
  ]);

  return <><AdminTopbar title="Disponibilités de visite"/><main className="min-h-full bg-[#faf9f6] px-4 py-6 sm:px-6 lg:px-10 lg:py-9"><Link href="/admin/appointments" className="pressable inline-flex items-center gap-2 text-sm font-semibold text-domify-primary hover:text-domify-gold"><ArrowLeft size={16}/> Rendez-vous</Link><section className="mt-5 rounded-[1.5rem] bg-domify-primary-dark p-6 text-white sm:p-8"><div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-domify-soft-gold"><CalendarDays size={22}/></span><div><p className="luxury-eyebrow text-domify-soft-gold">Réservation en temps réel</p><h1 className="mt-2 font-display text-3xl font-semibold">Publiez les créneaux de visite.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">Les acheteurs voient uniquement les créneaux futurs avec de la capacité disponible sur les biens attribués à leur conseiller.</p></div></div></section><div className="mt-7"><AvailabilityManager agents={agents} slots={slots} role={role}/></div></main></>;
}
