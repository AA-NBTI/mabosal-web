import { SupabaseStoreService } from '../supabase/supabase-store-service.js';
/**
 * [Payment Module] 결제 서비스 (무통장 입금 + 토스페이먼츠 통합 오케스트레이터)
 *
 * 흐름
 *  - bank_transfer : 주문(pending) 생성 → 입금 신청 등록 → 관리자 입금 확인 → 주문 completed
 *  - toss_card     : 주문 초안 저장 → 토스 결제창 이동 → successUrl 복귀 → 금액 검증 → 서버 승인 → 주문 completed
 */
import { PaymentConfigStore } from './payment-config.js';
import { VoucherStore } from '../voucher/voucher-store.js';
import {
  createStoreOrder,
  getAllStoreOrders,
  getStoreProductById,
  updateStoreOrder,
} from '../../extensions/commerce-store/store-service.js';
import type { StoreOrder } from '../../extensions/commerce-store/types.js';

export interface CheckoutInput {
  userId?: string;
  productId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  method: string;
}

export type CheckoutResult =
  | { kind: 'order'; order: StoreOrder }
  | { kind: 'redirect' }
  | { kind: 'error'; message: string }
  | { kind: 'none' };

interface PaymentDraft {
  orderId: string;
  productId: string;
  amount: number;
  orderName: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  createdAt: string;
}

const DRAFT_KEY = 'mabosal_payment_drafts_v1';

function loadDrafts(): Record<string, PaymentDraft> {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
  } catch {
    return {};
  }
}
function saveDraft(d: PaymentDraft): void {
  const all = loadDrafts();
  all[d.orderId] = d;
  localStorage.setItem(DRAFT_KEY, JSON.stringify(all));
}
function removeDraft(orderId: string): void {
  const all = loadDrafts();
  delete all[orderId];
  localStorage.setItem(DRAFT_KEY, JSON.stringify(all));
}

function generateOrderId(): string {
  return 'MBS-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
}

/** 토스페이먼츠 SDK v2 어댑터 */
class TossGateway {
  static loadSdk(): Promise<any> {
    const w = window as any;
    if (w.TossPayments) return Promise.resolve(w.TossPayments);
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://js.tosspayments.com/v2/standard';
      s.onload = () => (w.TossPayments ? resolve(w.TossPayments) : reject(new Error('토스페이먼츠 SDK 초기화에 실패했습니다.')));
      s.onerror = () => reject(new Error('토스페이먼츠 SDK를 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.'));
      document.head.appendChild(s);
    });
  }

  static async requestCardPayment(clientKey: string, d: PaymentDraft): Promise<void> {
    const TossPayments = await TossGateway.loadSdk();
    const toss = TossPayments(clientKey);
    const payment = toss.payment({ customerKey: TossPayments.ANONYMOUS });
    const base = window.location.origin + window.location.pathname;
    await payment.requestPayment({
      method: 'CARD',
      amount: { currency: 'KRW', value: d.amount },
      orderId: d.orderId,
      orderName: d.orderName.slice(0, 100),
      successUrl: `${base}?view=store&payment=success`,
      failUrl: `${base}?view=store&payment=fail`,
      customerEmail: d.buyerEmail,
      customerName: d.buyerName,
      customerMobilePhone: d.buyerPhone.replace(/[^0-9]/g, ''),
    });
  }
}

export class PaymentService {
  static async checkout(input: CheckoutInput): Promise<CheckoutResult> {
    const prod = getStoreProductById(input.productId);
    if (!prod) return { kind: 'error', message: '상품 정보를 찾을 수 없습니다.' };
    const orderId = generateOrderId();

    // 1) 무통장 입금: 입금 확인 전까지는 'pending'
    if (input.method === 'bank_transfer') {
      const order = createStoreOrder({
        productId: prod.id,
        buyerName: input.buyerName,
        buyerPhone: input.buyerPhone,
        buyerEmail: input.buyerEmail,
        paymentMethod: 'bank_transfer',
        orderId,
        userId: input.userId,
        status: 'pending',
      });
            // [Supabase DB 실시간 동기화]
      SupabaseStoreService.createOrder({
        productId: prod.id,
        buyerName: input.buyerName,
        buyerPhone: input.buyerPhone,
        buyerEmail: input.buyerEmail,
        paymentMethod: 'bank_transfer',
        orderId,
      }).catch(err => console.warn('[PaymentService] Supabase sync deferred:', err));
      VoucherStore.createBankTransferRequest(input.buyerName, order.amount, prod.title, input.buyerEmail, order.orderId);
      return { kind: 'order', order };
    }

    // 2) 카드 · 간편결제 (토스페이먼츠)
    if (input.method === 'toss_card') {
      const cfg = PaymentConfigStore.get();
      if (cfg.mode === 'bank_only') return { kind: 'error', message: '현재 카드 결제는 준비 중입니다. 무통장 입금을 이용해 주세요.' };
      const invalid = PaymentConfigStore.validate(cfg);
      if (invalid) return { kind: 'error', message: `결제 설정 오류: ${invalid}` };

      const draft: PaymentDraft = {
        orderId,
        productId: prod.id,
        amount: prod.price,
        orderName: prod.title,
        buyerName: input.buyerName,
        buyerPhone: input.buyerPhone,
        buyerEmail: input.buyerEmail,
        createdAt: new Date().toISOString(),
      };
      saveDraft(draft);
      try {
        await TossGateway.requestCardPayment(cfg.clientKey, draft);
        return { kind: 'redirect' };
      } catch (e: any) {
        removeDraft(orderId);
        if (e?.code === 'USER_CANCEL') return { kind: 'error', message: '결제를 취소하셨습니다.' };
        return { kind: 'error', message: e?.message || '결제창을 여는 중 오류가 발생했습니다.' };
      }
    }

    return { kind: 'error', message: '지원하지 않는 결제수단입니다.' };
  }

  /** 토스 successUrl / failUrl 복귀 처리 */
  static async handleReturn(params: URLSearchParams): Promise<CheckoutResult> {
    const status = params.get('payment');
    if (!status) return { kind: 'none' };

    if (status === 'fail') {
      const orderId = params.get('orderId');
      if (orderId) removeDraft(orderId);
      const reason = params.get('message') || params.get('code') || '사유 미상';
      return { kind: 'error', message: `결제가 완료되지 않았습니다. (${reason})` };
    }
    if (status !== 'success') return { kind: 'none' };

    const paymentKey = params.get('paymentKey') || '';
    const orderId = params.get('orderId') || '';
    const amount = Number(params.get('amount'));

    // 새로고침 등으로 중복 처리되는 것을 방지
    const existing = getAllStoreOrders().find(o => o.orderId === orderId);
    if (existing) return { kind: 'order', order: existing };

    const draft = loadDrafts()[orderId];
    if (!draft) return { kind: 'error', message: '주문 정보를 찾을 수 없어 결제 처리를 중단했습니다.' };
    if (draft.amount !== amount) return { kind: 'error', message: '결제 금액이 주문 금액과 일치하지 않아 처리를 중단했습니다.' };

    const cfg = PaymentConfigStore.get();
    if (cfg.confirmEndpoint.trim()) {
      try {
        const res = await fetch(cfg.confirmEndpoint.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentKey, orderId, amount }),
        });
        if (!res.ok) return { kind: 'error', message: 'PG 결제 승인에 실패했습니다. 결제는 확정되지 않았습니다.' };
      } catch {
        return { kind: 'error', message: '결제 승인 서버에 연결하지 못했습니다. 결제는 확정되지 않았습니다.' };
      }
    } else if (cfg.mode === 'toss_live') {
      return { kind: 'error', message: '실거래 모드에는 서버 결제 승인 API가 필요합니다. 관리자 설정을 확인해 주세요.' };
    }
    // (테스트 모드 + 승인 서버 미설정: 가상 결제이므로 로컬에서 완료 처리)

    const order = createStoreOrder({
      productId: draft.productId,
      buyerName: draft.buyerName,
      buyerPhone: draft.buyerPhone,
      buyerEmail: draft.buyerEmail,
      paymentMethod: 'toss_card',
      orderId,
      status: 'completed',
      paymentKey,
    });
        // [Supabase DB 실시간 동기화]
    SupabaseStoreService.createOrder({
      productId: draft.productId,
      buyerName: draft.buyerName,
      buyerPhone: draft.buyerPhone,
      buyerEmail: draft.buyerEmail,
      paymentMethod: 'toss_card',
      orderId,
    }).catch(err => console.warn('[PaymentService] Supabase card sync deferred:', err));
    removeDraft(orderId);
    return { kind: 'order', order };
  }
}

// 관리자가 무통장 입금을 승인/반려하면 연결된 주문 상태를 자동 갱신
VoucherStore.onTransferApproved(t => {
  if (t.orderId) updateStoreOrder(t.orderId, { status: 'completed' });
});
VoucherStore.onTransferRejected(t => {
  if (t.orderId) updateStoreOrder(t.orderId, { status: 'cancelled' });
});
