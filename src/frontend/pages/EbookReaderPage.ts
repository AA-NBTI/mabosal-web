import { PageModule, PageContext } from './types.js';
import {
  renderEbookReaderView,
  bindEbookReaderEvents,
  setCurrentBookId,
  setCurrentPageNumber,
} from '../extensions/ebook-reader/index.js';
import { navigateTo } from '../modules/router/index.js';

export const EbookReaderPage: PageModule = {
  id: 'ebook-reader',
  render(ctx: PageContext): string {
    // URL 파라미터에서 bookId 또는 page/chapter 추출하여 상태 동기화
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const targetBookId = ctx.params?.bookId || urlParams?.get('bookId');
    if (targetBookId) {
      setCurrentBookId(targetBookId);
    }

    const fromParam = ctx.params?.from || urlParams?.get('from');
    const pageParam = ctx.params?.page || ctx.params?.chapter || urlParams?.get('page') || urlParams?.get('chapter');
    if (pageParam) {
      const pageNum = parseInt(pageParam, 10);
      if (!isNaN(pageNum) && pageNum >= 1) {
        setCurrentPageNumber(pageNum);
      }
    } else if (fromParam === 'store') {
      // 스토어 미리보기 진입 시 이전 열람 기록과 상관없이 매번 1페이지부터 시작
      setCurrentPageNumber(1);
    }

    return renderEbookReaderView();
  },
  onMount(container: HTMLElement, ctx: PageContext): void {
    const syncState = () => {
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const targetBookId = ctx.params?.bookId || urlParams?.get('bookId');
      if (targetBookId) {
        setCurrentBookId(targetBookId);
      }
      const fromParam = ctx.params?.from || urlParams?.get('from');
      const pageParam = ctx.params?.page || ctx.params?.chapter || urlParams?.get('page') || urlParams?.get('chapter');
      if (pageParam) {
        const pageNum = parseInt(pageParam, 10);
        if (!isNaN(pageNum) && pageNum >= 1) {
          setCurrentPageNumber(pageNum);
        }
      } else if (fromParam === 'store') {
        setCurrentPageNumber(1);
      }
    };

    syncState();
    const renderApp = () => {
      // 🌟 renderApp 호출 시에는 현재 선택된 페이지 상태를 보존하고 재초기화하지 않음!
      container.innerHTML = renderEbookReaderView();
      bindEbookReaderEvents(renderApp, (path) => navigateTo(path));
    };
    bindEbookReaderEvents(renderApp, (path) => navigateTo(path));
  },
};
