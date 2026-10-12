/**
 * src/modules/prescription/types.ts
 * 
 * Phase 70: 마보살 처방 엔진 (Prescription Engine) 타입 및 규격 정의
 * 
 * 핵심 철학:
 * 명리 근거(basis) → 문제 진단 → 보완/조절 필요 요소 → 환경 처방 + 행동 처방 + 처방물 후보 → 기대 목적
 * 
 * "실제로 이용자의 환경과 행동을 바꿀 수 있는 구체적인 처방을 생성한다."
 */

import { FourPillars, FiveElement } from '../../core/types.js';
import { MagaDiagnosisComprehensiveResult, MagaDiagnosisResultItem } from '../ma/maga-diagnosis-engine.js';
import { EventDiagnosisResult, UserEventInput } from '../event-diagnosis/types.js';
import { IntegratedAnalysisOutput } from '../modular/integrated-analyzer.js';
import { ModularId, ModularOutput } from '../modular/types.js';

// ============================================================================
// 1. 도메인 및 처방 강도/우선순위
// ============================================================================
export type PrescriptionCategory =
  | 'MONEY'         // 재물
  | 'BUSINESS'      // 사업
  | 'JOB'           // 직장
  | 'LOVE'          // 연애
  | 'MARRIAGE'      // 결혼
  | 'RELATIONSHIP'  // 관계
  | 'HEALTH'        // 건강
  | 'LIFE'          // 생활
  | string;

export type PrescriptionPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type PrescriptionIntensity =
  | 'RECOMMENDED'          // 1단계 - 권장 (가볍게 적용할 수 있는 변화)
  | 'STRONGLY_RECOMMENDED' // 2단계 - 적극 권장 (의도적인 변경 필요)
  | 'PRIORITY_RESPONSE'    // 3단계 - 우선 대응 (현재 문제와 직접 연결되어 우선 실행)
  | 'INTENSIVE_CARE';      // 4단계 - 집중 관리 (복수 명리 근거와 사건 중첩)

// ============================================================================
// 2. 처방물(Remedy Item) 규격
// ============================================================================
export type RemedyItemType =
  | 'DIGITAL_WALLPAPER' // 디지털 배경화면 (환경 처방 상기)
  | 'REMINDER_CARD'     // 맞춤 처방 카드 (행동 처방 반복 실행)
  | 'AMULET_IMAGE'      // 상징적 보조 부적 이미지
  | 'SPACE_PROP'        // 공간 소품 / 오브제 권고
  | 'CUSTOM_SHEET'      // 맞춤형 처방서 인쇄물
  | string;

export interface RemedyItemPersonalization {
  recommendedColor?: string;
  recommendedDirection?: string;
  recommendedMaterial?: string;
  keyword?: string;
  textGuide?: string;
  symbol?: string;
}

export interface RemedyItem {
  id: string;
  type: RemedyItemType;
  title: string;
  purpose: string;
  linkedPrescriptionId: string;
  linkedEvidence: string[];
  personalization: RemedyItemPersonalization;
  safetyNotice: string; // "본 처방물은 상징적 보조 수단이며 운명을 바꾸거나 효능을 보장하지 않습니다."
}

// ============================================================================
// 3. 단일 처방 규격 (Prescription)
// ============================================================================
export interface PrescriptionTimeAxisContext {
  generalEnvironment?: string; // 평상시 기본 환경
  daewunBehavior?: string;     // 현재 대운 장기 행동 처방
  seunCaution?: string;        // 현재 세운 단기 주의 행동
  intensivePeriod?: string;    // 특정 집중 관리 시기
}

export interface Prescription {
  prescriptionId: string;
  category: PrescriptionCategory;
  title: string;

  // 명리 근거 체계 (basis가 비어 있는 처방은 생성/출력 차단)
  basis: string[];
  targetProblem: string;
  targetElement?: FiveElement | string;
  targetRelation?: string;
  targetMaga?: string;

  // 처방의 3대 축
  environmentActions: string[];
  behaviorActions: string[];
  remedyItems: RemedyItem[];

  expectedPurpose: string;
  priority: PrescriptionPriority;
  intensity: PrescriptionIntensity;
  confidence: number; // 0.0 ~ 1.0

  // 12절: 5대 독립 보존 점수 (0 ~ 100)
  evidenceScore: number;     // 명리적 근거 충실도
  relevanceScore: number;    // 현재 고민과의 직접 관련성
  feasibilityScore: number;  // 현실에서의 실행 용이성
  priorityScore: number;     // 종합 가중 우선순위
  confidenceScore: number;   // 판정 신뢰도

  // 15절: 시간 처방 컨텍스트
  timeAxisContext?: PrescriptionTimeAxisContext;

  // 20절: 4단계 설명 체계 (왜? / 무엇을? / 어떻게? / 무엇을 기대?)
  explanationStructured: {
    why: string;     // 명리 근거
    what: string;    // 환경 및 행동 요약
    how: string;     // 구체적 실행 지침
    purpose: string; // 기대 목적
  };

  safetyFlags: string[];
}

// ============================================================================
// 4. 고객용 결과 구조 (Customer Result)
// ============================================================================
export interface PrescriptionCustomerResult {
  currentProblem: string;                 // 현재 문제
  whyThisHappened: string;                // 왜 이런 문제가 나타나는지 (명리 근거)
  coreDiagnosis: string;                  // 핵심 진단
  top3Prescriptions: Prescription[];      // 가장 중요한 처방 3가지 ("지금 가장 먼저 바꿀 것 3가지")
  environmentSummary: string[];           // 환경을 이렇게 바꾸세요
  behaviorSummary: string[];              // 행동을 이렇게 바꾸세요
  remedyItemsSummary: RemedyItem[];       // 필요하면 이런 처방물을 활용하세요
  expectedTransformation: string;         // 기대하는 변화
  safetyNotice: string;                   // 안전 공지 및 법적·의료 안내
}

// ============================================================================
// 5. 처방 엔진 종합 결과 (PrescriptionResult)
// ============================================================================
export interface PrescriptionResult {
  resultId: string;
  domain: PrescriptionCategory;
  subType: string;
  totalPrescriptions: number;
  prescriptions: Prescription[];
  topPrescriptions: Prescription[];
  customerResult: PrescriptionCustomerResult;
  timeAxisSummary: {
    general: string[];
    daewun: string[];
    seun: string[];
    intensive: string[];
  };
  safetyVerification: {
    isSafe: boolean;
    flags: string[];
    notes: string[];
  };
}

// ============================================================================
// 6. 처방 엔진 입력 데이터 (PrescriptionInput)
// ============================================================================
export interface PrescriptionInput {
  integratedAnalysis?: IntegratedAnalysisOutput;
  magaDiagnosis?: MagaDiagnosisComprehensiveResult | MagaDiagnosisResultItem[];
  eventDiagnosis?: EventDiagnosisResult;
  pillars?: FourPillars;
  moduleResults?: Record<ModularId | string, ModularOutput>;
  userEvent?: UserEventInput | {
    currentConcern: string;
    eventDescription?: string;
    targetDomain?: string;
  };
  targetYear?: number;
}
