import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AGENCY_PLAN_PRICES, createPayTabsRecurringPayment, isAuthorizedPayTabsResponse, isPayTabsConfigured, newCartId, queryPayTabsTransaction } from "@/lib/paytabs";

function authorizedCron(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function addPeriod(date: Date) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
}

export async function POST(request: Request) {
  if (!authorizedCron(request)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!isPayTabsConfigured()) return NextResponse.json({ ok: true, skipped: true, reason: "PayTabs non configuré" });

  const due = await prisma.agencySubscription.findMany({ where: { status: "ACTIVE", currentPeriodEnd: { lte: new Date() }, providerToken: { not: null } }, take: 25, orderBy: { currentPeriodEnd: "asc" } });
  const results: Array<{ subscriptionId: string; status: string }> = [];
  for (const subscription of due) {
    const cartId = newCartId();
    const payment = await prisma.agencyPayment.create({ data: { userId: subscription.userId, subscriptionId: subscription.id, plan: subscription.plan, amount: subscription.amount, currency: subscription.currency, cartId } });
    try {
      const response = await createPayTabsRecurringPayment({ cartId, plan: subscription.plan as keyof typeof AGENCY_PLAN_PRICES, token: subscription.providerToken! });
      const verified = typeof response.tran_ref === "string" ? await queryPayTabsTransaction(response.tran_ref) : response;
      if (!isAuthorizedPayTabsResponse(verified) || Math.round(Number(verified.cart_amount ?? verified.tran_total ?? 0)) !== subscription.amount) throw new Error("Renouvellement non autorisé ou montant inattendu");
      await prisma.$transaction([
        prisma.agencyPayment.update({ where: { id: payment.id }, data: { status: "PAID", providerTransactionRef: typeof verified.tran_ref === "string" ? verified.tran_ref : null, providerResponse: JSON.parse(JSON.stringify(verified)) } }),
        prisma.agencySubscription.update({ where: { id: subscription.id }, data: { currentPeriodStart: new Date(), currentPeriodEnd: addPeriod(subscription.currentPeriodEnd || new Date()) } }),
      ]);
      results.push({ subscriptionId: subscription.id, status: "paid" });
    } catch (error) {
      await prisma.$transaction([
        prisma.agencyPayment.update({ where: { id: payment.id }, data: { status: "FAILED", providerResponse: { error: error instanceof Error ? error.message : "Renewal failed" } } }),
        prisma.agencySubscription.update({ where: { id: subscription.id }, data: { status: "PAST_DUE" } }),
      ]);
      results.push({ subscriptionId: subscription.id, status: "past_due" });
    }
  }
  return NextResponse.json({ ok: true, processed: results.length, results });
}
