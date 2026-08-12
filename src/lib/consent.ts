export type ConsentChoice = "accepted" | "rejected";

const CONSENT_KEY = "domify-cookie-consent";
const CONSENT_EVENT = "domify-consent-change";

export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(CONSENT_KEY);
  return value === "accepted" || value === "rejected" ? value : null;
}

export function saveConsent(choice: ConsentChoice) {
  window.localStorage.setItem(CONSENT_KEY, choice);
  document.cookie = `domify_cookie_consent=${choice}; Path=/; Max-Age=31536000; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
}

export { CONSENT_EVENT };
