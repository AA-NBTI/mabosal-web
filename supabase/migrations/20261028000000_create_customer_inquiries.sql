-- =====================================================================
-- 고객센터 1:1 온라인 고객 문의 (customer_inquiries) 스키마
-- =====================================================================
create table if not exists public.customer_inquiries (
  id            text primary key,
  user_id       text,
  user_name     text not null,
  reply_email   text not null,
  phone         text,
  order_id      text,
  category      text not null default '일반 문의',
  title         text not null,
  content       text not null,
  status        text not null default 'pending' check (status in ('pending', 'answered')),
  admin_answer  text,
  answered_at   timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.customer_inquiries enable row level security;

-- 누구나 문의 등록(insert) 가능 (게스트 및 로그인 회원)
create policy customer_inquiries_insert_all 
  on public.customer_inquiries 
  for insert 
  with check (true);

-- 문의 목록 조회 허용
create policy customer_inquiries_select_all 
  on public.customer_inquiries 
  for select 
  using (true);

-- 문의 답변 및 상태 업데이트 허용
create policy customer_inquiries_update_all 
  on public.customer_inquiries 
  for update 
  using (true)
  with check (true);

-- 문의 삭제 허용
create policy customer_inquiries_delete_all 
  on public.customer_inquiries 
  for delete 
  using (true);

create index if not exists idx_customer_inquiries_created_at on public.customer_inquiries (created_at desc);
create index if not exists idx_customer_inquiries_email on public.customer_inquiries (reply_email);
create index if not exists idx_customer_inquiries_status on public.customer_inquiries (status);

