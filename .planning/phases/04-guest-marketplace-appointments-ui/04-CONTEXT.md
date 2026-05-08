# Phase 4: Guest Marketplace & Appointments UI - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Local buyers can browse and reserve surplus items.

</domain>

<decisions>
## Implementation Decisions

### Browsing the Marketplace
- Storefront Scope? Universal `/market` Page — A single, public page showing all active surplus items from all merchants.
- Filtering & Search? Simple text search — Let users search by item name or merchant name.
- Location Data? Skip for MVP — Assume it's a local deployment. No geolocation or distance sorting to keep it simple.

### Reserving Items
- Buyer Accounts? Guest Checkout (No Login) — Keep friction low. Buyers only need to provide their Name and WhatsApp number to reserve.
- Pickup Time Selection? Free text or rough estimate — Provide a simple text field or dropdown for estimated pickup time, as long as it's before expiry.
- Code Delivery? Display on screen — Show the 6-character confirmation code immediately on screen and prompt the user to screenshot it.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `surplusListings` table
- `surplusReservations` table

### Established Patterns
- Public pages exist outside of `/dashboard`. The `/market` route should be accessible without authentication.
- Server Actions for `createReservation`.
- Next.js caching with `revalidatePath`.

### Integration Points
- Public UI for `/market` and `/market/[id]`.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
