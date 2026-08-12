# Domify security integrations

The application now uses a per-request nonce CSP, Cloudflare Turnstile for public submissions, a visitor consent banner before optional analytics, and optional Sentry monitoring. No service worker is registered or required.

| Variable | Required in production | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Yes | Public Cloudflare Turnstile site key used by contact, lead, viewing-request, and registration forms. |
| `TURNSTILE_SECRET_KEY` | Yes | Private Turnstile key used only by the server to call Siteverify. |
| `SENTRY_DSN` | Recommended | Server and Edge Sentry DSN. |
| `NEXT_PUBLIC_SENTRY_DSN` | Recommended | Browser Sentry DSN. |
| `SENTRY_AUTH_TOKEN` | Optional | Enables source-map upload during production builds. |
| `SENTRY_ORG` / `SENTRY_PROJECT` | Optional | Identifies the Sentry destination for source-map upload. |

Create a Cloudflare Turnstile widget for the deployed domain, add its site and secret keys to the host environment, then redeploy. Each public form sends a token to the server, where the action is verified through Cloudflare Siteverify before a database record is created. The server fails closed in production when `TURNSTILE_SECRET_KEY` is missing.

The CSP removes `unsafe-inline` from `script-src` and uses a nonce with `strict-dynamic`. The Turnstile script, Next runtime, and JSON-LD structured-data script receive the same request nonce. The `style-src` policy keeps `unsafe-inline` because the existing visual system and framework output include inline styles.

Sentry is inert until a DSN is set. The configuration does not send default PII and samples 10% of traces. The app exposes a tunnel at `/monitoring` to avoid browser-side DSN requests being blocked by common content blockers.
