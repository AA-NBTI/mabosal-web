/**
 * 전자책 인앱 웹 리더 (A4 페이퍼 시트 고정 판형) 확장 모듈 진입점
 */

export * from './types.js';
export * from './ebook-registry.js';
export * from './reader-state.js';
export * from './views/EbookReaderView.js';
export * from './views/EbookTocDrawer.js';

import {
  getCurrentBookId,
  getCurrentPageNumber,
  setCurrentPageNumber,
  toggleReaderToc,
  setReaderTocOpen,
  getReaderSettings,
  updateReaderSettings,
} from './reader-state.js';
import { getEbookById } from './ebook-registry.js';

let isKeyboardBound = false;

/**
 * 전자책 리더 내부 DOM 이벤트 바인딩
 */
export function bindEbookReaderEvents(renderApp: () => void, navigateTo?: (path: string) => void): void {
  const container = document.querySelector('.ebook-paper-reader-wrapper');
  if (!container) return;

  // 1. 불법 복제 방지 (우클릭 차단)
  container.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  // 2. 뒤로가기 버튼
  const backBtn = container.querySelector('.btn-ebook-back');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (navigateTo) {
        navigateTo('/store');
      } else {
        window.history.back();
      }
    });
  }

  // 3. 목차(TOC) 토글 버튼들
  const openTocBtns = container.querySelectorAll('.btn-ebook-open-toc');
  openTocBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleReaderToc();
      renderApp();
    });
  });

  const closeTocBtn = container.querySelector('.btn-close-ebook-toc');
  if (closeTocBtn) {
    closeTocBtn.addEventListener('click', () => {
      setReaderTocOpen(false);
      renderApp();
    });
  }

  const tocBackdrop = container.querySelector('#ebook-toc-backdrop');
  if (tocBackdrop) {
    tocBackdrop.addEventListener('click', () => {
      setReaderTocOpen(false);
      renderApp();
    });
  }

  // 4. 목차에서 특정 페이지로 바로 점프
  const jumpBtns = container.querySelectorAll('.btn-ebook-page-jump');
  jumpBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const pageNum = parseInt(btn.getAttribute('data-page') || '1', 10);
      setCurrentPageNumber(pageNum);
      setReaderTocOpen(false);
      renderApp();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // 5. 이전 쪽 / 다음 쪽 넘김 (상단 바 및 플로팅 버튼 공통)
  const prevBtns = container.querySelectorAll('.btn-ebook-page-prev');
  prevBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const current = getCurrentPageNumber();
      if (current > 1) {
        setCurrentPageNumber(current - 1);
        renderApp();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  const nextBtns = container.querySelectorAll('.btn-ebook-page-next');
  nextBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const current = getCurrentPageNumber();
      const book = getEbookById(getCurrentBookId());
      if (book && current < book.totalPageCount) {
        setCurrentPageNumber(current + 1);
        renderApp();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  // 6. 직접 쪽수 입력 점프 인풋
  const jumpInput = container.querySelector('#input-jump-page') as HTMLInputElement | null;
  if (jumpInput) {
    jumpInput.addEventListener('change', () => {
      const target = parseInt(jumpInput.value, 10);
      const book = getEbookById(getCurrentBookId());
      if (book && !isNaN(target) && target >= 1 && target <= book.totalPageCount) {
        setCurrentPageNumber(target);
        renderApp();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        jumpInput.value = String(getCurrentPageNumber());
      }
    });
    jumpInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        jumpInput.blur();
      }
    });
  }

  // 7. 배율 확대/축소 (Zoom)
  const zoomBtns = container.querySelectorAll('.btn-ebook-zoom');
  zoomBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = btn.getAttribute('data-zoom');
      const settings = getReaderSettings();
      const zoomLevels = [85, 100, 115];
      const curIdx = zoomLevels.indexOf(settings.zoomLevel);

      if (dir === 'in' && curIdx < zoomLevels.length - 1) {
        updateReaderSettings({ zoomLevel: zoomLevels[curIdx + 1] });
        renderApp();
      } else if (dir === 'out' && curIdx > 0) {
        updateReaderSettings({ zoomLevel: zoomLevels[curIdx - 1] });
        renderApp();
      }
    });
  });

  // 8. 용지 테마 전환 (Paper -> Dark -> White -> Paper)
  const themeBtn = container.querySelector('.btn-ebook-paper-theme');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const settings = getReaderSettings();
      const order: ('paper' | 'dark' | 'white')[] = ['paper', 'dark', 'white'];
      const curIdx = order.indexOf(settings.theme);
      const nextTheme = order[(curIdx + 1) % order.length];
      updateReaderSettings({ theme: nextTheme });
      renderApp();
    });
  }

  // 9. 키보드 방향키 책장 넘김 (1회만 등록)
  if (!isKeyboardBound && typeof window !== 'undefined') {
    isKeyboardBound = true;
    window.addEventListener('keydown', (e) => {
      // 뷰어가 활성화되어 있을 때만 반응
      const activeViewer = document.querySelector('.ebook-paper-reader-wrapper');
      if (!activeViewer) return;

      // 텍스트 인풋 포커스 중일 땐 방향키 기본 동작 유지
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        const cur = getCurrentPageNumber();
        if (cur > 1) {
          e.preventDefault();
          setCurrentPageNumber(cur - 1);
          renderApp();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        const cur = getCurrentPageNumber();
        const b = getEbookById(getCurrentBookId());
        if (b && cur < b.totalPageCount) {
          e.preventDefault();
          setCurrentPageNumber(cur + 1);
          renderApp();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });
  }
}
