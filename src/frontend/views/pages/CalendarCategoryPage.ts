/**
 * /calendar : 마기 & 길일 달력 독립 카테고리 페이지
 */

import { AppStateData } from '../../state/app-state.js';
import { renderBreadcrumbs, renderCategoryNavTabs, renderCategoryHeader, renderCategoryFaq } from './CategoryCommon.js';
import { renderMagiCalendarView } from '../MagiCalendarView.js';
import { renderLuckyCalendarView } from '../LuckyCalendarView.js';

export function renderCalendarCategoryPage(state: AppStateData): string {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const subTab = urlParams.get('tab') || 'magi';

  return `
  <div class="category-page-container calendar-category-page" style="max-width: 960px; margin: 0 auto; padding: 1rem 1rem 4rem;">
    <!-- 브레드크럼 -->
    ${renderBreadcrumbs([{ label: '마기·길일 달력' }])}

    <!-- 상단 카테고리 퀵 탭 -->
    ${renderCategoryNavTabs('calendar')}

    <!-- 헤더 -->
    ${renderCategoryHeader({
      tag: 'MAGI & AUSPICIOUS CALENDAR',
      title: '마보살 마기달력 & 천을귀인 길일 달력',
      description: '사주 명리학의 일진(日辰)과 12신살, 충합을 정밀 분석하여 중요한 계약, 약속, 이사, 수술을 피해야 할 마기(Ma-Gi)일과 만사가 형통하는 천을귀인 대길일을 실시간 안내합니다.',
      highlights: ['월별 마기 위험도 4단계 분류', '천을귀인·삼합 길일 하이라이트', '당일 실시간 일진 방비 팁'],
    })}

    <!-- 마기달력 vs 길일달력 서브 스위치 탭 -->
    <div style="display: flex; justify-content: center; margin-bottom: 2rem;">
      <div style="background: rgba(18, 22, 34, 0.85); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 9999px; padding: 0.3rem; display: inline-flex; gap: 0.35rem;">
        <button type="button" id="btn-subtab-magi-cal" class="btn-calendar-switch ${subTab === 'magi' ? 'active' : ''}" style="border: none; border-radius: 9999px; padding: 0.55rem 1.45rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; background: ${subTab === 'magi' ? 'var(--primary)' : 'transparent'}; color: ${subTab === 'magi' ? '#241a00' : 'var(--text-muted)'};">
          <span class="material-symbols-outlined" style="font-size: 18px;">event_busy</span>
          마기(魔氣) 달력
        </button>
        <button type="button" id="btn-subtab-lucky-cal" class="btn-calendar-switch ${subTab === 'lucky' ? 'active' : ''}" style="border: none; border-radius: 9999px; padding: 0.55rem 1.45rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; background: ${subTab === 'lucky' ? 'var(--primary)' : 'transparent'}; color: ${subTab === 'lucky' ? '#241a00' : 'var(--text-muted)'};">
          <span class="material-symbols-outlined" style="font-size: 18px;">event_available</span>
          천을귀인 길일 달력
        </button>
      </div>
    </div>

    <!-- 달력 본체 뷰 인라인 렌더링 -->
    <div class="calendar-embed-container" style="background: rgba(18, 22, 34, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 1.5rem; margin-bottom: 2.5rem;">
      ${subTab === 'lucky' ? renderLuckyCalendarView(state) : renderMagiCalendarView(state)}
    </div>

    <!-- FAQ -->
    ${renderCategoryFaq([
      {
        question: '마기일(魔氣日)에는 어떤 일들을 주의해야 하나요?',
        answer: '마기일은 일진과 본인 사주의 충살이 발생하는 날로, 큰 금액의 계약, 이사, 새로운 프로젝트 런칭, 감정적 대화나 갈등 상황을 피하고 내실을 다지며 조용히 보내는 것이 좋습니다.',
      },
      {
        question: '천을귀인 길일에는 무엇을 하면 좋은가요?',
        answer: '천을귀인은 하늘의 귀인이 도와 흉을 길로 바꾸는 최고의 길신입니다. 중요한 미팅, 시험, 계약, 면접, 고백 등 인생의 중요한 전환점을 배치하기에 가장 이상적입니다.',
      },
    ])}
  </div>
  `;
}
