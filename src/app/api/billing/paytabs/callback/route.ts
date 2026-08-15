import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AGENCY_PLAN_PRICES, getPayTabsToken, isAuthorizedPayTabsResponse, queryPayTabsTransaction } from "@/lib/paytabs";

async function readPayload(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return await request.json() as Record<string, unknown>;
  const text = await request.text();
  return Object.fromEntries(new URLSearchParams(text).entries()) as Record<string, unknown>;
}

function addPeriod(months: number) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date;
}

export async function POST(request: Request) {
  const payload = await readPayload(request).catch(() => null);
  if (!payload) return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  const cartId = typeof payload.cart_id === "string" ? payload.cart_id : "";
  const transactionReference = typeof payload.tran_ref === "string" ? payload.tran_ref : "";
  if (!cartId || !transactionReference) return NextResponse.json({ error: "Référence PayTabs manquante" }, { status: 400 });

  const payment = await prisma.agencyPayment.findUnique({ where: { cartId }, include: { subscription: true } });
  if (!payment) return NextResponse.json({ error: "Paiement Domify introuvable" }, { status: 404 });
  if (payment.status === "PAID") return NextResponse.json({ ok: true, status: "already_processed" });

  let verified: Record<string, unknown>;
  try {
    verified = await queryPayTabsTransaction(transactionReference);
  } catch (error) {
    console.error("[paytabs] transaction verification failed", error);
    return NextResponse.json({ error: "Vérification PayTabs temporairement indisponible" }, { status: 202 });
  }

  const paidAmount = Number(verified.cart_amount ?? verified.tran_total ?? 0);
  const authorized = isAuthorizedPayTabsResponse(verified) && Math.round(paidAmount) === payment.amount && payment.amount === AGENCY_PLAN_PRICES[payment.plan as keyof typeof AGENCY_PLAN_PRICES];
  if (!authorized) {
    await prisma.$transaction([
      prisma.agencyPayment.update({ where: { id: payment.id }, data: { status: "FAILED", providerTransactionRef: transactionReference, providerResponse: JSON.parse(JSON.stringify(verified)) } }),
      prisma.agencySubscription.update({ where: { id: payment.subscriptionId }, data: { status: "PAST_DUE" } }),
    ]);
    return NextResponse.json({ ok: true, status: "rejected" });
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.agencyPayment.update({ where: { id: payment.id }, data: { status: "PAID", providerTransactionRef: transactionReference, providerResponse: JSON.parse(JSON.stringify(verified)) } }),
    prisma.agencySubscription.update({ where: { id: payment.subscriptionId }, data: { status: "ACTIVE", providerProfileId: process.env.PAYTABS_PROFILE_ID, providerToken: getPayTabsToken(verified), currentPeriodStart: now, currentPeriodEnd: addPeriod(1) } }),
  ]);
  return NextResponse.json({ ok: true, status: "paid" });
}
