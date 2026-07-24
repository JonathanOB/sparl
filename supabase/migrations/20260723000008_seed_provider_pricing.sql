-- Sample provider pricing (migration 008). Idempotent. One standard product +
-- monthly offer per seeded provider, so the recommendation engine has prices to
-- compare against. Placeholder data until the Phase 6 ingest replaces it.

begin;

insert into public.provider_products (provider_id, name, product_type, active)
select p.id, p.name || ' Standard', cat.slug, true
from public.providers p
join public.provider_categories cat on cat.id = p.category_id
where not exists (select 1 from public.provider_products pp where pp.provider_id = p.id);

insert into public.provider_offers (product_id, price, billing_period, source, valid_from)
select pp.id, pr.price, 'monthly', 'manual', current_date
from public.provider_products pp
join public.providers p on p.id = pp.provider_id
join (values
  ('Electric Ireland', 110), ('Bord Gáis Energy', 105), ('SSE Airtricity', 98), ('Energia', 95),
  ('eir', 55), ('Virgin Media', 60), ('Sky Ireland', 50), ('Vodafone Broadband', 45),
  ('Vodafone', 35), ('Three', 30), ('eir Mobile', 28), ('48', 15),
  ('Aviva', 60), ('AXA', 55), ('Zurich', 65), ('Allianz', 58),
  ('Netflix', 17), ('Spotify', 11), ('Disney+', 9), ('Amazon Prime', 9)
) as pr(name, price) on pr.name = p.name
where not exists (select 1 from public.provider_offers po where po.product_id = pp.id);

commit;
