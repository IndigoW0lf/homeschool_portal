# 🌙 Lunara Quest

![Status](https://img.shields.io/badge/Status-Active-success)
![AI Powered](https://img.shields.io/badge/AI-Powered_✨-purple)
![Next.js](https://img.shields.io/badge/Next.js_16-App_Router-black)

A magical, AI-enhanced homeschool management platform for families. Brings structure to the homeschool day and makes learning genuinely engaging for kids.

---

## ✨ Luna (AI Assistant)

Luna is a thinking partner for homeschool parents — not a general-purpose chatbot. She stays scoped to homeschooling, parenting, and child development.

- **Thinking partner** — Help planning the week, working through a lesson that isn't landing, exploring a kid's interest, or just processing a hard day
- **Activity generation** — AI-assisted lesson and assignment creation with structured output (steps, key questions, materials, time estimates)
- **Worksheet builder** — Generate printable worksheets from any lesson
- **Curriculum parser** — Upload a CSV curriculum export and Luna categorizes and imports it
- **Journal prompts** — Age-appropriate daily journal prompts for kids, generated per kid's preferences

Rate limiting: per-minute + daily quota per user, backed by Upstash Redis.

---

## 🏰 Kid Portal

A gamified dashboard for independent learners:

- **Custom avatars** — DiceBear avatar builder + optional profile photo upload
- **Quest system** — "Today's Quests" with rich instructions and completion tracking
- **Moon rewards** — Earn moons for completing work; spend them in the avatar shop or on parent-defined rewards
- **Badge collection** — Visual progress milestones
- **Journal** — Daily writing prompts with streaks
- **World map** — Unlockable 2D world tied to progress

---

## 🛡️ Parent Dashboard

- **Weekly planner** — Schedule lessons and assignments across kids and days
- **Lesson & assignment library** — Reusable templates with AI generation
- **Progress tracking** — Completion history, moon balances, streaks per kid
- **Reward shop** — Define custom rewards kids can redeem with moons
- **Family management** — Invite co-parents, manage multiple kids
- **Kid profiles** — Grade bands, interests, learning preferences

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript + React 19 |
| Styling | Tailwind CSS v4 + semantic design system |
| Database / Auth | Supabase (PostgreSQL + Auth + Storage) |
| AI | OpenAI (gpt-4o-mini / gpt-4o) |
| Rate limiting | Upstash Redis (Ratelimit) |
| Icons | Phosphor Icons (Duotone) |
| Testing | Vitest |

---

## 📂 Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Marketing / landing page
│   ├── api/                      # API routes (auth, AI, kids, rewards, …)
│   ├── parent/                   # Parent dashboard (App Router layout)
│   ├── kids/[kidId]/             # Kid portal
│   └── legal/                    # Privacy policy, Terms of Service
├── components/
│   ├── luna/                     # Luna AI panel + context
│   ├── marketing/                # Landing page sections
│   ├── lessons/                  # Lesson + assignment forms
│   └── worksheets/               # Worksheet viewer + PDF export
├── lib/
│   ├── ai/                       # OpenAI clients, prompts, rate limiter
│   ├── supabase/                 # Server/service role clients, queries
│   └── kid-access.ts             # Shared IDOR guard (canAccessKid)
└── types/                        # Shared TypeScript definitions
```

---

## 🎨 Design System

Semantic CSS utilities in `src/app/design-system.css`:

| Component | Classes |
| :--- | :--- |
| Buttons | `btn-primary`, `btn-ghost`, `btn-icon`, `btn-sm` |
| Cards | `card`, `card-header` |
| Typography | `heading-lg`, `heading-sm`, `text-muted`, `link` |
| Badges | `badge-blue`, `tag`, `btn-pill` |

---

## 🔒 Security

- All kid-scoped API routes gated by `canAccessKid()` (family membership check)
- Kid sessions signed with HMAC; parents use Supabase JWT
- Profile photos served via signed-URL proxy (private Supabase storage bucket)
- Rate limiting on every AI endpoint (per-minute + daily quota)
- CSP headers, referrer policy, permissions policy on all responses
- COPPA-aware: parental consent on signup, account deletion endpoint
