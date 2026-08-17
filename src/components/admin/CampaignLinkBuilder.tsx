"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";

export function CampaignLinkBuilder() {
  const [destination, setDestination] = useState("/");
  const [source, setSource] = useState("instagram");
  const [medium, setMedium] = useState("social");
  const [campaign, setCampaign] = useState("lancement-domify");
  const [copied, setCopied] = useState(false);
  const url = useMemo(() => { const params = new URLSearchParams({ utm_source: source.trim().toLowerCase().replace(/\s+/g, "-"), utm_medium: medium.trim().toLowerCase().replace(/\s+/g, "-"), utm_campaign: campaign.trim().toLowerCase().replace(/\s+/g, "-") }); return `https://domify.ma${destination}${destination.includes("?") ? "&" : "?"}${params.toString()}`; }, [campaign, destination, medium, source]);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><Field label="Destination"><select value={destination} onChange={(event) => setDestination(event.target.value)} className="domify-select"><option value="/">Accueil</option><option value="/proprietes">Catalogue</option><option value="/vendre-louer">Vendre ou louer</option><option value="/tarifs">Tarifs agences</option></select></Field><Field label="Source"><input value={source} onChange={(event) => setSource(event.target.value)} className="domify-select" placeholder="instagram" /></Field><Field label="Medium"><input value={medium} onChange={(event) => setMedium(event.target.value)} className="domify-select" placeholder="social" /></Field><Field label="Campagne"><input value={campaign} onChange={(event) => setCampaign(event.target.value)} className="domify-select" placeholder="lancement-domify" /></Field></div><div className="rounded-xl bg-domify-warm-white p-4 dark:bg-white/5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-domify-dark/45 dark:text-white/45">Lien généré</p><p className="mt-2 break-all font-mono text-xs leading-5 text-domify-primary dark:text-domify-soft-gold">{url}</p><button type="button" onClick={copy} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-domify-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-domify-primary-dark">{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copié" : "Copier le lien"}</button></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-semibold text-domify-dark/60 dark:text-white/60">{label}</span>{children}</label>; }
