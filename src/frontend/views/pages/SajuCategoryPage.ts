/**
 * /saju : 정통 종합 사주 감정 독립 카테고리 페이지
 */

import { AppStateData } from '../../state/app-state.js';
import { getStoreProductById } from '../../extensions/commerce-store/store-service.js';
import { renderBreadcrumbs, renderCategoryNavTabs, renderCategoryHeader, renderCategoryFaq } from './CategoryCommon.js';

interface SajuShowcaseCardConfig {
  id: string;
  icon: string;
  iconColor?: string;
  iconBg: string;
  iconBorder: string;
  badge: string;
  badgeColor?: string;
  badgeBg: string;
  badgeWeight: string;
  title: string;
  priceLabel: string;
  ctaLabel: string;
  ctaClass: string;
  ctaStyle: string;
}

function renderSajuShowcaseCards(cards: SajuShowcaseCardConfig[]): string {
  const visible = cards.filter(card => {
    const storeProd = getStoreProductById(card.id);
    return !storeProd || storeProd.status !== 'hidden';
  });

  if (visible.length === 0) {
    return `
      <div style="padding: 1.5rem; text-align: center; color: #94a3b8; background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px; font-size: 0.9rem;">
        현재 판매 중인 상품이 없습니다.
      </div>
    `;
  }

  return visible
    .map(card => {
      const storeProd = getStoreProductById(card.id);
      const isSoldOut = storeProd?.status === 'soldout';
      const displayPrice = storeProd
        ? (storeProd.price === 0 ? '0원' : `${storeProd.price.toLocaleString()}원`)
        : card.priceLabel;
      const iconColor = card.iconColor || 'var(--primary)';
      const badgeColor = card.badgeColor || 'var(--primary)';

      return `
        <div class="product-showcase-card">
          <div style="display: flex; align-items: center; gap: 0.95rem; flex: 1; min-width: 0;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: ${card.iconBg}; border: 1px solid ${card.iconBorder}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <span class="material-symbols-outlined" style="font-size: 22px; color: ${iconColor};">${card.icon}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 0.45rem;">
                <span style="background: ${card.badgeBg}; color: ${badgeColor}; font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: ${card.badgeWeight};">${card.badge}</span>
                <h3 style="font-size: 1.08rem; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -0.01em;">${storeProd?.title || card.title}</h3>
              </div>
            </div>
          </div>
          <div class="product-action-box">
            <div class="product-price-label">${displayPrice}</div>
            ${isSoldOut ? `
              <button type="button" class="btn-cta-secondary" disabled style="background: rgba(148, 163, 184, 0.12); border: 1px solid rgba(148, 163, 184, 0.3); color: #94a3b8; cursor: not-allowed;">
                품절
              </button>
            ` : `
              <button type="button" class="${card.ctaClass} btn-select-product btn-goto-store-product-detail" data-product-id="${card.id}" style="${card.ctaStyle}">
                ${card.ctaLabel}
              </button>
            `}
          </div>
        </div>
      `;
    })
    .join('');
}

const CORE_SAJU_CARDS: SajuShowcaseCardConfig[] = [
  {
    id: 'prod-free-experience',
    icon: 'verified_user',
    iconBg: 'rgba(242, 202, 80, 0.12)',
    iconBorder: 'rgba(242, 202, 80, 0.4)',
    badge: '체험 진단',
    badgeBg: 'rgba(242, 202, 80, 0.12)',
    badgeWeight: '700',
    title: '무료 사주 진단',
    priceLabel: '0원',
    ctaLabel: '무료 체험',
    ctaClass: 'btn-cta-secondary',
    ctaStyle: 'background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.4); color: var(--primary); cursor: pointer;',
  },
  {
    id: 'prod-paid-saju-premium',
    icon: 'diamond',
    iconBg: 'rgba(242, 202, 80, 0.15)',
    iconBorder: 'rgba(242, 202, 80, 0.45)',
    badge: '정밀 사주',
    badgeBg: 'rgba(242, 202, 80, 0.15)',
    badgeWeight: '700',
    title: '유료 사주풀이',
    priceLabel: '39,900원',
    ctaLabel: '구매하기',
    ctaClass: 'btn-cta-primary',
    ctaStyle: 'background: var(--primary); color: #241a00; border: none; cursor: pointer;',
  },
  {
    id: 'prod-saju-conflict',
    icon: 'bolt',
    iconBg: 'rgba(242, 202, 80, 0.15)',
    iconBorder: 'rgba(242, 202, 80, 0.45)',
    badge: '갈등 특화',
    badgeBg: 'rgba(242, 202, 80, 0.15)',
    badgeWeight: '700',
    title: '상충·마·살 특화',
    priceLabel: '79,900원',
    ctaLabel: '구매하기',
    ctaClass: 'btn-cta-primary',
    ctaStyle: 'background: var(--primary); color: #241a00; border: none; cursor: pointer;',
  },
  {
    id: 'prod-paid-saju-vip',
    icon: 'workspace_premium',
    iconBg: 'rgba(242, 202, 80, 0.18)',
    iconBorder: 'var(--primary)',
    badge: 'VIP 완결판',
    badgeBg: 'rgba(242, 202, 80, 0.2)',
    badgeWeight: '800',
    title: '프리미엄 통합',
    priceLabel: '149,900원',
    ctaLabel: '구매하기',
    ctaClass: 'btn-cta-primary',
    ctaStyle: 'background: var(--primary); color: #241a00; border: none; cursor: pointer;',
  },
];

const SPECIALIZED_REPORT_CARDS: SajuShowcaseCardConfig[] = [
  {
    id: 'prod-report-year2027',
    icon: 'calendar_today',
    iconBg: 'rgba(242, 202, 80, 0.12)',
    iconBorder: 'rgba(242, 202, 80, 0.4)',
    badge: '신년 특화',
    badgeBg: 'rgba(242, 202, 80, 0.12)',
    badgeWeight: '700',
    title: '신년운세',
    priceLabel: '19,900원',
    ctaLabel: '구매하기',
    ctaClass: 'btn-cta-primary',
    ctaStyle: 'background: var(--primary); color: #241a00; border: none; cursor: pointer;',
  },
  {
    id: 'prod-report-career',
    icon: 'work',
    iconBg: 'rgba(242, 202, 80, 0.12)',
    iconBorder: 'rgba(242, 202, 80, 0.4)',
    badge: '직장·이직',
    badgeBg: 'rgba(242, 202, 80, 0.12)',
    badgeWeight: '700',
    title: '직장운세',
    priceLabel: '19,900원',
    ctaLabel: '구매하기',
    ctaClass: 'btn-cta-primary',
    ctaStyle: 'background: var(--primary); color: #241a00; border: none; cursor: pointer;',
  },
  {
    id: 'prod-report-wealth',
    icon: 'payments',
    iconBg: 'rgba(242, 202, 80, 0.12)',
    iconBorder: 'rgba(242, 202, 80, 0.4)',
    badge: '재물·투자',
    badgeBg: 'rgba(242, 202, 80, 0.12)',
    badgeWeight: '700',
    title: '재물운세',
    priceLabel: '19,900원',
    ctaLabel: '구매하기',
    ctaClass: 'btn-cta-primary',
    ctaStyle: 'background: var(--primary); color: #241a00; border: none; cursor: pointer;',
  },
  {
    id: 'prod-report-reunion',
    icon: 'favorite',
    iconBg: 'rgba(242, 202, 80, 0.12)',
    iconBorder: 'rgba(242, 202, 80, 0.4)',
    badge: '연애·재회',
    badgeBg: 'rgba(242, 202, 80, 0.12)',
    badgeWeight: '700',
    title: '재회운세',
    priceLabel: '19,900원',
    ctaLabel: '구매하기',
    ctaClass: 'btn-cta-primary',
    ctaStyle: 'background: var(--primary); color: #241a00; border: none; cursor: pointer;',
  },
  {
    id: 'prod-report-chemistry',
    icon: 'favorite',
    iconColor: '#f472b6',
    iconBg: 'rgba(251, 207, 232, 0.12)',
    iconBorder: 'rgba(251, 207, 232, 0.4)',
    badge: '정밀 역학',
    badgeColor: '#f472b6',
    badgeBg: 'rgba(251, 207, 232, 0.15)',
    badgeWeight: '700',
    title: '궁합운세',
    priceLabel: '29,900원',
    ctaLabel: '구매하기',
    ctaClass: 'btn-cta-primary',
    ctaStyle: 'background: var(--primary); color: #241a00; border: none; cursor: pointer;',
  },
];

export function renderSajuCategoryPage(state?: AppStateData): string {
  return `
  <div class="category-page-container saju-category-page" style="max-width: 1440px; width: 100%; margin: 0 auto; padding: 1.5rem 1rem 3rem; box-sizing: border-box;">

    <!-- 헤더 -->
    ${renderCategoryHeader({
      tag: 'TRADITIONAL COMPREHENSIVE',
      title: '마보살 정통 종합 사주 감정',
      description: '사주 원국 4주 8자, 일간의 본질, 오행 강약과 용신을 정밀 분석하고, 인생의 사계절과 시기별 대운의 기운을 밝혀 현실 솔루션을 제공합니다.',
      highlights: ['정통 명리 13~29개 전수 섹션', '사주 원국 시각화 차트', '현실 고민 1:1 맞춤 처방'],
    })}

    <!-- 4대 정밀 감정 상품 리스트 (홈화면과 100% 동일한 카드 및 버튼 구성) -->
    <div class="landing-product-list" style="display: flex; flex-direction: column; gap: 0.95rem; max-width: 900px; margin: 0 auto 3rem;">
      ${renderSajuShowcaseCards(CORE_SAJU_CARDS)}
    </div>

    <!-- ⑤ 5대 운세 특화 상품군 (마보살 5대 특화 운세 리포트) -->
    <div style="width: 100%; max-width: 900px; margin: 0 auto 3rem; text-align: left;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.85rem;">
        <div>
          <span style="font-size: 0.72rem; color: var(--primary); font-weight: 700; letter-spacing: 0.05em;">SPECIALIZED THEMATIC</span>
          <h2 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0.15rem 0 0 0;">
            마보살 5대 특화 운세 리포트
          </h2>
        </div>
        <a href="/store" data-nav="/store" class="btn-goto-store" style="font-size: 0.8rem; font-weight: 700; color: var(--primary); text-decoration: none; display: flex; align-items: center; gap: 0.2rem; cursor: pointer;">스토어 전체보기 →</a>
      </div>

      <div class="landing-product-list" style="display: flex; flex-direction: column; gap: 0.95rem;">
        ${renderSajuShowcaseCards(SPECIALIZED_REPORT_CARDS)}
      </div>
    </div>

    <!-- 비교표 섹션 -->
    <section style="width: 100%; max-width: 900px; margin: 0 auto 3rem; background: rgba(18, 22, 34, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 1.5rem; overflow-x: auto; box-sizing: border-box;">
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
