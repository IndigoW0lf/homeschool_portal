# 🌙 Lunara Homeschool Portal

![Status](https://img.shields.io/badge/Status-Active-success)
![AI Powered](https://img.shields.io/badge/AI-Powered_✨-purple)
![Tech](https://img.shields.io/badge/Next.js_16-App_Router-black)

A magical, AI-enhanced homeschool management system designed to bring structure to chaos and fun to learning. Built for **Atlas** (age ~9) and **Stella** (age ~12).

---

## ✨ AI Features ("Luna")

> **Luna** is your homeschool assistant, helping generate content and ideas on the fly.

*   **🪄 AI Worksheet Generator** - Create custom PDFs instantly for any topic/age (saved to library!)
*   **⚡ Quick Start Templates** - 20+ one-click lesson starters (Morning Basket, Mental Math, Nature Walk, etc.)
*   **🧠 Curriculum Ideas** - Get instant suggestions for activities, books, and videos based on topics

## 🏰 Kid Portal

A gamified dashboard designed to empower independent learning:

*   **👤 Custom Avatars** - Kids build their own pixel-art profile
*   **🗺️ Quest System** - "Today's Quests" view with markdown instructions & clickable links
*   **🌕 Moon Rewards** - Earn moons for completing assignments (Use moons to buy catalog items!)
*   **🏆 Progress Tracking** - Visual streaks and completion history

## 🛡️ Parent Dashboard

Control center for the homeschool day:

*   **📅 Weekly Planner** - Drag-and-drop style weekly overview
*   **📚 Library** - Reusable Lesson and Assignment templates
*   **⚡ Quick Scheduling** - Assign items to specific kids/days in bulk
*   **🌴 Holiday Manager** - Block off dates with custom icons

---

## 🛠️ Tech Stack

*   **Framework:** Next.js 16 (App Router)
*   **Language:** React 19 + TypeScript
*   **Styling:** Tailwind CSS 4 + Semantic Design System (`src/app/design-system.css`)
*   **Backend:** Supabase (PostgreSQL + Auth + Realtime)
*   **Icons:** Phosphor Icons (Duotone)
*   **AI:** Google Gemini (via Custom Integration)
*   **PDFs:** `jspdf` for client-side generation

## 📂 Project Structure

```bash
homeschool-portal/
├── src/
│   ├── app/
│   │   ├── kids/[kidId]/         # 🎮 Gamified Kid Portal
│   │   ├── parent/               # 🛡️ Parent Dashboard
│   │   └── design-system.css     # 🎨 Semantic CSS Utility Classes
│   ├── components/
│   │   ├── luan/                 # 🤖 AI Assistant Components
│   │   ├── worksheets/           # 📄 PDF Generator Logic
│   │   └── dashboard/            # 📊 Dashboard Widgets
│   ├── lib/
│   │   ├── ai/                   # 🧠 AI Logic & Prompts
│   │   ├── actions/              # ⚡ Server Actions
│   │   └── templates/            # 📋 Quick Start Data
│   └── types/                    # 🦕 TypeScript Definitions
├── supabase/
│   └── migrations/               # 🐘 Database Schema
└── public/                       # 🖼️ Static Assets
```

## 🎨 Design System

The app uses a consistent semantic design system. Key utilities include:

| Component | Classes | Description |
| :--- | :--- | :--- |
| **Buttons** | `btn-primary`, `btn-ghost`, `btn-icon` | Standard interactive elements |
| **Cards** | `card`, `card-header` | Content containers with unified shadowing |
| **Typography** | `heading-lg`, `text-muted`, `link` | Consistent font scaling (Quicksand) |
| **Tags** | `badge-blue`, `tag`, `btn-pill` | Status indicators and filters |

## 🚀 Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Setup:**
    Create `.env.local` with your Supabase & AI keys:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=...
    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    GOOGLE_GENERATIVE_AI_KEY=...
    ```

3.  **Run Development Server:**
    ```bash
    npm run dev
    ```

4.  **Database Updates:**
    Apply migrations from `supabase/migrations` to keep your local DB in sync.

---

*Private project for family use. Built with ❤️.*
