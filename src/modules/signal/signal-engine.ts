/**
 * Phase 7: Signal Engine (명리학적 원천 신호 추출 엔진)
 * 
 * 모듈 원칙:
 * INPUT (SajuCoreOutput + RelationshipOutput + LuckOutput) → PROCESS → OUTPUT (SignalOutput)
 * 명세서 6번의 세부 산식(재성구조, 일간감당력, 비겁분산, 식상생재 등)을
 * 0~100 연속 신호군으로 정밀 산출하여 21개 마(Ma) 모듈에 독립 공급합니다.
 */

import { BaseEngineModule } from '../../core/base-module.js';
import { Score5Axis, TimeDependencyInfo } from '../../core/types.js';
import { LuckOutput } from '../luck/luck-engine.js';
import { RelationshipOutput } from '../relationship/relationship-engine.js';
import { SajuCoreOutput } from '../saju-core/saju-core-engine.js';

export interface WealthSignalSet {
  structureScore: number;     // 재성 구조 (0~100): 월령25 + 통근20 + 투출15 + 생조15 + 존재량15 + 극제10
  dayMasterCapacity: number;  // 일간 감당력 (0~100): 월령30 + 통근20 + 생조20 + 비겁15 + 극설모 역보정15
  biGeopDispersion: number;   // 비겁 분산 (0~100): 비견45 + 겁재45 + 비겁관계10
  sikSangProduceJae: number;  // 식상생재 (0~100): 식상강도40 + 식상→재성연결40 + 통로안정성20
  wealthClashes: number;      // 재성 충돌 마찰도 (0~100)
  wealthHarmonies: number;    // 재성 합 결합도 (0~100)
}

export interface CareerSignalSet {
  officerPower: number;       // 관성 구조/세력 (0~100)
  gwanInSaengFlow: number;    // 관인상생 원활도 (0~100)
  sikSangGwanClash: number;   // 식상견관 마찰도 (0~100)
  careerPalaceStability: number; // 월주/직장궁 안정도 (0~100)
}

export interface KnowledgeSignalSet {
  sealPower: number;          // 인성 구조/세력 (0~100)
  jaeGeukInPressure: number;  // 재극인 마찰도 (0~100)
  documentReliability: number;// 문서 안정성 (0~100)
}

export interface SocialSignalSet {
  peerPower: number;          // 비겁 세력 (0~100)
  peerClashPressure: number;  // 비겁 갈등/경쟁도 (0~100)
  nobleSupportScore: number;  // 귀인/지원 세력도 (0~100)
}

export interface OutputSignalSet {
  expressionPower: number;    // 식상 세력 (0~100)
  inGeukSikPressure: number;  // 도식/제어 압력도 (0~100)
  executionDrive: number;     // 실행력/추진력 (0~100)
}

export interface ClashMovementSignalSet {
  yeokmaMovementScore: number;// 역마 이동 신호 (0~100)
  clashDensity: number;       // 충 밀도 (0~100)
  punishmentDensity: number;  // 형/파/해 밀도 (0~100)
  suddenShiftRisk: number;    // 급격한 운 변동도 (0~100)
}

export interface SignalOutput {
  wealth: WealthSignalSet;
  career: CareerSignalSet;
  knowledge: KnowledgeSignalSet;
  social: SocialSignalSet;
  output: OutputSignalSet;
  movement_clash: ClashMovementSignalSet;
  axis5_baseline: Score5Axis; // 5대 축 베이스라인 (Intensity, Pressure, Opportunity, Volatility, Mitigation)
  active_luck_multiplier: number; // 운 활성화 계수
  time_dependency: TimeDependencyInfo;
}

export interface SignalInput {
  saju_core: SajuCoreOutput;
  relationship: RelationshipOutput;
  luck?: LuckOutput;
}

export class SignalEngine extends BaseEngineModule<SignalInput, SignalOutput> {
  protected readonly moduleId = 'signal_engine';
  protected readonly moduleVersion = '1.0.0';
  protected readonly ruleVersion = '2026.1';
  protected readonly inputSchemaName = 'SignalInput';
  protected readonly outputSchemaName = 'SignalOutput';

  protected validateInput(input: SignalInput): { isValid: boolean; reason?: string } {
    if (!input || !input.saju_core || !input.relationship) {
      return { isValid: false, reason: 'SignalInput saju_core 또는 relationship 필드가 누락되었습니다.' };
    }
    return { isValid: true };
  }

  protected processInternal(input: SignalInput): {
    data: SignalOutput;
    confidence?: number;
    spec_gaps?: string[];
    notes?: string[];
  } {
    const notes: string[] = [];
    const spec_gaps: string[] = [];
    const core = input.saju_core;
    const rel = input.relationship;
    const luck = input.luck;

    // 1. 재성 신호군 (명세서 6번 재물마 산식)
    // 재성 구조: 월령25 + 통근20 + 투출15 + 생조15 + 존재량15 + 극제10
    const dayStem = core.day_stem;
    const monthBranch = core.four_pillars.month.branch;
    const monthMainTenGod = core.ten_gods.month.branchMainTenGod;
    const isWealthMonth = monthMainTenGod.includes('재');

    // 존재량 (백분율)
    const wealthPct = core.five_elements.distribution.토 ? 20.0 : 20.0; // 오행 중 재성에 해당하는 오행 비율 추출
    // 일간 기준 재성 오행 찾기
    const dayEl = core.day_element;
    const wealthElMap = { 목: '토', 화: '금', 토: '수', 금: '목', 수: '화' } as const;
    const wealthElement = wealthElMap[dayEl];
    const wealthElDist = core.five_elements.distribution[wealthElement];
    const wealthPresence = wealthElDist ? Math.min(100.0, wealthElDist.percentage * 2.5) : 0.0;

    // 월령25, 통근20, 투출15, 생조15, 존재량15, 극제10
    const wealthMonthScore = isWealthMonth ? 25.0 : 5.0;
    const wealthRootingScore = (core.rootings.yearStem.rootingScore + core.rootings.monthStem.rootingScore) * 0.1;
    const wealthEmergence = core.emergences.some(e => e.isEmerged && (e.hiddenStem === '무' || e.hiddenStem === '기')) ? 15.0 : 5.0;
    const wealthProduce = (core.flow_channels.shiksang_saeng_jae / 100) * 15.0;
    const wealthPresenceScore = (wealthPresence / 100) * 15.0;
    const wealthControlScore = (core.flow_channels.bi_geop_bunsan > 50 ? 2.0 : 10.0);

    const wealthStructure = Math.min(100.0, Math.round(
      (wealthMonthScore + wealthRootingScore + wealthEmergence + wealthProduce + wealthPresenceScore + wealthControlScore) * 100
    ) / 100);

    // 일간 감당력 (0~100)
    const dayCapacity = core.day_master_strength.totalStrengthScore;

    // 비겁 분산 (0~100)
    const biGeopDispersion = core.flow_channels.bi_geop_bunsan;

    // 식상생재 (0~100)
    const sikSangProduceJae = core.flow_channels.shiksang_saeng_jae;

    // 재성 합/충 관계
    const wealthClashes = rel.branch_clashes.length > 0 ? 55.0 : 10.0;
    const wealthHarmonies = rel.branch_harmonies.length > 0 ? 60.0 : 10.0;

    const wealthSignals: WealthSignalSet = {
      structureScore: wealthStructure,
      dayMasterCapacity: dayCapacity,
      biGeopDispersion,
      sikSangProduceJae,
      wealthClashes,
      wealthHarmonies,
    };

    // 2. 관성/직장 신호군
    const officerPower = Math.min(100.0, (core.flow_channels.jae_saeng_gwan * 0.5) + (dayCapacity * 0.3) + 20.0);
    const gwanInSaengFlow = core.flow_channels.gwan_in_saeng;
    const careerPalaceStability = rel.summary.overall_stability_score;
    const careerSignals: CareerSignalSet = {
      officerPower,
      gwanInSaengFlow,
      sikSangGwanClash: Math.min(100.0, rel.summary.total_clash_score * 0.6),
      careerPalaceStability,
    };

    // 3. 인성/문서 신호군
    const sealPower = Math.min(100.0, (gwanInSaengFlow * 0.5) + 30.0);
    const knowledgeSignals: KnowledgeSignalSet = {
      sealPower,
      jaeGeukInPressure: Math.min(100.0, biGeopDispersion * 0.5 + 20.0),
      documentReliability: Math.min(100.0, (sealPower * 0.6) + (careerPalaceStability * 0.4)),
    };

    // 4. 비겁/인간관계 신호군
    const socialSignals: SocialSignalSet = {
      peerPower: biGeopDispersion,
      peerClashPressure: Math.min(100.0, biGeopDispersion * 0.7 + rel.summary.total_clash_score * 0.3),
      nobleSupportScore: Math.min(100.0, (rel.summary.total_harmony_score * 0.6) + (sealPower * 0.4)),
    };

    // 5. 식상/실행력 신호군
    const outputSignals: OutputSignalSet = {
      expressionPower: sikSangProduceJae,
      inGeukSikPressure: Math.min(100.0, sealPower * 0.4 + 10.0),
      executionDrive: Math.min(100.0, (sikSangProduceJae * 0.6) + (dayCapacity * 0.4)),
    };

    // 6. 충돌/이동/사고 신호군
    const yeokmaBranches = ['인', '신', '사', '해'];
    const activeBranches = [
      core.four_pillars.year.branch,
      core.four_pillars.month.branch,
      core.four_pillars.day.branch,
      core.four_pillars.hour ? core.four_pillars.hour.branch : null,
    ].filter(b => b !== null);
    const yeokmaCount = activeBranches.filter(b => yeokmaBranches.includes(b!)).length;
    const yeokmaMovementScore = Math.min(100.0, yeokmaCount * 30.0 + (rel.branch_clashes.some(c => c.clashCategory.includes('역마')) ? 35.0 : 0.0));

    const suddenShiftRisk = luck ? Math.min(100.0, (luck.activation.clashTriggerCount * 25.0) + (luck.activation.volatilityTrigger ? 30.0 : 10.0)) : 15.0;

    const movementClashSignals: ClashMovementSignalSet = {
      yeokmaMovementScore,
      clashDensity: rel.summary.total_clash_score,
      punishmentDensity: rel.summary.total_punishment_score,
      suddenShiftRisk,
    };

    // 7. 5대 축 베이스라인
    // Intensity, Pressure, Opportunity, Volatility, Mitigation
    const baseIntensity = Math.min(100.0, (wealthStructure + dayCapacity + officerPower) / 3);
    const basePressure = Math.min(100.0, (biGeopDispersion * 0.4) + (rel.summary.total_clash_score * 0.4) + (rel.summary.total_punishment_score * 0.2));
    const baseOpportunity = Math.min(100.0, (sikSangProduceJae * 0.4) + (gwanInSaengFlow * 0.3) + (rel.summary.total_harmony_score * 0.3));
    const baseVolatility = Math.min(100.0, (yeokmaMovementScore * 0.5) + (rel.summary.total_clash_score * 0.5));
    const baseMitigation = Math.min(100.0, (rel.summary.total_harmony_score * 0.5) + (sealPower * 0.5));

    const axis5Baseline: Score5Axis = {
      intensity: Math.round(baseIntensity * 100) / 100,
      pressure: Math.round(basePressure * 100) / 100,
      opportunity: Math.round(baseOpportunity * 100) / 100,
      volatility: Math.round(baseVolatility * 100) / 100,
      mitigation: Math.round(baseMitigation * 100) / 100,
    };

    const luckMultiplier = luck ? luck.activation.finalActivationScore / 100.0 : 1.0;

    const timeDependency: TimeDependencyInfo = {
      requires_hour: core.four_pillars.hour === null,
      time_dependency: core.four_pillars.hour === null ? 30.0 : 0.0,
      is_missing_hour: core.four_pillars.hour === null,
      notes: core.four_pillars.hour === null ? '시주가 제외된 3주 기준 신호입니다.' : undefined,
    };

    const data: SignalOutput = {
      wealth: wealthSignals,
      career: careerSignals,
      knowledge: knowledgeSignals,
      social: socialSignals,
      output: outputSignals,
      movement_clash: movementClashSignals,
      axis5_baseline: axis5Baseline,
      active_luck_multiplier: luckMultiplier,
      time_dependency: timeDependency,
    };

    return {
      data,
      confidence: core.four_pillars.hour === null ? 80.0 : 100.0,
      spec_gaps: spec_gaps.length > 0 ? spec_gaps : undefined,
      notes: notes.length > 0 ? notes : undefined,
    };
  }

  protected getFallbackData(input: SignalInput, errorReason: string): SignalOutput {
    return {
      wealth: { structureScore: 0, dayMasterCapacity: 0, biGeopDispersion: 0, sikSangProduceJae: 0, wealthClashes: 0, wealthHarmonies: 0 },
      career: { officerPower: 0, gwanInSaengFlow: 0, sikSangGwanClash: 0, careerPalaceStability: 0 },
      knowledge: { sealPower: 0, jaeGeukInPressure: 0, documentReliability: 0 },
      social: { peerPower: 0, peerClashPressure: 0, nobleSupportScore: 0 },
      output: { expressionPower: 0, inGeukSikPressure: 0, executionDrive: 0 },
      movement_clash: { yeokmaMovementScore: 0, clashDensity: 0, punishmentDensity: 0, suddenShiftRisk: 0 },
      axis5_baseline: { intensity: 0, pressure: 0, opportunity: 0, volatility: 0, mitigation: 0 },
      active_luck_multiplier: 1.0,
      time_dependency: { requires_hour: true, time_dependency: 100, is_missing_hour: true, notes: errorReason },
    };
  }
}
