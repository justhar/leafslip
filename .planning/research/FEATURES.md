# Feature Landscape

**Domain:** Guest Surplus Marketplace and AI token optimization in an existing AI overstocking platform
**Researched:** May 8, 2026

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Guest Checkout Flow | Reduces friction for one-off purchases | Medium | Essential for a marketplace |
| Inventory View/Search | Users need to find what they want | Low | Standard eCommerce functionality |
| Token Usage Dashboard | Users need to understand billing/usage | Medium | Base requirement for token-based products |
| Basic Token Caching | Prevents redundant API calls/costs | Low | Standard optimization practice |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Semantic Token Caching | Maps similar prompts to cached responses (e.g., using embeddings) | High | Significantly cuts costs |
| Token Pruning | Extracts only essential logic/context before sending to LLM | High | Advanced cost optimization |
| Predictive Inventory Pre-allocation | Reserves stock based on AI predictions of guest behavior | Medium | Lowers latency, ensures availability |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Custom Local LLM Hosting | High overhead, detracts from core marketplace value | Use managed API services (OpenAI, Anthropic, etc.) with aggressive optimization |
| Complex Multi-tier Guest Roles | Overcomplicates checkout | Keep guest flow simple, prompt account creation post-checkout |

## Feature Dependencies

```
Inventory View/Search -> Guest Checkout Flow
Token Usage Dashboard -> Basic Token Caching
Basic Token Caching -> Semantic Token Caching
```

## MVP Recommendation

Prioritize:
1. Inventory View/Search
2. Guest Checkout Flow
3. Token Usage Dashboard

Defer: Semantic Token Caching (too complex for MVP, build basic caching first)

## Sources

- General eCommerce Marketplace best practices (Guest checkout)
- LLM optimization strategies (Caching, Pruning)
