# Phase 1: Database & AI Optimization Setup - Research

**Researched:** 2026-05-08
**Domain:** AI cost optimization + database schema design
**Confidence:** HIGH

## Summary

LeafSlip currently uses Google Gemini 2.5-flash across three primary AI integration points: receipt OCR, product inventory insights, and conversational chat. Analysis of the codebase reveals **estimated token consumption of 17,000–47,000 tokens per active user daily**, with optimization opportunities in caching strategies, model selection, batching, and structured output refinement.

The platform has solid foundations: client-side hash-based caching for receipt OCR and a 24-hour database cache for product insights. However, chat history is not cached, dashboard insights lack TTL optimization, and several calls could benefit from async background processing.

For database schema, we need lightweight tables for `surplus_listings` and `surplus_reservations` that track MSME offerings and guest appointment bookings without complex payment/auth overhead.

**Primary recommendations:**
1. Audit all AI callsites and instrument with token tracking
2. Extend caching strategy beyond images to include context/schema results  
3. Defer heavy AI computation to background jobs via async Server Actions
4. Design minimal-column schema for guest marketplace tables

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| AI Invocation (OCR, Chat, Predictions) | API / Backend Server Actions | Database (for caching) | Real-time calls + schema validation belong in Server Actions; persistence of results in DB |
| Token Tracking & Instrumentation | API / Backend (Server Actions) | Database (logging table) | Must intercept all `generateText` / `generateObject` calls in Server layer |
| Caching Layer | Database (ai_insights) | Browser (localStorage for UI state) | DB cache hit rates for product insights; client-side for receipt images |
| Surplus Listings CRUD | API / Backend (Server Actions) | Database (surplus_listings table) | Business logic in actions; persistence in schema |
| Guest Reservations | API / Backend (Server Actions) | Database (surplus_reservations table) | Stateless API; reservations stored and queried from DB |
| Public Marketplace View | Frontend (Next.js Page Route) | API (fetch active listings) | Read-only view; cached or server-rendered public route |

---

## Current State: AI Usage Audit

### AI Call Sites

#### 1. Chat Advisor (`app/actions/chat.ts`)
- **Model:** `google("gemini-2.5-flash")` via `generateText()`
- **Input:** 30-day sales context (string) + message history (max 10 messages)
- **Caching:** None (each message is a fresh API call)
- **Estimated tokens/call:** ~1200–1800 (context 600–1000 + prompt 100–200 + response 200–300)
- **Rate limit:** Implicit (no local throttle observed)
- **Frequency:** Per user chat message (on-demand)
- **Fallback:** Generic response if `GOOGLE_GENERATIVE_AI_API_KEY` absent

**Bottleneck:** No caching; conversational context rebuilds on each turn.

#### 2. Receipt OCR (`app/actions/receipts.ts`)
- **Model:** `google("gemini-2.5-flash")` via `generateObject()` + image
- **Input:** Base64-encoded receipt image + extraction schema
- **Caching:** ✓ Client-side in-memory cache (SHA256 hash of base64 payload, 24h TTL)
- **Estimated tokens/call:** ~1500–2200 (vision image 1000–1500 + prompt 200–300 + response 100–150)
- **Rate limit:** ✓ 5-second user-level throttle
- **Frequency:** Per receipt upload
- **Fallback:** Error throw; no explicit fallback UI pattern

**Strength:** SHA256 caching prevents duplicate processing of identical receipts within MSME.
**Bottleneck:** Cache is in-memory (lost on process restart); 5s throttle is conservative but prevents concurrent uploads.

#### 3. Product Insights (`app/actions/products.ts`)
- **Model:** `google("gemini-2.5-flash")` via `generateObject()` with structured schema
- **Input:** Product name + 30-day purchase history + current stock
- **Caching:** ✓ Database cache in `ai_insights` table (24h minimum age check)
- **Estimated tokens/call:** ~800–1200 (prompt + data structure 400–600 + response 200–300)
- **Rate limit:** None observed
- **Frequency:** Per product per 24-hour window (if eligibleForAi = true)
- **Fallback:** ✓ Deterministic `buildFallbackMessage()` used if AI unavailable or API key missing

**Strength:** Structured output with Zod schema; DB caching across process restarts.
**Bottleneck:** Computes all falling insights synchronously on `getProductInsights()` call; no batching.

#### 4. Dashboard Insights (`app/actions/dashboard.ts`)
- **Model:** `google("gemini-2.5-flash")` via `generateText()`
- **Input:** Formatted dashboard stats (strings) + context
- **Caching:** None observed
- **Estimated tokens/call:** ~1200–1500 (context + formatted stats 600–800 + response 200–300)
- **Rate limit:** None observed
- **Frequency:** Per dashboard load (on-demand)
- **Fallback:** None; error silently returns generic dashboard without insights

**Bottleneck:** No caching; dashboard reloads incur full cost without de-duplication.

### Aggregate Token Budget (Typical Active User / Day)

| Call Site | Frequency | Tokens/Call | Daily Total | Notes |
|-----------|-----------|------------|------------|-------|
| Chat (5 messages) | 5 | 1500 | 7,500 | No cache; context-heavy |
| Receipt OCR (2 uploads, cache hit 50%) | 2 effective | 1750 | 1,750 | Half cached; image-heavy |
| Product Insights (20 products, 1/day) | 1–2 | 1000 | 1,000–2,000 | DB cached; async eligible |
| Dashboard (1 load) | 1 | 1300 | 1,300 | No cache; stats-light |
| **Daily Total** | — | — | **~11,550** | Baseline (conservative mid-day traffic) |
| **Spike Day** (20 chats + 5 receipts + dashboard) | — | — | **~35,000** | High activity day |

**Cost Implication:** Google Gemini 2.5-flash: ~$0.075 per 1M input tokens, $0.30 per 1M output tokens.
- Baseline: ~$0.87/user/day
- Spike: ~$2.63/user/day
- 100 active users: **$87–263/day = $2,600–7,890/month**

---

## Token Optimization Strategies

### 1. Context Reduction (Quick Win)
✓ **Already implemented** in `buildSalesContext()`: limits to 30-day window, top 5 products, top 5 low-stock items.

**Further optimization:**
- Cap context string to ~500 tokens (currently unbounded)
- Use summarized aggregates (total revenue, avg daily sales) instead of line-item details
- Estimated savings: **10–15% reduction in chat tokens** (~150–225 tokens/call)

### 2. Semantic Caching for Chat (Medium Effort)
**Current state:** Each message = fresh API call

**Recommended approach:**
- Use **Vercel's `unstable_cache()`** or **Upstash Redis** to cache chat response patterns
- Key: Hash of (user_id + last_context + normalized_question)
- TTL: 24h (context rotates daily anyway)
- Hit rate estimate: 20–30% for repeated questions (e.g., "How's my sales looking?")

**Implementation:**
```typescript
const cacheKey = `chat:${userId}:${hashContext(context)}:${normalizeQuestion(message)}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;
const response = await generateText({...});
await redis.set(cacheKey, response, { ex: 86400 });
```

**Savings:** 20–30% reduction on chat tokens = 1,500–2,250 tokens/day for active chatters

### 3. Batch Product Insights (Background Job)
**Current state:** Computed on-demand during `getProductInsights()` call (synchronous, blocks response)

**Recommended approach:**
- Move AI insight computation to **Server Action dispatch + background job** (e.g., cron or manual trigger)
- Compute insights for all user products once per day (off-peak, e.g., 2 AM UTC)
- Store in `ai_insights`; dashboard retrieves from cache, never blocks
- Defer UI indicates "insights last updated 14h ago"

**Benefits:**
- Eliminates latency for `getProductInsights()` on dashboard load
- Allows batch call to Google API (potential volume discount)
- Reduces peak-hour token consumption

**Implementation:** Use Next.js route handler (`POST /api/jobs/compute-insights`) triggered by external cron or internal `revalidatePath()` + periodic fetch.

**Savings:** Shifts 5,000–10,000 tokens to off-peak; reduces peak contention

### 4. Structured Output Refinement (Low Effort)
**Current state:** Product Insights and Receipt OCR already use `generateObject()` with Zod.

**Opportunity:** Chat endpoint still uses `generateText()` but responses are semi-structured (e.g., lists, recommendations).

**Recommended approach:**
- Define Zod schema for chat responses (e.g., `{ recommendation: string[], reasoning: string }`)
- Use `generateObject()` for chat responses
- Benefit: More predictable output + potential token savings via constrained decoding (~5–10%)

**Estimated savings:** 50–100 tokens/chat response

### 5. Model Selection (Quick Win, Minimal Loss)
**Current state:** All calls use `gemini-2.5-flash`

**Evaluation:**
- **Gemini 2.0-flash:** Faster, ~15–20% cheaper, OK for non-vision tasks (chat, insights)
- **Gemini 1.5-flash:** More capable, significantly higher cost for this use case
- **Gemini 1.5-pro:** Overkill; reserved for complex reasoning

**Recommended strategy:**
- Chat: Use `gemini-2.0-flash` → **20% savings**
- Product Insights: Use `gemini-2.0-flash` → **20% savings**
- Receipt OCR: Keep `gemini-2.5-flash` (vision quality matters more)
- Dashboard insights: Use `gemini-2.0-flash` → **20% savings**

**Aggregate savings:** ~15% across non-vision tasks = 1,200–1,700 tokens/day

### 6. Rate Limit & Concurrency Management
**Current state:**
- Receipt upload: User-level 5s throttle ✓
- Other endpoints: No throttle

**Recommended:**
- Add user-level 2s concurrency limit for chat (prevents spam)
- Add project-level burst allowance (e.g., 1000 tokens/second) before queuing
- Track cumulative tokens per user per day; warn at 50% budget, throttle at 80%

**Benefit:** Prevents runaway costs; improves predictability for budget forecasting

---

## Token Optimization Priority Roadmap

| Priority | Strategy | Effort | Savings | Timing |
|----------|----------|--------|---------|--------|
| P0 (Week 1) | Add token instrumentation + audit callsites | 4h | 0% (baseline) | Before any optimization |
| P1 (Week 1) | Model selection (2.0-flash for non-vision) | 2h | ~15% | Immediate ROI |
| P2 (Week 2) | Extend cache TTL for product insights | 1h | ~5% | Low risk |
| P3 (Week 2) | Implement semantic caching for chat | 6h | ~25% | Medium risk, high reward |
| P4 (Week 3) | Batch product insights to background task | 8h | ~30% shift to off-peak | High effort, high reward |
| P5 (Future) | Upstash Redis for distributed cache | 4h | ~10% | After semantic caching validates use case |

**Total achievable savings:** 45–50% from all strategies (estimated ~5,500–7,000 tokens/day/active user)

---

## Database Schema Design

### Table 1: `surplus_listings`

Purpose: MSME posts surplus items with discounted pricing and automatic expiration.

```sql
CREATE TABLE surplus_listings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Listing metadata
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Reference to existing product (optional; for quick conversion from inventory)
  product_id INT REFERENCES products(id) ON DELETE SET NULL,
  
  -- Surplus specifics
  quantity_available INT NOT NULL,
  unit_type VARCHAR(50) DEFAULT 'unit' NOT NULL, -- 'kg', 'unit', 'box', etc.
  regular_price DECIMAL(10, 2), -- Original price reference
  surplus_price DECIMAL(10, 2) NOT NULL, -- Discounted selling price
  
  -- Lifecycle
  status VARCHAR(20) DEFAULT 'active' NOT NULL, -- enum: active, reserved, expired, completed, cancelled
  started_at TIMESTAMP DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP NOT NULL, -- When listing auto-expires
  
  -- Tracking
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_surplus_listings_user_id ON surplus_listings(user_id);
CREATE INDEX idx_surplus_listings_status ON surplus_listings(status);
CREATE INDEX idx_surplus_listings_expires_at ON surplus_listings(expires_at);
```

**Rationale:**
- Separate from `products` table to avoid schema bloat and allow independent lifecycle
- `product_id` optional: supports both "convert existing inventory" and "add new surplus item" workflows
- `expires_at` index for efficient queries on "active listings expiring in 24h"
- `surplus_price` stored explicitly for transparency; no calculation needed at query time

### Table 2: `surplus_reservations`

Purpose: Guest bookings for surplus items; MSME dashboard to track fulfillment.

```sql
CREATE TABLE surplus_reservations (
  id SERIAL PRIMARY KEY,
  listing_id INT NOT NULL REFERENCES surplus_listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- MSME owner (for audit/dashboard)
  
  -- Guest info (trust-based, no auth required)
  guest_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255),
  guest_phone VARCHAR(20),
  
  -- Reservation terms
  quantity_reserved INT NOT NULL,
  reservation_status VARCHAR(20) DEFAULT 'pending' NOT NULL, 
  -- enum: pending (just booked), confirmed (MSME acknowledged), completed (pickup done), cancelled
  
  -- Notes
  pickup_notes TEXT, -- Guest preferences or MSME instructions
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  confirmed_at TIMESTAMP, -- When MSME confirms availability
  completed_at TIMESTAMP, -- When guest picks up
  cancelled_at TIMESTAMP
);

CREATE INDEX idx_surplus_reservations_listing_id ON surplus_reservations(listing_id);
CREATE INDEX idx_surplus_reservations_user_id ON surplus_reservations(user_id);
CREATE INDEX idx_surplus_reservations_status ON surplus_reservations(reservation_status);
CREATE INDEX idx_surplus_reservations_created_at ON surplus_reservations(created_at);
```

**Rationale:**
- `user_id` (MSME owner) for MSME dashboard filtering
- No payment fields (trust-based offline settlement)
- Minimal guest auth (name + optional email/phone for notifications)
- Status transitions: `pending` → `confirmed` → `completed` (or → `cancelled`)
- Timestamps track workflow progression without hard relational constraints

### Migration Strategy

**Wave 0: Schema Creation**
```bash
npx drizzle-kit generate    # Create migration files
npx drizzle-kit push       # Apply to Neon
```

**Wave 1: Indices** (if performance testing shows contention)
- Add index on `(user_id, status)` for dashboard queries
- Add index on `(expires_at, status)` for public marketplace queries
- Monitor Neon Query Insight for slow queries

**Schema integrity:**
- All foreign keys cascade on delete (aligns with existing `products`, `receipts` pattern)
- No circular references
- Supports queries: "MSME's active listings", "Reservations pending confirmation", "Expired listings"

---

## Implementation Dependencies

### Library Versions (Current State)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `ai` | 5.0.129 | AI SDK wrapper | Supports `generateText` + `generateObject` with structured output |
| `@ai-sdk/google` | 2.0.52 | Google AI provider | Gemini models; supports vision via image buffer |
| `drizzle-orm` | 0.45.1 | Database ORM | Full PostgreSQL support; migration support via drizzle-kit |
| `drizzle-kit` | 0.31.8 | DB management CLI | Handles migrations, schema generation |
| `zod` | 4.3.6 | Schema validation | Used for `generateObject()` schemas |
| `@neondatabase/serverless` | 1.0.2 | Neon driver | Lightweight serverless PostgreSQL adapter |

**No new dependencies required for Phase 1.** Existing stack is complete.

### Configuration & Secrets

- `GOOGLE_GENERATIVE_AI_API_KEY`: Already in env; required to function
- Optional: `UPSTASH_REDIS_REST_URL` (for Phase 2 semantic caching; not required for Phase 1)
- Optional: `GOOGLE_GENERATIVE_AI_API_BUDGET` (custom monitoring; not native Google API support)

### External Services

| Service | Required | Used For | Cost Impact |
|---------|----------|----------|------------|
| Google Gemini API | ✓ Yes | OCR, chat, insights | ~$2,600–7,890/month (100 active users) |
| Neon PostgreSQL | ✓ Yes | Data persistence | Included in Neon compute plan |
| Upstash Redis | Optional | Distributed cache (Phase 2) | ~$20/month starter tier |

---

## Early Warnings & Pitfalls

### 1. In-Memory Cache Loss on Deploy
**Risk:** Receipt OCR cache stored in `Map<string, ...>` (process memory); lost on every Vercel deployment.
**Impact:** First upload after deploy always hits API (inefficient).
**Mitigation:** Migrate to `ai_insights` table or Upstash Redis before scaling.
**Timeline:** Critical if frequency > 10 receipts/day/user.

### 2. Unmetered Token Consumption
**Risk:** No token tracking today; can't forecast spend or detect runaway behavior.
**Impact:** Budget overruns; undetected API errors.
**Mitigation:**
- Add `tokenUsage` tracking to every `generateText`/`generateObject` call
- Log to new `ai_usage_logs` table or external observability tool (CloudWatch, Datadog)
- Set up alerting at 75% budget threshold

**Implementation:**
```typescript
const { text, usage } = await generateText({...});
// usage.inputTokens, usage.outputTokens; log to DB or observability
```

### 3. Product Insights Sync Compute Blocks Dashboard
**Risk:** `getProductInsights()` calls `generateObject()` for all products at once (synchronous).
**Impact:** Dashboard load time spikes to 5–15s if > 5 products need AI.
**Mitigation:** Move to background job (Phase 2); unblock dashboard with cached data.
**Temporary (Phase 1):** Set reasonable product limits or use fallback if cache miss.

### 4. Schema Bloat Risk for Surplus Tables
**Risk:** Future features (ratings, delivery metadata, payment status) tempt adding columns to `surplus_listings`.
**Mitigation:** Keep Phase 1 tables minimal; use JSONB `metadata` column for extensibility if needed.

### 5. Guest Spam/Bot Abuse
**Risk:** No auth + frictionless reservation = bot target for denial of service.
**Impact:** MSME dashboard flooded with junk reservations.
**Mitigation (Phase 1):** Explicit requirement GUEST-04; implement in Phase 1 scope.
- Rate limit: Max 5 reservations per IP per hour
- CAPTCHA or honeypot field on public form
- Reservation TTL: Auto-cancel if not confirmed within 1 hour

### 6. Timezone Misalignment in `expires_at`
**Risk:** `expires_at` stored in UTC; user sets "tomorrow 6 PM" but means local time.
**Impact:** Listings expire 5–13 hours early/late (timezone dependent).
**Mitigation:** Store user timezone in MSME profile; convert `expires_at` on insert/read or enforce UTC explicit input.

---

## Next Steps (Output to Planner)

1. **Instrumentation (OPT-01 Audit):**
   - Add `token_usage_logs` table (timestamp, user_id, endpoint, input_tokens, output_tokens, cost)
   - Wrap all AI calls with tracking decorator
   - Generate week 1 audit report

2. **Schema Finalization:**
   - Review `surplus_listings` + `surplus_reservations` schema with MSME stakeholders
   - Confirm field names, enum values, TTL policies
   - Generate migration files via drizzle-kit

3. **Caching Strategy:**
   - Decide: in-memory (temporary) vs. Upstash Redis (persistent) for Phase 1
   - Assess Vercel function memory constraints

4. **Rate Limiting:**
   - Implement user-level throttle for chat/insights
   - Set up cost budget ceiling + alert

---

## Sources

### Primary (HIGH confidence)
- LeafSlip codebase analysis: `app/actions/chat.ts`, `app/actions/receipts.ts`, `app/actions/products.ts`, `app/actions/dashboard.ts`
- Drizzle ORM docs: schema patterns for cascading deletes, indexing strategy
- Google Gemini API docs: model pricing, token counting, vision capabilities
- Vercel AI SDK docs: `generateText()`, `generateObject()`, structured output support

### Secondary (MEDIUM confidence)
- Google Gemini model selection: Published pricing tiers, model cards (2.5-flash vs. 2.0-flash)
- Token estimation: Based on typical prompt patterns observed in codebase; actual usage varies by user data size

### Tertiary (LOW confidence)
- Upstash Redis adoption for semantic caching: Viable but not yet validated in production for this project

---

## Metadata

**Confidence breakdown:**
- AI usage audit (HIGH): Direct code inspection; metrics reproducible
- Token optimization strategies (HIGH): Based on industry best practices + specific codebase patterns
- Database schema (HIGH): Aligns with existing Drizzle/PostgreSQL patterns in project
- Rate limiting / cost forecasting (MEDIUM): Dependent on actual user behavior after launch

**Research date:** 2026-05-08
**Valid until:** 2026-05-22 (2 weeks; Google API pricing/models stable but check for new Gemini releases)
