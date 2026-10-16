/**
 * 이용자 대시보드 뷰 (MemberDashboardView)
 * 
 * 최고관리자 대시보드 아키텍처 동일 적용:
 * - PC: 좌측 250px 고정 카테고리 사이드바 + 우측 메인 워크스페이스
 * - 모바일: 상단 햄버거 토글 버튼 + 좌측에서 부드럽게 슬라이드되는 오버레이 드로어 사이드바
 * - [요구사항 2] 기존 홈화면을 제거하고 '오늘의 운세'를 첫 번째 홈화면으로 세팅
 * - [요구사항 3] 엽전 기능 중지/제거 반영: 보유 엽전 등 엽전 UI 전수 제거
 * - [요구사항 6] 기본 컬러(모노크롬/화이트/그레이) 이외 컬러 전수 제거, 긴급 알림만 적색 허용
 */

import { AppStateData } from '../state/app-state.js';
import { AuthService } from '../state/auth-service.js';
import { UserOrderService } from '../modules/order/user-order-service.js';
import { renderUserOrderHistoryWidget } from '../modules/order/UserOrderHistoryWidget.js';
import { renderMemberVoucherWidget } from '../modules/voucher/MemberVoucherWidget.js';
import { renderCheonmyeongwonDailyDashboard, renderDailyAuspiciousHoursWidget } from '../components/VisualCharts.js';
import { CustomerInquiryStore } from '../state/customer-inquiry-store.js';
import { renderMemberLuckyCalendarWidget, renderMemberMagiCalendarWidget } from './MemberCalendarWidgets.js';

let activeMemberTabId = 'tab-daily';

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

  // 내가 작성한 문의 조회
  const allInquiries = CustomerInquiryStore.getInquiries();
  const myInquiries = allInquiries.filter(i => 
    (user.role !== 'guest' && i.userId === user.username) || 
    (user.role !== 'guest' && user.email && i.replyEmail.toLowerCase() === user.email.toLowerCase()) ||
    (i.userName === userName)
  );

  // 카테고리 탭 목록 (홈화면 제거 -> 행운처방을 홈화면으로 설정)
  const tabs = [
    { id: 'tab-daily', icon: 'auto_fix_high', label: '행운처방', badge: '' },
    { id: 'tab-lucky-calendar', icon: 'event_available', label: '행운달력', badge: '' },
    { id: 'tab-magi-calendar', icon: 'event_busy', label: '마기달력', badge: '' },
    { id: 'tab-fortune', icon: 'auto_stories', label: '감정서', badge: state.calcResult ? '열람가능' : '' },
    { id: 'tab-vouchers', icon: 'confirmation_number', label: '쿠폰', badge: summary.issuedVouchers.length > 0 ? `${summary.issuedVouchers.length}개` : '' },
    { id: 'tab-orders', icon: 'receipt_long', label: '주문 내역', badge: summary.pendingTransfers.length > 0 ? `${summary.pendingTransfers.length}건 대기` : '' },
    { id: 'tab-account', icon: 'manage_accounts', label: '내 정보', badge: '' },
    { id: 'tab-inquiries', icon: 'support_agent', label: '고객센터', badge: myInquiries.some(i => i.status === 'pending') ? '답변대기' : '' },
  ];

  const currentTabObj = tabs.find(t => t.id === currentTab) || tabs[0];

  return `
  <div class="member-dashboard-wrapper" style="max-width: 1280px; margin: 0 auto; padding: 1rem 1rem 5rem;">
    
    <!-- 모바일 드로어용 백드롭 오버레이 -->
    <div class="member-dashboard-backdrop" id="member-dashboard-backdrop"></div>

    <!-- 2. 모바일 전용 햄버거 카테고리 토글 바 -->
    <div class="member-hamburger-bar" style="display: none; align-items: center; justify-content: space-between; background: rgba(18, 22, 34, 0.95); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; padding: 0.75rem 1rem; margin-bottom: 1.25rem; box-shadow: 0 4px 16px rgba(0,0,0,0.4);">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <button type="button" id="btn-member-hamburger" style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); color: #fff; border-radius: 8px; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <span class="material-symbols-outlined" style="font-size: 22px;">menu</span>
        </button>
        <div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">대시보드 메뉴</div>
          <div style="font-size: 0.95rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 0.35rem;">
            <span class="material-symbols-outlined" style="font-size: 17px; color: #cbd5e1;">${currentTabObj.icon}</span>
            ${currentTabObj.label}
          </div>
        </div>
      </div>
      <span style="font-size: 0.75rem; color: #fff; font-weight: 700; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); padding: 0.2rem 0.55rem; border-radius: 9999px;">
        메뉴 열기
      </span>
    </div>

    <!-- 3. 본문 2컬럼 레이아웃 (좌측 카테고리 사이드바 + 우측 메인 워크스페이스) -->
    <div style="display: flex; gap: 1.75rem; align-items: flex-start; position: relative;">
      
      <!-- [좌측 카테고리 사이드바] -->
      <aside class="member-sidebar" id="member-dashboard-sidebar">
        
        <!-- 모바일 드로어 전용 상단 닫기 헤더 -->
        <div class="member-sidebar-mobile-header" style="display: none; justify-content: space-between; align-items: center; padding: 0.5rem 0.5rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="material-symbols-outlined" style="color: #fff; font-size: 20px;">menu_book</span>
            <span style="font-weight: 800; color: #fff; font-size: 0.95rem;">대시보드 메뉴</span>
          </div>
          <button type="button" id="btn-close-member-sidebar" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0.2rem; display: flex; align-items: center;">
            <span class="material-symbols-outlined" style="font-size: 22px;">close</span>
          </button>
        </div>

        <!-- 프로필 미니 요약 (엽전 표시 완전 제거) -->
        ${(() => {
          const cleanName = userName.replace(/\s*\(.*\)/, '').trim();
          let maskedName = cleanName;
          if (cleanName.length === 2) {
            maskedName = cleanName[0] + '*';
          } else if (cleanName.length === 3) {
            maskedName = cleanName[0] + '*' + cleanName[2];
          } else if (cleanName.length === 4) {
            maskedName = cleanName[0] + '**' + cleanName[3];
          } else if (cleanName.length >= 5) {
            maskedName = cleanName.slice(0, 2) + '*'.repeat(Math.min(cleanName.length - 3, 2)) + cleanName.slice(-1);
          }
          return `
          <div style="padding: 0 0.5rem 1.25rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08); margin-bottom: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); display: flex; align-items: center; justify-content: center; color: #fff;">
                <span class="material-symbols-outlined" style="font-size: 24px;">person</span>
              </div>
              <div>
                <div style="font-weight: 800; font-size: 0.95rem; color: #fff; font-family: var(--font-mono);">@${user.username || 'user'}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${maskedName ? maskedName + ' (인증회원)' : '회원'}</div>
              </div>
            </div>
          </div>
          `;
        })()}

        <!-- 카테고리 탭 리스트 -->
        <nav style="display: flex; flex-direction: column; gap: 0.35rem;">
          ${tabs.map(t => {
            const isActive = currentTab === t.id;
            const isRedBadge = t.badge === '답변대기';

            return `
            <button type="button" class="member-nav-item ${isActive ? 'active' : ''}" data-member-tab="${t.id}" style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 0.75rem 0.85rem; border-radius: 10px; font-size: 0.88rem; font-weight: ${isActive ? '800' : '600'}; cursor: pointer; text-align: left; transition: all 0.15s ease; border: 1px solid ${isActive ? 'rgba(255,255,255,0.25)' : 'transparent'}; background: ${isActive ? 'rgba(255,255,255,0.1)' : 'transparent'}; color: ${isActive ? '#fff' : '#94a3b8'};">
              <div style="display: flex; align-items: center; gap: 0.6rem;">
                <span class="material-symbols-outlined" style="font-size: 19px; color: ${isActive ? '#fff' : 'var(--text-muted)'};">${t.icon}</span>
                <span>${t.label}</span>
              </div>
              ${t.badge ? `
                <span style="background: ${isRedBadge ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}; color: ${isRedBadge ? '#f87171' : '#cbd5e1'}; border: 1px solid ${isRedBadge ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.15)'}; font-size: 0.68rem; padding: 0.12rem 0.45rem; border-radius: 9999px; font-weight: 700;">
                  ${t.badge}
                </span>
              ` : ''}
            </button>
            `;
          }).join('')}
        </nav>
      </aside>

      <!-- [우측 메인 워크스페이스] -->
      <main class="member-workspace" style="flex: 1; min-width: 0;">
        ${renderMemberTabContent(currentTab, state, summary, user, myInquiries)}
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

    /* 모바일 반응형 */
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

function renderMemberTabContent(tabId: string, state: AppStateData, summary: any, user: any, myInquiries: any[]): string {
  switch (tabId) {
    // 1. 행운처방 (기본 홈화면)
    case 'tab-daily':
      return `
        <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem;">
          ${renderCheonmyeongwonDailyDashboard({
            userName: state?.userName || user.name || '의뢰인',
            gender: state?.gender,
            calcResult: state?.calcResult,
          })}
        </div>
      `;

    // 2. 주문 내역
    case 'tab-orders':
      return `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
              <div>
                <h2 style="font-size: 1.3rem; font-weight: 800; color: #fff; margin: 0 0 0.25rem 0;">나의 주문 &amp; 결제 내역</h2>
                <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0;">구매한 상품 및 무통장 입금 승인 상태를 실시간으로 확인합니다.</p>
              </div>
              <button type="button" id="btn-goto-store-from-dash" class="btn-cta-secondary" style="padding: 0.45rem 0.9rem; font-size: 0.78rem; font-weight: 700; border-radius: 8px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; cursor: pointer;">
                + 스토어 둘러보기
              </button>
            </div>
            ${renderUserOrderHistoryWidget()}
          </div>
        </div>
      `;

    // 3. 쿠폰 (바우처 보관함)
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

    // 4. 1:1 문의
    case 'tab-inquiries':
      return `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
              <div>
                <h2 style="font-size: 1.3rem; font-weight: 800; color: #fff; margin: 0 0 0.25rem 0;">나의 1:1 문의 및 답변 내역</h2>
                <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0;">고객센터에 접수하신 문의와 관리자 공식 답변을 실시간으로 확인합니다.</p>
              </div>
              <button type="button" id="btn-open-support-from-dash" class="btn-cta-secondary" style="padding: 0.5rem 1.15rem; font-size: 0.82rem; font-weight: 800; border-radius: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; display: inline-flex; align-items: center; gap: 0.35rem; cursor: pointer;">
                <span class="material-symbols-outlined" style="font-size: 16px;">support_agent</span>
                <span>+ 새 문의 작성하기</span>
              </button>
            </div>

            ${myInquiries.length === 0 ? `
              <div style="text-align: center; padding: 3rem 1.5rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.12);">
                <span class="material-symbols-outlined" style="font-size: 44px; color: var(--text-muted); margin-bottom: 0.75rem;">chat_bubble_outline</span>
                <div style="font-size: 1.05rem; font-weight: 700; color: #fff; margin-bottom: 0.4rem;">등록된 1:1 문의 내역이 없습니다</div>
                <p style="font-size: 0.82rem; color: var(--text-muted); max-width: 420px; margin: 0 auto 1.25rem;">
                  서비스 이용 중 궁금하신 점이나 결제, 사주 감정서 관련 문의를 남겨주시면 신속하게 답변해 드립니다.
                </p>
                <button type="button" id="btn-open-support-empty" class="btn-cta-secondary" style="padding: 0.55rem 1.25rem; font-size: 0.85rem; font-weight: 800; border-radius: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; cursor: pointer;">
                  1:1 문의 접수하기
                </button>
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${myInquiries.map(inq => {
                  const isPending = inq.status === 'pending';

                  return `
                  <div class="user-inquiry-accordion-item" style="background: rgba(255, 255, 255, 0.03); border: 1px solid ${isPending ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.08)'}; border-radius: 8px; overflow: hidden; transition: all 0.15s ease;">
                    
                    <!-- 닫힘 기본 헤더 행: 클릭 시 토글 -->
                    <div class="btn-toggle-inquiry-row" data-target="inq-detail-${inq.id}" style="padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; cursor: pointer; user-select: none;">
                      <div style="display: flex; align-items: center; gap: 0.6rem; min-width: 0; flex: 1;">
                        <span style="font-size: 0.7rem; padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 800; background: ${isPending ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)'}; color: ${isPending ? '#f87171' : '#cbd5e1'}; border: 1px solid ${isPending ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.12)'}; white-space: nowrap;">
                          ${isPending ? '답변대기' : '답변완료'}
                        </span>
                        <span style="font-size: 0.72rem; color: #94a3b8; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); padding: 0.12rem 0.4rem; border-radius: 4px; white-space: nowrap;">
                          ${inq.category}
                        </span>
                        <span style="font-size: 0.88rem; font-weight: 700; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                          ${inq.title}
                        </span>
                      </div>
                      <div style="display: flex; align-items: center; gap: 0.65rem; flex-shrink: 0;">
                        <span style="font-size: 0.74rem; color: var(--text-muted);">${new Date(inq.createdAt).toLocaleDateString()}</span>
                        <span class="material-symbols-outlined inq-chevron-${inq.id}" style="font-size: 18px; color: var(--text-muted); transition: transform 0.2s ease;">expand_more</span>
                      </div>
                    </div>

                    <!-- 상세 본문 및 답변 (기본 닫힘) -->
                    <div id="inq-detail-${inq.id}" class="inquiry-collapsible-detail" style="display: none; padding: 1rem; border-top: 1px dashed rgba(255, 255, 255, 0.08); background: rgba(0, 0, 0, 0.25);">
                      <div style="font-size: 0.85rem; color: #cbd5e1; line-height: 1.6; white-space: pre-line; margin-bottom: 0.75rem;">
                        ${inq.content}
                      </div>
                      ${inq.adminAnswer ? `
                        <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 6px; padding: 0.75rem 0.85rem;">
                          <div style="font-size: 0.78rem; font-weight: 800; color: #fff; margin-bottom: 0.35rem; display: flex; justify-content: space-between;">
                            <span>관리자 답변</span>
                            <span style="font-size: 0.72rem; color: #94a3b8; font-weight: normal;">${inq.answeredAt ? new Date(inq.answeredAt).toLocaleDateString() : ''}</span>
                          </div>
                          <div style="font-size: 0.82rem; color: #dfe2f1; line-height: 1.55; white-space: pre-line;">
                            ${inq.adminAnswer}
                          </div>
                        </div>
                      ` : `
                        <div style="font-size: 0.75rem; color: #f87171;">
                          • 담당자가 확인 중입니다. 영업일 기준 신속히 회신드립니다.
                        </div>
                      `}
                    </div>

                  </div>
                  `;
                }).join('')}
              </div>
            `}

          </div>
        </div>
      `;

    // 5. 감정서
    case 'tab-fortune':
      return `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem;">
            <h2 style="font-size: 1.3rem; font-weight: 800; color: #fff; margin: 0 0 0.25rem 0;">나의 정통 사주 감정서</h2>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0 0 1.5rem 0;">등록된 사주 원국과 인생 대운의 길흉화복 리포트를 언제든지 다시 열람할 수 있습니다.</p>

            ${state.calcResult ? `
              <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.25rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
                  <div>
                    <div style="font-size: 0.78rem; color: #cbd5e1; font-weight: 700; margin-bottom: 0.25rem;">분석 완료</div>
                    <div style="font-size: 1.15rem; font-weight: 800; color: #fff;">나의 평생 사주 감정서</div>
                  </div>
                  <button type="button" id="btn-goto-my-result" class="btn-cta-secondary" style="padding: 0.6rem 1.2rem; font-size: 0.85rem; font-weight: 800; border-radius: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.25); color: #fff; cursor: pointer;">
                    사주 감정서 열람하기
                  </button>
                </div>
              </div>
            ` : `
              <div style="text-align: center; padding: 3rem 1.5rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.12);">
                <span class="material-symbols-outlined" style="font-size: 48px; color: var(--text-muted); margin-bottom: 0.75rem;">auto_stories</span>
                <div style="font-size: 1.05rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem;">아직 보관된 사주 정보가 없습니다</div>
                <p style="font-size: 0.85rem; color: var(--text-muted); max-width: 400px; margin: 0 auto 1.5rem;">생년월일시를 입력하고 나만을 위한 평생 정밀 사주 감정서를 생성해보세요.</p>
                <button type="button" id="btn-goto-start-saju" class="btn-cta-secondary" style="padding: 0.65rem 1.5rem; font-size: 0.9rem; font-weight: 800; border-radius: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; cursor: pointer;">
                  사주 분석 시작
                </button>
              </div>
            `}
          </div>
        </div>
      `;

    // 6. 내 정보 (엽전 제거)
    // 2. 행운달력 (이달의 대길·골든데이 - 1:1 개인화 전용)
    case 'tab-lucky-calendar':
      return `
        <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem;">
          ${renderMemberLuckyCalendarWidget(state)}
        </div>
      `;

    // 3. 마기달력 (이달의 피흉·결정보류 - 1:1 개인화 전용)
    case 'tab-magi-calendar':
      return `
        <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem;">
          ${renderMemberMagiCalendarWidget(state)}
        </div>
      `;

    // 내 정보 (아이디/비번 변경, 이용자 정보 등록 및 수정, 안전한 회원탈퇴 아코디언)
    case 'tab-account':
    default:
      const rawUser = AuthService.getCurrentUser();
      const birthDateVal = rawUser.birthDate || ((state as any)?.birthDate ? `${(state as any).birthYear || '1993'}-${String((state as any).birthMonth || '8').padStart(2, '0')}-${String((state as any).birthDay || '15').padStart(2, '0')}` : '1993-08-15');
      const birthTimeVal = rawUser.birthTime || ((state as any)?.birthHour !== undefined ? String((state as any).birthHour) : '12');
      const calendarVal = rawUser.calendarType || (state?.calendarType === 'lunar' ? 'lunar' : 'solar');
      const genderVal = rawUser.gender || (state?.gender === 'female' ? 'female' : 'male');

      return `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          
          <!-- 회원 프로필 & 계정 설정 폼 -->
          <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem;">
            <div style="border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.85rem; margin-bottom: 1.25rem;">
              <h2 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0 0 0.25rem 0;">내 정보 관리</h2>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">로그인 아이디, 비밀번호 변경 및 사주 분석에 필요한 기본 프로필 정보를 등록하고 수정합니다.</p>
            </div>

            <form id="form-user-account-settings" onsubmit="return false;" style="display: flex; flex-direction: column; gap: 1.25rem;">
              
              <!-- 1. 로그인 계정 보안 정보 -->
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1.15rem;">
                <h3 style="font-size: 0.95rem; font-weight: 800; color: #fff; margin: 0 0 0.85rem 0; display: flex; align-items: center; gap: 0.4rem;">
                  <span class="material-symbols-outlined" style="font-size: 18px; color: #cbd5e1;">lock</span>
                  로그인 계정 보안 설정
                </h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
                  <div>
                    <label style="display: block; font-size: 0.76rem; color: var(--text-muted); margin-bottom: 0.35rem;">
                      아이디 (로그인 ID) <span style="color: #f87171;">*</span>
                    </label>
                    <input type="text" id="input-profile-username" value="${rawUser.username || ''}" required placeholder="아이디 입력 (최소 3자)" style="width: 100%; box-sizing: border-box; background: #161b26; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.75rem; color: #fff; font-size: 0.85rem; font-family: var(--font-mono);" />
                  </div>

                  <div>
                    <label style="display: block; font-size: 0.76rem; color: var(--text-muted); margin-bottom: 0.35rem;">
                      새 비밀번호 (변경 시에만 입력)
                    </label>
                    <input type="password" id="input-profile-new-password" placeholder="변경할 새 비밀번호" style="width: 100%; box-sizing: border-box; background: #161b26; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.75rem; color: #fff; font-size: 0.85rem;" />
                  </div>

                  <div>
                    <label style="display: block; font-size: 0.76rem; color: var(--text-muted); margin-bottom: 0.35rem;">
                      새 비밀번호 확인
                    </label>
                    <input type="password" id="input-profile-confirm-password" placeholder="새 비밀번호 재입력" style="width: 100%; box-sizing: border-box; background: #161b26; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.75rem; color: #fff; font-size: 0.85rem;" />
                  </div>
                </div>
              </div>

              <!-- 2. 이용자 기본 및 명리 프로필 정보 -->
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1.15rem;">
                <h3 style="font-size: 0.95rem; font-weight: 800; color: #fff; margin: 0 0 0.85rem 0; display: flex; align-items: center; gap: 0.4rem;">
                  <span class="material-symbols-outlined" style="font-size: 18px; color: #cbd5e1;">badge</span>
                  이용자 기본 &amp; 사주 프로필
                </h3>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                  <div>
                    <label style="display: block; font-size: 0.76rem; color: var(--text-muted); margin-bottom: 0.35rem;">
                      이름 / 닉네임 <span style="color: #f87171;">*</span>
                    </label>
                    <input type="text" id="input-profile-name" value="${rawUser.name || ''}" required placeholder="성함 또는 닉네임" style="width: 100%; box-sizing: border-box; background: #161b26; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.75rem; color: #fff; font-size: 0.85rem;" />
                  </div>

                  <div>
                    <label style="display: block; font-size: 0.76rem; color: var(--text-muted); margin-bottom: 0.35rem;">
                      연락처 (휴대폰)
                    </label>
                    <input type="tel" id="input-profile-phone" value="${rawUser.phone || ''}" placeholder="010-0000-0000" style="width: 100%; box-sizing: border-box; background: #161b26; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.75rem; color: #fff; font-size: 0.85rem;" />
                  </div>

                  <div>
                    <label style="display: block; font-size: 0.76rem; color: var(--text-muted); margin-bottom: 0.35rem;">
                      생년월일
                    </label>
                    <input type="date" id="input-profile-birthdate" value="${birthDateVal}" style="width: 100%; box-sizing: border-box; background: #161b26; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.55rem 0.75rem; color: #fff; font-size: 0.85rem;" />
                  </div>

                  <div>
                    <label style="display: block; font-size: 0.76rem; color: var(--text-muted); margin-bottom: 0.35rem;">
                      양력 / 음력
                    </label>
                    <select id="input-profile-calendar" style="width: 100%; box-sizing: border-box; background: #161b26; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.75rem; color: #fff; font-size: 0.85rem;">
                      <option value="solar" ${calendarVal === 'solar' ? 'selected' : ''}>양력 (Solar)</option>
                      <option value="lunar" ${calendarVal === 'lunar' ? 'selected' : ''}>음력 (Lunar)</option>
                    </select>
                  </div>

                  <div>
                    <label style="display: block; font-size: 0.76rem; color: var(--text-muted); margin-bottom: 0.35rem;">
                      태어난 시간
                    </label>
                    <select id="input-profile-birthtime" style="width: 100%; box-sizing: border-box; background: #161b26; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.75rem; color: #fff; font-size: 0.85rem;">
                      <option value="12" ${birthTimeVal === '12' ? 'selected' : ''}>시간 모름 (오시 12:00 기준)</option>
                      <option value="0" ${birthTimeVal === '0' ? 'selected' : ''}>자시 (23:30 ~ 01:29)</option>
                      <option value="2" ${birthTimeVal === '2' ? 'selected' : ''}>축시 (01:30 ~ 03:29)</option>
                      <option value="4" ${birthTimeVal === '4' ? 'selected' : ''}>인시 (03:30 ~ 05:29)</option>
                      <option value="6" ${birthTimeVal === '6' ? 'selected' : ''}>묘시 (05:30 ~ 07:29)</option>
                      <option value="8" ${birthTimeVal === '8' ? 'selected' : ''}>진시 (07:30 ~ 09:29)</option>
                      <option value="10" ${birthTimeVal === '10' ? 'selected' : ''}>사시 (09:30 ~ 11:29)</option>
                      <option value="12" ${birthTimeVal === '12' ? 'selected' : ''}>오시 (11:30 ~ 13:29)</option>
                      <option value="14" ${birthTimeVal === '14' ? 'selected' : ''}>미시 (13:30 ~ 15:29)</option>
                      <option value="16" ${birthTimeVal === '16' ? 'selected' : ''}>신시 (15:30 ~ 17:29)</option>
                      <option value="18" ${birthTimeVal === '18' ? 'selected' : ''}>유시 (17:30 ~ 19:29)</option>
                      <option value="20" ${birthTimeVal === '20' ? 'selected' : ''}>술시 (19:30 ~ 21:29)</option>
                      <option value="22" ${birthTimeVal === '22' ? 'selected' : ''}>해시 (21:30 ~ 23:29)</option>
                    </select>
                  </div>

                  <div>
                    <label style="display: block; font-size: 0.76rem; color: var(--text-muted); margin-bottom: 0.35rem;">
                      성별
                    </label>
                    <select id="input-profile-gender" style="width: 100%; box-sizing: border-box; background: #161b26; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.75rem; color: #fff; font-size: 0.85rem;">
                      <option value="male" ${genderVal === 'male' ? 'selected' : ''}>남성</option>
                      <option value="female" ${genderVal === 'female' ? 'selected' : ''}>여성</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- 수정 저장 버튼 -->
              <div style="display: flex; justify-content: flex-end; gap: 0.65rem; padding-top: 0.5rem;">
                <button type="button" id="btn-save-user-profile" style="background: #ffffff; color: #000; font-weight: 800; font-size: 0.85rem; padding: 0.65rem 1.6rem; border-radius: 8px; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.35rem; transition: all 0.15s ease;">
                  <span class="material-symbols-outlined" style="font-size: 18px;">check</span>
                  <span>회원 정보 수정 저장</span>
                </button>
              </div>

            </form>
          </div>

          <!-- 3. 회원 탈퇴 (바로 노출되지 않고 안전한 접이식 아코디언 설계) -->
          <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.75rem; color: #64748b;">회원 탈퇴를 원하실 경우 아래 옵션을 열어주세요.</span>
              <button type="button" id="btn-toggle-withdraw-section" style="background: none; border: none; color: #94a3b8; font-size: 0.76rem; cursor: pointer; text-decoration: underline; padding: 0.2rem 0.4rem;">
                회원 탈퇴 및 계정 삭제 ▾
              </button>
            </div>

            <!-- 기본 숨김: 토글 시에만 노출 -->
            <div id="withdraw-accordion-box" style="display: none; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 12px; padding: 1.25rem; margin-top: 0.85rem;">
              <div style="font-weight: 800; color: #f87171; font-size: 0.92rem; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.35rem;">
                <span class="material-symbols-outlined" style="font-size: 18px;">warning</span>
                회원 탈퇴 및 데이터 영구 삭제 안내
              </div>
              <p style="font-size: 0.78rem; color: #cbd5e1; line-height: 1.5; margin: 0 0 0.85rem 0;">
                회원 탈퇴 시 의뢰인님의 등록된 명리 프로필, 상품 구매 내역, 감정서 열람 기록 및 모든 개인정보가 즉시 영구 파기되며 복구할 수 없습니다.
              </p>

              <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: #fca5a5; cursor: pointer; margin-bottom: 1rem; user-select: none;">
                <input type="checkbox" id="chk-agree-withdraw" style="cursor: pointer;" />
                <span>안내 사항을 모두 확인하였으며 회원 탈퇴 및 계정 영구 삭제에 동의합니다.</span>
              </label>

              <div style="display: flex; justify-content: flex-end;">
                <button type="button" id="btn-confirm-delete-account" data-user-id="${rawUser.id || rawUser.username}" style="background: #ef4444; color: #fff; font-weight: 800; font-size: 0.82rem; padding: 0.55rem 1.25rem; border-radius: 8px; border: none; cursor: pointer;">
                  회원 탈퇴 확정
                </button>
              </div>
            </div>
          </div>

        </div>
      `;
  }
}
