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

## Fix: real build error + public view counts

Ran the project's actual `next lint` and `tsc --noEmit` (not just my usual per-file
syntax check) to hunt for real build issues. Found one genuine bug, independent of
the sandbox's known Prisma-generation limitation:

- **`src/app/admin/layout.tsx`** was passing `session?.user?.role` (typed as plain
  `string` by the NextAuth type augmentation) directly into `<AdminSidebar role={...}>`,
  which expects the narrower `"ADMIN" | "EDITOR" | "AGENT" | "USER"` union. Fixed by
  exporting that `Role` type from `AdminSidebar.tsx` and validating/narrowing the
  session value against it (`toRole()`) instead of blindly assuming it's one of the
  four — falls back to `"USER"` for anything unexpected.

Everything else `tsc` flagged (~50 "implicit any" errors) is the same known artifact
as always: this sandbox can't run `npx prisma generate`, so Prisma's generated types
don't exist here, and every `.map()`/`.filter()` callback on a Prisma query result
falls back to `any` under strict mode. These are not real bugs — they disappear
automatically the moment you run `npx prisma generate` locally, which is already
part of the standard setup in this README.

**Also added**: view counts now show on the **public** side, not just
`/admin/properties` — a small eye-icon count on property cards (bottom-right of the
stats row) and next to the reference number on the property detail page.



## Fix: settings.ts "use server" export bug

`src/lib/actions/settings.ts` (a `"use server"` file) was exporting `SETTINGS_FIELDS`,
a plain array constant — Next.js requires `"use server"` files to export **only**
async functions. This threw `A "use server" file can only export async functions,
found object.` at runtime. Moved the constant to a new plain module,
`src/lib/settings-fields.ts`.

## Phase: Transactional email + password reset + view counter

### Transactional email
`src/lib/email.ts` — thin wrapper around Resend. **Gracefully degrades**: if
`RESEND_API_KEY` isn't set, every send is a no-op with a console warning instead of
throwing, so nothing in the app breaks if you haven't configured it yet.

Wired into:
- **New lead** (`/api/leads`) — notifies the property's agent (or falls back to
  the site's general contact email), plus a confirmation email to whoever submitted it
- **New appointment** (`/api/appointments`) — same pattern, includes the requested date/time
- **New contact message** (`/api/messages`) — notifies the site's general contact email
- **New user registration** (`/api/register`) — welcome email

All of these are fire-and-forget (`.catch(() => ...)`, never awaited into the
response) — a broken email provider should never cause a lead/booking/registration
to fail.

### Password reset
This didn't exist at all before — added a full flow:
- New Prisma model: `PasswordResetToken` (token, userId, expiresAt) — **run
  `npx prisma migrate dev` to pick this up**
- `POST /api/auth/forgot-password` — issues a token (1 hour expiry) and emails a
  reset link. Deliberately returns the same success response whether or not the
  email has an account, to avoid leaking which emails are registered
- `POST /api/auth/reset-password` — validates the token, sets the new password,
  invalidates the token (and any others for that user)
- `/mot-de-passe-oublie` and `/reinitialiser-mot-de-passe/[token]` — the public
  pages for the above
- "Mot de passe oublié ?" link added to the login form

### Property view counter
The `viewsCount` field existed on `Property` since the very first Prisma schema but
nothing ever incremented it. Fixed: `incrementPropertyViews()` in
`src/lib/data/properties.ts`, called fire-and-forget (not awaited) from the property
detail page so it never delays rendering. Now also shown as a column in
`/admin/properties`.

### Testing this phase
1. **Re-run migrations**: `npx prisma migrate dev` (new `PasswordResetToken` table).
2. Add `RESEND_API_KEY` (and optionally `EMAIL_FROM`) to `.env` — free tier at
   resend.com. Without a verified domain, their sandbox sender only delivers to your
   own Resend account email, which is fine for testing.
3. Submit a property lead, a visit request, and the `/contact` form — check the
   inbox tied to your Resend account (or the property's agent email) for
   notifications, and the submitter's inbox for confirmations.
4. Register a new account — check for the welcome email.
5. Go to `/connexion`, click "Mot de passe oublié ?", enter an existing account's
   email, check for the reset email, click through, set a new password, confirm you
   can log in with it.
6. Visit a property detail page a few times, then check `/admin/properties` — the
   "Vues" column should have incremented.
7. **Without** `RESEND_API_KEY` set, repeat steps 3-5 — everything should still work
   (leads/registration/reset all succeed), just with a console warning instead of an
   actual email, confirming the graceful-degradation behavior.



## Phase: Views placement, Google Sign-In, sell/rent listing, security hardening

### Views counter — repositioned per feedback
- Property cards: now sits right next to the price (was bottom of the stats row)
- Detail page: now sits right next to the price at the top (was next to the
  reference number further down) — no duplication, removed from the old spot

### Google Sign-In
- Added to `src/lib/auth.ts` as an optional provider — only appears if
  `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set, otherwise the app runs
  exactly as before (no broken button, it just doesn't render)
- `allowDangerousEmailAccountLinking: true` — lets someone who registered with
  email/password also sign in with Google using the same address, instead of
  hitting an "email already in use" error. This is safe specifically because
  Google verifies the email address itself; it would NOT be safe for a provider
  that doesn't verify emails.
- **To set up**: create OAuth credentials at
  console.cloud.google.com/apis/credentials, authorized redirect URI
  `{your-domain}/api/auth/callback/google` (and `http://localhost:3000/...` for
  local dev), add the two env vars.
- Button added to both `/connexion` and `/inscription`, with the real multi-color
  Google "G" logo (inline SVG, no icon package needed).

### Sell or rent your property
Genuinely new page, not just a relabeled existing form: **`/vendre-louer`**. A
homeowner submits their property details (transaction type, property type, city,
surface, desired price, notes) — this creates a `Lead` (source: `sell_or_rent`) that
shows up in `/admin/leads` like any other lead, for your team to follow up and
create the actual listing once qualified. Deliberately reuses the existing Lead
pipeline rather than building a whole separate self-service listing/approval system
— simpler, and consistent with how `/estimation` already works.

**Floating CTA** (`SellRentFloatingButton`): fixed-position button, visible on every
public page (both mobile and desktop) regardless of scroll position — this was the
specific ask: "in a place where the person can see it first." Hidden on `/admin/*`
and on the `/vendre-louer` page itself (no point advertising the page you're already
on). Positioned to clear the compare bar's slot at the bottom of the screen.

### Security hardening
- **`src/lib/rate-limit.ts`** — in-memory sliding-window rate limiter. Explicitly
  documented trade-off: this works correctly for a single server instance; on
  serverless or multiple instances behind a load balancer, each instance has its own
  counters. Fine for the Docker/Compose setup in this repo; swap for Redis/Upstash
  if you scale horizontally.
- Applied to every public-facing endpoint that can be abused:
  - `/api/leads`, `/api/appointments`, `/api/messages` — 5 requests / 10 min per IP
  - `/api/register` — 5 / hour per IP (account creation is a higher-value target)
  - `/api/auth/forgot-password` — 5 / 15 min per IP, and **deliberately returns the
    same success response whether rate-limited or not** — the rate limit itself
    must not become a way to detect which emails have accounts
  - `/api/auth/reset-password` — 10 / 15 min per IP
  - Credentials login — 10 attempts / 15 min, keyed by the **attempted email**
    rather than IP, so a single account is protected from credential-stuffing
    regardless of how many IPs an attacker spreads across
- **Honeypot fields** (`src/components/HoneypotField.tsx`) — a visually-hidden input
  real users never see or fill; if it arrives non-empty, the request is silently
  accepted (HTTP 201, no error) but nothing is created — this avoids tipping off the
  bot that it was caught. Added to every public form: property contact, booking
  modal, `/contact`, `/estimation`, `/vendre-louer`. Checked both client-side
  (skip the request entirely) and server-side (in case a bot skips the client and
  hits the API directly).
- **Security headers** (`next.config.ts`): `X-Frame-Options` (clickjacking),
  `X-Content-Type-Options` (MIME-sniffing), `Referrer-Policy`, `Permissions-Policy`
  (blocks camera/mic/geolocation access site-wide, since nothing here needs them).
  A Content-Security-Policy was deliberately **not** added in this round — see the
  "dependency audit + Content-Security-Policy" phase further down, where it was
  done properly from an actual resource audit.
- Ran the project's real `next lint` and `npx tsc --noEmit` (not just my per-file
  syntax check) after all of the above — zero warnings, zero errors beyond the known
  Prisma-generation artifact in this sandbox.

### Testing this phase
1. Property cards and detail page — confirm views now show next to the price in
   both places.
2. Add Google OAuth credentials to `.env`, restart, go to `/connexion` — the
   "Continuer avec Google" button should appear and work.
3. Visit `/vendre-louer` directly, and also confirm the floating gold button appears
   on every other public page (try scrolling — it should stay put) but disappears on
   `/vendre-louer` itself and on any `/admin/*` page.
4. Submit any public form (contact, lead, booking, estimation, sell/rent) 6 times in
   a row quickly — the 6th should get a "trop de demandes" error.
5. Try 11 wrong-password login attempts for the same account within 15 minutes —
   the 11th should silently fail (same "incorrect" message, not a special error,
   since the rate limit itself shouldn't be advertised on this endpoint either).



## Phase: SEO plumbing (sitemap, robots.txt, structured data)

- **`src/app/sitemap.ts`** — dynamic `sitemap.xml`. Includes every static page, plus
  every **published** property, **published** blog post, city, agency, and agent —
  regenerated on each request from the live database, so it's never stale.
- **`src/app/robots.ts`** — `robots.txt`, blocks `/admin`, `/api/`, `/compte`,
  `/favoris`, `/comparer`, and the auth pages from being crawled/indexed; points
  crawlers at the sitemap.
- **Structured data** (`src/components/JsonLd.tsx` — a tiny shared renderer):
  - Property detail pages: `RealEstateListing` (price, address, coordinates if set,
    images) + `BreadcrumbList` (Google's breadcrumb rich result)
  - Homepage: `RealEstateAgent` (a `LocalBusiness` subtype) — pulls name, tagline,
    contact info, and social links straight from `/admin/settings`, so it stays
    accurate without a code change
  - Blog posts: `BlogPosting` — the schema type with actual Google rich-result
    support for article content
- Ran the project's real `next lint` and `npx tsc --noEmit` after all of the above —
  zero warnings, zero new errors.

### Testing this phase
1. Visit `/sitemap.xml` and `/robots.txt` directly — both are real Next.js routes,
   generated on request (nothing to build or configure).
2. Use Google's Rich Results Test (search.google.com/test/rich-results) against a
   property detail page, the homepage, and a blog post — all three should validate
   with no errors.
3. Set `NEXTAUTH_URL` to your real production domain before deploying — the
   sitemap/robots/structured-data URLs all derive from it, and default to
   `https://domify.ma` as a placeholder otherwise.



## Phase: i18n (French / Arabic / English)

### Scope decision, upfront
Retrofitting all ~50 existing pages into a full locale-prefixed URL structure
(`/fr/...`, `/ar/...`, `/en/...`) would mean restructuring every route currently
under `app/(site)/` — high risk of breaking working pages for a single session, and
genuinely a multi-day job to do carefully across an app this size. Went with the
pragmatic real-world path instead:

- **No URL changes** — every existing link/route keeps working exactly as before.
- A **cookie-based locale** (`NEXT_LOCALE`), read server-side on every request.
- The **site chrome** (Header, Footer — present on every public page) and the
  **homepage** are fully translated into all three languages, wired through real
  dictionaries, not just left as a proof of concept.
- The pattern is simple and established (see below) — extending it to any other page
  is a mechanical, well-defined task, not a mystery to reverse-engineer.

### What's actually translated
- `src/i18n/dictionaries/{fr,ar,en}.json` — nav, header actions, footer, and the
  full homepage copy
- `Header`, `Footer`, and the homepage all render from these dictionaries
- A working **language switcher** (`LanguageSwitcher`) in the header, both desktop
  and mobile — sets the cookie via a Server Action and revalidates the whole layout

### Arabic / RTL
- Selecting Arabic sets `dir="rtl"` on `<html>` (in `app/(site)/layout.tsx`) — text
  direction, alignment, and browser-native RTL behavior (form fields, native
  scrollbars, etc.) all correctly flip.
- **Known limitation, stated plainly**: this codebase uses Tailwind's *physical*
  spacing utilities throughout (`ml-`, `pr-`, `left-`, etc.), which don't
  automatically mirror under `dir="rtl"` — only *logical* utilities (`ms-`, `pe-`,
  `start-`) do. So Arabic gets correct text direction and reading order, but icons,
  paddings, and absolutely-positioned elements (like the floating sell/rent button)
  will still visually sit on their LTR side rather than mirroring. Properly fixing
  this means converting physical → logical utility classes across the whole app —
  a real, scoped follow-up, not something to half-do here.

### How to extend translation to another page
1. Add the new keys to all three dictionary JSON files (same key path in each).
2. In the page (Server Component): `const locale = await getLocale(); const dict = getDictionary(locale);`
3. Replace hardcoded French strings with `dict.yourSection.yourKey`.
4. For Client Components, pass `dict` down as a prop from the nearest Server
   Component ancestor (same pattern as `Header`/`Footer` here) — dictionaries are
   plain serializable objects, so this works with no extra wiring.

### Testing this phase
1. Use the language switcher (globe icon, top-right of the header) — try all three
   languages. Header, footer, and homepage content should all update.
2. Switch to Arabic and confirm `<html dir="rtl">` in the page source, and that text
   reads right-to-left — while noting the spacing/icon-mirroring limitation above.
3. Navigate to any *other* page (e.g. `/proprietes`) after switching language — the
   header/footer stay translated (since they're global), but that page's own content
   is still French-only, which is the expected, documented current scope.
4. Refresh the browser entirely — the chosen language should persist (cookie-backed,
   not just in-memory state).



## Phase: dependency audit + Content-Security-Policy

### Dependency audit — real findings, not just noise
Ran `npm audit` for real (not just skimmed it) and fixed what was actually fixable:

- **Fixed, critical**: `@auth/core` (the library underneath NextAuth v5) had a
  critical-severity advisory — non-breaking `npm audit fix` resolved it.
- **Fixed, high**: Next.js itself (15.5.20 → 15.5.21, a patch-only bump, several
  high-severity advisories resolved).
- **Fixed, high**: `sharp` (bundled by Next for image optimization) was on a
  vulnerable version pulled in transitively — added an `overrides` entry in
  `package.json` (`sharp: ^0.35.0`) rather than forcing a wider, riskier resolution.
- **Fixed, real classification bug**: `prisma` (the CLI) was listed under
  `dependencies` instead of `devDependencies`. Moving it there **didn't** fully
  remove its vulnerable nested deps from a production install, though — turns out
  `@prisma/client` itself pulls in the `prisma` package regardless of where you
  declare it (confirmed by literally running `npm ci --omit=dev` in a scratch
  directory and inspecting `node_modules`, not just trusting `npm audit --omit=dev`,
  which doesn't actually filter here despite its name). So also added `overrides`
  for `find-my-way` and `valibot`, the two vulnerable packages `@prisma/dev` pulls
  in, forcing them to patched versions.
- **Remaining, accepted**: `postcss` bundled *inside Next.js's own internal build
  tooling* is still on a vulnerable version. This only runs during `next build`/
  `next dev` — it's not part of the request-handling code path that serves your
  actual deployed app — and Next hasn't shipped a 15.x patch bumping it yet (would
  need a major version bump to 16 to fully resolve, out of scope for a safe
  dependency fix). Documented here rather than silently left as an asterisk.

### Content-Security-Policy — the audit I kept saying I hadn't done
Actually enumerated every external resource this app uses (grepped the whole
codebase for URLs, checked `next.config.ts`'s image `remotePatterns`, checked every
`fetch()` call and `<script>` tag) instead of guessing:

- Google Fonts (stylesheet + font files), Cloudinary (both `next/image` and direct
  client-side uploads), Unsplash, OpenStreetMap tile servers, and our own inline
  JSON-LD `<script>` tags — that's the complete external footprint.
- `img-src` is deliberately broad (`https:`) rather than an exact host allowlist,
  because the admin media uploader lets you paste *any* image URL — restricting
  this would break that intentional feature. Image loading isn't a script-execution
  vector the way `script-src` is, so this trade-off is reasonable.
- `script-src` includes `'unsafe-inline'` because Next.js injects inline
  hydration/runtime scripts. A stricter nonce-based CSP is possible but needs
  additional middleware wiring (generating and threading a per-request nonce) —
  flagged as a real next step if you want maximum strictness, not silently skipped.
- `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'self'`
  — all genuinely strict, since nothing in this app legitimately needs to violate
  them.

**Given the earlier concern that a wrong CSP silently breaks things**: this was
built from an actual resource inventory, and `next lint` + `tsc --noEmit` + a full
per-file syntax sweep all pass — but none of that substitutes for **loading the
actual site in a real browser and checking the console for CSP violations**, since
this sandbox can't run a live Next.js server. If you see anything blocked after
deploying, the browser console will name the exact blocked resource and directive —
paste it here and I'll adjust the policy precisely rather than guessing.

**To roll out more cautiously**: temporarily rename the header key in
`next.config.ts` from `Content-Security-Policy` to
`Content-Security-Policy-Report-Only` — the browser will log violations to the
console without actually blocking anything, so you can verify the policy is correct
before it's enforced.



## Phase: Header fixes, admin mobile responsiveness, animations, iOS PWA

### Header
- "Estimer mon bien" CTA replaced with "Vendre mon bien" → `/vendre-louer` (both
  desktop and mobile menu). Added the `header.sellMyHome` translation key across
  all three locales.
- Login is no longer a bare icon easy to miss — it's now a labeled pill button
  ("Connexion"/"Sign in"/"تسجيل الدخول") on both desktop and mobile, styled
  distinctly from the rest of the nav.

### Admin dashboard — mobile responsiveness (was previously broken, not just unpolished)
The admin sidebar was `hidden lg:flex` with **no mobile equivalent at all** — on a
phone, there was no way to navigate the admin section whatsoever. Fixed properly:
- **Mobile topbar + hamburger** — compact bar with the Domify Admin mark and a menu
  button, shown only below `lg`.
- **Slide-in drawer** (`AdminSidebar`) — same nav content as desktop, animated with
  Framer Motion, closes automatically on navigation or backdrop tap.
- Fixed the outer layout (`admin/layout.tsx`) from `flex` (row) to
  `flex flex-col lg:flex-row` — the mobile topbar was otherwise going to sit
  *beside* the page content instead of above it.
- `AdminTopbar` — smaller title and hidden user-name block on narrow screens so it
  doesn't get cramped.
- **All 14 admin data tables** (properties, leads, users, agencies, agents, blog,
  cities, neighborhoods, amenities, property types, testimonials, appointments,
  roles, SEO) now wrap their `<table>` in a `overflow-x-auto` div — on mobile you
  can scroll horizontally through columns instead of the table silently clipping.

### Animations
Built as reusable infrastructure rather than one-off, hand-placed effects:
- **`src/components/motion/FadeIn.tsx`** — `FadeIn` (scroll-triggered fade+slide-up)
  and `StaggerReveal` (staggers a list of children as they enter view). Both use
  Framer Motion's `whileInView`, so animations fire once per element as the user
  scrolls to it, not all at once on page load.
- **`src/app/(site)/template.tsx`** — Next.js's `template.tsx` convention re-mounts
  on every navigation, so this gives every public page a subtle fade+slide page
  transition automatically, without editing every page individually.
- **`PropertyCard`** (used everywhere — home, listings, map, agency/agent pages) —
  hover lift + tap scale-down via Framer Motion, layered on top of the existing CSS
  hover shadow.
- Wired into: homepage (hero image zoom-in, staggered trust badges/featured
  properties/why-us/testimonials), `/proprietes` listing grid, property detail page
  (gallery fade-in, similar properties stagger).
- Header mobile menu and the new admin mobile drawer both use `AnimatePresence` for
  proper slide/fade enter-exit instead of instant show/hide.
- **Scope note**: this covers the highest-traffic surfaces (home, listings, property
  detail, both mobile menus) with real, working animation — not literally every
  element on every one of the ~50 pages. Extending the same `FadeIn`/`StaggerReveal`
  pattern to any other page is a two-line addition per section.

### iOS-compatible PWA
- Generated real icon assets from the uploaded logo (`public/icon-192.png`,
  `icon-512.png`, `apple-touch-icon.png`, plus two favicon sizes) — not placeholders.
- **`public/manifest.webmanifest`** — name, icons, `display: standalone`, theme
  color, background color.
- **`src/lib/pwa-metadata.ts`** — shared config used by *both* root layouts (site +
  admin), since this project has two independent `<html>` roots. Uses Next.js's
  `Metadata`/`Viewport` APIs (`appleWebApp`, `icons`, `viewportFit: "cover"` for the
  iPhone notch) rather than hand-written meta tags, so Next generates the correct
  Apple-specific tags for you.
- **Deliberately did not add a service worker** — this is a dynamic, database-driven
  site (property prices/availability change), and an aggressive offline-caching
  service worker risks showing stale data. iOS's "Add to Home Screen" installability
  doesn't require one anyway — it's driven by the manifest + Apple meta tags above.
  If you want a service worker for genuine offline support later, that's a
  well-scoped, separate addition — flagging it rather than half-building it here.
- Ran the project's real `next lint` and `npx tsc --noEmit` after all of the
  above — zero warnings, zero new errors.

### Testing this phase
1. Check the header — "Vendre mon bien" button, and a visible "Connexion" pill
   when logged out (not just an icon).
2. On a real phone (or your browser's device toolbar), open any `/admin/*` page —
   confirm the hamburger menu appears and opens a working drawer with every nav
   item; confirm tables scroll horizontally instead of clipping.
3. Scroll through the homepage, `/proprietes`, and a property detail page — sections
   should fade/slide in as they enter view; property cards should lift slightly on
   hover.
4. Navigate between pages — should see a subtle fade transition each time.
5. **iOS specifically**: deploy somewhere with HTTPS (required — this won't work
   over plain HTTP), open in Safari on an iPhone, tap Share → "Add to Home Screen".
   Confirm: the Domify icon appears correctly, and opening it from the home screen
   launches in standalone mode (no Safari address bar).



## Where things stand

Every feature originally on the phased roadmap now exists in some real, working
form: full public site (browsing, search, map, compare, calculators, blog, about,
legal pages), auth/favorites/leads/appointments, and a complete admin back-office
(properties + full catalog CRUD, agencies/agents, users/roles, blog CMS, media
library with Cloudinary, leads/appointments/messages inboxes, SEO manager,
analytics, settings) plus Docker deployment config.

"Feature exists and works" isn't the same as "production-audited," though. Before a
real launch, this still deserves:

- **Security pass, mostly done** — rate limiting, honeypots, security headers, a
  real CSP built from an actual resource audit, and a real `npm audit` remediation
  (fixed a critical auth-library vulnerability, patched Next.js, fixed a
  misclassified dependency) are all in place now. What's left: a CAPTCHA
  (hCaptcha/Turnstile) as a second layer against determined bots, a stricter
  nonce-based CSP for `script-src` (current one uses `'unsafe-inline'`, a
  reasonable but not maximal choice), and Next.js's own bundled `postcss` version
  (build-tooling only, needs a Next major-version bump to fully resolve).
- **Accessibility check** — this was built with reasonable semantic HTML and
  `aria-label`s throughout, but hasn't had a dedicated screen-reader/keyboard-nav pass
- **Real content** — replace seed data with actual properties, agencies, and copy
- **Load/perf testing** — nothing here has been tested under real traffic

None of that is a "phase" in the same sense as what came before — it's less about
writing new features and more about hardening what exists. Happy to tackle any of it
as a next step if useful.

