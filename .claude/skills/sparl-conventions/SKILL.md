---
name: sparl-conventions
description: Sparl's global engineering guardrails — strict TypeScript, no `any`, Zod on every boundary, service-layer business logic, no client-side DB access, feature-based folders. Apply on EVERY coding task in this repo.
---

# Sparl Conventions

These are the non-negotiable global guardrails for all Sparl code. Apply them on every task, in every file. They come from the master prompts (D6, D2, D13) and [project/22.McpSkills.md](../../../../project/22.McpSkills.md) §7.1.

## TypeScript
- **Strict mode always. No `any`** — use `unknown` + narrowing, generics, or a precise type. If you reach for `any`, stop and model the type.
- No non-null assertions (`!`) to silence the compiler; handle the null case.
- Prefer `type`/`interface` over inline structural repetition; share types from the generated Supabase types (see `db-migration` skill).

## Validation — Zod on every boundary
- Every external input crosses a Zod schema before use: API request bodies, query params, webhook payloads, provider responses, LLM outputs, env vars.
- Parse, don't assume. `schema.parse()` / `safeParse()` at the edge; downstream code receives already-typed data.
- Co-locate the schema with the boundary and export the inferred type (`z.infer<typeof X>`).

## Architecture
- **Business logic lives in the service layer, never in route handlers.** Routes do: auth → validate → call service → shape response. Nothing more.
- **No client-side database access.** The browser never talks to Supabase directly for privileged data; it goes through the API/service layer.
- **Feature-based folders** — group by domain feature (e.g. `billing/`, `providers/`, `recommendations/`), not by technical type. Each feature owns its services, schemas, and types.
- One isolated folder per provider adapter (see `provider-adapter`).

## Logging & data
- **Never log PII.** Structured logs only, with a request/user-context id — but no emails, names, addresses, bill contents, or provider credentials.
- Soft-delete + UUID primary keys are the default (see `db-migration`).

## Security posture (financial + GDPR data)
- Least privilege everywhere; secrets via env/secret manager, never in code or context.
- Verify webhook signatures in your own code — an MCP/tool does not do it for you.
- Dev/staging only for agent-driven changes; production is human-gated.

## Related skills
`db-migration`, `api-endpoint`, `provider-adapter`, `ai-agent`, `ai-prompt-eval`, `rls-policy`.
