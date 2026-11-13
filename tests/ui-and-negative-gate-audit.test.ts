import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../src/frontend/state/auth-service.js';
import { appState } from '../src/frontend/state/app-state.js';
import { UserSajuStore } from '../src/frontend/state/user-saju-store.js';
import { CartStore } from '../src/frontend/modules/cart/cart-store.js';
import { CheckoutService } from '../src/frontend/modules/checkout/checkout-service.js';
import { INITIAL_STORE_PRODUCTS } from '../src/frontend/extensions/commerce-store/store-service.js';
import {
  selectStoreProduct,
  renderCommerceStoreView,
} from '../src/frontend/extensions/commerce-store/ui-store-view.js';
import { renderCartModal } from '../src/frontend/components/CartAndReviewModal.js';
import { renderCartBoardView } from '../src/frontend/modules/cart/CartBoardView.js';
import { renderCheckoutBoardView } from '../src/frontend/modules/checkout/CheckoutBoardView.js';
import { FunnelCheckoutHelper } from '../src/frontend/views/pages/FunnelCheckoutHelper.js';
import { setStorageBackend, createMemoryStorage } from '../src/frontend/modules/persistence/index.js';

class MemoryMockStorage {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, val: string) { this.store[key] = String(val); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}

const mockStorage = new MemoryMockStorage();
(globalThis as any).localStorage = mockStorage;

describe('UI Consistency & Negative Gate Audit', () => {
  beforeEach(() => {
    mockStorage.clear();
    setStorageBackend(createMemoryStorage());
    CartStore.clear();
    appState.resetAllUserData();
    AuthService.resetForTest();
    AuthService.init();
  });

  it('사주 미등록/등록 전환 시 스토어·장바구니모달·장바구니·주문서·퍼널 UI 5곳이 동일하게 동작한다', async () => {
    await AuthService.register({
      username: 'ui_consistency_user',
      password: 'password123',
      passwordConfirm: 'password123',
      name: '일관성테스터',
      role: 'user',
    });

    const reportProd = INITIAL_STORE_PRODUCTS.find(p => p.deliveryType === 'saju_report')!;
    selectStoreProduct(reportProd.id, false);
    CartStore.addItem(reportProd, 1);

    // 1. 사주 미등록 상태: 5곳 모두 '미등록' 표시 & '등록 완료' 미노출 & 결제 버튼 비활성화
    const storeHtmlBefore = renderCommerceStoreView(appState.getState());
    const modalHtmlBefore = renderCartModal();
    const cartHtmlBefore = renderCartBoardView();
    const checkoutHtmlBefore = renderCheckoutBoardView();
    const funnelHtmlBefore = FunnelCheckoutHelper.renderCheckoutModal();

    expect(storeHtmlBefore).toContain('미등록');
    expect(storeHtmlBefore).not.toContain('등록 완료');

    expect(modalHtmlBefore).toContain('미등록');
    expect(modalHtmlBefore).not.toContain('등록 완료');

    expect(cartHtmlBefore).toContain('미등록');
    expect(cartHtmlBefore).not.toContain('등록 완료');

    expect(checkoutHtmlBefore).toContain('미등록');
    expect(checkoutHtmlBefore).not.toContain('등록 완료');
    expect(checkoutHtmlBefore).toContain('id="btn-submit-final-order" disabled');

    expect(funnelHtmlBefore).toContain('미등록');
    expect(funnelHtmlBefore).toContain('id="btn-confirm-funnel-pay" disabled');

    // 2. 사주 등록 + 동기화 후: 5곳 모두 '등록 완료' 전환 및 결제 버튼 활성화
    UserSajuStore.syncUserSajuProfile({
      userName: '일관성테스터',
      birthDate: '1990-08-15',
      birthTime: '09:30',
      gender: 'female',
      calendarType: 'solar',
    });
    CartStore.syncSajuProfile(UserSajuStore.getProfile());

    const storeHtmlAfter = renderCommerceStoreView(appState.getState());
    const modalHtmlAfter = renderCartModal();
    const cartHtmlAfter = renderCartBoardView();
    const checkoutHtmlAfter = renderCheckoutBoardView();
    const funnelHtmlAfter = FunnelCheckoutHelper.renderCheckoutModal();

    expect(storeHtmlAfter).toContain('등록 완료');
    expect(storeHtmlAfter).not.toContain('미등록');

    expect(modalHtmlAfter).toContain('등록 완료');
    expect(modalHtmlAfter).not.toContain('미등록');

    expect(cartHtmlAfter).toContain('등록 완료');
    expect(cartHtmlAfter).not.toContain('미등록');

    expect(checkoutHtmlAfter).toContain('등록 완료');
    expect(checkoutHtmlAfter).not.toContain('미등록');
    expect(checkoutHtmlAfter).not.toContain('id="btn-submit-final-order" disabled');

    expect(funnelHtmlAfter).toContain('1990-08-15');
    expect(funnelHtmlAfter).not.toContain('id="btn-confirm-funnel-pay" disabled');
  });

  it('네거티브 매트릭스: 비로그인·정지계정·사주미등록 퍼널결제·중복가입이 모두 차단된다', async () => {
    const nonReportProd = INITIAL_STORE_PRODUCTS.find(p => p.deliveryType !== 'saju_report' && p.category !== 'report')!;
    CartStore.addItem(nonReportProd, 1);

    // 1. 비로그인(guest) 상태 결제 차단
    const guestRes = CheckoutService.executeCheckout({
      buyerName: '비로그인',
      buyerPhone: '010-0000-0000',
      buyerEmail: 'guest@test.com',
      paymentMethod: 'bank_transfer',
      agreeTerms: true,
    });
    expect(guestRes.success).toBe(false);
    expect(guestRes.message).toContain('로그인');

    // 2. 사주 미등록 상태 퍼널 무통장 입금 신청 차단
    await AuthService.register({
      username: 'negative_user',
      password: 'password123',
      passwordConfirm: 'password123',
      name: '차단테스터',
      role: 'user',
    });
    const funnelBlocked = await FunnelCheckoutHelper.executePayment();
    expect(funnelBlocked.success).toBe(false);
    expect(funnelBlocked.message).toContain('사주 분석 대상 정보');

    // 3. 동일 username 중복 회원가입 차단
    const dupReg = await AuthService.register({
      username: 'negative_user',
      password: 'password123',
      passwordConfirm: 'password123',
      name: '중복시도',
      role: 'user',
    });
    expect(dupReg.success).toBe(false);
    expect(dupReg.message).toContain('이미 사용 중인 아이디');

    // 4. 이용 정지(suspended) 계정 결제 차단
    const acc = AuthService.getAllAccounts().find(a => a.username === 'negative_user')!;
    acc.status = 'suspended';
    (AuthService as any).currentSession = { ...acc };
    const suspendedRes = CheckoutService.executeCheckout({
      buyerName: '차단테스터',
      buyerPhone: '010-0000-0000',
      buyerEmail: 'suspended@test.com',
      paymentMethod: 'bank_transfer',
      agreeTerms: true,
    });
    expect(suspendedRes.success).toBe(false);
    expect(suspendedRes.message).toContain('정지');
  });
});
