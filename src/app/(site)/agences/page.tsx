import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Users, Building2 } from "lucide-react";
import { getAgencies } from "@/lib/data/network";
import { getLocale } from "@/i18n/get-locale";

export const metadata: Metadata = {
  title: "Agences partenaires | Domify",
  description: "Découvrez les agences immobilières partenaires de Domify au Maroc.",
};

const AGENCY_COPY = {
  fr: { title: "Nos agences partenaires", trust: "agence(s) de confiance", agents: "conseiller(s)", properties: "bien(s)" },
  en: { title: "Our partner agencies", trust: "trusted agency(ies)", agents: "agent(s)", properties: "property(ies)" },
  ar: { title: "وكالاتنا الشريكة", trust: "وكالات موثوقة", agents: "مستشارون", properties: "عقارات" },
} as const;

export default async function AgenciesPage() {
  const locale = await getLocale();
  const copy = AGENCY_COPY[locale];
  const isRtl = locale === "ar";
  const agencies = await getAgencies();

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className={`mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 ${isRtl ? "text-right" : ""}`}>
      <h1 className="font-display text-3xl font-bold text-domify-dark">{copy.title}</h1>
      <p className="mt-1 text-sm text-domify-dark/60"><bdi>{agencies.length}</bdi> {copy.trust}</p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {agencies.map((agency) => (
          <Link
            key={agency.id}
            href={`/agences/${agency.slug}`}
            className={`block rounded-2xl bg-white p-6 shadow-luxury transition-luxury shadow-luxury-hover ${isRtl ? "text-right" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-domify-warm-white">
                {agency.logo ? (
                  <Image src={agency.logo} alt={agency.name} fill className="object-cover" />
                ) : (
                  <Building2 size={20} className="text-domify-primary" />
                )}
              </div>
              <div>
                <p className="flex items-center gap-1.5 font-display text-lg font-semibold text-domify-dark">
                  {agency.name}
                  {agency.verified && <BadgeCheck size={15} className="text-domify-primary" />}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-domify-dark/50">
                  <Users size={12} /> <bdi>{agency._count.agents}</bdi> {copy.agents} · <bdi>{agency._count.properties}</bdi> {copy.properties}
                </p>
              </div>
            </div>
            {agency.description && <p className="mt-3 line-clamp-2 text-sm text-domify-dark/60">{agency.description}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
