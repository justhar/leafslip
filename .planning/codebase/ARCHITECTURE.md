<!-- refreshed: 2026-05-08 -->
# Architecture

**Analysis Date:** 2026-05-08

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer (Browser)                 │
├──────────────────┬──────────────────┬───────────────────────┤
│  Next.js Pages   │ React Components │   shadcn/ui (Tailwind)│
│  `app/page.tsx`  │ `app/components/`│   `app/globals.css`   │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                    │
         ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer (Next.js)              │
│        Server Actions: `app/actions/`                       │
│        Route Handlers: `app/api/`                           │
└───────────────────────┬──────────────────────┬──────────────┘
                        │                      │
                        ▼                      ▼
┌───────────────────────────────┐ ┌───────────────────────────┐
│        Persistence Layer      │ │      External Services    │
│        Drizzle ORM            │ │      Google AI SDK        │
│        `db/schema.ts`         │ │      Python ML API        │
└───────────────────────────────┘ └───────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Server Actions | Data fetching, mutations, and orchestration of AI SDK | `app/actions/*.ts` |
| UI Components | Rendering application views, client interactions | `app/components/*.tsx` |
| Database Schema | Defining relation structures with Drizzle ORM | `db/schema.ts` |
| Auth Handler | Managing session state and OAuth via NextAuth | `app/api/auth/[...nextauth]/route.ts` |
| ML API | Serving predictions from joblib models | `model/server.py` |

## Pattern Overview

**Overall:** Next.js App Router with Server Actions + AI API Integration

**Key Characteristics:**
- **Server Actions for Mutations:** Client components directly invoke async server actions (`app/actions/`) to handle database querying and modifications without dedicated REST routes.
- **AI-driven Functionality:** Deep integration with Vercel AI SDK and Google GenAI (`@ai-sdk/google`) for features like `chat`, `dashboard`, and `receipts`.
- **Database Abstraction:** Drizzle ORM for type-safe database queries against a serverless PostgreSQL instance (Neon).

## Layers

**Next.js Server Actions Layer:**
- Purpose: Bridge between client components and backend resources (DB, AI).
- Location: `app/actions/`
- Contains: `chat.ts`, `dashboard.ts`, `products.ts`, `receipts.ts`.
- Depends on: Drizzle (`db/`), NextAuth (`auth.ts`), AI SDK (`ai`).
- Used by: React Client Components (`app/components/`, `app/dashboard/`).

**Data Access / ORM Layer:**
- Purpose: Application data representation, schema typing, typed SQL queries.
- Location: `db/`
- Contains: Schema definitions, seeding scripts, Drizzle config.
- Depends on: `@neondatabase/serverless`, `drizzle-orm`.
- Used by: Server Actions.

**External Prediction API Layer:**
- Purpose: Microservice pattern exposing `.pkl` machine learning predictions.
- Location: `model/server.py`
- Contains: FastAPI handlers.

## Data Flow

### Primary Request Path (e.g., Receipt Processing)

1. Client triggers form submission / scan inside `app/components/ReceiptScanner.tsx`.
2. Action is routed to a Next.js Server Action in `app/actions/receipts.ts`.
3. Server Action extracts data using AI SDK (`generateObject` with Google AI).
4. Processed data is inserted into the Postgres database via Drizzle (`db/`).
5. Server Action triggers `revalidatePath()` to refresh client views.

## Key Abstractions

**Authentication (`auth.ts`):**
- Purpose: Central configuration for NextAuth (Auth.js) v5 logic.
- Examples: `auth.ts`, `app/api/auth/`
- Pattern: Adapter-based authentication using `@auth/pg-adapter`.

**Database Connections (`db/index.ts`):**
- Purpose: Bootstrapping Neon Serverless Drizzle client.
- Examples: `db/index.ts`, `drizzle.config.ts`.

## Entry Points

**Main App Entry:**
- Location: `app/layout.tsx` / `app/page.tsx`
- Triggers: Browser HTTP Request.
- Responsibilities: Main client layout and landing page.

**Authentication Endpoint:**
- Location: `app/api/auth/[...nextauth]/route.ts`
- Triggers: NextAuth client requests.

**Data Interactions:**
- Location: `app/actions/*.ts`
- Triggers: User forms, AI chat events, component data requests.

## Architectural Constraints

- **Server Dependencies:** Code utilizing Drizzle ORM or AI SDK must remain in Server actions or server components, avoiding client exposure.
- **Microservices Boundary:** Inference using `joblib` is isolated in `model/server.py` due to Python dependencies, requiring cross-service requests for prediction.

## Error Handling

**Strategy:** Expected server action error cascades to Next.js Error Boundaries.

**Patterns:**
- Try/catch within Server Actions (`app/actions/*`).
- Client-side error state within `app/components/`.

## Cross-Cutting Concerns

**Authentication:** Handled globally by wrapped NextAuth middleware (`middleware.ts`) and checked within server actions (`auth()`).
**Styling:** Utility-first styling via Tailwind CSS, standardizing components via `app/globals.css`.
