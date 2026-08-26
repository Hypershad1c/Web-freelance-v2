import { describe, expect, it } from "vitest";
import { createHealthSnapshot } from "./health";

describe("createHealthSnapshot", () => {
  const timestamp = new Date("2026-08-26T12:00:00.000Z");

  it("returns a minimal healthy response without implementation details", () => {
    expect(createHealthSnapshot(true, timestamp)).toEqual({
      status: "healthy",
      service: "domify",
      timestamp: "2026-08-26T12:00:00.000Z",
      checks: { database: "ok" },
    });
  });

  it("reports a degraded dependency state without exposing a database error", () => {
    const snapshot = createHealthSnapshot(false, timestamp);
    expect(snapshot).toEqual(expect.objectContaining({ status: "degraded", checks: { database: "unavailable" } }));
    expect(JSON.stringify(snapshot)).not.toContain("postgres");
    expect(JSON.stringify(snapshot)).not.toContain("DATABASE_URL");
  });
});
