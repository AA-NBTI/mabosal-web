-- =====================================================================
-- 마보살 코어 스키마 v1
--  원칙
--   1) 가격·금액·상태 전이는 클라이언트를 믿지 않는다 → RPC(security definer) 또는 service_role 만 변경
--   2) 모든 테이블 RLS 활성화. 정책이 없으면 접근 불가(deny by default)
--   3) 돈은 잔액 컬럼이 아니라 원장(cash_ledger)으로 기록 (감사 가능)
-- =====================================================================

-- ---------- 1. profiles (auth.users 1:1) ----------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique,
  name          text not null default '',
  phone         text,
  role          text not null default 'user' check (role in ('user','partner','admin')),
  partner_type  text check (partner_type in ('AFFILIATE','EXPERT','HYBRID')),
  partner_code  text unique,
  created_at    timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- profiles가 생성된 후 is_admin() 정의
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

create policy profiles_select_own   on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_update_own   on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_update on public.profiles for update using (public.is_admin()) with check (public.is_admin());

-- 본인은 이름/연락처만 수정 가능 (role·partner_code 자가 승격 차단). 관리자는 service_role/SQL 로 변경.
revoke update on public.profiles from anon, authenticated;
grant  update (name, phone) on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, name)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'username', ''),
    coalesce(new.raw_user_meta_data->>'name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 2. products ----------
create table public.products (
  id              text primary key,
  title           text not null,
  category        text not null check (category in ('report','ebook','lecture','consulting','goods','voucher')),
  price           integer not null check (price >= 0),
  original_price  integer check (original_price is null or original_price >= 0),
  tag_line        text not null default '',
  description     text not null default '',
  details_html    text,
  thumbnail_url   text not null default '',
  thumbnail_icon  text,
  delivery_type   text not null check (delivery_type in ('digital_url','digital_download','consulting_booking','shipping','saju_report')),
  target_signals  text[] not null default '{}',
  status          text not null default 'active' check (status in ('active','soldout','hidden')),
  badge           text,
  report_tier     text,
  sales_count     integer not null default 0,
  created_at      timestamptz not null default now()
);
alter table public.products enable row level security;

create policy products_public_read on public.products for select using (status in ('active','soldout') or public.is_admin());
create policy products_admin_write on public.products for all using (public.is_admin()) with check (public.is_admin());

-- 유료 콘텐츠 링크/페이로드는 공개 테이블과 분리: 구매 완료자·관리자만 조회
create table public.product_contents (
  product_id       text primary key references public.products(id) on delete cascade,
  content_payload  text not null
);
alter table public.product_contents enable row level security;

-- ---------- 3. orders ----------
create table public.orders (
  id             text primary key check (id ~ '^[A-Za-z0-9_-]{6,64}$'),  -- 토스 orderId 규격
  user_id        uuid references public.profiles(id) on delete set null,   -- 비회원 주문이면 null
  product_id     text not null references public.products(id),
  product_title  text not null,                                            -- 주문 시점 스냅샷
  category       text not null,
  amount         integer not null check (amount >= 0),                     -- 서버가 products.price 로 확정
  buyer_name     text not null,
  buyer_email    text not null,
  buyer_phone    text not null,
  payment_method text not null check (payment_method in ('bank_transfer','toss_card','voucher')),
  status         text not null default 'pending' check (status in ('pending','completed','cancelled','refunded')),
  delivery_type  text not null,
  access_url     text not null default '',
  payment_key    text,
  paid_at        timestamptz,
  created_at     timestamptz not null default now()
);
create unique index orders_payment_key_uniq on public.orders (payment_key) where payment_key is not null;
create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status);
alter table public.orders enable row level security;

create policy orders_select_own   on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy orders_admin_update on public.orders for update using (public.is_admin()) with check (public.is_admin());

create policy product_contents_admin on public.product_contents for all using (public.is_admin()) with check (public.is_admin());
create policy product_contents_buyer  on public.product_contents for select using (
  exists (select 1 from public.orders o
          where o.product_id = product_contents.product_id and o.user_id = auth.uid() and o.status = 'completed')
);

-- ---------- 4. bank_transfers ----------
create table public.bank_transfers (
  id                   uuid primary key default gen_random_uuid(),
  order_id             text references public.orders(id) on delete set null,  -- null = 주문 없는 단독 입금(상품권 등)
  user_id              uuid references public.profiles(id) on delete set null,
  depositor_name       text not null,
  requested_amount     integer not null check (requested_amount > 0),
  target_product       text not null default '',
  status               text not null default 'pending' check (status in ('pending','approved','rejected')),
  applied_coupon_code  text,
  memo                 text not null default '',
  created_at           timestamptz not null default now(),
  approved_at          timestamptz,
  approved_by          uuid references public.profiles(id)
);
create index bank_transfers_status_idx on public.bank_transfers (status, created_at desc);
alter table public.bank_transfers enable row level security;
create policy bank_transfers_select on public.bank_transfers for select using (user_id = auth.uid() or public.is_admin());

-- ---------- 5. coupons / user_coupons ----------
create table public.coupons (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique check (code = upper(code) and length(code) between 4 and 40),
  name             text not null,
  type             text not null check (type in ('free_pass','fixed_discount','percent_discount','cash_card')),
  discount_amount  integer check (discount_amount is null or discount_amount >= 0),
  discount_rate    integer check (discount_rate is null or discount_rate between 0 and 100),
  target_product   text not null default 'all',
  min_order_amount integer,
  expiry_date      date,
  used_count       integer not null default 0,
  usage_limit      integer,
  enabled          boolean not null default true,
  created_at       timestamptz not null default now()
);
alter table public.coupons enable row level security;
create policy coupons_admin on public.coupons for all using (public.is_admin()) with check (public.is_admin());

create table public.user_coupons (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  coupon_id      uuid not null references public.coupons(id) on delete cascade,
  registered_at  timestamptz not null default now(),
  used_at        timestamptz,
  used_order_id  text references public.orders(id) on delete set null,
  unique (user_id, coupon_id)
);
alter table public.user_coupons enable row level security;
create policy user_coupons_select on public.user_coupons for select using (user_id = auth.uid() or public.is_admin());

-- ---------- 6. cash_ledger (원장) ----------
create table public.cash_ledger (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  delta         integer not null check (delta <> 0),
  reason        text not null,
  ref_order_id  text references public.orders(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index cash_ledger_user_idx on public.cash_ledger (user_id, created_at desc);
alter table public.cash_ledger enable row level security;
create policy cash_ledger_select on public.cash_ledger for select using (user_id = auth.uid() or public.is_admin());

create view public.cash_balances with (security_invoker = true) as
  select user_id, sum(delta)::integer as balance from public.cash_ledger group by user_id;

-- ---------- 7. payment_events (PG 감사 로그) ----------
create table public.payment_events (
  id          uuid primary key default gen_random_uuid(),
  order_id    text references public.orders(id) on delete set null,
  provider    text not null,
  event_type  text not null,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
alter table public.payment_events enable row level security;
create policy payment_events_admin on public.payment_events for select using (public.is_admin());

-- ---------- 8. site_settings ----------
create table public.site_settings (
  key        text primary key,
  value      jsonb not null,
  is_public  boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
create policy site_settings_read  on public.site_settings for select using (is_public or public.is_admin());
create policy site_settings_admin on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- RPC
-- =====================================================================

-- 주문 생성: 금액은 항상 서버의 products.price. 무통장이면 입금 신청도 함께 생성.
create or replace function public.create_order(
  p_product_id  text,
  p_buyer_name  text,
  p_buyer_phone text,
  p_buyer_email text,
  p_method      text,
  p_order_id    text default null
) returns public.orders
language plpgsql security definer
set search_path = public
as $$
declare
  prod public.products;
  ord  public.orders;
  oid  text;
begin
  if p_method not in ('bank_transfer','toss_card') then
    raise exception 'unsupported payment method: %', p_method;
  end if;
  if coalesce(trim(p_buyer_name),'') = '' then
    raise exception 'buyer name required';
  end if;

  select * into prod from public.products where id = p_product_id and status = 'active';
  if not found then
    raise exception 'product not available';
  end if;

  oid := coalesce(p_order_id, 'MBS-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 12)));

  insert into public.orders (id, user_id, product_id, product_title, category, amount,
                             buyer_name, buyer_email, buyer_phone, payment_method, status, delivery_type)
  values (oid, auth.uid(), prod.id, prod.title, prod.category, prod.price,
          trim(p_buyer_name), trim(p_buyer_email), trim(p_buyer_phone), p_method, 'pending', prod.delivery_type)
  returning * into ord;

  if p_method = 'bank_transfer' then
    insert into public.bank_transfers (order_id, user_id, depositor_name, requested_amount, target_product, memo)
    values (ord.id, auth.uid(), ord.buyer_name, ord.amount, ord.product_title, '주문 ' || ord.id || ' 입금 확인 대기');
  end if;

  return ord;
end;
$$;
revoke all on function public.create_order(text,text,text,text,text,text) from public;
grant execute on function public.create_order(text,text,text,text,text,text) to anon, authenticated;

-- 관리자: 입금 승인. 주문 연결 건 → 주문 결제완료. 단독 입금 → 입금액 상당 쿠폰 발급.
create or replace function public.admin_approve_bank_transfer(p_transfer_id uuid)
returns public.bank_transfers
language plpgsql security definer
set search_path = public
as $$
declare
  bt   public.bank_transfers;
  code text;
  cid  uuid;
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;

  select * into bt from public.bank_transfers where id = p_transfer_id for update;
  if not found then raise exception 'transfer not found'; end if;
  if bt.status <> 'pending' then raise exception 'already processed: %', bt.status; end if;

  if bt.order_id is not null then
    update public.orders
       set status = 'completed', paid_at = now()
     where id = bt.order_id and status = 'pending';
    update public.products p
       set sales_count = sales_count + 1
      from public.orders o
     where o.id = bt.order_id and p.id = o.product_id;
    update public.bank_transfers
       set status = 'approved', approved_at = now(), approved_by = auth.uid(),
           memo = '주문 ' || bt.order_id || ' 입금 확인 · 결제 완료 처리'
     where id = bt.id returning * into bt;
  else
    code := 'PASS-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    insert into public.coupons (code, name, type, discount_amount, target_product, expiry_date)
    values (code, '[' || bt.depositor_name || ' 님 입금 승인권] ' || bt.target_product, 'fixed_discount',
            bt.requested_amount, 'all', (current_date + interval '1 year')::date)
    returning id into cid;
    if bt.user_id is not null then
      insert into public.user_coupons (user_id, coupon_id) values (bt.user_id, cid);
    end if;
    update public.bank_transfers
       set status = 'approved', approved_at = now(), approved_by = auth.uid(),
           applied_coupon_code = code, memo = '입금 승인 · 쿠폰 ' || code || ' 발급'
     where id = bt.id returning * into bt;
  end if;
  return bt;
end;
$$;
revoke all on function public.admin_approve_bank_transfer(uuid) from public;
grant execute on function public.admin_approve_bank_transfer(uuid) to authenticated;

create or replace function public.admin_reject_bank_transfer(p_transfer_id uuid)
returns public.bank_transfers
language plpgsql security definer
set search_path = public
as $$
declare bt public.bank_transfers;
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  update public.bank_transfers
     set status = 'rejected', approved_by = auth.uid(), approved_at = now(),
         memo = '입금 내역 불일치 또는 미입금으로 반려 처리'
   where id = p_transfer_id and status = 'pending'
   returning * into bt;
  if not found then raise exception 'transfer not pending'; end if;
  if bt.order_id is not null then
    update public.orders set status = 'cancelled' where id = bt.order_id and status = 'pending';
  end if;
  return bt;
end;
$$;
revoke all on function public.admin_reject_bank_transfer(uuid) from public;
grant execute on function public.admin_reject_bank_transfer(uuid) to authenticated;

-- 쿠폰 등록(코드 입력).
create or replace function public.redeem_coupon(p_code text)
returns public.user_coupons
language plpgsql security definer
set search_path = public
as $$
declare
  c  public.coupons;
  uc public.user_coupons;
begin
  if auth.uid() is null then
    raise exception 'login required' using errcode = '42501';
  end if;
  select * into c from public.coupons where code = upper(trim(p_code));
  if not found or not c.enabled then raise exception 'invalid coupon'; end if;
  if c.expiry_date is not null and c.expiry_date < current_date then raise exception 'coupon expired'; end if;
  if c.usage_limit is not null and c.used_count >= c.usage_limit then raise exception 'coupon exhausted'; end if;

  begin
    insert into public.user_coupons (user_id, coupon_id) values (auth.uid(), c.id) returning * into uc;
  exception when unique_violation then
    raise exception 'coupon already registered';
  end;
  return uc;
end;
$$;
revoke all on function public.redeem_coupon(text) from public;
grant execute on function public.redeem_coupon(text) to authenticated;

-- 토스 결제 승인 반영: Vercel Function(service_role) 전용. 금액 재검증 + 멱등.
create or replace function public.complete_toss_payment(
  p_order_id text, p_payment_key text, p_amount integer, p_raw jsonb default '{}'::jsonb
) returns public.orders
language plpgsql security definer
set search_path = public
as $$
declare ord public.orders;
begin
  select * into ord from public.orders where id = p_order_id for update;
  if not found then raise exception 'order not found'; end if;
  if ord.payment_method <> 'toss_card' then raise exception 'not a card order'; end if;
  if ord.amount <> p_amount then
    insert into public.payment_events (order_id, provider, event_type, payload)
    values (p_order_id, 'toss', 'amount_mismatch', jsonb_build_object('expected', ord.amount, 'got', p_amount));
    raise exception 'amount mismatch';
  end if;
  if ord.status = 'completed' then return ord; end if;   -- 멱등
  if ord.status <> 'pending' then raise exception 'order not payable: %', ord.status; end if;

  update public.orders set status = 'completed', payment_key = p_payment_key, paid_at = now()
   where id = p_order_id returning * into ord;
  update public.products set sales_count = sales_count + 1 where id = ord.product_id;
  insert into public.payment_events (order_id, provider, event_type, payload)
  values (p_order_id, 'toss', 'confirmed', p_raw);
  return ord;
end;
$$;
revoke all on function public.complete_toss_payment(text,text,integer,jsonb) from public, anon, authenticated;
grant execute on function public.complete_toss_payment(text,text,integer,jsonb) to service_role;
