import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AGENCY_PLAN_PRICES, createPayTabsHostedPayment, isPayTabsConfigured, newCartId } from "@/lib/paytabs";

const CheckoutSchema = z.object({ plan: z.enum(["STARTER", "PRO", "PREMIUM"]) });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  if (!isPayTabsConfigured()) return NextResponse.json({ error: "Le paiement en ligne sera bientôt disponible. L’équipe Domify peut déjà vous présenter les offres." }, { status: 503 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Données invalides" }, { status: 400 }); }
  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Offre invalide" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, email: true } });
  if (!user) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
  const existingPending = await prisma.agencyPayment.findFirst({ where: { userId: user.id, plan: parsed.data.plan, status: "INITIATED", createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } }, orderBy: { createdAt: "desc" } });
  if (existingPending) return NextResponse.json({ error: "Un paiement pour cette offre est déjà en cours. Reprenez le paiement depuis la page ouverte ou réessayez dans quelques minutes." }, { status: 409 });

  const cartId = newCartId();
  const subscription = await prisma.agencySubscription.create({ data: { userId: user.id, plan: parsed.data.plan, amount: AGENCY_PLAN_PRICES[parsed.data.plan], status: "PENDING" } });
  const payment = await prisma.agencyPayment.create({ data: { userId: user.id, subscriptionId: subscription.id, plan: parsed.data.plan, amount: AGENCY_PLAN_PRICES[parsed.data.plan], cartId } });

  try {
    const checkout = await createPayTabsHostedPayment({ cartId, plan: parsed.data.plan, customer: { name: user.name || "Client Domify", email: user.email } });
    await prisma.agencyPayment.update({ where: { id: payment.id }, data: { providerTransactionRef: checkout.transactionReference, providerResponse: checkout.raw } });
    return NextResponse.json({ redirectUrl: checkout.redirectUrl });
  } catch (error) {
    await prisma.$transaction([
      prisma.agencyPayment.update({ where: { id: payment.id }, data: { status: "FAILED", providerResponse: { error: error instanceof Error ? error.message : "PayTabs error" } } }),
      prisma.agencySubscription.update({ where: { id: subscription.id }, data: { status: "PAST_DUE" } }),
    ]);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Impossible d’ouvrir le paiement." }, { status: 502 });
  }
}
