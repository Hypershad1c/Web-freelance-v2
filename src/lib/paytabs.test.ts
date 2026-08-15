import { describe, expect, it } from "vitest";
import { AGENCY_PLAN_PRICES, getPayTabsToken, isAuthorizedPayTabsResponse } from "@/lib/paytabs";

describe("PayTabs billing helpers", () => {
  it("keeps agency prices server-defined in MAD", () => {
    expect(AGENCY_PLAN_PRICES).toEqual({ STARTER: 499, PRO: 1500, PREMIUM: 4000 });
  });

  it("accepts only an authorized provider response", () => {
    expect(isAuthorizedPayTabsResponse({ payment_result: { response_status: "A" } })).toBe(true);
    expect(isAuthorizedPayTabsResponse({ payment_result: { response_status: "D" } })).toBe(false);
    expect(isAuthorizedPayTabsResponse({})).toBe(false);
  });

  it("extracts a token from supported PayTabs response shapes", () => {
    expect(getPayTabsToken({ token: "token-1" })).toBe("token-1");
    expect(getPayTabsToken({ token_info: { token: "token-2" } })).toBe("token-2");
    expect(getPayTabsToken({ token: "" })).toBeNull();
  });
});
