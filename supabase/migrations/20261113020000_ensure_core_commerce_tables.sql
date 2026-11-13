-- =====================================================================
-- 마보살 코어 커머스/설정 테이블 멱등성 보장 마이그레이션
-- (profiles가 이미 존재하는 운영 DB에 누락된 products, orders, site_settings 등 생성)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin');
$$;

-- ---------- 1. products / product_contents ----------
CREATE TABLE IF NOT EXISTS public.products (
  id              text PRIMARY KEY,
  title           text NOT NULL,
  category        text NOT NULL CHECK (category IN ('report','ebook','lecture','consulting','goods','voucher')),
  price           integer NOT NULL CHECK (price >= 0),
  original_price  integer CHECK (original_price IS NULL OR original_price >= 0),
  tag_line        text NOT NULL DEFAULT '',
  description     text NOT NULL DEFAULT '',
  details_html    text,
  thumbnail_url   text NOT NULL DEFAULT '',
  thumbnail_icon  text,
  delivery_type   text NOT NULL CHECK (delivery_type IN ('digital_url','digital_download','consulting_booking','shipping','saju_report','voucher')),
  target_signals  text[] NOT NULL DEFAULT '{}',
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active','soldout','hidden')),
  badge           text,
  report_tier     text,
  sales_count     integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS products_public_read ON public.products;
CREATE POLICY products_public_read ON public.products FOR SELECT USING (status IN ('active','soldout') OR public.is_admin());
DROP POLICY IF EXISTS products_admin_write ON public.products;
CREATE POLICY products_admin_write ON public.products FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.product_contents (
  product_id       text PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  content_payload  text NOT NULL
);
ALTER TABLE public.product_contents ENABLE ROW LEVEL SECURITY;

-- ---------- 2. orders ----------
CREATE TABLE IF NOT EXISTS public.orders (
  id             text PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9_-]{6,64}$'),
  user_id        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  product_id     text NOT NULL REFERENCES public.products(id),
  product_title  text NOT NULL,
  category       text NOT NULL,
  amount         integer NOT NULL CHECK (amount >= 0),
  buyer_name     text NOT NULL,
  buyer_email    text NOT NULL,
  buyer_phone    text NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('bank_transfer','toss_card','voucher')),
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','cancelled','refunded')),
  delivery_type  text NOT NULL,
  access_url     text NOT NULL DEFAULT '',
  payment_key    text,
  paid_at        timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_key_uniq ON public.orders (payment_key) WHERE payment_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_user_idx ON public.orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders (status);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS orders_select_own ON public.orders;
CREATE POLICY orders_select_own ON public.orders FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS orders_admin_update ON public.orders;
CREATE POLICY orders_admin_update ON public.orders FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS product_contents_admin ON public.product_contents;
CREATE POLICY product_contents_admin ON public.product_contents FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS product_contents_buyer ON public.product_contents;
CREATE POLICY product_contents_buyer ON public.product_contents FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o
          WHERE o.product_id = product_contents.product_id AND o.user_id = auth.uid() AND o.status = 'completed')
);

-- ---------- 3. bank_transfers ----------
CREATE TABLE IF NOT EXISTS public.bank_transfers (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             text REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id              uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  depositor_name       text NOT NULL,
  requested_amount     integer NOT NULL CHECK (requested_amount > 0),
  target_product       text NOT NULL DEFAULT '',
  status               text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  applied_coupon_code  text,
  memo                 text NOT NULL DEFAULT '',
  created_at           timestamptz NOT NULL DEFAULT now(),
  approved_at          timestamptz,
  approved_by          uuid REFERENCES public.profiles(id)
);
CREATE INDEX IF NOT EXISTS bank_transfers_status_idx ON public.bank_transfers (status, created_at DESC);
ALTER TABLE public.bank_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bank_transfers_select ON public.bank_transfers;
CREATE POLICY bank_transfers_select ON public.bank_transfers FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- ---------- 4. coupons / user_coupons ----------
CREATE TABLE IF NOT EXISTS public.coupons (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text NOT NULL UNIQUE CHECK (code = upper(code) AND length(code) BETWEEN 4 AND 40),
  name             text NOT NULL,
  type             text NOT NULL CHECK (type IN ('free_pass','fixed_discount','percent_discount','cash_card')),
  discount_amount  integer CHECK (discount_amount IS NULL OR discount_amount >= 0),
  discount_rate    integer CHECK (discount_rate IS NULL OR discount_rate BETWEEN 0 AND 100),
  target_product   text NOT NULL DEFAULT 'all',
  min_order_amount integer,
  expiry_date      date,
  used_count       integer NOT NULL DEFAULT 0,
  usage_limit      integer,
  enabled          boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS coupons_admin ON public.coupons;
CREATE POLICY coupons_admin ON public.coupons FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.user_coupons (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coupon_id      uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  registered_at  timestamptz NOT NULL DEFAULT now(),
  used_at        timestamptz,
  used_order_id  text REFERENCES public.orders(id) ON DELETE SET NULL,
  UNIQUE (user_id, coupon_id)
);
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_coupons_select ON public.user_coupons;
CREATE POLICY user_coupons_select ON public.user_coupons FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- ---------- 5. cash_ledger / cash_balances ----------
CREATE TABLE IF NOT EXISTS public.cash_ledger (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  delta         integer NOT NULL CHECK (delta <> 0),
  reason        text NOT NULL,
  ref_order_id  text REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cash_ledger_user_idx ON public.cash_ledger (user_id, created_at DESC);
ALTER TABLE public.cash_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cash_ledger_select ON public.cash_ledger;
CREATE POLICY cash_ledger_select ON public.cash_ledger FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE OR REPLACE VIEW public.cash_balances WITH (security_invoker = true) AS
  SELECT user_id, sum(delta)::integer AS balance FROM public.cash_ledger GROUP BY user_id;

-- ---------- 6. payment_events ----------
CREATE TABLE IF NOT EXISTS public.payment_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    text REFERENCES public.orders(id) ON DELETE SET NULL,
  provider    text NOT NULL,
  event_type  text NOT NULL,
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payment_events_admin ON public.payment_events;
CREATE POLICY payment_events_admin ON public.payment_events FOR SELECT USING (public.is_admin());

-- ---------- 7. site_settings ----------
CREATE TABLE IF NOT EXISTS public.site_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  is_public  boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS site_settings_read ON public.site_settings;
CREATE POLICY site_settings_read ON public.site_settings FOR SELECT USING (is_public OR public.is_admin());
DROP POLICY IF EXISTS site_settings_admin ON public.site_settings;
CREATE POLICY site_settings_admin ON public.site_settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

