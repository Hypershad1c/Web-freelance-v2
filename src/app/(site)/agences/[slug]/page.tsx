import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Phone, Mail, MapPin, Building2 } from "lucide-react";
import { getAgencyBySlug } from "@/lib/data/network";
import { PropertyCard } from "@/components/home/PropertyCard";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const agency = await getAgencyBySlug(slug);
  if (!agency) return {};
  return {
    title: `${agency.name} | Domify`,
    description: agency.description || `Retrouvez tous les biens de ${agency.name} sur Domify.`,
  };
}

export default async function AgencyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agency = await getAgencyBySlug(slug);
  if (!agency) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl bg-white p-8 shadow-luxury">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-domify-warm-white">
            {agency.logo ? (
              <Image src={agency.logo} alt={agency.name} fill className="object-cover" />
            ) : (
              <Building2 size={28} className="text-domify-primary" />
            )}
          </div>
          <div>
            <h1 className="flex items-center gap-2 font-display text-3xl font-bold text-domify-dark">
              {agency.name}
              {agency.verified && <BadgeCheck className="text-domify-primary" size={20} />}
            </h1>
            {agency.description && <p className="mt-2 max-w-2xl text-domify-dark/60">{agency.description}</p>}
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-domify-dark/60">
              {agency.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> {agency.phone}</span>}
              {agency.email && <span className="flex items-center gap-1.5"><Mail size={14} /> {agency.email}</span>}
              {agency.address && <span className="flex items-center gap-1.5"><MapPin size={14} /> {agency.address}</span>}
            </div>
          </div>
        </div>
      </div>

      {agency.agents.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 font-display text-xl font-semibold text-domify-dark">Nos agents</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {agency.agents.map((agent) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.slug}`}
                className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-luxury transition-luxury shadow-luxury-hover"
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-domify-warm-white">
                  {agent.photo && <Image src={agent.photo} alt={agent.name} fill className="object-cover" />}
                </div>
                <p className="text-sm font-medium text-domify-dark">{agent.name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="mb-4 font-display text-xl font-semibold text-domify-dark">
          Biens de {agency.name} ({agency.properties.length})
        </h2>
        {agency.properties.length === 0 ? (
          <p className="rounded-2xl bg-domify-warm-white p-10 text-center text-domify-dark/60">
            Aucun bien publié pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {agency.properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
