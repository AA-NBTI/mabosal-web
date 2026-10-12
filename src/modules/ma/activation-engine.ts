/**
 * Ma Activation Engine (Phase 5 STEP 2)
 * 
 * 21개 Ma 모듈의 독립적 활성화(Activation) 상태 및 5대 질적 축(Qualitative5Axis) 평가 엔진
 * 
 * 원칙:
 * 1. 21개 Ma별 고유 DOMINANT 조건 독립 판정 (공통 DOMINANT 공식 금지)
 * 2. 5대 상태 엄격 구분: DORMANT, TRIGGERED, ACTIVE, DOMINANT, OVERBURDENED
 * 3. 5대 질적 축(intensity, pressure, opportunity, volatility, mitigation) 독립 보존 (축 간 상쇄 금지)
 * 4. RuleCertainty(CONFIRMED, PHASE5_CONFIRMED, PROVISIONAL, OPEN) 부여 및 PROVISIONAL 핵심 판정 차단
 * 5. Zero-Gender Leakage: 결혼마, 연애마는 오직 SpouseFactLayer만 소비
 */

import { BRANCH_INFO, STEM_INFO } from '../../core/constants.js';
import { EarthlyBranch, FiveElement, HeavenlyStem, TenGod } from '../../core/types.js';
import { MaFactAdapter } from './fact-adapter.js';
import {
  createDefaultActivationEvaluation,
  createDefaultQualitative5Axis,
  createMaSignalEntity,
  STANDARD_MA_DEFINITIONS,
} from './ma-signal-schema.js';
import {
  ActivationState,
  MaActivationEvaluation,
  MaCategory,
  MaModuleInputFact,
  MaSignalEntity,
  Qualitative5Axis,
  QualitativeLevel,
  RuleCertainty,
  StandardMaId,
} from './ma-types.js';

export interface MaEvaluator {
  readonly moduleId: StandardMaId | string;
  evaluate(fact: MaModuleInputFact): MaSignalEntity;
}

// ----------------------------------------------------
// 도우미 유틸리티: 팩트 조회 및 명리 판정 함수들
// ----------------------------------------------------

/** 사주 내에 특정 십신이 천간에 투간되어 있는지 확인 */
function hasStemTenGod(fact: MaModuleInputFact, tenGods: TenGod[]): boolean {
  const tg = fact.ten_gods;
  const stems = [tg.year.stemTenGod, tg.month.stemTenGod];
  if (tg.hour) stems.push(tg.hour.stemTenGod);
  return tenGods.some(t => stems.includes(t));
}

/** 사주 내에 특정 십신이 지지 본기로 존재하는지 확인 */
function hasBranchMainTenGod(fact: MaModuleInputFact, tenGods: TenGod[]): boolean {
  const tg = fact.ten_gods;
  const branches = [tg.year.branchMainTenGod, tg.month.branchMainTenGod, tg.day.branchMainTenGod];
  if (tg.hour) branches.push(tg.hour.branchMainTenGod);
  return tenGods.some(t => branches.includes(t));
}

/** 월지(월령) 본기 십신이 특정 십신인지 확인 (격국 성립 핵심) */
function isMonthBranchTenGod(fact: MaModuleInputFact, tenGods: TenGod[]): boolean {
  return tenGods.includes(fact.ten_gods.month.branchMainTenGod);
}

/** 특정 십신의 천간 통근 여부 확인 */
function isTenGodRooted(fact: MaModuleInputFact, target: TenGod): boolean {
  const tg = fact.ten_gods;
  const roots = fact.rootings;
  if (tg.year.stemTenGod === target && roots.yearStem.rootingScore > 0) return true;
  if (tg.month.stemTenGod === target && roots.monthStem.rootingScore > 0) return true;
  if (tg.hour && roots.hourStem && tg.hour.stemTenGod === target && roots.hourStem.rootingScore > 0) return true;
  return false;
}

/** 사생지(인, 신, 사, 해) 역마 지지 개수 */
function countSasaengBranches(fact: MaModuleInputFact): number {
  const sasaeng: EarthlyBranch[] = ['인', '신', '사', '해'];
  const fp = fact.four_pillars;
  let count = 0;
  if (sasaeng.includes(fp.year.branch)) count++;
  if (sasaeng.includes(fp.month.branch)) count++;
  if (sasaeng.includes(fp.day.branch)) count++;
  if (fp.hour && sasaeng.includes(fp.hour.branch)) count++;
  return count;
}

/** 사묘고지(진, 술, 축, 미) 토 지지 개수 */
function countSamyoBranches(fact: MaModuleInputFact): number {
  const samyo: EarthlyBranch[] = ['진', '술', '축', '미'];
  const fp = fact.four_pillars;
  let count = 0;
  if (samyo.includes(fp.year.branch)) count++;
  if (samyo.includes(fp.month.branch)) count++;
  if (samyo.includes(fp.day.branch)) count++;
  if (fp.hour && samyo.includes(fp.hour.branch)) count++;
  return count;
}

/** 도화 지지(자, 오, 묘, 유) 개수 */
function countDohwaBranches(fact: MaModuleInputFact): number {
  const dohwa: EarthlyBranch[] = ['자', '오', '묘', '유'];
  const fp = fact.four_pillars;
  let count = 0;
  if (dohwa.includes(fp.year.branch)) count++;
  if (dohwa.includes(fp.month.branch)) count++;
  if (dohwa.includes(fp.day.branch)) count++;
  if (fp.hour && dohwa.includes(fp.hour.branch)) count++;
  return count;
}

/** 천을귀인 지지 보유 여부 (일간 기준 고전 천을귀인 지지) */
function hasCheonEulGuiIn(fact: MaModuleInputFact): boolean {
  const dayStem = fact.day_stem;
  const nobleBranchesMap: Record<HeavenlyStem, EarthlyBranch[]> = {
    갑: ['축', '미'],
    을: ['자', '신'],
    병: ['해', '유'],
    정: ['해', '유'],
    무: ['축', '미'],
    기: ['자', '신'],
    경: ['축', '미'],
    신: ['인', '오'],
    임: ['사', '묘'],
    계: ['사', '묘'],
  };
  const targets = nobleBranchesMap[dayStem] ?? [];
  const fp = fact.four_pillars;
  return (
    targets.includes(fp.year.branch) ||
    targets.includes(fp.month.branch) ||
    targets.includes(fp.day.branch) ||
    (fp.hour !== null && targets.includes(fp.hour.branch))
  );
}

// ----------------------------------------------------
// 21개 개별 Ma Evaluator 구현
// ----------------------------------------------------

// 1. 재물마 (ma_wealth) - CORE
export class WealthMaEvaluator implements MaEvaluator {
  public readonly moduleId: StandardMaId = 'ma_wealth';

  public evaluate(fact: MaModuleInputFact): MaSignalEntity {
    const isJaeGyeok = isMonthBranchTenGod(fact, ['정재', '편재']);
    const hasJaeStem = hasStemTenGod(fact, ['정재', '편재']);
    const hasSikSang = hasStemTenGod(fact, ['식신', '상관']) || hasBranchMainTenGod(fact, ['식신', '상관']);
    const hasBiGeopCluster = fact.flow_channels ? fact.flow_channels.bi_geop_bunsan > 60 : false;
    const isDayRooted = fact.day_master_strength.isDeukJi || fact.rootings.dayStem.rootingScore > 30;
    const isExtremeWeak = fact.day_master_strength.classification === '극약';

    let state: ActivationState = 'DORMANT';
    const primaryCauses: string[] = [];
    const inhibitingFactors: string[] = [];
    const mitigatingFactors: string[] = [];

    // DOMINANT 조건: 재격 형성 + 식상생재 유통 + 일간 유근 + 군겁쟁재 부존재
    if (isJaeGyeok && hasSikSang && isDayRooted && !hasBiGeopCluster && !isExtremeWeak) {
      state = 'DOMINANT';
      primaryCauses.push('월지 재격 형성', '식상생재 유통', '일간 유근 감당력 확보');
    } else if (hasJaeStem && hasBiGeopCluster && isExtremeWeak) {
      state = 'OVERBURDENED';
      primaryCauses.push('재성 태과 및 군겁쟁재 압력 심화', '일간 극약으로 인한 재다신약 과열');
    } else if (isJaeGyeok || hasJaeStem) {
      state = 'ACTIVE';
      primaryCauses.push('재성 기운 원국 안착 및 투간');
      if (hasBiGeopCluster) inhibitingFactors.push('비겁 분산 압력 존재');
    } else if (hasBranchMainTenGod(fact, ['정재', '편재'])) {
      state = 'TRIGGERED';
      primaryCauses.push('지지 재성 암장 및 잠재 반응');
    }

    const qualitativeAxis: Qualitative5Axis = {
      intensity: isJaeGyeok && hasJaeStem ? 'VERY_HIGH' : isJaeGyeok || hasJaeStem ? 'HIGH' : 'MODERATE',
      pressure: isExtremeWeak || hasBiGeopCluster ? 'HIGH' : 'LOW',
      opportunity: hasSikSang ? 'HIGH' : 'MODERATE',
      volatility: fact.branch_clashes.length > 0 ? 'HIGH' : 'LOW',
      mitigation: hasSikSang && isDayRooted ? 'HIGH' : 'MODERATE',
    };

    const activation: MaActivationEvaluation = {
      state,
      isActivated: state !== 'DORMANT',
      primaryCauses,
      inhibitingFactors,
      mitigatingFactors,
      certainty: 'PHASE5_CONFIRMED',
    };

    return createMaSignalEntity({
      moduleId: this.moduleId,
      activation: MaFactAdapter.validateActivationEvaluation(activation),
      qualitativeAxis,
      referencedFacts: {
        tenGods: ['정재', '편재'],
        pillarsInvolved: ['month', 'day'],
        relationshipsUsed: ['식상생재', '군겁쟁재'],
      },
      timeDependency: fact.time_dependency,
    });
  }
}

// 2. 직장마 (ma_career) - CORE
export class CareerMaEvaluator implements MaEvaluator {
  public readonly moduleId: StandardMaId = 'ma_career';

  public evaluate(fact: MaModuleInputFact): MaSignalEntity {
    const isGwanGyeok = isMonthBranchTenGod(fact, ['정관', '편관']);
    const hasGwanStem = hasStemTenGod(fact, ['정관', '편관']);
    const hasInSeong = hasStemTenGod(fact, ['정인', '편인']) || hasBranchMainTenGod(fact, ['정인', '편인']);
    const hasSangGwan = hasStemTenGod(fact, ['상관']);
    const isSangGwanGyeonGwan = hasGwanStem && hasSangGwan && !hasInSeong;

    let state: ActivationState = 'DORMANT';
    const primaryCauses: string[] = [];
    const inhibitingFactors: string[] = [];

    // DOMINANT 조건: 관성격 청기 + 관인상생 또는 식신제살 유통 + 상관견관 부존재
    if ((isGwanGyeok || hasGwanStem) && hasInSeong && !isSangGwanGyeonGwan) {
      state = 'DOMINANT';
      primaryCauses.push('관성격 청기 및 관인상생 유통', '상관견관 장애 부존재');
    } else if (isSangGwanGyeonGwan && fact.day_master_strength.classification === '극약') {
      state = 'OVERBURDENED';
      primaryCauses.push('상관견관 무제 및 관살 과열로 조직 저항 극대화');
    } else if (isGwanGyeok || hasGwanStem) {
      state = 'ACTIVE';
      primaryCauses.push('관성 기운 원국 장악');
      if (isSangGwanGyeonGwan) inhibitingFactors.push('상관견관 충돌 발생');
    } else if (hasBranchMainTenGod(fact, ['정관', '편관'])) {
      state = 'TRIGGERED';
      primaryCauses.push('지지 관성 잠재 감응');
    }

    const qualitativeAxis: Qualitative5Axis = {
      intensity: isGwanGyeok ? 'HIGH' : hasGwanStem ? 'MODERATE' : 'LOW',
      pressure: isSangGwanGyeonGwan ? 'VERY_HIGH' : 'LOW',
      opportunity: hasInSeong ? 'HIGH' : 'MODERATE',
      volatility: isSangGwanGyeonGwan ? 'HIGH' : 'LOW',
      mitigation: hasInSeong ? 'HIGH' : 'LOW',
    };

    const activation: MaActivationEvaluation = {
      state,
      isActivated: state !== 'DORMANT',
      primaryCauses,
      inhibitingFactors,
      mitigatingFactors: [],
      certainty: 'PHASE5_CONFIRMED',
    };

    return createMaSignalEntity({
      moduleId: this.moduleId,
      activation: MaFactAdapter.validateActivationEvaluation(activation),
      qualitativeAxis,
      referencedFacts: {
        tenGods: ['정관', '편관', '정인'],
        pillarsInvolved: ['month', 'year'],
        relationshipsUsed: ['관인상생', '상관견관'],
      },
      timeDependency: fact.time_dependency,
    });
  }
}

// 3. 인마 (ma_social) - CORE
export class SocialMaEvaluator implements MaEvaluator {
  public readonly moduleId: StandardMaId = 'ma_social';

  public evaluate(fact: MaModuleInputFact): MaSignalEntity {
    const isBiGeopMonth = isMonthBranchTenGod(fact, ['비견', '겁재']);
    const hasBiGeopStem = hasStemTenGod(fact, ['겁재']);
    const hasGwanControl = hasStemTenGod(fact, ['정관', '편관']);
    const hasSikSangDrain = hasStemTenGod(fact, ['식신', '상관']);

    let state: ActivationState = 'DORMANT';
    const primaryCauses: string[] = [];

    // DOMINANT 조건: 비겁 월령 장악 + 관성 통어 또는 식상 설기
    if (isBiGeopMonth && (hasGwanControl || hasSikSangDrain)) {
      state = 'DOMINANT';
      primaryCauses.push('건록/양인 월령 장악', hasGwanControl ? '관성 통어 확보' : '식상 유통 설기 확보');
    } else if (isBiGeopMonth && !hasGwanControl && !hasSikSangDrain && hasBiGeopStem) {
      state = 'OVERBURDENED';
      primaryCauses.push('군겁쟁투 무제 상태 과열');
    } else if (isBiGeopMonth || hasBiGeopStem) {
      state = 'ACTIVE';
      primaryCauses.push('비겁 세력 활성');
    } else if (hasBranchMainTenGod(fact, ['비견', '겁재'])) {
      state = 'TRIGGERED';
      primaryCauses.push('동료/경쟁 잠재 감응');
    }

    const qualitativeAxis: Qualitative5Axis = {
      intensity: isBiGeopMonth ? 'VERY_HIGH' : 'MODERATE',
      pressure: !hasGwanControl && hasBiGeopStem ? 'HIGH' : 'LOW',
      opportunity: hasGwanControl || hasSikSangDrain ? 'HIGH' : 'MODERATE',
      volatility: hasBiGeopStem ? 'HIGH' : 'LOW',
      mitigation: hasGwanControl ? 'HIGH' : 'LOW',
    };

    return createMaSignalEntity({
      moduleId: this.moduleId,
      activation: MaFactAdapter.validateActivationEvaluation({
        state,
        isActivated: state !== 'DORMANT',
        primaryCauses,
        inhibitingFactors: [],
        mitigatingFactors: [],
        certainty: 'PHASE5_CONFIRMED',
      }),
      qualitativeAxis,
      referencedFacts: {
        tenGods: ['비견', '겁재'],
        pillarsInvolved: ['month', 'day'],
        relationshipsUsed: ['건록양인', '군겁쟁투'],
      },
      timeDependency: fact.time_dependency,
    });
  }
}

// 4. 결혼마 (ma_marriage) - CORE (Zero-Gender, SpouseFactLayer만 소비)
export class MarriageMaEvaluator implements MaEvaluator {
  public readonly moduleId: StandardMaId = 'ma_marriage';

  public evaluate(fact: MaModuleInputFact): MaSignalEntity {
    const sf = fact.spouse_facts;
    const isPalaceIntact = sf.isPalaceIntact;
    const isHarmonyPresent = sf.palaceHarmonies.length > 0;
    const isPrimaryRooted = sf.primaryStarRooted;
    const isClashed = sf.palaceClashes.length > 0;

    let state: ActivationState = 'DORMANT';
    const primaryCauses: string[] = [];
    const inhibitingFactors: string[] = [];

    // DOMINANT 조건: 일지 합국 안착 + 유효 배우자성 통근 + 일지 피충 전무
    if (isHarmonyPresent && isPrimaryRooted && isPalaceIntact) {
      state = 'DOMINANT';
      primaryCauses.push('일지 합국 안착', `배우자성(${sf.primarySpouseStar}) 통근력 확보`, '일지 무결');
    } else if (isClashed && !isPalaceIntact && sf.palaceClashes.some(c => c.intensity > 80)) {
      state = 'OVERBURDENED';
      primaryCauses.push('배우자궁 정면 충돌 및 긴장 과열');
    } else if (isPrimaryRooted || sf.primaryStarEmergence || isHarmonyPresent) {
      state = 'ACTIVE';
      primaryCauses.push(`배우자성(${sf.primarySpouseStar}) 원국 작용 및 일지 감응`);
      if (isClashed) inhibitingFactors.push('일지 충파 영향');
    } else {
      state = 'TRIGGERED';
      primaryCauses.push('배우자궁 잠재 상태');
    }

    const qualitativeAxis: Qualitative5Axis = {
      intensity: isPrimaryRooted ? 'HIGH' : 'MODERATE',
      pressure: isClashed ? 'VERY_HIGH' : 'LOW',
      opportunity: isHarmonyPresent ? 'HIGH' : 'LOW',
      volatility: isClashed ? 'HIGH' : 'LOW',
      mitigation: isPalaceIntact ? 'HIGH' : 'LOW',
    };

    return createMaSignalEntity({
      moduleId: this.moduleId,
      activation: MaFactAdapter.validateActivationEvaluation({
        state,
        isActivated: (state as ActivationState) !== 'DORMANT',
        primaryCauses,
        inhibitingFactors,
        mitigatingFactors: [],
        certainty: 'PHASE5_CONFIRMED',
      }),
      qualitativeAxis,
      referencedFacts: {
        tenGods: [sf.primarySpouseStar, sf.secondarySpouseStar],
        pillarsInvolved: ['day'],
        relationshipsUsed: ['배우자궁합충'],
      },
      timeDependency: fact.time_dependency,
    });
  }
}

// 5. 문서마 (ma_document) - CORE
export class DocumentMaEvaluator implements MaEvaluator {
  public readonly moduleId: StandardMaId = 'ma_document';

  public evaluate(fact: MaModuleInputFact): MaSignalEntity {
    const isInseongGyeok = isMonthBranchTenGod(fact, ['정인', '편인']);
    const hasInStem = hasStemTenGod(fact, ['정인', '편인']);
    const hasGwan = hasStemTenGod(fact, ['정관', '편관']) || hasBranchMainTenGod(fact, ['정관', '편관']);
    const isJaeGeukIn = hasStemTenGod(fact, ['정재', '편재']) && hasInStem && !hasGwan;

    let state: ActivationState = 'DORMANT';
    const primaryCauses: string[] = [];

    // DOMINANT 조건: 인수격 성립 + 관인상생 유통 + 재극인 무결
    if ((isInseongGyeok || hasInStem) && hasGwan && !isJaeGeukIn) {
      state = 'DOMINANT';
      primaryCauses.push('인수격 성립 및 관인상생 유통', '재극인 훼손 부존재');
    } else if (isJaeGeukIn && fact.day_master_strength.classification === '극약') {
      state = 'OVERBURDENED';
      primaryCauses.push('재극인 파인(破印)으로 인한 문서/자격 위험 과열');
    } else if (isInseongGyeok || hasInStem) {
      state = 'ACTIVE';
      primaryCauses.push('인성 기운 원국 안착');
    } else if (hasBranchMainTenGod(fact, ['정인', '편인'])) {
      state = 'TRIGGERED';
      primaryCauses.push('지지 인성 감응');
    }

    const qualitativeAxis: Qualitative5Axis = {
      intensity: isInseongGyeok ? 'HIGH' : 'MODERATE',
      pressure: isJaeGeukIn ? 'HIGH' : 'LOW',
      opportunity: hasGwan ? 'HIGH' : 'MODERATE',
      volatility: isJaeGeukIn ? 'HIGH' : 'LOW',
      mitigation: hasGwan ? 'HIGH' : 'LOW',
    };

    return createMaSignalEntity({
      moduleId: this.moduleId,
      activation: MaFactAdapter.validateActivationEvaluation({
        state,
        isActivated: state !== 'DORMANT',
        primaryCauses,
        inhibitingFactors: [],
        mitigatingFactors: [],
        certainty: 'PHASE5_CONFIRMED',
      }),
      qualitativeAxis,
      referencedFacts: {
        tenGods: ['정인', '편인'],
        pillarsInvolved: ['month', 'year'],
        relationshipsUsed: ['관인상생', '재극인'],
      },
      timeDependency: fact.time_dependency,
    });
  }
}

// 6. 건강마 (ma_health) - CORE (PROVISIONAL - 안전주의)
export class HealthMaEvaluator implements MaEvaluator {
  public readonly moduleId: StandardMaId = 'ma_health';

  public evaluate(fact: MaModuleInputFact): MaSignalEntity {
    const missing = fact.five_elements.missingElements;
    const hasMissing = missing.length > 0;
    const hasClash = fact.branch_clashes.length > 0;

    let state: ActivationState = 'ACTIVE';
    const primaryCauses: string[] = [];

    // PROVISIONAL 규칙: missing + 상극 대치 동시 발생 시 DOMINANT 시도
    // 단, PROVISIONAL은 MaFactAdapter에서 핵심 DOMINANT 진입 차단되고 TRIGGERED로 제어됨
    if (hasMissing && hasClash) {
      state = 'DOMINANT';
      primaryCauses.push(`오행 결핍(${missing.join(',')}) 및 상극 대치 충돌 공존`);
    } else if (hasMissing || hasClash) {
      state = 'ACTIVE';
      primaryCauses.push('오행 편중 또는 지지 관계 작용');
    }

    const qualitativeAxis: Qualitative5Axis = {
      intensity: hasMissing ? 'HIGH' : 'MODERATE',
      pressure: hasClash ? 'HIGH' : 'LOW',
      opportunity: 'LOW',
      volatility: hasClash ? 'HIGH' : 'LOW',
      mitigation: fact.day_master_strength.isDeukJi ? 'HIGH' : 'MODERATE',
    };

    return createMaSignalEntity({
      moduleId: this.moduleId,
      activation: MaFactAdapter.validateActivationEvaluation({
        state,
        isActivated: true,
        primaryCauses,
        inhibitingFactors: [],
        mitigatingFactors: [],
        certainty: 'PROVISIONAL', // 명세서 확정: PROVISIONAL
      }),
      qualitativeAxis,
      referencedFacts: {
        tenGods: ['비견', '식신'],
        pillarsInvolved: ['day', 'month'],
        relationshipsUsed: ['오행결핍', '지지충돌'],
      },
      timeDependency: fact.time_dependency,
    });
  }
}

// 7. 사고마 (ma_accident) - DERIVED
export class AccidentMaEvaluator implements MaEvaluator {
  public readonly moduleId: StandardMaId = 'ma_accident';

  public evaluate(fact: MaModuleInputFact): MaSignalEntity {
    const sasaengClashes = fact.branch_clashes.filter(c => c.clashCategory === '사생지충/역마충 (인신, 사해)');
    const punishments = fact.branch_punishments;
    const hasPunishment = punishments.length > 0;
    const hasMitigation = fact.branch_clashes.some(c => c.interaction.isMitigated);

    let state: ActivationState = 'DORMANT';
    const primaryCauses: string[] = [];

    // DOMINANT 조건: 사생지 충 또는 완전 삼형 인접 성립 + Phase 4 완충 전무
    if ((sasaengClashes.length > 0 || hasPunishment) && !hasMitigation) {
      state = 'DOMINANT';
      primaryCauses.push('사생지 충/형살 성립 및 완충 장치 부존재');
    } else if (sasaengClashes.length > 1 && !hasMitigation) {
      state = 'OVERBURDENED';
      primaryCauses.push('다중 사생지 충돌 과열');
    } else if (sasaengClashes.length > 0 || hasPunishment) {
      state = 'ACTIVE';
      primaryCauses.push('충형 관계 작용 (완충 요인 고려)');
    } else if (fact.branch_clashes.length > 0) {
      state = 'TRIGGERED';
      primaryCauses.push('일반 지지 충돌 감응');
    }

    const qualitativeAxis: Qualitative5Axis = {
      intensity: sasaengClashes.length > 0 ? 'VERY_HIGH' : 'MODERATE',
      pressure: sasaengClashes.length > 0 ? 'VERY_HIGH' : 'LOW',
      opportunity: 'LOW',
      volatility: sasaengClashes.length > 0 ? 'VERY_HIGH' : 'LOW',
      mitigation: hasMitigation ? 'HIGH' : 'LOW',
    };

    return createMaSignalEntity({
      moduleId: this.moduleId,
      activation: MaFactAdapter.validateActivationEvaluation({
        state,
        isActivated: state !== 'DORMANT',
        primaryCauses,
        inhibitingFactors: [],
        mitigatingFactors: [],
        certainty: 'PHASE5_CONFIRMED',
      }),
      qualitativeAxis,
      referencedFacts: {
        tenGods: ['편관', '상관'],
        pillarsInvolved: ['year', 'month', 'day'],
        relationshipsUsed: ['사생지충', '삼형살'],
      },
      timeDependency: fact.time_dependency,
    });
  }
}

// 8. 사업마 (ma_business) - CORE
export class BusinessMaEvaluator implements MaEvaluator {
  public readonly moduleId: StandardMaId = 'ma_business';

  public evaluate(fact: MaModuleInputFact): MaSignalEntity {
    const hasSikSangRoot = isTenGodRooted(fact, '식신') || isTenGodRooted(fact, '상관');
    const hasPyeonJaeStem = hasStemTenGod(fact, ['편재']);
    const hasPyeonGwan = hasStemTenGod(fact, ['편관']) || hasBranchMainTenGod(fact, ['편관']);

    let state: ActivationState = 'DORMANT';
    const primaryCauses: string[] = [];

    // DOMINANT 조건: 식상생재격 완성 + 편재 투출 + 편관 결단력 결합
    if (hasSikSangRoot && hasPyeonJaeStem && hasPyeonGwan) {
      state = 'DOMINANT';
      primaryCauses.push('식상 유효 통근 및 편재 투출', '편관의 모험/결단력 결합');
    } else if (hasPyeonJaeStem || hasSikSangRoot) {
      state = 'ACTIVE';
      primaryCauses.push('사업적 실행력 및 편재 기운 활성');
    } else if (hasBranchMainTenGod(fact, ['편재', '식신', '상관'])) {
      state = 'TRIGGERED';
      primaryCauses.push('사업/생재 잠재 감응');
    }

    const qualitativeAxis: Qualitative5Axis = {
      intensity: hasPyeonJaeStem ? 'HIGH' : 'MODERATE',
      pressure: hasPyeonGwan ? 'HIGH' : 'LOW',
      opportunity: hasSikSangRoot ? 'VERY_HIGH' : 'MODERATE',
      volatility: hasPyeonGwan ? 'HIGH' : 'LOW',
      mitigation: hasSikSangRoot ? 'HIGH' : 'LOW',
    };

    return createMaSignalEntity({
      moduleId: this.moduleId,
      activation: MaFactAdapter.validateActivationEvaluation({
        state,
        isActivated: state !== 'DORMANT',
        primaryCauses,
        inhibitingFactors: [],
        mitigatingFactors: [],
        certainty: 'PHASE5_CONFIRMED',
      }),
      qualitativeAxis,
      referencedFacts: {
        tenGods: ['편재', '식신', '상관', '편관'],
        pillarsInvolved: ['month', 'day'],
        relationshipsUsed: ['식상생재', '편관결단'],
      },
      timeDependency: fact.time_dependency,
    });
  }
}

// 9. 자산마 (ma_asset) - CORE (PROVISIONAL)
export class AssetMaEvaluator implements MaEvaluator {
  public readonly moduleId: StandardMaId = 'ma_asset';

  public evaluate(fact: MaModuleInputFact): MaSignalEntity {
    const samyoCount = countSamyoBranches(fact);
    const hasInSeong = hasStemTenGod(fact, ['정인', '편인']) || hasBranchMainTenGod(fact, ['정인', '편인']);
    const hasClash = fact.branch_clashes.some(c => c.clashCategory === '사묘지충/붕충 (진술, 축미)');

    let state: ActivationState = 'DORMANT';
    const primaryCauses: string[] = [];

    // DOMINANT 조건 (PROVISIONAL): 토(土) 사묘고지 통근 + 정인 결합 + 충파 없는 창고 안착
    if (samyoCount >= 2 && hasInSeong && !hasClash) {
      state = 'DOMINANT';
      primaryCauses.push('토 사묘고지 안착', '인성 문서 결합', '창고 무결');
    } else if (samyoCount > 0 || hasInSeong) {
      state = 'ACTIVE';
      primaryCauses.push('자산 기반 토/인성 성분 보유');
    }

    const qualitativeAxis: Qualitative5Axis = {
      intensity: samyoCount >= 2 ? 'HIGH' : 'MODERATE',
      pressure: hasClash ? 'HIGH' : 'LOW',
      opportunity: hasInSeong ? 'HIGH' : 'LOW',
      volatility: hasClash ? 'HIGH' : 'LOW',
      mitigation: !hasClash ? 'HIGH' : 'LOW',
    };

    return createMaSignalEntity({
      moduleId: this.moduleId,
      activation: MaFactAdapter.validateActivationEvaluation({
        state,
        isActivated: state !== 'DORMANT',
        primaryCauses,
        inhibitingFactors: [],
        mitigatingFactors: [],
        certainty: 'PROVISIONAL',
      }),
      qualitativeAxis,
      referencedFacts: {
        tenGods: ['정재', '정인', '편인'],
        pillarsInvolved: ['year', 'month', 'day'],
        relationshipsUsed: ['사묘고지', '인성문서'],
      },
      timeDependency: fact.time_dependency,
    });
  }
}

// 10. 명예마 (ma_fame) - CORE (PROVISIONAL)
export class FameMaEvaluator implements MaEvaluator {
  public readonly moduleId: StandardMaId = 'ma_fame';

  public evaluate(fact: MaModuleInputFact): MaSignalEntity {
    const hasGwan = hasStemTenGod(fact, ['정관']);
    const hasFire = fact.five_elements.distribution.화.count > 0;
    const hasIn = hasStemTenGod(fact, ['정인']);

    let state: ActivationState = 'DORMANT';
    const primaryCauses: string[] = [];

    // DOMINANT 조건 (PROVISIONAL): 정관 청기 + 화(火) 오행 투출 + 정인 인정
    if (hasGwan && hasFire && hasIn) {
      state = 'DOMINANT';
      primaryCauses.push('정관 청기', '화(火) 오행 발양', '정인 공인');
    } else if (hasGwan || hasIn) {
      state = 'ACTIVE';
      primaryCauses.push('사회적 인정 및 명예 기운 작용');
    }

    const qualitativeAxis: Qualitative5Axis = {
      intensity: hasGwan && hasFire ? 'HIGH' : 'MODERATE',
      pressure: 'LOW',
      opportunity: hasGwan ? 'HIGH' : 'MODERATE',
      volatility: 'LOW',
      mitigation: hasIn ? 'HIGH' : 'LOW',
    };

    return createMaSignalEntity({
      moduleId: this.moduleId,
      activation: MaFactAdapter.validateActivationEvaluation({
        state,
        isActivated: state !== 'DORMANT',
        primaryCauses,
        inhibitingFactors: [],
        mitigatingFactors: [],
        certainty: 'PROVISIONAL',
      }),
      qualitativeAxis,
      referencedFacts: {
        tenGods: ['정관', '정인'],
        pillarsInvolved: ['month', 'year'],
        relationshipsUsed: ['정관청기', '화오행발양'],
      },
      timeDependency: fact.time_dependency,
    });
  }
}

// 11. 가족마 (ma_family) - DERIVED
export class FamilyMaEvaluator implements MaEvaluator {
  public readonly moduleId: StandardMaId = 'ma_family';

  public evaluate(fact: MaModuleInputFact): MaSignalEntity {
    const hasIn = hasStemTenGod(fact, ['정인']) || hasBranchMainTenGod(fact, ['정인']);
    const hasBi = hasStemTenGod(fact, ['비견']) || hasBranchMainTenGod(fact, ['비견']);
    const isYearMonthClash = fact.branch_clashes.some(c => c.positions.includes('year') && c.positions.includes('month'));

    let state: ActivationState = 'DORMANT';
    const primaryCauses: string[] = [];

    // DOMINANT 조건: 연월주 천간지지 상생 + 인성·비겁 건전 + 궁위 충돌 전무
    if (hasIn && hasBi && !isYearMonthClash) {
      state = 'DOMINANT';
      primaryCauses.push('연월 상생 화합', '인성/비겁 건전', '가문 궁위 무결');
    } else if (isYearMonthClash) {
      state = 'OVERBURDENED';
      primaryCauses.push('연월 궁위 정면 충돌로 인한 가문 불안정');
    } else if (hasIn || hasBi) {
      state = 'ACTIVE';
      primaryCauses.push('가족적 연대감 유지');
    }

    const qualitativeAxis: Qualitative5Axis = {
      intensity: hasIn && hasBi ? 'HIGH' : 'MODERATE',
      pressure: isYearMonthClash ? 'VERY_HIGH' : 'LOW',
      opportunity: hasIn ? 'HIGH' : 'LOW',
      volatility: isYearMonthClash ? 'HIGH' : 'LOW',
      mitigation: !isYearMonthClash ? 'HIGH' : 'LOW',
    };

    return createMaSignalEntity({
      moduleId: this.moduleId,
      activation: MaFactAdapter.validateActivationEvaluation({
        state,
        isActivated: state !== 'DORMANT',
        primaryCauses,
        inhibitingFactors: [],
        mitigatingFactors: [],
        certainty: 'PHASE5_CONFIRMED',
      }),
      qualitativeAxis,
      referencedFacts: {
        tenGods: ['정인', '비견'],
        pillarsInvolved: ['year', 'month'],
        relationshipsUsed: ['연월궁위상생'],
      },
      timeDependency: fact.time_dependency,
    });
  }
}

// 12. 자녀마 (ma_children) - DERIVED
export class ChildrenMaEvaluator implements MaEvaluator {
  public readonly moduleId: StandardMaId = 'ma_children';

  public evaluate(fact: MaModuleInputFact): MaSignalEntity {
    const hasHour = fact.four_pillars.hour !== null;
    const isHourClashed = fact.branch_clashes.some(c => c.positions.includes('hour'));
    const hasSikSang = hasStemTenGod(fact, ['식신', '상관']) || hasBranchMainTenGod(fact, ['식신', '상관']);

    let state: ActivationState = 'DORMANT';
    const primaryCauses: string[] = [];

    // DOMINANT 조건: 시주 자녀성 득령/통근 + 시지 일지 화합 + 시주 피충 전무
    if (hasHour && hasSikSang && !isHourClashed) {
      state = 'DOMINANT';
      primaryCauses.push('시주 자녀궁 무결 및 자녀성(식상) 건전');
    } else if (hasHour && isHourClashed) {
      state = 'ACTIVE';
      primaryCauses.push('시주 감응 (단, 시주 충돌 존재)');
    } else if (hasSikSang) {
      state = 'TRIGGERED';
      primaryCauses.push('자녀성 잠재 감응');
    }

    const qualitativeAxis: Qualitative5Axis = {
      intensity: hasSikSang ? 'HIGH' : 'MODERATE',
      pressure: isHourClashed ? 'HIGH' : 'LOW',
      opportunity: hasHour && !isHourClashed ? 'HIGH' : 'LOW',
      volatility: isHourClashed ? 'HIGH' : 'LOW',
      mitigation: !isHourClashed ? 'HIGH' : 'LOW',
    };

    return createMaSignalEntity({
      moduleId: this.moduleId,
      activation: MaFactAdapter.validateActivationEvaluation({
        state,
        isActivated: state !== 'DORMANT',
        primaryCauses,
        inhibitingFactors: [],
        mitigatingFactors: [],
        certainty: 'PHASE5_CONFIRMED',
      }),
      qualitativeAxis,
      referencedFacts: {
        tenGods: ['식신', '상관'],
        pillarsInvolved: ['hour', 'day'],
        relationshipsUsed: ['시주자녀궁'],
      },
      timeDependency: fact.time_dependency,
    });
  }
}

// 13. 부모마 (ma_parents) - DERIVED
export class ParentsMaEvaluator implements MaEvaluator {
  public readonly moduleId: StandardMaId = 'ma_parents';

  public evaluate(fact: MaModuleInputFact): MaSignalEntity {
    const isInMonth = isMonthBranchTenGod(fact, ['정인', '편인']);
    const hasGwanHelp = hasStemTenGod(fact, ['정관', '편관']);
    const isJaeGeukIn = hasStemTenGod(fact, ['정재', '편재']) && !hasGwanHelp && isInMonth;

    let state: ActivationState = 'DORMANT';
    const primaryCauses: string[] = [];

    // DOMINANT 조건: 연월 부모성 득령 + 관성 생조 + 재극인 무결
    if (isInMonth && hasGwanHelp && !isJaeGeukIn) {
      state = 'DOMINANT';
      primaryCauses.push('월령 부모성 득령', '관성 생조 보호', '재극인 훼손 부존재');
    } else if (isInMonth || hasStemTenGod(fact, ['정인', '편인'])) {
      state = 'ACTIVE';
      primaryCauses.push('부모성 기운 안착');
    } else {
      state = 'TRIGGERED';
      primaryCauses.push('부모궁 잠재 감응');
    }

    const qualitativeAxis: Qualitative5Axis = {
      intensity: isInMonth ? 'HIGH' : 'MODERATE',
      pressure: isJaeGeukIn ? 'HIGH' : 'LOW',
      opportunity: hasGwanHelp ? 'HIGH' : 'LOW',
      volatility: isJaeGeukIn ? 'HIGH' : 'LOW',
      mitigation: hasGwanHelp ? 'HIGH' : 'LOW',
    };

    return createMaSignalEntity({
      moduleId: this.moduleId,
      activation: MaFactAdapter.validateActivationEvaluation({
        state,
        isActivated: (state as ActivationState) !== 'DORMANT',
        primaryCauses,
        inhibitingFactors: [],
        mitigatingFactors: [],
        certainty: 'PHASE5_CONFIRMED',
      }),
      qualitativeAxis,
      referencedFacts: {
        tenGods: ['정인', '편인', '편재'],
        pillarsInvolved: ['year', 'month'],
        relationshipsUsed: ['부모궁위상생'],
      },
      timeDependency: fact.time_dependency,
    });
  }
}

// 14. 구설마 (ma_gossip) - DERIVED
export class GossipMaEvaluator implements MaEvaluator {
  public readonly moduleId: StandardMaId = 'ma_gossip';

  public evaluate(fact: MaModuleInputFact): MaSignalEntity {
    const hasSangGwan = hasStemTenGod(fact, ['상관']);
    const hasGwan = hasStemTenGod(fact, ['정관']);
    const isSangGwanGyeonGwan = hasSangGwan && hasGwan;
    const hasIn = hasStemTenGod(fact, ['정인', '편인']);

    let state: ActivationState = 'DORMANT';
    const primaryCauses: string[] = [];

    // DOMINANT 조건: 상관견관 정면 대치 또는 자묘상형 인접 + 인성 제화 전무
    if (isSangGwanGyeonGwan && !hasIn) {
      state = 'DOMINANT';
      primaryCauses.push('상관견관 정면 대치 및 인성 제화 결여');
    } else if (isSangGwanGyeonGwan && hasIn) {
      state = 'ACTIVE';
      primaryCauses.push('상관견관 발생하나 인성에 의한 완충 존재');
    } else if (hasSangGwan) {
      state = 'TRIGGERED';
      primaryCauses.push('상관 발언 잠재 감응');
    }

    const qualitativeAxis: Qualitative5Axis = {
      intensity: isSangGwanGyeonGwan ? 'VERY_HIGH' : 'LOW',
      pressure: isSangGwanGyeonGwan ? 'VERY_HIGH' : 'LOW',
      opportunity: 'LOW',
      volatility: isSangGwanGyeonGwan ? 'VERY_HIGH' : 'LOW',
      mitigation: hasIn ? 'HIGH' : 'LOW',
    };

    return createMaSignalEntity({
      moduleId: this.moduleId,
      activation: MaFactAdapter.validateActivationEvaluation({
        state,
        isActivated: state !== 'DORMANT',
        primaryCauses,
        inhibitingFactors: [],
        mitigatingFactors: [],
        certainty: 'PHASE5_CONFIRMED',
      }),
      qualitativeAxis,
      referencedFacts: {
        tenGods: ['상관', '정관'],
        pillarsInvolved: ['month', 'year', 'day'],
        relationshipsUsed: ['상관견관'],
      },
      timeDependency: fact.time_dependency,
    });
  }
}

// 15. 재판마 (ma_legal) - DERIVED (PROVISIONAL)
export class LegalMaEvaluator implements MaEvaluator {
  public readonly moduleId: StandardMaId = 'ma_legal';

  public evaluate(fact: MaModuleInputFact): MaSignalEntity {
    const hasPyeonGwan = hasStemTenGod(fact, ['편관']);
    const hasPunishment = fact.branch_punishments.length > 0;
    const isExtremeWeak = fact.day_master_strength.classification === '극약';

    let state: ActivationState = 'DORMANT';
    const primaryCauses: string[] = [];

    // DOMINANT 조건 (PROVISIONAL): 편관 무제 태과 + 삼형살 결합 + 일간 극약
    if (hasPyeonGwan && hasPunishment && isExtremeWeak) {
      state = 'DOMINANT';
      primaryCauses.push('편관 칠살 압박', '삼형살 결합', '일간 극약으로 인한 법적 분쟁 과열');
    } else if (hasPyeonGwan || hasPunishment) {
      state = 'ACTIVE';
      primaryCauses.push('권리 대립 기운 작용');
    }

    const qualitativeAxis: Qualitative5Axis = {
      intensity: hasPyeonGwan ? 'HIGH' : 'MODERATE',
      pressure: hasPyeonGwan && hasPunishment ? 'VERY_HIGH' : 'LOW',
      opportunity: 'LOW',
      volatility: hasPunishment ? 'HIGH' : 'LOW',
      mitigation: fact.day_master_strength.isDeukJi ? 'HIGH' : 'LOW',
    };

    return createMaSignalEntity({
      moduleId: this.moduleId,
      activation: MaFactAdapter.validateActivationEvaluation({
        state,
        isActivated: state !== 'DORMANT',
        primaryCauses,
        inhibitingFactors: [],
        mitigatingFactors: [],
        certainty: 'PROVISIONAL',
      }),
      qualitativeAxis,
      referencedFacts: {
        tenGods: ['편관', '상관'],
        pillarsInvolved: ['month', 'day'],
        relationshipsUsed: ['칠살무제', '삼형살'],
      },
      timeDependency: fact.time_dependency,
    });
  }
}

// 16. 이동마 (ma_movement) - DERIVED
export class MovementMaEvaluator implements MaEvaluator {
  public readonly moduleId: StandardMaId = 'ma_movement';

  public evaluate(fact: MaModuleInputFact): MaSignalEntity {
    const sasaengCount = countSasaengBranches(fact);
    const isAdjacentClash = fact.branch_clashes.some(c => c.distance === 1);

    let state: ActivationState = 'DORMANT';
    const primaryCauses: string[] = [];

    // DOMINANT 조건: 사생지(인신사해) 역마 다수 포진(2개 이상) 또는 일월지 인접 정면 육충
    if (sasaengCount >= 2 || isAdjacentClash) {
      state = 'DOMINANT';
      primaryCauses.push(sasaengCount >= 2 ? '사생지 역마 다수 포진' : '인접 정면 지지 육충 발생');
    } else if (sasaengCount === 1 || fact.branch_clashes.length > 0) {
      state = 'ACTIVE';
      primaryCauses.push('역마 기운 또는 지지 변동 작용');
    } else {
      state = 'TRIGGERED';
      primaryCauses.push('이동 잠재 감응');
    }

    const qualitativeAxis: Qualitative5Axis = {
      intensity: sasaengCount >= 2 ? 'VERY_HIGH' : 'MODERATE',
      pressure: isAdjacentClash ? 'HIGH' : 'LOW',
      opportunity: sasaengCount >= 2 ? 'HIGH' : 'MODERATE',
      volatility: isAdjacentClash ? 'VERY_HIGH' : 'LOW',
      mitigation: 'MODERATE',
    };

    return createMaSignalEntity({
      moduleId: this.moduleId,
      activation: MaFactAdapter.validateActivationEvaluation({
        state,
        isActivated: (state as ActivationState) !== 'DORMANT',
        primaryCauses,
        inhibitingFactors: [],
        mitigatingFactors: [],
        certainty: 'PHASE5_CONFIRMED',
      }),
      qualitativeAxis,
      referencedFacts: {
        tenGods: ['편재', '식신'],
        pillarsInvolved: ['month', 'day'],
        relationshipsUsed: ['사생지역마', '인접육충'],
      },
      timeDependency: fact.time_dependency,
    });
  }
}

// 17. 시험마 (ma_exam) - DERIVED
export class ExamMaEvaluator implements MaEvaluator {
  public readonly moduleId: StandardMaId = 'ma_exam';

  public evaluate(fact: MaModuleInputFact): MaSignalEntity {
    const hasIn = hasStemTenGod(fact, ['정인']);
    const hasGwan = hasStemTenGod(fact, ['정관']);
    const hasSikShin = hasStemTenGod(fact, ['식신']);

    let state: ActivationState = 'DORMANT';
    const primaryCauses: string[] = [];

    // DOMINANT 조건: 관인상생격 + 식신 유통 + 일간 집중력 유지
    if (hasIn && hasGwan && hasSikShin) {
      state = 'DOMINANT';
      primaryCauses.push('관인상생 합격 구조', '식신 응용력 유통', '일간 집중력 유지');
    } else if (hasIn && hasGwan) {
      state = 'ACTIVE';
      primaryCauses.push('관인상생 학문/자격 기운 형성');
    } else if (hasIn) {
      state = 'TRIGGERED';
      primaryCauses.push('학업/문서 잠재 감응');
    }

    const qualitativeAxis: Qualitative5Axis = {
      intensity: hasIn && hasGwan ? 'HIGH' : 'MODERATE',
      pressure: 'LOW',
      opportunity: hasIn && hasGwan ? 'VERY_HIGH' : 'MODERATE',
      volatility: 'LOW',
      mitigation: hasIn ? 'HIGH' : 'LOW',
    };

    return createMaSignalEntity({
      moduleId: this.moduleId,
      activation: MaFactAdapter.validateActivationEvaluation({
        state,
        isActivated: state !== 'DORMANT',
        primaryCauses,
        inhibitingFactors: [],
        mitigatingFactors: [],
        certainty: 'PHASE5_CONFIRMED',
      }),
      qualitativeAxis,
      referencedFacts: {
        tenGods: ['정인', '정관', '식신'],
        pillarsInvolved: ['year', 'month'],
        relationshipsUsed: ['관인상생', '식신유통'],
      },
      timeDependency: fact.time_dependency,
    });
  }
}

// 18. 귀인마 (ma_noble) - OPTIONAL/DERIVED
export class NobleMaEvaluator implements MaEvaluator {
  public readonly moduleId: StandardMaId = 'ma_noble';

  public evaluate(fact: MaModuleInputFact): MaSignalEntity {
    const hasNoble = hasCheonEulGuiIn(fact);
    const hasClash = fact.branch_clashes.length > 0;

    let state: ActivationState = 'DORMANT';
    const primaryCauses: string[] = [];

    // DOMINANT 조건: 천을귀인 지지 보유 + 충형 훼손 전무
    if (hasNoble && !hasClash) {
      state = 'DOMINANT';
      primaryCauses.push('천을귀인 지지 안착', '충형 훼손 전무');
    } else if (hasNoble && hasClash) {
      state = 'ACTIVE';
      primaryCauses.push('천을귀인 보유하나 충형 간섭 존재');
    } else {
      state = 'DORMANT';
    }

    const qualitativeAxis: Qualitative5Axis = {
      intensity: hasNoble ? 'HIGH' : 'LOW',
      pressure: 'LOW',
      opportunity: hasNoble ? 'VERY_HIGH' : 'LOW',
      volatility: hasClash ? 'MODERATE' : 'LOW',
      mitigation: hasNoble ? 'VERY_HIGH' : 'LOW',
    };

    return createMaSignalEntity({
      moduleId: this.moduleId,
      activation: MaFactAdapter.validateActivationEvaluation({
        state,
        isActivated: state !== 'DORMANT',
        primaryCauses,
        inhibitingFactors: [],
        mitigatingFactors: [],
        certainty: 'PHASE5_CONFIRMED',
      }),
      qualitativeAxis,
      referencedFacts: {
        tenGods: ['정인', '정관'],
        pillarsInvolved: ['month', 'day'],
        relationshipsUsed: ['천을귀인'],
      },
      timeDependency: fact.time_dependency,
    });
  }
}

// 19. 집마 (ma_home) - DERIVED (PROVISIONAL)
export class HomeMaEvaluator implements MaEvaluator {
  public readonly moduleId: StandardMaId = 'ma_home';

  public evaluate(fact: MaModuleInputFact): MaSignalEntity {
    const isDayEarth = BRANCH_INFO[fact.four_pillars.day.branch].element === '토';
    const hasIn = hasStemTenGod(fact, ['정인']) || hasBranchMainTenGod(fact, ['정인']);
    const isDayClashed = fact.spouse_facts.palaceClashes.length > 0;

    let state: ActivationState = 'DORMANT';
    const primaryCauses: string[] = [];

    // DOMINANT 조건 (PROVISIONAL): 일지 토(土) 오행 안착 + 인성 통근 + 일지 충파 전무
    if (isDayEarth && hasIn && !isDayClashed) {
      state = 'DOMINANT';
      primaryCauses.push('일지 토 오행 안착', '인성 정착성 결합', '일지 충파 부존재');
    } else if (hasIn || isDayEarth) {
      state = 'ACTIVE';
      primaryCauses.push('주거 정착 인자 작용');
    }

    const qualitativeAxis: Qualitative5Axis = {
      intensity: isDayEarth && hasIn ? 'HIGH' : 'MODERATE',
      pressure: isDayClashed ? 'HIGH' : 'LOW',
      opportunity: hasIn ? 'HIGH' : 'LOW',
      volatility: isDayClashed ? 'HIGH' : 'LOW',
      mitigation: !isDayClashed ? 'HIGH' : 'LOW',
    };

    return createMaSignalEntity({
      moduleId: this.moduleId,
      activation: MaFactAdapter.validateActivationEvaluation({
        state,
        isActivated: state !== 'DORMANT',
        primaryCauses,
        inhibitingFactors: [],
        mitigatingFactors: [],
        certainty: 'PROVISIONAL',
      }),
      qualitativeAxis,
      referencedFacts: {
        tenGods: ['정인', '정재'],
        pillarsInvolved: ['day'],
        relationshipsUsed: ['일지토안착'],
      },
      timeDependency: fact.time_dependency,
    });
  }
}

// 20. 연애마 (ma_romance) - CORE (PROVISIONAL, Zero-Gender)
export class RomanceMaEvaluator implements MaEvaluator {
  public readonly moduleId: StandardMaId = 'ma_romance';

  public evaluate(fact: MaModuleInputFact): MaSignalEntity {
    const dohwaCount = countDohwaBranches(fact);
    const hasSikSang = hasStemTenGod(fact, ['식신', '상관']);
    const sf = fact.spouse_facts;
    const isPalaceHarmonized = sf.palaceHarmonies.length > 0;

    let state: ActivationState = 'DORMANT';
    const primaryCauses: string[] = [];

    // DOMINANT 조건 (PROVISIONAL): 도화 지지 보유 + 식상 표현력 + 일지 감응 결합
    if (dohwaCount > 0 && hasSikSang && isPalaceHarmonized) {
      state = 'DOMINANT';
      primaryCauses.push('도화 지지 매력', '식상 감정 표현', '일지 합 감응');
    } else if (dohwaCount > 0 || hasSikSang) {
      state = 'ACTIVE';
      primaryCauses.push('이성적 감력 및 매력 활성');
    } else {
      state = 'TRIGGERED';
      primaryCauses.push('연애 잠재 상태');
    }

    const qualitativeAxis: Qualitative5Axis = {
      intensity: dohwaCount > 0 ? 'HIGH' : 'MODERATE',
      pressure: 'LOW',
      opportunity: dohwaCount > 0 && hasSikSang ? 'VERY_HIGH' : 'MODERATE',
      volatility: sf.palaceClashes.length > 0 ? 'HIGH' : 'LOW',
      mitigation: isPalaceHarmonized ? 'HIGH' : 'LOW',
    };

    return createMaSignalEntity({
      moduleId: this.moduleId,
      activation: MaFactAdapter.validateActivationEvaluation({
        state,
        isActivated: (state as ActivationState) !== 'DORMANT',
        primaryCauses,
        inhibitingFactors: [],
        mitigatingFactors: [],
        certainty: 'PROVISIONAL',
      }),
      qualitativeAxis,
      referencedFacts: {
        tenGods: ['식신', '상관', sf.secondarySpouseStar],
        pillarsInvolved: ['day', 'month'],
        relationshipsUsed: ['도화', '일지감응'],
      },
      timeDependency: fact.time_dependency,
    });
  }
}

// 21. 확장 슬롯 (ma_extension_slot) - OPTIONAL/EXTENSION
export class ExtensionSlotMaEvaluator implements MaEvaluator {
  public readonly moduleId = 'ma_extension_slot';

  public evaluate(fact: MaModuleInputFact): MaSignalEntity {
    // 확장 슬롯 기본 동작: 독립 격리 실행 및 DORMANT 유지 (플러그인 주입 전)
    return createMaSignalEntity({
      moduleId: this.moduleId,
      activation: createDefaultActivationEvaluation({
        state: 'DORMANT',
        isActivated: false,
        primaryCauses: ['외부 확장 플러그인 대기 중'],
        certainty: 'PHASE5_CONFIRMED',
      }),
      qualitativeAxis: createDefaultQualitative5Axis(),
      customMetadata: {
        koreanName: '확장마',
        category: 'OPTIONAL',
        order: 21,
      },
      timeDependency: fact.time_dependency,
    });
  }
}

// ----------------------------------------------------
// 21개 Ma 전체 관리 및 실행 엔진
// ----------------------------------------------------

export class MaActivationEngine {
  private evaluators: Map<string, MaEvaluator> = new Map();

  constructor() {
    this.registerEvaluator(new WealthMaEvaluator());
    this.registerEvaluator(new BusinessMaEvaluator());
    this.registerEvaluator(new CareerMaEvaluator());
    this.registerEvaluator(new AssetMaEvaluator());
    this.registerEvaluator(new SocialMaEvaluator());
    this.registerEvaluator(new RomanceMaEvaluator());
    this.registerEvaluator(new MarriageMaEvaluator());
    this.registerEvaluator(new FamilyMaEvaluator());
    this.registerEvaluator(new ChildrenMaEvaluator());
    this.registerEvaluator(new ParentsMaEvaluator());
    this.registerEvaluator(new HealthMaEvaluator());
    this.registerEvaluator(new AccidentMaEvaluator());
    this.registerEvaluator(new GossipMaEvaluator());
    this.registerEvaluator(new DocumentMaEvaluator());
    this.registerEvaluator(new LegalMaEvaluator());
    this.registerEvaluator(new MovementMaEvaluator());
    this.registerEvaluator(new ExamMaEvaluator());
    this.registerEvaluator(new FameMaEvaluator());
    this.registerEvaluator(new NobleMaEvaluator());
    this.registerEvaluator(new HomeMaEvaluator());
    this.registerEvaluator(new ExtensionSlotMaEvaluator());
  }

  public registerEvaluator(evaluator: MaEvaluator): void {
    this.evaluators.set(evaluator.moduleId, evaluator);
  }

  public getEvaluator(moduleId: string): MaEvaluator | undefined {
    return this.evaluators.get(moduleId);
  }

  /**
   * 21개 Ma 모듈을 전수 평가하여 SignalEntity 맵을 생성합니다.
   */
  public evaluateAll(fact: MaModuleInputFact): Map<string, MaSignalEntity> {
    const results = new Map<string, MaSignalEntity>();
    for (const [id, evaluator] of this.evaluators.entries()) {
      results.set(id, evaluator.evaluate(fact));
    }
    return results;
  }
}
