/**
 * /career : 직장·이직운 독립 카테고리 페이지
 */

import { AppStateData } from '../../state/app-state.js';
import { renderBreadcrumbs, renderCategoryNavTabs, renderCategoryHeader, renderCategoryFaq } from './CategoryCommon.js';

export function renderCareerCategoryPage(state?: AppStateData): string {
  return `
  <div class="category-page-container career-category-page" style="max-width: 960px; margin: 0 auto; padding: 1rem 1rem 4rem;">
    <!-- 브레드크럼 -->
    ${renderBreadcrumbs([{ label: '직장·이직운' }])}

    <!-- 헤더 -->
    ${renderCategoryHeader({
      tag: 'CAREER & TRANSITION',
      title: '직장운·이직운세 및 커리어 타이밍 처방',
      description: '버텨야 할 때인가, 떠나야 할 때인가? 직장 내 스트레스와 상사·동료 갈등의 원인을 사주 역학으로 풀이하고, 가장 유리한 이직·승진·퇴사 타이밍을 명쾌하게 판정합니다.',
      highlights: ['퇴사 vs 잔류 4주 정밀 점검', '부서 이동 및 이직 골든타임', '직장 내 관살(官殺)과 구설 방비'],
    })}

    <!-- 메인 직장운 상품 카드 -->
    <div style="background: linear-gradient(135deg, rgba(24, 28, 42, 0.95), rgba(20, 32, 45, 0.9)); border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 16px; padding: 2rem; margin-bottom: 2.5rem; box-shadow: 0 8px 32px rgba(0,0,0,0.35);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1.5rem; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 280px;">
          <span style="background: rgba(242, 202, 80, 0.15); color: var(--primary); font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 4px; font-weight: 800; letter-spacing: 0.05em;">
            CAREER & JOB CHANGE TIMING
          </span>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #ffffff; margin: 0.6rem 0 0.8rem;">
            직장운·이직운세 원포인트 정밀 처방
          </h2>
          <p style="font-size: 0.92rem; color: #cbd5e1; line-height: 1.6; margin-bottom: 1.25rem;">
            내 사주의 관성(官星: 직장, 명예)과 인성(印星: 권한, 문서)의 작용을 분석하여 현재 직장이 나에게 마가 끼어 있는 환경인지, 아니면 승진을 앞둔 성장통인지 진단합니다.
          </p>
          <ul style="margin: 0; padding-left: 1.25rem; font-size: 0.88rem; color: #a1a1aa; line-height: 1.7;">
            <li>현재 직장 잔류 vs 이직 시 유불리 4가지 시나리오 분석</li>
            <li>이력서를 넣고 면접을 보기에 가장 길한 월별 이직 창구기</li>
            <li>직장 내 꼰대 상사·불합리한 인간관계 대처 마보살식 실전 스크립트</li>
            <li>독립 창업/프리랜서 전향 적기 여부 판정</li>
          </ul>
        </div>

        <div style="background: rgba(15, 19, 29, 0.85); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 12px; padding: 1.5rem; min-width: 240px; text-align: center; display: flex; flex-direction: column; gap: 1rem; align-items: center;">
          <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">커리어 정밀 처방서</div>
          <div style="font-size: 1.75rem; font-weight: 800; color: var(--primary); line-height: 1;">19,900원</div>
          <button type="button" class="btn-cta-primary btn-select-product" data-tier="CAREER" style="width: 100%; padding: 0.85rem 1.25rem; font-size: 1rem; font-weight: 800; border-radius: 8px; cursor: pointer; background: var(--primary); color: #241a00; border: none; box-shadow: 0 4px 14px rgba(242, 202, 80, 0.35);">
            직장운 감정 신청 →
          </button>
          <div style="font-size: 0.74rem; color: #71717a;">생년월일 입력 후 즉시 열람</div>
        </div>
      </div>
    </div>

    <!-- 특장점 섹션 -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem; margin-bottom: 3rem;">
      <div style="background: rgba(24, 28, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 1.25rem;">
        <div style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--primary);">
          <span class="material-symbols-outlined">call_split</span>
        </div>
        <h3 style="font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0 0 0.4rem;">퇴사 타이밍 판정</h3>
        <p style="font-size: 0.85rem; color: #94a3b8; margin: 0; line-height: 1.55;">
          홧김에 나갔다가 공백기가 길어질 위험을 방지하고, 명리학적 안전망이 갖춰지는 시점을 집어냅니다.
        </p>
      </div>
      <div style="background: rgba(24, 28, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 1.25rem;">
        <div style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--primary);">
          <span class="material-symbols-outlined">person_celebrate</span>
        </div>
        <h3 style="font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0 0 0.4rem;">합격·승진 기운 극대화</h3>
        <p style="font-size: 0.85rem; color: #94a3b8; margin: 0; line-height: 1.55;">
          문서운(인성)과 직장운(정관)이 만나는 달에 면접, 연봉 협상, 승진 심사를 겨냥하도록 가이드합니다.
        </p>
      </div>
      <div style="background: rgba(24, 28, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 1.25rem;">
        <div style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--primary);">
          <span class="material-symbols-outlined">record_voice_over</span>
        </div>
        <h3 style="font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0 0 0.4rem;">구설수와 사내 정치 방어</h3>
        <p style="font-size: 0.85rem; color: #94a3b8; margin: 0; line-height: 1.55;">
          상관견관(傷官見官)이나 삼형살이 들어와 말 한마디로 오해를 사기 쉬운 위험 주간을 미리 차단합니다.
        </p>
      </div>
    </div>

    <!-- FAQ -->
    ${renderCategoryFaq([
      {
        question: '이직 준비 중인데 언제가 서류 접수에 가장 유리한가요?',
        answer: '직장운 리포트에서 본인의 천간합 및 천을귀인 월, 그리고 관성운이 활성화되는 월별 인덱스를 확인하실 수 있으며, 해당 시기에 지원할 때 서류 합격률이 가장 높아집니다.',
      },
      {
        question: '퇴사를 고민 중인데 버텨야 할지 당장 나가야 할지 모르겠습니다.',
        answer: '현재 겪고 계신 고난이 일시적인 운의 충돌(형충파해)인지, 아니면 회사의 그릇 자체가 나와 맞지 않는 것인지를 명확하게 판별해 드립니다.',
      },
    ])}
  </div>
  `;
}
