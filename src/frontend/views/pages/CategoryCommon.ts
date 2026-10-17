/**
 * Category Pages Common UI Components
 * - Breadcrumbs
 * - Category Quick Tab Bar
 * - Category Page Header
 * - Category SEO FAQ Accordion
 */

export interface CategoryTabItem {
  id: string;
  path: string;
  label: string;
  icon: string;
  badge?: string;
}

export const CATEGORY_TABS: CategoryTabItem[] = [
  { id: 'saju', path: '/saju', label: '종합 사주', icon: 'explore', badge: '인기' },
  { id: 'fortune', path: '/fortune', label: '2027 신년운', icon: 'calendar_today', badge: '신규' },
  { id: 'career', path: '/career', label: '직장·이직운', icon: 'work' },
  { id: 'wealth', path: '/wealth', label: '재물·투자운', icon: 'payments' },
  { id: 'love', path: '/love', label: '연애·궁합', icon: 'favorite' },
  { id: 'calendar', path: '/calendar', label: '마기·길일 달력', icon: 'event_busy' },
  { id: 'store', path: '/store', label: '스토어', icon: 'storefront' },
  { id: 'study', path: '/study', label: '스터디 허브', icon: 'menu_book' },
];

/**
 * 카테고리 상단 탭 내비게이션 바
 */
export function renderCategoryNavTabs(currentActiveId: string): string {
  return `
  <div class="category-tabs-container" style="width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; padding: 0.5rem 0 1.25rem; margin-bottom: 1.5rem; scrollbar-width: none;">
    <div style="display: flex; gap: 0.55rem; min-width: max-content; padding: 0 0.25rem;">
      <a href="/" class="cat-tab-btn ${currentActiveId === 'home' ? 'active' : ''}" data-nav="/" style="text-decoration: none;">
        <span class="material-symbols-outlined" style="font-size: 16px;">home</span>
        홈
      </a>
      ${CATEGORY_TABS.map(tab => {
        const isActive = tab.id === currentActiveId;
        return `
        <a href="${tab.path}" class="cat-tab-btn ${isActive ? 'active' : ''}" data-nav="${tab.path}" style="text-decoration: none;">
          <span class="material-symbols-outlined" style="font-size: 16px;">${tab.icon}</span>
          ${tab.label}
          ${tab.badge ? `<span class="cat-tab-badge">${tab.badge}</span>` : ''}
        </a>
        `;
      }).join('')}
    </div>
  </div>
  `;
}

/**
 * 브레드크럼 (홈 > 대분류 > 현재 페이지)
 */
export function renderBreadcrumbs(items: { label: string; path?: string }[]): string {
  return `
  <nav aria-label="브레드크럼" style="margin-bottom: 1rem; font-size: 0.78rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
    <a href="/" data-nav="/" style="color: var(--text-muted); text-decoration: none; display: flex; align-items: center; gap: 0.2rem;">
      <span class="material-symbols-outlined" style="font-size: 14px;">home</span>
      홈
    </a>
    ${items.map((item, idx) => {
      const isLast = idx === items.length - 1;
      return `
      <span style="opacity: 0.4;">/</span>
      ${isLast || !item.path ? `
        <span style="color: var(--primary); font-weight: 600;" aria-current="page">${item.label}</span>
      ` : `
        <a href="${item.path}" data-nav="${item.path}" style="color: var(--text-muted); text-decoration: none;">${item.label}</a>
      `}
      `;
    }).join('')}
  </nav>
  `;
}

/**
 * 카테고리 헤더 섹션 (H1, 뱃지, 설명, 주요 특장점 태그)
 */
export function renderCategoryHeader(props: {
  tag: string;
  title: string;
  description: string;
  highlights: string[];
}): string {
  return `
  <header class="category-page-header" style="text-align: center; margin-bottom: 2.25rem;">
    <div style="display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 9999px; padding: 0.25rem 0.85rem; font-size: 0.78rem; font-weight: 700; color: var(--primary); margin-bottom: 0.85rem; letter-spacing: 0.05em;">
      ${props.tag}
    </div>
    <h1 style="font-size: 1.85rem; font-weight: 800; color: #ffffff; margin: 0 0 0.85rem; line-height: 1.35; letter-spacing: -0.01em;">
      ${props.title}
    </h1>
    <p style="font-size: 0.95rem; color: #a1a1aa; line-height: 1.6; max-width: 650px; margin: 0 auto 1.35rem;">
      ${props.description}
    </p>
    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 0.6rem;">
      ${props.highlights.map(hl => `
        <span style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 6px; padding: 0.3rem 0.65rem; font-size: 0.8rem; color: #e2e8f0; display: inline-flex; align-items: center; gap: 0.3rem;">
          <span class="material-symbols-outlined" style="font-size: 15px; color: var(--primary);">check_circle</span>
          ${hl}
        </span>
      `).join('')}
    </div>
  </header>
  `;
}

/**
 * SEO 검색 친화적 FAQ 아코디언 섹션
 */
export function renderCategoryFaq(faqs: { question: string; answer: string }[]): string {
  return `
  <section class="category-faq-section" style="margin-top: 3.5rem; padding-top: 2rem; border-top: 1px solid rgba(255, 255, 255, 0.08);">
    <div style="text-align: center; margin-bottom: 1.75rem;">
      <span style="font-size: 0.75rem; color: var(--primary); font-weight: 700; letter-spacing: 0.05em;">FAQ</span>
      <h2 style="font-size: 1.3rem; font-weight: 800; color: #fff; margin: 0.2rem 0 0.4rem;">
        자주 묻는 질문
      </h2>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
        궁금하신 점을 빠르게 확인해 보세요.
      </p>
    </div>
    <div style="display: flex; flex-direction: column; gap: 0.85rem; max-width: 760px; margin: 0 auto;">
      ${faqs.map((faq, i) => `
        <details style="background: rgba(24, 28, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 1rem 1.25rem; cursor: pointer; transition: background 0.2s ease;">
          <summary style="font-size: 0.95rem; font-weight: 700; color: #ffffff; display: flex; justify-content: space-between; align-items: center; list-style: none;">
            <span style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="color: var(--primary); font-weight: 800;">Q.</span>
              ${faq.question}
            </span>
            <span class="material-symbols-outlined" style="font-size: 18px; color: var(--text-muted);">expand_more</span>
          </summary>
          <div style="margin-top: 0.85rem; font-size: 0.88rem; color: #cbd5e1; line-height: 1.65; border-top: 1px dashed rgba(255, 255, 255, 0.06); padding-top: 0.75rem;">
            ${faq.answer}
          </div>
        </details>
      `).join('')}
    </div>
  </section>
  `;
}
