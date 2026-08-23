import { writeFile } from "node:fs/promises";

const baseUrl = process.env.DOMIFY_BASE_URL ?? "https://domify.ma";

const publicRoutes = [
  "/", "/a-propos", "/agences", "/agences/domify-prestige", "/agents", "/blog", "/blog/5-conseils-acheter-au-meilleur-prix",
  "/calculateur-credit", "/calculateur-investissement", "/carte", "/comparer", "/compte", "/conditions-generales", "/connexion",
  "/contact", "/espace-vendeur", "/espace-vendeur/statistiques", "/estimation", "/faq", "/favoris", "/financement", "/inscription",
  "/mot-de-passe-oublie", "/politique-de-confidentialite", "/proprietes", "/proprietes/cmscgdrlh000yucvi8r9ebhug", "/quartiers",
  "/quartiers/souissi", "/reinitialiser-mot-de-passe/test-invalid-token", "/tarifs", "/vendre-louer", "/villes", "/villes/rabat",
];

const apiRoutes = [
  "/api/admin/analytics/export", "/api/admin/analytics/report", "/api/admin/billing/alerts", "/api/admin/billing/renew", "/api/admin/crm/automation/run",
  "/api/admin/lead-notification-test", "/api/admin/leads/test-safe-id", "/api/admin/leads/test-safe-id/resend-notification", "/api/admin/leads/sla",
  "/api/admin/owner-reports/run", "/api/admin/properties/export", "/api/analytics", "/api/appointments", "/api/auth/session", "/api/auth/forgot-password", "/api/auth/reset-password",
  "/api/availability", "/api/billing/paytabs/callback", "/api/billing/paytabs/checkout", "/api/billing/paytabs/return", "/api/buyer-onboarding", "/api/cloudinary/sign",
  "/api/concierge/whatsapp", "/api/favorite-collections", "/api/favorites", "/api/financing", "/api/leads", "/api/matching/recommendations", "/api/messages",
  "/api/notifications", "/api/portal/conversations", "/api/portal/conversations/test-safe-id", "/api/properties", "/api/realtime/auth", "/api/register",
  "/api/seller/media/sign", "/api/seller/properties", "/api/valuation", "/api/webhooks/lumin", "/api/webhooks/twilio/inbound", "/api/webhooks/twilio/status",
];

const dynamicRouteSources = [
  { index: "/agences", expression: /href="(\/agences\/[^"/?#]+)"/g, fallback: "/agences/domify-prestige" },
  { index: "/agents", expression: /href="(\/agents\/[^"/?#]+)"/g, fallback: "/agents" },
  { index: "/blog", expression: /href="(\/blog\/[^"/?#]+)"/g, fallback: "/blog" },
  { index: "/proprietes", expression: /href="(\/proprietes\/[^"/?#]+)"/g, fallback: "/proprietes/cmscgdrlh000yucvi8r9ebhug" },
  { index: "/quartiers", expression: /href="(\/quartiers\/[^"/?#]+)"/g, fallback: "/quartiers/souissi" },
  { index: "/villes", expression: /href="(\/villes\/[^"/?#]+)"/g, fallback: "/villes/rabat" },
];

async function probe(path, kind) {
  const startedAt = Date.now();
  try {
    const response = await fetch(new URL(path, baseUrl), {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": "Domify non-destructive coverage audit" },
      signal: AbortSignal.timeout(20_000),
    });
    const contentType = response.headers.get("content-type") ?? "";
    const text = contentType.includes("text") || contentType.includes("json") ? (await response.text()).slice(0, 180) : "";
    return {
      kind,
      path,
      status: response.status,
      outcome: response.status >= 500 ? "failure" : response.status >= 200 && response.status < 400 ? "success" : "expected-non-success",
      location: response.headers.get("location"),
      durationMs: Date.now() - startedAt,
      bodyPreview: text.replace(/\s+/g, " ").trim(),
    };
  } catch (error) {
    return { kind, path, status: null, outcome: "failure", location: null, durationMs: Date.now() - startedAt, bodyPreview: error instanceof Error ? error.message : String(error) };
  }
}

async function mapWithConcurrency(items, concurrency = 6) {
  const results = [];
  for (let index = 0; index < items.length; index += concurrency) {
    results.push(...await Promise.all(items.slice(index, index + concurrency).map(({ path, kind }) => probe(path, kind))));
  }
  return results;
}

async function discoverDynamicRoutes() {
  const discovered = [];
  for (const source of dynamicRouteSources) {
    try {
      const response = await fetch(new URL(source.index, baseUrl), { redirect: "follow", signal: AbortSignal.timeout(20_000) });
      const body = await response.text();
      const match = source.expression.exec(body);
      discovered.push(match?.[1] ?? source.fallback);
    } catch {
      discovered.push(source.fallback);
    }
  }
  return discovered;
}

const dynamicRoutes = await discoverDynamicRoutes();
const results = await mapWithConcurrency([
  ...[...new Set([...publicRoutes, ...dynamicRoutes])].map((path) => ({ path, kind: "page" })),
  ...apiRoutes.map((path) => ({ path, kind: "api-get-probe" })),
]);

const summary = results.reduce((accumulator, result) => {
  accumulator[result.outcome] = (accumulator[result.outcome] ?? 0) + 1;
  return accumulator;
}, { success: 0, "expected-non-success": 0, failure: 0 });

const report = { baseUrl, generatedAt: new Date().toISOString(), summary, dynamicRoutes, results };
await writeFile("/tmp/domify-live-route-audit.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(summary));
for (const failure of results.filter((result) => result.outcome === "failure")) console.log(`FAIL\t${failure.kind}\t${failure.path}\t${failure.status}\t${failure.bodyPreview}`);
