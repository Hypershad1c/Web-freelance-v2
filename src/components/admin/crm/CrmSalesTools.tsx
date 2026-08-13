"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Handshake, LoaderCircle, MessageCircleMore, Store } from "lucide-react";
import { addCrmDocument, createCrmOffer, createCrmSellerCase, logCrmCommunication, updateCrmOfferStatus } from "@/lib/actions/crm-operations";

type Deal = { id: string; title: string };
type Property = { id: string; title: string; reference: string };
type SellerCase = { id: string; title: string };
type Offer = { id: string; amount: number; status: string; property?: { title: string } | null; sellerCase?: { title: string } | null };

function useFormAction(action: (data: FormData) => Promise<void>) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function submit(data: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await action(data);
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Action impossible");
      }
    });
  }
  return { pending, error, submit };
}

export function CrmSalesTools({ contactId, deals, properties, sellerCases, offers }: { contactId: string; deals: Deal[]; properties: Property[]; sellerCases: SellerCase[]; offers: Offer[] }) {
  const comm = useFormAction((data) => logCrmCommunication(contactId, data));
  const doc = useFormAction((data) => addCrmDocument(contactId, data));
  const seller = useFormAction((data) => createCrmSellerCase(contactId, data));
  const offer = useFormAction((data) => createCrmOffer(contactId, data));

  return <section className="grid gap-5">
    <Tool title="Journal des échanges" icon={MessageCircleMore}>
      <form action={comm.submit} className="grid gap-3">
        <div className="grid grid-cols-2 gap-3"><select name="channel" className="domify-select"><option value="PHONE">Appel</option><option value="EMAIL">Email</option><option value="WHATSAPP">WhatsApp</option><option value="SMS">SMS</option><option value="IN_APP">Interne</option></select><select name="direction" className="domify-select"><option value="OUTBOUND">Sortant</option><option value="INBOUND">Entrant</option></select></div>
        <input name="subject" className="domify-select" placeholder="Objet facultatif" />
        <select name="dealId" className="domify-select"><option value="">Sans opportunité</option>{deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.title}</option>)}</select>
        <textarea name="body" required rows={3} className="rounded-xl border border-domify-dark/10 px-3 py-2 text-sm" placeholder="Résumez l’échange, le résultat et la prochaine action…" />
        {comm.error && <p className="text-xs text-red-700">{comm.error}</p>}<Submit pending={comm.pending} label="Enregistrer l’échange" />
      </form>
    </Tool>

    <Tool title="Offres & négociation" icon={Handshake}>
      {deals.length === 0 || properties.length === 0 ? <p className="rounded-xl bg-domify-warm-white p-3 text-xs leading-5 text-domify-dark/60">Créez d’abord une opportunité et associez un bien pour enregistrer une offre structurée.</p> : <form action={offer.submit} className="grid gap-3">
        <input name="amount" required type="number" min="1" className="domify-select" placeholder="Montant de l’offre (MAD)" />
        <select name="dealId" required className="domify-select"><option value="">Opportunité associée</option>{deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.title}</option>)}</select>
        <select name="propertyId" required className="domify-select"><option value="">Bien concerné</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.reference} — {property.title}</option>)}</select>
        <select name="sellerCaseId" className="domify-select"><option value="">Sans dossier vendeur</option>{sellerCases.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
        <input name="expiresAt" type="date" className="domify-select" aria-label="Date limite de l’offre" />
        <textarea name="conditions" rows={2} className="rounded-xl border border-domify-dark/10 px-3 py-2 text-sm" placeholder="Conditions ou réserves de l’offre" />
        <textarea name="message" rows={2} className="rounded-xl border border-domify-dark/10 px-3 py-2 text-sm" placeholder="Note interne" />
        {offer.error && <p className="text-xs text-red-700">{offer.error}</p>}<Submit pending={offer.pending} label="Enregistrer l’offre" />
      </form>}
      {offers.length > 0 && <div className="mt-5 space-y-2 border-t border-domify-dark/8 pt-4">{offers.slice(0, 6).map((item) => <OfferRow key={item.id} offer={item} />)}</div>}
    </Tool>

    <Tool title="Coffre documentaire" icon={FileUp}>
      <form action={doc.submit} className="grid gap-3"><input name="name" required className="domify-select" placeholder="Nom du document" /><input name="url" required type="url" className="domify-select" placeholder="URL sécurisée du document" /><select name="type" className="domify-select"><option value="IDENTITY">Identité</option><option value="MANDATE">Mandat</option><option value="TITLE_DEED">Titre de propriété</option><option value="FINANCING">Financement</option><option value="OFFER">Offre</option><option value="CONTRACT">Contrat</option><option value="OTHER">Autre</option></select><select name="dealId" className="domify-select"><option value="">Sans opportunité</option>{deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.title}</option>)}</select><select name="propertyId" className="domify-select"><option value="">Sans bien</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.reference} — {property.title}</option>)}</select><textarea name="notes" rows={2} className="rounded-xl border border-domify-dark/10 px-3 py-2 text-sm" placeholder="Note interne" />{doc.error && <p className="text-xs text-red-700">{doc.error}</p>}<Submit pending={doc.pending} label="Ajouter au coffre" /></form>
    </Tool>

    <Tool title="Parcours vendeur" icon={Store}>
      <form action={seller.submit} className="grid gap-3"><input name="title" required className="domify-select" placeholder="Ex. Vente villa à Souissi" /><input name="estimatedValue" type="number" min="0" className="domify-select" placeholder="Estimation (MAD)" /><select name="propertyId" className="domify-select"><option value="">Bien à créer ou non rattaché</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.reference} — {property.title}</option>)}</select><input name="nextActionAt" type="datetime-local" className="domify-select" /><textarea name="notes" rows={2} className="rounded-xl border border-domify-dark/10 px-3 py-2 text-sm" placeholder="Contexte de la valorisation ou du mandat" />{seller.error && <p className="text-xs text-red-700">{seller.error}</p>}<Submit pending={seller.pending} label="Ouvrir le dossier vendeur" /></form>
    </Tool>
  </section>;
}

function OfferRow({ offer }: { offer: Offer }) {
  const update = useFormAction((data) => updateCrmOfferStatus(offer.id, String(data.get("status"))));
  return <div className="rounded-xl bg-domify-warm-white/80 p-3"><div className="flex items-start justify-between gap-2"><div><p className="font-semibold text-domify-dark">{new Intl.NumberFormat("fr-MA").format(offer.amount)} MAD</p><p className="mt-1 text-xs text-domify-dark/55">{offer.property?.title || offer.sellerCase?.title || "Offre Domify"}</p></div><span className="rounded-full bg-white px-2 py-1 text-[0.62rem] font-bold text-domify-primary">{offer.status}</span></div><form action={update.submit} className="mt-3 flex gap-2"><select name="status" defaultValue={offer.status} className="min-w-0 flex-1 rounded-lg border border-domify-dark/10 bg-white px-2 py-1.5 text-xs"><option value="SUBMITTED">Reçue</option><option value="COUNTERED">Contre-proposition</option><option value="ACCEPTED">Acceptée</option><option value="DECLINED">Refusée</option><option value="WITHDRAWN">Retirée</option><option value="EXPIRED">Expirée</option></select><button disabled={update.pending} className="rounded-lg bg-domify-primary px-2.5 py-1.5 text-xs font-semibold text-white">{update.pending ? "…" : "Mettre à jour"}</button></form>{update.error && <p className="mt-2 text-xs text-red-700">{update.error}</p>}</div>;
}

function Tool({ title, icon: Icon, children }: { title: string; icon: typeof Store; children: React.ReactNode }) { return <article className="rounded-[1.35rem] border border-domify-dark/8 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-domify-primary"><Icon size={18} /><h2 className="font-display text-xl font-semibold">{title}</h2></div><div className="mt-4">{children}</div></article>; }
function Submit({ pending, label }: { pending: boolean; label: string }) { return <button disabled={pending} className="pressable rounded-xl bg-domify-primary px-4 py-3 text-sm font-semibold text-white">{pending && <LoaderCircle size={14} className="mr-2 inline animate-spin" />}{label}</button>; }
