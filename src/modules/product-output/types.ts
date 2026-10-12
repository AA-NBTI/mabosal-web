/**
 * src/modules/product-output/types.ts
 *
 * Phase 83: 4단계 상품 출력 구조 (Product Output Layer) 타입 정의
 *
 * 원칙
 * - 새 명리 계산을 하지 않는다. 기존 19개 모듈 + 통합/사건/시간축/처방 결과를 "공통 결과 데이터"로 보존한다.
 * - 상품은 공통 결과 데이터를 서로 다른 깊이로 표현할 뿐이다.
 * - 엔진에 없는 결과는 임의 생성하지 않고 block.missing = true 로 그대로 표시한다.
 */

import type { ProductGenerationResult } from '../product-generator/types.js';

// ============================================================================
// 1. 공통 입력 (CASE)
// ============================================================================
export interface CommonCaseInput {
  // 필수
  /** 양력 기준 생년월일 (YYYY-MM-DD). 음력 입력은 호출부에서 양력 변환 후 전달 */
  solarBirthDate: string;
  /** 24시간 HH:mm. 미상이면 null */
  birthTime: string | null;
  isUnknownTime?: boolean;
  gender: 'male' | 'female';
  calendarType: 'solar' | 'lunar';
  isLeapMonth?: boolean;
  /** 출생지 또는 시간 기준 */
  birthRegion: string;
  /** 사용자 핵심 고민 */
  coreTrouble: string;
  /** 사용자가 원하는 질문 */
  desiredQuestion: string;

  // 선택
  occupation?: string;
  currentSituation?: string;
  relationshipSituation?: string;
  financialSituation?: string;
  healthLifeSituation?: string;
  additionalContext?: string;

  /** 시간축 기준 연도 (기본: 현재 연도) */
  targetYear?: number;
  targetMonth?: number;
  /** 연도별 흐름을 만들 연도 목록 (기본: 기준 연도부터 3개년) */
  flowYears?: number[];
}

// ============================================================================
// 2. 기본 점수 (ResultScore)
// ============================================================================
export type ScoreStatus =
  | 'COMPUTED'       // 엔진이 직접 산출한 정량 값
  | 'RULE_DERIVED'   // 엔진 규칙값(월별 흐름 상태 등)에서 파생된 값
  | 'NOT_AVAILABLE'; // 산출 근거 없음 → 숫자를 만들지 않음

export interface ScoreEntry {
  key: string;
  label: string;
  value: number | null;
  max: number;
  status: ScoreStatus;
  /** 값의 근거 (고객 화면용 문장) */
  basis: string;
}

export interface ResultScore {
  overall: ScoreEntry;
  career: ScoreEntry;
  money: ScoreEntry;
  relationship: ScoreEntry;
  currentIssue: ScoreEntry;
  timing: ScoreEntry;
  prescription: ScoreEntry;
  /** 그 외 실제 산출 가능한 보조 점수 */
  extras: ScoreEntry[];
}

// ============================================================================
// 3. 공통 결과 데이터 (Common Result Data)
// ============================================================================
export interface YearFlow {
  year: number;
  ganji: string | null;
  peakPeriod: string | null;
  reliefPeriod: string | null;
  recoveryPeriod: string | null;
  summary: string | null;
  monthly: Array<{
    month: number;
    label: string;
    flow: string;
    /** 월별 원국 관계 (현재 연도만 엔진이 제공). 없으면 null */
    relationWithNatal: string[] | null;
    basis: string | null;
    advice: string | null;
  }>;
  /** 월별 원국 관계를 엔진이 제공했는지 */
  relationsAvailable: boolean;
  isCurrentYear: boolean;
}

export interface CommonResultData {
  input: CommonCaseInput;
  /** 입력 누락 (필수 항목이 비어 있음) */
  inputGaps: string[];
  generatedAt: string;

  // 원천 분석 결과 (19개 모듈 결과를 그대로 보존. 재계산 없음)
  modules: Record<string, any>;
  pillars: any | null;
  classification: ProductGenerationResult['classification'];

  // 통합/사건/시간축/처방
  integrated: any | null;
  event: any | null;
  evidence: any | null;
  timeAxis: any | null;
  prescription: any | null;

  // 연도별 흐름
  yearFlows: YearFlow[];

  // 점수
  scores: ResultScore;

  // 재료가 된 원본 상품 결과 (추적/검증용. 고객 화면에는 노출하지 않음)
  source: ProductGenerationResult;
}

// ============================================================================
// 4. 상품 출력 구조
// ============================================================================
export type ProductTier = 'FREE' | 'PAID' | 'CONFLICT_MALSAL' | 'PREMIUM';

export interface FactRow {
  label: string;
  value: string;
}

export interface OptionBlockItem {
  name: string;
  pros: string;
  burdens: string;
  conditions: string[];
}

// ============================================================================
// 4.5. Phase 84: 출력 근거 객체 (OutputEvidence)
// ============================================================================
export type JudgmentType =
  | 'fact'
  | 'interpretation'
  | 'event'
  | 'time'
  | 'malsal'
  | 'prescription'
  | 'decision';

export interface OutputEvidence {
  statementId: string;
  statement: string;

  judgmentType: JudgmentType;

  evidenceModules: string[];
  sourceFields: string[];

  timeAxis?: {
    type: 'natal' | 'daewun' | 'seun' | 'daewunSeun' | 'monthly';
    period?: string;
  };

  confidence: 'high' | 'medium' | 'low';
  supported: boolean;
}

export type OutputBlockType = 'text' | 'list' | 'facts' | 'table' | 'scores' | 'options';

export interface OutputBlock {
  type: OutputBlockType;
  label?: string;
  text?: string;
  items?: string[];
  rows?: FactRow[];
  table?: { headers: string[]; rows: string[][] };
  scores?: ScoreEntry[];
  options?: OptionBlockItem[];
  /** 엔진 결과가 없어 비어 있는 블록 (임의 생성하지 않음) */
  missing?: boolean;
  /** missing일 때 고객/개발자에게 보여줄 사유 */
  missingReason?: string;
  /** 내부 추적용 데이터 출처 (고객 화면에는 노출하지 않음) */
  source: string;
  /** Phase 84: 출력 근거 객체 (내부 추적용) */
  evidence?: OutputEvidence;
}

export type SectionCoverage = 'FULL' | 'PARTIAL' | 'EMPTY';

export interface OutputSection {
  id: string;
  no: number;
  title: string;
  coverage: SectionCoverage;
  blocks: OutputBlock[];
}

export interface ProductOutput {
  tier: ProductTier;
  tierLabel: string;
  tagline: string;
  sections: OutputSection[];
  meta: {
    sectionCount: number;
    coverage: { full: number; partial: number; empty: number };
    /** 비어 있는 블록 목록 (섹션 제목 > 블록 라벨) */
    missingBlocks: string[];
    /** Phase 84: 출력 근거 요약 및 추적 목록 */
    evidenceSummary?: {
      total: number;
      supported: number;
      byType: Record<JudgmentType, number>;
      byConfidence: Record<'high' | 'medium' | 'low', number>;
    };
    evidences?: OutputEvidence[];
  };
}

export interface ProductOutputSet {
  common: CommonResultData;
  free: ProductOutput;
  paid: ProductOutput;
  conflictMalSal: ProductOutput;
  premium: ProductOutput;
}

/** 상품별 정해진 섹션 구조 (id 순서) */
export const PRODUCT_SECTION_IDS: Record<ProductTier, string[]> = {
  FREE: [
    'free.overview', 'free.strengths', 'free.cautions', 'free.currentFlow',
    'free.question', 'free.coreDiagnosis', 'free.scores', 'free.upsell',
  ],
  PAID: [
    'paid.coreStructure', 'paid.career', 'paid.money', 'paid.relationship', 'paid.family',
    'paid.currentIssue', 'paid.daewun', 'paid.seun', 'paid.diagnosis', 'paid.scores', 'paid.actions',
  ],
  CONFLICT_MALSAL: [
    'cms.relations', 'cms.malsal', 'cms.daewunChange', 'cms.year1', 'cms.year2', 'cms.year3',
    'cms.riskPeriods', 'cms.synthesis', 'cms.actions',
  ],
  PREMIUM: [
    'prem.question', 'prem.structure', 'prem.ohaeng', 'prem.sipsin', 'prem.gyeokgukStrength',
    'prem.career', 'prem.money', 'prem.loveMarriage', 'prem.family', 'prem.health',
    'prem.relations', 'prem.malsal', 'prem.coreIssue', 'prem.daewun', 'prem.seun',
    'prem.monthly', 'prem.longTerm', 'prem.options', 'prem.finalJudgment', 'prem.plan',
    'prem.environment', 'prem.behavior', 'prem.criteria', 'prem.finalDiagnosis',
  ],
};
