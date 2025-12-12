# Homeschool Portal

A kid-friendly Homeschool Portal web app with a centralized dashboard and per-child pages. The portal is used daily by two kids (ages ~9 and ~12) and a parent.

## Features

- **Dashboard** (`/`) - Shows today's date, daily quote, week calendar, and links to each child's portal
- **Child Portal** (`/kids/[kidId]`) - Personalized view with today's assignments, upcoming lessons, and resources
- **Parent Dashboard** (`/parent`) - Read-only view of all kids, calendar items, and lessons with edit instructions

### MVP Features

- ✅ Daily rotating quotes
- ✅ Week calendar view with assignment indicators
- ✅ Assignment cards with tags, links, attachments, and prompts
- ✅ "Mark Done" checkbox with localStorage persistence
- ✅ Grouped resource links by category
- ✅ Theme cards (Foundation/Skill/Expression days)
- ✅ Responsive design for tablet and desktop

## Tech Stack

- **Next.js 16** (App Router)
- **React 19 + TypeScript**
- **Tailwind CSS 4**
- **No backend required** - Data stored in JSON files
- **localStorage** for progress tracking

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm

### Installation

```bash
npm install
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

## Content Management

Content is stored in JSON files in the `/content` directory:

| File | Purpose |
|------|---------|
| `kids.json` | Kid profiles (id, name, grade band) |
| `quotes.json` | Daily rotating quotes |
| `resources.json` | Evergreen resource links by category |
| `lessons.json` | Lesson definitions with instructions, links, attachments |
| `calendar.json` | Schedule entries mapping dates to lessons and kids |

### Adding a New Lesson

1. Add the lesson to `content/lessons.json`:
```json
{
  "id": "lesson-new-activity",
  "title": "New Activity",
  "instructions": "Instructions for the activity...",
  "tags": ["reading", "writing"],
  "estimatedMinutes": 20,
  "links": [{ "label": "Resource Link", "url": "https://..." }],
  "attachments": [{ "label": "Worksheet PDF", "url": "https://..." }]
}
```

2. Schedule it in `content/calendar.json`:
```json
{
  "date": "2025-01-15",
  "theme": "Foundation Day",
  "kidIds": ["kid-9", "kid-12"],
  "lessonIds": ["lesson-new-activity"],
  "journalPrompt": "What did you learn today?",
  "projectPrompt": "Create something related to today's lesson.",
  "parentNotes": "Notes for the parent."
}
```

## Project Structure

```
homeschool-portal/
├── content/           # JSON content files
│   ├── kids.json
│   ├── quotes.json
│   ├── resources.json
│   ├── lessons.json
│   └── calendar.json
├── src/
│   ├── app/           # Next.js App Router pages
│   │   ├── page.tsx   # Dashboard
│   │   ├── kids/[kidId]/page.tsx  # Child portal
│   │   └── parent/page.tsx        # Parent dashboard
│   ├── components/    # Reusable UI components
│   ├── hooks/         # React hooks
│   ├── lib/           # Data access layer
│   └── types/         # TypeScript type definitions
└── public/            # Static assets
```

## Future Enhancements (Phase 2)

- Supabase auth (parent vs child)
- Supabase tables for lessons/calendar
- File uploads for PDFs
- Real admin CRUD UI

## License

Private - for homeschool family use
