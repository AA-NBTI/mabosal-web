import { supabase } from '../supabase/supabase-client.js';

export interface PortOneCancelResult {
  ok: boolean;
  alreadyCancelled?: boolean;
  error?: string;
}

export interface PortOneVerifyResult {
  ok: boolean;
  status?: string;
  amount?: number | null;
  error?: string;
}

/**
 * Supabase Edge Function(`portone-payment`)을 통해 포트원 V2 서버 결제 취소를 요청한다.
 */
export async function cancelPortOnePayment(params: {
  paymentId: string;
  orderId?: string;
  reason?: string;
  amount?: number;
}): Promise<PortOneCancelResult> {
  try {
    const { data, error } = await supabase.functions.invoke('portone-payment', {
      body: {
        action: 'cancel',
        paymentId: params.paymentId,
        orderId: params.orderId,
        reason: params.reason || '관리자 환불 승인',
        ...(typeof params.amount === 'number' && params.amount > 0 ? { amount: params.amount } : {}),
      },
    });

    if (error) {
      return { ok: false, error: error.message || '포트원 취소 Edge Function 호출에 실패했습니다.' };
    }
    if (!data?.ok) {
      return { ok: false, error: data?.error || '포트원 결제 취소에 실패했습니다.' };
    }
    return { ok: true, alreadyCancelled: Boolean(data.alreadyCancelled) };
  } catch (err: any) {
    return { ok: false, error: err?.message || '포트원 결제 취소 요청 중 오류가 발생했습니다.' };
  }
}

/**
 * Supabase Edge Function(`portone-payment`)을 통해 포트원 V2 서버 결제 상태를 검증한다.
 */
export async function verifyPortOnePayment(paymentId: string): Promise<PortOneVerifyResult> {
  try {
    const { data, error } = await supabase.functions.invoke('portone-payment', {
      body: { action: 'verify', paymentId },
    });
    if (error) return { ok: false, error: error.message };
    if (!data?.ok) return { ok: false, error: data?.error || '결제 검증 실패' };
    return { ok: true, status: data.status, amount: data.amount };
  } catch (err: any) {
    return { ok: false, error: err?.message || '결제 검증 요청 중 오류가 발생했습니다.' };
  }
}

