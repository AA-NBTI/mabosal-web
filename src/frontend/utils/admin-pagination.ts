/**
 * 관리자 대시보드 공통 페이지네이션 유틸리티
 * - 10개 초과 리스트에 대해 10개 단위로 페이지 분할 및 이전/다음/번호 이동 UI를 제공한다.
 */

export const ADMIN_PAGE_SIZE = 10;

const adminPageState = new Map<string, number>();

export function getAdminListPage(listKey: string): number {
  return adminPageState.get(listKey) ?? 1;
}

export function setAdminListPage(listKey: string, page: number): void {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  adminPageState.set(listKey, safePage);
}

export function resetAdminListPages(): void {
  adminPageState.clear();
}

export interface PaginatedResult<T> {
  pagedItems: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

export function paginateAdminList<T>(
  listKey: string,
  items: T[],
  pageSize: number = ADMIN_PAGE_SIZE
): PaginatedResult<T> {
  const safeSize = Math.max(1, Math.floor(pageSize));
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safeSize));
  const requestedPage = getAdminListPage(listKey);
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  if (currentPage !== requestedPage) {
    adminPageState.set(listKey, currentPage);
  }
  const startIndex = (currentPage - 1) * safeSize;
  const pagedItems = items.slice(startIndex, startIndex + safeSize);

  return {
    pagedItems,
    currentPage,
    totalPages,
    totalItems,
    pageSize: safeSize,
  };
}

export function renderAdminPagination(
  listKey: string,
  currentPage: number,
  totalPages: number,
  totalItems: number,
  pageSize: number = ADMIN_PAGE_SIZE
): string {
  if (totalItems <= pageSize || totalPages <= 1) {
    return '';
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  const windowSize = 5;
  let startPage = Math.max(1, currentPage - Math.floor(windowSize / 2));
  let endPage = Math.min(totalPages, startPage + windowSize - 1);
  if (endPage - startPage + 1 < windowSize) {
    startPage = Math.max(1, endPage - windowSize + 1);
  }

  const pageNumbers: number[] = [];
  for (let p = startPage; p <= endPage; p++) {
    pageNumbers.push(p);
  }

  const btnBase =
    'border-radius: 6px; padding: 0.32rem 0.65rem; font-size: 0.78rem; font-weight: 700; transition: all 0.15s ease;';

  return `
    <div class="admin-pagination-bar" data-page-key="${listKey}" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; padding: 0.85rem 1rem; border-top: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.18);">
      <div style="font-size: 0.78rem; color: #94a3b8;">
        총 <strong style="color: #fff;">${totalItems}</strong>건 중 <strong style="color: var(--primary);">${startItem}-${endItem}</strong> 표시 (${currentPage} / ${totalPages} 페이지)
      </div>
      <div style="display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
        <button
          type="button"
          class="btn-admin-page"
          data-page-key="${listKey}"
          data-page="${Math.max(1, currentPage - 1)}"
          ${currentPage <= 1 ? 'disabled' : ''}
          style="${btnBase} background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.14); color: ${currentPage <= 1 ? '#475569' : '#e2e8f0'}; cursor: ${currentPage <= 1 ? 'not-allowed' : 'pointer'};"
        >
          이전
        </button>

        ${startPage > 1 ? `
          <button type="button" class="btn-admin-page" data-page-key="${listKey}" data-page="1" style="${btnBase} background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.14); color: #cbd5e1; cursor: pointer;">1</button>
          ${startPage > 2 ? `<span style="color: #64748b; font-size: 0.78rem; padding: 0 0.2rem;">…</span>` : ''}
        ` : ''}

        ${pageNumbers.map(p => {
          const isActive = p === currentPage;
          return `
            <button
              type="button"
              class="btn-admin-page"
              data-page-key="${listKey}"
              data-page="${p}"
              style="${btnBase} background: ${isActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}; border: 1px solid ${isActive ? 'var(--primary)' : 'rgba(255,255,255,0.14)'}; color: ${isActive ? '#1c1500' : '#cbd5e1'}; cursor: pointer;"
            >
              ${p}
            </button>
          `;
        }).join('')}

        ${endPage < totalPages ? `
          ${endPage < totalPages - 1 ? `<span style="color: #64748b; font-size: 0.78rem; padding: 0 0.2rem;">…</span>` : ''}
          <button type="button" class="btn-admin-page" data-page-key="${listKey}" data-page="${totalPages}" style="${btnBase} background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.14); color: #cbd5e1; cursor: pointer;">${totalPages}</button>
        ` : ''}

        <button
          type="button"
          class="btn-admin-page"
          data-page-key="${listKey}"
          data-page="${Math.min(totalPages, currentPage + 1)}"
          ${currentPage >= totalPages ? 'disabled' : ''}
          style="${btnBase} background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.14); color: ${currentPage >= totalPages ? '#475569' : '#e2e8f0'}; cursor: ${currentPage >= totalPages ? 'not-allowed' : 'pointer'};"
        >
          다음
        </button>
      </div>
    </div>
  `;
}

