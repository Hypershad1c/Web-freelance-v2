# Domify — Find Your Perfect Place

Domify is a premium Moroccan real-estate platform built with **Next.js 15**, **React 19**, **TypeScript**, **Tailwind CSS**, **Prisma**, **PostgreSQL**, and **Auth.js**. It provides a public property marketplace, an operational back office, and an integrated CRM for properties, locations, agencies, agents, content, leads, visits, relationships, SEO, analytics, permissions, and media.

## Product capabilities

The public experience includes property discovery, server-side filtering by city, transaction type, property type, maximum price, and reference; property details; favorites; comparison; map search; city and neighborhood discovery; agency and advisor profiles; blog; valuation requests; mortgage and investment calculators; contact forms; lead capture; appointment booking; and credentials or Google authentication.

The administrative experience provides authenticated, role-aware management of properties, cities, neighborhoods, property types, amenities, agencies, advisors, media, users, permissions, blog content, testimonials, leads, appointments, messages, SEO entries, analytics, and site settings. The integrated **CRM** automatically unifies future leads, appointments, and messages into deduplicated contacts, opportunities, activities, follow-ups, and an owner-scoped pipeline. It also includes property bulk actions, CSV import/export, lead Kanban, approval workflow, audit logging, notifications, and agent performance reporting.

## Stack

| Area | Implementation |
|---|---|
| Application | Next.js 15 App Router, React 19, TypeScript |
| Styling and UI | Tailwind CSS, Domify design tokens, reusable Shadcn-style button primitive, Lucide icons |
| Data | Prisma 7, PostgreSQL, SQL migrations, seed data |
| Authentication | Auth.js / NextAuth v5 with credentials and optional Google sign-in |
| Forms and validation | React Hook Form for public discovery, Zod validation for server actions and API requests |
| Media | Cloudinary direct-upload signatures with URL fallback |
| Maps and motion | React Leaflet, Framer Motion with reduced-motion support |
| Security and monitoring | Nonce-based CSP, Turnstile, honeypot protection, cookie consent, Sentry hooks, audit log |

## Local setup

1. Copy the environment template and configure a PostgreSQL database.

```bash
cp .env.example .env
```

2. Install packages, generate the Prisma client, apply migrations, optionally seed demonstration content, and start the local application.

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000). The database seed creates a demonstration administrator. Change all seeded passwords before using a shared or production environment.

## Quality checks

```bash
npm run lint
npm run test
npm run build
```

The repository contains a migration-aware Vercel build command:

```bash
npm run vercel-build
```

This command regenerates the Prisma client, deploys migrations, and builds the Next.js application. Configure the production environment variables in Vercel before deploying.

## Required production configuration

At a minimum, production requires `DATABASE_URL`, `POSTGRES_URL`, `NEXTAUTH_URL`, `AUTH_SECRET`, and `NEXTAUTH_SECRET`. Configure the optional Cloudinary, Turnstile, Resend, Google, and Sentry variables when those services are enabled. The full key list and safe placeholders are in [`.env.example`](.env.example).

Set public identity and contact information in **Admin → Paramètres** after sign-in. The public footer and contact page read this configuration from the database; no fabricated contact number or address is displayed when values are not configured.

## Deployment

The project is configured for Vercel through [`vercel.json`](vercel.json). Pushes to the configured production branch trigger a deployment. For a manual deployment, ensure the production database is reachable and that migrations have been applied. Refer to [`PRODUCTION_ACCESS_SETUP.md`](PRODUCTION_ACCESS_SETUP.md) and [`SECURITY_SETUP.md`](SECURITY_SETUP.md) for detailed operational notes.

## Project structure

```text
src/app/(site)        Public marketplace routes
src/app/admin         Protected administration routes
src/app/api           API endpoints
src/components        Shared public, admin, map, form, motion, and UI primitives
src/lib               Auth, data access, server actions, validation, and services
prisma                Schema, migrations, seed, and bootstrap utility
```

## Accessibility and UX

Domify supports keyboard focus styling, responsive layouts, server-side public filtering, clear empty states, and `prefers-reduced-motion`. Motion is restricted to short transform and opacity transitions. Public pages are French-first with runtime English and Arabic translation support, including RTL utilities.
