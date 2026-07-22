import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales | Domify",
  description: "Conditions générales d'utilisation de la plateforme Domify.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-domify-dark">Conditions générales d&apos;utilisation</h1>
      <p className="mt-2 text-sm text-domify-dark/50">Dernière mise à jour : {new Intl.DateTimeFormat("fr-MA", { dateStyle: "long" }).format(new Date())}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-domify-dark/70">
        <Section title="1. Objet">
          Les présentes conditions générales régissent l&apos;utilisation de la plateforme Domify, service de mise
          en relation entre particuliers, agences et agents immobiliers au Maroc.
        </Section>
        <Section title="2. Accès au service">
          L&apos;accès à la consultation des annonces est libre et gratuit. La création d&apos;un compte est
          nécessaire pour sauvegarder des favoris de façon permanente, soumettre certaines demandes, ou accéder à
          l&apos;espace back-office pour les utilisateurs professionnels.
        </Section>
        <Section title="3. Contenu des annonces">
          Les informations publiées (prix, surface, localisation, photos) sont fournies par les agences et agents
          partenaires. Domify s&apos;efforce de vérifier leur exactitude mais ne saurait être tenu responsable
          d&apos;erreurs ou d&apos;omissions dans le contenu des annonces.
        </Section>
        <Section title="4. Demandes de contact et de visite">
          En soumettant un formulaire de contact, de demande d&apos;estimation ou de visite, vous acceptez que vos
          coordonnées soient transmises à l&apos;agence ou l&apos;agent concerné afin de traiter votre demande.
        </Section>
        <Section title="5. Responsabilité">
          Domify agit en tant qu&apos;intermédiaire technique de mise en relation. Les transactions immobilières
          elles-mêmes sont conclues directement entre les parties (acheteur/locataire et vendeur/bailleur ou leurs
          représentants), sous leur seule responsabilité.
        </Section>
        <Section title="6. Modification des conditions">
          Domify se réserve le droit de modifier les présentes conditions générales à tout moment. Les utilisateurs
          seront informés de toute modification substantielle.
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
