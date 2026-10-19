/**
 * /love : 연애·재회·궁합 독립 카테고리 페이지
 */

import { AppStateData } from '../../state/app-state.js';
import { renderBreadcrumbs, renderCategoryNavTabs, renderCategoryHeader, renderCategoryFaq } from './CategoryCommon.js';

export function renderLoveCategoryPage(state?: AppStateData): string {
  return `
  <div class="category-page-container love-category-page" style="max-width: 960px; margin: 0 auto; padding: 1rem 1rem 4rem;">
    <!-- 브레드크럼 -->
    ${renderBreadcrumbs([{ label: '연애·재회·궁합' }])}

    <!-- 헤더 -->
    ${renderCategoryHeader({
      tag: 'RELATIONSHIP & CHEMISTRY',
      title: '연애운·재회운세 & 2인 정밀 궁합 분석',
      description: '이별 후 흔들리는 마음과 상대방의 속마음, 다시 이어질 수 있는 재회 연락 골든타임을 밝히고, 반복되는 갈등의 역학적 원인을 풀어내는 2인 정밀 궁합 솔루션을 제공합니다.',
      highlights: ['상대방 연락 가능성 월별 지수', '이별 후 재회 골든타임 처방', '2인 사주 교차 정밀 궁합'],
    })}

    <!-- 2대 연애/궁합 핵심 상품 리스트 -->
    <div style="display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 3rem;">
      <!-- 상품 1: 재회운세 (19,900원) -->
      <article class="product-showcase-card" style="background: linear-gradient(135deg, rgba(24, 28, 42, 0.9), rgba(38, 22, 35, 0.85)); border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 16px; padding: 1.5rem 1.75rem; display: flex; justify-content: space-between; align-items: center; gap: 1.25rem; flex-wrap: wrap; box-shadow: 0 4px 24px rgba(0,0,0,0.25);">
        <div style="display: flex; align-items: center; gap: 1.25rem; flex: 1; min-width: 280px;">
          <div style="width: 52px; height: 52px; border-radius: 12px; background: rgba(242, 202, 80, 0.15); border: 1px solid rgba(242, 202, 80, 0.45); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <span class="material-symbols-outlined" style="font-size: 28px; color: var(--primary);">favorite</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.35rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="background: rgba(242, 202, 80, 0.15); color: var(--primary); font-size: 0.72rem; padding: 0.15rem 0.55rem; border-radius: 4px; font-weight: 700;">재회 특화</span>
              <h2 style="font-size: 1.25rem; font-weight: 800; color: #ffffff; margin: 0;">재회운세 & 연락 골든타임</h2>
            </div>
            <p style="font-size: 0.9rem; color: #cbd5e1; margin: 0; line-height: 1.5;">
              상대방이 나를 떠올리는 시점과 연락 가능성 월별 지수, 먼저 연락해도 안전한 타이밍과 즉시 재회 대화 스크립트.
            </p>
          </div>
        </div>
        <div class="product-action-box" style="display: flex; align-items: center; gap: 1.15rem;">
          <div class="product-price-label" style="font-size: 1.35rem; font-weight: 800; color: var(--primary);">19,900원</div>
          <button type="button" class="btn-cta-primary btn-select-product" data-tier="REUNION" style="padding: 0.75rem 1.45rem; font-size: 0.95rem; font-weight: 800; border-radius: 8px; cursor: pointer; background: var(--primary); color: #241a00; border: none;">
            구매하기
          </button>
        </div>
      </article>

      <!-- 상품 2: 궁합운세 (29,900원) -->
      <article class="product-showcase-card" style="background: linear-gradient(135deg, rgba(24, 28, 42, 0.9), rgba(45, 20, 35, 0.85)); border: 1px solid rgba(244, 114, 182, 0.4); border-radius: 16px; padding: 1.5rem 1.75rem; display: flex; justify-content: space-between; align-items: center; gap: 1.25rem; flex-wrap: wrap; box-shadow: 0 4px 24px rgba(0,0,0,0.25);">
        <div style="display: flex; align-items: center; gap: 1.25rem; flex: 1; min-width: 280px;">
          <div style="width: 52px; height: 52px; border-radius: 12px; background: rgba(244, 114, 182, 0.15); border: 1px solid rgba(244, 114, 182, 0.5); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <span class="material-symbols-outlined" style="font-size: 28px; color: #f472b6;">favorite_border</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.35rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="background: rgba(244, 114, 182, 0.15); color: #f472b6; font-size: 0.72rem; padding: 0.15rem 0.55rem; border-radius: 4px; font-weight: 700;">2인 정밀 궁합</span>
              <h2 style="font-size: 1.25rem; font-weight: 800; color: #ffffff; margin: 0;">2인 사주 정밀 궁합</h2>
            </div>
            <p style="font-size: 0.9rem; color: #cbd5e1; margin: 0; line-height: 1.5;">
              반복되는 다툼의 3대 원인과 성격 충돌 보완점, 결혼 적합도 및 평생의 파트너십 상생 지수 완결 분석서.
            </p>
          </div>
        </div>
        <div class="product-action-box" style="display: flex; align-items: center; gap: 1.15rem;">
          <div class="product-price-label" style="font-size: 1.35rem; font-weight: 800; color: #f472b6;">29,900원</div>
          <button type="button" class="btn-cta-primary btn-select-product" data-tier="CHEMISTRY" style="padding: 0.75rem 1.45rem; font-size: 0.95rem; font-weight: 800; border-radius: 8px; cursor: pointer; background: #f472b6; color: #241a00; border: none;">
            구매하기
          </button>
        </div>
      </article>
    </div>

    <!-- 특장점 섹션 -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem; margin-bottom: 3rem;">
      <div style="background: rgba(24, 28, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 1.25rem;">
        <div style="font-size: 1.5rem; margin-bottom: 0.5rem; color: #f472b6;">
          <span class="material-symbols-outlined">question_answer</span>
        </div>
        <h3 style="font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0 0 0.4rem;">먼저 연락해도 될까?</h3>
        <p style="font-size: 0.85rem; color: #94a3b8; margin: 0; line-height: 1.55;">
          섣부른 연락으로 역풍을 맞지 않도록, 상대방의 저항감이 누그러지는 감정 완화 주간을 짚어냅니다.
        </p>
      </div>
      <div style="background: rgba(24, 28, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 1.25rem;">
        <div style="font-size: 1.5rem; margin-bottom: 0.5rem; color: #f472b6;">
          <span class="material-symbols-outlined">diversity_1</span>
        </div>
        <h3 style="font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0 0 0.4rem;">다툼 패턴의 원인 규명</h3>
        <p style="font-size: 0.85rem; color: #94a3b8; margin: 0; line-height: 1.55;">
          단순한 성격 차이가 아닌, 두 사람의 일지와 지지 충(冲)으로 발생하는 트리거를 명확하게 밝힙니다.
        </p>
      </div>
      <div style="background: rgba(24, 28, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 1.25rem;">
        <div style="font-size: 1.5rem; margin-bottom: 0.5rem; color: #f472b6;">
          <span class="material-symbols-outlined">handshake</span>
        </div>
        <h3 style="font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0 0 0.4rem;">즉시 화해 대화 스크립트</h3>
        <p style="font-size: 0.85rem; color: #94a3b8; margin: 0; line-height: 1.55;">
          상대방의 오행 일간 성향(목·화·토·금·수)에 맞춰 마음의 문을 여는 실전 대화법을 제공합니다.
        </p>
      </div>
    </div>

    <!-- FAQ -->
    ${renderCategoryFaq([
      {
        question: '상대방의 생년월일만 알고 태어난 시간은 모르는데 궁합이 가능한가요?',
        answer: '네, 가능합니다. 궁합 분석에서 가장 핵심이 되는 부분은 본인과 상대방의 일간(나 자신) 및 일지(배우자궁)의 결합 관계입니다. 생년월일만으로도 정밀한 궁합 분석이 가능합니다.',
      },
      {
        question: '이별한 지 3개월이 넘었는데 재회운을 봐도 도움이 될까요?',
        answer: '물론입니다. 관계의 인연 줄이 완전히 끊어졌는지, 아니면 일시적 충격기로 대운의 흐름에 따라 다시 마주치게 될지를 확인하여 미련을 정리하거나 재도전할 수 있는 확신을 드립니다.',
      },
    ])}
  </div>
  `;
}
