# Project Research Summary

**Project:** leafslip
**Domain:** Guest Surplus Marketplace & AI overstocking platform
**Researched:** May 8, 2026
**Confidence:** HIGH

## Executive Summary

Leafslip is an AI overstocking and food waste management platform for MSMEs, currently exploring a Guest Surplus Marketplace. To ensure frictionless conversion without sacrificing performance or cost-efficiency, the application leans into decoupled edge caches, public routing pathways, and structured AI optimization.

The recommended technical approach employs Vercel AI SDK and Upstash Redis alongside automated prompt optimizers (DSPy) to dramatically reduce LLM token volume and latency. Guest checkouts are designed as ephemeral Upstash KV session stores combined with simple Stripe flows to prevent filling the relational DB with stale data. 

The main risks revolve around automated bot attacks targeting guest paths and over-reliance on generative AI for system state mutations. Key mitigations include mandatory rate-limits (or lightweight verifications) and ensuring AI write capabilities have hard constraints and "human-in-the-loop" confirmations.

## Key Findings

### Recommended Stack

Leveraging the existing Next.js, Drizzle, and PostgreSQL foundation while leaning heavily into Vercel AI SDK and Upstash / DSPy for optimized token usage.

**Core technologies:**
- **Vercel AI SDK**: AI integration — Native Next.js support, optimal for edge environments, tracking, and standardized streaming.
- **Upstash Redis / KV**: Caching and Guest Carts — Extremely fast edge caching for repeated AI queries and transient ephemeral session state.
- **DSPy**: Prompt Optimization — Programmatically extracts only essential instructions, reducing prompt scale/token waste.
- **Stripe Checkout**: Payment processing — Simple guest conversion setup without forced account creation.

### Expected Features

**Must have (table stakes):**
- Guest Checkout Flow — Reduces friction for one-off transactions.
- Inventory View/Search — Core necessity for surplus items discovery.
- Token Usage Dashboard — Basic requirement for optimization transparency.
- Basic AI Token Caching — Requisite measure to limit duplicate API calls and costs.

**Should have (competitive):**
- Semantic Token Caching — Advanced token deduplication via embedding mapping.
- Predictive Inventory Pre-allocation — Enhances availability based on AI user modeling.

**Defer (v2+):**
- Custom Local LLM Hosting — High overhead, detracts from core focus.
- Complex Multi-tier Guest Roles — Keep flow simple and direct.

### Architecture Approach

Data flow revolves around decoupled Server Actions for mutations and isolated public route groups (`app/(market)`) for SEO indexing without middleware collision. 

**Major components:**
1. **Public Marketplace**: Renders non-auth UI elements (listings/grids) utilizing Next.js React Server Components.
2. **AI Service Layer**: Wraps upstream AI/Python server requests, outputs Zod-validated structures using Vercel AI SDK (`generateObject`), and handles prompt compilation.
3. **Cache Facade**: Uses `unstable_cache` alongside Redis to intercept/cache expensive AI generations consistently.
4. **Mutation Layer (Server Actions)**: Validates incoming payloads from guest paths and integrates securely with Drizzle.

### Critical Pitfalls

1. **Guest Booking Bot Abuse** — Prevent DOS and stock depletion by introducing IP/rate limits, CAPTCHA, or lightweight email verifications.
2. **Long-Running Batch AI Calls Blocking SA** — Avoid Next.js timeouts by bypassing large synchronous AI batchings inline; use background webhooks, async jobs, or direct streaming responses.
3. **Unchecked Destructive AI Mutations** — Hardcode constraints restricting AI from unilaterally overwriting DB state without human verification thresholds.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Public Marketplace UI & Read Operations
**Rationale:** Creates the decoupled non-auth boundary needed for marketplace viewing without heavy dependencies.
**Delivers:** Isolated `app/(market)` public route groups, inventory browsing logic.
**Addresses:** Inventory View/Search.
**Avoids:** Unsecured state mutations (strictly read-only components).

### Phase 2: Ephemeral Guest Checkout flows
**Rationale:** Enables frictionless purchases utilizing edge stores without burdening PostgreSQL with abandoned carts.
**Delivers:** Upstash KV cart sessions, Stripe Checkout integration, and webhook reconciliation.
**Addresses:** Guest Checkout Flow.
**Avoids:** Guest Booking Bot Abuse (via rate limited pipelines upon add-to-cart).

### Phase 3: AI Service Facade & Basic Caching
**Rationale:** Optimizes AI costs before unlocking higher utilization or exposing massive processing loads.
**Delivers:** Vercel AI SDK layer + Zod structure integrations, Next.js `unstable_cache` wrapping.
**Addresses:** Basic Token Caching, Token Usage Dashboard.
**Avoids:** Long-Running Batch AI calls via async wrappers.

### Phase 4: Predictives & Semantic Token Deduplication (v2)
**Rationale:** Scales optimization capabilities once initial metrics outline the primary prompt schemas.
**Delivers:** DSPy optimized trimming architectures, vector-based similarity proxy caching.
**Addresses:** Semantic Token Caching, Predictive Inventory Pre-allocation. 

### Phase Ordering Rationale

- **Dependency Ordering:** Visual marketplace browsing unlocks user intent, allowing ephemeral cart creations, which then provide the data payload to test optimized unified AI requests.
- **Architecture Grouping:** Isolating route structures provides immediate value and safety, ensuring the more complex DSPy/Redis AI facades have clear structured endpoints to serve.
- **Pitfall Avoidance:** Tackles simple rate-limits early in Phase 2 before deeper DB access expands in AI optimizations.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Stripe Checkouts specifically mapped correctly against stateless Upstash Guest Carts vs authenticated user models.
- **Phase 4:** DSPy optimization compilation techniques specific to Next.js Edge constraints.

Phases with standard patterns (skip research-phase):
- **Phase 1 & Phase 3:** Typical Next.js 16 app router concepts and common Vercel SDK patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Validated modern Next.js 16 / Edge stack patterns from official documentation. |
| Features | HIGH | Adheres to typical marketplace expectations & modern LLM application optimizations. |
| Architecture | HIGH | Explicit separation of standard App Router limits and Edge caching needs. |
| Pitfalls | HIGH | Represents well-documented architectural safety concerns in similar products. |

**Overall confidence:** HIGH

### Gaps to Address

- **Friction thresholds:** The exact acceptable friction level for guest access (CAPTCHA vs OTP vs Silent rate-limiting) remains unresolved against expected conversion targets. Needs decision prior to rolling out Phase 2.

## Sources

### Primary (HIGH confidence)
- Official Next.js 16 Documentation — Caching, Route Groups, and Server Actions.
- Vercel AI SDK Documentation — UI streaming and `generateObject()`.
- Upstash Redis & Fast KV Documentation — Edge ephemeral caching.
- DSPy Official Guides — Semantic token reductions.

### Secondary (MEDIUM confidence)
- General eCommerce Marketplace Best Practices — Guest checkouts and transaction structures.
- LLM optimization strategies — Semantic Caching principles.

---
*Research completed: May 8, 2026*
*Ready for roadmap: yes*