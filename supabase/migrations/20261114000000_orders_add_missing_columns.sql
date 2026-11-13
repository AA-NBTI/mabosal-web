-- =====================================================================
-- orders 테이블 누락 필드 보강 (새로고침/재조회 시 주문 메타데이터 유실 방지)
-- =====================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS saju_input           jsonb,
  ADD COLUMN IF NOT EXISTS selected_option_name text,
  ADD COLUMN IF NOT EXISTS refunded_at          timestamptz,
  ADD COLUMN IF NOT EXISTS report_tier          text,
  ADD COLUMN IF NOT EXISTS content_payload      text,
  ADD COLUMN IF NOT EXISTS items                jsonb,
  ADD COLUMN IF NOT EXISTS shipping_fee         integer,
  ADD COLUMN IF NOT EXISTS applied_coupon_code  text,
  ADD COLUMN IF NOT EXISTS discount_amount      integer,
  ADD COLUMN IF NOT EXISTS used_yeop            integer;

