import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSubscriptionExpiringSoonEmail, sendSubscriptionPastDueEmail } from "@/lib/email";

function authorizedCron(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function periodKey(periodEnd: Date | null) {
  return periodEnd ? periodEnd.toISOString().slice(0, 10) : "no-period";
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

async function claimAlert(subscriptionId: string, type: "EXPIRING_SOON" | "PAST_DUE", key: string) {
  try {
    await prisma.subscriptionAlert.create({ data: { subscriptionId, type, periodKey: key } });
    return true;
  } catch (error) {
    if (isUniqueConstraintError(error)) return false;
    throw error;
  }
}

async function releaseAlert(subscriptionId: string, type: "EXPIRING_SOON" | "PAST_DUE", key: string) {
  await prisma.subscriptionAlert.deleteMany({ where: { subscriptionId, type, periodKey: key } });
}

async function runBillingAlerts() {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 86_400_000);
  const [expiring, pastDue] = await Promise.all([
    prisma.agencySubscription.findMany({
      where: { status: "ACTIVE", currentPeriodEnd: { gte: now, lte: sevenDaysFromNow } },
      orderBy: { currentPeriodEnd: "asc" },
      select: { id: true, plan: true, amount: true, currency: true, currentPeriodEnd: true, user: { select: { name: true, email: true } } },
    }),
    prisma.agencySubscription.findMany({
      where: { status: "PAST_DUE" },
      orderBy: { updatedAt: "asc" },
      select: { id: true, plan: true, amount: true, currency: true, currentPeriodEnd: true, user: { select: { name: true, email: true } } },
    }),
  ]);

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const subscription of expiring) {
    const key = periodKey(subscription.currentPeriodEnd);
    if (!subscription.user.email || !subscription.currentPeriodEnd || !(await claimAlert(subscription.id, "EXPIRING_SOON", key))) {
      skipped += 1;
      continue;
    }
    try {
      const result = await sendSubscriptionExpiringSoonEmail({
        to: subscription.user.email,
        recipientName: subscription.user.name,
        plan: subscription.plan,
        amount: subscription.amount,
        currency: subscription.currency,
        periodEnd: subscription.currentPeriodEnd,
      });
      if (result.skipped) {
        await releaseAlert(subscription.id, "EXPIRING_SOON", key);
        skipped += 1;
      } else {
        sent += 1;
      }
    } catch (error) {
      await releaseAlert(subscription.id, "EXPIRING_SOON", key);
      failed += 1;
      console.error("[billing alerts] Expiry email failed", { subscriptionId: subscription.id, error });
    }
  }

  for (const subscription of pastDue) {
    const key = periodKey(subscription.currentPeriodEnd);
    if (!subscription.user.email || !(await claimAlert(subscription.id, "PAST_DUE", key))) {
      skipped += 1;
      continue;
    }
    try {
      const result = await sendSubscriptionPastDueEmail({
        to: subscription.user.email,
        recipientName: subscription.user.name,
        plan: subscription.plan,
        amount: subscription.amount,
        currency: subscription.currency,
      });
      if (result.skipped) {
        await releaseAlert(subscription.id, "PAST_DUE", key);
        skipped += 1;
      } else {
        sent += 1;
      }
    } catch (error) {
      await releaseAlert(subscription.id, "PAST_DUE", key);
      failed += 1;
      console.error("[billing alerts] Past-due email failed", { subscriptionId: subscription.id, error });
    }
  }

  return { ok: true, candidates: expiring.length + pastDue.length, sent, skipped, failed };
}

async function handle(request: Request) {
  if (!authorizedCron(request)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json(await runBillingAlerts());
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
