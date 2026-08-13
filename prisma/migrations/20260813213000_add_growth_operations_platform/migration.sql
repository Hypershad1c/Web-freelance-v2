CREATE TYPE "MediaWorkflowStatus" AS ENUM ('UPLOADED', 'IN_REVIEW', 'APPROVED', 'REJECTED');
CREATE TYPE "CrmDocumentVisibility" AS ENUM ('INTERNAL', 'SELLER');
CREATE TYPE "CrmDocumentStatus" AS ENUM ('REQUESTED', 'UPLOADED', 'VERIFIED', 'REJECTED');
CREATE TYPE "CrmSignatureStatus" AS ENUM ('DRAFT', 'READY', 'SENT', 'VIEWED', 'SIGNED', 'DECLINED', 'EXPIRED', 'FAILED');
CREATE TYPE "FinancingReadinessStatus" AS ENUM ('NEW', 'REVIEWING', 'PREQUALIFIED', 'NOT_READY');
CREATE TYPE "OwnerReportStatus" AS ENUM ('DRAFT', 'SENT', 'SKIPPED', 'FAILED');

ALTER TABLE "Media"
  ADD COLUMN "workflowStatus" "MediaWorkflowStatus" NOT NULL DEFAULT 'UPLOADED',
  ADD COLUMN "reviewNote" TEXT,
  ADD COLUMN "processedAt" TIMESTAMP(3);

ALTER TABLE "Lead"
  ADD COLUMN "utmSource" TEXT,
  ADD COLUMN "utmMedium" TEXT,
  ADD COLUMN "utmCampaign" TEXT,
  ADD COLUMN "referrer" TEXT;

ALTER TABLE "Appointment"
  ADD COLUMN "durationMinutes" INTEGER NOT NULL DEFAULT 45,
  ADD COLUMN "location" TEXT,
  ADD COLUMN "meetingUrl" TEXT,
  ADD COLUMN "confirmedAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "source" TEXT,
  ADD COLUMN "utmSource" TEXT,
  ADD COLUMN "utmMedium" TEXT,
  ADD COLUMN "utmCampaign" TEXT,
  ADD COLUMN "availabilitySlotId" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "CrmContact"
  ADD COLUMN "firstRespondedAt" TIMESTAMP(3),
  ADD COLUMN "slaDueAt" TIMESTAMP(3);

ALTER TABLE "CrmDocument"
  ADD COLUMN "visibility" "CrmDocumentVisibility" NOT NULL DEFAULT 'INTERNAL',
  ADD COLUMN "status" "CrmDocumentStatus" NOT NULL DEFAULT 'UPLOADED',
  ADD COLUMN "requestedAt" TIMESTAMP(3),
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "rejectedReason" TEXT,
  ADD COLUMN "externalStorageKey" TEXT;

ALTER TABLE "SeoEntry"
  ADD COLUMN "focusKeyword" TEXT,
  ADD COLUMN "content" TEXT,
  ADD COLUMN "structuredData" JSONB,
  ADD COLUMN "publishedAt" TIMESTAMP(3);

ALTER TABLE "AnalyticsEvent"
  ADD COLUMN "source" TEXT,
  ADD COLUMN "medium" TEXT,
  ADD COLUMN "campaign" TEXT,
  ADD COLUMN "referrer" TEXT;

CREATE TABLE "AgentAvailability" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "capacity" INTEGER NOT NULL DEFAULT 1,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "location" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AgentAvailability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmSignatureRequest" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "provider" TEXT,
  "status" "CrmSignatureStatus" NOT NULL DEFAULT 'DRAFT',
  "externalId" TEXT,
  "signingUrl" TEXT,
  "sentAt" TIMESTAMP(3),
  "signedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "error" TEXT,
  "contactId" TEXT NOT NULL,
  "sellerCaseId" TEXT,
  "offerId" TEXT,
  "documentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CrmSignatureRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FinancingProfile" (
  "id" TEXT NOT NULL,
  "status" "FinancingReadinessStatus" NOT NULL DEFAULT 'NEW',
  "monthlyIncome" INTEGER,
  "monthlyDebt" INTEGER,
  "savings" INTEGER,
  "estimatedBudget" INTEGER,
  "downPayment" INTEGER,
  "employmentType" TEXT,
  "preferredBank" TEXT,
  "bankPreApproved" BOOLEAN NOT NULL DEFAULT false,
  "consent" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "contactId" TEXT NOT NULL,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FinancingProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OwnerReport" (
  "id" TEXT NOT NULL,
  "status" "OwnerReportStatus" NOT NULL DEFAULT 'DRAFT',
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "summary" JSONB NOT NULL,
  "deliveredAt" TIMESTAMP(3),
  "error" TEXT,
  "contactId" TEXT NOT NULL,
  "sellerCaseId" TEXT NOT NULL,
  "propertyId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OwnerReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OwnerReport_sellerCaseId_periodStart_periodEnd_key" ON "OwnerReport"("sellerCaseId", "periodStart", "periodEnd");
CREATE INDEX "AgentAvailability_agentId_startsAt_active_idx" ON "AgentAvailability"("agentId", "startsAt", "active");
CREATE INDEX "Appointment_agentId_date_idx" ON "Appointment"("agentId", "date");
CREATE INDEX "Appointment_availabilitySlotId_date_idx" ON "Appointment"("availabilitySlotId", "date");
CREATE INDEX "CrmSignatureRequest_contactId_status_updatedAt_idx" ON "CrmSignatureRequest"("contactId", "status", "updatedAt");
CREATE INDEX "CrmSignatureRequest_sellerCaseId_status_idx" ON "CrmSignatureRequest"("sellerCaseId", "status");
CREATE INDEX "FinancingProfile_contactId_status_updatedAt_idx" ON "FinancingProfile"("contactId", "status", "updatedAt");
CREATE INDEX "FinancingProfile_userId_createdAt_idx" ON "FinancingProfile"("userId", "createdAt");
CREATE INDEX "OwnerReport_contactId_status_createdAt_idx" ON "OwnerReport"("contactId", "status", "createdAt");
CREATE INDEX "AnalyticsEvent_type_source_createdAt_idx" ON "AnalyticsEvent"("type", "source", "createdAt");
CREATE INDEX "AnalyticsEvent_campaign_createdAt_idx" ON "AnalyticsEvent"("campaign", "createdAt");

ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_availabilitySlotId_fkey" FOREIGN KEY ("availabilitySlotId") REFERENCES "AgentAvailability"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgentAvailability" ADD CONSTRAINT "AgentAvailability_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmSignatureRequest" ADD CONSTRAINT "CrmSignatureRequest_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmSignatureRequest" ADD CONSTRAINT "CrmSignatureRequest_sellerCaseId_fkey" FOREIGN KEY ("sellerCaseId") REFERENCES "CrmSellerCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmSignatureRequest" ADD CONSTRAINT "CrmSignatureRequest_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "CrmOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmSignatureRequest" ADD CONSTRAINT "CrmSignatureRequest_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "CrmDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancingProfile" ADD CONSTRAINT "FinancingProfile_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FinancingProfile" ADD CONSTRAINT "FinancingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OwnerReport" ADD CONSTRAINT "OwnerReport_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OwnerReport" ADD CONSTRAINT "OwnerReport_sellerCaseId_fkey" FOREIGN KEY ("sellerCaseId") REFERENCES "CrmSellerCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OwnerReport" ADD CONSTRAINT "OwnerReport_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
