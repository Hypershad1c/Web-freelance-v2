import { describe, expect, it } from "vitest";
import { sanitizeCallbackUrl } from "./safe-redirect";

describe("sanitizeCallbackUrl", () => {
  it("accepts a safe relative path with query and hash", () => {
    expect(sanitizeCallbackUrl("/admin?tab=users#recent")).toBe("/admin?tab=users#recent");
  });

  it("falls back for external and protocol-relative URLs", () => {
    expect(sanitizeCallbackUrl("https://evil.example/phishing")).toBe("/");
    expect(sanitizeCallbackUrl("//evil.example/phishing")).toBe("/");
  });

  it("falls back for encoded redirect tricks and malformed values", () => {
    expect(sanitizeCallbackUrl("/%5C%5Cevil.example")).toBe("/");
    expect(sanitizeCallbackUrl("/%E0%A4%A")).toBe("/");
    expect(sanitizeCallbackUrl("javascript:alert(1)")).toBe("/");
  });

  it("supports a caller-provided fallback", () => {
    expect(sanitizeCallbackUrl(undefined, "/proprietes")).toBe("/proprietes");
  });
});
