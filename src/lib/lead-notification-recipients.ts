import { isValidContactEmail } from "@/lib/settings-validation";

type LeadNotificationRecipientsInput = {
  administratorEmails: Array<string | null | undefined>;
  configuredAdminEmail?: string | null;
  agentEmail?: string | null;
};

export function resolveLeadNotificationRecipients({
  administratorEmails,
  configuredAdminEmail,
  agentEmail,
}: LeadNotificationRecipientsInput) {
  const deduplicated = new Map<string, string>();

  for (const email of [...administratorEmails, configuredAdminEmail, agentEmail]) {
    if (!email || !isValidContactEmail(email)) continue;
    const normalized = email.trim();
    deduplicated.set(normalized.toLocaleLowerCase("en-US"), normalized);
  }

  return [...deduplicated.values()];
}
