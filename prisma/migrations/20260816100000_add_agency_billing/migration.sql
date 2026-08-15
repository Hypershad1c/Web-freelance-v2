-- CreateEnum
CREATE TYPE "AgencyPlan" AS ENUM ('STARTER', 'PRO', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "AgencySubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AgencyPaymentStatus" AS ENUM ('INITIATED', 'PAID', 'FAILED', 'CANCELED');

-- CreateTable
CREATE TABLE "AgencySubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "AgencyPlan" NOT NULL,
    "status" "AgencySubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "provider" TEXT NOT NULL DEFAULT 'PAYTABS',
    "providerProfileId" TEXT,
    "providerToken" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgencySubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyPayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "plan" "AgencyPlan" NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "provider" TEXT NOT NULL DEFAULT 'PAYTABS',
    "cartId" TEXT NOT NULL,
    "providerTransactionRef" TEXT,
    "status" "AgencyPaymentStatus" NOT NULL DEFAULT 'INITIATED',
    "providerResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgencyPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgencySubscription_userId_status_idx" ON "AgencySubscription"("userId", "status");
CREATE INDEX "AgencySubscription_status_currentPeriodEnd_idx" ON "AgencySubscription"("status", "currentPeriodEnd");
CREATE UNIQUE INDEX "AgencyPayment_cartId_key" ON "AgencyPayment"("cartId");
CREATE INDEX "AgencyPayment_userId_status_createdAt_idx" ON "AgencyPayment"("userId", "status", "createdAt");
CREATE INDEX "AgencyPayment_providerTransactionRef_idx" ON "AgencyPayment"("providerTransactionRef");

-- AddForeignKey
ALTER TABLE "AgencySubscription" ADD CONSTRAINT "AgencySubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyPayment" ADD CONSTRAINT "AgencyPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyPayment" ADD CONSTRAINT "AgencyPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "AgencySubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
