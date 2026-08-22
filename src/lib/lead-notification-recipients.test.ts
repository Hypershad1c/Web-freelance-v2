import { describe, expect, it } from "vitest";
import { resolveLeadNotificationRecipients } from "@/lib/lead-notification-recipients";

describe("resolveLeadNotificationRecipients", () => {
  it("notifies every valid administrator and the assigned agent without duplicate deliveries", () => {
    expect(resolveLeadNotificationRecipients({
      administratorEmails: ["admin@domify.ma", "OPS@domify.ma", null],
      configuredAdminEmail: "Admin@domify.ma",
      agentEmail: "agent@domify.ma",
    })).toEqual(["Admin@domify.ma", "OPS@domify.ma", "agent@domify.ma"]);
  });

  it("excludes malformed or empty recipient values", () => {
    expect(resolveLeadNotificationRecipients({
      administratorEmails: ["not-an-email", ""],
      configuredAdminEmail: "",
      agentEmail: null,
    })).toEqual([]);
  });
});
