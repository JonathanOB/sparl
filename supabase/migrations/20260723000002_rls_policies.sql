-- Sparl RLS baseline (migration 002) — D3 §16, master prompt §2.2.
-- Auth is Clerk via Supabase native Third-Party Auth; policies read the Clerk
-- user id from auth.jwt() ->> 'sub'. RLS is enabled AND forced on every table.
--   * User data: scoped to the user (self) or household membership.
--   * Provider intelligence + plans: public read-only.
--   * Internal tables (ai_jobs, ai_prompts, provider_crawls, affiliate_programs,
--     audit_logs): no policy → only service_role (BYPASSRLS) may touch them.
-- The API also performs its own ownership check when using service_role (belt-and-braces).

begin;

-- ── Security-definer helpers ─────────────────────────────────────────────────
create or replace function public.current_user_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id
  from public.users
  where clerk_user_id = auth.jwt() ->> 'sub'
    and deleted_at is null;
$$;

create or replace function public.current_household_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select hm.household_id
  from public.household_members hm
  join public.users u on u.id = hm.user_id
  where u.clerk_user_id = auth.jwt() ->> 'sub'
    and hm.deleted_at is null;
$$;

-- ── Enable + force RLS on every table ────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'countries','provider_categories','users','profiles','households','household_members',
    'household_preferences','providers','provider_products','provider_offers','provider_price_history',
    'user_services','service_details','documents','contracts','renewals','document_extractions',
    'ai_jobs','recommendations','recommendation_explanations','recommendation_feedback','provider_crawls',
    'plans','subscriptions','affiliate_programs','affiliate_clicks','audit_logs','notifications',
    'consent_records','ai_prompts','conversations','messages'
  ]
  loop
    execute format('alter table public.%1$s enable row level security;', t);
    execute format('alter table public.%1$s force  row level security;', t);
  end loop;
end;
$$;

-- ── Public read-only reference / provider intelligence ───────────────────────
create policy countries_read on public.countries for select using (true);
create policy provider_categories_read on public.provider_categories for select using (true);
create policy providers_read on public.providers for select using (true);
create policy provider_products_read on public.provider_products for select using (true);
create policy provider_offers_read on public.provider_offers for select using (true);
create policy provider_price_history_read on public.provider_price_history for select using (true);
create policy plans_read on public.plans for select using (true);

-- ── User-scoped (self) ───────────────────────────────────────────────────────
create policy users_self on public.users for all
  using (clerk_user_id = auth.jwt() ->> 'sub')
  with check (clerk_user_id = auth.jwt() ->> 'sub');

create policy profiles_self on public.profiles for all
  using (user_id = public.current_user_id())
  with check (user_id = public.current_user_id());

create policy subscriptions_self on public.subscriptions for all
  using (user_id = public.current_user_id())
  with check (user_id = public.current_user_id());

create policy affiliate_clicks_self on public.affiliate_clicks for all
  using (user_id = public.current_user_id())
  with check (user_id = public.current_user_id());

create policy notifications_self on public.notifications for all
  using (user_id = public.current_user_id())
  with check (user_id = public.current_user_id());

create policy consent_records_self on public.consent_records for all
  using (user_id = public.current_user_id())
  with check (user_id = public.current_user_id());

create policy conversations_self on public.conversations for all
  using (user_id = public.current_user_id())
  with check (user_id = public.current_user_id());

create policy messages_self on public.messages for all
  using (exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and c.user_id = public.current_user_id()))
  with check (exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and c.user_id = public.current_user_id()));

-- ── Household-scoped (direct household_id column) ────────────────────────────
create policy households_member on public.households for all
  using (id in (select public.current_household_ids()))
  with check (id in (select public.current_household_ids()));

create policy household_members_member on public.household_members for all
  using (household_id in (select public.current_household_ids()))
  with check (household_id in (select public.current_household_ids()));

create policy household_preferences_member on public.household_preferences for all
  using (household_id in (select public.current_household_ids()))
  with check (household_id in (select public.current_household_ids()));

create policy user_services_member on public.user_services for all
  using (household_id in (select public.current_household_ids()))
  with check (household_id in (select public.current_household_ids()));

create policy documents_member on public.documents for all
  using (household_id in (select public.current_household_ids()))
  with check (household_id in (select public.current_household_ids()));

create policy recommendations_member on public.recommendations for all
  using (household_id in (select public.current_household_ids()))
  with check (household_id in (select public.current_household_ids()));

-- ── Household-scoped (via join) ──────────────────────────────────────────────
create policy service_details_member on public.service_details for all
  using (exists (
    select 1 from public.user_services us
    where us.id = service_details.user_service_id
      and us.household_id in (select public.current_household_ids())))
  with check (exists (
    select 1 from public.user_services us
    where us.id = service_details.user_service_id
      and us.household_id in (select public.current_household_ids())));

create policy contracts_member on public.contracts for all
  using (exists (
    select 1 from public.user_services us
    where us.id = contracts.user_service_id
      and us.household_id in (select public.current_household_ids())))
  with check (exists (
    select 1 from public.user_services us
    where us.id = contracts.user_service_id
      and us.household_id in (select public.current_household_ids())));

create policy renewals_member on public.renewals for all
  using (exists (
    select 1 from public.contracts c
    join public.user_services us on us.id = c.user_service_id
    where c.id = renewals.contract_id
      and us.household_id in (select public.current_household_ids())))
  with check (exists (
    select 1 from public.contracts c
    join public.user_services us on us.id = c.user_service_id
    where c.id = renewals.contract_id
      and us.household_id in (select public.current_household_ids())));

create policy document_extractions_member on public.document_extractions for all
  using (exists (
    select 1 from public.documents d
    where d.id = document_extractions.document_id
      and d.household_id in (select public.current_household_ids())))
  with check (exists (
    select 1 from public.documents d
    where d.id = document_extractions.document_id
      and d.household_id in (select public.current_household_ids())));

create policy recommendation_explanations_member on public.recommendation_explanations for all
  using (exists (
    select 1 from public.recommendations r
    where r.id = recommendation_explanations.recommendation_id
      and r.household_id in (select public.current_household_ids())))
  with check (exists (
    select 1 from public.recommendations r
    where r.id = recommendation_explanations.recommendation_id
      and r.household_id in (select public.current_household_ids())));

create policy recommendation_feedback_member on public.recommendation_feedback for all
  using (exists (
    select 1 from public.recommendations r
    where r.id = recommendation_feedback.recommendation_id
      and r.household_id in (select public.current_household_ids())))
  with check (exists (
    select 1 from public.recommendations r
    where r.id = recommendation_feedback.recommendation_id
      and r.household_id in (select public.current_household_ids())));

-- Internal tables (ai_jobs, ai_prompts, provider_crawls, affiliate_programs,
-- audit_logs) intentionally have NO policy: RLS is forced, so only service_role
-- (BYPASSRLS) can read/write them. Never expose them via a user-token query.

commit;
