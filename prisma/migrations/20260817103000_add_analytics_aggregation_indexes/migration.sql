CREATE INDEX IF NOT EXISTS "AnalyticsEvent_medium_createdAt_idx" ON "AnalyticsEvent"("medium", "createdAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_deviceType_createdAt_idx" ON "AnalyticsEvent"("deviceType", "createdAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_locale_createdAt_idx" ON "AnalyticsEvent"("locale", "createdAt");
