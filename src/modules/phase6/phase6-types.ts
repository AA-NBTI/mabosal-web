/**
 * Phase 6: Second Relationship, RSI, Interpretation & Time-Axis 타입 정의
 * 
 * 원칙:
 * 1. Phase 1~5 원본 및 Frozen 규칙 무수정 불변 보존
 * 2. Phase 6 신규 규칙은 초기 PROVISIONAL 또는 OPEN으로 격리 (PHASE6_CONFIRMED 자동 승격 금지)
 * 3. RSI는 숫자 점수 없이 정성 매트릭스(Cohesion × Tension × Resilience → RSIBand)로 판정
 * 4. TimeModulatorSignal은 원국의 MaSignalSet을 절대 덮어쓰거나 변경하지 않음
 * 5. InterpretationNode는 Fact Traceability를 필수적으로 내장
 */

import { FourPillars, HeavenlyStem, TenGod } from '../../core/types.js';
import {
  EvidenceLevel,
  MaId,
  MaSignalEntity,
  MaSignalSet,
  QualitativeLevel,
  RuleCertainty,
} from '../ma/ma-types.js';

// ==========================================
// 1. Second Relationship Layer 타입
// ==========================================
export type SecondRelationshipAction =
  | 'AMPLIFIED'    // 강화: 한 영역의 활성이 다른 영역의 기회를 비선형으로 확장
  | 'CONFLICTING'  // 충돌: 상반된 기운의 동시 활성화로 인한 구조적 마찰 가중
  | 'MITIGATED'    // 완화: 보호 성분이 부정적 신호의 충격을 흡수
  | 'TRANSFERRED'; // 전이: 한 영역의 에너지가 다음 영역으로 가치 전환

export interface SecondRelationshipMatch {
  id: string;
  sourceModuleId: MaId;
  targetModuleId: MaId;
  signalsInvolved: [MaId, MaId];
  action: SecondRelationshipAction;
  evidenceLevel: EvidenceLevel;     // 초기 상태: PROVISIONAL 권장
  certainty: RuleCertainty;         // 초기 상태: PROVISIONAL 또는 OPEN
  phaseOrigin: 'PHASE_6';
  primaryBasis: string[];           // 명리학적 성립 근거 (원천 십신/궁위/관계)
  derivedFromFacts: string[];       // 구체적 원천 Fact 항목
  affectedAxis: 'pressure' | 'opportunity' | 'volatility' | 'mitigation';
  description: string;
  isAppliedToCoreState: false;      // 불변 원칙: 원본 ActivationState 변경 금지 고정 플래그
}

// ==========================================
// 2. RSI (Relationship Stability Index) 타입
// ==========================================
export type CohesionLevel = 'STABLE' | 'MODERATE' | 'FRAGILE';
export type TensionLevel = 'LOW' | 'TENSE' | 'CRITICAL';
export type ResilienceLevel = 'HIGH' | 'PARTIAL' | 'DEFICIENT';

export type RSIBand =
  | 'SERENE'            // 평온·견고: 안정된 구심점과 무충 상태
  | 'BALANCED_TENSION'   // 건전한 긴장: 충격/압박이 강하나 탄력성이 완전 흡수하여 도약 동력화
  | 'TURBULENT'         // 격변·과부하: 완충 없는 정면 충돌과 과열로 인한 구조 균열
  | 'LATENT';           // 잠복·대기: 격발 인자도 구심점도 미약하여 외부 운(대운/세운) 대기

export interface RSIMatrixResult {
  cohesion: CohesionLevel;
  tension: TensionLevel;
  resilience: ResilienceLevel;
  band: RSIBand;
  reasoning: string;
  isExceptionApplied: boolean;
  certainty: RuleCertainty; // 초기 상태: PROVISIONAL
}

export interface RSIAssessment extends RSIMatrixResult {
  evidenceLevel: 'PROVISIONAL';
  phaseOrigin: 'PHASE_6';
  derivedFromSignals: MaId[];
  derivedFromFacts: string[];
}

export interface Phase6Output {
  secondRelationships: SecondRelationshipMatch[];
  rsi: RSIAssessment;
  interpretations: InterpretationNode[];
  immutabilityVerified: boolean;
  timeModulatorSignals?: TimeModulatorSignal[];
}

// ==========================================
// 3. Time-Axis Modulator 타입
// ==========================================
export type TimeScope = 'DAEWOON' | 'SEWOON' | 'WOLWOON';

export interface TimeModulatorSignal {
  timeScope: TimeScope;
  targetModuleId: MaId;
  temporalTriggerState: 'TRIGGERED' | 'ACTIVE'; // 원본 state 변경 없이 해당 기간 한정 감응
  modulatedAxisDelta?: {
    intensityDelta?: QualitativeLevel;
    volatilityDelta?: QualitativeLevel;
    pressureDelta?: QualitativeLevel;
    opportunityDelta?: QualitativeLevel;
    mitigationDelta?: QualitativeLevel;
  };
  evidenceLevel: 'PROVISIONAL' | 'OPEN';
  description: string;
}

// ==========================================
// 4. InterpretationNode 타입
// ==========================================
export type InterpretationTheme =
  | 'WEALTH_FLOW'       // 재물·자산 흐름
  | 'CAREER_ORGANIZATION' // 직장·사회적 성취
  | 'BUSINESS_VENTURE'  // 사업·독립적 실행
  | 'RELATIONSHIP_BOND' // 연애·결혼·가족 유대
  | 'HEALTH_EQUILIBRIUM'// 건강·기혈 균형
  | 'SAFETY_MOVEMENT';  // 이동·사고·법률 안전

export interface InterpretationStructure {
  conclusion: string;                      // 1. 결론
  basis: {                                 // 2. 근거 Fact / Signal
    signals: MaId[];
    facts: string[];
  };
  relationshipAndRSIImpact: {              // 3. 2차 관계 및 RSI의 영향
    rsiBand: RSIBand;
    activeSecondRelationships: string[];
    impactSummary: string;
  };
  temporalContext?: {                      // 시간축 보조 컨텍스트 (원국 Fact/Signal 변경 없이 시점 의미만 보조)
    timeScope: TimeScope;
    targetModuleId: MaId;
    description: string;
  }[];
  actionableCaution: {                     // 4. 주의 또는 대응 방향
    cautionType?: string;
    guideline: string;
  };
}

export interface InterpretationNode {
  interpretationId: string;
  theme: InterpretationTheme;
  primaryVerdict: string;           // 핵심 정성 결론
  derivedFromSignals: MaId[];       // 관여된 Ma 신호 ID
  factReferences: {
    pillarsInvolved: ('year' | 'month' | 'day' | 'hour')[];
    tenGods: TenGod[];
    relationshipsUsed: string[];
    isSpouseFactReferenced: boolean;
  };
  structure: InterpretationStructure; // 4단계 구조화 해석
  certainty: RuleCertainty;         // 확정도 (CONFIRMED ~ PROVISIONAL)
  provisionalNote?: string;         // PROVISIONAL/OPEN 규칙 개입 시 고지 안내
}
