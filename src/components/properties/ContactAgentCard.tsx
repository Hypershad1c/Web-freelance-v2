"use client";

import { useEffect, useState } from "react";
import { Phone, Mail, CalendarClock, X, Building2 } from "lucide-react";
import Image from "next/image";
import type { PropertyWithRelations } from "@/lib/data/properties";
import { telLink } from "@/lib/utils";
import { WhatsAppConciergeButton } from "@/components/properties/WhatsAppConciergeButton";
import { HoneypotField } from "@/components/HoneypotField";
import { Turnstile } from "@/components/Turnstile";
import { getClientAnalyticsAttribution } from "@/lib/client-analytics";

export function ContactAgentCard({ property }: { property: PropertyWithRelations }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: `Bonjour, je suis intéressé(e) par ${property.title} (${property.reference}).`,
  });

  const contactName = property.agent?.name ?? property.agency?.name ?? "Domify";
  const contactPhone = property.agent?.phone ?? property.agency?.phone;
  const contactEmail = property.agent?.email ?? property.agency?.email;
  const contactPhoto = property.agent?.photo;
  const contactSubtitle = property.agent ? property.agency?.name ?? "Domify" : "Équipe Domify";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (honeypot) return; // bot — silently drop
    setSending(true);
    setError(null);
    try {
      const attribution = getClientAnalyticsAttribution();
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, propertyId: property.id, source: "property_detail", utmSource: attribution.source, utmMedium: attribution.medium, utmCampaign: attribution.campaign, referrer: attribution.referrer, website: honeypot, turnstileToken }),
      });
      if (!response.ok) throw new Error();
      setSent(true);
    } catch {
      setError("La demande n’a pas pu être envoyée. Merci de réessayer.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-luxury">
      <div className="flex items-center gap-3">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-domify-warm-white">
          {contactPhoto ? (
            <Image src={contactPhoto} alt={contactName} fill className="object-cover" />
          ) : (
            <Building2 size={18} className="text-domify-primary" />
          )}
        </div>
        <div>
          <p className="font-semibold text-domify-dark">{contactName}</p>
          <p className="text-xs text-domify-dark/60">{contactSubtitle}</p>
        </div>
      </div>

      {(contactPhone || contactEmail) && (
        <div className="mt-4 space-y-2 text-sm text-domify-dark/70">
          {contactPhone && <p className="flex items-center gap-2"><Phone size={14} /> {contactPhone}</p>}
          {contactEmail && <p className="flex items-center gap-2"><Mail size={14} /> {contactEmail}</p>}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <WhatsAppConciergeButton
          propertyId={property.id}
          placement="detail"
          variant="prominent"
          className={contactPhone ? "flex-1" : "w-full"}
        />
        {contactPhone && (
          <a
            href={telLink(contactPhone)}
            className="pressable flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-domify-primary/10 py-2.5 text-sm font-semibold text-domify-primary hover:bg-domify-primary hover:text-white"
          >
            <Phone size={14} /> Appeler
          </a>
        )}
      </div>

      <button
        onClick={() => setShowBooking(true)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-domify-primary py-2.5 text-sm font-semibold text-domify-primary transition-luxury hover:bg-domify-primary hover:text-white"
      >
        <CalendarClock size={16} /> Planifier une visite
      </button>

      <div className="my-5 h-px bg-black/5" />

      {sent ? (
        <p className="rounded-xl bg-domify-warm-white p-4 text-sm text-domify-dark">
          Merci ! Votre demande a bien été envoyée, {contactName.split(" ")[0]} vous recontactera rapidement.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <HoneypotField value={honeypot} onChange={setHoneypot} />
          <input
            required
            placeholder="Nom complet"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm"
          />
          <input
            placeholder="Téléphone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm"
          />
          <textarea
            required
            rows={3}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm"
          />
          <Turnstile action="lead" onTokenChange={setTurnstileToken} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={sending || (Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) && !turnstileToken)}
            className="w-full rounded-xl bg-domify-gold py-2.5 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-soft-gold hover:text-domify-dark disabled:opacity-60"
          >
            {sending ? "Envoi..." : "Contacter l'agent"}
          </button>
        </form>
      )}

      {showBooking && (
        <BookingModal property={property} agentName={contactName} onClose={() => setShowBooking(false)} />
      )}
    </div>
  );
}

type AvailabilitySlot = { id: string; startsAt: string; endsAt: string; location: string | null; remaining: number };

function BookingModal({ property, agentName, onClose }: { property: PropertyWithRelations; agentName: string; onClose: () => void }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(Boolean(property.agentId));
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", date: "", notes: "" });

  useEffect(() => {
    if (!property.agentId) return;
    let cancelled = false;
    fetch(`/api/availability?propertyId=${encodeURIComponent(property.id)}`).then(async (response) => {
      const payload = await response.json().catch(() => ({ slots: [] }));
      if (!cancelled) setSlots(Array.isArray(payload.slots) ? payload.slots : []);
    }).catch(() => { if (!cancelled) setSlots([]); }).finally(() => { if (!cancelled) setSlotsLoading(false); });
    return () => { cancelled = true; };
  }, [property.agentId, property.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (honeypot) return;
    const selectedSlot = slots.find((slot) => slot.id === selectedSlotId);
    if (!selectedSlot && !form.date) { setError("Choisissez un créneau ou une date de visite."); return; }
    setSending(true); setError(null);
    try {
      const attribution = getClientAnalyticsAttribution();
      const response = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, date: selectedSlot?.startsAt || form.date, availabilitySlotId: selectedSlot?.id, propertyId: property.id, agentId: property.agentId ?? undefined, source: selectedSlot ? "availability_booking" : "property_detail", utmSource: attribution.source, utmMedium: attribution.medium, utmCampaign: attribution.campaign, website: honeypot, turnstileToken }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "La demande n’a pas pu être envoyée.");
      setSent(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "La demande de visite n’a pas pu être envoyée. Merci de réessayer."); } finally { setSending(false); }
  }

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-domify-dark/50 p-4"><div className="relative max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-luxury"><button onClick={onClose} className="absolute right-4 top-4 text-domify-dark/40 hover:text-domify-dark" aria-label="Fermer"><X size={18} /></button><h3 className="font-display text-xl font-semibold text-domify-dark">Planifier une visite</h3><p className="mt-1 text-sm text-domify-dark/60">{property.title} — {property.city.name}</p>{sent ? <p className="mt-6 rounded-xl bg-domify-warm-white p-4 text-sm text-domify-dark">Votre demande de visite a été envoyée à {agentName}. Vous recevrez une confirmation par email.</p> : <form onSubmit={handleSubmit} className="mt-6 space-y-3"><HoneypotField value={honeypot} onChange={setHoneypot} /><input required placeholder="Nom complet" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm" /><input required type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm" /><input placeholder="Téléphone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm" />{slotsLoading ? <p className="rounded-lg bg-domify-warm-white p-3 text-sm text-domify-dark/60">Chargement des disponibilités…</p> : slots.length > 0 ? <fieldset><legend className="mb-2 text-sm font-semibold text-domify-dark">Choisissez un créneau disponible</legend><select required value={selectedSlotId} onChange={(event) => setSelectedSlotId(event.target.value)} className="w-full rounded-lg border border-domify-primary/20 bg-domify-warm-white px-3 py-2.5 text-sm text-domify-dark"><option value="">Sélectionner un créneau</option>{slots.map((slot) => <option key={slot.id} value={slot.id}>{new Intl.DateTimeFormat("fr-MA", { dateStyle: "full", timeStyle: "short" }).format(new Date(slot.startsAt))}{slot.location ? ` · ${slot.location}` : ""}</option>)}</select></fieldset> : <fieldset><label className="mb-2 block text-sm font-semibold text-domify-dark">Date souhaitée</label><input required type="datetime-local" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm" /><p className="mt-1 text-xs text-domify-dark/50">Votre demande sera confirmée selon l’agenda du conseiller.</p></fieldset>}<textarea rows={2} placeholder="Notes (optionnel)" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm" /><Turnstile action="appointment" onTokenChange={setTurnstileToken} />{error && <p className="text-sm text-red-600">{error}</p>}<button type="submit" disabled={sending || (Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) && !turnstileToken)} className="w-full rounded-xl bg-domify-primary py-2.5 text-sm font-semibold text-white transition-luxury hover:bg-domify-primary-dark disabled:opacity-60">{sending ? "Envoi..." : selectedSlotId ? "Réserver ce créneau" : "Confirmer la demande"}</button></form>}</div></div>;
}
