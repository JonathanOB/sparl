-- create_service RPC (migration 004).
-- Adding a service creates a user_services row plus (when contract info is given)
-- a contract and a renewal, atomically (§2.1). Security-definer with an explicit
-- household-membership check for the calling user.

begin;

create or replace function public.create_service(
  p_household_id uuid,
  p_provider_id uuid default null,
  p_category_id uuid default null,
  p_current_product_id uuid default null,
  p_monthly_cost numeric default null,
  p_annual_cost numeric default null,
  p_status public.user_service_status default 'active',
  p_renewal_date date default null,
  p_contract_start_date date default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_service_id uuid;
  v_contract_id uuid;
begin
  select id into v_user_id
  from public.users
  where clerk_user_id = auth.jwt() ->> 'sub'
    and deleted_at is null;

  if v_user_id is null then
    raise exception 'no application user for the current session';
  end if;

  if not exists (
    select 1 from public.household_members
    where household_id = p_household_id
      and user_id = v_user_id
      and deleted_at is null
  ) then
    raise exception 'not a member of household %', p_household_id;
  end if;

  insert into public.user_services (
    household_id, provider_id, category_id, current_product_id,
    monthly_cost, annual_cost, status, renewal_date
  )
  values (
    p_household_id, p_provider_id, p_category_id, p_current_product_id,
    p_monthly_cost, p_annual_cost, p_status, p_renewal_date
  )
  returning id into v_service_id;

  if p_renewal_date is not null or p_contract_start_date is not null then
    insert into public.contracts (user_service_id, start_date, renewal_date)
    values (v_service_id, p_contract_start_date, p_renewal_date)
    returning id into v_contract_id;

    insert into public.renewals (contract_id, renewal_date, status)
    values (v_contract_id, p_renewal_date, 'pending');
  end if;

  return v_service_id;
end;
$$;

revoke execute on function public.create_service(
  uuid, uuid, uuid, uuid, numeric, numeric, public.user_service_status, date, date
) from public;
grant execute on function public.create_service(
  uuid, uuid, uuid, uuid, numeric, numeric, public.user_service_status, date, date
) to authenticated;

commit;
