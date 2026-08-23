"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, CheckCircle2 } from "lucide-react";
import { HoneypotField } from "@/components/HoneypotField";
import { Turnstile } from "@/components/Turnstile";
import type { Locale } from "@/i18n/locales";

type ContactSettings = {
  phone: string;
  email: string;
  address: string;
};

const CONTACT_COPY = {
  fr: { eyebrow: "Une équipe à votre écoute", title: "Contactez-nous", subtitle: "Une question, un projet ? Notre équipe vous répond rapidement.", phone: "Téléphone", email: "Email", address: "Adresse", noDetailsTitle: "Parlons de votre projet", noDetailsBody: "Utilisez le formulaire pour nous indiquer vos critères. Notre équipe vous répondra rapidement.", sentTitle: "Message envoyé !", sentBody: "Nous vous répondrons dans les plus brefs délais.", name: "Nom complet", subject: "Sujet", message: "Votre message", error: "Une erreur est survenue. Merci de réessayer.", sending: "Envoi...", submit: "Envoyer le message" },
  en: { eyebrow: "A team ready to listen", title: "Contact us", subtitle: "A question or project? Our team will get back to you promptly.", phone: "Phone", email: "Email", address: "Address", noDetailsTitle: "Let’s discuss your project", noDetailsBody: "Use the form to tell us your criteria. Our team will respond promptly.", sentTitle: "Message sent!", sentBody: "We will get back to you as soon as possible.", name: "Full name", subject: "Subject", message: "Your message", error: "Something went wrong. Please try again.", sending: "Sending...", submit: "Send message" },
  ar: { eyebrow: "فريق يصغي إليك", title: "تواصل معنا", subtitle: "لديك سؤال أو مشروع؟ سيرد عليك فريقنا بسرعة.", phone: "الهاتف", email: "البريد الإلكتروني", address: "العنوان", noDetailsTitle: "لنتحدث عن مشروعك", noDetailsBody: "استخدم النموذج لإخبارنا بمعاييرك. سيرد فريقنا بسرعة.", sentTitle: "تم إرسال الرسالة!", sentBody: "سنرد عليك في أقرب وقت.", name: "الاسم الكامل", subject: "الموضوع", message: "رسالتك", error: "حدث خطأ. يرجى المحاولة مرة أخرى.", sending: "جارٍ الإرسال...", submit: "أرسل الرسالة" },
} as const;

export function ContactForm({ settings, locale = "fr" }: { settings: ContactSettings; locale?: Locale }) {
  const copy = CONTACT_COPY[locale];
  const isRtl = locale === "ar";
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", subject: "", body: "" });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (honeypot) return;

    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, website: honeypot, turnstileToken }),
      });
      if (!response.ok) throw new Error("Message request failed");
      setSent(true);
    } catch {
      setError(copy.error);
    } finally {
      setSending(false);
    }
  }

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className={`mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 ${isRtl ? "text-right" : ""}`}>
      <div className="text-center">
        <p className="luxury-eyebrow text-domify-gold">{copy.eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-domify-dark sm:text-5xl">{copy.title}</h1>
        <p className="mt-3 text-domify-dark/60">{copy.subtitle}</p>
      </div>

      <div className={`mt-12 grid grid-cols-1 gap-10 ${isRtl ? "lg:grid-cols-[1.2fr_0.9fr]" : "lg:grid-cols-[0.9fr_1.2fr]"}`}>
        <div className="space-y-5 rounded-[1.5rem] bg-domify-warm-white/70 p-6 sm:p-8">
          {settings.phone || settings.email || settings.address ? (
            <>
              {settings.phone && <ContactInfo icon={Phone} label={copy.phone} value={settings.phone} href={`tel:${settings.phone.replace(/\s/g, "")}`} />}
              {settings.email && <ContactInfo icon={Mail} label={copy.email} value={settings.email} href={`mailto:${settings.email}`} />}
              {settings.address && <ContactInfo icon={MapPin} label={copy.address} value={settings.address} />}
            </>
          ) : (
            <div className="py-5">
              <p className="font-display text-2xl font-semibold text-domify-dark">{copy.noDetailsTitle}</p>
              <p className="mt-3 text-sm leading-6 text-domify-dark/60">{copy.noDetailsBody}</p>
            </div>
          )}
        </div>

        <div className="admin-panel rounded-[1.5rem] p-6 sm:p-8">
          {sent ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CheckCircle2 className="text-domify-gold" size={38} />
              <p className="mt-4 font-display text-xl font-semibold text-domify-dark">{copy.sentTitle}</p>
              <p className="mt-1 text-sm text-domify-dark/60">{copy.sentBody}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <HoneypotField value={honeypot} onChange={setHoneypot} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input required placeholder={copy.name} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="domify-select" />
                <input required type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="domify-select" />
              </div>
              <input placeholder={copy.subject} value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} className="domify-select" />
              <textarea required rows={5} placeholder={copy.message} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} className="min-h-32 w-full rounded-[0.9rem] border border-domify-dark/11 bg-white px-4 py-3 text-sm text-domify-dark transition-luxury placeholder:text-domify-muted/70 focus:border-domify-secondary focus:outline-none focus:ring-4 focus:ring-domify-secondary/15" />
              <Turnstile action="contact" onTokenChange={setTurnstileToken} />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={sending || (Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) && !turnstileToken)} className="pressable inline-flex rounded-xl bg-domify-gold px-6 py-3 text-sm font-semibold text-white shadow-luxury hover:bg-domify-soft-gold hover:text-domify-dark disabled:opacity-60">
                {sending ? copy.sending : copy.submit}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactInfo({ icon: Icon, label, value, href }: { icon: typeof Mail; label: string; value: string; href?: string }) {
  const content = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-domify-gold shadow-[0_10px_20px_-18px_rgba(16,47,66,0.55)]">
        <Icon size={18} />
      </span>
      <span>
        <span className="block text-sm font-semibold text-domify-dark">{label}</span>
        <span className="mt-1 block text-sm leading-6 text-domify-dark/60">{value}</span>
      </span>
    </>
  );

  return href ? <a href={href} className="pressable flex items-start gap-3 rounded-xl p-2 hover:bg-white/75">{content}</a> : <div className="flex items-start gap-3 p-2">{content}</div>;
}
