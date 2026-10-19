import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../src/frontend/state/auth-service.js';
import { CartStore } from '../src/frontend/modules/cart/cart-store.js';
import { VoucherStore } from '../src/frontend/modules/voucher/voucher-store.js';
import { YeopjeonTrackerState } from '../src/frontend/state/yeopjeon-tracker-state.js';
import { UserSajuStore } from '../src/frontend/state/user-saju-store.js';
import { createStoreOrder, getMyStoreOrders } from '../src/frontend/extensions/commerce-store/store-service.js';
import { setStorageBackend, createMemoryStorage } from '../src/frontend/modules/persistence/index.js';

describe('다중 계정 교차 격리(Cross-Account Isolation) 종합 검증', () => {
  beforeEach(() => {
    setStorageBackend(createMemoryStorage());
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    AuthService.logout();
  });

  it('A 계정의 장바구니, 쿠폰지갑, 캐시, 엽전, 사주프로필, 주문내역이 B 계정에게 전혀 노출되지 않아야 한다', () => {
    // 1. A 계정 등록 및 로그인
    const regA = AuthService.register({
      username: 'user_alpha',
      password: 'password1234',
      passwordConfirm: 'password1234',
      name: '홍길동',
      role: 'user',
    });
    expect(regA.success).toBe(true);
    expect(AuthService.getCurrentUser().username).toBe('user_alpha');

    // [A 활동 1] 사주 프로필 저장
    UserSajuStore.saveProfile({
      userName: '홍길동',
      solarBirthDate: '1990-01-01',
      gender: 'male',
    });

    // [A 활동 2] 장바구니에 상품 담기
    CartStore.addItem({
      id: 'prod-paid-saju-premium',
      title: '평생 정밀 사주 리포트 (39,900원)',
      tagLine: '정밀 리포트',
      description: '사주 분석',
      contentPayload: '',
      salesCount: 0,
      price: 39900,
      category: 'report',
      deliveryType: 'saju_report',
      thumbnailUrl: '',
      targetSignals: [],
      status: 'active',
      createdAt: '2026-10-19',
    });
    expect(CartStore.getCount()).toBe(1);

    // [A 활동 3] 쿠폰 등록 및 캐시 충전
    VoucherStore.addCash(15000); // 15,000원 적립
    expect(VoucherStore.getUserCash()).toBe(15100);

    // [A 활동 4] 엽전 적립
    const yeopStateA = YeopjeonTrackerState.getInstance();
    yeopStateA.totalYeopjeon = 3250;
    yeopStateA.currentStreak = 7;
    yeopStateA.saveToStorage();
    expect(yeopStateA.totalYeopjeon).toBe(3250);

    // [A 활동 5] 주문 생성
    createStoreOrder({
      productId: 'prod-paid-saju-premium',
      buyerName: '홍길동',
      buyerPhone: '010-1111-2222',
      buyerEmail: 'alpha@test.com',
      paymentMethod: 'credit_card',
      status: 'completed',
    });
    expect(getMyStoreOrders().length).toBe(1);

    // -------------------------------------------------------------
    // 2. A 계정 로그아웃 후 B 계정 등록 및 로그인
    // -------------------------------------------------------------
    AuthService.logout();
    expect(AuthService.getCurrentUser().role).toBe('guest');

    const regB = AuthService.register({
      username: 'user_beta',
      password: 'password1234',
      passwordConfirm: 'password1234',
      name: '이영희',
      role: 'user',
    });
    expect(regB.success).toBe(true);
    expect(AuthService.getCurrentUser().username).toBe('user_beta');

    // -------------------------------------------------------------
    // 3. B 계정에서 A 계정의 데이터 잔존 여부 전수 검증
    // -------------------------------------------------------------

    // [검증 1] 사주 프로필: A의 사주가 없어야 함
    const bProfile = UserSajuStore.getProfile();
    expect(bProfile).toBeNull();

    // [검증 2] 장바구니: B의 장바구니는 비어있어야 함 (A의 39,900원 상품 노출 차단)
    expect(CartStore.getCount()).toBe(0);
    expect(CartStore.getItems()).toEqual([]);

    // [검증 3] 캐시 잔액: A의 15,000원이 아닌 기본 잔액(100원)이어야 함
    expect(VoucherStore.getUserCash()).toBe(100);

    // [검증 4] 엽전 및 출석 스트릭: A의 3250엽/7일이 아닌 0엽/0일이어야 함
    const yeopStateB = YeopjeonTrackerState.getInstance();
    yeopStateB.reload();
    expect(yeopStateB.totalYeopjeon).toBe(0);
    expect(yeopStateB.currentStreak).toBe(0);

    // [검증 5] 구매 주문 내역: A의 주문(ORD)이 B의 주문내역에 노출되지 않아야 함
    expect(getMyStoreOrders().length).toBe(0);
  });
});
