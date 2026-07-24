-- Extend subscription_status with Stripe's initial states (migration 009), so the
-- webhook can map Stripe subscription.status directly. PG12+ allows ADD VALUE in a
-- transaction as long as the value isn't used in the same transaction.

alter type public.subscription_status add value if not exists 'incomplete';
alter type public.subscription_status add value if not exists 'incomplete_expired';
