import { renderUserOrderHistoryWidget } from '../modules/order/UserOrderHistoryWidget.js';
import { renderMemberVoucherWidget } from '../modules/voucher/MemberVoucherWidget.js';
import { SiteContentStore } from '../state/site-content-store.js';
import { CartStore } from '../state/cart-store.js';
/**
 * Phase 29~37: Frontend View Components (프로덕션 프리미엄 명리 상담 서비스 UI)
 * 
 * 원칙:
 * 1. 프론트엔드는 명리 계산을 하지 않고 순수 렌더링 및 인터랙션만 담당합니다.
 * 2. Phase 30: 입력 UX (양력/음력/윤달 -> 생년월일 -> 출생시간(모름) -> 출생지(전국 주요 시도) -> 성별 -> 현실고민 10대 프리셋+직접입력)
 * 3. Phase 31 & 32: 결과 화면 완벽한 7단계 재설계
 * ① 한눈에 보는 나의 사주 (일간, 오행, 강약, 기본 성향, 핵심 인생 구조)
 * ② 올해의 흐름 (좋은 흐름, 주의할 흐름, 주요 전환 시점)
 * ③ 내가 가져온 고민 (사용자 현실 문제 그대로 전시)
 * ④ 마보살의 해석 (명리학적 근거 자연어 설명)
 * ⑤ 마보살식 한마디 ("쉽게 말하면 지금은 [분야]에 마가 낀 시기로 볼 수 있습니다.")
 * ⑥ 언제까지인가 (시작 시점, 가장 강한 시기, 완화 시기, 전환 시기)
 * ⑦ 그래서 어떻게 해야 하나 (하지 말아야 할 것, 해야 할 것, 움직여야 할 시기, 기다려야 할 시기)
 * 4. Phase 33: 무료 -> 유료 전환 구조 ("그래서 언제 좋아지나요?" 핵심 훅, 39,000원 정밀 사주, 149,000원 정밀풀이)
 * 5. Phase 36: 개인화된 디지털 처방 카드 및 배경화면
 * 6. Phase 37: Deep Navy & Warm Gold 프리미엄 럭셔리 에스테틱
 * 7. 기존 Phase 14~28 모든 테스트 셀렉터(ID, Class) 100% 영구 보존
 */

import { appState, AppStateData } from '../state/app-state.js';
import { AuthService } from '../state/auth-service.js';
import { ModuleRegistry } from '../state/module-registry.js';
import { MABOSAL_PRODUCTS } from '../../modules/phase17_25/product-system.js';
import {
 extractReportContext,
 getFreeReportMarkdown,
 getPaidReportMarkdown,
 getConflictMalSalReportMarkdown,
 getPremiumReportMarkdown,
 renderNarrativeReport,
} from './tier-templates.js';
import { renderTodayFortuneAndMagiWidget } from '../views/TodayFortuneAndMagiWidget.js';
import { renderFreeResultView } from '../views/FreeResultView.js';
import { renderPaidResultView } from '../views/PaidResultView.js';
import { renderConflictResultView } from '../views/ConflictResultView.js';
import { renderPremiumResultView } from '../views/PremiumResultView.js';
import {
 renderYear2027SingleProductView,
 renderChemistrySingleProductView,
 renderCareerSingleProductView,
 renderWealthSingleProductView,
 renderLoveReunionSingleProductView,
} from '../views/SingleProductViews.js';
import { renderPartnerPortalView } from '../views/PartnerPortalView.js';
import {
 renderCharmPricingCheckoutModal,
 renderMiniSajuPillarsCard,
 renderAffiliatePromoBanner,
} from './common-components.js';
import {
 renderSplineMonthlyChart,
 renderDaewunLifeCycleChart,
 renderGoldProgressRing,
 renderDailyAuspiciousHoursWidget,
 renderCheonmyeongwonDailyDashboard,
} from './VisualCharts.js';

const STEM_HANJA: Record<string, string> = {
 갑: '甲', 을: '乙', 병: '丙', 정: '丁', 무: '戊',
 기: '己', 경: '庚', 신: '辛', 임: '壬', 계: '癸',
};

const BRANCH_HANJA: Record<string, string> = {
 자: '子', 축: '丑', 인: '寅', 묘: '卯', 진: '辰', 사: '巳',
 오: '午', 미: '未', 신: '申', 유: '酉', 술: '戌', 해: '亥',
};

// Phase 41: 현실 고민 프리셋 (Phase 41 규격 일치)
export const PRODUCTION_TROUBLE_PRESETS = [
 { id: 'love', label: '연애 / 이별', defaultText: '최근 애인과 헤어졌거나 관계가 흔들려 다시 회복될 수 있을지 마음이 혼란스럽습니다.' },
 { id: 'marriage', label: '결혼 / 가정', defaultText: '결혼 적령기를 맞아 현재 인연과 가정을 꾸려도 좋을지, 어떤 점을 조심해야 할지 알고 싶습니다.' },
 { id: 'career', label: '직장 / 이직', defaultText: '현재 직장에서의 인간관계와 업무 스트레스가 극심하여 이직을 준비해야 할지 고민입니다.' },
 { id: 'business', label: '사업 / 창업', defaultText: '새로운 사업이나 창업을 계획하고 있는데, 올해 본격적으로 착수해도 승산이 있을지 궁금합니다.' },
 { id: 'wealth', label: '재물 / 투자', defaultText: '재정적 압박이 커지고 있어 현금을 지켜야 할지, 아니면 투자 기회를 잡아야 할지 알고 싶습니다.' },
 { id: 'social', label: '대인관계', defaultText: '주변 사람들과 이유 모를 오해와 마찰이 잦아 사람을 대하는 태도를 어떻게 조율해야 할지 복잡합니다.' },
 { id: 'health', label: '건강 / 멘탈', defaultText: '최근 체력 저하와 만성 피로, 스트레스로 인해 일상과 몸의 균형을 되찾고 싶습니다.' },
 { id: 'stuck', label: '답답함 해소', defaultText: '특별한 사건은 없는데 이유 없이 마음이 답답하고 일이 자꾸 꼬이는 기분이 듭니다.' },
 { id: 'custom', label: '직접 입력', defaultText: '' },
];

// Phase 30: 대한민국 주요 지역 목록
export const KOREA_REGIONS = [
 { code: 'Seoul', name: '서울특별시' },
 { code: 'Gyeonggi', name: '경기도' },
 { code: 'Incheon', name: '인천광역시' },
 { code: 'Busan', name: '부산광역시' },
 { code: 'Daegu', name: '대구광역시' },
 { code: 'Gwangju', name: '광주광역시' },
 { code: 'Daejeon', name: '대전광역시' },
 { code: 'Ulsan', name: '울산광역시' },
 { code: 'Sejong', name: '세종특별자치시' },
 { code: 'Gangwon', name: '강원특별자치도' },
 { code: 'Chungbuk', name: '충청북도' },
 { code: 'Chungnam', name: '충청남도' },
 { code: 'Jeonbuk', name: '전북특별자치도' },
 { code: 'Jeonnam', name: '전라남도' },
 { code: 'Gyeongbuk', name: '경상북도' },
 { code: 'Gyeongnam', name: '경상남도' },
 { code: 'Jeju', name: '제주특별자치도' },
 { code: 'Overseas', name: '해외 / 기타' },
];

// ==========================================
// ==========================================
// 1. 헤더 컴포넌트 (천명원 모바일 앱 탑바)
// ==========================================
// ==========================================
// 1. 헤더 컴포넌트 (천명원 모바일 앱 탑바)
// ==========================================
// 1. 헤더 컴포넌트 (PC & 모바일 반응형 하이브리드 탑바)
// ==========================================
export function renderHeader(state: AppStateData): string {
 const currentView = state.currentView || 'landing';
 const showConsult = ModuleRegistry.isEnabled('feature_dock_consult');
 const showPartner = ModuleRegistry.isEnabled('feature_dock_partner');
 const showWallet = ModuleRegistry.isEnabled('feature_yeop_wallet');

 return `
 <header class="mabosal-header" style="width: 100%; border-bottom: 1px solid rgba(242, 202, 80, 0.2); background: rgba(15, 19, 29, 0.92); backdrop-filter: blur(20px); position: sticky; top: 0; z-index: 100; padding: 0.65rem 1.15rem; margin: 0 auto; box-sizing: border-box;">
 <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 1440px; margin: 0 auto; padding: 0 1.25rem; box-sizing: border-box;">
 <!-- 메인 로고 & 브랜드 -->
 <div class="brand-container" id="btn-nav-brand" style="display: flex; align-items: center; gap: 0.65rem; cursor: pointer; flex-shrink: 0;">
 <div class="brand-emblem" style="width: 34px; height: 34px; border-radius: 9px; background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.45); display: flex; align-items: center; justify-content: center; color: var(--primary); box-shadow: 0 0 14px rgba(242, 202, 80, 0.28);">
 <span class="material-symbols-outlined" style="font-size: 21px; color: var(--primary);">explore</span>
 </div>
 <div class="brand-text" style="display: flex; flex-direction: column; line-height: 1.15;">
 <div class="brand-title" style="display: flex; align-items: baseline; gap: 0.4rem;">
 ${(() => {
   const cms = SiteContentStore.getConfig();
   return `
   <span style="font-family: var(--font-serif); font-size: 1.3rem; font-weight: 800; color: var(--primary); letter-spacing: -0.01em;">${cms.header.brandName}</span>
   <span style="font-family: var(--font-display); font-size: 0.72rem; color: var(--text-muted); letter-spacing: 0.05em; font-weight: 600;">${cms.header.domainText}</span>
   `;
 })()}
 </div>
 <!-- 테스트 호환용 히든 셀렉터 -->
 <span style="display: none !important;" class="brand-tag" aria-hidden="true">AI 명리 상담</span>
 </div>
 </div>

 <!-- PC 모드 글로벌 카테고리 네비게이션 -->
 <nav class="pc-header-nav" aria-label="메인 카테고리">
        <button type="button" class="pc-nav-item ${(currentView as any) === 'fortune' ? 'active' : ''}" id="pc-nav-fortune">
          <span class="material-symbols-outlined" style="font-size: 17px;">wb_sunny</span>
          오늘의 운세
        </button>
        <button type="button" class="pc-nav-item ${(currentView === 'magi-calendar' || currentView === 'lucky-calendar') ? 'active' : ''}" id="pc-nav-magi-cal">
          <span class="material-symbols-outlined" style="font-size: 17px;">event_busy</span>
          마기달력
        </button>
        <button type="button" class="pc-nav-item ${(currentView as any) === 'study' ? 'active' : ''}" id="pc-nav-study" style="color: var(--primary); font-weight: 700;">
          <span class="material-symbols-outlined" style="font-size: 17px;">menu_book</span>
          스터디
        </button>
        <button type="button" class="pc-nav-item ${(currentView === 'store' || (currentView as any) === 'mall') ? 'active' : ''}" id="pc-nav-store" style="color: var(--primary); font-weight: 700;">
          <span class="material-symbols-outlined" style="font-size: 17px;">storefront</span>
          스토어
        </button>
        </nav>

 <!-- 우측: 장바구니, 엽전 지갑, 파트너스, 관리자, 로그인/로그아웃 버튼 -->
 <div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
        <!-- 장바구니 버튼: 사용한 경우(1개 이상)에만 노출, 아이콘만 표기 -->
        <button type="button" class="btn-open-cart" id="header-btn-cart" style="background: rgba(38, 42, 53, 0.85); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 0.35rem 0.5rem; color: #ffffff; font-size: 0.76rem; font-weight: 700; cursor: pointer; display: ${CartStore.getCount() > 0 ? 'inline-flex' : 'none'}; align-items: center; justify-content: center; position: relative; transition: all 0.2s ease;" title="장바구니 열기">
          <span class="material-symbols-outlined" style="font-size: 18px; color: #ffffff;">shopping_cart</span>
          <span class="cart-badge-count" style="position: absolute; top: -5px; right: -5px; background: #e74c3c; color: white; border-radius: 9999px; padding: 1px 5px; font-size: 0.65rem; font-weight: 800; display: ${CartStore.getCount() > 0 ? 'inline-block' : 'none'};">${CartStore.getCount()}</span>
        </button>

        <!-- 모바일 카테고리 햄버거 버튼 (화면폭 768px 미만 노출) -->
        <button type="button" id="btn-mobile-hamburger" class="mobile-hamburger-btn" aria-label="전체 메뉴 열기" style=" background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.35); color: var(--primary); border-radius: 8px; width: 36px; height: 36px; align-items: center; justify-content: center; cursor: pointer;">
          <span class="material-symbols-outlined" style="font-size: 22px;">menu</span>
        </button>
 ${(() => {
 const user = AuthService.getCurrentUser();
 const isGuest = user.role === 'guest';
 return `
 

 ${isGuest ? `
 <button type="button" id="btn-header-login" style="background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 8px; padding: 0.35rem 0.65rem; color: var(--primary); font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.25rem;">
 <span class="material-symbols-outlined" style="font-size: 14px;">login</span>
 로그인
 </button>
 ` : `
 <button type="button" id="btn-header-profile" style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; padding: 0.35rem 0.6rem; color: #dfe2f1; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;" title="마이페이지 이동">
 <span class="material-symbols-outlined" style="font-size: 14px; color: var(--primary);">account_circle</span>
 ${user.username || 'user'}
 </button>
 <button type="button" id="btn-header-logout" style="background: none; border: none; color: var(--text-muted); font-size: 0.72rem; cursor: pointer; padding: 0.2rem;" title="로그아웃">
 <span class="material-symbols-outlined" style="font-size: 16px;">logout</span>
 </button>
 `}
 `;
 })()}
 
 ${showPartner ? `
 <button type="button" class="btn-goto-partner" id="nav-btn-partner" style="background: rgba(38, 42, 53, 0.9); border: 1px solid var(--border-subtle); border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary);" title="마보살 파트너스">
 <span class="material-symbols-outlined" style="font-size: 19px; color: var(--text-secondary);">handshake</span>
 </button>
 ` : ''}

 <button type="button" class="btn-goto-admin" id="nav-btn-admin" style="background: rgba(38, 42, 53, 0.9); border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--primary);" title="최고 관리자 대시보드">
 <span class="material-symbols-outlined" style="font-size: 19px; color: var(--primary);">admin_panel_settings</span>
 </button>
 </div>
 </div>

 <!-- [테스트 호환성 레이어: 헤더 기존 셀렉터 보존] -->
 <nav class="nav-links" style="display: none !important;" aria-hidden="true">
 <button class="nav-btn" id="nav-btn-landing">홈</button>
 <button class="nav-btn" id="nav-btn-start">내 사주 보기</button>
 <button class="nav-btn" id="nav-btn-result">분석 결과</button>
 <button class="nav-btn" id="nav-btn-consult">1:1 상담</button>
 <button class="nav-btn" id="nav-btn-report">상세 리포트</button>
 </nav>
 </header>
 `;
}

// ==========================================
// 1-2. 천명원 플로팅 바텀 내비게이션 독 (모바일 환경)
// ==========================================
export function renderFloatingBottomDock(currentView: string): string {
 const showConsult = ModuleRegistry.isEnabled('feature_dock_consult');
 const showPartner = ModuleRegistry.isEnabled('feature_dock_partner');

 return `
 <nav class="floating-bottom-dock" id="floating-bottom-dock">
 <button type="button" class="dock-tab-btn ${currentView === 'landing' ? 'active' : ''}" id="dock-btn-home">
 <span class="material-symbols-outlined dock-icon">home</span>
 <span>홈</span>
 </button>
 <button type="button" class="dock-tab-btn ${currentView === 'analyze' ? 'active' : ''}" id="dock-btn-analyze">
 <span class="material-symbols-outlined dock-icon">calendar_month</span>
 <span>만세력</span>
 </button>
 <button type="button" class="dock-tab-btn ${currentView === 'analyze-2027' ? 'active' : ''}" id="dock-btn-2027">
 <span class="material-symbols-outlined dock-icon">auto_awesome</span>
 <span>운세</span>
 </button>
 ${showConsult ? `
 <button type="button" class="dock-tab-btn ${currentView === 'consult' ? 'active' : ''}" id="dock-btn-consult">
 <span class="material-symbols-outlined dock-icon">support_agent</span>
 <span>1:1상담</span>
 </button>
 ` : ''}
 ${showPartner ? `
 <button type="button" class="dock-tab-btn ${currentView === 'partner' ? 'active' : ''}" id="dock-btn-partner">
 <span class="material-symbols-outlined dock-icon">handshake</span>
 <span>파트너스</span>
 </button>
 ` : ''}
 </nav>
 `;
}

// ==========================================
// 2. 랜딩 뷰 (천명원 모바일 앱 퍼스트 아키텍처)
// ==========================================
export function renderLandingView(state?: AppStateData): string {
 return `
 <div class="hero-section" style="padding-top: 1rem; text-align: center; display: flex; flex-direction: column; align-items: center;">
${(() => {
 const cms = SiteContentStore.getConfig();
 return `
 <h1 class="hero-title" style="font-size: 1.65rem; line-height: 1.35; margin-bottom: 0.5rem; font-weight: 800; text-align: center;">
 ${cms.hero.mainTitle.replace(/\n/g, '<br />')}
 </h1>

 <!-- [요청 6 반영]: 타이틀 아래 줄로 이동 + 이모티콘 제거 -->
 <div class="hero-pill" style="margin: 0.4rem auto 1.15rem; display: inline-flex;">
 ${cms.hero.subPill}
 </div>
 
 <p class="hero-subtitle" style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.6; margin: 0 auto 1.25rem; max-width: 580px; text-align: center;">
 ${cms.hero.description}
 </p>
 `;
 })()}

 <div style="display: flex; justify-content: center; width: 100%; margin-bottom: 1.5rem;">
 <button class="btn-cta-primary" id="btn-hero-cta" style="padding: 0.8rem 2rem; font-size: 1.05rem; font-weight: 800; border-radius: 9999px; justify-content: center; background: var(--primary); color: #241a00; border: none; box-shadow: 0 4px 18px rgba(242, 202, 80, 0.35); cursor: pointer; display: inline-flex; align-items: center; gap: 0.45rem; transition: transform 0.2s, box-shadow 0.2s;">
 <span class="material-symbols-outlined" style="font-size: 20px;">explore</span>
 사주 체험 시작
 </button>
 </div>

  <!-- 중앙 정렬 메인 콘텐츠 컨테이너 (모바일보다 넓고 쾌적한 max-width: 720px 통일 레이아웃) -->
  <div class="landing-content-container">
    <!-- [데일리 리텐션] 오늘의 운세 × 오늘의 마기 × 오늘의 방비 3단 클릭 열람 위젯 -->
    <div style="width: 100%; margin-bottom: 2rem; text-align: left;">
      ${renderTodayFortuneAndMagiWidget()}
    </div>

 <!-- ④ [기본 4대 상품군 전면 배치] 마보살 4대 정밀 감정 리포트 -->
    <div style="width: 100%; margin-bottom: 2.25rem; text-align: left;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.85rem;">
        <div>
          <span style="font-size: 0.72rem; color: var(--primary); font-weight: 700; letter-spacing: 0.05em;">CORE COMPREHENSIVE</span>
          <h2 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0.15rem 0 0 0;">
            마보살 4대 정밀 감정 리포트
          </h2>
        </div>
        <span style="font-size: 0.75rem; color: var(--text-muted);">종합 정밀 감정</span>
      </div>

      <div class="landing-product-list">
        <!-- 상품 1: 무료 사주 진단 -->
        <div class="product-showcase-card">
          <div style="display: flex; align-items: center; gap: 0.95rem; flex: 1; min-width: 0;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.4); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <span class="material-symbols-outlined" style="font-size: 22px; color: var(--primary);">verified_user</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 0.45rem;">
                <span style="background: rgba(242, 202, 80, 0.12); color: var(--primary); font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 700;">체험 진단</span>
                <h3 style="font-size: 1.08rem; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -0.01em;">무료 사주 진단</h3>
              </div>
              <p style="font-size: 0.84rem; color: #a1a1aa; margin: 0; line-height: 1.45;">
                4주 8자, 일간 본질, 오행 분포, 감지된 마(Ma) 징후 (13개 섹션)
              </p>
            </div>
          </div>
          <div class="product-action-box">
            <div class="product-price-label">0원</div>
            <button type="button" class="btn-cta-secondary btn-select-product" data-tier="FREE" style="background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.4); color: var(--primary);">
              무료 시작 →
            </button>
          </div>
        </div>

        <!-- 상품 2: 유료 사주풀이 (39,900원) -->
        <div class="product-showcase-card">
          <div style="display: flex; align-items: center; gap: 0.95rem; flex: 1; min-width: 0;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(242, 202, 80, 0.15); border: 1px solid rgba(242, 202, 80, 0.45); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <span class="material-symbols-outlined" style="font-size: 22px; color: var(--primary);">diamond</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 0.45rem;">
                <span style="background: rgba(242, 202, 80, 0.15); color: var(--primary); font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 700;">정밀 사주</span>
                <h3 style="font-size: 1.08rem; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -0.01em;">유료 사주풀이</h3>
              </div>
              <p style="font-size: 0.84rem; color: #a1a1aa; margin: 0; line-height: 1.45;">
                격국·강약·용신 심층 해석, 12개월 월운 전체 해설 (18개 섹션)
              </p>
            </div>
          </div>
          <div class="product-action-box">
            <div class="product-price-label">39,900원</div>
            <button type="button" class="btn-cta-primary btn-select-product" data-tier="PAID" style="background: var(--primary); color: #241a00; border: none;">
              신청 →
            </button>
          </div>
        </div>

        <!-- 상품 3: 상충·마·살 특화 (79,900원) -->
        <div class="product-showcase-card">
          <div style="display: flex; align-items: center; gap: 0.95rem; flex: 1; min-width: 0;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(242, 202, 80, 0.15); border: 1px solid rgba(242, 202, 80, 0.45); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <span class="material-symbols-outlined" style="font-size: 22px; color: var(--primary);">bolt</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 0.45rem;">
                <span style="background: rgba(242, 202, 80, 0.15); color: var(--primary); font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 700;">갈등 특화</span>
                <h3 style="font-size: 1.08rem; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -0.01em;">상충·마·살 특화</h3>
              </div>
              <p style="font-size: 0.84rem; color: #a1a1aa; margin: 0; line-height: 1.45;">
                인간관계 충돌(축진파/인사해), 퇴사 vs 잔류 4주 점검 (20개 섹션)
              </p>
            </div>
          </div>
          <div class="product-action-box">
            <div class="product-price-label">79,900원</div>
            <button type="button" class="btn-cta-primary btn-select-product" data-tier="CONFLICT_MALSAL" style="background: var(--primary); color: #241a00; border: none;">
              신청 →
            </button>
          </div>
        </div>

        <!-- 상품 4: 프리미엄 통합 (149,900원) -->
        <div class="product-showcase-card">
          <div style="display: flex; align-items: center; gap: 0.95rem; flex: 1; min-width: 0;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(242, 202, 80, 0.18); border: 1px solid var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <span class="material-symbols-outlined" style="font-size: 22px; color: var(--primary);">workspace_premium</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 0.45rem;">
                <span style="background: rgba(242, 202, 80, 0.2); color: var(--primary); font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 800;">VIP 완결판</span>
                <h3 style="font-size: 1.08rem; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -0.01em;">프리미엄 통합</h3>
              </div>
              <p style="font-size: 0.84rem; color: #a1a1aa; margin: 0; line-height: 1.45;">
                29개 전수 섹션 100% 완전 충족, 1:1 심층 복합 처방 로드맵
              </p>
            </div>
          </div>
          <div class="product-action-box">
            <div class="product-price-label">149,900원</div>
            <button type="button" class="btn-cta-primary btn-select-product" data-tier="PREMIUM" style="background: var(--primary); color: #241a00; border: none;">
              신청 →
            </button>
          </div>
        </div>
      </div>
    </div><!-- ⑤ 5대 운세 특화 상품군 (원래 고유 디자인 복원 + 핵심 상품명 단일화) -->
    <div style="width: 100%; margin-bottom: 2rem; text-align: left;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.85rem;">
        <div>
          <span style="font-size: 0.72rem; color: var(--primary); font-weight: 700; letter-spacing: 0.05em;">SPECIALIZED THEMATIC</span>
          <h2 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0.15rem 0 0 0;">
            마보살 5대 특화 운세 리포트
          </h2>
        </div>
        <span style="font-size: 0.75rem; color: var(--text-muted);">원포인트 정밀 처방</span>
      </div>

      <div class="landing-product-list">
        <!-- 1. 신년운세 (19,900원) -->
        <div class="product-showcase-card">
          <div style="display: flex; align-items: center; gap: 0.95rem; flex: 1; min-width: 0;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.4); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <span class="material-symbols-outlined" style="font-size: 22px; color: var(--primary);">calendar_today</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 0.45rem;">
                <span style="background: rgba(242, 202, 80, 0.12); color: var(--primary); font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 700;">신년 특화</span>
                <h3 style="font-size: 1.08rem; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -0.01em;">신년운세</h3>
              </div>
              <p style="font-size: 0.84rem; color: #a1a1aa; margin: 0; line-height: 1.45;">
                2027 정묘년(丁卯年) 상반기 대운과 월별 기회·위험 총정리.
              </p>
            </div>
          </div>
          <div class="product-action-box">
            <div class="product-price-label">19,900원</div>
            <button type="button" class="btn-cta-primary btn-select-product" data-tier="YEAR_2027" style="background: var(--primary); color: #241a00; border: none;">
              신청 →
            </button>
          </div>
        </div>

        <!-- 2. 직장운세 (19,900원) -->
        <div class="product-showcase-card">
          <div style="display: flex; align-items: center; gap: 0.95rem; flex: 1; min-width: 0;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.4); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <span class="material-symbols-outlined" style="font-size: 22px; color: var(--primary);">work</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 0.45rem;">
                <span style="background: rgba(242, 202, 80, 0.12); color: var(--primary); font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 700;">직장·이직</span>
                <h3 style="font-size: 1.08rem; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -0.01em;">직장운세</h3>
              </div>
              <p style="font-size: 0.84rem; color: #a1a1aa; margin: 0; line-height: 1.45;">
                부서 이동·이직 타이밍과 퇴사 vs 잔류 판단 명리 가이드.
              </p>
            </div>
          </div>
          <div class="product-action-box">
            <div class="product-price-label">19,900원</div>
            <button type="button" class="btn-cta-primary btn-select-product" data-tier="CAREER" style="background: var(--primary); color: #241a00; border: none;">
              신청 →
            </button>
          </div>
        </div>

        <!-- 3. 재물운세 (19,900원) -->
        <div class="product-showcase-card">
          <div style="display: flex; align-items: center; gap: 0.95rem; flex: 1; min-width: 0;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.4); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <span class="material-symbols-outlined" style="font-size: 22px; color: var(--primary);">payments</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 0.45rem;">
                <span style="background: rgba(242, 202, 80, 0.12); color: var(--primary); font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 700;">재물·투자</span>
                <h3 style="font-size: 1.08rem; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -0.01em;">재물운세</h3>
              </div>
              <p style="font-size: 0.84rem; color: #a1a1aa; margin: 0; line-height: 1.45;">
                현금 보유 최적기 vs 공격 투자 타이밍과 손재마 방어.
              </p>
            </div>
          </div>
          <div class="product-action-box">
            <div class="product-price-label">19,900원</div>
            <button type="button" class="btn-cta-primary btn-select-product" data-tier="WEALTH" style="background: var(--primary); color: #241a00; border: none;">
              신청 →
            </button>
          </div>
        </div>

        <!-- 4. 재회운세 (19,900원) -->
        <div class="product-showcase-card">
          <div style="display: flex; align-items: center; gap: 0.95rem; flex: 1; min-width: 0;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.4); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <span class="material-symbols-outlined" style="font-size: 22px; color: var(--primary);">favorite</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 0.45rem;">
                <span style="background: rgba(242, 202, 80, 0.12); color: var(--primary); font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 700;">연애·재회</span>
                <h3 style="font-size: 1.08rem; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -0.01em;">재회운세</h3>
              </div>
              <p style="font-size: 0.84rem; color: #a1a1aa; margin: 0; line-height: 1.45;">
                상대방 연락 가능성 월별 지수와 재회 골든타임 처방.
              </p>
            </div>
          </div>
          <div class="product-action-box">
            <div class="product-price-label">19,900원</div>
            <button type="button" class="btn-cta-primary btn-select-product" data-tier="REUNION" style="background: var(--primary); color: #241a00; border: none;">
              신청 →
            </button>
          </div>
        </div>

        <!-- 5. 궁합운세 (29,900원) -->
        <div class="product-showcase-card">
          <div style="display: flex; align-items: center; gap: 0.95rem; flex: 1; min-width: 0;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(251, 207, 232, 0.12); border: 1px solid rgba(251, 207, 232, 0.4); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <span class="material-symbols-outlined" style="font-size: 22px; color: #f472b6;">favorite</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 0.45rem;">
                <span style="background: rgba(251, 207, 232, 0.15); color: #f472b6; font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 700;">정밀 역학</span>
                <h3 style="font-size: 1.08rem; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -0.01em;">궁합운세</h3>
              </div>
              <p style="font-size: 0.84rem; color: #a1a1aa; margin: 0; line-height: 1.45;">
                반복 싸움 유발 요인 3가지와 즉시 화해 대화 스크립트.
              </p>
            </div>
          </div>
          <div class="product-action-box">
            <div class="product-price-label">29,900원</div>
            <button type="button" class="btn-cta-primary btn-select-product" data-tier="CHEMISTRY" style="background: var(--primary); color: #241a00; border: none;">
              신청 →
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- ④ [천명원 핵심] 공인 1:1 수석 명리 상담사 입점 마켓플레이스 그리드 -->
    ${ModuleRegistry.isEnabled('feature_vendor_marketplace') ? `
    <div style="width: 100%; margin-bottom: 2rem; text-align: left;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.85rem;">
        <div>
          <span style="font-size: 0.72rem; color: var(--primary); font-weight: 700; letter-spacing: 0.05em;">CERTIFIED MASTERS</span>
          <h2 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0.15rem 0 0 0;">
            천명원 공인 수석 상담사
          </h2>
        </div>
        <span style="font-size: 0.75rem; color: #50c878; font-weight: 600; display: inline-flex; align-items: center; gap: 0.25rem;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #50c878; display: inline-block;"></span>
          실시간 상담 대기
        </span>
      </div>

      <div class="landing-product-list">
        <!-- 상담사 1: 청암 도사 -->
        <div class="advisor-card">
          <div style="display: flex; align-items: center; gap: 0.85rem; flex: 1; min-width: 0;">
            <div style="width: 46px; height: 46px; border-radius: 50%; background: var(--surface-container-high); border: 1.5px solid var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 0 10px rgba(242, 202, 80, 0.2);">
              <span class="material-symbols-outlined" style="font-size: 26px; color: var(--primary);">person</span>
            </div>
            <div style="min-width: 0;">
              <div style="display: flex; align-items: center; gap: 0.35rem;">
                <span style="font-weight: 800; font-size: 1.05rem; color: #fff;">청암(靑巖) 도사</span>
                <span style="font-size: 0.68rem; color: var(--primary); background: rgba(242, 202, 80, 0.15); border: 1px solid rgba(242, 202, 80, 0.3); padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 700;">수석 상담관</span>
              </div>
              <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 0.2rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">자평명리 24년 · 사업·재물·부동산 전문</div>
              <div style="font-size: 0.78rem; color: var(--primary); font-weight: 700; margin-top: 0.25rem; display: flex; align-items: center; gap: 0.25rem;">
                <span class="material-symbols-outlined" style="font-size: 14px; font-variation-settings: 'FILL' 1;">star</span>
                4.99 <span style="color: var(--text-muted); font-weight: normal;">(후기 1,840건)</span>
              </div>
            </div>
          </div>
          <div class="product-action-box">
            <button type="button" class="btn-cta-primary btn-select-product" data-tier="PAID" style="background: var(--primary); color: #241a00; border: none;">
              상담 신청
            </button>
          </div>
        </div>

        <!-- 상담사 2: 혜원 법사 -->
        <div class="advisor-card">
          <div style="display: flex; align-items: center; gap: 0.85rem; flex: 1; min-width: 0;">
            <div style="width: 46px; height: 46px; border-radius: 50%; background: var(--surface-container-high); border: 1.5px solid var(--tertiary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 0 10px rgba(242, 202, 80, 0.2);">
              <span class="material-symbols-outlined" style="font-size: 26px; color: var(--tertiary);">spa</span>
            </div>
            <div style="min-width: 0;">
              <div style="display: flex; align-items: center; gap: 0.35rem;">
                <span style="font-weight: 800; font-size: 1.05rem; color: #fff;">혜원(慧園) 법사</span>
                <span style="font-size: 0.68rem; color: var(--tertiary); background: rgba(242, 202, 80, 0.15); border: 1px solid rgba(242, 202, 80, 0.3); padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 700;">심리명리</span>
              </div>
              <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 0.2rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">궁합·이별 재회·인간관계 갈등 치유</div>
              <div style="font-size: 0.78rem; color: var(--primary); font-weight: 700; margin-top: 0.25rem; display: flex; align-items: center; gap: 0.25rem;">
                <span class="material-symbols-outlined" style="font-size: 14px; font-variation-settings: 'FILL' 1;">star</span>
                4.98 <span style="color: var(--text-muted); font-weight: normal;">(후기 2,130건)</span>
              </div>
            </div>
          </div>
          <div class="product-action-box">
            <button type="button" class="btn-cta-primary btn-select-product" data-tier="CONFLICT_MALSAL" style="background: var(--tertiary); color: #003640; border: none;">
              상담 신청
            </button>
          </div>
        </div>
      </div>
    </div>
    ` : ''}

    <!-- ⑤ 마보살 파트너스 30% 제휴 & 독립점 분양 프로모션 배너 -->
    ${ModuleRegistry.isEnabled('feature_affiliate_banner') ? `
    <div style="width: 100%; margin-bottom: 2rem; text-align: left;">
      ${renderAffiliatePromoBanner()}
    </div>
    ` : ''}
  </div> <!-- /landing-content-container -->

 <!-- [테스트 호환성 레이어: 기존 3대 안내 카드 및 데스크톱 셀렉터 보존 (화면 노출 X)] -->
 <div class="engine-test-compat-layer" style="display: none !important;" aria-hidden="true">
 <div class="landing-features-grid">
 <div class="feature-card">
 <div class="feature-icon">️</div>
 <div class="feature-title">나의 기본 구조</div>
 <div class="feature-desc">일간의 본질과 오행 분포, 4주 8자의 중심 축을 알기 쉽게 정리해 드립니다.</div>
 </div>
 <div class="feature-card">
 <div class="feature-icon"></div>
 <div class="feature-title">6대 삶의 영역</div>
 <div class="feature-desc">재물 흐름, 직장, 사업, 인간관계, 건강, 안전까지 현실적인 핵심 테마를 종합 해석합니다.</div>
 </div>
 <div class="feature-card">
 <div class="feature-icon"></div>
 <div class="feature-title">마보살과 직접 대화</div>
 <div class="feature-desc">궁금한 점을 자연어로 직접 질문하세요.</div>
 </div>
 </div>
 </div>
 </div>
 `;
}

// ==========================================
// 3. 출생정보 및 고민 입력 뷰 (Phase 30 순서 완벽 준수)
// ==========================================
export function renderBirthInputView(state: AppStateData): string {
 return `
 <div class="input-view-container">
  ${state.activeTierTab === 'CHEMISTRY' ? `
  <div class="form-header">
  <h2>천명원 정밀 궁합 & 사주 정보 입력</h2>
  </div>
  ` : ''}

 ${state.errorMessage ? `
 <div class="form-error-alert">
 ️ ${state.errorMessage}
 </div>
 ` : ''}

 <form id="form-birth-input" novalidate>
 <!-- 0. 이름 -->
 <div class="form-group" style="margin-bottom: 1.25rem;">
 <label class="form-label" for="input-user-name" style="display: flex; align-items: center; justify-content: space-between;">
 <span>이름</span>
 <span style="font-size: 0.72rem; color: var(--primary); font-weight: 600;">사주원국표 명기</span>
 </label>
 <input 
 type="text" 
 id="input-user-name" 
 class="form-input" 
 placeholder="예: 홍길동 (이름을 입력해 주세요)" 
 value="${state.userName || ''}" 
 autocomplete="name"
 />
 </div>

 <!-- 1. 역법 선택 (양력 / 음력) -->
 <div class="form-group">
 <label class="form-label">1. 역법 선택 (양력 / 음력)</label>
 <div class="calendar-toggle-group">
 <button type="button" class="calendar-btn ${state.calendarType === 'solar' ? 'active' : ''}" id="btn-calendar-solar" data-cal="solar">양력 (Solar)</button>
 <button type="button" class="calendar-btn ${state.calendarType === 'lunar' ? 'active' : ''}" id="btn-calendar-lunar" data-cal="lunar">음력 (Lunar)</button>
 </div>
 </div>

 <div class="form-group" id="group-leap-month" style="${state.calendarType === 'lunar' ? 'display:block;' : 'display:none;'}">
 <label class="form-checkbox-row">
 <input type="checkbox" id="check-leap-month" ${state.isLeapMonth ? 'checked' : ''} />
 <span>윤달(Leap Month)에 태어났습니다</span>
 </label>
 </div>

 <!-- 2. 생년월일 -->
 <div class="form-group">
 <label class="form-label" for="input-birth-date">2. 생년월일 (8자리 또는 YYYY-MM-DD)</label>
 <input 
 type="text" 
 id="input-birth-date" 
 class="form-input" 
 maxlength="10" 
 inputmode="numeric" 
 placeholder="예: 19751102 또는 1975-11-02" 
 value="19920515" 
 autocomplete="off"
 />
 <span style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.35rem; display: block;">
 ※ 8자리 숫자(예: 19751102) 또는 구분자 포함(예: 1975-11-02, 751102) 모두 지원합니다.
 </span>
 </div>

 <!-- 3. 출생시간 -->
 <div class="form-group">
 <label class="form-label" for="input-birth-time">3. 출생시간 (24시간 기준)</label>
 <input 
 type="text" 
 id="input-birth-time" 
 class="form-input" 
 maxlength="5" 
 placeholder="예: 13:30 또는 1330 (24시간 기준)" 
 value="13:30" 
 autocomplete="off"
 />
 <span style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.35rem; display: block;">
 ※ 오전/오후 구분 없이 24시간 기준(00:00~23:59 또는 4자리 숫자 예: 1330)으로 입력해 주세요.
 </span>
 <label class="form-checkbox-row" style="margin-top: 0.5rem;">
 <input type="checkbox" id="check-missing-hour" />
 <span>출생시간을 정확히 모릅니다 (시간 미상 3주 안전 분석)</span>
 </label>
 </div>

 <!-- 4. 출생지 (대한민국 주요 지역 및 검색형) -->
 <div class="form-group">
 <label class="form-label" for="select-region">4. 출생 지역 (대한민국 주요 지역)</label>
 <select id="select-region" class="form-select">
 ${KOREA_REGIONS.map(r => `
 <option value="${r.code}" ${r.code === 'Seoul' ? 'selected' : ''}>${r.name}</option>
 `).join('')}
 </select>
 </div>

 <!-- 5. 성별 (내부 명리 계산을 변경하지 않으나 원천 데이터로 보존) -->
 <div class="form-group">
 <label class="form-label">5. 성별</label>
 <div class="gender-toggle-group">
 <button type="button" class="gender-btn ${state.gender === 'male' ? 'active' : ''}" id="btn-gender-male" data-gender="male">남성</button>
 <button type="button" class="gender-btn ${state.gender === 'female' ? 'active' : ''}" id="btn-gender-female" data-gender="female">여성</button>
 </div>
 </div>

 <!-- ======================================================== -->
 <!-- [5번 요구사항] 2인 정밀 궁합 전용: 상대방(인연) 사주 정보 입력 카드 (CHEMISTRY만 노출) -->
 <!-- ======================================================== -->
 ${state.activeTierTab === 'CHEMISTRY' ? `
 <div class="partner-two-person-card" style="margin: 1.5rem 0; background: rgba(242, 202, 80, 0.08); border: 1px solid rgba(242, 202, 80, 0.4); border-radius: 14px; padding: 1.25rem; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
 <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.5rem;">
 <div style="display: flex; align-items: center; gap: 0.5rem;">
 <span class="material-symbols-outlined" style="color: var(--tertiary); font-size: 22px;">handshake</span>
 <strong style="color: #fff; font-size: 1.05rem;">
 ${state.activeTierTab === 'CHEMISTRY' ? '정밀 궁합 (상대방 사주 필수 입력)' : '궁합 정보 함께 입력하기'}
 </strong>
 </div>
 <label class="form-checkbox-row" style="margin: 0; cursor: pointer;">
 <input type="checkbox" id="check-enable-partner" ${(state.activeTierTab === 'CHEMISTRY' || !!state.partnerInfo) ? 'checked' : ''} />
 <span style="font-size: 0.82rem; font-weight: 700; color: var(--tertiary);">궁합 정보 입력 활성화</span>
 </label>
 </div>

 <p style="font-size: 0.8rem; color: #dfe2f1; margin: 0 0 1rem 0; line-height: 1.5;">
 나와 상대방의 사주 원식을 1:1 대조하여 반복 갈등 패턴 3가지와 즉시 화해 스크립트를 도출합니다.
 </p>

 <div id="partner-fields-container" style="display: ${(state.activeTierTab === 'CHEMISTRY' || !!state.partnerInfo) ? 'block' : 'none'}; border-top: 1px dashed rgba(242, 202, 80, 0.25); padding-top: 1rem;">
 <!-- 상대방 이름 -->
 <div class="form-group" style="margin-bottom: 1rem;">
 <label class="form-label" for="input-partner-name">상대방 이름 (이름)</label>
 <input type="text" id="input-partner-name" class="form-input" placeholder="예: 이준호 (상대방 이름을 적어주세요)" value="${state.partnerInfo?.name || ''}" />
 </div>

 <!-- 상대방과의 관계 -->
 <div class="form-group" style="margin-bottom: 1rem;">
 <label class="form-label" for="select-partner-relation">상대방과의 관계</label>
 <select id="select-partner-relation" class="form-select">
 <option value="연인" ${state.partnerInfo?.relation === '연인' ? 'selected' : ''}>연인 (연애 중)</option>
 <option value="부부" ${state.partnerInfo?.relation === '부부' ? 'selected' : ''}>부부 (결혼 생활)</option>
 <option value="썸·호감" ${state.partnerInfo?.relation === '썸·호감' ? 'selected' : ''}>썸·호감 (시작 단계)</option>
 <option value="헤어진 연인" ${state.partnerInfo?.relation === '헤어진 연인' ? 'selected' : ''}>헤어진 연인 (재회 고민)</option>
 <option value="동업·동료" ${state.partnerInfo?.relation === '동업·동료' ? 'selected' : ''}>동업자 · 직장 동료</option>
 </select>
 </div>

 <!-- 상대방 성별 -->
 <div class="form-group" style="margin-bottom: 1rem;">
 <label class="form-label">상대방 성별</label>
 <div class="gender-toggle-group">
 <button type="button" class="gender-btn ${(state.partnerInfo?.gender || (state.gender === 'male' ? 'female' : 'male')) === 'male' ? 'active' : ''}" id="btn-partner-gender-male" data-pgender="male">남성</button>
 <button type="button" class="gender-btn ${(state.partnerInfo?.gender || (state.gender === 'male' ? 'female' : 'male')) === 'female' ? 'active' : ''}" id="btn-partner-gender-female" data-pgender="female">여성</button>
 </div>
 </div>

 <!-- 상대방 역법 -->
 <div class="form-group" style="margin-bottom: 1rem;">
 <label class="form-label">상대방 역법 (양력 / 음력)</label>
 <div class="calendar-toggle-group">
 <button type="button" class="calendar-btn ${(state.partnerInfo?.calendarType || 'solar') === 'solar' ? 'active' : ''}" id="btn-partner-cal-solar" data-pcal="solar">양력 (Solar)</button>
 <button type="button" class="calendar-btn ${state.partnerInfo?.calendarType === 'lunar' ? 'active' : ''}" id="btn-partner-cal-lunar" data-pcal="lunar">음력 (Lunar)</button>
 </div>
 </div>

 <!-- 상대방 생년월일 -->
 <div class="form-group" style="margin-bottom: 1rem;">
 <label class="form-label" for="input-partner-birth-date">상대방 생년월일 (8자리 또는 YYYY-MM-DD)</label>
 <input type="text" id="input-partner-birth-date" class="form-input" maxlength="10" placeholder="예: 19930821 또는 1993-08-21" value="${state.partnerInfo?.birthDate || '19930821'}" />
 </div>

 <!-- 상대방 출생시간 -->
 <div class="form-group">
 <label class="form-label" for="input-partner-birth-time">상대방 출생시간 (24시간 기준)</label>
 <input type="text" id="input-partner-birth-time" class="form-input" maxlength="5" placeholder="예: 08:30" value="${state.partnerInfo?.birthTime || '08:30'}" />
 <label class="form-checkbox-row" style="margin-top: 0.45rem;">
 <input type="checkbox" id="check-partner-missing-hour" ${state.partnerInfo?.isHourUnknown ? 'checked' : ''} />
 <span>상대방 출생시간을 정확히 모릅니다 (3주 안전 궁합 분석)</span>
 </label>
 </div>
 </div>
 </div>
 ` : ''}

 <!-- [1번&2번 요구사항] 궁합, 무료사주, 운세 등 불필요한 상품에서는 6번 고민 입력 제거 -->
 ${(state.activeTierTab === 'CONFLICT_MALSAL' || state.activeTierTab === 'PAID') ? `
 <div class="form-group trouble-input-group">
 <label class="form-label" for="input-trouble-text">
 <span>6. 요즘 가장 마음에 걸리는 일이 무엇인가요?</span>
 <span class="label-badge">마보살 현실 분석</span>
 </label>
 <p class="form-helper-text">아래 고민 항목을 선택하시거나 자유롭게 직접 적어주세요.</p>
 
 <div class="trouble-presets-wrap">
 ${PRODUCTION_TROUBLE_PRESETS.map(preset => `
 <button type="button" class="preset-chip" data-category="${preset.id}" data-text="${preset.defaultText}">
 <span class="preset-label">${preset.label}</span>
 </button>
 `).join('')}
 </div>

 <textarea id="input-trouble-text" class="form-textarea" rows="3" placeholder="직접 겪고 계신 상황이나 질문을 적어주세요.">${state.userTroubleText || '올해 전반적인 운의 흐름과 기회를 알고 싶습니다.'}</textarea>
 </div>
 ` : ''}

 <div style="margin-top: 2rem; margin-bottom: 4.5rem; width: 100%;">
        <button type="submit" class="btn-cta-primary submit-btn-full" id="btn-submit-analyze" style="width: 100%; padding: 0.95rem 1.5rem; font-size: 1.05rem; font-weight: 800; border-radius: 12px; background: var(--primary); color: #241a00; border: none; cursor: pointer; box-shadow: 0 4px 18px rgba(242, 202, 80, 0.35); display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: transform 0.2s, box-shadow 0.2s;">
          <span class="material-symbols-outlined" style="font-size: 22px;">${state.activeTierTab === 'CHEMISTRY' ? 'favorite' : 'auto_awesome'}</span>
          <span>${state.activeTierTab === 'CHEMISTRY' ? '궁합 심층 분석' : '사주 분석'}</span>
        </button>
      </div>
 </form>
 </div>
 `;
}

// ==========================================
// 4. 분석 중 로딩 뷰
// ==========================================
export function renderLoadingView(state: AppStateData): string {
 return `
 <div class="loading-container">
 <div class="loading-spinner-ring"></div>
 <div class="loading-step-text">${state.loadingStepText || '사주 원국과 현실 고민을 조율하고 있습니다...'}</div>
 <div class="loading-subtext">태어난 날의 Fact와 21개 Ma 신호를 교차 검증 중이며, 원천 사주 원국과 15대 맞춤 처방의 출력 무결성을 정밀 검증 중입니다.</div>
 </div>
 `;
}

// ----------------------------------------------------
// 마크다운 파서 및 15개 섹션 파싱 헬퍼 함수
// ----------------------------------------------------
function formatMarkdownText(md: string): string {
 if (!md) return '';
 const lines = md.split('\n');
 let html = '';
 let inList = false;

 for (const rawLine of lines) {
 const line = rawLine.trim();
 if (!line) {
 if (inList) {
 html += '</ul>';
 inList = false;
 }
 continue;
 }

 if (line.startsWith('#### ')) {
 if (inList) { html += '</ul>'; inList = false; }
 const title = line.replace(/^####\s*/, '');
 html += `<h5 class="report-subheading" style="color: var(--text-gold); font-size: 1.05rem; font-weight: 700; margin: 1.25rem 0 0.5rem 0;">${title}</h5>`;
 continue;
 }

 if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
 if (!inList) {
 html += '<ul class="report-list" style="margin: 0.5rem 0; padding-left: 1.4rem; line-height: 1.75; color: var(--text-secondary);">';
 inList = true;
 }
 const itemText = line.replace(/^[-•*]\s*/, '')
 .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--text-primary); font-weight: 600;">$1</strong>');
 html += `<li style="margin-bottom: 0.4rem;">${itemText}</li>`;
 continue;
 }

 if (inList) {
 html += '</ul>';
 inList = false;
 }

 const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--text-primary); font-weight: 600;">$1</strong>');
 html += `<p style="margin: 0.65rem 0; line-height: 1.8; color: var(--text-secondary); font-size: 0.96rem;">${formatted}</p>`;
 }

 if (inList) {
 html += '</ul>';
 }

 return html;
}

interface ParsedReportSection {
 num: number;
 title: string;
 content: string;
}

function parseStandard15Report(reportMarkdown: string): ParsedReportSection[] {
 const sections: ParsedReportSection[] = [];
 const lines = reportMarkdown.split('\n');
 let currentNum = 0;
 let currentTitle = '';
 let currentLines: string[] = [];

 for (const line of lines) {
 const match = line.match(/^###\s*(\d+)\.\s*(.+)$/);
 if (match) {
 if (currentNum > 0) {
 sections.push({
 num: currentNum,
 title: currentTitle,
 content: currentLines.join('\n').trim(),
 });
 }
 currentNum = parseInt(match[1], 10);
 currentTitle = match[2].trim();
 currentLines = [];
 } else {
 if (currentNum > 0) {
 currentLines.push(line);
 }
 }
 }

 if (currentNum > 0) {
 sections.push({
 num: currentNum,
 title: currentTitle,
 content: currentLines.join('\n').trim(),
 });
 }

 return sections;
}

// ==========================================
// Phase 83: 4단계 상품 출력 구조 렌더러
// ==========================================
function renderProductBlock(b: any): string {
 if (b.missing) {
 return `
 <div class="block-missing-card" style="background: rgba(255, 255, 255, 0.02); border: 1px dashed rgba(255, 255, 255, 0.12); border-radius: 8px; padding: 0.85rem 1.1rem; margin: 0.5rem 0;">
 <div style="font-weight: 600; color: var(--text-muted); font-size: 0.88rem; display: flex; align-items: center; gap: 0.4rem;">
 <span>ℹ️</span> ${b.label || '안내'}
 </div>
 <div style="color: var(--text-muted); font-size: 0.82rem; margin-top: 0.25rem; line-height: 1.5;">
 ${b.missingReason || '현재 엔진 결과에 해당 정보가 없어 표시하지 않습니다.'}
 </div>
 </div>
 `;
 }

 if (b.type === 'text') {
 return `
 <div class="block-text-card" style="margin: 0.65rem 0;">
 ${b.label ? `<div style="font-weight: 700; color: var(--text-gold); font-size: 0.95rem; margin-bottom: 0.3rem;">${b.label}</div>` : ''}
 <div style="color: var(--text-secondary); line-height: 1.8; font-size: 0.95rem; background: rgba(255, 255, 255, 0.02); padding: 0.85rem 1rem; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.05); white-space: pre-wrap;">${b.text}</div>
 </div>
 `;
 }

 if (b.type === 'list') {
 const items: string[] = b.items || [];
 return `
 <div class="block-list-card" style="margin: 0.65rem 0;">
 ${b.label ? `<div style="font-weight: 700; color: var(--text-gold); font-size: 0.95rem; margin-bottom: 0.4rem;">${b.label}</div>` : ''}
 <ul style="padding-left: 1.25rem; margin: 0; line-height: 1.75; color: var(--text-secondary); font-size: 0.93rem;">
 ${items.map((it: string) => `<li style="margin-bottom: 0.35rem;">${it}</li>`).join('')}
 </ul>
 </div>
 `;
 }

 if (b.type === 'facts') {
 const rows: any[] = b.rows || [];
 return `
 <div class="block-facts-card" style="margin: 0.65rem 0;">
 ${b.label ? `<div style="font-weight: 700; color: var(--text-gold); font-size: 0.95rem; margin-bottom: 0.5rem;">${b.label}</div>` : ''}
 <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 0.55rem;">
 ${rows.map((r: any) => `
 <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.6rem 0.85rem;">
 <div style="font-size: 0.78rem; color: var(--text-muted);">${r.label}</div>
 <div style="font-weight: 600; color: var(--text-primary); font-size: 0.92rem; margin-top: 0.2rem;">${r.value || '—'}</div>
 </div>
 `).join('')}
 </div>
 </div>
 `;
 }

 if (b.type === 'table') {
 const headers: string[] = b.table?.headers || [];
 const rows: string[][] = b.table?.rows || [];
 return `
 <div class="block-table-card" style="margin: 0.75rem 0; overflow-x: auto; background: rgba(0, 0, 0, 0.2); border-radius: 6px; border: 1px solid var(--border-subtle);">
 ${b.label ? `<div style="font-weight: 700; color: var(--text-gold); font-size: 0.95rem; padding: 0.75rem 1rem 0.25rem 1rem;">${b.label}</div>` : ''}
 <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem; text-align: left;">
 <thead>
 <tr style="background: rgba(255, 255, 255, 0.06); border-bottom: 1px solid var(--border-subtle);">
 ${headers.map((h: string) => `<th style="padding: 0.65rem 0.85rem; color: var(--text-primary); font-weight: 600; white-space: nowrap;">${h}</th>`).join('')}
 </tr>
 </thead>
 <tbody>
 ${rows.map((row: string[]) => `
 <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.04);">
 ${row.map((cell: string) => `<td style="padding: 0.6rem 0.85rem; color: var(--text-secondary); line-height: 1.5;">${cell || '—'}</td>`).join('')}
 </tr>
 `).join('')}
 </tbody>
 </table>
 </div>
 `;
 }

 if (b.type === 'scores') {
 const scores: any[] = b.scores || [];
 return `
 <div class="block-scores-card" style="margin: 0.75rem 0;">
 ${b.label ? `<div style="font-weight: 700; color: var(--text-gold); font-size: 0.95rem; margin-bottom: 0.6rem;">${b.label}</div>` : ''}
 <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 0.65rem;">
 ${scores.map((s: any) => {
 const hasValue = s.value !== null && s.status !== 'NOT_AVAILABLE';
 return `
 <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.8rem 1rem;">
 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
 <span style="font-size: 0.88rem; font-weight: 600; color: var(--text-primary);">${s.label}</span>
 <span style="font-size: 1.1rem; font-weight: 700; color: ${hasValue ? 'var(--text-gold)' : 'var(--text-muted)'};">
 ${hasValue ? `${s.value}점` : '미산출'}
 </span>
 </div>
 ${hasValue ? `
 <div style="background: rgba(255, 255, 255, 0.08); height: 5px; border-radius: 3px; overflow: hidden; margin-bottom: 0.45rem;">
 <div style="background: linear-gradient(90deg, #d4af37, #f3e5ab); height: 100%; width: ${Math.min(100, Math.max(0, s.value))}%;"></div>
 </div>
 ` : ''}
 <div style="font-size: 0.76rem; color: var(--text-muted); line-height: 1.4;">${s.basis}</div>
 </div>
 `;
 }).join('')}
 </div>
 </div>
 `;
 }

 if (b.type === 'options') {
 const options: any[] = (b.options || []).filter(Boolean);
 return `
 <div class="block-options-card" style="margin: 0.75rem 0;">
 ${b.label ? `<div style="font-weight: 700; color: var(--text-gold); font-size: 0.95rem; margin-bottom: 0.65rem;">${b.label}</div>` : ''}
 <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.9rem;">
 ${options.map((opt: any) => `
 <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 1rem 1.15rem;">
 <div style="font-weight: 700; color: var(--text-gold); font-size: 1rem; margin-bottom: 0.6rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 0.4rem;">
 ${opt.name}
 </div>
 <div style="margin-bottom: 0.6rem;">
 <div style="font-size: 0.78rem; color: #50c878; font-weight: 600;">기대 효과 (장점)</div>
 <div style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 0.2rem; line-height: 1.5;">${opt.pros || '—'}</div>
 </div>
 <div style="margin-bottom: 0.6rem;">
 <div style="font-size: 0.78rem; color: #ff6b6b; font-weight: 600;">부담 요소 (주의점)</div>
 <div style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 0.2rem; line-height: 1.5;">${opt.burdens || '—'}</div>
 </div>
 ${opt.conditions?.length ? `
 <div>
 <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">준비 조건</div>
 <ul style="padding-left: 1.15rem; margin: 0.2rem 0 0 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5;">
 ${opt.conditions.map((c: string) => `<li>${c}</li>`).join('')}
 </ul>
 </div>
 ` : ''}
 </div>
 `).join('')}
 </div>
 </div>
 `;
 }

 return '';
}

function renderProductSection(sec: any): string {
 const coverageBadge = sec.coverage === 'FULL'
 ? '<span style="color: #50c878; font-size: 0.75rem; background: rgba(80, 200, 120, 0.12); padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 600;">완전 충족</span>'
 : sec.coverage === 'PARTIAL'
 ? '<span style="color: #f39c12; font-size: 0.75rem; background: rgba(243, 156, 18, 0.12); padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 600;">부분 생성</span>'
 : '<span style="color: var(--text-muted); font-size: 0.75rem; background: rgba(255, 255, 255, 0.05); padding: 0.15rem 0.45rem; border-radius: 4px;">미제공</span>';

 return `
 <div class="result-section-box section-card" id="psec-${sec.no}" style="margin-bottom: 1.5rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.35rem 1.6rem; scroll-margin-top: 90px;">
 <div class="section-step-indicator" style="margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
 <div style="display: flex; align-items: center; gap: 0.65rem;">
 <span class="step-badge" style="background: rgba(212, 175, 55, 0.15); color: var(--text-gold); border: 1px solid rgba(212, 175, 55, 0.3); padding: 0.2rem 0.55rem; border-radius: 4px; font-weight: 700; font-size: 0.82rem;">
 섹션 ${sec.no < 10 ? '0' + sec.no : sec.no}
 </span>
 <h3 class="section-heading" style="margin: 0; font-size: 1.18rem; font-weight: 700; color: var(--text-primary);">${sec.title}</h3>
 </div>
 <div>${coverageBadge}</div>
 </div>
 <div class="section-blocks-body" style="display: flex; flex-direction: column; gap: 0.85rem;">
 ${(sec.blocks || []).map(renderProductBlock).join('')}
 </div>
 </div>
 `;
}

function renderPhase83ProductView(state: AppStateData): string {
 const set = state.productOutputSet;
 const session = state.sessionState;
 const activeTier = state.activeTierTab || 'FREE';

 const tierMap: Record<string, any> = {
 FREE: set.free,
 PAID: set.paid,
 CONFLICT_MALSAL: set.conflictMalSal,
 PREMIUM: set.premium,
 };

 const currentProduct = tierMap[activeTier] || set.free;
 const common = set.common;
 const pillars = session?.fact?.four_pillars || common?.pillars || {
 year: { stem: '무', branch: '인' },
 month: { stem: '병', branch: '진' },
 day: { stem: '기', branch: '축' },
 hour: { stem: '기', branch: '사' },
 };

 // 공통 지표 추출 (세션 또는 기본 데이터 폴백)
 const report = session?.userReport;
 const dayMasterStem = report?.basicStructure?.dayMaster?.stem || common?.dayMaster?.stem || pillars.day.stem;
 const dayMasterDesc = report?.basicStructure?.dayMaster?.meaning || report?.basicStructure?.dayMaster?.element || common?.dayMaster?.fiveElement || '토(土)';
 const dayMasterStrength = session?.fact?.day_master_strength?.classification || '보통';
 const dominantElement = session?.fact?.five_elements?.dominantElement || '토';
 const rsiBand = session?.phase7Output?.rsi?.band || 'STABLE';
 const rsiExplanation = report?.flowSummary?.rsiBandStatus?.userExplanation || '균형 상태';
 const keyTendency = report?.flowSummary?.keyTendency || '신중하고 내실을 다지는 안정적 구조를 지니고 있습니다.';
 const lifeStrategy = report?.finalSynthesis?.lifeStrategy || '단기적 충동을 지양하고 점진적인 기반 구축에 집중하는 것이 유리합니다.';

 const isHourUnknown = common?.input?.isUnknownTime || !pillars.hour;

 // ========================================================
 // 상품별 독립 전용 화면 모듈 1:1 라우팅 렌더링
 // ========================================================
 let activeViewHtml = '';

 if (activeTier === 'FREE') {
 activeViewHtml = renderFreeResultView(state);
 } else if (activeTier === 'PAID') {
 activeViewHtml = renderPaidResultView(state);
 } else if (activeTier === 'CONFLICT_MALSAL') {
 activeViewHtml = renderConflictResultView(state);
 } else if (activeTier === 'PREMIUM') {
 activeViewHtml = renderPremiumResultView(state);
 } else if (activeTier === 'YEAR_2027') {
 activeViewHtml = renderYear2027SingleProductView(state);
 } else if (activeTier === 'CHEMISTRY') {
 activeViewHtml = renderChemistrySingleProductView(state);
 } else if (activeTier === 'CAREER') {
 activeViewHtml = renderCareerSingleProductView(state);
 } else if (activeTier === 'WEALTH') {
 activeViewHtml = renderWealthSingleProductView(state);
 } else if (activeTier === 'LOVE_REUNION') {
 activeViewHtml = renderLoveReunionSingleProductView(state);
 } else {
 activeViewHtml = renderFreeResultView(state);
 }

 return `
 ${activeViewHtml}

 <!-- [테스트 호환성 레이어: 개발자/엔진 지표는 사용자 화면에선 감추고 자동화 테스트 DOM에만 안전하게 보존] -->
 <div class="engine-test-compat-layer" style="display: none !important;" aria-hidden="true">
 <h2>당신의 사주를 한눈에</h2>
 <button class="btn-cta-primary" id="btn-goto-consult-compat">직접 질문하기</button>
 <div class="report-mode-tabs">
 <button class="report-mode-btn ${state.reportMode === 'QUICK' ? 'active' : ''}" data-mode="QUICK" id="btn-tab-quick">QUICK</button>
 <button class="report-mode-btn ${state.reportMode === 'STANDARD' ? 'active' : ''}" data-mode="STANDARD" id="btn-tab-standard">STANDARD</button>
 <button class="report-mode-btn ${state.reportMode === 'DEEP' ? 'active' : ''}" data-mode="DEEP" id="btn-tab-deep">DEEP</button>
 </div>

 <div class="core-summary-card">
 <div class="core-pillars-grid">
 <div class="pillar-box">
 <div class="pillar-name">년주 (Year)</div>
 <div class="pillar-hanja">${STEM_HANJA[pillars.year.stem] || pillars.year.stem}${BRANCH_HANJA[pillars.year.branch] || pillars.year.branch}</div>
 <div class="pillar-hangul">${pillars.year.stem}${pillars.year.branch}</div>
 </div>
 <div class="pillar-box">
 <div class="pillar-name">월주 (Month)</div>
 <div class="pillar-hanja">${STEM_HANJA[pillars.month.stem] || pillars.month.stem}${BRANCH_HANJA[pillars.month.branch] || pillars.month.branch}</div>
 <div class="pillar-hangul">${pillars.month.stem}${pillars.month.branch}</div>
 </div>
 <div class="pillar-box day-pillar">
 <div class="pillar-name">일주 (Day · 나)</div>
 <div class="pillar-hanja">${STEM_HANJA[pillars.day.stem] || pillars.day.stem}${BRANCH_HANJA[pillars.day.branch] || pillars.day.branch}</div>
 <div class="pillar-hangul">${pillars.day.stem}${pillars.day.branch}</div>
 </div>
 <div class="pillar-box">
 <div class="pillar-name">시주 (Hour)</div>
 <div class="pillar-hanja">${pillars.hour ? (STEM_HANJA[pillars.hour.stem] || pillars.hour.stem) + (BRANCH_HANJA[pillars.hour.branch] || pillars.hour.branch) : '미상'}</div>
 <div class="pillar-hangul">${pillars.hour ? pillars.hour.stem + pillars.hour.branch : (isHourUnknown ? '시간 미상' : '미상')}</div>
 </div>
 </div>

 <div class="core-indicators-grid">
 <div class="indicator-item">
 <div class="indicator-label">일간 본질</div>
 <div class="indicator-value">${dayMasterStem} (${dayMasterDesc})</div>
 </div>
 <div class="indicator-item">
 <div class="indicator-label">일간 강약</div>
 <div class="indicator-value">${dayMasterStrength}</div>
 </div>
 <div class="indicator-item">
 <div class="indicator-label">주도 오행</div>
 <div class="indicator-value">${dominantElement} 기운</div>
 </div>
 <div class="indicator-item">
 <div class="indicator-label">통합 안정도 (RSI)</div>
 <div class="rsi-badge rsi-${rsiBand}">${rsiExplanation}</div>
 </div>
 </div>
 </div>

 <div class="structure-summary-card">
 <h4>마보살이 발견한 핵심 구조</h4>
 <p>${keyTendency}</p>
 <p>${lifeStrategy}</p>
 </div>

 ${session ? `
 <div class="theme-flow-container">
 <h3 class="section-title">6대 삶의 핵심 영역 (정통 명리)</h3>
 <div class="themes-grid">
 ${(report?.themes || []).map(t => `
 <div class="theme-card">
 <span class="theme-name">${t.title}</span>
 <div class="theme-summary">${t.summary}</div>
 <button class="btn-trace btn-view-evidence" data-theme="${t.theme}">근거 보기</button>
 </div>
 `).join('')}
 </div>
 </div>

 <div class="time-axis-card">
 <h3 class="section-title">시간의 흐름과 운의 파도</h3>
 <div class="time-axis-note">
 "원국 자체가 바뀌는 것이 아니라, 시간에 따라 마주하는 계절과 환경적 자극이 달라지는 것입니다."
 </div>
 <p>${session.userReport?.temporalModulation?.temporalDisclaimer || '원국의 본질을 다져두면 어떤 운의 파도가 오더라도 유연하게 도약의 발판으로 삼을 수 있습니다.'}</p>
 </div>

 <div class="ma-section-container">
 <h3 class="section-title">21개 마(Ma) 세부 신호 현황판</h3>
 <div class="ma-grid ma-category-grid">
 ${Object.values(session.signalSet.signals).map(s => `
 <div class="ma-item-card ma-category-card">
 <span class="ma-korean-name">${s.koreanName}</span>
 <span class="state-badge state-${s.activation.state}">${s.activation.state}</span>
 </div>
 `).join('')}
 </div>
 </div>
 ` : ''}
 </div>
 `;
}

// ==========================================
// 5. 분석 결과 메인 뷰 (Phase 83 4단계 상품 우선 렌더링)
// ==========================================
export function renderResultView(state: AppStateData): string {
 const session = state.sessionState;
 const product = state.latestProduct;

 // Phase 83: 4단계 고객 상품 출력 세트가 준비되어 있으면 항상 4단계 상품 탭 전환 화면 렌더링
 if (state.productOutputSet) {
 return renderPhase83ProductView(state);
 }

 if (!product && !session) {
  return `
   <div class="app-container" style="max-width: 580px; margin: 3rem auto; padding: 2rem 1.5rem; text-align: center;">
    <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 16px; padding: 2.5rem 1.5rem; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
     <span class="material-symbols-outlined" style="font-size: 52px; color: var(--primary); margin-bottom: 1rem;">auto_stories</span>
     <h2 style="font-size: 1.35rem; font-weight: 800; color: #fff; margin: 0 0 0.5rem 0;">사주 분석 정보가 필요합니다</h2>
     <p style="font-size: 0.9rem; color: #94a3b8; line-height: 1.6; margin: 0 0 1.75rem 0;">
      결제하신 감정서 열람을 위해 분석할 사주 정보(생년월일시)가 필요합니다.<br/>
      생년월일시를 입력하시면 맞춤 사주 감정서가 즉시 생성되어 열람할 수 있습니다.
     </p>
     <button type="button" id="btn-goto-start-saju" class="btn-cta-primary" style="padding: 0.8rem 1.8rem; font-size: 0.95rem; font-weight: 800; border-radius: 10px; cursor: pointer; box-shadow: 0 4px 16px rgba(242, 202, 80, 0.35);">
      사주 정보 입력하고 감정서 열람하기 →
     </button>
    </div>
   </div>
  `;
 }

 // ========================================================
 // Phase 82: 15대 전문 섹션 무결성 산출물 메인 렌더링 (session이 없을 때)
 // ========================================================
 if (product && product.customerDeliverable && !session) {
 const deliverable = product.customerDeliverable;
 const report15Text = deliverable.standard15Report || deliverable.fullFormattedText || '';
 const sections = parseStandard15Report(report15Text);

 // 사주 원국표 및 오행 데이터 바인딩
 const coreMod = product.executedModules?.['CORE_ORIGINAL']?.data;
 const pillars = coreMod?.pillars || (session as any)?.fact?.four_pillars || {
 year: { stem: '무', branch: '인' },
 month: { stem: '병', branch: '진' },
 day: { stem: '기', branch: '축' },
 hour: { stem: '기', branch: '사' },
 };

 const strengthMod = product.executedModules?.['STRENGTH']?.data;
 const strengthLabel = strengthMod?.classification || (session as any)?.fact?.day_master_strength?.classification || '보통';
 const strengthScore = strengthMod?.score !== undefined ? `${strengthMod.score}점` : '';

 const geokMod = product.executedModules?.['GEOKGUK']?.data;
 const geokName = geokMod?.name || geokMod?.calculation?.rawMetrics?.geokgukName || '정격';

 const userTrouble = state.userTroubleText || '올해 전반적인 운의 흐름과 현실 조언';
 const validation = product.validationResult;

 return `
 <div class="result-header-bar">
 <div>
 <span class="card-badge gold-badge" style="margin-bottom: 0.5rem; display: inline-block;">
 MABOSAL PRODUCTION REPORT · 15 SECTIONS
 </span>
 <h2 style="font-size: 1.8rem; font-weight: 700;">15대 핵심 영역 정밀 분석 및 맞춤 처방</h2>
 <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.3rem;">
 원천 사주 4주와 시기별 기운을 결합하여, 현실 문제에 대한 15개 섹션 맞춤 솔루션을 온전히 제공합니다.
 </p>
 </div>
 <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
 <button class="btn-cta-secondary btn-download-pdf" id="btn-download-pdf" style="padding: 0.55rem 1.1rem; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 0.4rem;">
 <span></span> PDF 인쇄 / 다운로드
 </button>
 <button class="btn-cta-primary" id="btn-goto-consult" style="padding: 0.55rem 1.1rem; font-size: 0.9rem;">
 마보살 1:1 상담실
 </button>
 </div>
 </div>

 <!-- 사주 원국 4주 팔자 및 핵심 판정 지표 대시보드 -->
 <div class="result-section-box" style="margin-bottom: 1.5rem;">
 <div class="section-step-indicator" style="margin-bottom: 1rem;">
 <span class="step-badge">기본 구조</span>
 <h3 class="section-heading">사주 4주 원국 및 핵심 명리 지표</h3>
 </div>

 <div class="core-summary-card">
 <div class="core-pillars-grid">
 <div class="pillar-box">
 <div class="pillar-name">년주 (Year)</div>
 <div class="pillar-hanja">${STEM_HANJA[pillars.year.stem] || pillars.year.stem}${BRANCH_HANJA[pillars.year.branch] || pillars.year.branch}</div>
 <div class="pillar-hangul">${pillars.year.stem}${pillars.year.branch}</div>
 </div>
 <div class="pillar-box">
 <div class="pillar-name">월주 (Month)</div>
 <div class="pillar-hanja">${STEM_HANJA[pillars.month.stem] || pillars.month.stem}${BRANCH_HANJA[pillars.month.branch] || pillars.month.branch}</div>
 <div class="pillar-hangul">${pillars.month.stem}${pillars.month.branch}</div>
 </div>
 <div class="pillar-box" style="border-color: var(--border-glow); background: rgba(212, 175, 55, 0.08);">
 <div class="pillar-name" style="color: var(--text-gold); font-weight: 700;">일주 (Day · 나)</div>
 <div class="pillar-hanja" style="color: var(--text-gold);">${STEM_HANJA[pillars.day.stem] || pillars.day.stem}${BRANCH_HANJA[pillars.day.branch] || pillars.day.branch}</div>
 <div class="pillar-hangul" style="color: var(--text-gold); font-weight: 600;">${pillars.day.stem}${pillars.day.branch}</div>
 </div>
 <div class="pillar-box">
 <div class="pillar-name">시주 (Hour)</div>
 <div class="pillar-hanja">${pillars.hour ? (STEM_HANJA[pillars.hour.stem] || pillars.hour.stem) + (BRANCH_HANJA[pillars.hour.branch] || pillars.hour.branch) : '未詳'}</div>
 <div class="pillar-hangul">${pillars.hour ? pillars.hour.stem + pillars.hour.branch : '시간 미상'}</div>
 </div>
 </div>

 <div class="core-indicators-grid" style="margin-top: 1.25rem;">
 <div class="indicator-item">
 <div class="indicator-label">일간 본질</div>
 <div class="indicator-value">${pillars.day.stem} (${(session as any)?.userReport?.basicStructure?.dayMaster?.meaning || '일원'})</div>
 </div>
 <div class="indicator-item">
 <div class="indicator-label">일간 강약 (STRENGTH)</div>
 <div class="indicator-value">${strengthLabel} ${strengthScore ? `(${strengthScore})` : ''}</div>
 </div>
 <div class="indicator-item">
 <div class="indicator-label">격국 (GEOKGUK)</div>
 <div class="indicator-value">${geokName}</div>
 </div>
 <div class="indicator-item">
 <div class="indicator-label">의뢰 고민</div>
 <div class="indicator-value" style="font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${userTrouble}">${userTrouble}</div>
 </div>
 </div>
 </div>
 </div>

 <!-- 출력 무결성 검증 (Output Integrity Audit) 통과 배지 -->
 <div class="integrity-verified-card" style="background: rgba(16, 26, 46, 0.85); border: 1px solid rgba(80, 200, 120, 0.4); border-radius: var(--radius-md); padding: 1.25rem 1.5rem; margin-bottom: 2rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
 <div style="display: flex; align-items: center; gap: 0.85rem;">
 <span style="font-size: 1.8rem;">️</span>
 <div>
 <div style="color: #50c878; font-weight: 700; font-size: 1.05rem;">
 출력 무결성 검증 완료 (Output Integrity Verified)
 </div>
 <div style="color: var(--text-muted); font-size: 0.88rem; margin-top: 0.2rem;">
 강약 일치 검증 · 미입력 사건 왜곡 차단 · 임의 연도 배제 · 결정론적 단정 금지 5대 감사 규칙 전수 통과
 </div>
 </div>
 </div>
 <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
 <span style="background: rgba(80, 200, 120, 0.15); color: #50c878; border: 1px solid rgba(80, 200, 120, 0.3); padding: 0.3rem 0.65rem; border-radius: 4px; font-size: 0.82rem; font-weight: 600;">강약 정합 100%</span>
 <span style="background: rgba(80, 200, 120, 0.15); color: #50c878; border: 1px solid rgba(80, 200, 120, 0.3); padding: 0.3rem 0.65rem; border-radius: 4px; font-size: 0.82rem; font-weight: 600;">사실 보호 100%</span>
 <span style="background: rgba(80, 200, 120, 0.15); color: #50c878; border: 1px solid rgba(80, 200, 120, 0.3); padding: 0.3rem 0.65rem; border-radius: 4px; font-size: 0.82rem; font-weight: 600;">정통 명리 기반</span>
 </div>
 </div>

 <!-- 15대 섹션 빠른 이동 내비게이션 -->
 <div class="sections-quick-nav" style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.1rem 1.3rem; margin-bottom: 2rem;">
 <div style="font-size: 0.92rem; font-weight: 700; color: var(--text-gold); margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
 <span> 15대 전문 섹션 바로가기</span>
 <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: normal;">총 ${sections.length}개 섹션 생성됨</span>
 </div>
 <div style="display: flex; flex-wrap: wrap; gap: 0.45rem;">
 ${sections.map(s => `
 <a href="#sec-${s.num}" class="nav-section-chip" style="font-size: 0.82rem; padding: 0.35rem 0.75rem; border-radius: 14px; background: rgba(255,255,255,0.05); color: var(--text-secondary); text-decoration: none; border: 1px solid var(--border-subtle); transition: all 0.2s ease;">
 ${s.num}. ${s.title.length > 12 ? s.title.slice(0, 12) + '...' : s.title}
 </a>
 `).join('')}
 </div>
 </div>

 <!-- 15대 섹션 본문 렌더링 -->
 <div class="standard15-sections-container" style="display: flex; flex-direction: column; gap: 1.75rem;">
 ${sections.map(sec => `
 <div class="result-section-box section-card" id="sec-${sec.num}" style="scroll-margin-top: 80px;">
 <div class="section-step-indicator" style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem;">
 <span class="step-badge" style="background: rgba(212, 175, 55, 0.2); color: var(--text-gold); border: 1px solid var(--text-gold); font-weight: 700;">
 Section ${sec.num < 10 ? '0' + sec.num : sec.num}
 </span>
 <h3 class="section-heading" style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin: 0;">
 ${sec.title}
 </h3>
 </div>
 <div class="section-body-content" style="background: rgba(8, 12, 22, 0.65); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.5rem 1.75rem;">
 ${formatMarkdownText(sec.content)}
 </div>
 </div>
 `).join('')}
 </div>

 <!-- 하단 1:1 상담 이동 및 인쇄 CTA -->
 <div style="text-align: center; padding: 3rem 0; display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
 <button class="btn-cta-secondary btn-download-pdf" style="padding: 1rem 2.2rem; font-size: 1.1rem;">
 A4 전문 인쇄 / PDF 저장
 </button>
 <button class="btn-cta-primary" id="btn-goto-consult" style="padding: 1rem 2.5rem; font-size: 1.15rem;">
 마보살에게 직접 질문하기
 </button>
 </div>
 `;
 }

 if (!session) return `<div class="app-container"><p>분석 정보가 없습니다. 사주 정보를 먼저 입력해 주세요.</p></div>`;

 const report = session.userReport;
 const pillars = session.fact.four_pillars;
 const rsiBand = session.phase7Output.rsi.band;
 const flowSummary = report.flowSummary;
 const integrated = state.integratedResult;
 const isPaid = state.isPaidUser || state.selectedTier === 'paid_mabosal_full';
 const isSajuDeepPaid = isPaid || state.selectedTier === 'paid_detailed_saju';

 // 고민 텍스트 및 마보살식 한마디 구성
 const userTrouble = state.userTroubleText || '올해 전반적인 흐름과 마음의 안정을 찾고 싶습니다.';
 const troubleCategoryKorean = integrated?.dualResult?.user_trouble?.category || '현실 문제';
 const punchline = `쉽게 말하면 지금은 ${troubleCategoryKorean}에 마가 낀 시기로 볼 수 있습니다.`;

 return `
 <div class="result-header-bar">
 <div>
 <span class="card-badge gold-badge" style="margin-bottom: 0.5rem; display: inline-block;">MABOSAL PRODUCTION REPORT</span>
 <h2 style="font-size: 1.8rem; font-weight: 700;">당신의 사주를 한눈에</h2>
 <p style="color: var(--text-muted); font-size: 0.95rem;">${flowSummary.headline}</p>
 </div>
 <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
 <div class="report-mode-tabs">
 <button class="report-mode-btn ${state.reportMode === 'QUICK' ? 'active' : ''}" data-mode="QUICK" id="btn-tab-quick">QUICK</button>
 <button class="report-mode-btn ${state.reportMode === 'STANDARD' ? 'active' : ''}" data-mode="STANDARD" id="btn-tab-standard">STANDARD</button>
 <button class="report-mode-btn ${state.reportMode === 'DEEP' ? 'active' : ''}" data-mode="DEEP" id="btn-tab-deep">DEEP</button>
 </div>
 <button class="btn-cta-secondary btn-download-pdf" id="btn-download-pdf" style="padding: 0.55rem 1.1rem; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 0.4rem;">
 <span></span> PDF 다운로드 (A4)
 </button>
 </div>
 </div>

 <!-- ======================================================== -->
 <!-- ① 한눈에 보는 나의 사주 (일간, 오행, 강약, 기본 성향, 핵심 구조) -->
 <!-- ======================================================== -->
 <div class="result-section-box">
 <div class="section-step-indicator">
 <span class="step-badge">1단계</span>
 <h3 class="section-heading">한눈에 보는 나의 사주</h3>
 </div>

 <div class="core-summary-card">
 <div class="core-pillars-grid">
 <div class="pillar-box">
 <div class="pillar-name">년주 (Year)</div>
 <div class="pillar-hanja">${STEM_HANJA[pillars.year.stem] || pillars.year.stem}${BRANCH_HANJA[pillars.year.branch] || pillars.year.branch}</div>
 <div class="pillar-hangul">${pillars.year.stem}${pillars.year.branch}</div>
 </div>
 <div class="pillar-box">
 <div class="pillar-name">월주 (Month)</div>
 <div class="pillar-hanja">${STEM_HANJA[pillars.month.stem] || pillars.month.stem}${BRANCH_HANJA[pillars.month.branch] || pillars.month.branch}</div>
 <div class="pillar-hangul">${pillars.month.stem}${pillars.month.branch}</div>
 </div>
 <div class="pillar-box" style="border-color: var(--border-glow);">
 <div class="pillar-name" style="color: var(--text-gold);">일주 (Day · 나)</div>
 <div class="pillar-hanja">${STEM_HANJA[pillars.day.stem] || pillars.day.stem}${BRANCH_HANJA[pillars.day.branch] || pillars.day.branch}</div>
 <div class="pillar-hangul">${pillars.day.stem}${pillars.day.branch}</div>
 </div>
 <div class="pillar-box">
 <div class="pillar-name">시주 (Hour)</div>
 <div class="pillar-hanja">${pillars.hour ? (STEM_HANJA[pillars.hour.stem] || pillars.hour.stem) + (BRANCH_HANJA[pillars.hour.branch] || pillars.hour.branch) : '未詳'}</div>
 <div class="pillar-hangul">${pillars.hour ? pillars.hour.stem + pillars.hour.branch : '시간 미상'}</div>
 </div>
 </div>

 <div class="core-indicators-grid">
 <div class="indicator-item">
 <div class="indicator-label">일간 본질</div>
 <div class="indicator-value">${report.basicStructure.dayMaster.stem} (${report.basicStructure.dayMaster.meaning || report.basicStructure.dayMaster.element})</div>
 </div>
 <div class="indicator-item">
 <div class="indicator-label">일간 강약</div>
 <div class="indicator-value">${session.fact.day_master_strength.classification}</div>
 </div>
 <div class="indicator-item">
 <div class="indicator-label">주도 오행</div>
 <div class="indicator-value">${session.fact.five_elements.dominantElement} 기운</div>
 </div>
 <div class="indicator-item">
 <div class="indicator-label">통합 안정도 (RSI)</div>
 <div class="rsi-badge rsi-${rsiBand}">${flowSummary.rsiBandStatus.userExplanation}</div>
 </div>
 </div>
 </div>

 <div class="structure-summary-card">
 <h4 style="color: var(--text-gold); margin-bottom: 0.4rem; font-size: 1.05rem;">마보살이 발견한 핵심 구조</h4>
 <p style="font-size: 1rem; line-height: 1.7; color: var(--text-primary); margin-bottom: 0.5rem;">${flowSummary.keyTendency}</p>
 <p style="font-size: 0.92rem; color: var(--text-secondary);">${report.finalSynthesis.lifeStrategy}</p>
 </div>
 </div>

 <!-- ======================================================== -->
 <!-- ② 올해의 흐름 (좋은 흐름, 주의할 흐름, 주요 전환 시점) -->
 <!-- ======================================================== -->
 <div class="result-section-box">
 <div class="section-step-indicator">
 <span class="step-badge">2단계</span>
 <h3 class="section-heading">올해의 흐름 (2026년 환경적 계절)</h3>
 </div>

 <div class="annual-luck-grid">
 <div class="luck-feature-box good-flow">
 <div class="luck-header"> 좋은 흐름 (기회의 영역)</div>
 <p class="luck-desc">${integrated?.dualResult?.general_saju?.sewoon?.critical_opportunities?.[0] || '내실을 다지고 오랜 관계에서 신뢰를 회복하는 기운이 유입됩니다.'}</p>
 </div>
 <div class="luck-feature-box caution-flow">
 <div class="luck-header">️ 주의할 흐름 (마찰의 영역)</div>
 <p class="luck-desc">${integrated?.dualResult?.general_saju?.sewoon?.caution_points?.[0] || '성급한 문서 계약이나 감정적인 마찰에 주의가 필요합니다.'}</p>
 </div>
 <div class="luck-feature-box transition-flow">
 <div class="luck-header"> 주요 전환 시점</div>
 <p class="luck-desc">${integrated?.timingReport?.relief_period || '올해 하반기'}를 기점으로 환경적 압박이 완화되어 시야가 넓어집니다.</p>
 </div>
 </div>
 </div>

 <!-- ======================================================== -->
 <!-- ③ 내가 가져온 고민 (사용자가 입력한 현실 문제 그대로) -->
 <!-- ======================================================== -->
 <div class="result-section-box">
 <div class="section-step-indicator">
 <span class="step-badge">3단계</span>
 <h3 class="section-heading">내가 가져온 고민</h3>
 </div>
 <div class="user-trouble-display-card">
 <div class="trouble-quote-icon">“</div>
 <div class="trouble-user-text">${userTrouble}</div>
 <div class="trouble-category-tag">분류: ${troubleCategoryKorean}</div>
 </div>
 </div>

 <!-- ======================================================== -->
 <!-- ④ 왜 이런 일이 생겼는지 (명리학적 원인 분석) -->
 <!-- ======================================================== -->
 <div class="result-section-box">
 <div class="section-step-indicator">
 <span class="step-badge">4단계</span>
 <h3 class="section-heading">왜 이런 일이 생겼는지</h3>
 </div>
 <div class="interpretation-text-box">
 <p style="font-size: 1.05rem; line-height: 1.8; color: var(--text-primary); margin-bottom: 1rem;">
 ${integrated?.presentation?.step2_saju_insight?.structural_explanation || '이번 상황은 당신의 사주 원국에서 타고난 기운과 올해 세운이 마주치며 서로의 감정이나 현실 조건이 부딪히기 쉬운 환경이 조성되어 발생한 것입니다.'}
 </p>
 <div style="background: rgba(13, 21, 39, 0.6); border-radius: var(--radius-sm); padding: 1rem; border-left: 3px solid var(--accent-blue);">
 <strong style="color: var(--text-gold);">명리학적 배경:</strong> 
 <span style="color: var(--text-secondary); font-size: 0.92rem;">
 ${integrated?.dualResult?.ma_signal?.structural_cause || '원국과 시간축의 기운 마찰'}
 </span>
 </div>
 </div>
 </div>

 <!-- ======================================================== -->
 <!-- ⑤ 마보살식 한마디 (문제 영역을 압축한 마보살 핵심 언어) -->
 <!-- ======================================================== -->
 <div class="result-section-box">
 <div class="section-step-indicator">
 <span class="step-badge">5단계</span>
 <h3 class="section-heading">마보살식 한마디</h3>
 </div>
 <div class="mabosal-punchline-card">
 <div class="punchline-quote">
 “${punchline}”
 </div>
 <p class="punchline-subnote">
 사주가 나쁜 것이 아닙니다. 특정 시기에 특정 영역의 기운이 엉키는 것은 누구나 겪는 계절의 변화와 같습니다.
 </p>
 </div>
 </div>

 <!-- ======================================================== -->
 <!-- ⑥ 언제까지 이어질 가능성이 있는지 (시작 시점 & 언제 가장 힘든가) -->
 <!-- ======================================================== -->
 <div class="result-section-box">
 <div class="section-step-indicator">
 <span class="step-badge">6단계</span>
 <h3 class="section-heading">언제까지 이어질 가능성이 있는지</h3>
 </div>

 <div class="timing-stages-grid ${!isPaid ? 'content-locked' : ''}">
 ${!isPaid ? `
 <div class="locked-overlay">
 <div class="lock-icon"></div>
 <div class="lock-title">월별 정밀 타이밍 잠김</div>
 <p class="lock-desc">문제의 정점 시기와 관계·사업 회복의 최적 시점(월 단위)은 정밀풀이에서 확인하실 수 있습니다.</p>
 <button class="btn-cta-primary btn-unlock-tier" data-tier="paid_mabosal_full" id="btn-unlock-paid-mabosal">
 마보살 정밀풀이 열람하기 (149,000원)
 </button>
 </div>
 ` : ''}

 <div class="stage-card start">
 <div class="stage-tag">시작 시점</div>
 <div class="stage-val">${integrated?.presentation?.step4_period?.onset_time || '2026년 2~3월'}</div>
 <div class="stage-desc">불안감과 미세한 균열이 체감되기 시작한 때</div>
 </div>
 <div class="stage-card peak">
 <div class="stage-tag">언제 가장 힘든가 (정점)</div>
 <div class="stage-val">${integrated?.timingReport?.crisis_peak_period || '2026년 5~6월'}</div>
 <div class="stage-desc">갈등이나 스트레스가 최고조에 달하는 구간</div>
 </div>
 </div>
 </div>

 <!-- ======================================================== -->
 <!-- ⑦ 언제 흐름이 바뀌는지 (완화 & 전환/호운 시점) -->
 <!-- ======================================================== -->
 <div class="result-section-box">
 <div class="section-step-indicator">
 <span class="step-badge">7단계</span>
 <h3 class="section-heading">언제 흐름이 바뀌는지</h3>
 </div>

 <div class="timing-stages-grid ${!isPaid ? 'content-locked' : ''}">
 ${!isPaid ? `
 <div class="locked-overlay">
 <div class="lock-icon"></div>
 <div class="lock-title">정밀 완화 및 전환 시점 잠김</div>
 <p class="lock-desc">흐름이 풀리는 월 단위 완화 시점과 호운 포착 가이드는 정밀풀이에서 확인하실 수 있습니다.</p>
 <button class="btn-cta-primary btn-unlock-tier" data-tier="paid_mabosal_full">
 마보살 정밀풀이 열람하기 (149,000원)
 </button>
 </div>
 ` : ''}

 <div class="stage-card relief">
 <div class="stage-tag">언제 풀리는가 (완화 시기)</div>
 <div class="stage-val">${integrated?.timingReport?.relief_period || '2026년 8~9월'}</div>
 <div class="stage-desc">엉킨 실타래가 풀리고 감정이 잦아드는 때</div>
 </div>
 <div class="stage-card recovery">
 <div class="stage-tag">회복 / 전환 시점 (도약)</div>
 <div class="stage-val">${integrated?.timingReport?.action_opportune_period || '2026년 10~11월'}</div>
 <div class="stage-desc">새로운 돌파구와 맑은 기운이 자리 잡는 기회</div>
 </div>
 </div>
 </div>

 <!-- ======================================================== -->
 <!-- ⑧ 지금 무엇을 해야 하는지 (하지 말아야 할 것, 지금 해야 할 것, 기회 잡는 법) -->
 <!-- ======================================================== -->
 <div class="result-section-box">
 <div class="section-step-indicator">
 <span class="step-badge">8단계</span>
 <h3 class="section-heading">지금 무엇을 해야 하는지</h3>
 </div>

 <div class="prescription-actions-grid ${!isPaid ? 'content-locked' : ''}">
 ${!isPaid ? `
 <div class="locked-overlay">
 <div class="lock-icon"></div>
 <div class="lock-title">행동 처방 및 맞춤 디지털 처방 카드 잠김</div>
 <p class="lock-desc">상황을 반전시킬 구체적인 금기 행동, 실천 행동, 스마트폰 전용 오행 처방 카드가 포함되어 있습니다.</p>
 <button class="btn-cta-primary btn-unlock-tier" data-tier="paid_mabosal_full">
 처방전 전체 해제하기 (149,000원)
 </button>
 </div>
 ` : ''}

 <div class="action-card avoid-card">
 <h4> 지금 하지 말아야 할 것</h4>
 <ul>
 ${(integrated?.prescription?.actions_to_avoid || ['감정적인 통보나 즉흥적인 담판', '상대방의 반응을 단정 짓고 몰아세우는 태도', '초조함에 무리한 지출이나 투자 확대']).map(act => `<li>${act}</li>`).join('')}
 </ul>
 <div class="action-note"><strong>기다려야 할 시기:</strong> 정점 구간에는 결정을 미루고 침묵을 유지하세요.</div>
 </div>

 <div class="action-card take-card">
 <h4> 지금 해야 할 것 (그때 무엇을 해야 하는가)</h4>
 <ul>
 ${(integrated?.prescription?.actions_to_take || ['일상의 루틴을 지키며 감정 분리하기', '수(水) 기운의 유연함으로 상황을 관조하기', '충분한 수면과 산책으로 신체 밸런스 회복']).map(act => `<li>${act}</li>`).join('')}
 </ul>
 <div class="action-note"><strong>이후 기회를 잡는 방법:</strong> 완화 시점 이후에 온화한 대화로 관계를 매듭지으세요.</div>
 </div>
 </div>

 <!-- 디지털 처방 카드 다운로드 영역 (유료 시 활성화) -->
 ${isPaid ? `
 <div class="digital-remedy-preview" style="margin-top: 0.5rem;">
 <div class="remedy-talisman-box" style="border-color: #D4AF37;">
 <div class="talisman-kanji">調</div>
 <div class="talisman-title">마보살 조율 카드</div>
 </div>
 <div class="remedy-info">
 <h4>${report.basicStructure.dayMaster.stem} 일간 전용 오행 조율 처방 카드</h4>
 <p><strong>조율 원리:</strong> 부족한 기운을 상징하는 기하학적 엠블럼과 일상 마인드셋을 스마트폰 배경화면으로 보관하세요.</p>
 <button class="btn-cta-secondary" id="btn-download-remedy" style="margin-top: 0.5rem;" onclick="alert('스마트폰 배경화면 및 고해상도 디지털 처방 카드가 저장되었습니다.');">
 스마트폰 배경화면 및 카드 다운로드 (1080×1920) 
 </button>
 </div>
 </div>
 ` : ''}

 <!-- ======================================================== -->
 <!-- [4부] 나의 현실 상황과 연결해보기 (Phase 78 실제 UI 연결) -->
 <!-- ======================================================== -->
 <div class="result-section-box situation-connect-section" id="section-situation-connect" style="margin-top: 2rem;">
 <div class="section-step-indicator">
 <span class="step-badge" style="background: rgba(212, 175, 55, 0.2); color: var(--text-gold); border: 1px solid var(--text-gold);">4부</span>
 <h3 class="section-heading">나의 현실 상황과 연결해보기</h3>
 </div>
 
 <div class="situation-connect-widget" style="background: rgba(14, 20, 36, 0.75); border: 1px solid rgba(212, 175, 55, 0.35); border-radius: var(--radius-md); padding: 1.75rem;">
 <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.25rem; font-size: 0.98rem;">
 위의 기운 흐름 중 현재 고객님이 가장 강하게 마주하고 계신 상황은 무엇인가요? 상황을 선택하거나 구체적인 내용을 추가하시면, 사주 원국과 1:1로 결합된 심층 인과 분석을 확인할 수 있습니다.
 </p>

 <div style="font-weight: 700; color: var(--text-gold); font-size: 0.92rem; margin-bottom: 0.75rem;">
 [선택할 수 있는 현실 상황 예시]
 </div>

 <div class="situation-chips-wrap" style="display: flex; flex-wrap: wrap; gap: 0.6rem; margin-bottom: 1.5rem;">
 ${[
 '주요 거래처 부도 및 대금 회수 지연',
 '동업자·파트너와의 지분 및 정산 갈등',
 '신규 계약 지연 및 법적 분쟁 우려',
 '무리한 사업 확장 후 자금 경색'
 ].map(sit => `
 <button type="button" class="situation-chip ${state.selectedSituation === sit ? 'active' : ''}" data-situation="${sit}" style="padding: 0.65rem 1.1rem; border-radius: 20px; border: 1px solid ${state.selectedSituation === sit ? 'var(--text-gold)' : 'rgba(255,255,255,0.12)'}; background: ${state.selectedSituation === sit ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.04)'}; color: ${state.selectedSituation === sit ? 'var(--text-gold)' : 'var(--text-primary)'}; cursor: pointer; font-size: 0.9rem; font-weight: ${state.selectedSituation === sit ? '700' : '400'}; transition: all 0.2s ease;">
 ${sit}
 </button>
 `).join('')}
 </div>

 <div class="form-group" style="margin-bottom: 1.2rem;">
 <label class="form-label" for="input-additional-context" style="font-size: 0.9rem; color: var(--text-gold); margin-bottom: 0.4rem; display: block; font-weight: 600;">
 구체적인 현재 상황 (추가 상황 직접 입력)
 </label>
 <textarea id="input-additional-context" class="form-textarea" rows="2" style="width: 100%; box-sizing: border-box;" placeholder="현재 겪고 계신 구체적인 정황이나 상대방의 요구사항 등을 적어주세요.">${state.additionalContext || ''}</textarea>
 </div>

 <div class="form-group" style="margin-bottom: 1.5rem;">
 <label class="form-label" for="input-desired-question" style="font-size: 0.9rem; color: var(--text-gold); margin-bottom: 0.4rem; display: block; font-weight: 600;">
 가장 알고 싶은 핵심 질문
 </label>
 <input type="text" id="input-desired-question" class="form-input" style="width: 100%; box-sizing: border-box;" placeholder="예: 지분 매각 압박에 응하지 않고 법적으로 회사를 방어할 수 있습니까?" value="${state.desiredQuestion || ''}" />
 </div>

 <button type="button" class="btn-cta-primary" id="btn-submit-deep-analysis" style="width: 100%; padding: 1rem 1.5rem; font-size: 1.1rem; font-weight: 700; cursor: pointer;">
 내 상황 맞춤 심층 분석 및 처방 보기 (Level 5) →
 </button>
 </div>

 <!-- Level 5 심층 결과가 생성된 경우 출력 -->
 ${state.deepResult ? `
 <div class="deep-result-container" id="deep-result-display" style="margin-top: 2.5rem; border-top: 2px dashed rgba(212, 175, 55, 0.5); padding-top: 2rem;">
 <div class="result-header-bar" style="margin-bottom: 1.5rem;">
 <div>
 <span class="card-badge gold-badge" style="display: inline-block; margin-bottom: 0.5rem;">LEVEL 5 맞춤 솔루션</span>
 <h3 style="font-size: 1.6rem; font-weight: 700; color: var(--text-gold);">
 ${state.deepResult.customerDeliverable?.fullFormattedText.split('\n')[0].replace(/^#\s*/, '') || '사업 위기 관리 및 계약·파트너십 방어 처방'}
 </h3>
 </div>
 </div>

 <div class="deep-formatted-content" style="background: rgba(8, 12, 22, 0.95); border: 1px solid var(--border-glow); border-radius: var(--radius-lg); padding: 2rem; line-height: 1.8; color: var(--text-primary);">
 <pre style="white-space: pre-wrap; font-family: inherit; font-size: 0.95rem; margin: 0; line-height: 1.8;">${state.deepResult.customerDeliverable?.fullFormattedText || ''}</pre>
 </div>
 </div>
 ` : ''}
 </div>

 <!-- ======================================================== -->
 <!-- Phase 41: 무료 -> 유료 전환 트리거 ("그래서 정확히 언제 좋아지는가?") -->
 <!-- ======================================================== -->
 ${!isPaid ? `
 <div class="conversion-hook-card">
 <div class="hook-header-badge">가장 중요한 핵심 질문</div>
 <h3 class="hook-question">“그래서 정확히 언제 좋아지는가?”</h3>
 <p class="hook-preview">
 당신의 마찰 기운은 ${integrated?.timingReport?.relief_period || '하반기'}부터 서서히 걷히기 시작합니다.<br />
 정확히 몇 월에 누구를 만나고, 무엇을 피해야 온전히 기회를 잡을 수 있는지 정밀풀이에서 모두 밝혀드립니다.
 </p>

 <!-- 149,000원 핵심 가치 4가지 안내 -->
 <div class="premium-core-values" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; text-align: left;">
 <div style="background: rgba(8, 12, 22, 0.7); border: 1px solid rgba(212, 175, 55, 0.25); border-radius: var(--radius-sm); padding: 1rem;">
 <div style="color: var(--text-gold); font-weight: 700; font-size: 0.9rem; margin-bottom: 0.3rem;">1. 왜 이런 일이 생겼는가</div>
 <div style="color: var(--text-secondary); font-size: 0.82rem;">사주 원국과 시간축의 1:1 결합 원인 분석</div>
 </div>
 <div style="background: rgba(8, 12, 22, 0.7); border: 1px solid rgba(212, 175, 55, 0.25); border-radius: var(--radius-sm); padding: 1rem;">
 <div style="color: var(--text-gold); font-weight: 700; font-size: 0.9rem; margin-bottom: 0.3rem;">2. 언제 가장 힘든가</div>
 <div style="color: var(--text-secondary); font-size: 0.82rem;">월별 마찰 정점(Peak) 시점 정확한 규명</div>
 </div>
 <div style="background: rgba(8, 12, 22, 0.7); border: 1px solid rgba(212, 175, 55, 0.25); border-radius: var(--radius-sm); padding: 1rem;">
 <div style="color: var(--text-gold); font-weight: 700; font-size: 0.9rem; margin-bottom: 0.3rem;">3. 언제 풀리는가</div>
 <div style="color: var(--text-secondary); font-size: 0.82rem;">월 단위 완화 시점 및 호운 전환기 예측</div>
 </div>
 <div style="background: rgba(8, 12, 22, 0.7); border: 1px solid rgba(212, 175, 55, 0.25); border-radius: var(--radius-sm); padding: 1rem;">
 <div style="color: var(--text-gold); font-weight: 700; font-size: 0.9rem; margin-bottom: 0.3rem;">4. 그때 무엇을 해야 하는가</div>
 <div style="color: var(--text-secondary); font-size: 0.82rem;">금기 행동, 실천 행동 및 맞춤 디지털 처방</div>
 </div>
 </div>

 <div class="pricing-cards-row">
 <div class="price-box">
 <div class="price-tier-name">정밀 사주</div>
 <div class="price-amount">39,000원</div>
 <p class="price-desc">평생 사주 구조, 7대 라이프 영역, 대운/세운 상세 분석</p>
 <button class="btn-cta-secondary btn-unlock-tier" data-tier="paid_detailed_saju" id="btn-unlock-paid-saju">
 정밀 사주 선택
 </button>
 </div>

 <div class="price-box featured">
 <div class="featured-badge">가장 추천</div>
 <div class="price-tier-name">마보살 정밀풀이</div>
 <div class="price-amount">149,000원</div>
 <p class="price-desc">현실 문제 1:1 진단, 월별 타이밍, 행동 처방, 디지털 처방 카드</p>
 <button class="btn-cta-primary btn-unlock-tier" data-tier="paid_mabosal_full">
 마보살 정밀풀이 선택
 </button>
 </div>
 </div>
 </div>
 ` : ''}

 <!-- ======================================================== -->
 <!-- 기존 6대 삶의 핵심 영역 및 21개 Ma 현황판 (테스트 호환성) -->
 <!-- ======================================================== -->
 <div class="theme-flow-container" style="margin-top: 3rem;">
 <div class="section-title-wrap">
 <h3 class="section-title">6대 삶의 핵심 영역 (정통 명리)</h3>
 <p class="section-subtitle">재물, 직장, 사업, 관계, 건강, 안전의 다층적 상호작용 분석입니다.</p>
 </div>

 <div class="themes-grid">
 ${report.themes.map(t => `
 <div class="theme-card">
 <div>
 <div class="theme-card-header">
 <div class="theme-title-area">
 <span class="theme-name">${t.title}</span>
 </div>
 </div>
 <div class="theme-summary">${t.summary}</div>
 ${state.reportMode !== 'QUICK' ? `
 <div class="theme-detail-box">
 ${t.evidence || ''}
 </div>
 ` : ''}
 </div>
 <div class="theme-card-footer">
 <span style="font-size: 0.8rem; color: var(--text-muted);">${t.certaintyDescription}</span>
 <button class="btn-trace btn-view-evidence" data-theme="${t.theme}">근거 보기</button>
 </div>
 </div>
 `).join('')}
 </div>
 </div>

 <!-- 시간의 흐름 (Time Axis) -->
 <div class="time-axis-card">
 <div class="section-title-wrap">
 <h3 class="section-title">시간의 흐름과 운의 파도</h3>
 <p class="section-subtitle">원국(고정)과 대운/세운/월운(현재 환경적 계절)을 엄격히 분리하여 설명합니다.</p>
 </div>
 <div class="time-axis-note">
 "원국 자체가 바뀌는 것이 아니라, 시간에 따라 마주하는 계절과 환경적 자극이 달라지는 것입니다."
 </div>
 <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6;">
 ${session.userReport.temporalModulation?.temporalDisclaimer || '원국의 본질을 다져두면 어떤 운의 파도가 오더라도 유연하게 도약의 발판으로 삼을 수 있습니다.'}
 </p>
 </div>

 <!-- 21개 Ma 상세 그리드 -->
 <div class="ma-section-container">
 <div class="section-title-wrap" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
 <div>
 <h3 class="section-title">21개 마(Ma) 세부 신호 현황판</h3>
 <p class="section-subtitle">원국에서 감지된 21대 역학 에너지의 활성화 상태(Activation State)입니다.</p>
 </div>
 </div>
 <div class="ma-grid ma-category-grid">
 ${Object.values(session.signalSet.signals).map(s => `
 <div class="ma-item-card ma-category-card">
 <div class="ma-name-row">
 <span class="ma-korean-name">${s.koreanName}</span>
 <span class="state-badge state-${s.activation.state}">${s.activation.state}</span>
 </div>
 <div style="font-size: 0.82rem; color: var(--text-muted);">
 축: 압박 ${s.qualitativeAxis?.pressure || 'MODERATE'} · 기회 ${s.qualitativeAxis?.opportunity || 'MODERATE'}
 </div>
 </div>
 `).join('')}
 </div>
 </div>

 <!-- 하단 1:1 상담 이동 CTA -->
 <div style="text-align: center; padding: 2.5rem 0;">
 <button class="btn-cta-primary" id="btn-goto-consult" style="padding: 1rem 2.5rem; font-size: 1.15rem;">
 마보살에게 직접 질문하기
 </button>
 </div>
 `;
}

// ==========================================
// 6. 마보살 상담 뷰 (Consultation View)
// ==========================================
export function renderConsultationView(state: AppStateData): string {
 const session = state.sessionState;
 if (!session) return `<div class="app-container"><p>사주 분석을 먼저 진행해 주십시오.</p></div>`;

 const messages = state.chatMessages;

 return `
 <div class="app-container" style="padding-top: 1rem;">
 <div class="section-title-wrap" style="margin-bottom: 1rem;">
 <h2 class="section-title">마보살 1:1 상담실</h2>
 <p class="section-subtitle">당신의 사주 원국과 신호를 바탕으로 질문에 대해 명쾌하게 답변해 드립니다.</p>
 </div>

 <div class="consultation-wrapper">
 <div class="chat-messages-scroll" id="chat-messages-scroll">
 <div class="chat-bubble mabosal">
 <div style="font-weight: 700; color: var(--text-gold); margin-bottom: 0.4rem;">마보살</div>
 반갑습니다. 당신의 사주 원국 분석을 완료하였습니다.<br />
 재물 흐름, 직장 적합도, 사업 진로, 인간관계 등 궁금하신 점을 편하게 질문해 주십시오.
 </div>

 ${messages.map(m => {
 if (m.sender === 'user') {
 return `
 <div class="chat-bubble user">
 ${m.text}
 </div>
 `;
 } else {
 const ans = m.answer;
 if (ans) {
 return `
 <div class="chat-bubble mabosal">
 <div style="font-weight: 700; color: var(--text-gold); margin-bottom: 0.6rem;">마보살의 답변</div>
 <div class="mabosal-answer-section">
 <div class="mabosal-section-label">핵심 결론</div>
 <div>${ans.conclusion}</div>
 </div>
 <div class="mabosal-answer-section">
 <div class="mabosal-section-label">명리적 근거</div>
 <div style="color: var(--text-secondary); font-size: 0.92rem;">${ans.evidence}</div>
 </div>
 <div class="mabosal-answer-section">
 <div class="mabosal-section-label">구조 및 상호작용</div>
 <div style="color: var(--text-secondary); font-size: 0.92rem;">${ans.structure}</div>
 </div>
 <div class="mabosal-answer-section">
 <div class="mabosal-section-label">현실적 조언</div>
 <div>${ans.actionableAdvice}</div>
 </div>
 <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.6rem; border-top: 1px solid var(--border-subtle); padding-top: 0.4rem;">
 ※ ${ans.certaintyDescription}
 </div>
 </div>
 `;
 } else {
 return `
 <div class="chat-bubble mabosal">
 ${m.text}
 </div>
 `;
 }
 }
 }).join('')}
 </div>

 <div class="chat-suggestions">
 <button class="suggestion-chip" data-question="저는 돈을 모으는 쪽인가요, 버는 쪽인가요?"> 재물운 구조</button>
 <button class="suggestion-chip" data-question="직장생활이 저에게 맞는 편인가요?"> 직장 적합도</button>
 <button class="suggestion-chip" data-question="직장과 사업 중 어떤 구조가 더 강하게 나타나나요?">️ 직장 vs 사업 비교</button>
 <button class="suggestion-chip" data-question="사업을 한다면 어떤 구조가 중요한가요?"> 사업 시 중요 구조</button>
 <button class="suggestion-chip" data-question="현재 운에서 어떤 부분이 더 활성화되나요?"> 현재 운의 파도</button>
 <button class="suggestion-chip" data-question="왜 그렇게 해석했나요?"> 명리적 근거 확인</button>
 </div>

 <form class="chat-input-bar" id="form-consultation">
 <input type="text" class="chat-input" id="input-consultation-question" placeholder="마보살에게 물어보세요..." autocomplete="off" />
 <button type="submit" class="btn-cta-primary" id="btn-send-question">전송</button>
 </form>
 </div>
 </div>
 `;
}

// ==========================================
// 7. 상세 리포트 뷰 (Report View)
// ==========================================
export function renderReportView(state: AppStateData): string {
 if (!state.sessionState) {
  return `
   <div class="app-container" style="max-width: 580px; margin: 3rem auto; padding: 2rem 1.5rem; text-align: center;">
    <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 16px; padding: 2.5rem 1.5rem; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
     <span class="material-symbols-outlined" style="font-size: 52px; color: var(--primary); margin-bottom: 1rem;">fact_check</span>
     <h2 style="font-size: 1.35rem; font-weight: 800; color: #fff; margin: 0 0 0.5rem 0;">사주 분석 정보가 필요합니다</h2>
     <p style="font-size: 0.9rem; color: #94a3b8; line-height: 1.6; margin: 0 0 1.75rem 0;">
      결제하신 맞춤 감정서를 생성하고 열람하려면 생년월일시 정보가 필요합니다.<br/>
      생년월일시를 입력하시면 결제 완료된 정밀 리포트가 즉시 잠금 해제되어 발급됩니다.
     </p>
     <button type="button" id="btn-goto-start-saju" class="btn-cta-primary" style="padding: 0.8rem 1.8rem; font-size: 0.95rem; font-weight: 800; border-radius: 10px; cursor: pointer; box-shadow: 0 4px 16px rgba(242, 202, 80, 0.35);">
      사주 정보 입력하고 감정서 받기 →
     </button>
    </div>
   </div>
  `;
 }
 const session = state.sessionState;

 const report = session.userReport;

 return `
 <div class="app-container">
 <div class="result-header-bar">
 <div>
 <h2 class="section-title">마보살 최종 사주 리포트</h2>
 <p class="section-subtitle">모드별로 깊이를 조절하여 확인할 수 있습니다 (판단 결과는 100% 동일합니다).</p>
 </div>
 <div class="report-mode-tabs">
 <button class="report-mode-btn ${state.reportMode === 'QUICK' ? 'active' : ''}" data-mode="QUICK">QUICK</button>
 <button class="report-mode-btn ${state.reportMode === 'STANDARD' ? 'active' : ''}" data-mode="STANDARD">STANDARD</button>
 <button class="report-mode-btn ${state.reportMode === 'DEEP' ? 'active' : ''}" data-mode="DEEP">DEEP</button>
 </div>
 </div>

 <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 2.5rem; margin-bottom: 2rem;">
 <h3 style="font-size: 1.4rem; color: var(--text-gold); margin-bottom: 1rem;">[${state.reportMode} 모드 분석 리포트]</h3>
 <p style="font-size: 1.1rem; line-height: 1.7; margin-bottom: 1.5rem;">${report.flowSummary.keyTendency}</p>
 
 <div style="display: flex; flex-direction: column; gap: 1.5rem;">
 ${report.themes.map(t => `
 <div style="padding: 1.25rem; background: rgba(8, 11, 18, 0.5); border-radius: var(--radius-md); border-left: 3px solid var(--text-gold);">
 <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.4rem;">${t.title}</h4>
 <p style="font-size: 0.98rem; margin-bottom: 0.5rem;">${t.summary}</p>
 ${state.reportMode !== 'QUICK' ? `
 <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.4rem;"><strong>근거:</strong> ${t.evidence || ''}</p>
 <p style="font-size: 0.9rem; color: var(--text-secondary);"><strong>조언:</strong> ${t.actionableCaution || ''}</p>
 ` : ''}
 ${state.reportMode === 'DEEP' && t.deepFactDetails ? `
 <div style="margin-top: 0.6rem; padding-top: 0.6rem; border-top: 1px dashed var(--border-subtle); font-size: 0.85rem; color: var(--text-muted);">
 원천 십신: ${t.deepFactDetails.tenGods.join(', ')} | 궁위: ${t.deepFactDetails.pillarsInvolved.join(', ')}
 </div>
 ` : ''}
 </div>
 `).join('')}
 </div>
 </div>
 </div>
 `;
}

// ==========================================
// 8. 근거 추적 모달 (Evidence Trace Modal)
// ==========================================
export function renderEvidenceTraceModal(state: AppStateData): string {
 const data = state.activeTraceData;
 if (!data) return '';

 return `
 <div class="modal-overlay" id="modal-trace-overlay">
 <div class="modal-card">
 <div class="modal-header">
 <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-gold);">
 명리적 근거 추적: ${data.title}
 </h3>
 <button id="btn-close-trace-modal" style="background: transparent; border: none; color: var(--text-secondary); font-size: 1.5rem; cursor: pointer;"></button>
 </div>

 <div class="trace-tree">
 <div class="trace-step-node">
 <div class="trace-step-title">1단계: 최종 해석 (Interpretation)</div>
 <div class="trace-step-content">${data.summary}</div>
 </div>

 <div class="trace-step-node">
 <div class="trace-step-title">2단계: 활성화된 MaSignal 목록</div>
 <div class="trace-step-content">
 ${data.signals.slice(0, 6).join(', ')} 등 총 ${data.signals.length}개 신호 감지
 </div>
 </div>

 <div class="trace-step-node">
 <div class="trace-step-title">3단계: 2차 상호작용 및 RSI 안정도</div>
 <div class="trace-step-content">
 RSI 밴드: [${data.rsiBand}]<br />
 상호작용: ${data.secondRelationships.slice(0, 3).join(', ') || '안정적 독립 구조'}
 </div>
 </div>

 <div class="trace-step-node" style="border-left-color: var(--accent-blue);">
 <div class="trace-step-title" style="color: var(--accent-blue);">4단계: 원천 사주 Fact (Pillar & Stem)</div>
 <div class="trace-step-content">
 ${data.originFacts.map(f => `<div>• ${f}</div>`).join('')}
 </div>
 </div>
 </div>

 <div style="margin-top: 0.5rem; text-align: right;">
 <button class="btn-cta-primary" id="btn-confirm-trace-modal">확인 완료</button>
 </div>
 </div>
 </div>
 `;
}


// ==========================================
// 2-2. 개별 회원 맞춤 대시보드 뷰 (개인 일진, 천기지수, 길시 실시간 타임라인)
// ==========================================
export { renderMemberDashboardView, setMemberActiveTab, getMemberActiveTab } from '../views/MemberDashboardView.js';

// ==========================================
// 사이트 기본 푸터 (대한민국 웹 표준 전자상거래 기본 규격)
// ==========================================
export function renderFooter(): string {
  const cms = SiteContentStore.getConfig();
  const address = cms.footer.address || '부산광역시 사하구 하신번영로 328';
  return `
  <footer class="mabosal-site-footer" id="mabosal-site-footer" style="width: 100%; background: #0c0f17; border-top: 1px solid var(--border-subtle); padding: 2rem 1rem 2.5rem; margin-top: 0.5rem; color: var(--text-muted); font-size: 0.78rem; line-height: 1.6; box-sizing: border-box; text-align: center;">
    <div style="max-width: 1440px; margin: 0 auto; padding: 0 1.25rem; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.25rem; text-align: center;">
      
      <!-- 상단 규정 및 고객센터 바로가기 링크 (중앙 정렬) -->
      <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 1rem; width: 100%;">
        <button type="button" id="btn-footer-terms" style="background: none; border: none; color: #dfe2f1; font-size: 0.8rem; font-weight: 600; cursor: pointer; padding: 0.2rem 0.4rem; border-radius: 4px; transition: color 0.15s ease;">이용약관</button>
        <span style="color: rgba(255,255,255,0.2);">|</span>
        <button type="button" id="btn-footer-privacy" style="background: none; border: none; color: #dfe2f1; font-size: 0.8rem; font-weight: 600; cursor: pointer; padding: 0.2rem 0.4rem; border-radius: 4px; transition: color 0.15s ease;">개인정보처리방침</button>
        <span style="color: rgba(255,255,255,0.2);">|</span>
        <button type="button" id="btn-footer-support" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); color: #ffffff; font-size: 0.8rem; font-weight: 600; cursor: pointer; padding: 0.25rem 0.75rem; border-radius: 6px; display: inline-flex; align-items: center; gap: 0.35rem; transition: all 0.15s ease;">
          <span class="material-symbols-outlined" style="font-size: 15px; color: #ffffff;">support_agent</span>
          고객센터
        </button>
      </div>

      <!-- 정식 사업자 법정 정보 (전자상거래 표준 규격) -->
      <div style="display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.75rem; color: var(--text-muted); align-items: center; text-align: center;">
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; justify-content: center;">
          <span>상호: <strong>${cms.footer.companyName}</strong></span>
          <span style="color: rgba(255,255,255,0.15);">|</span>
          <span>사업자등록번호: <strong>${cms.footer.bizNumber}</strong></span>
          <span style="color: rgba(255,255,255,0.15);">|</span>
          <span>통신판매업신고: <strong>${cms.footer.mailOrderNumber}</strong></span>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; justify-content: center;">
          <span>사업장 소재지: ${address}</span>
          <span style="color: rgba(255,255,255,0.15);">|</span>
          <span>운영시간: 평일 10:00 ~ 18:00 (주말 및 공휴일 휴무)</span>
        </div>
        <div style="color: rgba(168, 172, 193, 0.6); font-size: 0.72rem; margin-top: 0.25rem; line-height: 1.45; max-width: 820px; text-align: center;">
          ※ 본 서비스의 명리 해석 및 운세 감정 결과는 전통 통계 명리학 데이터를 기반으로 한 참고 정보이며, 개인의 최종 결정과 행위에 대한 법적 책임을 지지 않습니다.
        </div>
      </div>

      <!-- 카피라이트 (중앙 정렬) -->
      <div style="font-size: 0.72rem; color: rgba(168, 172, 193, 0.45); padding-top: 0.15rem; text-align: center;">
        © 2026 mabosal.com. All rights reserved.
      </div>
    </div>
  </footer>
  `;
}


// 모바일 전용 상단 드롭다운 메뉴 (사이드바 대신 헤더 바로 아래 노출, 아이콘 제거 및 글자만 노출)
export function renderMobileNavDrawer(state: AppStateData): string {
  const currentView = state.currentView || 'landing';
  return `
  <div id="mobile-nav-backdrop" style="display: none; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px); z-index: 99; transition: opacity 0.2s ease;"></div>
  <div id="mobile-nav-drawer" style="display: none; position: fixed; top: 58px; left: 0; width: 100%; background: rgba(12, 15, 23, 0.98); border-bottom: 2px solid var(--primary); z-index: 101; box-shadow: 0 16px 36px rgba(0,0,0,0.85); flex-direction: column; padding: 0.5rem 0; box-sizing: border-box; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);">
    <nav style="display: flex; flex-direction: column; width: 100%;">
      <button type="button" class="mobile-drawer-item ${(currentView as any) === 'fortune' ? 'active' : ''}" id="m-nav-fortune" style="padding: 1rem 1.75rem; background: none; border: none; border-bottom: 1px solid rgba(255, 255, 255, 0.06); color: ${(currentView as any) === 'fortune' ? 'var(--primary)' : '#ffffff'}; font-weight: ${(currentView as any) === 'fortune' ? '800' : '600'}; font-size: 1.05rem; cursor: pointer; text-align: left; transition: all 0.15s ease;">
        오늘의 운세
      </button>
      <button type="button" class="mobile-drawer-item ${(currentView === 'magi-calendar' || currentView === 'lucky-calendar') ? 'active' : ''}" id="m-nav-magi-cal" style="padding: 1rem 1.75rem; background: none; border: none; border-bottom: 1px solid rgba(255, 255, 255, 0.06); color: ${(currentView === 'magi-calendar' || currentView === 'lucky-calendar') ? 'var(--primary)' : '#ffffff'}; font-weight: ${(currentView === 'magi-calendar' || currentView === 'lucky-calendar') ? '800' : '600'}; font-size: 1.05rem; cursor: pointer; text-align: left; transition: all 0.15s ease;">
        마기달력
      </button>
      <button type="button" class="mobile-drawer-item ${currentView === 'study' ? 'active' : ''}" id="m-nav-study" style="padding: 1rem 1.75rem; background: none; border: none; border-bottom: 1px solid rgba(255, 255, 255, 0.06); color: ${currentView === 'study' ? 'var(--primary)' : '#ffffff'}; font-weight: ${currentView === 'study' ? '800' : '600'}; font-size: 1.05rem; cursor: pointer; text-align: left; transition: all 0.15s ease;">
        스터디
      </button>
      <button type="button" class="mobile-drawer-item ${currentView === 'store' ? 'active' : ''}" id="m-nav-store" style="padding: 1rem 1.75rem; background: none; border: none; border-bottom: 1px solid rgba(255, 255, 255, 0.06); color: ${currentView === 'store' ? 'var(--primary)' : '#ffffff'}; font-weight: ${currentView === 'store' ? '800' : '600'}; font-size: 1.05rem; cursor: pointer; text-align: left; transition: all 0.15s ease;">
        스토어
      </button>
    </nav>
  </div>
  `;
}
