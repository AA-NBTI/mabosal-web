/**
 * /wealth : 재물·투자운 독립 카테고리 페이지
 */

import { AppStateData } from '../../state/app-state.js';
import { renderBreadcrumbs, renderCategoryNavTabs, renderCategoryHeader, renderCategoryFaq } from './CategoryCommon.js';

export function renderWealthCategoryPage(state?: AppStateData): string {
  return `
  <div class="category-page-container wealth-category-page" style="max-width: 960px; margin: 0 auto; padding: 1rem 1rem 4rem;">
    <!-- 브레드크럼 -->
    ${renderBreadcrumbs([{ label: '재물·투자운' }])}

    <!-- 상단 카테고리 퀵 탭 -->
    ${renderCategoryNavTabs('wealth')}

    <!-- 헤더 -->
    ${renderCategoryHeader({
      tag: 'WEALTH & ASSET TIMING',
      title: '재물운·투자운세 및 자산 타이밍 리포트',
      description: '재정적 압박이 커질 때 현금을 지켜야 할지, 아니면 공격적인 투자를 감행해야 할지 판정합니다. 내 사주의 재성(財星) 그릇과 손재마(損財魔)를 정밀 진단합니다.',
      highlights: ['공격 투자 vs 현금 보유 최적기 판정', '군겁쟁재·손재마 누수 구멍 방비', '월별 금전 회전 및 자금 수혈 시기'],
    })}

    <!-- 메인 재물운 상품 카드 -->
    <div style="background: linear-gradient(135deg, rgba(24, 28, 42, 0.95), rgba(40, 32, 15, 0.9)); border: 1px solid rgba(242, 202, 80, 0.4); border-radius: 16px; padding: 2rem; margin-bottom: 2.5rem; box-shadow: 0 8px 32px rgba(0,0,0,0.35);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1.5rem; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 280px;">
          <span style="background: rgba(242, 202, 80, 0.15); color: var(--primary); font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 4px; font-weight: 800; letter-spacing: 0.05em;">
            WEALTH & INVESTMENT STRATEGY
          </span>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #ffffff; margin: 0.6rem 0 0.8rem;">
            재물운세 & 투자 타이밍 원포인트 정밀 처방
          </h2>
          <p style="font-size: 0.92rem; color: #cbd5e1; line-height: 1.6; margin-bottom: 1.25rem;">
            돈이 모이는 사주와 돈이 새는 사주는 분명히 다릅니다. 정재(고정소득)와 편재(투자/사업소득)의 힘을 측정하고, 사기·손실을 부르는 겁재(劫財)의 기운을 사전에 막아냅니다.
          </p>
          <ul style="margin: 0; padding-left: 1.25rem; font-size: 0.88rem; color: #a1a1aa; line-height: 1.7;">
            <li>내 사주의 재물 그릇 크기와 재고(財庫: 금고) 활성화 여부</li>
            <li>부동산, 주식, 코인 등 투자 유형별 궁합과 유리한 상품군</li>
            <li>올해 돈이 크게 빠져나갈 위험이 있는 손재마 집중 경고 월</li>
            <li>사업 자금 대출 및 투자금 유치 최적의 협상 타이밍</li>
          </ul>
        </div>

        <div style="background: rgba(15, 19, 29, 0.85); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 12px; padding: 1.5rem; min-width: 240px; text-align: center; display: flex; flex-direction: column; gap: 1rem; align-items: center;">
          <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">재물 특화 완결 리포트</div>
          <div style="font-size: 1.75rem; font-weight: 800; color: var(--primary); line-height: 1;">19,900원</div>
          <button type="button" class="btn-cta-primary btn-select-product" data-tier="WEALTH" style="width: 100%; padding: 0.85rem 1.25rem; font-size: 1rem; font-weight: 800; border-radius: 8px; cursor: pointer; background: var(--primary); color: #241a00; border: none; box-shadow: 0 4px 14px rgba(242, 202, 80, 0.35);">
            재물운 감정 신청 →
          </button>
          <div style="font-size: 0.74rem; color: #71717a;">생년월일 입력 후 즉시 열람</div>
        </div>
      </div>
    </div>

    <!-- 특장점 섹션 -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem; margin-bottom: 3rem;">
      <div style="background: rgba(24, 28, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 1.25rem;">
        <div style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--primary);">
          <span class="material-symbols-outlined">savings</span>
        </div>
        <h3 style="font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0 0 0.4rem;">손재마 누수 완벽 차단</h3>
        <p style="font-size: 0.85rem; color: #94a3b8; margin: 0; line-height: 1.55;">
          밑 빠진 독처럼 돈이 줄줄 새어나가는 원인(친인척 보증, 충동구매, 무리한 레버리지)을 집어냅니다.
        </p>
      </div>
      <div style="background: rgba(24, 28, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 1.25rem;">
        <div style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--primary);">
          <span class="material-symbols-outlined">trending_up</span>
        </div>
        <h3 style="font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0 0 0.4rem;">투자 승부처 월별 안내</h3>
        <p style="font-size: 0.85rem; color: #94a3b8; margin: 0; line-height: 1.55;">
          편재운과 식신생재가 작동하여 투자 수익률을 극대화할 수 있는 골든타임 월을 짚어드립니다.
        </p>
      </div>
      <div style="background: rgba(24, 28, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 1.25rem;">
        <div style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--primary);">
          <span class="material-symbols-outlined">token</span>
        </div>
        <h3 style="font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0 0 0.4rem;">개운 부적 및 방위 처방</h3>
        <p style="font-size: 0.85rem; color: #94a3b8; margin: 0; line-height: 1.55;">
          재물운을 북돋우는 오행 색상의 소품과 집/사무실 내 금고 및 책상 길방향을 안내합니다.
        </p>
      </div>
    </div>

    <!-- FAQ -->
    ${renderCategoryFaq([
      {
        question: '무재사주(사주에 재성이 없는 사주)는 부자가 될 수 없나요?',
        answer: '전혀 그렇지 않습니다. 사주에 재성이 없더라도 식상(재능, 사업수단)이나 관성(조직, 명예)의 힘으로 거대한 자산을 형성하는 슈퍼리치 사례가 매우 많습니다. 내 사주가 돈을 버는 고유 방식을 밝혀드립니다.',
      },
      {
        question: '투자를 하기에 언제가 가장 위험한 시기인가요?',
        answer: '군겁쟁재(비겁이 재성을 빼앗는 운)나 충살이 발생하는 시기에는 무조건 현금을 지키고 리스크를 축소해야 합니다. 리포트에서 손재마 경고 주간을 반드시 확인하세요.',
      },
    ])}
  </div>
  `;
}
