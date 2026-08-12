# Production access setup

Domify requires an active PostgreSQL database, an Auth.js secret, and a valid deployment domain before public records, user sign-in, and the administrator dashboard can operate together.

| Setting | Production value | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string with SSL/pooling as supplied by the host | Connects all public, account, and admin database operations. |
| `AUTH_SECRET` | A new random secret of at least 32 characters | Signs Auth.js session tokens. |
| `AUTH_URL` / `NEXTAUTH_URL` | The actual active site origin, with no trailing slash | Keeps sign-in and OAuth callbacks on the deployed site. Remove an old `https://www.domify.ma` value if that domain is not live. |
| `NEXT_PUBLIC_APP_URL` | The actual active site origin | Used for application-origin links. |
| `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile credentials | Enables public-form CAPTCHA in production. |

## Configure Vercel

In the Vercel project, add the required variables for the **Production** environment. Ensure the active deployment domain is used consistently for `AUTH_URL`, `NEXTAUTH_URL`, and `NEXT_PUBLIC_APP_URL`. If `www.domify.ma` is intended to be the canonical domain, attach it to the same Vercel project and configure its DNS records. Otherwise, remove it from the environment configuration and use the Vercel deployment domain instead.

The repository contains `vercel.json`, which runs `npm run vercel-build`. That command generates Prisma Client, applies committed migrations, and then compiles Next.js. The deployment will therefore stop rather than serve an application against an outdated database schema.

## Create or recover the administrator account

After `DATABASE_URL` is available, create an administrator with a private database-capable terminal. Set the following environment variables to the desired account values and run:

```bash
ADMIN_EMAIL="owner@example.com" \
ADMIN_PASSWORD="use-a-new-unique-password" \
DATABASE_URL="postgresql://..." \
npm run bootstrap-admin
```

The script creates the account if it does not exist, or resets that account’s password and role to `ADMIN` if it does. It never prints the password. Sign in at `/connexion`, then open `/admin`.

## Verify after deployment

First open the public site and confirm it loads on the active domain. Then open `/connexion`, sign in with the administrator account, and visit `/admin`. The dashboard should render admin sections such as Properties, Leads, Approval queue, Audit log, and Agent performance. If any page reports a database error, verify that `DATABASE_URL` is configured for the Production environment and that the new deployment completed the migration-aware build.
