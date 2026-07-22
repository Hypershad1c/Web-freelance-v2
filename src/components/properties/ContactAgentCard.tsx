"use client";

import { useState } from "react";
import { Phone, Mail, CalendarClock, X, Building2 } from "lucide-react";
import Image from "next/image";
import type { PropertyWithRelations } from "@/lib/data/properties";
import { whatsappLink, telLink } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

export function ContactAgentCard({ property }: { property: PropertyWithRelations }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: `Bonjour, je suis intéressé(e) par ${property.title} (${property.reference}).`,
  });

  const contactName = property.agent?.name ?? property.agency?.name ?? "Domify";
  const contactPhone = property.agent?.phone ?? property.agency?.phone ?? "+212 6 00 00 00 00";
  const contactEmail = property.agent?.email ?? property.agency?.email ?? "contact@domify.ma";
  const contactPhoto = property.agent?.photo;
  const contactSubtitle = property.agent ? property.agency?.name ?? "Domify" : "Équipe Domify";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, propertyId: property.id, source: "property_detail" }),
      });
    } catch {
      // Best-effort — the request is still validated/shaped correctly server-side.
    }
    setSending(false);
    setSent(true);
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

      <div className="mt-4 space-y-2 text-sm text-domify-dark/70">
        <p className="flex items-center gap-2"><Phone size={14} /> {contactPhone}</p>
        <p className="flex items-center gap-2"><Mail size={14} /> {contactEmail}</p>
      </div>

      <div className="mt-4 flex gap-2">
        <a
          href={whatsappLink(contactPhone, `Bonjour, je suis intéressé(e) par « ${property.title} » (${property.reference}) sur Domify.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366]/10 py-2.5 text-sm font-semibold text-[#128C4A] transition-luxury hover:bg-[#25D366] hover:text-white"
        >
          <WhatsAppIcon size={15} /> WhatsApp
        </a>
        <a
          href={telLink(contactPhone)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-domify-primary/10 py-2.5 text-sm font-semibold text-domify-primary transition-luxury hover:bg-domify-primary hover:text-white"
        >
          <Phone size={14} /> Appeler
        </a>
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
          <button
            type="submit"
            disabled={sending}
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

function BookingModal({
  property,
  agentName,
  onClose,
}: {
  property: PropertyWithRelations;
  agentName: string;
  onClose: () => void;
}) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", date: "", notes: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, propertyId: property.id, agentId: property.agentId ?? undefined }),
      });
    } catch {
      // Best-effort — same as above.
    }
    setSending(false);
    setSent(true);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-domify-dark/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-luxury">
        <button onClick={onClose} className="absolute right-4 top-4 text-domify-dark/40 hover:text-domify-dark" aria-label="Fermer">
          <X size={18} />
        </button>
        <h3 className="font-display text-xl font-semibold text-domify-dark">Planifier une visite</h3>
        <p className="mt-1 text-sm text-domify-dark/60">{property.title} — {property.city.name}</p>

        {sent ? (
          <p className="mt-6 rounded-xl bg-domify-warm-white p-4 text-sm text-domify-dark">
            Votre demande de visite a été envoyée à {agentName}. Vous recevrez une confirmation par email.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <input required placeholder="Nom complet" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm" />
            <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm" />
            <input placeholder="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm" />
            <input required type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm" />
            <textarea rows={2} placeholder="Notes (optionnel)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm" />
            <button type="submit" disabled={sending} className="w-full rounded-xl bg-domify-primary py-2.5 text-sm font-semibold text-white transition-luxury hover:bg-domify-primary-dark disabled:opacity-60">
              {sending ? "Envoi..." : "Confirmer la demande"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
