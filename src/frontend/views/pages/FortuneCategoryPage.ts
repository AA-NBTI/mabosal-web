/**
 * /fortune : 2027 정미년 신년운세 독립 카테고리 페이지
 */

import { AppStateData } from '../../state/app-state.js';
import { renderBreadcrumbs, renderCategoryNavTabs, renderCategoryHeader, renderCategoryFaq } from './CategoryCommon.js';

export function renderFortuneCategoryPage(state?: AppStateData): string {
  return `
  <div class="category-page-container fortune-category-page" style="max-width: 960px; margin: 0 auto; padding: 1rem 1rem 4rem;">
    <!-- 브레드크럼 -->
    ${renderBreadcrumbs([{ label: '2027 신년운세' }])}

    <!-- 상단 카테고리 퀵 탭 -->
    ${renderCategoryNavTabs('fortune')}

    <!-- 헤더 -->
    ${renderCategoryHeader({
      tag: '2027 NEW YEAR FORECAST',
      title: '2027 정미년(丁未年) 신년 총운 & 월운 비책',
      description: '새로운 한 해, 하늘의 불기운(丁火)과 땅의 조토(未土)가 내 사주 원국과 일으키는 역학적 상호작용을 정밀 분석하고, 12절기 월별 기회와 리스크 방비책을 제시합니다.',
      highlights: ['정미년 상반기·하반기 전환점', '12절기 월별 타이밍 차트', '신년 대길일 & 주의일 안내'],
    })}

    <!-- 메인 신년 상품 상세 카드 -->
    <div style="background: linear-gradient(135deg, rgba(24, 28, 42, 0.95), rgba(35, 25, 20, 0.9)); border: 1px solid rgba(242, 202, 80, 0.4); border-radius: 16px; padding: 2rem; margin-bottom: 2.5rem; box-shadow: 0 8px 32px rgba(0,0,0,0.35);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1.5rem; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 280px;">
          <span style="background: rgba(242, 202, 80, 0.15); color: var(--primary); font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 4px; font-weight: 800; letter-spacing: 0.05em;">
            2027 YEARLY TIMING REPORT
          </span>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #ffffff; margin: 0.6rem 0 0.8rem;">
            정미년(丁未年) 신년 총운 & 12절기 월운 비책
          </h2>
          <p style="font-size: 0.92rem; color: #cbd5e1; line-height: 1.6; margin-bottom: 1.25rem;">
            정미(丁未)의 붉은 양 기운이 내 사주의 재성·관성·식상과 결합하는 양상을 풀이하고, 상반기 6개월과 하반기 6개월의 중점 승부처와 하지 말아야 할 행동을 명확하게 짚어드립니다.
          </p>
          <ul style="margin: 0; padding-left: 1.25rem; font-size: 0.88rem; color: #a1a1aa; line-height: 1.7;">
            <li>2027년 내 사주에 들어오는 핵심 운과 천간·지지 충합 분석</li>
            <li>1월부터 12월까지 월별 기운 곡선(Spline Curve) 그래프</li>
            <li>이사, 이직, 시험, 계약에 가장 유리한 신년 골든타임 월</li>
            <li>소장용 TXT 및 인쇄용 PDF 리포트 다운로드 제공</li>
          </ul>
        </div>

        <div style="background: rgba(15, 19, 29, 0.85); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 12px; padding: 1.5rem; min-width: 240px; text-align: center; display: flex; flex-direction: column; gap: 1rem; align-items: center;">
          <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">신년 특화 완결 리포트</div>
          <div style="font-size: 1.75rem; font-weight: 800; color: var(--primary); line-height: 1;">19,900원</div>
          <button type="button" class="btn-cta-primary btn-select-product" data-tier="YEAR_2027" style="width: 100%; padding: 0.85rem 1.25rem; font-size: 1rem; font-weight: 800; border-radius: 8px; cursor: pointer; background: var(--primary); color: #241a00; border: none; box-shadow: 0 4px 14px rgba(242, 202, 80, 0.35);">
            신년운세 감정 신청 →
          </button>
          <div style="font-size: 0.74rem; color: #71717a;">생년월일 입력 후 즉시 열람</div>
        </div>
      </div>
    </div>

    <!-- 신년 리포트 미리보기 포인트 3 -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem; margin-bottom: 3rem;">
      <div style="background: rgba(24, 28, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 1.25rem;">
        <div style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--primary);">
          <span class="material-symbols-outlined">analytics</span>
        </div>
        <h3 style="font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0 0 0.4rem;">상반기 vs 하반기 변곡점</h3>
        <p style="font-size: 0.85rem; color: #94a3b8; margin: 0; line-height: 1.55;">
          기운이 뻗어나가는 시기와 내실을 다져야 하는 시기를 명확하게 구분하여 연간 계획을 세울 수 있습니다.
        </p>
      </div>
      <div style="background: rgba(24, 28, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 1.25rem;">
        <div style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--primary);">
          <span class="material-symbols-outlined">show_chart</span>
        </div>
        <h3 style="font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0 0 0.4rem;">12개월 월별 리듬 분석</h3>
        <p style="font-size: 0.85rem; color: #94a3b8; margin: 0; line-height: 1.55;">
          각 월마다 조심해야 할 사건과 적극적으로 기회를 노려야 할 행동 요령을 스플라인 차트로 한눈에 파악합니다.
        </p>
      </div>
      <div style="background: rgba(24, 28, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 1.25rem;">
        <div style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--primary);">
          <span class="material-symbols-outlined">shield</span>
        </div>
        <h3 style="font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0 0 0.4rem;">신년 액막이 및 개운 처방</h3>
        <p style="font-size: 0.85rem; color: #94a3b8; margin: 0; line-height: 1.55;">
          나를 돕는 오행 색상, 길한 방향, 피해야 할 인연과 장소를 구체적인 행동 처방으로 제안합니다.
        </p>
      </div>
    </div>

    <!-- FAQ -->
    ${renderCategoryFaq([
      {
        question: '신년운세는 언제 보는 것이 가장 좋은가요?',
        answer: '명리학에서 한 해의 기운은 입춘(양력 2월 4일경)을 기점으로 교체되지만, 전년도 동지부터 새해 기운이 유입되기 시작하므로 연말부터 연초 상반기까지 열람하시는 것이 한 해를 설계하는 데 가장 효과적입니다.',
      },
      {
        question: '일반 토정비결과 마보살 신년운세의 차이는 무엇인가요?',
        answer: '토정비결은 주역 괘에 근거한 비유적 해설인 반면, 마보살 신년운세는 본인의 사주 원국 8자와 정미년 간지의 오행 역학적 반응을 실질적으로 계산하여 직장, 재물, 대인관계 타이밍을 수치화해 드립니다.',
      },
    ])}
  </div>
  `;
}
