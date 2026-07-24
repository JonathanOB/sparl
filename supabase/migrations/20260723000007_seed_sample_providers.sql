-- Sample Irish providers (migration 007). Idempotent. Lets the "add service"
-- provider dropdown work before the real Phase 6 ingest exists. Placeholder data.

begin;

insert into public.providers (country_id, category_id, name, active, affiliate_available)
select ie.id, cat.id, p.name, true, false
from (values
  ('energy', 'Electric Ireland'),
  ('energy', 'Bord Gáis Energy'),
  ('energy', 'SSE Airtricity'),
  ('energy', 'Energia'),
  ('broadband', 'eir'),
  ('broadband', 'Virgin Media'),
  ('broadband', 'Sky Ireland'),
  ('broadband', 'Vodafone Broadband'),
  ('mobile', 'Vodafone'),
  ('mobile', 'Three'),
  ('mobile', 'eir Mobile'),
  ('mobile', '48'),
  ('insurance', 'Aviva'),
  ('insurance', 'AXA'),
  ('insurance', 'Zurich'),
  ('insurance', 'Allianz'),
  ('subscriptions', 'Netflix'),
  ('subscriptions', 'Spotify'),
  ('subscriptions', 'Disney+'),
  ('subscriptions', 'Amazon Prime')
) as p(slug, name)
join public.countries ie on ie.code = 'IE'
join public.provider_categories cat on cat.slug = p.slug
where not exists (
  select 1 from public.providers ex where ex.name = p.name and ex.category_id = cat.id
);

commit;
