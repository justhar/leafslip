## Phases

- [ ] **Phase 1: Database & AI Optimization Setup** - Establish schema and optimization foundation.
- [ ] **Phase 2: Core AI Optimization Application** - Refactoring AI logic and background tasks.
- [ ] **Phase 3: Surplus Marketplace Backend & UI** - MSME Dashboard for creating listings.
- [ ] **Phase 4: Guest Marketplace & Appointments** - Public view and booking flow.

## Phase Details

### Phase 1: Database & AI Optimization Setup
**Goal**: Establish schema for surplus and foundation for AI optimization tracking.
**Depends on**: Nothing
**Requirements**: OPT-01, MARKET-01, GUEST-02
**Success Criteria**:
  1. AI usage bottlenecks mapped and logged in tools.
  2. `surplus_listings` and `surplus_reservations` tables created and migrated.
**Plans**: 4 plans in 4 sequential waves
- [x] 01-01-PLAN.md — Wave 1: Audit AI callsites & create instrumentation utilities (2 tasks)
- [ ] 01-02-PLAN.md — Wave 2: Instrument all AI actions (2 tasks, depends on 01-01)
- [ ] 01-03-PLAN.md — Wave 3: Create database schema & generate migrations (2 tasks)
- [ ] 01-04-PLAN.md — Wave 4: Establish baseline metrics (1 task, depends on 01-03)

### Phase 2: Core AI Optimization Application
**Goal**: Reduce API cost through caching, structured outputs, and async background tasks.
**Depends on**: Phase 1
**Requirements**: OPT-02, OPT-03, OPT-04
**Success Criteria**:
  1. AI calls use caching for duplicate predictions.
  2. Prompts generate structured output using `generateObject` with Zod.
  3. Heavy AI tasks run asynchronously without blocking synchronous actions.
**Plans**: TBD

### Phase 3: Surplus Marketplace Backend & UI
**Goal**: MSMEs can manage surplus inventory in their dashboard.
**Depends on**: Phase 1
**Requirements**: MARKET-02, MARKET-03, GUEST-03
**Success Criteria**:
  1. MSMEs can allocate existing inventory to surplus with custom expiration and discounted price.
  2. MSMEs can manually add surplus items independent of generic inventory tracking.
  3. MSMEs have a dashboard view to manage open reservations and mark them as fulfilling.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Guest Marketplace & Appointments
**Goal**: Guests can view and reserve surplus items without logging in.
**Depends on**: Phase 1, Phase 3
**Requirements**: MARKET-04, GUEST-01, GUEST-04
**Success Criteria**:
  1. Public marketplace interface displays active listings.
  2. Frictionless reservation button on public surplus listings.
  3. Bot abuse protection layer for guest booking.
**Plans**: TBD
**UI hint**: yes
