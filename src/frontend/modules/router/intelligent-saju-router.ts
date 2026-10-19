/**
 * IntelligentSajuRouter
 * 
 * 모든 상품(무료/유료)의 쇼케이스 및 결제 과정을 스토어 주문서(CheckoutBoardView)로 단일화
 * - 완료된 주문이 이미 있는 경우 -> 즉시 결과 화면 열람
 * - 복수 구매 고객 -> 대상자 선택 모달
 * - 미구매 상품 -> 스토어 장바구니/주문서로 다이렉트 직행
 */

import { appState, ProductTierTab } from '../../state/app-state.js';
import { AuthService } from '../../state/auth-service.js';
import { UserSajuStore } from '../../state/user-saju-store.js';
import { getAllStoreProducts } from '../../extensions/commerce-store/store-service.js';
import { CartStore } from '../cart/cart-store.js';
import { ReportRouterMapper } from '../checkout/report-router-mapper.js';

export class IntelligentSajuRouter {
  private static modalContainerId = 'intelligent-saju-router-modal-slot';

  /**
   * 티어에 상응하는 스토어 정규 상품 검색
   */
  public static findProductForTier(tier: ProductTierTab): any {
    const products = getAllStoreProducts();
    const t = tier.toUpperCase();

    if (t === 'FREE') {
      return products.find(p => p.id === 'prod-free-experience') || products.find(p => p.reportTier === 'FREE') || products.find(p => p.price === 0) || products[0];
    }
    if (t === 'PAID') {
      return products.find(p => p.id === 'prod-paid-saju-premium') || products.find(p => p.reportTier === 'PAID') || products.find(p => p.price === 39900) || products[0];
    }
    if (t === 'CONFLICT_MALSAL') {
      return products.find(p => p.id === 'prod-saju-conflict') || products.find(p => p.reportTier === 'CONFLICT_MALSAL') || products.find(p => p.price === 79900) || products[0];
    }
    if (t === 'PREMIUM') {
      return products.find(p => p.id === 'prod-paid-saju-vip') || products.find(p => p.reportTier === 'PREMIUM') || products.find(p => p.price === 149000) || products[0];
    }
    if (t === 'YEAR_2027') {
      return products.find(p => p.id === 'prod-report-year2027') || products.find(p => p.reportTier === 'YEAR_2027') || products[0];
    }
    if (t === 'CAREER') {
      return products.find(p => p.id === 'prod-report-career') || products.find(p => p.reportTier === 'CAREER') || products[0];
    }
    if (t === 'WEALTH') {
      return products.find(p => p.id === 'prod-report-wealth') || products.find(p => p.reportTier === 'WEALTH') || products[0];
    }
    if (t === 'CHEMISTRY') {
      return products.find(p => p.id === 'prod-report-gunghap') || products.find(p => p.reportTier === 'CHEMISTRY') || products[0];
    }
    return products[0];
  }

  /**
   * 상품 및 사주체험 버튼 클릭 시 지능형 라우팅
   * - FREE(사주체험하기): 사주 정보가 있으면 결과화면(result) 즉시 직행, 없으면 사주입력(analyze)으로 이동 (결제창 절대 미노출)
   * - 유료 상품: 기구매자는 결과화면 직행, 미구매자는 주문서(checkout)로 연결
   */
  public static handleProductOrExperienceClick(targetTier: ProductTierTab | string | null = null): void {
    const effectiveTier: ProductTierTab = (targetTier ? targetTier.toUpperCase() : 'FREE') as ProductTierTab;

    // [1. 무료 사주체험(FREE) 클릭한 경우]
    // 항상 정식 사주 정보 입력창(analyze)으로 이동하여 무료 체험 분석을 진행
    if (effectiveTier === 'FREE') {
      const u = AuthService.getCurrentUser();
      if (u.role === 'guest') {
        appState.setUserName('');
        appState.clearSession();
      }
      appState.setActiveTierTab('FREE');
      appState.setView('analyze');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // [2. 유료 리포트 상품 (PAID, CONFLICT_MALSAL, PREMIUM, YEAR_2027 등) 클릭한 경우]
    const currentUser = AuthService.getCurrentUser();

    // 2-A. 비로그인(게스트) 상태: 로그인 후 정규 주문/결제를 진행하도록 안내
    if (currentUser.role === 'guest') {
      alert('유료 리포트 상품은 로그인 후 구매하실 수 있습니다.');
      const loginBtn = document.getElementById('btn-header-login');
      if (loginBtn) {
        loginBtn.click();
      } else {
        const authEvent = new CustomEvent('open-auth-modal', { detail: { panel: 'login' } });
        window.dispatchEvent(authEvent);
      }
      return;
    }

    // 2-B. 로그인 회원: 정규 이커머스 주문서(checkout)로 이동하여 결제 진행
    const targetProduct = this.findProductForTier(effectiveTier);
    const sajuSnap = UserSajuStore.getProfileOrDefault();

    if (targetProduct) {
      CartStore.clear();
      CartStore.addItem(targetProduct, 1, sajuSnap);
      appState.setActiveTierTab(effectiveTier);
      appState.setView('checkout');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 폴백
    appState.setActiveTierTab(effectiveTier);
    appState.setView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * 상단 네비게이션 '분석 결과' 클릭 시 안전한 세션 복원
   */
  public static ensureSessionForNavigation(targetView: 'result' | 'report'): void {
    const state = appState.getState();
    if (!state.sessionState && !state.productOutputSet) {
      if (UserSajuStore.hasSajuProfile()) {
        UserSajuStore.restoreLastActiveAnalysis();
      } else {
        // 사주 정보가 전혀 없는 경우 입력 화면으로 안내
        appState.setView('analyze');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
    appState.setView(targetView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
