"use client";

import { useActionState } from "react";
import { CheckCircle2, MailCheck, Send, TriangleAlert } from "lucide-react";
import type { NotificationTestState } from "@/lib/actions/settings";

const initialState: NotificationTestState = {};

export function LeadNotificationTestControl({
  action,
}: {
  action: (previousState: NotificationTestState, formData: FormData) => Promise<NotificationTestState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <section className="max-w-4xl rounded-[1.4rem] border border-domify-gold/25 bg-gradient-to-br from-[#fffaf0] to-white p-5 shadow-[0_18px_38px_-32px_rgba(16,47,66,0.5)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-domify-gold/12 text-domify-gold"><MailCheck size={21} /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-domify-gold">Contrôle de notification</p>
            <h2 className="mt-1 font-display text-xl font-semibold text-domify-dark">Tester l’email de nouveau lead</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-domify-dark/62">Envoie un email de test aux administrateurs Domify et à l’adresse de contact configurée. Aucun lead, contact CRM ni donnée client ne sera créé.</p>
          </div>
        </div>
        <form action={formAction}>
          <button type="submit" disabled={pending} className="pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-domify-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_26px_-20px_rgba(16,47,66,0.85)] hover:bg-domify-primary-dark disabled:cursor-wait disabled:opacity-60"><Send size={16} /> {pending ? "Envoi en cours…" : "Envoyer un test"}</button>
        </form>
      </div>
      {state.message && <p className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm leading-5 text-emerald-800"><CheckCircle2 size={17} className="mt-0.5 shrink-0" /> {state.message}</p>}
      {state.error && <p className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm leading-5 text-red-800"><TriangleAlert size={17} className="mt-0.5 shrink-0" /> {state.error}</p>}
    </section>
  );
}
