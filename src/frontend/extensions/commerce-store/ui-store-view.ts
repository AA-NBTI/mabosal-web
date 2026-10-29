import { OrderAuthGuard } from '../../modules/order/order-auth-guard.js';
import { AuthService } from '../../state/auth-service.js';
    
/**
 * 마보살 인하우스 커머스 스토어 (고객 전용 쇼핑몰 뷰)
 * 팝업 없는 일반적인 쇼핑몰 구조: 좌측 카테고리 내비게이션 + 우측 상품 목록 및 상세/결제 워크스페이스
 */

import type { AppStateData } from '../../state/app-state.js';
import { extractSignalTags } from '../solution-hub/signal-adapter.js';
import {
  createStoreOrder,
  getStoreProductById,
  getStoreProductsByCategory,
  isProductAlreadyPurchased,
  STORE_CATEGORIES,
  getStoreCategories,
} from './store-service.js';
import type { StoreCategoryType, StoreOrder, StoreProduct } from './types.js';
import { CartStore } from '../../state/cart-store.js';
import { UserSajuStore } from '../../state/user-saju-store.js';
import { ProductReviewStore } from '../../state/product-review-store.js';

let currentCategory: StoreCategoryType = 'all';
let currentSelectedProductId: string | null = null;
let lastCreatedOrder: StoreOrder | null = null;

function esc(text: string): string {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function setStoreActiveCategory(cat: StoreCategoryType): void {
  currentCategory = cat;
  currentSelectedProductId = null;
  lastCreatedOrder = null;
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.pathname = '/store';
    url.searchParams.delete('product');
    if (cat === 'all') url.searchParams.delete('category');
    else url.searchParams.set('category', cat);
    window.history.pushState({ view: 'store', category: cat }, '', url.toString());
  }
}

/** 스토어 홈 또는 상단 메뉴 클릭 시 기본 '전체' 카테고리 및 목록으로 완전 리셋 */
export function resetStoreCategory(updateHistory: boolean = true): void {
  currentCategory = 'all';
  currentSelectedProductId = null;
  lastCreatedOrder = null;
  if (typeof window !== 'undefined' && updateHistory) {
    const url = new URL(window.location.href);
    url.pathname = '/store';
    url.searchParams.delete('product');
    url.searchParams.delete('category');
    window.history.replaceState({ view: 'store', category: 'all' }, '', url.toString());
  }
}

export function selectStoreProduct(productId: string | null, updateHistory: boolean = true): void {
  currentSelectedProductId = productId;
  lastCreatedOrder = null;

  if (typeof window !== 'undefined' && updateHistory) {
    const url = new URL(window.location.href);
    url.pathname = '/store';
    if (productId) {
      const prod = getStoreProductById(productId);
      url.searchParams.set('product', productId);
      window.history.pushState({ view: 'store', product: productId }, '', url.toString());
      if (prod) {
        document.title = `${prod.title} | 마보살 스토어`;
      }
    } else {
      url.searchParams.delete('product');
      window.history.pushState({ view: 'store' }, '', url.toString());
      document.title = '마보살 스토어 | 정통 맞춤 개운 부적 & 처방 굿즈';
    }
  }
}

export function getSelectedStoreProductId(): string | null {
  return currentSelectedProductId;
}

export function setLastStoreOrder(order: StoreOrder | null): void {
  lastCreatedOrder = order;
}


const STORE_SHORT_LABELS: Record<string, { short: string; desc: string; subItems: string[]; tags: string[] }> = {
  all: {
    short: '전체',
    desc: '마보살 인하우스 14대 운세 리포트 · 상품권 · 전자책 · 상담권 전 품목',
    subItems: ['대표 플래그십 39,900원 사주풀이', '2027 정묘년 신년운세', 'VIP 5만원 상품권', '1:1 심층 상담'],
    tags: ['#전품목', '#베스트셀러', '#즉시열람', '#인기상품']
  },
  report: {
    short: '리포트',
    desc: '사주 원국과 10년 평생 대운, 현실 고민 3대 솔루션을 담은 정통 리포트',
    subItems: ['마보살 정통 유료 사주풀이', '2027 정묘년 신년운세 비결서', '평생 재물운 & 파재살 방어', '직업·이직·사업운 리포트', '애정·궁합·재회 리포트', '오행 건강 체질'],
    tags: ['#평생대운', '#신년운세', '#재물운', '#이직운', '#애정궁합']
  },
  voucher: {
    short: '상품권',
    desc: '소중한 분께 선물하거나 본인 충전용 고유 바우처 코드 즉시 발급권',
    subItems: ['50,000원 VIP 사주 기프트 상품권', '30,000원 정통 사주 상품권', '10,000원 모바일 기프트 쿠폰'],
    tags: ['#모바일상품권', '#선물하기', '#코드즉시발급', '#전액차감']
  },
  ebook: {
    short: '전자책',
    desc: '비전문가도 30분 만에 내 사주를 스스로 읽는 실전 명리 PDF 소장판',
    subItems: ['마보살 명리학 실전 독법 전자책 (PDF 소장판)'],
    tags: ['#PDF소장판', '#자가진단', '#실전독법']
  },
  lecture: {
    short: '강의',
    desc: '운명의 파도를 타고 위기를 기회로 바꾸는 실전 개운 비법 온라인 마스터 클래스',
    subItems: ['명리 개운학 온라인 마스터 클래스 (전 8강 VOD)'],
    tags: ['#온라인강의', '#8강완강', '#개운비법']
  },
  consulting: {
    short: '상담',
    desc: '검증된 정통 명리 상담사와의 1:1 비공개 심층 프라이빗 예약권',
    subItems: ['전문 명리 상담사 1:1 심층 상담권 (30분 전화/채팅)'],
    tags: ['#1대1상담', '#비공개상담', '#실시간예약']
  },
  goods: {
    short: '굿즈',
    desc: '사주의 부족한 기운을 보완하고 액운을 막아주는 마보살 비전 수제 전통 호신 부적',
    subItems: ['마보살 비전 황금 재물부적 (경면주사 수제 부적)'],
    tags: ['#경면주사', '#호신부적', '#재물유입']
  }
};

export function renderCommerceStoreView(state: AppStateData): string {
  const session = state.sessionState;
  const userSignals = extractSignalTags(session).map(s => s.tag);

  // URL 파라미터에서 상품 및 카테고리 실시간 양방향 동기화
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const prodParam = urlParams.get('product');
    const catParam = urlParams.get('category') as StoreCategoryType;
    if (prodParam) {
      currentSelectedProductId = prodParam;
    } else if (window.location.pathname.startsWith('/store/')) {
      const pathProd = decodeURIComponent(window.location.pathname.replace('/store/', ''));
      currentSelectedProductId = pathProd || null;
    } else if (currentSelectedProductId) {
      // 이미 코드로 선택된 상품이 있으면 URL을 해당 상품 상세로 동기화
      const url = new URL(window.location.href);
      url.pathname = '/store';
      url.searchParams.set('product', currentSelectedProductId);
      window.history.replaceState({ view: 'store', product: currentSelectedProductId }, '', url.toString());
    } else {
      currentSelectedProductId = null;
    }

    if (catParam && STORE_CATEGORIES.some(c => c.id === catParam)) {
      currentCategory = catParam;
    }
  }

  const allCategoryProducts = getStoreProductsByCategory('all');
  const products = getStoreProductsByCategory(currentCategory);
  let selectedProduct = currentSelectedProductId ? getStoreProductById(currentSelectedProductId) : null;
  if (!selectedProduct && currentSelectedProductId) {
    // ID 상호 포함 또는 카테고리/제목 유사 매칭 보정
    selectedProduct = allCategoryProducts.find((p: StoreProduct) => p.id.includes(currentSelectedProductId!) || currentSelectedProductId!.includes(p.id)) || null;
    if (selectedProduct) {
      currentSelectedProductId = selectedProduct.id;
    }
  }
  const storeCategories = getStoreCategories();
  const activeCatObj = storeCategories.find(c => c.id === currentCategory);
  const activeCatLabel = activeCatObj ? activeCatObj.label : '전체 상품';

  // [순수 텍스트 카테고리 메뉴 (아이콘/숫자/박스 배경 완전 제거, 글자만 클릭)]
  const categoryNavHtml = storeCategories.map(cat => {
    const isActive = cat.id === currentCategory && !selectedProduct;
    return `
      <button type="button" class="btn-store-cat-nav ${isActive ? 'active' : ''}" data-category="${cat.id}">
        <span>${cat.label}</span>
        ${isActive ? '<span class="cat-active-line"></span>' : ''}
      </button>
    `;
  }).join('');

  // 우측 영역 렌더링 (결제 완료 영수증 vs 상품 상세 페이지 vs 상품 목록 그리드)
  let rightContentHtml = '';

  if (lastCreatedOrder) {
    // 1. 결제 완료 영수증 모드
    const order = lastCreatedOrder;
    rightContentHtml = `
      <div style="background: var(--surface-container); border: 1px solid rgba(242,202,80,0.3); border-radius: 18px; padding: 2.5rem 2rem; text-align: center; box-shadow: var(--shadow-sm);">
        <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(242,202,80,0.15); border: 1px solid var(--primary); color: var(--primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem;">
          <span class="material-symbols-outlined" style="font-size: 36px;">check</span>
        </div>
        <h2 style="font-size: 1.6rem; font-weight: 800; color: #fff; margin: 0 0 0.4rem 0;">${order.status === 'pending' ? '주문이 접수되었습니다' : '결제가 성공적으로 완료되었습니다!'}</h2>
        <p style="font-size: 0.9rem; color: #94a3b8; margin: 0 0 2rem 0;">주문번호: ${order.orderId}</p>
        ${order.status === 'pending' ? `<div style="max-width: 520px; margin: -1rem auto 1.5rem; background: rgba(242,202,80,0.08); border: 1px solid rgba(242,202,80,0.35); border-radius: 12px; padding: 1.15rem 1.25rem; text-align: left; font-size: 0.88rem; color: #e2e8f0; line-height: 1.6;"><strong style="color: var(--primary); font-size: 0.95rem; display: block; margin-bottom: 0.35rem;">입금 확인 대기 중</strong>기업은행 103-123733-04-012 (템바보드 주식회사)로 <strong style="color: #fff;">₩ ${order.amount.toLocaleString()}</strong>을 입금해 주세요.<br/><span style="font-size: 0.82rem; color: #cbd5e1; margin-top: 0.25rem; display: block;">입금자명은 <strong>${esc(order.buyerName)}</strong> 이어야 하며, 관리자가 입금을 확인하면 결제가 완료되어 열람할 수 있습니다.</span></div>` : ''}

        <div style="max-width: 520px; margin: 0 auto 2rem; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.5rem; text-align: left; font-size: 0.9rem; display: flex; flex-direction: column; gap: 0.85rem;">
          <div style="display: flex; align-items: flex-start; gap: 1rem;">
            <span style="color: var(--text-muted); font-size: 0.84rem; width: 75px; flex-shrink: 0; white-space: nowrap;">상품명</span>
            <strong style="color: #fff; font-size: 0.92rem; flex: 1; word-break: keep-all; line-height: 1.5;">${esc(order.productTitle)}</strong>
          </div>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <span style="color: var(--text-muted); font-size: 0.84rem; width: 75px; flex-shrink: 0; white-space: nowrap;">결제 금액</span>
            <strong style="color: var(--primary); font-size: 1.1rem; font-weight: 800;">₩ ${order.amount.toLocaleString()}</strong>
          </div>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <span style="color: var(--text-muted); font-size: 0.84rem; width: 75px; flex-shrink: 0; white-space: nowrap;">구매자 정보</span>
            <span style="color: #cbd5e1; font-size: 0.88rem;">${esc(order.buyerName)} (${esc(order.buyerPhone)})</span>
          </div>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <span style="color: var(--text-muted); font-size: 0.84rem; width: 75px; flex-shrink: 0; white-space: nowrap;">수신 이메일</span>
            <span style="color: #cbd5e1; font-size: 0.88rem;">${esc(order.buyerEmail)}</span>
          </div>
        </div>

        <div style="max-width: 520px; margin: 0 auto; display: flex; flex-direction: column; gap: 0.85rem;">
          ${order.deliveryType === 'voucher_code' && order.status !== 'pending' ? `
            <div style="background: rgba(242, 202, 80, 0.12); border: 2px dashed rgba(242, 202, 80, 0.5); border-radius: 12px; padding: 1.25rem; text-align: center; margin-bottom: 0.5rem;">
              <div style="font-size: 0.85rem; color: #f2ca50; font-weight: 700; margin-bottom: 0.5rem;">🎁 발급된 바우처 쿠폰 코드</div>
              <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                <input type="text" readonly value="${esc(order.contentPayload || (order.accessUrl.includes('voucher=') ? order.accessUrl.split('voucher=')[1] : 'VCHR-발급완료'))}" id="issued-voucher-code-input" style="background: #0f172a; border: 1px solid #334155; color: #fff; font-family: monospace; font-size: 1.15rem; font-weight: 800; text-align: center; padding: 0.5rem 1rem; border-radius: 8px; width: 240px;" />
                <button type="button" id="btn-copy-issued-voucher" style="background: var(--primary); color: #000; font-weight: 800; border: none; padding: 0.55rem 0.9rem; border-radius: 8px; cursor: pointer;">복사</button>
              </div>
              <p style="font-size: 0.78rem; color: #94a3b8; margin: 0.5rem 0 0 0;">위 코드를 복사하여 다른 사주 상품 결제 시 쿠폰 코드에 입력하거나 지인에게 선물하세요.</p>
            </div>
          ` : ''}
          ${order.status !== 'pending' && order.deliveryType === 'saju_report' ? `
            <button type="button" id="btn-store-goto-report" data-order-id="${order.orderId}" data-product-id="${order.productId}" style="display: block; width: 100%; box-sizing: border-box; background: var(--primary); color: #1c1500; font-weight: 800; padding: 0.95rem; border-radius: 10px; border: none; cursor: pointer; font-size: 1.05rem; box-shadow: 0 4px 16px rgba(242,202,80,0.3); text-align: center; transition: opacity 0.2s ease;">
              ${esc(order.buyerName)} 님 리포트 즉시 열람하기 →
            </button>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; margin-top: 0.25rem;">
              <button type="button" class="btn-cta-secondary btn-download-txt" style="padding: 0.75rem 0.5rem; font-size: 0.85rem; font-weight: 700; background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.4); color: var(--primary); border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
                <span class="material-symbols-outlined" style="font-size: 18px;">description</span>
                TXT 파일 소장본
              </button>
              <button type="button" class="btn-cta-secondary btn-download-pdf" style="padding: 0.75rem 0.5rem; font-size: 0.85rem; font-weight: 700; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); color: #fff; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
                <span class="material-symbols-outlined" style="font-size: 18px;">print</span>
                PDF 정본 인쇄/저장
              </button>
            </div>
          ` : (order.accessUrl && order.status !== 'pending' ? `
            <a href="${esc(order.accessUrl)}" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; box-sizing: border-box; background: var(--primary); color: #1c1500; font-weight: 800; padding: 0.9rem; border-radius: 10px; text-decoration: none; font-size: 1rem; box-shadow: 0 4px 16px rgba(242,202,80,0.3); text-align: center;">
              컨텐츠 열람 / 다운로드 바로가기 →
            </a>
          ` : '')}
          <button type="button" id="btn-store-back-to-list" style="background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.15); padding: 0.75rem; border-radius: 10px; font-size: 0.88rem; cursor: pointer;">
            스토어 상품 목록으로 돌아가기
          </button>
        </div>
      </div>
    `;
  } else if (selectedProduct) {
    // 2. 상품 상세 페이지 모드 (팝업 없이 인라인 2단 쇼핑몰 구조)
    const p = selectedProduct;
    const discountRate = p.originalPrice && p.originalPrice > p.price
      ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
      : 0;
    const isRecommended = p.targetSignals.some(sig => userSignals.includes(sig));
    const productReviews = ProductReviewStore.getReviewsByProduct(p.id);
    const reviewStats = ProductReviewStore.getReviewStats(p.id);

    rightContentHtml = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        
        <!-- 상단 네비게이션 브레드크럼 -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 0.65rem 1rem;">
          <div style="display: flex; align-items: center; gap: 0.45rem; font-size: 0.82rem; color: var(--text-muted); flex-wrap: wrap;">
            <button type="button" class="btn-back-to-store-list" style="background: none; border: none; color: var(--primary); font-weight: 700; cursor: pointer; padding: 0; font-size: 0.82rem;">스토어 홈</button>
            <span>&gt;</span>
            <button type="button" class="btn-store-category" data-category="${p.category}" style="background: none; border: none; color: #cbd5e1; cursor: pointer; padding: 0; font-size: 0.82rem; font-weight: 600;">${getStoreCategories().find(c => c.id === p.category)?.label || p.category}</button>
            <span>&gt;</span>
            <strong style="color: #fff; font-size: 0.82rem;">${esc(p.title)}</strong>
          </div>
          <button type="button" id="btn-store-back-to-list" class="btn-back-to-store-list" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.78rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.35rem;">
            <span class="material-symbols-outlined" style="font-size: 15px;">arrow_back</span>
            목록으로 돌아가기
          </button>
        </div>

        <!-- 2컬럼 메인 영역 (좌: 전용 갤러리 사진, 우: 상품정보/가격/결제 패널 규격화) -->
        <div class="store-detail-main-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.75rem; background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.28); border-radius: 18px; padding: 1.5rem; box-shadow: var(--shadow-sm); align-items: start;">
          
          <!-- 좌측: 상품 대표 이미지 및 서브 갤러리 (폭/높이 균형 규격화) -->
          <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%; max-width: 440px; margin: 0 auto;">
            <!-- 메인 대형 이미지 뷰어 (3:4 책 표지 최적 비율, 최대 높이 460px로 정돈) -->
            <div style="position: relative; width: 100%; aspect-ratio: 3 / 4; max-height: 460px; border-radius: 12px; overflow: hidden; background: #0c0f17; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 20px rgba(0,0,0,0.45);">
              ${p.thumbnailUrl ? `
                <img id="store-main-gallery-view" src="${p.thumbnailUrl}" alt="${esc(p.title)}" style="width: 100%; height: 100%; object-fit: cover; transition: opacity 0.2s ease;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
              ` : ''}
              <div id="store-main-gallery-placeholder" style="display: ${p.thumbnailUrl ? 'none' : 'flex'}; width: 100%; height: 100%; align-items: center; justify-content: center; background: rgba(242,202,80,0.08);">
                <span class="material-symbols-outlined" style="font-size: 64px; color: var(--primary);">${p.thumbnailIcon || 'menu_book'}</span>
              </div>
              <div style="position: absolute; top: 12px; left: 12px; display: flex; gap: 0.35rem; z-index: 2;">
                ${isRecommended ? `
                  <span style="background: var(--primary); color: #1c1500; font-size: 0.72rem; font-weight: 800; padding: 0.25rem 0.55rem; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">
                     내 사주 맞춤
                  </span>
                ` : ''}
                ${p.badge ? `
                  <span style="background: rgba(15,19,29,0.88); color: #f2ca50; border: 1px solid rgba(242,202,80,0.4); font-size: 0.72rem; font-weight: 700; padding: 0.25rem 0.55rem; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">
                    ${esc(p.badge)}
                  </span>
                ` : ''}
              </div>
            </div>

            <!-- 하단 썸네일 스트립 (클릭/호버 시 메인 사진 즉시 전환) -->
            ${(() => {
              const allGalleryImgs = [p.thumbnailUrl, ...(p.galleryImages || [])].filter(Boolean);
              if (allGalleryImgs.length <= 1) return '';
              return `
                <div style="display: flex; gap: 0.5rem; overflow-x: auto; padding: 0.25rem 0; align-items: center;">
                  ${allGalleryImgs.map((imgUrl, gIdx) => `
                    <button type="button" class="btn-store-gallery-thumb" data-img-url="${esc(imgUrl)}" style="width: 56px; height: 56px; border-radius: 6px; border: 2px solid ${gIdx === 0 ? 'var(--primary)' : 'rgba(255,255,255,0.15)'}; background: #0c0f17; overflow: hidden; padding: 0; cursor: pointer; flex-shrink: 0; transition: border-color 0.15s ease;">
                      <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
                    </button>
                  `).join('')}
                </div>
              `;
            })()}
          </div>

          <!-- 우측: 상품 정보, 슬림형 가격 박스, 수량 및 안정적인 결제 패널 -->
          <div style="display: flex; flex-direction: column; gap: 0.65rem; justify-content: flex-start; width: 100%;">

            <!-- 1. 상품명 & 부제 -->
            <div>
              <h1 style="font-size: 1.35rem; font-weight: 800; color: #fff; margin: 0 0 0.25rem 0; line-height: 1.35; letter-spacing: -0.3px;">
                ${esc(p.title)}
              </h1>
              <p style="font-size: 0.84rem; color: #f2ca50; line-height: 1.4; margin: 0; font-weight: 600;">
                ${esc(p.tagLine)}
              </p>
            </div>

            <!-- 2. 핵심 요약 (Summary 슬림 인용 박스) -->
            ${p.summary ? `
              <div style="background: rgba(255, 255, 255, 0.03); border-left: 3px solid var(--primary); padding: 0.5rem 0.75rem; border-radius: 0 6px 6px 0; font-size: 0.8rem; color: #cbd5e1; line-height: 1.5;">
                ${esc(p.summary)}
              </div>
            ` : ''}

            <!-- 3. 대표 판매 가격 블록 (슬림하게 재배치하여 불필요한 과대 높이 해소) -->
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 0.7rem 0.95rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
              <div style="display: flex; align-items: baseline; gap: 0.5rem;">
                <span style="font-size: 0.8rem; color: #94a3b8; font-weight: 600;">정상가</span>
                <span id="detail-original-price" style="font-size: 1.05rem; color: #94a3b8; text-decoration: line-through; font-weight: 700; font-family: var(--font-display);">
                  ₩ ${(p.originalPrice || p.price).toLocaleString()}
                </span>
                ${discountRate > 0 ? `
                  <span id="detail-discount-badge" style="background: #ef4444; color: #fff; font-size: 0.72rem; font-weight: 800; padding: 0.15rem 0.45rem; border-radius: 4px;">
                    ${discountRate}% 할인
                  </span>
                ` : ''}
              </div>
              <div style="display: flex; align-items: baseline; gap: 0.4rem;">
                <span style="font-size: 0.82rem; color: #fff; font-weight: 700;">판매가</span>
                <strong id="detail-sale-price" style="font-size: 1.45rem; color: var(--primary); font-family: var(--font-display); font-weight: 900; letter-spacing: -0.5px;">
                  ₩ ${p.price.toLocaleString()}
                </strong>
              </div>
            </div>

            <!-- 4. 주문 옵션 및 결제 설정 폼 (컴팩트 규격) -->
            <div style="background: rgba(15, 19, 29, 0.95); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 0.9rem; display: flex; flex-direction: column; gap: 0.6rem; box-shadow: 0 4px 16px rgba(0,0,0,0.25);">
              
              <!-- 배송 및 제공 방식 안내 칩 -->
              <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 6px; padding: 0.45rem 0.65rem; font-size: 0.78rem;">
                <span style="color: #94a3b8; font-weight: 600;">제공 방식</span>
                <span id="detail-delivery-badge-text" style="font-weight: 700; color: #f8fafc; display: flex; align-items: center; gap: 0.3rem;">
                  ${p.deliveryType === 'shipping' ? `
                    <span class="material-symbols-outlined" style="font-size: 15px; color: #38bdf8;">local_shipping</span>
                    <span>택배 무료 배송</span>
                  ` : p.deliveryType === 'ebook' || p.deliveryType === 'digital_download' ? `
                    <span class="material-symbols-outlined" style="font-size: 15px; color: #4ade80;">download_done</span>
                    <span>결제 즉시 PDF 다운로드 &amp; 영구 소장</span>
                  ` : p.deliveryType === 'voucher_code' ? `
                    <span class="material-symbols-outlined" style="font-size: 15px; color: var(--primary);">card_giftcard</span>
                    <span>바우처 코드 즉시 발급</span>
                  ` : p.deliveryType === 'consulting_booking' ? `
                    <span class="material-symbols-outlined" style="font-size: 15px; color: #c084fc;">calendar_clock</span>
                    <span>1:1 상담 예약 확정</span>
                  ` : `
                    <span class="material-symbols-outlined" style="font-size: 15px; color: var(--primary);">bolt</span>
                    <span>즉시 정밀 감정 리포트 생성</span>
                  `}
                </span>
              </div>

              <!-- 주문 폼 -->
              <form id="store-checkout-form" data-product-id="${p.id}" style="display: flex; flex-direction: column; gap: 0.6rem; margin: 0;">
                
                <!-- 상품 옵션 선택기 (다중 SKU) -->
                ${p.options && p.options.length > 0 ? `
                  <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                    <label for="store-product-option-select" style="font-size: 0.78rem; font-weight: 700; color: #cbd5e1; display: flex; align-items: center; gap: 0.25rem;">
                      <span class="material-symbols-outlined" style="font-size: 15px; color: var(--primary);">tune</span>
                      상품 옵션 선택
                    </label>
                    <select id="store-product-option-select" style="width: 100%; background: #0c0f17; border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 0.5rem 0.65rem; border-radius: 6px; font-size: 0.82rem; cursor: pointer;">
                      ${p.options.map((opt, oIdx) => `
                        <option value="${opt.id}" data-name="${esc(opt.name)}" data-price="${opt.price}" data-original-price="${opt.originalPrice || opt.price}" data-delivery-type="${opt.deliveryType || p.deliveryType}" ${oIdx === 0 ? 'selected' : ''}>
                          ${opt.name} - ₩ ${opt.price.toLocaleString()}
                        </option>
                      `).join('')}
                    </select>
                  </div>
                ` : ''}

                ${(() => {
                  const savedProf = UserSajuStore.getProfile();
                  if (p.deliveryType === 'saju_report') {
                    const already = savedProf ? isProductAlreadyPurchased(p.id, savedProf.userName) : { purchased: false };
                    return `
                      <div style="background: rgba(242, 202, 80, 0.06); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 6px; padding: 0.65rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                          <div style="font-size: 0.74rem; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 0.25rem;">
                            <span class="material-symbols-outlined" style="font-size: 15px;">psychology</span>
                            사주 분석 대상자
                          </div>
                          <button type="button" class="btn-goto-analyze-target" data-product-id="${p.id}" style="background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.35); color: var(--primary); font-size: 0.74rem; font-weight: 700; padding: 0.18rem 0.55rem; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.2rem;">
                            <span class="material-symbols-outlined" style="font-size: 13px;">edit_calendar</span>
                            <span>사주 입력</span>
                          </button>
                        </div>
                        ${savedProf ? `
                          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; font-size: 0.8rem; color: #fff;">
                            <div>
                              <strong style="color: #fff;">${esc(savedProf.userName)} 님</strong>
                              <span style="font-size: 0.75rem; color: #cbd5e1; margin-left: 0.25rem;">(${esc(savedProf.solarBirthDate)} · ${savedProf.gender === 'female' ? '坤命' : '乾命'})</span>
                              ${already.purchased ? '<span style="color: #4ade80; font-size: 0.7rem; font-weight: 700; margin-left: 0.3rem;">[구매완료]</span>' : ''}
                            </div>
                          </div>
                        ` : `
                          <div style="font-size: 0.76rem; color: #cbd5e1; line-height: 1.45;">
                            등록된 사주 정보가 없습니다. <strong>[사주 입력]</strong>을 눌러 정보를 먼저 등록해 주세요.
                          </div>
                        `}
                      </div>
                    `;
                  }
                  return '';
                })()}

                <!-- 수량 선택 컨트롤 & 쿠폰 통합 바 -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; align-items: center;">
                  <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 0.4rem 0.6rem;">
                    <span style="font-size: 0.78rem; color: #cbd5e1; font-weight: 600;">수량</span>
                    <div style="display: inline-flex; align-items: center; border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; overflow: hidden; background: #0c0f17;">
                      <button type="button" id="btn-detail-qty-minus" style="background: transparent; border: none; color: #cbd5e1; width: 24px; height: 22px; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; justify-content: center;">-</button>
                      <span id="detail-qty-display" style="font-size: 0.8rem; font-weight: 700; color: #fff; width: 26px; text-align: center;">1</span>
                      <button type="button" id="btn-detail-qty-plus" style="background: transparent; border: none; color: #cbd5e1; width: 24px; height: 22px; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; justify-content: center;">+</button>
                      <input type="hidden" id="detail-qty-input" value="1" />
                    </div>
                  </div>

                  <!-- 최종 결제 예상액 컴팩트 표시 -->
                  <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 0.4rem 0.65rem; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.75rem; color: #94a3b8; font-weight: 700;">결제액</span>
                    <strong id="detail-total-price" data-unit-price="${p.price}" style="font-size: 1.15rem; color: #fff; font-weight: 800; font-family: var(--font-display);">
                      ₩ ${p.price.toLocaleString()}
                    </strong>
                  </div>
                </div>

                <!-- 할인 쿠폰 적용 슬림 바 -->
                <div style="background: rgba(255, 255, 255, 0.02); border: 1px dashed rgba(242, 202, 80, 0.3); border-radius: 6px; padding: 0.45rem 0.6rem; display: flex; flex-direction: column; gap: 0.25rem;">
                  <div style="display: flex; gap: 0.35rem; align-items: center;">
                    <input type="text" id="detail-coupon-input" placeholder="할인 쿠폰 코드 입력" style="flex: 1; background: #0c0f17; border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.35rem 0.5rem; border-radius: 5px; font-size: 0.75rem; text-transform: uppercase;" />
                    <button type="button" id="btn-detail-apply-coupon" style="background: rgba(242, 202, 80, 0.15); border: 1px solid rgba(242, 202, 80, 0.4); color: var(--primary); font-weight: 800; font-size: 0.72rem; padding: 0.35rem 0.6rem; border-radius: 5px; cursor: pointer; white-space: nowrap;">적용</button>
                    <button type="button" id="btn-detail-cancel-coupon" style="display: none; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; font-weight: 800; font-size: 0.72rem; padding: 0.35rem 0.5rem; border-radius: 5px; cursor: pointer; white-space: nowrap;">취소</button>
                  </div>
                  <div id="detail-coupon-discount-row" style="display: none; justify-content: space-between; font-size: 0.72rem; color: #4ade80;">
                    <span>쿠폰 할인</span>
                    <span id="detail-coupon-discount-text">- ₩ 0</span>
                  </div>
                  <div id="detail-coupon-msg" style="display: none; font-size: 0.7rem; line-height: 1.2;"></div>
                  <input type="hidden" id="detail-coupon-discount-val" value="0" />
                  <input type="hidden" id="detail-coupon-code-val" value="" />
                </div>

                <!-- 액션 버튼 2단 (장바구니 + 바로구매) -->
                <div style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 0.45rem; margin-top: 0.1rem;">
                  <button type="button" class="btn-add-to-cart-from-detail" data-product-id="${p.id}" style="background: rgba(242, 202, 80, 0.1); color: var(--primary); border: 1px solid rgba(242, 202, 80, 0.35); font-size: 0.84rem; font-weight: 800; border-radius: 8px; padding: 0.7rem 0.4rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.3rem; transition: all 0.15s ease;">
                    <span class="material-symbols-outlined" style="font-size: 17px;">shopping_bag</span>
                    장바구니
                  </button>
                  <button type="submit" style="width: 100%; background: var(--primary); color: #1c1500; font-size: 0.92rem; font-weight: 800; border: none; border-radius: 8px; padding: 0.7rem; cursor: pointer; box-shadow: 0 4px 14px rgba(242,202,80,0.3); transition: transform 0.15s ease;">
                    ${p.price === 0 ? '무료 체험하기' : '바로구매'}
                  </button>
                </div>
              </form>

            </div>

          </div>

        </div>

        <!-- 하단: 쇼핑몰 표준 3단 탭 네비게이션 (일반 상품 등록 화면 규격) -->
        <div class="store-detail-tabs" style="margin-top: 1.75rem;">
          <div style="display: flex; border-bottom: 2px solid rgba(255, 255, 255, 0.15); gap: 0.5rem; overflow-x: auto;">
            <button type="button" class="btn-store-detail-tab active" data-tab-id="tab-detail-spec" style="padding: 0.85rem 1.25rem; font-size: 0.95rem; font-weight: 800; color: var(--primary); background: none; border: none; border-bottom: 3px solid var(--primary); cursor: pointer; display: flex; align-items: center; gap: 0.4rem; white-space: nowrap;">
              <span class="material-symbols-outlined" style="font-size: 18px;">description</span>
              상품 상세정보
            </button>
            <button type="button" class="btn-store-detail-tab" data-tab-id="tab-detail-refund" style="padding: 0.85rem 1.25rem; font-size: 0.95rem; font-weight: 700; color: #94a3b8; background: none; border: none; border-bottom: 3px solid transparent; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; white-space: nowrap;">
              <span class="material-symbols-outlined" style="font-size: 18px;">policy</span>
              상품고시 &amp; 환불규정
            </button>
            <button type="button" class="btn-store-detail-tab" data-tab-id="tab-detail-reviews" style="padding: 0.85rem 1.25rem; font-size: 0.95rem; font-weight: 700; color: #94a3b8; background: none; border: none; border-bottom: 3px solid transparent; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; white-space: nowrap;">
              <span class="material-symbols-outlined" style="font-size: 18px;">rate_review</span>
              구매 후기 (${productReviews.length})
            </button>
          </div>

          <!-- 탭 1: 상세정보 및 표준 도서 규격 고시 (긴 경우 상단 일부만 우선 보여주고 선택 시 추가 노출 아코디언) -->
          <div id="tab-detail-spec" class="store-detail-tab-pane" style="display: block; padding-top: 1.5rem;">
            <!-- 일반 쇼핑몰 규격 상품 기본 정보 표 -->
            ${(() => {
              const formatMeta = (() => {
                if (p.category === 'report') {
                  return {
                    typeLabel: '상품 분류', typeVal: '4대 정밀 감정 리포트',
                    formatLabel: '제공 형태', formatVal: '온라인 대시보드 열람 + PDF/TXT 소장본',
                    deliveryLabel: '열람 방식', deliveryVal: '결제 확인 즉시 실시간 해금 및 영구 소장',
                    authorLabel: '분석 엔진', authorVal: '마보살 10만 임상 정밀 명리엔진',
                    sectionTitle: '리포트 상세 소개'
                  };
                }
                if (p.category === 'voucher') {
                  return {
                    typeLabel: '상품 분류', typeVal: '모바일 바우처 / 기프트 상품권',
                    formatLabel: '제공 형태', formatVal: '16자리 고유 쿠폰 코드 즉시 발급',
                    deliveryLabel: '사용 방식', deliveryVal: '마이페이지 등록 또는 주문서 결제 시 전액 차감',
                    authorLabel: '발행처', authorVal: '마보살 공식 디지털 랩',
                    sectionTitle: '상품권 상세 소개'
                  };
                }
                if (p.category === 'lecture') {
                  return {
                    typeLabel: '상품 분류', typeVal: '온라인 강의 · VOD',
                    formatLabel: '제공 형태', formatVal: '고화질 스트리밍 영상 + 강의 교재 PDF',
                    deliveryLabel: '수강 방식', deliveryVal: '결제 완료 즉시 마이페이지 내 강의실 열람',
                    authorLabel: '강사 / 연구원', authorVal: '마보살 역학 전임 학술팀',
                    sectionTitle: '강의 상세 소개'
                  };
                }
                if (p.category === 'consulting') {
                  return {
                    typeLabel: '상품 분류', typeVal: '1:1 역학 전문 상담권',
                    formatLabel: '제공 형태', formatVal: '전문 역학 상담사 맞춤 1:1 심층 상담',
                    deliveryLabel: '예약 방식', deliveryVal: '결제 완료 후 상담 캘린더 날짜/시간 선택',
                    authorLabel: '상담 기관', authorVal: '마보살 천명원 전문 상담 센터',
                    sectionTitle: '상담권 상세 소개'
                  };
                }
                if (p.category === 'goods') {
                  return {
                    typeLabel: '상품 분류', typeVal: '개운 굿즈 · 부적',
                    formatLabel: '제공 형태', formatVal: '실물 상품 안전 택배 배송',
                    deliveryLabel: '배송 기간', deliveryVal: '결제 완료 후 1~3 영업일 이내 출고',
                    authorLabel: '제작 / 유통', authorVal: '마보살 공식 굿즈 스튜디오',
                    sectionTitle: '상품 상세 소개'
                  };
                }
                return {
                  typeLabel: '도서 형태', typeVal: '전자책 (PDF) / 소장용 양장본',
                  formatLabel: '파일 포맷', formatVal: '고해상도 벡터 PDF + 텍스트',
                  deliveryLabel: '제공 방식', deliveryVal: "결제 완료 즉시 '내 서재' 다운로드 & 열람",
                  authorLabel: '저자 / 편저', authorVal: '마보살 명리학 연구소',
                  sectionTitle: '도서 상세 소개'
                };
              })();

              return `
                <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem;">
                  <h4 style="font-size: 0.95rem; font-weight: 800; color: #fff; margin: 0 0 0.85rem 0; display: flex; align-items: center; gap: 0.4rem;">
                    <span class="material-symbols-outlined" style="font-size: 18px; color: var(--primary);">fact_check</span>
                    상품 정보 제공 고시
                  </h4>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.5rem; font-size: 0.84rem;">
                    <div style="display: flex; padding: 0.4rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><span style="color: #94a3b8; width: 110px;">상품명</span><strong style="color: #fff;">${esc(p.title)}</strong></div>
                    <div style="display: flex; padding: 0.4rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><span style="color: #94a3b8; width: 110px;">${formatMeta.authorLabel}</span><span style="color: #e2e8f0;">${formatMeta.authorVal}</span></div>
                    <div style="display: flex; padding: 0.4rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><span style="color: #94a3b8; width: 110px;">${formatMeta.typeLabel}</span><span style="color: #e2e8f0;">${formatMeta.typeVal}</span></div>
                    <div style="display: flex; padding: 0.4rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><span style="color: #94a3b8; width: 110px;">${formatMeta.formatLabel}</span><span style="color: #e2e8f0;">${formatMeta.formatVal}</span></div>
                    <div style="display: flex; padding: 0.4rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><span style="color: #94a3b8; width: 110px;">${formatMeta.deliveryLabel}</span><span style="color: #e2e8f0;">${formatMeta.deliveryVal}</span></div>
                    <div style="display: flex; padding: 0.4rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><span style="color: #94a3b8; width: 110px;">소비자 상담</span><span style="color: #e2e8f0;">마보살 고객지원센터 1:1 온라인 접수</span></div>
                  </div>
                </div>

                <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.75rem; position: relative;">
                  <h3 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0 0 1rem 0; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.85rem;">
                    ${formatMeta.sectionTitle}
                  </h3>
              `;
            })()}

              <!-- 상세정보 접기/더보기 영역 -->
              <div id="store-detail-foldable-content" class="store-detail-folded" style="position: relative; max-height: 540px; overflow: hidden; transition: max-height 0.4s ease;">
                <p style="font-size: 0.92rem; color: #cbd5e1; line-height: 1.8; margin: 0 0 1.5rem 0;">
                  ${esc(p.description)}
                </p>
                ${p.detailsHtml || ''}

                <!-- 수록 화보 갤러리 -->
                ${(p.detailImages && p.detailImages.length > 0) ? `
                  <div style="margin-top: 2.5rem; padding-top: 1.75rem; border-top: 1px solid rgba(255,255,255,0.1);">
                    <h4 style="font-size: 1rem; font-weight: 800; color: #f2ca50; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.4rem;">
                      <span class="material-symbols-outlined" style="font-size: 20px;">photo_library</span>
                      [수록 화보] 원전 수묵담채화 및 오행 도판 갤러리
                    </h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem;">
                      ${p.detailImages.map((imgUrl, iIdx) => `
                        <div style="border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.12); background: #0c0f17; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
                          <div style="aspect-ratio: 3 / 4; width: 100%; overflow: hidden;">
                            <img src="${imgUrl}" alt="도판 ${iIdx + 1}" style="width: 100%; height: 100%; object-fit: cover; display: block;" loading="lazy" />
                          </div>
                          <div style="padding: 0.5rem; font-size: 0.78rem; color: #94a3b8; text-align: center; background: rgba(0,0,0,0.4);">
                            수록 도판 ${iIdx + 1}호
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}

                <!-- 하단 그라디언트 페이드오버레이 -->
                <div id="store-detail-fade-overlay" style="position: absolute; bottom: 0; left: 0; right: 0; height: 160px; background: linear-gradient(to bottom, rgba(15,19,29,0) 0%, var(--surface-container) 95%); pointer-events: none; z-index: 5;"></div>
              </div>

              <!-- 상품 상세정보 더보기 / 접기 토글 버튼 -->
              <div style="text-align: center; margin-top: 1.25rem; position: relative; z-index: 10;">
                <button type="button" id="btn-toggle-detail-fold" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.45rem; width: 100%; max-width: 340px; margin: 0 auto; padding: 0.8rem 1.25rem; background: rgba(242, 202, 80, 0.12); border: 1px solid var(--primary); color: var(--primary); border-radius: 8px; font-weight: 800; font-size: 0.92rem; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">
                  <span id="btn-toggle-detail-fold-text">상품 상세정보 더보기</span>
                  <span id="btn-toggle-detail-fold-icon" class="material-symbols-outlined" style="font-size: 20px;">expand_more</span>
                </button>
              </div>

            </div>
          </div>

          <!-- 탭 2: 상품고시 & 환불규정 (고정 규정 박스) -->
          <div id="tab-detail-refund" class="store-detail-tab-pane" style="display: none; padding-top: 1.5rem;">
            <div style="background: var(--surface-container); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 1.75rem;">
              <h4 style="font-size: 1.05rem; font-weight: 800; color: #f2ca50; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.45rem;">
                <span class="material-symbols-outlined" style="font-size: 22px;">policy</span>
                주문 취소 및 환불 규정 안내
              </h4>
              <div style="font-size: 0.84rem; color: #cbd5e1; line-height: 1.75; display: flex; flex-direction: column; gap: 0.75rem;">
                <div>
                  <strong style="color: #fff;">1. 디지털 콘텐츠 (전자책 · 사주 리포트)</strong><br/>
                  • 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항 제5호에 의거하여, <strong>다운로드 링크 발급 또는 열람이 개시된 디지털 콘텐츠는 청약철회(환불)가 제한</strong>됩니다.<br/>
                  • 결제 완료 후 열람이나 다운로드가 개시되지 않은 주문은 결제일로부터 7일 이내 전액 청약철회가 가능합니다.<br/>
                  • 파일 손상, 다운로드 장애 등 전산 시스템 오류로 정상 이용이 불가능한 경우 7일 이내 고객센터를 통해 정상 파일 재발송 또는 전액 환불을 받으실 수 있습니다.
                </div>
                <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 0.65rem;">
                  <strong style="color: #fff;">2. 실물 배송 상품 (부적 · 굿즈 소품)</strong><br/>
                  • 상품 수령일로부터 7일 이내에 반품 및 환불 신청이 가능합니다.<br/>
                  • 단, 고객의 귀책 사유로 상품이 훼손·멸실되었거나 사용 흔적이 있는 경우, 밀봉 포장을 개봉하여 상품 가치가 상실된 경우에는 반품이 불가합니다.<br/>
                  • 단순 변심에 의한 반품의 경우 왕복 배송비는 고객 부담입니다.
                </div>
                <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 0.65rem;">
                  <strong style="color: #fff;">3. 1:1 상담권 및 모바일 바우처</strong><br/>
                  • 미사용 모바일 바우처는 유효기간 내 환불 신청이 가능합니다.<br/>
                  • 1:1 상담 예약권은 상담 개시 24시간 전까지 취소 시 전액 환불되며, 상담 당일 임의 불참 또는 상담 개시 후에는 환불이 제한됩니다.
                </div>
                <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 0.65rem; color: #94a3b8; font-size: 0.78rem;">
                  ※ 취소 및 환불 접수: 마이페이지 [주문 내역] 내 [주문 취소/반품 신청] 버튼을 통해 온라인 접수하실 수 있습니다.
                </div>
              </div>
            </div>
          </div>

          <!-- 탭 3: 구매 후기 (실제구매인증 뱃지 완전 제거) -->
          <div id="tab-detail-reviews" class="store-detail-tab-pane" style="display: none; padding-top: 1.5rem;">
            <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
                <div>
                  <h3 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0 0 0.25rem 0;">
                    구매 고객 후기 (${productReviews.length})
                  </h3>
                  <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.88rem; color: var(--primary);">
                    <span>★</span>
                    <strong style="color: #fff;">${reviewStats.average.toFixed(1)}</strong>
                    <span style="color: #94a3b8; font-size: 0.8rem;">/ 5.0 (총 ${reviewStats.count}건의 평가)</span>
                  </div>
                </div>
                <button type="button" class="btn-open-write-review" data-product-id="${p.id}" data-product-title="${esc(p.title)}" style="background: rgba(242, 202, 80, 0.15); border: 1px solid rgba(242, 202, 80, 0.4); color: var(--primary); font-weight: 700; font-size: 0.82rem; padding: 0.5rem 0.95rem; border-radius: 8px; cursor: pointer;">
                  후기 작성하기
                </button>
              </div>

              ${productReviews.length === 0 ? `
                <div style="text-align: center; padding: 3rem 1rem; color: #94a3b8; font-size: 0.9rem;">
                  아직 등록된 구매 후기가 없습니다. 첫 번째 후기를 작성해 보세요!
                </div>
              ` : `
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                  ${productReviews.map(r => `
                    <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 1.15rem;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                          <strong style="color: #fff; font-size: 0.88rem;">${esc(r.authorName)}</strong>
                          <span style="color: #f2ca50; font-size: 0.82rem;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                        </div>
                        <span style="font-size: 0.76rem; color: #64748b;">${new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p style="font-size: 0.88rem; color: #cbd5e1; line-height: 1.6; margin: 0 0 0.5rem 0;">
                        ${esc(r.content)}
                      </p>
                      ${r.tags && r.tags.length > 0 ? `
                        <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                          ${r.tags.map(t => `
                            <span style="background: rgba(255,255,255,0.05); color: #94a3b8; font-size: 0.72rem; padding: 0.15rem 0.45rem; border-radius: 4px;">
                              #${esc(t)}
                            </span>
                          `).join('')}
                        </div>
                      ` : ''}
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>
        </div>

      </div>
    `;
  } else {
    // 3. 상품 목록 그리드 모드
    const activeCatInfo = STORE_CATEGORIES.find(c => c.id === currentCategory) || STORE_CATEGORIES[0];

    const cardsHtml = products.length === 0 ? `
      <div style="padding: 4rem 1rem; text-align: left; color: var(--text-muted); background: var(--surface-container); border-radius: 16px;">
        <span class="material-symbols-outlined" style="font-size: 40px; color: var(--text-muted); margin-bottom: 0;">inventory_2</span>
        <p style="margin: 0; font-size: 0.95rem;">선택하신 카테고리에 등록된 상품이 없습니다.</p>
      </div>
    ` : `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem; align-items: stretch;">
        ${products.map(p => {
          const isRecommended = p.targetSignals.some(sig => userSignals.includes(sig));
          const discountRate = p.originalPrice && p.originalPrice > p.price
            ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
            : 0;
          const reviewStats = ProductReviewStore.getReviewStats(p.id);

          return `
            <div class="store-product-card" data-product-id="${p.id}" style="background: var(--surface-container); border: 1px solid ${isRecommended ? 'rgba(242, 202, 80, 0.45)' : 'rgba(255,255,255,0.08)'}; border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; height: 100%; box-shadow: ${isRecommended ? '0 4px 20px rgba(242,202,80,0.12)' : 'var(--shadow-sm)'}; transition: transform 0.2s ease, border-color 0.2s ease; cursor: pointer;">
              
              <!-- 썸네일 영역 (고정 비율 16:10) -->
              <div style="position: relative; width: 100%; aspect-ratio: 16 / 10; background: #0c0f17; overflow: hidden; flex-shrink: 0;">
                ${p.thumbnailUrl ? `
                  <img src="${p.thumbnailUrl}" alt="${esc(p.title)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                ` : ''}
                <div style="display: ${p.thumbnailUrl ? 'none' : 'flex'}; width: 100%; height: 100%; align-items: center; justify-content: center; background: rgba(242,202,80,0.08);">
                  <span class="material-symbols-outlined" style="font-size: 44px; color: var(--primary);">${p.thumbnailIcon || 'menu_book'}</span>
                </div>

                <div style="position: absolute; top: 10px; left: 10px; display: flex; flex-wrap: wrap; gap: 0.35rem; z-index: 2;">
                  ${isRecommended ? `
                    <span style="background: var(--primary); color: #1c1500; font-size: 0.68rem; font-weight: 800; padding: 0.2rem 0.55rem; border-radius: 6px;">
                       내 사주 맞춤
                    </span>
                  ` : ''}
                  ${p.badge ? `
                    <span style="background: rgba(15,19,29,0.85); color: #fff; border: 1px solid rgba(255,255,255,0.2); font-size: 0.68rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 6px;">
                      ${esc(p.badge)}
                    </span>
                  ` : ''}
                </div>
              </div>

              <!-- 규격화된 내용 블록 (내용 길이에 따라 카드 크기가 바뀌지 않도록 높이 완전 고정) -->
              <div style="padding: 1.15rem; display: flex; flex-direction: column; flex: 1; justify-content: space-between;">
                <div>
                  <!-- 카테고리 & 평점 행 (고정 높이) -->
                  <div style="display: flex; justify-content: space-between; align-items: center; height: 1.25rem; margin-bottom: 0.4rem;">
                    <span style="font-size: 0.72rem; color: var(--primary); font-weight: 700;">
                      ${STORE_CATEGORIES.find(c => c.id === p.category)?.label || p.category}
                    </span>
                    <span style="color: #fbbf24; font-size: 0.74rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.15rem;">
                      ★ ${reviewStats.average.toFixed(1)} (${reviewStats.count})
                    </span>
                  </div>

                  <!-- 제목 (고정 2.8rem 2줄 클램프: 글자 길이에 관계없이 항상 균일한 높이 유지) -->
                  <h3 style="font-size: 0.98rem; font-weight: 700; color: #fff; margin: 0 0 0.4rem 0; line-height: 1.4; height: 2.8rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: keep-all; text-overflow: ellipsis;">
                    ${esc(p.title)}
                  </h3>

                  <!-- 부가 설명 (고정 2.35rem 2줄 클램프) -->
                  <p style="font-size: 0.8rem; color: #94a3b8; margin: 0; line-height: 1.45; height: 2.35rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: keep-all; text-overflow: ellipsis;">
                    ${esc(p.tagLine)}
                  </p>
                </div>

                <!-- 가격 & 자세히보기 버튼 (바닥 정렬 및 고정 높이 3.2rem) -->
                <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.85rem; margin-top: 1rem; height: 3.2rem; box-sizing: border-box; display: flex; justify-content: space-between; align-items: flex-end;">
                  <div style="display: flex; flex-direction: column; justify-content: flex-end;">
                    ${discountRate > 0 ? `
                      <div style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.74rem; line-height: 1;">
                        <span style="color: #e2e8f0; font-weight: 800;">${discountRate}%</span>
                        <span style="color: var(--text-muted); text-decoration: line-through;">₩ ${(p.originalPrice || 0).toLocaleString()}</span>
                      </div>
                    ` : `
                      <div style="height: 0.74rem;"></div>
                    `}
                    <div style="font-size: 1.15rem; font-weight: 800; color: #fff; font-family: var(--font-display); line-height: 1.2; margin-top: 0.2rem;">
                      ₩ ${p.price.toLocaleString()}
                    </div>
                  </div>
                  <button type="button" class="btn-open-product-detail" data-product-id="${p.id}" style="background: var(--primary); color: #1c1500; font-size: 0.82rem; font-weight: 800; border: none; border-radius: 6px; padding: 0.45rem 0.85rem; cursor: pointer; white-space: nowrap; transition: opacity 0.15s ease;">
                    자세히 보기
                  </button>
                </div>
              </div>

            </div>
          `;
        }).join('')}
      </div>
    `;

    rightContentHtml = `
      <div>
        ${cardsHtml}
      </div>
    `;
  }

  return `
    <style>
      /* 스토어 모바일 드로어 및 z-index 완전 격리 (검은 화면 방지) */
      .store-mobile-filter-bar {
        display: none;
      }
      .store-drawer-backdrop {
        display: none;
      }

      @media (max-width: 860px) {
        .store-two-col-layout {
          flex-direction: column !important;
          gap: 1rem !important;
          position: relative !important;
          z-index: 9999995 !important;
        }
        .store-mobile-filter-bar {
          display: flex !important;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          margin-bottom: 1.25rem;
          padding: 0.75rem 1rem;
          background: #0f1422;
          border: 1px solid rgba(242, 202, 80, 0.25);
          border-radius: 12px;
          box-sizing: border-box;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        }
        .btn-toggle-store-drawer {
          display: inline-flex !important;
          align-items: center;
          gap: 0.45rem;
          background: rgba(242, 202, 80, 0.18) !important;
          border: 1px solid var(--primary) !important;
          color: var(--primary) !important;
          padding: 0.5rem 0.95rem !important;
          border-radius: 8px !important;
          font-size: 0.88rem !important;
          font-weight: 800 !important;
          cursor: pointer !important;
        }
        .btn-hide-desktop {
          display: none;
        }
        .store-sidebar-nav {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          bottom: 0 !important;
          width: 285px !important;
          height: 100vh !important;
          z-index: 9999999 !important;
          border-radius: 0 !important;
          transform: translateX(-100%) !important;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
          box-shadow: 12px 0 45px rgba(0, 0, 0, 0.9) !important;
          background: #0b0f19 !important;
          border-right: 1px solid rgba(242, 202, 80, 0.3) !important;
          overflow-y: auto !important;
          padding: 1.25rem !important;
          box-sizing: border-box !important;
        }
        .store-sidebar-nav.drawer-open {
          transform: translateX(0) !important;
          display: block !important;
        }
        .store-sidebar-nav .btn-hide-desktop {
          display: flex !important;
        }
        .store-drawer-backdrop {
          display: block !important;
          position: fixed !important;
          inset: 0 !important;
          background: rgba(0, 0, 0, 0.75) !important;
          backdrop-filter: blur(5px) !important;
          -webkit-backdrop-filter: blur(5px) !important;
          z-index: 9999990 !important;
          opacity: 0 !important;
          pointer-events: none !important;
          transition: opacity 0.25s ease !important;
        }
        .store-drawer-backdrop.active {
          opacity: 1 !important;
          pointer-events: auto !important;
        }
      }
    </style>

    <div class="commerce-store-container" style="max-width: 1440px; width: 100%; margin: 0 auto; padding: 1.25rem 1rem 3rem; box-sizing: border-box;">
      
      ${!selectedProduct && !lastCreatedOrder ? `
        <!-- [PC 전용: 상단 가로 카테고리 메뉴 탭 바] -->
        <nav class="store-text-category-bar" aria-label="스토어 카테고리 목록">
          <div class="store-cat-scroll-inner">
            ${categoryNavHtml}
          </div>
        </nav>

        <!-- [모바일 전용: 햄버거 카테고리 바] -->
        <div class="store-mobile-hamburger-bar">
          <button type="button" class="btn-toggle-store-drawer" id="btn-open-store-drawer">
            <span class="material-symbols-outlined" style="font-size: 20px;">menu</span>
            <span>스토어 카테고리 (${esc(activeCatLabel)})</span>
          </button>
        </div>

        <!-- [모바일 전용: 좌측 슬라이딩 드로어 & 백드롭] -->
        <div id="store-drawer-backdrop" class="store-drawer-backdrop"></div>
        <aside id="store-sidebar-drawer" class="store-sidebar-nav">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 0.85rem; margin-bottom: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 0.45rem; font-size: 1.05rem; font-weight: 800; color: #fff;">
              <span class="material-symbols-outlined" style="color: var(--primary);">category</span>
              스토어 카테고리
            </div>
            <button type="button" id="btn-close-store-drawer" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; color: #cbd5e1; cursor: pointer; padding: 0.35rem; display: flex; align-items: center; justify-content: center;" aria-label="카테고리 닫기">
              <span class="material-symbols-outlined" style="font-size: 20px;">close</span>
            </button>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${storeCategories.map(cat => {
              const isActive = cat.id === currentCategory && !selectedProduct;
              return `
                <button type="button" class="btn-store-cat-nav store-drawer-cat-item ${isActive ? 'active' : ''}" data-category="${cat.id}">
                  <span class="material-symbols-outlined" style="font-size: 20px; color: ${isActive ? 'var(--primary)' : '#94a3b8'};">${cat.icon || 'category'}</span>
                  <span>${esc(cat.label)}</span>
                </button>
              `;
            }).join('')}
          </div>
        </aside>
      ` : ''}

      <!-- [하단 풀-위드 메인 콘텐츠 영역 (PC 4열 시원한 상품 그리드)] -->
      <main class="store-main-fullwidth" style="width: 100%; min-width: 0;">
        ${rightContentHtml}
      </main>

    </div>
  `;
}


// 하위 호환성 스텁 (기존 모달 호출 방어)
export function renderProductDetailModalContent(_product?: any): string {
  return '';
}
