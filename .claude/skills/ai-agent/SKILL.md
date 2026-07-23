---
name: ai-agent
description: Standard Sparl AI-agent pipeline — context builder → Claude call → schema validation → confidence scoring → business-rule check → persist. Enforces structured-JSON-only output and the anti-hallucination validation layer. Use when building any AI/LLM feature (recommendations, extraction, classification).
---

# AI Agent

Every AI feature in Sparl runs through the same guarded pipeline. Never call the model and trust the raw output. Source: [project/22.McpSkills.md](../../../../project/22.McpSkills.md) §7.5 (D5 §5, §2.2, D10 §15, D19 §13).

## Pipeline (in order)
1. **Context builder** — assemble a deterministic, minimal context from validated inputs (user/household data, provider data with source+timestamp+confidence). No PII beyond what the task needs.
2. **Claude call** — request **structured JSON only**. Use the latest capable model (`claude-opus-4-8` for hard reasoning; a cheaper Claude tier for routine extraction). Pin the model id; use the `claude-api` skill for params/pricing.
3. **Schema validation** — Zod-parse the model output. If it doesn't parse, it does not proceed. This is the anti-hallucination gate.
4. **Confidence scoring** — attach/compute a confidence value; low-confidence results are flagged, not silently used.
5. **Business-rule check** — validate against domain rules (eligibility, savings sanity bounds, provider constraints). Reject/quarantine violations.
6. **Persist** — store the result with its provenance (model, prompt version, confidence, timestamp).

## Hard rules
- **Structured-JSON-only output** — never parse free-form prose into decisions.
- The model's output is untrusted input: Zod + business rules stand between it and the database/user.
- Every recommendation is traceable to its inputs, prompt version, and confidence.
- Prompts are versioned production assets — see `ai-prompt-eval` before changing one.

## Skeleton
```ts
const ctx = buildContext(validatedInputs);
const raw = await claude.json({ model: "claude-opus-4-8", schema: OutputSchema, context: ctx });
const parsed = OutputSchema.parse(raw);              // anti-hallucination gate
const scored = scoreConfidence(parsed, ctx);
assertBusinessRules(scored);                          // domain guardrails
await persist(scored, { promptVersion, model, at: now() });
```
