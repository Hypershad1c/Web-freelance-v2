ALTER TABLE "AnalyticsEvent"
  ADD COLUMN IF NOT EXISTS "visitorId" TEXT,
  ADD COLUMN IF NOT EXISTS "sessionId" TEXT,
  ADD COLUMN IF NOT EXISTS "deviceType" TEXT,
  ADD COLUMN IF NOT EXISTS "locale" TEXT,
  ADD COLUMN IF NOT EXISTS "propertyId" TEXT;

CREATE INDEX IF NOT EXISTS "AnalyticsEvent_visitorId_createdAt_idx" ON "AnalyticsEvent"("visitorId", "createdAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_sessionId_createdAt_idx" ON "AnalyticsEvent"("sessionId", "createdAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_propertyId_type_createdAt_idx" ON "AnalyticsEvent"("propertyId", "type", "createdAt");
