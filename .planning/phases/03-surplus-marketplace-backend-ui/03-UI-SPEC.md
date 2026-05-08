# Phase 3: Surplus Marketplace UI Specification

**Phase Goal:** MSMEs can manage surplus inventory in their dashboard.

## 1. User Flows

### Flow 1: Surplus Management Dashboard
1. MSME user clicks "Surplus" tab in the dashboard sidebar.
2. User sees a summary of current active surplus listings and recent reservations.
3. User sees a table/grid of all surplus listings with visual status badges (Active, Reserved, Expired).

### Flow 2: Creating a Surplus Listing
1. MSME user clicks "Buat Listing" (Create Listing) from the Surplus dashboard.
2. User selects an existing product from a dropdown or types a new title.
3. User enters quantity, price, and expiration time.
4. User clicks "Generate Description" using Gemini AI, which outputs a compelling item description based on the title.
5. User clicks "Save". A UI alert confirms: "Peringatan: Membuat listing ini akan memotong stok produk utama Anda." (Warning: Creating this listing will deduct stock from your main product.)
6. User clicks "Ya, lanjutkan" to publish the listing.

### Flow 3: Processing Reservations
1. A reservation appears with a "Pending" or "Reserved" status and a 6-character code.
2. Guest arrives to pick up the item and provides the 6-character code.
3. MSME user finds the reservation, verifies the code, and clicks "Selesaikan Transaksi" (Complete Transaction) to mark it as picked up and collect payment.

## 2. Layout & Components

### Page: `/dashboard/surplus`
- **Header:** Title "Surplus Market", "Buat Listing Baru" button.
- **Stats Row:** Active Listings, Total Reserved, Total Revenue from Surplus.
- **Listings Table:** Columns: Title, Product Link, Price, Qty/Remaining, Expires At, Status Badge, Actions.

### Modal: Create/Edit Listing
- **Form Fields:** 
  - Product Dropdown (Optional Link)
  - Title (Text)
  - Price (Number)
  - Quantity (Number)
  - Unit Label (Text, default "item")
  - Expiry Date/Time (DateTime Picker)
  - Description (Textarea)
- **AI Action:** "Generate Description" button with a sparkle icon next to the Description textarea.
- **Confirmation Alert:** Native browser `confirm()` or styled Dialog for stock deduction warning.

## 3. Design System Mapping

- **Colors:** 
  - Status Active: Green badge (`bg-green-100 text-green-800`)
  - Status Reserved: Blue badge (`bg-blue-100 text-blue-800`)
  - Status Expired: Gray badge (`bg-gray-100 text-gray-800`)
- **Typography:** Standard Inter dashboard styling.

## 4. State Management

- Client-side state for form inputs and modal visibility.
- Server Actions for `createSurplusListing`, `generateSurplusDescription`, `verifyPickupCode`.
- Server-side caching and revalidation using Next.js `revalidatePath("/dashboard/surplus")`.
