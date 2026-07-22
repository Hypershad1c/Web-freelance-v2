import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart, Inbox, CalendarClock, Shield } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: "Nouveau",
  CONTACTED: "Contacté",
  QUALIFIED: "Qualifié",
  CONVERTED: "Converti",
  LOST: "Clôturé",
};

const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmé",
  CANCELLED: "Annulé",
  COMPLETED: "Terminé",
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/compte");

  const [favoritesCount, leads, appointments] = await Promise.all([
    prisma.favorite.count({ where: { userId: session.user.id } }),
    prisma.lead.findMany({
      where: { userId: session.user.id },
      include: { property: { select: { title: true, id: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.appointment.findMany({
      where: { userId: session.user.id },
      include: { property: { select: { title: true, id: true } }, agent: { select: { name: true } } },
      orderBy: { date: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl bg-white p-8 shadow-luxury">
        <h1 className="font-display text-2xl font-bold text-domify-dark">
          Bonjour, {session.user.name?.split(" ")[0] ?? session.user.email}
        </h1>
        <p className="mt-1 text-sm text-domify-dark/60">{session.user.email}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/favoris" className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-luxury transition-luxury shadow-luxury-hover">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-domify-warm-white text-domify-gold">
            <Heart size={18} />
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-domify-dark">{favoritesCount}</p>
            <p className="text-xs text-domify-dark/50">Favoris</p>
          </div>
        </Link>
        <div className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-luxury">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-domify-warm-white text-domify-gold">
            <Inbox size={18} />
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-domify-dark">{leads.length}</p>
            <p className="text-xs text-domify-dark/50">Demandes envoyées</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-luxury">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-domify-warm-white text-domify-gold">
            <CalendarClock size={18} />
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-domify-dark">{appointments.length}</p>
            <p className="text-xs text-domify-dark/50">Visites demandées</p>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-4 font-display text-xl font-semibold text-domify-dark">Mes visites</h2>
        {appointments.length === 0 ? (
          <p className="rounded-2xl bg-domify-warm-white p-8 text-center text-sm text-domify-dark/60">
            Vous n&apos;avez pas encore demandé de visite.
          </p>
        ) : (
          <div className="space-y-3">
            {appointments.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-luxury">
                <div>
                  <p className="text-sm font-medium text-domify-dark">
                    {a.property ? (
                      <Link href={`/proprietes/${a.property.id}`} className="hover:text-domify-primary">{a.property.title}</Link>
                    ) : (
                      "—"
                    )}
                  </p>
                  <p className="text-xs text-domify-dark/50">
                    {new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(a.date)}
                    {a.agent && ` · avec ${a.agent.name}`}
                  </p>
                </div>
                <span className="rounded-full bg-domify-warm-white px-3 py-1 text-xs font-medium text-domify-dark/70">
                  {APPOINTMENT_STATUS_LABELS[a.status] ?? a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10">
        <h2 className="mb-4 font-display text-xl font-semibold text-domify-dark">Mes demandes</h2>
        {leads.length === 0 ? (
          <p className="rounded-2xl bg-domify-warm-white p-8 text-center text-sm text-domify-dark/60">
            Vous n&apos;avez pas encore envoyé de demande de contact.
          </p>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-luxury">
                <div>
                  <p className="text-sm font-medium text-domify-dark">
                    {lead.property ? (
                      <Link href={`/proprietes/${lead.property.id}`} className="hover:text-domify-primary">{lead.property.title}</Link>
                    ) : (
                      "Demande générale"
                    )}
                  </p>
                  {lead.message && <p className="mt-1 line-clamp-1 text-xs text-domify-dark/50">{lead.message}</p>}
                </div>
                <span className="rounded-full bg-domify-warm-white px-3 py-1 text-xs font-medium text-domify-dark/70">
                  {LEAD_STATUS_LABELS[lead.status] ?? lead.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {(session.user.role === "ADMIN" || session.user.role === "EDITOR" || session.user.role === "AGENT") && (
        <Link
          href="/admin"
          className="mt-10 flex items-center gap-2 rounded-2xl bg-domify-primary-dark p-5 text-sm font-medium text-white transition-luxury hover:bg-domify-primary"
        >
          <Shield size={16} /> Accéder au back-office ({session.user.role})
        </Link>
      )}
    </div>
  );
}
