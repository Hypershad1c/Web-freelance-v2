import { describe, expect, it } from "vitest";
import { isValidContactEmail, normalizeContactPhone, normalizeExternalUrl } from "./settings-validation";

describe("settings validation", () => {
  it("normalizes safe external URLs while rejecting malformed or credential-bearing links", () => {
    expect(normalizeExternalUrl("instagram.com/domify")).toBe("https://instagram.com/domify");
    expect(normalizeExternalUrl("https://www.linkedin.com/company/domify")).toBe("https://www.linkedin.com/company/domify");
    expect(normalizeExternalUrl("javascript:alert(1)")).toBe("");
    expect(normalizeExternalUrl("https://user:secret@example.com")).toBe("");
    expect(normalizeExternalUrl("not a link")).toBe("");
  });

  it("accepts valid contact email and preserves only useful phone characters", () => {
    expect(isValidContactEmail("contact@domify.ma")).toBe(true);
    expect(isValidContactEmail("invalid@email")).toBe(false);
    expect(normalizeContactPhone(" +212 (0) 5 00 00 00 00 ext. ")).toBe("+212 (0) 5 00 00 00 00 .");
  });
});
