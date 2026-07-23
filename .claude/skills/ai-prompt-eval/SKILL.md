---
name: ai-prompt-eval
description: Prompt-as-production-asset workflow for Sparl — versioned prompt, input/output schema, regression dataset run, accuracy comparison before/after. Use whenever creating or changing any LLM prompt used in production.
---

# AI Prompt Eval

Prompts are production assets, not throwaway strings. Every change is versioned and regression-tested before it ships. Source: [project/22.McpSkills.md](../../../../project/22.McpSkills.md) §7.6 (D19 §8–9, D15 §11–12).

## What a production prompt owns
- A **version** (bump on every change; the version is persisted with each result — see `ai-agent`).
- An **input schema** and an **output schema** (Zod) — the contract the prompt must satisfy.
- A **regression dataset** — representative inputs with expected/graded outputs.

## Change workflow (in order)
1. **Edit the prompt** in its versioned location; bump the version.
2. **Run the regression dataset** through both the old and new prompt.
3. **Compare accuracy** before/after on the dataset's metrics (exact-match, schema-valid rate, confidence calibration, business-rule pass rate).
4. **Only ship if it does not regress** — improvements on target cases must not degrade others. Record the comparison.

## Rules
- Never edit a live prompt without running the regression eval.
- Output must always be schema-valid JSON (ties into `ai-agent`'s anti-hallucination gate).
- Keep prompts, schemas, and datasets checked into the repo alongside the feature.
- Use the `claude-api` skill for model ids, params, and token/cost accounting when running evals.
