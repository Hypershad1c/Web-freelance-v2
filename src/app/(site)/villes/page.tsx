import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { getCities } from "@/lib/data/network";

export const metadata: Metadata = {
  title: "Villes | Domify",
  description: "Découvrez nos biens immobiliers d'exception à travers les plus belles villes du Maroc.",
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1200&auto=format&fit=crop";

export default async function CitiesPage() {
  const cities = await getCities();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-domify-dark">Nos villes</h1>
      <p className="mt-1 text-sm text-domify-dark/60">Explorez nos biens par destination</p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((city) => (
          <Link
            key={city.id}
            href={`/villes/${city.slug}`}
            className="group relative block h-56 overflow-hidden rounded-2xl shadow-luxury transition-luxury shadow-luxury-hover"
          >
            <Image
              src={city.image || FALLBACK_IMAGE}
              alt={city.name}
              fill
              className="object-cover transition-luxury group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-domify-dark/80 via-domify-dark/20 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <p className="font-display text-xl font-semibold">{city.name}</p>
              <p className="flex items-center gap-1.5 text-sm text-white/80">
                <MapPin size={13} /> {city._count.properties} bien(s)
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
