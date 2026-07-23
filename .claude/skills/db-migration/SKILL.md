---
name: db-migration
description: How to add or change a Supabase table/column in Sparl — write a migration, add/update the RLS policy, regenerate shared types, add indexes. Enforces the canonical schema, soft-delete, and UUID conventions. Use for any database schema change.
---

# DB Migration

Follow this exact sequence for every schema change. Source: [project/22.McpSkills.md](../../../../project/22.McpSkills.md) §7.2 (D3 §15, D12 §29, §3).

## The canonical schema rule
There is **one** canonical schema (see `23.MasterPromptWeb.md` → Canonical Decisions). Never introduce a competing/duplicate table shape. If two specs conflict, resolve to the canonical one before writing the migration.

## Steps (in order)
1. **Write a Supabase migration.** Use the Supabase MCP (staging project / branch, never production write). Treat the generated migration as a **PR requiring human review** before it touches staging.
2. **Add or update the RLS policy** for every user-facing table — invoke the `rls-policy` skill. A migration that adds a user-facing table without an RLS policy is incomplete and must be blocked.
3. **Regenerate shared TypeScript types** from the schema (Supabase type generation) so web + mobile + API consume one source of truth. Commit the regenerated types with the migration.
4. **Add indexes** for foreign keys and every column used in a `WHERE`/`ORDER BY` on a hot path (D3 §15 / D12 §29).

## Column & table conventions
- **UUID primary keys** (`gen_random_uuid()`), not serial ints.
- **Soft delete**: include `deleted_at timestamptz` (nullable). Queries filter `deleted_at is null`; never hard-delete user financial data.
- Timestamps: `created_at` / `updated_at timestamptz not null default now()`; keep `updated_at` current via trigger.
- Money as integer minor units (cents) or `numeric`, never float.
- Foreign keys to household/user for anything user-scoped — this is what RLS keys off.

## Guardrails
- Supabase MCP connects to **dev/staging only**, least-privilege/read-only token where possible. The agent never holds the production `service_role` key.
- Every data-point-bearing table that stores provider info should carry source + timestamp + confidence (see `provider-adapter`).
