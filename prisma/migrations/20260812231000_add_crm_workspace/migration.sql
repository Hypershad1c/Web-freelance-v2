-- CRM workspace: contacts, real-estate opportunities, and interaction timeline.
CREATE TYPE "CrmDealStage" AS ENUM ('NEW', 'QUALIFIED', 'VIEWING', 'OFFER', 'NEGOTIATION', 'WON', 'LOST');
CREATE TYPE "CrmActivityType" AS ENUM ('NOTE', 'CALL', 'EMAIL', 'WHATSAPP', 'MEETING', 'TASK', 'SYSTEM');

CREATE TABLE "CrmContact" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "source" TEXT,
  "notes" TEXT,
  "budgetMin" INTEGER,
  "budgetMax" INTEGER,
  "preferredLocation" TEXT,
  "ownerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CrmContact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmDeal" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "stage" "CrmDealStage" NOT NULL DEFAULT 'NEW',
  "value" INTEGER,
  "source" TEXT,
  "probability" INTEGER NOT NULL DEFAULT 10,
  "nextFollowUpAt" TIMESTAMP(3),
  "expectedCloseAt" TIMESTAMP(3),
  "wonAt" TIMESTAMP(3),
  "lostReason" TEXT,
  "contactId" TEXT NOT NULL,
  "propertyId" TEXT,
  "ownerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CrmDeal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmActivity" (
  "id" TEXT NOT NULL,
  "type" "CrmActivityType" NOT NULL DEFAULT 'NOTE',
  "body" TEXT NOT NULL,
  "dueAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "contactId" TEXT NOT NULL,
  "dealId" TEXT,
  "actorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CrmActivity_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Lead" ADD COLUMN "crmContactId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "crmContactId" TEXT;
ALTER TABLE "Message" ADD COLUMN "crmContactId" TEXT;

CREATE UNIQUE INDEX "CrmContact_email_key" ON "CrmContact"("email");
CREATE INDEX "CrmContact_ownerId_updatedAt_idx" ON "CrmContact"("ownerId", "updatedAt");
CREATE INDEX "CrmDeal_stage_ownerId_updatedAt_idx" ON "CrmDeal"("stage", "ownerId", "updatedAt");
CREATE INDEX "CrmDeal_contactId_createdAt_idx" ON "CrmDeal"("contactId", "createdAt");
CREATE INDEX "CrmActivity_contactId_createdAt_idx" ON "CrmActivity"("contactId", "createdAt");
CREATE INDEX "CrmActivity_dealId_dueAt_idx" ON "CrmActivity"("dealId", "dueAt");
CREATE INDEX "CrmActivity_dueAt_completedAt_idx" ON "CrmActivity"("dueAt", "completedAt");
CREATE INDEX "Lead_crmContactId_idx" ON "Lead"("crmContactId");
CREATE INDEX "Appointment_crmContactId_idx" ON "Appointment"("crmContactId");
CREATE INDEX "Message_crmContactId_idx" ON "Message"("crmContactId");

ALTER TABLE "CrmContact" ADD CONSTRAINT "CrmContact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmDeal" ADD CONSTRAINT "CrmDeal_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmDeal" ADD CONSTRAINT "CrmDeal_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmDeal" ADD CONSTRAINT "CrmDeal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "CrmDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_crmContactId_fkey" FOREIGN KEY ("crmContactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_crmContactId_fkey" FOREIGN KEY ("crmContactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_crmContactId_fkey" FOREIGN KEY ("crmContactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create one contact per historical inbound email, retaining the most complete available detail.
INSERT INTO "CrmContact" ("id", "name", "email", "phone", "source", "createdAt", "updatedAt")
SELECT
  CONCAT('crm_contact_', md5(src."email")),
  (array_agg(src."name" ORDER BY src."createdAt" DESC))[1],
  src."email",
  (array_agg(src."phone" ORDER BY src."createdAt" DESC) FILTER (WHERE src."phone" IS NOT NULL))[1],
  (array_agg(src."source" ORDER BY src."createdAt" DESC) FILTER (WHERE src."source" IS NOT NULL))[1],
  MIN(src."createdAt"),
  MAX(src."createdAt")
FROM (
  SELECT "name", "email", "phone", "source", "createdAt" FROM "Lead"
  UNION ALL
  SELECT "name", "email", "phone", 'appointment', "createdAt" FROM "Appointment"
  UNION ALL
  SELECT "name", "email", NULL, 'message', "createdAt" FROM "Message"
) AS src
WHERE src."email" IS NOT NULL AND src."email" <> ''
GROUP BY src."email";

UPDATE "Lead" lead
SET "crmContactId" = contact."id"
FROM "CrmContact" contact
WHERE contact."email" = lead."email";

UPDATE "Appointment" appointment
SET "crmContactId" = contact."id"
FROM "CrmContact" contact
WHERE contact."email" = appointment."email";

UPDATE "Message" message
SET "crmContactId" = contact."id"
FROM "CrmContact" contact
WHERE contact."email" = message."email";

-- Preserve historical inbound records in the contact timeline.
INSERT INTO "CrmActivity" ("id", "type", "body", "contactId", "createdAt")
SELECT CONCAT('crm_lead_', lead."id"), 'SYSTEM'::"CrmActivityType", CONCAT('Lead reçu', CASE WHEN lead."message" IS NULL OR lead."message" = '' THEN '' ELSE CONCAT(' : ', lead."message") END), lead."crmContactId", lead."createdAt"
FROM "Lead" lead
WHERE lead."crmContactId" IS NOT NULL;

INSERT INTO "CrmActivity" ("id", "type", "body", "contactId", "createdAt")
SELECT CONCAT('crm_appointment_', appointment."id"), 'SYSTEM'::"CrmActivityType", CONCAT('Visite demandée le ', to_char(appointment."date", 'YYYY-MM-DD HH24:MI')), appointment."crmContactId", appointment."createdAt"
FROM "Appointment" appointment
WHERE appointment."crmContactId" IS NOT NULL;

INSERT INTO "CrmActivity" ("id", "type", "body", "contactId", "createdAt")
SELECT CONCAT('crm_message_', message."id"), 'SYSTEM'::"CrmActivityType", CONCAT('Message reçu', CASE WHEN message."subject" IS NULL OR message."subject" = '' THEN '' ELSE CONCAT(' — ', message."subject") END, ' : ', message."body"), message."crmContactId", message."createdAt"
FROM "Message" message
WHERE message."crmContactId" IS NOT NULL;

-- Create one pipeline opportunity per historical lead and map its current lifecycle stage.
INSERT INTO "CrmDeal" ("id", "title", "stage", "source", "probability", "contactId", "propertyId", "ownerId", "createdAt", "updatedAt")
SELECT
  CONCAT('crm_deal_', lead."id"),
  CONCAT('Projet immobilier — ', lead."name"),
  CASE lead."status"
    WHEN 'NEW'::"LeadStatus" THEN 'NEW'::"CrmDealStage"
    WHEN 'CONTACTED'::"LeadStatus" THEN 'QUALIFIED'::"CrmDealStage"
    WHEN 'QUALIFIED'::"LeadStatus" THEN 'VIEWING'::"CrmDealStage"
    WHEN 'CONVERTED'::"LeadStatus" THEN 'WON'::"CrmDealStage"
    WHEN 'LOST'::"LeadStatus" THEN 'LOST'::"CrmDealStage"
  END,
  lead."source",
  CASE lead."status"
    WHEN 'NEW'::"LeadStatus" THEN 10
    WHEN 'CONTACTED'::"LeadStatus" THEN 30
    WHEN 'QUALIFIED'::"LeadStatus" THEN 55
    WHEN 'CONVERTED'::"LeadStatus" THEN 100
    WHEN 'LOST'::"LeadStatus" THEN 0
  END,
  lead."crmContactId",
  lead."propertyId",
  agent."userId",
  lead."createdAt",
  lead."createdAt"
FROM "Lead" lead
LEFT JOIN "Property" property ON property."id" = lead."propertyId"
LEFT JOIN "Agent" agent ON agent."id" = property."agentId"
WHERE lead."crmContactId" IS NOT NULL;

-- Preserve agent ownership for imported lead contacts so agent-scoped CRM access
-- includes their historical enquiries.
UPDATE "CrmContact" contact
SET "ownerId" = agent."userId"
FROM "Lead" lead
JOIN "Property" property ON property."id" = lead."propertyId"
JOIN "Agent" agent ON agent."id" = property."agentId"
WHERE lead."crmContactId" = contact."id"
  AND contact."ownerId" IS NULL
  AND agent."userId" IS NOT NULL;

UPDATE "CrmContact" contact
SET "ownerId" = agent."userId"
FROM "Appointment" appointment
JOIN "Agent" agent ON agent."id" = appointment."agentId"
WHERE appointment."crmContactId" = contact."id"
  AND contact."ownerId" IS NULL
  AND agent."userId" IS NOT NULL;
