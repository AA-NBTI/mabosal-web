import type { AppStateData } from '../state/app-state.js';
import { AuthService } from '../state/auth-service.js';

export interface SubscriptionOrder {
  orderId: string;
  planName: string;
  amount: number;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  paymentMethod: string;
  subscribedAt: string;
  nextBillingDate: string;
  status: 'active' | 'cancelled' | 'refund_pending' | 'refunded';
  cancelledAt?: string;
  refundRequestedAt?: string;
  refundReason?: string;
  refundedAt?: string;
  refundRejectReason?: string;
}

const STORAGE_KEY_SUBSCRIPTION_LEGACY = 'mabosal_user_subscription_v1';
const STORAGE_KEY_ALL_SUBSCRIPTIONS = 'mabosal_all_subscriptions_v1';

function getUserSubKey(userId?: string): string {
  if (!userId || userId === 'guest') return 'mabosal_sub_guest';
  return `mabosal_sub_user_${userId}`;
}

export function getAllSubscriptions(): SubscriptionOrder[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ALL_SUBSCRIPTIONS);
    let list: SubscriptionOrder[] = raw ? JSON.parse(raw) : [];

    // 현재 사용자 구독이 있으면 동기화
    const currentUser = AuthService.getCurrentUser();
    if (currentUser.role !== 'guest') {
      const current = getUserSubscription();
      if (current && !list.some(s => s.orderId === current.orderId)) {
        list.unshift(current);
        localStorage.setItem(STORAGE_KEY_ALL_SUBSCRIPTIONS, JSON.stringify(list));
      }
    }
    return list;
  } catch {
    return [];
  }
}

export function saveAllSubscriptions(list: SubscriptionOrder[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ALL_SUBSCRIPTIONS, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save all subscriptions:', e);
  }
}

export function getUserSubscription(): SubscriptionOrder | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const currentUser = AuthService.getCurrentUser();
    // 비로그인(게스트)은 절대 구독 없음
    if (!currentUser || currentUser.role === 'guest') {
      return null;
    }

    const userId = currentUser.id || currentUser.username;
    const userKey = getUserSubKey(userId);

    // 1. 유저 전용 스토리지 키 확인
    const userRaw = localStorage.getItem(userKey);
    if (userRaw) {
      try {
        const parsed = JSON.parse(userRaw) as SubscriptionOrder;
        if (parsed && parsed.orderId) {
          return parsed;
        }
      } catch {
        // continue
      }
    }

    // 2. 전체 구독 목록에서 현재 로그인 유저(이메일 또는 ID/성명)와 매칭되는 활성 구독 탐색
    const allSubs = getAllSubscriptions();
    const matched = allSubs.find(s => {
      if (currentUser.email && s.buyerEmail && s.buyerEmail.toLowerCase() === currentUser.email.toLowerCase()) {
        return true;
      }
      if (currentUser.name && s.buyerName && s.buyerName.trim() === currentUser.name.trim()) {
        return true;
      }
      return false;
    });

    if (matched) {
      localStorage.setItem(userKey, JSON.stringify(matched));
      return matched;
    }

    // 3. 최고 관리자(admin/master) 전용 자동 활성화
    if (currentUser.role === 'admin' || currentUser.username === 'master') {
      const now = new Date();
      const nextBilling = new Date();
      nextBilling.setMonth(nextBilling.getMonth() + 1);

      const adminSub: SubscriptionOrder = {
        orderId: 'SUB-ADMIN-MASTER',
        planName: '마보살 프라임 (최고관리자)',
        amount: 9900,
        buyerName: currentUser.name || '최고관리자 (Master)',
        buyerPhone: currentUser.phone || '010-0000-0000',
        buyerEmail: currentUser.email || 'master@mabosal.com',
        paymentMethod: 'card',
        subscribedAt: now.toISOString().split('T')[0],
        nextBillingDate: nextBilling.toISOString().split('T')[0],
        status: 'active',
      };
      saveUserSubscription(adminSub);
      return adminSub;
    }

    // 신규 일반 회원은 구독 내역이 없으므로 null 반환
    return null;
  } catch {
    return null;
  }
}

/**
 * 관리자가 특정 회원의 구독을 직접 수동 등록하거나 강제 활성화/승인
 */
export function adminRegisterOrApproveSubscription(subData: {
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  planName?: string;
  amount?: number;
  paymentMethod?: string;
  status?: 'active' | 'cancelled' | 'refund_pending' | 'refunded';
}): SubscriptionOrder {
  const now = new Date();
  const nextBilling = new Date();
  nextBilling.setMonth(nextBilling.getMonth() + 1);

  const orderId = 'SUB-MANUAL-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 5).toUpperCase();

  const newSub: SubscriptionOrder = {
    orderId,
    planName: subData.planName || '마보살 프라임 멤버십 (관리자 승인)',
    amount: subData.amount !== undefined ? subData.amount : 9900,
    buyerName: subData.buyerName.trim(),
    buyerPhone: subData.buyerPhone.trim(),
    buyerEmail: subData.buyerEmail.trim(),
    paymentMethod: subData.paymentMethod || 'card',
    subscribedAt: now.toISOString().split('T')[0],
    nextBillingDate: nextBilling.toISOString().split('T')[0],
    status: subData.status || 'active',
  };

  saveUserSubscription(newSub);
  return newSub;
}

export function saveUserSubscription(sub: SubscriptionOrder): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const currentUser = AuthService.getCurrentUser();
    const userId = currentUser.id || currentUser.username;
    if (userId && userId !== 'guest') {
      localStorage.setItem(getUserSubKey(userId), JSON.stringify(sub));
    }

    // 전체 리스트에도 업데이트/추가
    const list = getAllSubscriptions();
    const idx = list.findIndex(s => s.orderId === sub.orderId);
    if (idx >= 0) {
      list[idx] = sub;
    } else {
      list.unshift(sub);
    }
    saveAllSubscriptions(list);
  } catch (e) {
    console.error('Failed to save subscription:', e);
  }
}

export function cancelUserSubscription(): boolean {
  const current = getUserSubscription();
  if (!current || current.status !== 'active') return false;
  current.status = 'cancelled';
  current.cancelledAt = new Date().toISOString().split('T')[0];
  saveUserSubscription(current);
  return true;
}

export function reactivateUserSubscription(): boolean {
  const current = getUserSubscription();
  if (!current) return false;
  current.status = 'active';
  delete current.cancelledAt;
  delete current.refundedAt;
  delete current.refundRequestedAt;
  delete current.refundReason;
  delete current.refundRejectReason;
  const nextBilling = new Date();
  nextBilling.setMonth(nextBilling.getMonth() + 1);
  current.nextBillingDate = nextBilling.toISOString().split('T')[0];
  saveUserSubscription(current);
  return true;
}

/**
 * 이용자의 7일 이내 환불 신청 (절차 접수 안내)
 */
export function requestUserSubscriptionRefund(reason = '단순 변심'): { success: boolean; message: string } {
  const current = getUserSubscription();
  if (!current) {
    return { success: false, message: '구독 정보 없음' };
  }
  if (current.status === 'refund_pending') {
    return { success: false, message: '환불 심사 진행 중' };
  }
  if (current.status === 'refunded') {
    return { success: false, message: '환불 처리 완료 건' };
  }
  if (!isEligibleFor7DayRefund(current)) {
    return { success: false, message: '청약철회 기간 경과' };
  }

  current.status = 'refund_pending';
  current.refundRequestedAt = new Date().toISOString().split('T')[0];
  current.refundReason = reason;
  saveUserSubscription(current);

  return {
    success: true,
    message: `[접수 완료] 환불 심사가 접수되었습니다.\n담당자 검토 및 승인 절차 후 결과가 안내됩니다.`,
  };
}

/**
 * 최고 관리자의 환불 승인 처리
 */
export function approveAdminSubscriptionRefund(orderId: string): { success: boolean; message: string } {
  const list = getAllSubscriptions();
  const target = list.find(s => s.orderId === orderId);
  if (!target) {
    return { success: false, message: '주문 정보 없음' };
  }

  target.status = 'refunded';
  target.refundedAt = new Date().toISOString().split('T')[0];
  saveAllSubscriptions(list);

  const cur = getUserSubscription();
  if (cur && cur.orderId === orderId) {
    cur.status = 'refunded';
    cur.refundedAt = target.refundedAt;
    saveUserSubscription(cur);
  }

  return {
    success: true,
    message: `[승인 완료] 주문번호 ${orderId} 환불 승인 처리되었습니다.`,
  };
}

/**
 * 최고 관리자의 환불 반려 처리
 */
export function rejectAdminSubscriptionRefund(orderId: string, rejectReason = '디지털 콘텐츠 열람'): { success: boolean; message: string } {
  const list = getAllSubscriptions();
  const target = list.find(s => s.orderId === orderId);
  if (!target) {
    return { success: false, message: '주문 정보 없음' };
  }

  target.status = 'active';
  target.refundRejectReason = rejectReason;
  saveAllSubscriptions(list);

  const cur = getUserSubscription();
  if (cur && cur.orderId === orderId) {
    cur.status = 'active';
    cur.refundRejectReason = rejectReason;
    saveUserSubscription(cur);
  }

  return {
    success: true,
    message: `[반려 완료] 주문번호 ${orderId} 환불 심사가 반려되었습니다.`,
  };
}

export function isEligibleFor7DayRefund(sub: SubscriptionOrder | null): boolean {
  if (!sub || sub.status === 'refunded') return false;
  try {
    const subTime = new Date(sub.subscribedAt).getTime();
    const nowTime = new Date().getTime();
    const diffDays = (nowTime - subTime) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  } catch {
    return false;
  }
}

/**
 * 1. 구독 메인 안내 페이지 뷰
 */
export function renderSubscriptionView(state: AppStateData): string {
  const currentUser = AuthService.getCurrentUser();
  const activeSub = getUserSubscription();
  const isSubscribed = activeSub && activeSub.status === 'active';

  return `
    <div class="subscription-page-container" style="max-width: 1040px; margin: 0 auto; padding: 2rem 1.25rem 5rem; width: 100%; box-sizing: border-box;">
      
      <!-- 1. 상단 히어로 (가격 + 구독신청) -->
      <div style="background: linear-gradient(135deg, rgba(242, 202, 80, 0.16) 0%, rgba(15, 19, 29, 0.98) 100%); border: 1.5px solid rgba(242, 202, 80, 0.4); border-radius: 20px; padding: 2.75rem 1.75rem; text-align: center; margin-bottom: 2.5rem; box-shadow: 0 10px 40px rgba(0,0,0,0.4); position: relative; overflow: hidden;">
        <div style="display: inline-flex; align-items: center; gap: 0.45rem; background: rgba(242, 202, 80, 0.2); color: var(--primary); padding: 0.35rem 0.95rem; border-radius: 9999px; font-size: 0.78rem; font-weight: 800; border: 1px solid rgba(242, 202, 80, 0.4); margin-bottom: 1rem; letter-spacing: 0.05em;">
          <span class="material-symbols-outlined" style="font-size: 16px;">workspace_premium</span>
          <span>멤버십</span>
        </div>
        <h1 style="font-family: var(--font-serif); font-size: 2.2rem; font-weight: 900; color: #ffffff; margin: 0 0 0.75rem; letter-spacing: -0.02em;">
          마보살 정기구독
        </h1>
        <p style="font-size: 0.96rem; color: #cbd5e1; max-width: 620px; margin: 0 auto 1.75rem; line-height: 1.65; word-break: keep-all;">
          사주 리포트, 도서관, VOD 강의, 전 품목 상시 할인 혜택
        </p>

        <!-- 가격 및 신청 버튼 -->
        <div style="display: inline-flex; align-items: center; justify-content: center; gap: 1rem; flex-wrap: wrap;">
          <div style="display: inline-flex; align-items: baseline; gap: 0.5rem; background: rgba(0, 0, 0, 0.5); border: 1px solid rgba(242, 202, 80, 0.5); padding: 0.75rem 1.5rem; border-radius: 12px; box-shadow: 0 4px 18px rgba(242, 202, 80, 0.15);">
            <span style="font-size: 0.88rem; color: #94a3b8; text-decoration: line-through;">₩ 19,900</span>
            <span style="font-size: 1.85rem; font-weight: 900; color: var(--primary); font-family: var(--font-display);">₩ 9,900</span>
            <span style="font-size: 0.85rem; color: #f8fafc; font-weight: 700;">/ 월</span>
          </div>

          ${isSubscribed ? `
            <a href="/member-dashboard?tab=subscription" data-nav="/member-dashboard?tab=subscription" class="btn-cta-primary" style="display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.85rem 1.75rem; font-size: 1rem; font-weight: 800; border-radius: 12px; background: #22c55e; color: #ffffff; text-decoration: none; box-shadow: 0 4px 18px rgba(34, 197, 94, 0.4);">
              <span class="material-symbols-outlined" style="font-size: 20px;">check_circle</span>
              <span>구독 관리</span>
            </a>
          ` : `
            <button type="button" id="btn-open-subscription-checkout" style="display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.85rem 2rem; font-size: 1.05rem; font-weight: 900; border-radius: 12px; background: var(--primary); color: #1c1500; border: none; cursor: pointer; box-shadow: 0 4px 22px rgba(242, 202, 80, 0.45); transition: transform 0.15s ease;">
              <span class="material-symbols-outlined" style="font-size: 21px;">lock</span>
              <span>구독 신청</span>
            </button>
          `}
        </div>

      </div>

      <!-- 2. 핵심 서비스 그리드 -->
      <div style="margin-bottom: 3rem;">
        <h2 style="font-size: 1.35rem; font-weight: 800; color: #ffffff; margin: 0 0 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
          <span class="material-symbols-outlined" style="color: var(--primary); font-size: 24px;">verified</span>
          구독 혜택
        </h2>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1rem;">
          
          <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(242, 202, 80, 0.15); border: 1px solid var(--primary); display: flex; align-items: center; justify-content: center; color: var(--primary);">
              <span class="material-symbols-outlined" style="font-size: 24px;">auto_awesome</span>
            </div>
            <h3 style="font-size: 1.05rem; font-weight: 800; color: #fff; margin: 0;">사주 리포트</h3>
            <p style="font-size: 0.84rem; color: #94a3b8; margin: 0; line-height: 1.6;">
              사주 분석서 및 실시간 운세 무제한 열람
            </p>
          </div>

          <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(56, 189, 248, 0.15); border: 1px solid #38bdf8; display: flex; align-items: center; justify-content: center; color: #38bdf8;">
              <span class="material-symbols-outlined" style="font-size: 24px;">menu_book</span>
            </div>
            <h3 style="font-size: 1.05rem; font-weight: 800; color: #fff; margin: 0;">도서관 열람</h3>
            <p style="font-size: 0.84rem; color: #94a3b8; margin: 0; line-height: 1.6;">
              정통 명리학 원론 및 도서 무제한 열람
            </p>
          </div>

          <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(168, 85, 247, 0.15); border: 1px solid #a855f7; display: flex; align-items: center; justify-content: center; color: #c084fc;">
              <span class="material-symbols-outlined" style="font-size: 24px;">smart_display</span>
            </div>
            <h3 style="font-size: 1.05rem; font-weight: 800; color: #fff; margin: 0;">VOD 강의</h3>
            <p style="font-size: 0.84rem; color: #94a3b8; margin: 0; line-height: 1.6;">
              온라인 마스터 클래스 및 특강 영상 스트리밍
            </p>
          </div>

          <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(34, 197, 94, 0.15); border: 1px solid #22c55e; display: flex; align-items: center; justify-content: center; color: #4ade80;">
              <span class="material-symbols-outlined" style="font-size: 24px;">percent</span>
            </div>
            <h3 style="font-size: 1.05rem; font-weight: 800; color: #fff; margin: 0;">상시 20% 할인</h3>
            <p style="font-size: 0.84rem; color: #94a3b8; margin: 0; line-height: 1.6;">
              스토어 전 품목 추가 할인 상시 적용
            </p>
          </div>

        </div>
      </div>

      <!-- 3. 규정 안내 (전자상거래법 기준) -->
      <div style="background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 1.5rem; font-size: 0.84rem; color: #cbd5e1; line-height: 1.75;">
        <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--primary); margin: 0 0 0.85rem; display: flex; align-items: center; gap: 0.35rem;">
          <span class="material-symbols-outlined" style="font-size: 18px;">gavel</span>
          결제 및 취소/환불 규정
        </h4>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <div>• <strong>결제 주기</strong>: 매월 정기 자동결제 (월 ₩ 9,900, VAT 포함)</div>
          <div>• <strong>해지 절차</strong>: 마이페이지 [구독 관리]에서 즉시 신청 가능, 당월 잔여 기간 이용 유지</div>
          <div>• <strong>청약철회</strong>: 결제 후 7일 이내 콘텐츠 미이용 시 환불 심사 신청 가능</div>
          <div>• <strong>환불 제한</strong>: 디지털 콘텐츠(리포트/도서/VOD) 열람 시 관련 법령에 따라 당월 환불 불가</div>
        </div>
      </div>

      <!-- 결제 모달 슬롯 -->
      <div id="subscription-checkout-modal-slot"></div>

    </div>
  `;
}

/**
 * 2. 기존 마보살 결제창 규격에 맞춘 [구독 결제 팝업 모달]
 */
export function renderSubscriptionCheckoutModal(): string {
  const user = AuthService.getCurrentUser();
  const userName = user.role !== 'guest' ? user.name : '';
  const userPhone = user.role !== 'guest' ? (user.phone || '') : '';
  const userEmail = user.role !== 'guest' ? (user.email || '') : '';

  return `
    <div id="modal-subscription-checkout" style="position: fixed; inset: 0; background: rgba(0, 0, 0, 0.82); backdrop-filter: blur(6px); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 1rem; box-sizing: border-box; animation: fadeIn 0.2s ease;">
      <div style="background: var(--surface-container, #141722); border: 1.5px solid var(--primary, #f2ca50); border-radius: 20px; max-width: 480px; width: 100%; padding: 1.75rem 1.5rem; box-shadow: 0 16px 50px rgba(0, 0, 0, 0.8); color: #dfe2f1; position: relative; max-height: 90vh; overflow-y: auto;">
        
        <!-- 닫기 버튼 -->
        <button type="button" class="btn-close-sub-modal" style="position: absolute; top: 1.25rem; right: 1.25rem; background: none; border: none; color: #94a3b8; font-size: 24px; cursor: pointer; line-height: 1;">×</button>

        <!-- 상단 타이틀 -->
        <div style="text-align: center; margin-bottom: 1.25rem;">
          <h3 style="font-family: var(--font-serif); font-size: 1.3rem; font-weight: 900; color: #ffffff; margin: 0;">
            정기구독 신청
          </h3>
        </div>

        <!-- 주문 정보 요약 카드 -->
        <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem 1.15rem; margin-bottom: 1.25rem; font-size: 0.84rem; line-height: 1.6;">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
            <span style="color: #94a3b8;">서비스:</span>
            <strong style="color: #fff;">마보살 멤버십</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
            <span style="color: #94a3b8;">결제 방식:</span>
            <span style="color: #dfe2f1;">매월 정기결제</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span style="color: #94a3b8;">결제 금액:</span>
            <span style="font-size: 1.35rem; font-weight: 900; color: var(--primary); font-family: var(--font-display);">₩ 9,900</span>
          </div>
        </div>

        <!-- 주문자 정보 입력 폼 -->
        <form id="form-subscription-modal-checkout" style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label style="display: block; font-size: 0.78rem; color: #94a3b8; font-weight: 700; margin-bottom: 0.35rem;">성명 *</label>
            <input type="text" id="modal-sub-name" required value="${userName}" placeholder="홍길동" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.6rem; border-radius: 8px; font-size: 0.88rem;" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem;">
            <div>
              <label style="display: block; font-size: 0.78rem; color: #94a3b8; font-weight: 700; margin-bottom: 0.35rem;">연락처 *</label>
              <input type="tel" id="modal-sub-phone" required value="${userPhone}" placeholder="010-1234-5678" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.6rem; border-radius: 8px; font-size: 0.88rem;" />
            </div>
            <div>
              <label style="display: block; font-size: 0.78rem; color: #94a3b8; font-weight: 700; margin-bottom: 0.35rem;">이메일 *</label>
              <input type="email" id="modal-sub-email" required value="${userEmail}" placeholder="user@email.com" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.6rem; border-radius: 8px; font-size: 0.88rem;" />
            </div>
          </div>

          <!-- 결제 수단 선택 -->
          <div>
            <label style="display: block; font-size: 0.78rem; color: #94a3b8; font-weight: 700; margin-bottom: 0.4rem;">결제 수단 *</label>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
              <label style="display: flex; align-items: center; justify-content: center; gap: 0.35rem; background: rgba(255,255,255,0.05); border: 1.5px solid var(--primary); border-radius: 8px; padding: 0.6rem 0.2rem; cursor: pointer; color: #fff; font-size: 0.8rem; font-weight: 700; text-align: center;">
                <input type="radio" name="modal-sub-pay-method" value="card" checked style="display: none;" />
                <span>카드</span>
              </label>
              <label style="display: flex; align-items: center; justify-content: center; gap: 0.35rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 0.6rem 0.2rem; cursor: pointer; color: #cbd5e1; font-size: 0.8rem; font-weight: 700; text-align: center;">
                <input type="radio" name="modal-sub-pay-method" value="kakaopay" style="display: none;" />
                <span>카카오페이</span>
              </label>
              <label style="display: flex; align-items: center; justify-content: center; gap: 0.35rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 0.6rem 0.2rem; cursor: pointer; color: #cbd5e1; font-size: 0.8rem; font-weight: 700; text-align: center;">
                <input type="radio" name="modal-sub-pay-method" value="naverpay" style="display: none;" />
                <span>네이버페이</span>
              </label>
            </div>
          </div>

          <!-- 동의 체크박스 -->
          <div style="background: rgba(0,0,0,0.25); border-radius: 8px; padding: 0.75rem; font-size: 0.78rem; color: #94a3b8; display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="display: flex; align-items: flex-start; gap: 0.45rem; cursor: pointer;">
              <input type="checkbox" id="modal-sub-check-auto" required checked style="margin-top: 2px; accent-color: var(--primary);" />
              <span>[필수] 매월 ₩ 9,900 정기결제 및 자동 갱신 동의</span>
            </label>
            <label style="display: flex; align-items: flex-start; gap: 0.45rem; cursor: pointer;">
              <input type="checkbox" id="modal-sub-check-refund" required checked style="margin-top: 2px; accent-color: var(--primary);" />
              <span>[필수] 이용 약관 및 환불 규정 동의</span>
            </label>
          </div>

          <!-- 결제 버튼 -->
          <button type="submit" style="width: 100%; background: var(--primary); color: #1c1500; font-size: 1.05rem; font-weight: 900; border: none; border-radius: 12px; padding: 1rem; cursor: pointer; box-shadow: 0 4px 18px rgba(242, 202, 80, 0.4); display: flex; align-items: center; justify-content: center; gap: 0.45rem; transition: transform 0.15s ease;">
            <span class="material-symbols-outlined" style="font-size: 20px;">lock</span>
            <span>₩ 9,900 결제</span>
          </button>
        </form>

      </div>
    </div>
  `;
}

/**
 * 3. 최고 관리자 대시보드용 [구독 및 환불 심사 관리 패널]
 */
export function renderAdminSubscriptionsPanel(): string {
  const subscriptions = getAllSubscriptions();
  const totalCount = subscriptions.length;
  const activeCount = subscriptions.filter(s => s.status === 'active').length;
  const pendingRefunds = subscriptions.filter(s => s.status === 'refund_pending');
  const refundedCount = subscriptions.filter(s => s.status === 'refunded').length;

  return `
    <div class="admin-subscriptions-panel" style="display: flex; flex-direction: column; gap: 1.5rem;">
      
      <!-- 상단 헤더 & 액션 버튼 -->
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1rem;">
        <div>
          <h2 style="font-size: 1.35rem; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            <span class="material-symbols-outlined" style="color: var(--primary);">card_membership</span>
            정기구독 관리
          </h2>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button type="button" id="btn-admin-auto-subscribe-master" style="background: rgba(242, 202, 80, 0.15); border: 1px solid var(--primary); color: var(--primary); font-size: 0.82rem; font-weight: 800; border-radius: 8px; padding: 0.6rem 1rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem;">
            <span class="material-symbols-outlined" style="font-size: 18px;">admin_panel_settings</span>
            <span>관리자 구독 활성화</span>
          </button>
          <button type="button" id="btn-open-admin-add-sub-modal" style="background: var(--primary); color: #1c1500; font-size: 0.82rem; font-weight: 900; border: none; border-radius: 8px; padding: 0.6rem 1.15rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem; box-shadow: 0 4px 12px rgba(242, 202, 80, 0.3);">
            <span class="material-symbols-outlined" style="font-size: 18px;">add_circle</span>
            <span>신규 구독 등록</span>
          </button>
        </div>
      </div>

      <!-- 상단 통계 카드 4종 -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
        <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.25rem;">
          <div style="font-size: 0.78rem; color: #94a3b8; margin-bottom: 0.35rem;">누적 구독</div>
          <div style="font-size: 1.6rem; font-weight: 900; color: #fff; font-family: var(--font-display);">${totalCount}건</div>
        </div>

        <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 12px; padding: 1.25rem;">
          <div style="font-size: 0.78rem; color: #94a3b8; margin-bottom: 0.35rem;">이용 중</div>
          <div style="font-size: 1.6rem; font-weight: 900; color: var(--primary); font-family: var(--font-display);">${activeCount}건</div>
        </div>

        <div style="background: ${pendingRefunds.length > 0 ? 'rgba(234, 179, 8, 0.1)' : 'rgba(14, 18, 28, 0.85)'}; border: 1px solid ${pendingRefunds.length > 0 ? 'var(--primary)' : 'rgba(255,255,255,0.08)'}; border-radius: 12px; padding: 1.25rem;">
          <div style="font-size: 0.78rem; color: ${pendingRefunds.length > 0 ? 'var(--primary)' : '#94a3b8'}; margin-bottom: 0.35rem; font-weight: 700;">심사 대기</div>
          <div style="font-size: 1.6rem; font-weight: 900; color: ${pendingRefunds.length > 0 ? 'var(--primary)' : '#fff'}; font-family: var(--font-display);">${pendingRefunds.length}건</div>
        </div>

        <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.25rem;">
          <div style="font-size: 0.78rem; color: #94a3b8; margin-bottom: 0.35rem;">환불 완료</div>
          <div style="font-size: 1.6rem; font-weight: 900; color: #cbd5e1; font-family: var(--font-display);">${refundedCount}건</div>
        </div>
      </div>

      <!-- 관리자 수동 구독 등록/승인 모달 슬롯 -->
      <div id="admin-sub-modal-slot"></div>

      <!-- 1. [환불 심사 요청 대기 목록] (신청 건이 있는 경우 우선 표기) -->
      ${pendingRefunds.length > 0 ? `
        <div style="background: rgba(242, 202, 80, 0.05); border: 1.5px solid var(--primary); border-radius: 14px; padding: 1.35rem;">
          <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--primary); margin: 0 0 1rem; display: flex; align-items: center; gap: 0.4rem;">
            <span class="material-symbols-outlined" style="font-size: 20px;">hourglass_top</span>
            환불 심사 요청 (${pendingRefunds.length}건)
          </h3>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.84rem; text-align: left;">
              <thead>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">
                  <th style="padding: 0.65rem 0.5rem;">신청일시</th>
                  <th style="padding: 0.65rem 0.5rem;">주문번호</th>
                  <th style="padding: 0.65rem 0.5rem;">신청회원</th>
                  <th style="padding: 0.65rem 0.5rem;">신청사유</th>
                  <th style="padding: 0.65rem 0.5rem; text-align: right;">심사</th>
                </tr>
              </thead>
              <tbody>
                ${pendingRefunds.map(sub => `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <td style="padding: 0.75rem 0.5rem; color: #cbd5e1;">${sub.refundRequestedAt || sub.subscribedAt}</td>
                    <td style="padding: 0.75rem 0.5rem; font-family: var(--font-display); color: #fff;">${sub.orderId}</td>
                    <td style="padding: 0.75rem 0.5rem; color: #fff;">${sub.buyerName} <span style="font-size: 0.75rem; color: #94a3b8;">(${sub.buyerPhone})</span></td>
                    <td style="padding: 0.75rem 0.5rem; color: var(--primary); font-weight: 600;">${sub.refundReason || '환불 심사 요청'}</td>
                    <td style="padding: 0.75rem 0.5rem; text-align: right;">
                      <div style="display: inline-flex; gap: 0.4rem;">
                        <button type="button" class="btn-approve-sub-refund" data-order-id="${sub.orderId}" style="background: var(--primary); color: #1c1500; font-size: 0.78rem; font-weight: 800; border: none; padding: 0.4rem 0.75rem; border-radius: 6px; cursor: pointer;">
                          환불 승인
                        </button>
                        <button type="button" class="btn-reject-sub-refund" data-order-id="${sub.orderId}" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #cbd5e1; font-size: 0.78rem; padding: 0.4rem 0.75rem; border-radius: 6px; cursor: pointer;">
                          반려
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <!-- 2. 전체 정기구독 장부 테이블 -->
      <div style="background: rgba(14, 18, 28, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.35rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
          <h3 style="font-size: 1.05rem; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 0.4rem;">
            <span class="material-symbols-outlined" style="font-size: 20px; color: var(--primary);">receipt_long</span>
            정기구독 목록
          </h3>
        </div>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.84rem; text-align: left;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">
                <th style="padding: 0.65rem 0.5rem;">주문번호</th>
                <th style="padding: 0.65rem 0.5rem;">회원명</th>
                <th style="padding: 0.65rem 0.5rem;">연락처</th>
                <th style="padding: 0.65rem 0.5rem;">결제금액</th>
                <th style="padding: 0.65rem 0.5rem;">결제일</th>
                <th style="padding: 0.65rem 0.5rem;">갱신예정일</th>
                <th style="padding: 0.65rem 0.5rem;">상태</th>
                <th style="padding: 0.65rem 0.5rem; text-align: right;">관리</th>
              </tr>
            </thead>
            <tbody>
              ${subscriptions.length === 0 ? `
                <tr><td colspan="8" style="padding: 2rem; text-align: center; color: #94a3b8;">내역 없음</td></tr>
              ` : subscriptions.map(sub => {
                let badge = '<span style="background: rgba(242, 202, 80, 0.12); border: 1px solid var(--primary); color: var(--primary); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">이용 중</span>';
                if (sub.status === 'cancelled') {
                  badge = '<span style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #cbd5e1; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">해지 예약</span>';
                } else if (sub.status === 'refund_pending') {
                  badge = '<span style="background: rgba(234, 179, 8, 0.15); border: 1px solid #eab308; color: #fde047; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">심사 중</span>';
                } else if (sub.status === 'refunded') {
                  badge = '<span style="background: rgba(148, 163, 184, 0.1); border: 1px solid #64748b; color: #94a3b8; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">환불 완료</span>';
                }

                return `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 0.75rem 0.5rem; font-family: var(--font-display); color: #fff;">${sub.orderId}</td>
                    <td style="padding: 0.75rem 0.5rem; font-weight: 700; color: #fff;">${sub.buyerName}</td>
                    <td style="padding: 0.75rem 0.5rem; color: #cbd5e1;">${sub.buyerPhone}<br/><span style="font-size: 0.74rem; color: #94a3b8;">${sub.buyerEmail}</span></td>
                    <td style="padding: 0.75rem 0.5rem; font-weight: 800; color: var(--primary);">₩ ${sub.amount.toLocaleString()}</td>
                    <td style="padding: 0.75rem 0.5rem; color: #cbd5e1;">${sub.subscribedAt}</td>
                    <td style="padding: 0.75rem 0.5rem; color: #cbd5e1;">${sub.status === 'active' ? sub.nextBillingDate : '-'}</td>
                    <td style="padding: 0.75rem 0.5rem;">${badge}</td>
                    <td style="padding: 0.75rem 0.5rem; text-align: right;">
                      <div style="display: inline-flex; gap: 0.35rem;">
                        ${sub.status !== 'active' ? `
                          <button type="button" class="btn-admin-force-active-sub" data-order-id="${sub.orderId}" style="background: rgba(242, 202, 80, 0.15); border: 1px solid var(--primary); color: var(--primary); font-size: 0.74rem; font-weight: 800; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer;">
                            활성화
                          </button>
                        ` : `
                          <button type="button" class="btn-admin-force-cancel-sub" data-order-id="${sub.orderId}" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-size: 0.74rem; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer;">
                            해지
                          </button>
                        `}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}
