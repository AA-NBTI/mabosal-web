import { EbookBookMetadata, EbookPage, EbookReaderTheme } from '../types.js';
import {
  getCurrentBookId,
  getCurrentPageNumber,
  getReaderSettings,
  isEbookFullAccessAllowed,
} from '../reader-state.js';
import { getEbookById, getEbookPage } from '../ebook-registry.js';
import { renderEbookTocDrawer } from './EbookTocDrawer.js';
import { AuthService } from '../../../state/auth-service.js';

export function renderEbookReaderView(): string {
  const bookId = getCurrentBookId();
  const book = getEbookById(bookId);

  if (!book) {
    return `
      <div style="min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #cbd5e1; text-align: center; padding: 2rem;">
        <span class="material-symbols-outlined" style="font-size: 48px; color: #f87171; margin-bottom: 1rem;">menu_book</span>
        <h2 style="font-size: 1.35rem; color: #fff; margin: 0 0 0.5rem;">요청하신 전자책을 찾을 수 없습니다.</h2>
        <a href="/store" data-nav="/store" class="btn-cta-primary" style="padding: 0.65rem 1.5rem; text-decoration: none; border-radius: 8px;">스토어로 돌아가기</a>
      </div>
    `;
  }

  const currentPageNum = getCurrentPageNumber();
  const page: EbookPage = getEbookPage(bookId, currentPageNum) || book.pages[0];
  const settings = getReaderSettings();

  const totalPages = book.totalPageCount;
  const hasPrev = page.pageNumber > 1;
  const hasNext = page.pageNumber < totalPages;

  const isFullAccess = isEbookFullAccessAllowed(bookId);
  const isPageLocked = !page.isFreePreview && !isFullAccess;

  const currentUser = AuthService.getCurrentUser();
  const isAdmin = currentUser && currentUser.role === 'admin';

  const themeVars = getThemeVariables(settings.theme);
  const zoomScale = settings.zoomLevel / 100;

  // 권한 뱃지 라벨
  let authBadge = '';
  if (isAdmin) {
    authBadge = `<span style="font-size: 0.74rem; background: rgba(59, 130, 246, 0.18); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.35); padding: 0.2rem 0.55rem; border-radius: 9999px; font-weight: 700; display: inline-flex; align-items: center; gap: 0.25rem;">
      <span class="material-symbols-outlined" style="font-size: 14px;">admin_panel_settings</span>
      관리자 검수 모드 (전 ${totalPages}p)
    </span>`;
  } else if (isFullAccess) {
    authBadge = `<span style="font-size: 0.74rem; background: rgba(34, 197, 94, 0.18); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.35); padding: 0.2rem 0.55rem; border-radius: 9999px; font-weight: 700; display: inline-flex; align-items: center; gap: 0.25rem;">
      <span class="material-symbols-outlined" style="font-size: 14px;">verified</span>
      정식 소장 회원 (전 ${totalPages}p 완결본)
    </span>`;
  } else {
    authBadge = `<span style="font-size: 0.74rem; background: rgba(242, 202, 80, 0.18); color: var(--primary); border: 1px solid rgba(242, 202, 80, 0.35); padding: 0.2rem 0.55rem; border-radius: 9999px; font-weight: 700; display: inline-flex; align-items: center; gap: 0.25rem;">
      <span class="material-symbols-outlined" style="font-size: 14px;">visibility</span>
      무료 미리보기 (01~03p)
    </span>`;
  }

  return `
  <!-- 방법 A: 실제 원본 PDF 고화질 1:1 이미지 매핑 A4 리더 -->
  <div class="ebook-paper-reader-wrapper theme-${settings.theme}" style="
    ${themeVars}
    min-height: 100vh;
    background: var(--pdf-canvas-bg);
    color: var(--pdf-text);
    display: flex;
    flex-direction: column;
    position: relative;
    user-select: none;
    -webkit-user-select: none;
  ">
    <!-- 목차 서랍 패널 -->
    ${renderEbookTocDrawer(book)}

    <!-- [상단 고정 툴바] PDF 뷰어 조작 컨트롤 -->
    <header class="ebook-paper-toolbar" style="
      position: sticky; top: 0; left: 0; right: 0;
      background: var(--pdf-toolbar-bg);
      border-bottom: 1px solid var(--pdf-border);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      z-index: 100; padding: 0.55rem 1rem;
      display: flex; align-items: center; justify-content: space-between;
      gap: 0.75rem; box-sizing: border-box; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    ">
      <!-- 좌측: 뒤로가기 & 목차 & 권한 뱃지 -->
      <div style="display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0;">
        <button type="button" class="btn-ebook-back" title="스토어로 돌아가기" style="
          background: rgba(255,255,255,0.06); border: 1px solid var(--pdf-border);
          color: var(--pdf-text); width: 34px; height: 34px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
        ">
          <span class="material-symbols-outlined" style="font-size: 18px;">arrow_back</span>
        </button>
        <button type="button" class="btn-ebook-open-toc" title="전체 목차 열기" style="
          background: rgba(255,255,255,0.06); border: 1px solid var(--pdf-border);
          color: var(--pdf-text); height: 34px; padding: 0 0.75rem; border-radius: 6px;
          display: flex; align-items: center; gap: 0.35rem; font-size: 0.82rem; font-weight: 700; cursor: pointer;
        ">
          <span class="material-symbols-outlined" style="font-size: 18px; color: var(--pdf-accent);">auto_stories</span>
          <span>목차 (${totalPages}p)</span>
        </button>
        <div class="reader-auth-badge" style="display: flex; align-items: center;">
          ${authBadge}
        </div>
      </div>

      <!-- 중앙: 페이지 넘김 & 인덱스 (실제 PDF 뷰어 핵심) -->
      <div style="display: flex; align-items: center; gap: 0.6rem; justify-content: center;">
        <button type="button" class="btn-ebook-page-prev" ${!hasPrev ? 'disabled' : ''} title="이전 페이지 (◀ 방향키)" style="
          background: rgba(255,255,255,0.08); border: 1px solid var(--pdf-border);
          color: ${hasPrev ? 'var(--pdf-text)' : 'var(--pdf-muted)'};
          width: 32px; height: 32px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          cursor: ${hasPrev ? 'pointer' : 'not-allowed'}; opacity: ${hasPrev ? '1' : '0.4'};
        ">
          <span class="material-symbols-outlined" style="font-size: 18px;">chevron_left</span>
        </button>

        <div style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.88rem; font-family: monospace; font-weight: 700;">
          <input type="number" id="input-jump-page" value="${page.pageNumber}" min="1" max="${totalPages}" style="
            width: 38px; height: 28px; text-align: center; background: rgba(0,0,0,0.3);
            border: 1px solid var(--pdf-border); color: var(--pdf-accent); border-radius: 4px;
            font-size: 0.88rem; font-weight: 800; font-family: monospace;
          " />
          <span style="color: var(--pdf-muted);">/ ${totalPages} p</span>
        </div>

        <button type="button" class="btn-ebook-page-next" ${!hasNext ? 'disabled' : ''} title="다음 페이지 (▶ 방향키)" style="
          background: rgba(255,255,255,0.08); border: 1px solid var(--pdf-border);
          color: ${hasNext ? 'var(--pdf-text)' : 'var(--pdf-muted)'};
          width: 32px; height: 32px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          cursor: ${hasNext ? 'pointer' : 'not-allowed'}; opacity: ${hasNext ? '1' : '0.4'};
        ">
          <span class="material-symbols-outlined" style="font-size: 18px;">chevron_right</span>
        </button>
      </div>

      <!-- 우측: 줌 및 용지 테마 컨트롤 -->
      <div style="display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0;">
        <!-- 화면 배율 (Zoom) -->
        <div style="display: flex; align-items: center; background: rgba(255,255,255,0.06); border: 1px solid var(--pdf-border); border-radius: 6px; overflow: hidden;">
          <button type="button" class="btn-ebook-zoom" data-zoom="out" title="축소" style="
            background: none; border: none; color: var(--pdf-text); width: 28px; height: 32px; cursor: pointer; font-size: 0.9rem; font-weight: bold;
          ">-</button>
          <span style="font-size: 0.72rem; color: var(--pdf-muted); padding: 0 0.2rem; font-family: monospace;">${settings.zoomLevel}%</span>
          <button type="button" class="btn-ebook-zoom" data-zoom="in" title="확대" style="
            background: none; border: none; color: var(--pdf-text); width: 28px; height: 32px; cursor: pointer; font-size: 0.9rem; font-weight: bold;
          ">+</button>
        </div>

        <!-- 배경 테마 전환 -->
        <button type="button" class="btn-ebook-paper-theme" title="배경 색상 변경" style="
          background: rgba(255,255,255,0.06); border: 1px solid var(--pdf-border);
          color: var(--pdf-accent); height: 32px; padding: 0 0.6rem; border-radius: 6px;
          display: flex; align-items: center; gap: 0.3rem; cursor: pointer; font-size: 0.76rem; font-weight: 700;
        ">
          <span class="material-symbols-outlined" style="font-size: 16px;">palette</span>
          <span>${settings.theme === 'paper' ? '한지 미색' : (settings.theme === 'dark' ? '다크 잉크' : '순백지')}</span>
        </button>
      </div>
    </header>

    <!-- [중앙 A4 실물 페이퍼 워크스페이스] -->
    <div class="ebook-paper-workspace" style="
      flex: 1; display: flex; align-items: center; justify-content: center;
      padding: 2rem 1rem 3.5rem; overflow-x: auto; box-sizing: border-box; position: relative;
    ">
      <!-- 좌측 부유 화살표 (이전 쪽) -->
      <button type="button" class="btn-ebook-page-prev floating-page-btn left" ${!hasPrev ? 'disabled' : ''} style="
        position: fixed; left: 1.5rem; top: 50%; transform: translateY(-50%);
        width: 48px; height: 48px; border-radius: 50%; background: rgba(0,0,0,0.65);
        border: 1.5px solid var(--pdf-border); color: #fff; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5); cursor: ${hasPrev ? 'pointer' : 'not-allowed'};
        opacity: ${hasPrev ? '0.85' : '0.15'}; transition: all 0.2s ease; z-index: 50;
      ">
        <span class="material-symbols-outlined" style="font-size: 26px;">arrow_back_ios_new</span>
      </button>

      <!-- 🌟 [실제 PDF 1:1 고화질 이미지 프레임 (A4 비율: 1:1.414)] -->
      <div class="ebook-a4-sheet" style="
        width: 100%;
        max-width: ${780 * zoomScale}px;
        background: #ffffff;
        box-shadow: 0 20px 60px rgba(0,0,0,0.55), 0 0 1px rgba(255,255,255,0.15);
        border-radius: 4px;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
      ">
        <!-- 책등 제본 그림자 효과 (좌측 옅은 섀도우) -->
        <div style="position: absolute; top: 0; left: 0; bottom: 0; width: 14px; background: linear-gradient(90deg, rgba(0,0,0,0.12), transparent); pointer-events: none; z-index: 10;"></div>

        <!-- 실제 PDF 원본 페이지 이미지 -->
        <img
          src="${page.imageUrl}"
          alt="${book.title} ${page.pageLabel} - ${page.title || ''}"
          style="
            width: 100%;
            height: auto;
            display: block;
            pointer-events: none;
            user-select: none;
            -webkit-user-drag: none;
            ${isPageLocked ? 'filter: blur(14px) brightness(0.85); transform: scale(1.02);' : ''}
            transition: filter 0.2s ease;
          "
        />

        <!-- 유료 페이지 잠금 오버레이 (미구매자 4p 이후 접근 시) -->
        ${isPageLocked ? `
          <div class="sheet-paywall-overlay" style="
            position: absolute; inset: 0;
            background: rgba(15, 23, 42, 0.82);
            backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            text-align: center; padding: 2rem; box-sizing: border-box; z-index: 20;
          ">
            <div style="width: 58px; height: 58px; border-radius: 50%; background: rgba(242, 202, 80, 0.15); border: 1.5px solid var(--pdf-accent); display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem; color: var(--pdf-accent);">
              <span class="material-symbols-outlined" style="font-size: 32px;">lock</span>
            </div>
            <h3 style="font-size: 1.35rem; font-weight: 900; color: #ffffff; margin: 0 0 0.6rem;">
              『${book.title}』 정식 완결본
            </h3>
            <p style="font-size: 0.92rem; color: #cbd5e1; max-width: 460px; line-height: 1.75; margin: 0 0 1.75rem;">
              현재 보고 계신 페이지(<strong>${page.pageLabel}: ${page.title || ''}</strong>)를 포함한 <strong>전 ${book.totalPageCount}페이지 고밀도 원본 완결본</strong>은 정식 구매 회원 및 최고 관리자에게 제공됩니다.
            </p>
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center;">
              <a href="/store?product=${book.storeProductId || book.id}" data-nav="/store?product=${book.storeProductId || book.id}" class="btn-cta-primary" style="
                background: var(--pdf-accent); color: #1e1e1e; font-weight: 900;
                padding: 0.8rem 1.75rem; border-radius: 8px; text-decoration: none; font-size: 0.92rem;
                box-shadow: 0 4px 16px rgba(242,202,80,0.3);
              ">
                완결본 열람권 구매 (${book.price.toLocaleString()}원)
              </a>
              <button type="button" class="btn-ebook-open-toc" style="
                background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2);
                color: #ffffff; font-weight: 700; padding: 0.8rem 1.25rem;
                border-radius: 8px; cursor: pointer; font-size: 0.9rem;
              ">
                무료 01~03p 목차 보기
              </button>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- 우측 부유 화살표 (다음 쪽) -->
      <button type="button" class="btn-ebook-page-next floating-page-btn right" ${!hasNext ? 'disabled' : ''} title="다음 페이지 (▶ 방향키)" style="
        position: fixed; right: 1.5rem; top: 50%; transform: translateY(-50%);
        width: 48px; height: 48px; border-radius: 50%; background: rgba(0,0,0,0.65);
        border: 1.5px solid var(--pdf-border); color: #fff; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5); cursor: ${hasNext ? 'pointer' : 'not-allowed'};
        opacity: ${hasNext ? '0.85' : '0.15'}; transition: all 0.2s ease; z-index: 50;
      ">
        <span class="material-symbols-outlined" style="font-size: 26px;">arrow_forward_ios</span>
      </button>
    </div>
  </div>
  `;
}

function getThemeVariables(theme: EbookReaderTheme): string {
  switch (theme) {
    case 'paper':
      return `
        --pdf-canvas-bg: #1c1916;
        --pdf-toolbar-bg: rgba(26, 23, 20, 0.94);
        --pdf-drawer-bg: #241f1a;
        --pdf-text: #e6dfd5;
        --pdf-muted: #9c9183;
        --pdf-border: rgba(255, 255, 255, 0.1);
        --pdf-accent: #d4a359;
        --pdf-active-bg: rgba(212, 163, 89, 0.15);
      `;
    case 'white':
      return `
        --pdf-canvas-bg: #22262e;
        --pdf-toolbar-bg: rgba(28, 32, 40, 0.95);
        --pdf-drawer-bg: #1a1e26;
        --pdf-text: #f1f5f9;
        --pdf-muted: #94a3b8;
        --pdf-border: rgba(255, 255, 255, 0.12);
        --pdf-accent: #38bdf8;
        --pdf-active-bg: rgba(56, 189, 248, 0.15);
      `;
    case 'dark':
    default:
      return `
        --pdf-canvas-bg: #0b0e14;
        --pdf-toolbar-bg: rgba(15, 19, 28, 0.94);
        --pdf-drawer-bg: #141822;
        --pdf-text: #e2e8f0;
        --pdf-muted: #8b949e;
        --pdf-border: rgba(255, 255, 255, 0.12);
        --pdf-accent: #f2ca50;
        --pdf-active-bg: rgba(242, 202, 80, 0.12);
      `;
  }
}
