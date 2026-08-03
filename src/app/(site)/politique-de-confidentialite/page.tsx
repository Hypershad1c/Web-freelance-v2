import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Domify",
  description: "Comment Domify collecte, utilise et protège vos données personnelles.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-domify-dark">Politique de confidentialité</h1>
      <p className="mt-2 text-sm text-domify-dark/50">Dernière mise à jour : {new Intl.DateTimeFormat("fr-MA", { dateStyle: "long" }).format(new Date())}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-domify-dark/70">
        <Section title="1. Données collectées">
          Nous collectons les données que vous nous transmettez directement : nom, email, téléphone, et le contenu
          de vos messages, lorsque vous créez un compte, ajoutez des favoris, soumettez une demande de contact,
          d&apos;estimation ou de visite.
        </Section>
        <Section title="2. Utilisation des données">
          Vos données sont utilisées pour traiter vos demandes, vous mettre en relation avec les agences et agents
          concernés, gérer votre compte et vos favoris, et améliorer notre service.
        </Section>
        <Section title="3. Partage des données">
          Vos coordonnées ne sont partagées qu&apos;avec l&apos;agence ou l&apos;agent en charge du bien concerné
          par votre demande. Nous ne vendons ni ne louons vos données personnelles à des tiers.
        </Section>
        <Section title="4. Cookies et stockage local">
          Domify utilise le stockage local de votre navigateur pour conserver vos favoris lorsque vous n&apos;êtes
          pas connecté, ainsi que votre session lorsque vous êtes connecté.
        </Section>
        <Section title="5. Vos droits">
          Vous pouvez à tout moment demander l&apos;accès, la correction ou la suppression de vos données
          personnelles en nous contactant via la page Contact.
        </Section>
        <Section title="6. Sécurité">
          Vos mots de passe sont stockés de façon chiffrée. Nous mettons en œuvre des mesures raisonnables pour
          protéger vos données contre tout accès non autorisé.
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-display text-lg font-semibold text-domify-dark">{title}</h2>
      <p>{children}</p>
    </section>
  );
}
