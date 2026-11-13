import { PageModule, PageContext } from './types.js';
import { navigateTo } from '../modules/router/index.js';

type EbookReaderModule = typeof import('../extensions/ebook-reader/index.js');

let cachedReaderMod: EbookReaderModule | null = null;
let readerLoadPromise: Promise<void> | null = null;

function syncReaderState(mod: EbookReaderModule, ctx: PageContext): void {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const targetBookId = ctx.params?.bookId || urlParams?.get('bookId');
  if (targetBookId) {
    mod.setCurrentBookId(targetBookId);
  }

  const fromParam = ctx.params?.from || urlParams?.get('from');
  const pageParam = ctx.params?.page || ctx.params?.chapter || urlParams?.get('page') || urlParams?.get('chapter');
  if (pageParam) {
    const pageNum = parseInt(pageParam, 10);
    if (!isNaN(pageNum) && pageNum >= 1) {
      mod.setCurrentPageNumber(pageNum);
    }
  } else if (fromParam === 'store') {
    mod.setCurrentPageNumber(1);
  }
}

export const EbookReaderPage: PageModule = {
  id: 'ebook-reader',
  render(ctx: PageContext): string {
    if (cachedReaderMod) {
      syncReaderState(cachedReaderMod, ctx);
      return cachedReaderMod.renderEbookReaderView();
    }
    return `
      <div style="min-height: 60vh; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 0.95rem;">
        전자책 뷰어를 불러오는 중입니다...
      </div>
    `;
  },
  onMount(container: HTMLElement, ctx: PageContext): void {
    const mountWithMod = (mod: EbookReaderModule) => {
      syncReaderState(mod, ctx);
      const renderApp = () => {
        container.innerHTML = mod.renderEbookReaderView();
        mod.bindEbookReaderEvents(renderApp, (path) => navigateTo(path));
      };
      renderApp();
    };

    if (cachedReaderMod) {
      mountWithMod(cachedReaderMod);
      return;
    }

    if (!readerLoadPromise) {
      readerLoadPromise = import('../extensions/ebook-reader/index.js')
        .then(mod => {
          cachedReaderMod = mod;
        })
        .catch(err => {
          console.error('[EbookReaderPage] Failed to load ebook-reader:', err);
        })
        .finally(() => {
          readerLoadPromise = null;
        });
    }

    void readerLoadPromise.then(() => {
      if (cachedReaderMod) {
        mountWithMod(cachedReaderMod);
      }
    });
  },
};
