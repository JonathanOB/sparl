-- Plan catalogue (migration 010). Provisional pricing (§2.5). The Stripe price is
-- the source of truth for charging; this row records tier metadata for the app.

begin;

insert into public.plans (name, price, features) values
  ('free', 0, '{"ai_questions_per_month": 20, "document_ai": false}'::jsonb),
  ('premium', 4.99, '{"ai_questions_per_month": null, "document_ai": true}'::jsonb),
  ('family', 7.99, '{"ai_questions_per_month": null, "document_ai": true, "members": 5}'::jsonb)
on conflict (name) do nothing;

commit;
