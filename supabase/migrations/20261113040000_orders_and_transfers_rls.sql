-- =====================================================================
-- 2단계 DB-Only 전환: orders / bank_transfers 컬럼 보강 및 RLS 정책 정비
-- =====================================================================

-- 1. orders 확장 컬럼 추가
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_address text,
  ADD COLUMN IF NOT EXISTS shipping_memo    text,
  ADD COLUMN IF NOT EXISTS refund_requested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS refund_reason    text,
  ADD COLUMN IF NOT EXISTS viewed_at        timestamptz;

-- 결제 수단 제약 조건 확장 (card, portone_card, free 포함)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('bank_transfer','toss_card','card','portone_card','voucher','free'));

-- orders 본인 INSERT / UPDATE RLS 정책
DROP POLICY IF EXISTS orders_insert_own ON public.orders;
CREATE POLICY orders_insert_own
  ON public.orders
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS orders_update_own ON public.orders;
CREATE POLICY orders_update_own
  ON public.orders
  FOR UPDATE
  USING (user_id = (select auth.uid()) OR public.is_admin())
  WITH CHECK (user_id = (select auth.uid()) OR public.is_admin());

-- 2. bank_transfers 본인 INSERT / UPDATE RLS 정책
DROP POLICY IF EXISTS bank_transfers_insert_own ON public.bank_transfers;
CREATE POLICY bank_transfers_insert_own
  ON public.bank_transfers
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS bank_transfers_update_own ON public.bank_transfers;
CREATE POLICY bank_transfers_update_own
  ON public.bank_transfers
  FOR UPDATE
  USING (user_id = (select auth.uid()) OR public.is_admin())
  WITH CHECK (user_id = (select auth.uid()) OR public.is_admin());

