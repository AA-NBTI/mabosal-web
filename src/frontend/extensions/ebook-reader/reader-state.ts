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
  if (typeof window !== 'undefined') {
    const searchParams = new URLSearchParams(window.location.search);
    const bId = searchParams.get('bookId');
    if (bId) {
      if (bId !== currentBookId) {
        currentBookId = bId;
        currentPageNumber = 1;
      }
      return bId;
    }
  }
  return currentBookId;
}

export function setCurrentBookId(bookId: string): void {
  if (!bookId) return;
  if (currentBookId !== bookId) {
    currentBookId = bookId;
    currentPageNumber = 1;
  }
}

export function getCurrentPageNumber(): number {
  return currentPageNumber;
}

export function setCurrentPageNumber(page: number): void {
  const isFull = isEbookFullAccessAllowed(currentBookId);
  if (!isFull && page > 3) {
    currentPageNumber = 3;
  } else {
    currentPageNumber = Math.max(1, page);
  }
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(
        STORAGE_KEY_LAST_PAGE,
        JSON.stringify({ bookId: currentBookId, page: currentPageNumber, timestamp: Date.now() })
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
 * 뷰어 접근 경로 판별:
 * - 'admin': 관리자 대시보드 (컨텐츠 > 전자책 디지털 도서관)
 * - 'dashboard': 구매자 대시보드 (마이페이지 구매내역)
 * - 'store': 스토어 상품 상세페이지 (미리보기)
 */
export function getReaderAccessSource(): 'admin' | 'dashboard' | 'store' {
  if (typeof window !== 'undefined') {
    const from = new URLSearchParams(window.location.search).get('from');
    if (from === 'admin') return 'admin';
    if (from === 'dashboard' || from === 'mypage') return 'dashboard';
  }
  return 'store';
}

/**
 * 현재 로그인한 사용자가 해당 전자책을 정식 결제/소장하고 있는지 검증
 */
export function isUserEbookOwner(bookId: string): boolean {
  try {
    const orders = getMyStoreOrders();
    return orders.some(o => {
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
  } catch (err) {
    console.warn('[EbookReader] owner check error:', err);
    return false;
  }
}

/**
 * 이용자/관리자의 전자책 완결본(전체 22페이지) 열람 권한 확인
 * 
 * [핵심 규칙]
 * 1. 스토어 상품 상세(from=store)에서는 구매자 및 관리자라도 3페이지 이상 열람 불가 (미리보기 모드 고정)
 * 2. 관리자는 관리자 대시보드(from=admin) 영역에서만 전 페이지 검수 열람 가능
 * 3. 구매자는 구매자 대시보드(from=dashboard) 영역에서만 전 페이지 완결본 열람 가능
 */
export function isEbookFullAccessAllowed(bookId: string): boolean {
  const source = getReaderAccessSource();

  // 규칙 1: 스토어 상품 영역에서는 무조건 3페이지까지만 미리보기 허용 (구매자도 3p 초과 차단)
  if (source === 'store') {
    return false;
  }

  // 규칙 2: 관리자 대시보드 영역에서 진입한 경우
  if (source === 'admin') {
    const user = AuthService.getCurrentUser();
    return !!(user && user.role === 'admin');
  }

  // 규칙 3: 구매자 대시보드 영역에서 진입한 경우
  if (source === 'dashboard') {
    return isUserEbookOwner(bookId);
  }

  return false;
}
