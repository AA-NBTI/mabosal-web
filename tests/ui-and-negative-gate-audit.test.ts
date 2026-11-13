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
import {
  renderMemberLuckyCalendarWidget,
  renderMemberMagiCalendarWidget,
} from '../src/frontend/views/MemberCalendarWidgets.js';
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
    expect(AuthService.isAuthenticated()).toBe(false);
    await AuthService.login('ui_consistency_user', 'password123');
    expect(AuthService.isAuthenticated()).toBe(true);

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
    await AuthService.login('negative_user', 'password123');
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

  it('이용자 대시보드 행운달력·마기달력이 서로 다른 사주 원국에 따라 개인화된 결과를 산출한다', async () => {
    await AuthService.register({
      username: 'cal_user_a',
      password: 'password123',
      passwordConfirm: 'password123',
      name: '김갑자',
      role: 'user',
    });
    await AuthService.login('cal_user_a', 'password123');

    // 사주 미등록 시 기본 안내 노출 확인
    const unregisteredLucky = renderMemberLuckyCalendarWidget(appState.getState());
    expect(unregisteredLucky).toContain('1:1 맞춤 달력');

    UserSajuStore.syncUserSajuProfile({
      userName: '김갑자',
      birthDate: '1988-02-14',
      birthTime: '06:00',
      gender: 'male',
      calendarType: 'solar',
    });
    const luckyA = renderMemberLuckyCalendarWidget(appState.getState());
    const magiA = renderMemberMagiCalendarWidget(appState.getState());
    expect(luckyA).not.toContain('1:1 맞춤 달력');

    AuthService.logout();
    await AuthService.register({
      username: 'cal_user_b',
      password: 'password123',
      passwordConfirm: 'password123',
      name: '이병오',
      role: 'user',
    });
    await AuthService.login('cal_user_b', 'password123');
    UserSajuStore.syncUserSajuProfile({
      userName: '이병오',
      birthDate: '1995-09-23',
      birthTime: '19:30',
      gender: 'female',
      calendarType: 'solar',
    });
    const luckyB = renderMemberLuckyCalendarWidget(appState.getState());
    const magiB = renderMemberMagiCalendarWidget(appState.getState());

    expect(luckyA.replace(/김갑자/g, 'USER')).not.toBe(luckyB.replace(/이병오/g, 'USER'));
    expect(magiA.replace(/김갑자/g, 'USER')).not.toBe(magiB.replace(/이병오/g, 'USER'));
  });

  it('test1234 계정이 로그인 후 통합 사주 모달 입력 1회만으로 스토어·장바구니·주문서 결제를 오류 없이 완료한다', async () => {
    const reg = await AuthService.register({
      username: 'test1234',
      password: 'password123',
      passwordConfirm: 'password123',
      name: '테스트회원',
      phone: '010-1234-5678',
      role: 'user',
    });
    expect(reg.success).toBe(true);
    expect(AuthService.isAuthenticated()).toBe(false);

    const loginRes = await AuthService.login('test1234', 'password123');
    expect(loginRes.success).toBe(true);
    expect(UserSajuStore.hasSajuProfile(loginRes.user!.id)).toBe(false);

    // 1. 통합 사주 모달 입력(1회)으로 프로필/세션/장바구니 동기화
    const synced = UserSajuStore.syncUserSajuProfile({
      userId: loginRes.user!.id,
      userName: '테스트회원',
      birthDate: '1992-05-14',
      birthTime: '14:00',
      calendarType: 'solar',
      gender: 'male',
      isLeapMonth: false,
      birthRegion: '서울',
    });
    expect(synced).not.toBeNull();
    expect(UserSajuStore.hasSajuProfile(loginRes.user!.id)).toBe(true);

    // 2. 사주 리포트 상품 선택 및 장바구니 담기 시 '등록 완료' 및 '대상자 변경' 표시 확인
    const reportProd = INITIAL_STORE_PRODUCTS.find(p => p.deliveryType === 'saju_report')!;
    selectStoreProduct(reportProd.id, false);
    const addedItem = CartStore.addItem(reportProd, 1);
    expect(CartStore.isItemSajuReady(addedItem)).toBe(true);

    const storeHtml = renderCommerceStoreView(appState.getState());
    expect(storeHtml).toContain('등록 완료 · 테스트회원');
    expect(storeHtml).toContain('대상자 변경');

    const cartHtml = renderCartBoardView();
    expect(cartHtml).toContain('등록 완료');
    expect(cartHtml).toContain('대상자 변경');

    const checkoutHtml = renderCheckoutBoardView();
    expect(checkoutHtml).toContain('등록 완료');
    expect(checkoutHtml).not.toContain('id="btn-submit-final-order" disabled');

    // 3. 실제 결제 실행(무통장 입금 접수) 오류 없이 성공 검증
    const checkoutRes = CheckoutService.executeCheckout({
      buyerName: '테스트회원',
      buyerPhone: '010-1234-5678',
      buyerEmail: 'test1234@mabosal.com',
      paymentMethod: 'bank_transfer',
      agreeTerms: true,
    });
    expect(checkoutRes.success).toBe(true);
    expect(checkoutRes.order?.status).toBe('pending');
    expect(checkoutRes.order?.sajuInput?.solarBirthDate).toBe('1992-05-14');
  });
});
