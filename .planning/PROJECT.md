# Project: LeafSlip AI Optimization & Surplus Marketplace

## What This Is
An extension of the existing LeafSlip platform (An AI-Integrated End-to-End Overstocking & Food Waste Management Platform for MSMEs). The goal of this milestone is twofold:
1. **AI Optimization:** The current AI usage (OCR for receipts, sales predictions, etc.) is suffering from high token usage and query volume. We will optimize this by analyzing current invocations, reducing redundant calls, using lighter models where appropriate, and potentially caching/batching.
2. **Surplus Marketplace:** A simple, trust-based marketplace guest feature to recover costs from overstocking. MSMEs can list surplus items, and guests can book pickup appointments without logging in or processing payments upfront.

## Core Value
Reducing the operational API cost of the platform while introducing a critical "overstock recovery" feature that directly helps MSMEs reduce food waste through a direct-to-consumer guest marketplace.

## Target Audience
- **MSMEs (Logged in):** Need to reduce their AI capability costs and easily list expiring/excess stock to recover value.
- **Guests/Consumers (Logged out):** Local buyers looking for discounted surplus food items who can make a quick reservation and pick it up at the store.

## Requirements

### Validated
- ✓ NextAuth (Auth.js) based MSME authentication.
- ✓ Receipt scanning (Outbound sales) via OCR using `@ai-sdk/google`.
- ✓ Product inventory tracking and management (`products` table).
- ✓ FastAPI-based Python ML backend for stock and sales predictions.
- ✓ React 19 + Next.js 16 App Router architecture using Drizzle ORM and Server Actions.

### Active
- [ ] Map and document where current AI models are invoked (OCR, Chat, Insights) and identify bottlenecks (token count, frequency).
- [ ] Refactor AI integration points to reduce token usage and redundant queries (e.g., using simpler models, batching, caching, or structured output optimization).
- [ ] Create `surplus_listings` functionality. Features include manual listing and converting existing `products` to surplus.
- [ ] Support surplus listing parameters: quantity available, discounted price, and expiration/end time.
- [ ] Build a public-facing Surplus Marketplace view accessible by guests.
- [ ] Implement a guest reservation/appointment flow for surplus items (trust-based, no login, no payment gateway).
- [ ] Create `surplus_reservations` to track guest appointments (name, listing, quantity, status) linked back to the MSME dashboard.

### Out of Scope
- [Payment Gateways] — Guests pay at the store; the goal is simple offline settlement.
- [Delivery/Logistics] — Not a delivery platform; items are strictly store pickup.
- [Guest Accounts/Auth] — Deliberately skipped to reduce friction; appointments are purely trust-based.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Optimizing Token / Query Volume | Current usage is too high. Need to maintain MSME value without explosive API costs. | — Pending |
| Guest Checkout (No Auth) | Reduces friction for buyers; trust-based mechanism is simpler to MVP than strict verification. | — Pending |
| Separate `surplus_listings` Table | Cleaner data model than adding multiple nullable active/inactive market columns to the base `products` schema. | — Pending |
| Store Pickup Only | Eliminates complex logistics and keeps platform focus on MSME inventory and cost reduction. | — Pending |

## Evolution
This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-08 after initialization*
