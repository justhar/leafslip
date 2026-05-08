# Architecture Patterns

**Domain:** Surplus Marketplace & AI Prediction Optimization
**Researched:** May 8, 2026

## Recommended Architecture

The architecture builds upon the existing Next.js App Router, retaining Server Actions for mutations while introducing a dedicated public route group for the marketplace and a robust, decoupled service layer for AI interactions to handle caching and structured outputs cleanly.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Public Marketplace (`app/(market)`) | Render non-auth UI (listings, grids, detail pages) | Public Server Actions, Database (Read-only) |
| AI Service Layer (`lib/ai/`) | Standardizes AI calls, applies JSON schemas (Zod), and handles prompt compilation | Upstream AI APIs, Python Server (`model/server.py`) |
| Cache Facade | Wraps expensive AI calls to prevent duplicate predictions for identical inputs | Next.js `unstable_cache`, Redis/DB |
| Mutation Layer (Server Actions) | Validates user input, calls AI service, updates DB | AI Service, Drizzle ORM |

### Data Flow

1. **Marketplace Browsing (Non-Login):** 
   User requests `/market` -> Next.js serves cached page or fetches directly from Drizzle ORM -> React Server Components render UI. 
2. **Batch AI Predictions (e.g., Receipt Processing):**
   User submits data -> Server Action triggered -> Action delegates to `lib/ai/batch-processor` -> Processor groups requests and queries `server.py` or AI SDK with Zod structured output parameters -> Results parsed and validated -> Results cached via `unstable_cache` -> Server Action returns successful payload without breaking existing synchronous signatures.

## Patterns to Follow

### Pattern 1: AI Service Facade with Structured Outputs
**What:** Decoupling AI generation from the direct Server Action routing by using the Vercel AI SDK's `generateObject` (or equivalent Pydantic schema validation passing to the Python server).
**When:** Whenever an AI prediction is needed to enforce strict type-safety returning to the frontend.
**Example:**
```typescript
// lib/ai/predict.ts
import { generateObject } from 'ai';
import { z } from 'zod';
import { unstable_cache } from 'next/cache';

const predictionSchema = z.object({
  category: z.string(),
  confidence: z.number()
});

export const getCachedStructuredPrediction = unstable_cache(
  async (input: string) => {
    const { object } = await generateObject({
      model: myModel,
      schema: predictionSchema,
      prompt: `Analyze: ${input}`,
    });
    return object;
  },
  ['ai-predict-key'],
  { revalidate: 86400 } // 24 hours
);
```

### Pattern 2: Isolated Public Route Group
**What:** Storing marketplace routes in `app/(market)/` to cleanly bypass `middleware.ts` auth checks safely while sharing the global layout.
**When:** Building features meant for search engine indexing and anonymous user access in a primarily authenticated app.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Long-Running Batch AI calls blocking Server Actions
**What:** Looping through large datasets and waiting for synchronous AI generations inside a Server Action before returning.
**Why bad:** Vercel/Next.js limits execution time for external requests. Users perceive the app as broken or hanging.
**Instead:** Return a job ID immediately or stream the response to the client using `useChat` or `ai/react` streams. For pure server updates, offload to a background task runner (like Upstash QStash, or background python workers).

### Anti-Pattern 2: Inline AI Fetching without Caching
**What:** Calling the AI provider directly inside components or UI-bound actions for static/repetitive data.
**Why bad:** High latency, increased API costs, and rate-limiting.
**Instead:** Always wrap deterministic AI calls in Next.js `unstable_cache` or use a memoized abstraction.

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| AI Prediction Costs | Direct API calls; basic cache | Redis caching layer; Semantic cache (vector DB) | Self-hosted fine-tuned models; heavy semantic routing |
| Non-Login Market Traffic | Dynamically rendered | Incremental Static Regeneration (ISR) | Edge cached static fragments via CDN |
| Server Action Timeouts | `Promise.all` batching | Message Queue (SQS/Inngest) | Event-driven microservices architecture |

## Sources
- Next.js Documentation (App Router caching & route groups)
- Vercel AI SDK Documentation (`generateObject` and streaming)
- Internal Codebase Context (`/home/dev/projects/dev/leafslip`)
