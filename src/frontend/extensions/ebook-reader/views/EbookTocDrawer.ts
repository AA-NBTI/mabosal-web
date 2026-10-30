import { EbookBookMetadata } from '../types.js';
import { getCurrentPageNumber, isReaderTocOpen, isEbookFullAccessAllowed } from '../reader-state.js';

export function renderEbookTocDrawer(book: EbookBookMetadata): string {
  const isOpen = isReaderTocOpen();
  const currentPage = getCurrentPageNumber();
  const isFullAccess = isEbookFullAccessAllowed(book.id);

  return `
    <!-- 목차 슬라이딩 오버레이 백드롭 -->
    <div id="ebook-toc-backdrop" class="ebook-toc-backdrop ${isOpen ? 'active' : ''}" style="
      position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(4px);
      z-index: 1000; opacity: ${isOpen ? '1' : '0'}; pointer-events: ${isOpen ? 'auto' : 'none'};
      transition: opacity 0.25s ease;
    "></div>

    <!-- 목차 슬라이딩 서랍 (Drawer) -->
    <aside id="ebook-toc-drawer" class="ebook-toc-drawer ${isOpen ? 'open' : ''}" style="
      position: fixed; top: 0; left: 0; bottom: 0; width: 340px; max-width: 85vw;
      background: var(--pdf-drawer-bg); border-right: 1px solid var(--pdf-border);
      z-index: 1001; transform: translateX(${isOpen ? '0' : '-100%'});
      transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex; flex-direction: column; box-shadow: 12px 0 32px rgba(0,0,0,0.5);
    ">
      <!-- 서랍 상단 헤더 -->
      <div style="padding: 1.25rem 1.25rem 1rem; border-bottom: 1px solid var(--pdf-border); display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span style="font-size: 0.72rem; color: var(--pdf-accent); font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">
            ${book.volumeLabel} · PAGE INDEX
          </span>
          <h4 style="margin: 0.2rem 0 0; font-size: 1.05rem; font-weight: 800; color: var(--pdf-text); line-height: 1.3;">
            ${book.title}
          </h4>
          <div style="font-size: 0.75rem; color: var(--pdf-muted); margin-top: 0.2rem;">
            전 ${book.totalPageCount}페이지 고밀도 마스터 조견표
          </div>
        </div>
        <button type="button" class="btn-close-ebook-toc" style="
          background: rgba(255,255,255,0.06); border: 1px solid var(--pdf-border);
          color: var(--pdf-text); width: 32px; height: 32px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
        ">
          <span class="material-symbols-outlined" style="font-size: 18px;">close</span>
        </button>
      </div>

      <!-- 페이지 리스트 -->
      <div style="flex: 1; overflow-y: auto; padding: 0.75rem;">
        <ul style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.35rem;">
          ${book.pages.map(p => {
            const isCurrent = p.pageNumber === currentPage;
            return `
              <li>
                <button type="button" class="btn-ebook-page-jump" data-page="${p.pageNumber}" style="
                  width: 100%; text-align: left; padding: 0.65rem 0.8rem; border-radius: 6px;
                  background: ${isCurrent ? 'var(--pdf-active-bg)' : 'transparent'};
                  border: 1px solid ${isCurrent ? 'var(--pdf-accent)' : 'transparent'};
                  color: ${isCurrent ? 'var(--pdf-accent)' : 'var(--pdf-text)'};
                  cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
                  transition: all 0.15s ease;
                ">
                  <div style="min-width: 0; display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 0.72rem; font-family: monospace; font-weight: 700; width: 28px; color: ${isCurrent ? 'var(--pdf-accent)' : 'var(--pdf-muted)'};">
                      ${p.pageLabel}
                    </span>
                    <span style="font-size: 0.84rem; font-weight: ${isCurrent ? '700' : '500'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      ${p.title || p.runningHead}
                    </span>
                  </div>
                  <div style="flex-shrink: 0;">
                    ${p.isFreePreview || isFullAccess
                      ? `<span style="font-size: 0.65rem; background: ${isFullAccess ? 'rgba(59, 130, 246, 0.15)' : 'rgba(74, 222, 128, 0.15)'}; color: ${isFullAccess ? '#60a5fa' : '#4ade80'}; padding: 0.05rem 0.35rem; border-radius: 3px; font-weight: 700;">${isFullAccess ? '완결본' : '무료'}</span>`
                      : `<span class="material-symbols-outlined" style="font-size: 14px; color: var(--pdf-muted);" title="정식 구매 후 열람">lock</span>`
                    }
                  </div>
                </button>
              </li>
            `;
          }).join('')}
        </ul>
      </div>

      <!-- 서랍 하단 푸터 -->
      <div style="padding: 0.85rem 1.25rem; border-top: 1px solid var(--pdf-border); background: rgba(0,0,0,0.15); display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem;">
        <span style="color: var(--pdf-muted);">저자: ${book.author}</span>
        <a href="/store" data-nav="/store" style="color: var(--pdf-accent); text-decoration: none; font-weight: 700;">스토어 가기 →</a>
      </div>
    </aside>
  `;
}
