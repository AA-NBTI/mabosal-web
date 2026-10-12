/**
 * src/modules/product-generator/types.ts
 * 
 * Phase 61: 마보살 상품 생성 아키텍처(Product Generation Layer) 타입 정의
 * 
 * "모듈은 고정하고, 상품은 조합한다."
 * 
 * 파이프라인:
 * USER INPUT → EVENT/PROBLEM CLASSIFICATION → MODULE SELECTION → MODULE EXECUTION →
 * EVENT-MODULE MAPPING → INTERPRETATION DEPTH → CASE/REAL-WORLD EXPLANATION →
 * PRESCRIPTION → PRODUCT OUTPUT → PRICE
 */

import { ModularId, ModularInput, ModularOutput } from '../modular/types.js';
import { IntegratedAnalysisOutput } from '../modular/integrated-analyzer.js';
import { ExecutionTrace } from '../../core/version-registry.js';

// ============================================================================
// 1. 사용자 사건/문제 입력 규격
// ============================================================================
export type ProblemDomain =
  | 'LOVE'         // 연애 / 결별 / 재회
  | 'MARRIAGE'     // 결혼 / 부부 / 배우자
  | 'BUSINESS'     // 사업 / 파트너십 / 계약
  | 'JOB'          // 직장 / 이직 / 승진 / 커리어
  | 'MONEY'        // 재물 / 손실 / 현금 흐름
  | 'RELATIONSHIP' // 인간관계 / 구설 / 배신
  | 'HEALTH'       // 건강 / 수술 / 심신 피로
  | 'GENERAL';     // 일반 / 불특정 위기

export interface UserProblemInput {
  birthDate?: string;          // YYYY-MM-DD
  birthTime?: string | null;   // HH:mm
  isUnknownTime?: boolean;
  gender?: 'male' | 'female';
  currentEvent: string;        // "갑자기 사업이 무너졌습니다", "파트너와 충돌합니다"
  userTrouble?: string;        // 구체적인 고민 내용
  currentTrouble?: string;     // 구체적인 고민 내용 별칭 (호환성)
  concern?: string;            // 고민 내용 별칭 (호환성)
  desiredQuestion?: string;    // "왜 이런 일이 생겼는지, 언제 풀릴지 알고 싶습니다"
  targetDomain?: ProblemDomain;
  domain?: any;      // 호환성 필드 (테스트 및 레거시 입력 지원)
  eventDate?: string;          // YYYY-MM-DD (선택적 사건 발생 시점)
  targetYear?: number;         // 기준 세운 연도 (기본: 2026)
  targetMonth?: number;        // 기준 월 (기본: 10)
  targetPrice?: number;        // 테스트 지정 가격 호환성
  characterId?: string;        // Phase 76 캐릭터 표현 ID ('default' | 'direct' | 'warm' | 'analytical')
  characterProfile?: any;      // Phase 76 캐릭터 표현 프로필
  additionalContext?: string;  // Phase 77: 고객 추가 상황 입력
  selectedSituation?: string;  // Phase 77: 고객 선택형 상황 옵션
  birthData?: {
    birthDate: string;
    birthTime?: string | null;
    isUnknownTime?: boolean;
    gender: 'male' | 'female';
  };
}

// ============================================================================
// 2. 사건/문제 분류 결과
// ============================================================================
export interface ProblemClassification {
  primaryDomain: ProblemDomain;
  secondaryDomains: ProblemDomain[];
  urgencyLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  keyIssues: string[];
  recommendedModules: ModularId[];
  summaryNote: string;
}

// ============================================================================
// 3. 결과 깊이 레이어 (InsightDepth)
// ============================================================================
export type InsightDepthLevel = 1 | 2 | 3 | 4 | 5;

export type InsightDepthCode =
  | 'LEVEL_1_INFO'           // 명리적 정보 제공
  | 'LEVEL_2_INTERPRETATION' // 정보 + 의미 설명
  | 'LEVEL_3_CAUSE'          // 정보 + 의미 + 현재 사건과의 연결
  | 'LEVEL_4_RESPONSE'       // 정보 + 의미 + 원인 + 시기 + 대응
  | 'LEVEL_5_PRESCRIPTION';  // 정보 + 의미 + 원인 + 시기 + 대응 + 개인 맞춤 처방

export interface DepthDescriptor {
  level: InsightDepthLevel;
  code: InsightDepthCode;
  name: string;
  description: string;
}

// ============================================================================
// 4. 마보살 전용 사건 설명 프로토콜 구조
// ============================================================================
export interface CaseExplanationProtocol {
  generalMeaning: string;       // GENERAL MEANING: 해당 명리 작용의 보편적 의미
  similarRealWorldCase: string; // SIMILAR REAL-WORLD CASE: 유사 현실 사례 (일반화된 사회적/비즈니스/관계 사례)
  riskAwareness: string;        // RISK AWARENESS: 착각하기 쉬운 함정 및 위험 인지
  understanding: string;        // UNDERSTANDING: 원리적 이해 (기운의 작용 기전)
  personalApplication: string;  // PERSONAL APPLICATION: 사용자 상황에의 1:1 대입
  mitigation: string;           // MITIGATION: 리스크 완화 행동 요령
  prescription: string;         // PRESCRIPTION: 구체적 실천 과제
  stabilization: string;        // STABILIZATION: 심리적·환경적 안정화 방향
}

// ============================================================================
// 5. 사건-모듈 연결 (Event-Module Mapping)
// ============================================================================
export interface EventModuleMappingItem {
  moduleId: ModularId;
  myeongliTrigger: string;   // 예: "월지 묘목과 세운 오화의 파(破) 작용 및 묘신 원진"
  connectionToEvent: string; // 예: "파트너와의 소통 단절 및 감정적 오해 증폭"
  impactLevel: 'CRITICAL' | 'MAJOR' | 'MODERATE';
  rawMetrics?: any;
  timeAxisContext?: {
    relation?: string;
    source?: 'NATAL' | 'DAEWUN' | 'SEUN';
    year?: number;
    daewun?: string;
    seun?: string;
  };
}

export interface EventModuleMappingResult {
  coreEvent: string;
  mappings: EventModuleMappingItem[];
  priorityMappings?: EventModuleMappingItem[];
  overallCausalSynthesis: string; // 사건의 원천적 명리 인과 종합
  integratedAnalysis?: IntegratedAnalysisOutput;
}

// ============================================================================
// 6. 가격 산정 요소 및 Product Configuration
// ============================================================================
export interface PricingFactors {
  scopeScore: number;             // 분석 범위 점수
  moduleCount: number;            // 포함 모듈 수
  personalizationLevel: number;   // 개인화 정도 (1~5)
  mappingDepth: number;           // 사건 연결 수준 (1~5)
  depthLevel: InsightDepthLevel;  // 해석 깊이 (1~5)
  timingIncluded: boolean;        // 대운/세운/월운 시기 분석 포함 여부
  caseIncluded: boolean;          // 현실 유사 사례 설명 프로토콜 포함 여부
  responseGuidanceIncluded: boolean; // 상황별 대응책 포함 여부
  prescriptionIncluded: boolean;  // 맞춤 처방 포함 여부
  calculatedPrice: number;        // 동적 산출 가격 (KRW)
}

export interface ProductConfig {
  productId: string;
  productName: string;
  targetProblem?: string;
  selectedModules: ModularId[];
  insightDepth: InsightDepthLevel;
  caseExplanation: boolean;
  personalizedMapping: boolean;
  timingAnalysis: boolean;
  responseGuidance: boolean;
  prescription: boolean;
  characterId?: string;           // Phase 76 캐릭터 표현 ID
  characterProfile?: any;         // Phase 76 맞춤형 캐릭터 표현 프로필
  price?: number;                 // 지정 가격 (미지정 시 동적 산정)
  customPricingFactors?: Partial<PricingFactors>;
}

// ============================================================================
// 7. 최종 상품 산출물 (Product Output)
// ============================================================================
export interface ProductOutputSection {
  title: string;
  depthRequired: InsightDepthLevel;
  content: string;
}

export interface ProductGenerationResult {
  productId: string;
  productName: string;
  config: ProductConfig;
  userProblem: UserProblemInput;
  classification: ProblemClassification;
  executedModules: Record<ModularId, ModularOutput>;
  integratedAnalysis?: IntegratedAnalysisOutput;
  eventMapping?: EventModuleMappingResult;
  caseProtocol?: CaseExplanationProtocol;
  depthReport: {
    level: InsightDepthLevel;
    levelName: string;
    sections: ProductOutputSection[];
    fullDocument: string;
  };
  magaDiagnosis?: any;
  eventDiagnosis?: any;
  prescriptionReport?: {
    mustDo: string[];
    mustAvoid: string[];
    timingRoadmap: string;
    safeguardNotice: string; // 의료/법률/투자 단정 배제 가드
    environmentGuidance?: string[];
    remedyItems?: any[];
    prescriptionResult?: any;
  };
  pricing: PricingFactors;
  trace?: ExecutionTrace;
  customerDeliverable?: CustomerDeliverable;
  evidenceResult?: any;
  timeAxisJudgment?: any;
  prescriptionSynthesis?: any;
  validationResult?: any;
  generatedAt: string;
}

// ============================================================================
// 7.5. Phase 73: 실제 고객 전달 결과물 규격 (Customer Deliverable)
// ============================================================================
export interface StructuredDeliverableJudgments {
  coreProblem: string;
  primaryDomain: ProblemDomain;
  myeongliBasis: string[];
  timeAxisBreakdown: {
    natal: string[];
    daewun?: string[];
    seun?: string[];
    daewunSeun?: string[];
  };
  magaActive: string[];
  realWorldManifestation: string;
  responseGuidance: {
    mustDo: string[];
    mustAvoid: string[];
  };
  prescriptions: {
    environment: string[];
    behavior: string[];
    remedy: string[];
  };
  additionalContext?: string; // Phase 78: 고객 추가 상황 보존
  selectedSituation?: string; // Phase 78: 고객 선택 상황 보존
}

// ============================================================================
// 7.6. Phase 77: 무료 고객 결과물 구조 (Free Customer Deliverable)
// ============================================================================
export interface FreeCustomerDeliverable {
  step1_coreSummary: string;            // ① 한눈에 보는 핵심 (일간 본원, 오행, 격국, 핵심 기질)
  step2_attentionPoint: string;         // ② 지금 주목할 부분 (시간축, 대운/세운 작용점)
  step3_realWorldManifestation: string; // ③ 현실에서 나타날 수 있는 모습 (생활 언어 변환)
  step4_customerConnectWidget: {       // ④ 고객 상황 연결 장치 (자발적 추가 입력 인터페이스)
    prompt: string;
    options: string[];
    customInputPlaceholder: string;
  };
  step5_inDepthPreview: string;         // ⑤ 더 깊게 보면 무엇을 알 수 있는가 (심층 확장 비교)
  /** 위 5단계를 하나의 텍스트로 합친 전체 본문 */
  fullText?: string;
}

export interface CustomerDeliverable {
  // 구조화된 불변 판정 스냅샷 (Phase 75: 판정과 표현의 분리)
  structuredJudgments?: StructuredDeliverableJudgments;
  // Phase 77: 재설계된 무료 결과 구조
  freeDeliverable?: FreeCustomerDeliverable;
  // 10단계 권장 순서 섹션 (Section 6)
  sections: {
    step1_currentEvent: string;             // 1. 지금 무슨 일이 생겼는가
    step2_whyOccurred: string;              // 2. 왜 이런 문제가 나타났는가
    step3_myeongliCore: string;             // 3. 명리적으로 무엇이 핵심인가
    step4_magaCaution: string;              // 4. 마·살 관점에서 무엇을 주의해야 하는가
    step5_futureFlow: string;               // 5. 앞으로 어떤 흐름인가
    step6_whatToChange: string;             // 6. 무엇을 바꾸는 것이 좋은가
    step7_environmentPrescription: string;  // 7. 환경 처방
    step8_behaviorPrescription: string;     // 8. 행동 처방
    step9_remedyItems: string;              // 9. 필요한 경우 처방물
    step10_finalSummary: string;            // 10. 최종 정리
  };
  // 7대 핵심 고객 질문에 대한 명확한 답변 (Section 12)
  answersTo7Questions: {
    q1_whyNow: string;                      // 질문 1: "왜 지금 이런 일이 생겼습니까?"
    q2_myeongliIssue: string;               // 질문 2: "명리적으로 무엇이 문제입니까?"
    q3_timingPeriod: string;                // 질문 3: "언제까지 관리해야 합니까?"
    q4_actionToDo: string;                  // 질문 4: "제가 무엇을 하면 됩니까?"
    q5_environmentChange: string;           // 질문 5: "환경을 어떻게 바꾸면 됩니까?"
    q6_prescriptionNeeded: string;          // 질문 6: "이 문제를 줄이기 위해 어떤 처방이 필요합니까?"
    q7_cautionToWatch: string;              // 질문 7: "앞으로 무엇을 조심해야 합니까?"
  };
  fullFormattedText: string;
  standard15Report?: string;                // Phase 80: 15개 전문 사주 고정 포맷 보고서 전문
  verdictStrength: string;                  // 명확한 판단 문구 ("강하게 나타납니다", "주의가 필요합니다" 등)
  safetyPassed: boolean;                    // 금지 표현 배제 및 안전성 검증 통과 여부
}

// ============================================================================
// 8. Phase 71: 상품별 11개 독립 평가 점수 규격 (Section 11)
// ============================================================================
export interface ProductEvaluationScores {
  myeongliAccuracy: number;      // A. 명리 정확성 (0 ~ 100)
  problemDiagnosis: number;      // B. 문제 진단 (0 ~ 100)
  moduleAdequacy: number;        // C. 모듈 적절성 (0 ~ 100)
  personalization: number;       // D. 개인화 (0 ~ 100)
  interpretationDepth: number;   // E. 해석 깊이 (0 ~ 100)
  magaConnection: number;        // F. 마·살 연결 (0 ~ 100)
  prescriptionQuality: number;   // G. 처방 품질 (0 ~ 100)
  feasibility: number;           // H. 실행 가능성 (0 ~ 100)
  safety: number;                // I. 안전성 (0 ~ 100)
  customerResultQuality: number; // J. 최종 고객 결과 품질 (0 ~ 100)
  valueForPrice: number;         // K. 가격 대비 가치 (0 ~ 100)
  totalScore: number;            // 종합 합계 점수 (0 ~ 1100)
  averageScore: number;          // 평균 점수 (0 ~ 100)
}

