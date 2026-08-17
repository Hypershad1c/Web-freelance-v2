import { randomUUID } from "node:crypto";

export const AGENCY_PLAN_PRICES = {
  STARTER: 499,
  PRO: 1500,
  PREMIUM: 4000,
} as const;

export type PaidAgencyPlan = keyof typeof AGENCY_PLAN_PRICES;

const BASE_URL = (process.env.PAYTABS_BASE_URL || "https://secure-morocco.paytabs.com").replace(/\/$/, "");

export function isPayTabsConfigured() {
  return Boolean(process.env.PAYTABS_PROFILE_ID && process.env.PAYTABS_SERVER_KEY);
}

export function isPayTabsCheckoutEnabled() {
  return isPayTabsConfigured() && process.env.PAYTABS_CHECKOUT_ENABLED === "true";
}

export function isPayTabsLiveEnabled() {
  return process.env.PAYTABS_LIVE_ENABLED === "true";
}

function profileId() {
  const value = Number(process.env.PAYTABS_PROFILE_ID);
  if (!Number.isInteger(value) || value <= 0) throw new Error("PAYTABS_PROFILE_ID doit être un entier positif.");
  return value;
}

function providerHeaders() {
  return { Authorization: process.env.PAYTABS_SERVER_KEY!, "Content-Type": "application/json" };
}

export function canonicalOrigin() {
  return (process.env.NEXTAUTH_URL || "https://domify.ma").replace(/\/$/, "");
}

export function newCartId() {
  return `DOMIFY-${Date.now()}-${randomUUID().slice(0, 8)}`;
}

export async function createPayTabsHostedPayment({ cartId, plan, customer }: { cartId: string; plan: PaidAgencyPlan; customer: { name: string; email: string; phone?: string | null } }) {
  if (!isPayTabsConfigured()) throw new Error("PayTabs n’est pas configuré.");
  const amount = AGENCY_PLAN_PRICES[plan];
  const response = await fetch(`${BASE_URL}/payment/request`, {
    method: "POST",
    headers: providerHeaders(),
    body: JSON.stringify({
      profile_id: profileId(),
      tran_type: "sale",
      tran_class: "ecom",
      cart_id: cartId,
      cart_description: `Abonnement Domify ${plan}`,
      cart_currency: "MAD",
      cart_amount: amount,
      return: `${canonicalOrigin()}/api/billing/paytabs/return`,
      callback: `${canonicalOrigin()}/api/billing/paytabs/callback`,
      paypage_lang: "fr",
      tokenise: 2,
      hide_shipping: true,
      customer_details: { name: customer.name, email: customer.email, phone: customer.phone || "", country: "MA" },
    }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.redirect_url) throw new Error(data?.message || "PayTabs n’a pas fourni de page de paiement.");
  return { redirectUrl: data.redirect_url as string, transactionReference: typeof data.tran_ref === "string" ? data.tran_ref : null, raw: data };
}

export async function queryPayTabsTransaction(transactionReference: string) {
  if (!isPayTabsConfigured()) throw new Error("PayTabs n’est pas configuré.");
  const response = await fetch(`${BASE_URL}/payment/query`, { method: "POST", headers: providerHeaders(), body: JSON.stringify({ profile_id: profileId(), tran_ref: transactionReference }), cache: "no-store" });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || "La vérification PayTabs a échoué.");
  return data as Record<string, unknown>;
}

export async function createPayTabsRecurringPayment({ cartId, plan, token }: { cartId: string; plan: PaidAgencyPlan; token: string }) {
  if (!isPayTabsConfigured()) throw new Error("PayTabs n’est pas configuré.");
  const amount = AGENCY_PLAN_PRICES[plan];
  const response = await fetch(`${BASE_URL}/payment/request`, {
    method: "POST",
    headers: providerHeaders(),
    body: JSON.stringify({ profile_id: profileId(), tran_type: "sale", tran_class: "recurring", cart_id: cartId, cart_description: `Renouvellement Domify ${plan}`, cart_currency: "MAD", cart_amount: amount, token }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || "Le renouvellement PayTabs a échoué.");
  return data as Record<string, unknown>;
}

export function isAuthorizedPayTabsResponse(data: Record<string, unknown>) {
  const paymentResult = data.payment_result as Record<string, unknown> | undefined;
  return paymentResult?.response_status === "A";
}

export function getPayTabsToken(data: Record<string, unknown>) {
  if (typeof data.token === "string" && data.token.length > 0) return data.token;
  const tokenInfo = data.token_info as Record<string, unknown> | undefined;
  return typeof tokenInfo?.token === "string" && tokenInfo.token.length > 0 ? tokenInfo.token : null;
}
