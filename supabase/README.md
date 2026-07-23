# Supabase — schema & migrations

Canonical schema per D3 + master prompt §2.1/§2.2. Applied to the **staging** project (EU / eu-west-1).

## Layout
- `migrations/` — ordered SQL migrations (`<timestamp>_<name>.sql`), each wrapped in a transaction.
  - `20260723000001_canonical_schema.sql` — 32 tables, 19 enums, indexes, `updated_at` triggers.
  - `20260723000002_rls_policies.sql` — `current_user_id()` / `current_household_ids()` helpers + RLS (enabled **and forced**) on every table.

## Workflow (Docker-free)
The Supabase CLI's `gen types` / `db push` shell out to a container runtime (podman/Docker) which isn't installed here, so we use direct-connection scripts over the **session pooler** (`aws-0-eu-west-1.pooler.supabase.com:5432`):

```bash
npm run db:migrate   # apply pending migrations (idempotent; tracks in supabase_migrations.schema_migrations)
npm run db:types     # regenerate src/shared/types/database.types.ts from the live schema
```

Both read credentials from `web/.env.local` (`SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`). Override the pooler host with `SUPABASE_DB_POOLER_HOST` if the region differs. Scripts live in `web/scripts/`.

Once Docker is available, `supabase db push` / `supabase gen types typescript` are drop-in replacements — the migration tracking table is CLI-compatible.

## Conventions
- Every user-facing table: UUID PK, `created_at`/`updated_at` (trigger-maintained), soft-delete `deleted_at`. `audit_logs` is append-only (immutable, no `updated_at`/`deleted_at`).
- **Job queue is pg-boss** (§2.8), not a hand-rolled `automation_jobs` table — pg-boss owns its queue tables at worker init.
- RLS is the primary enforcement layer. User requests use the publishable key + Clerk user token so policies apply; `SUPABASE_SECRET_KEY` is server-only, bypasses RLS, and must do its own ownership check.

## Verified
- 32 tables created; RLS enabled+forced on all; 27 policies.
- Cross-tenant test (D15 §8): a user in household A cannot read household B's documents/households. ✅
