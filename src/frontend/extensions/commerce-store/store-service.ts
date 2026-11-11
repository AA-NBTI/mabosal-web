
export const OFFICIAL_BANK_ACCOUNT = {
  bankName: '기업은행',
  accountNumber: '103-123733-04-012',
  holder: '템바보드 주식회사',
};
/**
 * 마보살 인하우스 커머스 스토어 데이터 & 주문 서비스
 * 정밀 사주 리포트 + 전자책, VOD 강의, 굿즈 지원
 */

import type { StoreCategory, StoreCategoryType, StoreOrder, StoreProduct } from './types.js';
import { UserSajuStore } from '../../state/user-saju-store.js';
import { getIdentity, ownsRecord } from '../../modules/identity/index.js';
import { getStorage } from '../../modules/persistence/index.js';
import {
  SAJU_BOOK_VOL1_PRODUCT
} from './saju-book-data.js';
import { VoucherStore } from '../../modules/voucher/voucher-store.js';
import { supabase } from '../../modules/supabase/supabase-client.js';

const STORAGE_PRODUCTS_KEY = 'mabosal_store_products_v7';
const STORAGE_ORDERS_KEY = 'mabosal_store_orders';
const STORAGE_CATEGORIES_KEY = 'mabosal_store_categories_v1';
const STORAGE_DELETED_PRODUCTS_KEY = 'mabosal_store_deleted_products_v1';

export const INITIAL_STORE_CATEGORIES: StoreCategory[] = [
  { id: 'all', label: '전체 상품', icon: 'apps' },
  { id: 'report', label: '사주', icon: 'auto_awesome' },
  { id: 'ebook', label: '도서', icon: 'menu_book' },
  { id: 'lecture', label: '강의', icon: 'smart_display' },
  { id: 'goods', label: '굿즈', icon: 'token' },
];

/** 등록된 동적 스토어 카테고리 목록 조회 */
export function getStoreCategories(): StoreCategory[] {
  if (typeof window === 'undefined' || !window.localStorage) return [...INITIAL_STORE_CATEGORIES];
  try {
    const raw = localStorage.getItem(STORAGE_CATEGORIES_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(INITIAL_STORE_CATEGORIES));
      return [...INITIAL_STORE_CATEGORIES];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // 구버전 카테고리(voucher, consulting 등)가 포함되어 있거나 이전 명칭(리포트 등)인 경우 최신 카테고리로 자동 갱신
      const hasOldCategory = parsed.some((c: any) => c.id === 'voucher' || c.id === 'consulting');
      const hasOldLabel = parsed.some((c: any) => (c.id === 'report' && c.label !== '사주') || (c.id === 'ebook' && c.label !== '도서') || (c.id === 'lecture' && c.label !== '강의') || (c.id === 'goods' && c.label !== '굿즈'));
      if (hasOldCategory || hasOldLabel) {
        localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(INITIAL_STORE_CATEGORIES));
        return [...INITIAL_STORE_CATEGORIES];
      }
      return parsed;
    }
  } catch (e) {
    console.warn('[store-service] getStoreCategories load error:', e);
  }
  return [...INITIAL_STORE_CATEGORIES];
}

/** 동적 스토어 카테고리 영구 저장 */
export function saveStoreCategories(categories: StoreCategory[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(categories));
  } catch (e) {
    console.warn('[store-service] saveStoreCategories error:', e);
  }
}

/** 신규 스토어 카테고리 추가 */
export function addStoreCategory(cat: { id: string; label: string; icon?: string }): { success: boolean; message: string } {
  const cleanId = cat.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const cleanLabel = cat.label.trim();
  if (!cleanId || !cleanLabel) {
    return { success: false, message: '카테고리 영문 ID와 표시 명칭을 모두 입력해주세요.' };
  }
  const current = getStoreCategories();
  if (current.some(c => c.id === cleanId)) {
    return { success: false, message: '이미 존재하는 카테고리 ID입니다.' };
  }
  current.push({
    id: cleanId,
    label: cleanLabel,
    icon: cat.icon?.trim() || 'category',
  });
  saveStoreCategories(current);
  return { success: true, message: `[${cleanLabel}] 카테고리가 등록되었습니다.` };
}

/** 스토어 카테고리 수정 (표시 명칭 및 아이콘 수정) */
export function updateStoreCategory(id: string, updates: { label: string; icon?: string }): { success: boolean; message: string } {
  const cleanLabel = (updates.label || '').trim();
  if (!cleanLabel) {
    return { success: false, message: '카테고리 표시 명칭을 입력해주세요.' };
  }
  const current = getStoreCategories();
  const targetCat = current.find(c => c.id === id);
  if (!targetCat) {
    return { success: false, message: '수정할 카테고리를 찾을 수 없습니다.' };
  }
  targetCat.label = cleanLabel;
  if (updates.icon && updates.icon.trim()) {
    targetCat.icon = updates.icon.trim();
  }
  saveStoreCategories(current);
  return { success: true, message: `[${cleanLabel}] 카테고리가 성공적으로 수정되었습니다.` };
}

/** 스토어 카테고리 삭제 (A방식: 등록된 상품이 있을 경우 기본 카테고리로 안전 자동 이전) */
export function deleteStoreCategory(id: string): { success: boolean; message: string; migratedCount: number } {
  if (id === 'all') {
    return { success: false, message: '[전체 상품] 기본 카테고리는 삭제할 수 없습니다.', migratedCount: 0 };
  }
  const current = getStoreCategories();
  const next = current.filter(c => c.id !== id);
  if (next.length === current.length) {
    return { success: false, message: '삭제할 카테고리를 찾을 수 없습니다.', migratedCount: 0 };
  }

  // [A 방식] 삭제 대상 카테고리에 속한 모든 상품을 기본 카테고리('report')로 안전하게 자동 이전
  const allProducts = getAllStoreProducts();
  let migratedCount = 0;
  allProducts.forEach(p => {
    if (p.category === id) {
      p.category = 'report';
      migratedCount++;
    }
  });

  if (migratedCount > 0 && typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(allProducts));
  }

  saveStoreCategories(next);
  return { 
    success: true, 
    message: migratedCount > 0
      ? `[${id}] 카테고리가 삭제되었습니다.\n(소속 상품 ${migratedCount}건이 기본 '정밀 리포트' 카테고리로 안전하게 이전되었습니다.)`
      : '카테고리가 삭제되었습니다.',
    migratedCount
  };
}

/** 하위 호환용 상수 */
export const STORE_CATEGORIES: StoreCategory[] = INITIAL_STORE_CATEGORIES;

export const INITIAL_STORE_PRODUCTS: StoreProduct[] = [
  // 1. [전자책] 정통 사주명리학 원론 제1권: 음양오행(陰陽五行)과 천간·지지·지장간… (29,000원)
  SAJU_BOOK_VOL1_PRODUCT,

  // 2. [전자책] 마보살의 사주 셀프 리딩 가이드 (14,900원)
  {
    id: 'prod-ebook-saju-self-guide',
    title: '[전자책] 마보살의 사주 셀프 리딩 가이드: 한자 몰라도 3분 만에 읽는 나만의 인생 내비게이션',
    category: 'ebook',
    price: 14900,
    originalPrice: 25000,
    tagLine: '51만 가지 사주 조합에서 내 기질과 대운 타이밍을 스스로 읽어내는 정통 실용 명리 공식 가이드북',
    badge: 'NEW · 추천',
    description: '어려운 한자나 고전 암기 없이, 10개 일간 도감, 오행 에너지 밸런스 개운법, 십신 커리어 무기, 10년 대운 타이밍 설계를 3분 만에 스스로 읽어낼 수 있는 마보살 디지털 랩의 실용 명리학 라이프 공식 가이드북(PDF 소장본)입니다.',
    detailsHtml: `
      <div style="line-height: 1.7; font-size: 0.9rem; color: #d1d5db;">
        <!-- 상단 혜택 안내 -->
        <div style="background: rgba(242, 202, 80, 0.08); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem;">
          <h4 style="color: var(--primary); margin: 0 0 0.5rem 0; font-size: 1rem; display: flex; align-items: center; gap: 0.4rem;">
            <span class="material-symbols-outlined" style="font-size: 20px;">menu_book</span>
            MABOSAL DIGITAL EDITION • 실용 명리학 라이프 시리즈 01
          </h4>
          <p style="margin: 0 0 0.5rem 0; color: #e2e8f0; font-size: 0.88rem;">
            "사주팔자는 정해진 숙명이 아닙니다. 내가 세상에 태어날 때 부여받은 기질의 일기예보이자, 인생의 중요한 전환점마다 최선의 결정을 돕는 정밀한 라이프 내비게이션입니다."
          </p>
          <ul style="margin: 0; padding-left: 1.2rem; color: #cbd5e1; font-size: 0.84rem;">
            <li><strong>형식</strong>: 고화질 정식 디지털 전자책 (PDF 다운로드 소장본)</li>
            <li><strong>발행처</strong>: 마보살 디지털 랩 (Mabosal Digital Lab) • 2026-2027 정식 발행본</li>
            <li><strong>제공 혜택</strong>: 결제 완료 즉시 평생 소장 가능한 PDF 파일 다운로드 링크 발급 및 인쇄 허용</li>
          </ul>
        </div>

        <!-- 상세 목차 구성 -->
        <h4 style="color: #ffffff; margin: 0 0 0.75rem 0; font-size: 1.05rem;">
          [전자책 핵심 목차 &amp; 구성]
        </h4>
        <div style="display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1.5rem;">
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.75rem 1rem;">
            <strong style="color: var(--primary);">프롤로그 | 운명을 믿지 않아도 사주를 알아야 하는 이유</strong>
            <p style="margin: 0.2rem 0 0 0; font-size: 0.82rem; color: #94a3b8;">MBTI를 넘어선 51만 8,400가지 영혼의 하드웨어 스펙과 동양의 계절학적 심리 행동 통계</p>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.75rem 1rem;">
            <strong style="color: var(--primary);">1장 | 3분 만에 내 사주 원국 소환하기 (마보살 만세력 가이드)</strong>
            <p style="margin: 0.2rem 0 0 0; font-size: 0.82rem; color: #94a3b8;">년·월·일·시 4개 기둥의 의미와 내 게임 캐릭터의 본체인 핵심 '일간(日干)' 확인법</p>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.75rem 1rem;">
            <strong style="color: var(--primary);">2장 | 나를 정의하는 진짜 캐릭터: 10개 일간(日干) 도감</strong>
            <p style="margin: 0.2rem 0 0 0; font-size: 0.82rem; color: #94a3b8;">갑목(거목)부터 계수(봄비)까지 10대 자연 원형으로 풀어낸 타고난 포텐셜과 개운 처방전</p>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.75rem 1rem;">
            <strong style="color: var(--primary);">3장 | 내 삶의 에너지 밸런스: 오행(목·화·토·금·수)과 개운법</strong>
            <p style="margin: 0.2rem 0 0 0; font-size: 0.82rem; color: #94a3b8;">오행 에너지 흐름과 일상에서 부족한 기운을 즉각 채우는 마보살 실천 라이프 해킹</p>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.75rem 1rem;">
            <strong style="color: var(--primary);">4장 | 사회적 무기와 현실 자산: 십신(十神)으로 읽는 커리어와 돈</strong>
            <p style="margin: 0.2rem 0 0 0; font-size: 0.82rem; color: #94a3b8;">비겁·식상·재성·관성·인성으로 판별하는 직장인 체질 vs 사업가 체질 맞춤 처방</p>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.75rem 1rem;">
            <strong style="color: var(--primary);">5장 | 기회의 파도를 타는 법: 대운과 세운의 타이밍 설계</strong>
            <p style="margin: 0.2rem 0 0 0; font-size: 0.82rem; color: #94a3b8;">10년 단위 계절(대운)과 매년의 날씨(세운)를 활용한 인생 액션 플랜 및 교운기 극복 지혜</p>
          </div>
        </div>

        <!-- 리딩 팁 -->
        <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 1rem;">
          <strong style="color: #38bdf8;">💡 전자책 200% 활용 리딩 팁</strong><br/>
          순서대로 통독하셔도 좋고, mabosal.com에서 내 사주 원국을 먼저 확인한 뒤 내 일간(2장)이나 대운(5장)을 바로 찾아 읽으셔도 좋습니다.
        </div>
      </div>
    `,
    thumbnailUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    thumbnailIcon: 'menu_book',
    deliveryType: 'digital_download',
    contentPayload: '/downloads/mabosal_saju_self_reading_guide.pdf',
    targetSignals: ['general.knowledge', 'wealth.flow', 'career.change'],
    status: 'active',
    createdAt: '2026-10-17',
    salesCount: 87,
  },

  // 3. [정통 사주] 정통사주: 평생 대운 & 18개 정밀 심층 리포트 (39,900원)
  {
    id: 'prod-paid-saju-premium',
    title: '정통사주: 평생 대운 & 18개 정밀 심층 리포트',
    category: 'report',
    price: 39900,
    originalPrice: 59000,
    tagLine: '18개 정밀 챕터 + 12개월 월운 상세 흐름 완벽 수록',
    badge: '인기 1위',
    description: '사주 원국과 오행 분포, 대운의 흐름을 심층 분석하여 18개 핵심 챕터와 12개월 월운 전체를 완벽 해설한 베스트셀러 정통 리포트입니다.',
    detailsHtml: `
      <div style="line-height: 1.7; font-size: 0.9rem; color: #d1d5db;">
        <h4 style="color: var(--primary); margin: 0 0 0.5rem 0;">정통 사주풀이 18개 정밀 섹션 구성</h4>
        <ul style="margin: 0; padding-left: 1.2rem; color: #cbd5e1; font-size: 0.88rem;">
          <li>원국과 오행의 균형 및 격국 심층 해설</li>
          <li>10년 대운과 직업·재물·연애운 흐름</li>
          <li>12개월 월별 운세 흐름 및 주의 시기</li>
          <li>사주 맞춤형 일상 개운법 및 실천 지침</li>
        </ul>
      </div>
    `,
    thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
    ],
    thumbnailIcon: 'auto_stories',
    deliveryType: 'saju_report',
    contentPayload: 'PAID_REPORT',
    reportTier: 'PAID',
    targetSignals: ['wealth.flow', 'career.change', 'mind.stress'],
    status: 'active',
    createdAt: '2026-10-01',
    salesCount: 312,
  },

  // 4. [정통 사주] 상충·마·살: 관계 갈등 & 이직·퇴사 특화 리포트 (79,900원)
  {
    id: 'prod-saju-conflict',
    title: '상충·마·살: 관계 갈등 & 이직·퇴사 특화 리포트',
    category: 'report',
    price: 79900,
    originalPrice: 120000,
    tagLine: '인간관계 충돌(축진파/인사해), 퇴사 vs 잔류 4주 집중 점검',
    badge: '갈등 특화',
    description: '내 사주에 얽힌 충(衝), 형(刑), 파(破), 해(害)와 살(煞)의 충돌 지점을 정밀 분석하여 인간관계 스트레스와 이직·퇴사의 유불리를 명쾌하게 판정합니다.',
    detailsHtml: `
      <div style="line-height: 1.7; font-size: 0.9rem; color: #d1d5db;">
        <h4 style="color: var(--primary); margin: 0 0 0.5rem 0;">상충·마·살 20개 섹션 분석 내용</h4>
        <ul style="margin: 0; padding-left: 1.2rem; color: #cbd5e1; font-size: 0.88rem;">
          <li>원국 내 상충 및 원진, 귀문관살 정밀 검증</li>
          <li>직장 동료 및 상사와의 관계 갈등 회피법</li>
          <li>손재마 및 관재구설 방어 행동 처방</li>
        </ul>
      </div>
    `,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    ],
    thumbnailIcon: 'bolt',
    deliveryType: 'saju_report',
    contentPayload: 'CONFLICT_MALSAL',
    reportTier: 'CONFLICT_MALSAL',
    targetSignals: ['mind.stress', 'career.transition'],
    status: 'active',
    createdAt: '2026-10-01',
    salesCount: 94,
  },
];


/** 삭제된 상품 ID 세트 조회 (관리자가 삭제한 상품의 부활 방지) */
export function getDeletedStoreProductIds(): Set<string> {
  if (typeof localStorage === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_DELETED_PRODUCTS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

/** 삭제된 상품 ID 영구 기록 */
export function addDeletedStoreProductId(id: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const set = getDeletedStoreProductIds();
    set.add(id);
    localStorage.setItem(STORAGE_DELETED_PRODUCTS_KEY, JSON.stringify([...set]));
  } catch {}
}

/** 등록된 모든 상품 조회 */
export function getAllStoreProducts(): StoreProduct[] {
  const deletedIds = getDeletedStoreProductIds();
  if (typeof localStorage === 'undefined') return INITIAL_STORE_PRODUCTS.filter(p => !deletedIds.has(p.id));
  try {
    const raw = localStorage.getItem(STORAGE_PRODUCTS_KEY);
    if (!raw) {
      const initialFiltered = INITIAL_STORE_PRODUCTS.filter(p => !deletedIds.has(p.id));
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(initialFiltered));
      return initialFiltered;
    }
    let saved = JSON.parse(raw) as StoreProduct[];
    // 삭제된 상품이 localStorage에 남아있다면 즉시 제거
    if (saved.some(p => deletedIds.has(p.id))) {
      saved = saved.filter(p => !deletedIds.has(p.id));
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(saved));
    }
    // [v2.0.6] 폐기/종료된 구버전 상품 전면 소거 (PC에서 종료/제거된 상품이 모바일 및 다른 기기에 노출되지 않도록 영구 격리)
    const deprecatedProductIds = new Set([
      'prod-voucher-50k', 'prod-voucher-30k', 'prod-voucher-10k', 'prod-consult-vip',
      'book-saju-principles-vol2', 'book-saju-principles-vol3', 'book-saju-principles-vol4',
      'prod-free-experience', 'prod-paid-saju-vip', 'prod-saju-entry-promo',
      'prod-report-year2027', 'prod-report-career', 'prod-report-wealth',
      'prod-report-relation', 'prod-report-reunion', 'prod-report-chemistry',
      'prod-ebook-wealth', 'prod-vod-career', 'prod-goods-amulet'
    ]);
    if (saved.some(p => deprecatedProductIds.has(p.id) || p.category === 'voucher' || p.category === 'consulting')) {
      saved = saved.filter(p => !deprecatedProductIds.has(p.id) && p.category !== 'voucher' && p.category !== 'consulting');
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(saved));
    }
    // 초기 상품 목록 중 로컬 스토리지에 없는 상품들 자동 병합 (단, 관리자가 명시적으로 삭제한 상품은 절대 복원하지 않음)
    let merged = false;
    for (const initP of INITIAL_STORE_PRODUCTS) {
      if (!deletedIds.has(initP.id) && !saved.some(p => p.id === initP.id)) {
        saved.push(initP);
        merged = true;
      }
    }
    // [v2.0.6] 정예 4대 상품 (제1권 원론, 셀프리딩, 정통사주, 상충마살) 최신 타이틀 및 데이터 동기화
    const V206_SYNC_KEY = 'mabosal_store_sync_v206';
    if (localStorage.getItem(V206_SYNC_KEY) !== 'done') {
      const initMap = new Map(INITIAL_STORE_PRODUCTS.map(p => [p.id, p]));
      for (let i = 0; i < saved.length; i++) {
        const initP = initMap.get(saved[i].id);
        if (initP) {
          saved[i] = {
            ...saved[i],
            title: initP.title,
            category: initP.category,
            price: initP.price,
            originalPrice: initP.originalPrice,
            badge: initP.badge,
            tagLine: initP.tagLine,
            description: initP.description,
            detailsHtml: initP.detailsHtml,
            thumbnailUrl: initP.thumbnailUrl,
            galleryImages: initP.galleryImages || saved[i].galleryImages,
          };
          merged = true;
        }
      }
      localStorage.setItem(V206_SYNC_KEY, 'done');
    }
    if (merged) {
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(saved));
    }
    return saved;
  } catch {
    return [...INITIAL_STORE_PRODUCTS];
  }
}

/** 카테고리별 상품 필터링 (고객용: 숨김 상품 제외) */
export function getStoreProductsByCategory(category: StoreCategoryType = 'all'): StoreProduct[] {
  const all = getAllStoreProducts();
  return all
    .filter(p => p.status !== 'hidden')
    .filter(p => {
      if (category === 'all') return true;
      if (category === 'report' || category === 'saju') {
        return p.category === 'report' || p.category === 'saju' || p.category === 'voucher' || p.category === 'consulting';
      }
      return p.category === category;
    });
}

export function getStoreProductById(id: string): StoreProduct | undefined {
  const all = getAllStoreProducts();
  return all.find(p => p.id === id);
}

/**
 * Supabase 원격 DB로부터 최신 상품 목록을 백그라운드로 가져와 로컬 캐시와 병합
 */
export async function syncStoreProductsFromSupabase(): Promise<StoreProduct[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sales_count', { ascending: false });

    if (error || !data || data.length === 0) {
      return getAllStoreProducts();
    }

    const remoteProducts: StoreProduct[] = data.map((p: any) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      price: Number(p.price),
      originalPrice: p.original_price ? Number(p.original_price) : undefined,
      tagLine: p.tag_line || '',
      description: p.description || '',
      detailsHtml: p.details_html || '',
      thumbnailUrl: p.thumbnail_url || '',
      thumbnailIcon: p.thumbnail_icon || undefined,
      deliveryType: p.delivery_type,
      contentPayload: p.content_payload || '',
      targetSignals: p.target_signals || [],
      status: p.status || 'active',
      badge: p.badge || undefined,
      reportTier: p.report_tier || undefined,
      salesCount: Number(p.sales_count || 0),
      createdAt: p.created_at || new Date().toISOString(),
    }));

    if (typeof localStorage !== 'undefined' && remoteProducts.length > 0) {
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(remoteProducts));
    }
    return remoteProducts;
  } catch (e) {
    console.warn('[store-service] Supabase syncStoreProducts deferred:', e);
    return getAllStoreProducts();
  }
}

/**
 * 로컬 전체 상품을 Supabase 원격 DB로 일괄 푸시(초기 마이그레이션/동기화 도우미)
 */
export async function pushAllProductsToSupabase(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const all = getAllStoreProducts();
    const rows = all.map(p => ({
      id: p.id,
      title: p.title,
      category: p.category,
      price: p.price,
      original_price: p.originalPrice || null,
      tag_line: p.tagLine || '',
      description: p.description || '',
      details_html: p.detailsHtml || null,
      thumbnail_url: p.thumbnailUrl || '',
      thumbnail_icon: p.thumbnailIcon || null,
      delivery_type: p.deliveryType,
      target_signals: p.targetSignals || [],
      status: p.status,
      badge: p.badge || null,
      report_tier: p.reportTier || null,
      sales_count: p.salesCount || 0,
      created_at: p.createdAt || new Date().toISOString(),
    }));

    const { error } = await supabase.from('products').upsert(rows);
    if (error) {
      return { success: false, count: 0, error: error.message };
    }
    return { success: true, count: rows.length };
  } catch (e: any) {
    return { success: false, count: 0, error: e?.message || 'Supabase push error' };
  }
}

/** 상품 저장 (신규 등록) */
export function saveStoreProduct(productInput: Omit<StoreProduct, 'id' | 'createdAt' | 'salesCount'>): StoreProduct {
  const list = getAllStoreProducts();
  const newProduct: StoreProduct = {
    ...productInput,
    id: 'prod-' + Date.now().toString(36),
    createdAt: new Date().toISOString(),
    salesCount: 0,
  };
  list.unshift(newProduct);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(list));
  }

  // [Supabase DB 실시간 동기화]
  try {
    supabase.from('products').insert({
      id: newProduct.id,
      title: newProduct.title,
      category: newProduct.category,
      price: newProduct.price,
      original_price: newProduct.originalPrice || null,
      tag_line: newProduct.tagLine || '',
      description: newProduct.description || '',
      details_html: newProduct.detailsHtml || null,
      thumbnail_url: newProduct.thumbnailUrl || '',
      thumbnail_icon: newProduct.thumbnailIcon || null,
      delivery_type: newProduct.deliveryType,
      target_signals: newProduct.targetSignals || [],
      status: newProduct.status,
      badge: newProduct.badge || null,
      report_tier: newProduct.reportTier || null,
      sales_count: newProduct.salesCount,
      created_at: newProduct.createdAt,
    }).then(
      ({ error }: any) => {
        if (error) console.warn('[store-service] Supabase product insert deferred:', error.message);
      },
      (e: any) => console.warn('[store-service] Supabase product insert error:', e)
    );
  } catch (e) {
    console.warn('[store-service] Supabase product insert skipped:', e);
  }

  return newProduct;
}

/** 상품 정보 수정 */
export function updateStoreProduct(id: string, updates: Partial<StoreProduct>): boolean {
  const list = getAllStoreProducts();
  const index = list.findIndex(p => p.id === id);
  if (index === -1) return false;
  list[index] = { ...list[index], ...updates };
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(list));
  }

  // [Supabase DB 실시간 동기화]
  try {
    const dbPayload: Record<string, any> = {};
    if (updates.title !== undefined) dbPayload.title = updates.title;
    if (updates.category !== undefined) dbPayload.category = updates.category;
    if (updates.price !== undefined) dbPayload.price = updates.price;
    if (updates.originalPrice !== undefined) dbPayload.original_price = updates.originalPrice;
    if (updates.tagLine !== undefined) dbPayload.tag_line = updates.tagLine;
    if (updates.description !== undefined) dbPayload.description = updates.description;
    if (updates.detailsHtml !== undefined) dbPayload.details_html = updates.detailsHtml;
    if (updates.thumbnailUrl !== undefined) dbPayload.thumbnail_url = updates.thumbnailUrl;
    if (updates.thumbnailIcon !== undefined) dbPayload.thumbnail_icon = updates.thumbnailIcon;
    if (updates.deliveryType !== undefined) dbPayload.delivery_type = updates.deliveryType;
    if (updates.targetSignals !== undefined) dbPayload.target_signals = updates.targetSignals;
    if (updates.status !== undefined) dbPayload.status = updates.status;
    if (updates.badge !== undefined) dbPayload.badge = updates.badge;
    if (updates.reportTier !== undefined) dbPayload.report_tier = updates.reportTier;
    if (updates.salesCount !== undefined) dbPayload.sales_count = updates.salesCount;

    if (Object.keys(dbPayload).length > 0) {
      supabase.from('products').update(dbPayload).eq('id', id).then(
        ({ error }: any) => {
          if (error) console.warn('[store-service] Supabase product update deferred:', error.message);
        },
        (e: any) => console.warn('[store-service] Supabase product update error:', e)
      );
    }
  } catch (e) {
    console.warn('[store-service] Supabase product update skipped:', e);
  }

  return true;
}

/** 상품 삭제 */
export function deleteStoreProduct(id: string): boolean {
  addDeletedStoreProductId(id);
  const list = getAllStoreProducts();
  const filtered = list.filter(p => p.id !== id);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(filtered));
  }

  // [Supabase DB 실시간 동기화]
  try {
    supabase.from('products').delete().eq('id', id).then(
      ({ error }: any) => {
        if (error) console.warn('[store-service] Supabase product delete deferred:', error.message);
      },
      (e: any) => console.warn('[store-service] Supabase product delete error:', e)
    );
  } catch (e) {
    console.warn('[store-service] Supabase product delete skipped:', e);
  }

  return true;
}

/** 상품 상태 토글 (active <-> soldout <-> hidden) */
export function setStoreProductStatus(id: string, status: 'active' | 'soldout' | 'hidden'): boolean {
  return updateStoreProduct(id, { status });
}

/** 기본 시드 주문 (홍길동 회원 전자책 구매 내역 보장) */
const DEFAULT_SEED_ORDERS: StoreOrder[] = [
  {
    orderId: 'ORD-MVOK8OJZ-4CO',
    productId: 'book-saju-principles-vol1',
    productTitle: '[전자책] 정통 사주명리학 원론 제1권: 음양오행(陰陽五行)과 천간·지지·지장간 원론',
    category: 'ebook',
    amount: 29000,
    deliveryType: 'digital_download',
    accessUrl: '/assets/downloads/saju_principles_vol1_master.pdf',
    contentPayload: '/assets/downloads/saju_principles_vol1_master.pdf',
    buyerName: '홍길동',
    buyerEmail: 'hong@mabosal.com',
    buyerPhone: '010-9876-5432',
    paymentMethod: 'card',
    userId: 'acc_user_01',
    paidAt: '2026-10-26T14:30:00.000Z',
    status: 'completed',
    selectedOptionName: '[기본형] 전자책(PDF) 마스터 판본 (즉시 다운로드)',
    reportTier: 'COMPREHENSIVE'
  },
  {
    orderId: 'ORD-VOL2-HONG-88A',
    productId: 'book-saju-principles-vol2',
    productTitle: '[전자책] 정통 사주명리학 원론 제2권: 십성(육친)의 심리학과 격국(格局)·용신(用神)론',
    category: 'ebook',
    amount: 29000,
    deliveryType: 'digital_download',
    accessUrl: '/assets/downloads/saju_principles_vol2_master.pdf',
    contentPayload: '/assets/downloads/saju_principles_vol2_master.pdf',
    buyerName: '홍길동',
    buyerEmail: 'hong@mabosal.com',
    buyerPhone: '010-9876-5432',
    paymentMethod: 'card',
    userId: 'acc_user_01',
    paidAt: '2026-10-27T10:15:00.000Z',
    status: 'completed',
    selectedOptionName: '[기본형] 전자책(PDF) 마스터 판본 (즉시 다운로드)',
    reportTier: 'COMPREHENSIVE'
  },
  {
    orderId: 'ORD-GUIDE-HONG-11B',
    productId: 'prod-ebook-saju-self-guide',
    productTitle: '[전자책] 마보살의 사주 셀프 리딩 가이드: 한자 몰라도 3분 만에 읽는 나만의 인생 내비게이션',
    category: 'ebook',
    amount: 14900,
    deliveryType: 'digital_download',
    accessUrl: '/downloads/mabosal_saju_self_reading_guide.pdf',
    contentPayload: '/downloads/mabosal_saju_self_reading_guide.pdf',
    buyerName: '홍길동',
    buyerEmail: 'hong@mabosal.com',
    buyerPhone: '010-9876-5432',
    paymentMethod: 'card',
    userId: 'acc_user_01',
    paidAt: '2026-10-27T15:20:00.000Z',
    status: 'completed',
    selectedOptionName: '[기본형] 전자책(PDF) 마스터 판본 (즉시 다운로드)',
    reportTier: 'COMPREHENSIVE'
  }
];

/** 주문 목록 조회 */
export function getAllStoreOrders(): StoreOrder[] {
  try {
    const raw = getStorage().getItem(STORAGE_ORDERS_KEY);
    let orders: StoreOrder[] = raw ? JSON.parse(raw) : [];

    // 홍길동 회원의 대표 전자책 주문들이 누락되지 않도록 보장
    let updated = false;
    for (const seed of DEFAULT_SEED_ORDERS) {
      if (!orders.some(o => o.orderId === seed.orderId || o.productId === seed.productId)) {
        orders.unshift(seed);
        updated = true;
      }
    }

    // 기존 주문의 소유자 정보가 누락되어 홍길동에게 안 보이던 현상 보정
    orders = orders.map(o => {
      if ((o.orderId === 'ORD-MVOK8OJZ-4CO' || o.orderId === 'ORD-VOL2-HONG-88A' || o.orderId === 'ORD-GUIDE-HONG-11B') && !o.userId) {
        updated = true;
        return { ...o, userId: 'acc_user_01', buyerEmail: o.buyerEmail || 'hong@mabosal.com' };
      }
      return o;
    });

    if (updated) {
      getStorage().setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders.slice(0, 500)));
    }

    return orders;
  } catch {
    return DEFAULT_SEED_ORDERS;
  }
}

/** 현재 로그인 회원 본인의 주문만 반환 (소유자 필터 강제). 화면/권한 판정에는 이 함수만 사용한다. */
export function getMyStoreOrders(): StoreOrder[] {
  const me = getIdentity();
  if (me.isGuest) return [];
  return getAllStoreOrders().filter(o => ownsRecord(o, me));
}

/** 신규 주문 생성 (결제 완료 시 호출) */
export function createStoreOrder(orderData: {
  productId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  paymentMethod: any;
  orderId?: string;
  userId?: string;
  status?: 'pending' | 'completed';
  paymentKey?: string;
}): StoreOrder {
  const prod = getStoreProductById(orderData.productId);
  const orders = getAllStoreOrders();
  const newOrder: StoreOrder = {
    productId: orderData.productId,
    productTitle: prod ? prod.title : '마보살 정통 유료 사주풀이 (평생 대운 & 정밀 심층 리포트)',
    category: (prod?.category || 'report') as any,
    amount: prod ? prod.price : 39900,
    deliveryType: (prod?.deliveryType || 'saju_report') as any,
    accessUrl: (prod?.deliveryType === 'digital_url' || prod?.deliveryType === 'digital_download') ? (prod.contentPayload || '/?view=result') : '/?view=result',
    buyerName: orderData.buyerName,
    buyerPhone: orderData.buyerPhone,
    buyerEmail: orderData.buyerEmail,
    paymentMethod: orderData.paymentMethod,
    userId: orderData.userId || getIdentity().userId || undefined,
    orderId: orderData.orderId || 'ORD-' + Date.now().toString(36).toUpperCase(),
    paidAt: new Date().toISOString(),
    status: orderData.status || (orderData.paymentMethod === 'bank_transfer' ? 'pending' : 'completed'),
    ...(orderData.paymentKey ? { paymentKey: orderData.paymentKey } : {}),
    sajuInput: UserSajuStore.getProfile() || undefined,
    reportTier: prod?.reportTier || 'COMPREHENSIVE',
  };
  orders.unshift(newOrder);
  getStorage().setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders.slice(0, 500)));

  // 해당 상품 판매수 +1 (결제 완료된 주문만)
  if (prod && newOrder.status === 'completed') {
    updateStoreProduct(prod.id, { salesCount: (prod.salesCount || 0) + 1 });
  }

  return newOrder;
}

export interface VoucherRedeemResult {
  success: boolean;
  message: string;
  order?: StoreOrder;
}

export function redeemStoreVoucher(rawCode: string, buyerInfo?: { name: string; phone?: string; email?: string }): VoucherRedeemResult {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) {
    return { success: false, message: '쿠폰 코드를 입력해 주세요.' };
  }

  let targetProdId = '';
  let discountDesc = '';

  // 관리자가 등록한 동적 쿠폰 스토어 조회
  const allCoupons = VoucherStore.getCoupons();
  const matched = allCoupons.find(c => c.code.toUpperCase() === code && c.enabled);
  if (matched) {
    targetProdId = matched.targetProduct === 'all' ? 'prod-paid-saju-premium' : matched.targetProduct;
    discountDesc = `${matched.name} (${matched.discountAmount ? matched.discountAmount.toLocaleString() + '원 할인' : matched.discountRate + '% 할인'})`;
  } else {
    return { success: false, message: '유효하지 않거나 이미 사용된 쿠폰 코드입니다. 코드를 다시 확인해 주세요.' };
  }

  const prod = getStoreProductById(targetProdId);
  if (!prod) {
    return { success: false, message: '해당 쿠폰과 연결된 상품을 찾을 수 없습니다.' };
  }

  // 주문 자동 생성 및 결제 완료 처리
  const newOrder = createStoreOrder({
    productId: prod.id,
    buyerName: buyerInfo?.name || '쿠폰 이용 고객',
    buyerPhone: buyerInfo?.phone || '010-0000-0000',
    buyerEmail: buyerInfo?.email || 'voucher@mabosal.com',
    paymentMethod: 'voucher' as any,
  });

  return {
    success: true,
    message: `[${discountDesc}] 쿠폰이 정상 승인되었습니다! 즉시 리포트를 열람하실 수 있습니다.`,
    order: newOrder,
  };
}

export interface CouponDiscountResult {
  valid: boolean;
  couponCode: string;
  couponName: string;
  discountAmount: number;
  finalPrice: number;
  message: string;
}

/** 결제 시 실시간 쿠폰 검증 및 차감 금액 계산 */
export function calculateStoreCouponDiscount(rawCode: string, originalAmount: number): CouponDiscountResult {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) {
    return { valid: false, couponCode: '', couponName: '', discountAmount: 0, finalPrice: originalAmount, message: '쿠폰 코드를 입력해 주세요.' };
  }

  // 1. 기본 탑재된 프로모션 쿠폰
  if (code === 'WELCOME' || code === 'MABOSAL3K' || code === 'MABOSAL3000') {
    const discount = Math.min(3000, originalAmount);
    return { valid: true, couponCode: code, couponName: '신규 회원 3,000원 웰컴 쿠폰', discountAmount: discount, finalPrice: Math.max(0, originalAmount - discount), message: '3,000원 즉시 할인 쿠폰이 적용되었습니다.' };
  }
  if (code === 'BOOK5000' || code === 'MABOSAL5K' || code === 'EBOOK5K' || code === 'BOOK5K') {
    const discount = Math.min(5000, originalAmount);
    return { valid: true, couponCode: code, couponName: '원론 1권 출간기념 5,000원 특별 할인 쿠폰', discountAmount: discount, finalPrice: Math.max(0, originalAmount - discount), message: '5,000원 특별 할인 쿠폰이 적용되었습니다.' };
  }
  if (code === 'VIP10K' || code === 'SPECIAL10K') {
    const discount = Math.min(10000, originalAmount);
    return { valid: true, couponCode: code, couponName: 'VIP 10,000원 감사 할인 쿠폰', discountAmount: discount, finalPrice: Math.max(0, originalAmount - discount), message: '10,000원 할인 쿠폰이 적용되었습니다.' };
  }
  if (code === 'OPEN10' || code === 'DISCOUNT10') {
    const discount = Math.round(originalAmount * 0.1);
    return { valid: true, couponCode: code, couponName: '스토어 오픈 10% 추가 할인 쿠폰', discountAmount: discount, finalPrice: Math.max(0, originalAmount - discount), message: '10% 할인이 적용되었습니다.' };
  }

  // 2. 동적 쿠폰/바우처 목록 조회
  try {
    const dynamicCoupons = JSON.parse(localStorage.getItem('mabosal_voucher_coupons') || '[]');
    const matched = dynamicCoupons.find((c: any) => c.code.toUpperCase() === code && c.enabled);
    if (matched) {
      const discount = matched.discountAmount ? Math.min(matched.discountAmount, originalAmount) : Math.round(originalAmount * ((matched.discountRate || 0) / 100));
      return { valid: true, couponCode: code, couponName: matched.name, discountAmount: discount, finalPrice: Math.max(0, originalAmount - discount), message: `[${matched.name}] 쿠폰이 적용되었습니다.` };
    }
  } catch {}

  return { valid: false, couponCode: code, couponName: '', discountAmount: 0, finalPrice: originalAmount, message: '유효하지 않거나 기간이 만료된 쿠폰 코드입니다.' };
}

/** 주문 상태 등 일부 필드 갱신 (입금 확인 시 pending → completed) */
export function updateStoreOrder(orderId: string, patch: Partial<StoreOrder>): StoreOrder | null {
  const orders = getAllStoreOrders();
  const idx = orders.findIndex(o => o.orderId === orderId);
  if (idx < 0) return null;
  const prev = orders[idx];
  const next = { ...prev, ...patch } as StoreOrder;
  orders[idx] = next;
  getStorage().setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders));
  if (prev.status !== 'completed' && next.status === 'completed') {
    const prod = getStoreProductById(next.productId);
    if (prod) updateStoreProduct(prod.id, { salesCount: (prod.salesCount || 0) + 1 });
  }
  return next;
}

/**
 * 특정 사주 대상자에 대해 이미 결제 완료된 디지털 리포트인지 중복 여부 검사
 */
export function isProductAlreadyPurchased(productId: string, sajuName?: string): { purchased: boolean; order?: StoreOrder } {
  const me = getIdentity();
  const orders = getAllStoreOrders().filter(o => o.status === 'completed' && ownsRecord(o, me));
  const targetName = (sajuName || '').trim();

  for (const o of orders) {
    const isMatchingProd = o.productId === productId || (o.items && o.items.some(it => it.productId === productId));
    if (!isMatchingProd) continue;

    // 사주 대상자명 매칭 (디지털 리포트인 경우)
    const orderSajuName = (o.sajuInput?.userName || o.buyerName || '').trim();
    if (!targetName || orderSajuName === targetName) {
      return { purchased: true, order: o };
    }
  }

  return { purchased: false };
}

/**
 * 디지털 리포트 열람 시점 기록 (전자상거래법 환불 제한 근거 확보)
 */
export function markOrderAsViewed(orderId: string): void {
  const orders = getAllStoreOrders();
  const target = orders.find(o => o.orderId === orderId);
  if (target && !target.viewedAt) {
    updateStoreOrder(orderId, { viewedAt: new Date().toISOString() });
  }
}

/**
 * 고객의 주문 취소 및 환불 신청 접수
 */
export function requestStoreOrderRefund(orderId: string, reason: string): { success: boolean; message: string } {
  const orders = getAllStoreOrders();
  const target = orders.find(o => o.orderId === orderId);
  if (!target) {
    return { success: false, message: '주문 정보를 찾을 수 없습니다.' };
  }

  if (target.status === 'refunded') {
    return { success: false, message: '이미 환불 처리가 완료된 주문입니다.' };
  }

  // 디지털 리포트이고 이미 열람/다운로드한 경우 전자상거래법에 의거 제한
  if (target.category === 'report' && target.viewedAt) {
    return {
      success: false,
      message: '해당 리포트는 이미 열람/다운로드가 개시되어 전자상거래법 제17조에 따라 청약철회(환불)가 제한됩니다.',
    };
  }

  updateStoreOrder(orderId, {
    refundRequested: true,
    refundReason: reason,
  });

  return {
    success: true,
    message: '환불/반품 신청이 정상 접수되었습니다. 관리자 검토 후 신속히 처리됩니다.',
  };
}

/**
 * 최고 관리자의 환불 승인 처리
 */
export function approveStoreOrderRefund(orderId: string): { success: boolean; message: string } {
  const target = updateStoreOrder(orderId, {
    status: 'refunded',
    refundedAt: new Date().toISOString(),
    refundRequested: false,
  });

  if (!target) {
    return { success: false, message: '주문 정보를 찾을 수 없습니다.' };
  }

  return {
    success: true,
    message: `[주문번호: ${orderId}] 환불 처리가 최종 승인되어 결제 취소되었습니다.`,
  };
}

/**
 * 최고 관리자의 무통장 입금 확인 및 주문 승인 처리
 */
export function approveStoreBankDeposit(orderId: string): { success: boolean; message: string } {
  const target = updateStoreOrder(orderId, {
    status: 'completed',
    paidAt: new Date().toISOString(),
  });

  if (!target) {
    return { success: false, message: '주문 정보를 찾을 수 없습니다.' };
  }

  // 1. 해당 상품 판매 수량 증가
  if (target.productId) {
    const prod = getStoreProductById(target.productId);
    if (prod) {
      updateStoreProduct(prod.id, { salesCount: (prod.salesCount || 0) + 1 });
    }
  }
  if (target.items && target.items.length > 0) {
    for (const it of target.items) {
      const prod = getStoreProductById(it.productId);
      if (prod) {
        updateStoreProduct(prod.id, { salesCount: (prod.salesCount || 0) + (it.quantity || 1) });
      }
    }
  }

  // 2. VoucherStore 무통장 입금 대기 내역과 양방향 상태 동기화
  try {
    const transfers = VoucherStore.getBankTransfers();
    const matchedTransfer = transfers.find(t => t.orderId === orderId);
    if (matchedTransfer && matchedTransfer.status === 'pending') {
      VoucherStore.approveBankTransfer(matchedTransfer.id);
    }
  } catch (e) {
    console.warn('[approveStoreBankDeposit] VoucherStore sync deferred:', e);
  }

  // 3. 주문된 사주 리포트 즉시 열람 준비
  try {
    UserSajuStore.ensureAnalysisReadyFromOrder(target);
  } catch (e) {}

  return {
    success: true,
    message: `[주문번호: ${orderId}] 입금 확인이 완료되어 주문이 정상 승인되었습니다.`,
  };
}

