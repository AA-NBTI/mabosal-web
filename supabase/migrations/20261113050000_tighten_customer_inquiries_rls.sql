-- =====================================================================
-- customer_inquiries RLS 보안 강화:
-- 비로그인(anon)/타인의 무단 SELECT, UPDATE, DELETE 차단
-- (INSERT만 게스트/회원 모두 허용, SELECT는 본인 또는 관리자만, UPDATE/DELETE는 관리자 전용)
-- =====================================================================

DROP POLICY IF EXISTS customer_inquiries_select_all ON public.customer_inquiries;
DROP POLICY IF EXISTS customer_inquiries_update_all ON public.customer_inquiries;
DROP POLICY IF EXISTS customer_inquiries_delete_all ON public.customer_inquiries;

DROP POLICY IF EXISTS customer_inquiries_select_own_or_admin ON public.customer_inquiries;
CREATE POLICY customer_inquiries_select_own_or_admin
  ON public.customer_inquiries
  FOR SELECT
  USING (
    public.is_admin()
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
  );

DROP POLICY IF EXISTS customer_inquiries_update_admin ON public.customer_inquiries;
CREATE POLICY customer_inquiries_update_admin
  ON public.customer_inquiries
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS customer_inquiries_delete_admin ON public.customer_inquiries;
CREATE POLICY customer_inquiries_delete_admin
  ON public.customer_inquiries
  FOR DELETE
  USING (public.is_admin());

