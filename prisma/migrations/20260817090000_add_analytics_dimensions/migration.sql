ALTER TABLE "AnalyticsEvent"
  ADD COLUMN "visitorId" TEXT,
  ADD COLUMN "sessionId" TEXT,
  ADD COLUMN "deviceType" TEXT,
  ADD COLUMN "locale" TEXT,
  ADD COLUMN "propertyId" TEXT;

CREATE INDEX "AnalyticsEvent_visitorId_createdAt_idx" ON "AnalyticsEvent"("visitorId", "createdAt");
CREATE INDEX "AnalyticsEvent_sessionId_createdAt_idx" ON "AnalyticsEvent"("sessionId", "createdAt");
CREATE INDEX "AnalyticsEvent_propertyId_type_createdAt_idx" ON "AnalyticsEvent"("propertyId", "type", "createdAt");

CREATE INDEX "AnalyticsEvent_type_source_createdAt_idx" ON "AnalyticsEvent"("type", "source", "createdAt");
CREATE INDEX "AnalyticsEvent_campaign_createdAt_idx" ON "AnalyticsEvent"("campaign", "createdAt");

CREATE INDEX "AnalyticsEvent_type_createdAt_idx" ON "AnalyticsEvent"("type", "createdAt");
CREATE INDEX "AnalyticsEvent_path_createdAt_idx" ON "AnalyticsEvent"("path", "createdAt");
CREATE INDEX "AnalyticsEvent_deviceType_createdAt_idx" ON "AnalyticsEvent"("deviceType", "createdAt");
CREATE INDEX "AnalyticsEvent_locale_createdAt_idx" ON "AnalyticsEvent"("locale", "createdAt");
