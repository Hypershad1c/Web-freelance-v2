"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCheck, Loader2, Mail, MessageCircle, RefreshCw, Send, ShieldCheck } from "lucide-react";

type PropertyOption = { id: string; title: string; reference: string };
type Conversation = {
  id: string;
  status: "OPEN" | "CLOSED";
  subject: string | null;
  lastMessageAt: string;
  property: { id: string; title: string; reference: string; agent?: { name: string; userId: string | null } | null };
  owner: { id: string; name: string | null; email: string };
  assignedAgent: { id: string; name: string; email: string } | null;
  unreadCount?: number;
};
type PortalMessage = { id: string; body: string; readAt: string | null; createdAt: string; sender: { id: string; name: string | null; role: string } };
type ConversationDetail = Conversation & { messages: PortalMessage[] };

export function PortalMessaging({ mode, properties = [] }: { mode: "owner" | "staff"; properties?: PropertyOption[] }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<ConversationDetail | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [subject, setSubject] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const propertyWithoutConversation = useMemo(
    () => properties.filter((property) => !conversations.some((conversation) => conversation.property.id === property.id)),
    [conversations, properties]
  );

  const loadConversations = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/portal/conversations", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de charger les conversations.");
      setConversations(data.conversations || []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Impossible de charger les conversations.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    setError("");
    try {
      const response = await fetch(`/api/portal/conversations/${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Conversation introuvable.");
      setActive(data.conversation);
      await fetch(`/api/portal/conversations/${encodeURIComponent(id)}`, { method: "PATCH" });
      setConversations((current) => current.map((conversation) => conversation.id === id ? { ...conversation, unreadCount: 0 } : conversation));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Impossible de charger cette conversation.");
    }
  }, []);

  useEffect(() => {
    void loadConversations();
    const timer = window.setInterval(() => void loadConversations(), 15000);
    return () => window.clearInterval(timer);
  }, [loadConversations]);

  async function createConversation() {
    if (!selectedPropertyId) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/portal/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: selectedPropertyId, subject: subject.trim() || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible d’ouvrir la conversation.");
      setSelectedPropertyId("");
      setSubject("");
      await loadConversations();
      await loadConversation(data.conversation.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Impossible d’ouvrir la conversation.");
    } finally {
      setSending(false);
    }
  }

  async function sendMessage() {
    if (!active || !draft.trim()) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch(`/api/portal/conversations/${encodeURIComponent(active.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible d’envoyer le message.");
      setDraft("");
      await loadConversation(active.id);
      await loadConversations();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Impossible d’envoyer le message.");
    } finally {
      setSending(false);
    }
  }

  const emptyLabel = mode === "owner" ? "Aucune conversation pour le moment." : "Aucun échange propriétaire à traiter.";

  return (
    <section className="mt-8 rounded-[1.45rem] border border-domify-dark/8 bg-white p-5 shadow-[0_20px_42px_-34px_rgba(16,47,66,0.45)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="luxury-eyebrow text-domify-gold">Messagerie sécurisée</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-domify-dark">Échangez directement autour du bien</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-domify-dark/60">Les messages restent liés à la propriété et accessibles uniquement aux participants autorisés.</p>
        </div>
        <button type="button" onClick={() => void loadConversations()} className="inline-flex w-fit items-center gap-2 rounded-xl border border-domify-dark/10 px-3 py-2 text-xs font-semibold text-domify-dark hover:bg-domify-warm-white" aria-label="Actualiser les conversations"><RefreshCw size={14} /> Actualiser</button>
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {mode === "owner" && propertyWithoutConversation.length > 0 && (
        <div className="mt-6 rounded-2xl bg-domify-warm-white/75 p-4 sm:p-5">
          <div className="flex items-start gap-3"><MessageCircle className="mt-0.5 shrink-0 text-domify-gold" size={20} /><div><p className="font-semibold text-domify-dark">Besoin d’un conseiller ?</p><p className="mt-1 text-sm leading-6 text-domify-dark/60">Ouvrez une conversation liée à l’un de vos dépôts pour poser une question ou transmettre une précision.</p></div></div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <select value={selectedPropertyId} onChange={(event) => setSelectedPropertyId(event.target.value)} className="rounded-xl border border-domify-dark/10 bg-white px-3 py-3 text-sm text-domify-dark outline-none focus:border-domify-gold" aria-label="Choisir un bien">
              <option value="">Choisir un bien</option>
              {propertyWithoutConversation.map((property) => <option key={property.id} value={property.id}>{property.title} · {property.reference}</option>)}
            </select>
            <input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={160} placeholder="Objet (facultatif)" className="rounded-xl border border-domify-dark/10 bg-white px-3 py-3 text-sm text-domify-dark outline-none placeholder:text-domify-dark/35 focus:border-domify-gold" />
            <button type="button" disabled={!selectedPropertyId || sending} onClick={() => void createConversation()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-domify-primary px-4 py-3 text-sm font-semibold text-white hover:bg-domify-primary-dark disabled:cursor-not-allowed disabled:opacity-50">{sending ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />} Ouvrir</button>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.2fr)]">
        <div className="space-y-2">
          {loading ? <div className="flex items-center gap-2 rounded-2xl bg-domify-warm-white p-5 text-sm text-domify-dark/60"><Loader2 className="animate-spin" size={16} /> Chargement…</div> : conversations.length === 0 ? <div className="rounded-2xl bg-domify-warm-white p-5 text-sm leading-6 text-domify-dark/60">{emptyLabel}</div> : conversations.map((conversation) => <button type="button" key={conversation.id} onClick={() => void loadConversation(conversation.id)} className={`w-full rounded-2xl border p-4 text-start transition-colors ${active?.id === conversation.id ? "border-domify-gold bg-domify-warm-white" : "border-domify-dark/8 bg-white hover:bg-domify-warm-white/60"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-domify-dark">{conversation.property.title}</p><p className="mt-1 truncate text-xs text-domify-dark/50">{mode === "staff" ? (conversation.owner.name || conversation.owner.email) : (conversation.assignedAgent?.name || "Équipe Domify")} · {conversation.property.reference}</p></div>{Boolean(conversation.unreadCount) && <span className="rounded-full bg-domify-gold px-2 py-0.5 text-[0.68rem] font-bold text-white">{conversation.unreadCount}</span>}</div><p className="mt-3 text-[0.68rem] text-domify-dark/45">{new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(conversation.lastMessageAt))}</p></button>)}
        </div>

        <div className="flex min-h-[360px] flex-col rounded-2xl border border-domify-dark/8 bg-domify-warm-white/45">
          {!active ? <div className="flex flex-1 flex-col items-center justify-center p-8 text-center"><MessageCircle className="text-domify-gold" size={30} /><p className="mt-4 font-display text-xl font-semibold text-domify-dark">Sélectionnez une conversation</p><p className="mt-2 max-w-sm text-sm leading-6 text-domify-dark/55">Votre historique et votre réponse apparaîtront ici.</p></div> : <>
            <div className="border-b border-domify-dark/8 bg-white/70 px-4 py-4 sm:px-5"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-domify-dark">{active.property.title}</p><p className="mt-1 text-xs text-domify-dark/55">{active.property.reference} · {mode === "staff" ? (active.owner.name || active.owner.email) : (active.assignedAgent?.name || "Équipe Domify")}</p></div><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-semibold text-emerald-700"><ShieldCheck size={12} /> {active.status === "OPEN" ? "Ouverte" : "Fermée"}</span></div>{active.subject && <p className="mt-2 text-sm text-domify-dark/60">{active.subject}</p>}</div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">{active.messages.length === 0 ? <p className="py-8 text-center text-sm text-domify-dark/50">Commencez la conversation.</p> : active.messages.map((message) => { const mine = mode === "owner" ? message.sender.role === "USER" : message.sender.role !== "USER"; return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 ${mine ? "rounded-br-md bg-domify-primary text-white" : "rounded-bl-md bg-white text-domify-dark shadow-sm"}`}><p className="whitespace-pre-wrap">{message.body}</p><p className={`mt-1 flex items-center justify-end gap-1 text-[0.65rem] ${mine ? "text-white/65" : "text-domify-dark/40"}`}>{new Intl.DateTimeFormat("fr-MA", { dateStyle: "short", timeStyle: "short" }).format(new Date(message.createdAt))}{mine && <CheckCheck size={12} />}</p></div></div>; })}</div>
            {active.status === "OPEN" && <form onSubmit={(event) => { event.preventDefault(); void sendMessage(); }} className="border-t border-domify-dark/8 bg-white/70 p-3 sm:p-4"><div className="flex items-end gap-2"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={4000} rows={2} placeholder="Écrire un message…" className="min-h-12 flex-1 resize-none rounded-xl border border-domify-dark/10 bg-white px-3 py-3 text-sm text-domify-dark outline-none placeholder:text-domify-dark/35 focus:border-domify-gold" aria-label="Votre message" /><button type="submit" disabled={!draft.trim() || sending} className="inline-flex h-12 shrink-0 items-center justify-center rounded-xl bg-domify-primary px-4 text-white hover:bg-domify-primary-dark disabled:cursor-not-allowed disabled:opacity-50" aria-label="Envoyer le message">{sending ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />}</button></div><p className="mt-2 text-[0.68rem] text-domify-dark/40">Ne partagez jamais de codes de connexion ou d’informations bancaires dans cette conversation.</p></form>}
          </>}
        </div>
      </div>
    </section>
  );
}
