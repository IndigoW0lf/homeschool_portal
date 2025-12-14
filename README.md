# Homeschool Portal

A kid-friendly Homeschool Portal web app with a centralized dashboard and per-child pages. The portal is used daily by **Atlas** (age ~9) and **Stella** (age ~12), plus a parent.

## Features

### Parent Dashboard (`/parent`)
- **Weekly Overview** - Visual week calendar showing lessons & assignments per day
- **Day Playlist Modal** - Click any day to view/manage that day's schedule
- **Library Management** - Create, edit, clone, and delete lessons & assignments
- **Item Detail Modal** - Click any lesson/assignment to view full details with Delete/Edit/Clone actions
- **Schedule Items** - Assign lessons & assignments to specific dates and students
- **Holidays & Breaks** - Manage holidays with icon picker (22 curated Phosphor icons)

### Kid Portal (`/kids/atlas`, `/kids/stella`)
- **Today's Quests** - View today's assigned items with clickable detail modals
- **Week Calendar** - Overview of the week's schedule
- **Progress Tracking** - Mark items complete with star rewards
- **Item Details** - Click any item to see instructions, steps, rubric, and encouragement

### Core Features
- ✅ Supabase backend with real-time data
- ✅ Magic link authentication for parents
- ✅ Daily rotating quotes on dashboard
- ✅ Week calendar with assignment indicators
- ✅ Assignment cards with tags, links, steps, and rubrics
- ✅ "Mark Done" toggle with star rewards
- ✅ Clone lessons/assignments for reuse
- ✅ Toast notifications throughout
- ✅ Responsive design for tablet and desktop
- ✅ Click-outside-to-close for all modals
- ✅ Dark mode support (persists to localStorage)
- ✅ Error boundaries with friendly error pages
- ✅ Design system with semantic utility classes

## Tech Stack

- **Next.js 16** (App Router)
- **React 19 + TypeScript**
- **Tailwind CSS 4** (with @apply design system)
- **Supabase** (PostgreSQL + Auth)
- **Sonner** (Toast notifications)
- **Phosphor Icons** (Duotone style, pastel color palette)
- **Quicksand Font** (Google Fonts via Next.js optimization)

## Design System

The app uses a semantic design system in `src/app/design-system.css` with reusable classes:

### Buttons
| Class | Description |
|-------|-------------|
| `btn-primary` | Primary action button (ember color) |
| `btn-secondary` | Secondary button (gray background) |
| `btn-ghost` | Transparent button with hover |
| `btn-danger` | Red delete/destructive button |
| `btn-pill`, `btn-pill-active`, `btn-pill-inactive` | Pill-shaped filter buttons |
| `btn-icon`, `btn-icon-sm` | Icon-only buttons |

### Cards & Layout
| Class | Description |
|-------|-------------|
| `card` | Standard card with border and shadow |
| `card-header` | Card header with bottom border |
| `list-item`, `list-item-clickable` | List row items |
| `modal-backdrop`, `modal-content` | Modal components |

### Typography
| Class | Description |
|-------|-------------|
| `heading-xl/lg/md/sm` | Heading sizes with dark mode support |
| `text-muted` | Secondary/muted text |
| `text-heading` | Primary heading text color |
| `section-label` | Small uppercase labels |
| `link` | Styled anchor links |

### Inputs
| Class | Description |
|-------|-------------|
| `input`, `input-sm` | Text inputs with focus ring |
| `textarea` | Multiline text input |
| `select` | Dropdown select |
| `input-label` | Form field labels |

### Badges
| Class | Description |
|-------|-------------|
| `badge-blue/purple/green/ember` | Colored badge pills |
| `tag` | Removable tag pill |

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm
- Supabase project (for backend)

### Installation

```bash
npm install
```

### Environment Setup

Create `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Database Schema

Key tables in Supabase:

| Table | Purpose |
|-------|---------|
| `kids` | Kid profiles (id, name, grade_band) |
| `lessons` | Lesson library with instructions, tags, links |
| `assignment_items` | Assignment library with steps, rubric, deliverable |
| `schedule_items` | Maps lessons/assignments to dates and students |
| `resources` | Evergreen resource links by category |
| `holidays` | Holiday/break dates with icons |

## Project Structure

```
homeschool-portal/
├── supabase/
│   └── migrations/    # Database migrations
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Landing/Dashboard
│   │   ├── design-system.css         # Semantic utility classes
│   │   ├── globals.css               # Global styles & CSS vars
│   │   ├── error.tsx                 # Route error boundary
│   │   ├── not-found.tsx             # 404 page
│   │   ├── global-error.tsx          # App-wide error boundary
│   │   ├── kids/[kidId]/             # Kid portal
│   │   └── parent/                   # Parent dashboard
│   ├── components/
│   │   ├── dashboard/                # Dashboard components
│   │   ├── assignments/              # Assignment form
│   │   ├── lessons/                  # Lesson form
│   │   └── ui/                       # Shared UI (EmptyState, HolidayIcon, etc.)
│   ├── lib/
│   │   ├── supabase/                 # Supabase client & queries
│   │   └── utils.ts                  # Utilities
│   └── types/                        # TypeScript types
└── public/
    └── assets/                       # SVG titles, icons
```

## Recent Updates

- **Design System** - Created `design-system.css` with semantic @apply classes
- **Error Handling** - Added friendly 404, error, and global error pages
- **HolidayIcon Component** - Reusable Phosphor icon renderer for holidays
- **EmptyState Component** - Reusable empty state for lists
- **Dark Mode Fix** - Theme now persists correctly across browser refresh
- **Phosphor Icons** - Migrated from Lucide to Phosphor duotone icons

## License

Private - for homeschool family use
