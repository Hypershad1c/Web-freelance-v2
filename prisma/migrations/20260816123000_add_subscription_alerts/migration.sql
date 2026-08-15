-- CreateEnum
CREATE TYPE "SubscriptionAlertType" AS ENUM ('EXPIRING_SOON', 'PAST_DUE');

-- CreateTable
CREATE TABLE "SubscriptionAlert" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "type" "SubscriptionAlertType" NOT NULL,
    "periodKey" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubscriptionAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionAlert_subscriptionId_type_periodKey_key" ON "SubscriptionAlert"("subscriptionId", "type", "periodKey");
CREATE INDEX "SubscriptionAlert_type_sentAt_idx" ON "SubscriptionAlert"("type", "sentAt");

-- AddForeignKey
ALTER TABLE "SubscriptionAlert" ADD CONSTRAINT "SubscriptionAlert_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "AgencySubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
