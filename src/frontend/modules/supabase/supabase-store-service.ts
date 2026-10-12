import { supabase } from './supabase-client.js';
import type { StoreProduct, StoreOrder } from '../../extensions/commerce-store/types.js';
import type { VoucherCoupon, BankTransferRequest } from '../voucher/voucher-store.js';

/**
 * Supabase DB 기반 스토어, 주문, 무통장 입금 및 쿠폰 비즈니스 서비스
 */
export class SupabaseStoreService {

  // 1. 상품 목록 조회 (DB 우선, 실패 시 fallback)
  static async getProducts(): Promise<StoreProduct[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('status', ['active', 'soldout'])
        .order('sales_count', { ascending: false });

      if (error || !data || data.length === 0) {
        return [];
      }

      return data.map((p: any) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        price: p.price,
        originalPrice: p.original_price,
        tagLine: p.tag_line,
        description: p.description,
        detailsHtml: p.details_html,
        thumbnailUrl: p.thumbnail_url,
        thumbnailIcon: p.thumbnail_icon,
        deliveryType: p.delivery_type,
        contentPayload: p.content_payload || '/?view=report',
        targetSignals: p.target_signals || [],
        status: p.status,
        badge: p.badge,
        reportTier: p.report_tier,
        salesCount: p.sales_count,
        createdAt: p.created_at,
      }));
    } catch (e) {
      console.warn('[SupabaseStoreService] getProducts error:', e);
      return [];
    }
  }

  // 2. 주문 생성 (create_order RPC 호출 또는 직접 insert)
  static async createOrder(orderInput: {
    productId: string;
    buyerName: string;
    buyerPhone: string;
    buyerEmail: string;
    paymentMethod: string;
    orderId?: string;
  }): Promise<{ success: boolean; order?: any; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('create_order', {
        p_product_id: orderInput.productId,
        p_buyer_name: orderInput.buyerName,
        p_buyer_phone: orderInput.buyerPhone,
        p_buyer_email: orderInput.buyerEmail,
        p_method: orderInput.paymentMethod === 'card' || orderInput.paymentMethod === 'toss_card' ? 'toss_card' : 'bank_transfer',
        p_order_id: orderInput.orderId || null,
      });

      if (error) {
        console.warn('[SupabaseStoreService] create_order RPC failed, trying fallback insert:', error);
        // Fallback: orders 테이블에 직접 insert
        const newOrderId = orderInput.orderId || 'MBS-' + Date.now().toString(36).toUpperCase();
        const { data: directData, error: directErr } = await supabase
          .from('orders')
          .insert({
            id: newOrderId,
            product_id: orderInput.productId,
            product_title: '마보살 사주풀이 상품',
            category: 'report',
            amount: 39900,
            buyer_name: orderInput.buyerName,
            buyer_email: orderInput.buyerEmail,
            buyer_phone: orderInput.buyerPhone,
            payment_method: orderInput.paymentMethod === 'card' || orderInput.paymentMethod === 'toss_card' ? 'toss_card' : 'bank_transfer',
            status: 'pending',
            delivery_type: 'saju_report',
          })
          .select()
          .single();

        if (directErr) {
          return { success: false, error: directErr.message };
        }
        return { success: true, order: directData };
      }

      return { success: true, order: data };
    } catch (e: any) {
      return { success: false, error: e?.message || '주문 생성 중 오류가 발생했습니다.' };
    }
  }

  // 3. 무통장 입금 신청 목록 조회
  static async getBankTransfers(): Promise<BankTransferRequest[]> {
    try {
      const { data, error } = await supabase
        .from('bank_transfers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((t: any) => ({
        id: t.id,
        orderId: t.order_id,
        depositorName: t.depositor_name,
        requestedAmount: t.requested_amount,
        targetProduct: t.target_product,
        status: t.status,
        appliedCouponCode: t.applied_coupon_code,
        userIdentifier: t.depositor_name,
        bankInfo: '기업은행 103-123733-04-012 (템바보드 주식회사)',
        createdAt: t.created_at ? t.created_at.replace('T', ' ').slice(0, 19) : '',
        approvedAt: t.approved_at ? t.approved_at.replace('T', ' ').slice(0, 19) : '',
        memo: t.memo || '',
      }));
    } catch (e) {
      console.warn('[SupabaseStoreService] getBankTransfers error:', e);
      return [];
    }
  }

  // 4. 관리자 무통장 입금 승인 (admin_approve_bank_transfer RPC)
  static async approveBankTransfer(transferId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc('admin_approve_bank_transfer', {
        p_transfer_id: transferId,
      });

      if (error) {
        // Fallback: 직접 update
        const { error: updErr } = await supabase
          .from('bank_transfers')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
            memo: '관리자 승인 완료',
          })
          .eq('id', transferId);

        if (updErr) {
          return { success: false, message: updErr.message };
        }
        return { success: true, message: '무통장 입금이 성공적으로 승인되었습니다.' };
      }

      return { success: true, message: '입금이 확인되어 결제완료 및 승인 처리되었습니다.' };
    } catch (e: any) {
      return { success: false, message: e?.message || '승인 처리 실패' };
    }
  }

  // 5. 관리자 무통장 입금 반려
  static async rejectBankTransfer(transferId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc('admin_reject_bank_transfer', {
        p_transfer_id: transferId,
      });

      if (error) {
        await supabase
          .from('bank_transfers')
          .update({ status: 'rejected', memo: '입금 미확인 반려' })
          .eq('id', transferId);
      }
      return { success: true, message: '무통장 입금 신청이 반려되었습니다.' };
    } catch (e: any) {
      return { success: false, message: e?.message || '반려 처리 실패' };
    }
  }

  // 6. 쿠폰 목록 조회
  static async getCoupons(): Promise<VoucherCoupon[]> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((c: any) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        type: c.type,
        discountAmount: c.discount_amount,
        discountRate: c.discount_rate,
        targetProduct: c.target_product,
        minOrderAmount: c.min_order_amount,
        expiryDate: c.expiry_date,
        usedCount: c.used_count || 0,
        usageLimit: c.usage_limit,
        enabled: c.enabled,
        createdAt: c.created_at ? c.created_at.slice(0, 10) : '',
      }));
    } catch (e) {
      console.warn('[SupabaseStoreService] getCoupons error:', e);
      return [];
    }
  }

  // 7. 쿠폰 생성
  static async createCoupon(coupon: Omit<VoucherCoupon, 'id' | 'usedCount' | 'createdAt'>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('coupons')
        .insert({
          code: coupon.code.trim().toUpperCase(),
          name: coupon.name,
          type: coupon.type,
          discount_amount: coupon.discountAmount,
          discount_rate: coupon.discountRate,
          target_product: coupon.targetProduct || 'all',
          expiry_date: coupon.expiryDate || null,
          enabled: coupon.enabled,
        });

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || '쿠폰 생성 실패' };
    }
  }
}
