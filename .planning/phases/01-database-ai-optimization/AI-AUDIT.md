# AI Callsites Audit — Generated 2026-05-08

## Summary
- Total callsites: 4
- Models in use: gemini-2.5-flash
- Total daily tokens (baseline/spike): 11,550–35,000
- Estimated cost: $0.87–$2.63 per user per day

## Per-Call Breakdown
| Callsite | Function | Model | Tokens/Call | Cache | File |
|----------|----------|-------|------------|-------|------|
| Callsite 1: Chat | sendChatMessage | gemini-2.5-flash | 1200–1800 | None | app/actions/chat.ts:134 |
| Callsite 2: OCR | extractReceiptItems | gemini-2.5-flash | 1500–2200 | SHA256 in-mem | app/actions/receipts.ts:235 |
| Callsite 3: Product Insights | getProductInsights | gemini-2.5-flash | 800–1200 | DB (ai_insights) | app/actions/products.ts:259 |
| Callsite 4: Dashboard Insights | generateInsights | gemini-2.5-flash | 1200–1500 | None | app/actions/dashboard.ts:198 |
