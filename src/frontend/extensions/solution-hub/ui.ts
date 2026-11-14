import type { AppStateData } from '../../state/app-state.js';
import { checkHighMentalStress, recommendSolutions } from './orchestrator.js';
import { recordClick, recordImpression, savePartnerApplication } from './tracking.js';
import type { VerticalId } from './types.js';

/**
 * 솔루션 허브 UI:
 * - 결과 화면 하단 독립 솔루션 카드 섹션
 * - 정서 케어 긴급 안정 모달
 * - 파트너 솔루션 제휴 입점 신청 모달
 */

function esc(text: string): string {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderSolutionHub(_state: AppStateData): string {
  // 카드사 인증 심사 진행 중: NEXT STEP SOLUTION 및 제휴 솔루션 섹션 비노출
  void esc;
  void checkHighMentalStress;
  void recommendSolutions;
  void recordImpression;
  return '';
}

let bound = false;

/** 클릭 추적 및 모달 제어 이벤트 리스너 등록 */
export function bindSolutionHubEvents(): void {
  if (bound || typeof document === 'undefined') return;
  bound = true;

  document.addEventListener('click', e => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // 1. 솔루션 카드 클릭 추적
    const link = target.closest?.('.solution-card-link') as HTMLElement | null;
    if (link) {
      const solutionId = link.dataset.solutionId;
      const sessionId = link.dataset.sessionId;
      if (solutionId && sessionId) recordClick(sessionId, solutionId);
    }

    // 2. 정서 케어 모달 제어
    if (target.id === 'btn-open-mental-modal') {
      const m = document.getElementById('mental-care-modal');
      if (m) m.style.display = 'flex';
    }
    if (target.id === 'btn-close-mental-modal' || target.id === 'btn-confirm-mental-modal') {
      const m = document.getElementById('mental-care-modal');
      if (m) m.style.display = 'none';
    }

    // 3. 파트너 입점 모달 제어
    if (target.id === 'btn-open-partner-apply') {
      const m = document.getElementById('partner-apply-modal');
      if (m) m.style.display = 'flex';
    }
    if (target.id === 'btn-close-partner-apply' || target.id === 'btn-cancel-partner-apply') {
      const m = document.getElementById('partner-apply-modal');
      if (m) m.style.display = 'none';
    }
  });

  // 파트너 입점 신청 제출 리스너
  document.addEventListener('submit', e => {
    const target = e.target as HTMLElement | null;
    if (target && target.id === 'partner-apply-form') {
      e.preventDefault();
      const partnerName = (document.getElementById('apply-partner-name') as HTMLInputElement)?.value || '';
      const contactName = (document.getElementById('apply-contact-name') as HTMLInputElement)?.value || '';
      const phone = (document.getElementById('apply-phone') as HTMLInputElement)?.value || '';
      const email = (document.getElementById('apply-email') as HTMLInputElement)?.value || '';
      const verticalId = ((document.getElementById('apply-vertical') as HTMLSelectElement)?.value || 'finance') as VerticalId;
      const solutionTitle = (document.getElementById('apply-title') as HTMLInputElement)?.value || '';
      const description = (document.getElementById('apply-desc') as HTMLTextAreaElement)?.value || '';

      savePartnerApplication({
        partnerName,
        contactName,
        phone,
        email,
        verticalId,
        solutionTitle,
        description,
        targetUrl: '',
      });

      alert('입점 및 제휴 신청이 성공적으로 접수되었습니다. 관리자 검토 후 연락드리겠습니다.');
      const m = document.getElementById('partner-apply-modal');
      if (m) m.style.display = 'none';
      (target as HTMLFormElement).reset();
    }
  });
}
