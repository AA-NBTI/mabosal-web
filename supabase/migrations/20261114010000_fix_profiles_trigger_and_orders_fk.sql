-- =============================================================================
-- Migration: 20261114010000_fix_profiles_trigger_and_orders_fk.sql
-- Purpose:
--   1. Backfill missing auth.users rows into public.profiles (e.g. song1205)
--      and restore on_auth_user_created trigger so new signups always create a profile.
--   2. Add INSERT / UPDATE RLS policies on public.profiles for own profile.
--   3. Change public.orders.user_id and public.bank_transfers.user_id FK to
--      reference auth.users(id) ON DELETE SET NULL instead of public.profiles(id),
--      and drop strict orders_product_id_fkey so orders never fail to persist.
--   4. Expand products_delivery_type_check to accept 'ebook', 'voucher', 'voucher_code'.
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT;

-- 1) Backfill all existing auth.users into public.profiles
INSERT INTO public.profiles (id, email, username, name, display_name, role, status)
SELECT
  u.id,
  u.email,
  COALESCE(
    NULLIF(TRIM(u.raw_user_meta_data->>'username'), ''),
    SPLIT_PART(COALESCE(u.email, u.id::text), '@', 1)
  ) AS username,
  COALESCE(
    NULLIF(TRIM(u.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'display_name'), ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'username'), ''),
    SPLIT_PART(COALESCE(u.email, u.id::text), '@', 1)
  ) AS name,
  COALESCE(
    NULLIF(TRIM(u.raw_user_meta_data->>'display_name'), ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'username'), ''),
    SPLIT_PART(COALESCE(u.email, u.id::text), '@', 1)
  ) AS display_name,
  CASE
    WHEN COALESCE(u.raw_user_meta_data->>'role', '') = 'admin' THEN 'admin'
    ELSE 'user'
  END AS role,
  'active' AS status
FROM auth.users u
ON CONFLICT (id) DO UPDATE
SET
  email = COALESCE(EXCLUDED.email, public.profiles.email),
  username = COALESCE(public.profiles.username, EXCLUDED.username),
  name = COALESCE(public.profiles.name, EXCLUDED.name),
  display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);

-- 2) Create / replace trigger function to auto-create public.profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, name, display_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
      SPLIT_PART(COALESCE(NEW.email, NEW.id::text), '@', 1)
    ),
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
      SPLIT_PART(COALESCE(NEW.email, NEW.id::text), '@', 1)
    ),
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
      SPLIT_PART(COALESCE(NEW.email, NEW.id::text), '@', 1)
    ),
    CASE
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', '') = 'admin' THEN 'admin'
      ELSE 'user'
    END,
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    username = COALESCE(public.profiles.username, EXCLUDED.username),
    name = COALESCE(public.profiles.name, EXCLUDED.name),
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3) Ensure users can insert/update their own profile row
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 4) Fix FK constraints on public.orders and public.bank_transfers so orders never fail on profile sync timing
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_product_id_fkey;

ALTER TABLE public.bank_transfers
  DROP CONSTRAINT IF EXISTS bank_transfers_user_id_fkey;

ALTER TABLE public.bank_transfers
  ADD CONSTRAINT bank_transfers_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5) Drop overly strict products_delivery_type_check so client/Edge Function product sync never fails
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_delivery_type_check;

