# Codebase Structure

**Analysis Date:** 2026-05-08

## Directory Layout

```
/home/dev/projects/dev/leafslip/
├── app/                  # Next.js App Router (Routing, Pages, Actions, Components)
├── db/                   # Database logic (Schema, Client instantiation, Seeding)
├── drizzle/              # Drizzle ORM Migrations folder
├── model/                # Python ML Microservice
├── public/               # Static assets
└── types/                # Typescript typings definition overrides
```

## Directory Purposes

**`app/`:**
- Purpose: Main application logic using Next.js 16/React 19.
- Contains: Layouts, pages, UI components, Server actions, API endpoints.
- Key files: `app/layout.tsx`, `app/page.tsx`

**`app/actions/`:**
- Purpose: Application data-fetching and mutation handlers (Server Actions).
- Contains: Typified Next.js server actions interacting with DB and AI.
- Key files: `app/actions/chat.ts`, `app/actions/dashboard.ts`, `app/actions/receipts.ts`

**`app/components/`:**
- Purpose: Reusable React UI elements representing features.
- Contains: Presentation logic and client/interactive components.
- Key files: `app/components/Dashboard.tsx`, `app/components/ReceiptScanner.tsx`, `app/components/FullChatbot.tsx`

**`app/dashboard/`:**
- Purpose: Application routing groups for the main logged-in dashboard features.
- Contains: Feature-specific folder routes (e.g. `/dashboard/history`, `/dashboard/scanner`).

**`db/`:**
- Purpose: Database configuration and table definitions.
- Contains: Drizzle ORM schemas, setup scripts.
- Key files: `db/schema.ts`, `db/index.ts`

**`model/`:**
- Purpose: Python FastAPI setup for machine learning model inference.
- Contains: Server implementation handling `.pkl` execution.
- Key files: `model/server.py`

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout definition.
- `app/page.tsx`: Application index page.
- `model/server.py`: Machine Learning API entry.

**Configuration:**
- `next.config.ts`: Next.js config.
- `drizzle.config.ts`: Drizzle ORM config.
- `auth.ts`: NextAuth (v5) configuration instance.
- `middleware.ts`: Next.js routing and auth middleware.

**Core Logic:**
- `app/actions/`: Backend procedures called by frontends.
- `db/schema.ts`: Single source of truth for database shape.

## Where to Add New Code

**New Feature (View / Page):**
- Routing code: Create directory in `app/dashboard/<feature>/`
- Page component: `app/dashboard/<feature>/page.tsx`

**New Interactive Component:**
- Implementation: `app/components/<ComponentName>.tsx`

**New Backend Data Operation:**
- Logic: Add function inside existing file in `app/actions/` or create new `app/actions/<feature>.ts`. Make sure to use `"use server"`.
- Table mapping: `db/schema.ts`

**New AI/ML Functionality:**
- JavaScript SDK integration: `app/actions/` (using `@ai-sdk/google`)
- Python prediction layer: `model/server.py`

## Special Directories

**`drizzle/`:**
- Purpose: Generated SQL migration files.
- Generated: Yes (by `drizzle-kit`).
- Committed: Yes.

**`app/(auth)/`:**
- Purpose: Route group strictly isolating authentication views (e.g., error, signin) without affecting URL paths.
- Generated: No.
- Committed: Yes.