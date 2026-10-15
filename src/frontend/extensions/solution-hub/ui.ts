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

export function renderSolutionHub(state: AppStateData): string {
  const session = state.sessionState;
  if (!session) return '';

  const recs = recommendSolutions(session);
  const stressCheck = checkHighMentalStress(session);

  // 추천할 솔루션도 없고, 스트레스 배너도 띄울 것이 없다면 숨김
  if (recs.length === 0 && !stressCheck.isHigh) return '';

  const hasMind = recs.some(r => r.vertical.id === 'mind') || stressCheck.isHigh;

  const cardsHtml = recs.length > 0 ? recs
    .map(r => {
      recordImpression(session.sessionId, r.solution.id);

      const action = r.solution.url
        ? `<a class="solution-card-link" data-solution-id="${esc(r.solution.id)}" data-session-id="${esc(session.sessionId)}" href="${esc(r.solution.url)}" target="_blank" rel="noopener noreferrer sponsored" style="display: inline-block; padding: 0.45rem 0.85rem; font-size: 0.8rem; font-weight: 700; border-radius: 8px; background: var(--primary); color: #241a00; text-decoration: none; transition: transform 0.15s ease;">자세히 보기</a>`
        : `<span style="display: inline-block; padding: 0.45rem 0.85rem; font-size: 0.8rem; font-weight: 700; border-radius: 8px; background: rgba(255,255,255,0.06); color: var(--text-muted);">준비 중</span>`;

      return `
        <div class="solution-card" data-vertical="${esc(r.vertical.id)}" style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 12px; padding: 1.15rem 1.25rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; box-shadow: var(--shadow-sm);">
          <div style="display: flex; align-items: center; gap: 0.85rem; flex: 1; min-width: 0;">
            <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.4); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <span class="material-symbols-outlined" style="font-size: 20px; color: var(--primary);">${esc(r.vertical.icon)}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap;">
                <span style="background: rgba(242, 202, 80, 0.12); color: var(--primary); font-size: 0.68rem; padding: 0.12rem 0.45rem; border-radius: 4px; font-weight: 700;">${esc(r.vertical.label)}</span>
                <h3 style="font-size: 1.05rem; font-weight: 700; color: #ffffff; margin: 0;">${esc(r.solution.title)}</h3>
              </div>
              <p style="font-size: 0.84rem; color: #a1a1aa; margin: 0; line-height: 1.4;">${esc(r.solution.oneLine)}</p>
              <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">${esc(r.reason)}</p>
            </div>
          </div>
          <div style="text-align: right; min-width: 90px; flex-shrink: 0;">
            ${r.solution.priceText ? `<div style="font-family: var(--font-display); font-size: 1.05rem; font-weight: 800; color: var(--primary); margin-bottom: 0.35rem;">${esc(r.solution.priceText)}</div>` : ''}
            ${action}
          </div>
        </div>`;
    })
    .join('') : '';

  // 정서 고위험 배너 (칠살/갈등마 등 압박 시)
  const stressBannerHtml = stressCheck.isHigh ? `
    <div style="background: linear-gradient(135deg, rgba(242, 202, 80, 0.15), rgba(255, 180, 171, 0.15)); border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 12px; padding: 0.9rem 1.15rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; gap: 0.75rem;">
      <div style="display: flex; align-items: center; gap: 0.65rem;">
        <span class="material-symbols-outlined" style="color: var(--primary); font-size: 22px;">spa</span>
        <div>
          <strong style="font-size: 0.88rem; color: #fff;">${esc(stressCheck.sourceName)} 기운으로 인한 심리적 긴장 완화 가이드</strong>
          <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 0.15rem 0 0 0;">불안하거나 마음이 무거울 때 즉시 시도할 수 있는 마음 호흡법을 준비했습니다.</p>
        </div>
      </div>
      <button id="btn-open-mental-modal" type="button" style="background: rgba(242, 202, 80, 0.2); border: 1px solid var(--primary); color: var(--primary); font-size: 0.78rem; font-weight: 700; padding: 0.4rem 0.75rem; border-radius: 8px; cursor: pointer; white-space: nowrap;">
        마음 안정 가이드 보기
      </button>
    </div>
  ` : '';

  return `
    <section id="solution-hub" class="solution-hub" style="width: 100%; max-width: 900px; margin: 2rem auto 0; padding: 0 1.25rem; box-sizing: border-box; text-align: left;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <span style="font-size: 0.72rem; color: var(--primary); font-weight: 700; letter-spacing: 0.05em;">NEXT STEP SOLUTION</span>
          <h2 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0.15rem 0 0 0;">진단 결과와 이어지는 실전 솔루션</h2>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <button id="btn-open-partner-apply" type="button" style="background: none; border: 1px dashed rgba(242, 202, 80, 0.4); color: var(--primary); font-size: 0.72rem; padding: 0.25rem 0.55rem; border-radius: 6px; cursor: pointer;">
            + 제휴 및 입점 신청
          </button>
          <span style="font-size: 0.75rem; color: var(--text-muted);">제휴 고지</span>
        </div>
      </div>

      ${stressBannerHtml}
      ${cardsHtml ? `<div style="display: flex; flex-direction: column; gap: 0.85rem;">${cardsHtml}</div>` : ''}

      <p style="font-size: 0.74rem; color: var(--text-muted); margin: 0.75rem 0 0 0; line-height: 1.5;">
        위 항목은 제휴 및 맞춤 솔루션이며 이용 시 마보살에 수수료가 발생할 수 있습니다.${hasMind ? ' 마음 돌봄 프로그램은 의료 상담을 대체하지 않으며, 일상에 심각한 어려움이 있을 때는 전문 상담 기관의 도움을 권장합니다.' : ''}
      </p>

      <!-- 정서 케어 힐링 모달 -->
      <div id="mental-care-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(4px); z-index: 9999; align-items: center; justify-content: center; padding: 1rem;">
        <div style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 16px; max-width: 480px; width: 100%; padding: 1.5rem; box-shadow: 0 12px 36px rgba(0,0,0,0.6); position: relative;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="material-symbols-outlined" style="color: var(--primary);">spa</span>
              <h3 style="font-size: 1.15rem; font-weight: 700; color: #fff; margin: 0;">마음 안정 10분 호흡 가이드</h3>
            </div>
            <button id="btn-close-mental-modal" type="button" style="background: none; border: none; color: var(--text-muted); font-size: 1.5rem; cursor: pointer;">&times;</button>
          </div>
          <p style="font-size: 0.85rem; color: #d1d5db; line-height: 1.6; margin-bottom: 1.25rem;">
            현재 강한 기운과 심리적 압박감이 나타나고 있습니다. 모든 결정과 고민을 잠시 멈추고 3번의 깊은 복식호흡을 진행해 보세요.
          </p>
          <div style="background: rgba(242, 202, 80, 0.08); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 10px; padding: 1rem; margin-bottom: 1.25rem;">
            <h4 style="font-size: 0.88rem; font-weight: 700; color: var(--primary); margin: 0 0 0.5rem 0;">4-7-8 이완 호흡법</h4>
            <ol style="margin: 0; padding-left: 1.2rem; font-size: 0.82rem; color: #d1d5db; line-height: 1.6;">
              <li>4초 동안 코로 천천히 숨을 들이마십니다.</li>
              <li>7초 동안 숨을 편안히 멈춥니다.</li>
              <li>8초 동안 입으로 천천히 길게 숨을 내쉽니다.</li>
            </ol>
          </div>
          <div style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.5; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.85rem;">
            <strong>전문 심리 지원 기관 안내 (24시간 무료):</strong><br/>
            • 보건복지상담센터: 국번없이 <strong>129</strong><br/>
            • 정신건강위기상담전화: <strong>1577-0199</strong> / 자살예방상담: <strong>109</strong>
          </div>
          <div style="margin-top: 1.25rem; text-align: right;">
            <button id="btn-confirm-mental-modal" type="button" style="background: var(--primary); color: #1c1500; font-weight: 700; border: none; border-radius: 8px; padding: 0.5rem 1.2rem; font-size: 0.85rem; cursor: pointer;">
              확인
            </button>
          </div>
        </div>
      </div>

      <!-- 제휴 및 파트너 입점 신청 모달 -->
      <div id="partner-apply-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(4px); z-index: 9999; align-items: center; justify-content: center; padding: 1rem;">
        <div style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 16px; max-width: 520px; width: 100%; padding: 1.5rem; box-shadow: 0 12px 36px rgba(0,0,0,0.6); position: relative;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div>
              <h3 style="font-size: 1.15rem; font-weight: 700; color: #fff; margin: 0;">파트너 솔루션 입점 / 제휴 문의</h3>
              <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0.2rem 0 0 0;">마보살 사용자 진단 결과와 연계할 맞춤 솔루션을 제안해 주세요.</p>
            </div>
            <button id="btn-close-partner-apply" type="button" style="background: none; border: none; color: var(--text-muted); font-size: 1.5rem; cursor: pointer;">&times;</button>
          </div>
          <form id="partner-apply-form" style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div>
              <label style="font-size: 0.78rem; color: #d1d5db; display: block; margin-bottom: 0.25rem;">업체 / 브랜드명 *</label>
              <input type="text" id="apply-partner-name" required placeholder="예: 머니랩 코칭" style="width: 100%; box-sizing: border-box; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.5rem; border-radius: 6px; font-size: 0.82rem;" />
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem;">
              <div>
                <label style="font-size: 0.78rem; color: #d1d5db; display: block; margin-bottom: 0.25rem;">담당자 성명 *</label>
                <input type="text" id="apply-contact-name" required placeholder="홍길동" style="width: 100%; box-sizing: border-box; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.5rem; border-radius: 6px; font-size: 0.82rem;" />
              </div>
              <div>
                <label style="font-size: 0.78rem; color: #d1d5db; display: block; margin-bottom: 0.25rem;">연락처 / 전화번호 *</label>
                <input type="text" id="apply-phone" required placeholder="010-0000-0000" style="width: 100%; box-sizing: border-box; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.5rem; border-radius: 6px; font-size: 0.82rem;" />
              </div>
            </div>
            <div>
              <label style="font-size: 0.78rem; color: #d1d5db; display: block; margin-bottom: 0.25rem;">이메일 *</label>
              <input type="email" id="apply-email" required placeholder="partner@domain.com" style="width: 100%; box-sizing: border-box; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.5rem; border-radius: 6px; font-size: 0.82rem;" />
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem;">
              <div>
                <label style="font-size: 0.78rem; color: #d1d5db; display: block; margin-bottom: 0.25rem;">제휴 희망 버티컬 *</label>
                <select id="apply-vertical" style="width: 100%; box-sizing: border-box; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.5rem; border-radius: 6px; font-size: 0.82rem;">
                  <option value="finance">경제 · 재테크</option>
                  <option value="career">커리어 · 창업</option>
                  <option value="home">부동산 · 공간</option>
                  <option value="mind">정서 · 마음돌봄</option>
                  <option value="body">건강 · 체질</option>
                  <option value="legal">법률 · 분쟁</option>
                </select>
              </div>
              <div>
                <label style="font-size: 0.78rem; color: #d1d5db; display: block; margin-bottom: 0.25rem;">솔루션 명칭 *</label>
                <input type="text" id="apply-title" required placeholder="예: 재무 상담 / 전자책" style="width: 100%; box-sizing: border-box; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.5rem; border-radius: 6px; font-size: 0.82rem;" />
              </div>
            </div>
            <div>
              <label style="font-size: 0.78rem; color: #d1d5db; display: block; margin-bottom: 0.25rem;">솔루션 소개 및 제휴 제안 내용</label>
              <textarea id="apply-desc" rows="3" placeholder="컨텐츠 또는 서비스의 핵심 특장점과 제공 방식을 적어주세요." style="width: 100%; box-sizing: border-box; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.5rem; border-radius: 6px; font-size: 0.82rem; resize: none;"></textarea>
            </div>
            <div style="margin-top: 0.5rem; display: flex; justify-content: flex-end; gap: 0.5rem;">
              <button type="button" id="btn-cancel-partner-apply" style="background: rgba(255,255,255,0.1); color: #fff; border: none; border-radius: 6px; padding: 0.45rem 0.9rem; font-size: 0.82rem; cursor: pointer;">취소</button>
              <button type="submit" style="background: var(--primary); color: #1c1500; font-weight: 700; border: none; border-radius: 6px; padding: 0.45rem 1rem; font-size: 0.82rem; cursor: pointer;">신청 접수</button>
            </div>
          </form>
        </div>
      </div>
    </section>`;
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
