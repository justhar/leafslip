# Codebase Concerns

**Analysis Date:** 2026-05-08

## Tech Debt

**Large Monolithic Components:**
- Issue: Components like `ReceiptScanner` and `products/page.tsx` are exceeding 500 lines of code, indicating they may be handling too many responsibilities (UI + State + Logic).
- Files: `app/components/ReceiptScanner.tsx`, `app/dashboard/products/page.tsx`
- Impact: Harder to test, maintain, and reuse.
- Fix approach: Refactor into smaller, focused sub-components. Extract complex state logic into custom hooks.

**Overloaded Server Actions:**
- Issue: Action files like `products.ts`, `dashboard.ts`, and `receipts.ts` are quite large (nearly 300-400 lines), suggesting they mix business logic, AI integration, and database calls.
- Files: `app/actions/products.ts`, `app/actions/dashboard.ts`, `app/actions/receipts.ts`
- Impact: Violates separation of concerns. Hard to unit test the business logic independently from Next.js server actions.
- Fix approach: Extract business logic and AI prompts into separate service modules, leaving the server actions to mainly handle request validation and response formatting.

## Performance Bottlenecks

**AI Token usage in Server Actions:**
- Problem: `GOOGLE_GENERATIVE_AI_API_KEY` is being used directly in server actions (`products.ts`, `dashboard.ts`, `chat.ts`).
- Files: `app/actions/products.ts`, `app/actions/dashboard.ts`, `app/actions/chat.ts`
- Cause: Synchronous or inline AI processing might cause long request times for users.
- Improvement path: Leverage Next.js Edge runtime, or implement background processing with polling/webhooks if the AI tasks take too long. Ensure streaming is used where applicable to improve perceived performance.

## Fragile Areas

**Empty or Fallback Returns:**
- Files: `app/actions/products.ts`, `app/components/StockInsights.tsx`
- Why fragile: Uses empty array (`return [] as Array<{...}`) or null fallback (`if (!message) return null;`) during silent failures, which can silently propagate errors up the component tree, leaving the user with a confusing empty state rather than a proper error message.
- Safe modification: Implement robust error handling or `Result` types instead of returning empty fallback objects.

**Client-Side AI Initialization:**
- Files: `app/components/AgricultureAssistant.tsx`
- Why fragile: Appears to access `process.env.API_KEY` on the client side directly, or expects an environment variable to exist. Note that `process.env` resolution is a build-time step on the client in some environments, and may lead to broken deployments if `API_KEY` is not prefixed properly or if this component is accidentally converted to a client component risking secret leakage.
- Safe modification: Keep AI logic firmly on the server via Server Actions or Server Components.

---

*Concerns audit: 2026-05-08*