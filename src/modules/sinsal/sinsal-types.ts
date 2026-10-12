/**
 * Phase 50: 살진단 엔진 (Sal Diagnosis Engine) 타입 정의
 */

export const DIMINISHING_RETURN_FACTOR = 0.45;

export type SinsalCategory = '12sinsal' | 'major_sinsal' | 'support_sinsal';

export type SinsalCalculationBasis = 
  | 'year_branch'       // 년지 기준 삼합
  | 'day_branch'        // 일지 기준 삼합
  | 'day_stem'          // 일간 기준
  | 'month_branch'      // 월지 기준
  | 'day_pillar'        // 일주 기준
  | 'year_pillar'       // 년주 기준
  | 'fixed_pillar'      // 특정 간지 기준 (백호, 괴강)
  | 'fixed_stem_branch' // 특정 글자 기준 (현침 등)
  | 'other';

export type SinsalReliability = 'high' | 'medium' | 'reference_only' | 'pending';
export type SinsalStatus = 'active' | 'reference_only' | 'pending';

export type PillarLocation = 'year' | 'month' | 'day' | 'hour';

export interface SinsalDefinition {
  id: string;
  name: string;
  aliases: string[];
  category: SinsalCategory;
  calculationBasis: SinsalCalculationBasis;
  referencePillars: PillarLocation[];
  targetStems?: string[];
  targetBranches?: string[];
  ruleId: string;
  traditionalMeaning: string;
  favorableContext: string;
  unfavorableContext: string;
  activationRuleId: string;
  domainMapping: Record<string, number>; // 10대 마 (연애마, 분쟁마, 이동마 등) 기본 가중치
  reliabilityLevel: SinsalReliability;
  sourceNote: string;
  status: SinsalStatus;
}

export interface ScoreModifier {
  ruleId: string;
  reason: string;
  delta: number;
}

export interface SinsalScoreBreakdown {
  base: number;
  modifiers: ScoreModifier[];
  caps: number;
  floors: number;
  final: number;
  ruleIds: string[];
}

export interface CalculationEvidence {
  basis: string;
  matchedTarget: string;
  referenceValue: string;
  scoreBreakdown: SinsalScoreBreakdown;
  note?: string;
}

export interface SinsalCalculationResult {
  sinsalId: string;
  name: string;
  aliases?: string[];
  category: SinsalCategory;
  calculationBasis: SinsalCalculationBasis;
  presentInNatal: boolean;
  natalLocations: PillarLocation[];
  activationByDaeun: boolean;
  activationBySeun: boolean;
  activationByMonth: boolean;
  activationByDay: boolean;
  activationScore: number; // 0 ~ 100
  riskScore: number;       // 0 ~ 100
  supportScore: number;    // 0 ~ 100
  domainScores: Record<string, number>;
  triggerRelations: string[];
  ruleIds: string[];
  calculationEvidence: CalculationEvidence;
  reliabilityLevel: SinsalReliability;
  status: SinsalStatus;
}

export interface RelationInteraction {
  relationType: '합' | '충' | '형' | '파' | '해' | '원진';
  targetSinsal: string;
  pillarLocation: string;
  timingPillar?: string; // 대운, 세운, 월운, 일진
  effect: string;
  scoreDelta: number;
  ruleId: string;
}

export interface UserEventInput {
  eventDomain?: string;
  eventType?: string;
  eventText: string;
  eventDate?: string;      // YYYY-MM-DD
  eventDateKnown: boolean;
}

export interface EventConnectionResult {
  eventDomain?: string;
  eventType?: string;
  eventText: string;
  eventDateKnown: boolean;
  eventDate?: string;
  candidate_period?: {
    startYearMonth: string;
    endYearMonth: string;
    reason: string;
    ruleId: string;
  };
  relevanceScore: number;
  matchedSinsals: string[];
  explanation: string;
}

export interface SalSignalItem {
  sinsalId: string;
  name: string;
  score: number;
  reason: string;
  ruleId: string;
}

export interface MaImpactItem {
  name: string;
  score: number;
  ruleId: string;
}

export interface MaImpactSummary {
  domain: string;
  rawScore: number;
  weightedScore: number;
  modifiers: ScoreModifier[];
  cap: number;
  floor: number;
  normalization: string;
  finalScore: number;
  totalImpactScore: number; // 하위 호환성 유지 (finalScore와 동등)
  ruleIds: string[];
  contributingSinsals: MaImpactItem[];
}

export interface SalDiagnosisResult {
  totalSinsalsEvaluated: number;
  natalSinsals: SinsalCalculationResult[];
  activeSinsals: SinsalCalculationResult[];
  allResults: SinsalCalculationResult[];
  riskSignals: SalSignalItem[];
  supportSignals: SalSignalItem[];
  changeSignals: SalSignalItem[];
  relationInteractions: RelationInteraction[];
  eventConnection: EventConnectionResult;
  maImpactSummary: Record<string, MaImpactSummary>;
  prescriptionAdvice: {
    corePrescription: string;
    actionGuidelines: string[];
    cautionGuidelines: string[];
    remedyPrinciple: string;
  };
}
