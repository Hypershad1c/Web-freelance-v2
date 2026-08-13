CREATE TYPE "CrmOfferStatus" AS ENUM ('SUBMITTED', 'COUNTERED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED');

CREATE TABLE "CrmOffer" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "CrmOfferStatus" NOT NULL DEFAULT 'SUBMITTED',
    "message" TEXT,
    "conditions" TEXT,
    "expiresAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "contactId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "sellerCaseId" TEXT,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmOffer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CrmOffer_propertyId_status_updatedAt_idx" ON "CrmOffer"("propertyId", "status", "updatedAt");
CREATE INDEX "CrmOffer_contactId_createdAt_idx" ON "CrmOffer"("contactId", "createdAt");
CREATE INDEX "CrmOffer_sellerCaseId_updatedAt_idx" ON "CrmOffer"("sellerCaseId", "updatedAt");

ALTER TABLE "CrmOffer" ADD CONSTRAINT "CrmOffer_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmOffer" ADD CONSTRAINT "CrmOffer_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "CrmDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmOffer" ADD CONSTRAINT "CrmOffer_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmOffer" ADD CONSTRAINT "CrmOffer_sellerCaseId_fkey" FOREIGN KEY ("sellerCaseId") REFERENCES "CrmSellerCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmOffer" ADD CONSTRAINT "CrmOffer_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
