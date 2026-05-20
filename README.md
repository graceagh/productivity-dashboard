# ◈ Productivity Dashboard

A personal productivity dashboard built with **Next.js 14 App Router**, deployed on **Vercel**, and backed by a **Neon Postgres** database.

## Features

| Panel | What it does |
|-------|-------------|
| **Tasks** | Kanban-style TODO → DOING → DONE with priority & due dates |
| **Habits** | 7-day habit tracker with colour-coded streaks |
| **Notes** | Sticky notes with pin, colour, and inline editing |
| **Goals** | Progress tracking with target, unit, and deadline |

## Tech Stack

- **Framework**: Next.js 14 (App Router, Server Components + Client Components)
- **Database**: Neon Postgres via `@neondatabase/serverless` (HTTP driver — works in Edge/Serverless)
- **Deployment**: Vercel
- **Styling**: CSS Modules + CSS variables
- **Icons**: Lucide React

---

## Quick Start

### 1. Clone & install

```bash
git clone <your-repo>
cd productivity-dashboard
npm install
```

### 2. Create a Neon database

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project (e.g. `productivity-dashboard`)
3. Copy the **Connection string** from the dashboard — it looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and paste your connection string:

```env
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 4. Set up the database tables

```bash
npm run db:setup
```

This creates all tables (`tasks`, `habits`, `habit_logs`, `notes`, `goals`).

> **Alternatively**, tables are also auto-created on the first page load via `/api/init`.

### 5. Run locally

```bash
npm run dev
# → http://localhost:3000
```

---

## Deploy to Vercel

### Option A — Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts, then add your environment variable:

```bash
vercel env add DATABASE_URL
# paste your Neon connection string when prompted
```

Deploy to production:

```bash
vercel --prod
```

### Option B — Vercel Dashboard (recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com/new](https://vercel.com/new) → Import your repo
3. Under **Environment Variables**, add `DATABASE_URL` with your Neon connection string
4. Click **Deploy**

> Neon's `@neondatabase/serverless` uses an HTTP transport that works natively in Vercel's serverless and Edge runtimes — no connection pool required.

---

## Project Structure

```
productivity-dashboard/
├── app/
│   ├── api/
│   │   ├── init/route.ts       # Auto-creates DB tables
│   │   ├── tasks/route.ts      # GET | POST | PATCH | DELETE
│   │   ├── habits/route.ts     # GET | POST | DELETE
│   │   ├── notes/route.ts      # GET | POST | PATCH | DELETE
│   │   └── goals/route.ts      # GET | POST | PATCH | DELETE
│   ├── dashboard/
│   │   ├── page.tsx            # Main dashboard (all panels)
│   │   └── dashboard.module.css
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                # Redirects → /dashboard
├── lib/
│   └── db.ts                   # Neon client + all DB helpers
├── scripts/
│   └── setup-db.js             # CLI table setup
├── .env.local.example
├── vercel.json
└── package.json
```

## Database Schema

```sql
tasks        (id, title, description, status, priority, due_date, created_at, updated_at)
habits       (id, name, icon, color, created_at)
habit_logs   (id, habit_id, logged_on)   -- UNIQUE (habit_id, logged_on)
notes        (id, title, body, pinned, color, created_at, updated_at)
goals        (id, title, target, current, unit, deadline, created_at, updated_at)
```

## Extending

- **Auth**: Add [NextAuth.js](https://next-auth.js.org/) and scope all queries by `user_id`
- **Drag & Drop**: Use `@dnd-kit/core` for the Kanban board
- **Notifications**: Add a `reminders` table and a Vercel Cron job to send emails via Resend
- **Dark/Light toggle**: CSS variables are already set up — just swap the root values
