# Phase 2: Core AI Optimization Application - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Reduce API cost through caching, structured outputs, and async background tasks.

</domain>

<decisions>
## Implementation Decisions

### Caching Strategy
- Where to cache AI responses? Database (PostgreSQL/Neon) — Uses existing `ai_insights` table, persists across edge functions.
- Cache invalidation strategy? 24h Time-to-Live (TTL) — Simple to query `WHERE created_at > NOW() - INTERVAL '1 day'`.
- What to cache for chat context? Don't cache open chat, only exact queries — Chat context varies too much for simple caching.
- Handling cache misses? Compute synchronously — Wait for AI generation since the user is waiting for insight.

### Structured Outputs
- Validation library? Zod schema via `generateObject` — Native to Vercel AI SDK, strict typing.
- Fallback on schema mismatch? Return generic fallback insight — Safer than retrying multiple times which costs tokens.
- Migration scope? OCR and Product Insights only — These need strict schemas. Chat stays unstructured `generateText`.
- Error handling? Log to console, don't crash — If AI fails, the app UI should gracefully handle missing insights.

### Async Background Tasks
- Execution method? Next.js `unstable_after` / `waitUntil` — Native way to run non-blocking tasks after response finishes.
- State tracking? DB status flags (`status: 'pending'`) — Simple, uses existing DB without adding new infrastructure.
- User feedback during execution? Optimistic UI / Polling — Show "Analyzing..." in UI, poll or refresh to see results when ready.
- Async failure handling? Log silently, allow retry on next load — Don't interrupt user flow if an async background task fails.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/lib/ai-instrumentation.ts` - Token counting and logging from Phase 1.
- `db/schema.ts` - Contains `aiInsights` table which can be used for caching.

### Established Patterns
- Vercel AI SDK is used in `app/actions/`.
- PostgreSQL database access via Drizzle ORM.

### Integration Points
- `app/actions/products.ts`
- `app/actions/receipts.ts`
- `app/actions/dashboard.ts`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
