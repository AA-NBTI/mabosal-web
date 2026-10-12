import { createClient } from '@supabase/supabase-js';

// 기본 로컬 Supabase Docker 기본값
const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321';
const LOCAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Vite 환경 변수가 있으면 우선 적용, 없으면 로컬 Docker 연결
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || LOCAL_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || LOCAL_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const SUPABASE_CONFIG = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  isLocal: supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost'),
};
