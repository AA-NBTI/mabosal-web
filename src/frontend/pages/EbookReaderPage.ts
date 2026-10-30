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
    if (ctx.params?.bookId) {
      setCurrentBookId(ctx.params.bookId);
    }
    const pageParam = ctx.params?.page || ctx.params?.chapter;
    if (pageParam) {
      const pageNum = parseInt(pageParam, 10);
      if (!isNaN(pageNum) && pageNum >= 1) {
        setCurrentPageNumber(pageNum);
      }
    }
    return renderEbookReaderView();
  },
  onMount(container: HTMLElement, ctx: PageContext): void {
    const renderApp = () => {
      container.innerHTML = renderEbookReaderView();
      bindEbookReaderEvents(renderApp, (path) => navigateTo(path));
    };
    bindEbookReaderEvents(renderApp, (path) => navigateTo(path));
  },
};
