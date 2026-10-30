import { EbookReaderTheme, EbookReaderSettings } from './types.js';
import { AuthService } from '../../state/auth-service.js';
import { getMyStoreOrders } from '../commerce-store/store-service.js';

const STORAGE_KEY_SETTINGS = 'mm_ebook_paper_settings';
const STORAGE_KEY_LAST_PAGE = 'mm_ebook_last_page';

let currentBookId: string = 'book-saju-principles-vol1';
let currentPageNumber: number = 1;
let isTocOpen: boolean = false;

let settings: EbookReaderSettings = {
  theme: 'paper', // 고서 한지 미색 테마 기본
  zoomLevel: 100, // 100%
};

if (typeof localStorage !== 'undefined') {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (saved) {
      settings = { ...settings, ...JSON.parse(saved) };
    }
  } catch {}
}

export function getReaderSettings(): EbookReaderSettings {
  return { ...settings };
}

export function updateReaderSettings(updates: Partial<EbookReaderSettings>): void {
  settings = { ...settings, ...updates };
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {}
  }
}

export function getCurrentBookId(): string {
  return currentBookId;
}

export function setCurrentBookId(bookId: string): void {
  currentBookId = bookId;
}

export function getCurrentPageNumber(): number {
  return currentPageNumber;
}

export function setCurrentPageNumber(page: number): void {
  currentPageNumber = page;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(
        STORAGE_KEY_LAST_PAGE,
        JSON.stringify({ bookId: currentBookId, page, timestamp: Date.now() })
      );
    } catch {}
  }
}

export function isReaderTocOpen(): boolean {
  return isTocOpen;
}

export function setReaderTocOpen(open: boolean): void {
  isTocOpen = open;
}

export function toggleReaderToc(): void {
  isTocOpen = !isTocOpen;
}

/**
 * 이용자/관리자의 전자책 완결본(전체 22페이지) 열람 권한 확인
 */
export function isEbookFullAccessAllowed(bookId: string): boolean {
  const user = AuthService.getCurrentUser();
  // 1. 최고 관리자는 전 페이지 프리패스
  if (user && user.role === 'admin') {
    return true;
  }

  // 2. 이용자의 스토어 결제 내역 확인
  try {
    const orders = getMyStoreOrders();
    const hasPaid = orders.some(o => {
      if (o.status !== 'completed') return false;
      const orderProdId = o.productId;
      if (orderProdId === bookId) return true;
      if (bookId === 'book-saju-self-guide' && (orderProdId === 'prod-ebook-saju-self-guide' || orderProdId.includes('self-guide'))) return true;
      if (bookId === 'prod-ebook-saju-self-guide' && (orderProdId === 'book-saju-self-guide' || orderProdId.includes('self-guide'))) return true;
      if (bookId === 'book-saju-principles-vol1' && (orderProdId === 'book-saju-principles-vol1' || o.orderId === 'ORD-MVOK8OJZ-4CO')) return true;
      if (bookId === 'book-saju-principles-vol2' && orderProdId === 'book-saju-principles-vol2') return true;
      if (bookId === 'book-saju-principles-vol3' && orderProdId === 'book-saju-principles-vol3') return true;
      if (bookId === 'book-saju-principles-vol4' && orderProdId === 'book-saju-principles-vol4') return true;
      if (o.items && Array.isArray(o.items)) {
        return o.items.some((it: any) => it.productId === bookId || (bookId.includes('self-guide') && it.productId?.includes('self-guide')));
      }
      return false;
    });
    if (hasPaid) {
      return true;
    }
  } catch (err) {
    console.warn('[EbookReader] permission check error:', err);
  }

  return false;
}
