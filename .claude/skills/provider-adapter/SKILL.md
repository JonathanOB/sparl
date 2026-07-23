---
name: provider-adapter
description: Template for implementing the Sparl ProviderAdapter interface (getProducts / getPricing / getEligibility / validateData) with source + timestamp + confidence on every data point. One isolated folder per provider. Use when building or maintaining a provider integration/crawler.
---

# Provider Adapter

Every provider (energy, telecom, insurance, etc.) is integrated through one uniform, isolated adapter. Source: [project/22.McpSkills.md](../../../../project/22.McpSkills.md) §7.4 (D8 §11, D9 §9/§14, D21 §18, D2 §10).

## Interface
Implement the `ProviderAdapter` contract:
- `getProducts()` — available products/plans.
- `getPricing()` — current prices/tariffs.
- `getEligibility()` — eligibility rules/checks.
- `validateData()` — self-validation of returned data (shape + sanity).

## Every data point carries provenance
Each returned value must include:
- **source** — where it came from (official API, affiliate feed, crawl URL).
- **timestamp** — when it was fetched.
- **confidence** — a score reflecting reliability/freshness.

Downstream AI + recommendation logic depends on these; never return bare values.

## Isolation & structure
- **One folder per provider**, fully isolated (D2 §10) — no shared mutable state, no cross-provider imports.
- Validate provider responses with **Zod** before use (`sparl-conventions`).
- The `provider-agent` subagent builds/maintains these, sandboxed, with **no production credentials**.

## Sourcing priority & compliance (D9 §3, §13)
1. **Official APIs first.**
2. **Affiliate/partner feeds** next.
3. **Crawling only as last resort**, respecting provider ToS + robots. Playwright (accessibility-snapshot + extraction) is the reference pattern — but a dev tool does not grant permission to scrape.
- **Never store or use real user provider credentials.** The architecture forbids credential storage (D8 §18, D9 §13).

## Folder skeleton
```
providers/
  <provider-name>/
    adapter.ts        # implements ProviderAdapter
    schema.ts         # Zod schemas for responses
    mapping.ts        # raw → canonical product/pricing
    index.ts
```
