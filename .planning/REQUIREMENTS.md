# Requirements: LeafSlip AI Optimization & Surplus Marketplace

**Defined:** 2026-05-08
**Core Value:** Reducing operational API cost while introducing an overstock recovery guest marketplace.

## v1 Requirements

Requirements for initial release of this milestone.

### AI Optimization (OPT)

- [ ] **OPT-01**: Map and log current AI usage bottlenecks (Token volume, queries) in existing features.
- [ ] **OPT-02**: Implement a caching layer (`unstable_cache` or Upstash Redis) for duplicate/deterministic AI predictions.
- [ ] **OPT-03**: Refactor heavy AI prompts and parsing to use structured outputs (`generateObject` with Zod) to reduce token payload.
- [ ] **OPT-04**: Decouple heavy background task invocations from blocking synchronous Next.js Server Actions.

### Surplus Marketplace (MARKET)

- [ ] **MARKET-01**: Create dedicated `surplus_listings` database schema.
- [ ] **MARKET-02**: MSME Dashboard UI to convert/allocate existing inventory to surplus with custom expiration and discounted price.
- [ ] **MARKET-03**: MSME Dashboard UI to add manual surplus items independent of generic inventory tracking.
- [ ] **MARKET-04**: Public marketplace viewing interface (isolated non-auth route) that fetches and displays active listings.

### Guest Appointments (GUEST)

- [ ] **GUEST-01**: Provide a frictionless reservation button on public surplus listings.
- [ ] **GUEST-02**: System tracks reservations in `surplus_reservations` table (guest basic details, listing, quantity, status).
- [ ] **GUEST-03**: Add dashboard view for MSMEs to manage open reservations and mark them as fulfilling (store pickup complete).
- [ ] **GUEST-04**: Basic rate-limit or protection layer against bot abuse for guest booking.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### [Payments & Verification]

- **PAY-01**: Stripe Checkout integration to secure reservations with partial or full payment.
- **VER_01**: Implement OTP/Email verification for guests booking an appointment.

## Out of Scope

Explicitly excluded for this MSME platform version.

| Feature | Reason |
|---------|--------|
| Payment Gateways | Guests pay at the store; aiming for simple offline settlement. |
| Delivery/Logistics | Not a delivery platform; items are strictly store pickup to reduce overhead. |
| Guest User Accounts | Deliberately skipped to reduce friction; appointments are trust-based. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| OPT-01 | Phase 1 | Pending |
| OPT-02 | Phase 2 | Pending |
| OPT-03 | Phase 2 | Pending |
| OPT-04 | Phase 2 | Pending |
| MARKET-01 | Phase 1 | Pending |
| MARKET-02 | Phase 3 | Pending |
| MARKET-03 | Phase 3 | Pending |
| MARKET-04 | Phase 4 | Pending |
| GUEST-01 | Phase 4 | Pending |
| GUEST-02 | Phase 1 | Pending |
| GUEST-03 | Phase 3 | Pending |
| GUEST-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0

---
*Requirements defined: 2026-05-08*
