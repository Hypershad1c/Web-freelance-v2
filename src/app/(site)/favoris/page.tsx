"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Compass, FolderHeart, HeartOff, Plus, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { useFavorites } from "@/lib/favorites-context";
import { PropertyCard } from "@/components/home/PropertyCard";
import type { PropertyWithRelations } from "@/lib/data/properties";

export default function FavoritesPage() {
  const { status } = useSession();
  const { favoriteIds, collections, createCollection, moveFavoriteToCollection } = useFavorites();
  const [properties, setProperties] = useState<PropertyWithRelations[]>([]);
  const [collectionFilter, setCollectionFilter] = useState<string>("all");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (favoriteIds.length === 0) {
      setProperties([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/properties?ids=${favoriteIds.join(",")}`)
      .then((res) => res.json())
      .then(setProperties)
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, [favoriteIds]);

  const visibleProperties = useMemo(() => properties, [properties]);

  async function handleCreateCollection(event: React.FormEvent) {
    event.preventDefault();
    if (!newCollectionName.trim()) return;
    setCreating(true);
    const collection = await createCollection(newCollectionName.trim());
    if (collection) {
      setNewCollectionName("");
      setCollectionFilter(collection.id);
    }
    setCreating(false);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <section className="relative overflow-hidden rounded-[2rem] bg-domify-primary px-6 py-10 text-white shadow-luxury sm:px-10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/15" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl"><p className="luxury-eyebrow text-domify-gold">Votre sélection privée</p><h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Mes favoris</h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/70">Organisez vos adresses préférées par projet, ville ou intention d&apos;achat.</p></div>
          <div className="rounded-2xl border border-white/15 bg-white/8 px-5 py-4"><p className="text-xs uppercase tracking-[0.16em] text-white/55">Biens enregistrés</p><p className="mt-1 font-display text-3xl font-semibold">{loading ? "—" : properties.length}</p></div>
        </div>
      </section>

      <section className="mt-8 flex flex-col gap-4 rounded-[1.5rem] border border-domify-dark/8 bg-domify-warm-white p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-domify-gold/15 text-domify-gold"><FolderHeart size={20} /></div><div><p className="font-semibold text-domify-dark">Collections</p><p className="text-xs text-domify-dark/55">Créez des listes pour mieux comparer vos projets.</p></div></div>
        {status === "authenticated" ? <form onSubmit={handleCreateCollection} className="flex w-full gap-2 sm:max-w-md"><input value={newCollectionName} onChange={(event) => setNewCollectionName(event.target.value)} placeholder="Ex. Villa à Rabat" className="domify-select flex-1" /><button disabled={creating} className="inline-flex items-center gap-2 rounded-xl bg-domify-primary px-4 py-3 text-sm font-semibold text-white transition-luxury hover:bg-domify-primary-dark"><Plus size={16} /> Créer</button></form> : <Link href="/connexion?callbackUrl=/favoris" className="text-sm font-semibold text-domify-primary hover:text-domify-gold">Connectez-vous pour créer des collections →</Link>}
      </section>

      {collections.length > 0 && <div className="mt-6 flex gap-2 overflow-x-auto pb-1"><button onClick={() => setCollectionFilter("all")} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold ${collectionFilter === "all" ? "bg-domify-primary text-white" : "border border-domify-dark/10 text-domify-dark/60"}`}>Tous les favoris</button>{collections.map((collection) => <button key={collection.id} onClick={() => setCollectionFilter(collection.id)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold ${collectionFilter === collection.id ? "bg-domify-gold text-domify-primary" : "border border-domify-dark/10 text-domify-dark/60"}`}>{collection.name}</button>)}</div>}

      {!loading && visibleProperties.length === 0 ? <div className="relative mt-10 overflow-hidden rounded-[1.6rem] border border-domify-dark/8 bg-domify-warm-white p-8 text-center sm:p-14"><div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full border border-domify-gold/25" /><div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-domify-gold shadow-[0_18px_34px_-25px_rgba(16,47,66,0.55)]"><HeartOff size={27} strokeWidth={1.6} /></div><p className="relative mt-6 font-display text-2xl font-semibold text-domify-dark">Votre sélection est prête à commencer.</p><p className="relative mx-auto mt-3 max-w-md text-sm leading-6 text-domify-dark/60">Enregistrez les adresses qui vous inspirent afin de les retrouver, les organiser et les comparer à votre rythme.</p><Link href="/proprietes" className="relative mt-7 inline-flex items-center gap-2 rounded-full bg-domify-primary px-5 py-3 text-sm font-semibold text-white transition-luxury hover:-translate-y-0.5 hover:bg-domify-gold">Explorer les biens <ArrowUpRight size={15} /></Link><Link href="/carte" className="relative ml-3 inline-flex items-center gap-1.5 text-sm font-semibold text-domify-primary hover:text-domify-gold"><Compass size={15} /> Voir la carte</Link></div> : <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{visibleProperties.map((property) => <div key={property.id} className="space-y-3"><PropertyCard property={property} />{status === "authenticated" && collections.length > 0 && <label className="flex items-center gap-2 px-2 text-xs font-semibold text-domify-dark/55"><Sparkles size={14} className="text-domify-gold" /> Organiser<select defaultValue="" onChange={(event) => moveFavoriteToCollection(property.id, event.target.value || null)} className="ml-auto rounded-lg border border-domify-dark/10 bg-white px-2 py-1.5 text-xs"><option value="">Sans collection</option>{collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}</select></label>}</div>)}</div>}
    </div>
  );
}
