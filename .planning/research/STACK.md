# Technology Stack

**Project:** Leafslip (AI overstocking & food waste management MSME platform)
**Researched:** May 8, 2026

## Recommended Stack additions

### Core Framework (Existing)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 16.x | Full-stack meta-framework | Existing base |
| Drizzle ORM | 0.3x | Database ORM | Existing base |
| PostgreSQL | 16+ | Primary database | Existing base |

### AI API Optimization (Token Volume Reduction)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vercel AI SDK** | 3.x | AI integration and streaming | Native Next.js support, optimal for edge environments, and standardizes AI streaming interactions while supporting multiple models. |
| **Upstash Redis** | 1.x | Semantic Caching & Rate Limiting | Extremely fast edge caching for repeated queries. Using semantic caching (e.g., matching similar prompts) drastically limits API calls and token waste. |
| **DSPy** | 2.x | Prompt Optimization | Programmatically compiling and optimizing prompts reduces prompt size and token volume by extracting only necessary instructions and examples. |

### Guest Surplus Marketplace
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Stripe Checkout** | Latest | Payment processing | Simplest way to handle guest checkouts without requiring account creation. High conversion rate and webhook reliability. |
| **Upstash / Vercel KV** | Latest | Guest Cart Sessions | Keep temporary guest cart data fast and ephemeral without cluttering the primary PostgreSQL database with stale carts. |
| **Vercel Blob** | Latest | Image Hosting for Listings | Extremely zero-config object storage for surplus product images directly integrated into the Next.js workflow. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Prompt Optimization | DSPy | LangChain | LangChain is often too heavy and adds unnecessary abstraction layers for simple prompt management compared to DSPy's direct token-saving compilation approach. |
| Session Store | Upstash Redis KV | PostgreSQL JSON | Storing guest carts in PostgreSQL increases database load for volatile data. Redis automatically expires old carts (TTL) and is built for transient state. |
| AI Caching | Upstash Redis | Local In-Memory | Next.js serverless functions do not share local memory easily. A centralized Redis instance guarantees high hit rates for semantic caching across all regions and deployments. |

## Installation

```bash
# AI Optimization
npm install ai @ai-sdk/openai @upstash/redis dspy-node

# Marketplace
npm install stripe @vercel/kv @vercel/blob
```

## Sources

- Official Next.js 16 Documentation
- Vercel AI SDK Documentation
- Upstash Redis Documentation
- DSPy Official Guides
