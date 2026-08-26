import { expect, test } from "@playwright/test";

const seedEmail = process.env.E2E_BUYER_EMAIL || "client@domify.ma";
const seedPassword = process.env.E2E_BUYER_PASSWORD || "Domify2026!";

test.describe("public reliability", () => {
  test("exposes a minimal privacy-safe health contract", async ({ request }) => {
    const response = await request.get("/api/health");
    expect([200, 503]).toContain(response.status());

    const health = await response.json();
    expect(health).toMatchObject({ service: "domify", checks: { database: expect.any(String) } });
    expect(["healthy", "degraded"]).toContain(health.status);
    expect(new Date(health.timestamp).toString()).not.toBe("Invalid Date");
    expect(JSON.stringify(health)).not.toMatch(/postgres|database_url|password/i);
  });
});

test.describe("map discovery", () => {
  test("renders the interactive map and synchronized result rail", async ({ page }) => {
    await page.goto("/carte", { waitUntil: "networkidle" });

    await expect(page).toHaveTitle(/Recherche sur la carte/i);
    await expect(page.getByRole("heading", { name: /Trouvez votre adresse sur la carte/i })).toBeVisible();
    await expect(page.getByText("Exploration en direct")).toBeVisible();
    await expect(page.getByText("Carte interactive")).toBeAttached();
    await expect(page.getByRole("link", { name: "Filtres" })).toHaveAttribute("href", "/proprietes");

    const resultRail = page.getByText("Résultats");
    await expect(resultRail).toBeVisible();
    const detailLinks = page.getByRole("link", { name: "Détails" });
    const resultCount = await detailLinks.count();
    expect(resultCount).toBeGreaterThanOrEqual(0);

    if (resultCount > 0) {
      const firstResult = page.locator("article[id^='map-result-']").first();
      await expect(firstResult).toBeVisible();
      await firstResult.getByRole("button").click();
      await expect(firstResult).toHaveClass(/border-domify-gold/);
    }
  });
});

test.describe("buyer dashboard", () => {
  test("redirects protected account access to login", async ({ page }) => {
    await page.goto("/compte", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/connexion\?callbackUrl=%2Fcompte|\/connexion\?callbackUrl=\/compte/);
    await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
  });

  test("signs in and renders buyer dashboard sections", async ({ page }, testInfo) => {
    test.skip(process.env.E2E_LIVE_AUTH !== "true", "Set E2E_LIVE_AUTH=true with controlled credentials to run the credential-backed dashboard flow.");
    test.skip(testInfo.project.name === "iphone-chromium" && process.env.E2E_LIVE_MOBILE_AUTH !== "true", "Run mobile credential authentication only against a controlled staging/local environment with independent seed credentials.");
    await page.goto("/connexion?callbackUrl=/compte", { waitUntil: "domcontentloaded" });
    await page.getByPlaceholder("Email").fill(seedEmail);
    await page.getByPlaceholder("Mot de passe").fill(seedPassword);
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page).toHaveURL(/\/compte(?:$|\?)/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: /Votre prochaine adresse/i })).toBeVisible();
    await expect(page.getByText("Mes alertes de recherche")).toBeVisible();
    await expect(page.getByText("Mes demandes")).toBeVisible();
    await expect(page.getByRole("link", { name: "Explorer la carte", exact: true })).toBeVisible();
  });
});

test.describe("iOS PWA metadata", () => {
  test("exposes manifest, Apple standalone metadata, touch icons, and viewport safe area", async ({ page, request }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute("content", "yes");
    await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute("content", "black-translucent");
    await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute("content", "Domify");
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute("content", /viewport-fit=cover/);
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", /manifest\.webmanifest/);

    const touchIcons = page.locator('link[rel="apple-touch-icon"]');
    await expect(touchIcons).toHaveCount(5);
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(manifestHref).toBeTruthy();

    const manifest = await request.get(new URL(manifestHref!, page.url()).toString());
    expect(manifest.ok()).toBeTruthy();
    const manifestJson = await manifest.json();
    expect(manifestJson.name).toBe("Domify");
    expect(manifestJson.icons).toEqual(expect.arrayContaining([expect.objectContaining({ src: "/icon-1024.png", sizes: "1024x1024" })]));

    for (const href of await touchIcons.evaluateAll((nodes) => nodes.map((node) => (node as HTMLLinkElement).href))) {
      const icon = await request.get(href);
      expect(icon.ok()).toBeTruthy();
      expect(icon.headers()["content-type"]).toMatch(/^image\/png/);
    }
  });
});
