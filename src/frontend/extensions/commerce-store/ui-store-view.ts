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
} from './store-service.js';
import type { StoreCategoryType, StoreOrder, StoreProduct } from './types.js';
import { renderPaymentMethodSelector } from '../../modules/payment/PaymentMethodSelector.js';
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
}

export function selectStoreProduct(productId: string | null): void {
  if (productId) {
    const isAuth = OrderAuthGuard.checkOrderAuth(productId);
    if (!isAuth) {
      // 비회원이면 로그인 모달이 팝업되고 주문서 진입 차단
      return;
    }
  }
  currentSelectedProductId = productId;
  lastCreatedOrder = null;
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
    desc: '사주 원국과 10년 평생 대운, 현실 고민 3대 솔루션을 담은 정통 감정서',
    subItems: ['마보살 정통 유료 사주풀이', '2027 정묘년 신년운세 비결서', '평생 재물운 & 파재살 방어', '직업·이직·사업운 감정서', '애정·궁합·재회 리포트', '오행 건강 체질'],
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

  const allCategoryProducts = getStoreProductsByCategory('all');
  const products = getStoreProductsByCategory(currentCategory);
  const selectedProduct = currentSelectedProductId ? getStoreProductById(currentSelectedProductId) : null;
  const activeCatObj = STORE_CATEGORIES.find(c => c.id === currentCategory);
  const activeCatLabel = activeCatObj ? activeCatObj.label : '전체 상품';

  // [순수 텍스트 카테고리 메뉴 (아이콘/숫자/박스 배경 완전 제거, 글자만 클릭)]
  const categoryNavHtml = STORE_CATEGORIES.map(cat => {
    const isActive = cat.id === currentCategory && !selectedProduct;
    const meta = STORE_SHORT_LABELS[cat.id] || { short: cat.label };

    return `
      <button type="button" class="btn-store-cat-nav ${isActive ? 'active' : ''}" data-category="${cat.id}" style="background: none; border: none; padding: 0.65rem 1.1rem; cursor: pointer; font-size: 1.05rem; font-weight: ${isActive ? '800' : '600'}; color: ${isActive ? 'var(--primary)' : '#94a3b8'}; position: relative; transition: all 0.2s ease; letter-spacing: -0.01em; display: inline-flex; align-items: center; justify-content: center;">
        <span>${meta.short}</span>
        ${isActive ? '<span style="position: absolute; bottom: 0; left: 1rem; right: 1rem; height: 2.5px; background: var(--primary); border-radius: 2px; box-shadow: 0 0 10px rgba(242, 202, 80, 0.5);"></span>' : ''}
      </button>
    `;
  }).join('');

  // 우측 영역 렌더링 (결제 완료 영수증 vs 상품 상세 페이지 vs 상품 목록 그리드)
  let rightContentHtml = '';

  if (lastCreatedOrder) {
    // 1. 결제 완료 영수증 모드
    const order = lastCreatedOrder;
    rightContentHtml = `
      <div style="background: var(--surface-container); border: 1px solid rgba(242,202,80,0.3); border-radius: 18px; padding: 2.5rem 2rem; text-align: left; box-shadow: var(--shadow-sm);">
        <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(242,202,80,0.15); border: 1px solid var(--primary); color: var(--primary); display: flex; align-items: center; justify-content: flex-start; margin: 0 auto 1.25rem;">
          <span class="material-symbols-outlined" style="font-size: 36px;">check</span>
        </div>
        <h2 style="font-size: 1.6rem; font-weight: 800; color: #fff; margin: 0 0 0.4rem 0;">${order.status === 'pending' ? '주문이 접수되었습니다' : '결제가 성공적으로 완료되었습니다!'}</h2>
        <p style="font-size: 0.9rem; color: #94a3b8; margin: 0 0 2rem 0;">주문번호: ${order.orderId}</p>
        ${order.status === 'pending' ? `<div style="max-width: 520px; margin: -1rem auto 1.5rem; background: rgba(242,202,80,0.08); border: 1px solid rgba(242,202,80,0.35); border-radius: 12px; padding: 1rem 1.15rem; text-align: left; font-size: 0.85rem; color: #e2e8f0; line-height: 1.6;"><strong style="color: var(--primary);">입금 확인 대기 중</strong><br/>기업은행 103-123733-04-012 (템바보드 주식회사)로 <strong>₩ ${order.amount.toLocaleString()}</strong>을 입금해 주세요. 입금자명은 <strong>${esc(order.buyerName)}</strong> 이어야 하며, 관리자가 입금을 확인하면 결제가 완료되어 열람할 수 있습니다.</div>` : ''}

        <div style="max-width: 520px; margin: 0 auto 2rem; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.5rem; text-align: left; font-size: 0.9rem;">
          <div style="display: flex; justify-content: flex-start; gap: 0.75rem; margin-bottom: 0;">
            <span style="color: var(--text-muted);">상품명</span>
            <strong style="color: #fff;">${esc(order.productTitle)}</strong>
          </div>
          <div style="display: flex; justify-content: flex-start; gap: 0.75rem; margin-bottom: 0;">
            <span style="color: var(--text-muted);">결제 금액</span>
            <strong style="color: var(--primary); font-size: 1.05rem;">₩ ${order.amount.toLocaleString()}</strong>
          </div>
          <div style="display: flex; justify-content: flex-start; gap: 0.75rem; margin-bottom: 0;">
            <span style="color: var(--text-muted);">구매자 정보</span>
            <span style="color: #cbd5e1;">${esc(order.buyerName)} (${esc(order.buyerPhone)})</span>
          </div>
          <div style="display: flex; justify-content: flex-start; gap: 0.75rem;">
            <span style="color: var(--text-muted);">수신 이메일</span>
            <span style="color: #cbd5e1;">${esc(order.buyerEmail)}</span>
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
              ${esc(order.buyerName)} 님 감정서 즉시 열람하기 →
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
        <div style="display: flex; align-items: center; justify-content: flex-start; gap: 0.75rem;">
          <button type="button" id="btn-store-back-to-list" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #cbd5e1; padding: 0.45rem 0.85rem; border-radius: 8px; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 0.35rem;">
            <span class="material-symbols-outlined" style="font-size: 16px;">arrow_back</span>
            상품 목록으로 돌아가기
          </button>
          <span style="font-size: 0.78rem; color: var(--text-muted);">
            홈 &gt; ${STORE_CATEGORIES.find(c => c.id === p.category)?.label || p.category} &gt; ${esc(p.title)}
          </span>
        </div>

        <!-- 2컬럼 메인 영역 (좌: 썸네일/정보, 우: 결제창) -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.28); border-radius: 18px; padding: 1.75rem; box-shadow: var(--shadow-sm);">
          
          <!-- 좌측: 상품 대표 이미지 및 네이버 쇼핑형 갤러리 -->
          <div style="display: flex; flex-direction: column; gap: 0.85rem;">
            <!-- 메인 대형 이미지 뷰어 -->
            <div style="position: relative; width: 100%; aspect-ratio: 1 / 1; max-height: 420px; border-radius: 14px; overflow: hidden; background: #0c0f17; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
              ${p.thumbnailUrl ? `
                <img id="store-main-gallery-view" src="${p.thumbnailUrl}" alt="${esc(p.title)}" style="width: 100%; height: 100%; object-fit: cover; transition: opacity 0.2s ease;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
              ` : ''}
              <div id="store-main-gallery-placeholder" style="display: ${p.thumbnailUrl ? 'none' : 'flex'}; width: 100%; height: 100%; align-items: center; justify-content: center; background: rgba(242,202,80,0.08);">
                <span class="material-symbols-outlined" style="font-size: 72px; color: var(--primary);">${p.thumbnailIcon || 'menu_book'}</span>
              </div>
              <div style="position: absolute; top: 12px; left: 12px; display: flex; gap: 0.4rem; z-index: 2;">
                ${isRecommended ? `
                  <span style="background: var(--primary); color: #1c1500; font-size: 0.72rem; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">
                     내 사주 맞춤
                  </span>
                ` : ''}
                ${p.badge ? `
                  <span style="background: rgba(15,19,29,0.85); color: #fff; border: 1px solid rgba(255,255,255,0.2); font-size: 0.72rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px;">
                    ${esc(p.badge)}
                  </span>
                ` : ''}
              </div>
            </div>

            <!-- 네이버 쇼핑형 하단 썸네일 스트립 (클릭/호버 시 메인 사진 즉시 전환) -->
            ${(() => {
              const allGalleryImgs = [p.thumbnailUrl, ...(p.galleryImages || [])].filter(Boolean);
              if (allGalleryImgs.length <= 1) return '';
              return `
                <div style="display: flex; gap: 0.5rem; overflow-x: auto; padding: 0.25rem 0; align-items: center;">
                  ${allGalleryImgs.map((imgUrl, gIdx) => `
                    <button type="button" class="btn-store-gallery-thumb" data-img-url="${esc(imgUrl)}" style="width: 58px; height: 58px; border-radius: 8px; border: 2px solid ${gIdx === 0 ? 'var(--primary)' : 'rgba(255,255,255,0.15)'}; background: #0c0f17; overflow: hidden; padding: 0; cursor: pointer; flex-shrink: 0; transition: border-color 0.15s ease;">
                      <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
                    </button>
                  `).join('')}
                </div>
              `;
            })()}

            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem;">
                <span style="background: rgba(242, 202, 80, 0.12); color: var(--primary); font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 4px;">
                  ${STORE_CATEGORIES.find(c => c.id === p.category)?.label || p.category}
                </span>
                <span style="color: #fbbf24; font-size: 0.8rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.2rem;">
                  <span class="material-symbols-outlined" style="font-size: 15px;">star</span>
                  ${reviewStats.average.toFixed(1)} (${productReviews.length}개 후기)
                </span>
              </div>
              <h1 style="font-size: 1.45rem; font-weight: 800; color: #fff; margin: 0 0 0.4rem 0; line-height: 1.35;">
                ${esc(p.title)}
              </h1>
              <p style="font-size: 0.92rem; color: #94a3b8; line-height: 1.5; margin: 0;">
                ${esc(p.tagLine)}
              </p>
            </div>

            <!-- 가격 블록 -->
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem 1.25rem; display: flex; justify-content: flex-start; gap: 0.75rem; align-items: baseline;">
              <span style="font-size: 0.88rem; color: #cbd5e1;">판매 가격</span>
              <div style="text-align: right;">
                ${discountRate > 0 ? `
                  <div style="font-size: 0.82rem; margin-bottom: 0;">
                    <span style="color: #e2e8f0; font-weight: 800;">${discountRate}% 할인</span>
                    <span style="color: var(--text-muted); text-decoration: line-through; margin-left: 0.35rem;">₩ ${(p.originalPrice || 0).toLocaleString()}</span>
                  </div>
                ` : ''}
                <strong style="font-size: 1.5rem; color: var(--primary); font-family: var(--font-display);">₩ ${p.price.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          <!-- 우측: 빠른 간편 주문 및 결제 폼 -->
          <div style="background: rgba(15, 19, 29, 0.85); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 14px; padding: 1.5rem; display: flex; flex-direction: column; justify-content: flex-start; gap: 0.75rem;">
            <div>
              <h3 style="font-size: 1.05rem; font-weight: 800; color: #fff; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.4rem;">
                <span class="material-symbols-outlined" style="color: var(--primary);">credit_card</span>
                주문자 정보 &amp; 즉시 결제
              </h3>

              <form id="store-checkout-form" data-product-id="${p.id}">
                ${(() => {
                  const savedProf = UserSajuStore.getProfile();
                  if (p.deliveryType === 'saju_report') {
                    const already = savedProf ? isProductAlreadyPurchased(p.id, savedProf.userName) : { purchased: false };
                    return `
                      ${already.purchased ? `
                        <div style="background: rgba(74, 222, 128, 0.12); border: 1px solid rgba(74, 222, 128, 0.35); border-radius: 10px; padding: 0.85rem 1rem; margin-bottom: 0.85rem; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;">
                          <div>
                            <div style="color: #4ade80; font-weight: 800; font-size: 0.88rem; display: flex; align-items: center; gap: 0.3rem;">
                              <span class="material-symbols-outlined" style="font-size: 16px;">verified</span>
                              이미 소장 중인 감정서입니다
                            </div>
                            <div style="color: #cbd5e1; font-size: 0.76rem; margin-top: 0.15rem;">
                              ${esc(savedProf!.userName)} 님의 사주로 이미 결제되어 언제든 다시 열람하실 수 있습니다.
                            </div>
                          </div>
                          <button type="button" class="btn-view-purchased-direct" data-order-id="${already.order?.orderId || ''}" style="background: #4ade80; color: #000; border: none; border-radius: 8px; padding: 0.45rem 0.85rem; font-size: 0.8rem; font-weight: 800; cursor: pointer; white-space: nowrap;">
                            감정서 열람 📖
                          </button>
                        </div>
                      ` : ''}

                      <div style="background: rgba(242, 202, 80, 0.08); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 10px; padding: 0.85rem; margin-bottom: 0.75rem;">
                        <div style="font-size: 0.78rem; font-weight: 800; color: var(--primary); margin-bottom: 0.45rem; display: flex; align-items: center; gap: 0.3rem;">
                          <span class="material-symbols-outlined" style="font-size: 16px;">psychology</span>
                          사주 분석 대상자 (1:1 감정서 생성)
                        </div>
                        ${savedProf ? `
                          <label style="display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.85rem; color: #fff; cursor: pointer; margin-bottom: 0.4rem;">
                            <input type="radio" name="saju-target-choice" value="saved" ${already.purchased ? '' : 'checked'} style="margin-top: 0.2rem;" />
                            <div>
                              <strong>등록된 내 사주로 즉시 분석 ${already.purchased ? '<span style="color: #4ade80; font-size: 0.75rem; margin-left: 0.3rem;">[구매완료]</span>' : '(추천)'}</strong>
                              <div style="font-size: 0.76rem; color: var(--primary); margin-top: 0.1rem; font-weight: 700;">
                                ${esc(savedProf.userName)} 님 (${esc(savedProf.solarBirthDate)} ${esc(savedProf.birthTime || '')} · ${savedProf.gender === 'female' ? '坤命' : '乾命'})
                              </div>
                            </div>
                          </label>
                          <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; color: #94a3b8; cursor: pointer;">
                            <input type="radio" name="saju-target-choice" value="custom" ${already.purchased ? 'checked' : ''} />
                            다른 사람 사주로 분석하기 (가족/지인 선물)
                          </label>
                          <div id="custom-saju-input-fields" style="display: none; margin-top: 0.65rem; padding-top: 0.65rem; border-top: 1px dashed rgba(255,255,255,0.15);">
                            <input type="text" id="custom-saju-name" placeholder="대상자 성명" style="width: 100%; box-sizing: border-box; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.45rem; border-radius: 6px; font-size: 0.8rem; margin-bottom: 0.4rem;" />
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem;">
                              <input type="text" id="custom-saju-birth" placeholder="생년월일(예: 19950412)" style="width: 100%; box-sizing: border-box; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.45rem; border-radius: 6px; font-size: 0.8rem;" />
                              <input type="text" id="custom-saju-time" placeholder="출생시간(예: 0830)" style="width: 100%; box-sizing: border-box; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.45rem; border-radius: 6px; font-size: 0.8rem;" />
                            </div>
                          </div>
                        ` : `
                          <div style="font-size: 0.78rem; color: #cbd5e1; margin-bottom: 0.4rem;">분석 대상자 정보를 입력해 주세요:</div>
                          <input type="text" id="custom-saju-name" required placeholder="대상자 성명" style="width: 100%; box-sizing: border-box; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.45rem; border-radius: 6px; font-size: 0.8rem; margin-bottom: 0.4rem;" />
                          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem;">
                            <input type="text" id="custom-saju-birth" required placeholder="생년월일(예: 19950412)" style="width: 100%; box-sizing: border-box; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.45rem; border-radius: 6px; font-size: 0.8rem;" />
                            <input type="text" id="custom-saju-time" placeholder="출생시간(예: 0830)" style="width: 100%; box-sizing: border-box; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.45rem; border-radius: 6px; font-size: 0.8rem;" />
                          </div>
                        `}
                      </div>
                    `;
                  }
                  return '';
                })()}

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.65rem;">
                  <div>
                    <label style="font-size: 0.76rem; color: var(--text-muted); display: block; margin-bottom: 0.2rem;">주문자 성명 *</label>
                    <input type="text" id="order-buyer-name" required value="${esc(AuthService.getCurrentUser().role !== 'guest' ? AuthService.getCurrentUser().name : (UserSajuStore.getProfile()?.userName || ''))}" placeholder="홍길동" style="width: 100%; box-sizing: border-box; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.55rem; border-radius: 6px; font-size: 0.82rem;" />
                  </div>
                  <div>
                    <label style="font-size: 0.76rem; color: var(--text-muted); display: block; margin-bottom: 0.2rem;">휴대폰 연락처 *</label>
                    <input type="tel" id="order-buyer-phone" required value="${esc(AuthService.getCurrentUser().role !== 'guest' && AuthService.getCurrentUser().phone ? AuthService.getCurrentUser().phone! : '')}" placeholder="010-0000-0000" style="width: 100%; box-sizing: border-box; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.55rem; border-radius: 6px; font-size: 0.82rem;" />
                  </div>
                </div>

                <div style="margin-bottom: 0.65rem;">
                  <label style="font-size: 0.76rem; color: var(--text-muted); display: block; margin-bottom: 0.2rem;">수신 이메일 (디지털 링크 발송) *</label>
                  <input type="email" id="order-buyer-email" required placeholder="name@domain.com" style="width: 100%; box-sizing: border-box; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.55rem; border-radius: 6px; font-size: 0.82rem;" />
                </div>

                ${p.deliveryType === 'shipping' ? `
                  <div style="margin-bottom: 0.65rem;">
                    <label style="font-size: 0.76rem; color: #fbbf24; display: block; margin-bottom: 0.2rem; font-weight: 700;">
                      <span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">local_shipping</span> 실물 상품 배송지 주소 *
                    </label>
                    <input type="text" id="order-shipping-address" required placeholder="상세 수령지 주소를 입력해 주세요" style="width: 100%; box-sizing: border-box; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.55rem; border-radius: 6px; font-size: 0.82rem;" />
                  </div>
                ` : ''}

                ${renderPaymentMethodSelector(p.price)}

                <div style="display: grid; grid-template-columns: 1fr 1.35fr; gap: 0.65rem; margin-top: 0.75rem;">
                  <button type="button" class="btn-add-to-cart-from-detail" data-product-id="${p.id}" style="background: rgba(242, 202, 80, 0.12); color: var(--primary); border: 1px solid rgba(242, 202, 80, 0.35); font-size: 0.88rem; font-weight: 800; border-radius: 10px; padding: 0.85rem 0.5rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.3rem; transition: all 0.15s ease;">
                    <span class="material-symbols-outlined" style="font-size: 18px;">add_shopping_cart</span>
                    장바구니 담기
                  </button>
                  <button type="submit" style="width: 100%; background: var(--primary); color: #1c1500; font-size: 0.95rem; font-weight: 800; border: none; border-radius: 10px; padding: 0.85rem; cursor: pointer; box-shadow: 0 4px 16px rgba(242,202,80,0.35); transition: transform 0.15s ease;">
                    주문서 확인 및 결제 →
                  </button>
                </div>
              </form>
            </div>
            
            <p style="font-size: 0.74rem; color: var(--text-muted); margin: 1rem 0 0 0; text-align: left; line-height: 1.4;">
              
            </p>
          </div>

        </div>

        <!-- 하단 1: 상품 상세 설명 본문 (목차, 추천 대상, 특징 & 네이버 쇼핑형 상세페이지 이미지) -->
        <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 2rem;">
          <h3 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0 0 1rem 0; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1rem;">
            상품 상세 안내 &amp; 제공 방식
          </h3>

          <!-- 네이버 쇼핑형 세로 상세페이지 이미지 갤러리 -->
          ${(p.detailImages && p.detailImages.length > 0) ? `
            <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.75rem; align-items: center;">
              ${p.detailImages.map(imgUrl => `
                <div style="width: 100%; max-width: 720px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); background: #0c0f17; box-shadow: 0 4px 20px rgba(0,0,0,0.4);">
                  <img src="${imgUrl}" alt="상세 안내 이미지" style="width: 100%; height: auto; display: block;" loading="lazy" />
                </div>
              `).join('')}
            </div>
          ` : ''}

          <p style="font-size: 0.92rem; color: #d1d5db; line-height: 1.7; margin: 0 0 1.25rem 0;">
            ${esc(p.description)}
          </p>
          ${p.detailsHtml || ''}
        </div>

        <!-- 하단 2: 구매자 리얼 후기 & 별점 평가 -->
        <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 2rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1.25rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem;">
                <h3 style="font-size: 1.2rem; font-weight: 800; color: #fff; margin: 0;">
                  구매자 실시간 이용 후기
                </h3>
                <span style="background: rgba(242, 202, 80, 0.15); color: var(--primary); font-size: 0.8rem; font-weight: 800; padding: 0.15rem 0.55rem; border-radius: 9999px;">
                  ${productReviews.length}건
                </span>
              </div>
              <p style="font-size: 0.82rem; color: #94a3b8; margin: 0;">
                실제 구매를 완료한 회원님들의 진솔하고 검증된 이용 후기입니다.
              </p>
            </div>
            
            <div style="display: flex; align-items: center; gap: 1.25rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); padding: 0.75rem 1.25rem; border-radius: 12px;">
              <div style="text-align: center;">
                <div style="font-size: 1.6rem; font-weight: 900; color: #fbbf24; line-height: 1;">
                  ${reviewStats.average.toFixed(1)}
                </div>
                <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 0.2rem;">5.0 만점</div>
              </div>
              <div style="border-left: 1px solid rgba(255,255,255,0.1); padding-left: 1.25rem; font-size: 0.8rem; color: #cbd5e1; line-height: 1.5;">
                <div style="color: #fbbf24; letter-spacing: 2px;">★★★★★</div>
                <div>만족도 <strong>99.4%</strong></div>
              </div>
            </div>
          </div>

          <!-- 후기 목록 카드 리스트 -->
          ${productReviews.length === 0 ? `
            <div style="text-align: center; padding: 3rem 1rem; background: rgba(255, 255, 255, 0.02); border-radius: 12px; border: 1px dashed rgba(255, 255, 255, 0.12);">
              <span class="material-symbols-outlined" style="font-size: 36px; color: var(--text-muted); margin-bottom: 0.5rem;">rate_review</span>
              <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted);">아직 등록된 후기가 없습니다. 첫 번째 검증 후기를 남겨보세요!</p>
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
              ${productReviews.map(rev => `
                <div style="background: rgba(255, 255, 255, 0.025); border: 1px solid ${rev.isBest ? 'rgba(242, 202, 80, 0.3)' : 'rgba(255, 255, 255, 0.07)'}; border-radius: 14px; padding: 1.35rem; transition: border-color 0.2s ease;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; flex-wrap: wrap; gap: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                      ${rev.isBest ? `
                        <span style="background: rgba(242, 202, 80, 0.15); color: var(--primary); font-size: 0.72rem; font-weight: 800; padding: 0.18rem 0.55rem; border-radius: 4px; border: 1px solid rgba(242, 202, 80, 0.4);">
                          BEST 리뷰
                        </span>
                      ` : ''}
                      <span style="color: #fbbf24; font-size: 0.92rem; letter-spacing: 1px;">
                        ${'★'.repeat(Math.max(1, Math.min(5, rev.rating)))}${'☆'.repeat(5 - Math.max(1, Math.min(5, rev.rating)))}
                      </span>
                      <span style="font-size: 0.88rem; font-weight: 700; color: #fff;">
                        ${esc(rev.authorName || '구매회원')}
                      </span>
                      <span style="font-size: 0.72rem; color: #4ade80; background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.25); padding: 0.12rem 0.45rem; border-radius: 4px; font-weight: 700;">
                        실제 구매 인증
                      </span>
                    </div>
                    <span style="font-size: 0.78rem; color: #94a3b8;">
                      ${rev.createdAt ? new Date(rev.createdAt).toISOString().slice(0, 10).replace(/-/g, '.') : ''}
                    </span>
                  </div>

                  ${rev.tags && rev.tags.length > 0 ? `
                    <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.75rem;">
                      ${rev.tags.map(t => `
                        <span style="font-size: 0.74rem; background: rgba(255, 255, 255, 0.05); color: #cbd5e1; border: 1px solid rgba(255, 255, 255, 0.1); padding: 0.15rem 0.5rem; border-radius: 9999px;">
                          # ${esc(t)}
                        </span>
                      `).join('')}
                    </div>
                  ` : ''}

                  <p style="font-size: 0.92rem; color: #e2e8f0; line-height: 1.65; margin: 0; white-space: pre-line;">
                    ${esc(rev.content)}
                  </p>
                </div>
              `).join('')}
            </div>
          `}
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
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem;">
        ${products.map(p => {
          const isRecommended = p.targetSignals.some(sig => userSignals.includes(sig));
          const discountRate = p.originalPrice && p.originalPrice > p.price
            ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
            : 0;
          const reviewStats = ProductReviewStore.getReviewStats(p.id);

          return `
            <div class="store-product-card" data-product-id="${p.id}" style="background: var(--surface-container); border: 1px solid ${isRecommended ? 'rgba(242, 202, 80, 0.45)' : 'rgba(255,255,255,0.08)'}; border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; box-shadow: ${isRecommended ? '0 4px 20px rgba(242,202,80,0.12)' : 'var(--shadow-sm)'}; transition: transform 0.2s ease, border-color 0.2s ease; cursor: pointer;">
              
              <!-- 썸네일 영역 -->
              <div style="position: relative; width: 100%; aspect-ratio: 16 / 10; background: #0c0f17; overflow: hidden;">
                ${p.thumbnailUrl ? `
                  <img src="${p.thumbnailUrl}" alt="${esc(p.title)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                ` : ''}
                <div style="display: ${p.thumbnailUrl ? 'none' : 'flex'}; width: 100%; height: 100%; align-items: center; justify-content: flex-start; background: rgba(242,202,80,0.08);">
                  <span class="material-symbols-outlined" style="font-size: 44px; color: var(--primary);">${p.thumbnailIcon || 'menu_book'}</span>
                </div>

                <div style="position: absolute; top: 10px; left: 10px; display: flex; flex-wrap: wrap; gap: 0.35rem;">
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

              <!-- 내용 -->
              <div style="padding: 1.15rem; display: flex; flex-direction: column; flex: 1; justify-content: flex-start; gap: 0.75rem;">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                    <span style="font-size: 0.72rem; color: var(--primary); font-weight: 700;">
                      ${STORE_CATEGORIES.find(c => c.id === p.category)?.label || p.category}
                    </span>
                    <span style="color: #fbbf24; font-size: 0.74rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.15rem;">
                      ★ ${reviewStats.average.toFixed(1)} (${reviewStats.count})
                    </span>
                  </div>
                  <h3 style="font-size: 1rem; font-weight: 700; color: #fff; margin: 0 0 0.4rem 0; line-height: 1.4;">
                    ${esc(p.title)}
                  </h3>
                  <p style="font-size: 0.8rem; color: #94a3b8; margin: 0 0 0.85rem 0; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    ${esc(p.tagLine)}
                  </p>
                </div>

                <!-- 가격 & 버튼 -->
                <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.85rem; display: flex; justify-content: flex-start; gap: 0.75rem; align-items: flex-end;">
                  <div>
                    ${discountRate > 0 ? `
                      <div style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem;">
                        <span style="color: #e2e8f0; font-weight: 800;">${discountRate}%</span>
                        <span style="color: var(--text-muted); text-decoration: line-through;">₩ ${(p.originalPrice || 0).toLocaleString()}</span>
                      </div>
                    ` : ''}
                    <div style="font-size: 1.15rem; font-weight: 800; color: #fff; font-family: var(--font-display);">
                      ₩ ${p.price.toLocaleString()}
                    </div>
                  </div>
                  <button type="button" class="btn-open-product-detail" data-product-id="${p.id}" style="background: var(--primary); color: #1c1500; font-size: 0.8rem; font-weight: 700; border: none; border-radius: 8px; padding: 0.45rem 0.85rem; cursor: pointer;">
                    자세히 보기 →
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
        <div style="display: flex; justify-content: flex-start; gap: 0.75rem; align-items: baseline; margin-bottom: 0;">
          <h2 style="font-size: 1.35rem; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 0.45rem;">
            <span class="material-symbols-outlined" style="color: var(--primary);">${activeCatInfo.icon}</span>
            ${activeCatInfo.label} (${products.length})
          </h2>
          <span style="font-size: 0.78rem; color: var(--text-muted);">클릭 시 상품 상세 및 결제 화면으로 이동합니다.</span>
        </div>
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

    <div class="commerce-store-container" style="max-width: 1440px; width: 100%; margin: 0 auto; padding: 1.5rem 1rem 3rem; box-sizing: border-box;">
      
      <!-- 상단 히어로 배너 -->
      <div style="background: linear-gradient(135deg, rgba(242, 202, 80, 0.12), rgba(15, 19, 29, 0.95)); border: 1px solid rgba(242, 202, 80, 0.28); border-radius: 18px; padding: 1.75rem 1.5rem; margin-bottom: 2rem; position: relative; overflow: hidden;">
        <span style="background: rgba(242, 202, 80, 0.15); color: var(--primary); border: 1px solid rgba(242, 202, 80, 0.35); font-size: 0.72rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 9999px;">
          MABOSAL STORE
        </span>
        <h1 style="font-size: 1.65rem; font-weight: 800; color: #ffffff; margin: 0.6rem 0 0.35rem 0; line-height: 1.3;">
          사주 진단과 이어지는 <span style="color: var(--primary);">실전 라이프 솔루션 스토어</span>
        </h1>
        <p style="font-size: 0.88rem; color: #94a3b8; line-height: 1.45; margin: 0;">
          5대 특화 운세 리포트부터 재테크 전자책, VOD 특강, 1:1 상담권까지 원하는 카테고리를 둘러보고 즉시 이용하세요.
        </p>
      </div>

      
      <!-- [상단 원스톱 쿠폰 & 상품권 등록 바] -->
      <div class="store-voucher-bar" style="background: linear-gradient(135deg, rgba(242, 202, 80, 0.1), rgba(15, 20, 32, 0.95)); border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 14px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.85rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);">
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <span class="material-symbols-outlined" style="font-size: 24px; color: var(--primary);">confirmation_number</span>
          <div>
            <div style="font-size: 0.92rem; font-weight: 800; color: #ffffff;">쿠폰 / 상품권 등록 (즉시 열람 승인)</div>
            <div style="font-size: 0.76rem; color: #cbd5e1; margin-top: 0.15rem;">
              19,900원 사주 진단서 무료 쿠폰 <span style="color: var(--primary); font-weight: 700;">(코드: MABOSAL-FREE)</span> or 신년운세 할인권
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 260px; max-width: 420px;">
          <input type="text" id="input-store-voucher" placeholder="쿠폰 또는 상품권 코드 입력" style="flex: 1; background: #0c0f17; border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 0.55rem 0.85rem; border-radius: 8px; font-size: 0.85rem; text-transform: uppercase;" />
          <button type="button" id="btn-submit-voucher" style="background: var(--primary); color: #1c1500; font-weight: 800; font-size: 0.85rem; border: none; border-radius: 8px; padding: 0.55rem 1.1rem; cursor: pointer; white-space: nowrap; box-shadow: 0 2px 10px rgba(242,202,80,0.3);">
            등록/승인
          </button>
        </div>
      </div>

      <!-- [깔끔한 순수 텍스트 카테고리 메뉴 바 + 우측 장바구니 버튼] -->
      <nav class="store-text-category-bar" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 0.25rem; margin-bottom: 2.5rem; overflow-x: auto; scrollbar-width: none; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: nowrap;">
          ${categoryNavHtml}
        </div>
        <button type="button" id="btn-open-cart-modal" style="background: rgba(242, 202, 80, 0.15); border: 1px solid rgba(242, 202, 80, 0.4); color: var(--primary); font-weight: 800; font-size: 0.85rem; padding: 0.5rem 0.95rem; border-radius: 9999px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem; white-space: nowrap; transition: all 0.2s ease;">
          <span class="material-symbols-outlined" style="font-size: 19px;">shopping_bag</span>
          장바구니 <span style="background: var(--primary); color: #000; font-size: 0.72rem; padding: 0.1rem 0.45rem; border-radius: 9999px; font-weight: 900;">${CartStore.getCount()}</span>
        </button>
      </nav>

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
