# Phase 3: Surplus Marketplace Backend & UI - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning

<domain>
## Phase Boundary

MSMEs can manage surplus inventory in their dashboard.

</domain>

<decisions>
## Implementation Decisions

### Managing Surplus Listings
- Link to Products? Optional Link (Nullable) — A surplus item can be linked to a standard product to sync base info, but it doesn't have to be.
- Listing Expiry? Require explicit expiry date — Surplus items are time-sensitive, forcing an expiry prevents stale listings.
- Quantity Tracking? Deduct from main inventory automatically — Creating a surplus listing immediately deducts stock from the linked main product. A UI alert will confirm this with the user.

### Reservation Flow (Backend)
- Payment method? Pay on pickup — Keep the MVP simple. No payment gateway integration needed; MSMEs collect cash or QRIS at the store.
- Confirmation mechanism? Unique 6-character code — Generated upon reservation. Guest shows this code to the MSME to claim the item.
- Reservation Expiry? Auto-expire shortly after pickup time — If not picked up by the listing's expiry time + 2 hours, it auto-cancels and frees the item.

### UI Integration
- Navigation placement? New "Surplus" tab in the dashboard sidebar — Keeps it distinct from standard "Products".
- AI Integration in UI? Generate description automatically — When creating a listing, provide an option to generate an appetizing description using Gemini based on the product name.
- Status visualization? Visual badges — Use color-coded badges to easily spot status (e.g., Green for Active, Blue for Reserved, Gray for Expired).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/components/Sidebar.tsx` or similar for adding the new navigation item.
- Existing database schema in `db/schema.ts` includes `surplus_listings` and `surplus_reservations`.

### Established Patterns
- Server Actions for data mutations (`app/actions/surplus.ts` to be created).
- Tailwind CSS for styling and badges.

### Integration Points
- Dashboard sidebar navigation.
- Product inventory adjustments on surplus creation.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
