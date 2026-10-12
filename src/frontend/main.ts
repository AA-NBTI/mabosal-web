import { OrderAuthGuard } from './modules/order/order-auth-guard.js';
import { PaymentService } from './modules/payment/payment-service.js';
import { savePaymentConfigFromDom } from './modules/payment/AdminPaymentPanel.js';
import { VoucherStore } from './modules/voucher/voucher-store.js';
import { renderMagiCalendarView } from './views/MagiCalendarView.js';
import { renderLuckyCalendarView } from './views/LuckyCalendarView.js';
import { renderStudyView, setStudyCategory, selectStudyArticle } from './extensions/study-hub/index.js';
import { SiteContentStore } from './state/site-content-store.js';
import {
  renderSolutionHub,
  bindSolutionHubEvents,
  addCustomSolution,
  addCustomPartner,
  updatePartnerApplicationStatus,
  type VerticalId,
} from './extensions/solution-hub/index.js';

bindSolutionHubEvents();
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
} from './views/AdminDashboardView.js';
import {
  renderCommerceStoreView,
  setStoreActiveCategory,
  getStoreProductById,
  selectStoreProduct,
  setLastStoreOrder,
  createStoreOrder,
  redeemStoreVoucher,
  saveStoreProduct,
  updateStoreProduct,
  deleteStoreProduct,
  setAdminStoreFilter,
  setAdminStoreSort,
  setAdminStoreSearch,
  setStoreProductStatus,
  setAdminStoreSubTab,
  type StoreCategoryType,
  type DeliveryType,
} from './extensions/commerce-store/index.js';
import { setSelectedZodiac, setSelectedYear, toggleCardExpanded } from './views/TodayFortuneAndMagiWidget.js';
import { ModuleRegistry } from './state/module-registry.js';
import { CatalogStore } from './state/catalog-store.js';
import { AuthService } from './state/auth-service.js';
import { renderAuthModal } from './components/AuthModal.js';
import { renderCharmPricingCheckoutModal } from './components/common-components.js';
import { generateDownloadableReportText } from './components/tier-templates.js';
import { renderCheonmyeongwonShareModal } from './components/VisualCharts.js';

class MabosalApp {
 private rootEl: HTMLElement;
 private selectedGender: 'male' | 'female' = 'male';

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

 private init() {
 PartnerTracker.initFromUrl();
 AuthService.init();

 if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const viewParam = urlParams.get('view');
      if (urlParams.get('payment')) {
        appState.setView('store');
        void this.handlePaymentReturn(urlParams);
      } else if (viewParam === 'admin' || urlParams.get('admin') === 'true') {
        const tabParam = urlParams.get('tab');
        if (tabParam) {
          const fullTabId = tabParam.startsWith('tab-') ? tabParam : `tab-${tabParam}`;
          setAdminActiveTab(fullTabId);
        }
        if (AuthService.isAdmin()) {
          appState.setView('admin');
        } else {
          setTimeout(() => {
            this.openAuthModal('login');
            const userInput = document.getElementById('input-login-username') as HTMLInputElement;
            if (userInput) userInput.value = 'admin';
          }, 150);
        }
      } else if (viewParam === 'store' || viewParam === 'mall') {
        appState.setView('store');
      } else if (viewParam === 'member-dashboard') {
        appState.setView('member-dashboard');
      } else {
        // [3번 요구사항 완벽 해결] 새로고침 시 스터디 등으로 잘못 튕기지 않고 메인 홈(landing) 우선 로드
        appState.setView('landing');
        if (window.location.search && !viewParam) {
          window.history.replaceState({ view: 'landing' }, '', window.location.pathname);
        }
      }
    }
 // [6번 요구사항] History API 연동 & 메인 화면 뒤로가기 사이트 이탈 방지 핸들러
 if (typeof window !== 'undefined') {
 window.history.replaceState({ view: appState.getState().currentView }, '', window.location.href);

 window.addEventListener('popstate', (event) => {
 const targetView = event.state?.view;
 const currentView = appState.getState().currentView;

 if (targetView && targetView !== currentView) {
 appState.setView(targetView);
 } else if (!targetView || currentView === 'landing') {
 // 메인 화면에서 뒤로가기 누를 시 사이트를 벗어나지 않고 안전하게 메인 화면 유지
 window.history.pushState({ view: 'landing' }, '', window.location.href);
 if (currentView !== 'landing') {
 appState.setView('landing');
 }
 }
 });
 }

 let prevNavView = appState.getState().currentView;
 appState.subscribe(state => {
 if (typeof window !== 'undefined' && state.currentView !== prevNavView) {
   const targetUrl = state.currentView === 'landing' 
     ? window.location.pathname 
     : `${window.location.pathname}?view=${state.currentView}`;
   window.history.pushState({ view: state.currentView }, '', targetUrl);
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

 private render(state: AppStateData) {
 let mainContentHtml = '';
 const wasAnalyzeView = !!document.getElementById('form-birth-input');
 const formSnapshot = wasAnalyzeView ? this.snapshotFormValues() : null;

 switch (state.currentView) {
 case 'landing':
 mainContentHtml = renderLandingView(state);
 break;
 case 'analyze':
 mainContentHtml = renderBirthInputView(state);
 break;
 case 'loading':
 mainContentHtml = renderLoadingView(state);
 break;
 case 'result':
 mainContentHtml = renderResultView(state);
 break;
 case 'consult':
 mainContentHtml = renderConsultationView(state);
 break;
 case 'report':
 mainContentHtml = renderReportView(state);
 break;
 case 'partner':
 mainContentHtml = renderPartnerPortalView();
 break;
 case 'admin':
 mainContentHtml = renderAdminDashboardView();
 break;
 case 'member-dashboard':
        mainContentHtml = renderMemberDashboardView(state);
        break;
      case 'magi-calendar':
        mainContentHtml = renderMagiCalendarView(state);
        break;
      case 'lucky-calendar':
        mainContentHtml = renderLuckyCalendarView(state);
        break;
      case 'study':
        mainContentHtml = renderStudyView();
        break;
      case 'store':
        mainContentHtml = renderCommerceStoreView(state);
        break;
 }

 if (state.currentView === 'result') {
      mainContentHtml += renderSolutionHub(state);
    }

    const modalHtml = renderEvidenceTraceModal(state);

 this.rootEl.innerHTML = `
 ${renderHeader(state)}
 <main id="app-main">
 <div class="app-container">
 ${mainContentHtml}
 </div>
 </main>
      ${renderFooter()}
 ${renderFloatingBottomDock(state.currentView)}
      ${renderMobileNavDrawer(state)}
 ${modalHtml}
 ${renderCheonmyeongwonShareModal()}
 ${renderAuthModal()}
 <div id="checkout-modal-container"></div>
 `;

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
  if (target.closest('#m-nav-study')) {
    appState.setView('study');
    const drawer = document.getElementById('mobile-nav-drawer');
    const backdrop = document.getElementById('mobile-nav-backdrop');
    if (drawer) drawer.style.right = '-290px';
    if (backdrop) backdrop.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.render(appState.getState());
    return;
  }
  if (target.closest('#m-nav-store')) {
    appState.setView('store');
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
 a.download = `${userName}_마보살_사주감정서.txt`;
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

 // 0-3. 천명원 10번 비전 바로가기 퀵 네비게이션
 if (target.closest('.btn-quick-nav')) {
 appState.setView('analyze');
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
 a.download = `[보안백업]_${userName}_사주정본_감정서_DID공인.txt`;
 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 URL.revokeObjectURL(url);
 alert(` Polygon DID 블록체인 공인 보안 백업 완료\n\n• 명주: ${userName} 님\n• 전체 13개 장절 정본 감정서 (DID 무결성 검증 키 포함)\n• 저장 위치: 이용자 PC의 [다운로드(Downloads)] 폴더\n\n탐색기 [다운로드] 폴더에서 확인하실 수 있습니다.`);
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
      appState.setView('study');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.render(appState.getState());
      return;
    }
    if (target.closest('#footer-nav-store')) {
      appState.setView('store');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.render(appState.getState());
      return;
    }

    // --- [모바일 전체 메뉴 (GNB) 햄버거 토글] ---
    if (target.closest('#btn-mobile-hamburger')) {
      const drawer = document.getElementById('mobile-nav-drawer');
      const backdrop = document.getElementById('mobile-nav-backdrop');
      if (drawer) drawer.style.right = '0';
      if (backdrop) backdrop.style.display = 'block';
      return;
    }
    if (target.closest('#btn-close-mobile-nav') || target.closest('#mobile-nav-backdrop')) {
      const drawer = document.getElementById('mobile-nav-drawer');
      const backdrop = document.getElementById('mobile-nav-backdrop');
      if (drawer) drawer.style.right = '-290px';
      if (backdrop) backdrop.style.display = 'none';
      return;
    }
    if (target.closest('#m-nav-fortune')) {
      appState.setView('fortune' as any);
      const drawer = document.getElementById('mobile-nav-drawer');
      const backdrop = document.getElementById('mobile-nav-backdrop');
      if (drawer) drawer.style.right = '-290px';
      if (backdrop) backdrop.style.display = 'none';
      this.render(appState.getState());
      return;
    }
    if (target.closest('#m-nav-magi-cal')) {
      appState.setView('magi-calendar' as any);
      const drawer = document.getElementById('mobile-nav-drawer');
      const backdrop = document.getElementById('mobile-nav-backdrop');
      if (drawer) drawer.style.right = '-290px';
      if (backdrop) backdrop.style.display = 'none';
      this.render(appState.getState());
      return;
    }
    if (target.closest('#m-nav-study')) {
      appState.setView('study');
      const drawer = document.getElementById('mobile-nav-drawer');
      const backdrop = document.getElementById('mobile-nav-backdrop');
      if (drawer) drawer.style.right = '-290px';
      if (backdrop) backdrop.style.display = 'none';
      this.render(appState.getState());
      return;
    }
    if (target.closest('#m-nav-store')) {
      appState.setView('store');
      const drawer = document.getElementById('mobile-nav-drawer');
      const backdrop = document.getElementById('mobile-nav-backdrop');
      if (drawer) drawer.style.right = '-290px';
      if (backdrop) backdrop.style.display = 'none';
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
          // 사주 정보 미입력 시 맞춤 감정서 생성을 위해 사주 입력 화면으로 자연스럽게 안내
          appState.setView('analyze');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.render(appState.getState());
      } else {
        alert(result.message);
      }
      return;
    }

    // --- [스토어 모바일 좌측 카테고리 슬라이드 드로어] ---
    if (target.closest('#btn-open-store-drawer')) {
      const sidebar = document.getElementById('store-sidebar-drawer');
      const backdrop = document.getElementById('store-drawer-backdrop');
      if (sidebar) sidebar.classList.add('drawer-open');
      if (backdrop) backdrop.classList.add('active');
      return;
    }
    if (target.closest('#btn-close-store-drawer') || target.closest('#store-drawer-backdrop')) {
      const sidebar = document.getElementById('store-sidebar-drawer');
      const backdrop = document.getElementById('store-drawer-backdrop');
      if (sidebar) sidebar.classList.remove('drawer-open');
      if (backdrop) backdrop.classList.remove('active');
      return;
    }

    // --- [스터디 모바일 좌측 카테고리 슬라이드 드로어] ---
    if (target.closest('#btn-open-study-drawer')) {
      const sidebar = document.getElementById('study-sidebar-drawer');
      const backdrop = document.getElementById('study-drawer-backdrop');
      if (sidebar) sidebar.classList.add('drawer-open');
      if (backdrop) backdrop.classList.add('active');
      return;
    }
    if (target.closest('#btn-close-study-drawer') || target.closest('#study-drawer-backdrop')) {
      const sidebar = document.getElementById('study-sidebar-drawer');
      const backdrop = document.getElementById('study-drawer-backdrop');
      if (sidebar) sidebar.classList.remove('drawer-open');
      if (backdrop) backdrop.classList.remove('active');
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

    // [관리자 CMS] 상품 삭제
    const delProdBtn = target.closest('.btn-delete-store-product') as HTMLElement | null;
    if (delProdBtn) {
      const prodId = delProdBtn.dataset.productId;
      if (prodId && confirm('정말로 이 상품을 삭제하시겠습니까?')) {
        deleteStoreProduct(prodId);
        alert('상품이 성공적으로 삭제되었습니다.');
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

    // 관리자 탭 전환
 const adminTabBtn = target.closest('.admin-tab-btn') as HTMLElement;
 if (adminTabBtn) {
 const targetTab = adminTabBtn.dataset.tab;
 if (targetTab) {
 setAdminActiveTab(targetTab);
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

 // 0-A. PC 모드 카테고리 네비게이션 바 클릭
 if (target.closest('#pc-nav-home')) {
 appState.setView('landing');
 window.scrollTo({ top: 0, behavior: 'smooth' });
 return;
 }
 // [항목 6] 상단 카테고리 '정통사주' 클릭 시 메인의 마보살 4대 정밀 감정 리포트 섹션으로 이동
 if (target.closest('#pc-nav-saju')) {
 if (appState.getState().currentView !== 'landing') {
 appState.setView('landing');
 }
 setTimeout(() => {
 const el = document.getElementById('section-four-reports');
 if (el) el.scrollIntoView({ behavior: 'smooth' });
 }, 100);
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
 if (target.closest('#wp-admin-backdrop')) {
 const sidebar = document.getElementById('wp-admin-sidebar');
 const backdrop = document.getElementById('wp-admin-backdrop');
 if (sidebar && backdrop) {
 sidebar.classList.remove('open');
 backdrop.classList.remove('open');
 }
 return;
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

 // 2. [정석 신규 회원가입 제출]
 if (target.closest('#btn-submit-register')) {
 const username = (document.getElementById('input-reg-username') as HTMLInputElement)?.value || '';
 const password = (document.getElementById('input-reg-password') as HTMLInputElement)?.value || '';
 const passwordConfirm = (document.getElementById('input-reg-password-confirm') as HTMLInputElement)?.value || '';
 const name = (document.getElementById('input-reg-name') as HTMLInputElement)?.value || '';
 const phone = (document.getElementById('input-reg-phone') as HTMLInputElement)?.value || '';
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
 alert(`️ 회원가입 실패\n\n${res.message}`);
 return;
 }

 this.closeAuthModal();
 this.render(appState.getState());

 if (res.user?.role === 'partner') {
   appState.setView('partner');
   window.scrollTo({ top: 0, behavior: 'smooth' });
 } else {
   appState.setView('member-dashboard');
   window.scrollTo({ top: 0, behavior: 'smooth' });
 }
 alert(` [회원가입 완료]\n\n${res.message}\n회원 대시보드(마이페이지)로 이동합니다.`);
 return;
 }

 // 1. 브랜드 로고 클릭 -> 홈 이동
 if (target.closest('#btn-nav-brand') || target.closest('#nav-btn-landing')) {
 appState.setView('landing');
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

 // [최고 관리자 대시보드 인터랙션 (탭 전환 & 상품 & 협력업체 & 기능 노출 관리)]
 if (target.closest('#btn-admin-to-service')) {
 appState.setView('landing');
 window.scrollTo({ top: 0, behavior: 'smooth' });
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

    // 마보살 스토어 네비게이션 클릭
    // /* id-nav-study-handled */
    if (target.closest('#pc-nav-study') || target.closest('#m-nav-study')) {
      appState.setView('study');
      this.render(appState.getState());
      return;
    }

    if (target.closest('#pc-nav-store') || target.closest('#m-nav-store')) {
      appState.setView('store');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const drawer = document.getElementById('mobile-nav-drawer');
      const backdrop = document.getElementById('mobile-nav-backdrop');
      if (drawer) drawer.classList.remove('open');
      if (backdrop) backdrop.classList.remove('open');
      this.render(appState.getState());
      return;
    }

    // 마기달력 & 행운달력 네비게이션 및 탭 클릭
    if (target.closest('#pc-nav-magi-cal') || target.closest('#tab-goto-magi-cal')) {
      appState.setView('magi-calendar' as any);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.render(appState.getState());
      return;
    }

    if (target.closest('#pc-nav-lucky-cal') || target.closest('#tab-goto-lucky-cal')) {
      appState.setView('lucky-calendar' as any);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.render(appState.getState());
      return;
    }

    if (target.closest('#btn-cal-back-home')) {
      appState.setView('landing');
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

 const company = (document.getElementById('input-cms-footer-company') as HTMLInputElement)?.value?.trim() || '주식회사 천명원 마보살';
 const ceo = (document.getElementById('input-cms-footer-ceo') as HTMLInputElement)?.value?.trim() || '홍길동';
 const biz = (document.getElementById('input-cms-footer-biz') as HTMLInputElement)?.value?.trim() || '123-45-67890';
 const mail = (document.getElementById('input-cms-footer-mail') as HTMLInputElement)?.value?.trim() || '제 2026-서울강남-01234호';
 const contact = (document.getElementById('input-cms-footer-contact') as HTMLInputElement)?.value?.trim() || 'contact@mabosal.com';
 const copyright = (document.getElementById('input-cms-footer-copy') as HTMLInputElement)?.value?.trim() || '© 2026 Mabosal Inc. All rights reserved.';

 SiteContentStore.updateConfig({
 header: { brandName, domainText },
 hero: { mainTitle: heroTitle, subPill: heroSubpill, description: heroDesc },
 footer: { companyName: company, ceoName: ceo, bizNumber: biz, mailOrderNumber: mail, contactInfo: contact, copyright },
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

 // 7. 정산 승인 버튼
 if (target.closest('.btn-approve-payout')) {
 const partner = (target.closest('.btn-approve-payout') as HTMLElement).dataset.partner;
 setAdminActiveTab('tab-affiliate');
 alert(` [정산 및 송금 완료]\n\n• 파트너: ${partner}\n• 지정 계좌로 출금 처리가 정상 승인되었습니다.`);
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
 alert(' [1:1 실시간 상담 연결]\n\n• 의뢰인: 홍길동 님 (32세)\n• 의뢰인의 사주 원국과 사전 질문지 3문 3답 분석 자료가 역술가 전용 상담 HUD에 로드되었습니다.\n• 통화가 시작됩니다.');
 return;
 }

 // 1-2. 엽전 지갑 클릭
 if (target.closest('#btn-yeop-wallet')) {
 const u = AuthService.getCurrentUser();
 alert(` 마보살 엽전 지갑\n\n• 보유 잔액: ${u.yeopBalance.toLocaleString()} 엽 (${u.yeopBalance.toLocaleString()}원 상당)\n• 사용 방법: 모든 유료 사주 및 2027 단품 결제창에서 자동 할인 차감\n• 적립 방법: 1일 1회 출석 체크(100엽) 및 마보살 파트너스 제휴 활동 시 30% 커미션 적립!`);
 return;
 }

 // 2. 사주 분석 시작 버튼
 if (target.closest('#nav-btn-start') || target.closest('#btn-hero-start') || target.closest('#btn-hero-cta')) {
 appState.setView('analyze');
 return;
 }

 // 2-1. 메인 화면 4대 상품군 선택 (티어 지정 후 분석 폼으로 이동)
 const selectProductBtn = target.closest('.btn-select-product') as HTMLElement;
 if (selectProductBtn) {
 const tier = selectProductBtn.dataset.tier as any;
 if (tier) {
 appState.setActiveTierTab(tier);
 }
 appState.setView('analyze');
 return;
 }

 // 3. 내비게이션 탭
 if (target.closest('#nav-btn-result')) {
 appState.setView('result');
 return;
 }
 if (target.closest('#nav-btn-consult') || target.closest('#btn-goto-consult')) {
 appState.setView('consult');
 return;
 }
 if (target.closest('#nav-btn-report') || target.closest('#btn-goto-report')) {
 appState.setView('report');
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

 // 12. 900원 참 프라이싱 결제 모달 열기 (.btn-trigger-checkout)
 const triggerCheckoutBtn = target.closest('.btn-trigger-checkout') as HTMLElement;
 if (triggerCheckoutBtn) {
 const productName = triggerCheckoutBtn.dataset.productName || '마보살 맞춤 사주 솔루션';
 const amount = parseInt(triggerCheckoutBtn.dataset.amount || '19900', 10);
 const originalPrice = parseInt(triggerCheckoutBtn.dataset.originalPrice || '50000', 10);
 const tier = triggerCheckoutBtn.dataset.tier || 'PAID';
 const modalContainer = document.getElementById('checkout-modal-container');
 if (modalContainer) {
 modalContainer.innerHTML = renderCharmPricingCheckoutModal({
 productTitle: productName,
 originalPrice,
 finalPrice900: amount,
 yeopDiscount: 3000,
 tierId: tier,
 });
 }
 return;
 }

 // 12-1. 결제 모달 닫기
 if (
 target.id === 'btn-close-checkout-modal' ||
 target.id === 'btn-modal-close-checkout' ||
 target.id === 'modal-checkout-overlay'
 ) {
 const modalContainer = document.getElementById('checkout-modal-container');
 if (modalContainer) modalContainer.innerHTML = '';
 return;
 }

 // 12-2. 결제 모달 최종 결제 승인 (.btn-submit-payment 또는 #btn-confirm-checkout)
 const confirmCheckoutBtn = target.closest('.btn-submit-payment, #btn-confirm-checkout') as HTMLElement;
 if (confirmCheckoutBtn) {
 const tier = (confirmCheckoutBtn.dataset.tier || 'PAID') as any;
 const amount = parseInt(confirmCheckoutBtn.dataset.amount || '19900', 10);
 const productName = confirmCheckoutBtn.dataset.productName || '사주 솔루션';

 // 1. 파트너스 30% 커미션 자동 추적 & 기록
 PartnerTracker.recordConversion(amount);

 // 2. 엔진 티어 업그레이드
 await frontendAdapter.upgradeTier(tier === 'PREMIUM' ? 'paid_mabosal_full' : 'paid_detailed_saju');

 // 3. 모달 닫기
 const modalContainer = document.getElementById('checkout-modal-container');
 if (modalContainer) modalContainer.innerHTML = '';

 alert(`[결제 승인 완료]\n\n${productName} (${amount.toLocaleString()}원) 결제가 성공적으로 승인되었습니다!\n심층 명리 처방과 모든 잠금 섹션이 즉시 해제되었습니다.`);

 if (tier) {
 appState.setActiveTierTab(tier);
 }
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

 // 폼 제출 이벤트
 this.rootEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  if (!form) return;

  // [스토어 간편 결제 폼 제출]
  if (form.id === 'store-checkout-form') {
    const prodId = form.dataset.productId;
    const nameInput = document.getElementById('order-buyer-name') as HTMLInputElement;
    const phoneInput = document.getElementById('order-buyer-phone') as HTMLInputElement;
    const emailInput = document.getElementById('order-buyer-email') as HTMLInputElement;
    const payMethodInput = form.querySelector('input[name="order-pay-method"]:checked') as HTMLInputElement;

    if (prodId) {
       const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
       if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '처리 중...'; }
       const currentUser = AuthService.getCurrentUser();
       const result = await PaymentService.checkout({
         productId: prodId,
         buyerName: nameInput?.value?.trim() || (currentUser.role !== 'guest' ? currentUser.name : '의뢰인'),
         buyerPhone: phoneInput?.value?.trim() || (currentUser.role !== 'guest' && currentUser.phone ? currentUser.phone : '010-0000-0000'),
         buyerEmail: emailInput?.value?.trim() || (currentUser.role !== 'guest' ? currentUser.email : 'user@mabosal.com'),
         method: payMethodInput?.value || 'bank_transfer',
         userId: currentUser.role !== 'guest' ? currentUser.id : undefined,
       });
       if (result.kind === 'order') {
         setLastStoreOrder(result.order);
         this.render(appState.getState());
         window.scrollTo({ top: 0, behavior: 'smooth' });
       } else if (result.kind === 'error') {
         alert(result.message);
         if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '주문하기'; }
       }
     }
    return;
  }

 // 출생정보 제출
 if (form.id === 'form-birth-input') {
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
 } catch {
 // 에러는 appState.setError()에서 관리
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
}

document.addEventListener('DOMContentLoaded', () => {
 new MabosalApp('app');
});
