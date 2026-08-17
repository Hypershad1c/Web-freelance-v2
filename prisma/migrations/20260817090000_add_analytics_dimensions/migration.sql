ALTER TABLE "AnalyticsEvent"
  ADD COLUMN "visitorId" TEXT,
  ADD COLUMN "sessionId" TEXT,
  ADD COLUMN "deviceType" TEXT,
  ADD COLUMN "locale" TEXT,
  ADD COLUMN "propertyId" TEXT;

CREATE INDEX "AnalyticsEvent_visitorId_createdAt_idx" ON "AnalyticsEvent"("visitorId", "createdAt");
CREATE INDEX "AnalyticsEvent_sessionId_createdAt_idx" ON "AnalyticsEvent"("sessionId", "createdAt");
CREATE INDEX "AnalyticsEvent_propertyId_type_createdAt_idx" ON "AnalyticsEvent"("propertyId", "type", "createdAt");
