-- =============================================================================
-- Migration: 20261114020000_enable_orders_realtime.sql
-- Purpose: Enable Supabase Realtime (postgres_changes) on public.orders so
--          AdminDashboard receives immediate refund-request notifications.
-- =============================================================================

ALTER TABLE public.orders REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

