import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/i18n/get-locale";

export const metadata: Metadata = {
  title: "FAQ | Domify",
  description: "Questions fréquentes sur l'achat, la location et l'estimation de biens immobiliers avec Domify.",
};

const FAQS = [
  {
    q: "Comment publier un bien sur Domify ?",
    a: "La publication de biens se fait via nos agences partenaires. Si vous êtes un particulier souhaitant vendre ou louer, contactez-nous via la page Contact et nous vous mettrons en relation avec une agence de notre réseau.",
  },
  {
    q: "L'estimation de mon bien est-elle vraiment gratuite ?",
    a: "Oui, l'estimation est entièrement gratuite et sans engagement. Un expert Domify vous recontacte sous 48h avec une estimation détaillée basée sur le marché local.",
  },
  {
    q: "Comment planifier une visite ?",
    a: "Sur chaque page de propriété, cliquez sur « Planifier une visite » pour choisir une date qui vous convient. L'agent en charge du bien vous contactera pour confirmer.",
  },
  {
    q: "Puis-je contacter un agent directement par WhatsApp ?",
    a: "Oui — chaque annonce dispose d'un bouton WhatsApp et d'un bouton d'appel direct pour contacter l'agent ou l'agence en charge du bien.",
  },
  {
    q: "Comment fonctionne la sauvegarde de mes favoris ?",
    a: "Vous pouvez ajouter des biens à vos favoris sans compte (ils sont alors sauvegardés localement sur votre appareil) ou créer un compte Domify pour les retrouver depuis n'importe quel appareil.",
  },
  {
    q: "Les biens affichés sont-ils vérifiés ?",
    a: "Chaque bien publié sur Domify est vérifié par notre équipe avant sa mise en ligne, en lien avec l'agence ou l'agent responsable de l'annonce.",
  },
];

const FAQS_AR = [
  { q: "كيف أنشر عقاراً على دوميفاي؟", a: "يمكنك إنشاء حساب مالك وتقديم عقارك من صفحة البيع أو التأجير. يراجع فريقنا المعلومات والصور والسعر قبل نشر الإعلان." },
  { q: "هل تقييم عقاري مجاني حقاً؟", a: "نعم، التقييم مجاني وبدون التزام. سيتواصل معك خبير من دوميفاي لتقديم تقييم مبني على السوق المحلي." },
  { q: "كيف يمكنني جدولة زيارة؟", a: "من صفحة العقار، استخدم نموذج التواصل أو زر واتساب أو الاتصال المباشر. سيتواصل معك المستشار المسؤول لتأكيد الموعد." },
  { q: "هل يمكنني التواصل مع مستشار مباشرة عبر واتساب؟", a: "نعم، تتضمن الإعلانات المتاحة زر واتساب وزر اتصال مباشر للتواصل مع المستشار أو الوكالة المسؤولة." },
  { q: "كيف يتم حفظ العقارات المفضلة لدي؟", a: "يمكنك إضافة العقارات إلى المفضلة بدون حساب ليتم حفظها محلياً على جهازك، أو إنشاء حساب دوميفاي للوصول إليها من أي جهاز." },
  { q: "هل يتم التحقق من العقارات المعروضة؟", a: "يتحقق فريقنا من كل عقار منشور على دوميفاي بالتعاون مع الوكالة أو المستشار المسؤول عن الإعلان." },
];

const FAQ_COPY = {
  fr: { title: "Questions fréquentes", body: "Tout ce qu’il faut savoir pour utiliser Domify sereinement.", missing: "Vous ne trouvez pas la réponse à votre question ?", contact: "Contactez notre équipe" },
  en: { title: "Frequently asked questions", body: "Everything you need to use Domify with confidence.", missing: "Cannot find the answer to your question?", contact: "Contact our team" },
  ar: { title: "الأسئلة الشائعة", body: "كل ما تحتاج إلى معرفته لاستخدام دوميفاي بثقة.", missing: "لم تجد إجابة لسؤالك؟", contact: "تواصل مع فريقنا" },
} as const;

export default async function FaqPage() {
  const locale = await getLocale();
  const copy = FAQ_COPY[locale];
  const isRtl = locale === "ar";
  const faqs = locale === "ar" ? FAQS_AR : FAQS;
  return (
    <div dir={isRtl ? "rtl" : "ltr"} className={`mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8 ${isRtl ? "text-right" : ""}`}>
      <h1 className="font-display text-3xl font-bold text-domify-dark sm:text-4xl">{copy.title}</h1>
      <p className="mt-2 text-domify-dark/60">{copy.body}</p>

      <div className="mt-10 space-y-4">
        {faqs.map((item) => (
          <details key={item.q} className="group rounded-2xl bg-white p-5 shadow-luxury open:shadow-luxury-hover">
            <summary className="cursor-pointer list-none font-display text-base font-semibold text-domify-dark">
              {item.q}
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-domify-dark/70">{item.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-12 rounded-2xl bg-domify-warm-white p-6 text-center">
        <p className="text-sm text-domify-dark/70">{copy.missing}</p>
        <Link href="/contact" className="mt-2 inline-block text-sm font-semibold text-domify-primary hover:text-domify-gold">
          {copy.contact} <span className={isRtl ? "inline-block -scale-x-100" : "inline-block"}>→</span>
        </Link>
      </div>
    </div>
  );
}
