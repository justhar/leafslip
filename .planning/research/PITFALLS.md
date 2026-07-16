# Domain Pitfalls

**Domain:** greenslip
**Researched:** May 8, 2026

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Guest booking without auth
**What goes wrong:** Malicious users could execute many fake bookings using bots.
**Why it happens:** The system accepts bookings and issues receipts to anonymous users.
**Consequences:** DoS attacks, spam, or loss of revenue and actual stock availability.
**Prevention:** Implement rate limiting, IP blocking, CAPTCHAs, or a mandatory email verification step for guests.
**Detection:** High volume of bookings from a single IP or unusual booking patterns in logs.

### Pitfall 2: Over-reliance on AI for critical operations
**What goes wrong:** The AI agent hallucinates or makes incorrect recommendations on stock or agricultural actions.
**Why it happens:** AI models can be unpredictable and lack real-world context if not properly grounded with factual data.
**Consequences:** Incorrect actions taken by users based on bad advice, leading to crop loss or financial discrepancies.
**Prevention:** Hardcode critical constraints and use AI only as a supplementary tool with a human-in-the-loop for final decisions. Establish clear confidence thresholds for AI outputs.
**Detection:** User reports of nonsensical AI suggestions or system logs showing erratic AI-driven actions.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Authentication | Overly permissive guest access | Implement strict rate limits and consider email verification for guest actions. |
| AI Integration | AI executing destructive actions | Restrict AI permissions strictly to read-only or require human confirmation for any state changes. |

## Sources

- General web application security best practices.
- AI integration safety guidelines.
