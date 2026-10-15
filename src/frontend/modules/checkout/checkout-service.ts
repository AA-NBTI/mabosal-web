/**
 * CheckoutService - 정식 쇼핑몰 주문 및 결제 오케스트레이터
 */
import { CartStore } from '../cart/cart-store.js';
import { CartItem } from '../cart/types.js';
import { StoreOrder, StoreOrderItem } from '../../extensions/commerce-store/types.js';
import { getAllStoreOrders } from '../../extensions/commerce-store/store-service.js';
import { ReportRouterMapper } from './report-router-mapper.js';
import { AuthService } from '../../state/auth-service.js';

export interface CheckoutPayload {
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  paymentMethod: 'card' | 'kakaopay' | 'tosspay' | 'transfer' | 'bank_transfer' | 'voucher';
  shippingAddress?: string;
  shippingMemo?: string;
  couponCode?: string;
  usedYeop?: number;
  agreeTerms: boolean;
  selectedItems?: CartItem[];
}

export interface CheckoutResult {
  success: boolean;
  message: string;
  order?: StoreOrder;
  isZeroPayment?: boolean;
}

const STORAGE_ORDERS_KEY = 'mabosal_store_orders';

export class CheckoutService {
  /**
   * 주문 전 쿠폰 유효성 검사 및 할인액 계산
   */
  public static calculateDiscount(couponCode: string | undefined, totalProductAmount: number): { discountAmount: number; couponValid: boolean; message: string } {
    if (!couponCode) {
      return { discountAmount: 0, couponValid: false, message: '' };
    }
    const cleanCode = couponCode.trim().toUpperCase();

    if (cleanCode === 'MABOSAL-FREE') {
      return {
        discountAmount: Math.min(totalProductAmount, 19900),
        couponValid: true,
        message: '런칭 기념 19,900원 전액 할인 쿠폰이 적용되었습니다.',
      };
    }

    if (cleanCode === 'MABOSAL-10K' || cleanCode.includes('10000')) {
      return {
        discountAmount: Math.min(totalProductAmount, 10000),
        couponValid: true,
        message: '10,000원 할인 쿠폰이 적용되었습니다.',
      };
    }

    if (cleanCode === 'VIP-FREE') {
      return {
        discountAmount: totalProductAmount,
        couponValid: true,
        message: 'VIP 전액 지원 쿠폰이 적용되었습니다.',
      };
    }

    return {
      discountAmount: 0,
      couponValid: false,
      message: '유효하지 않거나 만료된 쿠폰 코드입니다.',
    };
  }

  /**
   * 주문서 제출 및 주문 생성 처리
   */
  public static executeCheckout(payload: CheckoutPayload): CheckoutResult {
    const items = (payload.selectedItems && payload.selectedItems.length > 0)
      ? payload.selectedItems
      : CartStore.getSelectedItems();

    if (items.length === 0) {
      return { success: false, message: '주문할 상품이 선택되지 않았습니다.' };
    }

    if (!payload.agreeTerms) {
      return { success: false, message: '구매 조건 및 전자상거래 이용 약관에 동의해 주셔야 결제가 진행됩니다.' };
    }

    if (!payload.buyerName?.trim()) {
      return { success: false, message: '주문자 성함을 입력해 주세요.' };
    }

    if (!payload.buyerPhone?.trim()) {
      return { success: false, message: '주문자 연락처(휴대폰 번호)를 입력해 주세요.' };
    }

    const hasPhysical = items.some(it => it.deliveryType === 'shipping' || it.category === 'goods');
    if (hasPhysical && !payload.shippingAddress?.trim()) {
      return { success: false, message: '실물 배송 상품이 포함되어 있습니다. 배송받으실 주소를 정확히 입력해 주세요.' };
    }

    // 금액 계산
    const productAmount = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const shippingFee = hasPhysical ? (productAmount >= 50000 ? 0 : 3000) : 0;

    const discountRes = this.calculateDiscount(payload.couponCode, productAmount);
    const couponDiscount = discountRes.discountAmount;

    // 엽전 차감
    const currentUser = AuthService.getCurrentUser();
    let usedYeop = 0;
    if (payload.usedYeop && payload.usedYeop > 0) {
      usedYeop = Math.min(payload.usedYeop, currentUser.yeopBalance || 0, Math.max(0, productAmount - couponDiscount));
      // 엽전 잔액 차감 반영
      if (usedYeop > 0 && typeof (AuthService as any).deductYeop === 'function') {
        (AuthService as any).deductYeop(usedYeop, '스토어 상품 주문 결제');
      }
    }

    const totalPayAmount = Math.max(0, productAmount + shippingFee - couponDiscount - usedYeop);
    const isZeroPayment = totalPayAmount === 0;

    // 대표 품목 및 타이틀 생성
    const primaryItem = items[0];
    const orderTitle = items.length === 1 
      ? primaryItem.title 
      : `${primaryItem.title} 외 ${items.length - 1}건`;

    // OrderItems 정규화
    const orderItems: StoreOrderItem[] = items.map(it => ({
      productId: it.productId,
      title: it.title,
      price: it.price,
      quantity: it.quantity,
      deliveryType: it.deliveryType,
      thumbnailUrl: it.thumbnailUrl,
      sajuSnapshot: it.sajuSnapshot,
      reportTier: it.reportTier || ReportRouterMapper.resolveTier(it.productId, it.reportTier),
      contentPayload: it.contentPayload,
    }));

    // 티어 결정 (첫 번째 리포트 아이템 기준)
    const reportItem = items.find(it => it.deliveryType === 'saju_report' || it.category === 'report');
    const primaryTier = ReportRouterMapper.resolveTier(reportItem?.productId || primaryItem.productId, reportItem?.reportTier);

    const orderId = 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 5).toUpperCase();

    const newOrder: StoreOrder = {
      orderId,
      productId: primaryItem.productId,
      productTitle: orderTitle,
      category: primaryItem.category as any,
      amount: totalPayAmount,
      buyerName: payload.buyerName.trim(),
      buyerPhone: payload.buyerPhone.trim(),
      buyerEmail: payload.buyerEmail?.trim() || (currentUser.role !== 'guest' ? currentUser.email : 'user@mabosal.com'),
      paymentMethod: payload.paymentMethod,
      status: (isZeroPayment || payload.paymentMethod === 'card' || payload.paymentMethod === 'kakaopay' || payload.paymentMethod === 'tosspay') ? 'completed' : 'pending',
      paidAt: new Date().toISOString(),
      deliveryType: primaryItem.deliveryType,
      accessUrl: '/?view=result',
      sajuInput: primaryItem.sajuSnapshot,
      reportTier: primaryTier,
      items: orderItems,
      shippingAddress: payload.shippingAddress?.trim(),
      shippingMemo: payload.shippingMemo?.trim(),
      shippingFee,
      appliedCouponCode: payload.couponCode?.trim(),
      discountAmount: couponDiscount + usedYeop,
      usedYeop,
      userId: currentUser.role !== 'guest' ? currentUser.id : undefined,
    };

    // 주문 저장
    const allOrders = getAllStoreOrders();
    allOrders.unshift(newOrder);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(allOrders.slice(0, 500)));
    }

    // 장바구니에서 주문된 품목들 삭제
    CartStore.removeSelectedItems();

    return {
      success: true,
      message: isZeroPayment 
        ? '쿠폰/적립금 전액 차감으로 0원에 주문이 즉시 완료되었습니다.' 
        : '주문이 성공적으로 접수되었습니다.',
      order: newOrder,
      isZeroPayment,
    };
  }
}
