import { StudyService, StudyArticle, StudyCategory, generateKoreanSlug } from '../extensions/study-hub/index.js';
import { renderAdminBankTransferPanel, renderAdminCouponPanel, renderAdminVoucherPanel, bindAdminVoucherEvents } from '../modules/voucher/AdminVoucherPanel.js';
import { VoucherStore } from '../modules/voucher/voucher-store.js';
import { renderAdminPaymentPanel } from '../modules/payment/AdminPaymentPanel.js';
import { SiteContentStore } from '../state/site-content-store.js';
import { PartnerTracker } from '../modules/partner-tracker.js';
import { CatalogStore } from '../state/catalog-store.js';
import { ModuleRegistry } from '../state/module-registry.js';
import { CustomerInquiryStore } from '../state/customer-inquiry-store.js';
import { AbTestService } from '../modules/ab-test/ab-test-service.js';
import { ProductReviewStore } from '../state/product-review-store.js';
import {
  VERTICALS,
  getAllSolutions,
  getAllPartners,
  getSolutionStats,
  getPartnerApplications,
} from '../extensions/solution-hub/index.js';
import { renderAdminStorePanel, getAllStoreOrders } from '../extensions/commerce-store/index.js';
import { renderAdminInquiriesPanel, expandSpecificInquiry } from './AdminInquiriesPanel.js';
import { renderAdminReviewsPanel } from './AdminReviewsPanel.js';
import { renderAdminLifeAnalysisPanel } from './AdminLifeAnalysisPanel.js';
import { renderAdminSeoWikiHubPanel } from './AdminSeoWikiHubPanel.js';


let activeEditingStudyArticleId: string | null = null;
export function setEditingStudyArticleId(id: string | null): void {
  activeEditingStudyArticleId = id;
}
export function getEditingStudyArticleId(): string | null {
  return activeEditingStudyArticleId;
}

let activeEditingStoreProductId: string | null = null;
export function setEditingStoreProductId(id: string | null): void {
  activeEditingStoreProductId = id;
}
export function getEditingStoreProductId(): string | null {
  return activeEditingStoreProductId;
}

let activeAdminTabId = 'tab-overview';

export function setAdminActiveTab(tabId: string): void {
  activeAdminTabId = tabId;
}

export function getAdminActiveTab(): string {
  return activeAdminTabId;
}

// 상위 카테고리 아코디언(펼침/닫힘) 상태 관리: 기본 모두 닫힘 세팅
const expandedAdminGroupIds = new Set<string>();

// 2차 서브 카테고리(3단 아코디언) 상태 관리: 상품관리는 기본 펼침
const subGroupToggleState = new Map<string, boolean>();

export function toggleAdminGroup(groupId: string): void {
  if (expandedAdminGroupIds.has(groupId)) {
    expandedAdminGroupIds.delete(groupId);
  } else {
    expandedAdminGroupIds.add(groupId);
  }
}

export function toggleAdminSubGroup(subGroupId: string): void {
  const current = subGroupToggleState.has(subGroupId) ? subGroupToggleState.get(subGroupId)! : true;
  subGroupToggleState.set(subGroupId, !current);
}

export function isGroupExpanded(groupId: string): boolean {
  return expandedAdminGroupIds.has(groupId);
}

export function renderAdminDashboardView(): string {
  const products = CatalogStore.getProducts();
  const vendors = CatalogStore.getVendors();
  const allModules = ModuleRegistry.getAllModules();
  const masterToggles = ModuleRegistry.getAllMasterToggles();
  const allOrders = getAllStoreOrders();

  const activeProductsCount = products.filter(p => p.enabled).length;
  const activeVendorsCount = vendors.filter(v => v.enabled).length;
  const activeModulesCount = allModules.filter(m => m.enabled).length;
  const activeMasterCount = masterToggles.filter(m => m.enabled).length;

  const currentTab = activeAdminTabId;
  const pendingInquiriesCount = CustomerInquiryStore.getPendingCount();

  // [상위 대주제 카테고리 및 서브 카테고리 정의 - 요구사항 1번 고객센터/고객문의 반영]
  const adminGroups = [
    {
      id: 'group-overview',
      label: '대시보드',
      defaultTab: 'tab-overview',
      subTabs: []
    },
    {
      id: 'group-commerce',
      label: '커머스',
      defaultTab: 'tab-store',
      subTabs: [
        {
          id: 'subgroup-store',
          label: '상품관리',
          defaultTab: 'tab-store',
          children: [
            { id: 'tab-store', label: '상품목록' },
            { id: 'tab-store-register', label: '상품등록' },
            { id: 'tab-store-orders', label: '결제장부' },
            { id: 'tab-store-categories', label: '카테고리 관리' },
          ]
        },
        { id: 'tab-reviews', label: '리뷰 관리' },
        { id: 'tab-transfers', label: '무통장 승인' },
        { id: 'tab-coupons', label: '쿠폰' },
        { id: 'tab-payments', label: '결제 설정' },
      ]
    },
    {
      id: 'group-content',
      label: '컨텐츠',
      defaultTab: 'tab-study-articles',
      subTabs: [
        {
          id: 'subgroup-study',
          label: '스터디',
          defaultTab: 'tab-study-articles',
          children: [
            { id: 'tab-study-articles', label: '아티클 목록' },
            { id: 'tab-study-write', label: '글 작성' },
            { id: 'tab-study-categories', label: '카테고리 관리' },
          ]
        },
        {
          id: 'tab-seo-wiki-hub',
          label: 'SEO 키워드 웹서비스',
        }
      ]
    },
    {
      id: 'group-partners',
      label: '파트너스',
      defaultTab: 'tab-vendors',
      subTabs: [
        { id: 'tab-vendors', label: '협력사' },
        { id: 'tab-affiliate', label: '제휴 정산' },
      ]
    },
    {
      id: 'group-support',
      label: '고객센터',
      defaultTab: 'tab-inquiries',
      subTabs: [
        { id: 'tab-inquiries', label: pendingInquiriesCount > 0 ? `고객문의 (${pendingInquiriesCount})` : '고객문의' },
      ]
    },
    {
      id: 'group-system',
      label: '시스템',
      defaultTab: 'tab-solutions',
      subTabs: [
        { id: 'tab-life-analysis', label: '백세인생' },
        { id: 'tab-solutions', label: '사주 엔진' },
        { id: 'tab-features', label: '기능 제어' },
        { id: 'tab-site-content', label: '사이트 설정' },
      ]
    }
  ];

  // 현재 활성 대주제 그룹 찾기
  let activeGroup = adminGroups.find(g => 
    g.defaultTab === currentTab || 
    g.subTabs.some(st => st.id === currentTab || (st.children && st.children.some(c => c.id === currentTab)))
  );
  if (!activeGroup) {
    if (['tab-store', 'tab-store-register', 'tab-store-orders', 'tab-store-categories', 'tab-orders', 'tab-vouchers'].includes(currentTab)) activeGroup = adminGroups[1];
    else if (['tab-study-articles', 'tab-study-write', 'tab-study-categories', 'tab-study', 'tab-seo-wiki-hub'].includes(currentTab)) activeGroup = adminGroups[2];
    else if (currentTab === 'tab-products') activeGroup = adminGroups[5];
    else activeGroup = adminGroups[0];
  }

  // 3단계 자식 탭 및 2단계 서브탭 찾기
  let matchedSubGroup: any = null;
  let matchedLeafTab: any = null;

  for (const st of activeGroup.subTabs) {
    if (st.id === currentTab) {
      matchedLeafTab = st;
      break;
    }
    if ((st as any).children) {
      const child = (st as any).children.find((c: any) => c.id === currentTab || (c.id === 'tab-store-orders' && currentTab === 'tab-orders'));
      if (child) {
        matchedSubGroup = st;
        matchedLeafTab = child;
        break;
      }
    }
  }

  const currentTabLabel = matchedLeafTab ? matchedLeafTab.label : (matchedSubGroup ? matchedSubGroup.label : activeGroup.label);

  return `
  <div class="admin-dashboard-container" style="max-width: 1360px; width: 100%; margin: 0 auto; padding: 1rem 0.75rem 5rem; font-family: var(--font-body); box-sizing: border-box;">
  
  <!-- 워드프레스 스타일 2컬럼 레이아웃 래퍼 -->
  <div class="wp-admin-wrapper">
  
  <!-- 모바일 드로어용 백드롭 오버레이 -->
  <div class="wp-admin-backdrop" id="wp-admin-backdrop"></div>

  <!-- [좌측 1차 대주제 사이드바] -->
  <aside class="wp-admin-sidebar" id="wp-admin-sidebar">
    <!-- 사이드바 상단 브랜딩 & 모바일 닫기 버튼 -->
    <div class="wp-admin-sidebar-header" style="display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 0.65rem; cursor: pointer;" class="btn-admin-header-home">
        <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); display: flex; align-items: center; justify-content: center; color: #fff;">
          <span class="material-symbols-outlined" style="font-size: 20px;">admin_panel_settings</span>
        </div>
        <div>
          <div style="font-family: var(--font-serif); font-size: 1.05rem; font-weight: 800; color: #dfe2f1; line-height: 1.15; display: flex; align-items: center; gap: 0.45rem;">
            마보살 관리자
            <span style="font-size: 0.65rem; font-family: var(--font-mono, monospace); font-weight: 700; background: rgba(255, 255, 255, 0.08); color: #e2e8f0; border: 1px solid rgba(255, 255, 255, 0.15); padding: 0.08rem 0.38rem; border-radius: 4px; letter-spacing: 0.02em;">v1.8.5</span>
          </div>
          <div style="font-size: 0.68rem; color: var(--text-muted); font-family: var(--font-mono); letter-spacing: 0.05em;">ADMIN CONTROL TOWER</div>
        </div>
      </div>
      <!-- 모바일 드로어 전용 닫기 버튼 (모바일 화면에서만 노출) -->
      <button type="button" class="wp-admin-drawer-close" id="btn-admin-drawer-close" aria-label="메뉴 닫기" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; width: 32px; height: 32px; display: none; align-items: center; justify-content: center; color: #cbd5e1; cursor: pointer;">
        <span class="material-symbols-outlined" style="font-size: 20px;">close</span>
      </button>
    </div>

    <!-- 좌측 상위 대주제 및 서브 카테고리 아코디언 메뉴 리스트 (클릭 시 펼침/닫힘) -->
    <ul class="wp-admin-menu-list" style="margin: 0; padding: 0.5rem; list-style: none; display: flex; flex-direction: column; gap: 0.4rem;">
      ${adminGroups.map(group => {
        const isGroupActive = activeGroup.id === group.id;
        const isExpanded = expandedAdminGroupIds.has(group.id) || isGroupActive;

        return `
        <li class="admin-menu-group" style="display: flex; flex-direction: column; gap: 0.15rem;">
          <!-- 1차 대주제 버튼 (서브메뉴 없으면 즉시 이동, 있으면 아코디언 토글) -->
          <div class="wp-admin-menu-btn ${group.subTabs.length === 0 ? 'admin-tab-btn' : 'btn-toggle-admin-group'} ${isGroupActive ? 'active' : ''}" ${group.subTabs.length === 0 ? `data-tab="${group.defaultTab}"` : `data-group-id="${group.id}" data-default-tab="${group.defaultTab}"`} style="border-left: 3px solid ${isGroupActive ? '#ffffff' : 'transparent'}; background: ${isGroupActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent'}; display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.85rem; border-radius: 8px; cursor: pointer; transition: all 0.15s ease; user-select: none;">
            <div style="display: flex; align-items: center; gap: 0.45rem;">
              <span style="font-weight: ${isGroupActive ? '800' : '700'}; font-size: 0.95rem; color: ${isGroupActive ? '#fff' : '#cbd5e1'}; letter-spacing: -0.01em;">${group.label}</span>
              ${group.id === 'group-support' && pendingInquiriesCount > 0 ? `
                <span style="background: #ef4444; color: #fff; font-size: 0.65rem; font-weight: 800; padding: 0.1rem 0.4rem; border-radius: 9999px;">
                  ${pendingInquiriesCount}
                </span>
              ` : ''}
            </div>
            ${group.subTabs.length > 0 ? `
              <span style="font-size: 0.72rem; color: ${isExpanded ? '#ffffff' : 'rgba(255,255,255,0.35)'}; font-family: monospace;">
                ${isExpanded ? '▼' : '▶'}
              </span>
            ` : ''}
          </div>

          <!-- 2차 서브 카테고리 목록 (아코디언 펼쳐졌을 때만 노출) -->
          ${isExpanded ? `
            <ul class="admin-sub-menu-list" style="margin: 0.15rem 0 0.35rem 0; padding: 0 0 0 0.85rem; list-style: none; display: flex; flex-direction: column; gap: 0.2rem; border-left: 1px dashed rgba(255, 255, 255, 0.15); margin-left: 1rem;">
              ${group.subTabs.map((st: any) => {
                // [3단 계층: 상품관리 -> 상품목록, 상품등록, 결제장부]
                if (st.children && st.children.length > 0) {
                  const isSubGroupActive = st.children.some((c: any) => c.id === currentTab);
                  const isSubGroupExpanded = subGroupToggleState.has(st.id) ? subGroupToggleState.get(st.id)! : (st.id === 'subgroup-store' || st.id === 'subgroup-study' || isSubGroupActive);

                  return `
                  <li style="display: flex; flex-direction: column; gap: 0.15rem;">
                    <!-- 2단: 상품관리 아코디언 토글 버튼 -->
                    <div class="btn-toggle-admin-subgroup ${isSubGroupActive ? 'active' : ''}" data-subgroup-id="${st.id}" data-default-tab="${st.defaultTab || st.children[0].id}" style="display: flex; align-items: center; justify-content: space-between; padding: 0.42rem 0.65rem; border-radius: 6px; font-size: 0.84rem; font-weight: ${isSubGroupActive ? '800' : '600'}; color: ${isSubGroupActive ? '#ffffff' : '#cbd5e1'}; background: ${isSubGroupActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent'}; border: 1px solid ${isSubGroupActive ? 'rgba(255,255,255,0.18)' : 'transparent'}; cursor: pointer; transition: all 0.15s ease; user-select: none;">
                      <div style="display: flex; align-items: center; gap: 0.4rem;">
                        <span class="material-symbols-outlined" style="font-size: 16px; color: ${isSubGroupActive ? 'var(--primary)' : 'var(--text-muted)'};">${st.id === 'subgroup-study' ? 'menu_book' : 'inventory_2'}</span>
                        <span>${st.label}</span>
                      </div>
                      <span style="font-size: 0.65rem; color: ${isSubGroupExpanded ? '#ffffff' : 'rgba(255,255,255,0.35)'}; font-family: monospace;">
                        ${isSubGroupExpanded ? '▼' : '▶'}
                      </span>
                    </div>

                    <!-- 3단: 상품목록, 상품등록, 결제장부 목록 -->
                    ${isSubGroupExpanded ? `
                      <ul class="admin-third-menu-list" style="margin: 0.15rem 0 0.25rem 0; padding: 0 0 0 0.75rem; list-style: none; display: flex; flex-direction: column; gap: 0.15rem; border-left: 1px dotted rgba(255, 255, 255, 0.2); margin-left: 0.65rem;">
                        ${st.children.map((child: any) => {
                          const isChildActive = currentTab === child.id || (child.id === 'tab-store-orders' && currentTab === 'tab-orders');
                          return `
                            <li>
                              <button type="button" class="admin-tab-btn third-nav-btn ${isChildActive ? 'active' : ''}" data-tab="${child.id}" style="width: 100%; text-align: left; display: block; padding: 0.35rem 0.65rem; border-radius: 5px; font-size: 0.8rem; font-weight: ${isChildActive ? '800' : '500'}; border: 1px solid ${isChildActive ? 'rgba(242, 202, 80, 0.35)' : 'transparent'}; background: ${isChildActive ? 'rgba(242, 202, 80, 0.12)' : 'transparent'}; color: ${isChildActive ? 'var(--primary)' : '#94a3b8'}; cursor: pointer; transition: all 0.15s ease;">
                                • ${child.label}
                              </button>
                            </li>
                          `;
                        }).join('')}
                      </ul>
                    ` : ''}
                  </li>
                  `;
                }

                const isSubActive = currentTab === st.id;
                return `
                <li>
                  <button type="button" class="admin-tab-btn sub-nav-btn ${isSubActive ? 'active' : ''}" data-tab="${st.id}" style="width: 100%; text-align: left; display: block; padding: 0.42rem 0.75rem; border-radius: 6px; font-size: 0.84rem; font-weight: ${isSubActive ? '800' : '500'}; border: 1px solid ${isSubActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent'}; background: ${isSubActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent'}; color: ${isSubActive ? '#ffffff' : '#94a3b8'}; cursor: pointer; transition: all 0.15s ease;">
                    ${st.label}
                  </button>
                </li>
                `;
              }).join('')}
            </ul>
          ` : ''}
        </li>
        `;
      }).join('')}
    </ul>

    <!-- 사이드바 하단 바로가기 및 유틸리티 버튼 -->
    <div style="padding: 0.85rem 1rem; border-top: 1px solid rgba(255, 255, 255, 0.08); background: rgba(0, 0, 0, 0.25); margin-top: auto; display: flex; flex-direction: column; gap: 0.45rem;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem;">
        <a href="/?view=store" target="_blank" style="background: rgba(242,202,80,0.1); border: 1px solid rgba(242,202,80,0.25); color: var(--primary); padding: 0.4rem 0.5rem; border-radius: 6px; font-size: 0.72rem; font-weight: 700; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 0.25rem;">
          <span class="material-symbols-outlined" style="font-size: 14px;">storefront</span>
          스토어
        </a>
        <button type="button" id="btn-admin-reset-defaults" style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.15); color: #cbd5e1; border-radius: 6px; padding: 0.4rem 0.5rem; font-size: 0.72rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.25rem;">
          <span class="material-symbols-outlined" style="font-size: 14px;">refresh</span>
          초기화
        </button>
      </div>

      <button type="button" id="btn-admin-to-service" class="btn-cta-primary" style="width: 100%; padding: 0.55rem 0.8rem; font-size: 0.8rem; font-weight: 700; border-radius: 6px; justify-content: center; gap: 0.35rem;">
        <span class="material-symbols-outlined" style="font-size: 15px;">visibility</span>
        사용자 화면
      </button>

      <div style="font-size: 0.65rem; color: var(--text-muted); text-align: center;">
        Core Engine v2.4 <span style="color: #f2ca50;">● Online</span>
      </div>
    </div>
  </aside>

  <!-- [우측 메인 워크스페이스: 불필요한 상단 topbar 완전 제거] -->
  <main class="wp-admin-workspace">
    <!-- 모바일 전용 좌측 슬라이딩 메뉴 오픈 바 (모바일에서만 보이고 데스크톱에서는 완전 숨김) -->
    <div class="admin-mobile-floating-bar">
      <button type="button" class="admin-mobile-drawer-btn" id="btn-admin-hamburger" aria-label="카테고리 메뉴 열기">
        <span class="material-symbols-outlined" style="font-size: 18px;">menu</span>
        <span>카테고리</span>
      </button>
      <span class="admin-mobile-current-tab-label">${currentTabLabel}</span>
    </div>

    <!-- 내부 콘텐츠 영역 (상단 topbar 제거로 본문 작업 공간 극대화) -->
    <div class="wp-admin-content-area" style="padding: 1.25rem; flex: 1; overflow-y: auto;">
 
        <!-- [패널 -1] 마보살관리자 기본 대시보드 (종합 관제 및 실시간 고객 문의 즉시 대응 센터) -->
        <div id="tab-overview" class="admin-tab-panel" style="display: ${currentTab === 'tab-overview' ? 'block' : 'none'};">
          ${renderAdminOverviewPanel()}
        </div>

 <!-- [패널 0] 사이트 문구 및 브랜딩 설정 (CMS) -->
        <div id="tab-site-content" class="admin-tab-panel" style="display: ${currentTab === 'tab-site-content' ? 'block' : 'none'};">
          <div style="background: var(--surface-container); border: 1.5px solid rgba(242,202,80,0.35); border-radius: 14px; padding: 1.5rem; margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem;">
              <div>
                <div style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.6rem; border-radius: 9999px; background: rgba(242,202,80,0.15); border: 1px solid rgba(242,202,80,0.3); margin-bottom: 0.4rem;">
                  <span class="material-symbols-outlined" style="font-size: 0.85rem; color: var(--primary);">edit_note</span>
                  <span style="font-size: 0.72rem; font-weight: 700; color: var(--primary); letter-spacing: 0.05em;">SITE CONTENT &amp; BRANDING CMS</span>
                </div>
                <h2 style="font-family: var(--font-serif); font-size: 1.25rem; font-weight: 700; color: #dfe2f1; margin: 0 0 0.3rem;">
                  로고, 본문 문구 및 푸터 정보 통합 관리
                </h2>
                <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0;">
                  최고 관리자가 직접 사이트 상단 로고, 메인 화면 본문 히어로 타이틀과 설명문, 그리고 하단 푸터 사업자 정보를 수정하고 즉시 사이트에 반영할 수 있습니다.
                </p>
              </div>
            </div>

            ${(() => {
              const cms = SiteContentStore.getConfig();
              return `
              <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                
                <!-- 1. 상단 로고 & 브랜딩 -->
                <div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 1.25rem;">
                  <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--primary); margin: 0 0 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
                    <span class="material-symbols-outlined" style="font-size: 18px;">branding_watermark</span>
                    1. 상단 헤더 로고 및 브랜드 구성
                  </h3>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem;">
                    <div>
                      <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem;">브랜드명 (로고 텍스트)</label>
                      <input type="text" id="input-cms-brand-name" value="${cms.header.brandName}" style="width: 100%; background: #181c28; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.75rem; color: #dfe2f1; font-size: 0.85rem;" />
                    </div>
                    <div>
                      <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem;">도메인 표시 문구</label>
                      <input type="text" id="input-cms-domain-text" value="${cms.header.domainText}" style="width: 100%; background: #181c28; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.75rem; color: #dfe2f1; font-size: 0.85rem;" />
                    </div>
                  </div>
                </div>

                <!-- 2. 메인 화면 본문 히어로 -->
                <div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 1.25rem;">
                  <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--primary); margin: 0 0 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
                    <span class="material-symbols-outlined" style="font-size: 18px;">title</span>
                    2. 메인 화면 본문 히어로 섹션
                  </h3>
                  <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                    <div>
                      <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem;">메인 타이틀 (줄바꿈 가능)</label>
                      <textarea id="input-cms-hero-title" rows="2" style="width: 100%; background: #181c28; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.75rem; color: #dfe2f1; font-size: 0.85rem; resize: vertical;">${cms.hero.mainTitle}</textarea>
                    </div>
                    <div>
                      <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem;">서브 배지 문구</label>
                      <input type="text" id="input-cms-hero-subpill" value="${cms.hero.subPill}" style="width: 100%; background: #181c28; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.75rem; color: #dfe2f1; font-size: 0.85rem;" />
                    </div>
                    <div>
                      <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem;">상세 설명문</label>
                      <textarea id="input-cms-hero-desc" rows="3" style="width: 100%; background: #181c28; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.75rem; color: #dfe2f1; font-size: 0.85rem; resize: vertical;">${cms.hero.description}</textarea>
                    </div>
                  </div>
                </div>

                <!-- 3. 사이트 하단 푸터 기본 정보 -->
                <div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 1.25rem;">
                  <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--primary); margin: 0 0 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
                    <span class="material-symbols-outlined" style="font-size: 18px;">business</span>
                    3. 하단 기본 푸터 정보 (사업자 및 고객센터)
                  </h3>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem;">
                    <div>
                      <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem;">상호명</label>
                      <input type="text" id="input-cms-footer-company" value="${cms.footer.companyName}" style="width: 100%; background: #181c28; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.75rem; color: #dfe2f1; font-size: 0.85rem;" />
                    </div>
                    <div>
                      <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem;">대표자명</label>
                      <input type="text" id="input-cms-footer-ceo" value="${cms.footer.ceoName}" style="width: 100%; background: #181c28; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.75rem; color: #dfe2f1; font-size: 0.85rem;" />
                    </div>
                    <div>
                      <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem;">사업자등록번호</label>
                      <input type="text" id="input-cms-footer-biz" value="${cms.footer.bizNumber}" style="width: 100%; background: #181c28; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.75rem; color: #dfe2f1; font-size: 0.85rem;" />
                    </div>
                    <div>
                      <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem;">통신판매업신고번호</label>
                      <input type="text" id="input-cms-footer-mail" value="${cms.footer.mailOrderNumber}" style="width: 100%; background: #181c28; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.75rem; color: #dfe2f1; font-size: 0.85rem;" />
                    </div>
                    <div>
                      <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem;">사업장 소재지 (주소)</label>
                      <input type="text" id="input-cms-footer-address" value="${cms.footer.address || '부산광역시 사하구 하신번영로 328, 302호 (하단동)'}" style="width: 100%; background: #181c28; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.75rem; color: #dfe2f1; font-size: 0.85rem;" />
                    </div>
                    <div>
                      <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem;">대표 전화번호</label>
                      <input type="text" id="input-cms-footer-phone" value="${cms.footer.phone || '051-208-8746'}" style="width: 100%; background: #181c28; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.75rem; color: #dfe2f1; font-size: 0.85rem;" />
                    </div>
                    <div>
                      <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem;">대표 이메일</label>
                      <input type="email" id="input-cms-footer-email" value="${cms.footer.email || 'anbtiteam@gmail.com'}" style="width: 100%; background: #181c28; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.75rem; color: #dfe2f1; font-size: 0.85rem;" />
                    </div>
                    <div>
                      <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem;">개인정보보호책임자(CPO)</label>
                      <input type="text" id="input-cms-footer-cpo" value="${cms.footer.cpoName || '박경민'}" style="width: 100%; background: #181c28; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.75rem; color: #dfe2f1; font-size: 0.85rem;" />
                    </div>
                    <div>
                      <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem;">호스팅 서비스 제공자</label>
                      <input type="text" id="input-cms-footer-hosting" value="${cms.footer.hostingProvider || '마보살 클라우드 (Vercel & Supabase)'}" style="width: 100%; background: #181c28; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.75rem; color: #dfe2f1; font-size: 0.85rem;" />
                    </div>
                    <div>
                      <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem;">고객센터 연락처 및 운영시간</label>
                      <input type="text" id="input-cms-footer-contact" value="${cms.footer.contactInfo}" style="width: 100%; background: #181c28; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.75rem; color: #dfe2f1; font-size: 0.85rem;" />
                    </div>
                    <div>
                      <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem;">카피라이트 표기</label>
                      <input type="text" id="input-cms-footer-copy" value="${cms.footer.copyright}" style="width: 100%; background: #181c28; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.75rem; color: #dfe2f1; font-size: 0.85rem;" />
                    </div>
                  </div>
                </div>

                <!-- 저장 및 복원 버튼 -->
                <div style="display: flex; gap: 0.75rem; justify-content: flex-end; padding-top: 0.5rem;">
                  <button type="button" id="btn-reset-site-content" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: var(--text-muted); border-radius: 8px; padding: 0.65rem 1.15rem; font-size: 0.85rem; font-weight: 600; cursor: pointer;">
                    기본값으로 복원
                  </button>
                  <button type="button" id="btn-save-site-content" class="btn-cta-primary" style="padding: 0.65rem 1.5rem; font-size: 0.9rem; font-weight: 800; border-radius: 8px; background: var(--primary); color: #241a00; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; box-shadow: 0 4px 14px rgba(242,202,80,0.3);">
                    <span class="material-symbols-outlined" style="font-size: 18px;">save</span>
                    설정 즉시 저장 및 화면 반영
                  </button>
                </div>
              </div>
              `;
            })()}
          </div>
        </div>

        <!-- [패널 1] ️ 서비스 기능 제어 (ON/OFF 원클릭 토글 스위치) -->
 <div id="tab-features" class="admin-tab-panel" style="display: ${currentTab === 'tab-features' ? 'block' : 'none'};">
<!-- 상단 핵심 4대 KPI 요약 카드 그리드 -->
 <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.85rem; margin-bottom: 1.5rem;">
 <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem;">
 <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 0.25rem;">오늘 누적 매출액</div>
 <div style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--primary);">₩ 1,489,200</div>
 <div style="font-size: 0.68rem; color: #f2ca50; margin-top: 0.2rem;">↑ 전일 대비 +28.4%</div>
 </div>
 <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem;">
 <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 0.25rem;">화면 노출 활성 기능</div>
 <div style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: #f2ca50;">${activeModulesCount} <span style="font-size: 0.8rem; color: var(--text-muted);">/ ${allModules.length}개</span></div>
 <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 0.2rem;">원클릭 노출 통제 중</div>
 </div>
 <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem;">
 <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 0.25rem;">판매 중인 상품</div>
 <div style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: #f2ca50;">${activeProductsCount} <span style="font-size: 0.8rem; color: var(--text-muted);">/ ${products.length}개</span></div>
 <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 0.2rem;">정상 노출 중</div>
 </div>
 <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem;">
 <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 0.25rem;">입점 협력사 &amp; 상담사</div>
 <div style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: #f2ca50;">${activeVendorsCount} <span style="font-size: 0.8rem; color: var(--text-muted);">/ ${vendors.length}곳</span></div>
 <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 0.2rem;">제휴 운영 관리</div>
 </div>
 </div>

 <!-- [A/B 테스트 실시간 관제 및 전환 성과 비교 패널] -->
 ${(() => {
   const stats = AbTestService.getConversionRates();
   const isBActive = AbTestService.isFunnelVariantB();
   return `
   <div style="background: linear-gradient(135deg, rgba(30, 27, 75, 0.5), rgba(15, 23, 42, 0.8)); border: 1.5px solid rgba(167, 139, 250, 0.4); border-radius: 14px; padding: 1.5rem; margin-bottom: 1.75rem; box-shadow: 0 8px 30px rgba(0,0,0,0.4);">
     <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;">
       <div>
         <div style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.2rem 0.6rem; border-radius: 9999px; background: rgba(167, 139, 250, 0.15); border: 1px solid rgba(167, 139, 250, 0.3); margin-bottom: 0.4rem;">
           <span class="material-symbols-outlined" style="font-size: 0.85rem; color: #c4b5fd;">conversion_path</span>
           <span style="font-size: 0.72rem; font-weight: 700; color: #c4b5fd; letter-spacing: 0.05em;">A/B TEST &amp; CRO OPTIMIZATION</span>
         </div>
         <h2 style="font-family: var(--font-serif); font-size: 1.25rem; font-weight: 700; color: #dfe2f1; margin: 0 0 0.3rem; display: flex; align-items: center; gap: 0.5rem;">
           A/B 테스트 실시간 성과 관제 (A안 vs B안 구매 전환율 비교)
         </h2>
         <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0;">
           기존 종합 대시보드형(A안)과 구매 전환 전용 단일 퍼널(B안)의 유입·무료진단·유료결제 전환율(CVR)을 실시간 비교 검증합니다.
         </p>
       </div>
       <div style="display: flex; align-items: center; gap: 0.5rem;">
         <a href="/?ab=a" target="_blank" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; padding: 0.4rem 0.75rem; border-radius: 6px; font-size: 0.76rem; text-decoration: none; font-weight: 600;">
           A안 미리보기 ↗
         </a>
         <a href="/?ab=b" target="_blank" style="background: rgba(242,202,80,0.15); border: 1px solid rgba(242,202,80,0.35); color: var(--primary); padding: 0.4rem 0.75rem; border-radius: 6px; font-size: 0.76rem; text-decoration: none; font-weight: 700;">
           B안 미리보기 ↗
         </a>
       </div>
     </div>

     <!-- A안 vs B안 핵심 지표 비교 그리드 -->
     <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem;">
       
       <!-- A안 카드 -->
       <div style="background: rgba(0,0,0,0.3); border: 1.5px solid ${!isBActive ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.08)'}; border-radius: 12px; padding: 1.15rem;">
         <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
           <div style="display: flex; align-items: center; gap: 0.4rem;">
             <span style="font-size: 0.72rem; font-weight: 800; background: rgba(59,130,246,0.2); color: #60a5fa; padding: 0.15rem 0.5rem; border-radius: 4px;">A안 (기존 종합형)</span>
             ${!isBActive ? '<span style="font-size: 0.68rem; color: #4ade80; font-weight: 700;">● 현재 활성</span>' : ''}
           </div>
           <span style="font-size: 0.75rem; color: var(--text-muted);">전통 종합 운세 탐색</span>
         </div>
         <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; text-align: center; margin-bottom: 0.75rem;">
           <div style="background: rgba(255,255,255,0.02); padding: 0.5rem; border-radius: 6px;">
             <div style="font-size: 0.68rem; color: var(--text-muted);">방문자</div>
             <div style="font-size: 1.05rem; font-weight: 800; color: #fff;">${stats.a.visits.toLocaleString()}</div>
           </div>
           <div style="background: rgba(255,255,255,0.02); padding: 0.5rem; border-radius: 6px;">
             <div style="font-size: 0.68rem; color: var(--text-muted);">무료진단</div>
             <div style="font-size: 1.05rem; font-weight: 800; color: #fff;">${stats.a.freeSubmits.toLocaleString()}</div>
             <div style="font-size: 0.62rem; color: #94a3b8;">${stats.a.freeRate}%</div>
           </div>
           <div style="background: rgba(255,255,255,0.02); padding: 0.5rem; border-radius: 6px;">
             <div style="font-size: 0.68rem; color: var(--text-muted);">유료결제</div>
             <div style="font-size: 1.05rem; font-weight: 800; color: #60a5fa;">${stats.a.purchases.toLocaleString()}건</div>
           </div>
           <div style="background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.25); padding: 0.5rem; border-radius: 6px;">
             <div style="font-size: 0.68rem; color: #93c5fd; font-weight: 700;">전환율 CVR</div>
             <div style="font-size: 1.25rem; font-weight: 900; color: #60a5fa;">${stats.a.cvr}%</div>
           </div>
         </div>
         <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; justify-content: space-between;">
           <span>누적 매출: ₩ ${stats.a.totalRevenue.toLocaleString()}</span>
           <span>다양한 메뉴/상품군 노출</span>
         </div>
       </div>

       <!-- B안 카드 -->
       <div style="background: rgba(0,0,0,0.3); border: 1.5px solid ${isBActive ? 'var(--primary)' : 'rgba(255,255,255,0.08)'}; border-radius: 12px; padding: 1.15rem;">
         <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
           <div style="display: flex; align-items: center; gap: 0.4rem;">
             <span style="font-size: 0.72rem; font-weight: 800; background: rgba(242,202,80,0.2); color: var(--primary); padding: 0.15rem 0.5rem; border-radius: 4px;">B안 (단일 전환 킬러 퍼널)</span>
             ${isBActive ? '<span style="font-size: 0.68rem; color: #f2ca50; font-weight: 700;">● 현재 활성</span>' : ''}
           </div>
           <span style="font-size: 0.75rem; color: var(--primary); font-weight: 700;">고민 타격 ➔ 무료 ➔ 유료 39,900</span>
         </div>
         <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; text-align: center; margin-bottom: 0.75rem;">
           <div style="background: rgba(255,255,255,0.02); padding: 0.5rem; border-radius: 6px;">
             <div style="font-size: 0.68rem; color: var(--text-muted);">방문자</div>
             <div style="font-size: 1.05rem; font-weight: 800; color: #fff;">${stats.b.visits.toLocaleString()}</div>
           </div>
           <div style="background: rgba(255,255,255,0.02); padding: 0.5rem; border-radius: 6px;">
             <div style="font-size: 0.68rem; color: var(--text-muted);">무료진단</div>
             <div style="font-size: 1.05rem; font-weight: 800; color: #fff;">${stats.b.freeSubmits.toLocaleString()}</div>
             <div style="font-size: 0.62rem; color: #f2ca50;">${stats.b.freeRate}%</div>
           </div>
           <div style="background: rgba(255,255,255,0.02); padding: 0.5rem; border-radius: 6px;">
             <div style="font-size: 0.68rem; color: var(--text-muted);">유료결제</div>
             <div style="font-size: 1.05rem; font-weight: 800; color: var(--primary);">${stats.b.purchases.toLocaleString()}건</div>
           </div>
           <div style="background: rgba(242,202,80,0.12); border: 1px solid rgba(242,202,80,0.35); padding: 0.5rem; border-radius: 6px;">
             <div style="font-size: 0.68rem; color: var(--primary); font-weight: 700;">전환율 CVR</div>
             <div style="font-size: 1.25rem; font-weight: 900; color: var(--primary);">${stats.b.cvr}%</div>
           </div>
         </div>
         <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; justify-content: space-between;">
           <span>누적 매출: ₩ ${stats.b.totalRevenue.toLocaleString()}</span>
           <span style="color: var(--primary); font-weight: 700;">전환율 약 +3.4배 상승 기록</span>
         </div>
       </div>

     </div>
   </div>
   `;
 })()}

 <!-- [1. 중간 단계: 핵심 비즈니스 마스터 서비스 제어 (Master Service Control Layer)] -->
 <div style="background: linear-gradient(135deg, rgba(28,31,42,0.95), rgba(20,23,34,0.95)); border: 1.5px solid rgba(242,202,80,0.4); border-radius: 14px; padding: 1.5rem; margin-bottom: 1.75rem; box-shadow: 0 8px 30px rgba(0,0,0,0.4);">
 <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.25rem;">
 <div>
 <div style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.2rem 0.6rem; border-radius: 9999px; background: rgba(242,202,80,0.15); border: 1px solid rgba(242,202,80,0.3); margin-bottom: 0.4rem;">
 <span class="material-symbols-outlined" style="font-size: 0.85rem; color: var(--primary);">stars</span>
 <span style="font-size: 0.72rem; font-weight: 700; color: var(--primary); letter-spacing: 0.05em;">INTERMEDIATE CONTROL LAYER</span>
 </div>
 <h2 style="font-family: var(--font-serif); font-size: 1.25rem; font-weight: 700; color: #dfe2f1; margin: 0 0 0.3rem; display: flex; align-items: center; gap: 0.5rem;">
 <span class="material-symbols-outlined" style="color: var(--primary);">tune</span>
 핵심 서비스 마스터 기능 제어 (중간 단계 제어탑)
 </h2>
 <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
 세부 모듈 앞단에서 <strong>엽전 기능, 협력업체, 제휴 파트너스, 정산 관리, 일일 리텐션</strong> 등 핵심 비즈니스 기능을 통째로 삽입하거나 즉시 제거합니다.
 </p>
 </div>
 <div style="text-align: right;">
 <span style="font-size: 0.75rem; color: var(--text-muted);">활성 마스터 기능</span>
 <div style="font-size: 1.25rem; font-weight: 800; color: var(--primary);">${activeMasterCount} / ${masterToggles.length}</div>
 </div>
 </div>

 <!-- 마스터 기능 제어 카드 그리드 -->
 <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
 ${masterToggles.map(mt => `
 <div style="background: ${mt.enabled ? 'rgba(242,202,80,0.04)' : 'rgba(255,255,255,0.02)'}; border: 1.5px solid ${mt.enabled ? 'rgba(242,202,80,0.45)' : 'rgba(255,255,255,0.08)'}; border-radius: 12px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.85rem; transition: border-color 0.2s;">
 <div>
 <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
 <div style="display: flex; align-items: center; gap: 0.5rem;">
 <div style="width: 34px; height: 34px; border-radius: 8px; background: ${mt.enabled ? 'rgba(242,202,80,0.18)' : 'rgba(255,255,255,0.05)'}; display: flex; align-items: center; justify-content: center;">
 <span class="material-symbols-outlined" style="font-size: 1.15rem; color: ${mt.enabled ? 'var(--primary)' : 'var(--text-muted)'};">${mt.icon}</span>
 </div>
 <div>
 <span style="font-size: 0.68rem; font-weight: 700; color: ${mt.enabled ? 'var(--primary)' : 'var(--text-muted)'};">[${mt.category}]</span>
 <h4 style="font-size: 0.98rem; font-weight: 700; color: #dfe2f1; margin: 0.1rem 0 0;">${mt.title}</h4>
 </div>
 </div>
 </div>
 <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.45; margin: 0.35rem 0 0;">
 ${mt.description}
 </p>
 </div>

 <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
 <span style="font-size: 0.74rem; font-weight: 700; color: ${mt.enabled ? '#f2ca50' : '#e2e8f0'}; display: flex; align-items: center; gap: 0.3rem;">
 <span class="material-symbols-outlined" style="font-size: 0.9rem;">${mt.enabled ? 'check_circle' : 'do_not_disturb_on'}</span>
 ${mt.enabled ? '기능 탑재 (ON)' : '기능 제거 (OFF)'}
 </span>

 <!-- 마스터 토글 스위치 -->
 <label style="position: relative; display: inline-block; width: 48px; height: 26px; cursor: pointer;" title="${mt.title} 삽입/제거">
 <input type="checkbox" class="admin-master-toggle" data-master-key="${mt.key}" ${mt.enabled ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
 <span style="position: absolute; cursor: pointer; inset: 0; background-color: ${mt.enabled ? 'var(--primary)' : 'rgba(255,255,255,0.18)'}; border-radius: 26px; transition: .25s;">
 <span style="position: absolute; content: ''; height: 20px; width: 20px; left: ${mt.enabled ? '24px' : '3px'}; bottom: 3px; background-color: #0f131d; border-radius: 50%; transition: .25s; box-shadow: 0 2px 4px rgba(0,0,0,0.4);"></span>
 </span>
 </label>
 </div>
 </div>
 `).join('')}
 </div>
 </div>

 <!-- [2. 세부 분류: 모듈별 미세 제어 (Micro Feature Toggles)] -->
 <div style="background: var(--surface-container); border: 1px solid rgba(167,139,250,0.35); border-radius: 14px; padding: 1.5rem; margin-bottom: 1.5rem;">
 <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;">
 <div>
 <h2 style="font-family: var(--font-serif); font-size: 1.15rem; font-weight: 700; color: #dfe2f1; margin: 0 0 0.25rem; display: flex; align-items: center; gap: 0.4rem;">
 <span class="material-symbols-outlined" style="color: #f2ca50;">tune</span>
 세부 모듈별 미세 노출 제어 (마이크로 스위치)
 </h2>
 <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0;">
 엔진 및 시각화 대시보드의 개별 컴포넌트 단위로 노출 여부를 미세 조정합니다.
 </p>
 </div>
 <div>
 <span style="font-size: 0.75rem; color: var(--text-muted);">활성 모듈</span>
 <span style="font-size: 1rem; font-weight: 700; color: #f2ca50; margin-left: 0.35rem;">${activeModulesCount} / ${allModules.length}</span>
 </div>
 </div>

 <!-- 모듈 카드 그리드 -->
 <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 0.85rem;">
 ${allModules.map(mod => `
 <div style="background: var(--surface-container-low); border: 1px solid ${mod.enabled ? 'rgba(167,139,250,0.35)' : 'rgba(255,255,255,0.06)'}; border-radius: 12px; padding: 1.1rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.75rem;">
 <div>
 <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
 <div style="display: flex; align-items: center; gap: 0.35rem;">
 <span style="font-size: 0.68rem; padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 700; background: ${mod.category === 'ui_feature_toggle' ? 'rgba(242,202,80,0.15)' : 'rgba(242, 202, 80, 0.15)'}; color: ${mod.category === 'ui_feature_toggle' ? 'var(--primary)' : '#f2ca50'};">
 ${mod.category === 'ui_feature_toggle' ? 'UI 제어' : mod.category}
 </span>
 <h4 style="font-size: 0.95rem; font-weight: 700; color: #dfe2f1; margin: 0;">${mod.name}</h4>
 </div>
 <span style="font-size: 0.7rem; padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 700; background: ${mod.enabled ? 'rgba(242, 202, 80, 0.15)' : 'rgba(248,113,113,0.15)'}; color: ${mod.enabled ? '#f2ca50' : '#e2e8f0'};">
 ${mod.enabled ? '화면 노출 ON' : '화면 숨김 OFF'}
 </span>
 </div>
 <p style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.4; margin: 0.25rem 0 0;">
 ${mod.description}
 </p>
 <div style="display: gap: 0.3rem; margin-top: 0.45rem; flex-wrap: wrap;">
 ${mod.tags.map(t => `<span style="font-size: 0.66rem; color: var(--text-muted); background: rgba(255,255,255,0.04); padding: 0.1rem 0.3rem; border-radius: 3px;">#${t}</span>`).join('')}
 </div>
 </div>

 <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.65rem; display: flex; justify-content: space-between; align-items: center;">
 <span style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace;">
 ${mod.id}
 </span>

 <!-- 토글 스위치 -->
 <label style="position: relative; display: inline-block; width: 44px; height: 24px; cursor: pointer;" title="화면 노출 ON / OFF">
 <input type="checkbox" class="admin-module-toggle" data-module-id="${mod.id}" ${mod.enabled ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
 <span style="position: absolute; cursor: pointer; inset: 0; background-color: ${mod.enabled ? 'var(--primary)' : 'rgba(255,255,255,0.2)'}; border-radius: 24px; transition: .3s; display: flex; align-items: center;">
 <span style="position: absolute; content: ''; height: 18px; width: 18px; left: ${mod.enabled ? '23px' : '3px'}; bottom: 3px; background-color: #0f131d; border-radius: 50%; transition: .3s;"></span>
 </span>
 </label>
 </div>
 </div>
 `).join('')}
 </div>
 </div>
 </div>

 <!-- [패널 2] ️ 판매 상품 관리 -->
 <div id="tab-products" class="admin-tab-panel" style="display: ${currentTab === 'tab-products' ? 'block' : 'none'};">
 <!-- 신규 상품 등록 폼 -->
 <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.25rem;">
 <h2 style="font-family: var(--font-serif); font-size: 1.15rem; font-weight: 700; color: #dfe2f1; margin: 0 0 1rem; display: flex; align-items: center; gap: 0.4rem;">
 <span class="material-symbols-outlined" style="color: #fff;">add_circle</span>
 신규 판매 상품 추가하기
 </h2>
 <form id="form-add-product" onsubmit="return false;" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
 <div>
 <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">상품명</label>
 <input type="text" id="new-prod-title" placeholder="예: 2027 정미년 신년운세" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.5rem 0.7rem; color: #dfe2f1; font-size: 0.85rem;" required />
 </div>
 <div>
 <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">티어 식별자 (Tier ID)</label>
 <input type="text" id="new-prod-tier" placeholder="예: NEWYEAR2027" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.5rem 0.7rem; color: #dfe2f1; font-size: 0.85rem;" required />
 </div>
 <div>
 <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">판매 가격 (원)</label>
 <input type="number" id="new-prod-price" placeholder="49900" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.5rem 0.7rem; color: #dfe2f1; font-size: 0.85rem;" required />
 </div>
 <div>
 <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">정가 (원)</label>
 <input type="number" id="new-prod-original-price" placeholder="90000" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.5rem 0.7rem; color: #dfe2f1; font-size: 0.85rem;" />
 </div>
 <div>
 <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">분류</label>
 <select id="new-prod-category" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.5rem 0.7rem; color: #dfe2f1; font-size: 0.85rem;">
 <option value="core">기본 핵심 상품</option>
 <option value="specialized">특화 분석 상품</option>
 <option value="seasonal">시즌/신년 기획</option>
 </select>
 </div>
 <div>
 <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">뱃지 (선택)</label>
 <input type="text" id="new-prod-badge" placeholder="예: NEW, HOT" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.5rem 0.7rem; color: #dfe2f1; font-size: 0.85rem;" />
 </div>
 <div style="grid-column: 1 / -1;">
 <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">상품 상세 설명</label>
 <input type="text" id="new-prod-desc" placeholder="상품에 대한 핵심 해설 및 포함 섹션 요약" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.5rem 0.7rem; color: #dfe2f1; font-size: 0.85rem;" required />
 </div>
 <div style="grid-column: 1 / -1; display: flex; justify-content: flex-end;">
 <button type="submit" id="btn-submit-add-product" style="background: #ffffff; color: #000; font-weight: 800; border: none; padding: 0.5rem 1.25rem; border-radius: 6px; cursor: pointer;" style="padding: 0.6rem 1.4rem; font-weight: 700; font-size: 0.85rem; border-radius: 8px;">
 + 상품 신규 등록 완료
 </button>
 </div>
 </form>
 </div>

 <!-- 등록된 상품 목록 그리드 -->
 <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.5rem;">
 <h2 style="font-family: var(--font-serif); font-size: 1.15rem; font-weight: 700; color: #dfe2f1; margin: 0 0 1rem;">
 등록된 판매 상품 목록
 </h2>
 <div style="display: flex; flex-direction: column; gap: 0.45rem;">
        ${products.map(p => `
          <div class="admin-product-accordion-item" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; overflow: hidden; transition: all 0.15s ease;">
            
            <!-- 닫힘 기본 행 (클릭 시 토글) -->
            <div class="btn-toggle-admin-product" data-target="admin-product-detail-${p.id}" style="padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; cursor: pointer; user-select: none;">
              <div style="display: flex; align-items: center; gap: 0.65rem; min-width: 0; flex: 1;">
                <span style="font-size: 0.7rem; padding: 0.12rem 0.45rem; border-radius: 4px; font-weight: 700; background: ${p.enabled ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'}; color: #fff; border: 1px solid rgba(255, 255, 255, 0.15); white-space: nowrap;">
                  ${p.enabled ? '판매중' : '중단'}
                </span>
                ${p.badge ? `<span style="font-size: 0.68rem; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); color: #cbd5e1; padding: 0.1rem 0.35rem; border-radius: 4px;">${p.badge}</span>` : ''}
                <span style="font-size: 0.88rem; font-weight: 700; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${p.title}
                </span>
                <span style="font-size: 0.74rem; color: #94a3b8; font-family: monospace; white-space: nowrap;">
                  (${p.tierId})
                </span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0;">
                <span style="font-size: 0.88rem; font-weight: 800; color: #fff;">₩ ${p.price.toLocaleString()}</span>
                <span class="material-symbols-outlined" style="font-size: 18px; color: var(--text-muted); transition: transform 0.2s ease;">expand_more</span>
              </div>
            </div>

            <!-- 클릭 시 펼쳐지는 상세 내역 및 제어 스위치 (기본 닫힘) -->
            <div id="admin-product-detail-${p.id}" class="admin-product-detail-content" style="display: none; padding: 1rem; border-top: 1px dashed rgba(255, 255, 255, 0.08); background: rgba(0, 0, 0, 0.25); font-size: 0.82rem; color: #cbd5e1;">
              <p style="margin: 0 0 0.75rem; line-height: 1.5; color: #dfe2f1;">${p.description}</p>
              
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.65rem; flex-wrap: wrap; gap: 0.5rem;">
                <div style="font-size: 0.75rem; color: var(--text-muted);">
                  정가: ₩ ${p.originalPrice.toLocaleString()} | 판매가: ₩ ${p.price.toLocaleString()}
                </div>
                <div style="display: flex; align-items: center; gap: 0.65rem;">
                  <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: #cbd5e1; cursor: pointer;">
                    <span>판매 노출</span>
                    <input type="checkbox" class="product-toggle-btn" data-product-id="${p.id}" ${p.enabled ? 'checked' : ''} style="cursor: pointer;" />
                  </label>
                  <button type="button" class="btn-delete-product" data-product-id="${p.id}" style="background: none; border: 1px solid rgba(255,255,255,0.2); color: #e2e8f0; border-radius: 6px; padding: 0.25rem 0.55rem; font-size: 0.75rem; cursor: pointer;">
                    삭제
                  </button>
                </div>
              </div>
            </div>

          </div>
        `).join('')}
      </div>
    </div>
  </div>

  <!-- [패널 3] 협력업체 & 전문 상담사 관리 -->
 <div id="tab-vendors" class="admin-tab-panel" style="display: ${currentTab === 'tab-vendors' ? 'block' : 'none'};">
 <!-- 신규 협력사 등록 폼 -->
 <div style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 14px; padding: 1.5rem; margin-bottom: 1.5rem;">
 <h2 style="font-family: var(--font-serif); font-size: 1.15rem; font-weight: 700; color: #dfe2f1; margin: 0 0 1rem; display: flex; align-items: center; gap: 0.4rem;">
 <span class="material-symbols-outlined" style="color: #f2ca50;">person_add</span>
 신규 협력업체 / 전문 상담사 등록
 </h2>
 <form id="form-add-vendor" onsubmit="return false;" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
 <div>
 <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">상담사/업체명</label>
 <input type="text" id="new-ven-name" placeholder="예: 백운선생 (白雲)" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.5rem 0.7rem; color: #dfe2f1; font-size: 0.85rem;" required />
 </div>
 <div>
 <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">전문 분야</label>
 <input type="text" id="new-ven-specialty" placeholder="예: 궁합·이별재회·심리상담" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.5rem 0.7rem; color: #dfe2f1; font-size: 0.85rem;" required />
 </div>
 <div>
 <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">제휴 분류</label>
 <select id="new-ven-type" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.5rem 0.7rem; color: #dfe2f1; font-size: 0.85rem;">
 <option value="상담사">1:1 역술 상담사</option>
 <option value="플랫폼">외부 사주 플랫폼</option>
 <option value="크리에이터">유튜브/SNS 인플루언서</option>
 </select>
 </div>
 <div>
 <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">정산 요율</label>
 <input type="text" id="new-ven-rate" placeholder="상담 80% (플랫폼 20%)" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.5rem 0.7rem; color: #dfe2f1; font-size: 0.85rem;" />
 </div>
 <div>
 <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">연락처</label>
 <input type="text" id="new-ven-contact" placeholder="010-0000-0000" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.5rem 0.7rem; color: #dfe2f1; font-size: 0.85rem;" />
 </div>
 <div>
 <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">프로필 사진 URL</label>
 <input type="text" id="new-ven-avatar" placeholder="https://..." style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.5rem 0.7rem; color: #dfe2f1; font-size: 0.85rem;" />
 </div>
 <div style="grid-column: 1 / -1; display: flex; justify-content: flex-end;">
 <button type="submit" id="btn-submit-add-vendor" class="btn-cta-primary" style="padding: 0.6rem 1.4rem; font-weight: 700; font-size: 0.85rem; border-radius: 8px; background: #f2ca50; color: #003640;">
 + 협력업체 제휴 등록 완료
 </button>
 </div>
 </form>
 </div>

 <!-- 입점된 협력사 목록 -->
 <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.5rem;">
 <h2 style="font-family: var(--font-serif); font-size: 1.15rem; font-weight: 700; color: #dfe2f1; margin: 0 0 1rem;">
 입점된 협력업체 및 공인 상담사 목록
 </h2>
 <div style="display: flex; flex-direction: column; gap: 0.75rem;">
 ${vendors.map(v => `
 <div style="background: var(--surface-container-low); border: 1px solid ${v.enabled ? 'rgba(242, 202, 80, 0.3)' : 'rgba(255,255,255,0.06)'}; border-radius: 12px; padding: 0.9rem 1.15rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.85rem;">
 <div style="display: flex; align-items: center; gap: 0.85rem;">
 <img src="${v.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120'}" alt="${v.name}" style="width: 46px; height: 46px; border-radius: 50%; object-fit: cover; border: 2px solid ${v.enabled ? 'var(--primary)' : 'rgba(255,255,255,0.2)'};" />
 <div>
 <div style="display: flex; align-items: center; gap: 0.45rem;">
 <span style="font-size: 0.7rem; padding: 0.12rem 0.45rem; border-radius: 4px; font-weight: 700; background: rgba(242, 202, 80, 0.15); color: #f2ca50; border: 1px solid rgba(242, 202, 80, 0.3);">
 ${v.vendorType}
 </span>
 <h3 style="font-size: 1rem; font-weight: 700; color: #dfe2f1; margin: 0;">
 ${v.name}
 </h3>
 <span style="font-size: 0.75rem; color: #f2ca50;"> ${v.rating}</span>
 </div>
 <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem;">
 ${v.specialty} • 연락처: <strong>${v.contact}</strong>
 </div>
 <div style="font-size: 0.72rem; color: var(--primary); margin-top: 0.1rem;">
 정산: ${v.commissionRate} (상담 ${v.consultationCount.toLocaleString()}건)
 </div>
 </div>
 </div>

 <div style="display: flex; align-items: center; gap: 0.75rem;">
 <span style="font-size: 0.72rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; background: ${v.enabled ? 'rgba(242, 202, 80, 0.15)' : 'rgba(248,113,113,0.15)'}; color: ${v.enabled ? '#f2ca50' : '#e2e8f0'};">
 ${v.enabled ? '노출 중' : '비노출'}
 </span>

 <label style="position: relative; display: inline-block; width: 44px; height: 24px; cursor: pointer;" title="노출 ON / OFF">
 <input type="checkbox" class="vendor-toggle-btn" data-vendor-id="${v.id}" ${v.enabled ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
 <span style="position: absolute; cursor: pointer; inset: 0; background-color: ${v.enabled ? 'var(--primary)' : 'rgba(255,255,255,0.2)'}; border-radius: 24px; transition: .3s; display: flex; align-items: center;">
 <span style="position: absolute; content: ''; height: 18px; width: 18px; left: ${v.enabled ? '23px' : '3px'}; bottom: 3px; background-color: #0f131d; border-radius: 50%; transition: .3s;"></span>
 </span>
 </label>

 <button type="button" class="btn-delete-vendor" data-vendor-id="${v.id}" style="background: rgba(248,113,113,0.15); border: 1px solid rgba(248,113,113,0.3); color: #e2e8f0; border-radius: 8px; padding: 0.35rem 0.6rem; font-size: 0.75rem; cursor: pointer;" title="협력업체 삭제">
 <span class="material-symbols-outlined" style="font-size: 15px; vertical-align: middle;">delete</span>
 삭제
 </button>
 </div>
 </div>
 `).join('')}
 </div>
 </div>
 </div>

 <!-- [패널 4] 실시간 주문 장부 (클릭 시 상세 펼침 아코디언) -->
  <div id="tab-orders" class="admin-tab-panel" style="display: ${currentTab === 'tab-orders' ? 'block' : 'none'};">
    <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.25rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h2 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0;">
            주문 장부
          </h2>
          <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0.2rem 0 0;">
            주문 목록을 클릭하여 상세 내역 및 고객 정보를 확인합니다.
          </p>
        </div>
        <span style="font-size: 0.75rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); padding: 0.2rem 0.6rem; border-radius: 9999px; color: #cbd5e1;">
          총 ${allOrders.length}건
        </span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.45rem;">
        ${allOrders.map((o, idx) => `
          <div class="admin-order-accordion-item" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; overflow: hidden; transition: all 0.15s ease;">
            
            <!-- 닫힘 기본 행 (클릭 시 토글) -->
            <div class="btn-toggle-admin-order" data-target="admin-order-detail-${idx}" style="padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; cursor: pointer; user-select: none;">
              <div style="display: flex; align-items: center; gap: 0.65rem; min-width: 0; flex: 1;">
                <span style="font-size: 0.7rem; padding: 0.12rem 0.45rem; border-radius: 4px; font-weight: 700; background: ${o.status === 'refunded' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.08)'}; color: ${o.status === 'refunded' ? '#f87171' : '#fff'}; border: 1px solid rgba(255, 255, 255, 0.15); white-space: nowrap;">
                  ${o.status === 'refunded' ? '환불' : (o.status === 'completed' ? '결제완료' : '입금대기')}
                </span>
                <span style="font-size: 0.86rem; font-weight: 700; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${o.productTitle}
                </span>
                <span style="font-size: 0.74rem; color: #94a3b8; font-family: monospace; white-space: nowrap;">
                  #${o.orderId.slice(-8)}
                </span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0;">
                <span style="font-size: 0.78rem; color: #cbd5e1;">${o.buyerName || '회원'}</span>
                <span style="font-size: 0.85rem; font-weight: 800; color: #fff;">₩ ${o.amount.toLocaleString()}</span>
                <span style="font-size: 0.74rem; color: var(--text-muted);">${new Date(o.paidAt).toLocaleDateString()}</span>
                <span class="material-symbols-outlined" style="font-size: 18px; color: var(--text-muted); transition: transform 0.2s ease;">expand_more</span>
              </div>
            </div>

            <!-- 클릭 시 펼쳐지는 상세 내역 (기본 닫힘) -->
            <div id="admin-order-detail-${idx}" class="admin-order-detail-content" style="display: none; padding: 1rem; border-top: 1px dashed rgba(255, 255, 255, 0.08); background: rgba(0, 0, 0, 0.25); font-size: 0.8rem; color: #cbd5e1;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.5rem; margin-bottom: 0.65rem;">
                <div>• 전체 주문번호: <strong style="color: #fff; font-family: monospace;">${o.orderId}</strong></div>
                <div>• 결제 수단: <strong style="color: #fff;">${o.paymentMethod === 'bank_transfer' ? '무통장 입금' : '카드 / 간편결제'}</strong></div>
                <div>• 결제 일시: <strong style="color: #fff;">${new Date(o.paidAt).toLocaleString()}</strong></div>
                <div>• 배송/수령 구분: <strong style="color: #fff;">${o.deliveryType === 'shipping' ? '실물 배송 상품' : '디지털 분석 리포트'}</strong></div>
                ${o.shippingAddress ? `<div style="grid-column: 1 / -1;">• 배송지 주소: <strong style="color: #fff;">${o.shippingAddress}</strong></div>` : ''}
              </div>
            </div>

          </div>
        `).join('')}
      </div>
    </div>
  </div>

  <!-- [패널 5] 제휴 정산 & 출금 승인 -->
 <div id="tab-affiliate" class="admin-tab-panel" style="display: ${currentTab === 'tab-affiliate' ? 'block' : 'none'};">

                <!-- 제휴 정산 및 실시간 매출 집중 지표 -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.85rem; margin-bottom: 1.5rem;">
                  <div style="background: var(--surface-container-low); border: 1px solid rgba(242,202,80,0.3); border-radius: 12px; padding: 1.15rem;">
                    <div style="font-size: 0.75rem; color: var(--text-muted);">오늘 누적 매출액</div>
                    <div style="font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; color: var(--primary); margin-top: 0.25rem;">₩ 1,489,200</div>
                    <div style="font-size: 0.7rem; color: #f2ca50; margin-top: 0.25rem;">↑ 전일 대비 +28.4% 달성</div>
                  </div>
                  <div style="background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.15rem;">
                    <div style="font-size: 0.75rem; color: var(--text-muted);">제휴 파트너 출금 대기</div>
                    <div style="font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; color: #ffffff; margin-top: 0.25rem;">₩ 234,000</div>
                    <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem;">2건 즉시 승인 대기 중</div>
                  </div>
                </div>

 <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.5rem;">
 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
 <div>
 <h2 style="font-size: 1.15rem; font-weight: 700; color: #dfe2f1; margin: 0;">
 통합 파트너스 개별 수수료율 부여 및 정산 관리
 </h2>
 <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.25rem 0 0 0;">
 기본 정책: <strong>수수료 미제공 (준비 중)</strong> 상태이며, 최고 관리자가 승인한 파트너에게만 개별 수수료율을 차등 부여합니다.
 </p>
 </div>
 <span style="font-size: 0.72rem; background: rgba(255, 180, 171, 0.15); color: #ffb4ab; border: 1px solid rgba(255, 180, 171, 0.3); padding: 0.2rem 0.6rem; border-radius: 9999px; font-weight: 700;">
 기본 정책: 수수료 미제공 상태로 보호 중
 </span>
 </div>

 <!-- 파트너별 개별 수수료 설정 카드 목록 -->
 <div style="display: flex; flex-direction: column; gap: 0.85rem;" id="partner-commission-list">
 ${(() => {
 const partners = PartnerTracker.getAllPartners();
 return Object.values(partners).map((p) => {
 const isInactive = p.status === 'inactive' || p.commissionRate <= 0;
 return `
 <div class="partner-admin-card" data-partner="${p.partnerCode}" style="background: var(--surface-container-low); border: 1px solid ${isInactive ? 'rgba(255,255,255,0.08)' : 'rgba(242,202,80,0.35)'}; border-radius: 12px; padding: 1.1rem; display: flex; flex-direction: column; gap: 0.75rem;">
 <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
 <div style="display: flex; align-items: center; gap: 0.5rem;">
 <span style="font-size: 0.72rem; color: ${isInactive ? 'var(--text-muted)' : '#f2ca50'}; background: ${isInactive ? 'rgba(255,255,255,0.06)' : 'rgba(242, 202, 80, 0.15)'}; border: 1px solid ${isInactive ? 'rgba(255,255,255,0.12)' : 'rgba(242, 202, 80, 0.3)'}; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 700;">
 ${isInactive ? '수수료 미제공 (비활성)' : `개별 요율 ${(p.commissionRate * 100).toFixed(0)}%`}
 </span>
 <strong style="font-size: 0.95rem; color: #dfe2f1;">${p.partnerCode} (${p.name})</strong>
 </div>
 <div style="font-size: 0.76rem; color: var(--text-muted);">
 누적 클릭: ${p.clicks}회 • 결제 전환: ${p.conversions}건 • 매출: ₩ ${p.totalSalesAmount.toLocaleString()}
 </div>
 </div>

 <!-- 개별 수수료율 설정 폼 -->
 <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; background: rgba(0,0,0,0.25); padding: 0.65rem 0.85rem; border-radius: 8px;">
 <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
 <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">상태:</label>
 <select class="partner-status-select" data-partner="${p.partnerCode}" style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.15); color: #dfe2f1; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.78rem;">
 <option value="inactive" ${p.status === 'inactive' ? 'selected' : ''}>미제공 (수수료 0%)</option>
 <option value="active" ${p.status === 'active' ? 'selected' : ''}>개별 수수료 지급 승인</option>
 </select>

 <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; margin-left: 0.4rem;">수수료율(%):</label>
 <input type="number" min="0" max="100" step="1" value="${(p.commissionRate * 100).toFixed(0)}" class="partner-rate-input" data-partner="${p.partnerCode}" style="width: 65px; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.15); color: #dfe2f1; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.78rem; text-align: right;" />
 <span style="font-size: 0.78rem; color: var(--text-muted);">%</span>
 </div>

 <div style="display: flex; align-items: center; gap: 0.5rem;">
 <button type="button" class="btn-save-partner-rate" data-partner="${p.partnerCode}" style="background: var(--primary); color: #1c1500; border: none; border-radius: 6px; padding: 0.35rem 0.75rem; font-size: 0.76rem; font-weight: 800; cursor: pointer;">
 수수료율 개별 저장
 </button>
 ${p.availablePayout > 0 ? `
 <button type="button" class="btn-approve-payout btn-cta-primary" data-partner="${p.partnerCode}" style="padding: 0.35rem 0.75rem; font-size: 0.76rem; font-weight: 700;">
 ₩ ${p.availablePayout.toLocaleString()} 송금 승인
 </button>
 ` : ''}
 </div>
 </div>
 </div>
 `;
 }).join('');
 })()}
 </div>
 </div>
 </div>
 </div>
 
          <!-- [패널 6] 솔루션 허브 & 6대 버티컬 통제탑 -->
          <!-- [패널 5-2] 인생분석 (사주 엔진 객관화 중간 데이터 창고) -->
          <div id="tab-life-analysis" class="admin-tab-panel" style="display: ${currentTab === 'tab-life-analysis' ? 'block' : 'none'}; width: 100%; box-sizing: border-box;">
            ${renderAdminLifeAnalysisPanel()}
          </div>

          <!-- [신규 패널] SEO 키워드 웹서비스 & 위키 메쉬 관제탑 -->
          <div id="tab-seo-wiki-hub" class="admin-tab-panel" style="display: ${currentTab === 'tab-seo-wiki-hub' ? 'block' : 'none'}; width: 100%; box-sizing: border-box;">
            ${renderAdminSeoWikiHubPanel()}
          </div>

          <div id="tab-solutions" class="admin-tab-panel" style="display: ${currentTab === 'tab-solutions' ? 'block' : 'none'}; width: 100%; box-sizing: border-box;">
            <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; width: 100%; box-sizing: border-box;">
              
              <!-- 상단 헤더 & 설명 -->
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1rem;">
                <div>
                  <h2 style="font-size: 1.25rem; font-weight: 800; color: #dfe2f1; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                    <span class="material-symbols-outlined" style="color: var(--primary);">hub</span>
                    태그 기반 솔루션 오케스트레이터 &amp; 6대 버티컬 통제탑
                  </h2>
                  <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0.35rem 0 0 0;">
                    마보살 엔진 결과를 바탕으로 경제·커리어·주거·정서 등 맞춤 솔루션을 연결하고, 노출·클릭·전환 통계를 실시간 모니터링합니다.
                  </p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                  <button type="button" id="btn-reload-solution-stats" class="btn-refresh-admin" style="background: rgba(255,255,255,0.08); color: #dfe2f1; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.4rem 0.8rem; font-size: 0.78rem; cursor: pointer;">
                    새로고침
                  </button>
                </div>
              </div>

              <!-- 요약 KPI 대시보드 카드 -->
              ${(() => {
                const allSols = getAllSolutions();
                const allParts = getAllPartners();
                const stats = getSolutionStats(allSols, allParts);
                const totalImpressions = stats.reduce((acc, cur) => acc + cur.impressions, 0);
                const totalClicks = stats.reduce((acc, cur) => acc + cur.clicks, 0);
                const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0';
                const appList = getPartnerApplications();

                return `
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.85rem;">
                    <div style="background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 1rem;">
                      <div style="font-size: 0.75rem; color: var(--text-muted);">총 솔루션 / 제휴사</div>
                      <div style="font-size: 1.4rem; font-weight: 800; color: #fff; margin-top: 0.25rem;">${allSols.length}개 / ${allParts.length}곳</div>
                    </div>
                    <div style="background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 1rem;">
                      <div style="font-size: 0.75rem; color: var(--text-muted);">누적 노출 수 (Impressions)</div>
                      <div style="font-size: 1.4rem; font-weight: 800; color: var(--primary); margin-top: 0.25rem;">${totalImpressions.toLocaleString()}회</div>
                    </div>
                    <div style="background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 1rem;">
                      <div style="font-size: 0.75rem; color: var(--text-muted);">누적 클릭 수 (Clicks)</div>
                      <div style="font-size: 1.4rem; font-weight: 800; color: #f2ca50; margin-top: 0.25rem;">${totalClicks.toLocaleString()}회</div>
                    </div>
                    <div style="background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 1rem;">
                      <div style="font-size: 0.75rem; color: var(--text-muted);">평균 클릭률 (CTR)</div>
                      <div style="font-size: 1.4rem; font-weight: 800; color: #dfe2f1; margin-top: 0.25rem;">${avgCtr}%</div>
                    </div>
                    <div style="background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 1rem;">
                      <div style="font-size: 0.75rem; color: var(--text-muted);">입점 신청 대기</div>
                      <div style="font-size: 1.4rem; font-weight: 800; color: #dfe2f1; margin-top: 0.25rem;">${appList.filter(a => a.status === 'pending').length}건</div>
                    </div>
                  </div>
                `;
              })()}

              <!-- 1. 6대 버티컬 노출 스위치 통제 -->
              <div style="background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1.15rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
                  <h3 style="font-size: 1rem; font-weight: 700; color: #dfe2f1; margin: 0;">6대 버티컬 영역 실시간 노출 ON/OFF 스위치</h3>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">ModuleRegistry 연동</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0.75rem;">
                  ${VERTICALS.map(v => {
                    const isEnabled = ModuleRegistry.isEnabled(v.moduleId);
                    return `
                      <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                          <span class="material-symbols-outlined" style="font-size: 18px; color: var(--primary);">${v.icon}</span>
                          <span style="font-size: 0.85rem; font-weight: 600; color: #dfe2f1;">${v.label}</span>
                        </div>
                        <label class="switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">
                          <input type="checkbox" class="solution-vertical-toggle" data-module-id="${v.moduleId}" ${isEnabled ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                          <span style="position: absolute; cursor: pointer; inset: 0; background-color: ${isEnabled ? 'var(--primary)' : 'rgba(255,255,255,0.15)'}; border-radius: 24px; transition: .3s;">
                            <span style="position: absolute; content: ''; height: 18px; width: 18px; left: ${isEnabled ? '23px' : '3px'}; bottom: 3px; background-color: #0f131d; border-radius: 50%; transition: .3s;"></span>
                          </span>
                        </label>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- 2. 솔루션별 노출 & 클릭 성과 분석 표 -->
              <div style="background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1.15rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
                  <h3 style="font-size: 1rem; font-weight: 700; color: #dfe2f1; margin: 0;">등록 솔루션 실시간 노출 및 클릭 통계</h3>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">재노출 쿨다운 7일 자동 적용 중</span>
                </div>
                <div style="overflow-x: auto;">
                  <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.82rem; color: #dfe2f1;">
                    <thead>
                      <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted);">
                        <th style="padding: 0.6rem;">솔루션 명</th>
                        <th style="padding: 0.6rem;">버티컬</th>
                        <th style="padding: 0.6rem;">파트너사</th>
                        <th style="padding: 0.6rem;">노출 수</th>
                        <th style="padding: 0.6rem;">클릭 수</th>
                        <th style="padding: 0.6rem;">클릭률(CTR)</th>
                        <th style="padding: 0.6rem;">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${(() => {
                        const allSols = getAllSolutions();
                        const allParts = getAllPartners();
                        const stats = getSolutionStats(allSols, allParts);
                        if (stats.length === 0) {
                          return '<tr><td colspan="7" style="padding: 1.5rem; text-align: center; color: var(--text-muted);">등록된 솔루션이 없습니다.</td></tr>';
                        }
                        return stats.map(s => {
                          const sol = allSols.find(x => x.id === s.solutionId);
                          const isSample = sol?.isSample;
                          return `
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                              <td style="padding: 0.6rem; font-weight: 700;">${s.title}</td>
                              <td style="padding: 0.6rem;"><span style="background: rgba(242,202,80,0.12); color: var(--primary); padding: 0.15rem 0.45rem; border-radius: 4px; font-size: 0.75rem;">${s.verticalId}</span></td>
                              <td style="padding: 0.6rem; color: #a1a1aa;">${s.partnerName}</td>
                              <td style="padding: 0.6rem; color: var(--primary); font-weight: 600;">${s.impressions.toLocaleString()}회</td>
                              <td style="padding: 0.6rem; color: #f2ca50; font-weight: 600;">${s.clicks.toLocaleString()}회</td>
                              <td style="padding: 0.6rem; color: #dfe2f1; font-weight: 700;">${s.ctr}%</td>
                              <td style="padding: 0.6rem;">
                                <span style="font-size: 0.72rem; padding: 0.15rem 0.45rem; border-radius: 4px; ${isSample ? 'background: rgba(255,255,255,0.08); color: var(--text-muted);' : 'background: rgba(52,211,153,0.15); color: #dfe2f1;'}">
                                  ${isSample ? '샘플(준비중)' : '활성'}
                                </span>
                              </td>
                            </tr>
                          `;
                        }).join('');
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- 3. 신규 솔루션 등록 폼 -->
              <div style="background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1.15rem;">
                <h3 style="font-size: 1rem; font-weight: 700; color: #dfe2f1; margin: 0 0 0.85rem 0;">신규 제휴 솔루션 즉시 등록</h3>
                <form id="admin-add-solution-form" style="display: flex; flex-direction: column; gap: 0.75rem;">
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <div>
                      <label style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">솔루션 명칭 *</label>
                      <input type="text" id="sol-title" required placeholder="예: 1:1 맞춤 재무 포트폴리오 상담" style="width: 100%; box-sizing: border-box; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.45rem 0.65rem; border-radius: 6px; font-size: 0.82rem;" />
                    </div>
                    <div>
                      <label style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">버티컬 분류 *</label>
                      <select id="sol-vertical" style="width: 100%; box-sizing: border-box; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.45rem 0.65rem; border-radius: 6px; font-size: 0.82rem;">
                        <option value="finance">경제 · 재테크</option>
                        <option value="career">커리어 · 창업</option>
                        <option value="home">부동산 · 공간</option>
                        <option value="mind">정서 · 마음돌봄</option>
                        <option value="body">건강 · 체질</option>
                        <option value="legal">법률 · 분쟁</option>
                      </select>
                    </div>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <div>
                      <label style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">파트너/제휴사 명칭 *</label>
                      <input type="text" id="sol-partner-name" required placeholder="예: 미래자산연구소" style="width: 100%; box-sizing: border-box; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.45rem 0.65rem; border-radius: 6px; font-size: 0.82rem;" />
                    </div>
                    <div>
                      <label style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">가격 표기</label>
                      <input type="text" id="sol-price" placeholder="예: ₩ 39,000 또는 무료 진단" style="width: 100%; box-sizing: border-box; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.45rem 0.65rem; border-radius: 6px; font-size: 0.82rem;" />
                    </div>
                  </div>
                  <div>
                    <label style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">한 줄 소개 문구 *</label>
                    <input type="text" id="sol-oneline" required placeholder="예: 손실 위험을 방어하고 안정적인 자산 운용을 돕는 리포트" style="width: 100%; box-sizing: border-box; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.45rem 0.65rem; border-radius: 6px; font-size: 0.82rem;" />
                  </div>
                  <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 0.75rem;">
                    <div>
                      <label style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">제휴 이동 URL</label>
                      <input type="url" id="sol-url" placeholder="https://..." style="width: 100%; box-sizing: border-box; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.45rem 0.65rem; border-radius: 6px; font-size: 0.82rem;" />
                    </div>
                    <div>
                      <label style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">노출 우선순위</label>
                      <input type="number" id="sol-priority" value="10" min="1" max="100" style="width: 100%; box-sizing: border-box; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.45rem 0.65rem; border-radius: 6px; font-size: 0.82rem;" />
                    </div>
                  </div>
                  <div style="text-align: right; margin-top: 0.25rem;">
                    <button type="submit" style="background: var(--primary); color: #1c1500; font-weight: 800; border: none; border-radius: 6px; padding: 0.5rem 1.25rem; font-size: 0.82rem; cursor: pointer;">
                      솔루션 신규 등록
                    </button>
                  </div>
                </form>
              </div>

              <!-- 4. 파트너 입점 신청 접수 현황 -->
              <div style="background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1.15rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
                  <h3 style="font-size: 1rem; font-weight: 700; color: #dfe2f1; margin: 0;">제휴 및 입점 신청 접수 내역</h3>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">고객 화면 '입점 신청' 폼 연동</span>
                </div>
                <div style="overflow-x: auto;">
                  <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.82rem; color: #dfe2f1;">
                    <thead>
                      <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted);">
                        <th style="padding: 0.6rem;">신청ID</th>
                        <th style="padding: 0.6rem;">업체명</th>
                        <th style="padding: 0.6rem;">담당자 / 연락처</th>
                        <th style="padding: 0.6rem;">제안 버티컬 / 솔루션명</th>
                        <th style="padding: 0.6rem;">신청일시</th>
                        <th style="padding: 0.6rem;">상태</th>
                        <th style="padding: 0.6rem;">조치</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${(() => {
                        const appList = getPartnerApplications();
                        if (appList.length === 0) {
                          return '<tr><td colspan="7" style="padding: 1.5rem; text-align: center; color: var(--text-muted);">접수된 입점 신청 내역이 없습니다.</td></tr>';
                        }
                        return appList.map(a => {
                          return `
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                              <td style="padding: 0.6rem; font-family: monospace;">${a.id}</td>
                              <td style="padding: 0.6rem; font-weight: 700;">${a.partnerName}</td>
                              <td style="padding: 0.6rem;">${a.contactName} (${a.phone})</td>
                              <td style="padding: 0.6rem;">[${a.verticalId}] ${a.solutionTitle}</td>
                              <td style="padding: 0.6rem; color: var(--text-muted); font-size: 0.75rem;">${new Date(a.submittedAt).toLocaleDateString()}</td>
                              <td style="padding: 0.6rem;">
                                <span style="font-size: 0.72rem; padding: 0.15rem 0.45rem; border-radius: 4px; ${a.status === 'approved' ? 'background: rgba(52,211,153,0.15); color: #dfe2f1;' : a.status === 'rejected' ? 'background: rgba(248,113,113,0.15); color: #e2e8f0;' : 'background: rgba(242,202,80,0.15); color: #f2ca50;'}">
                                  ${a.status === 'approved' ? '승인됨' : a.status === 'rejected' ? '반려됨' : '대기중'}
                                </span>
                              </td>
                              <td style="padding: 0.6rem;">
                                <button type="button" class="btn-approve-app" data-app-id="${a.id}" style="background: rgba(52,211,153,0.15); border: 1px solid rgba(52,211,153,0.3); color: #dfe2f1; font-size: 0.72rem; padding: 0.2rem 0.5rem; border-radius: 4px; cursor: pointer; margin-right: 0.3rem;">승인</button>
                                <button type="button" class="btn-reject-app" data-app-id="${a.id}" style="background: rgba(248,113,113,0.15); border: 1px solid rgba(248,113,113,0.3); color: #e2e8f0; font-size: 0.72rem; padding: 0.2rem 0.5rem; border-radius: 4px; cursor: pointer;">반려</button>
                              </td>
                            </tr>
                          `;
                        }).join('');
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>


          <!-- [패널 7] 스토어 상품 관리 CMS & 실시간 주문 장부 -->
          <!-- [결제 연동 설정 패널] -->
          <div id="tab-payments" class="admin-tab-panel" style="display: ${currentTab === 'tab-payments' ? 'block' : 'none'}; width: 100%; box-sizing: border-box;">
            ${renderAdminPaymentPanel()}
          </div>

          <!-- [무통장 입금 승인 독립 패널] -->
          <div id="tab-transfers" class="admin-tab-panel" style="display: ${currentTab === 'tab-transfers' ? 'block' : 'none'}; width: 100%; box-sizing: border-box;">
            ${renderAdminBankTransferPanel()}
          </div>

          <!-- [쿠폰 관리 독립 패널] -->
          <div id="tab-coupons" class="admin-tab-panel" style="display: ${currentTab === 'tab-coupons' ? 'block' : 'none'}; width: 100%; box-sizing: border-box;">
            ${renderAdminCouponPanel()}
          </div>

          <!-- [쿠폰 & 무통장 입금 승인 센터 패널 (하위 호환)] -->
          <div id="tab-vouchers" class="admin-tab-panel" style="display: ${currentTab === 'tab-vouchers' ? 'block' : 'none'}; width: 100%; box-sizing: border-box;">
            ${renderAdminVoucherPanel()}
          </div>

          <div id="tab-store" class="admin-tab-panel" style="display: ${['tab-store', 'tab-store-register', 'tab-store-orders', 'tab-store-categories'].includes(currentTab) ? 'block' : 'none'}; width: 100%; box-sizing: border-box;">
            ${renderAdminStorePanel(activeEditingStoreProductId, currentTab === 'tab-store-register' ? 'register' : (currentTab === 'tab-store-orders' ? 'orders' : (currentTab === 'tab-store-categories' ? 'categories' : 'products')))}
          </div>

          <!-- [컨텐츠 > 스터디 3대 서브카테고리 독립 패널 워크스페이스] -->
          ${renderAdminStudyWorkspace(currentTab)}
          

        <!-- [패널 10] 1:1 고객 문의 관리 센터 -->
        <div id="tab-inquiries" class="admin-tab-panel" style="display: ${currentTab === 'tab-inquiries' ? 'block' : 'none'};">
          ${renderAdminInquiriesPanel()}
        </div>

        <!-- [패널 11] 스토어 상품 구매 후기(리뷰) 관리 센터 -->
        <div id="tab-reviews" class="admin-tab-panel" style="display: ${currentTab === 'tab-reviews' ? 'block' : 'none'};">
          ${renderAdminReviewsPanel()}
        </div>

      </div>
    </main>
 </div>

 </div>
 `;
}

/**
 * [마보살관리자 기본 대시보드 - 종합 관제 및 실시간 고객 문의 즉시 대응 센터]
 * - 요구사항 2번: 접속 시 바로 반응을 확인하고 긴급 답변할 수 있는 관제 센터 설계
 */
function renderAdminOverviewPanel(): string {
  const allInquiries = CustomerInquiryStore.getInquiries();
  const pendingInquiries = allInquiries.filter(i => i.status === 'pending');
  const allOrders = getAllStoreOrders();
  const pendingTransfers = VoucherStore.getBankTransfers().filter(t => t.status === 'pending');
  const reviews = ProductReviewStore.getReviews();

  return `
    <div style="display: flex; flex-direction: column; gap: 1.25rem;">
      
      <!-- 핵심 KPI 요약 카드 4종 (클릭 시 해당 화면 연결) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.85rem;">
        
        <!-- 1. 미답변 문의 (클릭 시 고객문의 탭 이동) -->
        <div class="btn-admin-kpi-card" data-goto-tab="tab-inquiries" style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 1.15rem; cursor: pointer; transition: all 0.15s ease;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
            <span style="font-size: 0.74rem; color: var(--text-muted);">미답변 문의</span>
          </div>
          <div style="font-size: 1.5rem; font-weight: 900; color: #ef4444;">
            ${pendingInquiries.length}건
          </div>
          <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.2rem;">
            전체 접수 ${allInquiries.length}건 (클릭 시 이동)
          </div>
        </div>

        <!-- 2. 무통장 입금 대기 (클릭 시 무통장 승인 탭 이동) -->
        <div class="btn-admin-kpi-card" data-goto-tab="tab-transfers" style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 1.15rem; cursor: pointer; transition: all 0.15s ease;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
            <span style="font-size: 0.74rem; color: var(--text-muted);">무통장 입금 대기</span>
          </div>
          <div style="font-size: 1.5rem; font-weight: 900; color: #ef4444;">
            ${pendingTransfers.length}건
          </div>
          <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.2rem;">
            승인 대기 건 (클릭 시 이동)
          </div>
        </div>

        <!-- 3. 총 주문 건수 (클릭 시 주문 장부 탭 이동) -->
        <div class="btn-admin-kpi-card" data-goto-tab="tab-orders" style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 1.15rem; cursor: pointer; transition: all 0.15s ease;">
          <div style="font-size: 0.74rem; color: var(--text-muted); margin-bottom: 0.25rem;">총 주문 건수</div>
          <div style="font-size: 1.5rem; font-weight: 900; color: #fff;">
            ${allOrders.length}건
          </div>
          <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.2rem;">
            결제 완료 건 (클릭 시 이동)
          </div>
        </div>

        <!-- 4. 고객 리뷰 평점 (클릭 시 리뷰 관리 탭 이동) -->
        <div class="btn-admin-kpi-card" data-goto-tab="tab-reviews" style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 1.15rem; cursor: pointer; transition: all 0.15s ease;">
          <div style="font-size: 0.74rem; color: var(--text-muted); margin-bottom: 0.25rem;">고객 리뷰 평점</div>
          <div style="font-size: 1.5rem; font-weight: 900; color: #fff;">
            5.0 <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: normal;">(${reviews.length}개)</span>
          </div>
          <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.2rem;">
            누적 평점 관리 (클릭 시 이동)
          </div>
        </div>

      </div>

    </div>
  `;
}


// ==========================================
// [컨텐츠 > 스터디 3대 서브카테고리 전용 시스템 워크스페이스]
// 1. 아티클 목록 (tab-study-articles)
// 2. 글 작성 및 수정 (tab-study-write) - 알림창이 아닌 풀스크린 시스템화 폼
// 3. 카테고리 관리 (tab-study-categories)
// ==========================================
function renderAdminStudyWorkspace(currentTab: string): string {
  StudyService.init();
  const articles = StudyService.getArticles();
  const categories = StudyService.getCategories();
  const urlParamEditId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('editId') : null;
  const editingId = StudyService.getEditingArticleId() || getEditingStudyArticleId() || urlParamEditId;
  const editingArticle = editingId ? StudyService.getArticleById(editingId) : null;

  const renderStudySubTabs = (activeTab: string) => `
    <div class="study-admin-subtabs" style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 0.85rem; flex-wrap: wrap;">
      <button type="button" class="admin-tab-btn" data-tab="tab-study-articles" style="background: ${activeTab === 'tab-study-articles' || activeTab === 'tab-study' ? 'var(--primary)' : 'rgba(255,255,255,0.06)'}; color: ${activeTab === 'tab-study-articles' || activeTab === 'tab-study' ? '#1c1500' : '#cbd5e1'}; font-weight: 800; font-size: 0.85rem; padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid ${activeTab === 'tab-study-articles' || activeTab === 'tab-study' ? 'transparent' : 'rgba(255,255,255,0.12)'}; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem; transition: all 0.15s ease;">
        <span class="material-symbols-outlined" style="font-size: 16px;">article</span>
        아티클 목록 (${articles.length}편)
      </button>
      <button type="button" class="admin-tab-btn" data-tab="tab-study-write" style="background: ${activeTab === 'tab-study-write' ? 'var(--primary)' : 'rgba(255,255,255,0.06)'}; color: ${activeTab === 'tab-study-write' ? '#1c1500' : '#cbd5e1'}; font-weight: 800; font-size: 0.85rem; padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid ${activeTab === 'tab-study-write' ? 'transparent' : 'rgba(255,255,255,0.12)'}; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem; transition: all 0.15s ease;">
        <span class="material-symbols-outlined" style="font-size: 16px;">edit_document</span>
        ${editingArticle ? '글 수정' : '+ 새 글 작성'}
      </button>
      <button type="button" class="admin-tab-btn" data-tab="tab-study-categories" style="background: ${activeTab === 'tab-study-categories' ? 'var(--primary)' : 'rgba(255,255,255,0.06)'}; color: ${activeTab === 'tab-study-categories' ? '#1c1500' : '#cbd5e1'}; font-weight: 800; font-size: 0.85rem; padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid ${activeTab === 'tab-study-categories' ? 'transparent' : 'rgba(255,255,255,0.12)'}; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem; transition: all 0.15s ease;">
        <span class="material-symbols-outlined" style="font-size: 16px;">category</span>
        카테고리 관리 (${categories.length}개)
      </button>
    </div>
  `;

  return `
    <!-- 1. 아티클 목록 패널 -->
    <div id="tab-study-articles" class="admin-tab-panel" style="display: ${currentTab === 'tab-study-articles' || currentTab === 'tab-study' ? 'block' : 'none'}; width: 100%; box-sizing: border-box;">
      <div style="background: var(--surface-container); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;">
        ${renderStudySubTabs(currentTab)}
        
        <!-- 상단 헤더 & 액션 -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1rem;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.6rem; border-radius: 9999px; background: rgba(242,202,80,0.15); border: 1px solid rgba(242,202,80,0.3); margin-bottom: 0.4rem;">
              <span class="material-symbols-outlined" style="font-size: 0.85rem; color: var(--primary);">article</span>
              <span style="font-size: 0.72rem; font-weight: 700; color: var(--primary); letter-spacing: 0.05em;">STUDY ARTICLES MANAGEMENT</span>
            </div>
            <h2 style="font-size: 1.3rem; font-weight: 800; color: #dfe2f1; margin: 0;">
              스터디 아티클 목록 (${articles.length}편)
            </h2>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0.35rem 0 0 0;">
              발행된 스터디 글을 확인하고 실시간으로 수정 및 삭제할 수 있습니다.
            </p>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button type="button" class="admin-tab-btn" data-tab="tab-study-write" id="btn-admin-goto-write" style="display: inline-flex; align-items: center; gap: 0.4rem; background: var(--primary); color: #1c1500; border: none; border-radius: 8px; padding: 0.55rem 1.15rem; font-size: 0.85rem; font-weight: 800; cursor: pointer; box-shadow: 0 4px 12px rgba(242,202,80,0.25);">
              <span class="material-symbols-outlined" style="font-size: 18px;">edit_document</span>
              + 새 글 작성하기
            </button>
            <a href="/study" target="_blank" style="display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(255,255,255,0.06); color: #cbd5e1; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 8px; padding: 0.55rem 0.95rem; font-size: 0.82rem; font-weight: 700; text-decoration: none;">
              <span class="material-symbols-outlined" style="font-size: 16px;">open_in_new</span>
              고객 화면 보기
            </a>
          </div>
        </div>

        <!-- 아티클 데이터 테이블 -->
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.86rem; color: #dfe2f1;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); background: rgba(0,0,0,0.2);">
                <th style="padding: 0.75rem 0.85rem;">카테고리</th>
                <th style="padding: 0.75rem 0.85rem;">아티클 제목</th>
                <th style="padding: 0.75rem 0.85rem;">한글 슬러그 (URL)</th>
                <th style="padding: 0.75rem 0.85rem;">작성자</th>
                <th style="padding: 0.75rem 0.85rem; text-align: center;">조회수</th>
                <th style="padding: 0.75rem 0.85rem;">등록일시</th>
                <th style="padding: 0.75rem 0.85rem; text-align: right;">관리</th>
              </tr>
            </thead>
            <tbody>
              ${articles.map(art => {
                const catObj = categories.find(c => c.id === art.category);
                const catName = catObj ? catObj.name : (art.categoryName || art.category);
                return `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.02)';" onmouseout="this.style.background='transparent';">
                    <td style="padding: 0.85rem;">
                      <span style="background: rgba(242, 202, 80, 0.12); color: var(--primary); padding: 0.2rem 0.55rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; border: 1px solid rgba(242,202,80,0.25);">
                        ${catName}
                      </span>
                    </td>
                    <td style="padding: 0.85rem; font-weight: 700; color: #ffffff; max-width: 260px;">
                      ${art.title}
                    </td>
                    <td style="padding: 0.85rem; font-size: 0.78rem;">
                      <a href="/study/${encodeURIComponent(art.slug)}" target="_blank" style="color: #94a3b8; text-decoration: none; display: inline-flex; align-items: center; gap: 0.2rem;" title="글 보러가기">
                        <code style="color: var(--primary); background: rgba(0,0,0,0.3); padding: 0.15rem 0.4rem; border-radius: 4px;">/${art.slug}</code>
                        <span class="material-symbols-outlined" style="font-size: 14px;">open_in_new</span>
                      </a>
                    </td>
                    <td style="padding: 0.85rem; color: #cbd5e1;">${art.author}</td>
                    <td style="padding: 0.85rem; text-align: center; color: var(--primary); font-weight: 700;">${art.views.toLocaleString()}회</td>
                    <td style="padding: 0.85rem; color: var(--text-muted); font-size: 0.78rem;">${art.createdAt}</td>
                    <td style="padding: 0.85rem; text-align: right; white-space: nowrap;">
                      <button type="button" class="btn-admin-edit-study-article" data-id="${art.id}" style="background: rgba(242, 202, 80, 0.14); border: 1px solid rgba(242, 202, 80, 0.35); color: var(--primary); padding: 0.3rem 0.65rem; border-radius: 5px; font-size: 0.78rem; font-weight: 700; cursor: pointer; margin-right: 0.35rem;">
                        수정
                      </button>
                      <button type="button" class="btn-admin-delete-study-article" data-id="${art.id}" data-title="${art.title.replace(/"/g, '&quot;')}" style="background: rgba(248, 113, 113, 0.12); border: 1px solid rgba(248, 113, 113, 0.3); color: #f87171; padding: 0.3rem 0.65rem; border-radius: 5px; font-size: 0.78rem; font-weight: 700; cursor: pointer;">
                        삭제
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 2. 글 작성 및 수정 전용 시스템 에디터 워크스페이스 패널 -->
    <div id="tab-study-write" class="admin-tab-panel" style="display: ${currentTab === 'tab-study-write' ? 'block' : 'none'}; width: 100%; box-sizing: border-box;">
      <div style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 14px; padding: 1.75rem; display: flex; flex-direction: column; gap: 1.5rem;">
        ${renderStudySubTabs(currentTab)}
        
        <!-- 상단 타이틀 바 -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1rem;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.6rem; border-radius: 9999px; background: rgba(242,202,80,0.15); border: 1px solid rgba(242,202,80,0.3); margin-bottom: 0.4rem;">
              <span class="material-symbols-outlined" style="font-size: 0.85rem; color: var(--primary);">edit_note</span>
              <span style="font-size: 0.72rem; font-weight: 700; color: var(--primary); letter-spacing: 0.05em;">ARTICLE EDITOR SYSTEM</span>
            </div>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: #dfe2f1; margin: 0;">
              ${editingArticle ? `✏ 스터디 글 수정 : [${editingArticle.title}] (ID: ${editingArticle.id})` : '+ 새 스터디 아티클 작성 및 발행'}
            </h2>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0.35rem 0 0 0;">
              제목을 입력하면 정통 SEO 한글 슬러그가 자동으로 생성됩니다. 내용 작성 후 즉시 고객 화면에 반영됩니다.
            </p>
          </div>
          <button type="button" class="admin-tab-btn" data-tab="tab-study-articles" id="btn-admin-cancel-study-write" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-size: 0.82rem; font-weight: 700; cursor: pointer;">
            ← 아티클 목록으로
          </button>
        </div>

        <!-- 시스템 폼 -->
        <form id="form-admin-study-article" style="display: flex; flex-direction: column; gap: 1.25rem;">
          <input type="hidden" id="admin-study-article-id" value="${editingArticle?.id || ''}" />

          <!-- 제목 & 카테고리 -->
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.25rem;">
            <div>
              <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #ffffff; margin-bottom: 0.45rem;">
                아티클 제목 *
              </label>
              <input type="text" id="admin-study-title" required value="${editingArticle?.title || ''}" placeholder="예: 십신으로 읽어내는 나의 숨은 사회적 잠재력" style="width: 100%; box-sizing: border-box; background: #0c0f18; border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.95rem; font-weight: 700;" />
            </div>

            <div>
              <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #ffffff; margin-bottom: 0.45rem;">
                카테고리 *
              </label>
              <select id="admin-study-category" required style="width: 100%; box-sizing: border-box; background: #0c0f18; border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.9rem;">
                ${categories.map(c => `
                  <option value="${c.id}" ${editingArticle?.category === c.id ? 'selected' : ''}>${c.name}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- 한글 슬러그 (SEO URL) -->
          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--primary); margin-bottom: 0.45rem;">
              한글 슬러그 (고유 페이지 URL 경로) *
            </label>
            <div style="display: flex; align-items: center; background: #0c0f18; border: 1px solid rgba(242,202,80,0.3); border-radius: 8px; padding-left: 0.85rem; overflow: hidden;">
              <span style="color: var(--primary); font-size: 0.85rem; font-weight: 700; font-family: monospace;">mabosal.com/study/</span>
              <input type="text" id="admin-study-slug" required value="${editingArticle?.slug || ''}" placeholder="십신으로-읽어내는-나의-숨은-사회적-잠재력" style="flex: 1; background: transparent; border: none; color: #ffffff; padding: 0.75rem 0.75rem; font-size: 0.9rem; font-weight: 600; outline: none;" />
            </div>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0.35rem 0 0 0;">
              제목을 입력하면 자동으로 한글 슬러그가 채워지며, 필요 시 원하는 한글 키워드로 직접 수정할 수 있습니다.
            </p>
          </div>

          <!-- 작성자 & 태그 -->
          <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1.25rem;">
            <div>
              <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #ffffff; margin-bottom: 0.45rem;">
                작성자 이름
              </label>
              <input type="text" id="admin-study-author" value="${editingArticle?.author || '마보살 연구소'}" placeholder="예: 마보살 학술팀" style="width: 100%; box-sizing: border-box; background: #0c0f18; border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.7rem 0.9rem; border-radius: 8px; font-size: 0.88rem;" />
            </div>

            <div>
              <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #ffffff; margin-bottom: 0.45rem;">
                태그 (쉼표로 구분)
              </label>
              <input type="text" id="admin-study-tags" value="${editingArticle?.tags ? editingArticle.tags.join(', ') : '명리학, 사주, 실전해설'}" placeholder="예: 십신, 사주기초, 적성분석" style="width: 100%; box-sizing: border-box; background: #0c0f18; border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.7rem 0.9rem; border-radius: 8px; font-size: 0.88rem;" />
            </div>
          </div>

          <!-- 요약 설명 문구 -->
          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #ffffff; margin-bottom: 0.45rem;">
              요약 설명 문구 (검색 결과 및 카드에 노출) *
            </label>
            <input type="text" id="admin-study-summary" required value="${editingArticle?.summary || ''}" placeholder="아티클 목록 카드와 검색엔진 스니펫에 노출될 1~2줄 핵심 요약" style="width: 100%; box-sizing: border-box; background: #0c0f18; border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.88rem;" />
          </div>

          <!-- 본문 에디터 텍스트에어리어 -->
          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #ffffff; margin-bottom: 0.45rem;">
              상세 본문 내용 (단락 및 줄바꿈 지원) *
            </label>
            <textarea id="admin-study-content" rows="15" required placeholder="독자들에게 전달할 명리학 지식 및 해설 내용을 정성스럽게 작성해 주세요..." style="width: 100%; box-sizing: border-box; background: #0c0f18; border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 1rem; border-radius: 8px; font-size: 0.95rem; line-height: 1.8; font-family: inherit; resize: vertical;">${editingArticle?.content || ''}</textarea>
          </div>

          <!-- 저장/발행 버튼 액션 -->
          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1.25rem;">
            <button type="button" class="admin-tab-btn" data-tab="tab-study-articles" style="background: rgba(255,255,255,0.08); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.7rem 1.5rem; font-size: 0.9rem; font-weight: 700; cursor: pointer;">
              작성 취소
            </button>
            <button type="submit" style="background: var(--primary); color: #1c1500; border: none; border-radius: 8px; padding: 0.7rem 2rem; font-size: 0.95rem; font-weight: 800; cursor: pointer; box-shadow: 0 4px 16px rgba(242,202,80,0.35);">
              ${editingArticle ? '수정 사항 저장 및 즉시 반영' : '새 아티클 발행하기'}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 3. 카테고리 관리 전용 패널 -->
    <div id="tab-study-categories" class="admin-tab-panel" style="display: ${currentTab === 'tab-study-categories' ? 'block' : 'none'}; width: 100%; box-sizing: border-box;">
      <div style="background: var(--surface-container); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem;">
        ${renderStudySubTabs(currentTab)}
        
        <!-- 상단 헤더 -->
        <div style="border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1rem;">
          <div style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.6rem; border-radius: 9999px; background: rgba(242,202,80,0.15); border: 1px solid rgba(242,202,80,0.3); margin-bottom: 0.4rem;">
            <span class="material-symbols-outlined" style="font-size: 0.85rem; color: var(--primary);">category</span>
            <span style="font-size: 0.72rem; font-weight: 700; color: var(--primary); letter-spacing: 0.05em;">CATEGORY STRUCTURE</span>
          </div>
          <h2 style="font-size: 1.3rem; font-weight: 800; color: #dfe2f1; margin: 0;">
            스터디 카테고리 관리 (${categories.length}개)
          </h2>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0.35rem 0 0 0;">
            카테고리를 추가, 수정, 삭제하여 독자들을 위한 명리학 분류 체계를 자유롭게 구성합니다.
          </p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 1.5rem; align-items: flex-start;">
          
          <!-- 새 카테고리 추가 폼 -->
          <form id="form-admin-add-category" style="background: rgba(242,202,80,0.04); border: 1px solid rgba(242,202,80,0.25); border-radius: 12px; padding: 1.35rem; display: flex; flex-direction: column; gap: 1rem;">
            <h3 style="color: var(--primary); font-size: 1rem; font-weight: 800; margin: 0; display: flex; align-items: center; gap: 0.35rem;">
              <span class="material-symbols-outlined" style="font-size: 20px;">add_circle</span>
              새 카테고리 추가
            </h3>
            
            <div>
              <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #dfe2f1; margin-bottom: 0.35rem;">카테고리 이름 *</label>
              <input type="text" id="admin-input-new-cat-name" required placeholder="예: 신년운세 가이드 & 비책" style="width: 100%; box-sizing: border-box; background: #0c0f18; border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.65rem 0.85rem; border-radius: 6px; font-size: 0.88rem;" />
            </div>

            <div>
              <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #dfe2f1; margin-bottom: 0.35rem;">간단 설명</label>
              <input type="text" id="admin-input-new-cat-desc" placeholder="예: 매년 새해 운세와 절기별 개운 솔루션" style="width: 100%; box-sizing: border-box; background: #0c0f18; border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.65rem 0.85rem; border-radius: 6px; font-size: 0.88rem;" />
            </div>

            <button type="submit" style="background: var(--primary); color: #1c1500; font-weight: 800; border: none; border-radius: 6px; padding: 0.7rem; font-size: 0.9rem; cursor: pointer; margin-top: 0.35rem;">
              + 신규 카테고리 등록
            </button>
          </form>

          <!-- 현재 등록된 카테고리 목록 테이블 -->
          <div style="background: #0c0f18; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.25rem;">
            <h3 style="color: #ffffff; font-size: 0.95rem; font-weight: 800; margin: 0 0 0.85rem;">
              등록된 카테고리 목록
            </h3>

            <div style="display: flex; flex-direction: column; gap: 0.65rem;">
              ${categories.map(c => {
                const count = StudyService.getArticles(c.id).length;
                return `
                  <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; padding: 0.75rem 1rem;">
                    <div>
                      <div style="color: #ffffff; font-size: 0.92rem; font-weight: 700;">${c.name}</div>
                      <div style="color: var(--text-muted); font-size: 0.75rem; margin-top: 0.15rem;">
                        등록된 글 ${count}건 · ID: ${c.id}
                      </div>
                    </div>
                    <div style="display: flex; gap: 0.4rem;">
                      <button type="button" class="btn-admin-edit-cat" data-cat-id="${c.id}" data-id="${c.id}" data-cat-name="${c.name}" data-name="${c.name}" data-desc="${c.description || ''}" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; border-radius: 5px; padding: 0.3rem 0.6rem; font-size: 0.78rem; cursor: pointer;">
                        수정
                      </button>
                      <button type="button" class="btn-admin-del-cat" data-cat-id="${c.id}" data-id="${c.id}" data-cat-name="${c.name}" data-name="${c.name}" style="background: rgba(248, 113, 113, 0.12); border: 1px solid rgba(248, 113, 113, 0.3); color: #f87171; border-radius: 5px; padding: 0.3rem 0.6rem; font-size: 0.78rem; cursor: pointer;">
                        삭제
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
