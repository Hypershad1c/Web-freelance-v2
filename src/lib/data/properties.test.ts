import { afterEach, describe, expect, it, vi } from "vitest";

const { mockFindMany, mockIsPrismaReady } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockIsPrismaReady: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { property: { findMany: mockFindMany } },
  isPrismaReady: mockIsPrismaReady,
}));

import { getHomepageProperties, getProperties } from "@/lib/data/properties";

afterEach(() => {
  mockFindMany.mockReset();
  mockIsPrismaReady.mockReset();
});

describe("getHomepageProperties", () => {
  it("returns all published properties with featured listings first", async () => {
    const published = [{ id: "feature-1" }, { id: "published-2" }, { id: "feature-3" }] as never[];
    mockIsPrismaReady.mockResolvedValue(true);
    mockFindMany.mockResolvedValueOnce(published);

    await expect(getHomepageProperties()).resolves.toEqual(published);
    expect(mockFindMany).toHaveBeenCalledTimes(1);
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: "PUBLISHED" },
      orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    }));
  });

  it("never exposes listings when Prisma is unavailable", async () => {
    mockIsPrismaReady.mockResolvedValue(false);

    await expect(getHomepageProperties()).resolves.toEqual([]);
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});

describe("getProperties", () => {
  it("returns published rental inventory when the LOCATION filter is selected", async () => {
    const rentals = [{ id: "rental-1", listingType: "LOCATION" }] as never[];
    mockFindMany.mockResolvedValueOnce(rentals);

    await expect(getProperties({ listingType: "LOCATION" })).resolves.toEqual(rentals);
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: "PUBLISHED", listingType: "LOCATION" }),
    }));
  });
});
