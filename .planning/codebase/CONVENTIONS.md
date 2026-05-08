# Coding Conventions

**Analysis Date:** 2026-05-08

## Naming Patterns

**Files:**
- React Components: PascalCase observed (e.g., `components/FullChatbot.tsx`, `components/Navbar.tsx`).
- Next.js Routes: kebab-case or next.js specific names (e.g., `app/page.tsx`, `app/actions/chat.ts`).
- Server actions: camelCase for action files (e.g., `app/actions/chat.ts`).

**Functions:**
- camelCase for helper functions and server actions (e.g., `formatCurrency` in `app/actions/chat.ts`).
- PascalCase for React components (e.g., `export default function App()`).

**Variables:**
- camelCase (e.g., `isSidebarOpen`, `nextConfig`).

**Types:**
- PascalCase for types and interfaces (e.g., `ScannedReceipt` inside `app/page.tsx`, `ChatMessage` in `app/actions/chat.ts`).

## Code Style

**Formatting:**
- Built-in Next.js/TypeScript formatting is likely used. No `.prettierrc` or `biome.json` configs were found.

**Linting:**
- No custom `.eslintrc` or `eslint.config.ts` was detected. Relying on default Next.js linting if any.

## Import Organization

**Order:**
1. React hooks usually imported first (e.g., `import React, { useState, useEffect } from "react";`)
2. Relative imports from components (e.g., `import Navbar from "./components/Navbar";`)
3. Icons and external UI libraries imported (e.g., `import { FileText } from "lucide-react";`)
4. Types imported at the end (e.g., `import { ScannedReceipt } from "./types";`)

**Path Aliases:**
- `@/*` mapped to `./*` in `tsconfig.json`. (Used in `app/actions/chat.ts` as `import { auth } from "@/auth";`)

## Error Handling

**Patterns:**
- Not strictly detected in sample. Default React/Next.js error boundaries.

## Logging

**Framework:** `console`

**Patterns:**
- Standard `console.log` and Next.js default server logs.

## Comments

**When to Comment:**
- Code is mostly self-documenting. Comments are sparse.

**JSDoc/TSDoc:**
- Not consistently used.

## Function Design

**Size:** 
- Standard React component sizes (e.g., `app/page.tsx` handles large layout and state).

**Parameters:** 
- Mostly destructured props in components or typed parameters in functions (`(userId: string)`).

**Return Values:** 
- React nodes for components, typed objects for server actions.

## Module Design

**Exports:**
- `export default` for page components and main components.
- Named exports for actions, utils, and schema definitions.

**Barrel Files:**
- Database exports in `db/index.ts`.