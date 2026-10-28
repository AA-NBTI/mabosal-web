import { SupabaseStoreService } from '../supabase/supabase-store-service.js';
/**
 * [Payment Module] 결제 서비스 (무통장 입금 + 포트원 PortOne V2 통합 오케스트레이터)
 *
 * 흐름:
 *  - bank_transfer : 주문(pending) 생성 → 입금 신청 등록 → 관리자 입금 확인 → 주문 completed
 *  - portone_card  : 주문 초안 저장 → 포트원 V2 모달/팝업 결제창 호출 → 성공 콜백/사후검증 → 주문 completed
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

const DRAFT_KEY = 'mabosal_payment_drafts_v2';

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

/** 포트원(PortOne V2) SDK 브라우저 어댑터 */
class PortOneGateway {
  static loadSdk(): Promise<any> {
    const w = window as any;
    if (w.PortOne) return Promise.resolve(w.PortOne);
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.portone.io/v2/browser-sdk.js';
      s.async = true;
      s.onload = () => {
        if (w.PortOne) resolve(w.PortOne);
        else reject(new Error('포트원(PortOne) SDK 초기화에 실패했습니다.'));
      };
      s.onerror = () => reject(new Error('포트원(PortOne) SDK를 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.'));
      document.head.appendChild(s);
    });
  }

  static async requestPayment(cfg: { storeId: string; channelKey: string }, d: PaymentDraft): Promise<any> {
    const PortOne = await PortOneGateway.loadSdk();
    const base = window.location.origin + window.location.pathname;

    const res = await PortOne.requestPayment({
      storeId: cfg.storeId,
      channelKey: cfg.channelKey,
      paymentId: d.orderId,
      orderName: d.orderName.slice(0, 100),
      totalAmount: d.amount,
      currency: 'CURRENCY_KRW',
      payMethod: 'CARD',
      customer: {
        fullName: d.buyerName,
        phoneNumber: d.buyerPhone.replace(/[^0-9]/g, ''),
        email: d.buyerEmail,
      },
      redirectUrl: `${base}?view=store&payment=success&orderId=${d.orderId}`,
    });

    return res;
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

    // 2) 카드 · 간편결제 (포트원 PortOne)
    if (input.method === 'card' || input.method === 'portone_card' || input.method === 'toss_card') {
      const cfg = PaymentConfigStore.get();
      if (cfg.mode === 'bank_only') {
        return { kind: 'error', message: '현재 온라인 전자결제는 준비 중입니다. [무통장 입금]을 이용해 주세요.' };
      }
      const invalid = PaymentConfigStore.validate(cfg);
      if (invalid) return { kind: 'error', message: `결제 연동 설정 오류: ${invalid}` };

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
        const response = await PortOneGateway.requestPayment(
          { storeId: cfg.storeId, channelKey: cfg.channelKey },
          draft
        );

        // 포트원 응답 처리: code가 있으면 오류 또는 사용자 취소
        if (response && response.code != null) {
          removeDraft(orderId);
          if (response.code === 'FAILURE_TYPE_PG' && response.message?.includes('취소')) {
            return { kind: 'error', message: '고객님께서 결제를 취소하셨습니다.' };
          }
          return { kind: 'error', message: response.message || `결제 실패 (${response.code})` };
        }

        // 결제 성공 처리
        const order = createStoreOrder({
          productId: draft.productId,
          buyerName: draft.buyerName,
          buyerPhone: draft.buyerPhone,
          buyerEmail: draft.buyerEmail,
          paymentMethod: 'portone_card',
          orderId,
          status: 'completed',
          paymentKey: response?.paymentId || orderId,
        });

        // Supabase 주문 동기화
        SupabaseStoreService.createOrder({
          productId: draft.productId,
          buyerName: draft.buyerName,
          buyerPhone: draft.buyerPhone,
          buyerEmail: draft.buyerEmail,
          paymentMethod: 'portone_card',
          orderId,
        }).catch(err => console.warn('[PaymentService] Supabase card sync deferred:', err));

        removeDraft(orderId);
        return { kind: 'order', order };
      } catch (e: any) {
        removeDraft(orderId);
        return { kind: 'error', message: e?.message || '포트원 결제창을 여는 중 오류가 발생했습니다.' };
      }
    }

    return { kind: 'error', message: '지원하지 않는 결제수단입니다.' };
  }

  /** 포트원 모바일 리다이렉트 복귀 처리 (필요시) */
  static async handleReturn(params: URLSearchParams): Promise<CheckoutResult> {
    const status = params.get('payment');
    if (!status) return { kind: 'none' };

    const orderId = params.get('orderId') || '';
    if (status === 'fail') {
      if (orderId) removeDraft(orderId);
      const reason = params.get('message') || '사유 미상';
      return { kind: 'error', message: `결제가 완료되지 않았습니다. (${reason})` };
    }
    if (status !== 'success') return { kind: 'none' };

    const existing = getAllStoreOrders().find(o => o.orderId === orderId);
    if (existing) return { kind: 'order', order: existing };

    const draft = loadDrafts()[orderId];
    if (!draft) return { kind: 'error', message: '주문 정보를 찾을 수 없어 결제 처리를 중단했습니다.' };

    const order = createStoreOrder({
      productId: draft.productId,
      buyerName: draft.buyerName,
      buyerPhone: draft.buyerPhone,
      buyerEmail: draft.buyerEmail,
      paymentMethod: 'portone_card',
      orderId,
      status: 'completed',
      paymentKey: orderId,
    });

    SupabaseStoreService.createOrder({
      productId: draft.productId,
      buyerName: draft.buyerName,
      buyerPhone: draft.buyerPhone,
      buyerEmail: draft.buyerEmail,
      paymentMethod: 'portone_card',
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
