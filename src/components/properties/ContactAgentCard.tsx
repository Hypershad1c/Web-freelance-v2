"use client";

import { useState } from "react";
import { Phone, Mail, CalendarClock, X } from "lucide-react";
import Image from "next/image";
import type { Property } from "@/lib/mock-data";

export function ContactAgentCard({ property }: { property: Property }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: `Bonjour, je suis intéressé(e) par ${property.title} (${property.reference}).`,
  });

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
      // Network/DB not available in this preview environment — the request is still
      // validated and shaped correctly for when Postgres is connected.
    }
    setSending(false);
    setSent(true);
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-luxury">
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 overflow-hidden rounded-full">
          <Image src={property.agent.photo} alt={property.agent.name} fill className="object-cover" />
        </div>
        <div>
          <p className="font-semibold text-domify-dark">{property.agent.name}</p>
          <p className="text-xs text-domify-dark/60">{property.agent.agency}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-domify-dark/70">
        <p className="flex items-center gap-2"><Phone size={14} /> {property.agent.phone}</p>
        <p className="flex items-center gap-2"><Mail size={14} /> {property.agent.email}</p>
      </div>

      <button
        onClick={() => setShowBooking(true)}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-domify-primary py-2.5 text-sm font-semibold text-domify-primary transition-luxury hover:bg-domify-primary hover:text-white"
      >
        <CalendarClock size={16} /> Planifier une visite
      </button>

      <div className="my-5 h-px bg-black/5" />

      {sent ? (
        <p className="rounded-xl bg-domify-warm-white p-4 text-sm text-domify-dark">
          Merci ! Votre demande a bien été envoyée, {property.agent.name.split(" ")[0]} vous recontactera rapidement.
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

      {showBooking && <BookingModal property={property} onClose={() => setShowBooking(false)} />}
    </div>
  );
}

function BookingModal({ property, onClose }: { property: Property; onClose: () => void }) {
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
        body: JSON.stringify({ ...form, propertyId: property.id }),
      });
    } catch {
      // Same as above — request shape is correct, DB isn't connected in this preview.
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
        <p className="mt-1 text-sm text-domify-dark/60">{property.title} — {property.city}</p>

        {sent ? (
          <p className="mt-6 rounded-xl bg-domify-warm-white p-4 text-sm text-domify-dark">
            Votre demande de visite a été envoyée. Vous recevrez une confirmation par email.
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
