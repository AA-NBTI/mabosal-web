-- =====================================================================
-- orders.payment_method CHECK 제약 확장:
-- 카카오페이(kakaopay), 토스페이(tosspay), 계좌이체(transfer) 허용
-- =====================================================================

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('bank_transfer','toss_card','card','portone_card','kakaopay','tosspay','transfer','voucher','free'));

