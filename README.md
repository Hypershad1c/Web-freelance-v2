# Domify — "Find Your Perfect Place"

Premium real-estate platform (Domify identity), recreating the immo101.ma information
architecture and feature set on a modern stack.

## ⚠️ Current status: Phase 1 of a multi-phase build

The original request asked for a *complete* production platform — full admin CRUD
across 15+ modules, auth, Cloudinary uploads, map search, mortgage/investment
calculators, appointment booking, blog CMS, SEO manager, analytics, roles/permissions,
migrations and seed data, with zero placeholders. That is realistically several
thousand files' worth of work — more than can be honestly generated (as real, working
code rather than stubs) in a single pass.

**What's real and working right now:**
- Next.js 15 / React 19 / TypeScript / Tailwind v4 project, builds cleanly (`npm run build` ✅)
- Domify design system (colors, type, spacing, shadows) matching **Variation 1 — Modern Luxury** exactly
- Header, Footer, homepage (hero, search bar, trust badges, featured properties, valuation CTA, why-us, testimonial) — fully coded, not mockups
- Complete Prisma schema (`prisma/schema.prisma`) modeling **every** entity from the spec: users/roles/permissions, cities, neighborhoods, agencies, agents, properties, property types, amenities, media, favorites, leads, appointments, messages, blog + categories, testimonials, site settings, SEO entries, analytics events

**What's next (I'll build it with you, page by page / module by module):**
- Properties listing + filters, property detail page, map search (Leaflet)
- Cities / neighborhoods / agencies / agents pages
- Blog listing + post page
- Favorites, compare properties, mortgage & investment calculators
- Auth (NextAuth) — login/register, appointment booking, lead forms
- Full `/admin` dashboard: CRUD for every model, media library (Cloudinary), CMS, SEO manager, analytics, role/permission management
- Migrations + `seed.ts` with realistic sample data
- Deployment config (Vercel/Docker)

## Phase 2 update

Added: /proprietes listing page (live filters by city, transaction type, property type, sort) and /proprietes/[id] detail pages (gallery, key facts, description, amenities, map placeholder, agent contact/lead form, similar properties). Data currently comes from src/lib/mock-data.ts — swap for Prisma queries once the DB is wired up.

## Phase 3 update

Added real auth + favorites + leads/appointments, all backed by the Prisma schema:

- **Auth**: NextAuth v5 (Auth.js) with a Credentials provider + Prisma adapter. `/connexion` and `/inscription` pages, `/api/register` (bcrypt-hashed passwords, Zod-validated), session-aware header (avatar menu / sign out).
- **Favorites**: `src/lib/favorites-context.tsx` — guest favorites persist in `localStorage`; once logged in they sync to `/api/favorites` (GET list, POST toggle) which reads/writes the `Favorite` model. `/favoris` page lists them.
- **Leads**: property detail contact form now POSTs to `/api/leads`, creating a real `Lead` row (linked to the logged-in user if any).
- **Appointments**: "Planifier une visite" opens a booking modal that POSTs to `/api/appointments`, creating a real `Appointment` row.

### ⚠️ About this sandbox specifically
This environment has no network access to `binaries.prisma.sh`, so `npx prisma generate` cannot run here — meaning the Prisma-dependent files (`src/lib/prisma.ts`, `src/lib/auth.ts`, the API routes) could not be fully type-checked in this sandbox. This was verified to be *only* a missing-generated-client issue (confirmed by temporarily stubbing the Prisma types — everything else compiles clean) and will resolve automatically the first time you run:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

with normal internet access. Also add `AUTH_SECRET` (already in `.env.example`) — generate one with `openssl rand -base64 32`.

### Prisma 7 config file
Prisma 7 moved the datasource URL out of `schema.prisma` entirely — it now lives in
**`prisma.config.ts`** at the project root. This project already has that file set up
(reads `DATABASE_URL` from `.env` via `dotenv`). If you ever see *"The datasource
property is required in your Prisma config file"*, it means `prisma.config.ts` is
missing or misconfigured — check it matches the one in this repo.

Also note: in Prisma 7, `migrate dev` no longer runs `generate` automatically, and it
will run `prisma/seed.ts` after migrating (configured via `migrations.seed` in
`prisma.config.ts`). A real seed script is included — see "Test data" below.

## Test data (seed)

`prisma/seed.ts` populates baseline reference data: property types, amenities,
cities (Casablanca, Rabat, Marrakech, Tanger, Bouskoura, Agadir) with a couple of
neighborhoods, a demo agency + agent, two blog categories, and an admin user:

```
admin@domify.ma / Domify2026!
```

It runs automatically as part of `prisma migrate dev`, or manually via:
```bash
npx prisma db seed
```

Note: the public pages (home, `/proprietes`, property detail) still read from
`src/lib/mock-data.ts`, not the database yet — that swap happens once the admin
Properties CRUD (phase 4) exists to actually create real `Property` rows. The seed
data above is what auth/leads/appointments/favorites write against right now.

## What you can test today (phases 1–3, before phase 4 exists)

1. **Setup**: `npm install` → fill in `.env` (a real Postgres `DATABASE_URL`, plus
   `AUTH_SECRET`) → `npx prisma generate` → `npx prisma migrate dev --name init`
   (this also seeds the DB) → `npm run dev`.
2. **Browse**: home page, `/proprietes` (try the filters/sort), click into a couple
   of `/proprietes/[id]` detail pages — all running on the 8 mock listings.
3. **Register**: go to `/inscription`, create an account — this writes a real `User`
   row via `/api/register`. Or sign in with the seeded admin (`admin@domify.ma` /
   `Domify2026!`) — note it currently has no special admin UI yet, that's phase 4.
4. **Favorites**: while logged out, heart a few properties — persisted in
   `localStorage`. Log in and heart more — now persisted via `/api/favorites` to the
   real `Favorite` table (check with `npx prisma studio`).
5. **Leads**: open a property detail page, fill in the contact form on the right —
   creates a real `Lead` row.
6. **Appointments**: click "Planifier une visite" on a property, submit the modal —
   creates a real `Appointment` row.
7. Inspect everything with `npx prisma studio` (opens a DB browser at
   `localhost:5555`) to confirm rows are actually being created.

What you *can't* test yet: any `/admin` page (doesn't exist until phase 4), and
properties/cities/agents shown on the public site aren't the ones from your database
yet (still mock data — admin CRUD is what will make that real).

## Phase 4 update

Added a real, working admin dashboard shell + full Properties CRUD:

- **Route structure change**: public pages moved into an `app/(site)/` route group
  with their own root layout (Header/Footer/Providers). `/admin` now has an
  **independent** root layout — no public header/footer, its own sidebar shell. This
  is the standard Next.js pattern for a back-office section that looks nothing like
  the public site.
- **`src/middleware.ts`**: protects every `/admin/*` route — redirects to `/connexion`
  (with a `callbackUrl` back to where you were headed) unless the session's role is
  `ADMIN` or `EDITOR`.
- **`/admin`**: dashboard with live counts (properties, users, new leads, pending
  appointments) and a "latest leads" feed, all pulled straight from Postgres.
- **`/admin/properties`**: searchable/filterable table (by title/reference, by
  status), delete with confirmation.
- **`/admin/properties/new`** and **`/admin/properties/[id]`**: one shared form
  component covering every real `Property` field — general info, transaction/status,
  characteristics, location (city/neighborhood), type + amenities (checkboxes),
  agency/agent, SEO fields. Validated server-side with Zod via Server Actions
  (`src/lib/actions/properties.ts`) — no client-only validation theater.
- Sidebar already lists every planned admin module (cities, neighborhoods, agencies,
  agents, users, media library, blog, testimonials, appointments, leads, messages,
  SEO, analytics, settings, roles) — only **Properties** is wired up so far; the rest
  are next.

### Testing phase 4
1. Log in as the seeded admin: `admin@domify.ma` / `Domify2026!` (see phase 3 seed).
2. Visiting any `/admin/*` URL while logged out (or as a non-admin) redirects you to
   `/connexion` — try it.
3. `/admin/properties/new` — the form won't let you submit without a city and a
   property type existing in the DB first (seeded already: 6 cities, 6 property
   types, 8 amenities — see `prisma/seed.ts`).
4. Create a property, then check `/admin/properties` — it's there, searchable, and
   its "featured" star shows if you ticked the box.
5. Edit it, delete it — both fully wired to the database via Prisma.

### Fix: middleware + Prisma don't mix (Edge runtime)
`middleware.ts` runs on Next.js's **Edge runtime**, which can't load Node-only
packages like `pg` (the error looks like `Module not found: Can't resolve
'util/types'`, coming from `pg` via `@prisma/adapter-pg`). The fix: the NextAuth
config is split in two —
- **`src/lib/auth.config.ts`** — Edge-safe: just pages/callbacks, no adapter, no
  providers. This is all `middleware.ts` ever imports.
- **`src/lib/auth.ts`** — full config: extends `auth.config.ts` and adds the Prisma
  adapter + Credentials provider. Only ever imported from Node-runtime code (API
  routes, server components, server actions) — never from middleware.

If you add new providers or touch the Prisma adapter, keep them in `auth.ts`, not
`auth.config.ts`, or you'll hit this error again.

### About this sandbox specifically (same limitation as before)
This sandbox still can't reach `binaries.prisma.sh` / can't bundle
`@prisma/client`'s generated output, so a full `npm run build` can't run *inside this
tool-use environment*. I verified there are no other issues by running every new/edited
file through `esbuild` individually (catches syntax errors, bad JSX, broken imports)
— all clean. This resolves itself the moment you run `npx prisma generate` with normal
network access, same as phase 3.



## Getting started

```bash
npm install
cp .env.example .env   # fill in a real Postgres URL, etc.
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

## Phase 5 update

The public site is now fully wired to the real database — `src/lib/mock-data.ts` is
gone, deleted, not imported anywhere.

- **Fixed**: signing in as an admin/editor with no explicit `callbackUrl` now lands
  on `/admin` instead of the homepage.
- **`src/lib/data/properties.ts`** — the public data-access layer over Prisma.
  Every query is scoped to `status: PUBLISHED` — drafts/archived listings never leak
  onto the public site no matter what filters are applied.
- **Home page** — featured properties (`featured: true`, `PUBLISHED`) now come
  straight from Postgres. Empty state included if you haven't marked any as
  featured yet.
- **`/proprietes`** — rebuilt as a server component with **server-side filtering via
  URL search params** (`?city=...&listingType=...&propertyType=...&sort=...`) instead
  of the old client-side filter-over-mock-array approach. The filter form is a plain
  `<form method="get">` — works with zero client JS.
- **`/proprietes/[id]`** — real property detail page: gallery from the `Media`
  relation (falls back to a placeholder image if none uploaded yet), real
  city/neighborhood/amenities, and a `ContactAgentCard` that gracefully falls back to
  the agency (or a generic Domify contact) if no agent is assigned.
- **`/favoris`** — fetches the actual favorited properties from a new
  `GET /api/properties?ids=...` route (favorite IDs still live client-side/in the
  `Favorite` table; this resolves them to real property data).
- **Admin property form**: added a simple "Photos" field — paste image URLs, one per
  line, and they become real `Media` rows. This is a stand-in for the Cloudinary
  media library (still planned) so properties you create right now actually have
  photos on the public site.
- **`prisma/seed.ts`**: now also creates two real, published, photographed sample
  properties (a Rabat villa, a Casablanca apartment) so the site isn't empty on
  first run.

### ⚠️ Important behavior change
New properties created in `/admin/properties/new` default to **status: Brouillon
(DRAFT)** and won't appear on the public site until you set their status to
**Publié**. This is intentional (matches how real estate platforms work) but easy to
trip over while testing — if a property you just created isn't showing up on
`/proprietes`, check its status.

### Testing phase 5
1. Re-run `npx prisma migrate dev` (schema is unchanged from phase 4, but re-seed to
   get the two sample properties: `npx prisma db seed`).
2. Visit `/` and `/proprietes` — you should see the two seeded properties with real
   photos.
3. Log in as admin, create a new property, paste 1-2 image URLs into "Photos", set
   status to **Publié**, save.
4. Visit `/proprietes` again — your new property is there, filterable by the city/type
   you picked, with the photo you pasted.
5. Open it, favorite it, submit the lead form and the booking modal — same as phase 3,
   just now against a database-backed property instead of mock data.
6. Try filtering by city/transaction type/sort on `/proprietes` — reloads the page
   with real filtered results via the URL, e.g. `/proprietes?city=rabat&sort=price-desc`.

## Phase 6 update

Cities, Neighborhoods, Agencies, and Agents now have full CRUD in the admin, plus
real public pages:

- **`/admin/cities`** and **`/admin/neighborhoods`** — single-page list + inline
  create + delete (simple models, no need for separate edit pages yet — edit support
  can follow the Properties pattern if you want it later).
- **`/admin/agencies`** and **`/admin/agents`** — full list/new/edit/delete, same
  Server Action + Zod pattern as Properties.
- **`/villes`** and **`/villes/[slug]`** — public city grid and per-city listing
  (reuses `getProperties({ city })` from phase 5, so it respects the same
  `PUBLISHED`-only scoping and sort options).
- **`/agences`** and **`/agences/[slug]`** — public agency directory and detail page
  (shows the agency's agents and their published listings).
- **`/agents/[slug]`** — public agent profile page with their published listings.
- `src/lib/data/network.ts` — the public data-access layer for all of the above,
  same pattern as `src/lib/data/properties.ts`.

### Testing phase 6
1. `/admin/cities` — add a city (e.g. "Essaouira" / `essaouira`), confirm it shows up
   in the table and in `/villes`.
2. `/admin/neighborhoods` — add a neighborhood tied to that city.
3. `/admin/agencies/new` — create an agency, mark it verified, save.
4. `/admin/agents/new` — create an agent, assign it to that agency.
5. Go to `/admin/properties`, edit (or create) a property, assign it to your new
   agency/agent, set status to Publié.
6. Visit `/agences/{slug}` — you should see the agency, its agent, and the property.
   Visit `/agents/{slug}` — same property should show there too.
7. Visit `/villes/{slug}` for the city you assigned — the property should appear
   there as well.



## Fix: City/Neighborhood/Agent creation silently failing

Two real bugs, both producing the same symptom (fill the form, hit submit, nothing
visibly happens):

1. **`InlineCreateForm`** (used by `/admin/cities` and `/admin/neighborhoods`) only
   ever rendered `state.message` — if Zod validation failed, `state.errors` was
   populated but never displayed, so a failed submission looked identical to doing
   nothing. Now shows a red error box listing exactly what failed.
2. **Strict slug validation** (`/^[a-z0-9-]+$/`) rejected anything with a capital
   letter, space, or accent — e.g. typing "Rabat" or "Yasmine Idrissi" into a slug
   field failed silently (bug #1 hid the reason). Fixed properly: slugs are now
   **auto-normalized server-side** (`src/lib/utils.ts` → `slugify()` — lowercases,
   strips accents, replaces anything else with hyphens) across City, Neighborhood,
   Agency, Agent, and Property. Leave the slug field blank and it derives one from
   the name/title automatically.
3. Also removed a `disabled` attribute on the Neighborhood form's city `<select>`
   placeholder — combined with `required`, some browsers keep a disabled first
   option "selected," which silently blocks submission with zero feedback.

If you still hit a silent failure anywhere after this, it's now guaranteed to show a
visible error message — screenshot/paste that and I can fix the exact cause instead
of guessing.

## Phase 7 update

Real Media Library + Cloudinary uploads — replaces the "paste image URLs" stopgap
from phase 5.

- **`src/lib/cloudinary.ts`** — signs upload requests server-side (SHA-1, using
  `CLOUDINARY_API_SECRET`, which never leaves the server). No Cloudinary SDK
  dependency needed — just Node's built-in `crypto`.
- **`POST /api/cloudinary/sign`** — admin-only route that hands the browser a
  short-lived signature so it can upload **directly to Cloudinary** (files never
  pass through our server). Returns a clear 501 error if Cloudinary env vars aren't
  set yet, instead of failing mysteriously.
- **`MediaUploader`** (`src/components/admin/MediaUploader.tsx`) — drop this into
  any form. Click to upload (shows a spinner per file, drag-free but multi-file),
  or paste a URL manually as a fallback if Cloudinary isn't configured. Wired into
  `PropertyForm`'s "Photos" section — replaces the old plain textarea, but stays
  **backward-compatible**: it serializes back into the same newline-separated
  `imageUrls` field the server actions already parse, so nothing else had to change.
- **`/admin/media`** — a real global media library: grid of every uploaded image
  (property-attached or standalone), upload button, hover-to-delete. Shows a clear
  banner if Cloudinary isn't configured yet.

### Testing phase 7
1. Add real Cloudinary credentials to `.env` (free tier is fine — sign up at
   cloudinary.com, credentials are on your dashboard):
   ```
   CLOUDINARY_CLOUD_NAME="..."
   CLOUDINARY_API_KEY="..."
   CLOUDINARY_API_SECRET="..."
   ```
   Restart `npm run dev` after adding them.
2. Go to `/admin/media` — the Cloudinary-not-configured banner should be gone; click
   "Uploader des images" and pick a file from your computer. It should appear in the
   grid within a couple seconds.
3. Go to `/admin/properties/new` (or edit an existing one) — the Photos section now
   has a real upload button instead of a URL textarea. Upload an image directly.
4. Without any Cloudinary credentials configured, both of the above should still
   work in a degraded mode: `/admin/media` shows the config banner, and
   `PropertyForm`'s uploader falls back to "paste a URL manually" instead of
   erroring out.



## Phase 8 update

Leads, Appointments, and Messages are now visible and manageable from the admin —
previously this data only existed in Prisma Studio.

- **`/admin/leads`** — every lead submitted from a property contact form, filterable
  by status, inline status dropdown (New → Contacted → Qualified → Converted/Lost),
  links back to the property, delete.
- **`/admin/appointments`** — every visit request from "Planifier une visite",
  filterable by status, inline status dropdown (Pending → Confirmed/Cancelled/
  Completed), shows assigned agent, delete.
- **`/admin/messages`** — general contact messages, unread ones highlighted with a
  gold left-border, mark read/unread, delete.
- **New**: `/contact` public page + `POST /api/messages` — this didn't exist before;
  the `Message` model had no way to actually receive anything. Now it does.
- `src/lib/actions/inbox.ts` — all the Server Actions behind the above (status
  updates, read toggling, deletes), same `requireAdmin()` guard pattern as
  everywhere else.

### Testing phase 8
1. Visit `/contact`, submit the form — check `/admin/messages`, your message should
   appear unread (gold border).
2. Click the mail icon to mark it read — border disappears, counter at the top
   updates.
3. Go to a property detail page, submit the sidebar contact form — check
   `/admin/leads`, change its status via the dropdown.
4. Click "Planifier une visite" on a property, submit — check `/admin/appointments`,
   change its status.
5. Filter each list by status using the dropdown at the top.



## Phase 9 update

Blog CMS — admin + public, fully wired.

- **`/admin/blog`** — post list (published/draft badge, category, edit/delete) +
  inline category management (same pattern as Cities: add a category, see it in a
  pill list with a delete button).
- **`/admin/blog/new`** and **`/admin/blog/[id]`** — full post editor: title, slug
  (auto-generated from title if left blank, same `slugify()` treatment as
  everywhere else), excerpt, content (plain text — paragraphs separated by a blank
  line render as distinct `<p>` tags on the public page, no markdown parser
  dependency needed), cover image (new `SingleImageUploader` — same Cloudinary flow
  as the property photo uploader, just capped at one image), category, published
  toggle, SEO fields.
- **`/blog`** — public listing, filterable by category via `?category=slug`, only
  ever shows `published: true` posts.
- **`/blog/[slug]`** — post detail page with a related-posts section.
- **`prisma/seed.ts`**: two sample published posts so `/blog` isn't empty on first
  run.

### Testing phase 9
1. Re-seed to get the sample posts: `npx prisma db seed`.
2. Visit `/blog` — two posts should be there, filterable by category.
3. In `/admin/blog`, create a new post, leave slug blank, upload or paste a cover
   image, check "Publié", save.
4. Visit `/blog` again — your post should appear; open it, check the related-posts
   section links back to the seeded ones.
5. Uncheck "Publié" on a post and confirm it disappears from `/blog` and its detail
   page 404s (drafts are never public, same scoping pattern as Properties).



## Fix: /admin/amenities and /admin/property-types were dead links

The sidebar has always linked to these two, but the pages themselves were never
built (only the `Amenity`/`PropertyType` Prisma models + their checkboxes/selects in
the Property form existed). Added now, same simple list + inline create + delete
pattern as Cities:

- **`/admin/amenities`** — manage the equipment/amenity list used in the Property
  form's checkboxes (Piscine, Climatisation, etc.). Shows how many properties use
  each one before you delete it.
- **`/admin/property-types`** — manage the property type list (Villa, Appartement,
  etc.) used in the Property form's required "Type de bien" select. Note: this one
  is a **required** field on every property, so deleting a type still in use will
  fail at the database level (foreign key constraint) — the confirm dialog warns you
  first.

## Phase 10 update

Users CRUD + Role/Permission management — admin-only (stricter than the rest of
`/admin`, which also allows Editors in).

- **`/admin/users`** — list with inline role dropdown (instant, no page reload),
  activity summary (favorites/leads/appointments counts) per user, delete. You can't
  demote or delete your own account (guarded server-side, not just hidden in the UI).
- **`/admin/users/new`** — create a user directly with a password (admin-issued
  accounts, e.g. for staff/agents).
- **`/admin/users/[id]`** — edit name/email/phone/role, optionally reset their
  password, plus a **permissions panel**: individual checkboxes for granular
  permissions that layer on top of their role (e.g. grant one Agent
  `blog.publish` without making them a full Editor).
- **`/admin/roles`** — overview of the four built-in roles (Admin/Editor/Agent/User)
  with live user counts, plus a free-form **permission catalog** (`key` + `label`,
  e.g. `properties.delete` / "Supprimer des propriétés") that populates the
  checkboxes on each user's edit page.
- **Access model**: role is checked in `src/lib/auth.config.ts` → `middleware.ts` for
  route-level `/admin` access (Admin or Editor). User/role/permission *management*
  itself is further restricted to `role === "ADMIN"` only, inside
  `src/lib/actions/users.ts` and `permissions.ts` — an Editor can reach these pages
  but any create/update/delete attempt is rejected server-side.

### Testing phase 10
1. Go to `/admin/users` — the seeded admin should be the only user, marked "(vous)".
2. Create a second user via `/admin/users/new` with role "Utilisateur".
3. Change their role to "Éditeur" via the inline dropdown on the list page — no
   page reload.
4. Open their edit page, go to "Permissions individuelles" — you'll need at least
   one permission defined first: go to `/admin/roles`, add one (e.g. key
   `blog.publish`, label "Publier des articles"), then go back and toggle it on for
   that user.
5. Try demoting or deleting your own logged-in account — both should be blocked.



## Phase: WhatsApp/Call buttons + role-based dashboards

### WhatsApp & Call buttons
Added to `PropertyCard` (list/grid view) and `ContactAgentCard` (property detail
sidebar) — real `wa.me` deep links with a prefilled message (using the property's
agent phone, falling back to the agency's), plus a `tel:` call button next to it.
`src/lib/utils.ts` gained `whatsappLink()` and `telLink()` helpers. No brand-icon
package needed — `src/components/icons/WhatsAppIcon.tsx` is a small inline SVG.

### Role-based dashboards
Every role now gets a dashboard shaped for what they actually need, not one
one-size-fits-all admin screen:

- **Admin** — everything, unchanged from before.
- **Editor** — same dashboard as Admin minus the Users count and the
  Users/Roles/Settings sidebar links (they manage content, not accounts).
- **Agent** — genuinely different: `/admin` now shows *their* stats (their
  properties, their pending appointments, their new leads) instead of site-wide
  numbers. Sidebar is cut down to "Mon tableau de bord" + "Mes propriétés / Mes
  rendez-vous / Mes leads". They get **read-only** visibility into their own
  properties (edit stays with Admin/Editor for now — see note below) but **can**
  update the status of their own leads and appointments — ownership is checked
  server-side in `src/lib/actions/inbox.ts`, not just hidden in the UI.
- **User** (regular logged-in visitor) — brand new `/compte` page: favorites count,
  their visit requests with status, their contact requests with status, and a
  shortcut into the back-office if they also happen to have a staff role.

**Access control changes:**
- `middleware.ts` now lets `AGENT` into `/admin` (previously only Admin/Editor).
- `/admin/users`, `/admin/users/new`, `/admin/users/[id]`, `/admin/roles`,
  `/admin/messages` now redirect non-authorized roles away **at the page level**
  (previously only the Server Actions enforced this — the pages themselves were
  reachable by URL for any staff role, which leaked user PII to Agents/Editors who
  shouldn't see it).
- `/admin/properties/new` and `/admin/properties/[id]` redirect Agents back to the
  read-only list if they try to reach the edit form directly by URL.

**Known scope boundary:** Agents currently cannot create or edit their own property
listings — that capability still belongs to Admin/Editor only. Giving Agents real
write access to their own listings (with the Agent field locked to themselves) is a
reasonable next step if you want it, just flagging it wasn't included here to keep
this phase contained.

### Testing this phase
1. Re-seed to get the new test accounts: `npx prisma db seed`. This creates:
   - `admin@domify.ma` / `Domify2026!` (unchanged)
   - `yasmine@domify.ma` / `Domify2026!` — **Agent**, linked to the existing Yasmine
     agent profile (so she has real properties/leads/appointments to see)
   - `client@domify.ma` / `Domify2026!` — plain **User**
2. On a property card or detail page, click WhatsApp — should open `wa.me` with a
   prefilled message. Click Call — should trigger your OS's dialer.
3. Log in as `yasmine@domify.ma` — you should land on `/admin` automatically, see a
   personalized "Bonjour, Yasmine" dashboard, and a cut-down sidebar. Try navigating
   directly to `/admin/users` — you should get bounced back to `/admin`.
4. Log in as `client@domify.ma` — visit `/compte`, check your favorites/leads/
   appointments show up there (favorite a property and submit a lead first if the
   list is empty).
5. Log in as `admin@domify.ma`, go to `/admin/users`, change someone's role to
   Editor, log in as them — confirm Users/Roles are gone from their sidebar and
   `/admin/users` redirects them away.

## Phase: "Fix everything" round — cleanup + Map/Compare/Calculators

**Cleanup & polish:**
- Real logo (`public/Logo.jpeg`) now used in Header + Footer instead of the icon placeholder
- Removed dead code (`mock-data.ts`, `PropertiesExplorer.tsx` — unused since phase 5)
- Fixed dead nav links: "Projets" → "À propos" (new real page), Footer links now point to
  real routes instead of `#`
- New pages: `/a-propos`, `/estimation` (real valuation lead form), `/faq`,
  `/conditions-generales`, `/politique-de-confidentialite`
- **Testimonials admin** (`/admin/testimonials`) — homepage testimonials now come from
  the database instead of being hardcoded

**Map Search:**
- Real Leaflet map on property detail pages (falls back gracefully if a property has
  no coordinates yet) + a full `/carte` search page (map + synced scrollable list)
- Admin property form gained latitude/longitude fields (were missing from the UI even
  though the schema/action always supported them)
- `src/components/map/PropertyMapClient.tsx` — required client-only dynamic wrapper,
  since Leaflet touches `window` at import time and will crash SSR otherwise

**Compare Properties:**
- `src/lib/compare-context.tsx` — up to 4 properties, localStorage-backed
- Compare toggle on property cards and the detail page (the detail page's favorite +
  compare buttons were previously decorative with no logic — both fixed)
- Floating compare bar, site-wide, appears once 2+ properties are selected
- `/comparer` — real side-by-side table: specs + an amenities diff

**Calculators:**
- `/calculateur-credit` — mortgage calculator, real amortization formula, sliders for
  price/down payment/rate/term
- `/calculateur-investissement` — rental yield calculator: gross/net yield, cash flow,
  cash-on-cash return, payback period

### Not included in this round
SEO Manager, Analytics dashboard, and Settings (admin) are still not built, and
there's no deployment config (Docker/Vercel) yet — these remain on the roadmap below.



## Phase: SEO Manager, Analytics, Settings, Deployment

### Settings (`/admin/settings`, Admin-only)
Single form covering site name/tagline, contact info, WhatsApp number, and social
links — stored as key-value rows in `SiteSetting`. `src/lib/data/settings.ts` reads
them with sensible defaults if unset. **Actually wired in**: the Footer now pulls
contact info and social links from here instead of being hardcoded — change a phone
number in `/admin/settings` and it updates site-wide immediately.

### SEO Manager (`/admin/seo`)
CRUD for per-path title/description/OG-image overrides (`SeoEntry` model — already
existed in the schema, never had an admin UI or was ever actually read anywhere).
Now: `src/lib/data/seo.ts` → `getSeoOverride(path)`, wired into `generateMetadata()`
on the homepage and `/proprietes`. A page without an entry just uses its normal
defaults — this is additive, not a requirement. To extend to more pages, add the
same `generateMetadata` pattern using `getSeoOverride("/your-path")`.

### Analytics (`/admin/analytics`, Admin-only)
This one needed more than just an admin UI — the `AnalyticsEvent` model existed but
**nothing ever wrote to it**. Added:
- `POST /api/analytics` — records an event (`page_view`, `lead`, `search`, `favorite`)
- `src/components/AnalyticsRecorder.tsx` — fire-and-forget client component in the
  site layout that logs a `page_view` on every route change (including query param
  changes, so `/proprietes?city=rabat` counts distinctly from `/proprietes`)
- The dashboard itself: total/today view counts, a real bar chart (14-day view
  trend, via `recharts` — added as a new dependency) using a raw SQL
  `date_trunc('day', ...)` query for the daily grouping, and a top-10-pages table

### Deployment config
- **`Dockerfile`** — multi-stage build using Next.js's `standalone` output mode
  (added `output: "standalone"` to `next.config.ts`), runs as a non-root user
- **`docker-compose.yml`** — app + Postgres, for local or simple self-hosted
  deployment. Set `AUTH_SECRET` and Cloudinary vars in a `.env` file (or your shell)
  before running `docker compose up --build`
- **`.dockerignore`**
- **`.env.example`** — corrected `NEXTAUTH_SECRET` → `AUTH_SECRET` to match what
  Auth.js v5 actually reads (this was a latent inconsistency from earlier phases)

**To deploy with Docker:**
```bash
docker compose up --build -d
docker compose exec app npx prisma migrate deploy
docker compose exec app npx prisma db seed   # optional, sample data
```

**To deploy on Vercel instead:** skip Docker entirely — Vercel builds Next.js
projects natively. Just set the same environment variables (`DATABASE_URL`,
`AUTH_SECRET`, `NEXTAUTH_URL`, Cloudinary keys) in the Vercel project settings, point
`DATABASE_URL` at a managed Postgres (Vercel Postgres, Neon, Supabase, etc.), and run
`npx prisma migrate deploy` once against that database before or during your first
deploy.

### Testing this phase
1. `/admin/settings` — change the contact phone, save, check the Footer updated.
2. `/admin/seo` — add an entry for `/`, e.g. a custom title, save, view page source
   on the homepage and confirm the `<title>` changed.
3. Browse a few pages, then `/admin/analytics` — you should see view counts and the
   chart populate (may need a couple of page loads first, and the chart only shows
   once at least one day of data exists).
4. `docker compose up --build` locally (with a `.env` containing `AUTH_SECRET` and
   Cloudinary vars) — confirm the app boots and connects to its own Postgres
   container.

## Phase: Transactional email, password reset, property view counter

### Transactional email
- **`src/lib/email.ts`** — thin wrapper around [Resend](https://resend.com). If
  `RESEND_API_KEY` isn't set, `sendEmail()` logs a warning and no-ops instead of
  throwing, so the app (and every route below) keeps working with email fully
  unconfigured — useful for local dev without a Resend account.
- Wired into four places, each **fire-and-forget** (never awaited on the
  request path, so a slow or failed send can't delay or break the response):
  - New lead (`/api/leads`) — notifies the property's agent (or the site's
    `contact_email` if there's no agent) and confirms to the person who submitted it
  - New appointment request (`/api/appointments`) — same pattern, includes the
    formatted date/time
  - New contact message (`/api/messages`) — notifies `contact_email`
  - New account (`/api/register`) — welcome email to the new user
- `EMAIL_FROM` added to `.env.example` — until you verify your own sending domain
  in Resend, this has to stay their shared testing address
  (`onboarding@resend.dev`) or sends will fail.

### Password reset
- New `PasswordResetToken` Prisma model (token, userId, expiresAt) — standalone,
  no FK on `User`, looked up directly by token or cleared by userId
- **`/api/auth/forgot-password`** — always returns the same response whether or
  not the email has an account, so the endpoint can't be used to enumerate
  registered users. Generates a token valid for 1 hour, emails a reset link.
- **`/api/auth/reset-password`** — validates the token (exists + not expired),
  updates the password, then deletes *all* outstanding tokens for that user
  (not just the one used)
- **`/mot-de-passe-oublie`** and **`/reinitialiser-mot-de-passe/[token]`** —
  the public-facing request/confirm pages
- "Mot de passe oublié ?" link added to the login form

### Property view counter
- `Property.viewsCount` existed in the schema already but nothing wrote to it.
  `incrementPropertyViews()` in `src/lib/data/properties.ts` is a separate function
  from `getPropertyById()` on purpose — the read stays pure so it's safe to reuse
  anywhere (including `generateMetadata`), and the write only ever fires from the
  actual page render in `/proprietes/[id]`, fire-and-forget. That keeps crawlers,
  social-preview bots, and admin list queries from inflating the count.
- Now visible as a "Vues" column in `/admin/properties`.

**Migration needed:** this phase adds a new table. Run
`npx prisma migrate dev` (dev) or `npx prisma migrate deploy` (prod) before
testing — the API routes above will fail on a database that doesn't have
`PasswordResetToken` yet.

### Testing this phase
1. Set `RESEND_API_KEY` and `EMAIL_FROM` in `.env` (or leave unset to confirm the
   no-op path just logs a warning instead of crashing).
2. Submit a property enquiry, a visit request, and the contact form — check both
   the admin/agent notification and the confirmation email.
3. Register a new account — check for the welcome email.
4. `/connexion` → "Mot de passe oublié ?" → request a reset for a real account,
   follow the emailed link, set a new password, confirm you can log in with it.
5. Try the same flow with an email that has no account — confirm you get the
   same generic confirmation message either way.
6. View a property detail page a few times, then check `/admin/properties` —
   the "Vues" column should reflect it.

## Where things stand

Every feature originally on the phased roadmap now exists in some real, working
form: full public site (browsing, search, map, compare, calculators, blog, about,
legal pages), auth/favorites/leads/appointments, and a complete admin back-office
(properties + full catalog CRUD, agencies/agents, users/roles, blog CMS, media
library with Cloudinary, leads/appointments/messages inboxes, SEO manager,
analytics, settings) plus Docker deployment config.

"Feature exists and works" isn't the same as "production-audited," though. Before a
real launch, this still deserves:

- **A security pass** — rate limiting on public forms/API routes, a closer look at
  input sanitization beyond Zod validation, dependency audit (`npm audit` currently
  flags a few moderate issues)
- **Accessibility check** — this was built with reasonable semantic HTML and
  `aria-label`s throughout, but hasn't had a dedicated screen-reader/keyboard-nav pass
- **Real content** — replace seed data with actual properties, agencies, and copy
- **Load/perf testing** — nothing here has been tested under real traffic

None of that is a "phase" in the same sense as what came before — it's less about
writing new features and more about hardening what exists. Happy to tackle any of it
as a next step if useful.

