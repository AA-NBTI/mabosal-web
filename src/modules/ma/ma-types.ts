/**
 * 21개 마(Ma) 모듈 타입 정의
 * 
 * 원칙:
 * 1. 각 마는 0~100 연속 부동소수점 점수를 유지합니다.
 * 2. 5대 축(Intensity, Pressure, Opportunity, Volatility, Mitigation)을 독립 보존합니다.
 * 3. 21번은 확장 슬롯으로 향후 신규 마 추가 시 기존 마 계산값에 영향을 주지 않습니다.
 * 
 * Phase 5 아키텍처:
 * - Fact → Signal → Interpretation 3단계 계층 분리
 * - Qualitative 5-Axis (LOW / MODERATE / HIGH / VERY_HIGH)
 * - ActivationState (DORMANT / TRIGGERED / ACTIVE / DOMINANT / OVERBURDENED)
 * - EvidenceLevel (CONFIRMED / DERIVED / PROVISIONAL)
 * - RuleCertainty (CONFIRMED / PHASE5_CONFIRMED / PROVISIONAL / OPEN)
 * - SpouseFactLayer (성별 비의존적 배우자성 팩트 레이어)
 */

import { EarthlyBranch, FiveElement, FourPillars, HeavenlyStem, ModuleMetadata, Score5Axis, TenGod, TimeDependencyInfo } from '../../core/types.js';
import { BranchClashMatch } from '../relationship/branch-clash.js';
import { MinorRelationMatch } from '../relationship/branch-harm-destruction.js';
import { BranchHarmonyMatch } from '../relationship/branch-harmony.js';
import { BranchPunishmentMatch } from '../relationship/branch-punishment.js';
import { InteractionDetail } from '../relationship/relationship-engine.js';
import { StemRelationMatch } from '../relationship/stem-relationship.js';
import { FiveElementsAnalysis } from '../saju-core/five-elements.js';
import { EmergenceInfo, StemRootingInfo } from '../saju-core/rooting-emergence.js';
import { PillarTenGods, SajuCoreOutput } from '../saju-core/saju-core-engine.js';
import { DayMasterStrengthResult } from '../saju-core/strength-engine.js';
import { SignalOutput } from '../signal/signal-engine.js';

export type StandardMaId =
  | 'ma_wealth'      // 1. 재물마
  | 'ma_business'    // 2. 사업마
  | 'ma_career'      // 3. 직장마
  | 'ma_asset'       // 4. 자산마
  | 'ma_social'      // 5. 인마
  | 'ma_romance'     // 6. 연애마
  | 'ma_marriage'    // 7. 결혼마
  | 'ma_family'      // 8. 가족마
  | 'ma_children'    // 9. 자녀마
  | 'ma_parents'     // 10. 부모마
  | 'ma_health'      // 11. 건강마
  | 'ma_accident'    // 12. 사고마
  | 'ma_gossip'      // 13. 구설마
  | 'ma_document'    // 14. 문서마
  | 'ma_legal'       // 15. 재판마
  | 'ma_movement'    // 16. 이동마
  | 'ma_exam'        // 17. 시험마
  | 'ma_fame'        // 18. 명예마
  | 'ma_noble'       // 19. 귀인마
  | 'ma_home';       // 20. 집마

export type MaId = StandardMaId | string; // 21번 확장 슬롯 포함

export type MaCategory = 'CORE' | 'DERIVED' | 'OPTIONAL';

export type ActivationState =
  | 'DORMANT'       // 잠복 / 비활성
  | 'TRIGGERED'     // 촉발 / 감응
  | 'ACTIVE'        // 정상 활성
  | 'DOMINANT'      // 국면 주도 (단순 점수 1위가 아님)
  | 'OVERBURDENED'; // 과부하 / 과열

export type QualitativeLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

export interface Qualitative5Axis {
  intensity: QualitativeLevel;   // 기운의 본질적 세력 강도
  pressure: QualitativeLevel;    // 구조적 압박 및 부담도
  opportunity: QualitativeLevel; // 성취 및 활용 기회도
  volatility: QualitativeLevel;  // 변동 및 불안정성
  mitigation: QualitativeLevel;  // 완충 및 보호도
}

export type EvidenceLevel = 'CONFIRMED' | 'DERIVED' | 'PROVISIONAL';

export type RuleCertainty = 'CONFIRMED' | 'PHASE5_CONFIRMED' | 'PROVISIONAL' | 'OPEN';

/**
 * 성별 비의존적 배우자성 팩트 레이어 (SpouseFactLayer)
 * Ma Engine은 성별(gender)을 직접 조회하지 않고 오직 이 레이어만을 소비합니다.
 */
export interface SpouseFactLayer {
  spousePalaceBranch: EarthlyBranch;          // 일지 (배우자궁)
  spousePalaceElement: FiveElement;
  palaceClashes: BranchClashMatch[];          // 배우자궁 피충 목록
  palaceHarmonies: BranchHarmonyMatch[];      // 배우자궁 합 안착 목록
  isPalaceIntact: boolean;                    // 배우자궁 피충/훼손 없음 여부
  primarySpouseStar: TenGod;                  // 프로필에서 도출된 제1 배우자성 (예: 정재 또는 정관)
  secondarySpouseStar: TenGod;                // 프로필에서 도출된 제2 배우자성 (예: 편재 또는 편관)
  primaryStarEmergence: boolean;              // 원국 천간 투간 여부
  primaryStarRooted: boolean;                 // 원국 지지 통근 여부
  primaryStarRootingScore: number;
}

/**
 * Phase 1~4 Fact를 결합한 Ma Module의 표준 입력 스키마
 * (성별 gender 속성은 포함되지 않음)
 */
export interface MaModuleInputFact {
  four_pillars: FourPillars;
  day_stem: HeavenlyStem;
  day_element: FiveElement;
  five_elements: FiveElementsAnalysis;
  ten_gods: SajuCoreOutput['ten_gods'];
  day_master_strength: DayMasterStrengthResult;
  rootings: SajuCoreOutput['rootings'];
  emergences: EmergenceInfo[];
  palaces?: SajuCoreOutput['palaces'];
  flow_channels?: SajuCoreOutput['flow_channels'];
  stem_relations: StemRelationMatch[];
  branch_harmonies: BranchHarmonyMatch[];
  branch_clashes: BranchClashMatch[];
  branch_punishments: BranchPunishmentMatch[];
  minor_relations: MinorRelationMatch[];
  interactions: InteractionDetail[];
  spouse_facts: SpouseFactLayer;
  time_dependency: TimeDependencyInfo;
}

/**
 * Ma 활성화 판정 결과 스키마
 */
export interface MaActivationEvaluation {
  state: ActivationState;
  isActivated: boolean;          // state !== 'DORMANT'
  primaryCauses: string[];       // 핵심 성립 근거
  inhibitingFactors: string[];   // 억제 및 방해 요인
  mitigatingFactors: string[];   // 완충 요인
  certainty: RuleCertainty;
}

/**
 * Phase 5 최종 Ma Signal Entity
 */
export interface MaSignalEntity {
  moduleId: MaId;
  koreanName: string;
  category: MaCategory;
  order: number;
  activation: MaActivationEvaluation;
  qualitativeAxis: Qualitative5Axis;
  referencedFacts: {
    tenGods: TenGod[];
    pillarsInvolved: ('year' | 'month' | 'day' | 'hour')[];
    relationshipsUsed: string[];
  };
  safetyGuideline?: {
    isRestrictedTopic: boolean;
    cautionType: 'HEALTH_EQUILIBRIUM' | 'ACCIDENT_TENSION' | 'LEGAL_DISPUTE';
    contextNote: string;
  };
  timeDependency: TimeDependencyInfo;
}

/**
 * Ma Signal 간 상호작용 기록 규격
 */
export interface SignalInteractionRecord {
  sourceModuleId: MaId;
  targetModuleId: MaId;
  interactionType: 'AMPLIFIED' | 'MITIGATED' | 'CONFLICTING' | 'DRAINED';
  evidenceLevel: EvidenceLevel;
  description: string;
  affectedAxis: 'pressure' | 'opportunity' | 'volatility' | 'mitigation';
}

/**
 * Fact -> Signal 추적성(Traceability) 정보
 */
export interface SignalTraceInfo {
  moduleId: MaId;
  ruleCertainty: RuleCertainty;
  pillarsInvolved: ('year' | 'month' | 'day' | 'hour')[];
  tenGods: TenGod[];
  relationshipsUsed: string[];
  hasSpouseFactLayer: boolean;
  isProvisional: boolean;
}

/**
 * 21개 Ma 통합 SignalSet (Phase 5 STEP 3)
 */
export interface MaSignalSet {
  signals: Record<string, MaSignalEntity>;
  dominantSignals: MaSignalEntity[];
  activeSignals: MaSignalEntity[];
  overburdenedSignals: MaSignalEntity[];
  triggeredSignals: MaSignalEntity[];
  dormantSignals: MaSignalEntity[];
  interactions: SignalInteractionRecord[];
  traceability: Record<string, SignalTraceInfo>;
  safetyAlerts: {
    moduleId: MaId;
    cautionType: 'HEALTH_EQUILIBRIUM' | 'ACCIDENT_TENSION' | 'LEGAL_DISPUTE';
    contextNote: string;
  }[];
  provisionalSignals: MaSignalEntity[];
  confirmedCount: number;
  phase5ConfirmedCount: number;
  provisionalCount: number;
  openCount: number;
}

// ==========================================
// [기존 v1.0 하위 호환성 타입 보존]
// ==========================================
export interface MaResult {
  ma_id: MaId;
  korean_name: string;
  order: number; // 1 ~ 21
  score_5axis: Score5Axis; // 내부 5대 축 (모두 0~100 연속값)
  presentation_score: number; // 출력용 종합 점수 (0~100 연속값, 반올림은 UI 단계에서만)
  presentation_band: string;  // 10점 단위 판정 라벨 (예: "70점대 - 강한 편")
  breakdown: Record<string, number>; // 산식별 세부 항목 점수
  notes: string[];
  safety_warnings?: string[]; // 건강/사고/재판 안전 문구
}

export interface MaModuleContext {
  signals: SignalOutput;
  targetDateStr?: string;
}

export interface IMaModule {
  readonly maId: MaId;
  readonly koreanName: string;
  readonly order: number;
  calculate(context: MaModuleContext): MaResult;
}

