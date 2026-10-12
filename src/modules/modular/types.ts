/**
 * src/modules/modular/types.ts
 * 
 * Phase 60: Modular Product Architecture 타입 정의
 * 
 * 5개 계층:
 * 명리 Core → 표준 사주 → 독립 모듈 → 통합 분석 → 마 진단·처방
 * 
 * 6대 상품 티어:
 * FREE / STANDARD / SINGLE / COMBINATION / SAL / PREMIUM
 */

import { HeavenlyStem, EarthlyBranch, FiveElement, FourPillars } from '../../core/types.js';

// ============================================================================
// 1. 모듈 식별자 및 카테고리
// ============================================================================
export type CoreModuleId =
  | 'CORE_ORIGINAL' // 원국 (4주 8자, 일간, 오행)
  | 'TEN_GODS'      // 십신
  | 'GEOKGUK'       // 격국
  | 'STRENGTH'      // 강약 (득령/득지/득세)
  | 'EOKBU'         // 억부 용신/희신/기신
  | 'JOHU'          // 조후 용신/희신/기신
  | 'RELATION'      // 합·충·형·파·해·원진
  | 'SINSAL'        // 12신살 및 길신/흉살
  | 'DAEWUN'        // 10년 주기 대운
  | 'SEUN';         // 연운(세운) 및 월운

export type TroubleModuleId =
  | 'MONEY'         // 재물 / 투자
  | 'BUSINESS'      // 사업 / 창업 / 거래
  | 'JOB'           // 직장 / 이직 / 승진
  | 'LOVE'          // 연애 / 이별 / 재회
  | 'MARRIAGE'      // 결혼 / 부부 / 가정
  | 'RELATIONSHIP'  // 인간관계 / 대인 갈등
  | 'HEALTH';       // 건강 / 심신 안정

export type MabosalModuleId =
  | 'MAGA_DIAGNOSIS'// 마(魔) 진단
  | 'PRESCRIPTION'; // 실천 및 금기 처방

export type ModularId = CoreModuleId | TroubleModuleId | MabosalModuleId | string;

export type ModuleCategory = 'CORE' | 'TROUBLE' | 'MABOSAL' | 'CUSTOM';

// ============================================================================
// 2. 표준 모듈 Input & Output 규격 (Input → Calc → Judgment → Explanation → Output)
// ============================================================================
export interface ModularInput {
  birthDate: string; // YYYY-MM-DD
  birthTime?: string | null; // HH:mm
  isUnknownTime?: boolean;
  gender: 'male' | 'female';
  calendarType?: 'solar' | 'lunar';
  isLeapMonth?: boolean;
  region?: string;
  targetYear?: number;  // 기준 세운 연도 (기본: 2026)
  targetMonth?: number; // 기준 월 (기본: 10)
  userTroubleText?: string;
  contextData?: Record<string, any>; // 타 모듈 연계 시 선택적 캐시/컨텍스트
}

export interface ModularOutput<TResult = any> {
  moduleId: ModularId;
  moduleName: string;
  category: ModuleCategory;
  version: string;
  success: boolean;
  
  // 파이프라인 단계별 산출물
  calculation: {
    rawMetrics: Record<string, any>;
    basis: string[];
    ruleId: string;
  };
  judgment: {
    verdict: string;
    level?: string | number;
    score?: number;
    indicators: Record<string, any>;
  };
  explanation: {
    summary: string;
    detailedNarrative: string;
    keywords: string[];
    actionableInsight?: string;
  };
  
  data: TResult;
  timestamp: string;
}

// ============================================================================
// 3. 상품 계층 (Product Tier) 및 조합 상품 정의
// ============================================================================
export type ProductTierLevel =
  | 'FREE'        // 표준 사주 기본 분석
  | 'STANDARD'    // 표준 명리 심화 분석
  | 'SINGLE'      // 개별 전문 모듈 단독 상품
  | 'COMBINATION' // 2개 이상 전문 모듈 조합 상품
  | 'SAL'         // 현실 고민 + 관련 명리 모듈 결합 상품
  | 'PREMIUM';    // 종합 분석 + 마 진단 + 처방

export interface ProductPackageDefinition {
  packageId: string;
  packageName: string;
  tier: ProductTierLevel;
  price: number; // KRW
  description: string;
  requiredModuleIds: ModularId[];
  isCustomizable?: boolean;
}

export interface ProductAssemblyResult {
  packageId: string;
  packageName: string;
  tier: ProductTierLevel;
  totalModules: number;
  moduleResults: Record<ModularId, ModularOutput>;
  integratedAnalysis?: any;
  magaDiagnosis?: any;
  prescription?: any;
  customerSummaryReport: string;
  generatedAt: string;
}
