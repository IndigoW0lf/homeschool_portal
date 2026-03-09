# Lunara Homeschool Quest — Full Project Audit

**Purpose:** Move production from Antigravity to this workspace. This audit summarizes the project so we can go section-by-section for errors and improvements.

---

## 1. What This Project Is

**Lunara Homeschool Quest** is a homeschool portal you’re building for your kids. It has:

- **Marketing site** (root `/`) — Hero, Features, How It Works, Kid Showcase, Testimonials, Pricing, CTA. Logged-in parents are redirected to `/parent`.
- **Parent dashboard** (`/parent/*`) — Auth required. Manage lessons, assignments, resources, kids, progress, rewards, holidays, ideas, profile, settings. “Luna” AI panel for support/ideation.
- **Kid portal** (`/kids/[kidId]`) — Per-kid view: today’s schedule, resources (e.g. MiAcademy), journal, streaks, avatars, shop, design studio, world builder, worksheets, time capsule. Kid login (`/student`) sets a session cookie and restricts access to that kid only.

**Tech:** Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, Supabase (auth + Postgres + storage). No GraphQL (your rules mention Apollo/Grafbase; this repo uses Supabase only).

---

## 2. High-Level Architecture

| Layer | What |
|-------|------|
| **Auth** | Supabase Auth (parents). Kid login via PIN + `lunara_kid_session` cookie; middleware enforces kid-only routes. |
| **Data** | Supabase Postgres. RLS: public read, authenticated write. Server data via `@/lib/supabase/data.ts` and `mutations.ts` (server actions). |
| **API routes** | Next.js Route Handlers under `src/app/api/*` for journal, rewards, AI, world, avatars, kid-auth, invites, holidays, etc. |
| **UI** | Custom “Lunara Cosmic” design system (`design-system.css` + `globals.css`), Quicksand + Macondo fonts, Sonner toasts. |

---

## 3. Routes Overview

### Public / marketing
- `/` — Marketing or redirect to `/parent` if logged in
- `/signup`, `/parent/login`, `/student` — Auth entry points
- `/auth/callback` — Supabase OAuth/magic link callback
- `/legal/terms`, `/legal/privacy`
- `/invite/[code]` — Family invite acceptance
- `/unlock/[kidId]` — Kid unlock flow

### Parent (auth required)
- `/parent` — Dashboard (overview, redemptions, weekly progress, holidays)
- `/parent/lessons`, `/parent/lessons/[id]` — Lessons CRUD
- `/parent/assignments` — Assignments
- `/parent/resources` — Resources
- `/parent/progress`, `/parent/progress/reports` — Progress & reports
- `/parent/kids/[kidId]`, profile, journal, shop — Per-kid management
- `/parent/ideas` — Saved ideas
- `/parent/profile`, `/parent/settings`
- `/parent/progress-print` — Print view

### Kid portal (session-scoped to that kid)
- `/kids/[kidId]` — Main portal (schedule, resources, journal card, streaks)
- `/kids/[kidId]/avatar`, `/profile`, `/shop`, `/studio`, `/world`, `/journal`, `/capsule`, `/worksheet/[id]`, `/play`

### API (46 route files)
- Auth: `kid-auth/login`, `kid-auth/logout`, `kids/set-pin`, `kids/verify-pin`, `turnstile/verify`
- Content: `lessons`, `assignments`, `resources/*`, `curriculum-topics`, `holidays`, `ideas`, `activities`
- Kids: `kids/[kidId]/avatar-state`, `designs`, `tier`, `owned-avatars`, `featured-badges`, `moons`, `credentials`
- AI: `ai/think`, `ai/sessions`, `ai/parse-curriculum`, `generate-activity`, `refine-lesson`, `refine-worksheet`, `parse-pdf`
- World: `world/[kidId]`, `world/[kidId]/packs`, `world/generate`
- Avatars/shop: `avatars/catalog`, `avatars/purchase`, `avatar-items/purchase`, `design-studio/unlock`, `profile/avatar-state`
- Other: `journal`, `journal/save`, `rewards`, `rewards/templates`, `rewards/redeem`, `moons`, `invites/*`

---

## 4. Data Model (Supabase)

- **Core:** `kids`, `lessons`, `lesson_links`, `lesson_attachments`, `assignments` (legacy day-plan style), `assignment_kids`, `assignment_lessons`, `resources`, `schedule_items` (new schedule model).
- **Multi-tenant:** `families`, `family_members`, `family_invites`, `profiles`. Kids belong to a family; parents see kids in their family.
- **Kid profile/gamification:** `kids` extended with avatar state, journal settings, featured badges, moons, design studio tier, etc. `student_progress`, `journal_entries`, `kid_rewards`, `reward_redemptions`, `moon_history`, `shop_purchases`.
- **Other:** `holidays`, `day_plans`, `assignment_items` (templates), `saved_ideas`, `ai_chat_sessions`, world tables, avatar/store tables, etc.

**Migrations:** 90+ in `supabase/migrations/` (0001 through 0091). Schema has evolved from a simple MVP to multi-tenant, RLS, and many features.

---

## 5. Environment & Secrets

- **Required:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only, e.g. kid session scope).
- **Optional:** `OPENAI_API_KEY` (Luna, activity generation, worksheets, world gen), `YOUTUBE_API_KEY`, `TAVILY_API_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`.

`.env.local` exists (not committed). No `.env.example` in the tree — worth adding for production move.

---

## 6. Known Issues & Quick Wins (from audit)

1. **Parent dashboard discards resources**  
   `src/app/parent/(dashboard)/page.tsx` fetches `getResourcesFromDB()` but uses `resources={[]}` for `DashboardOverview`. `getResourcesFromDB()` returns `Resources` (grouped by category); `DashboardOverview` expects `ResourceRow[]`, and the prop is not used in the component body. Options: (a) add a data function that returns `ResourceRow[]` and wire it up if the overview should show resources, (b) change `DashboardOverview` to accept `Resources` and use it in the UI, or (c) remove `getResourcesFromDB()` from this page to avoid an unused fetch.

2. **CSS**  
   `--herbal-200` in `globals.css` is correct (`#C8DECF`).

3. **No tests**  
   `package.json` has no test script or test runner (Jest, Vitest, Playwright). Any logic or UI changes are unguarded by tests.

4. **No i18n**  
   Copy is English-only. If you plan to support multiple languages later, consider where strings live and how you’d plug in i18n.

5. **User rule mismatch**  
   Your Cursor rule says “Queries through Apollo, mutations through Grafbase.” This repo uses **Supabase only** (no Apollo/Grafbase). Either update the rule for this project or keep it for a different repo.

6. **Hardcoded timezone**  
   Kid portal uses `America/Chicago` for “today” (see `src/app/kids/[kidId]/page.tsx`). SUPABASE_SETUP.md suggests fetching parent’s timezone from family settings later.

---

## 7. Section-by-Section Plan (for follow-up)

We can go through in this order (or adjust):

1. **Auth & middleware** — Parent login, kid login, callback, session cookie, middleware matcher and redirects.
2. **Parent dashboard & nav** — Dashboard page, overview, week view, redemptions, progress chart, holidays; ParentNav and layout.
3. **Lessons, assignments, resources** — CRUD, forms, schedule items, and how they appear in the week view and day modal.
4. **Kid portal** — Main kid page, schedule list, resources (MiAcademy wrapper), journal card, streaks, hydrator.
5. **Progress & reporting** — Progress page, hours, activity list, reports, print.
6. **Avatars, shop, rewards** — Kid avatar state, design studio, world, shop, moons, redemptions.
7. **AI (Luna, generation)** — Think API, activity/worksheet generation, refine-lesson, parse-curriculum, system prompt.
8. **API routes** — Grouped by domain (auth, content, kids, AI, world, avatars); errors, validation, and security.
9. **Supabase layer** — `data.ts`, `mutations.ts`, RLS, types vs DB columns (camelCase vs snake_case).
10. **UI & design system** — Components, design-system.css, globals.css, accessibility and consistency.
11. **Config & deploy** — next.config, env vars, Codacy/ESLint, and production checklist. **Middleware:** Next.js may deprecate `middleware` in favor of `proxy`; see comment in `src/middleware.ts` and https://nextjs.org/docs/messages/middleware-to-proxy when planning migration.

---

## 8. File Counts (approx.)

- **App:** ~36 page routes, 46 API route files.
- **Components:** 170+ under `src/components/` (dashboard, kids, marketing, luna, onboarding, progress, studio, world, worksheets, etc.).
- **Lib:** supabase (browser, server, data, mutations, storage), actions (schedule, history, import), ai (context-loader, worksheet-generator, enrich-activity, etc.), world, avatar, resources, content, dateUtils, progressState, etc.
- **Types:** `src/types/index.ts` and `design-studio.ts`, `world.ts`, `resources/types.ts`.

---

## 9. Dependencies (high level)

- **Runtime:** next 16, react 19, @supabase/ssr, @supabase/supabase-js, date-fns, zod, react-hook-form, @hookform/resolvers, sonner, lucide-react, @phosphor-icons/react, dnd-kit, react-three/fiber/drei, three, openai, pdf-parse, bcryptjs, dicebear, clsx, tailwind-merge.
- **Dev:** TypeScript, ESLint, eslint-config-next, Tailwind 4, @tailwindcss/postcss, @types/*.

---
