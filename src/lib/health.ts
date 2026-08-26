export type HealthSnapshot = {
  status: "healthy" | "degraded";
  service: "domify";
  timestamp: string;
  checks: { database: "ok" | "unavailable" };
};

export function createHealthSnapshot(databaseAvailable: boolean, now = new Date()): HealthSnapshot {
  return {
    status: databaseAvailable ? "healthy" : "degraded",
    service: "domify",
    timestamp: now.toISOString(),
    checks: { database: databaseAvailable ? "ok" : "unavailable" },
  };
}
