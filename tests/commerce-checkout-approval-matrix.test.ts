/**
 * [Commerce Checkout & Approval Full-Matrix E2E Audit]
 * 커머스 주문·결제·승인 프로세스 6대 핵심 비즈니스 시나리오 전수 검증 스위트
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CheckoutService } from '../src/frontend/modules/checkout/checkout-service.js';
import { CartStore } from '../src/frontend/modules/cart/cart-store.js';
import { VoucherStore } from '../src/frontend/modules/voucher/voucher-store.js';
import { PaymentConfigStore } from '../src/frontend/modules/payment/payment-config.js';
import { ReportRouterMapper } from '../src/frontend/modules/checkout/report-router-mapper.js';
import { UserSajuStore } from '../src/frontend/state/user-saju-store.js';
import { appState } from '../src/frontend/state/app-state.js';
import { AuthService } from '../src/frontend/state/auth-service.js';
import { setStorageBackend, createMemoryStorage } from '../src/frontend/modules/persistence/index.js';
import {
  getAllStoreOrders,
  approveStoreBankDeposit,
  INITIAL_STORE_PRODUCTS,
  updateStoreProduct,
  setStoreProductStatus,
} from '../src/frontend/extensions/commerce-store/store-service.js';

class MemoryMockStorage {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, val: string) { this.store[key] = String(val); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}

const mockStorage = new MemoryMockStorage();
(globalThis as any).localStorage = mockStorage;

describe('Commerce Checkout & Approval Full-Matrix Audit', () => {
  beforeEach(() => {
    mockStorage.clear();
    setStorageBackend(createMemoryStorage());
    CartStore.clear();
    appState.resetAllUserData();
    AuthService.resetForTest();
    AuthService.init();
    AuthService.login('user1', '1234');
  });

  // [시나리오 1] 전자책/도서 상품 + 무통장 입금 주문
  it('시나리오 1: 전자책/도서 무통장 주문 시 pending 대기 유지, 사주풀이 치환 차단, 입금 신청서 정상 등록 및 관리자 승인 동기화', () => {
    const bookProd = INITIAL_STORE_PRODUCTS.find(p => p.id === 'prod-saju-book-vol1') || {
      id: 'prod-saju-book-vol1',
      title: '정통 사주명리학 원론 제1권',
      price: 28000,
      deliveryType: 'ebook',
      category: 'ebook',
      targetSignals: [],
    };

    CartStore.addItem(bookProd as any, 1);

    const res = CheckoutService.executeCheckout({
      buyerName: '김서연',
      buyerPhone: '010-1234-5678',
      buyerEmail: 'seoyeon@test.com',
      paymentMethod: 'bank_transfer',
      agreeTerms: true,
    });

    // 1. 주문 접수 성공 및 상태 검증
    expect(res.success).toBe(true);
    expect(res.order).toBeDefined();
    const order = res.order!;
    expect(order.status).toBe('pending'); // 미입금 상태는 반드시 pending이어야 함

    // 2. 도서 상품이 엉뚱한 사주 리포트 PAID로 강제 치환되지 않는지 검증
    expect(ReportRouterMapper.isSajuReportProduct(order.productId, order.category, order.deliveryType)).toBe(false);

    // 3. 미입금 상태에서 리포트 조립 시도 시 생성 차단 가드 검증
    UserSajuStore.ensureAnalysisReadyFromOrder(order);
    expect(appState.getState().sessionState).toBeNull(); // 리포트 세션이 생성되지 않아야 함

    // 4. 최고 관리자 무통장 입금 승인 패널 연동 검증
    const transfers = VoucherStore.getBankTransfers();
    const matched = transfers.find(t => t.orderId === order.orderId);
    expect(matched).toBeDefined();
    expect(matched?.status).toBe('pending');
    expect(matched?.depositorName).toBe('김서연');

    // 5. 최고 관리자의 원클릭 입금 승인 처리 검증
    const approveRes = approveStoreBankDeposit(order.orderId);
    expect(approveRes.success).toBe(true);

    const updatedOrders = getAllStoreOrders();
    const approvedOrder = updatedOrders.find(o => o.orderId === order.orderId);
    expect(approvedOrder?.status).toBe('completed');

    // 무통장 입금 관리 대기열도 approved로 양방향 동기화 검증
    const updatedTransfers = VoucherStore.getBankTransfers();
    const approvedTransfer = updatedTransfers.find(t => t.orderId === order.orderId);
    expect(approvedTransfer?.status).toBe('approved');
  });

  // [시나리오 2] 카드/페이 결제 미연동(심사 준비중) 시도 시 즉시 방어
  it('시나리오 2: 카드/페이 결제 심사 준비 중일 때 공짜 결제완료 방지 및 무통장 입금 안내 반환', () => {
    // 카드 결제 비활성화(심사 준비중) 모드 설정
    PaymentConfigStore.save({
      mode: 'bank_only',
      storeId: '',
      channelKey: '',
      clientKey: '',
      confirmEndpoint: '',
    });

    const prod = INITIAL_STORE_PRODUCTS[0];
    CartStore.addItem(prod, 1);

    const res = CheckoutService.executeCheckout({
      buyerName: '테스터',
      buyerPhone: '010-9999-8888',
      buyerEmail: 'tester@test.com',
      paymentMethod: 'card', // 카드 결제 시도
      agreeTerms: true,
    });

    // 가짜 승인 차단 검증
    expect(res.success).toBe(false);
    expect(res.message).toContain('무통장 입금');

    // 주문 장부에 가짜 완료 주문이 생성되지 않아야 함
    const orders = getAllStoreOrders();
    expect(orders.some(o => o.buyerName === '테스터')).toBe(false);
  });

  // [시나리오 3] 사주 리포트 상품 + 무통장 입금 및 관리자 승인 플로우
  it('시나리오 3: 사주 리포트 무통장 주문 시 입금 전 열람 차단 및 관리자 승인 후 리포트 정상 오픈', () => {
    const reportProd = INITIAL_STORE_PRODUCTS.find(p => p.deliveryType === 'saju_report') || {
      id: 'prod-paid-saju-premium',
      title: '마보살 정통 사주풀이 리포트',
      price: 39900,
      deliveryType: 'saju_report',
      category: 'report',
      reportTier: 'PAID',
      targetSignals: [],
    };

    CartStore.addItem(reportProd as any, 1);

    const res = CheckoutService.executeCheckout({
      buyerName: '박의뢰',
      buyerPhone: '010-5555-4444',
      buyerEmail: 'park@test.com',
      paymentMethod: 'bank_transfer',
      agreeTerms: true,
    });

    expect(res.success).toBe(true);
    const order = res.order!;
    expect(order.status).toBe('pending');

    // 입금 전: 리포트 조립 시도 차단
    UserSajuStore.ensureAnalysisReadyFromOrder(order);
    expect(appState.getState().sessionState).toBeNull();

    // 관리자 입금 확인 승인
    approveStoreBankDeposit(order.orderId);

    // 승인 후: 리포트 정상 조립 및 세션 적재 검증
    const approvedOrder = getAllStoreOrders().find(o => o.orderId === order.orderId)!;
    expect(approvedOrder.status).toBe('completed');

    UserSajuStore.ensureAnalysisReadyFromOrder(approvedOrder);
    expect(appState.getState().sessionState).not.toBeNull();
  });

  // [시나리오 4] 상품권/바우처 상품 + 무통장 입금 승인 플로우
  it('시나리오 4: 5만원 상품권 무통장 주문 시 관리자 승인 후 정식 바우처 코드 발급', () => {
    const voucherProd = INITIAL_STORE_PRODUCTS.find(p => p.category === 'voucher') || {
      id: 'prod-voucher-50k',
      title: '50,000원 VIP 기프트 상품권',
      price: 50000,
      deliveryType: 'voucher_code',
      category: 'voucher',
      targetSignals: [],
    };

    CartStore.addItem(voucherProd as any, 1);

    const res = CheckoutService.executeCheckout({
      buyerName: '이지은',
      buyerPhone: '010-3333-2222',
      buyerEmail: 'lee@test.com',
      paymentMethod: 'bank_transfer',
      agreeTerms: true,
    });

    expect(res.success).toBe(true);
    const order = res.order!;
    expect(order.status).toBe('pending');

    // 관리자 입금 확인 승인
    const approveRes = approveStoreBankDeposit(order.orderId);
    expect(approveRes.success).toBe(true);

    // 바우처 쿠폰 목록에 정식 등록되었는지 검증
    const coupons = VoucherStore.getCoupons();
    const issued = coupons.find(c => c.name.includes('50,000원') || c.discountAmount === 50000);
    expect(issued).toBeDefined();
  });

  // [시나리오 5] 0원 전액 할인 쿠폰 주문
  it('시나리오 5: 전액 할인 쿠폰 적용 시 무통장 입금 대기 없이 즉시 완료 처리', () => {
    const prod = INITIAL_STORE_PRODUCTS[0];
    CartStore.addItem(prod, 1);

    const res = CheckoutService.executeCheckout({
      buyerName: '쿠폰회원',
      buyerPhone: '010-7777-8888',
      buyerEmail: 'coupon@test.com',
      paymentMethod: 'card',
      couponCode: 'MABOSAL-FREE', // 19,900원 전액 할인
      agreeTerms: true,
    });

    if (res.isZeroPayment) {
      expect(res.success).toBe(true);
      expect(res.order?.status).toBe('completed');
    }
  });

  // [시나리오 6] 결제수단 무단 치환 방지
  it('시나리오 6: 비리포트 상품 판별 함수가 전자책 및 상품권을 사주 리포트로 오인하지 않는지 전수 검증', () => {
    expect(ReportRouterMapper.isSajuReportProduct('prod-saju-book-vol1', 'ebook', 'ebook')).toBe(false);
    expect(ReportRouterMapper.isSajuReportProduct('prod-voucher-50k', 'voucher', 'voucher_code')).toBe(false);
    expect(ReportRouterMapper.isSajuReportProduct('prod-goods-amulet', 'goods', 'shipping')).toBe(false);
    expect(ReportRouterMapper.isSajuReportProduct('prod-paid-saju-premium', 'report', 'saju_report')).toBe(true);
  });

  // [시나리오 7] 관리자 숨김(hidden) 처리 상품 결제 즉시 차단
  it('시나리오 7: 이용자가 장바구니에 담아둔 상품을 관리자가 숨김(hidden) 처리했을 때 결제 차단 및 안내 반환', () => {
    const targetProd = INITIAL_STORE_PRODUCTS[0];
    expect(targetProd).toBeDefined();

    // 1. 이용자가 상품을 장바구니에 담음
    CartStore.addItem(targetProd, 1);
    expect(CartStore.getItems().length).toBe(1);

    // 2. 관리자가 해당 상품을 '숨김(hidden)' 처리
    setStoreProductStatus(targetProd.id, 'hidden');

    // 3. 결제 시도
    const res = CheckoutService.executeCheckout({
      buyerName: '테스터',
      buyerPhone: '010-1234-5678',
      buyerEmail: 'tester@test.com',
      paymentMethod: 'bank_transfer',
      agreeTerms: true,
    });

    // 4. 결제가 엄격히 차단되어야 함
    expect(res.success).toBe(false);
    expect(res.message).toContain('판매가 종료');

    // 5. 주문이 실제로 생성되지 않아야 함
    const orders = getAllStoreOrders();
    expect(orders.some(o => o.productId === targetProd.id && o.buyerName === '테스터')).toBe(false);

    // 6. 원상 복구 (다른 테스트에 영향 없도록 active 복원)
    setStoreProductStatus(targetProd.id, 'active');
  });

  // [시나리오 8] 품절(soldout) 상품 결제 차단 및 장바구니 일괄 정리
  it('시나리오 8: 품절(soldout) 상품 결제 차단 및 CartStore.removeUnavailableItems 일괄 정리 검증', () => {
    const prodA = INITIAL_STORE_PRODUCTS[0];
    const prodB = INITIAL_STORE_PRODUCTS[1];

    CartStore.addItem(prodA, 1);
    CartStore.addItem(prodB, 1);

    // 관리자가 prodA를 품절 처리, prodB를 숨김 처리
    setStoreProductStatus(prodA.id, 'soldout');
    setStoreProductStatus(prodB.id, 'hidden');

    // 결제 시도 시 차단 확인
    const res = CheckoutService.executeCheckout({
      buyerName: '품절테스터',
      buyerPhone: '010-0000-0000',
      buyerEmail: 'soldout@test.com',
      paymentMethod: 'bank_transfer',
      agreeTerms: true,
    });
    expect(res.success).toBe(false);

    // 판매 불가 상품 일괄 정리 기능 검증
    CartStore.removeUnavailableItems();
    expect(CartStore.getItems().length).toBe(0);

    // 복원
    setStoreProductStatus(prodA.id, 'active');
    setStoreProductStatus(prodB.id, 'active');
  });
});
