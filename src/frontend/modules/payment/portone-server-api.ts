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

export interface PortOnePaymentRecord {
  id: string;
  status: string;
  orderName?: string;
  amount?: { total?: number; cancelled?: number };
  paidAt?: string;
  cancelledAt?: string;
  requestedAt?: string;
  customer?: { name?: string; phoneNumber?: string; email?: string };
}

export interface PortOneListResult {
  ok: boolean;
  items: PortOnePaymentRecord[];
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
 * Supabase Edge Function(`portone-payment`)을 통해 포트원 V2 서버 결제 상태를 검증하고 DB에 주문을 확정 저장한다.
 */
export async function verifyPortOnePayment(
  paymentId: string,
  options?: {
    orderId?: string;
    orderSnapshot?: {
      productId?: string;
      productTitle?: string;
      category?: string;
      amount?: number;
      buyerName?: string;
      buyerEmail?: string;
      buyerPhone?: string;
      deliveryType?: string;
    };
  }
): Promise<PortOneVerifyResult> {
  try {
    const { data, error } = await supabase.functions.invoke('portone-payment', {
      body: {
        action: 'verify',
        paymentId,
        ...(options?.orderId ? { orderId: options.orderId } : {}),
        ...(options?.orderSnapshot ? { orderSnapshot: options.orderSnapshot } : {}),
      },
    });
    if (error) return { ok: false, error: error.message };
    if (!data?.ok) return { ok: false, error: data?.error || '결제 검증 실패' };
    return { ok: true, status: data.status, amount: data.amount };
  } catch (err: any) {
    return { ok: false, error: err?.message || '결제 검증 요청 중 오류가 발생했습니다.' };
  }
}

/**
 * Supabase Edge Function(`portone-payment`)을 통해 포트원 V2 실제 결제·취소 내역을 조회한다. (관리자 전용)
 */
export async function fetchPortOnePaymentHistory(pageSize = 50): Promise<PortOneListResult> {
  try {
    const { data, error } = await supabase.functions.invoke('portone-payment', {
      body: { action: 'list_payments', pageSize },
    });
    if (error) return { ok: false, items: [], error: error.message };
    if (!data?.ok) return { ok: false, items: [], error: data?.error || '포트원 내역 조회 실패' };
    return { ok: true, items: Array.isArray(data.items) ? data.items : [] };
  } catch (err: any) {
    return { ok: false, items: [], error: err?.message || '포트원 내역 조회 중 오류가 발생했습니다.' };
  }
}

