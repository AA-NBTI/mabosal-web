import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PortOneActionPayload {
  action: 'verify' | 'cancel';
  paymentId: string;
  orderId?: string;
  reason?: string;
  amount?: number;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const portoneSecret = Deno.env.get('PORTONE_API_SECRET') ?? '';

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return jsonResponse({ ok: false, error: 'Supabase server configuration missing' }, 500);
    }
    if (!portoneSecret) {
      return jsonResponse(
        { ok: false, error: 'PORTONE_API_SECRET 환경변수가 Supabase Secrets에 설정되지 않았습니다.' },
        500
      );
    }

    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !caller) {
      return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
    }

    const body = (await req.json()) as PortOneActionPayload;
    const paymentId = (body.paymentId || '').trim();
    if (!paymentId) {
      return jsonResponse({ ok: false, error: 'paymentId is required' }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    if (body.action === 'verify') {
      const res = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
        method: 'GET',
        headers: {
          Authorization: `PortOne ${portoneSecret}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return jsonResponse({ ok: false, error: data?.message || `PortOne verify failed (${res.status})` }, res.status);
      }
      return jsonResponse({
        ok: true,
        status: data.status,
        amount: data.amount?.total ?? null,
        payment: data,
      });
    }

    if (body.action === 'cancel') {
      // 관리자 권한 검증
      const { data: callerProfile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', caller.id)
        .maybeSingle();

      if (callerProfile?.role !== 'admin') {
        return jsonResponse({ ok: false, error: 'Forbidden: admin role required' }, 403);
      }

      const cancelPayload: Record<string, unknown> = {
        reason: (body.reason || '관리자 환불 승인').slice(0, 200),
      };
      if (typeof body.amount === 'number' && body.amount > 0) {
        cancelPayload.amount = body.amount;
      }

      const res = await fetch(
        `https://api.portone.io/payments/${encodeURIComponent(paymentId)}/cancel`,
        {
          method: 'POST',
          headers: {
            Authorization: `PortOne ${portoneSecret}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cancelPayload),
        }
      );

      const data = await res.json().catch(() => ({}));
      const alreadyCancelled =
        data?.type === 'PAYMENT_ALREADY_CANCELLED' ||
        String(data?.message || '').includes('이미 취소');

      if (!res.ok && !alreadyCancelled) {
        return jsonResponse(
          { ok: false, error: data?.message || `PortOne cancel failed (${res.status})`, detail: data },
          res.status
        );
      }

      const targetOrderId = (body.orderId || paymentId).trim();
      await adminClient
        .from('orders')
        .update({ status: 'refunded' })
        .eq('id', targetOrderId)
        .then(() => undefined, () => undefined);

      await adminClient
        .from('payment_events')
        .insert({
          order_id: targetOrderId,
          provider: 'portone_v2',
          event_type: 'cancel',
          payload: data,
        })
        .then(() => undefined, () => undefined);

      return jsonResponse({
        ok: true,
        alreadyCancelled,
        cancellation: data.cancellation || data,
      });
    }

    return jsonResponse({ ok: false, error: `Unknown action: ${String(body.action)}` }, 400);
  } catch (err) {
    return jsonResponse(
      { ok: false, error: err instanceof Error ? err.message : 'Internal server error' },
      500
    );
  }
});

