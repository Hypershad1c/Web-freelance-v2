-- Domify CRM sales-platform expansion: scoring, communications, seller workflow,
-- document records, routing rules, automation templates, and saved-search alerts.
CREATE TYPE "CrmContactLifecycle" AS ENUM ('BUYER', 'SELLER', 'INVESTOR', 'PARTNER');
CREATE TYPE "CrmCommunicationChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'PHONE', 'SMS', 'IN_APP');
CREATE TYPE "CrmCommunicationDirection" AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE "CrmCommunicationStatus" AS ENUM ('DRAFT', 'QUEUED', 'SENT', 'FAILED', 'LOGGED');
CREATE TYPE "CrmSellerCaseStage" AS ENUM ('VALUATION_REQUESTED', 'VALUATION_SCHEDULED', 'MANDATE_PENDING', 'ONBOARDING', 'MEDIA_PREPARATION', 'PUBLISHED', 'OFFER_RECEIVED', 'NEGOTIATION', 'SOLD', 'LOST');
CREATE TYPE "CrmDocumentType" AS ENUM ('IDENTITY', 'MANDATE', 'TITLE_DEED', 'FINANCING', 'OFFER', 'CONTRACT', 'PROPERTY_MEDIA', 'OTHER');
CREATE TYPE "CrmAlertChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'IN_APP');

ALTER TABLE "CrmContact"
  ADD COLUMN "lifecycle" "CrmContactLifecycle" NOT NULL DEFAULT 'BUYER',
  ADD COLUMN "leadScore" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "scoreReason" TEXT,
  ADD COLUMN "lastContactedAt" TIMESTAMP(3),
  ADD COLUMN "emailOptIn" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "CrmCommunication" (
  "id" TEXT NOT NULL,
  "channel" "CrmCommunicationChannel" NOT NULL,
  "direction" "CrmCommunicationDirection" NOT NULL,
  "status" "CrmCommunicationStatus" NOT NULL DEFAULT 'LOGGED',
  "subject" TEXT,
  "body" TEXT NOT NULL,
  "externalId" TEXT,
  "sentAt" TIMESTAMP(3),
  "contactId" TEXT NOT NULL,
  "dealId" TEXT,
  "ownerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CrmCommunication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmDocument" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "type" "CrmDocumentType" NOT NULL DEFAULT 'OTHER',
  "mimeType" TEXT,
  "sizeBytes" INTEGER,
  "notes" TEXT,
  "contactId" TEXT,
  "dealId" TEXT,
  "propertyId" TEXT,
  "uploadedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CrmDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmSellerCase" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "stage" "CrmSellerCaseStage" NOT NULL DEFAULT 'VALUATION_REQUESTED',
  "estimatedValue" INTEGER,
  "mandateSigned" BOOLEAN NOT NULL DEFAULT false,
  "nextActionAt" TIMESTAMP(3),
  "notes" TEXT,
  "contactId" TEXT NOT NULL,
  "propertyId" TEXT,
  "ownerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CrmSellerCase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmAssignmentRule" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "source" TEXT,
  "cityId" TEXT,
  "propertyTypeId" TEXT,
  "assigneeId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CrmAssignmentRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmAutomationTemplate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "trigger" TEXT NOT NULL,
  "delayHours" INTEGER NOT NULL DEFAULT 0,
  "channel" "CrmCommunicationChannel" NOT NULL,
  "subject" TEXT,
  "body" TEXT NOT NULL,
  "ownerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CrmAutomationTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmSavedSearch" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "listingType" "ListingType",
  "minPrice" INTEGER,
  "maxPrice" INTEGER,
  "bedrooms" INTEGER,
  "cityId" TEXT,
  "propertyTypeId" TEXT,
  "channel" "CrmAlertChannel" NOT NULL DEFAULT 'EMAIL',
  "lastNotifiedAt" TIMESTAMP(3),
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CrmSavedSearch_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CrmCommunication_contactId_createdAt_idx" ON "CrmCommunication"("contactId", "createdAt");
CREATE INDEX "CrmCommunication_status_channel_createdAt_idx" ON "CrmCommunication"("status", "channel", "createdAt");
CREATE INDEX "CrmDocument_contactId_createdAt_idx" ON "CrmDocument"("contactId", "createdAt");
CREATE INDEX "CrmDocument_dealId_createdAt_idx" ON "CrmDocument"("dealId", "createdAt");
CREATE INDEX "CrmDocument_propertyId_createdAt_idx" ON "CrmDocument"("propertyId", "createdAt");
CREATE INDEX "CrmSellerCase_stage_ownerId_updatedAt_idx" ON "CrmSellerCase"("stage", "ownerId", "updatedAt");
CREATE INDEX "CrmSellerCase_contactId_createdAt_idx" ON "CrmSellerCase"("contactId", "createdAt");
CREATE INDEX "CrmAssignmentRule_active_priority_idx" ON "CrmAssignmentRule"("active", "priority");
CREATE INDEX "CrmAutomationTemplate_active_trigger_idx" ON "CrmAutomationTemplate"("active", "trigger");
CREATE INDEX "CrmSavedSearch_userId_active_idx" ON "CrmSavedSearch"("userId", "active");
CREATE INDEX "CrmSavedSearch_active_lastNotifiedAt_idx" ON "CrmSavedSearch"("active", "lastNotifiedAt");

ALTER TABLE "CrmCommunication" ADD CONSTRAINT "CrmCommunication_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmCommunication" ADD CONSTRAINT "CrmCommunication_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "CrmDeal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmCommunication" ADD CONSTRAINT "CrmCommunication_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmDocument" ADD CONSTRAINT "CrmDocument_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmDocument" ADD CONSTRAINT "CrmDocument_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "CrmDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmDocument" ADD CONSTRAINT "CrmDocument_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmDocument" ADD CONSTRAINT "CrmDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmSellerCase" ADD CONSTRAINT "CrmSellerCase_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmSellerCase" ADD CONSTRAINT "CrmSellerCase_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmSellerCase" ADD CONSTRAINT "CrmSellerCase_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmAssignmentRule" ADD CONSTRAINT "CrmAssignmentRule_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmAssignmentRule" ADD CONSTRAINT "CrmAssignmentRule_propertyTypeId_fkey" FOREIGN KEY ("propertyTypeId") REFERENCES "PropertyType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmAssignmentRule" ADD CONSTRAINT "CrmAssignmentRule_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmAutomationTemplate" ADD CONSTRAINT "CrmAutomationTemplate_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmSavedSearch" ADD CONSTRAINT "CrmSavedSearch_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmSavedSearch" ADD CONSTRAINT "CrmSavedSearch_propertyTypeId_fkey" FOREIGN KEY ("propertyTypeId") REFERENCES "PropertyType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmSavedSearch" ADD CONSTRAINT "CrmSavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Deterministic initial scoring for existing records. Scores are recomputed on future CRM activity.
UPDATE "CrmContact" contact
SET
  "leadScore" = LEAST(100,
    20
    + CASE WHEN contact."phone" IS NOT NULL AND contact."phone" <> '' THEN 15 ELSE 0 END
    + CASE WHEN contact."budgetMax" IS NOT NULL THEN 15 ELSE 0 END
    + CASE WHEN contact."preferredLocation" IS NOT NULL AND contact."preferredLocation" <> '' THEN 10 ELSE 0 END
    + LEAST(20, (SELECT COUNT(*)::INTEGER * 5 FROM "Lead" lead WHERE lead."crmContactId" = contact."id"))
    + LEAST(20, (SELECT COUNT(*)::INTEGER * 5 FROM "Appointment" appointment WHERE appointment."crmContactId" = contact."id"))
  ),
  "scoreReason" = 'Profil complété et engagement historique.';
