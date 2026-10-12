/**
 * 이용자 대시보드 뷰 (MemberDashboardView)
 * 
 * 최고관리자 대시보드(Admin Control Tower) 아키텍처 100% 동일 적용:
 * - PC: 좌측 250px 고정 카테고리 사이드바 + 우측 메인 워크스페이스
 * - 모바일: 상단 햄버거 토글 버튼 + 좌측에서 부드럽게 슬라이드되는 오버레이 드로어 사이드바
 * - 카테고리:
 *   1) tab-overview: 대시보드 홈 (회원 프로필, 엽전, 최근 주문/바우처 요약)
 *   2) tab-orders: 쇼핑 주문 & 결제 관리 (무통장 입금 대기, 결제 완료 상품)
 *   3) tab-vouchers: 모바일 바우처 / 상품권 보관함 (발급된 코드, 원클릭 복사)
 *   4) tab-fortune: 내 사주 & 감정 리포트 (정통 사주 결과, 대운 열람)
 *   5) tab-daily: 1:1 맞춤 일진 & 황금 길시 (일진 대시보드, 타임라인)
 *   6) tab-account: 내 정보 & 엽전 지갑 관리
 */

import { AppStateData } from '../state/app-state.js';
import { AuthService } from '../state/auth-service.js';
import { UserOrderService } from '../modules/order/user-order-service.js';
import { renderUserOrderHistoryWidget } from '../modules/order/UserOrderHistoryWidget.js';
import { renderMemberVoucherWidget } from '../modules/voucher/MemberVoucherWidget.js';
import { renderCheonmyeongwonDailyDashboard, renderDailyAuspiciousHoursWidget } from '../components/VisualCharts.js';

let activeMemberTabId = 'tab-overview';

export function setMemberActiveTab(tabId: string): void {
  activeMemberTabId = tabId;
}

export function getMemberActiveTab(): string {
  return activeMemberTabId;
}

export function renderMemberDashboardView(state: AppStateData): string {
  const user = AuthService.getCurrentUser();
  const userName = user.role !== 'guest' ? user.name : (state?.userName || '의뢰인');
  const summary = UserOrderService.getCurrentUserOrderSummarySync();
  const currentTab = activeMemberTabId;

  // 카테고리 탭 목록 정의
  const tabs = [
    { id: 'tab-overview', icon: 'dashboard', label: '대시보드 홈', badge: '' },
    { id: 'tab-orders', icon: 'receipt_long', label: '주문 & 결제 내역', badge: summary.pendingTransfers.length > 0 ? `${summary.pendingTransfers.length}건 대기` : '' },
    { id: 'tab-vouchers', icon: 'confirmation_number', label: '모바일 바우처 보관함', badge: summary.issuedVouchers.length > 0 ? `${summary.issuedVouchers.length}개` : '' },
    { id: 'tab-fortune', icon: 'auto_stories', label: '내 사주 & 감정 리포트', badge: state.calcResult ? '열람가능' : '' },
    { id: 'tab-daily', icon: 'calendar_month', label: '1:1 맞춤 일진 & 길시', badge: '오늘' },
    { id: 'tab-account', icon: 'manage_accounts', label: '내 정보 & 엽전 지갑', badge: '' },
  ];

  const currentTabObj = tabs.find(t => t.id === currentTab) || tabs[0];

  return `
  <div class="member-dashboard-wrapper" style="max-width: 1280px; margin: 0 auto; padding: 1rem 1rem 5rem;">
    
    <!-- 모바일 드로어용 백드롭 오버레이 (최고관리자 구조 동일) -->
    <div class="member-dashboard-backdrop" id="member-dashboard-backdrop"></div>

    <!-- 1. 최상단 헤더 바 (PC & 공통 브랜딩) -->
    <div class="member-dashboard-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 1.25rem;">
      <div>
        <div style="display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(242,202,80,0.12); border: 1px solid rgba(242,202,80,0.3); padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.78rem; color: var(--primary); font-weight: 700; margin-bottom: 0.4rem;">
          <span class="material-symbols-outlined" style="font-size: 16px;">verified_user</span>
          마보살 VIP 회원 전용 라운지
        </div>
        <h1 style="font-family: var(--font-serif); font-size: 1.75rem; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
          ${userName} <span style="font-size: 1.1rem; color: var(--text-secondary); font-weight: normal;">님의 맞춤 대시보드</span>
        </h1>
      </div>
      <div style="display: flex; align-items: center; gap: 0.6rem;">
        <button type="button" id="btn-dashboard-back-home" class="btn-cta-secondary" style="padding: 0.5rem 1rem; font-size: 0.82rem; font-weight: 700; border-radius: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #dfe2f1; cursor: pointer; display: flex; align-items: center; gap: 0.35rem;">
          <span class="material-symbols-outlined" style="font-size: 16px;">arrow_back</span>
          메인 홈으로
        </button>
      </div>
    </div>

    <!-- 2. 모바일 전용 햄버거 카테고리 토글 바 (화면폭 860px 미만에서만 노출, 최고관리자와 동일) -->
    <div class="member-hamburger-bar" style="display: none; align-items: center; justify-content: space-between; background: rgba(18, 22, 34, 0.95); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 12px; padding: 0.75rem 1rem; margin-bottom: 1.25rem; box-shadow: 0 4px 16px rgba(0,0,0,0.4);">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <button type="button" id="btn-member-hamburger" style="background: rgba(242, 202, 80, 0.15); border: 1px solid rgba(242, 202, 80, 0.4); color: var(--primary); border-radius: 8px; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <span class="material-symbols-outlined" style="font-size: 22px;">menu</span>
        </button>
        <div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">대시보드 메뉴</div>
          <div style="font-size: 0.95rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 0.35rem;">
            <span class="material-symbols-outlined" style="font-size: 17px; color: var(--primary);">${currentTabObj.icon}</span>
            ${currentTabObj.label}
          </div>
        </div>
      </div>
      <span style="font-size: 0.75rem; color: var(--primary); font-weight: 700; background: rgba(242,202,80,0.1); border: 1px solid rgba(242,202,80,0.25); padding: 0.2rem 0.55rem; border-radius: 9999px;">
        좌측 메뉴 열기
      </span>
    </div>

    <!-- 3. 본문 2컬럼 레이아웃 (좌측 카테고리 사이드바 + 우측 메인 워크스페이스) -->
    <div style="display: flex; gap: 1.75rem; align-items: flex-start; position: relative;">
      
      <!-- [좌측 카테고리 사이드바] (모바일에서는 좌측 슬라이드 오버레이 드로어로 동작) -->
      <aside class="member-sidebar" id="member-dashboard-sidebar">
        
        <!-- 모바일 드로어 전용 상단 닫기 헤더 -->
        <div class="member-sidebar-mobile-header" style="display: none; justify-content: space-between; align-items: center; padding: 0.5rem 0.5rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="material-symbols-outlined" style="color: var(--primary); font-size: 20px;">menu_book</span>
            <span style="font-weight: 800; color: #fff; font-size: 0.95rem;">대시보드 카테고리</span>
          </div>
          <button type="button" id="btn-close-member-sidebar" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0.2rem; display: flex; align-items: center;">
            <span class="material-symbols-outlined" style="font-size: 22px;">close</span>
          </button>
        </div>

        <!-- 프로필 미니 요약 -->
        <div style="padding: 0 0.5rem 1.25rem; border-bottom: 1px solid rgba(255, 255, 255, 0.07); margin-bottom: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, rgba(242,202,80,0.25), rgba(242,202,80,0.05)); border: 1px solid rgba(242,202,80,0.4); display: flex; align-items: center; justify-content: center; color: var(--primary);">
              <span class="material-symbols-outlined" style="font-size: 24px;">person</span>
            </div>
            <div>
              <div style="font-weight: 800; font-size: 0.95rem; color: #fff;">${userName}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${user.username}</div>
            </div>
          </div>
          <div style="margin-top: 0.85rem; background: rgba(255,255,255,0.04); border-radius: 8px; padding: 0.5rem 0.75rem; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.76rem; color: var(--text-muted);">보유 엽전</span>
            <span style="font-size: 0.9rem; font-weight: 800; color: var(--primary); font-family: var(--font-display);">${user.yeopBalance.toLocaleString()} 엽</span>
          </div>
        </div>

        <!-- 카테고리 탭 리스트 -->
        <nav style="display: flex; flex-direction: column; gap: 0.35rem;">
          ${tabs.map(t => `
            <button type="button" class="member-nav-item ${currentTab === t.id ? 'active' : ''}" data-member-tab="${t.id}" style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 0.75rem 0.85rem; border-radius: 10px; font-size: 0.88rem; font-weight: ${currentTab === t.id ? '800' : '600'}; cursor: pointer; text-align: left; transition: all 0.15s ease; border: 1px solid ${currentTab === t.id ? 'rgba(242,202,80,0.35)' : 'transparent'}; background: ${currentTab === t.id ? 'rgba(242,202,80,0.12)' : 'transparent'}; color: ${currentTab === t.id ? 'var(--primary)' : '#c0c5d6'};">
              <div style="display: flex; align-items: center; gap: 0.6rem;">
                <span class="material-symbols-outlined" style="font-size: 19px; color: ${currentTab === t.id ? 'var(--primary)' : 'var(--text-muted)'};">${t.icon}</span>
                <span>${t.label}</span>
              </div>
              ${t.badge ? `<span style="background: rgba(242,202,80,0.2); color: var(--primary); font-size: 0.68rem; padding: 0.15rem 0.45rem; border-radius: 9999px; font-weight: 800;">${t.badge}</span>` : ''}
            </button>
          `).join('')}
        </nav>
      </aside>

      <!-- [우측 메인 워크스페이스] -->
      <main class="member-workspace" style="flex: 1; min-width: 0;">
        ${renderMemberTabContent(currentTab, state, summary, user)}
      </main>

    </div>
  </div>

  <style>
    /* 기본 PC 스타일 */
    .member-sidebar {
      width: 250px;
      flex-shrink: 0;
      background: rgba(14, 18, 28, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1.25rem 0.85rem;
      box-shadow: 0 12px 32px rgba(0,0,0,0.4);
      backdrop-filter: blur(12px);
    }
    .member-dashboard-backdrop {
      display: none;
    }

    /* 모바일 반응형 (화면 폭 860px 이하) - 최고관리자 드로어와 100% 동일한 좌측 슬라이드 */
    @media (max-width: 860px) {
      .member-hamburger-bar {
        display: flex !important;
      }
      .member-sidebar-mobile-header {
        display: flex !important;
      }
      .member-sidebar {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        bottom: 0 !important;
        width: 280px !important;
        height: 100vh !important;
        border-radius: 0 !important;
        z-index: 9999 !important;
        transform: translateX(-100%) !important;
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        box-shadow: 8px 0 32px rgba(0, 0, 0, 0.85) !important;
        background: #0e121d !important;
        overflow-y: auto !important;
        padding: 1.25rem 1rem !important;
      }
      .member-sidebar.open {
        transform: translateX(0) !important;
      }
      .member-dashboard-backdrop {
        position: fixed !important;
        inset: 0 !important;
        background: rgba(0, 0, 0, 0.65) !important;
        backdrop-filter: blur(4px) !important;
        z-index: 9998 !important;
        display: none;
      }
      .member-dashboard-backdrop.open {
        display: block !important;
      }
    }
  </style>
  `;
}

function renderMemberTabContent(tabId: string, state: AppStateData, summary: any, user: any): string {
  switch (tabId) {
    case 'tab-orders':
      return `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
              <div>
                <h2 style="font-size: 1.3rem; font-weight: 800; color: #fff; margin: 0 0 0.25rem 0;">나의 주문 & 결제 관리</h2>
                <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0;">구매한 상품 및 무통장 입금 승인 상태를 실시간으로 확인합니다.</p>
              </div>
              <button type="button" id="btn-goto-store-from-dash" class="btn-cta-primary" style="padding: 0.45rem 0.9rem; font-size: 0.78rem; font-weight: 700; border-radius: 8px;">
                + 스토어 둘러보기
              </button>
            </div>
            ${renderUserOrderHistoryWidget()}
          </div>
        </div>
      `;

    case 'tab-vouchers':
      return `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem;">
            <div style="margin-bottom: 1.25rem;">
              <h2 style="font-size: 1.3rem; font-weight: 800; color: #fff; margin: 0 0 0.25rem 0;">모바일 바우처 / 상품권 보관함</h2>
              <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0;">승인 완료된 VIP 기프트 상품권과 발급 코드를 안전하게 관리하고 복사하여 사용하세요.</p>
            </div>
            ${renderMemberVoucherWidget()}
          </div>
        </div>
      `;

    case 'tab-fortune':
      return `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem;">
            <h2 style="font-size: 1.3rem; font-weight: 800; color: #fff; margin: 0 0 0.25rem 0;">나의 정통 사주 감정서</h2>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0 0 1.5rem 0;">등록된 사주 원국과 인생 대운의 길흉화복 리포트를 언제든지 다시 열람할 수 있습니다.</p>

            ${state.calcResult ? `
              <div style="background: rgba(242,202,80,0.06); border: 1px solid rgba(242,202,80,0.25); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.25rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
                  <div>
                    <div style="font-size: 0.78rem; color: var(--primary); font-weight: 700; margin-bottom: 0.25rem;">최근 분석 완료</div>
                    <div style="font-size: 1.15rem; font-weight: 800; color: #fff;">${state.userName || '의뢰인'} 님의 평생 사주 감정서</div>
                  </div>
                  <button type="button" id="btn-goto-my-result" class="btn-cta-primary" style="padding: 0.6rem 1.2rem; font-size: 0.85rem; font-weight: 800; border-radius: 8px;">
                    사주 감정서 열람하기
                  </button>
                </div>
              </div>
            ` : `
              <div style="text-align: center; padding: 3rem 1.5rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.12);">
                <span class="material-symbols-outlined" style="font-size: 48px; color: var(--text-muted); margin-bottom: 0.75rem;">auto_stories</span>
                <div style="font-size: 1.05rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem;">아직 보관된 사주 정보가 없습니다</div>
                <p style="font-size: 0.85rem; color: var(--text-muted); max-width: 400px; margin: 0 auto 1.5rem;">생년월일시를 입력하고 나만을 위한 평생 정밀 사주 감정서를 생성해보세요.</p>
                <button type="button" id="btn-goto-start-saju" class="btn-cta-primary" style="padding: 0.65rem 1.5rem; font-size: 0.9rem; font-weight: 800; border-radius: 8px;">
                  무료 사주 분석 시작
                </button>
              </div>
            `}
          </div>
        </div>
      `;

    case 'tab-daily':
      return `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem;">
            <h2 style="font-size: 1.3rem; font-weight: 800; color: #fff; margin: 0 0 0.25rem 0;">오늘의 1:1 맞춤 일진 & 운세 처방</h2>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0 0 1.25rem 0;">양력·음력 일진과 천기지수, 나에게 가장 유리한 행운 처방을 확인하세요.</p>
            ${renderCheonmyeongwonDailyDashboard({
              userName: state?.userName || user.name || '의뢰인',
              gender: state?.gender,
              calcResult: state?.calcResult,
            })}
          </div>

          <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem;">
            <h3 style="font-family: var(--font-serif); font-size: 1.15rem; font-weight: 700; color: var(--primary); margin: 0 0 0.25rem 0;">오늘의 2대 황금 길시(吉時) 타임라인</h3>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0 0 1rem 0;">계약, 미팅, 중요한 결정을 내리기 가장 좋은 황금 시간대입니다.</p>
            ${renderDailyAuspiciousHoursWidget()}
          </div>
        </div>
      `;

    case 'tab-account':
      return `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem;">
            <h2 style="font-size: 1.3rem; font-weight: 800; color: #fff; margin: 0 0 0.25rem 0;">내 계정 및 엽전 지갑 관리</h2>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0 0 1.5rem 0;">회원 계정 정보와 엽전 충전 내역을 관리합니다.</p>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
              <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.25rem;">
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.35rem;">기본 계정 정보</div>
                <div style="font-size: 1.1rem; font-weight: 800; color: #fff; margin-bottom: 0.2rem;">${user.name} (${user.username})</div>
                <div style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 0.15rem;">연락처: ${user.phone || '010-****-****'}</div>
                <div style="font-size: 0.78rem; color: var(--text-secondary);">가입일: ${user.joinedAt || '2026-10-01'}</div>
              </div>

              <div style="background: rgba(242,202,80,0.06); border: 1px solid rgba(242,202,80,0.25); border-radius: 12px; padding: 1.25rem;">
                <div style="font-size: 0.78rem; color: var(--primary); margin-bottom: 0.35rem; font-weight: 700;">내 엽전 지갑</div>
                <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary); font-family: var(--font-display); margin-bottom: 0.5rem;">
                  ${user.yeopBalance.toLocaleString()} <span style="font-size: 1rem;">엽</span>
                </div>
                <button type="button" id="btn-yeop-wallet-charge" class="btn-cta-primary" style="padding: 0.45rem 1rem; font-size: 0.8rem; font-weight: 800; border-radius: 6px;">
                  엽전 충전하기
                </button>
              </div>
            </div>

            <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1.25rem; display: flex; justify-content: flex-end;">
              <button type="button" id="btn-dashboard-logout" class="btn-cta-secondary" style="padding: 0.5rem 1.2rem; font-size: 0.82rem; font-weight: 700; border-radius: 8px; color: #ff6b6b; border: 1px solid rgba(255, 107, 107, 0.3); background: rgba(255, 107, 107, 0.08); cursor: pointer;">
                로그아웃
              </button>
            </div>
          </div>
        </div>
      `;

    case 'tab-overview':
    default:
      return `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          
          <!-- 상단 4대 핵심 지표 카드 -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            
            <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem;">
              <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(242,202,80,0.12); border: 1px solid rgba(242,202,80,0.3); display: flex; align-items: center; justify-content: center; color: var(--primary);">
                <span class="material-symbols-outlined" style="font-size: 26px;">monetization_on</span>
              </div>
              <div>
                <div style="font-size: 0.76rem; color: var(--text-muted); font-weight: 600;">보유 엽전</div>
                <div style="font-size: 1.25rem; font-weight: 800; color: #fff; font-family: var(--font-display);">${user.yeopBalance.toLocaleString()} 엽</div>
              </div>
            </div>

            <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem;">
              <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.3); display: flex; align-items: center; justify-content: center; color: #60a5fa;">
                <span class="material-symbols-outlined" style="font-size: 26px;">shopping_bag</span>
              </div>
              <div>
                <div style="font-size: 0.76rem; color: var(--text-muted); font-weight: 600;">주문/쇼핑 내역</div>
                <div style="font-size: 1.25rem; font-weight: 800; color: #fff;">${summary.orders.length}건</div>
              </div>
            </div>

            <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem;">
              <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3); display: flex; align-items: center; justify-content: center; color: #34d399;">
                <span class="material-symbols-outlined" style="font-size: 26px;">confirmation_number</span>
              </div>
              <div>
                <div style="font-size: 0.76rem; color: var(--text-muted); font-weight: 600;">모바일 바우처</div>
                <div style="font-size: 1.25rem; font-weight: 800; color: #fff;">${summary.issuedVouchers.length}개 보유</div>
              </div>
            </div>

            <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem;">
              <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(168,85,247,0.12); border: 1px solid rgba(168,85,247,0.3); display: flex; align-items: center; justify-content: center; color: #c084fc;">
                <span class="material-symbols-outlined" style="font-size: 26px;">auto_stories</span>
              </div>
              <div>
                <div style="font-size: 0.76rem; color: var(--text-muted); font-weight: 600;">사주 감정서</div>
                <div style="font-size: 1.25rem; font-weight: 800; color: #fff;">${state.calcResult ? '열람 가능' : '미등록'}</div>
              </div>
            </div>

          </div>

          <!-- 입금 대기 알림 배너 -->
          ${summary.pendingTransfers.length > 0 ? `
            <div style="background: linear-gradient(135deg, rgba(242,202,80,0.15), rgba(242,202,80,0.04)); border: 1px solid rgba(242,202,80,0.4); border-radius: 14px; padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div style="display: flex; align-items: center; gap: 0.85rem;">
                <span class="material-symbols-outlined" style="font-size: 32px; color: var(--primary);">pending_actions</span>
                <div>
                  <div style="font-weight: 800; font-size: 1.05rem; color: #fff;">입금 대기 중인 주문이 ${summary.pendingTransfers.length}건 있습니다</div>
                  <div style="font-size: 0.82rem; color: var(--text-secondary);">무통장 입금 완료 후 관리자가 1분 이내에 승인 및 바우처 코드를 즉시 발급해 드립니다.</div>
                </div>
              </div>
              <button type="button" class="btn-cta-primary member-nav-item" data-member-tab="tab-orders" style="padding: 0.5rem 1.1rem; font-size: 0.82rem; font-weight: 800; border-radius: 8px;">
                입금 계좌 및 주문 확인 →
              </button>
            </div>
          ` : ''}

          <!-- 쇼핑 & 주문 요약 위젯 -->
          <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <h3 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0;">최근 주문 & 발급 내역</h3>
              <button type="button" class="member-nav-item" data-member-tab="tab-orders" style="background: none; border: none; color: var(--primary); font-size: 0.8rem; font-weight: 700; cursor: pointer;">
                전체보기 →
              </button>
            </div>
            ${renderUserOrderHistoryWidget()}
          </div>

          <!-- 오늘의 길시 미니 위젯 -->
          <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <h3 style="font-family: var(--font-serif); font-size: 1.15rem; font-weight: 800; color: var(--primary); margin: 0;">오늘의 황금 길시(吉時) 타임라인</h3>
              <button type="button" class="member-nav-item" data-member-tab="tab-daily" style="background: none; border: none; color: var(--primary); font-size: 0.8rem; font-weight: 700; cursor: pointer;">
                상세보기 →
              </button>
            </div>
            ${renderDailyAuspiciousHoursWidget()}
          </div>

        </div>
      `;
  }
}
