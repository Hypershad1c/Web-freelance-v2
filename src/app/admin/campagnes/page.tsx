import { Megaphone, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { CampaignLinkBuilder } from "@/components/admin/CampaignLinkBuilder";

export default async function CampaignsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/admin");

  return <><AdminTopbar title="Campagnes UTM" /><main className="admin-page-shell min-w-0 p-4 sm:p-6 lg:p-10"><div className="max-w-4xl"><p className="admin-eyebrow">Acquisition mesurable</p><h1 className="font-display text-3xl font-bold text-domify-dark dark:text-white">Créer des liens de campagne</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-domify-dark/60 dark:text-white/60">Utilisez ce générateur pour Instagram, Google, WhatsApp, TikTok et vos partenaires. Les visites et conversions seront regroupées automatiquement dans Analytics.</p></div><section className="mt-8 rounded-2xl bg-white p-4 shadow-luxury dark:bg-[#102436] sm:p-6"><div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-domify-warm-white text-domify-gold dark:bg-white/10"><Megaphone size={19} /></span><div><h2 className="font-display text-lg font-semibold text-domify-dark dark:text-white">Générateur UTM</h2><p className="text-xs text-domify-dark/50 dark:text-white/50">Les paramètres sont normalisés en minuscules avec des tirets.</p></div></div><CampaignLinkBuilder /></section><section className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><ShieldCheck size={18} className="mt-0.5 shrink-0" /><p>Les campagnes ne stockent pas de données personnelles. Seuls la source, le medium et le nom de campagne sont conservés pour mesurer les performances.</p></section></main></>;
}
