# Domify route and endpoint coverage audit — 23 August 2026

## Coverage method

This audit uses **non-destructive requests only**. Public pages are expected to return a successful page response, authenticated pages are expected to return a successful response for the active session or redirect to sign-in, and administrator pages are expected to return a successful response for the active ADMIN session. Mutating routes are not submitted with arbitrary production payloads; they are checked for route reachability and access-control behavior only.

| Surface | Coverage | Expected behavior |
|---|---:|---|
| Public page routes | 34 route modules, with safe live dynamic examples where available | `200` or an intentional redirect, never `5xx` |
| Admin page routes | 34 route modules | `200` for the active ADMIN session, never `5xx` |
| API route modules | 38 modules | Safe `GET` handlers return their documented status; protected or mutation-only handlers may return `401`, `403`, `405`, or `400` for a deliberately incomplete non-mutating probe, never `5xx` |
| Existing automated suite | 30 tests | All tests must pass |
| Production build | Next.js production build with placeholder database | Must complete; placeholder-database messages during static collection are expected |

## Important boundaries

No test lead, contact message, financing application, registration, password-reset email, payment request, webhook event, media upload, deletion, or data-changing CRM action is created by this audit. Endpoints that require a valid object identifier or signed integration payload are tested through their safe access-control path rather than with fabricated production data.

## Initial live results

The unauthenticated smoke test covered all 34 public page routes and 40 API route modules without any `5xx` response. It recorded 39 successful or intentional redirects and 34 expected access-control or method responses.

The active browser session returned `200` for all 35 inventoried ADMIN page routes. However, the same session returned reproducible `500` responses from the safe read-only API probes for `/api/admin/analytics/export`, `/api/admin/analytics/report`, `/api/admin/properties/export`, `/api/favorite-collections`, `/api/favorites`, `/api/matching/recommendations`, `/api/notifications`, and `/api/portal/conversations`. `/api/admin/billing/alerts` returned `401`. These are active investigation items; no mutation endpoint has been invoked.

The first authenticated API probe used a parallel browser batch. A direct follow-up navigation to `/api/favorites` immediately returned `200` with an empty list, so the apparent `500` cluster may be connection-pool pressure from the audit itself rather than a persistent route failure. The remaining safe reads must therefore be retested serially before a defect is confirmed.

The serial authenticated retest returned `200` for all eight safe read APIs: favorite collections, favorites, matching recommendations, notifications, portal conversations, analytics CSV export, analytics report, and property CSV export. The live NextAuth session also returned a valid ADMIN user identifier and role. To reduce the connection burst that caused the initial parallel-probe failures, the Prisma PostgreSQL adapter now uses a single connection per warm serverless instance with short connection and idle timeouts.

All 35 ADMIN list, overview, settings, creation, and operational pages returned `200` under the active ADMIN session. Real discovered detail routes for an agency, agent, blog post, CRM contact, property, and user also returned `200`.
