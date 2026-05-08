# External Integrations

**Analysis Date:** 2026-05-08

## APIs & External Services

**AI & Machine Learning:**
- Vercel AI SDK (`ai`) - Core LLM orchestration
- Google Gemini SDKs (`@ai-sdk/google`, `@google/genai`) - Underlying AI models for chatbot/insights
- Local FastAPI Server - Hosted ML predict endpoints (`model/server.py`)

## Data Storage

**Databases:**
- Neon Serverless Postgres
  - Connection: `@neondatabase/serverless`
  - Client: Drizzle ORM (`drizzle-orm`)
  - Schema: `db/schema.ts` defining `users`, `receipts`, `products`, etc.

## Authentication & Identity

**Auth Provider:**
- NextAuth.js / Auth.js (v5 beta)
  - Implementation: Database session approach using `@auth/pg-adapter` tied into the Neon Postgres database. (schema defines accounts, sessions, users, etc.)

## Monitoring & Observability

**Error Tracking:**
- None detected natively in package.json

**Logs:**
- Standard console logging implied.

## Environment Configuration

**Required env vars:**
- Database connections for Neon / Drizzle (likely `DATABASE_URL`)
- Auth keys (e.g., `AUTH_SECRET`)
- Google AI SDK keys (e.g., `GOOGLE_GENERATIVE_AI_API_KEY`)

**Secrets location:**
- Expected in standard `.env` / `.env.local`

---

*Integration audit: 2026-05-08*
