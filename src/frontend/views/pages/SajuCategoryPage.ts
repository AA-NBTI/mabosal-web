/**
 * /saju : 정통 종합 사주 감정 독립 카테고리 페이지
 */

import { AppStateData } from '../../state/app-state.js';
import { renderBreadcrumbs, renderCategoryNavTabs, renderCategoryHeader, renderCategoryFaq } from './CategoryCommon.js';

export function renderSajuCategoryPage(state?: AppStateData): string {
  return `
  <div class="category-page-container saju-category-page" style="max-width: 960px; margin: 0 auto; padding: 1rem 1rem 4rem;">
    <!-- 브레드크럼 -->
    ${renderBreadcrumbs([{ label: '종합 사주 감정' }])}

    <!-- 상단 카테고리 퀵 탭 -->
    ${renderCategoryNavTabs('saju')}

    <!-- 헤더 -->
    ${renderCategoryHeader({
      tag: 'TRADITIONAL COMPREHENSIVE',
      title: '마보살 정통 종합 사주 감정',
      description: '사주 원국 4주 8자, 일간의 본질, 오행 강약과 용신을 정밀 분석하고, 인생의 사계절과 시기별 대운의 기운을 밝혀 현실 솔루션을 제공합니다.',
      highlights: ['정통 명리 13~29개 전수 섹션', '사주 원국 시각화 차트', '현실 고민 1:1 맞춤 처방'],
    })}

    <!-- 4대 정밀 감정 상품 리스트 -->
    <div style="display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 3rem;">
      <!-- 상품 1: 무료 사주 진단 -->
      <article class="product-showcase-card" style="background: rgba(24, 28, 42, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 1.35rem 1.5rem; display: flex; justify-content: space-between; align-items: center; gap: 1.25rem; flex-wrap: wrap; transition: transform 0.2s, border-color 0.2s;">
        <div style="display: flex; align-items: center; gap: 1.15rem; flex: 1; min-width: 280px;">
          <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.4); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <span class="material-symbols-outlined" style="font-size: 26px; color: var(--primary);">verified_user</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.3rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="background: rgba(242, 202, 80, 0.12); color: var(--primary); font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 700;">체험 진단</span>
              <h2 style="font-size: 1.18rem; font-weight: 800; color: #ffffff; margin: 0;">무료 사주 진단</h2>
            </div>
            <p style="font-size: 0.88rem; color: #a1a1aa; margin: 0; line-height: 1.45;">
              4주 8자, 일간의 본질과 기질, 오행 분포도, 감지된 마(Ma) 징후 (총 13개 기본 섹션)
            </p>
          </div>
        </div>
        <div class="product-action-box" style="display: flex; align-items: center; gap: 1rem;">
          <div class="product-price-label" style="font-size: 1.15rem; font-weight: 800; color: #ffffff;">0원</div>
          <button type="button" class="btn-cta-secondary btn-select-product" data-tier="FREE" style="padding: 0.65rem 1.35rem; font-size: 0.92rem; font-weight: 700; border-radius: 8px; cursor: pointer; background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.4); color: var(--primary);">
            무료 진단 시작 →
          </button>
        </div>
      </article>

      <!-- 상품 2: 유료 사주풀이 (39,900원) -->
      <article class="product-showcase-card" style="background: rgba(24, 28, 42, 0.85); border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 14px; padding: 1.35rem 1.5rem; display: flex; justify-content: space-between; align-items: center; gap: 1.25rem; flex-wrap: wrap; box-shadow: 0 4px 20px rgba(0,0,0,0.25);">
        <div style="display: flex; align-items: center; gap: 1.15rem; flex: 1; min-width: 280px;">
          <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(242, 202, 80, 0.18); border: 1px solid rgba(242, 202, 80, 0.5); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <span class="material-symbols-outlined" style="font-size: 26px; color: var(--primary);">diamond</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.3rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="background: var(--primary); color: #241a00; font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 800;">베스트 셀러</span>
              <h2 style="font-size: 1.18rem; font-weight: 800; color: #ffffff; margin: 0;">정밀 유료 사주풀이</h2>
            </div>
            <p style="font-size: 0.88rem; color: #a1a1aa; margin: 0; line-height: 1.45;">
              격국·강약·용신 심층 해석, 12개월 월운 전체 해설, 올해 핵심 조언과 기회 시기 (18개 섹션)
            </p>
          </div>
        </div>
        <div class="product-action-box" style="display: flex; align-items: center; gap: 1rem;">
          <div class="product-price-label" style="font-size: 1.25rem; font-weight: 800; color: var(--primary);">39,900원</div>
          <button type="button" class="btn-cta-primary btn-select-product" data-tier="PAID" style="padding: 0.65rem 1.35rem; font-size: 0.92rem; font-weight: 800; border-radius: 8px; cursor: pointer; background: var(--primary); color: #241a00; border: none;">
            정밀 신청 →
          </button>
        </div>
      </article>

      <!-- 상품 3: 상충·마·살 특화 (79,900원) -->
      <article class="product-showcase-card" style="background: rgba(24, 28, 42, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 1.35rem 1.5rem; display: flex; justify-content: space-between; align-items: center; gap: 1.25rem; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 1.15rem; flex: 1; min-width: 280px;">
          <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.4); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <span class="material-symbols-outlined" style="font-size: 26px; color: var(--primary);">bolt</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.3rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="background: rgba(242, 202, 80, 0.15); color: var(--primary); font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 700;">갈등·위기 특화</span>
              <h2 style="font-size: 1.18rem; font-weight: 800; color: #ffffff; margin: 0;">상충·마·살 특화 분석</h2>
            </div>
            <p style="font-size: 0.88rem; color: #a1a1aa; margin: 0; line-height: 1.45;">
              인간관계 충돌(형충파해), 퇴사 vs 잔류 4주 점검, 관재구설 및 손재마 방비 (20개 섹션)
            </p>
          </div>
        </div>
        <div class="product-action-box" style="display: flex; align-items: center; gap: 1rem;">
          <div class="product-price-label" style="font-size: 1.25rem; font-weight: 800; color: #ffffff;">79,900원</div>
          <button type="button" class="btn-cta-primary btn-select-product" data-tier="CONFLICT_MALSAL" style="padding: 0.65rem 1.35rem; font-size: 0.92rem; font-weight: 800; border-radius: 8px; cursor: pointer; background: var(--primary); color: #241a00; border: none;">
            신청하기 →
          </button>
        </div>
      </article>

      <!-- 상품 4: 프리미엄 통합 (149,900원) -->
      <article class="product-showcase-card" style="background: rgba(24, 28, 42, 0.75); border: 1px solid rgba(242, 202, 80, 0.4); border-radius: 14px; padding: 1.35rem 1.5rem; display: flex; justify-content: space-between; align-items: center; gap: 1.25rem; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 1.15rem; flex: 1; min-width: 280px;">
          <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(242, 202, 80, 0.2); border: 1px solid var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <span class="material-symbols-outlined" style="font-size: 26px; color: var(--primary);">workspace_premium</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.3rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="background: rgba(242, 202, 80, 0.2); color: var(--primary); font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 800;">VIP 완결판</span>
              <h2 style="font-size: 1.18rem; font-weight: 800; color: #ffffff; margin: 0;">프리미엄 통합 VIP</h2>
            </div>
            <p style="font-size: 0.88rem; color: #a1a1aa; margin: 0; line-height: 1.45;">
              29개 전수 섹션 100% 완전 충족, 1:1 심층 복합 처방 로드맵, 소장용 PDF 다운로드 제공
            </p>
          </div>
        </div>
        <div class="product-action-box" style="display: flex; align-items: center; gap: 1rem;">
          <div class="product-price-label" style="font-size: 1.25rem; font-weight: 800; color: var(--primary);">149,900원</div>
          <button type="button" class="btn-cta-primary btn-select-product" data-tier="PREMIUM" style="padding: 0.65rem 1.35rem; font-size: 0.92rem; font-weight: 800; border-radius: 8px; cursor: pointer; background: var(--primary); color: #241a00; border: none;">
            VIP 신청 →
          </button>
        </div>
      </article>
    </div>

    <!-- 비교표 섹션 -->
    <section style="background: rgba(18, 22, 34, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 1.5rem; margin-bottom: 3rem; overflow-x: auto;">
      <h3 style="font-size: 1.1rem; font-weight: 800; color: #fff; margin: 0 0 1rem; text-align: center;">
        사주 감정 리포트 등급별 비교
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: center;">
        <thead>
          <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.12); color: var(--text-muted);">
            <th style="padding: 0.75rem; text-align: left;">제공 항목</th>
            <th style="padding: 0.75rem;">무료 진단</th>
            <th style="padding: 0.75rem; color: var(--primary);">정밀 풀이</th>
            <th style="padding: 0.75rem;">상충·마·살</th>
            <th style="padding: 0.75rem; color: var(--primary);">VIP 통합</th>
          </tr>
        </thead>
        <tbody style="color: #cbd5e1;">
          <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
            <td style="padding: 0.75rem; text-align: left;">4주 8자 및 오행 분포도</td>
            <td>O</td><td>O</td><td>O</td><td>O</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
            <td style="padding: 0.75rem; text-align: left;">감지된 마(Ma) 징후 분석</td>
            <td>기본</td><td>심층</td><td>특화</td><td>전수 분석</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
            <td style="padding: 0.75rem; text-align: left;">12개월 월별 운세 흐름</td>
            <td>-</td><td>O</td><td>O</td><td>O</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
            <td style="padding: 0.75rem; text-align: left;">퇴사·이직·인간관계 충돌 점검</td>
            <td>-</td><td>-</td><td>O</td><td>O</td>
          </tr>
          <tr>
            <td style="padding: 0.75rem; text-align: left;">29개 전수 섹션 및 PDF 다운로드</td>
            <td>-</td><td>-</td><td>-</td><td>O</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- FAQ -->
    ${renderCategoryFaq([
      {
        question: '태어난 시간(시주)을 몰라도 사주 감정이 가능한가요?',
        answer: '네, 가능합니다. 생년월일만으로도 년주·월주·일주의 6글자와 대운을 통해 타고난 오행 본질과 올해의 운을 80% 이상 정확하게 판정하며, 태어난 시간 미입력 시 보정 알고리즘이 적용됩니다.',
      },
      {
        question: '무료 진단과 유료 사주풀이의 차이점은 무엇인가요?',
        answer: '무료 진단은 자신의 타고난 기운과 마(Ma)의 징후를 확인하는 13개 체험 섹션을 제공하며, 유료 사주풀이는 격국·억부·용신을 포함한 18개 섹션과 12개월 월별 상세 운세가 전면 개방됩니다.',
      },
      {
        question: '분석 결과는 언제 받아볼 수 있나요?',
        answer: '마보살의 고성능 명리 데이터 엔진이 실시간 계산하여 정보 입력 후 즉시(약 3초 이내) 분석 보고서가 화면에 출력됩니다.',
      },
    ])}
  </div>
  `;
}
