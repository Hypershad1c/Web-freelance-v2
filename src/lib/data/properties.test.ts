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
  it("returns every published property marked as featured", async () => {
    const featured = [{ id: "feature-1" }, { id: "feature-2" }, { id: "feature-3" }] as never[];
    mockIsPrismaReady.mockResolvedValue(true);
    mockFindMany.mockResolvedValueOnce(featured);

    await expect(getHomepageProperties()).resolves.toEqual(featured);
    expect(mockFindMany).toHaveBeenCalledTimes(1);
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: "PUBLISHED", featured: true },
      orderBy: { updatedAt: "desc" },
    }));
    expect(mockFindMany.mock.calls[0][0]).not.toHaveProperty("take");
  });

  it("does not add unmarked published inventory to the homepage", async () => {
    const featured = [{ id: "feature-1" }] as never[];
    mockIsPrismaReady.mockResolvedValue(true);
    mockFindMany.mockResolvedValueOnce(featured);

    await expect(getHomepageProperties()).resolves.toEqual(featured);
    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });

  it("never exposes listings when Prisma is unavailable", async () => {
    mockIsPrismaReady.mockResolvedValue(false);

    await expect(getHomepageProperties()).resolves.toEqual([]);
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});
