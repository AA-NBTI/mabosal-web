/**
 * src/modules/event-diagnosis/types.ts
 * 
 * Phase 69: 사건 진단 엔진 (Event Diagnosis Engine) 규격 및 타입 정의
 * 
 * "사건과 원인을 혼동하지 않고, 명리 구조와 시간축을 연결하여 현실 언어로 사건을 설명한다."
 */

import { FourPillars, EarthlyBranch, HeavenlyStem } from '../../core/types.js';
import { MagaDiagnosisComprehensiveResult, MagaDiagnosisResultItem } from '../ma/maga-diagnosis-engine.js';
import { IntegratedAnalysisOutput } from '../modular/integrated-analyzer.js';

// ============================================================================
// 1. 사건 입력 규격 (3절)
// ============================================================================
export interface UserEventBirthData {
  birthDate: string;           // YYYY-MM-DD
  birthTime?: string | null;   // HH:mm
  gender: 'male' | 'female';
  isUnknownTime?: boolean;
}

export interface UserEventInput {
  birthData: UserEventBirthData;
  currentConcern: string;        // "사업 파트너와 계약 문제로 갈등하고 있습니다."
  eventDescription: string;      // 구체적인 사건 설명
  desiredQuestion?: string;      // "왜 계속 사업에서 사람 문제가 생기는지 알고 싶습니다."
  eventDate?: string;            // 사건 발생 시점 (YYYY, YYYY-MM, YYYY-MM-DD)
  eventEndDate?: string;
  emotion?: string;              // "불안", "배신감", "답답함" 등
  targetDomain?: string;         // 사용자 명시 도메인 (선택적)
}

// ============================================================================
// 2. 사건 영역 및 세부 유형 (4, 5절)
// ============================================================================
export type EventDomain =
  | 'MONEY'
  | 'BUSINESS'
  | 'JOB'
  | 'LOVE'
  | 'MARRIAGE'
  | 'RELATIONSHIP'
  | 'HEALTH'
  | 'LIFE'
  | string; // 확장 가능: LEGAL, FAMILY, HOUSING, EDUCATION, DIGITAL, AI 등

export interface ClassifiedDomainItem {
  domain: EventDomain;
  confidence: number;            // 0 ~ 100
  reason: string;
}

export interface ClassifiedSubTypeItem {
  subType: string;
  confidence: number;            // 0 ~ 100
  keywords: string[];
}

export interface EventClassificationResult {
  primaryDomain: EventDomain;
  domainConfidence: number;      // 0 ~ 100
  secondaryDomains: ClassifiedDomainItem[];
  subType: string;
  subTypeConfidence: number;     // 0 ~ 100
  extractedIssues: string[];
}

// ============================================================================
// 3. 원인 후보 및 시간축 컨텍스트 (8, 10, 15절)
// ============================================================================
export interface CausalCandidate {
  id: string;
  title: string;              // 예: "파트너십 및 계약 구조의 충돌성 기운"
  evidence: string;           // 예: "인신충(寅申沖) 및 월지 묘목 파(破) 작용"
  source: 'NATAL' | 'DAEWUN' | 'SEUN' | 'DAEWUN×SEUN';
  confidence: number;         // 0 ~ 100
  explanation: string;        // 현실 언어 인과 설명
}

export interface TimeAxisContextItem {
  source: 'NATAL' | 'DAEWUN' | 'SEUN' | 'DAEWUN×SEUN';
  year?: number;
  ganji?: string;
  daewunGanji?: string;
  seunGanji?: string;
  relationLabels: string[];
  roleDescription: string;    // 원국: 선천적 성향 / 대운: 장기 환경 / 세운: 당해 연도 변화 등
}

// ============================================================================
// 4. 사건 진단 종합 결과 (8절)
// ============================================================================
export interface EventDiagnosisResult {
  eventId: string;
  eventDomain: EventDomain;
  eventSubType: string;
  domainConfidence: number;      // 0 ~ 100
  subTypeConfidence: number;     // 0 ~ 100
  secondaryDomains: ClassifiedDomainItem[];

  userEvent: {
    currentConcern: string;
    eventDescription: string;
    desiredQuestion?: string;
    emotion?: string;
  };
  eventDate?: string;

  relevantModules: string[];
  evidence: string[];
  timeAxisContext: TimeAxisContextItem[];

  magaDiagnoses: string[];
  causalCandidates: CausalCandidate[];

  primaryDiagnosis: string;
  secondaryDiagnoses: string[];

  // 9절: 반드시 독립 보존되어야 하는 3대 점수
  intensityScore: number;        // 명리 구조 영향 강도 (0 ~ 100)
  relevanceScore: number;        // 현재 사건과의 관련성 (0 ~ 100)
  evidenceScore: number;         // 명리 근거 충실도 (0 ~ 100)

  traditionalExplanation: string;
  practicalExplanation: string;

  riskAwareness: string;
  mitigationDirection: string;
  prescriptionCandidates: string[];

  confidence: number;            // 종합 판정 신뢰도 (0.0 ~ 1.0)
  safetyFlags: string[];         // 공포 표현 차단 및 안전 검증 완료 태그
}
