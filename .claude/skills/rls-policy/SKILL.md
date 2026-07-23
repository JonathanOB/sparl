---
name: rls-policy
description: Checklist and template for a Supabase Row-Level Security policy tied to household membership, using the Clerk-JWT integration. Every user-facing table gets one. Use whenever adding a user-facing table or reviewing data-access security.
---

# RLS Policy

Every user-facing table in Sparl is protected by Row-Level Security scoped to household membership. No exceptions. Source: [project/22.McpSkills.md](../../../../project/22.McpSkills.md) §7.7 (D3 §16, D12 §28).

## The rule
A user (via their Clerk-authenticated JWT) may only read/write rows belonging to a household they are a member of. RLS is the enforcement layer — not application code alone.

## Clerk ↔ Supabase integration
- Auth is **Clerk** across web + mobile. The Clerk-issued JWT is the identity Supabase RLS reads.
- Policies key off the household id derived from the JWT claim (the locked-in Clerk-JWT approach — see the architecture decision in `23.MasterPromptWeb.md`).
- Confirm the JWT claim name/shape against the current Clerk↔Supabase config before writing the predicate; use Context7/Clerk docs rather than guessing.

## Checklist (per user-facing table)
- [ ] `alter table ... enable row level security;`
- [ ] `select` policy — member of the row's household.
- [ ] `insert` policy — `with check` binds the new row to a household the user belongs to.
- [ ] `update` policy — both `using` (existing row) and `with check` (new values).
- [ ] `delete` policy — soft delete preferred; if a policy exists, scope it to household.
- [ ] Membership check goes through the canonical household-membership relation (a helper function or subquery), not duplicated logic.
- [ ] Verified with a test: a user in household A cannot see/modify household B's rows.

## Template (shape — adapt to canonical claim + membership table)
```sql
alter table public.<table> enable row level security;

create policy "<table>_select_household_member"
  on public.<table> for select
  using ( household_id = any (current_household_ids()) );

create policy "<table>_insert_household_member"
  on public.<table> for insert
  with check ( household_id = any (current_household_ids()) );

create policy "<table>_update_household_member"
  on public.<table> for update
  using ( household_id = any (current_household_ids()) )
  with check ( household_id = any (current_household_ids()) );
```
`current_household_ids()` resolves the caller's households from the Clerk JWT claim.

## Ties in with
`db-migration` (every migration adding a user-facing table must add these policies) and the `security-reviewer` subagent (verifies RLS before merge).
