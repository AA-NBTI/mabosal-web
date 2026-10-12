/**
 * 마보살 통합 파트너스 허브 (홍보 마케터 + 1:1 전문 상담사 겸업 포털)
 */

import { AuthService } from '../state/auth-service.js';
import { PartnerTracker, PartnerStats } from '../modules/partner-tracker.js';

export function renderPartnerPortalView(currentCode: string = 'vip_creator'): string {
 const currentUser = AuthService.getCurrentUser();
 const partnerCode = currentUser.partnerCode || currentCode;
 const partnerType = currentUser.partnerType || 'HYBRID';
 const stats: PartnerStats = PartnerTracker.getPartnerStats(partnerCode);
 const partnerUrl = PartnerTracker.generatePartnerUrl(partnerCode);

 // 통합 정산금 계산: 홍보 커미션 30% + 1:1 상담료 80%
 const affiliateCommission = stats.earnedCommission || 119700;
 const consultationEarnings = 320000; // 1:1 상담료 누적 (80%)
 const totalAvailablePayout = affiliateCommission + consultationEarnings;

 return `
 <div class="partner-portal-container" style="max-width: 1040px; margin: 0 auto; padding: 2rem 1.25rem 5rem;">
 <!-- 상단 히어로 배너 -->
 <div style="background: linear-gradient(135deg, rgba(242,202,80,0.15) 0%, rgba(15,19,29,0.98) 100%); border: 1px solid rgba(242,202,80,0.4); border-radius: 18px; padding: 2rem; margin-bottom: 2rem; position: relative;">
 <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
 <div>
 <div style="display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(242,202,80,0.2); color: var(--primary); padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.6rem;">
 <span></span> MABOSAL PARTNER HUB
 </div>
 <h1 style="font-family: var(--font-serif); font-size: 1.85rem; font-weight: 800; color: #dfe2f1; margin: 0 0 0.4rem 0;">
 ${currentUser.name || '도선도사'} 파트너스 센터
 </h1>
 <p style="color: var(--text-muted); font-size: 0.88rem; margin: 0; max-width: 600px; line-height: 1.5;">
 홍보 링크(30% 커미션)와 1:1 상담 예약(80% 상담료)을 하나의 통합 지갑으로 관리하고 정산받으세요.
 </p>
 </div>
 <div style="display: flex; gap: 0.5rem; align-items: center;">
 <span style="font-size: 0.75rem; background: rgba(242, 202, 80, 0.15); color: #f2ca50; border: 1px solid rgba(242, 202, 80, 0.3); padding: 0.35rem 0.75rem; border-radius: 8px; font-weight: 700;">
 유형: ${partnerType === 'HYBRID' ? '복합 하이브리드 (마케터+상담사)' : partnerType === 'AFFILIATE' ? '홍보 마케터' : '전문 역술가'}
 </span>
 <button type="button" class="btn-cta-secondary" id="btn-back-to-home" style="padding: 0.55rem 1.15rem; font-size: 0.82rem; border-radius: 8px;">
 ← 메인으로
 </button>
 </div>
 </div>
 </div>

 <!-- 상단 통합 정산 잔액 요약 바 -->
 <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.25rem 1.75rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
 <div>
 <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.25rem;">출금 가능 통합 잔액 (홍보 커미션 + 1:1 상담료)</div>
 <div style="font-family: var(--font-display); font-size: 2rem; font-weight: 800; color: var(--primary);">
 ₩ ${totalAvailablePayout.toLocaleString()}
 </div>
 </div>
 <button type="button" id="btn-quick-withdraw" class="btn-cta-primary" style="padding: 0.65rem 1.5rem; font-weight: 700; border-radius: 10px;">
 지금 바로 출금 신청
 </button>
 </div>

 <!-- 3대 기능 탭 네비게이션 -->
 <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.75rem; overflow-x: auto;">
 <button type="button" class="partner-tab-btn active" data-tab="ptab-affiliate" style="padding: 0.6rem 1.25rem; border-radius: 10px; background: var(--primary); color: #241a00; font-weight: 700; font-size: 0.88rem; border: none; cursor: pointer;">
 홍보 링크 &amp; 30% 수수료
 </button>
 <button type="button" class="partner-tab-btn" data-tab="ptab-consult" style="padding: 0.6rem 1.25rem; border-radius: 10px; background: var(--surface-container); color: #dfe2f1; font-weight: 600; font-size: 0.88rem; border: 1px solid rgba(255,255,255,0.06); cursor: pointer;">
 1:1 상담 예약 &amp; 사전 질문지
 </button>
 <button type="button" class="partner-tab-btn" data-tab="ptab-settlement" style="padding: 0.6rem 1.25rem; border-radius: 10px; background: var(--surface-container); color: #dfe2f1; font-weight: 600; font-size: 0.88rem; border: 1px solid rgba(255,255,255,0.06); cursor: pointer;">
 통합 정산 및 계좌 관리
 </button>
 </div>

 <!-- [탭 1] 홍보 링크 & 30% 수수료 (마케터) -->
 <div id="ptab-affiliate" class="partner-tab-panel" style="display: block;">
 <!-- 전용 링크 카드 -->
 <div style="background: var(--surface-container); border: 1px solid var(--border-subtle); border-radius: 14px; padding: 1.5rem; margin-bottom: 1.75rem;">
 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
 <div style="font-weight: 700; font-size: 1.05rem; color: var(--primary);">
 나의 전용 제휴 링크 (30일 유입 인정)
 </div>
 <span style="font-size: 0.78rem; color: #f2ca50; font-weight: 600;">
 방문 후 30일 이내 결제 시 무조건 30% 수수료 귀속
 </span>
 </div>
 <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
 <input type="text" id="input-partner-url" value="${partnerUrl}" readonly style="flex: 1; min-width: 260px; background: rgba(0, 0, 0, 0.4); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.75rem 1rem; color: #dfe2f1; font-size: 0.92rem; font-family: monospace;" />
 <button type="button" class="btn-cta-primary" id="btn-copy-partner-url" style="padding: 0.75rem 1.5rem; font-weight: 700;">
 링크 복사
 </button>
 </div>
 </div>

 <!-- 실시간 통계 3대 카드 -->
 <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
 <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.25rem;">
 <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.35rem;">누적 링크 클릭</div>
 <div style="font-family: var(--font-display); font-size: 1.75rem; font-weight: 800; color: #dfe2f1;">
 ${(stats.clicks || 142).toLocaleString()} 회
 </div>
 </div>
 <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.25rem;">
 <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.35rem;">유료 전환 결제 건수</div>
 <div style="font-family: var(--font-display); font-size: 1.75rem; font-weight: 800; color: #f2ca50;">
 ${stats.conversions || 12} 건
 </div>
 </div>
 <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.25rem;">
 <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.35rem;">발생 홍보 수수료 (30%)</div>
 <div style="font-family: var(--font-display); font-size: 1.75rem; font-weight: 800; color: var(--primary);">
 ₩ ${affiliateCommission.toLocaleString()}
 </div>
 </div>
 </div>
 </div>

 <!-- [탭 2] 1:1 상담 예약 & 사전 질문지 (상담사) -->
 <div id="ptab-consult" class="partner-tab-panel" style="display: none;">
 <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.5rem;">
 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
 <div>
 <h2 style="font-size: 1.15rem; font-weight: 700; color: #dfe2f1; margin: 0 0 0.25rem;">
 오늘 접수된 1:1 상담 의뢰인 사전 질문지 (3문 3답)
 </h2>
 <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">
 의뢰인이 상담 신청 시 미리 작성한 3대 핵심 고민과 사주 명식입니다.
 </p>
 </div>
 <span style="font-size: 0.78rem; color: #f2ca50; background: rgba(242, 202, 80, 0.12); padding: 0.2rem 0.6rem; border-radius: 9999px; font-weight: 700;">
 대기 중 2건
 </span>
 </div>

 <!-- 사전 질문지 카드 1 -->
 <div style="background: var(--surface-container-low); border: 1px solid rgba(242,202,80,0.3); border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem;">
 <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
 <div>
 <span style="font-size: 0.75rem; color: var(--primary); font-weight: 700; background: rgba(242,202,80,0.15); padding: 0.15rem 0.5rem; border-radius: 4px;">
 상담 예약: 오늘 21:00 (사시)
 </span>
 <h3 style="font-size: 1.05rem; font-weight: 700; color: #dfe2f1; margin: 0.35rem 0 0.15rem;">
 의뢰인: 홍길동 님 (32세, 癸酉년 庚申월 戊午일)
 </h3>
 <div style="font-size: 0.78rem; color: var(--text-muted);">
 상담 분야: <strong>이직 및 커리어 타이밍</strong> • 상담료: ₩ 50,000 (정산 수령액: ₩ 40,000)
 </div>
 </div>
 <button type="button" class="btn-start-consultation btn-cta-primary" style="padding: 0.45rem 1rem; font-size: 0.82rem; font-weight: 700; border-radius: 8px;">
 1:1 상담실 입장
 </button>
 </div>
 <!-- 3문 3답 본문 -->
 <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 0.85rem; font-size: 0.82rem; color: #dfe2f1; line-height: 1.6;">
 <div><strong>Q1. 현재 가장 풀리지 않는 답답함은 무엇인가요?</strong><br>
 → "현재 외국계 IT 기업에 4년째 재직 중인데, 11월에 헤드헌터 이직 제안을 받았습니다. 지금 움직여도 괜찮을까요?"</div>
 <div style="margin-top: 0.5rem;"><strong>Q2. 어떤 선택지 사이에서 갈등하고 계신가요?</strong><br>
 → "연봉은 20% 오르지만 조직 문화가 거칠다는 소문이 있어 내년 상반기까지 버틸지 고민입니다."</div>
 <div style="margin-top: 0.5rem;"><strong>Q3. 오늘 역술가님께 꼭 확인하고 싶은 결론은?</strong><br>
 → "제 사주 원국에서 2026 병오년 하반기가 이직에 길한 시기인지 명쾌하게 짚어주세요."</div>
 </div>
 </div>
 </div>
 </div>

 <!-- [탭 3] 통합 정산 & 출금 신청 (하나의 통장) -->
 <div id="ptab-settlement" class="partner-tab-panel" style="display: none;">
 <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.5rem;">
 <h2 style="font-size: 1.15rem; font-weight: 700; color: #dfe2f1; margin: 0 0 1rem;">
 통합 정산금 출금 신청서
 </h2>
 <div style="background: rgba(242,202,80,0.08); border: 1px solid rgba(242,202,80,0.25); border-radius: 10px; padding: 1rem; margin-bottom: 1.5rem;">
 <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
 <span style="color: var(--text-muted); font-size: 0.85rem;">• 홍보 링크 커미션 (30%):</span>
 <span style="color: #dfe2f1; font-weight: 700; font-size: 0.85rem;">₩ ${affiliateCommission.toLocaleString()}</span>
 </div>
 <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
 <span style="color: var(--text-muted); font-size: 0.85rem;">• 1:1 상담료 정산 (80%):</span>
 <span style="color: #dfe2f1; font-weight: 700; font-size: 0.85rem;">₩ ${consultationEarnings.toLocaleString()}</span>
 </div>
 <div style="height: 1px; background: rgba(242,202,80,0.3); margin: 0.5rem 0;"></div>
 <div style="display: flex; justify-content: space-between;">
 <span style="color: var(--primary); font-weight: 700; font-size: 0.95rem;">• 총 출금 가능 합산액:</span>
 <span style="color: var(--primary); font-weight: 800; font-size: 1.15rem; font-family: var(--font-display);">₩ ${totalAvailablePayout.toLocaleString()}</span>
 </div>
 </div>

 <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
 <div>
 <label style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">입금 은행</label>
 <select id="input-payout-bank" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 0.65rem; color: #dfe2f1; font-size: 0.88rem;">
 <option value="국민은행" selected>국민은행</option>
 <option value="신한은행">신한은행</option>
 <option value="우리은행">우리은행</option>
 <option value="카카오뱅크">카카오뱅크</option>
 <option value="토스뱅크">토스뱅크</option>
 </select>
 </div>
 <div>
 <label style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">계좌번호 (- 없이 입력)</label>
 <input type="text" id="input-payout-account" value="123456789012" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 0.65rem; color: #dfe2f1; font-size: 0.88rem;" />
 </div>
 <div>
 <label style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">예금주 성명</label>
 <input type="text" id="input-payout-holder" value="${currentUser.name || '김도원'}" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 0.65rem; color: #dfe2f1; font-size: 0.88rem;" />
 </div>
 </div>

 <button type="button" id="btn-submit-payout-request" class="btn-cta-primary" style="width: 100%; padding: 0.85rem; font-weight: 700; border-radius: 10px;">
 ₩ ${totalAvailablePayout.toLocaleString()} 전액 출금 신청 (관리자 승인 요청)
 </button>
 </div>
 </div>
 </div>
 `;
}
