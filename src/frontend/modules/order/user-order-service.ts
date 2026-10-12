/**
 * [UserOrderService] 회원 전용 주문 및 입금/쿠폰 데이터 서비스
 * 이용자 대시보드(마이페이지)에 표기될 본인의 주문 내역, 입금 대기 상태, 발급 바우처 코드 조회
 */
import { AuthService } from '../../state/auth-service.js';
import { supabase } from '../supabase/supabase-client.js';
import { getAllStoreOrders } from '../../extensions/commerce-store/store-service.js';
import { VoucherStore } from '../voucher/voucher-store.js';
import type { StoreOrder } from '../../extensions/commerce-store/types.js';
import type { BankTransferRequest } from '../voucher/voucher-store.js';

export interface UserOrderSummary {
  orders: StoreOrder[];
  pendingTransfers: BankTransferRequest[];
  completedOrders: StoreOrder[];
  issuedVouchers: { orderId: string; code: string; title: string; amount: number; date: string }[];
}

export class UserOrderService {
  /**
   * 현재 로그인된 회원의 모든 주문 및 결제 데이터 요약 조회
   */
    /**
   * 동기적 요약 조회 (UI 즉시 렌더링용)
   */
  static getCurrentUserOrderSummarySync(): UserOrderSummary {
    const user = AuthService.getCurrentUser();
    if (user.role === 'guest') {
      return { orders: [], pendingTransfers: [], completedOrders: [], issuedVouchers: [] };
    }

    const allLocalOrders = getAllStoreOrders();
    const userLocalOrders = allLocalOrders.filter(o => 
      (o as any).userId === user.id ||
      o.buyerEmail === user.email ||
      o.buyerName === user.name ||
      (user.phone && o.buyerPhone === user.phone)
    );

    const allTransfers = VoucherStore.getBankTransfers();
    const userTransfers = allTransfers.filter(t =>
      t.depositorName === user.name ||
      (t.orderId && userLocalOrders.some(o => o.orderId === t.orderId))
    );

    const pendingTransfers = userTransfers.filter(t => t.status === 'pending');
    const completedOrders = userLocalOrders.filter(o => o.status === 'completed');

    const issuedVouchers: { orderId: string; code: string; title: string; amount: number; date: string }[] = [];
    userLocalOrders.forEach(o => {
      if (o.status === 'completed' && (o.category === 'voucher' || o.deliveryType === 'voucher_code')) {
        let code = o.contentPayload || '';
        if (!code && o.accessUrl && o.accessUrl.includes('voucher=')) {
          code = o.accessUrl.split('voucher=')[1] || '';
        }
        if (!code) {
          const tr = userTransfers.find(t => t.orderId === o.orderId);
          if (tr && tr.appliedCouponCode) code = tr.appliedCouponCode;
        }
        if (code) {
          issuedVouchers.push({
            orderId: o.orderId,
            code,
            title: o.productTitle,
            amount: o.amount,
            date: o.paidAt ? o.paidAt.slice(0, 10) : '',
          });
        }
      }
    });

    return {
      orders: userLocalOrders,
      pendingTransfers,
      completedOrders,
      issuedVouchers,
    };
  }

  /**
   * 현재 로그인된 회원의 모든 주문 및 결제 데이터 요약 조회
   */
  static async getCurrentUserOrderSummary(): Promise<UserOrderSummary> {
    const user = AuthService.getCurrentUser();
    if (user.role === 'guest') {
      return { orders: [], pendingTransfers: [], completedOrders: [], issuedVouchers: [] };
    }

    // 1. 로컬 스토어 주문 조회 (회원 식별자 매칭)
    const allLocalOrders = getAllStoreOrders();
    const userLocalOrders = allLocalOrders.filter(o => 
      (o as any).userId === user.id ||
      o.buyerEmail === user.email ||
      o.buyerName === user.name ||
      (user.phone && o.buyerPhone === user.phone)
    );

    // 2. 무통장 입금 신청 내역 매칭
    const allTransfers = VoucherStore.getBankTransfers();
    const userTransfers = allTransfers.filter(t =>
      t.depositorName === user.name ||
      (t.orderId && userLocalOrders.some(o => o.orderId === t.orderId))
    );

    const pendingTransfers = userTransfers.filter(t => t.status === 'pending');

    // 3. 결제 완료된 주문
    const completedOrders = userLocalOrders.filter(o => o.status === 'completed');

    // 4. 발급된 상품권(바우처) 목록 추출
    const issuedVouchers: { orderId: string; code: string; title: string; amount: number; date: string }[] = [];
    userLocalOrders.forEach(o => {
      if (o.status === 'completed' && (o.category === 'voucher' || o.deliveryType === 'voucher_code')) {
        let code = o.contentPayload || '';
        if (!code && o.accessUrl && o.accessUrl.includes('voucher=')) {
          code = o.accessUrl.split('voucher=')[1] || '';
        }
        if (!code) {
          // transfer에서 발급된 코드 확인
          const tr = userTransfers.find(t => t.orderId === o.orderId);
          if (tr && tr.appliedCouponCode) code = tr.appliedCouponCode;
        }
        if (code) {
          issuedVouchers.push({
            orderId: o.orderId,
            code,
            title: o.productTitle,
            amount: o.amount,
            date: o.paidAt ? o.paidAt.slice(0, 10) : '',
          });
        }
      }
    });

    // 5. [Supabase 비동기 보강 (선택적 동기화)]
    try {
      const { data: dbOrders } = await supabase
        .from('orders')
        .select('*')
        .or(`user_id.eq.${user.id},buyer_email.eq.${user.email}`)
        .order('created_at', { ascending: false });

      if (dbOrders && dbOrders.length > 0) {
        dbOrders.forEach((dbo: any) => {
          if (!userLocalOrders.some(lo => lo.orderId === dbo.id)) {
            userLocalOrders.push({
              orderId: dbo.id,
              productId: dbo.product_id,
              productTitle: dbo.product_title,
              category: dbo.category,
              amount: dbo.amount,
              buyerName: dbo.buyer_name,
              buyerEmail: dbo.buyer_email,
              buyerPhone: dbo.buyer_phone,
              paymentMethod: dbo.payment_method,
              status: dbo.status,
              paidAt: dbo.paid_at || '',
              deliveryType: dbo.delivery_type,
              accessUrl: dbo.access_url || '',
              contentPayload: dbo.content_payload || '',
            });
          }
        });
      }
    } catch (e) {
      console.warn('[UserOrderService] Supabase fetch deferred:', e);
    }

    return {
      orders: userLocalOrders,
      pendingTransfers,
      completedOrders,
      issuedVouchers,
    };
  }
}
