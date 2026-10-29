import { OrderAuthGuard } from './modules/order/order-auth-guard.js';
import { PaymentService, PortOneGateway } from './modules/payment/payment-service.js';
import { updateStoreOrder } from './extensions/commerce-store/store-service.js';
import { savePaymentConfigFromDom } from './modules/payment/AdminPaymentPanel.js';
import { VoucherStore } from './modules/voucher/voucher-store.js';
import { renderMagiCalendarView } from './views/MagiCalendarView.js';
import { renderLuckyCalendarView } from './views/LuckyCalendarView.js';
import { renderStudyView, setStudyCategory, selectStudyArticle, resetStudyCategory, bindStudyHubEvents, StudyService, generateKoreanSlug } from './extensions/study-hub/index.js';
import { SiteContentStore } from './state/site-content-store.js';
import { navigateTo, parseRouteFromLocation, getViewPath, updateSeoForView, mountPageToOutlet, syncNavActiveState } from './modules/router/index.js';
import {
  renderSajuCategoryPage,
  renderFortuneCategoryPage,
  renderCareerCategoryPage,
  renderWealthCategoryPage,
  renderLoveCategoryPage,
  renderCalendarCategoryPage,
} from './views/pages/index.js';
import {
  renderSolutionHub,
  bindSolutionHubEvents,
  addCustomSolution,
  addCustomPartner,
  updatePartnerApplicationStatus,
  type VerticalId,
} from './extensions/solution-hub/index.js';

bindSolutionHubEvents();
bindStudyHubEvents();
/**
 * Phase 14~27: Frontend Main Application Entry
 * 
 * 원칙:
 * 1. 바닐라 TypeScript + 순수 DOM 조작으로 가볍고 빠른 반응성 구현
 * 2. Phase 18: 양력/음력/윤달 토글 이벤트 바인딩
 * 3. Phase 19: 고민 프리셋 칩 및 문제 서술 textarea 바인딩
 * 4. Phase 24 & 26: 상품 티어 결제 및 잠금 해제 인터랙션
 * 5. 기존 Phase 14~16의 모든 이벤트 및 ID 호환성 100% 보존
 */

import { frontendAdapter } from './adapter/engine-adapter.js';
import {
 renderBirthInputView,
 renderConsultationView,
 renderEvidenceTraceModal,
 renderHeader,
 renderLandingView,
 renderLoadingView,
 renderReportView,
 renderResultView,
 renderMemberDashboardView,
  setMemberActiveTab,
 renderFloatingBottomDock,
  renderFooter,
  renderMobileNavDrawer,
} from './components/views.js';
import { renderLegalAndSupportModals } from './components/LegalAndSupportModals.js';
import { renderFortuneDetailModals } from './components/FortuneDetailModals.js';
import { appState, AppStateData } from './state/app-state.js';
import { ReportDepthMode } from '../modules/phase10/phase10-types.js';
import { ProductTier } from '../modules/phase17_25/index.js';
import { PartnerTracker } from './modules/partner-tracker.js';
import { renderPartnerPortalView } from './views/PartnerPortalView.js';
import {
  renderAdminDashboardView,
  setAdminActiveTab,
  getAdminActiveTab,
  setEditingStoreProductId,
  getEditingStoreProductId,
  toggleAdminGroup,
  toggleAdminSubGroup,
  setEditingStudyArticleId,
  getEditingStudyArticleId,
} from './views/AdminDashboardView.js';
import {
  setInquiryFilter,
  toggleInquiryExpanded,
  expandSpecificInquiry,
} from './views/AdminInquiriesPanel.js';
import {
  executeLifeAnalysis,
  getActiveWarehouse,
  setSelectedDaewoonOrder,
  setSelectedLifeSewoonYear,
  setSelectedLifeMonth,
  setSelectedWikiFactor,
  getSelectedWikiFactor,
  getLifeChartViewMode,
  setLifeChartViewMode,
  toggleLifeChartViewMode,
  toggleLifeChartFullscreen,
  setLifeChartFullscreen,
  getLifeChartFullscreen,
  toggleSajuInputExpanded,
  setActiveLifeStage,
  toggleLifeStage,
  setAllLifeStagesExpanded,
  renderAdminLifeAnalysisPanel,
} from './views/AdminLifeAnalysisPanel.js';
import {
  openAddSeoPageModal,
  closeAddSeoPageModal,
  getSeoKeywordPages,
  saveSeoKeywordPages,
  deleteSeoKeywordPage,
  normalizeFirstTierSlug,
  resetToFirstTierDefaults,
} from './views/AdminSeoWikiHubPanel.js';
import { findSajuFactorWiki } from './data/saju-factor-wiki.js';
import { LifeAnalysisWarehouseBuilder } from '../modules/life-analysis/life-analysis-warehouse.js';
import { buildEvidencePacket } from '../modules/life-analysis/evidence/evidence-packet-builder.js';
import { normalizeBirthTime } from './modules/saju-profile/profile-core.js';
import {
  renderCommerceStoreView,
  setStoreActiveCategory,
  getStoreProductById,
  selectStoreProduct,
  getSelectedStoreProductId,
  setLastStoreOrder,
  getAllStoreOrders,
  createStoreOrder,
  redeemStoreVoucher,
  saveStoreProduct,
  updateStoreProduct,
  deleteStoreProduct,
  syncStoreProductsFromSupabase,
  setAdminStoreFilter,
  setAdminStoreStatusFilter,
  setAdminStoreSort,
  setAdminStoreSearch,
  setStoreProductStatus,
  setAdminStoreSubTab,
  isProductAlreadyPurchased,
  calculateStoreCouponDiscount,
  requestStoreOrderRefund,
  approveStoreOrderRefund,
  approveStoreBankDeposit,
  addStoreCategory,
  updateStoreCategory,
  deleteStoreCategory,
  resetStoreCategory,
  type StoreCategoryType,
  type DeliveryType,
} from './extensions/commerce-store/index.js';
import { SAJU_BOOK_VOL1_PRODUCT } from './extensions/commerce-store/saju-book-data.js';
import { setSelectedZodiac, setSelectedYear, toggleCardExpanded } from './views/TodayFortuneAndMagiWidget.js';
import { ModuleRegistry } from './state/module-registry.js';
import { CatalogStore } from './state/catalog-store.js';
import { AuthService } from './state/auth-service.js';
import { YeopjeonTrackerState } from './state/yeopjeon-tracker-state.js';
import { requireLogin } from './modules/identity/index.js';
import { resolveMyOrderForView } from './modules/entitlement/index.js';
import { UserSajuStore } from './state/user-saju-store.js';
import { IntelligentSajuRouter } from './modules/router/intelligent-saju-router.js';
import { CartStore } from './state/cart-store.js';
import { CustomerInquiryStore } from './state/customer-inquiry-store.js';
import { ProductReviewStore } from './state/product-review-store.js';
import { UserAddressStore } from './state/user-address-store.js';
import { renderCartBoardView } from './modules/cart/index.js';
import { renderCheckoutBoardView, CheckoutService, ReportRouterMapper } from './modules/checkout/index.js';
import { renderCartModal, renderOrderReviewModal } from './components/CartAndReviewModal.js';
import { renderReviewWriteModal } from './components/ReviewWriteModal.js';
import { renderAuthModal } from './components/AuthModal.js';
import { generateDownloadableReportText } from './components/tier-templates.js';
import { renderCheonmyeongwonShareModal } from './components/VisualCharts.js';
import { FunnelCheckoutHelper } from './views/pages/FunnelCheckoutHelper.js';
import { AbTestService } from './modules/ab-test/ab-test-service.js';
import { PaymentConfigStore } from './modules/payment/payment-config.js';


function compressImageFile(file: File, maxDimension = 900, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve((e.target?.result as string) || '');
        }
      };
      img.onerror = () => resolve((e.target?.result as string) || '');
      img.src = (e.target?.result as string) || '';
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 인생분석 관제실 전역 리렌더링 및 모드 전환 안전 헬퍼
function refreshLifeAnalysisView(): void {
  setAdminActiveTab('tab-life-analysis');
  const lifeContainer = document.getElementById('tab-life-analysis');
  if (lifeContainer) {
    lifeContainer.innerHTML = renderAdminLifeAnalysisPanel();
  }
}

(window as any).__setLifeViewMode = (mode: '100years' | '10years' | '12months') => {
  setLifeChartViewMode(mode);
  refreshLifeAnalysisView();
};

(window as any).__openLifeFullscreen = () => {
  setLifeChartFullscreen(true);
  refreshLifeAnalysisView();
};

(window as any).__closeLifeFullscreen = () => {
  setLifeChartFullscreen(false);
  const overlay = document.getElementById('life-chart-fullscreen-overlay');
  if (overlay) {
    overlay.remove();
  }
  refreshLifeAnalysisView();
};

(window as any).__toggleLifeFullscreen = () => {
  if (getLifeChartFullscreen()) {
    (window as any).__closeLifeFullscreen();
  } else {
    (window as any).__openLifeFullscreen();
  }
};

// 명리 요인 위키 팝업 모달 열기 글로벌 헬퍼
(window as any).__openSajuFactorWiki = (factorName: string) => {
  const item = findSajuFactorWiki(factorName);
  const modal = document.getElementById('saju-factor-wiki-modal');
  const content = document.getElementById('saju-factor-wiki-modal-content');
  if (!modal || !content) return;

  if (!item) {
    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="color: #fff; margin: 0;">${factorName}</h3>
        <button type="button" class="btn-close-factor-wiki-modal" style="background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer;">✕</button>
      </div>
      <p style="color: #cbd5e1; font-size: 0.85rem;">해당 요인의 상세 해설 위키 자료를 준비 중입니다.</p>
    `;
  } else {
    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.85rem; margin-bottom: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
            <span style="font-size: 1.25rem; font-weight: 900; color: #fff;">${item.name}</span>
            <span style="font-size: 0.95rem; color: #94a3b8;">(${item.hanja})</span>
            <span style="background: ${item.badgeColor}22; color: ${item.badgeColor}; border: 1px solid ${item.badgeColor}66; font-size: 0.72rem; font-weight: 800; padding: 0.15rem 0.5rem; border-radius: 4px;">
              ${item.category} · ${item.nature}
            </span>
          </div>
          <div style="font-size: 0.76rem; color: #64748b;">마보살 명리 인과 원천 데이터 지식창고 (위키)</div>
        </div>
        <button type="button" class="btn-close-factor-wiki-modal" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 6px; width: 32px; height: 32px; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center;">✕</button>
      </div>

      <div style="background: rgba(0,0,0,0.35); border-left: 4px solid ${item.badgeColor}; padding: 0.85rem 1rem; border-radius: 6px; font-size: 0.88rem; color: #f8fafc; line-height: 1.6; margin-bottom: 1rem;">
        ${item.summary}
      </div>

      <div style="margin-bottom: 1rem;">
        <div style="font-size: 0.8rem; font-weight: 700; color: #94a3b8; margin-bottom: 0.4rem;">작용 메커니즘 (명리 원리)</div>
        <div style="font-size: 0.82rem; color: #cbd5e1; line-height: 1.55; background: rgba(255,255,255,0.03); padding: 0.75rem; border-radius: 6px;">
          ${item.mechanism}
        </div>
      </div>

      <div style="margin-bottom: 1rem;">
        <div style="font-size: 0.8rem; font-weight: 700; color: #94a3b8; margin-bottom: 0.4rem;">4대 생애 영역 영향 (길흉 해석)</div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.6rem; font-size: 0.78rem;">
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 0.6rem 0.75rem; border-radius: 6px;">
            <strong style="color: #60a5fa; display: block; margin-bottom: 0.2rem;">🏢 직업·사업 영향</strong>
            <span style="color: #cbd5e1;">${item.lifeImpact.career}</span>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 0.6rem 0.75rem; border-radius: 6px;">
            <strong style="color: #34d399; display: block; margin-bottom: 0.2rem;">💰 재물·투자 영향</strong>
            <span style="color: #cbd5e1;">${item.lifeImpact.wealth}</span>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 0.6rem 0.75rem; border-radius: 6px;">
            <strong style="color: #f472b6; display: block; margin-bottom: 0.2rem;">❤️ 인간관계·애정</strong>
            <span style="color: #cbd5e1;">${item.lifeImpact.relationship}</span>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 0.6rem 0.75rem; border-radius: 6px;">
            <strong style="color: #fca5a5; display: block; margin-bottom: 0.2rem;">🩺 건강·신체 영향</strong>
            <span style="color: #cbd5e1;">${item.lifeImpact.health}</span>
          </div>
        </div>
      </div>

      <div style="background: rgba(56, 189, 248, 0.08); border: 1px dashed rgba(56, 189, 248, 0.3); padding: 0.85rem 1rem; border-radius: 6px; font-size: 0.82rem; color: #e2e8f0; margin-bottom: 1.25rem;">
        <strong style="color: #38bdf8; display: block; margin-bottom: 0.25rem;">💡 실전 처세 및 대처 가이드:</strong>
        ${item.strategy}
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.6rem;">
        <button type="button" class="btn-close-factor-wiki-modal" style="background: #334155; color: #fff; font-weight: 700; border: none; border-radius: 6px; padding: 0.45rem 1rem; font-size: 0.82rem; cursor: pointer;">
          확인 완료
        </button>
      </div>
    `;
  }
  modal.style.zIndex = '999999';
  modal.style.display = 'flex';
};

// 키보드 ESC 키 단일 글로벌 이벤트 리스너 등록
window.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape' || e.key === 'Esc') {
    const wikiModal = document.getElementById('saju-factor-wiki-modal');
    if (wikiModal && wikiModal.style.display !== 'none') {
      wikiModal.style.display = 'none';
      return;
    }
    if (getLifeChartFullscreen()) {
      e.preventDefault();
      (window as any).__closeLifeFullscreen();
    }
  }
});

class MabosalApp {
 private rootEl: HTMLElement;
 private selectedGender: 'male' | 'female' = 'male';
 private isShellMounted = false;

 constructor(rootId: string) {
 const el = document.getElementById(rootId);
 if (!el) throw new Error(`Root element #${rootId} not found`);
 this.rootEl = el;

 this.init();
 }

 private openAuthModal(defaultPanel: 'login' | 'register' = 'login') {
 const modal = document.getElementById('modal-auth-container');
 if (!modal) return;
 modal.style.display = 'flex';
 this.switchAuthPanel(defaultPanel);
 }

 private switchAuthPanel(panel: 'login' | 'register') {
 const tabLogin = document.getElementById('tab-btn-show-login');
 const tabRegister = document.getElementById('tab-btn-show-register');
 const panelLogin = document.getElementById('auth-panel-login');
 const panelRegister = document.getElementById('auth-panel-register');

 if (panel === 'login') {
 if (tabLogin) { tabLogin.style.background = 'var(--primary)'; tabLogin.style.color = '#241a00'; }
 if (tabRegister) { tabRegister.style.background = 'transparent'; tabRegister.style.color = '#dfe2f1'; }
 if (panelLogin) panelLogin.style.display = 'block';
 if (panelRegister) panelRegister.style.display = 'none';
 } else {
 if (tabLogin) { tabLogin.style.background = 'transparent'; tabLogin.style.color = '#dfe2f1'; }
 if (tabRegister) { tabRegister.style.background = 'var(--primary)'; tabRegister.style.color = '#241a00'; }
 if (panelLogin) panelLogin.style.display = 'none';
 if (panelRegister) panelRegister.style.display = 'block';
 }
 }

 private closeAuthModal() {
 const modal = document.getElementById('modal-auth-container');
 if (modal) modal.style.display = 'none';
 }

 private pendingCheckoutData: any = null;

 private updateCartBadges() {
   const count = CartStore.getCount();
   document.querySelectorAll('.cart-badge-count').forEach(el => {
     (el as HTMLElement).textContent = String(count);
     (el as HTMLElement).style.display = count > 0 ? 'inline-block' : 'none';
   });
 }

 private openCartModal() {
   this.updateCartBadges();
   const container = document.getElementById('cart-modal-container');
   if (container) container.innerHTML = renderCartModal();
 }

 private closeCartModal() {
   this.updateCartBadges();
   const container = document.getElementById('cart-modal-container');
   if (container) container.innerHTML = '';
 }

 private openReviewModal(data: any) {
   this.pendingCheckoutData = data;
   const container = document.getElementById('order-review-modal-container');
   if (container) container.innerHTML = renderOrderReviewModal(data);
 }

 private closeReviewModal() {
   this.pendingCheckoutData = null;
   const container = document.getElementById('order-review-modal-container');
   if (container) container.innerHTML = '';
 }

 private openReviewWriteModal(options: { orderId: string; productId: string; productTitle: string }) {
   const container = document.getElementById('review-write-modal-container');
   if (container) container.innerHTML = renderReviewWriteModal(options);
 }

 private closeReviewWriteModal() {
   const container = document.getElementById('review-write-modal-container');
   if (container) container.innerHTML = '';
 }

  private init() {
    PartnerTracker.initFromUrl();
    AuthService.init();
    void syncStoreProductsFromSupabase();

 if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const parsed = parseRouteFromLocation();
      let initialView = parsed.view;

      if (urlParams.get('payment')) {
        appState.setView('store');
        void this.handlePaymentReturn(urlParams);
      } else if (initialView === 'admin' || urlParams.get('admin') === 'true') {
        const tabParam = urlParams.get('tab') || (typeof localStorage !== 'undefined' ? localStorage.getItem('mm_admin_active_tab') : null);
        const editIdParam = urlParams.get('editId');
        if (editIdParam) {
          StudyService.setEditingArticleId(editIdParam);
          setEditingStudyArticleId(editIdParam);
          setAdminActiveTab('tab-study-write');
        } else if (tabParam) {
          const fullTabId = tabParam.startsWith('tab-') ? tabParam : ('tab-' + tabParam);
          setAdminActiveTab(fullTabId);
          if (fullTabId === 'tab-store') setAdminStoreSubTab('products');
          else if (fullTabId === 'tab-store-register') setAdminStoreSubTab('register');
          else if (fullTabId === 'tab-store-orders') setAdminStoreSubTab('orders');
          else if (fullTabId === 'tab-store-categories') setAdminStoreSubTab('categories');
        }
        if (!AuthService.isAdmin()) {
          appState.setView('landing');
          setTimeout(() => {
            const authModal = document.getElementById('modal-auth-container');
            if (authModal) authModal.style.display = 'flex';
            alert('관리자 대시보드는 최고 관리자(admin) 계정으로 로그인 후 이용하실 수 있습니다.');
          }, 150);
        } else {
          appState.setView('admin');
        }
      } else if (initialView === 'result' || initialView === 'report') {
        UserSajuStore.restoreLastActiveAnalysis(urlParams.get('orderId'), urlParams.get('tier'));
        appState.setView('result');
      } else if (initialView === 'study') {
        const articleSlug = parsed.params.article || urlParams.get('article');
        if (articleSlug) {
          selectStudyArticle(articleSlug, false);
        }
        appState.setView('study');
      } else if (initialView === 'member-dashboard') {
        const memberTabParam = urlParams.get('tab');
        if (memberTabParam) {
          const fullTab = memberTabParam.startsWith('tab-') ? memberTabParam : `tab-${memberTabParam}`;
          setMemberActiveTab(fullTab);
        }
        appState.setView('member-dashboard');
      } else {
        appState.setView(initialView);
      }
      updateSeoForView(appState.getState().currentView);
    }

 let isNavigatingBack = false;
 let prevNavView = appState.getState().currentView;

 // [SEO & 테마 페이지 구조화] History API 연동 & 뒤로가기/앞으로가기
 if (typeof window !== 'undefined') {
 window.history.replaceState({ view: appState.getState().currentView }, '', window.location.href);

 
      // [멀티 유저 세션 격리] 로그인/로그아웃/계정 전환 시 실시간 동기화
      window.addEventListener('mm-auth-changed', () => {
        YeopjeonTrackerState.getInstance().reload();
        this.updateCartBadges();
        this.render(appState.getState());
      });

      window.addEventListener('mm-cart-changed', () => {
        this.updateCartBadges();
      });

      window.addEventListener('navigate-store-product', (e: any) => {
        const pid = e.detail?.productId;
        if (pid) {
          selectStoreProduct(pid, true);
        }
        appState.setView('store');
        this.render(appState.getState());
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
  window.addEventListener('popstate', (event) => {
    isNavigatingBack = true;
    try {
      const parsed = parseRouteFromLocation();
      const targetView = event.state?.view || parsed.view;
      const currentView = appState.getState().currentView;

      // 스토어 이외의 화면으로 뒤로가기 시 열려있던 스토어 모달 상태 닫기 (pushState 방지)
      if (targetView !== 'store') {
        selectStoreProduct(null, false);
      }

      if (targetView === 'loading') {
        appState.setView('analyze');
        return;
      }

      prevNavView = targetView;
      if (targetView && targetView !== currentView) {
        updateSeoForView(targetView);
        appState.setView(targetView);
      } else {
        // 동일 뷰 내에서 서브 파라미터(상품/아티클/탭 등)가 변경된 경우 즉시 재렌더링
        this.render(appState.getState());
      }
    } finally {
      setTimeout(() => {
        isNavigatingBack = false;
      }, 50);
    }
  });
 }

 window.addEventListener('study-state-changed', () => {
      this.render(appState.getState());
    });

 appState.subscribe(state => {
 if (state.currentView === 'loading') {
   this.render(state);
   return;
 }

 if (typeof window !== 'undefined' && state.currentView !== prevNavView && !isNavigatingBack) {
   let targetUrl = getViewPath(state.currentView);
   if (state.currentView === 'result' && appState.getActiveTierTab()) {
     targetUrl += `?tier=${appState.getActiveTierTab()}${AbTestService.isFunnelVariantB() ? '&ab=b' : ''}`;
   } else if (state.currentView === 'store' && getSelectedStoreProductId()) {
     targetUrl += `?product=${encodeURIComponent(getSelectedStoreProductId()!)}`;
   }
   const currentFullPath = window.location.pathname + window.location.search;
   if (currentFullPath !== targetUrl) {
     window.history.pushState({ view: state.currentView }, '', targetUrl);
   }
   updateSeoForView(state.currentView);
   prevNavView = state.currentView;
 } else if (isNavigatingBack) {
   prevNavView = state.currentView;
 }
 this.render(state);
 });

 this.bindEvents();
 this.render(appState.getState());
 
    // [모듈 연동] 쿠폰 생성 및 무통장 입금 신청 폼 서브밋 위임
    this.rootEl.addEventListener('submit', (e) => {
      const targetForm = e.target as HTMLFormElement;
      if (targetForm?.id === 'form-create-voucher') {
        e.preventDefault();
        const codeInput = document.getElementById('input-voucher-code') as HTMLInputElement;
        const nameInput = document.getElementById('input-voucher-name') as HTMLInputElement;
        const typeSelect = document.getElementById('select-voucher-type') as HTMLSelectElement;
        const valInput = document.getElementById('input-voucher-value') as HTMLInputElement;

        const code = codeInput?.value.trim();
        const name = nameInput?.value.trim();
        const type = (typeSelect?.value || 'fixed_discount') as any;
        const val = parseInt(valInput?.value || '0', 10);

        if (code && name) {
          VoucherStore.createCoupon({
            code,
            name,
            type,
            discountAmount: type === 'fixed_discount' ? val : (type === 'free_pass' ? 19900 : 0),
            discountRate: type === 'percent_discount' ? val : 0,
            targetProduct: 'all',
            expiryDate: '2026-12-31',
            enabled: true
          });
          alert(`신규 쿠폰 [${code}] 이 성공적으로 등록되었습니다.`);
          this.render(appState.getState());
        }
        return;
      }

      if (targetForm?.id === 'form-member-transfer-request') {
        e.preventDefault();
        const nameInput = document.getElementById('input-member-depositor') as HTMLInputElement;
        const selectProduct = document.getElementById('select-member-transfer-product') as HTMLSelectElement;

        const depositor = nameInput?.value.trim();
        const [amtStr, prodName] = (selectProduct?.value || '40000|마보살 정통 유료 사주풀이').split('|');
        const amount = parseInt(amtStr, 10);

        if (depositor) {
          VoucherStore.createBankTransferRequest(depositor, amount, prodName);
          alert(`[${depositor}] 님의 무통장 입금 확인 신청이 접수되었습니다.\n관리자 입금 확인 후 쿠폰이 즉시 승인 지급됩니다.`);
          this.render(appState.getState());
        }
        return;
      }

      // [관리자 CMS: 스터디 글 풀스크린 시스템 에디터 저장/발행]
      if (targetForm?.id === 'form-admin-study-article') {
        e.preventDefault();
        const articleId = (document.getElementById('admin-study-article-id') as HTMLInputElement)?.value.trim() || undefined;
        const title = (document.getElementById('admin-study-title') as HTMLInputElement)?.value.trim();
        const category = (document.getElementById('admin-study-category') as HTMLSelectElement)?.value;
        let slug = (document.getElementById('admin-study-slug') as HTMLInputElement)?.value.trim();
        const author = (document.getElementById('admin-study-author') as HTMLInputElement)?.value.trim() || '마보살 연구소';
        const tagsStr = (document.getElementById('admin-study-tags') as HTMLInputElement)?.value.trim() || '';
        const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
        const summary = (document.getElementById('admin-study-summary') as HTMLInputElement)?.value.trim();
        const content = (document.getElementById('admin-study-content') as HTMLTextAreaElement)?.value.trim();

        if (!title || !category || !summary || !content) {
          alert('필수 입력 항목(제목, 카테고리, 요약, 본문)을 모두 채워주세요.');
          return;
        }

        if (!slug) {
          slug = generateKoreanSlug(title);
        }

        if (articleId) {
          StudyService.updateArticle(articleId, {
            title,
            slug,
            category,
            author,
            tags,
            summary,
            content
          });
          alert('스터디 글이 성공적으로 수정되었습니다.');
        } else {
          StudyService.createArticle({
            title,
            slug,
            category,
            author,
            tags,
            summary,
            content
          });
          alert('새 스터디 글이 성공적으로 등록 및 발행되었습니다.');
        }

        StudyService.setEditingArticleId(null);
        setEditingStudyArticleId(null);
        setAdminActiveTab('tab-study-articles');
        this.render(appState.getState());
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // [관리자 CMS: 스터디 카테고리 신규 추가]
      if (targetForm?.id === 'form-admin-add-category') {
        e.preventDefault();
        const catNameInput = document.getElementById('admin-input-new-cat-name') as HTMLInputElement;
        const catDescInput = document.getElementById('admin-input-new-cat-desc') as HTMLInputElement;
        const catName = catNameInput?.value.trim();
        const catDesc = catDescInput?.value.trim() || '';

        if (!catName) {
          alert('카테고리 이름을 입력해주세요.');
          return;
        }

        StudyService.addCategory(catName, catDesc);
        alert(`새 카테고리 [${catName}] 이 등록되었습니다.`);
        this.render(appState.getState());
        return;
      }

      // [관리자 CMS: 스토어 카테고리 신규 추가]
      if (targetForm?.id === 'form-admin-add-store-category') {
        e.preventDefault();
        const idInput = document.getElementById('store-cat-id') as HTMLInputElement;
        const labelInput = document.getElementById('store-cat-label') as HTMLInputElement;
        const iconInput = document.getElementById('store-cat-icon') as HTMLInputElement;

        const id = idInput?.value.trim().toLowerCase();
        const label = labelInput?.value.trim();
        const icon = iconInput?.value.trim() || 'category';

        if (!id || !label) {
          alert('카테고리 ID와 표시 명칭을 모두 입력해주세요.');
          return;
        }

        const success = addStoreCategory({ id, label, icon });
        if (success) {
          alert(`새 스토어 카테고리 [${label}] 이(가) 등록되었습니다.`);
          this.render(appState.getState());
        } else {
          alert(`이미 존재하는 카테고리 ID [${id}] 이거나 유효하지 않은 식별자입니다.`);
        }
        return;
      }

      // [관리자 CMS: 네이버 쇼핑형 상품 등록 및 사진 저장]
      if (targetForm?.id === 'admin-product-cms-form') {
        e.preventDefault();
        const editId = targetForm.dataset.editId;
        const title = (document.getElementById('cms-title') as HTMLInputElement)?.value.trim();
        const category = ((document.getElementById('cms-category') as HTMLSelectElement)?.value || 'report') as StoreCategoryType;
        const price = parseInt((document.getElementById('cms-price') as HTMLInputElement)?.value || '0', 10);
        const originalPrice = parseInt((document.getElementById('cms-original-price') as HTMLInputElement)?.value || '0', 10);
        const status = ((document.getElementById('cms-status') as HTMLSelectElement)?.value || 'active') as any;
        const badge = (document.getElementById('cms-badge') as HTMLInputElement)?.value.trim() || undefined;
        const tagLine = (document.getElementById('cms-tagline') as HTMLInputElement)?.value.trim() || '';
        const description = (document.getElementById('cms-desc') as HTMLTextAreaElement)?.value.trim() || '';
        const thumbnailUrl = (document.getElementById('cms-thumb-url') as HTMLInputElement)?.value.trim() || '';
        const contentPayload = (document.getElementById('cms-content-payload') as HTMLInputElement)?.value.trim() || '';
        const deliveryType = ((document.getElementById('cms-delivery') as HTMLSelectElement)?.value || 'saju_report') as DeliveryType;
        const targetSignalsStr = (document.getElementById('cms-target-signals') as HTMLInputElement)?.value.trim() || 'money.loss';
        const targetSignals = targetSignalsStr.split(',').map(s => s.trim()).filter(Boolean);

        let galleryImages: string[] = [];
        try {
          const rawGallery = (document.getElementById('cms-gallery-data') as HTMLInputElement)?.value;
          if (rawGallery) galleryImages = JSON.parse(rawGallery);
        } catch (err) {}

        let detailImages: string[] = [];
        try {
          const rawDetail = (document.getElementById('cms-detail-data') as HTMLInputElement)?.value;
          if (rawDetail) detailImages = JSON.parse(rawDetail);
        } catch (err) {}

        if (!title || !contentPayload) {
          alert('상품명과 구매자 제공 파일 링크를 입력해 주세요.');
          return;
        }

        const productPayload = {
          title,
          category,
          price,
          originalPrice: originalPrice || price,
          status,
          badge,
          tagLine,
          description,
          thumbnailUrl,
          contentPayload,
          deliveryType,
          targetSignals,
          galleryImages,
          detailImages,
        };

        if (editId) {
          updateStoreProduct(editId, productPayload);
          alert(`[상품 수정 완료]\n\n'${title}' 상품 정보 및 사진이 성공적으로 수정되었습니다.`);
        } else {
          saveStoreProduct(productPayload);
          alert(`[신규 상품 등록 완료]\n\n'${title}' 상품과 사진이 스토어에 등록되어 판매가 시작되었습니다!`);
        }

        setEditingStoreProductId(null);
        setAdminStoreSubTab('products');
        this.render(appState.getState());
        return;
      }

      // [고객센터 1:1 온라인 문의 접수 -> 관리자 대시보드 저장 연동]
      if (targetForm?.id === 'form-customer-support') {
        e.preventDefault();
        const category = (document.getElementById('support-category') as HTMLSelectElement)?.value || '일반 문의';
        const name = (document.getElementById('support-name') as HTMLInputElement)?.value.trim() || '의뢰인';
        const replyEmail = (document.getElementById('support-reply-email') as HTMLInputElement)?.value.trim();
        const phone = (document.getElementById('support-phone') as HTMLInputElement)?.value.trim();
        const orderId = (document.getElementById('support-order-id') as HTMLInputElement)?.value.trim();
        const title = (document.getElementById('support-title') as HTMLInputElement)?.value.trim();
        const content = (document.getElementById('support-content') as HTMLTextAreaElement)?.value.trim();

        if (!replyEmail || !title || !content) {
          alert('필수 입력 항목(회신 이메일, 제목, 문의 내용)을 모두 작성해 주세요.');
          return;
        }

        // 1. 관리자 대시보드 수신용 인하우스 저장소에 등록
        const user = AuthService.getCurrentUser();
        const newInquiry = CustomerInquiryStore.addInquiry({
          userId: user.role !== 'guest' ? (user.id || user.username) : undefined,
          userName: name,
          replyEmail,
          phone: phone || undefined,
          orderId: orderId || undefined,
          category,
          title,
          content,
        });

        // 2. 외부 메일 클라이언트 앱 백업 연동 (anbtiteam@gmail.com)
        const supportEmail = 'anbtiteam@gmail.com';
        const subject = encodeURIComponent(`[마보살 고객센터 문의] [${category}] ${title}`);
        const mailBody = encodeURIComponent(
`[마보살 1:1 고객센터 온라인 접수]
• 접수번호: ${newInquiry.id}
• 접수일시: ${new Date().toLocaleString()}
• 문의유형: ${category}
• 작성자: ${name}
• 회신받을 이메일: ${replyEmail}
• 연락처: ${phone || '미입력'}
• 주문번호: ${orderId || '없음'}

[문의 내용]
${content}
`
        );
        const mailtoUrl = `mailto:${supportEmail}?subject=${subject}&body=${mailBody}`;

        // 성공 안내 박스 표시
        const successBox = document.getElementById('support-success-message');
        if (successBox) {
          successBox.style.display = 'block';
        }

        alert(`문의가 정상적으로 접수되었습니다!\n\n• 접수번호: ${newInquiry.id}\n• 문의유형: ${category}\n• 작성자: ${name} (${replyEmail})\n\n관리자 대시보드 고객지원 센터에 등록되었으며, 담당자가 확인 후 24시간 이내에 회신해 드리겠습니다.`);
        
        // 폼 초기화 및 모달 닫기
        setTimeout(() => {
          targetForm.reset();
          const modal = document.getElementById('modal-support-container');
          if (modal) modal.style.display = 'none';
          if (successBox) successBox.style.display = 'none';
          this.render(appState.getState());
        }, 1200);

        return;
      }

      // [상품 구매 후기(리뷰) 제출 처리 및 500엽 적립]
      if (targetForm?.id === 'form-submit-product-review') {
        e.preventDefault();
        const orderId = (document.getElementById('review-order-id') as HTMLInputElement)?.value;
        const productId = (document.getElementById('review-product-id') as HTMLInputElement)?.value || 'core-lifelong-saju';
        const productTitle = (document.getElementById('review-product-title') as HTMLInputElement)?.value || '사주 리포트';
        const rating = parseInt((document.getElementById('input-review-rating') as HTMLInputElement)?.value || '5', 10);
        const content = (document.getElementById('review-content') as HTMLTextAreaElement)?.value.trim();

        if (!content || content.length < 5) {
          alert('후기 내용을 5자 이상 솔직하게 작성해 주세요.');
          return;
        }

        const tags: string[] = [];
        document.querySelectorAll('input[name="review-tag"]:checked').forEach(cb => {
          tags.push((cb as HTMLInputElement).value);
        });

        const user = AuthService.getCurrentUser();
        const authorName = user.role !== 'guest' ? user.name : '익명 고객';

        ProductReviewStore.addReview({
          productId,
          productTitle,
          orderId,
          userId: user.role !== 'guest' ? user.username : undefined,
          authorName,
          rating,
          content,
          tags,
          isBest: false,
        });

        alert(`소중한 구매 후기가 성공적으로 등록되었습니다. 감사합니다!`);
        this.closeReviewWriteModal();
        this.render(appState.getState());
        return;
      }
    });

  }

 /** 토스페이먼츠 결제창에서 돌아왔을 때(successUrl/failUrl) 처리 */
  private async handlePaymentReturn(params: URLSearchParams) {
    const result = await PaymentService.handleReturn(params);
    window.history.replaceState({ view: 'store' }, '', window.location.pathname + '?view=store');
    if (result.kind === 'order') setLastStoreOrder(result.order);
    else if (result.kind === 'error') alert(result.message);
    this.render(appState.getState());
  }

  private static readonly PRESERVED_FIELD_IDS = [
 'input-user-name',
 'input-birth-date',
 'input-birth-time',
 'check-missing-hour',
 'select-region',
 'input-trouble-text',
 'check-leap-month',
 'check-enable-partner',
 'input-partner-name',
 'select-partner-relation',
 'input-partner-birth-date',
 'input-partner-birth-time',
 'check-partner-missing-hour',
 ];

 /** 재렌더링 직전 사용자가 입력 중인 폼 값을 저장 */
 private snapshotFormValues(): Record<string, { value: string; checked: boolean; disabled: boolean }> {
 const snap: Record<string, { value: string; checked: boolean; disabled: boolean }> = {};
 for (const id of MabosalApp.PRESERVED_FIELD_IDS) {
 const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
 if (el) {
 snap[id] = {
 value: el.value,
 checked: (el as HTMLInputElement).checked ?? false,
 disabled: (el as HTMLInputElement).disabled ?? false,
 };
 }
 }
 return snap;
 }

 /** 재렌더링 직후 저장해 둔 폼 값을 복원 */
 private restoreFormValues(snap: Record<string, { value: string; checked: boolean; disabled: boolean }>) {
 for (const id of Object.keys(snap)) {
 const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
 if (!el) continue;
 const s = snap[id];
 if (el instanceof HTMLInputElement && el.type === 'checkbox') {
 el.checked = s.checked;
 } else {
 el.value = s.value;
 }
 if ('disabled' in el) (el as HTMLInputElement).disabled = s.disabled;
 }
 }

 private ensureLayoutShell(state: AppStateData) {
 if (this.isShellMounted) {
   const headerContainer = document.getElementById('app-header-container');
   if (headerContainer) headerContainer.innerHTML = renderHeader(state);
   const dockContainer = document.getElementById('app-dock-container');
   if (dockContainer) dockContainer.innerHTML = renderFloatingBottomDock(state.currentView);
   const drawerContainer = document.getElementById('app-drawer-container');
   if (drawerContainer) drawerContainer.innerHTML = renderMobileNavDrawer(state);
   return;
 }

 this.rootEl.innerHTML = `
 <div id="app-header-container">${renderHeader(state)}</div>
 <main id="app-main">
   <div class="app-container" id="page-outlet"></div>
 </main>
 <div id="app-footer-container">${renderFooter()}</div>
 <div id="app-modals-container">
   ${renderLegalAndSupportModals()}
   ${renderFortuneDetailModals()}
   <div id="evidence-modal-slot">${renderEvidenceTraceModal(state)}</div>
   ${renderCheonmyeongwonShareModal()}
   ${renderAuthModal()}
   <div id="checkout-modal-container"></div>
   <div id="cart-modal-container"></div>
   <div id="order-review-modal-container"></div>
   <div id="review-write-modal-container"></div>
 </div>
 <div id="app-dock-container">${renderFloatingBottomDock(state.currentView)}</div>
 <div id="app-drawer-container">${renderMobileNavDrawer(state)}</div>
 `;
 this.isShellMounted = true;
 }

 private render(state: AppStateData) {
 this.ensureLayoutShell(state);

 const outletEl = document.getElementById('page-outlet');
 if (!outletEl) return;

 const wasAnalyzeView = !!document.getElementById('form-birth-input');
 const formSnapshot = wasAnalyzeView ? this.snapshotFormValues() : null;

 // [모던 웹 표준: 독립 Page 컴포넌트 마운트]
 const currentPath = getViewPath(state.currentView);
 mountPageToOutlet(currentPath, outletEl);

 const modalSlot = document.getElementById('evidence-modal-slot');
 if (modalSlot) modalSlot.innerHTML = renderEvidenceTraceModal(state);

 if (formSnapshot && state.currentView === 'analyze') {
 this.restoreFormValues(formSnapshot);
 }

 if (state.currentView === 'consult') {
 const scrollEl = document.getElementById('chat-messages-box');
 if (scrollEl) {
 scrollEl.scrollTop = scrollEl.scrollHeight;
 }
 }
 }

 private bindEvents() {
 // 관리자 모듈 활성화/비활성화 토글 스위치 리스너
 this.rootEl.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;

    // [체크아웃 보드: 관리자 활성화 쿠폰 라디오 선택 시 자동 적용]
    if (target && target.classList?.contains('radio-auto-coupon')) {
      const code = target.value;
      const codeInput = document.getElementById('checkout-coupon-code') as HTMLInputElement;
      if (codeInput) {
        codeInput.value = code;
      }
      const applyBtn = document.getElementById('btn-apply-coupon');
      if (applyBtn) {
        applyBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }
      return;
    }

    // [관리자 CMS: 상품 판매 상태 드롭다운 원클릭 즉시 저장 (판매중 / 숨김 / 품절)]
    if (target && target.classList?.contains('select-product-status-quick')) {
      const selectEl = target as unknown as HTMLSelectElement;
      const prodId = selectEl.dataset.productId;
      const title = selectEl.dataset.productTitle || '상품';
      const newStatus = selectEl.value as 'active' | 'hidden' | 'soldout';
      if (prodId && newStatus) {
        updateStoreProduct(prodId, { status: newStatus });
        const statusMap: Record<string, string> = {
          active: '판매중 (스토어 노출)',
          hidden: '숨김 (스토어 미노출)',
          soldout: '품절',
        };
        alert(`[상품 판매 상태 저장]\n\n'${title}' 상품이 '${statusMap[newStatus] || newStatus}' 상태로 즉시 변경되어 저장되었습니다.`);
        this.render(appState.getState());
      }
      return;
    }

 // [관리자 CMS: PDF / 전자책 디지털 파일 직접 선택]
 if (target?.id === 'cms-digital-file-input' && target.files && target.files[0]) {
   const file = target.files[0];
   const payloadInput = document.getElementById('cms-content-payload');
   const statusDiv = document.getElementById('cms-digital-file-status');
   const deliverySelect = document.getElementById('cms-delivery');
   if (deliverySelect) (deliverySelect as HTMLSelectElement).value = 'digital_download';
   const reader = new FileReader();
   reader.onload = (ev) => {
     const dataUrl = ev.target?.result;
     if (payloadInput) (payloadInput as HTMLInputElement).value = (dataUrl as string) || ('/downloads/' + file.name);
     if (statusDiv) {
       statusDiv.innerHTML = `<span style="color: #4ade80; font-weight: 700;">✓ 파일 첨부 완료: ${file.name} (${(file.size / 1024).toFixed(1)} KB)</span> — 구매 시 즉시 다운로드 제공됩니다.`;
     }
   };
   reader.readAsDataURL(file);
   return;
 }

 // [관리자 CMS: 대표 썸네일 사진 파일 선택]
 if (target?.id === 'cms-thumb-file-input' && target.files && target.files[0]) {
   const file = target.files[0];
   compressImageFile(file, 900, 0.85).then(base64 => {
     const imgEl = document.getElementById('cms-thumb-preview-img') as HTMLImageElement;
     const placeholderEl = document.getElementById('cms-thumb-placeholder');
     const urlInput = document.getElementById('cms-thumb-url') as HTMLInputElement;
     if (imgEl) {
       imgEl.src = base64;
       imgEl.style.display = 'block';
     }
     if (placeholderEl) placeholderEl.style.display = 'none';
     if (urlInput) urlInput.value = base64;
   }).catch(err => {
     console.error('[Image Upload] error:', err);
     alert('이미지 파일을 처리하는 중 오류가 발생했습니다.');
   });
   return;
 }

 // [관리자 CMS: 추가 갤러리 사진 파일 다중 선택]
 if (target?.id === 'cms-gallery-file-input' && target.files && target.files.length > 0) {
   const files = Array.from(target.files);
   Promise.all(files.map(f => compressImageFile(f, 900, 0.85))).then(base64List => {
     const dataInput = document.getElementById('cms-gallery-data') as HTMLInputElement;
     const container = document.getElementById('cms-gallery-preview-container');
     let currentList: string[] = [];
     try {
       if (dataInput?.value) currentList = JSON.parse(dataInput.value);
     } catch (err) {}

     const updated = [...currentList, ...base64List].slice(0, 9); // 네이버 쇼핑 기준 추가 갤러리 최대 9장
     if (dataInput) dataInput.value = JSON.stringify(updated);

     if (container) {
       const emptyMsg = document.getElementById('cms-gallery-empty-msg');
       if (emptyMsg) emptyMsg.remove();
       container.innerHTML = updated.map((imgUrl, idx) => `
         <div class="cms-gallery-thumb-chip" data-idx="${idx}" style="position: relative; width: 56px; height: 56px; border-radius: 6px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2);">
           <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
           <button type="button" class="btn-del-gallery-img" data-idx="${idx}" style="position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.7); color: #fff; border: none; border-radius: 50%; width: 16px; height: 16px; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1;">×</button>
         </div>
       `).join('');
     }
   });
   return;
 }

 // [관리자 CMS: 상세페이지 안내 이미지 다중 선택]
 if (target?.id === 'cms-detail-file-input' && target.files && target.files.length > 0) {
   const files = Array.from(target.files);
   Promise.all(files.map(f => compressImageFile(f, 1000, 0.85))).then(base64List => {
     const dataInput = document.getElementById('cms-detail-data') as HTMLInputElement;
     const container = document.getElementById('cms-detail-preview-container');
     let currentList: string[] = [];
     try {
       if (dataInput?.value) currentList = JSON.parse(dataInput.value);
     } catch (err) {}

     const updated = [...currentList, ...base64List].slice(0, 5); // 상세페이지 통이미지 최대 5장
     if (dataInput) dataInput.value = JSON.stringify(updated);

     if (container) {
       const emptyMsg = document.getElementById('cms-detail-empty-msg');
       if (emptyMsg) emptyMsg.remove();
       container.innerHTML = updated.map((imgUrl, idx) => `
         <div class="cms-detail-thumb-chip" data-idx="${idx}" style="position: relative; width: 56px; height: 56px; border-radius: 6px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2);">
           <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
           <button type="button" class="btn-del-detail-img" data-idx="${idx}" style="position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.7); color: #fff; border: none; border-radius: 50%; width: 16px; height: 16px; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1;">×</button>
         </div>
       `).join('');
     }
   });
   return;
 }

 // [장바구니 보드: 전체 선택 체크박스]
 if (target?.id === 'cart-check-all') {
   CartStore.toggleSelectAll(target.checked);
   this.render(appState.getState());
   return;
 }

 // [장바구니 보드: 개별 항목 선택 체크박스]
 if (target?.classList.contains('cart-item-checkbox')) {
   const cId = target.dataset.id;
   if (cId) {
     CartStore.toggleSelect(cId);
     this.render(appState.getState());
   }
   return;
 }

 // [주문서 작성 보드: 전체 약관 동의 체크박스]
 if (target?.id === 'check-agree-all-terms') {
   document.querySelectorAll('.term-sub-check').forEach(el => {
     (el as HTMLInputElement).checked = target.checked;
   });
   return;
 }

 // 마스터 핵심 서비스 제어 (중간 제어 계층)
 if (target?.classList.contains('admin-master-toggle')) {
 const masterKey = target.dataset.masterKey;
 if (masterKey) {
 ModuleRegistry.toggleMasterFeature(masterKey, target.checked);
 this.render(appState.getState());
 }
 return;
 }

 if (target?.classList.contains('admin-module-toggle')) {
 const modId = target.dataset.moduleId;
 if (modId) {
 ModuleRegistry.toggleModule(modId, target.checked);
 // 즉시 UI 피드백
 const card = target.closest('div[style*="border-radius: 12px"]');
 if (card) {
 const statusLabel = card.querySelector('span[style*="화면"]') as HTMLElement;
 if (statusLabel) {
 statusLabel.textContent = target.checked ? '화면 노출 ON' : '화면 숨김 OFF';
 statusLabel.style.color = target.checked ? '#f2ca50' : 'var(--text-muted)';
 }
 }
 }
 }
 });

 // 생년월일/출생시간 입력 정제 (숫자·구분기호 입력/붙여넣기 모두 안전하게 허용)
 this.rootEl.addEventListener('input', (e) => {
 const target = e.target as HTMLInputElement;
 if (target?.id === 'input-birth-date') {
 const cleaned = target.value.replace(/[^0-9\-./\s]/g, '').slice(0, 10);
 if (cleaned !== target.value) target.value = cleaned;
 } else if (target?.id === 'input-birth-time') {
 const cleaned = target.value.replace(/[^0-9:]/g, '').slice(0, 5);
 if (cleaned !== target.value) target.value = cleaned;
 }
 });

 this.rootEl.addEventListener('click', async (e) => {
  const target = e.target as HTMLElement;
  if (!target) return;

  // [최우선 순위: 브랜드 로고 및 홈 네비게이션 클릭 -> 완전한 홈 복귀 및 상태 초기화]
  if (target.closest('#btn-nav-brand') || target.closest('#nav-btn-landing')) {
    e.preventDefault();
    selectStoreProduct(null, false);
    const drawer = document.getElementById('mobile-nav-drawer');
    const backdrop = document.getElementById('mobile-nav-backdrop');
    if (drawer) drawer.style.display = 'none';
    if (backdrop) backdrop.style.display = 'none';
    navigateTo('/');
    return;
  }

  // [신규 SPA 테마 라우팅: data-nav 및 내부 a 태그 클릭 가로채기]
  const navAnchor = target.closest('a[data-nav], a[href^="/"]') as HTMLAnchorElement | null;
  if (navAnchor && !navAnchor.target && !navAnchor.hasAttribute('download')) {
    const href = navAnchor.getAttribute('data-nav') || navAnchor.getAttribute('href');
    if (href && href.startsWith('/')) {
      e.preventDefault();
      if (appState.getState().isOnboarding && !href.includes('/analyze')) {
        alert('✨ 회원가입 필수 단계: 사주 원국 정보를 먼저 저장해 주셔야 맞춤 서비스 이용이 가능합니다.');
        return;
      }
      // 모바일 드로어가 열려있을 경우 자동 닫힘
      const drawer = document.getElementById('mobile-nav-drawer');
      const backdrop = document.getElementById('mobile-nav-backdrop');
      if (drawer) drawer.style.display = 'none';
      if (backdrop) backdrop.style.display = 'none';

      navigateTo(href);
      return;
    }
  }

  // [달력 카테고리 서브탭 전환 버튼 인터랙션]
  if (target.closest('#btn-subtab-magi-cal')) {
    e.preventDefault();
    navigateTo('/calendar?tab=magi');
    return;
  }
  if (target.closest('#btn-subtab-lucky-cal')) {
    e.preventDefault();
    navigateTo('/calendar?tab=lucky');
    return;
  }

  // ==============================================================
  // [최우선 순위: 모바일 햄버거 전체 메뉴 토글]
  // ==============================================================
  if (target.closest('#btn-mobile-hamburger') || target.closest('.mobile-hamburger-btn')) {
    e.preventDefault();
    e.stopPropagation();
    const drawer = document.getElementById('mobile-nav-drawer');
    const backdrop = document.getElementById('mobile-nav-backdrop');
    if (drawer) {
      const isVisible = drawer.style.display === 'flex';
      drawer.style.display = isVisible ? 'none' : 'flex';
      if (backdrop) backdrop.style.display = isVisible ? 'none' : 'block';
    }
    return;
  }
  if (target.closest('#mobile-nav-backdrop') || target.closest('#btn-close-mobile-nav')) {
    e.preventDefault();
    e.stopPropagation();
    const drawer = document.getElementById('mobile-nav-drawer');
    const backdrop = document.getElementById('mobile-nav-backdrop');
    if (drawer) drawer.style.display = 'none';
    if (backdrop) backdrop.style.display = 'none';
    return;
  }

  // 모바일 드롭다운 메뉴 클릭 시 자동 닫힘 공통 처리
  if (target.closest('.mobile-drawer-item')) {
    const drawer = document.getElementById('mobile-nav-drawer');
    const backdrop = document.getElementById('mobile-nav-backdrop');
    if (drawer) drawer.style.display = 'none';
    if (backdrop) backdrop.style.display = 'none';
  }

  if (target.closest('#m-nav-fortune')) {
    appState.setView('fortune' as any);
    const drawer = document.getElementById('mobile-nav-drawer');
    const backdrop = document.getElementById('mobile-nav-backdrop');
    if (drawer) drawer.style.right = '-290px';
    if (backdrop) backdrop.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.render(appState.getState());
    return;
  }
  if (target.closest('#m-nav-magi-cal')) {
    appState.setView('magi-calendar' as any);
    const drawer = document.getElementById('mobile-nav-drawer');
    const backdrop = document.getElementById('mobile-nav-backdrop');
    if (drawer) drawer.style.right = '-290px';
    if (backdrop) backdrop.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.render(appState.getState());
    return;
  }


  // ==============================================================
  // [최우선 순위: 스토어 모바일 좌측 카테고리 슬라이드 드로어]
  // ==============================================================
  if (target.closest('#btn-open-store-drawer') || target.closest('.btn-toggle-store-drawer')) {
    e.preventDefault();
    e.stopPropagation();
    const sidebar = document.getElementById('store-sidebar-drawer');
    const backdrop = document.getElementById('store-drawer-backdrop');
    if (sidebar) sidebar.classList.add('drawer-open');
    if (backdrop) backdrop.classList.add('active');
    return;
  }
  if (target.closest('#btn-close-store-drawer') || target.closest('#store-drawer-backdrop')) {
    e.preventDefault();
    e.stopPropagation();
    const sidebar = document.getElementById('store-sidebar-drawer');
    const backdrop = document.getElementById('store-drawer-backdrop');
    if (sidebar) sidebar.classList.remove('drawer-open');
    if (backdrop) backdrop.classList.remove('active');
    return;
  }

  // ==============================================================
  // [최우선 순위: 스터디 모바일 좌측 카테고리 슬라이드 드로어]
  // ==============================================================
  if (target.closest('#btn-open-study-drawer') || target.closest('.btn-toggle-study-drawer')) {
    e.preventDefault();
    e.stopPropagation();
    const sidebar = document.getElementById('study-sidebar-drawer');
    const backdrop = document.getElementById('study-drawer-backdrop');
    if (sidebar) sidebar.classList.add('drawer-open');
    if (backdrop) backdrop.classList.add('active');
    return;
  }
  if (target.closest('#btn-close-study-drawer') || target.closest('#study-drawer-backdrop')) {
    e.preventDefault();
    e.stopPropagation();
    const sidebar = document.getElementById('study-sidebar-drawer');
    const backdrop = document.getElementById('study-drawer-backdrop');
    if (sidebar) sidebar.classList.remove('drawer-open');
    if (backdrop) backdrop.classList.remove('active');
    return;
  }

 // 0-1. 소장용 TXT 텍스트 파일 다운로드
 if (target.closest('.btn-download-txt')) {
 const stateData = appState.getState();
 const txtDoc = generateDownloadableReportText(stateData);
 const userName = stateData.userName || (stateData.userTroubleText ? '의뢰인' : '홍길동');
 const blob = new Blob([txtDoc], { type: 'text/plain;charset=utf-8' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.style.display = 'none';
 a.href = url;
 a.download = `${userName}_마보살_사주리포트.txt`;
 document.body.appendChild(a);
 a.click();

 setTimeout(() => {
 if (a.parentNode) {
 document.body.removeChild(a);
 }
 URL.revokeObjectURL(url);
 }, 2000);

 const btn = target.closest('.btn-download-txt') as HTMLElement;
 if (btn) {
 const originalContent = btn.innerHTML;
 btn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px; color: #f2ca50;">check_circle</span> 다운로드 완료!`;
 setTimeout(() => {
 btn.innerHTML = originalContent;
 }, 2500);
 }
 return;
 }

 // 0-2. PDF 저장 버튼
 if (target.closest('.btn-download-pdf')) {
 window.print();
 return;
 }

  // 0-3. 신년 심층 대운 배너 바로가기 (2026/2027 신년 대운 연동)
  if (target.closest('.btn-goto-newyear-2027, [data-action="goto-newyear"]')) {
    appState.setActiveTierTab('YEAR_2027');
    if (appState.getState().calcResult) {
      appState.setView('result');
    } else {
      appState.setView('analyze');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  // 0-4. 천명원 10번 비전 바로가기 4대 퀵 네비게이션
  const quickNavBtn = target.closest('.btn-quick-nav') as HTMLElement;
  if (quickNavBtn) {
    const action = quickNavBtn.dataset?.action;
    if (action === 'goto-chemistry') {
      appState.setActiveTierTab('CHEMISTRY');
      if (appState.getState().calcResult) {
        appState.setView('result');
      } else {
        appState.setView('analyze');
      }
    } else if (action === 'goto-tarot') {
      const tarotModal = document.getElementById('modal-tarot-preview');
      if (tarotModal) tarotModal.style.display = 'flex';
      return;
    } else if (action === 'goto-daeun') {
      appState.setActiveTierTab('PAID');
      if (appState.getState().calcResult) {
        appState.setView('result');
        setTimeout(() => {
          const chartEl = document.querySelector('.daeun-chart-card, #daeun-lifecycle-chart, .spline-chart-card') as HTMLElement;
          if (chartEl) chartEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      } else {
        appState.setView('analyze');
      }
    } else { // goto-saju
      appState.setActiveTierTab('FREE');
      if (appState.getState().calcResult) {
        appState.setView('result');
      } else {
        appState.setView('analyze');
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  // 0-5. 오늘의 행운 처방 상세 모달 열기 (색상, 방위, 숫자, 지혜)
  const presCard = target.closest('[data-prescription-card]') as HTMLElement;
  if (presCard) {
    const type = presCard.dataset.prescriptionCard;
    const val = presCard.dataset.val || '';
    const hex = presCard.dataset.hex || '#d4af37';
    (this as any).openPrescriptionModal(type, val, hex);
    return;
  }

  // 0-6. 행운지수 (천기지수) 심층 분석 모달 열기
  if (target.closest('.interactive-fortune-score-card, [data-open-score-modal]')) {
    const card = (target.closest('.interactive-fortune-score-card') || target.closest('[data-open-score-modal]')) as HTMLElement;
    if (card && card.dataset.score) {
      const scoreEl = document.getElementById('modal-fortune-score-circle');
      const titleEl = document.getElementById('modal-fortune-grade-title');
      const descEl = document.getElementById('modal-fortune-grade-desc');
      const mTitleEl = document.getElementById('modal-fortune-money-title');
      const mDescEl = document.getElementById('modal-fortune-money-desc');
      const lTitleEl = document.getElementById('modal-fortune-love-title');
      const lDescEl = document.getElementById('modal-fortune-love-desc');
      const vTitleEl = document.getElementById('modal-fortune-vitality-title');
      const vDescEl = document.getElementById('modal-fortune-vitality-desc');

      if (scoreEl) scoreEl.textContent = card.dataset.score;
      if (titleEl) {
        const grade = card.dataset.grade ? `${card.dataset.grade} · ` : '';
        const title = card.dataset.title || '길조의 기운';
        titleEl.textContent = `${grade}${title} (${card.dataset.score}점)`;
      }
      if (descEl && card.dataset.desc) descEl.textContent = card.dataset.desc;
      if (mTitleEl && card.dataset.moneyScore) mTitleEl.textContent = `💰 금전운 (${card.dataset.moneyScore}점)`;
      if (mDescEl && card.dataset.moneyDesc) mDescEl.textContent = card.dataset.moneyDesc;
      if (lTitleEl && card.dataset.loveScore) lTitleEl.textContent = `💖 애정운 (${card.dataset.loveScore}점)`;
      if (lDescEl && card.dataset.loveDesc) lDescEl.textContent = card.dataset.loveDesc;
      if (vTitleEl && card.dataset.vitalityScore) vTitleEl.textContent = `⚡ 활력도 (${card.dataset.vitalityScore}점)`;
      if (vDescEl && card.dataset.vitalityDesc) vDescEl.textContent = card.dataset.vitalityDesc;
    }
    const scoreModal = document.getElementById('modal-fortune-score-detail');
    if (scoreModal) scoreModal.style.display = 'flex';
    return;
  }

  // 0-7. 황금 길시 행동 가이드 모달 열기 (사시, 미시)
  const hourItem = target.closest('[data-auspicious-hour]') as HTMLElement;
  if (hourItem) {
    const hourType = hourItem.dataset.auspiciousHour || 'sashi';
    (this as any).openAuspiciousHourModal(hourType);
    return;
  }

  // 0-8. 마보살 인터랙티브 모달 닫기
  const closeFortuneBtn = target.closest('.btn-close-fortune-modal') as HTMLElement;
  if (closeFortuneBtn) {
    const modalId = closeFortuneBtn.dataset.modalId;
    if (modalId) {
      const modalEl = document.getElementById(modalId);
      if (modalEl) modalEl.style.display = 'none';
    } else {
      const parentModal = closeFortuneBtn.closest('.mabosal-interactive-modal') as HTMLElement;
      if (parentModal) parentModal.style.display = 'none';
    }
    return;
  }

  // 0-9. 타로 프리뷰 모달 내 '정통 사주 보기' 버튼
  if (target.closest('#btn-goto-saju-from-tarot')) {
    const tarotModal = document.getElementById('modal-tarot-preview');
    if (tarotModal) tarotModal.style.display = 'none';
    appState.setActiveTierTab('FREE');
    if (appState.getState().calcResult) {
      appState.setView('result');
    } else {
      appState.setView('analyze');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  // 0-10. 길시 모달 내 '길일 달력 보기' 버튼
  if (target.closest('#btn-goto-lucky-cal-from-modal')) {
    const hourModal = document.getElementById('modal-auspicious-hour-detail');
    if (hourModal) hourModal.style.display = 'none';
    appState.setView('lucky-calendar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

    // [비로그인 회원 보호]: 로그인하지 않은 상태에서 마기나 방비 클릭 시 로그인 모달 오픈
    if (target.closest('[data-locked-auth]')) {
      e.preventDefault();
      e.stopPropagation();
      alert('회원가입 및 로그인이 필요합니다.');
      this.openAuthModal('login');
      return;
    }

    // 오늘의 운세, 마기, 방비 3단 아코디언 토글 클릭
    const toggleCardBtn = target.closest('[data-toggle-card]') as HTMLElement;
    if (toggleCardBtn) {
      const cardKey = toggleCardBtn.dataset.toggleCard as 'fortune' | 'magi' | 'defense';
      if (cardKey) {
        if ((cardKey === 'magi' || cardKey === 'defense') && !AuthService.isAuthenticated()) {
          alert('회원가입 및 로그인이 필요합니다.');
          this.openAuthModal('login');
          return;
        }
        toggleCardExpanded(cardKey);
        this.render(appState.getState());
      }
      return;
    }

    // 프리미엄 확장 월간 행운 달력 / 마기 달력 토글 클릭
    
 // 0-4. 사용자 프로필 전환 / 추가 버튼
 if (target.closest('#switchUserBtn')) {
 alert('등록된 사주 명식 목록을 불러옵니다.');
 return;
 }
 if (target.closest('#addUserBtn')) {
 appState.setView('analyze');
 window.scrollTo({ top: 0, behavior: 'smooth' });
 return;
 }

 // 0-5. 천명원 결실 부적 저장
 if (target.closest('#btn-save-talisman')) {
 alert(' 대길 황금 결실 부적이 스마트폰 갤러리에 고해상도로 안전하게 저장되었습니다.');
 return;
 }

 // 0-6. 천명원 부적 공유 모달 열기 / 닫기
 if (target.closest('#btn-open-share-modal')) {
 const modal = document.getElementById('cheonmyeongwon-share-modal');
 if (modal) modal.style.display = 'flex';
 return;
 }
 if (target.closest('#btn-close-share-modal')) {
 const modal = document.getElementById('cheonmyeongwon-share-modal');
 if (modal) modal.style.display = 'none';
 return;
 }

 // 0-7. 천명원 공유 채널 클릭 (+100엽전 보상)
 const shareChannelBtn = target.closest('.btn-share-channel') as HTMLElement;
 if (shareChannelBtn) {
 const channel = shareChannelBtn.dataset.channel;
 const modal = document.getElementById('cheonmyeongwon-share-modal');
 if (modal) modal.style.display = 'none';

 if (channel === 'copy-link') {
 navigator.clipboard?.writeText(window.location.href);
 alert(' 부적 공유 링크가 클립보드에 복사되었습니다!\n\n 보상: +100 엽전이 지갑에 즉시 적립되었습니다.');
 } else if (channel === 'copy-image') {
 alert('️ 부적 이미지가 클립보드에 복사되었습니다!\n\n 보상: +100 엽전이 지갑에 즉시 적립되었습니다.');
 } else if (channel === 'kakao') {
 alert(' 카카오톡 친구에게 대길 결실 부적이 전송되었습니다!\n\n 보상: +100 엽전이 지갑에 즉시 적립되었습니다.');
 } else {
 alert(' 인스타그램 스토리에 황금 부적 템플릿이 공유되었습니다!\n\n 보상: +100 엽전이 지갑에 즉시 적립되었습니다.');
 }
 return;
 }

 // 0-8. 천명원 디지털 금고 암호화 ZIP 백업
 if (target.closest('#btn-vault-backup-zip')) {
 const stateData = appState.getState();
 const txtDoc = generateDownloadableReportText(stateData);
 const userName = stateData.userName || (stateData.userTroubleText ? '의뢰인' : '홍길동');
 const blob = new Blob([txtDoc], { type: 'text/plain;charset=utf-8' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `[사주분석]_${userName}_평생사주_리포트.txt`;
 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 URL.revokeObjectURL(url);
 alert(`사주 분석 리포트 다운로드 완료\n\n• 명주: ${userName} 님\n• 전체 사주 분석 결과 리포트\n• 저장 위치: 이용자 PC의 [다운로드(Downloads)] 폴더\n\n탐색기 [다운로드] 폴더에서 확인하실 수 있습니다.`);
 return;
 }

 // 0-9. 최고 관리자 대시보드 인터랙션
 if (target.closest('#btn-admin-to-service')) {
 appState.setView('landing');
 window.scrollTo({ top: 0, behavior: 'smooth' });
 return;
 }
 if (target.closest('#btn-admin-reset-defaults')) {
 ModuleRegistry.resetToDefault();
 this.render(appState.getState());
 alert('모듈 설정 및 상품 티어 설정이 초기 기본값으로 복원되었습니다.');
 return;
 }

 // [스토어] 카테고리 칩 필터링
    const catBtn = (target.closest('.btn-store-cat-nav') || target.closest('.btn-store-category')) as HTMLElement | null;
    if (catBtn) {
      const cat = catBtn.dataset.category as StoreCategoryType;
      if (cat) {
        setStoreActiveCategory(cat);
        selectStoreProduct(null); // Return to category product grid!
        const storeDrawer = document.getElementById('store-sidebar-drawer');
        const storeBackdrop = document.getElementById('store-drawer-backdrop');
        if (storeDrawer) storeDrawer.classList.remove('drawer-open');
        if (storeBackdrop) storeBackdrop.classList.remove('active');
        this.render(appState.getState());
      }
      return;
    }

    // [스토어] 상품 선택 (팝업 모달 대신 우측 상세/주문 화면으로 전환)
    const detailBtn = target.closest('.btn-open-product-detail') as HTMLElement | null;
    const prodCard = target.closest('.store-product-card') as HTMLElement | null;
    const targetProdId = detailBtn?.dataset.productId || prodCard?.dataset.productId;
    if (targetProdId && !target.closest('.store-detail-container')) {
      selectStoreProduct(targetProdId);
      this.render(appState.getState());
      return;
    }

    // [스토어] 목록으로 돌아가기 버튼
    if (target.closest('.btn-back-to-store-list') || target.closest('#btn-store-back-to-list')) {
      selectStoreProduct(null);
      this.render(appState.getState());
      return;
    }

    // [스토어 상세 갤러리 썸네일 클릭/호버 전환]
    const galleryThumbBtn = target.closest('.btn-store-gallery-thumb') as HTMLElement | null;
    if (galleryThumbBtn) {
      const imgUrl = galleryThumbBtn.dataset.imgUrl;
      const mainImg = document.getElementById('store-main-gallery-view') as HTMLImageElement;
      if (mainImg && imgUrl) {
        mainImg.src = imgUrl;
        document.querySelectorAll('.btn-store-gallery-thumb').forEach(b => {
          (b as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)';
        });
        galleryThumbBtn.style.borderColor = 'var(--primary)';
      }
      return;
    }

    // [관리자 CMS: 대표 사진 지우기 버튼]
    if (target.closest('#btn-remove-thumb-img')) {
      const imgEl = document.getElementById('cms-thumb-preview-img') as HTMLImageElement;
      const placeholderEl = document.getElementById('cms-thumb-placeholder');
      const urlInput = document.getElementById('cms-thumb-url') as HTMLInputElement;
      const fileInput = document.getElementById('cms-thumb-file-input') as HTMLInputElement;
      if (imgEl) {
        imgEl.src = '';
        imgEl.style.display = 'none';
      }
      if (placeholderEl) placeholderEl.style.display = 'block';
      if (urlInput) urlInput.value = '';
      if (fileInput) fileInput.value = '';
      return;
    }

    // [관리자 CMS: 갤러리 칩 삭제]
    const delGalleryBtn = target.closest('.btn-del-gallery-img') as HTMLElement | null;
    if (delGalleryBtn) {
      const idx = parseInt(delGalleryBtn.dataset.idx || '-1', 10);
      if (idx >= 0) {
        const dataInput = document.getElementById('cms-gallery-data') as HTMLInputElement;
        const container = document.getElementById('cms-gallery-preview-container');
        let list: string[] = [];
        try {
          if (dataInput?.value) list = JSON.parse(dataInput.value);
        } catch (e) {}
        list.splice(idx, 1);
        if (dataInput) dataInput.value = JSON.stringify(list);
        if (container) {
          if (list.length === 0) {
            container.innerHTML = '<span id="cms-gallery-empty-msg" style="font-size: 0.74rem; color: var(--text-muted); padding: 0 0.5rem;">등록된 추가 갤러리 사진이 없습니다.</span>';
          } else {
            container.innerHTML = list.map((imgUrl, i) => `
              <div class="cms-gallery-thumb-chip" data-idx="${i}" style="position: relative; width: 56px; height: 56px; border-radius: 6px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2);">
                <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
                <button type="button" class="btn-del-gallery-img" data-idx="${i}" style="position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.7); color: #fff; border: none; border-radius: 50%; width: 16px; height: 16px; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1;">×</button>
              </div>
            `).join('');
          }
        }
      }
      return;
    }

    // [관리자 CMS: 상세 컷 칩 삭제]
    const delDetailBtn = target.closest('.btn-del-detail-img') as HTMLElement | null;
    if (delDetailBtn) {
      const idx = parseInt(delDetailBtn.dataset.idx || '-1', 10);
      if (idx >= 0) {
        const dataInput = document.getElementById('cms-detail-data') as HTMLInputElement;
        const container = document.getElementById('cms-detail-preview-container');
        let list: string[] = [];
        try {
          if (dataInput?.value) list = JSON.parse(dataInput.value);
        } catch (e) {}
        list.splice(idx, 1);
        if (dataInput) dataInput.value = JSON.stringify(list);
        if (container) {
          if (list.length === 0) {
            container.innerHTML = '<span id="cms-detail-empty-msg" style="font-size: 0.74rem; color: var(--text-muted); padding: 0 0.5rem;">등록된 상세페이지 안내 이미지가 없습니다.</span>';
          } else {
            container.innerHTML = list.map((imgUrl, i) => `
              <div class="cms-detail-thumb-chip" data-idx="${i}" style="position: relative; width: 56px; height: 56px; border-radius: 6px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2);">
                <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
                <button type="button" class="btn-del-detail-img" data-idx="${i}" style="position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.7); color: #fff; border: none; border-radius: 50%; width: 16px; height: 16px; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1;">×</button>
              </div>
            `).join('');
          }
        }
      }
      return;
    }

    // [관리자 CMS] 상품 수정 모드 진입
    const editProdBtn = target.closest('.btn-edit-store-product') as HTMLElement | null;
    if (editProdBtn) {
      const prodId = editProdBtn.dataset.productId;
      if (prodId) {
        setEditingStoreProductId(prodId);
        this.render(appState.getState());
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    // [관리자 CMS] 상품 수정 취소
    if (target.closest('#btn-cancel-edit-product')) {
      setEditingStoreProductId(null);
      this.render(appState.getState());
      return;
    }

    // [관리자 CMS] 카테고리 빠른 필터 클릭
    // [스터디] 카테고리 필터
    const studyCatBtn = target.closest('.btn-study-category') as HTMLElement | null;
    if (studyCatBtn) {
      const cat = studyCatBtn.dataset.cat;
      if (cat) {
        setStudyCategory(cat);
        const studyDrawer = document.getElementById('study-sidebar-drawer');
        const studyBackdrop = document.getElementById('study-drawer-backdrop');
        if (studyDrawer) studyDrawer.classList.remove('drawer-open');
        if (studyBackdrop) studyBackdrop.classList.remove('active');
        this.render(appState.getState());
      }
      return;
    }

    // [스터디] 아티클 상세 클릭
    const studyCard = target.closest('.study-card') as HTMLElement | null;
    if (studyCard) {
      const slugOrId = studyCard.dataset.slug || studyCard.dataset.articleId;
      if (slugOrId) {
        selectStudyArticle(slugOrId);
        this.render(appState.getState());
      }
      return;
    }

    // [스터디] 목록으로 돌아가기
    if (target.closest('.btn-back-to-study-list')) {
      selectStudyArticle(null);
      this.render(appState.getState());
      return;
    }

    
    // --- [푸터 약관 / 개인정보 / 고객센터 1:1 온라인 문의 모달 제어] ---
    if (target.closest('#btn-footer-terms')) {
      e.preventDefault();
      const modal = document.getElementById('modal-terms-container');
      if (modal) modal.style.display = 'flex';
      return;
    }
    if (target.closest('#btn-footer-privacy')) {
      e.preventDefault();
      const modal = document.getElementById('modal-privacy-container');
      if (modal) modal.style.display = 'flex';
      return;
    }
    if (target.closest('#btn-footer-refund')) {
      e.preventDefault();
      const modal = document.getElementById('modal-refund-container');
      if (modal) modal.style.display = 'flex';
      return;
    }
    if (
      target.closest('#btn-footer-support') ||
      target.closest('#btn-open-support-from-dash') ||
      target.closest('#btn-open-support-empty') ||
      target.closest('.btn-open-support-inquiry') ||
      target.closest('.btn-open-support')
    ) {
      e.preventDefault();
      const modal = document.getElementById('modal-support-container');
      if (modal) {
        modal.style.display = 'flex';
        // 로그인된 회원 정보 자동 입력
        const currentUser = AuthService.getCurrentUser();
        if (currentUser.role !== 'guest') {
          const nameInput = document.getElementById('support-name') as HTMLInputElement | null;
          const emailInput = document.getElementById('support-reply-email') as HTMLInputElement | null;
          const phoneInput = document.getElementById('support-phone') as HTMLInputElement | null;
          if (nameInput && !nameInput.value) nameInput.value = currentUser.name || '';
          if (emailInput && !emailInput.value) emailInput.value = currentUser.email || '';
          if (phoneInput && !phoneInput.value && currentUser.phone) phoneInput.value = currentUser.phone;
        }
      }
      return;
    }
    const closeLegalBtn = target.closest('.btn-close-legal-modal') as HTMLElement | null;
    if (closeLegalBtn) {
      e.preventDefault();
      const modalId = closeLegalBtn.dataset.modal;
      if (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
      }
      return;
    }
    if (target.id === 'modal-terms-container' || target.id === 'modal-privacy-container' || target.id === 'modal-support-container' || target.id === 'modal-refund-container') {
      (target as HTMLElement).style.display = 'none';
      return;
    }

    
    // [관리자 대시보드 KPI 카드 클릭 -> 해당 화면 즉시 연결]
    const kpiCard = target.closest('.btn-admin-kpi-card') as HTMLElement | null;
    if (kpiCard) {
      e.preventDefault();
      const gotoTab = kpiCard.dataset.gotoTab;
      if (gotoTab) {
        setAdminActiveTab(gotoTab);
        appState.setView('admin');
        this.render(appState.getState());
      }
      return;
    }

    // [사용자/관리자 아코디언 토글 클릭 핸들러: 주문내역, 1:1문의, 주문장부, 상품관리]
    const accordionToggleBtn = (
      target.closest('.btn-toggle-inquiry-row') ||
      target.closest('.btn-toggle-order-row') ||
      target.closest('.btn-toggle-admin-order') ||
      target.closest('.btn-toggle-admin-product')
    ) as HTMLElement | null;

    if (accordionToggleBtn) {
      const targetId = accordionToggleBtn.dataset.target;
      if (targetId) {
        e.preventDefault();
        const detailEl = document.getElementById(targetId);
        if (detailEl) {
          const isCurrentlyHidden = detailEl.style.display === 'none' || !detailEl.style.display;
          detailEl.style.display = isCurrentlyHidden ? 'block' : 'none';
          
          // 화살표 아이콘 회전
          const chevron = accordionToggleBtn.querySelector('.material-symbols-outlined');
          if (chevron) {
            chevron.textContent = isCurrentlyHidden ? 'expand_less' : 'expand_more';
          }
        }
        return;
      }
    }

    // 스토어 상품 상세 후기 배너 -> 회원 주문내역 바로가기
    if (target.closest('.btn-go-order-history')) {
      e.preventDefault();
      setMemberActiveTab('orders');
      appState.setView('member-dashboard');
      this.render(appState.getState());
      return;
    }

    // --- [상품 구매 후기 작성 모달 제어 & 별점/태그 인터랙션] ---
    const writeRevBtn = target.closest('.btn-open-write-review') as HTMLElement | null;
    if (writeRevBtn) {
      e.preventDefault();
      const orderId = writeRevBtn.dataset.orderId || '';
      const productId = writeRevBtn.dataset.productId || 'core-lifelong-saju';
      const productTitle = writeRevBtn.dataset.productTitle || '사주 리포트';
      this.openReviewWriteModal({ orderId, productId, productTitle });
      return;
    }

    if (target.closest('#btn-close-review-write-modal') || target.closest('#btn-cancel-review-write') || target.id === 'modal-review-write-container') {
      e.preventDefault();
      this.closeReviewWriteModal();
      return;
    }

    // 후기 별점 선택 인터랙션
    const starItem = target.closest('.star-rating-item') as HTMLElement | null;
    if (starItem) {
      const val = parseInt(starItem.dataset.value || '5', 10);
      const inputRating = document.getElementById('input-review-rating') as HTMLInputElement | null;
      if (inputRating) inputRating.value = String(val);

      document.querySelectorAll('.star-rating-item').forEach(el => {
        const v = parseInt((el as HTMLElement).dataset.value || '0', 10);
        (el as HTMLElement).style.color = v <= val ? 'var(--primary)' : 'rgba(255,255,255,0.2)';
      });

      const textEl = document.getElementById('star-rating-text');
      if (textEl) {
        const descMap: Record<number, string> = {
          1: '1점 - 별로예요, 아쉬웠습니다.',
          2: '2점 - 그저 그래요.',
          3: '3점 - 보통이에요, 참고할 만합니다.',
          4: '4점 - 좋아요! 도움이 되었습니다.',
          5: '5점 - 최고예요! 매우 만족합니다.'
        };
        textEl.textContent = descMap[val] || `${val}점`;
      }
      return;
    }

    // 후기 만족도 태그 칩 토글
    const tagChip = target.closest('.review-tag-chip') as HTMLElement | null;
    if (tagChip) {
      const checkbox = tagChip.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
        if (checkbox.checked) {
          tagChip.style.background = 'rgba(242, 202, 80, 0.2)';
          tagChip.style.borderColor = 'var(--primary)';
          tagChip.style.color = 'var(--primary)';
        } else {
          tagChip.style.background = 'rgba(255,255,255,0.06)';
          tagChip.style.borderColor = 'rgba(255,255,255,0.15)';
          tagChip.style.color = '#cbd5e1';
        }
      }
      return;
    }

    // --- [푸터 4대 핵심 카테고리 네비게이션] ---
    if (target.closest('#footer-nav-fortune')) {
      appState.setView('fortune' as any);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.render(appState.getState());
      return;
    }
    if (target.closest('#footer-nav-magi-cal')) {
      appState.setView('magi-calendar' as any);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.render(appState.getState());
      return;
    }
    if (target.closest('#footer-nav-study')) {
      resetStudyCategory();
      selectStudyArticle(null, false);
      appState.setView('study');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.render(appState.getState());
      return;
    }
    if (target.closest('#footer-nav-store')) {
      resetStoreCategory();
      selectStoreProduct(null);
      appState.setView('store');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.render(appState.getState());
      return;
    }



    
    // --- [스토어 쿠폰 & 상품권 코드 즉시 등록/승인] ---
    if (target.closest('#btn-submit-voucher')) {
      const input = document.getElementById('input-store-voucher') as HTMLInputElement;
      const rawCode = input?.value?.trim() || '';
      if (!rawCode) {
        alert('쿠폰 또는 상품권 코드를 입력해 주세요.');
        input?.focus();
        return;
      }
      const buyerName = appState.getState().userName || '마보살 고객';
      const result = redeemStoreVoucher(rawCode, { name: buyerName });
      if (result.success) {
        alert(result.message);
        const state = appState.getState();
        const hasBirthInput = !!state.integratedResult;
        if (hasBirthInput) {
          appState.setView('report');
        } else {
          // 사주 정보 미입력 시 맞춤 리포트 생성을 위해 사주 입력 화면으로 자연스럽게 안내
          appState.setView('analyze');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.render(appState.getState());
      } else {
        alert(result.message);
      }
      return;
    }






    // [스토어 관리자] 서브 탭 전환 (목록 / 신규등록 / 주문장부)
    const adminSubTabBtn = (target.closest('.btn-store-subtab') || target.closest('.btn-admin-subtab')) as HTMLElement | null;
    // /* btn-study-subtab-handled */
    const studySubTabBtn = target.closest('.btn-admin-study-subtab') as HTMLElement | null;
    if (studySubTabBtn) {
      const tab = studySubTabBtn?.dataset?.subtab;
      if (tab) {
        (window as any).__studyAdminSubTab = tab;
        this.render(appState.getState());
      }
      return;
    }

    if (adminSubTabBtn) {
      const tabKey = adminSubTabBtn.dataset.subtab as 'products' | 'register' | 'orders';
      if (tabKey) {
        setAdminStoreSubTab(tabKey);
        if (tabKey === 'products') setAdminActiveTab('tab-store');
        else if (tabKey === 'register') setAdminActiveTab('tab-store-register');
        else if (tabKey === 'orders') setAdminActiveTab('tab-store-orders');
        this.render(appState.getState());
      }
      return;
    }

    const adminFilterBtn = target.closest('.btn-admin-store-filter') as HTMLElement | null;
    if (adminFilterBtn) {
      const cat = adminFilterBtn.dataset.cat as StoreCategoryType;
      if (cat) {
        setAdminStoreFilter(cat);
        this.render(appState.getState());
      }
      return;
    }

    // [관리자 CMS] 상품 상태별 필터 탭 (전체 / 판매중 / 숨김 / 품절)
    const statusFilterBtn = target.closest('.btn-admin-status-filter') as HTMLElement | null;
    if (statusFilterBtn) {
      const status = statusFilterBtn.dataset.status as 'all' | 'active' | 'hidden' | 'soldout';
      if (status) {
        setAdminStoreStatusFilter(status);
        this.render(appState.getState());
      }
      return;
    }

    // [관리자 CMS] 상품 삭제
    const delProdBtn = target.closest('.btn-delete-store-product') as HTMLElement | null;
    if (delProdBtn) {
      const prodId = delProdBtn.dataset.productId;
      if (prodId && confirm('정말로 이 상품을 삭제하시겠습니까?')) {
        deleteStoreProduct(prodId);
        alert('상품이 성공적으로 삭제되었습니다.');
        setAdminActiveTab('tab-store');
        setAdminStoreSubTab('products');
        this.render(appState.getState());
      }
      return;
    }

    // [모듈 연동] 결제 연동 설정 저장
    if (target.closest('#btn-save-payment-config')) {
      if (savePaymentConfigFromDom()) this.render(appState.getState());
      return;
    }

    // [모듈 연동] 관리자 무통장 입금 원클릭 승인
    const approveTransferBtn = target.closest('.btn-approve-transfer') as HTMLElement;
    if (approveTransferBtn) {
      const id = approveTransferBtn.dataset.transferId;
      if (id) {
        const res = VoucherStore.approveBankTransfer(id);
        alert(res.message);
        this.render(appState.getState());
      }
      return;
    }

    // [모듈 연동] 관리자 무통장 입금 반려
    const rejectTransferBtn = target.closest('.btn-reject-transfer') as HTMLElement;
    if (rejectTransferBtn) {
      const id = rejectTransferBtn.dataset.transferId;
      if (id && confirm('해당 무통장 입금 신청을 반려 처리하시겠습니까?')) {
        VoucherStore.rejectBankTransfer(id);
        alert('신청이 반려 처리되었습니다.');
        this.render(appState.getState());
      }
      return;
    }

    // [모듈 연동] 관리자 쿠폰 활성/비활성 토글
    const toggleVoucherBtn = target.closest('.btn-toggle-voucher') as HTMLElement;
    if (toggleVoucherBtn) {
      const id = toggleVoucherBtn.dataset.voucherId;
      if (id) {
        VoucherStore.toggleCoupon(id);
        this.render(appState.getState());
      }
      return;
    }

    // [모듈 연동] 관리자 쿠폰 삭제
    const deleteVoucherBtn = target.closest('.btn-delete-voucher') as HTMLElement;
    if (deleteVoucherBtn) {
      const id = deleteVoucherBtn.dataset.voucherId;
      if (id && confirm('정말 이 쿠폰을 영구 삭제하시겠습니까?')) {
        VoucherStore.deleteCoupon(id);
        this.render(appState.getState());
      }
      return;
    }

    // [모듈 연동] 회원 대시보드 쿠폰 등록
    if (target.closest('#btn-register-member-voucher')) {
      const inputEl = document.getElementById('input-member-voucher-code') as HTMLInputElement;
      const code = inputEl?.value.trim();
      if (!code) {
        alert('등록할 쿠폰 또는 상품권 코드를 입력해주세요.');
        return;
      }
      const res = VoucherStore.registerUserVoucher(code);
      alert(res.message);
      if (res.success) {
        this.render(appState.getState());
      }
      return;
    }

    // [모듈 연동] 회원 대시보드에서 스토어로 바로가기
    if (target.closest('#btn-quick-store-link')) {
      appState.setView('store');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // [최고 관리자 상위 카테고리 아코디언 펼침/닫힘 토글]
    const toggleGroupBtn = target.closest('.btn-toggle-admin-group') as HTMLElement | null;
    if (toggleGroupBtn) {
      const grpId = toggleGroupBtn.dataset.groupId;
      if (grpId) {
        toggleAdminGroup(grpId);
        this.render(appState.getState());
      }
      return;
    }

    // [최고 관리자 2단 서브 카테고리(상품관리 등) 3단 아코디언 펼침/닫힘 토글]
    const toggleSubGroupBtn = target.closest('.btn-toggle-admin-subgroup') as HTMLElement | null;
    if (toggleSubGroupBtn) {
      const subId = toggleSubGroupBtn.dataset.subgroupId;
      if (subId) {
        toggleAdminSubGroup(subId);
        const defTab = toggleSubGroupBtn.dataset.defaultTab;
        if (defTab && !['tab-store', 'tab-store-register', 'tab-store-orders'].includes(getAdminActiveTab())) {
          setAdminActiveTab(defTab);
          if (defTab === 'tab-store') setAdminStoreSubTab('products');
          else if (defTab === 'tab-store-register') setAdminStoreSubTab('register');
          else if (defTab === 'tab-store-orders') setAdminStoreSubTab('orders');
        }
        this.render(appState.getState());
      }
      return;
    }

    // 관리자 헤더 브랜딩 클릭 시 기본 대시보드(종합 관제)로 이동
    if (target.closest('.btn-admin-header-home')) {
      setAdminActiveTab('tab-overview');
      this.render(appState.getState());
      return;
    }

    // 기본 대시보드에서 1:1 고객 문의 게시판 전체보기
    if (target.closest('.btn-goto-inquiries')) {
      setAdminActiveTab('tab-inquiries');
      this.render(appState.getState());
      return;
    }

    // 기본 대시보드에서 특정 문의 즉시 답변하기 클릭 (해당 문의 자동 펼침)
    const quickAnsBtn = target.closest('.btn-quick-answer-inquiry') as HTMLElement | null;
    if (quickAnsBtn) {
      const inqId = quickAnsBtn.dataset.inquiryId;
      if (inqId) {
        expandSpecificInquiry(inqId);
        setAdminActiveTab('tab-inquiries');
        this.render(appState.getState());
      }
      return;
    }

    // [1:1 고객문의 게시판] 기본 닫힘형 아코디언 행 클릭 시 상세 질문 & 답변창 펼침/닫힘 토글
    const inqToggleBtn = target.closest('.btn-toggle-inquiry-row, .btn-toggle-inquiry-arrow, .btn-toggle-admin-inquiry-row') as HTMLElement | null;
    if (inqToggleBtn && !target.closest('.btn-submit-inquiry-answer') && !target.closest('.btn-delete-inquiry') && !target.closest('textarea') && !target.closest('input')) {
      const inqId = inqToggleBtn.dataset.inquiryId;
      if (inqId) {
        toggleInquiryExpanded(inqId);
        this.render(appState.getState());
      }
      return;
    }

    // [관리자 CMS: 새 스터디 글 작성 워크스페이스 이동]
    if (target.closest('#btn-admin-goto-write')) {
      StudyService.setEditingArticleId(null);
      setEditingStudyArticleId(null);
      setAdminActiveTab('tab-study-write');
      const slugInput = document.getElementById('admin-study-slug') as HTMLInputElement | null;
      if (slugInput) delete slugInput.dataset.manualEdited;
      this.render(appState.getState());
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // [관리자 CMS: 스터디 글 작성 취소]
    if (target.closest('#btn-admin-cancel-study-write')) {
      StudyService.setEditingArticleId(null);
      setEditingStudyArticleId(null);
      setAdminActiveTab('tab-study-articles');
      this.render(appState.getState());
      return;
    }

    // [관리자 CMS: 스터디 글 수정 풀스크린 진입]
    const editStudyArtBtn = target.closest('.btn-admin-edit-study-article, .btn-goto-admin-edit, .btn-card-edit-article') as HTMLElement | null;
    if (editStudyArtBtn) {
      const artId = editStudyArtBtn.dataset.id;
      if (artId) {
        StudyService.setEditingArticleId(artId);
        setEditingStudyArticleId(artId);
        setAdminActiveTab('tab-study-write');
        appState.setView('admin');
        this.render(appState.getState());
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    // [관리자 CMS: 스터디 글 영구 삭제]
    const delStudyArtBtn = target.closest('.btn-admin-delete-study-article') as HTMLElement | null;
    if (delStudyArtBtn) {
      const artId = delStudyArtBtn.dataset.id;
      const title = delStudyArtBtn.dataset.title || '해당 글';
      if (artId && confirm(`'${title}' 스터디 글을 정말 삭제하시겠습니까?\n삭제 시 복구할 수 없습니다.`)) {
        StudyService.deleteArticle(artId);
        alert('성공적으로 삭제되었습니다.');
        this.render(appState.getState());
      }
      return;
    }

    // [관리자 CMS: 스터디 카테고리 수정]
    const editCatBtn = target.closest('.btn-admin-edit-cat') as HTMLElement | null;
    if (editCatBtn) {
      const catId = editCatBtn.dataset.catId || editCatBtn.dataset.id;
      const catName = editCatBtn.dataset.catName || editCatBtn.dataset.name || '';
      const catDesc = editCatBtn.dataset.desc || '';
      if (catId) {
        const newName = prompt('수정할 카테고리 이름을 입력하세요:', catName);
        if (newName && newName.trim() && newName.trim() !== catName) {
          StudyService.updateCategory(catId, newName.trim(), catDesc);
          alert('카테고리 정보가 수정되었습니다.');
          this.render(appState.getState());
        }
      }
      return;
    }

    // [관리자 CMS: 스터디 카테고리 삭제]
    const delCatBtn = target.closest('.btn-admin-del-cat') as HTMLElement | null;
    if (delCatBtn) {
      const catId = delCatBtn.dataset.catId || delCatBtn.dataset.id;
      const catName = delCatBtn.dataset.catName || delCatBtn.dataset.name || '';
      if (catId && confirm(`[${catName}] 카테고리를 정말 삭제하시겠습니까?\n해당 카테고리의 글은 기본 카테고리로 안전하게 이동됩니다.`)) {
        StudyService.deleteCategory(catId);
        alert('카테고리가 삭제되었습니다.');
        this.render(appState.getState());
      }
      return;
    }

    // [관리자 CMS: 스토어 카테고리 수정]
    const editStoreCatBtn = target.closest('.btn-admin-edit-store-category') as HTMLElement | null;
    if (editStoreCatBtn) {
      const catId = editStoreCatBtn.dataset.catId;
      const currentName = editStoreCatBtn.dataset.catName || '';
      const catIcon = editStoreCatBtn.dataset.catIcon || 'category';
      if (catId) {
        const newLabel = prompt(`[${catId}] 카테고리의 새로운 표시 명칭을 입력해주세요:`, currentName);
        if (newLabel !== null) {
          const trimmed = newLabel.trim();
          if (!trimmed) {
            alert('카테고리 표시 명칭은 비워둘 수 없습니다.');
            return;
          }
          const res = updateStoreCategory(catId, { label: trimmed, icon: catIcon });
          alert(res.message);
          if (res.success) {
            this.render(appState.getState());
          }
        }
      }
      return;
    }

    // [관리자 CMS: 스토어 카테고리 삭제]
    const delStoreCatBtn = target.closest('.btn-admin-del-store-category') as HTMLElement | null;
    if (delStoreCatBtn) {
      const catId = delStoreCatBtn.dataset.catId;
      const catName = delStoreCatBtn.dataset.catName || catId;
      const prodCount = parseInt(delStoreCatBtn.dataset.productCount || '0', 10);

      let confirmMsg = `[${catName}] 스토어 카테고리를 정말 삭제하시겠습니까?`;
      if (prodCount > 0) {
        confirmMsg = `[${catName}] 카테고리에 등록된 상품이 ${prodCount}건 있습니다.\n카테고리를 삭제하면 해당 상품들은 기본 카테고리('정밀 리포트')로 안전하게 자동 이전됩니다.\n\n정말 삭제하시겠습니까?`;
      }

      if (catId && confirm(confirmMsg)) {
        const res = deleteStoreCategory(catId);
        if (res.success) {
          alert(res.message);
          this.render(appState.getState());
        } else {
          alert(res.message || '기본 카테고리는 삭제할 수 없습니다.');
        }
      }
      return;
    }

    // 관리자 탭 전환
    const adminTabBtn = target.closest('.admin-tab-btn') as HTMLElement;
    if (adminTabBtn) {
      const targetTab = adminTabBtn.dataset.tab;
      if (targetTab) {
        if (targetTab === 'tab-store') {
          setAdminActiveTab('tab-store');
          setAdminStoreSubTab('products');
          setEditingStoreProductId(null);
        } else if (targetTab === 'tab-store-register') {
          setAdminActiveTab('tab-store-register');
          setAdminStoreSubTab('register');
        } else if (targetTab === 'tab-store-orders' || targetTab === 'tab-orders') {
          setAdminActiveTab('tab-store-orders');
          setAdminStoreSubTab('orders');
        } else if (targetTab === 'tab-store-categories') {
          setAdminActiveTab('tab-store-categories');
          setAdminStoreSubTab('categories');
        } else {
          setAdminActiveTab(targetTab);
        }
        this.render(appState.getState());
      }
      return;
    }

    // SEO 위키 허브 1순위 프리셋 초기화
    const resetSeoBtn = target.closest('#btn-reset-seo-defaults');
    if (resetSeoBtn) {
      if (confirm('1순위 계층형 구조(/fortune/...) 표준 프리셋 데이터로 복원하시겠습니까?')) {
        resetToFirstTierDefaults();
        this.render(appState.getState());
      }
      return;
    }

    // SEO 위키 허브 모달 열기
    const openSeoModalBtn = target.closest('.btn-open-seo-modal') as HTMLElement | null;
    if (openSeoModalBtn) {
      const pageId = openSeoModalBtn.dataset.pageId;
      openAddSeoPageModal(pageId);
      this.render(appState.getState());
      return;
    }

    // SEO 위키 허브 모달 닫기
    const closeSeoModalBtn = target.closest('.btn-close-seo-modal, #modal-seo-page-backdrop');
    if (closeSeoModalBtn && (target === closeSeoModalBtn || (closeSeoModalBtn as HTMLElement).classList.contains('btn-close-seo-modal'))) {
      closeAddSeoPageModal();
      this.render(appState.getState());
      return;
    }

    // SEO 위키 허브 삭제
    const delSeoPageBtn = target.closest('.btn-delete-seo-page') as HTMLElement | null;
    if (delSeoPageBtn && delSeoPageBtn.dataset.pageId) {
      const kw = delSeoPageBtn.dataset.keyword || '이 페이지';
      if (confirm(`'${kw}' 키워드 웹서비스 설정을 삭제하시겠습니까?`)) {
        deleteSeoKeywordPage(delSeoPageBtn.dataset.pageId);
        this.render(appState.getState());
      }
      return;
    }

    // SEO 위키 허브 저장 (1순위 계층형 구조 /fortune/... 정규화)
    const saveSeoPageBtn = target.closest('#btn-save-seo-page-submit');
    if (saveSeoPageBtn) {
      const pageIdInput = (document.getElementById('seo-page-id') as HTMLInputElement)?.value;
      const kw = (document.getElementById('seo-input-keyword') as HTMLInputElement)?.value.trim();
      const rawSlug = (document.getElementById('seo-input-slug') as HTMLInputElement)?.value.trim();
      const sajuType = (document.getElementById('seo-input-saju-type') as HTMLSelectElement)?.value as any;
      const status = (document.getElementById('seo-input-status') as HTMLSelectElement)?.value as any;
      const volPc = parseInt((document.getElementById('seo-input-vol-pc') as HTMLInputElement)?.value || '0', 10);
      const volMo = parseInt((document.getElementById('seo-input-vol-mo') as HTMLInputElement)?.value || '0', 10);
      const engine = (document.getElementById('seo-input-engine') as HTMLInputElement)?.value.trim();
      const metaTitle = (document.getElementById('seo-input-meta-title') as HTMLInputElement)?.value.trim();
      const metaDesc = (document.getElementById('seo-input-meta-desc') as HTMLTextAreaElement)?.value.trim();

      // 체크박스에서 선택된 위키 상호 연결 대상 목록 수집
      const checkedBoxes = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="seo-crosslink-item"]:checked'));
      const crossLinks = checkedBoxes.map(cb => cb.value);

      if (!kw || !rawSlug) {
        alert('타겟 키워드와 슬러그는 필수 입력 항목입니다.');
        return;
      }

      // 1순위 계층형 슬러그 표준 (/fortune/[slug]/) 자동 정규화
      const normalizedSlug = normalizeFirstTierSlug(rawSlug);

      const pages = getSeoKeywordPages();
      const nowStr = new Date().toISOString().split('T')[0];

      if (pageIdInput) {
        const existing = pages.find(p => p.id === pageIdInput);
        if (existing) {
          existing.keyword = kw;
          existing.slug = normalizedSlug;
          existing.sajuFormType = sajuType;
          existing.status = status;
          existing.monthlySearchVolume = { pc: volPc, mobile: volMo, total: volPc + volMo };
          existing.engineModule = engine;
          existing.metaTitle = metaTitle;
          existing.metaDescription = metaDesc;
          existing.crossLinks = crossLinks;
          existing.lastUpdated = nowStr;
        }
      } else {
        const newId = `page-${rawSlug.replace(/[^a-zA-Z0-9_-]/g, '') || Date.now()}`;
        pages.push({
          id: newId,
          keyword: kw,
          slug: normalizedSlug,
          monthlySearchVolume: { pc: volPc, mobile: volMo, total: volPc + volMo },
          competition: '중간',
          sajuFormType: sajuType,
          engineModule: engine || 'DailyFortuneEngine',
          status: status || 'draft',
          crossLinks: crossLinks.length > 0 ? crossLinks : ['page-today'],
          metaTitle: metaTitle || `${kw} - 마보살 무료 웹서비스`,
          metaDescription: metaDesc || `${kw} 무료 확인 서비스입니다.`,
          lastUpdated: nowStr,
        });
      }

      saveSeoKeywordPages(pages);
      closeAddSeoPageModal();
      this.render(appState.getState());
      return;
    }

    // [인생분석: 사주 엔진 객관화 중간 데이터 창고] 상호작용 이벤트 처리
    // 1. 인생분석 계산 실행 버튼
    const runLaBtn = target.closest('#btn-run-life-analysis');
    if (runLaBtn) {
      const g = ((document.getElementById('la-gender') as HTMLSelectElement)?.value as 'male' | 'female') || 'female';
      const y = parseInt((document.getElementById('la-year') as HTMLInputElement)?.value || '1998', 10);
      const m = parseInt((document.getElementById('la-month') as HTMLInputElement)?.value || '4', 10);
      const d = parseInt((document.getElementById('la-day') as HTMLInputElement)?.value || '12', 10);
      const timeInputVal = (document.getElementById('la-time-input') as HTMLInputElement)?.value || '09:20';
      const c = ((document.getElementById('la-calendar') as HTMLSelectElement)?.value as 'solar' | 'lunar') || 'solar';

      executeLifeAnalysis({
        birthYear: y,
        birthMonth: m,
        birthDay: d,
        birthTimeRaw: timeInputVal,
        gender: g,
        calendarType: c,
      });
      this.render(appState.getState());
      return;
    }

    // 2. 사주 프리셋 버튼 클릭
    const laPresetBtn = target.closest('.btn-preset-saju') as HTMLElement | null;
    if (laPresetBtn) {
      const y = parseInt(laPresetBtn.dataset.year || '1998', 10);
      const m = parseInt(laPresetBtn.dataset.month || '4', 10);
      const d = parseInt(laPresetBtn.dataset.day || '12', 10);
      const h = parseInt(laPresetBtn.dataset.hour || '12', 10);
      const g = (laPresetBtn.dataset.gender || 'female') as 'male' | 'female';

      executeLifeAnalysis({
        birthYear: y,
        birthMonth: m,
        birthDay: d,
        birthHour: h,
        gender: g,
        calendarType: 'solar',
      });
      this.render(appState.getState());
      return;
    }

    // 3. 현재 유저 사주 로드
    const loadCurUserBtn = target.closest('#btn-load-current-user-saju');
    if (loadCurUserBtn) {
      const st = appState.getState();
      const req = st.sessionState?.request as any;
      let bYear = 1998, bMonth = 4, bDay = 12, bHour = 12;
      if (req?.birthDate) {
        const parts = req.birthDate.split('-').map(Number);
        if (parts.length >= 3) {
          bYear = parts[0];
          bMonth = parts[1];
          bDay = parts[2];
        }
      }
      if (req?.birthTime) {
        bHour = parseInt(req.birthTime.split(':')[0], 10) || 12;
      }
      const gender = (st.gender === 'male' || st.gender === 'female') ? st.gender : 'female';
      const calType = st.calendarType === 'lunar' ? 'lunar' : 'solar';

      executeLifeAnalysis({
        birthYear: bYear,
        birthMonth: bMonth,
        birthDay: bDay,
        birthHour: bHour,
        gender,
        calendarType: calType,
      });
      this.render(appState.getState());
      return;
    }

    // 4. 대운 행/포인트/조회 버튼 클릭 시 선택 대운 변경
    const selectDwBtn = target.closest('.btn-select-daewoon-row, .btn-select-daewoon-point, .btn-inspect-sewoon') as HTMLElement | null;
    if (selectDwBtn && selectDwBtn.dataset.order) {
      const order = parseInt(selectDwBtn.dataset.order, 10);
      setSelectedDaewoonOrder(order);
      this.render(appState.getState());
      return;
    }

    // 4-1-0. [최우선] 상충마살/신살 등 요인 클릭 시 명리 지식 백과(위키) 모달 팝업 & 하단 카드 갱신
    const wikiBtn = (target.closest('.btn-open-factor-wiki') || target.closest('[data-factor]')) as HTMLElement | SVGElement | null;
    if (wikiBtn) {
      const factorName = wikiBtn.getAttribute('data-factor') || (wikiBtn as any).dataset?.factor;
      if (factorName) {
        setSelectedWikiFactor(factorName);
        // 1. 하단 위키 카드 및 인스펙터 패널을 먼저 갱신
        refreshLifeAnalysisView();
        // 2. 갱신된 DOM의 위키 모달을 띄움 (화면 전면 팝업 보장)
        if ((window as any).__openSajuFactorWiki) {
          (window as any).__openSajuFactorWiki(factorName);
        }
        // 3. 하단 위키 카드로 스크롤 연결
        setTimeout(() => {
          const wikiCard = document.getElementById('saju-factor-wiki-card');
          if (wikiCard) {
            wikiCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 50);
        return;
      }
    }

    // 4-1-0b. 위키 모달 닫기
    const closeWikiBtn = target.closest('.btn-close-factor-wiki-modal') || (target.id === 'saju-factor-wiki-modal' ? target : null);
    if (closeWikiBtn) {
      const modal = document.getElementById('saju-factor-wiki-modal');
      if (modal) modal.style.display = 'none';
      return;
    }

    // 4-1-1. 세운 연도(상단 헤더 박스 상단부/스텝/테이블 행) 클릭 시 해당 연도 선택 & 12개월 드릴다운
    const selectSewoonYearBtn = target.closest('.btn-select-sewoon-year-hdr, .btn-select-sewoon-year, .btn-select-sewoon-row') as HTMLElement | null;
    if (selectSewoonYearBtn && selectSewoonYearBtn.dataset.year) {
      const yr = parseInt(selectSewoonYearBtn.dataset.year, 10);
      setSelectedLifeSewoonYear(yr);
      if (getLifeChartViewMode() === '10years') {
        setLifeChartViewMode('12months');
      }
      refreshLifeAnalysisView();
      return;
    }

    // 4-1-1b. 월운(상단 헤더 상단부/12개월 스텝 차트/테이블 행) 클릭 시 해당 월 선택 & 월운 인스펙터 갱신
    const selectMonthWoonBtn = target.closest('.btn-select-month-woon-hdr, .btn-select-month-woon') as HTMLElement | null;
    if (selectMonthWoonBtn && selectMonthWoonBtn.dataset.month) {
      const m = parseInt(selectMonthWoonBtn.dataset.month, 10);
      setSelectedLifeMonth(m);
      refreshLifeAnalysisView();
      return;
    }

    // 4-1-2. 대운 헤더 칩 또는 대운 행 클릭 시 해당 대운으로 즉시 10년 확대(Zoom) 전환
    const selectDaewoonBtn = target.closest('.btn-select-daewoon-header, .btn-select-daewoon-row') as HTMLElement | null;
    if (selectDaewoonBtn && selectDaewoonBtn.dataset.order) {
      const order = parseInt(selectDaewoonBtn.dataset.order, 10);
      setSelectedDaewoonOrder(order);
      setLifeChartViewMode('10years');
      refreshLifeAnalysisView();
      return;
    }

    // 4-2. 100년 전체 ↔ 10년 대운 ↔ 12개월 세운 3단계 뷰모드 전환
    const viewModeBtn = target.closest('.btn-toggle-life-view-mode') as HTMLElement | null;
    if (viewModeBtn && viewModeBtn.dataset.mode) {
      setLifeChartViewMode(viewModeBtn.dataset.mode as any);
      refreshLifeAnalysisView();
      return;
    }

    // 4-3. 전체화면 열기 (명시적)
    const openFsBtn = target.closest('.btn-open-life-fullscreen');
    if (openFsBtn) {
      (window as any).__openLifeFullscreen();
      return;
    }

    // 4-3-1. 전체화면 닫기 (명시적)
    const closeFsBtn = target.closest('.btn-close-life-fullscreen');
    if (closeFsBtn) {
      (window as any).__closeLifeFullscreen();
      return;
    }

    // 4-3-2. 전체화면 토글 (호환성)
    const fsBtn = target.closest('.btn-toggle-life-fullscreen');
    if (fsBtn) {
      (window as any).__toggleLifeFullscreen();
      return;
    }

    // 4-4. 사주 입력 폼 열기/닫기 토글
    const sajuToggleBtn = target.closest('.btn-toggle-saju-input');
    if (sajuToggleBtn) {
      toggleSajuInputExpanded();
      refreshLifeAnalysisView();
      return;
    }

    // 4-5. 백세인생 단계별 4대 관제 대분류 탭 선택 (ALL / STEP 01 / STEP 02 / STEP 03 / STEP 04)
    const stageSelectBtn = target.closest('.btn-select-life-stage') as HTMLElement | null;
    if (stageSelectBtn && stageSelectBtn.dataset.stage) {
      const stage = stageSelectBtn.dataset.stage as any;
      setActiveLifeStage(stage);
      refreshLifeAnalysisView();
      return;
    }

    // 4-6. 백세인생 각 대분류 카드 헤더 클릭 시 개별 접기/펼치기 토글
    const stageToggleHdr = target.closest('.btn-toggle-life-stage-header') as HTMLElement | null;
    if (stageToggleHdr && stageToggleHdr.dataset.stage) {
      const stage = stageToggleHdr.dataset.stage;
      toggleLifeStage(stage);
      refreshLifeAnalysisView();
      return;
    }

    // 4-7. 백세인생 4대 관제 전체 펼치기 / 전체 접기 토글
    const toggleAllStagesBtn = target.closest('.btn-toggle-all-life-stages') as HTMLElement | null;
    if (toggleAllStagesBtn) {
      const action = toggleAllStagesBtn.dataset.action;
      setAllLifeStagesExpanded(action === 'expand');
      refreshLifeAnalysisView();
      return;
    }

    // 5. AI(안프로) 전달용 정량 프롬프트 복사
    const copyAiBtn = target.closest('#btn-copy-ai-prompt');
    if (copyAiBtn) {
      const wh = getActiveWarehouse();
      const promptText = LifeAnalysisWarehouseBuilder.exportToMarkdownPrompt(wh);
      navigator.clipboard.writeText(promptText).then(() => {
        alert('🤖 [AI(안프로) 전달용 정량 프롬프트]가 클립보드에 복사되었습니다!\n\nAI와의 대화창에 바로 붙여넣으면, AI와 대표님이 0~100세 원천 데이터를 단 1의 오차도 없이 동일하게 공유하며 사주를 풀이할 수 있습니다.');
      }).catch(err => {
        console.error('클립보드 복사 실패:', err);
      });
      return;
    }

    // 5-2. [신규] B2B / AI 표준 사주 근거 패킷(JSON) 복사
    const copyEvidenceBtn = target.closest('#btn-copy-evidence-packet');
    if (copyEvidenceBtn) {
      const wh = getActiveWarehouse();
      const packet = buildEvidencePacket(wh);
      const jsonText = JSON.stringify(packet, null, 2);
      navigator.clipboard.writeText(jsonText).then(() => {
        alert('📦 [B2B / AI 표준] Saju Evidence Packet v1 (JSON)이 클립보드에 복사되었습니다!\n\n문장 없는 순수 명리 인과 코드, 100년 대운·세운·월운 요인, 참여자(기둥·궁위), 가중치가 표준 규격으로 패키징되어 외부 AI 및 협력업체 서비스에 즉시 연동 가능합니다.');
      }).catch(err => {
        console.error('클립보드 복사 실패:', err);
      });
      return;
    }

    // 6. 원천 JSON 덤프 복사
    const copyJsonBtn = target.closest('#btn-copy-json-warehouse');
    if (copyJsonBtn) {
      const wh = getActiveWarehouse();
      const jsonText = JSON.stringify(wh, null, 2);
      navigator.clipboard.writeText(jsonText).then(() => {
        alert('📋 [인생분석 원천 JSON 덤프]가 클립보드에 복사되었습니다.');
      }).catch(err => {
        console.error('클립보드 복사 실패:', err);
      });
      return;
    }
 const inqFilterBtn = target.closest('.btn-inquiry-filter') as HTMLElement | null;
 if (inqFilterBtn) {
 const filter = inqFilterBtn.dataset.filter as any;
 if (filter) {
 setInquiryFilter(filter);
 this.render(appState.getState());
 }
 return;
 }

 // [1:1 문의 관리] 관리자 답변 등록
 const inqAnsBtn = target.closest('.btn-submit-inquiry-answer') as HTMLElement | null;
 if (inqAnsBtn) {
 const inqId = inqAnsBtn.dataset.inquiryId;
 if (inqId) {
 const textarea = document.getElementById(`answer-input-${inqId}`) as HTMLTextAreaElement | null;
 const ansText = textarea?.value?.trim();
 if (!ansText) {
 alert('고객에게 회신할 답변 내용을 작성해 주세요.');
 return;
 }
 CustomerInquiryStore.answerInquiry(inqId, ansText);
 alert(`[문의 번호: ${inqId}]\n\n관리자 공식 답변이 성공적으로 등록되었습니다.`);
 this.render(appState.getState());
 }
 return;
 }

 // [1:1 문의 관리] 문의 삭제
 const inqDelBtn = target.closest('.btn-delete-inquiry') as HTMLElement | null;
 if (inqDelBtn) {
 const inqId = inqDelBtn.dataset.inquiryId;
 if (inqId && confirm('정말 이 문의 내역을 영구 삭제하시겠습니까?')) {
 CustomerInquiryStore.deleteInquiry(inqId);
 this.render(appState.getState());
 }
 return;
 }

 // [리뷰 관리] 베스트 리뷰 지정/해제 토글
 const bestRevBtn = target.closest('.btn-toggle-best-review') as HTMLElement | null;
 if (bestRevBtn) {
 const revId = bestRevBtn.dataset.reviewId;
 if (revId) {
 ProductReviewStore.toggleBestReview(revId);
 this.render(appState.getState());
 }
 return;
 }

 // [리뷰 관리] 리뷰 삭제
 const delRevBtn = target.closest('.btn-delete-review') as HTMLElement | null;
 if (delRevBtn) {
 const revId = delRevBtn.dataset.reviewId;
 if (revId && confirm('정말 이 상품 후기를 삭제하시겠습니까?')) {
 ProductReviewStore.deleteReview(revId);
 this.render(appState.getState());
 }
 return;
 }

 // 관리자 상품 가격 일괄 저장
 if (target.closest('#btn-save-products')) {
 document.querySelectorAll('.input-tier-price').forEach(input => {
 const el = input as HTMLInputElement;
 const tierId = el.dataset.tierId;
 const price = parseInt(el.value, 10);
 if (tierId && !isNaN(price)) {
 ModuleRegistry.updateProductPrice(tierId, price);
 }
 });
 alert(' 상품 티어별 판매 가격 정책이 성공적으로 저장 및 업데이트되었습니다.');
 return;
 }

 // 관리자 제휴 출금 승인
 const approveBtn = target.closest('.btn-approve-payout') as HTMLElement;
 if (approveBtn) {
 const partner = approveBtn.dataset.partner;
 approveBtn.textContent = ' 송금 완료됨';
 approveBtn.style.background = '#f2ca50';
 approveBtn.style.color = '#000';
 approveBtn.setAttribute('disabled', 'true');
 alert(`[출금 승인 완료]\n\n파트너 (${partner})의 출금 요청이 정상 승인되었으며, 지정 계좌로 송금 처리가 완료되었습니다.`);
 return;
 }

 // 관리자 미착수 과제 즉시 착수 버튼
 const startTaskBtn = target.closest('.btn-start-task') as HTMLElement;
 if (startTaskBtn) {
 const modId = startTaskBtn.dataset.moduleId;
 alert(` [개발 착수 지시 접수]\n\n과제 ID: '${modId}'\n미착수 잔여 과제의 개발 착수 명령이 작업 큐에 등록되었습니다.`);
 return;
 }

 // 관리자: 솔루션 허브 버티컬 스위치 토글
 const verticalToggle = target.closest('.solution-vertical-toggle') as HTMLInputElement | null;
 if (verticalToggle) {
   const modId = verticalToggle.dataset.moduleId;
   if (modId) {
     ModuleRegistry.toggleModule(modId, verticalToggle.checked);
     this.render(appState.getState());
   }
   return;
 }

 // 관리자: 솔루션 통계 새로고침
 if (target.closest('#btn-reload-solution-stats')) {
   this.render(appState.getState());
   return;
 }

 // 관리자: 파트너 입점 신청 승인
 const approveAppBtn = target.closest('.btn-approve-app') as HTMLElement | null;
 if (approveAppBtn) {
   const appId = approveAppBtn.dataset.appId;
   if (appId) {
     updatePartnerApplicationStatus(appId, 'approved');
     alert(`[${appId}] 파트너 입점 신청이 공식 승인되었습니다.`);
     this.render(appState.getState());
   }
   return;
 }

 // 관리자: 파트너 입점 신청 반려
 const rejectAppBtn = target.closest('.btn-reject-app') as HTMLElement | null;
 if (rejectAppBtn) {
   const appId = rejectAppBtn.dataset.appId;
   if (appId) {
     updatePartnerApplicationStatus(appId, 'rejected');
     alert(`[${appId}] 파트너 입점 신청이 반려되었습니다.`);
     this.render(appState.getState());
   }
   return;
 }

 // 관리자: 파트너 삭제 (기본 파트너도 재생성되지 않도록 삭제 목록에 기록)
 const deletePartnerBtn = target.closest('.btn-delete-partner') as HTMLElement | null;
 if (deletePartnerBtn) {
   const code = deletePartnerBtn.dataset.partner;
   if (code && confirm(`파트너 '${code}'를 삭제하시겠습니까?\n삭제 후에는 목록에 다시 나타나지 않습니다.`)) {
     PartnerTracker.deletePartner(code);
     this.render(appState.getState());
   }
   return;
 }

 // 관리자: 파트너 개별 수수료율 및 상태 저장
 const savePartnerRateBtn = target.closest('.btn-save-partner-rate') as HTMLElement | null;
 if (savePartnerRateBtn) {
   const code = savePartnerRateBtn.dataset.partner;
   if (code) {
     const card = savePartnerRateBtn.closest('.partner-admin-card') as HTMLElement | null;
     const statusSelect = card?.querySelector('.partner-status-select') as HTMLSelectElement | null;
     const rateInput = card?.querySelector('.partner-rate-input') as HTMLInputElement | null;
     const status = (statusSelect?.value as 'active' | 'inactive') || 'inactive';
     const ratePercent = parseFloat(rateInput?.value || '0');
     const rate = Math.max(0, Math.min(100, isNaN(ratePercent) ? 0 : ratePercent)) / 100;

     PartnerTracker.updatePartnerCommission(code, rate, status);
     alert(`[파트너 설정 완료]\n\n파트너 '${code}'의 수수료율이 ${(rate * 100).toFixed(0)}%, 상태가 '${status === 'active' ? '개별 수수료 지급 승인' : '미제공'}'으로 저장되었습니다.`);
     this.render(appState.getState());
   }
   return;
 }

 // 파트너 포털: 메인 홈으로 돌아가기 버튼
 if (target.closest('#btn-back-to-home')) {
   navigateTo('/');
   return;
 }

 // 파트너 포털: 파트너 고유 링크 복사
 if (target.closest('#btn-copy-partner-url')) {
   const input = document.getElementById('input-partner-url') as HTMLInputElement | null;
   if (input && input.value) {
     if (navigator.clipboard) {
       navigator.clipboard.writeText(input.value).then(() => {
         alert('파트너 추천 링크가 클립보드에 복사되었습니다.');
       }).catch(() => {
         input.select();
         document.execCommand('copy');
         alert('파트너 추천 링크가 클립보드에 복사되었습니다.');
       });
     } else {
       input.select();
       document.execCommand('copy');
       alert('파트너 추천 링크가 클립보드에 복사되었습니다.');
     }
   }
   return;
 }

 // 스토어 바우처 발급 완료 코드 복사
 if (target.closest('#btn-copy-issued-voucher')) {
   const input = document.getElementById('issued-voucher-code-input') as HTMLInputElement | null;
   if (input && input.value) {
     if (navigator.clipboard) {
       navigator.clipboard.writeText(input.value).then(() => {
         alert(`[바우처 코드 복사 완료]\n\n코드: ${input.value}\n클립보드에 복사되었습니다. 결제 시 쿠폰 코드 란에 입력하여 사용하세요.`);
       }).catch(() => {
         input.select();
         document.execCommand('copy');
         alert(`[바우처 코드 복사 완료]\n\n코드: ${input.value}`);
       });
     } else {
       input.select();
       document.execCommand('copy');
       alert(`[바우처 코드 복사 완료]\n\n코드: ${input.value}`);
     }
   }
   return;
 }

 // 0-A. PC 모드 카테고리 네비게이션 바 클릭
 if (target.closest('#pc-nav-home')) {
 navigateTo('/');
 return;
 }
 // 상단 카테고리 '종합사주' 클릭 시 /saju 독립 카테고리 페이지로 이동
 if (target.closest('#pc-nav-saju')) {
 navigateTo('/saju');
 return;
 }

 // [항목 7] 상단 카테고리 '특화비책' 클릭 시 운세 특화 비책 화면으로 이동
 if (target.closest('#pc-nav-2027') || target.closest('#pc-nav-special')) {
 if (appState.getState().currentView !== 'landing') {
 appState.setView('landing');
 }
 setTimeout(() => {
 const el = document.getElementById('section-special-prescriptions');
 if (el) el.scrollIntoView({ behavior: 'smooth' });
 }, 100);
 return;
 }

 // [항목 8] 상단 카테고리 '오늘의 운세' 클릭 시 오늘의 운세 화면 위치로 이동
 if (target.closest('#pc-nav-fortune')) {
 if (appState.getState().currentView !== 'landing') {
 appState.setView('landing');
 }
 setTimeout(() => {
 const el = document.getElementById('zodiac-fortune-magi-section');
 if (el) el.scrollIntoView({ behavior: 'smooth' });
 }, 100);
 return;
 }
 if (target.closest('#pc-nav-consult')) {
 appState.setView('consult');
 window.scrollTo({ top: 0, behavior: 'smooth' });
 return;
 }
 if (target.closest('#pc-nav-partner')) {
 appState.setView('partner');
 window.scrollTo({ top: 0, behavior: 'smooth' });
 return;
 }

 // 0-B. 워드프레스 스타일 관리자 대시보드 햄버거 메뉴 토글 & 백드롭 닫기
 if (target.closest('#btn-admin-hamburger')) {
 const sidebar = document.getElementById('wp-admin-sidebar');
 const backdrop = document.getElementById('wp-admin-backdrop');
 if (sidebar && backdrop) {
 sidebar.classList.toggle('open');
 backdrop.classList.toggle('open');
 }
 return;
 }
 if (target.closest('#wp-admin-backdrop, #btn-admin-drawer-close')) {
 const sidebar = document.getElementById('wp-admin-sidebar');
 const backdrop = document.getElementById('wp-admin-backdrop');
 if (sidebar && backdrop) {
 sidebar.classList.remove('open');
 backdrop.classList.remove('open');
 }
 return;
 }
 if (target.closest('.admin-tab-btn') && window.innerWidth <= 1024) {
 const sidebar = document.getElementById('wp-admin-sidebar');
 const backdrop = document.getElementById('wp-admin-backdrop');
 if (sidebar && backdrop) {
 sidebar.classList.remove('open');
 backdrop.classList.remove('open');
 }
 }

 // 0. 천명원 플로팅 바텀 독 탭 전환
 if (target.closest('#dock-btn-home')) {
 appState.setView('landing');
 window.scrollTo({ top: 0, behavior: 'smooth' });
 return;
 }
 if (target.closest('#dock-btn-analyze')) {
 appState.setActiveTierTab('FREE');
 appState.setView('analyze');
 window.scrollTo({ top: 0, behavior: 'smooth' });
 return;
 }
 if (target.closest('#dock-btn-2027')) {
 appState.setActiveTierTab('YEAR_2027');
 appState.setView('analyze');
 window.scrollTo({ top: 0, behavior: 'smooth' });
 return;
 }
 if (target.closest('#dock-btn-study')) {
 resetStudyCategory();
 selectStudyArticle(null, false);
 appState.setView('study');
 window.scrollTo({ top: 0, behavior: 'smooth' });
 this.render(appState.getState());
 return;
 }
 if (target.closest('#dock-btn-store')) {
 resetStoreCategory();
 selectStoreProduct(null);
 appState.setView('store');
 window.scrollTo({ top: 0, behavior: 'smooth' });
 this.render(appState.getState());
 return;
 }
 if (target.closest('#dock-btn-consult')) {
 appState.setView('consult');
 window.scrollTo({ top: 0, behavior: 'smooth' });
 return;
 }
 if (target.closest('#dock-btn-partner')) {
 appState.setView('partner');
 window.scrollTo({ top: 0, behavior: 'smooth' });
 return;
 }

 // [인증 & 계정 시스템]
 if (target.closest('#btn-header-login')) {
 this.openAuthModal('login');
 return;
 }
 if (target.closest('#btn-header-logout')) {
 AuthService.logout();
    appState.setView('landing');
    window.history.pushState(null, '', window.location.pathname);
 this.render(appState.getState());
 alert('정상적으로 로그아웃되었습니다.');
 return;
 }
 // [이용자 대시보드 모바일 햄버거 토글 & 사이드바 닫기 (최고관리자 구조와 동일)]
    if (target.closest('#btn-member-hamburger')) {
      const sidebar = document.getElementById('member-dashboard-sidebar');
      const backdrop = document.getElementById('member-dashboard-backdrop');
      if (sidebar && backdrop) {
        sidebar.classList.toggle('open');
        backdrop.classList.toggle('open');
      }
      return;
    }

    if (target.closest('#btn-close-member-sidebar') || target.closest('#member-dashboard-backdrop')) {
      const sidebar = document.getElementById('member-dashboard-sidebar');
      const backdrop = document.getElementById('member-dashboard-backdrop');
      if (sidebar && backdrop) {
        sidebar.classList.remove('open');
        backdrop.classList.remove('open');
      }
      return;
    }

    
    // [이용자 대시보드: 회원 정보 수정 저장]
    if (target.closest('#btn-save-user-profile')) {
      e.preventDefault();
      const currentUser = AuthService.getCurrentUser();
      const newUsername = (document.getElementById('input-profile-username') as HTMLInputElement)?.value.trim();
      const newPassword = (document.getElementById('input-profile-new-password') as HTMLInputElement)?.value;
      const confirmPassword = (document.getElementById('input-profile-confirm-password') as HTMLInputElement)?.value;
      const newName = (document.getElementById('input-profile-name') as HTMLInputElement)?.value.trim();
      const newPhone = (document.getElementById('input-profile-phone') as HTMLInputElement)?.value.trim();
      const birthDate = (document.getElementById('input-profile-birthdate') as HTMLInputElement)?.value;
      const calendarType = (document.getElementById('input-profile-calendar') as HTMLSelectElement)?.value as 'solar' | 'lunar';
      const birthTime = (document.getElementById('input-profile-birthtime') as HTMLSelectElement)?.value;
      const gender = (document.getElementById('input-profile-gender') as HTMLSelectElement)?.value as 'male' | 'female';

      if (!newUsername || newUsername.length < 3) {
        alert('아이디는 최소 3자 이상 입력해 주세요.');
        return;
      }
      if (!newName) {
        alert('이름을 입력해 주세요.');
        return;
      }
      if (newPassword && newPassword.length < 4) {
        alert('새 비밀번호는 최소 4자 이상 입력해 주세요.');
        return;
      }
      if (newPassword && newPassword !== confirmPassword) {
        alert('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
        return;
      }

      const res = AuthService.updateAccount(currentUser.id, {
        username: newUsername,
        password: newPassword || undefined,
        name: newName,
        phone: newPhone,
        birthDate,
        birthTime,
        calendarType,
        gender,
      });

      if (!res.success) {
        alert(res.message);
        return;
      }

      // 사주 프로필/세션은 가입·온보딩과 동일한 단일 입력점(syncUserSajuProfile)으로 갱신
      if (birthDate) {
        const prevProfile = UserSajuStore.getProfile(currentUser.id);
        const synced = UserSajuStore.syncUserSajuProfile({
          userId: currentUser.id,
          userName: newName,
          birthDate,
          birthTime: birthTime || null,
          calendarType: calendarType || 'solar',
          gender: gender || 'male',
          isLeapMonth: prevProfile?.isLeapMonth || false,
          birthRegion: prevProfile?.birthRegion,
        });
        if (!synced) {
          alert('생년월일 형식이 올바르지 않습니다. (예: 1990-03-21)');
          return;
        }
      }

      alert('회원 정보와 사주 프로필이 성공적으로 저장되었습니다.\n대시보드의 일진 처방이 갱신되었습니다.');
      this.render(appState.getState());
      return;
    }

    // [이용자 대시보드: 회원 배송지 추가/수정 모달 열기 헬퍼]
    const openAddressEditModal = (targetAddr?: any) => {
      let modal = document.getElementById('modal-member-address-edit');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-member-address-edit';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:99999;display:flex;align-items:center;justify-content:center;padding:1rem;box-sizing:border-box;backdrop-filter:blur(6px);';
        document.body.appendChild(modal);
      }
      modal.innerHTML = `
        <div style="background:#131824;border:1.5px solid rgba(242,202,80,0.35);border-radius:14px;max-width:480px;width:100%;padding:1.5rem;box-shadow:0 12px 35px rgba(0,0,0,0.6);box-sizing:border-box;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:0.75rem;">
            <div style="font-weight:800;color:#fff;font-size:1.05rem;display:flex;align-items:center;gap:0.4rem;">
              <span class="material-symbols-outlined" style="color:var(--primary);font-size:20px;">home_pin</span>
              <span>${targetAddr ? '배송지 정보 수정' : '신규 배송지 등록'}</span>
            </div>
            <button type="button" id="btn-close-addr-modal" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer;">✕</button>
          </div>
          <form id="form-save-member-address" style="display:flex;flex-direction:column;gap:0.85rem;">
            <input type="hidden" id="addr-input-id" value="${targetAddr?.id || ''}" />
            <div>
              <label style="display:block;font-size:0.75rem;color:var(--text-muted);margin-bottom:0.25rem;">수령인 성명 *</label>
              <input type="text" id="addr-input-name" required value="${targetAddr?.recipientName || ''}" placeholder="받으시는 분 성함" style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);color:#fff;padding:0.55rem;border-radius:6px;font-size:0.85rem;" />
            </div>
            <div>
              <label style="display:block;font-size:0.75rem;color:var(--text-muted);margin-bottom:0.25rem;">연락처 (휴대폰) *</label>
              <input type="tel" id="addr-input-phone" required value="${targetAddr?.recipientPhone || ''}" placeholder="010-0000-0000" style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);color:#fff;padding:0.55rem;border-radius:6px;font-size:0.85rem;" />
            </div>
            <div>
              <label style="display:block;font-size:0.75rem;color:var(--text-muted);margin-bottom:0.25rem;">배송지 주소 (도로명 / 지번) *</label>
              <input type="text" id="addr-input-address" required value="${targetAddr?.address || ''}" placeholder="예: 서울특별시 강남구 테헤란로 152" style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);color:#fff;padding:0.55rem;border-radius:6px;font-size:0.85rem;" />
            </div>
            <div>
              <label style="display:block;font-size:0.75rem;color:var(--text-muted);margin-bottom:0.25rem;">상세 주소 (동/호수/건물명)</label>
              <input type="text" id="addr-input-detail" value="${targetAddr?.detailAddress || ''}" placeholder="예: 101동 1204호" style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);color:#fff;padding:0.55rem;border-radius:6px;font-size:0.85rem;" />
            </div>
            <div>
              <label style="display:block;font-size:0.75rem;color:var(--text-muted);margin-bottom:0.25rem;">배송 메모</label>
              <input type="text" id="addr-input-memo" value="${targetAddr?.deliveryMemo || ''}" placeholder="예: 부재 시 문 앞에 놓아주세요" style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);color:#fff;padding:0.55rem;border-radius:6px;font-size:0.85rem;" />
            </div>
            <label style="display:flex;align-items:center;gap:0.45rem;font-size:0.8rem;color:#cbd5e1;cursor:pointer;margin-top:0.25rem;">
              <input type="checkbox" id="addr-input-default" ${targetAddr?.isDefault ? 'checked' : ''} />
              <span>이 배송지를 기본 배송지로 설정</span>
            </label>
            <div style="display:flex;gap:0.5rem;margin-top:0.75rem;">
              <button type="button" id="btn-cancel-addr-modal" style="flex:1;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#fff;padding:0.6rem;border-radius:6px;cursor:pointer;font-size:0.82rem;font-weight:700;">취소</button>
              <button type="submit" style="flex:2;background:var(--primary);border:none;color:#1c1500;padding:0.6rem;border-radius:6px;cursor:pointer;font-size:0.82rem;font-weight:800;">${targetAddr ? '수정 완료' : '등록 완료'}</button>
            </div>
          </form>
        </div>
      `;
      modal.style.display = 'flex';

      const closeModal = () => { if (modal) modal.style.display = 'none'; };
      modal.querySelector('#btn-close-addr-modal')?.addEventListener('click', closeModal);
      modal.querySelector('#btn-cancel-addr-modal')?.addEventListener('click', closeModal);
      modal.addEventListener('click', (ev) => { if (ev.target === modal) closeModal(); });

      const form = modal.querySelector('#form-save-member-address') as HTMLFormElement;
      form?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const id = (modal?.querySelector('#addr-input-id') as HTMLInputElement)?.value.trim() || undefined;
        const name = (modal?.querySelector('#addr-input-name') as HTMLInputElement)?.value.trim();
        const phone = (modal?.querySelector('#addr-input-phone') as HTMLInputElement)?.value.trim();
        const address = (modal?.querySelector('#addr-input-address') as HTMLInputElement)?.value.trim();
        const detail = (modal?.querySelector('#addr-input-detail') as HTMLInputElement)?.value.trim() || '';
        const memo = (modal?.querySelector('#addr-input-memo') as HTMLInputElement)?.value.trim() || '';
        const isDefault = (modal?.querySelector('#addr-input-default') as HTMLInputElement)?.checked;

        if (!name || !phone || !address) {
          alert('수령인 성명, 연락처, 배송지 주소를 모두 입력해주세요.');
          return;
        }

        UserAddressStore.saveAddress({
          id,
          recipientName: name,
          recipientPhone: phone,
          address,
          detailAddress: detail,
          deliveryMemo: memo,
          isDefault,
        });

        closeModal();
        alert(id ? '배송지 정보가 수정되었습니다.' : '새 배송지가 등록되었습니다.');
        this.render(appState.getState());
      });
    };

    // [이용자 대시보드: 회원 배송지 신규 등록 클릭]
    if (target.closest('#btn-add-member-address')) {
      e.preventDefault();
      openAddressEditModal();
      return;
    }

    // [이용자 대시보드: 회원 배송지 수정 클릭]
    const editAddressBtn = target.closest('.btn-edit-member-address') as HTMLElement | null;
    if (editAddressBtn) {
      e.preventDefault();
      const addrId = editAddressBtn.dataset.addressId;
      const targetAddr = UserAddressStore.getAddresses().find(a => a.id === addrId);
      openAddressEditModal(targetAddr);
      return;
    }

    // [이용자 대시보드: 회원 배송지 삭제]
    const deleteAddressBtn = target.closest('.btn-delete-member-address') as HTMLElement | null;
    if (deleteAddressBtn) {
      e.preventDefault();
      const addrId = deleteAddressBtn.dataset.addressId;
      if (addrId && confirm('해당 배송지를 주소록에서 삭제하시겠습니까?')) {
        UserAddressStore.deleteAddress(addrId);
        this.render(appState.getState());
      }
      return;
    }

    // [이용자 대시보드: 회원 탈퇴 접이식 아코디언 토글]
    if (target.closest('#btn-toggle-withdraw-section')) {
      e.preventDefault();
      const withdrawBox = document.getElementById('withdraw-accordion-box');
      if (withdrawBox) {
        const isHidden = withdrawBox.style.display === 'none' || !withdrawBox.style.display;
        withdrawBox.style.display = isHidden ? 'block' : 'none';
      }
      return;
    }

    // [이용자 대시보드: 회원 탈퇴 확정]
    const memberWithdrawBtn = target.closest('#btn-confirm-delete-account') as HTMLElement | null;
    if (memberWithdrawBtn) {
      e.preventDefault();
      const chkAgree = document.getElementById('chk-agree-withdraw') as HTMLInputElement | null;
      if (!chkAgree || !chkAgree.checked) {
        alert('회원 탈퇴 및 계정 영구 삭제 동의 항목에 체크해 주세요.');
        return;
      }

      const confirmed = confirm('정말로 회원 탈퇴를 진행하시겠습니까?\n\n탈퇴 시 구매 내역, 사주 리포트 및 모든 개인정보가 즉시 영구 삭제되며 복구할 수 없습니다.');
      if (!confirmed) return;

      const userId = memberWithdrawBtn.dataset.userId || AuthService.getCurrentUser().id;
      const res = AuthService.deleteAccount(userId);
      if (res.success) {
        appState.setView('landing');
        window.history.pushState(null, '', window.location.pathname);
        this.render(appState.getState());
        alert('회원 탈퇴가 정상적으로 처리되었습니다. 그동안 이용해 주셔서 감사합니다.');
      } else {
        alert(res.message);
      }
      return;
    }

    // [달력 탭 상단 전환 버튼 & 홈 이동 (메인 뷰 vs 대시보드 뷰 분기)]
    if (target.closest('#tab-goto-lucky-cal')) {
      e.preventDefault();
      if (appState.getState().currentView === 'member-dashboard') {
        setMemberActiveTab('tab-lucky-calendar');
      } else {
        appState.setView('lucky-calendar');
      }
      this.render(appState.getState());
      return;
    }
    if (target.closest('#tab-goto-magi-cal')) {
      e.preventDefault();
      if (appState.getState().currentView === 'member-dashboard') {
        setMemberActiveTab('tab-magi-calendar');
      } else {
        appState.setView('magi-calendar');
      }
      this.render(appState.getState());
      return;
    }
    if (target.closest('#btn-cal-back-home')) {
      e.preventDefault();
      if (appState.getState().currentView === 'member-dashboard') {
        setMemberActiveTab('tab-daily');
      } else {
        appState.setView('landing');
      }
      this.render(appState.getState());
      return;
    }
    if (target.closest('#btn-goto-analyze-from-cal')) {
      e.preventDefault();
      appState.setView('analyze');
      this.render(appState.getState());
      return;
    }

    // [이용자 대시보드 카테고리 탭 전환 및 버튼 핸들러]
    const memberTabBtn = target.closest('[data-member-tab]') as HTMLElement;
    if (memberTabBtn) {
      const tabId = memberTabBtn.dataset.memberTab;
      if (tabId) {
        const sidebar = document.getElementById('member-dashboard-sidebar');
        const backdrop = document.getElementById('member-dashboard-backdrop');
        if (sidebar && backdrop) {
          sidebar.classList.remove('open');
          backdrop.classList.remove('open');
        }
        setMemberActiveTab(tabId);
        this.render(appState.getState());
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    if (target.closest('#btn-dashboard-logout')) {
      AuthService.logout();
      appState.setView('landing');
      this.render(appState.getState());
      alert('정상적으로 로그아웃되었습니다.');
      return;
    }

    if (target.closest('#btn-goto-store-from-dash')) {
      appState.setView('store');
      this.render(appState.getState());
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // [리포트 열람 버튼 통합 핸들러 (마이페이지 주문내역 / 결제완료창 단일 창구)]
    const reportBtn = target.closest('.btn-open-user-report, #btn-store-goto-report, #btn-goto-my-result') as HTMLElement;
    if (reportBtn) {
      const orderId = reportBtn.dataset?.orderId || '';
      if (!requireLogin('사주 분석 리포트는 로그인 후 마이페이지 [주문내역]에서 확인하실 수 있습니다.')) return;

      // 소유자 + 결제 완료 검증은 entitlement 모듈이 단독 수행 (타인 주문 열람 불가)
      const targetOrder = resolveMyOrderForView(orderId || null);
      if (targetOrder) {
        UserSajuStore.ensureAnalysisReadyFromOrder(targetOrder);
        appState.setView('result');
        this.render(appState.getState());
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert('구매하신 리포트 주문 내역을 찾을 수 없습니다. 마이페이지 [주문내역]을 확인해 주세요.');
      }
      return;
    }

    // [잠금 화면: 비로그인 로그인 유도]
    if (target.closest('#btn-entitlement-login')) {
      requireLogin();
      return;
    }

    // [전자책 정본 PDF 다운로드 버튼 클릭 핸들러 (내 디지털 서재 & 주문내역 통합)]
    const ebookDownloadBtn = target.closest('.btn-download-ebook-pdf') as HTMLElement | null;
    if (ebookDownloadBtn) {
      e.preventDefault();
      const orderId = ebookDownloadBtn.dataset.orderId || '';
      const prodId = ebookDownloadBtn.dataset.productId || 'book-saju-principles-vol1';
      
      const prod = getStoreProductById(prodId);
      const downloadFileName = `[마보살_전자책]_${(prod?.title || '정통사주명리학원론_제1권').replace(/[\\/:*?"<>|]/g, '_')}_${orderId || 'DOWN'}.pdf`;
      const payloadUrl = prod?.contentPayload || '/assets/downloads/saju_principles_vol1_master.pdf';
      
      const a = document.createElement('a');
      a.href = payloadUrl;
      a.target = '_blank';
      a.download = downloadFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      alert('전자책 PDF 정본 파일 다운로드가 시작되었습니다.');
      return;
    }

    // [주문 내역 / 카테고리: 상품 상세 보기 버튼 클릭 시 스토어 해당 상품 상세로 이동]
    const gotoStoreProductBtn = target.closest('.btn-goto-store-product-detail') as HTMLElement | null;
    if (gotoStoreProductBtn) {
      e.preventDefault();
      const pid = gotoStoreProductBtn.dataset.productId;
      if (pid) {
        selectStoreProduct(pid, false);
      }
      navigateTo(`/store?product=${encodeURIComponent(pid || '')}`);
      return;
    }

    // [B안 구매 전환 퍼널: 성별 토글 버튼]
    const funnelGenderBtn = target.closest('.btn-funnel-gender') as HTMLElement;
    if (funnelGenderBtn) {
      const g = funnelGenderBtn.dataset.gender as 'male' | 'female';
      if (g) {
        this.selectedGender = g;
        document.querySelectorAll('.btn-funnel-gender').forEach(btn => {
          const el = btn as HTMLElement;
          const isSelected = el.dataset.gender === g;
          el.style.borderColor = isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.15)';
          el.style.background = isSelected ? 'rgba(242,202,80,0.15)' : '#0c0f18';
          el.style.color = isSelected ? 'var(--primary)' : '#94a3b8';
        });
      }
      return;
    }

    // [B안 구매 전환 퍼널: 고민 카테고리 칩 선택]
    const funnelTroubleChip = target.closest('.chip-funnel-trouble') as HTMLElement;
    if (funnelTroubleChip) {
      const defaultText = funnelTroubleChip.dataset.text || '';
      document.querySelectorAll('.chip-funnel-trouble').forEach(chip => {
        const el = chip as HTMLElement;
        el.style.background = 'rgba(255,255,255,0.06)';
        el.style.color = '#cbd5e1';
        el.style.borderColor = 'rgba(255,255,255,0.12)';
      });
      funnelTroubleChip.style.background = 'var(--primary)';
      funnelTroubleChip.style.color = '#1c1500';
      funnelTroubleChip.style.borderColor = 'var(--primary)';
      const troubleInput = document.getElementById('input-funnel-trouble-text') as HTMLTextAreaElement;
      if (troubleInput && defaultText) {
        troubleInput.value = defaultText;
      }
      return;
    }

    // [B안 구매 전환 퍼널: 결과 페이지에서 다시 진단하기]
    if (target.closest('.btn-funnel-retest')) {
      appState.setView('landing');
      this.render(appState.getState());
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // [B안 구매 전환 퍼널: 유료 전환 결제 확인 -> 정규 주문서(checkout)로 단일화]
    if (target.closest('#btn-open-funnel-checkout')) {
      AbTestService.trackEvent('paid_click');
      const currentUser = AuthService.getCurrentUser();
      if (currentUser.role === 'guest') {
        alert('유료 사주 분석 리포트는 로그인 후 구매하실 수 있습니다.');
        this.openAuthModal('login');
        return;
      }
      const hasSaju = UserSajuStore.hasSajuProfile(currentUser.username || currentUser.id);
      if (!hasSaju) {
        alert('정밀 사주 분석을 위해 먼저 사주 정보(성별·생년월일시)를 등록해 주세요.\n사주 입력 페이지로 이동합니다.');
        sessionStorage.setItem('mabosal_pending_saju_product', 'prod-paid-saju-premium');
        appState.setView('analyze');
        this.render(appState.getState());
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const prod = getStoreProductById('prod-paid-saju-premium');
      if (prod) {
        const sajuSnap = UserSajuStore.getProfile(currentUser.username || currentUser.id) || UserSajuStore.getProfileOrDefault();
        CartStore.clear();
        CartStore.addItem(prod, 1, sajuSnap);
        appState.setActiveTierTab('PAID');
        appState.setView('checkout');
        this.render(appState.getState());
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    // [B안 구매 전환 퍼널: 결제 확인 모달 닫기 (하위 호환성 유지)]
    if (target.closest('.btn-close-funnel-modal')) {
      const slot = document.getElementById('funnel-checkout-modal-slot');
      if (slot) slot.innerHTML = '';
      return;
    }

    // [스토어 상세: 대상자 사주 정보 정식 등록하러 가기]
    const gotoAnalyzeTargetBtn = target.closest('.btn-goto-analyze-target') as HTMLElement | null;
    if (gotoAnalyzeTargetBtn) {
      e.preventDefault();
      const pid = gotoAnalyzeTargetBtn.dataset.productId;
      if (pid) {
        sessionStorage.setItem('mabosal_pending_saju_product', pid);
      }
      appState.setView('analyze');
      this.render(appState.getState());
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // [사주 정보 입력 화면 이동 버튼]
    if (target.closest('#btn-goto-start-saju')) {
      appState.setView('analyze');
      this.render(appState.getState());
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // [리포트 열람 링크 SPA 내비게이션 (새로고침 방지 & 마이페이지 주문내역 단일화)]
    const reportLink = target.closest('a[href*="view=report"], a[href*="view=result"]') as HTMLAnchorElement;
    if (reportLink && !reportLink.hasAttribute('download')) {
      e.preventDefault();
      const currentUser = AuthService.getCurrentUser();
      if (currentUser.role === 'guest') {
        alert('사주 분석 리포트는 로그인 후 마이페이지 [주문내역]에서 확인하실 수 있습니다.');
        const modal = document.getElementById('modal-auth-container');
        if (modal) modal.style.display = 'flex';
        return;
      }
      UserSajuStore.restoreLastActiveAnalysis();
      appState.setView('result');
      this.render(appState.getState());
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // [이미 구매한 리포트 바로 열람 클릭]
    const viewPurchasedBtn = target.closest('.btn-view-purchased-direct') as HTMLElement;
    if (viewPurchasedBtn) {
      const orderId = viewPurchasedBtn.dataset.orderId;
      UserSajuStore.restoreLastActiveAnalysis(orderId, null);
      appState.setView('result');
      this.render(appState.getState());
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // [주문 상세 및 지원 아코디언 토글]
    const toggleDetailBtn = target.closest('.btn-toggle-order-detail') as HTMLElement;
    if (toggleDetailBtn) {
      const targetId = toggleDetailBtn.dataset.target;
      if (targetId) {
        const detailEl = document.getElementById(targetId);
        if (detailEl) {
          const isHidden = detailEl.style.display === 'none';
          detailEl.style.display = isHidden ? 'block' : 'none';
          toggleDetailBtn.textContent = isHidden ? '주문 상세 및 지원 ▴' : '주문 상세 및 지원 ▾';
        }
      }
      return;
    }

    // [고객 주문 취소 및 환불 신청 클릭]
    const refundReqBtn = target.closest('.btn-request-order-refund') as HTMLElement;
    if (refundReqBtn) {
      const orderId = refundReqBtn.dataset.orderId;
      if (orderId) {
        const reason = prompt('취소 및 환불 신청 사유를 입력해 주세요 (예: 단순 변심, 주문 실수 등):');
        if (reason && reason.trim()) {
          const res = requestStoreOrderRefund(orderId, reason.trim());
          alert(res.message);
          this.render(appState.getState());
        }
      }
      return;
    }

    // [최고 관리자 환불 승인 처리 클릭]
    const approveRefundBtn = target.closest('.btn-admin-approve-refund') as HTMLElement;
    if (approveRefundBtn) {
      const orderId = approveRefundBtn.dataset.orderId;
      if (orderId && confirm(`[주문번호: ${orderId}]\n\n정말 본 주문의 환불 처리를 최종 승인하시겠습니까?\n상태가 '환불완료'로 변경됩니다.`)) {
        const res = approveStoreOrderRefund(orderId);
        alert(res.message);
        this.render(appState.getState());
      }
      return;
    }

    // [최고 관리자 무통장 입금 승인 처리 클릭]
    const approveDepositBtn = target.closest('.btn-admin-approve-bank-deposit') as HTMLElement;
    if (approveDepositBtn) {
      const orderId = approveDepositBtn.dataset.orderId;
      if (orderId && confirm(`[주문번호: ${orderId}]\n\n해당 주문의 무통장 입금을 확인하셨습니까?\n승인 시 주문 상태가 즉시 '결제완료'로 처리되고 구매자에게 서비스가 제공됩니다.`)) {
        const res = approveStoreBankDeposit(orderId);
        alert(res.message);
        this.render(appState.getState());
      }
      return;
    }

    // [장바구니 전체 보드 뷰 이동]
    if (target.closest('#btn-cart-login-prompt, .btn-cart-trigger-login, #btn-checkout-login-prompt, .btn-checkout-trigger-login')) { this.openAuthModal('login'); return; }
    if (target.closest('#btn-open-cart-modal, #btn-header-cart, #header-btn-cart, .btn-open-cart, .btn-goto-cart')) {
      if (AuthService.getCurrentUser().role === 'guest') { alert('장바구니는 로그인 후 이용 가능합니다.'); this.openAuthModal('login'); return; }
      appState.setView('cart');
      this.render(appState.getState());
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // [스토어 이동]
    if (target.closest('.btn-goto-store')) {
      appState.setView('store');
      this.render(appState.getState());
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // [장바구니에서 주문서 작성 보드로 이동]
    if (target.closest('#btn-proceed-to-checkout')) {
      if (AuthService.getCurrentUser().role === 'guest') { alert('주문서 작성은 로그인 후 이용 가능합니다.'); this.openAuthModal('login'); return; }
      const selected = CartStore.getSelectedItems();
      if (selected.length === 0) {
        alert('주문하실 상품을 하나 이상 선택해 주세요.');
        return;
      }
      const val = CheckoutService.validateCheckoutItems(selected);
      if (!val.valid) {
        alert(val.message);
        return;
      }
      appState.setView('checkout');
      this.render(appState.getState());
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // [주문서 작성 보드: 수량 증가 / 감소 / 삭제 실시간 반영]
    const checkoutQtyPlusBtn = target.closest('.btn-checkout-qty-plus') as HTMLElement;
    if (checkoutQtyPlusBtn) {
      const cartId = checkoutQtyPlusBtn.dataset.cartId;
      if (cartId) {
        const item = CartStore.getItems().find(it => it.id === cartId);
        if (item && item.quantity < 99) {
          CartStore.updateQuantity(cartId, item.quantity + 1);
          this.render(appState.getState());
        }
      }
      return;
    }
    const checkoutQtyMinusBtn = target.closest('.btn-checkout-qty-minus') as HTMLElement;
    if (checkoutQtyMinusBtn) {
      const cartId = checkoutQtyMinusBtn.dataset.cartId;
      if (cartId) {
        const item = CartStore.getItems().find(it => it.id === cartId);
        if (item && item.quantity > 1) {
          CartStore.updateQuantity(cartId, item.quantity - 1);
          this.render(appState.getState());
        }
      }
      return;
    }
    const checkoutRemoveBtn = target.closest('.btn-checkout-remove-item') as HTMLElement;
    if (checkoutRemoveBtn) {
      const cartId = checkoutRemoveBtn.dataset.cartId;
      if (cartId && confirm('해당 상품을 주문 목록에서 제외하시겠습니까?')) {
        CartStore.removeItem(cartId);
        this.render(appState.getState());
      }
      return;
    }

    // [주문서: 주문자 정보와 동일 체크박스]
    const sameBuyerCheck = target.closest('#check-same-as-buyer') as HTMLInputElement;
    if (sameBuyerCheck) {
      const buyerNameInput = document.getElementById('checkout-buyer-name') as HTMLInputElement;
      const buyerPhoneInput = document.getElementById('checkout-buyer-phone') as HTMLInputElement;
      const receiverNameInput = document.getElementById('checkout-receiver-name') as HTMLInputElement;
      const receiverPhoneInput = document.getElementById('checkout-receiver-phone') as HTMLInputElement;
      if (sameBuyerCheck.checked && buyerNameInput && receiverNameInput) {
        receiverNameInput.value = buyerNameInput.value;
        if (buyerPhoneInput && receiverPhoneInput) receiverPhoneInput.value = buyerPhoneInput.value;
      }
    }

    // [상품 상세: 수량 증가 / 감소 및 실시간 금액 갱신]
    const updateDetailTotal = () => {
      const qtyInput = document.getElementById('detail-qty-input') as HTMLInputElement;
      const totalPriceEl = document.getElementById('detail-total-price') as HTMLElement;
      const discountRow = document.getElementById('detail-coupon-discount-row');
      const discountText = document.getElementById('detail-coupon-discount-text');
      const discountValInput = document.getElementById('detail-coupon-discount-val') as HTMLInputElement;
      if (!totalPriceEl) return;
      const cur = parseInt(qtyInput?.value || '1', 10);
      const unitPrice = parseInt(totalPriceEl.dataset.unitPrice || '0', 10);
      const rawTotal = unitPrice * cur;
      const discountVal = parseInt(discountValInput?.value || '0', 10);
      const finalPrice = Math.max(0, rawTotal - discountVal);
      if (discountVal > 0 && discountRow && discountText) {
        discountRow.style.display = 'flex';
        discountText.textContent = `- ₩ ${discountVal.toLocaleString()}`;
      } else if (discountRow) {
        discountRow.style.display = 'none';
      }
      totalPriceEl.textContent = `₩ ${finalPrice.toLocaleString()}`;
    };

    const qtyPlusBtn = target.closest('#btn-detail-qty-plus');
    if (qtyPlusBtn) {
      const qtyInput = document.getElementById('detail-qty-input') as HTMLInputElement;
      const qtyDisplay = document.getElementById('detail-qty-display');
      if (qtyInput && qtyDisplay) {
        let cur = parseInt(qtyInput.value || '1', 10);
        if (cur < 99) cur += 1;
        qtyInput.value = String(cur);
        qtyDisplay.textContent = String(cur);
        updateDetailTotal();
      }
      return;
    }
    const qtyMinusBtn = target.closest('#btn-detail-qty-minus');
    if (qtyMinusBtn) {
      const qtyInput = document.getElementById('detail-qty-input') as HTMLInputElement;
      const qtyDisplay = document.getElementById('detail-qty-display');
      if (qtyInput && qtyDisplay) {
        let cur = parseInt(qtyInput.value || '1', 10);
        if (cur > 1) cur -= 1;
        qtyInput.value = String(cur);
        qtyDisplay.textContent = String(cur);
        updateDetailTotal();
      }
      return;
    }

    // [상품 상세: 쿠폰 적용 버튼]
    const detailApplyCouponBtn = target.closest('#btn-detail-apply-coupon');
    if (detailApplyCouponBtn) {
      const couponInput = document.getElementById('detail-coupon-input') as HTMLInputElement;
      const couponMsg = document.getElementById('detail-coupon-msg');
      const couponTag = document.getElementById('detail-coupon-tag');
      const cancelBtn = document.getElementById('btn-detail-cancel-coupon');
      const discountValInput = document.getElementById('detail-coupon-discount-val') as HTMLInputElement;
      const codeValInput = document.getElementById('detail-coupon-code-val') as HTMLInputElement;
      const totalPriceEl = document.getElementById('detail-total-price') as HTMLElement;
      const qtyInput = document.getElementById('detail-qty-input') as HTMLInputElement;

      const code = couponInput?.value?.trim() || '';
      const unitPrice = parseInt(totalPriceEl?.dataset?.unitPrice || '0', 10);
      const curQty = parseInt(qtyInput?.value || '1', 10);
      const rawTotal = unitPrice * curQty;

      const res = calculateStoreCouponDiscount(code, rawTotal);
      if (couponMsg) {
        couponMsg.style.display = 'block';
        if (res.valid) {
          couponMsg.style.color = '#4ade80';
          couponMsg.textContent = `✓ ${res.message}`;
          if (couponTag) couponTag.style.display = 'inline-block';
          if (cancelBtn) cancelBtn.style.display = 'inline-block';
          if (discountValInput) discountValInput.value = String(res.discountAmount);
          if (codeValInput) codeValInput.value = res.couponCode;
          updateDetailTotal();
        } else {
          couponMsg.style.color = '#f87171';
          couponMsg.textContent = `✕ ${res.message}`;
        }
      }
      return;
    }

    // [상품 상세: 쿠폰 취소 버튼]
    const detailCancelCouponBtn = target.closest('#btn-detail-cancel-coupon');
    if (detailCancelCouponBtn) {
      const couponInput = document.getElementById('detail-coupon-input') as HTMLInputElement;
      const couponMsg = document.getElementById('detail-coupon-msg');
      const couponTag = document.getElementById('detail-coupon-tag');
      const discountValInput = document.getElementById('detail-coupon-discount-val') as HTMLInputElement;
      const codeValInput = document.getElementById('detail-coupon-code-val') as HTMLInputElement;
      if (couponInput) couponInput.value = '';
      if (couponMsg) { couponMsg.style.display = 'none'; couponMsg.textContent = ''; }
      if (couponTag) couponTag.style.display = 'none';
      if (detailCancelCouponBtn instanceof HTMLElement) detailCancelCouponBtn.style.display = 'none';
      if (discountValInput) discountValInput.value = '0';
      if (codeValInput) codeValInput.value = '';
      updateDetailTotal();
      return;
    }

    // [상세페이지 3단 탭 전환: 상품상세정보 / 상품고시&환불규정 / 구매후기]
    const detailTabBtn = target.closest('.btn-store-detail-tab') as HTMLElement | null;
    if (detailTabBtn) {
      e.preventDefault();
      const tabId = detailTabBtn.dataset.tabId;
      if (tabId) {
        document.querySelectorAll('.btn-store-detail-tab').forEach(b => {
          b.classList.remove('active');
          (b as HTMLElement).style.color = '#94a3b8';
          (b as HTMLElement).style.borderBottom = '3px solid transparent';
          (b as HTMLElement).style.fontWeight = '700';
        });
        detailTabBtn.classList.add('active');
        detailTabBtn.style.color = 'var(--primary)';
        detailTabBtn.style.borderBottom = '3px solid var(--primary)';
        detailTabBtn.style.fontWeight = '800';

        document.querySelectorAll('.store-detail-tab-pane').forEach(p => {
          (p as HTMLElement).style.display = 'none';
        });
        const targetPane = document.getElementById(tabId);
        if (targetPane) targetPane.style.display = 'block';
      }
      return;
    }

    // [상세정보 길이 접기 / 더보기 토글]
    const toggleDetailFoldBtn = target.closest('#btn-toggle-detail-fold') as HTMLElement | null;
    if (toggleDetailFoldBtn) {
      e.preventDefault();
      const contentEl = document.getElementById('store-detail-foldable-content');
      const fadeOverlay = document.getElementById('store-detail-fade-overlay');
      const btnText = document.getElementById('btn-toggle-detail-fold-text');
      const btnIcon = document.getElementById('btn-toggle-detail-fold-icon');

      if (contentEl) {
        const isFolded = contentEl.classList.contains('store-detail-folded');
        if (isFolded) {
          // 펼치기
          contentEl.classList.remove('store-detail-folded');
          contentEl.classList.add('store-detail-unfolded');
          contentEl.style.maxHeight = 'none';
          if (fadeOverlay) fadeOverlay.style.display = 'none';
          if (btnText) btnText.textContent = '상품 상세정보 접기';
          if (btnIcon) btnIcon.textContent = 'expand_less';
        } else {
          // 접기
          contentEl.classList.remove('store-detail-unfolded');
          contentEl.classList.add('store-detail-folded');
          contentEl.style.maxHeight = '540px';
          if (fadeOverlay) fadeOverlay.style.display = 'block';
          if (btnText) btnText.textContent = '상품 상세정보 더보기';
          if (btnIcon) btnIcon.textContent = 'expand_more';
          contentEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      return;
    }

    // [상세 페이지에서 장바구니 담기]
    const addToCartBtn = target.closest('.btn-add-to-cart-from-detail') as HTMLElement;
    if (addToCartBtn) {
      if (AuthService.getCurrentUser().role === 'guest') { alert('장바구니 담기는 로그인 후 이용 가능합니다.'); this.openAuthModal('login'); return; }
      const prodId = addToCartBtn.dataset.productId;
      if (prodId) {
        const prod = getStoreProductById(prodId);
        if (prod) {
          const currentUser = AuthService.getCurrentUser();
          const savedProf = UserSajuStore.getProfile(currentUser.username || currentUser.id);

          if (prod.deliveryType === 'saju_report' || prod.category === 'report') {
            if (!savedProf) {
              alert('정밀 사주 분석 리포트를 구매하시려면 먼저 사주 정보를 등록해 주세요.\n사주 입력 페이지로 이동합니다.');
              sessionStorage.setItem('mabosal_pending_saju_product', prod.id);
              appState.setView('analyze');
              this.render(appState.getState());
              window.scrollTo({ top: 0, behavior: 'smooth' });
              return;
            }
          }

          const qty = parseInt((document.getElementById('detail-qty-input') as HTMLInputElement)?.value || '1', 10);
          const sajuSnap = savedProf || UserSajuStore.getProfileOrDefault();
          const optSelect = document.getElementById('store-product-option-select') as HTMLSelectElement | null;
          let selectedOpt: any = undefined;
          if (optSelect && optSelect.selectedOptions.length > 0) {
            const sel = optSelect.selectedOptions[0];
            selectedOpt = {
              id: optSelect.value,
              name: sel.dataset.name || sel.text.split(' - ')[0],
              price: parseInt(sel.dataset.price || '0', 10) || prod.price,
              originalPrice: parseInt(sel.dataset.originalPrice || '0', 10) || prod.originalPrice,
              deliveryType: sel.dataset.deliveryType || prod.deliveryType,
            };
          }
          CartStore.addItem(prod, qty, sajuSnap, selectedOpt);
          alert(`[${prod.title}]${selectedOpt ? ` (${selectedOpt.name})` : ''} (${qty}개) 상품이 장바구니에 담겼습니다.\n장바구니 화면으로 이동합니다.`);
          appState.setView('cart');
          this.render(appState.getState());
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
      return;
    }

    // [장바구니 전체 보드 내 수량 증감 및 삭제]
    const removeSingleBtn = target.closest('.btn-cart-remove-single') as HTMLElement;
    if (removeSingleBtn) {
      const cId = removeSingleBtn.dataset.id;
      if (cId) {
        CartStore.removeItem(cId);
        this.render(appState.getState());
      }
      return;
    }

    const deleteSelectedBtn = target.closest('#btn-cart-delete-selected') as HTMLElement;
    if (deleteSelectedBtn) {
      if (confirm('선택하신 상품들을 장바구니에서 삭제하시겠습니까?')) {
        CartStore.removeSelectedItems();
        this.render(appState.getState());
      }
      return;
    }

    const deleteUnavailableBtn = target.closest('#btn-cart-delete-unavailable') as HTMLElement;
    if (deleteUnavailableBtn) {
      CartStore.removeUnavailableItems();
      this.render(appState.getState());
      return;
    }

    const boardQtyPlusBtn = target.closest('.btn-board-qty-plus') as HTMLElement;
    if (boardQtyPlusBtn) {
      const cId = boardQtyPlusBtn.dataset.id;
      if (cId) {
        const it = CartStore.getItems().find(i => i.id === cId || i.productId === cId);
        if (it) {
          CartStore.updateQuantity(cId, it.quantity + 1);
          this.render(appState.getState());
        }
      }
      return;
    }

    const boardQtyMinusBtn = target.closest('.btn-board-qty-minus') as HTMLElement;
    if (boardQtyMinusBtn) {
      const cId = boardQtyMinusBtn.dataset.id;
      if (cId) {
        const it = CartStore.getItems().find(i => i.id === cId || i.productId === cId);
        if (it) {
          if (it.quantity > 1) {
            CartStore.updateQuantity(cId, it.quantity - 1);
          } else {
            CartStore.removeItem(cId);
          }
          this.render(appState.getState());
        }
      }
      return;
    }

    // [주문서 작성 보드: 쿠폰 적용 클릭]
    const applyCouponBtn = target.closest('#btn-apply-coupon') as HTMLElement;
    if (applyCouponBtn) {
      const codeInput = document.getElementById('checkout-coupon-code') as HTMLInputElement;
      const code = codeInput?.value?.trim();
      const summary = CartStore.getSummary();
      const discRes = CheckoutService.calculateDiscount(code, summary.selectedProductAmount);
      const msgEl = document.getElementById('checkout-coupon-msg');
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.textContent = discRes.message;
        msgEl.style.color = discRes.couponValid ? '#4ade80' : '#f87171';
      }
      const discAmtEl = document.getElementById('summary-discount-amount');
      const finalAmtEl = document.getElementById('summary-final-amount');
      if (discAmtEl && finalAmtEl) {
        discAmtEl.textContent = discRes.discountAmount.toLocaleString();
        const newFinal = Math.max(0, summary.totalPayAmount - discRes.discountAmount);
        finalAmtEl.textContent = newFinal.toLocaleString();
      }
      return;
    }

    // [주문서 작성 보드: 엽전 전액 사용 클릭]
    const useAllYeopBtn = target.closest('#btn-use-all-yeop') as HTMLElement;
    if (useAllYeopBtn) {
      const yeopInput = document.getElementById('checkout-yeop-input') as HTMLInputElement;
      const currentUser = AuthService.getCurrentUser();
      const summary = CartStore.getSummary();
      const maxUsable = Math.min(currentUser.yeopBalance, summary.selectedProductAmount);
      if (yeopInput) {
        yeopInput.value = String(maxUsable);
      }
      const finalAmtEl = document.getElementById('summary-final-amount');
      if (finalAmtEl) {
        const newFinal = Math.max(0, summary.totalPayAmount - maxUsable);
        finalAmtEl.textContent = newFinal.toLocaleString();
      }
      return;
    }

    // [장바구니에서 정규 주문서(checkout)로 이동]
    if (target.closest('#btn-cart-proceed-checkout')) {
      const items = CartStore.getItems();
      if (items.length === 0) {
        alert('장바구니에 담긴 상품이 없습니다.');
        return;
      }
      const val = CheckoutService.validateCheckoutItems(items);
      if (!val.valid) {
        alert(val.message);
        return;
      }
      this.closeCartModal();
      appState.setView('checkout');
      this.render(appState.getState());
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // [주문서 확인 모달 닫기 / 수정하기 (하위 호환성 유지)]
    if (target.closest('#btn-close-review-modal') || target.id === 'modal-review-overlay') {
      this.closeReviewModal();
      return;
    }

    // [주문서 확인 모달에서 최종 결제 승인]
    if (target.closest('#btn-final-confirm-payment')) {
      if (!this.pendingCheckoutData) return;
      const data = this.pendingCheckoutData;
      const submitBtn = target.closest('#btn-final-confirm-payment') as HTMLButtonElement;
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '결제 승인 처리 중...'; }

      const firstItem = data.items[0];
      const prodId = data.productId || firstItem?.productId || 'prod-paid-saju-premium';
      const currentUser = AuthService.getCurrentUser();

      const result = await PaymentService.checkout({
        productId: prodId,
        buyerName: data.buyerName,
        buyerPhone: data.buyerPhone,
        buyerEmail: data.buyerEmail,
        method: data.paymentMethod || 'bank_transfer',
        userId: currentUser.role !== 'guest' ? currentUser.id : undefined,
      });

      this.closeReviewModal();

      if (result.kind === 'order') {
        // 주문에 사주 스냅샷 및 고객명 영구 귀속
        result.order.sajuInput = data.sajuSnapshot;
        result.order.buyerName = data.buyerName;
        setLastStoreOrder(result.order);
        CartStore.clear(); // 장바구니 비우기
        this.render(appState.getState());
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (result.kind === 'error') {
        alert(result.message);
      }
      return;
    }

    if (target.closest('#btn-header-profile') || target.closest('#btn-header-mypage') || target.closest('#pc-nav-mypage') || target.closest('#m-nav-mypage') || target.closest('#dock-btn-mypage')) {
   const drawer = document.getElementById('mobile-nav-drawer');
   const backdrop = document.getElementById('mobile-nav-backdrop');
   if (drawer) drawer.style.display = 'none';
   if (backdrop) backdrop.style.display = 'none';
   appState.setView('member-dashboard');
   window.scrollTo({ top: 0, behavior: 'smooth' });
   return;
 }
 if (target.closest('#btn-close-auth-modal')) {
 this.closeAuthModal();
 return;
 }

 // 모달 내 로그인 <-> 회원가입 탭 전환
 if (target.closest('#tab-btn-show-login') || target.closest('#btn-link-to-login')) {
 this.switchAuthPanel('login');
 return;
 }
 if (target.closest('#tab-btn-show-register') || target.closest('#btn-link-to-register')) {
 this.switchAuthPanel('register');
 return;
 }

 // 빠른 테스트 계정 프리셋 칩 클릭
 const presetBtn = target.closest('.btn-preset-login') as HTMLElement;
 if (presetBtn) {
 const u = presetBtn.dataset.user || '';
 const p = presetBtn.dataset.pass || '';
 const inputU = document.getElementById('input-login-username') as HTMLInputElement;
 const inputP = document.getElementById('input-login-password') as HTMLInputElement;
 if (inputU) inputU.value = u;
 if (inputP) inputP.value = p;
 return;
 }

 // 1. [정석 아이디/비밀번호 로그인 제출]
 if (target.closest('#btn-submit-login')) {
 const inputU = document.getElementById('input-login-username') as HTMLInputElement;
 const inputP = document.getElementById('input-login-password') as HTMLInputElement;
 const username = inputU?.value || '';
 const password = inputP?.value || '';

 const res = AuthService.login(username, password);
 if (!res.success) {
 alert(`️ 로그인 실패\n\n${res.message}`);
 return;
 }

 this.closeAuthModal();
 
 // [주문 대기 상품이 있는 경우 즉시 스토어 주문서 오픈]
 const pendingProdId = OrderAuthGuard.consumePendingOrderProduct();
 if (pendingProdId) {
   setStoreActiveCategory('all');
   selectStoreProduct(pendingProdId);
   appState.setView('store');
   this.render(appState.getState());
   window.scrollTo({ top: 0, behavior: 'smooth' });
   return;
 }

 this.render(appState.getState());

 if (res.user?.role === 'admin') {
   appState.setView('admin');
   window.scrollTo({ top: 0, behavior: 'smooth' });
   alert(`️ [최고 관리자 인증 성공]\n\n환영합니다, ${res.user.name} 님!\n마스터 컨트롤 타워로 진입합니다.`);
 } else if (res.user?.role === 'partner') {
   appState.setView('partner');
   window.scrollTo({ top: 0, behavior: 'smooth' });
   alert(` [파트너 로그인 성공]\n\n환영합니다, ${res.user.name} 님!\n마보살 파트너스 센터로 진입합니다.`);
 } else {
   appState.setView('member-dashboard');
   window.scrollTo({ top: 0, behavior: 'smooth' });
   alert(` [로그인 완료]\n\n환영합니다, ${res.user?.name} 님!\n회원 대시보드(마이페이지)로 이동합니다.`);
 }
 return;
 }

  // 2. [신규 회원가입 제출: 1단계 가입 완료 -> 2단계 사주 입력(analyze) 필수 직행]
  if (target.closest('#btn-submit-register')) {
    const username = (document.getElementById('input-reg-username') as HTMLInputElement)?.value.trim() || '';
    const password = (document.getElementById('input-reg-password') as HTMLInputElement)?.value || '';
    const passwordConfirm = (document.getElementById('input-reg-password-confirm') as HTMLInputElement)?.value || '';
    const name = (document.getElementById('input-reg-name') as HTMLInputElement)?.value.trim() || '';
    const phone = (document.getElementById('input-reg-phone') as HTMLInputElement)?.value.trim() || '';
    const role = ((document.getElementById('select-reg-role') as HTMLSelectElement)?.value as any) || 'user';

    const res = AuthService.register({
      username,
      password,
      passwordConfirm,
      name,
      phone,
      role,
    });

    if (!res.success) {
      alert(`⚠️ 회원가입 실패\n\n${res.message}`);
      return;
    }

    this.closeAuthModal();

    if (res.user?.role === 'partner') {
      appState.setView('partner');
      this.render(appState.getState());
      window.scrollTo({ top: 0, behavior: 'smooth' });
      alert(`[회원가입 완료]\n\n${res.message}\n파트너 포털로 이동합니다.`);
    } else {
      // 1:1 맞춤 사주 원국 등록 필수 온보딩 화면(/analyze?mode=onboarding)으로 직행!
      appState.setOnboarding(true);
      appState.setUserName(name || username);
      navigateTo('/analyze?mode=onboarding');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return;
  }

  // 2-0. [사주 입력 온보딩 화면 "저장" 버튼 클릭 -> 사주 프로필 등록 후 대시보드로 직행]
  if (target.closest('#btn-save-onboarding-saju')) {
    const currentUser = AuthService.getCurrentUser();
    const userId = currentUser.id || currentUser.username;
    const nameInput = document.getElementById('input-user-name') as HTMLInputElement | null;
    const userName = nameInput?.value.trim() || currentUser.name || '의뢰인';

    // 1. 역법 추출
    let calendarType: 'solar' | 'lunar' = 'solar';
    const activeCalBtn = document.querySelector('.calendar-btn.active') as HTMLElement | null;
    if (activeCalBtn?.dataset.cal === 'lunar') {
      calendarType = 'lunar';
    }

    // 2. 윤달 여부
    const leapCheck = document.getElementById('check-leap-month') as HTMLInputElement | null;
    const isLeapMonth = Boolean(calendarType === 'lunar' && leapCheck?.checked);

    // 3. 성별 추출
    let gender: 'male' | 'female' = 'male';
    const activeGenderBtn = document.querySelector('.gender-btn.active') as HTMLElement | null;
    if (activeGenderBtn?.dataset.gender === 'female') {
      gender = 'female';
    }

    // 4. 출생 지역
    const regionSelect = document.getElementById('select-region') as HTMLSelectElement | null;
    const birthRegion = regionSelect?.value || 'Seoul';

    // 5. 생년월일 정규화
    const dateInput = document.getElementById('input-birth-date') as HTMLInputElement | null;
    let rawDate = dateInput?.value.trim() || '';
    let cleanDate = rawDate.replace(/[^0-9]/g, '');

    if (cleanDate.length === 6) {
      const yy = parseInt(cleanDate.slice(0, 2), 10);
      const currentYearTwoDigits = new Date().getFullYear() % 100;
      const century = yy <= currentYearTwoDigits ? '20' : '19';
      cleanDate = `${century}${cleanDate}`;
    }

    if (cleanDate.length !== 8) {
      alert('생년월일을 8자리 숫자(예: 19751102) 또는 YYYY-MM-DD 형식으로 입력해 주세요.');
      return;
    }

    const y = parseInt(cleanDate.slice(0, 4), 10);
    const m = parseInt(cleanDate.slice(4, 6), 10);
    const d = parseInt(cleanDate.slice(6, 8), 10);

    if (isNaN(y) || isNaN(m) || isNaN(d) || y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) {
      alert('올바른 생년월일(1900~2100년, 1~12월, 1~31일)을 입력해 주세요.');
      return;
    }

    const formattedDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    // 6. 출생시간 정규화
    const missingHourCheck = document.getElementById('check-missing-hour') as HTMLInputElement | null;
    const isUnknownTime = Boolean(missingHourCheck?.checked);
    let birthTimeStr: string | null = null;

    if (!isUnknownTime) {
      const timeInput = document.getElementById('input-birth-time') as HTMLInputElement | null;
      const rawTime = timeInput?.value.trim() || '';
      if (rawTime) {
        const cleanTime = rawTime.replace(/[^0-9:]/g, '');
        let h = 0;
        let min = 0;
        if (cleanTime.includes(':')) {
          const parts = cleanTime.split(':');
          h = parseInt(parts[0], 10);
          min = parseInt(parts[1], 10);
        } else if (cleanTime.length === 4) {
          h = parseInt(cleanTime.slice(0, 2), 10);
          min = parseInt(cleanTime.slice(2, 4), 10);
        } else if (cleanTime.length <= 2) {
          h = parseInt(cleanTime, 10);
          min = 0;
        }
        if (isNaN(h) || isNaN(min) || h < 0 || h > 23 || min < 0 || min > 59) {
          alert('출생시간을 24시간 기준(00:00~23:59 또는 4자리 숫자 예: 1330)으로 입력해 주세요.');
          return;
        }
        birthTimeStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      }
    }

    // 7. 사주 프로필 SSOT 영구 저장 및 동기화
    UserSajuStore.syncUserSajuProfile({
      userId,
      userName,
      birthDate: formattedDate,
      birthTime: birthTimeStr,
      calendarType,
      isLeapMonth,
      gender,
      birthRegion,
    });

    // 8. 온보딩 완료 처리 및 대시보드 직행!
    appState.setOnboarding(false);
    appState.setUserName(userName);
    navigateTo('/member-dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    alert(`🎉 [회원가입 및 맞춤 사주 저장 완료]\n\n환영합니다, ${userName} 님!\n사주 원국이 성공적으로 등록되어 1:1 맞춤 오늘의 운세와 행운 처방이 활성화되었습니다.`);
    return;
  }


 // 2-1. 사주 미등록 회원 알림 배너 -> 온보딩 모달 오픈
 if (target.closest('.btn-open-saju-onboarding')) {
   const onboardingModal = document.getElementById('modal-saju-onboarding');
   if (onboardingModal) onboardingModal.style.display = 'flex';
   return;
 }

 // 2-2. 1:1 맞춤 사주 온보딩 모달 제출 및 저장
 if (target.closest('#btn-submit-onboarding-saju')) {
   const currentUser = AuthService.getCurrentUser();
   const birthDate = (document.getElementById('onboarding-birthdate') as HTMLInputElement)?.value;
   const calendarType = (document.getElementById('onboarding-calendar') as HTMLSelectElement)?.value as 'solar' | 'lunar';
   const gender = (document.getElementById('onboarding-gender') as HTMLSelectElement)?.value as 'male' | 'female';
   const birthTime = (document.getElementById('onboarding-birthtime') as HTMLSelectElement)?.value;

   if (!birthDate) {
     alert('생년월일을 선택해 주세요.');
     return;
   }

   // 계정·프로필·세션을 단일 입력점으로 동기화
   const prevProfile = UserSajuStore.getProfile(currentUser.id);
   const synced = UserSajuStore.syncUserSajuProfile({
     userId: currentUser.id,
     userName: currentUser.name || '의뢰인',
     birthDate,
     birthTime: birthTime || null,
     calendarType: calendarType || 'solar',
     gender: gender || 'male',
     isLeapMonth: prevProfile?.isLeapMonth || false,
     birthRegion: prevProfile?.birthRegion,
   });
   if (!synced) {
     alert('생년월일 형식이 올바르지 않습니다. (예: 1990-03-21)');
     return;
   }

   // 3. 모달 닫기 및 대시보드 실시간 재계산 렌더링
   const onboardingModal = document.getElementById('modal-saju-onboarding');
   if (onboardingModal) onboardingModal.style.display = 'none';

   this.render(appState.getState());
   alert(`1:1 맞춤 사주 정보가 등록되었습니다!\n\n오늘의 일진과 ${currentUser.name} 님의 사주 원국을 대조한 맞춤 행운 처방과 지수가 활성화되었습니다.`);
   return;
 }

 // 1. 브랜드 로고 클릭 -> 홈 이동
 if (target.closest('#btn-nav-brand') || target.closest('#nav-btn-landing')) {
 selectStoreProduct(null, false);
 navigateTo('/');
 return;
 }

 // 1-1. 파트너스 이동
 if (target.closest('#nav-btn-partner') || target.closest('#btn-goto-partner-portal') || target.closest('.btn-goto-partner')) {
 appState.setView('partner');
 return;
 }

 // 1-1-1. 최고 관리자 대시보드 이동 (보안 라우트 가드 적용)
 if (target.closest('#nav-btn-admin') || target.closest('.btn-goto-admin')) {
 if (AuthService.isAdmin()) {
 appState.setView('admin');
 window.scrollTo({ top: 0, behavior: 'smooth' });
 } else {
 this.openAuthModal('login');
 const userInput = document.getElementById('input-login-username') as HTMLInputElement;
 if (userInput) userInput.value = 'admin';
 }
 return;
 }



 // 0-0. 더 정밀한 무료 사주 입력 화면 이동 CTA 버튼 클릭
    if (target.closest('.btn-goto-full-saju')) {
      appState.setActiveTierTab('FREE');
      appState.setView('analyze');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.render(appState.getState());
      return;
    }

    // 마보살 스터디 & 스토어 네비게이션 클릭
    // /* id-nav-study-handled */
    if (target.closest('#pc-nav-study') || target.closest('#m-nav-study')) {
      navigateTo('/study');
      return;
    }

    if (target.closest('#pc-nav-store') || target.closest('#m-nav-store')) {
      navigateTo('/store');
      return;
    }

    // 마기달력 & 행운달력 PC GNB 네비게이션
    if (target.closest('#pc-nav-magi-cal')) {
      appState.setView('magi-calendar' as any);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.render(appState.getState());
      return;
    }

    if (target.closest('#pc-nav-lucky-cal')) {
      appState.setView('lucky-calendar' as any);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.render(appState.getState());
      return;
    }

    // 달력 페이지 내 띠 선택 칩
    const calZodiacBtn = target.closest('.cal-zodiac-btn') as HTMLElement;
    if (calZodiacBtn) {
      const zKey = calZodiacBtn.dataset.zodiac;
      if (zKey) {
        setSelectedZodiac(zKey);
        this.render(appState.getState());
      }
      return;
    }

    // 달력 페이지 내 연도 선택 칩
    const calYearBtn = target.closest('.cal-year-btn') as HTMLElement;
    if (calYearBtn) {
      const yStr = calYearBtn.dataset.year;
      setSelectedYear(yStr ? parseInt(yStr, 10) : undefined);
      this.render(appState.getState());
      return;
    }

    // 0-1. 12간지 띠 선택 칩 클릭
    const zodiacChip = target.closest('.zodiac-tab-chip') as HTMLElement;
    if (zodiacChip) {
      const zodiacKey = zodiacChip.dataset.zodiac;
      if (zodiacKey) {
        setSelectedZodiac(zodiacKey);
        // 만약 연도가 아직 없다면 해당 띠의 대표 연도(예: 1984년생 등)를 연동
        this.render(appState.getState());
      }
      return;
    }

    // 0-2. 출생연도 선택 칩 클릭 (연도 클릭 시 해당 연도의 12간지 띠 자동 연동)
    const yearChip = target.closest('.zodiac-year-chip') as HTMLElement;
    if (yearChip) {
      const yearStr = yearChip.dataset.year;
      if (yearStr) {
        const year = parseInt(yearStr, 10);
        setSelectedYear(year);
        // 연도로부터 12간지 띠 자동 판별 매칭
        const branchKeys = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
        const bIdx = (year - 4) % 12 >= 0 ? (year - 4) % 12 : ((year - 4) % 12 + 12);
        setSelectedZodiac(branchKeys[bIdx]);
      } else {
        setSelectedYear(undefined);
      }
      this.render(appState.getState());
      return;
    }

 // [요청 5] 최고 관리자: 사이트 문구 및 브랜딩 설정 저장
 if (target.closest('#btn-save-site-content')) {
 const brandName = (document.getElementById('input-cms-brand-name') as HTMLInputElement)?.value?.trim() || '마보살';
 const domainText = (document.getElementById('input-cms-domain-text') as HTMLInputElement)?.value?.trim() || 'mabosal.com';
 const heroTitle = (document.getElementById('input-cms-hero-title') as HTMLInputElement)?.value?.trim() || '당신의 사주를 읽고\n지금 무엇이 중요한지 알려드립니다';
 const heroSubpill = (document.getElementById('input-cms-hero-subpill') as HTMLInputElement)?.value?.trim() || '하늘의 명(天命)을 읽고 때(時)를 분별하다';
 const heroDesc = (document.getElementById('input-cms-hero-desc') as HTMLTextAreaElement)?.value?.trim() || '';

 const company = (document.getElementById('input-cms-footer-company') as HTMLInputElement)?.value?.trim() || '템바보드 주식회사';
 const ceo = (document.getElementById('input-cms-footer-ceo') as HTMLInputElement)?.value?.trim() || '박경민';
 const biz = (document.getElementById('input-cms-footer-biz') as HTMLInputElement)?.value?.trim() || '107-88-44796';
 const mail = (document.getElementById('input-cms-footer-mail') as HTMLInputElement)?.value?.trim() || '제 2026-부산사하-0589호';
 const address = (document.getElementById('input-cms-footer-address') as HTMLInputElement)?.value?.trim() || '부산광역시 사하구 하신번영로 328, 302호 (하단동)';
 const phone = (document.getElementById('input-cms-footer-phone') as HTMLInputElement)?.value?.trim() || '051-208-8746';
 const email = (document.getElementById('input-cms-footer-email') as HTMLInputElement)?.value?.trim() || 'anbtiteam@gmail.com';
 const cpoName = (document.getElementById('input-cms-footer-cpo') as HTMLInputElement)?.value?.trim() || '박경민';
 const hostingProvider = (document.getElementById('input-cms-footer-hosting') as HTMLInputElement)?.value?.trim() || '마보살 클라우드 (Vercel & Supabase)';
 const contact = (document.getElementById('input-cms-footer-contact') as HTMLInputElement)?.value?.trim() || '고객센터: 051-208-8746 | 평일 10:00 ~ 18:00 (주말·공휴일 휴무)';
 const copyright = (document.getElementById('input-cms-footer-copy') as HTMLInputElement)?.value?.trim() || '© 2026 템바보드 주식회사. All rights reserved.';

 SiteContentStore.updateConfig({
 header: { brandName, domainText },
 hero: { mainTitle: heroTitle, subPill: heroSubpill, description: heroDesc },
 footer: { companyName: company, ceoName: ceo, bizNumber: biz, mailOrderNumber: mail, contactInfo: contact, copyright, address, phone, email, cpoName, hostingProvider },
 });

 setAdminActiveTab('tab-site-content');
 this.render(appState.getState());
 alert(' [저장 완료]\n\n로고, 메인 화면 본문, 푸터 설정이 성공적으로 저장되고 사이트 전체에 즉시 반영되었습니다!');
 return;
 }

 // [요청 5] 최고 관리자: 사이트 문구 및 브랜딩 설정 기본값 복원
 if (target.closest('#btn-reset-site-content')) {
 if (confirm('모든 문구 및 브랜딩 설정을 기본값으로 복원하시겠습니까?')) {
 SiteContentStore.resetToDefault();
 setAdminActiveTab('tab-site-content');
 this.render(appState.getState());
 alert(' 사이트 문구 및 브랜딩 설정이 기본값으로 초기화되었습니다.');
 }
 return;
 }

 // 0-2. 화면 기능 노출 관리 기본값 초기화
 if (target.closest('#btn-reset-modules-default')) {
 ModuleRegistry.resetToDefault();
 setAdminActiveTab('tab-features');
 this.render(appState.getState());
 alert('️ 화면 노출 기능 설정이 기본값으로 초기화되었습니다.');
 return;
 }

 // 1. 판매 상품 스토어 노출 토글 (원클릭 넣었다 뺐다)
 const productToggle = target.closest('.product-toggle-btn') as HTMLInputElement;
 if (productToggle) {
 const prodId = productToggle.dataset.productId;
 if (prodId) {
 const newState = CatalogStore.toggleProduct(prodId);
 setAdminActiveTab('tab-products');
 this.render(appState.getState());
 alert(` [판매 상품 상태 변경]\n\n상품이 ${newState ? '스토어 판매(노출)' : '판매 일시 중지(숨김)'} 상태로 전환되었습니다.`);
 }
 return;
 }

 // 2. 신규 상품 등록 제출
 if (target.closest('#btn-submit-add-product')) {
 const title = (document.getElementById('new-prod-title') as HTMLInputElement)?.value.trim();
 const tierId = (document.getElementById('new-prod-tier') as HTMLInputElement)?.value.trim() || 'CUSTOM';
 const price = parseInt((document.getElementById('new-prod-price') as HTMLInputElement)?.value || '0', 10);
 const originalPrice = parseInt((document.getElementById('new-prod-original-price') as HTMLInputElement)?.value || '0', 10);
 const category = ((document.getElementById('new-prod-category') as HTMLSelectElement)?.value as any) || 'core';
 const badge = (document.getElementById('new-prod-badge') as HTMLInputElement)?.value.trim() || undefined;
 const description = (document.getElementById('new-prod-desc') as HTMLInputElement)?.value.trim();

 if (!title || !description) {
 alert('상품명과 상세 설명을 모두 입력해주세요.');
 return;
 }

 CatalogStore.addProduct({
 title,
 tierId,
 price,
 originalPrice: originalPrice || price * 2,
 category,
 badge,
 description,
 enabled: true,
 chaptersCount: 15,
 });

 setAdminActiveTab('tab-products');
 this.render(appState.getState());
 alert(` [신규 판매 상품 등록 완료]\n\n'${title}' 상품이 스토어에 등록되어 즉시 판매 활성화되었습니다!`);
 return;
 }

 // 3. 상품 삭제
 const deleteProdBtn = target.closest('.btn-delete-product') as HTMLElement;
 if (deleteProdBtn) {
 const prodId = deleteProdBtn.dataset.productId;
 if (prodId && confirm('정말 이 상품을 스토어 목록에서 완전히 삭제하시겠습니까?')) {
 CatalogStore.deleteProduct(prodId);
 setAdminActiveTab('tab-products');
 this.render(appState.getState());
 alert('상품이 스토어에서 삭제되었습니다.');
 }
 return;
 }

 // 4. 협력업체 / 상담사 플랫폼 노출 토글 (원클릭 넣었다 뺐다 - 탭 유지 보장!)
 const vendorToggle = target.closest('.vendor-toggle-btn') as HTMLInputElement;
 if (vendorToggle) {
 const venId = vendorToggle.dataset.vendorId;
 if (venId) {
 const newState = CatalogStore.toggleVendor(venId);
 setAdminActiveTab('tab-vendors');
 this.render(appState.getState());
 alert(` [협력업체 상태 변경]\n\n해당 협력업체가 플랫폼에 ${newState ? '정상 노출(상담 활성화)' : '비노출(상담 대기)'} 상태로 전환되었습니다.`);
 }
 return;
 }

 // 5. 신규 협력업체 등록 제출 (탭 유지)
 if (target.closest('#btn-submit-add-vendor')) {
 const name = (document.getElementById('new-ven-name') as HTMLInputElement)?.value.trim();
 const specialty = (document.getElementById('new-ven-specialty') as HTMLInputElement)?.value.trim();
 const vendorType = ((document.getElementById('new-ven-type') as HTMLSelectElement)?.value as any) || '상담사';
 const commissionRate = (document.getElementById('new-ven-rate') as HTMLInputElement)?.value.trim() || '상담 80%';
 const contact = (document.getElementById('new-ven-contact') as HTMLInputElement)?.value.trim() || '010-0000-0000';
 const avatarUrl = (document.getElementById('new-ven-avatar') as HTMLInputElement)?.value.trim() || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120';

 if (!name || !specialty) {
 alert('협력업체/상담사명과 전문 분야를 모두 입력해주세요.');
 return;
 }

 CatalogStore.addVendor({
 name,
 specialty,
 vendorType,
 commissionRate,
 contact,
 avatarUrl,
 enabled: true,
 rating: 5.0,
 consultationCount: 1,
 statusText: '신규 등록 완료',
 });

 setAdminActiveTab('tab-vendors');
 this.render(appState.getState());
 alert(` [신규 협력업체 등록 완료]\n\n'${name}' 님이 마보살 협력업체로 등록되어 플랫폼에 즉시 노출되었습니다!`);
 return;
 }

 // 6. 협력업체 제외/삭제 (탭 유지)
 const deleteVenBtn = target.closest('.btn-delete-vendor') as HTMLElement;
 if (deleteVenBtn) {
 const venId = deleteVenBtn.dataset.vendorId;
 if (venId && confirm('정말 이 협력업체를 플랫폼에서 제외하시겠습니까?')) {
 CatalogStore.deleteVendor(venId);
 setAdminActiveTab('tab-vendors');
 this.render(appState.getState());
 alert('협력업체가 플랫폼에서 제외되었습니다.');
 }
 return;
 }

 // [통합 파트너스 허브 인터랙션]
 const pTabBtn = target.closest('.partner-tab-btn') as HTMLElement;
 if (pTabBtn) {
 const targetTab = pTabBtn.dataset.tab;
 document.querySelectorAll('.partner-tab-btn').forEach(b => {
 (b as HTMLElement).style.background = 'var(--surface-container)';
 (b as HTMLElement).style.color = '#dfe2f1';
 });
 pTabBtn.style.background = 'var(--primary)';
 pTabBtn.style.color = '#241a00';
 document.querySelectorAll('.partner-tab-panel').forEach(p => {
 (p as HTMLElement).style.display = 'none';
 });
 if (targetTab) {
 const panel = document.getElementById(targetTab);
 if (panel) panel.style.display = 'block';
 }
 return;
 }

 // 파트너 퀵 출금 탭 점프
 if (target.closest('#btn-quick-withdraw')) {
 const tabBtn = document.querySelector('.partner-tab-btn[data-tab="ptab-settlement"]') as HTMLElement;
 if (tabBtn) tabBtn.click();
 return;
 }

 // 파트너 통합 출금 신청 제출
 if (target.closest('#btn-submit-payout-request')) {
 const bank = (document.getElementById('input-payout-bank') as HTMLSelectElement)?.value || '국민은행';
 const account = (document.getElementById('input-payout-account') as HTMLInputElement)?.value || '123456789012';
 const holder = (document.getElementById('input-payout-holder') as HTMLInputElement)?.value || '김도원';
 alert(` [출금 신청 완료]\n\n• 입금 계좌: ${bank} ${account} (예금주: ${holder})\n• 신청 금액: ₩ 439,700 (홍보 수수료 + 상담료 합산)\n• 상태: 최고 관리자 대시보드 승인 대기열로 즉시 전송되었습니다.`);
 return;
 }

  // 1:1 상담실 입장 버튼
  if (target.closest('.btn-start-consultation')) {
    const user = AuthService.getCurrentUser();
    const prof = UserSajuStore.getProfile(user.username || user.id);
    const clientName = prof?.userName || (user.role !== 'guest' ? user.name : '의뢰인');
    const ageStr = prof?.birthYear ? ` (${new Date().getFullYear() - prof.birthYear + 1}세)` : '';
    alert(`[1:1 실시간 상담 연결]\n\n• 의뢰인: ${clientName} 님${ageStr}\n• 의뢰인의 정밀 사주 원국과 사전 분석 자료가 수석 역술가 상담 HUD에 로드되었습니다.\n• 실시간 상담실로 입장합니다.`);
    return;
  }

 // 1-2. 엽전 지갑 클릭
 if (target.closest('#btn-yeop-wallet')) {
 const u = AuthService.getCurrentUser();
 alert(` 마보살 엽전 지갑\n\n• 보유 잔액: ${u.yeopBalance.toLocaleString()} 엽 (${u.yeopBalance.toLocaleString()}원 상당)\n• 사용 방법: 모든 유료 사주 및 2027 단품 결제창에서 자동 할인 차감\n• 적립 방법: 1일 1회 출석 체크(100엽) 및 마보살 파트너스 제휴 활동 시 30% 커미션 적립!`);
 return;
 }

 // 2. 사주 분석 시작 버튼 (지능형 라우팅: 기구매자/기등록 회원 자동 감지)
    if (target.closest('#nav-btn-start') || target.closest('#btn-hero-start') || target.closest('#btn-hero-cta')) {
      IntelligentSajuRouter.handleProductOrExperienceClick('FREE');
      this.render(appState.getState());
      return;
    }

    // 2-1. 메인 화면 및 테마 카테고리 상품군 선택 (티어별 기구매자 맞춤 분기)
    const selectProductBtn = target.closest('.btn-select-product') as HTMLElement;
    if (selectProductBtn) {
      const tier = selectProductBtn.dataset.tier as any;
      if (tier && tier !== 'FREE' && AuthService.getCurrentUser().role === 'guest') {
        alert('유료 사주 분석 리포트는 로그인 후 구매 및 마이페이지 주문내역에서 열람하실 수 있습니다.');
        this.openAuthModal('login');
        return;
      }
      IntelligentSajuRouter.handleProductOrExperienceClick(tier);
      this.render(appState.getState());
      return;
    }

    // 3. 내비게이션 탭 (세션 자동 안전 복원 적용)
    if (target.closest('#nav-btn-result')) {
      IntelligentSajuRouter.ensureSessionForNavigation('result');
      this.render(appState.getState());
      return;
    }
    if (target.closest('#nav-btn-consult') || target.closest('#btn-goto-consult')) {
      appState.setView('consult');
      return;
    }
    if (target.closest('#nav-btn-report') || target.closest('#btn-goto-report')) {
      IntelligentSajuRouter.ensureSessionForNavigation('report');
      this.render(appState.getState());
      return;
    }

    // 4. 역법(양력/음력) 토글 (Phase 18)
 const calBtn = target.closest('.calendar-btn') as HTMLElement;
 if (calBtn) {
 const cal = calBtn.dataset.cal as 'solar' | 'lunar';
 appState.setCalendarType(cal);
 document.querySelectorAll('.calendar-btn').forEach(b => b.classList.remove('active'));
 calBtn.classList.add('active');
 const leapGroup = document.getElementById('group-leap-month');
 if (leapGroup) {
 leapGroup.style.display = cal === 'lunar' ? 'block' : 'none';
 }
 return;
 }

 // 5. 윤달 체크박스
 if (target.id === 'check-leap-month') {
 appState.setLeapMonth((target as HTMLInputElement).checked);
 return;
 }

 // 6. 성별 토글 버튼
 const genderBtn = target.closest('.gender-btn') as HTMLElement;
 if (genderBtn) {
 const gender = genderBtn.dataset.gender as 'male' | 'female';
 this.selectedGender = gender;
 appState.setGender(gender);
 document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('active'));
 genderBtn.classList.add('active');
 return;
 }

 // 7. 출생시간 미상 체크박스
 if (target.id === 'check-missing-hour') {
 const timeInput = document.getElementById('input-birth-time') as HTMLInputElement;
 if (timeInput) {
 timeInput.disabled = (target as HTMLInputElement).checked;
 if ((target as HTMLInputElement).checked) {
 timeInput.value = '';
 } else {
 timeInput.value = '13:30';
 }
 }
 return;
 }

 // 8. 현실 문제 프리셋 칩 클릭 (Phase 19)
 const presetChip = target.closest('.preset-chip') as HTMLElement;
 if (presetChip) {
 const text = presetChip.dataset.text || '';
 const textarea = document.getElementById('input-trouble-text') as HTMLTextAreaElement;
 if (textarea) {
 textarea.value = text;
 appState.setUserTroubleText(text);
 }
 document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
 presetChip.classList.add('active');
 return;
 }

 // 9. 리포트 뎁스 탭 전환 (QUICK / STANDARD / DEEP)
 const depthTab = target.closest('.depth-tab, .report-mode-btn') as HTMLElement;
 if (depthTab) {
 const mode = depthTab.dataset.mode as ReportDepthMode;
 frontendAdapter.updateReportDepthMode(mode);
 return;
 }

 // 10. 근거 보기 모달 열기
 const traceBtn = target.closest('.btn-trace, .btn-view-evidence') as HTMLElement;
 if (traceBtn) {
 const theme = traceBtn.dataset.theme;
 const session = appState.getState().sessionState;
 if (session && theme) {
 const traceData = frontendAdapter.getTraceInfoForTheme(session, theme);
 appState.openTraceModal(traceData);
 }
 return;
 }

 // 11. 근거 모달 닫기
 if (
 target.id === 'btn-modal-close' ||
 target.id === 'btn-close-trace-modal' ||
 target.id === 'btn-confirm-trace-modal' ||
 target.id === 'modal-trace-backdrop' ||
 target.id === 'modal-trace-overlay'
 ) {
 appState.closeTraceModal();
 return;
 }

 // 12. [폐기 완료] 기존 4대 정밀 감정 레거시 결제 모달 폐기 -> 스토어 정규 결제/상세로 자동 전환
 const triggerCheckoutBtn = target.closest('.btn-trigger-checkout') as HTMLElement;
 if (triggerCheckoutBtn) {
   const tier = triggerCheckoutBtn.dataset.tier || 'PAID';
   const prod = IntelligentSajuRouter.findProductForTier(tier as any);
   if (prod && prod.id) {
     selectStoreProduct(prod.id);
   }
   appState.setView('store');
   this.render(appState.getState());
   window.scrollTo({ top: 0, behavior: 'smooth' });
   return;
 }
 // 12-3. 파트너스 추천 링크 복사
 const copyLinkBtn = target.closest('#btn-copy-ref-link') as HTMLElement;
 if (copyLinkBtn) {
 const inputEl = document.getElementById('input-partner-link') as HTMLInputElement;
 const link = inputEl?.value || `${window.location.origin}/?ref=mabosal-vip`;
 if (navigator.clipboard) {
 navigator.clipboard.writeText(link).then(() => {
 alert('파트너스 추천 링크가 클립보드에 복사되었습니다!\n블로그, 유튜브, 오픈채팅방에 공유해 보세요.');
 }).catch(() => {
 prompt('추천 링크를 복사하세요:', link);
 });
 } else {
 prompt('추천 링크를 복사하세요:', link);
 }
 return;
 }

 // 12-4. 파트너스 출금 신청
 const withdrawBtn = target.closest('#btn-withdraw-submit') as HTMLElement;
 if (withdrawBtn) {
 const bank = (document.getElementById('input-withdraw-bank') as HTMLSelectElement)?.value || '신한은행';
 const account = (document.getElementById('input-withdraw-account') as HTMLInputElement)?.value;
 const holder = (document.getElementById('input-withdraw-holder') as HTMLInputElement)?.value;
 if (!account || !holder) {
 alert('출금 받으실 계좌번호와 예금주명을 모두 입력해 주세요.');
 return;
 }
 alert(`[출금 신청 접수 완료]\n\n입금 계좌: ${bank} ${account} (예금주: ${holder})\n출금 신청이 정상 접수되었습니다. (영업일 기준 24시간 내 입금 완료)`);
 return;
 }

 // 13. 구 레거시 상품 티어 선택 및 결제/잠금 해제 (호환성 유지)
 const unlockBtn = target.closest('.btn-unlock-tier, .btn-select-tier, #btn-unlock-paid-saju, #btn-unlock-paid-mabosal') as HTMLElement;
 if (unlockBtn) {
 const tier = (unlockBtn.dataset.tier || (unlockBtn.id === 'btn-unlock-paid-saju' ? 'paid_saju_deep' : 'paid_mabosal_full')) as ProductTier;
 await frontendAdapter.upgradeTier(tier);
 alert(`[결제 승인 완료] ${tier === 'paid_mabosal_full' ? '마보살 정밀풀이(149,000원)' : '정밀 사주풀이(39,000원)'} 전 섹션이 성공적으로 해제되었습니다.`);
 return;
 }

 // 14. PDF 리포트 다운로드 / 인쇄
 const pdfBtn = target.closest('#btn-download-pdf, .btn-download-pdf') as HTMLElement;
 if (pdfBtn) {
 window.print();
 return;
 }

 // 15. Phase 78: 무료 결과 [4부] 상황 칩 클릭 이벤트
 const sitChip = target.closest('.situation-chip') as HTMLElement;
 if (sitChip) {
 const sit = sitChip.dataset.situation || '';
 const currentSit = appState.getState().selectedSituation;
 const newSit = currentSit === sit ? '' : sit;
 appState.setSelectedSituation(newSit);
 document.querySelectorAll('.situation-chip').forEach(c => {
 if ((c as HTMLElement).dataset.situation === newSit) {
 c.classList.add('active');
 } else {
 c.classList.remove('active');
 }
 });
 return;
 }

 // 16. Phase 83: 4단계 상품 티어 탭 전환
 const tierTabBtn = target.closest('.btn-tier-tab') as HTMLElement;
 if (tierTabBtn) {
 const tier = tierTabBtn.dataset.tier as any;
 if (tier) {
 appState.setActiveTierTab(tier);
 if (tier === 'CHEMISTRY' && !appState.getState().gunghapResult) {
 frontendAdapter.analyzeGunghap();
 }
 }
 return;
 }

 // 16. Phase 78: 내 상황 맞춤 심층 분석 실행 (Level 5)
 if (target.id === 'btn-submit-deep-analysis' || target.closest('#btn-submit-deep-analysis')) {
 const addContextInput = document.getElementById('input-additional-context') as HTMLTextAreaElement;
 const questionInput = document.getElementById('input-desired-question') as HTMLInputElement;

 const additionalContext = addContextInput?.value?.trim() || '';
 const desiredQuestion = questionInput?.value?.trim() || '';
 const selectedSituation = appState.getState().selectedSituation || '';

 appState.setAdditionalContext(additionalContext);
 appState.setDesiredQuestion(desiredQuestion);

 appState.setLoading(true, '고객님의 선택 상황과 사주 원국을 1:1 결합하여 심층 처방을 산출하고 있습니다...');

 setTimeout(() => {
 try {
 frontendAdapter.runDeepAnalysis({
 selectedSituation,
 additionalContext,
 desiredQuestion,
 });
 appState.setLoading(false);
 appState.setView('result');
 const deepDisplay = document.getElementById('deep-result-display');
 if (deepDisplay) {
 deepDisplay.scrollIntoView({ behavior: 'smooth' });
 }
 } catch (err: any) {
 appState.setLoading(false);
 appState.setError(err.message || '심층 분석 중 오류가 발생했습니다.');
 }
 }, 300);
 return;
 }
 });

 // 입력 변경 이벤트 (사주 대상자 선택 라디오 토글, 상품 옵션 변경, 배송지 선택 등)
 this.rootEl.addEventListener('change', (e) => {
   

   const targetSelect = e.target as HTMLSelectElement;
   if (targetSelect?.id === 'store-product-option-select') {
     const selectedOpt = targetSelect.selectedOptions[0];
     if (selectedOpt) {
       const optPrice = parseInt(selectedOpt.dataset.price || '0', 10);
       const optOrigPrice = parseInt(selectedOpt.dataset.originalPrice || '0', 10);
       const optDelivery = selectedOpt.dataset.deliveryType || 'digital_download';

       const origPriceEl = document.getElementById('detail-original-price');
       if (origPriceEl) origPriceEl.textContent = `₩ ${optOrigPrice.toLocaleString()}`;

       const salePriceEl = document.getElementById('detail-sale-price');
       if (salePriceEl) salePriceEl.textContent = `₩ ${optPrice.toLocaleString()}`;

       const discountBadge = document.getElementById('detail-discount-badge');
       if (discountBadge) {
         if (optOrigPrice > optPrice) {
           const rate = Math.round(((optOrigPrice - optPrice) / optOrigPrice) * 100);
           discountBadge.textContent = `${rate}% 할인`;
           discountBadge.style.display = 'inline-block';
         } else {
           discountBadge.style.display = 'none';
         }
       }

       const totalEl = document.getElementById('detail-total-price');
       if (totalEl) {
         totalEl.dataset.unitPrice = optPrice.toString();
         const qty = parseInt((document.getElementById('detail-qty-input') as HTMLInputElement)?.value || '1', 10);
         const disc = parseInt((document.getElementById('detail-coupon-discount-val') as HTMLInputElement)?.value || '0', 10);
         totalEl.textContent = `₩ ${Math.max(0, optPrice * qty - disc).toLocaleString()}`;
       }

       const deliveryBadge = document.getElementById('detail-delivery-badge-text');
       if (deliveryBadge) {
         if (optDelivery === 'shipping') {
           deliveryBadge.innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px; color: #38bdf8;">local_shipping</span><span>택배 무료 배송</span>`;
         } else {
           deliveryBadge.innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px; color: #4ade80;">download_done</span><span>결제 즉시 PDF 다운로드 &amp; 영구 소장</span>`;
         }
       }
     }
   }

   if (targetSelect?.id === 'select-saved-address') {
     const selectedOpt = targetSelect.selectedOptions[0];
     const nameInput = document.getElementById('checkout-receiver-name') as HTMLInputElement;
     const phoneInput = document.getElementById('checkout-receiver-phone') as HTMLInputElement;
     const addrInput = document.getElementById('checkout-shipping-address') as HTMLInputElement;
     const memoInput = document.getElementById('checkout-shipping-memo') as HTMLInputElement;
     const saveCheck = document.getElementById('check-save-to-address-book') as HTMLInputElement;

     if (targetSelect.value === 'new') {
       if (addrInput) {
         addrInput.value = '';
         addrInput.focus();
       }
       if (memoInput) memoInput.value = '';
       if (saveCheck) saveCheck.checked = true;
     } else if (selectedOpt) {
       const rName = selectedOpt.dataset.recipient || '';
       const rPhone = selectedOpt.dataset.phone || '';
       const sAddr = selectedOpt.dataset.address || '';
       const sMemo = selectedOpt.dataset.memo || '';

       if (nameInput && rName) nameInput.value = rName;
       if (phoneInput && rPhone) phoneInput.value = rPhone;
       if (addrInput) addrInput.value = sAddr;
       if (memoInput) memoInput.value = sMemo;
       if (saveCheck) saveCheck.checked = false;
     }
   }
 });

 // 폼 제출 이벤트
 this.rootEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  if (!form) return;

  // [정식 주문서 작성 보드(view=checkout) 최종 결제 제출]
  if (form.id === 'checkout-main-form') {
    const nameInput = document.getElementById('checkout-buyer-name') as HTMLInputElement;
    const phoneInput = document.getElementById('checkout-buyer-phone') as HTMLInputElement;
    const emailInput = document.getElementById('checkout-buyer-email') as HTMLInputElement;
    const shippingInput = document.getElementById('checkout-shipping-address') as HTMLInputElement;
    const memoInput = document.getElementById('checkout-shipping-memo') as HTMLInputElement;
    const couponInput = document.getElementById('checkout-coupon-code') as HTMLInputElement;
    const yeopInput = document.getElementById('checkout-yeop-input') as HTMLInputElement;
    const payMethodInput = form.querySelector('input[name="checkout-pay-method"]:checked') as HTMLInputElement;
    const agreeAllCheck = document.getElementById('check-agree-all-terms') as HTMLInputElement;

    const allSubChecked = Array.from(document.querySelectorAll('.term-sub-check')).every(el => (el as HTMLInputElement).checked);
    const isAgreed = (agreeAllCheck && agreeAllCheck.checked) || allSubChecked;

    if (!isAgreed) {
      alert('필수 이용 약관 및 구매 조건에 동의해 주셔야 결제가 진행됩니다.');
      return;
    }

    // 실물 배송 상품 포함 시 배송지 주소 필수 입력 검증
    const cartSummary = CartStore.getSummary();
    if (cartSummary.hasPhysicalItems && (!shippingInput || !shippingInput.value.trim())) {
      alert('주문 상품 중 실물 배송 상품이 포함되어 있습니다. 배송받으실 주소를 정확히 입력해 주세요.');
      shippingInput?.focus();
      return;
    }

    const submitBtn = document.getElementById('btn-submit-final-order') as HTMLButtonElement;
    const selectedPayMethod = (payMethodInput?.value as any) || 'bank_transfer';
    const isOnlinePay = (selectedPayMethod === 'card' || selectedPayMethod === 'kakaopay' || selectedPayMethod === 'tosspay');

    if (isOnlinePay && !PaymentConfigStore.isCardEnabled()) {
      alert('현재 포트원(PortOne) 전자결제 연동 심사 준비 중입니다. 결제 수단은 [무통장 입금]만 이용 가능합니다.');
      const bankRadio = form.querySelector('input[name="checkout-pay-method"][value="bank_transfer"]') as HTMLInputElement | null;
      if (bankRadio) bankRadio.checked = true;
      return;
    }

    const items = CartStore.getSelectedItems();
    if (items.length === 0) {
      alert('주문할 상품이 선택되지 않았습니다.');
      return;
    }

    const val = CheckoutService.validateCheckoutItems(items);
    if (!val.valid) {
      alert(val.message);
      return;
    }

    // 결제 금액 사전 산출
    const productAmount = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const hasPhysical = items.some(it => it.deliveryType === 'shipping' || it.category === 'goods');
    const shippingFee = hasPhysical ? (productAmount >= 50000 ? 0 : 3000) : 0;
    const discountRes = CheckoutService.calculateDiscount(couponInput?.value, productAmount);
    const couponDiscount = discountRes.discountAmount;
    const currentUser = AuthService.getCurrentUser();
    let usedYeop = 0;
    if (yeopInput && parseInt(yeopInput.value, 10) > 0) {
      usedYeop = Math.min(parseInt(yeopInput.value, 10), currentUser.yeopBalance || 0, Math.max(0, productAmount - couponDiscount));
    }
    const totalPayAmount = Math.max(0, productAmount + shippingFee - couponDiscount - usedYeop);
    const isZeroPayment = totalPayAmount === 0;

    let portonePaymentKey: string | undefined = undefined;

    // [온라인 카드/간편결제] 결제창을 먼저 호출하여 승인 완료 시에만 주문 생성 및 장바구니 차감!
    if (isOnlinePay && !isZeroPayment) {
      const pCfg = PaymentConfigStore.get();
      const primaryItem = items[0];
      const orderTitle = items.length === 1 ? primaryItem.title : `${primaryItem.title} 외 ${items.length - 1}건`;
      const tempOrderId = 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 5).toUpperCase();

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '결제창 로딩 중...';
      }

      try {
        const response = await PortOneGateway.requestPayment(
          { storeId: pCfg.storeId, channelKey: pCfg.channelKey },
          {
            orderId: tempOrderId,
            orderName: orderTitle,
            amount: totalPayAmount,
            buyerName: nameInput?.value?.trim() || '구매자',
            buyerPhone: phoneInput?.value?.trim() || '01000000000',
            buyerEmail: emailInput?.value?.trim() || 'customer@mabosal.com',
            payMethod: selectedPayMethod === 'kakaopay' ? 'EASY_PAY' : 'CARD',
          }
        );

        if (response && response.code != null) {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '결제하기';
          }
          if (response.code === 'FAILURE_TYPE_PG' && (response.message?.includes('취소') || response.message?.includes('사용자'))) {
            alert('결제를 취소하셨습니다.');
          } else {
            alert('전자결제 연동 중 오류가 발생했습니다: ' + (response.message || `오류 코드: ${response.code}`));
          }
          return;
        }

        portonePaymentKey = response?.paymentId || tempOrderId;
      } catch (err: any) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '결제하기';
        }
        alert('전자결제 연동 중 오류가 발생했습니다: ' + (err?.message || err));
        return;
      }
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '주문 처리 중...';
    }

    const checkoutRes = CheckoutService.executeCheckout({
      buyerName: nameInput?.value || '',
      buyerPhone: phoneInput?.value || '',
      buyerEmail: emailInput?.value || '',
      paymentMethod: selectedPayMethod,
      shippingAddress: shippingInput?.value,
      shippingMemo: memoInput?.value,
      couponCode: couponInput?.value,
      usedYeop: yeopInput ? parseInt(yeopInput.value, 10) || 0 : 0,
      agreeTerms: isAgreed,
    });

    if (!checkoutRes.success) {
      alert(checkoutRes.message);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '결제하기';
      }
      return;
    }

    // 온라인 결제 승인 완료 건인 경우 주문 상태를 즉시 completed로 확정
    if (portonePaymentKey && checkoutRes.order) {
      updateStoreOrder(checkoutRes.order.orderId, {
        status: 'completed',
        paymentKey: portonePaymentKey,
      });
      checkoutRes.order.status = 'completed';
    }

    // 회원 기본 배송지 주소록 저장 체크 시 자동 등록
    const chkSaveAddress = document.getElementById('check-save-to-address-book') as HTMLInputElement | null;
    if (chkSaveAddress && chkSaveAddress.checked && AuthService.getCurrentUser().role !== 'guest') {
      const rName = (document.getElementById('checkout-receiver-name') as HTMLInputElement)?.value?.trim();
      const rPhone = (document.getElementById('checkout-receiver-phone') as HTMLInputElement)?.value?.trim();
      const sAddr = shippingInput?.value?.trim();
      const sMemo = memoInput?.value?.trim();
      if (rName && sAddr) {
        UserAddressStore.saveAddress({
          recipientName: rName,
          recipientPhone: rPhone || phoneInput?.value || '',
          address: sAddr,
          detailAddress: '',
          deliveryMemo: sMemo,
          isDefault: true,
        });
      }
    }

    // 성공 시: 결제 완료된 사주 리포트 주문인 경우에만 리포트 조립 (미입금 대기 및 전자책/상품권 주문은 리포트 생성 차단)
    if (checkoutRes.order) {
      if (checkoutRes.order.status === 'completed' && (checkoutRes.order.deliveryType === 'saju_report' || checkoutRes.order.category === 'report')) {
        UserSajuStore.ensureAnalysisReadyFromOrder(checkoutRes.order);
      }
      setLastStoreOrder(checkoutRes.order);
    }

    alert(`[주문 완료]\n\n${checkoutRes.message}\n주문번호: ${checkoutRes.order?.orderId}`);
    appState.setView('store');
    this.render(appState.getState());
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  // [스토어 간편 결제 폼 제출 -> 정식 주문서 작성 보드로 이동!]
  if (form.id === 'store-checkout-form') {
    const prodId = form.dataset.productId;
    if (prodId) {
      const prod = getStoreProductById(prodId);
      if (prod) {
        if (prod.price === 0 || prod.id === 'prod-free-experience') {
          appState.setActiveTierTab('FREE');
          appState.setView('analyze');
          this.render(appState.getState());
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        if (AuthService.getCurrentUser().role === 'guest') {
          alert('상품 구매 및 주문은 회원 로그인 후 이용 가능합니다.');
          this.openAuthModal('login');
          return;
        }

        const currentUser = AuthService.getCurrentUser();
        const savedProf = UserSajuStore.getProfile(currentUser.username || currentUser.id);

        if (prod.deliveryType === 'saju_report' || prod.category === 'report') {
          if (!savedProf) {
            alert('정밀 사주 분석 리포트를 구매하시려면 먼저 사주 정보를 등록해 주세요.\n사주 입력 페이지로 이동합니다.');
            sessionStorage.setItem('mabosal_pending_saju_product', prod.id);
            appState.setView('analyze');
            this.render(appState.getState());
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
        }

        const sajuSnap = savedProf || UserSajuStore.getProfileOrDefault();

        // 옵션 선택값 추출
        const optSelect = document.getElementById('store-product-option-select') as HTMLSelectElement | null;
        let selectedOpt: any = undefined;
        if (optSelect && optSelect.selectedOptions.length > 0) {
          const sel = optSelect.selectedOptions[0];
          selectedOpt = {
            id: optSelect.value,
            name: sel.dataset.name || sel.text.split(' - ')[0],
            price: parseInt(sel.dataset.price || '0', 10) || prod.price,
            originalPrice: parseInt(sel.dataset.originalPrice || '0', 10) || prod.originalPrice,
            deliveryType: sel.dataset.deliveryType || prod.deliveryType,
          };
        }

        // 해당 상품 수량 및 쿠폰 정보 반영 후 결제 이동
        const qty = parseInt((document.getElementById('detail-qty-input') as HTMLInputElement)?.value || '1', 10);
        const couponCode = (document.getElementById('detail-coupon-code-val') as HTMLInputElement)?.value?.trim();
        if (couponCode) {
          sessionStorage.setItem('mabosal_applied_coupon', couponCode);
        } else {
          sessionStorage.removeItem('mabosal_applied_coupon');
        }
        CartStore.addItem(prod, qty, sajuSnap, selectedOpt);
        appState.setView('checkout');
        this.render(appState.getState());
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    return;
  }

 // 출생정보 제출
 if (form.id === 'form-birth-input') {
  if (appState.getState().isOnboarding || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'onboarding')) {
    const saveBtn = document.getElementById('btn-save-onboarding-saju');
    if (saveBtn) {
      saveBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      return;
    }
  }
 const nameInput = document.getElementById('input-user-name') as HTMLInputElement;
 const dateInput = document.getElementById('input-birth-date') as HTMLInputElement;
 const timeInput = document.getElementById('input-birth-time') as HTMLInputElement;
 const missingHourCheck = document.getElementById('check-missing-hour') as HTMLInputElement;
 const regionSelect = document.getElementById('select-region') as HTMLSelectElement;
 const troubleTextarea = document.getElementById('input-trouble-text') as HTMLTextAreaElement;

 const userName = nameInput?.value?.trim() || '';
 if (userName) {
 appState.setUserName(userName);
 }

 // 이전 에러 메시지 초기화
 appState.setError(null);

 // 생년월일 8자리 연속 입력 및 구분자 파싱 (예: 19751102, 1975-11-02, 751102)
 const rawDate = dateInput?.value?.trim() || '';
 let cleanDate = rawDate.replace(/[^0-9]/g, '');

 // 6자리(주민번호 앞자리 예: 751102) 입력 시 19xx / 20xx 연도 자동 보완
 if (cleanDate.length === 6) {
 const yy = parseInt(cleanDate.slice(0, 2), 10);
 const currentYearTwoDigits = new Date().getFullYear() % 100;
 const century = yy <= currentYearTwoDigits ? '20' : '19';
 cleanDate = `${century}${cleanDate}`;
 }

 if (cleanDate.length !== 8) {
 appState.setError('생년월일을 8자리 숫자(예: 19751102) 또는 YYYY-MM-DD 형식으로 입력해 주세요.');
 return;
 }

 const y = parseInt(cleanDate.slice(0, 4), 10);
 const m = parseInt(cleanDate.slice(4, 6), 10);
 const d = parseInt(cleanDate.slice(6, 8), 10);

 if (isNaN(y) || isNaN(m) || isNaN(d) || y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) {
 appState.setError('올바른 생년월일(1900~2100년, 1~12월, 1~31일)을 입력해 주세요.');
 return;
 }

 // 출생시간 24시간제 파싱 (예: 13:30 또는 1330)
 let birthTime: string | null = null;
 if (!missingHourCheck?.checked) {
 const rawTime = timeInput?.value?.trim() || '';
 if (rawTime) {
 const cleanTime = rawTime.replace(/[^0-9:]/g, '');
 let h = 0;
 let min = 0;

 if (cleanTime.includes(':')) {
 const parts = cleanTime.split(':');
 h = parseInt(parts[0], 10);
 min = parseInt(parts[1], 10);
 } else if (cleanTime.length === 4) {
 h = parseInt(cleanTime.slice(0, 2), 10);
 min = parseInt(cleanTime.slice(2, 4), 10);
 } else if (cleanTime.length === 3) {
 h = parseInt(cleanTime.slice(0, 1), 10);
 min = parseInt(cleanTime.slice(1, 3), 10);
 } else if (cleanTime.length <= 2) {
 h = parseInt(cleanTime, 10);
 min = 0;
 }

 if (isNaN(h) || isNaN(min) || h < 0 || h > 23 || min < 0 || min > 59) {
 appState.setError('출생시간을 24시간 기준(00:00~23:59 또는 4자리 숫자 예: 1330)으로 입력해 주세요.');
 return;
 }

 birthTime = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
 }
 }

 const region = regionSelect?.value || 'Seoul';
 const troubleText = troubleTextarea?.value?.trim() || '특별한 문제는 없고 올해 전체적인 운의 흐름과 기회를 알고 싶어요.';

 appState.setUserTroubleText(troubleText);

 // 사용자 사주 입력 정보 LocalStorage 영구 보존
 const solarDateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
 UserSajuStore.saveProfile({
   userName: userName || '의뢰인',
   solarBirthDate: solarDateStr,
   birthYear: y,
   birthMonth: m,
   birthDay: d,
   birthTime: birthTime,
   isUnknownTime: missingHourCheck?.checked ?? false,
   gender: this.selectedGender,
   calendarType: appState.getState().calendarType,
   isLeapMonth: appState.getState().isLeapMonth,
   birthRegion: region,
   userTroubleText: troubleText,
 });

 try {
 // 2인 궁합(CHEMISTRY) 정보 파싱
 const partnerCheck = document.getElementById('check-enable-partner') as HTMLInputElement;
 const partnerNameInput = document.getElementById('input-partner-name') as HTMLInputElement;
 const partnerRelationSelect = document.getElementById('select-partner-relation') as HTMLSelectElement;
 const partnerDateInput = document.getElementById('input-partner-birth-date') as HTMLInputElement;
 const partnerTimeInput = document.getElementById('input-partner-birth-time') as HTMLInputElement;
 const partnerMissingHour = document.getElementById('check-partner-missing-hour') as HTMLInputElement;

 const isPartnerEnabled = partnerCheck?.checked || appState.getState().activeTierTab === 'CHEMISTRY';
 if (isPartnerEnabled && partnerDateInput?.value) {
 let pDate = partnerDateInput.value.trim().replace(/[^0-9]/g, '');
 if (pDate.length === 6) {
 const yy = parseInt(pDate.slice(0, 2), 10);
 const century = yy <= 26 ? '20' : '19';
 pDate = `${century}${pDate}`;
 }
 if (pDate.length === 8) {
 const py = pDate.slice(0, 4);
 const pm = pDate.slice(4, 6);
 const pd = pDate.slice(6, 8);
 const pDateFormatted = `${py}-${pm}-${pd}`;

 const partnerInfo = {
 name: partnerNameInput?.value?.trim() || '상대방 (인연)',
 relation: partnerRelationSelect?.value || '연인',
 gender: (this.selectedGender === 'male' ? 'female' : 'male') as 'male' | 'female',
 calendarType: 'solar' as const,
 isLeapMonth: false,
 birthDate: pDateFormatted,
 birthTime: partnerTimeInput?.value?.trim() || '14:30',
 isHourUnknown: partnerMissingHour?.checked ?? false,
 };

 appState.setPartnerInfo(partnerInfo);
 await frontendAdapter.analyzeGunghap(partnerInfo);
 }
 }

 // 통합 분석 파이프라인 호출
 await frontendAdapter.analyzeIntegrated({
 birthInput: {
 calendar_type: appState.getState().calendarType,
 is_leap_month: appState.getState().isLeapMonth,
 birth_year: y,
 birth_month: m,
 birth_day: d,
 birth_time: birthTime,
 is_time_unknown: missingHourCheck?.checked,
 birth_city: region,
 gender: this.selectedGender,
 },
 troubleText,
 tier: appState.getState().selectedTier,
 });

    // [스토어 시스템 동기화] 무료 체험 완료 주문 백그라운드 등록 (고객에게 주문서 강제 노출 없이 보관함 연동)
    try {
      const freeProd = getStoreProductById('prod-free-experience');
      if (freeProd) {
        const u = AuthService.getCurrentUser();
        const existingOrders = getAllStoreOrders();
        const already = existingOrders.some(o => o.productId === 'prod-free-experience' && (o.sajuInput?.userName === (userName || '의뢰인') || o.buyerName === (userName || '의뢰인')));
        if (!already) {
          createStoreOrder({
            productId: freeProd.id,
            buyerName: userName || (u.role !== 'guest' ? u.name : '의뢰인'),
            buyerPhone: u.phone || '010-0000-0000',
            buyerEmail: u.email || 'customer@mabosal.com',
            paymentMethod: 'bank_transfer',
            status: 'completed',
          });
        }
      }
    } catch (err) {
      console.warn('[무료 체험 주문 동기화 실패]:', err);
    }

    // 스토어 상품 구매 중 사주 등록을 위해 이동해 온 경우, 등록 완료 즉시 해당 상품 상세로 안전 복귀
    const pendingProdId = sessionStorage.getItem('mabosal_pending_saju_product');
    if (pendingProdId) {
      sessionStorage.removeItem('mabosal_pending_saju_product');
      selectStoreProduct(pendingProdId, false);
      navigateTo(`/store?product=${encodeURIComponent(pendingProdId)}`);
      return;
    }
 } catch {
 // 에러는 appState.setError()에서 관리
 }
 return;
 }

 // [B안 구매 전환 퍼널: 무료 사주 진단 폼 제출]
 if (form.id === 'form-funnel-birth-input') {
   const nameInput = document.getElementById('input-funnel-name') as HTMLInputElement;
   const dateInput = document.getElementById('input-funnel-birth-date') as HTMLInputElement;
   const timeInput = document.getElementById('input-funnel-birth-time') as HTMLInputElement;
   const missingHourCheck = document.getElementById('check-funnel-missing-hour') as HTMLInputElement;
   const troubleTextarea = document.getElementById('input-funnel-trouble-text') as HTMLTextAreaElement;
   const leapCheck = document.getElementById('check-funnel-leap') as HTMLInputElement;
   const calendarRadio = document.querySelector('input[name="funnel-calendar-type"]:checked') as HTMLInputElement;

   const userName = nameInput?.value?.trim() || '의뢰인';
   appState.setUserName(userName);

   const rawDate = dateInput?.value?.trim() || '';
   let cleanDate = rawDate.replace(/[^0-9]/g, '');
   if (cleanDate.length === 6) {
     const yy = parseInt(cleanDate.slice(0, 2), 10);
     const century = yy <= 26 ? '20' : '19';
     cleanDate = `${century}${cleanDate}`;
   }

   if (cleanDate.length !== 8) {
     alert('생년월일을 8자리 숫자(예: 19950515) 또는 YYYY-MM-DD 형식으로 입력해 주세요.');
     return;
   }

   const y = parseInt(cleanDate.slice(0, 4), 10);
   const m = parseInt(cleanDate.slice(4, 6), 10);
   const d = parseInt(cleanDate.slice(6, 8), 10);

   let birthTime: string | null = null;
   if (!missingHourCheck?.checked) {
     const rawTime = timeInput?.value?.trim() || '14:30';
     birthTime = normalizeBirthTime(rawTime) || '14:30';
   }

   const troubleText = troubleTextarea?.value?.trim() || '특별한 문제는 없고 내 사주의 핵심 위험과 즉시 해결책을 알고 싶습니다.';
   appState.setUserTroubleText(troubleText);

   const calendarType = (calendarRadio?.value === 'lunar' ? 'lunar' : 'solar') as 'solar' | 'lunar';
   const isLeap = leapCheck?.checked ?? false;

   // 사용자 사주 정보 저장
   const solarDateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
   UserSajuStore.saveProfile({
     userName,
     solarBirthDate: solarDateStr,
     birthYear: y,
     birthMonth: m,
     birthDay: d,
     birthTime,
     isUnknownTime: missingHourCheck?.checked ?? false,
     gender: this.selectedGender,
     calendarType,
     isLeapMonth: isLeap,
     birthRegion: 'Seoul',
     userTroubleText: troubleText,
   });

   // 통합 분석 파이프라인 호출
   appState.setActiveTierTab('FREE');
   appState.setView('loading');
   this.render(appState.getState());

   try {
     await frontendAdapter.analyzeIntegrated({
       birthInput: {
         calendar_type: calendarType,
         is_leap_month: isLeap,
         birth_year: y,
         birth_month: m,
         birth_day: d,
         birth_time: birthTime,
         is_time_unknown: missingHourCheck?.checked ?? false,
         birth_city: 'Seoul',
         gender: this.selectedGender,
       },
       troubleText,
       tier: 'free_diagnosis',
     });

     AbTestService.trackEvent('free_submit');
     appState.setView('result');
     this.render(appState.getState());
     window.scrollTo({ top: 0, behavior: 'smooth' });
   } catch (err: any) {
     alert('사주 분석 중 오류가 발생했습니다: ' + (err?.message || '잠시 후 다시 시도해 주세요.'));
     appState.setView('landing');
     this.render(appState.getState());
   }
   return;
 }

 // 상담 질문 제출
 if (form.id === 'form-chat-input' || form.id === 'form-consultation') {
 const input = (document.getElementById('input-chat-text') || document.getElementById('input-consultation-question')) as HTMLInputElement;
 const q = input?.value?.trim();
 if (q) {
 input.value = '';
 await this.submitConsultationQuestion(q);
 }
 return;
 }
 });

 }

 private async submitConsultationQuestion(questionText: string) {
 const session = appState.getState().sessionState;
 if (!session) return;

 const userMsgId = `user_${Date.now()}`;
 appState.addChatMessage({
 id: userMsgId,
 sender: 'user',
 text: questionText,
 timestamp: new Date().toISOString(),
 });

 try {
 const answer = await frontendAdapter.askConsultation(session, questionText);
 appState.addChatMessage({
 id: `mabosal_${Date.now()}`,
 sender: 'mabosal',
 text: answer.conclusion,
 answer,
 timestamp: new Date().toISOString(),
 });
 } catch (err: any) {
 appState.addChatMessage({
 id: `mabosal_err_${Date.now()}`,
 sender: 'mabosal',
 text: err?.message || '답변을 생성하는 도중 문제가 발생했습니다. 잠시 후 다시 시도해 주시기 바랍니다.',
 timestamp: new Date().toISOString(),
 });
 }
 }
  public openPrescriptionModal(type?: string, val?: string, hex?: string): void {
    const modal = document.getElementById('modal-prescription-detail');
    const titleEl = document.getElementById('prescription-modal-title');
    const bodyEl = document.getElementById('prescription-modal-body');
    if (!modal || !titleEl || !bodyEl) return;

    if (type === 'color') {
      titleEl.innerHTML = `오늘의 행운의 색 · <span style="color: ${hex};">${val}</span>`;
      bodyEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.85rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem 1.15rem; margin-bottom: 1.25rem;">
          <div style="width: 44px; height: 44px; border-radius: 50%; background: ${hex}; box-shadow: 0 0 16px ${hex}; flex-shrink: 0;"></div>
          <div>
            <div style="font-size: 1rem; font-weight: 800; color: #fff;">${val} 컬러의 오행 개운 파동</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.15rem;">오늘 하루 나를 돕는 기운을 활성화하는 시각적 주파수</div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.84rem; line-height: 1.65;">
          <div style="background: rgba(242,202,80,0.06); border-left: 3px solid var(--primary); padding: 0.8rem 1rem; border-radius: 0 8px 8px 0;">
            <strong style="color: var(--primary);">👔 의상 및 패션 코디법</strong><br/>
            오늘 출근룩, 미팅룩의 메인 의상 또는 넥타이, 스카프, 양말 등 포인트 액세서리에 <strong>${val}</strong> 계열을 매치해 보세요. 대인 관계에서 신뢰감과 호감도가 크게 상승합니다.
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 0.8rem 1rem; border-radius: 8px;">
            <strong style="color: #93c5fd;">👜 소품 및 일상 풍수</strong><br/>
            지갑, 휴대폰 케이스, 텀블러, 키링 등 손이 자주 닿는 소지품에 ${val} 색상을 활용하면 뜻밖의 재물운과 기분 전환에 도움을 줍니다.
          </div>
        </div>
      `;
    } else if (type === 'direction') {
      titleEl.innerHTML = `오늘의 행운의 방위 · <span style="color: var(--primary);">${val}</span>`;
      bodyEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.85rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem 1.15rem; margin-bottom: 1.25rem;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(242,202,80,0.15); border: 1px solid rgba(242,202,80,0.3); display: flex; align-items: center; justify-content: center; color: var(--primary); flex-shrink: 0;">
            <span class="material-symbols-outlined" style="font-size: 26px;">explore</span>
          </div>
          <div>
            <div style="font-size: 1rem; font-weight: 800; color: #fff;">${val} 방향의 기운 유입</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.15rem;">사주 원국과 오늘의 일진이 길신을 마주하는 각도</div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.84rem; line-height: 1.65;">
          <div style="background: rgba(242,202,80,0.06); border-left: 3px solid var(--primary); padding: 0.8rem 1rem; border-radius: 0 8px 8px 0;">
            <strong style="color: var(--primary);">🧭 외출 및 미팅 장소 선택</strong><br/>
            오늘 중요한 비즈니스 미팅, 식사 약속, 혹은 은행 업무가 있다면 현재 머무는 곳 기준으로 <strong>${val}</strong>에 위치한 장소를 선정하면 협상 주도권을 잡기 유리합니다.
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 0.8rem 1rem; border-radius: 8px;">
            <strong style="color: #93c5fd;">🪑 좌석 및 업무 공간 풍수</strong><br/>
            카페나 회의실에서 좌석을 고를 때 ${val}을 바라보거나 등지는 방향에 앉으시면 심리적 안정감과 집중력이 극대화됩니다.
          </div>
        </div>
      `;
    } else if (type === 'number') {
      titleEl.innerHTML = `오늘의 행운의 수 · <span style="color: var(--primary);">${val}</span>`;
      bodyEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.85rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem 1.15rem; margin-bottom: 1.25rem;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(242,202,80,0.15); border: 1px solid rgba(242,202,80,0.3); display: flex; align-items: center; justify-content: center; color: var(--primary); font-size: 1.3rem; font-weight: 900; flex-shrink: 0;">
            ${val}
          </div>
          <div>
            <div style="font-size: 1rem; font-weight: 800; color: #fff;">수비학(數秘學) &amp; 주역(周易) 행운 코드</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.15rem;">하도낙서(河圖洛書) 원리에 따른 최적의 에너지 수치</div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.84rem; line-height: 1.65;">
          <div style="background: rgba(242,202,80,0.06); border-left: 3px solid var(--primary); padding: 0.8rem 1rem; border-radius: 0 8px 8px 0;">
            <strong style="color: var(--primary);">🔢 일상 속 숫자 활용법</strong><br/>
            오늘 중요한 전화나 결재 시간(예: ${val}분), 주차 층수, 엘리베이터 층수, 로또 번호 조합, 또는 계좌 이체 금액 단위에 숫자 <strong>${val}</strong>을 의식적으로 조합해 보세요.
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 0.8rem 1rem; border-radius: 8px;">
            <strong style="color: #93c5fd;">✨ 에너지 정렬 조언</strong><br/>
            숫자 ${val}은 흩어져 있는 생각과 결단을 하나의 구심점으로 묶어주는 길수(吉數)의 파동을 발휘합니다.
          </div>
        </div>
      `;
    } else {
      titleEl.innerHTML = `오늘의 지혜의 한 줄 · 심층 해설`;
      bodyEl.innerHTML = `
        <div style="background: rgba(242,202,80,0.08); border: 1px solid rgba(242,202,80,0.3); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.25rem;">
          <div style="font-size: 1.05rem; font-weight: 800; color: #fff; line-height: 1.6; margin-bottom: 0.5rem;">
            "${val}"
          </div>
          <div style="font-size: 0.78rem; color: var(--primary); font-weight: 700;">마보살 명리 지침서 발췌</div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.84rem; line-height: 1.65;">
          <div style="background: rgba(255,255,255,0.03); border-left: 3px solid var(--primary); padding: 0.8rem 1rem; border-radius: 0 8px 8px 0;">
            <strong style="color: var(--primary);">🧘 오늘 하루 마음가짐</strong><br/>
            상황에 급하게 반응하기보다 호흡을 가다듬고 한 걸음 물러서서 관찰할 때 최선의 해결책이 떠오릅니다. 작은 배려가 큰 귀인을 불러옵니다.
          </div>
        </div>
      `;
    }

    modal.style.display = 'flex';
  }

  public openAuspiciousHourModal(hourType: string): void {
    const modal = document.getElementById('modal-auspicious-hour-detail');
    const titleEl = document.getElementById('auspicious-modal-title');
    const bodyEl = document.getElementById('auspicious-modal-body');
    if (!modal || !titleEl || !bodyEl) return;

    if (hourType === 'sashi') {
      titleEl.innerHTML = `제1 길시: 사시(巳時 · 09:30 ~ 11:30)`;
      bodyEl.innerHTML = `
        <div style="background: rgba(242,202,80,0.08); border: 1px solid rgba(242,202,80,0.3); border-radius: 12px; padding: 1.15rem; margin-bottom: 1.25rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem;">
            <span style="font-size: 0.75rem; color: var(--primary); font-weight: 700;">계약 · 문서 · 제안 대길</span>
            <span style="font-size: 0.7rem; color: #241a00; background: var(--primary); padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 800;">오전 황금 타임</span>
          </div>
          <div style="font-size: 1.05rem; font-weight: 800; color: #fff;">중요 미팅 및 협상 타결 최적기</div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.84rem; line-height: 1.65;">
          <div style="background: rgba(255,255,255,0.03); border-left: 3px solid #50c878; padding: 0.8rem 1rem; border-radius: 0 8px 8px 0;">
            <strong style="color: #50c878;">✅ 추천 행동</strong><br/>
            • 중요한 계약서 날인, 결재 서류 제출<br/>
            • 새로운 프로젝트 기획안 공유 및 투자 제안<br/>
            • 윗사람이나 협력사 주요 담당자와의 통화 및 미팅
          </div>
          <div style="background: rgba(255,255,255,0.03); border-left: 3px solid #ff8a80; padding: 0.8rem 1rem; border-radius: 0 8px 8px 0;">
            <strong style="color: #ff8a80;">⚠️ 주의할 점</strong><br/>
            사소한 감정 대립에 시간을 낭비하지 마시고, 객관적인 데이터와 실리 위주로 논의를 이끌어가세요.
          </div>
        </div>
      `;
    } else {
      titleEl.innerHTML = `제2 길시: 미시(未時 · 13:30 ~ 15:30)`;
      bodyEl.innerHTML = `
        <div style="background: rgba(242,202,80,0.12); border: 1px solid rgba(242,202,80,0.4); border-radius: 12px; padding: 1.15rem; margin-bottom: 1.25rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem;">
            <span style="font-size: 0.75rem; color: var(--primary); font-weight: 700;">재물 결실 · 투자 대길</span>
            <span style="font-size: 0.7rem; color: #241a00; background: var(--primary); padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 800;">진행 중</span>
          </div>
          <div style="font-size: 1.05rem; font-weight: 800; color: #fff;">황금 재물 결실 타임 — 투자 판단 및 정산 최적</div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.84rem; line-height: 1.65;">
          <div style="background: rgba(255,255,255,0.03); border-left: 3px solid #50c878; padding: 0.8rem 1rem; border-radius: 0 8px 8px 0;">
            <strong style="color: #50c878;">✅ 추천 행동</strong><br/>
            • 은행 송금, 정산 집행, 주식/자산 매매 판단<br/>
            • 상품 런칭 및 구매 결정<br/>
            • 회복을 위한 10분간의 햇살 산책
          </div>
          <div style="background: rgba(255,255,255,0.03); border-left: 3px solid #ff8a80; padding: 0.8rem 1rem; border-radius: 0 8px 8px 0;">
            <strong style="color: #ff8a80;">⚠️ 주의할 점</strong><br/>
            무리한 과소비나 충동구매를 경계하고 꼭 필요한 곳에만 자금을 집중하세요.
          </div>
        </div>
      `;
    }

    modal.style.display = 'flex';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new MabosalApp('app');
});
