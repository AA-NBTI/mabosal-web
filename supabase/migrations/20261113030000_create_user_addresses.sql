-- =====================================================================
-- 회원 기본 주소록(user_addresses) 테이블 및 RLS 정책
-- =====================================================================

create table if not exists public.user_addresses (
  id              text primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  recipient_name  text not null default '',
  recipient_phone text not null default '',
  zip_code        text not null default '',
  address         text not null default '',
  detail_address  text not null default '',
  delivery_memo   text not null default '',
  is_default      boolean not null default false,
  updated_at      timestamptz not null default now()
);

create index if not exists idx_user_addresses_user_id
  on public.user_addresses (user_id);

alter table public.user_addresses enable row level security;

drop policy if exists user_addresses_select_own on public.user_addresses;
create policy user_addresses_select_own
  on public.user_addresses
  for select
  using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists user_addresses_insert_own on public.user_addresses;
create policy user_addresses_insert_own
  on public.user_addresses
  for insert
  with check (user_id = (select auth.uid()));

drop policy if exists user_addresses_update_own on public.user_addresses;
create policy user_addresses_update_own
  on public.user_addresses
  for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists user_addresses_delete_own on public.user_addresses;
create policy user_addresses_delete_own
  on public.user_addresses
  for delete
  using (user_id = (select auth.uid()));

