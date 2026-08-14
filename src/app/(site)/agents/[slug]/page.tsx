import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Building2, CheckCircle2, Mail, MapPin, Phone, Sparkles, User } from "lucide-react";
import { getAgentBySlug } from "@/lib/data/network";
import { PropertyCard } from "@/components/home/PropertyCard";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);
  if (!agent) return {};
  return { title: `${agent.name} | Domify`, description: agent.bio || `Retrouvez tous les biens de ${agent.name} sur Domify.` };
}

export default async function AgentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);
  if (!agent) notFound();
  const cities = Array.from(new Set(agent.properties.map((property) => property.city.name)));

  return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
    <section className="relative overflow-hidden rounded-[2rem] bg-domify-primary-dark p-6 text-white shadow-luxury sm:p-10"><div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/15" /><div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end"><div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center"><div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[1.75rem] border border-domify-soft-gold/30 bg-white/10">{agent.photo ? <Image src={agent.photo} alt={agent.name} fill className="object-cover" /> : <User size={38} className="text-domify-soft-gold" />}</div><div><div className="flex flex-wrap items-center gap-2"><p className="luxury-eyebrow text-domify-soft-gold">Conseiller Domify</p>{agent.agency?.verified && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-emerald-100"><BadgeCheck size={12} /> Vérifié</span>}</div><h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">{agent.name}</h1>{agent.agency && <Link href={`/agences/${agent.agency.slug}`} className="mt-2 flex items-center gap-1.5 text-sm text-white/70 hover:text-domify-soft-gold"><Building2 size={14} /> {agent.agency.name}</Link>}{agent.bio && <p className="mt-4 max-w-2xl text-sm leading-6 text-white/68">{agent.bio}</p>}</div></div><div className="rounded-2xl border border-white/12 bg-white/8 p-5 backdrop-blur-md"><p className="luxury-eyebrow text-domify-soft-gold">Disponibilité</p><p className="mt-3 font-display text-2xl font-semibold">{agent.availability.length > 0 ? "Créneaux ouverts" : "Sur demande"}</p><p className="mt-2 text-sm leading-6 text-white/62">Planifiez un premier échange personnalisé avec {agent.name}.</p><Link href={`/contact?agent=${agent.id}`} className="mt-4 inline-flex items-center gap-2 rounded-full bg-domify-gold px-4 py-2.5 text-sm font-semibold text-white hover:bg-domify-soft-gold hover:text-domify-primary-dark">Prendre contact <Mail size={15} /></Link></div></div></section>

    <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4"><ProfileStat label="Biens actifs" value={String(agent.properties.length)} /><ProfileStat label="Villes couvertes" value={String(cities.length)} /><ProfileStat label="Rendez-vous" value={agent.availability.length > 0 ? "Ouverts" : "Flexible"} /><ProfileStat label="Accompagnement" value="Sur mesure" /></section>

    <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]"><div><div className="mb-5 flex items-end justify-between"><div><p className="luxury-eyebrow text-domify-gold">Sélection active</p><h2 className="mt-2 font-display text-3xl font-semibold text-domify-dark">Les biens de {agent.name}</h2></div><span className="rounded-full bg-domify-warm-white px-3 py-1.5 text-xs font-bold text-domify-primary">{agent.properties.length} adresse(s)</span></div>{agent.properties.length === 0 ? <p className="rounded-2xl bg-domify-warm-white p-10 text-center text-domify-dark/60">Aucun bien publié pour le moment.</p> : <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">{agent.properties.map((property) => <PropertyCard key={property.id} property={property} />)}</div>}</div><aside className="space-y-4"><div className="rounded-[1.5rem] border border-domify-dark/8 bg-domify-warm-white p-5 sm:p-6"><p className="luxury-eyebrow text-domify-gold">Pourquoi lui faire confiance</p><div className="mt-5 space-y-4"><TrustPoint icon={BadgeCheck} text="Identité et agence contrôlées" /><TrustPoint icon={MapPin} text={`Expertise locale : ${cities.slice(0, 2).join(" et ") || "Maroc"}`} /><TrustPoint icon={Sparkles} text="Sélection et accompagnement premium" /></div></div><div className="rounded-[1.5rem] bg-domify-primary p-5 text-white"><p className="text-sm font-semibold">Un projet précis ?</p><p className="mt-2 text-sm leading-6 text-white/65">Demandez une sélection privée adaptée à votre budget et à votre calendrier.</p>{agent.phone && <a href={`tel:${agent.phone}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-domify-soft-gold"><Phone size={15} /> Appeler le conseiller</a>}</div></aside></section>
  </div>;
}

function ProfileStat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-domify-dark/8 bg-white p-4 shadow-[0_16px_30px_-28px_rgba(16,47,66,0.4)]"><p className="text-[0.62rem] font-bold uppercase tracking-[0.13em] text-domify-dark/45">{label}</p><p className="mt-2 font-display text-xl font-semibold text-domify-dark">{value}</p></div>; }
function TrustPoint({ icon: Icon, text }: { icon: typeof CheckCircle2; text: string }) { return <div className="flex items-center gap-3 text-sm font-medium text-domify-dark/70"><Icon size={17} className="text-domify-gold" />{text}</div>; }
