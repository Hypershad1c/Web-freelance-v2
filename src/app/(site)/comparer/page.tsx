"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Check, Minus } from "lucide-react";
import { useCompare } from "@/lib/compare-context";
import { formatMAD } from "@/lib/utils";
import type { PropertyWithRelations } from "@/lib/data/properties";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop";

export default function ComparePage() {
  const { compareIds, toggleCompare, clearCompare } = useCompare();
  const [properties, setProperties] = useState<PropertyWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (compareIds.length === 0) {
      setProperties([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/properties?ids=${compareIds.join(",")}`)
      .then((res) => res.json())
      .then((data: PropertyWithRelations[]) => {
        // Preserve selection order
        const ordered = compareIds.map((id) => data.find((p) => p.id === id)).filter(Boolean) as PropertyWithRelations[];
        setProperties(ordered);
      })
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, [compareIds]);

  const allAmenities = Array.from(new Set(properties.flatMap((p) => p.amenities.map((a) => a.name)))).sort();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-domify-dark">Comparer les biens</h1>
          <p className="mt-1 text-sm text-domify-dark/60">
            {properties.length > 0 ? `${properties.length} bien(s) comparé(s)` : "Aucun bien sélectionné"}
          </p>
        </div>
        {properties.length > 0 && (
          <button onClick={clearCompare} className="text-sm font-medium text-domify-dark/50 hover:text-domify-dark">
            Tout effacer
          </button>
        )}
      </div>

      {loading ? (
        <p className="rounded-2xl bg-domify-warm-white p-10 text-center text-domify-dark/60">Chargement...</p>
      ) : properties.length === 0 ? (
        <div className="rounded-2xl bg-domify-warm-white p-16 text-center">
          <p className="text-domify-dark/60">
            Sélectionnez jusqu&apos;à 4 biens depuis les listes de propriétés (icône{" "}
            <span className="font-medium">balance</span>) pour les comparer ici.
          </p>
          <Link href="/proprietes" className="mt-5 inline-block rounded-full bg-domify-primary px-6 py-2.5 text-sm font-semibold text-white">
            Parcourir les biens
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="w-40"></th>
                {properties.map((p) => (
                  <th key={p.id} className="p-3 text-left align-top">
                    <div className="relative w-full overflow-hidden rounded-xl">
                      <button
                        onClick={() => toggleCompare(p.id)}
                        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-domify-dark hover:bg-domify-gold hover:text-white"
                        aria-label="Retirer"
                      >
                        <X size={13} />
                      </button>
                      <div className="relative h-32 w-full">
                        <Image src={p.media[0]?.url ?? FALLBACK_IMAGE} alt={p.title} fill className="object-cover" />
                      </div>
                    </div>
                    <Link href={`/proprietes/${p.id}`} className="mt-2 block font-display text-sm font-semibold text-domify-dark hover:text-domify-primary">
                      {p.title}
                    </Link>
                    <p className="mt-1 text-sm font-bold text-domify-gold">{formatMAD(p.price)}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Row label="Ville" values={properties.map((p) => p.city.name)} />
              <Row label="Type" values={properties.map((p) => p.propertyType.name)} />
              <Row label="Transaction" values={properties.map((p) => (p.listingType === "LOCATION" ? "Location" : "Vente"))} />
              <Row label="Surface" values={properties.map((p) => `${p.surfaceArea} m²`)} />
              <Row label="Chambres" values={properties.map((p) => String(p.bedrooms))} />
              <Row label="Salles de bain" values={properties.map((p) => String(p.bathrooms))} />
              <Row label="Année" values={properties.map((p) => (p.yearBuilt ? String(p.yearBuilt) : "—"))} />
              <Row label="Agence" values={properties.map((p) => p.agency?.name ?? "—")} />

              {allAmenities.map((amenity) => (
                <tr key={amenity} className="border-t border-black/5">
                  <td className="p-3 text-sm font-medium text-domify-dark/70">{amenity}</td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-3 text-center">
                      {p.amenities.some((a) => a.name === amenity) ? (
                        <Check size={16} className="mx-auto text-domify-primary" />
                      ) : (
                        <Minus size={16} className="mx-auto text-domify-dark/20" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Row({ label, values }: { label: string; values: string[] }) {
  return (
    <tr className="border-t border-black/5">
      <td className="p-3 text-sm font-medium text-domify-dark/70">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="p-3 text-sm text-domify-dark">{v}</td>
      ))}
    </tr>
  );
}
