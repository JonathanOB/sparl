---
name: api-endpoint
description: Scaffold a versioned Sparl API endpoint (/api/v1/...) with the standard pipeline — auth middleware → user-context → Zod validation → service call → typed response → structured log. Enforces the success/error envelope and no-PII-in-logs. Use when adding or changing an API route.
---

# API Endpoint

Every Sparl endpoint follows one shape. Source: [project/22.McpSkills.md](../../../../project/22.McpSkills.md) §7.3 (D4 §6, D13 §20).

## Pipeline (in order)
1. **Versioned path** — `/api/v1/...`. Never add unversioned routes.
2. **Auth middleware** — Clerk verifies the session/JWT. Reject unauthenticated early.
3. **User-context** — resolve the authenticated user + household; pass it explicitly to the service. RLS keys off this too.
4. **Zod validation** — parse body/query/params with a Zod schema before any logic. Reject invalid input with the standard error envelope.
5. **Service call** — delegate ALL business logic to the service layer. The route orchestrates; it does not contain rules.
6. **Typed response** — return the standard envelope with a typed payload.
7. **Structured log** — log the outcome with request id + user-context id. **Never log PII** (no emails, bill contents, provider data).

## Standard response envelope (D4 §6)
Success:
```json
{ "ok": true, "data": { /* typed payload */ } }
```
Error:
```json
{ "ok": false, "error": { "code": "MACHINE_CODE", "message": "human message" } }
```
Use stable machine-readable `code`s; never leak stack traces or internal detail to clients.

## Skeleton
```ts
// route: /api/v1/<feature>/<action>
const InputSchema = z.object({ /* ... */ });

export async function POST(req: Request) {
  const { userId, householdId } = await requireAuth(req); // Clerk
  const parsed = InputSchema.safeParse(await req.json());
  if (!parsed.success) return errorEnvelope("VALIDATION_FAILED", parsed.error);

  const result = await featureService.doThing({ userId, householdId, ...parsed.data });

  log.info("v1.feature.action", { reqId, userId, householdId }); // no PII
  return successEnvelope(result);
}
```

## Rules
- No business logic, no direct DB access in the route — service layer only (`sparl-conventions`).
- Verify webhook signatures in code for webhook endpoints; Zod-validate the payload after verification.
