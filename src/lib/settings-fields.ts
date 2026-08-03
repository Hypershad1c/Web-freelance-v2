// Known settings keys — the form on /admin/settings is built from this list, so
// adding a new setting is a one-line change here (plus wiring it up wherever it's
// meant to be read from, e.g. Header/Footer).
//
// This lives in its own plain module (not the "use server" actions file) because
// Server Action files may only export async functions — exporting this constant
// from alongside `updateSettings` causes:
// "A 'use server' file can only export async functions, found object."
export const SETTINGS_FIELDS = [
  { key: "site_name", label: "Nom du site", defaultValue: "Domify" },
  { key: "site_tagline", label: "Slogan", defaultValue: "Find Your Perfect Place." },
  { key: "contact_phone", label: "Téléphone de contact", defaultValue: "+212 6 00 00 00 00" },
  { key: "contact_email", label: "Email de contact", defaultValue: "contact@domify.ma" },
  { key: "contact_address", label: "Adresse", defaultValue: "123, Bd Mohammed V, Casablanca, Maroc" },
  { key: "whatsapp_number", label: "Numéro WhatsApp par défaut", defaultValue: "+212 6 00 00 00 00" },
  { key: "social_facebook", label: "Facebook (URL)", defaultValue: "" },
  { key: "social_instagram", label: "Instagram (URL)", defaultValue: "" },
  { key: "social_linkedin", label: "LinkedIn (URL)", defaultValue: "" },
] as const;
