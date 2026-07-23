-- Reference/lookup seed (migration 005). Idempotent.
-- Countries + canonical provider categories (D3 §4/§7). Market-neutral reference
-- data the app needs to function; provider records themselves are ingested in Phase 6.

begin;

insert into public.countries (code, name, currency_code, timezone, active)
values ('IE', 'Ireland', 'EUR', 'Europe/Dublin', true)
on conflict (code) do nothing;

insert into public.provider_categories (name, slug, description) values
  ('Energy', 'energy', 'Electricity and gas'),
  ('Broadband', 'broadband', 'Home internet'),
  ('Mobile', 'mobile', 'Mobile phone plans'),
  ('Insurance', 'insurance', 'Home, car, health and more'),
  ('Subscriptions', 'subscriptions', 'Streaming and other subscriptions')
on conflict (slug) do nothing;

commit;
