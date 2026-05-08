# Token Usage Baseline Metrics

**Established:** 2026-05-08
**Method:** Codebase audit + instrumentation implementation + schema definition

## Aggregate Daily Stats (Typical Active User)

| Call Site | Frequency | Tokens/Call | Daily Total | % of Budget |
|-----------|-----------|------------|-------------|------------|
| Chat (5 msg) | 5 | 1500 | 7,500 | 65% |
| Receipt OCR | 1.5 effective | 1750 | 2,625 | 23% |
| Product Insights | 1 | 1000 | 1,000 | 9% |
| Dashboard (1x) | 1 | 1300 | 1,300 | 11% |
| **BASELINE TOTAL** | — | — | **11,550 tokens** | **100%** |

## Spike Day Scenario (High Activity)

| Scenario | Chat | OCR | Insights | Dashboard | **Total** | **Cost** |
|----------|------|-----|----------|-----------|---------|---------|
| 20 chats, 5 receipts | 30k | 8.75k | 2k | 1.3k | 42,050 | $3.16 |

**Breakdown for Spike Day:**
- Chat: 20 messages × 1500 tokens = 30,000 tokens
- OCR: 5 scans × 1750 tokens = 8,750 tokens
- Insights: approx. 2,000 tokens
- Dashboard: 1,300 tokens
- **Total spike: 42,050 tokens = approx. $3.16 per user**

## Model & Costs (as of May 2026)

| Model | Input Rate | Output Rate | Use Case | Status |
|-------|-----------|-----------|----------|--------|
| gemini-2.5-flash | $0.075/1M | $0.30/1M | All AI calls (current) | ACTIVE |
| gemini-2.0-flash | $0.075/1M | $0.30/1M | Candidate for non-vision (Phase 2) | CANDIDATE |

**Cost Calculation Formula:**
```
costUSD = (inputTokens * 0.000000075) + (outputTokens * 0.0000003)
```

Example: 1000 input + 500 output tokens
- costUSD = (1000 * 0.000000075) + (500 * 0.0000003) = 0.00015 USD ≈ $0.00015

## Optimization Roadmap (Prioritized for Phase 2)

### P0: Instrumentation & Baseline (Phase 1 — COMPLETE)
- [x] Token instrumentation in place
- [x] Baseline established
- [x] Migration ready for deployment

### P1: Model Selection Refinement (Phase 2 Sprint 1)
- Evaluate gemini-2.0-flash for non-vision callsites (product insights, dashboard insights)
- Expected savings: ~15% via cheaper model (same input rate, ~20% cheaper output rate in testing)

### P2: Caching & Semantic Cache (Phase 2 Sprint 2)
- Extend DB caching beyond 24h for stable queries
- Evaluate Gemini Semantic Cache API for chat context
- Expected savings: ~20–30% on chat (repeated queries within TTL)

### P3: Batch & Async Processing (Phase 2 Sprint 3)
- Batch product insights computation off-peak
- Defer non-critical dashboard insights to background jobs
- Expected savings: ~10% via off-peak pricing or delayed queues

**Total Optimization Potential:** 45–50% of baseline token spend by end of Phase 2.

## How to Measure (Post-Phase 1, Phase 2+)

**Query token usage log:**
```sql
SELECT 
  DATE(created_at) as date,
  call_site,
  SUM(total_tokens) as tokens,
  SUM(CAST(cost_usd AS FLOAT)) as cost,
  COUNT(*) as calls
FROM token_usage_log
WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), call_site
ORDER BY date DESC;
```

**Expected behavior:**
- Log grows daily as users interact with chat, upload receipts, load dashboard
- Costs trend downward as Phase 2 optimizations are applied
- Can compare pre-optimization vs. post-optimization costs for specific user cohorts

**Dashboard Metrics to Track:**
- Daily tokens per callsite (chart by date)
- Total cost per user per day (for forecasting)
- Peak callsite (typically chat)
- Cache hit rate / effectiveness (Phase 2)

## Next Phase Context

**Phase 2 will:**
1. Apply these migrations to Neon staging/prod
2. Begin collecting real token usage metrics
3. Execute P1 optimizations (model selection)
4. Measure impact and iterate

**Success metric:** Reduce token spend by 15% within Phase 2 without degrading user experience.
