// Known settings keys — the form on /admin/settings is built from this list, so
// adding a new setting is a one-line change here (plus wiring it up wherever it's
// meant to be read from, e.g. Header/Footer).
//
// This lives in its own plain module (not the "use server" actions file) because
// Server Action files may only export async functions — exporting this constant
// from alongside `updateSettings` causes:
// "A 'use server' file can only export async functions, found object."
export const SETTINGS_FIELDS = [
  { key: "site_name", label: "Nom du site", defaultValue: "Domify", kind: "text", help: "Visible dans l’administration et sur le site." },
  { key: "site_tagline", label: "Slogan", defaultValue: "Find Your Perfect Place.", kind: "text", help: "Courte signature de marque." },
  { key: "contact_phone", label: "Téléphone de contact", defaultValue: "", kind: "phone", help: "Ex. +212 5 00 00 00 00" },
  { key: "contact_email", label: "Email de contact", defaultValue: "", kind: "email", help: "Utilisé comme destinataire de secours pour les demandes." },
  { key: "contact_address", label: "Adresse", defaultValue: "", kind: "text", help: "Adresse affichée dans les espaces publics." },
  { key: "whatsapp_number", label: "Numéro WhatsApp par défaut", defaultValue: "", kind: "phone", help: "Avec indicatif pays, sans texte additionnel." },
  { key: "social_facebook", label: "Facebook (URL)", defaultValue: "", kind: "url", help: "Collez l’URL complète ou le domaine de votre page." },
  { key: "social_instagram", label: "Instagram (URL)", defaultValue: "", kind: "url", help: "Collez l’URL complète ou le domaine de votre profil." },
  { key: "social_linkedin", label: "LinkedIn (URL)", defaultValue: "", kind: "url", help: "Collez l’URL complète ou le domaine de votre page." },
] as const;
