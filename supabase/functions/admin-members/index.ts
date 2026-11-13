import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface AdminActionPayload {
  action: 'list' | 'suspend' | 'unsuspend' | 'delete';
  userId?: string;
  reason?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Server configuration missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // 호출자가 실제 admin 권한인지 DB에서 검증
    const { data: callerProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .maybeSingle();

    if (callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as AdminActionPayload;
    const { action, userId, reason } = body;

    if (action === 'list') {
      const [{ data: profiles, error: profErr }, { data: authUsersData, error: listErr }] = await Promise.all([
        adminClient.from('profiles').select('*').order('created_at', { ascending: false }),
        adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      ]);

      if (profErr) {
        return new Response(JSON.stringify({ error: profErr.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const authMap = new Map<string, any>(
        (authUsersData?.users || []).map((u: any) => [u.id, u])
      );

      const merged = (profiles || []).map((p: any) => {
        const authUser = authMap.get(p.id);
        return {
          ...p,
          email: p.email || authUser?.email || '',
          last_sign_in_at: authUser?.last_sign_in_at || null,
          banned_until: authUser?.banned_until || null,
        };
      });

      // profiles에 아직 없는 auth.users도 누락 없이 포함
      if (!listErr && authUsersData?.users) {
        const profIds = new Set((profiles || []).map((p: any) => p.id));
        for (const u of authUsersData.users) {
          if (!profIds.has(u.id)) {
            merged.push({
              id: u.id,
              username: u.user_metadata?.username || (u.email ? u.email.split('@')[0] : u.id.slice(0, 8)),
              name: u.user_metadata?.name || '미입력',
              email: u.email || '',
              phone: u.user_metadata?.phone || '',
              role: u.user_metadata?.role || 'user',
              status: u.banned_until ? 'suspended' : 'active',
              created_at: u.created_at,
              last_sign_in_at: u.last_sign_in_at || null,
              banned_until: u.banned_until || null,
            });
          }
        }
      }

      return new Response(JSON.stringify({ members: merged }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (userId === caller.id) {
      return new Response(JSON.stringify({ error: '관리자 본인 계정은 정지 또는 삭제할 수 없습니다.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: targetProf } = await adminClient
      .from('profiles')
      .select('role, username')
      .eq('id', userId)
      .maybeSingle();

    if (targetProf?.role === 'admin' || targetProf?.username === 'admin') {
      return new Response(JSON.stringify({ error: '관리자 계정은 정지 또는 삭제할 수 없습니다.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'suspend') {
      const { error: banErr } = await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: '876000h',
      });
      if (banErr) {
        return new Response(JSON.stringify({ error: banErr.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: updErr } = await adminClient
        .from('profiles')
        .update({
          status: 'suspended',
          suspended_reason: reason || '관리자 직권 이용 정지',
          suspended_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updErr) {
        return new Response(JSON.stringify({ error: updErr.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'unsuspend') {
      const { error: unbanErr } = await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: 'none',
      });
      if (unbanErr) {
        return new Response(JSON.stringify({ error: unbanErr.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: updErr } = await adminClient
        .from('profiles')
        .update({
          status: 'active',
          suspended_reason: null,
          suspended_at: null,
        })
        .eq('id', userId);

      if (updErr) {
        return new Response(JSON.stringify({ error: updErr.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      const { error: delAuthErr } = await adminClient.auth.admin.deleteUser(userId);
      if (delAuthErr) {
        return new Response(JSON.stringify({ error: delAuthErr.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await adminClient.from('profiles').delete().eq('id', userId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unsupported action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

