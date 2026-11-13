-- 비로그인 회원가입 단계에서도 안전하게 아이디 중복 여부만 boolean으로 확인하는 RPC
CREATE OR REPLACE FUNCTION public.is_username_available(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE LOWER(username) = LOWER(TRIM(p_username))
  )
  AND NOT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE LOWER(email) = LOWER(
      CASE
        WHEN POSITION('@' IN TRIM(p_username)) > 0 THEN TRIM(p_username)
        ELSE TRIM(p_username) || '@mabosal.com'
      END
    )
  );
$$;

REVOKE ALL ON FUNCTION public.is_username_available(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_username_available(TEXT) TO anon, authenticated;

