<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:sparl-mcp-skills -->
# MCP Servers & Skills (Sparl)

See [project/22.McpSkills.md](../project/22.McpSkills.md) for full rationale. Standing rules for building Sparl:

## Library docs — always Context7
**Always use Context7 for library/API docs, setup, and configuration before generating code.** Never rely on training-data memory for Next.js (App Router), Expo/Expo Router, Clerk, Supabase JS, Stripe, TanStack Query, Zod, or Tailwind — hallucinated/stale APIs break strict TS and the "no `any`" rule.

## Which MCP servers to use
- **Core (use for every relevant task):** Supabase (schema, migrations, RLS, types, logs), Context7 (docs), GitHub (PRs, CI, issues).
- **High-value (per phase):** Clerk (auth patterns/Organizations), Stripe (billing — **test-mode keys only**), Playwright (E2E + crawler reference), Sentry (error triage).
- **Medium-value:** Vercel (deploys/logs), Figma Dev Mode (design tokens → code), Resend (email/DNS).
- Prefer **CLI + Skills** over MCP for routine "run a known command / fetch docs" work (Context7, Playwright, Figma, Clerk) — it is more token-efficient.

## Never connect
- No production-write database MCP — production Supabase is **human-gated**, agents get dev/staging only.
- No live email/SMS send during dev beyond test domains.
- No generic "run anything" shell MCPs on machines with production secrets.
- No provider-account MCPs that store or use real user provider credentials.

## Supabase API keys (current model — do NOT use legacy anon/service_role)
Sparl uses Supabase's **publishable + secret** key model, which replaces the legacy `anon`/`service_role` keys:
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_…`) — browser-safe, **respects RLS**. Use with the Clerk user token for user-scoped requests.
- `SUPABASE_SECRET_KEY` (`sb_secret_…`) — **server-only, bypasses RLS**. Trusted contexts (workers, admin) must still do their own ownership check (§2.2 belt-and-braces). Never reaches a client.
- Do not reintroduce `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY`. Env template: [.env.example](.env.example).

## Auth & data access (established patterns — reuse, don't reinvent)
- **Route protection is resource-based, NOT middleware route-gating.** `proxy.ts` is just `clerkMiddleware()` — never reintroduce `createRouteMatcher`/`auth.protect()` (deprecated in Clerk 7).
- **Every authenticated API route** uses `authed()` from `src/lib/api/authed.ts`: `authed(({ ctx, req, params }) => …)`. It resolves `getUserContext()`, returns the standard **401 envelope** if absent, and runs inside `handle()` so thrown `AppError`s serialise correctly.
- **User context**: `getUserContext()` (`src/lib/auth/user-context.ts`) → `{ userId, clerkUserId, memberships, activeHouseholdId, activeRole, subscriptionPlan, permissions }`. Bootstrap primitive; uses the admin client self-scoped by Clerk id and self-heals (lazy-provisions the `users` row).
- **Data access**: user requests → `createUserClient()` (RLS-enforced via Clerk token). Trusted/server paths (webhooks, workers, `getUserContext`) → `createAdminClient()` (bypasses RLS; always filter by ctx-derived ownership). Both in `src/lib/supabase/server.ts`.
- **Clerk↔users sync** lives once in `src/lib/auth/users.ts` (`upsertUser`/`softDeleteUser`) — used by both the webhook and lazy provisioning. Don't duplicate it.

## Sparl conventions (apply on every task)
- Strict TypeScript, **no `any`**; Zod validation on every boundary.
- Business logic in the **service layer, not routes**; no client-side DB access.
- Feature-based folders; one isolated folder per provider adapter.
- DB changes: write a Supabase migration → add/update the **RLS policy** → regenerate shared types → add indexes. Every user-facing table needs an RLS policy tied to household membership (Clerk-JWT integration). Use soft-delete + UUID conventions.
- API: versioned `/api/v1/...` — auth middleware → user-context → Zod validation → service call → typed response → structured log. Standard success/error envelope. **Never log PII.**
- Provider adapters implement `getProducts / getPricing / getEligibility / validateData` with source + timestamp + confidence on every data point.
- AI agents: context builder → Claude call → **schema validation** → confidence scoring → business-rule check → persist. Structured-JSON-only output; keep the anti-hallucination validation layer. Treat prompts as versioned production assets with regression datasets.

## Security guardrails (GDPR-regulated financial data)
1. Agents connect to **dev/staging only**; production is human-gated.
2. Least privilege — scoped, read-only tokens by default.
3. Human-in-the-loop — migrations, billing changes, and prod deploys require review before apply.
4. No secrets in context or repo — all keys via env/secret manager.
5. No real user data through third-party MCPs — test fixtures only.
6. MCP-driven changes land as reviewable PRs (auditability).
<!-- END:sparl-mcp-skills -->
