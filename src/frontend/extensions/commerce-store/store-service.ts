
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
  SAJU_BOOK_VOL1_PRODUCT,
  SAJU_BOOK_VOL2_PRODUCT,
  SAJU_BOOK_VOL3_PRODUCT,
  SAJU_BOOK_VOL4_PRODUCT
} from './saju-book-data.js';
import { VoucherStore } from '../../modules/voucher/voucher-store.js';
import { supabase } from '../../modules/supabase/supabase-client.js';
import { cancelPortOnePayment, fetchPortOnePaymentHistory } from '../../modules/payment/portone-server-api.js';

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
  // =========================================================================
  // [현재 활성 상품 4종 (고객 스토어 메인 화면 노출 - PC 도메인 세팅 상태)]
  // =========================================================================

  // 1. [전자책] 정통 사주명리학 원론 제1권 (29,000원)
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

  // =========================================================================
  // [관리자 보존 / 일부러 꺼둔(hidden) 프리미엄 & 특화 상품군 (언제든 ON 가능)]
  // =========================================================================

  // 5. [VIP 최고급 리포트] 29개 챕터 전수 완결본 & 1:1 복합 처방 (149,000원) - [꺼둠]
  {
    id: 'prod-paid-saju-vip',
    title: 'VIP통합: 29개 챕터 전수 완결본 & 1:1 복합 처방',
    category: 'report',
    price: 149000,
    originalPrice: 250000,
    tagLine: '원국·격국·용신·대운·세운 전면 개방, 4주 맞춤 개운 로드맵 수록',
    badge: 'VIP 최고급',
    description: '명리학 5대 고전의 격국과 억부, 조후, 통관 용신을 총동원한 29개 챕터 완결형 VIP 리포트입니다. 평생 대운의 10년 주기와 4주 로드맵, 맞춤 솔루션을 전면 제공합니다.',
    detailsHtml: `
      <div style="line-height: 1.7; font-size: 0.9rem; color: #d1d5db;">
        <h4 style="color: var(--primary); margin: 0 0 0.5rem 0;">VIP 프리미엄 29대 전수 챕터 구성</h4>
        <ul style="margin: 0; padding-left: 1.2rem; color: #cbd5e1; font-size: 0.88rem;">
          <li>29개 VIP 서술형 리포트 전문 평생 소장</li>
          <li>평생 10년 대운 그래프 및 세운 교운기 비책</li>
          <li>A/B 현실 선택 대안 및 4주 액션 플랜</li>
        </ul>
      </div>
    `,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
    ],
    thumbnailIcon: 'diamond',
    deliveryType: 'saju_report',
    contentPayload: 'PREMIUM_VIP',
    reportTier: 'PREMIUM',
    targetSignals: ['wealth.flow', 'career.change', 'mind.stress'],
    status: 'hidden',
    createdAt: '2026-10-01',
    salesCount: 68,
  },

  // 6. [무료 체험] 마보살 기초 원국 & 13개 체험 분석 (0원) - [꺼둠]
  {
    id: 'prod-free-experience',
    title: '무료진단: 마보살 기초 원국 & 13개 체험 분석',
    category: 'report',
    price: 0,
    originalPrice: 19900,
    tagLine: '자신의 타고난 기운과 오행 기본 구조를 확인하는 13개 체험 섹션 무료 진단서',
    badge: '무료 체험',
    description: '사주 원국과 오행 분포, 일간의 본질을 확인하고 마(Ma)의 징후를 진단하는 13개 체험 섹션 리포트입니다.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'explore',
    deliveryType: 'saju_report',
    contentPayload: 'FREE_EXPERIENCE',
    reportTier: 'FREE',
    targetSignals: ['general.knowledge'],
    status: 'hidden',
    createdAt: '2026-10-01',
    salesCount: 520,
  },

  // 7. [런칭 프로모션] 마보살 정통 사주 진단서 (19,900원) - [꺼둠]
  {
    id: 'prod-saju-entry-promo',
    title: '마보살 정통 사주 진단서 (입문 원국 & 오행 정밀 분석)',
    category: 'report',
    price: 19900,
    originalPrice: 19900,
    tagLine: '4주 8자 천명 원국표와 오행 과다·결핍 균형을 정밀 판별하는 입문 리포트',
    badge: '런칭 쿠폰 무료',
    description: '사주 원국표와 일간의 기운, 오행 분포도를 체계적으로 진단해 드리는 입문 진단서입니다.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'fact_check',
    deliveryType: 'saju_report',
    contentPayload: 'PROMO_ENTRY',
    reportTier: 'ENTRY',
    targetSignals: ['wealth.flow', 'career.change'],
    status: 'hidden',
    createdAt: '2026-10-12',
    salesCount: 389,
  },

  // 8. [5대 특화 운세 리포트군 - 신년/직장/재물/애정/재회/궁합] - [꺼둠]
  {
    id: 'prod-report-year2027',
    title: '신년운세: 2027 정미년 신년운세 & 월별 대운 비책',
    category: 'report',
    price: 19900,
    originalPrice: 30000,
    tagLine: '2027년 상반기 대운과 월별 기회·위험 정밀 총정리 리포트',
    description: '2027년 세운과 내 사주의 상호작용을 정밀 추명하여 월별 행동 지침을 알려주는 신년 리포트입니다.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'calendar_today',
    deliveryType: 'saju_report',
    contentPayload: 'YEAR_2027',
    reportTier: 'YEAR_2027',
    targetSignals: ['career.change', 'money.gain'],
    status: 'hidden',
    badge: 'BEST',
    createdAt: '2026-10-01T00:00:00.000Z',
    salesCount: 310,
  },
  {
    id: 'prod-report-career',
    title: '직장운세: 퇴사 vs 잔류 & 이직 판단 리포트',
    category: 'report',
    price: 19900,
    originalPrice: 30000,
    tagLine: '부서 이동, 이직 타이밍과 최적의 승진 시점 명리 진단',
    description: '관성과 역마의 흐름을 심층 분석하여 이직과 잔류의 유불리를 명쾌하게 판정합니다.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'work',
    deliveryType: 'saju_report',
    contentPayload: 'CAREER',
    reportTier: 'CAREER',
    targetSignals: ['career.change', 'career.transition'],
    status: 'hidden',
    badge: '인기',
    createdAt: '2026-10-02T00:00:00.000Z',
    salesCount: 245,
  },
  {
    id: 'prod-report-wealth',
    title: '재물운세: 손재마 방어 & 자산 증식 리포트',
    category: 'report',
    price: 19900,
    originalPrice: 30000,
    tagLine: '돈 나가는 시기(손재마)와 기회 시기 정밀 진단서',
    description: '재성의 강약과 겁재/손재마의 동향을 파악하여 자산 증식 타이밍을 짚어냅니다.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'payments',
    deliveryType: 'saju_report',
    contentPayload: 'WEALTH',
    reportTier: 'WEALTH',
    targetSignals: ['money.loss', 'money.gain'],
    status: 'hidden',
    badge: 'MD추천',
    createdAt: '2026-10-03T00:00:00.000Z',
    salesCount: 189,
  },
  {
    id: 'prod-report-relation',
    title: '애정운세: 인연의 흐름 & 갈등 완화 리포트',
    category: 'report',
    price: 19900,
    originalPrice: 30000,
    tagLine: '인연이 찾아오는 시기와 이성 관계 갈등 해소 명리 처방',
    description: '도화살과 배우자궁의 합/충을 분석하여 새로운 인연의 출현 시기를 안내합니다.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'favorite',
    deliveryType: 'saju_report',
    contentPayload: 'RELATION',
    reportTier: 'RELATION',
    targetSignals: ['mind.stress'],
    status: 'hidden',
    createdAt: '2026-10-04T00:00:00.000Z',
    salesCount: 165,
  },
  {
    id: 'prod-report-reunion',
    title: '재회운세: 상대방 속마음 & 재회 골든타임 리포트',
    category: 'report',
    price: 19900,
    originalPrice: 30000,
    tagLine: '상대방 연락 가능성 월별 지수와 재회 골든타임 처방',
    description: '상대방의 현재 심리 상태와 연락 가능성이 가장 높은 월별 시점을 진단합니다.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'favorite',
    deliveryType: 'saju_report',
    contentPayload: 'REUNION',
    reportTier: 'REUNION',
    targetSignals: ['mind.stress'],
    status: 'hidden',
    badge: '인기',
    createdAt: '2026-10-04T00:00:00.000Z',
    salesCount: 165,
  },
  {
    id: 'prod-report-chemistry',
    title: '궁합운세: 두 사람의 인연 & 화해 대화 리포트',
    category: 'report',
    price: 29900,
    originalPrice: 50000,
    tagLine: '반복 싸움 유발 요인 3가지와 즉시 화해 대화 스크립트',
    description: '두 사람의 사주 원국과 오행 상생/상극을 대조하여 궁합 솔루션을 제공합니다.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'favorite',
    deliveryType: 'saju_report',
    contentPayload: 'CHEMISTRY',
    reportTier: 'CHEMISTRY',
    targetSignals: ['mind.stress'],
    status: 'hidden',
    badge: '정밀역학',
    createdAt: '2026-10-05T00:00:00.000Z',
    salesCount: 140,
  },

  // 9. [원론 마스터북 2권~4권] - [꺼둠]
  { ...SAJU_BOOK_VOL2_PRODUCT, status: 'hidden' },
  { ...SAJU_BOOK_VOL3_PRODUCT, status: 'hidden' },
  { ...SAJU_BOOK_VOL4_PRODUCT, status: 'hidden' },

  // 10. [엑셀북, 강의 VOD, 굿즈] - [꺼둠]
  {
    id: 'prod-ebook-wealth',
    title: '손재마 탈출! 새는 돈 막는 30분 가계 재무 방어 엑셀북',
    category: 'ebook',
    price: 29000,
    originalPrice: 49000,
    tagLine: '재물 누수를 막고 안전한 현금 흐름을 설계하는 실전 템플릿',
    description: '고정비 축소와 통장 쪼개기 실천 가이드북 및 Excel 시트입니다.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'savings',
    deliveryType: 'digital_download',
    contentPayload: 'https://mabosal.com/downloads/wealth-defense-2026.pdf',
    targetSignals: ['money.loss'],
    status: 'hidden',
    badge: 'BEST',
    createdAt: '2026-10-06T00:00:00.000Z',
    salesCount: 142,
  },
  {
    id: 'prod-vod-career',
    title: '천을귀인 이직 비책: 연봉 20% 올리는 커리어 피봇 VOD',
    category: 'lecture',
    price: 49000,
    originalPrice: 89000,
    tagLine: '사주 이동수(역마/관성)를 기회로 바꾸는 5강 완성 핵심 특강',
    description: '헤드헌터 레이더에 걸리는 이력서 작성법과 면접 협상 2시간 완성 VOD 코스입니다.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'work',
    deliveryType: 'digital_url',
    contentPayload: 'https://mabosal.com/classroom/career-pivot-vod',
    targetSignals: ['career.change', 'career.transition'],
    status: 'hidden',
    badge: 'MD추천',
    createdAt: '2026-10-07T00:00:00.000Z',
    salesCount: 88,
  },
  {
    id: 'prod-lecture-payment-test',
    title: '[결제 테스트] 마보살 강의 실결제 검증용 (1,000원)',
    category: 'lecture',
    price: 1000,
    originalPrice: 1000,
    tagLine: '포트원(KG이니시스) 실결제 및 관리자 환불 취소 연동 테스트 전용 강의 상품',
    description: '실제 카드/간편결제 승인 및 관리자 대시보드 결제취소(환불) 정상 동작을 검증하기 위한 테스트용 미니 강의 상품입니다. 테스트 완료 후 관리자 페이지에서 삭제하거나 숨김 처리할 수 있습니다.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'play_circle',
    deliveryType: 'digital_url',
    contentPayload: 'https://www.mabosal.com/',
    targetSignals: ['career.change'],
    status: 'hidden',
    badge: 'NEW',
    createdAt: '2026-11-13T08:30:00.000Z',
    salesCount: 0,
  },
  {
    id: 'prod-goods-amulet',
    title: '마보살 시그니처 황동 엽전 키링 & 전통 비단 파우치 세트',
    category: 'goods',
    price: 19900,
    originalPrice: 35000,
    tagLine: '일상의 공간을 정돈하는 전통 공예 소품',
    description: '전통 비단 노리개 주머니와 마보살 심볼 황동 엽전 키링 세트입니다.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'token',
    deliveryType: 'shipping',
    contentPayload: '배송 상품',
    targetSignals: ['mind.stress', 'legal.dispute'],
    status: 'hidden',
    createdAt: '2026-10-09T00:00:00.000Z',
    salesCount: 120,
  },
];


let memoryProducts: StoreProduct[] | null = null;

function isBrowserRuntime(): boolean {
  return (
    typeof window !== 'undefined' &&
    !(import.meta as any).env?.VITEST &&
    (typeof navigator === 'undefined' || !/jsdom/i.test(navigator.userAgent || ''))
  );
}

/** 삭제된 상품 ID 세트 조회 (테스트/오프라인 전용) */
export function getDeletedStoreProductIds(): Set<string> {
  if (isBrowserRuntime() || typeof localStorage === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_DELETED_PRODUCTS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

/** 삭제된 상품 ID 영구 기록 (테스트/오프라인 전용) */
export function addDeletedStoreProductId(id: string): void {
  if (isBrowserRuntime() || typeof localStorage === 'undefined') return;
  try {
    const set = getDeletedStoreProductIds();
    set.add(id);
    localStorage.setItem(STORAGE_DELETED_PRODUCTS_KEY, JSON.stringify([...set]));
  } catch {}
}

/** 등록된 모든 상품 조회 (운영 브라우저는 메모리 캐시 + Supabase SSOT, 테스트 환경은 localStorage) */
export function getAllStoreProducts(): StoreProduct[] {
  if (isBrowserRuntime()) {
    return memoryProducts ? [...memoryProducts] : [...INITIAL_STORE_PRODUCTS];
  }
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
    let changed = false;

    // 삭제된 상품이 localStorage에 남아있다면 즉시 제거
    if (saved.some(p => deletedIds.has(p.id))) {
      saved = saved.filter(p => !deletedIds.has(p.id));
      changed = true;
    }

    // [PG 심사용] 폐기된 카테고리/상품(상품권, 1:1 상담권 등) 자동 소거
    const deprecatedProductIds = new Set(['prod-voucher-50k', 'prod-voucher-30k', 'prod-voucher-10k', 'prod-consult-vip']);
    if (saved.some(p => deprecatedProductIds.has(p.id) || p.category === 'voucher' || p.category === 'consulting')) {
      saved = saved.filter(p => !deprecatedProductIds.has(p.id) && p.category !== 'voucher' && p.category !== 'consulting');
      changed = true;
    }

    if (changed) {
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(saved));
    }
    return saved;
  } catch {
    return INITIAL_STORE_PRODUCTS.filter(p => !deletedIds.has(p.id));
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

    if (error) {
      console.warn('[store-service] Supabase products fetch error:', error.message);
      return getAllStoreProducts();
    }

    if (!data || data.length === 0) {
      // 원격 DB가 완전히 비어 있을 때만, 로그인 세션이 있는 경우 1회 초기 시드 푸시
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        void pushAllProductsToSupabase();
      }
      return getAllStoreProducts();
    }

    // 원격 DB를 단일 진실 공급원(SSOT)으로 사용 (로컬 상세 메타데이터만 보조 병합)
    const localAll = getAllStoreProducts();
    const localMap = new Map(localAll.map(p => [p.id, p]));

    const remoteProducts: StoreProduct[] = data.map((p: any) => {
      const local = localMap.get(p.id);
      return {
        ...(local || {}),
        id: p.id,
        title: p.title || local?.title || '',
        category: p.category || local?.category || 'report',
        price: p.price !== undefined && p.price !== null ? Number(p.price) : (local?.price || 0),
        originalPrice: p.original_price ? Number(p.original_price) : local?.originalPrice,
        tagLine: p.tag_line || local?.tagLine || '',
        description: p.description || local?.description || '',
        detailsHtml: p.details_html || local?.detailsHtml || '',
        thumbnailUrl: p.thumbnail_url || local?.thumbnailUrl || '',
        thumbnailIcon: p.thumbnail_icon || local?.thumbnailIcon,
        deliveryType: p.delivery_type || local?.deliveryType || 'saju_report',
        contentPayload: p.content_payload || local?.contentPayload || '',
        targetSignals: p.target_signals || local?.targetSignals || [],
        status: p.status || local?.status || 'hidden',
        badge: p.badge || local?.badge,
        reportTier: p.report_tier || local?.reportTier,
        salesCount: Number(p.sales_count ?? local?.salesCount ?? 0),
        createdAt: p.created_at || local?.createdAt || new Date().toISOString(),
      } as StoreProduct;
    });

    if (isBrowserRuntime()) {
      memoryProducts = remoteProducts;
      try {
        localStorage.removeItem(STORAGE_PRODUCTS_KEY);
        localStorage.removeItem(STORAGE_DELETED_PRODUCTS_KEY);
        localStorage.removeItem('mabosal_store_ssot_sync_v207');
        localStorage.removeItem('mabosal_store_sync_v206');
      } catch {}
      window.dispatchEvent(new CustomEvent('mabosal:products-updated'));
    } else if (typeof localStorage !== 'undefined' && remoteProducts.length > 0) {
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(remoteProducts));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mabosal:products-updated'));
      }
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

function handleProductDbResult(action: string, error: any): void {
  if (!error) return;
  console.error(`[store-service] Supabase product ${action} failed:`, error.message || error);
}

function toProductDbPatch(updates: Partial<StoreProduct>): Record<string, any> {
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
  return dbPayload;
}

/** 상품 DB 직접 등록 (DB 성공 확인 후 메모리 반영) */
export async function saveStoreProductDb(
  productInput: Omit<StoreProduct, 'id' | 'createdAt' | 'salesCount'>
): Promise<{ success: boolean; product?: StoreProduct; error?: string }> {
  const newProduct: StoreProduct = {
    ...productInput,
    id: 'prod-' + Date.now().toString(36),
    createdAt: new Date().toISOString(),
    salesCount: 0,
  };

  if (!isBrowserRuntime()) {
    const saved = saveStoreProduct(productInput);
    return { success: true, product: saved };
  }

  const { error } = await supabase.from('products').insert({
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
  });

  if (error) {
    handleProductDbResult('insert', error);
    return { success: false, error: error.message };
  }

  const current = getAllStoreProducts();
  memoryProducts = [newProduct, ...current];
  return { success: true, product: newProduct };
}

/** 상품 DB 직접 수정 (DB 성공 확인 후 메모리 반영) */
export async function updateStoreProductDb(
  id: string,
  updates: Partial<StoreProduct>
): Promise<{ success: boolean; error?: string }> {
  if (!isBrowserRuntime()) {
    const ok = updateStoreProduct(id, updates);
    return ok ? { success: true } : { success: false, error: '상품을 찾을 수 없습니다.' };
  }

  const dbPayload = toProductDbPatch(updates);
  if (Object.keys(dbPayload).length > 0) {
    const { error } = await supabase.from('products').update(dbPayload).eq('id', id);
    if (error) {
      handleProductDbResult('update', error);
      return { success: false, error: error.message };
    }
  }

  const list = getAllStoreProducts();
  const idx = list.findIndex(p => p.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updates };
    memoryProducts = list;
  }
  return { success: true };
}

/** 상품 DB 직접 삭제 (DB 성공 확인 후 메모리 반영) */
export async function deleteStoreProductDb(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isBrowserRuntime()) {
    deleteStoreProduct(id);
    return { success: true };
  }

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    handleProductDbResult('delete', error);
    return { success: false, error: error.message };
  }

  memoryProducts = getAllStoreProducts().filter(p => p.id !== id);
  return { success: true };
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
  if (isBrowserRuntime()) {
    memoryProducts = list;
  } else if (typeof localStorage !== 'undefined') {
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
      ({ error }: any) => handleProductDbResult('insert', error),
      (e: any) => handleProductDbResult('insert', e)
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
  if (isBrowserRuntime()) {
    memoryProducts = list;
  } else if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(list));
  }

  // [Supabase DB 실시간 동기화]
  try {
    const dbPayload = toProductDbPatch(updates);
    if (Object.keys(dbPayload).length > 0) {
      supabase.from('products').update(dbPayload).eq('id', id).then(
        ({ error }: any) => handleProductDbResult('update', error),
        (e: any) => handleProductDbResult('update', e)
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
  if (isBrowserRuntime()) {
    memoryProducts = filtered;
  } else if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(filtered));
  }

  // [Supabase DB 실시간 동기화]
  try {
    supabase.from('products').delete().eq('id', id).then(
      ({ error }: any) => handleProductDbResult('delete', error),
      (e: any) => handleProductDbResult('delete', e)
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

/** 주문 목록 조회 (로컬 캐시 즉시 반환 + Supabase 원격 주문 비동기 병합) */
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

    // Supabase 원격 주문 비동기 동기화 트리거
    void syncOrdersFromSupabase();

    return orders;
  } catch {
    return DEFAULT_SEED_ORDERS;
  }
}

/** Supabase 원격 DB에서 주문 목록을 가져와 로컬 장부와 병합 (변경 여부 반환) */
export async function syncOrdersFromSupabase(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const raw = getStorage().getItem(STORAGE_ORDERS_KEY);
      let localOrders: StoreOrder[] = raw ? JSON.parse(raw) : [];
      const localMap = new Map(localOrders.map(o => [o.orderId, o]));

      let changed = false;
      for (const ro of data) {
        const existing = localMap.get(ro.id);
        if (!existing) {
          const prod = getStoreProductById(ro.product_id);
          localOrders.unshift({
            orderId: ro.id,
            productId: ro.product_id,
            productTitle: ro.product_title || (prod ? prod.title : '사주 상품'),
            category: (ro.category || prod?.category || 'report') as any,
            amount: Number(ro.amount || 0),
            deliveryType: (ro.delivery_type || prod?.deliveryType || 'saju_report') as any,
            accessUrl: '/?view=result',
            buyerName: ro.buyer_name || '구매자',
            buyerPhone: ro.buyer_phone || '',
            buyerEmail: ro.buyer_email || '',
            paymentMethod: ro.payment_method || 'card',
            paymentKey: ro.payment_key || undefined,
            userId: ro.user_id || undefined,
            paidAt: ro.paid_at || ro.created_at || new Date().toISOString(),
            status: ro.status || 'completed',
          });
          changed = true;
        } else {
          if (ro.status && existing.status !== ro.status) {
            existing.status = ro.status;
            changed = true;
          }
          if (ro.payment_key && !existing.paymentKey) {
            existing.paymentKey = ro.payment_key;
            changed = true;
          }
        }
      }

      if (changed) {
        getStorage().setItem(STORAGE_ORDERS_KEY, JSON.stringify(localOrders.slice(0, 500)));
      }
      return changed;
    }
    return false;
  } catch (e) {
    console.warn('[store-service] Supabase orders sync deferred:', e);
    return false;
  }
}

/**
 * 포트원 V2 서버의 실제 결제/취소 내역을 조회해 마보살 주문 장부와 동기화 (과거 결제·외부 취소 포함)
 */
export async function syncPortOnePaymentsIntoOrders(): Promise<{
  changed: boolean;
  syncedCount: number;
  error?: string;
}> {
  const res = await fetchPortOnePaymentHistory(50);
  if (!res.ok) {
    return { changed: false, syncedCount: 0, error: res.error };
  }

  const raw = getStorage().getItem(STORAGE_ORDERS_KEY);
  const localOrders: StoreOrder[] = raw ? JSON.parse(raw) : [];
  let changed = false;
  let syncedCount = 0;

  for (const item of res.items) {
    if (!item?.id) continue;
    const isCancelled = item.status === 'CANCELLED' || item.status === 'PARTIAL_CANCELLED';
    const isPaid = item.status === 'PAID';
    if (!isCancelled && !isPaid) continue;

    syncedCount += 1;
    const targetStatus: StoreOrder['status'] = isCancelled ? 'refunded' : 'completed';
    const matched = localOrders.find(o => o.orderId === item.id || o.paymentKey === item.id);

    if (matched) {
      if (!matched.paymentKey) {
        matched.paymentKey = item.id;
        changed = true;
      }
      if (matched.status !== targetStatus && (isCancelled || matched.status === 'pending')) {
        matched.status = targetStatus;
        if (isCancelled && !matched.refundedAt) {
          matched.refundedAt = item.cancelledAt || new Date().toISOString();
        }
        changed = true;
      }
    } else {
      localOrders.unshift({
        orderId: item.id,
        paymentKey: item.id,
        productId: 'portone-synced',
        productTitle: item.orderName || '포트원 결제 상품',
        category: 'lecture',
        amount: Number(item.amount?.total || 0),
        deliveryType: 'digital_url',
        accessUrl: '/?view=store',
        buyerName: item.customer?.name || '포트원 구매자',
        buyerPhone: item.customer?.phoneNumber || '',
        buyerEmail: item.customer?.email || '',
        paymentMethod: 'card',
        paidAt: item.paidAt || item.requestedAt || new Date().toISOString(),
        ...(isCancelled ? { refundedAt: item.cancelledAt || new Date().toISOString() } : {}),
        status: targetStatus,
      });
      changed = true;
    }
  }

  if (changed) {
    getStorage().setItem(STORAGE_ORDERS_KEY, JSON.stringify(localOrders.slice(0, 500)));
  }

  return { changed, syncedCount };
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

  // [Supabase DB 실시간 주문 동기화]
  try {
    supabase.from('orders').insert({
      id: newOrder.orderId,
      user_id: newOrder.userId || null,
      product_id: newOrder.productId,
      amount: newOrder.amount,
      status: newOrder.status,
      payment_method: newOrder.paymentMethod,
      buyer_name: newOrder.buyerName,
      buyer_phone: newOrder.buyerPhone,
      buyer_email: newOrder.buyerEmail,
      delivery_type: newOrder.deliveryType,
      created_at: newOrder.paidAt,
    }).then(({ error }: any) => {
      if (error) console.warn('[store-service] Supabase order insert deferred:', error.message);
    });
  } catch (e) {
    console.warn('[store-service] Supabase order insert skipped:', e);
  }

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
 * 고객의 입금대기(pending) 주문 직접 취소 처리 (무통장 입금 신청 철회)
 */
export function cancelPendingStoreOrder(orderId: string): { success: boolean; message: string } {
  const order = getAllStoreOrders().find(o => o.orderId === orderId);
  if (!order) {
    return { success: false, message: '주문 정보를 찾을 수 없습니다.' };
  }
  if (order.status !== 'pending') {
    return { success: false, message: '입금 대기 상태의 주문만 취소할 수 있습니다.' };
  }

  updateStoreOrder(orderId, { status: 'cancelled' });

  try {
    const matched = VoucherStore.getBankTransfers().find(t => t.orderId === orderId);
    if (matched) {
      VoucherStore.rejectBankTransfer(matched.id);
    }
  } catch {}

  return {
    success: true,
    message: `[주문번호: ${orderId}] 무통장 입금 신청이 취소되었습니다. 원하시는 결제수단으로 다시 주문하실 수 있습니다.`,
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
 * 최고 관리자의 환불 승인 처리 (포트원 온라인 결제는 서버 Edge Function으로 실제 카드/PG 취소 연동)
 */
export async function approveStoreOrderRefundWithPgCancel(
  orderId: string
): Promise<{ success: boolean; message: string }> {
  const order = getAllStoreOrders().find(o => o.orderId === orderId);
  if (!order) {
    return { success: false, message: '주문 정보를 찾을 수 없습니다.' };
  }

  const isPgOrder =
    order.paymentMethod !== 'bank_transfer' &&
    order.paymentMethod !== 'voucher' &&
    (order.amount || 0) > 0;

  if (isPgOrder) {
    const paymentId = order.paymentKey || order.orderId;
    const cancelRes = await cancelPortOnePayment({
      paymentId,
      orderId: order.orderId,
      reason: order.refundReason || '관리자 환불 승인',
    });

    if (!cancelRes.ok) {
      return {
        success: false,
        message: `[주문번호: ${orderId}] 포트원 실제 결제 취소 실패\n사유: ${cancelRes.error || '알 수 없는 오류'}\n\n※ 실제 카드 결제가 취소되지 않아 주문 상태가 유지됩니다.`,
      };
    }
  }

  return approveStoreOrderRefund(orderId);
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

