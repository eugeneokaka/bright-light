# Bright Light CRM — Core Spine Plan

Status: **Awaiting approval — no code built yet.**

## Context

- Client: **Bright Light Homes & Properties** (real estate, Kenya: Nairobi, Nakuru, surrounding areas).
- Client currently has a "CRM" that is a single hand-written HTML file. It is being **rebuilt from scratch**.
- This repository is a bare Next.js 16.3.8 + React 19 + Tailwind v4 scaffold.
- The requirements brief (`requrments.txt`) targets a public website + CRM and assumes Firebase/Firestore.
  We are deliberately replacing Firebase with a SQL stack (see deviation below).
- Build the **CRM first** (the revenue-critical piece), then the public website on the same backend.

## Confirmed Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) — existing scaffold |
| Language | TypeScript (strict) |
| Database | Neon Postgres + Drizzle ORM (`@neondatabase/serverless`) |
| Auth | Better Auth (email/password, roles) |
| Media | UploadThing |
| UI | Tailwind v4 + shadcn/ui (Radix) + next-themes |
| Validation | Zod (server + client) |
| Forms | react-hook-form + server actions |
| Host | Vercel |

**Deviation from brief:** the brief specifies Firebase/Firestore/Auth/Storage; we replace all of it with
SQL/Drizzle/Better Auth/UploadThing. Gemini, WhatsApp Business API, and Google Maps remain for later phases.
This must be flagged to the client.

## Repo Structure

```
src/
  app/
    (auth)/login, forgot-password, reset-password
    (crm)/crm/            dashboard, properties/, leads/, settings/
    api/auth/[...all]/    Better Auth handler
    api/uploadthing/      UploadThing route handler
  components/ui/          shadcn components
  components/crm/         CRM-specific (shell, tables, forms)
  db/ schema.ts, index.ts, seed.ts
  lib/ auth.ts, auth-client.ts, permissions.ts, validations/, audit.ts
  server/actions/         property-actions.ts, lead-actions.ts, ...
drizzle/                  migrations
drizzle.config.ts
```

## Database Schema (Core Spine)

- **Better Auth tables** (generated): `user` (+ `role`, `phone`, `status`), `session`, `account`, `verification`.
- **roles** enum: `SUPER_ADMIN`, `DIRECTOR`, `AGENT`, `BROKER`, `STAFF`.
- **properties**: slug, title, description, propertyType, purpose, price `bigint` (KES),
  county/town/neighborhood/address, lat/lng, beds/baths, size/sizeUnit, parking, amenities,
  featured, status (`DRAFT|ACTIVE|UNDER_OFFER|SOLD|RENTED|ARCHIVED`), agentId, timestamps.
- **property_images**: url, alt, caption, sortOrder, isCover (stored in Postgres, files hosted on UploadThing).
- **leads**: name, phone, email, message, propertyId, propertyTitle snapshot, source enum (brief §48),
  status enum (`NEW|CONTACTED|QUALIFIED|VIEWING_SCHEDULED|NEGOTIATING|WON|LOST|SPAM`),
  assignedAgentId, intent, priority.
- **lead_activities**: leadId, userId, type, body, metadata.
- **audit_logs**: userId, action, resource, resourceId, metadata.
- **settings**: key/value JSON.

Indexes on property status/featured/location/type/purpose/price and lead status/agent/source.

## Build Order

### Phase 0 — Foundation
- Install Drizzle, Better Auth, Zod, shadcn deps, next-themes, UploadThing.
- Create Neon project + `.env.local`; configure `drizzle.config.ts` + DB client.
- `shadcn init`; light/dark/system theme (brief §39).
- Read Next.js 16 docs (`node_modules/next/dist/docs/`) for route-handler/server-action conventions
  (Next 16 has breaking changes vs. prior training data).

### Phase 1 — Auth & Roles
- Better Auth + Drizzle adapter, email/password, role field, password reset, session persistence.
- Seed first `SUPER_ADMIN`.
- Server-side role guards + permission matrix (brief §51).
- CRM shell: sidebar, topbar, mobile nav.

### Phase 2 — Properties CRUD + Inventory
- Schema + migration.
- Zod validation (server-side, brief §37).
- Server actions: create/edit/archive/feature/status.
- Admin list: search, filter, sort, pagination + loading/empty/error states (brief §43).
- Full property form (brief §45).
- UploadThing multi-image upload (alt/caption/order).
- Audit logging (brief §52).

### Phase 3 — Leads + Routing
- Schema + migration.
- Public write endpoint for future website forms.
- Admin lead list, detail with activity timeline, status workflow, agent assignment, notes.
- Lead routing foundation (brief §48); audit logs.

### Phase 4 — Dashboard + Settings + Harden
- Dashboard KPIs from real data only, with empty states (brief §53 — no fake data).
- Company settings page.
- Run lint + typecheck + build.

## Explicitly Deferred (Later Phases)

Viewing requests, projects/towers/floors/units, public website pages, blog, SEO, WhatsApp Business API,
Gemini AI, analytics, broker portal, favorites/compare, media library, testimonials/FAQ.

## Verification

- `npm run lint`
- `npm run typecheck` (`tsc --noEmit`) — to be added as a script
- `npm run build`

## Open Items Before Phase 0

- Neon connection string (`DATABASE_URL`).
- `BETTER_AUTH_SECRET` (local placeholder acceptable until deploy).
- `UPLOADTHING_TOKEN` (needed at Phase 2).
