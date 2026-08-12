"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Eye, LoaderCircle, Pencil, Star } from "lucide-react";
import { bulkUpdateProperties } from "@/lib/actions/properties";
import { formatMAD } from "@/lib/utils";
import { DeletePropertyButton } from "@/components/admin/DeletePropertyButton";

type PropertyRow = {
  id: string;
  title: string;
  reference: string;
  featured: boolean;
  price: number;
  viewsCount: number;
  status: "DRAFT" | "PUBLISHED" | "UNDER_OFFER" | "SOLD" | "ARCHIVED";
  city: { name: string };
  propertyType: { name: string };
};

const STATUS_LABELS: Record<PropertyRow["status"], string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  UNDER_OFFER: "Sous offre",
  SOLD: "Vendu",
  ARCHIVED: "Archivé",
};

const BULK_ACTIONS = [
  { value: "publish", label: "Publier" },
  { value: "draft", label: "Mettre en brouillon" },
  { value: "archive", label: "Archiver" },
  { value: "feature", label: "Mettre en avant" },
  { value: "unfeature", label: "Retirer des mises en avant" },
  { value: "delete", label: "Supprimer" },
] as const;

export function PropertiesTable({ properties, isAgent }: { properties: PropertyRow[]; isAgent: boolean }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [action, setAction] = useState<(typeof BULK_ACTIONS)[number]["value"]>("publish");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const allSelected = useMemo(() => properties.length > 0 && selectedIds.length === properties.length, [properties.length, selectedIds.length]);

  function toggleAll() {
    setSelectedIds(allSelected ? [] : properties.map((property) => property.id));
  }

  function toggleOne(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function runBulkAction() {
    if (selectedIds.length === 0) return;
    if (action === "delete" && !window.confirm(`Supprimer définitivement ${selectedIds.length} propriété(s) ?`)) return;

    startTransition(async () => {
      const result = await bulkUpdateProperties({ ids: selectedIds, action });
      setMessage(result.message);
      if (result.ok) setSelectedIds([]);
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-black/6 bg-white shadow-luxury">
      {!isAgent && (
        <div className="flex flex-col gap-3 border-b border-black/7 bg-domify-warm-white/55 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm text-domify-dark/65">
            <span className="font-semibold text-domify-dark">{selectedIds.length}</span> sélectionnée(s)
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={action}
              onChange={(event) => setAction(event.target.value as (typeof BULK_ACTIONS)[number]["value"])}
              disabled={selectedIds.length === 0 || isPending}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-medium text-domify-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {BULK_ACTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <button
              type="button"
              onClick={runBulkAction}
              disabled={selectedIds.length === 0 || isPending}
              className="flex items-center gap-2 rounded-lg bg-domify-primary px-3 py-2 text-xs font-semibold text-white transition-luxury hover:bg-domify-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending && <LoaderCircle size={14} className="animate-spin" />} Appliquer
            </button>
          </div>
        </div>
      )}

      {message && <p className="border-b border-black/7 bg-emerald-50 px-5 py-3 text-sm text-emerald-900">{message}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/5 bg-domify-warm-white/50 text-xs uppercase tracking-wide text-domify-dark/50">
            <tr>
              {!isAgent && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Sélectionner toutes les propriétés"
                    className="h-4 w-4 rounded border-domify-primary/30 text-domify-primary"
                  />
                </th>
              )}
              <th className="px-5 py-3 font-medium">Bien</th>
              <th className="px-5 py-3 font-medium">Ville</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Prix</th>
              <th className="px-5 py-3 font-medium">Vues</th>
              <th className="px-5 py-3 font-medium">Statut</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {properties.length === 0 ? (
              <tr>
                <td colSpan={isAgent ? 7 : 8} className="px-5 py-10 text-center text-domify-dark/50">
                  {isAgent ? "Aucune propriété ne vous est assignée pour le moment." : <>Aucune propriété trouvée. <Link href="/admin/properties/new" className="font-medium text-domify-primary">Créer la première →</Link></>}
                </td>
              </tr>
            ) : properties.map((property) => (
              <tr key={property.id} className="transition-colors hover:bg-domify-warm-white/30">
                {!isAgent && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(property.id)}
                      onChange={() => toggleOne(property.id)}
                      aria-label={`Sélectionner ${property.title}`}
                      className="h-4 w-4 rounded border-domify-primary/30 text-domify-primary"
                    />
                  </td>
                )}
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    {property.featured && <Star size={13} className="text-domify-gold" fill="currentColor" />}
                    <div>
                      <p className="font-medium text-domify-dark">{property.title}</p>
                      <p className="text-xs text-domify-dark/40">{property.reference}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-domify-dark/70">{property.city.name}</td>
                <td className="px-5 py-3 text-domify-dark/70">{property.propertyType.name}</td>
                <td className="px-5 py-3 font-medium text-domify-dark">{formatMAD(property.price)}</td>
                <td className="px-5 py-3 text-domify-dark/60">{property.viewsCount}</td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-domify-warm-white px-2.5 py-1 text-xs font-medium text-domify-dark/70">{STATUS_LABELS[property.status]}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {isAgent ? (
                      <>
                        <Link
                          href={`/admin/properties/${property.id}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-domify-dark/40 hover:bg-domify-warm-white hover:text-domify-primary"
                          aria-label="Modifier ma propriété"
                        >
                          <Pencil size={15} />
                        </Link>
                        <Link
                          href={`/proprietes/${property.id}`}
                          target="_blank"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-domify-dark/40 hover:bg-domify-warm-white hover:text-domify-primary"
                          aria-label="Voir sur le site"
                        >
                          <Eye size={15} />
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href={`/admin/properties/${property.id}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-domify-dark/40 hover:bg-domify-warm-white hover:text-domify-primary"
                          aria-label="Modifier"
                        >
                          <Pencil size={15} />
                        </Link>
                        <DeletePropertyButton id={property.id} title={property.title} />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
