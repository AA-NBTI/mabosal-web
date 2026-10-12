/**
 * Phase 24: 상품 구조 (Product Catalog & Tier System)
 * 
 * 원칙:
 * 1. 무료: 기본 사주 진단 (사주 기본 구조, 일간 본질, 오행, 마 존재 징후만 제시)
 * 2. 유료 1: 정밀 사주풀이 (원국 상세, 대운, 세운, 7대 라이프 영역 전체, 명리적 근거) - 39,000원 ($29)
 * 3. 유료 2: 마보살 정밀풀이 (현실 문제 분석, 명리 연결, 마 진단, 원인, 시기 타임라인, 행동 처방) - 149,000원 ($109 / 약 15만원)
 * 4. 유료 3: 마보살 심화 처방 (디테일 맞춤 실천 가이드, 주간 플래너) - 49,000원 ($39)
 * 5. 향후 디지털 부적/처방 상품 (배경화면, 잠금화면, 디지털 카드)
 */

import { ProductDetail, ProductTier } from './types.js';

export const MABOSAL_PRODUCTS: Record<ProductTier, ProductDetail> = {
  free_diagnosis: {
    tier: 'free_diagnosis',
    title: '무료 사주 진단',
    subtitle: '타고난 사주 4주와 일간 본질, 오행 균형 및 마(魔) 징후 확인',
    price_krw: 0,
    price_usd: 0,
    features: [
      '사주 4주 8자 및 일간 본질 요약',
      '오행 분포(목·화·토·금·수) 그래프',
      '신강 / 신약 및 조후 한줄 요약',
      '현실 문제에 대한 마(魔) 신호 감지 여부 안내',
    ],
    cta_label: '무료 사주 진단하기',
  },
  paid_detailed_saju: {
    tier: 'paid_detailed_saju',
    title: '정밀 사주풀이',
    subtitle: '일반 명리학 기준 평생의 원국 분석과 7대 라이프 영역 심층 리포트',
    price_krw: 39000,
    price_usd: 29,
    features: [
      '사주 원국 4주 상세 및 득령·득지·득세 심층 분석',
      '7대 핵심 영역(재물, 직장, 사업, 연애, 결혼, 인간관계, 건강) 상세 해석',
      '대운(10년 주기) 및 당해 세운 종합 흐름',
      '분기별 전환점 및 주요 시기 가이드',
      '명리학적 근거 및 십신 분석 상세 제공',
    ],
    cta_label: '정밀 사주풀이 열람 (39,000원)',
  },
  paid_mabosal_full: {
    tier: 'paid_mabosal_full',
    title: '마보살 정밀풀이',
    subtitle: '현실 문제 심층 연결 + 마 진단 + 월 단위 시기 분석 + 맞춤 행동 처방 (최고급 프리미엄)',
    price_krw: 149000,
    price_usd: 109,
    features: [
      '정밀 사주풀이 리포트 전체 포함',
      '사용자가 가져온 현실 문제 ↔ 사주 구조 1:1 정밀 연결',
      '마보살식 문제 진단 (마의 원인 구조 및 파동 분석)',
      '12개월 월별 정밀 에너지 흐름 및 시기 분석 (피크·완화·호운 시점)',
      '현실적 실천 처방 (지금 피해야 할 행동, 지금 해야 할 행동, 전환기 전략)',
      '마보살과의 1:1 대화 상담 세션 전체 무제한 제공',
      '고해상도 디지털 부적 / 오행 보완 처방 카드 기본 증정',
    ],
    cta_label: '마보살 정밀풀이 신청 (149,000원)',
  },
  paid_deep_remedy: {
    tier: 'paid_deep_remedy',
    title: '마보살 심화 처방',
    subtitle: '위기 극복을 위한 100일 행동 처방 플래너 및 관계·비즈니스 맞춤 솔루션',
    price_krw: 49000,
    price_usd: 39,
    features: [
      '100일 일일 루틴 및 마음가짐 실천 플래너',
      '갈등 상황별 대화 스크립트 및 협상 가이드',
      '공간 풍수 및 라이프스타일 오행 조율 가이드',
    ],
    cta_label: '심화 처방 추가하기 (49,000원)',
  },
  paid_digital_talisman: {
    tier: 'paid_digital_talisman',
    title: '디지털 처방 카드 패키지',
    subtitle: '개인 맞춤 오행 보완 스마트폰 잠금화면, 고해상도 디지털 아트 카드',
    price_krw: 19000,
    price_usd: 15,
    features: [
      '맞춤 오행 보완 스마트폰 배경화면 (iOS/Android 최적화)',
      '지갑 소지용 인쇄 가능 고해상도 처방 카드',
      '상징 의미 해설서 포함',
    ],
    cta_label: '디지털 처방 다운로드 (19,000원)',
  },
};

export class ProductCatalogService {
  public getProduct(tier: ProductTier): ProductDetail {
    return MABOSAL_PRODUCTS[tier];
  }

  public getAllProducts(): ProductDetail[] {
    return Object.values(MABOSAL_PRODUCTS);
  }

  /**
   * 사용자 티어에 따라 노출할 리포트 필드 권한을 제어
   */
  public getVisibleSections(tier: ProductTier): {
    showBasicPillars: boolean;
    showGeneralThemes: boolean;
    showDaewoon: boolean;
    showMaDiagnosis: boolean;
    showTimingAnalysis: boolean;
    showPrescription: boolean;
    showDigitalRemedy: boolean;
  } {
    switch (tier) {
      case 'free_diagnosis':
        return {
          showBasicPillars: true,
          showGeneralThemes: false, // 무료는 맛보기 요약만
          showDaewoon: false,
          showMaDiagnosis: true,    // 징후 존재 여부만 노출
          showTimingAnalysis: false,// 시기 분석 잠금
          showPrescription: false,  // 처방 잠금
          showDigitalRemedy: false,
        };
      case 'paid_detailed_saju':
        return {
          showBasicPillars: true,
          showGeneralThemes: true,  // 7대 영역 전체 해제
          showDaewoon: true,        // 대운/세운 전체 해제
          showMaDiagnosis: false,   // 일반 사주는 마 분석 제외
          showTimingAnalysis: false,
          showPrescription: false,
          showDigitalRemedy: false,
        };
      case 'paid_mabosal_full':
      case 'paid_deep_remedy':
      case 'paid_digital_talisman':
      default:
        return {
          showBasicPillars: true,
          showGeneralThemes: true,
          showDaewoon: true,
          showMaDiagnosis: true,
          showTimingAnalysis: true, // 시기 분석 전체 해제
          showPrescription: true,   // 처방 전체 해제
          showDigitalRemedy: true,  // 디지털 처방 해제
        };
    }
  }
}
