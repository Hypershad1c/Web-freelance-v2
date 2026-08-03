import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, Building2, User } from "lucide-react";
import { getAgentBySlug } from "@/lib/data/network";
import { PropertyCard } from "@/components/home/PropertyCard";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);
  if (!agent) return {};
  return {
    title: `${agent.name} | Domify`,
    description: agent.bio || `Retrouvez tous les biens de ${agent.name} sur Domify.`,
  };
}

export default async function AgentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);
  if (!agent) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl bg-white p-8 shadow-luxury">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-domify-warm-white">
            {agent.photo ? (
              <Image src={agent.photo} alt={agent.name} fill className="object-cover" />
            ) : (
              <User size={28} className="text-domify-primary" />
            )}
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-domify-dark">{agent.name}</h1>
            {agent.agency && (
              <Link href={`/agences/${agent.agency.slug}`} className="mt-1 flex items-center gap-1.5 text-sm text-domify-primary hover:text-domify-gold">
                <Building2 size={14} /> {agent.agency.name}
              </Link>
            )}
            {agent.bio && <p className="mt-3 max-w-2xl text-domify-dark/60">{agent.bio}</p>}
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-domify-dark/60">
              {agent.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> {agent.phone}</span>}
              {agent.email && <span className="flex items-center gap-1.5"><Mail size={14} /> {agent.email}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-4 font-display text-xl font-semibold text-domify-dark">
          Biens de {agent.name} ({agent.properties.length})
        </h2>
        {agent.properties.length === 0 ? (
          <p className="rounded-2xl bg-domify-warm-white p-10 text-center text-domify-dark/60">
            Aucun bien publié pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {agent.properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
