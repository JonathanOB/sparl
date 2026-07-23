-- Sparl canonical schema v1 (migration 001)
-- Source of truth: D3 (3.DatabaseSpecification.md) + master prompt §2.1.
-- Conventions: UUID PK, created_at/updated_at, soft-delete deleted_at on every
-- user-facing table (audit_logs is append-only and intentionally immutable).
-- RLS policies are applied in the companion migration 002.
--
-- Reconciliation notes:
--   * automation_jobs is NOT created here — §2.8 (DECIDED) makes pg-boss the durable
--     job store; it owns its own queue tables (created at worker init). "create an
--     automation_jobs row" in later phases means "enqueue a pg-boss job".
--   * user_services (not services), affiliate_programs/affiliate_clicks, country_id→countries,
--     provider_categories+category_id, postal_code (generic), per §2.1.

begin;

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists pgcrypto; -- gen_random_uuid()

-- ── Shared updated_at trigger ────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Enum types ───────────────────────────────────────────────────────────────
create type public.property_type as enum ('house', 'apartment', 'townhouse', 'other');
create type public.ownership_status as enum ('owner', 'renter', 'landlord', 'other');
create type public.household_role as enum ('owner', 'admin', 'member', 'viewer');
create type public.billing_period as enum ('monthly', 'annual');
create type public.offer_source as enum ('api', 'affiliate_feed', 'crawler', 'manual');
create type public.user_service_status as enum ('active', 'expired', 'cancelled', 'unknown');
create type public.renewal_status as enum ('pending', 'analysing', 'recommendation_ready', 'completed', 'ignored');
create type public.document_type as enum ('bill', 'contract', 'insurance_policy', 'renewal_letter', 'invoice', 'other');
create type public.document_processing_status as enum ('uploaded', 'processing', 'completed', 'failed');
create type public.ai_job_type as enum ('document_analysis', 'recommendation_generation', 'provider_analysis', 'assistant_request');
create type public.ai_job_status as enum ('queued', 'running', 'completed', 'failed');
create type public.recommendation_status as enum ('new', 'viewed', 'accepted', 'rejected', 'completed');
create type public.provider_crawl_status as enum ('queued', 'running', 'completed', 'failed');
create type public.subscription_plan as enum ('free', 'premium', 'family');
create type public.subscription_status as enum ('active', 'trialing', 'past_due', 'canceled', 'unpaid');
create type public.recommendation_feedback_reason as enum ('too_hard', 'not_interested', 'wrong_time', 'incorrect');
create type public.notification_type as enum ('saving_found', 'renewal', 'system', 'billing');
create type public.conversion_status as enum ('clicked', 'converted', 'rejected');
create type public.message_role as enum ('user', 'assistant');

-- ── Geography (reference) ────────────────────────────────────────────────────
create table public.countries (
  id            uuid primary key default gen_random_uuid(),
  code          varchar(2) not null unique,       -- ISO 3166-1 alpha-2
  name          varchar not null,
  currency_code varchar(3) not null,              -- ISO 4217
  timezone      varchar not null,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create table public.provider_categories (
  id          uuid primary key default gen_random_uuid(),
  name        varchar not null,
  slug        varchar not null unique,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- ── Identity ─────────────────────────────────────────────────────────────────
create table public.users (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id varchar not null unique,          -- Clerk is the identity source
  email         varchar not null unique,
  first_name    varchar,
  last_name     varchar,
  country_id    uuid references public.countries (id),
  timezone      varchar,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create table public.profiles (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null unique references public.users (id) on delete cascade,
  communication_preferences jsonb not null default '{}'::jsonb,
  notification_settings     jsonb not null default '{}'::jsonb,
  currency                  varchar(3),
  language                  varchar,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  deleted_at                timestamptz
);

-- ── Households ───────────────────────────────────────────────────────────────
create table public.households (
  id               uuid primary key default gen_random_uuid(),
  country_id       uuid references public.countries (id),
  name             varchar not null,
  address_line_1   varchar,
  city             varchar,
  county           varchar,
  postal_code      varchar,                        -- generic international identifier (§2.1)
  property_type    public.property_type,
  ownership_status public.ownership_status,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create table public.household_members (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id      uuid not null references public.users (id) on delete cascade,
  role         public.household_role not null default 'member',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  unique (household_id, user_id)
);

create table public.household_preferences (
  id                        uuid primary key default gen_random_uuid(),
  household_id              uuid not null references public.households (id) on delete cascade,
  notification_preferences  jsonb not null default '{}'::jsonb,
  communication_preferences jsonb not null default '{}'::jsonb,
  switching_preferences     jsonb not null default '{}'::jsonb,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  deleted_at                timestamptz
);

-- ── Provider intelligence (public read-only) ─────────────────────────────────
create table public.providers (
  id                  uuid primary key default gen_random_uuid(),
  country_id          uuid references public.countries (id),
  category_id         uuid references public.provider_categories (id),
  name                varchar not null,
  website             varchar,
  logo_url            varchar,
  active              boolean not null default true,
  affiliate_available boolean not null default false,
  api_available       boolean not null default false,
  crawler_available   boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create table public.provider_products (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references public.providers (id) on delete cascade,
  name         varchar not null,
  description  text,
  product_type varchar,
  active       boolean not null default true,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create table public.provider_offers (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.provider_products (id) on delete cascade,
  price           numeric(12, 2),
  billing_period  public.billing_period,
  contract_length integer,
  discount_amount numeric(12, 2),
  valid_from      date,
  valid_until     date,
  source          public.offer_source,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create table public.provider_price_history (
  id         uuid primary key default gen_random_uuid(),
  offer_id   uuid not null references public.provider_offers (id) on delete cascade,
  old_price  numeric(12, 2),
  new_price  numeric(12, 2),
  changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ── User services & contracts ────────────────────────────────────────────────
create table public.user_services (
  id                 uuid primary key default gen_random_uuid(),
  household_id       uuid not null references public.households (id) on delete cascade,
  provider_id        uuid references public.providers (id),
  category_id        uuid references public.provider_categories (id),
  current_product_id uuid references public.provider_products (id) on delete set null,
  monthly_cost       numeric(12, 2),
  annual_cost        numeric(12, 2),
  status             public.user_service_status not null default 'unknown',
  renewal_date       date,                          -- cached for query speed; renewals is system of record
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);

create table public.service_details (
  id              uuid primary key default gen_random_uuid(),
  user_service_id uuid not null references public.user_services (id) on delete cascade,
  data            jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create table public.documents (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references public.households (id) on delete cascade,
  uploaded_by       uuid references public.users (id),
  storage_path      varchar not null,
  document_type     public.document_type,
  processing_status public.document_processing_status not null default 'uploaded',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create table public.contracts (
  id                  uuid primary key default gen_random_uuid(),
  user_service_id     uuid not null references public.user_services (id) on delete cascade,
  start_date          date,
  renewal_date        date,
  cancellation_period integer,
  contract_terms      jsonb not null default '{}'::jsonb,
  source_document_id  uuid references public.documents (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create table public.renewals (
  id                 uuid primary key default gen_random_uuid(),
  contract_id        uuid not null references public.contracts (id) on delete cascade,
  renewal_date       date,
  status             public.renewal_status not null default 'pending',
  analysis_completed boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);

create table public.document_extractions (
  id               uuid primary key default gen_random_uuid(),
  document_id      uuid not null references public.documents (id) on delete cascade,
  extracted_data   jsonb not null default '{}'::jsonb,
  confidence_score numeric(5, 4),
  ai_model         varchar,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

-- ── AI intelligence ──────────────────────────────────────────────────────────
create table public.ai_jobs (
  id          uuid primary key default gen_random_uuid(),
  job_type    public.ai_job_type not null,
  status      public.ai_job_status not null default 'queued',
  input_data  jsonb,
  output_data jsonb,
  model       varchar,
  tokens_used integer,
  confidence  numeric(5, 4),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table public.recommendations (
  id                      uuid primary key default gen_random_uuid(),
  household_id            uuid not null references public.households (id) on delete cascade,
  category_id             uuid references public.provider_categories (id),
  current_service_id      uuid references public.user_services (id) on delete set null,
  recommended_provider_id uuid references public.providers (id) on delete set null,
  estimated_saving        numeric(12, 2),
  confidence_score        numeric(5, 4),
  summary                 text,
  status                  public.recommendation_status not null default 'new',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  deleted_at              timestamptz
);

create table public.recommendation_explanations (
  id                uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.recommendations (id) on delete cascade,
  summary           text,
  reasoning         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create table public.recommendation_feedback (
  id                uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.recommendations (id) on delete cascade,
  user_id           uuid references public.users (id),
  feedback          text,
  reason            public.recommendation_feedback_reason,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

-- ── Automation (provider crawling; job queue is pg-boss, see §2.8) ────────────
create table public.provider_crawls (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references public.providers (id) on delete cascade,
  status       public.provider_crawl_status not null default 'queued',
  started_at   timestamptz,
  completed_at timestamptz,
  result       jsonb,
  error        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

-- ── Commercial ───────────────────────────────────────────────────────────────
create table public.plans (
  id         uuid primary key default gen_random_uuid(),
  name       public.subscription_plan not null unique,
  price      numeric(12, 2),                        -- provisional pricing (§2.5); source of truth is Stripe
  features   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references public.users (id) on delete cascade,
  stripe_customer_id     varchar,
  stripe_subscription_id varchar,
  plan                   public.subscription_plan not null default 'free',
  status                 public.subscription_status not null default 'active',
  renewal_date           date,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  deleted_at             timestamptz
);

create table public.affiliate_programs (
  id              uuid primary key default gen_random_uuid(),
  provider_id     uuid not null references public.providers (id) on delete cascade,
  network         varchar,
  tracking_url    varchar,
  commission_type varchar,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create table public.affiliate_clicks (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.users (id),
  provider_id       uuid references public.providers (id),
  recommendation_id uuid references public.recommendations (id) on delete set null,
  clicked_at        timestamptz not null default now(),
  conversion_status public.conversion_status not null default 'clicked',
  converted_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

-- ── System ───────────────────────────────────────────────────────────────────
-- Append-only, immutable audit trail (D10 §21) — intentionally no updated_at/deleted_at.
create table public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users (id),
  action     varchar not null,
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  type       public.notification_type not null,
  title      varchar,
  message    text,
  read       boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.consent_records (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users (id) on delete cascade,
  consent_type varchar not null,
  version      varchar,
  granted_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create table public.ai_prompts (
  id            uuid primary key default gen_random_uuid(),
  agent_type    varchar not null,
  version       varchar not null,
  prompt_text   text not null,
  input_schema  jsonb,
  output_schema jsonb,
  active        boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  unique (agent_type, version)
);

create table public.conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role            public.message_role not null,
  content         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

-- ── Indexes (§15 + foreign keys + hot paths) ─────────────────────────────────
create index idx_users_country_id on public.users (country_id);
create index idx_profiles_user_id on public.profiles (user_id);
create index idx_households_country_id on public.households (country_id);
create index idx_household_members_household_id on public.household_members (household_id);
create index idx_household_members_user_id on public.household_members (user_id);
create index idx_household_preferences_household_id on public.household_preferences (household_id);
create index idx_providers_country_id on public.providers (country_id);
create index idx_providers_category_id on public.providers (category_id);
create index idx_provider_products_provider_id on public.provider_products (provider_id);
create index idx_provider_offers_product_id on public.provider_offers (product_id);
create index idx_provider_offers_valid_until on public.provider_offers (valid_until);
create index idx_provider_price_history_offer_id on public.provider_price_history (offer_id);
create index idx_user_services_household_id on public.user_services (household_id);
create index idx_user_services_provider_id on public.user_services (provider_id);
create index idx_service_details_user_service_id on public.service_details (user_service_id);
create index idx_documents_household_id on public.documents (household_id);
create index idx_contracts_user_service_id on public.contracts (user_service_id);
create index idx_contracts_renewal_date on public.contracts (renewal_date);
create index idx_renewals_contract_id on public.renewals (contract_id);
create index idx_renewals_renewal_date on public.renewals (renewal_date);
create index idx_document_extractions_document_id on public.document_extractions (document_id);
create index idx_recommendations_household_id on public.recommendations (household_id);
create index idx_recommendation_explanations_recommendation_id on public.recommendation_explanations (recommendation_id);
create index idx_recommendation_feedback_recommendation_id on public.recommendation_feedback (recommendation_id);
create index idx_provider_crawls_provider_id on public.provider_crawls (provider_id);
create index idx_subscriptions_user_id on public.subscriptions (user_id);
create index idx_affiliate_programs_provider_id on public.affiliate_programs (provider_id);
create index idx_affiliate_clicks_user_id on public.affiliate_clicks (user_id);
create index idx_affiliate_clicks_recommendation_id on public.affiliate_clicks (recommendation_id);
create index idx_audit_logs_user_id on public.audit_logs (user_id);
create index idx_notifications_user_id on public.notifications (user_id);
create index idx_consent_records_user_id on public.consent_records (user_id);
create index idx_conversations_user_id on public.conversations (user_id);
create index idx_messages_conversation_id on public.messages (conversation_id);

-- ── updated_at triggers (every table that has updated_at) ─────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'countries','provider_categories','users','profiles','households','household_members',
    'household_preferences','providers','provider_products','provider_offers','provider_price_history',
    'user_services','service_details','documents','contracts','renewals','document_extractions',
    'ai_jobs','recommendations','recommendation_explanations','recommendation_feedback','provider_crawls',
    'plans','subscriptions','affiliate_programs','affiliate_clicks','notifications','consent_records',
    'ai_prompts','conversations','messages'
  ]
  loop
    execute format(
      'create trigger trg_%1$s_updated before update on public.%1$s
         for each row execute function public.set_updated_at();', t);
  end loop;
end;
$$;

commit;
