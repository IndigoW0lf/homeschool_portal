# Homeschool Portal

A kid-friendly Homeschool Portal web app with a centralized dashboard and per-child pages. The portal is used daily by two kids (ages ~9 and ~12) and a parent.

## Features

### Parent Dashboard (`/parent`)
- **Weekly Overview** - Visual week calendar showing lessons & assignments per day
- **Day Playlist Modal** - Click any day to view/manage that day's schedule
- **Library Management** - Create, edit, clone, and delete lessons & assignments
- **Item Detail Modal** - Click any lesson/assignment to view full details with Delete/Edit/Clone actions
- **Schedule Items** - Assign lessons & assignments to specific dates and students

### Kid Portal (`/kids/[kidId]`)
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

## Tech Stack

- **Next.js 16** (App Router)
- **React 19 + TypeScript**
- **Tailwind CSS 4**
- **Supabase** (PostgreSQL + Auth)
- **Sonner** (Toast notifications)
- **Lucide React** (Icons)

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

## Project Structure

```
homeschool-portal/
├── supabase/
│   └── migrations/    # Database migrations
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Landing/Dashboard
│   │   ├── kids/[kidId]/             # Kid portal
│   │   │   ├── page.tsx
│   │   │   ├── ScheduleItemsList.tsx # Clickable items with modal
│   │   │   └── KidPortalWeekCalendar.tsx
│   │   └── parent/
│   │       ├── page.tsx              # Parent dashboard
│   │       ├── lessons/              # Lesson management
│   │       ├── assignments/          # Assignment management
│   │       └── resources/            # Resource management
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── DashboardOverview.tsx # Main parent view
│   │   │   ├── DayModal.tsx          # Day playlist modal
│   │   │   ├── ItemDetailModal.tsx   # View item details
│   │   │   └── WeekView.tsx          # Week calendar
│   │   ├── assignments/              # Assignment form
│   │   ├── lessons/                  # Lesson form
│   │   └── ui/                       # Shared UI components
│   ├── lib/
│   │   ├── supabase/                 # Supabase client & queries
│   │   └── utils.ts                  # Utilities
│   └── types/                        # TypeScript types
└── public/                           # Static assets
```

## Recent Updates

- **Item Detail Modals** - Click lessons/assignments to view full details
- **Clone Functionality** - Duplicate items for reuse
- **Kid Portal Click-to-View** - Kids can click items to see instructions
- **Toast Confirmations** - Consistent toast UI for all actions
- **Fixed Calendar Query** - Schedule items now display correctly

## License

Private - for homeschool family use

