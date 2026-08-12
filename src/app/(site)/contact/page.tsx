import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { getSiteSettings } from "@/lib/data/settings";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Contactez Domify | Immobilier au Maroc",
  description: "Parlez-nous de votre projet d'achat, de location, de vente ou d'estimation immobilière au Maroc.",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <ContactForm
      settings={{
        phone: settings.contact_phone,
        email: settings.contact_email,
        address: settings.contact_address,
      }}
    />
  );
}
