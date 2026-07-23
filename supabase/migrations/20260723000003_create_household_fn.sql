-- create_household RPC (migration 003).
-- Households RLS is membership-scoped, so a plain INSERT by the creator fails the
-- WITH CHECK (they're not a member yet). This security-definer function atomically
-- creates the household AND the owner membership for the calling user, then RLS
-- governs all subsequent reads/updates normally. Returns the new household id.

begin;

create or replace function public.create_household(
  p_name text,
  p_country_id uuid default null,
  p_address_line_1 text default null,
  p_city text default null,
  p_county text default null,
  p_postal_code text default null,
  p_property_type public.property_type default null,
  p_ownership_status public.ownership_status default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_household_id uuid;
begin
  select id into v_user_id
  from public.users
  where clerk_user_id = auth.jwt() ->> 'sub'
    and deleted_at is null;

  if v_user_id is null then
    raise exception 'no application user for the current session';
  end if;

  insert into public.households (
    country_id, name, address_line_1, city, county, postal_code, property_type, ownership_status
  )
  values (
    p_country_id, p_name, p_address_line_1, p_city, p_county, p_postal_code, p_property_type, p_ownership_status
  )
  returning id into v_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (v_household_id, v_user_id, 'owner');

  return v_household_id;
end;
$$;

-- Authenticated users only (anon has no jwt sub and would fail anyway).
revoke execute on function public.create_household(
  text, uuid, text, text, text, text, public.property_type, public.ownership_status
) from public;
grant execute on function public.create_household(
  text, uuid, text, text, text, text, public.property_type, public.ownership_status
) to authenticated;

commit;
