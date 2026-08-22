"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SETTINGS_FIELDS } from "@/lib/settings-fields";
import { isValidContactEmail, normalizeContactPhone, normalizeExternalUrl } from "@/lib/settings-validation";
import { getSiteSettings } from "@/lib/data/settings";
import { resolveLeadNotificationRecipients } from "@/lib/lead-notification-recipients";
import { emailLayout, sendEmail } from "@/lib/email";
import { recordAudit } from "@/lib/workflow";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Non autorisé — réservé aux administrateurs.");
  }
}

export type SettingsFormState = { message?: string; errors?: Record<string, string> };
export type NotificationTestState = { message?: string; error?: string };

export async function updateSettings(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  try {
    await requireAdmin();
  } catch {
    return { errors: { form: "Votre session ne permet pas de modifier les paramètres. Rechargez la page et reconnectez-vous si nécessaire." } };
  }

  const values = Object.fromEntries(SETTINGS_FIELDS.map((field) => [field.key, String(formData.get(field.key) ?? "").trim()])) as Record<(typeof SETTINGS_FIELDS)[number]["key"], string>;
  const errors: Record<string, string> = {};

  if (!values.site_name) errors.site_name = "Le nom du site est requis.";
  if (values.site_name.length > 80) errors.site_name = "Le nom du site ne peut pas dépasser 80 caractères.";
  if (values.site_tagline.length > 160) errors.site_tagline = "Le slogan ne peut pas dépasser 160 caractères.";
  if (values.contact_email && !isValidContactEmail(values.contact_email)) errors.contact_email = "Saisissez une adresse email valide, par exemple contact@domify.ma.";

  for (const key of ["social_facebook", "social_instagram", "social_linkedin"] as const) {
    if (values[key] && !normalizeExternalUrl(values[key])) errors[key] = "Saisissez un lien web valide, par exemple https://www.instagram.com/domify.";
  }

  if (Object.keys(errors).length) return { errors };

  values.contact_phone = normalizeContactPhone(values.contact_phone);
  values.whatsapp_number = normalizeContactPhone(values.whatsapp_number);
  values.social_facebook = normalizeExternalUrl(values.social_facebook);
  values.social_instagram = normalizeExternalUrl(values.social_instagram);
  values.social_linkedin = normalizeExternalUrl(values.social_linkedin);

  try {
    await Promise.all(
      SETTINGS_FIELDS.map((field) => {
        const value = values[field.key];
        return prisma.siteSetting.upsert({
          where: { key: field.key },
          update: { value },
          create: { key: field.key, value },
        });
      })
    );
  } catch (error) {
    console.error("[settings] Failed to save settings:", error);
    return { errors: { form: "Les paramètres n’ont pas pu être enregistrés pour le moment. Aucun changement n’a été confirmé ; réessayez dans un instant." } };
  }

  revalidatePath("/");
  revalidatePath("/contact");
  revalidatePath("/admin/settings");
  return { message: "Paramètres enregistrés en toute sécurité. Les liens valides sont désormais utilisés sur le site." };
}

export async function sendTestLeadNotification(_previous: NotificationTestState, _formData: FormData): Promise<NotificationTestState> {
  void _previous;
  void _formData;
  let session;
  try {
    await requireAdmin();
    session = await auth();
  } catch {
    return { error: "Votre session ne permet pas d’envoyer un test de notification. Rechargez la page et reconnectez-vous." };
  }

  const [settings, administrators] = await Promise.all([
    getSiteSettings(),
    prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true } }),
  ]);
  const recipients = resolveLeadNotificationRecipients({
    administratorEmails: administrators.map((administrator) => administrator.email),
    configuredAdminEmail: settings.contact_email,
  });

  if (recipients.length === 0) {
    return { error: "Aucune adresse administrateur valide n’est configurée. Ajoutez une adresse dans les paramètres ou sur un compte ADMIN avant de réessayer." };
  }

  const sentAt = new Intl.DateTimeFormat("fr-MA", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Casablanca" }).format(new Date());
  const result = await sendEmail({
    to: recipients,
    subject: "Test notification nouveau lead — Domify",
    html: emailLayout(
      "Test de notification nouveau lead",
      `<p>Ceci est un test administrateur envoyé le <strong>${sentAt}</strong>.</p>
       <p>La notification de nouveau lead est configurée pour informer les administrateurs Domify, l’adresse de contact définie dans les paramètres et l’agent concerné lorsqu’un bien lui est attribué.</p>
       <p>Aucun lead, contact CRM ou renseignement client n’a été créé pour ce test.</p>`
    ),
  });

  if (result.skipped) {
    console.error("[settings] Lead notification test was not delivered", { reason: result.reason, recipientCount: recipients.length });
    return { error: "Le fournisseur email n’a pas accepté l’envoi du test. Consultez les journaux de déploiement et vérifiez la configuration Resend." };
  }

  await recordAudit({
    actorId: session?.user?.id || "system",
    action: "LEAD_NOTIFICATION_TEST_SENT",
    entityType: "SiteSetting",
    entityId: "contact_email",
    summary: `Test de notification de lead envoyé à ${recipients.length} destinataire(s).`,
  }).catch((error) => console.error("[settings] Failed to record lead notification test audit", error));

  return { message: `Test accepté par le fournisseur email et envoyé à ${recipients.length} destinataire(s). Vérifiez Gmail ainsi que les courriers indésirables.` };
}
