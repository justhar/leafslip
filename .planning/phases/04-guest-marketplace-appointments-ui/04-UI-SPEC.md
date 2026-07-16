# Phase 4: Guest Marketplace UI Specification

**Phase Goal:** Local buyers can browse and reserve surplus items.

## 1. User Flows

### Flow 1: Browsing the Market
1. Public user visits `/market`.
2. Sees a clean, mobile-friendly storefront listing all active surplus items.
3. User can type into a search bar to filter by product name.
4. Each item card shows: Image/Icon, Title, Store Name, Price (Original & Discounted), Quantity Remaining, and Time Left to Expiry.

### Flow 2: Reserving an Item
1. User clicks "Reservasi" on an item card.
2. A modal or new page opens showing item details.
3. User fills out a simple form:
   - Name
   - Phone Number (WhatsApp)
   - Quantity (up to the remaining quantity)
   - Estimated Pickup Time (e.g., "Hari ini jam 17:00")
4. User submits the form.
5. The system generates a unique 6-character alphanumeric code.
6. A success screen displays the code prominently, with instructions to screenshot it and show it to the merchant upon arrival.

## 2. Layout & Components

### Page: `/market`
- **Header:** GreenSlip Market logo, simple search bar.
- **Hero/Banner:** "Selamatkan makanan, hemat uang. Penawaran spesial dari warung sekitarmu."
- **Grid:** Responsive grid of Item Cards.
  
### Component: `ItemCard`
- **Visual:** Simple graphic or leaf icon (if no image).
- **Details:** Title, Price (`RpX`), Stock `X tersisa`, Expiry Badge.

### Component: `ReservationModal`
- **Form Fields:** Name, Phone, Quantity, Pickup Note.
- **Success State:** Big green checkmark, large text block for the 6-character code, "Simpan kode ini".

## 3. Design System Mapping

- **Colors:** Primary brand color `#2D3E2D`, accent `#D9ED92` for buttons. Use red/orange for urgency (e.g., "Sisa 1" or "Kedaluwarsa dalam 2 jam").
- **Typography:** Inter, highly legible.

## 4. State Management

- Client-side filtering for the search bar.
- Server Action `createReservation(listingId, data)` creates the record and reduces `remainingQuantity` on the listing.
- Revalidation of `/market` to keep stock counts updated.
