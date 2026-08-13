import { afterEach, describe, expect, it, vi } from "vitest";

const { mockFindMany, mockIsPrismaReady } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockIsPrismaReady: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { property: { findMany: mockFindMany } },
  isPrismaReady: mockIsPrismaReady,
}));

import { getHomepageProperties } from "@/lib/data/properties";

afterEach(() => {
  mockFindMany.mockReset();
  mockIsPrismaReady.mockReset();
});

describe("getHomepageProperties", () => {
  it("returns only admin-featured, published properties when the curated selection fills the grid", async () => {
    const featured = [{ id: "feature-1" }, { id: "feature-2" }] as never[];
    mockIsPrismaReady.mockResolvedValue(true);
    mockFindMany.mockResolvedValueOnce(featured);

    await expect(getHomepageProperties(2)).resolves.toEqual(featured);
    expect(mockFindMany).toHaveBeenCalledTimes(1);
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: "PUBLISHED", featured: true },
      take: 2,
    }));
  });

  it("keeps marked properties first, then fills remaining cards from recent published inventory", async () => {
    const featured = [{ id: "feature-1" }] as never[];
    const fallback = [{ id: "published-2" }, { id: "published-3" }] as never[];
    mockIsPrismaReady.mockResolvedValue(true);
    mockFindMany.mockResolvedValueOnce(featured).mockResolvedValueOnce(fallback);

    await expect(getHomepageProperties(3)).resolves.toEqual([...featured, ...fallback]);
    expect(mockFindMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: { status: "PUBLISHED", id: { notIn: ["feature-1"] } },
      take: 2,
    }));
  });

  it("never exposes listings when Prisma is unavailable", async () => {
    mockIsPrismaReady.mockResolvedValue(false);

    await expect(getHomepageProperties(4)).resolves.toEqual([]);
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});
