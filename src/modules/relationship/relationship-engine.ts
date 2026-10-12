/**
 * Phase 4: Relationship Engine (합·충·형·파·해 및 특수 관계 총괄 엔진)
 * 
 * 4대 층위 아키텍처:
 * [Layer 1] 관계 존재 사실 (detected: boolean) - 거리 가중치 배제, 객관적 명리학 관계 성립
 * [Layer 2] 관계 작용 강도 (intensity) - 거리(인접/격위) 및 기반 세력에 따른 파생 강도
 * [Layer 3] 관계 상호작용 (interaction) - 합충 공존, 탐합망충 시 관계 삭제 없이 완화(MITIGATED) 기록
 * [Layer 4] 서비스 파생지표 (RSI/안정도) - 임의 선형 산식 폐기, 독립 계층으로 분리
 */

import { BaseEngineModule } from '../../core/base-module.js';
import { FourPillars, TimeDependencyInfo } from '../../core/types.js';
import { BranchClashEngine, BranchClashMatch } from './branch-clash.js';
import { BranchHarmDestructionEngine, MinorRelationMatch } from './branch-harm-destruction.js';
import { BranchHarmonyEngine, BranchHarmonyMatch } from './branch-harmony.js';
import { BranchPunishmentEngine, BranchPunishmentMatch } from './branch-punishment.js';
import { StemRelationshipEngine, StemRelationMatch } from './stem-relationship.js';

export interface InteractionDetail {
  sourceRelation: string;
  targetRelation: string;
  effect: 'MITIGATED' | 'COMPETING' | 'OVERRIDDEN' | 'AMPLIFIED';
  description: string;
}

export interface RelationshipInput {
  four_pillars: FourPillars;
}

export interface RelationshipOutput {
  // Layer 1 & 2: 개별 관계 검출 결과 (존재 사실 및 파생 강도)
  stem_relations: StemRelationMatch[];
  branch_harmonies: BranchHarmonyMatch[];
  branch_clashes: BranchClashMatch[];
  branch_punishments: BranchPunishmentMatch[];
  minor_relations: MinorRelationMatch[];

  // Layer 3: 관계 간 상호작용 (탐합망충, 합충 공존 등)
  interactions: InteractionDetail[];

  // Layer 4: 서비스용 파생 요약 지표 (임의 선형 RSI 산식 폐기 및 분리)
  summary: {
    total_harmony_score: number;     // 0 ~ 100 합 총합 강도
    total_clash_score: number;       // 0 ~ 100 충 총합 강도
    total_punishment_score: number;  // 0 ~ 100 형/파/해 총합 강도
    /**
     * @deprecated 임의 선형 산식은 명리학적 근거가 없으므로 Phase 4에서 폐기되었습니다.
     * 기존 테스트 하위 호환성을 위해 유지되며, 별도 Phase에서 신규 모델로 대체 예정입니다.
     */
    overall_stability_score: number;
    rsi_status: 'DEPRECATED_PENDING_PHASE_5';
  };
  time_dependency: TimeDependencyInfo;
}

export class RelationshipEngine extends BaseEngineModule<RelationshipInput, RelationshipOutput> {
  protected readonly moduleId = 'relationship_engine';
  protected readonly moduleVersion = '2.0.0';
  protected readonly ruleVersion = '2026.1';
  protected readonly inputSchemaName = 'RelationshipInput';
  protected readonly outputSchemaName = 'RelationshipOutput';

  private stemEngine = new StemRelationshipEngine();
  private harmonyEngine = new BranchHarmonyEngine();
  private clashEngine = new BranchClashEngine();
  private punishmentEngine = new BranchPunishmentEngine();
  private harmDestructionEngine = new BranchHarmDestructionEngine();

  protected validateInput(input: RelationshipInput): { isValid: boolean; reason?: string } {
    if (!input || !input.four_pillars || !input.four_pillars.day || !input.four_pillars.month) {
      return { isValid: false, reason: 'RelationshipInput four_pillars 필수 기둥이 누락되었습니다.' };
    }
    return { isValid: true };
  }

  protected processInternal(input: RelationshipInput): {
    data: RelationshipOutput;
    confidence?: number;
    spec_gaps?: string[];
    notes?: string[];
  } {
    const notes: string[] = [];
    const spec_gaps: string[] = [];
    const pillars = input.four_pillars;

    // 1. [Layer 1 & Layer 2] 개별 관계 모듈 실행
    const stemRelations = this.stemEngine.analyze(pillars);
    const branchHarmonies = this.harmonyEngine.analyze(pillars);
    const branchClashes = this.clashEngine.analyze(pillars);
    const branchPunishments = this.punishmentEngine.analyze(pillars);
    const minorRelations = this.harmDestructionEngine.analyze(pillars);

    // 2. [Layer 3] 합충 상호작용 (Interaction Layer) 분석
    // 절대 원본 관계를 삭제하지 않고, 상호작용 메타데이터(MITIGATED 등)를 기록
    const interactions: InteractionDetail[] = [];

    // (1) 지지 합충 공존 및 탐합망충 상호작용 분석
    for (const clash of branchClashes) {
      const [b1, b2] = clash.branches;
      // 충을 이루는 지지 중 하나라도 삼합(완전/반합) 또는 육합에 참여하는지 검사
      const involvedHarmonies = branchHarmonies.filter(h =>
        h.branches.includes(b1) || h.branches.includes(b2)
      );

      if (involvedHarmonies.length > 0) {
        for (const harmony of involvedHarmonies) {
          const detail: InteractionDetail = {
            sourceRelation: harmony.name,
            targetRelation: clash.name,
            effect: 'MITIGATED',
            description: `[${harmony.name}] 결합이 [${clash.name}]의 충돌 작용을 완화함 (탐합망충/합충공존: 원본 관계 보존)`,
          };
          interactions.push(detail);

          // 충 객체의 interaction 갱신 (관계 삭제 없이 완화 메타데이터 기록)
          clash.interaction.status = 'MITIGATED';
          clash.interaction.isMitigated = true;
          clash.interaction.mitigatedBy = harmony.name;
          clash.interaction.description = detail.description;

          // 합 객체에도 경합 메타데이터 기록
          harmony.interaction.status = 'COMPETING';
          harmony.interaction.description = `[${clash.name}]과의 지지 공유로 인한 경합 발생`;
        }
      }
    }

    // (2) 천간 합충 공존 상호작용 분석
    const stemCombos = stemRelations.filter(r => r.type === 'stem_combination');
    const stemClashes = stemRelations.filter(r => r.type === 'stem_clash');
    for (const sclash of stemClashes) {
      const [s1, s2] = sclash.stems;
      const involvedCombos = stemCombos.filter(c => c.stems.includes(s1) || c.stems.includes(s2));
      if (involvedCombos.length > 0) {
        for (const scombo of involvedCombos) {
          const detail: InteractionDetail = {
            sourceRelation: scombo.name,
            targetRelation: sclash.name,
            effect: 'MITIGATED',
            description: `[${scombo.name}]이 [${sclash.name}]과 동일 천간을 공유하여 충의 기운이 완화됨`,
          };
          interactions.push(detail);
          sclash.interaction.status = 'MITIGATED';
          sclash.interaction.isMitigated = true;
          sclash.interaction.mitigatedBy = scombo.name;
        }
      }
    }

    // 3. [Layer 4] 점수 집계 (기존 83개 테스트 하위 호환성 유지)
    const sumIntensity = (items: { intensity: number }[]) =>
      items.reduce((acc, cur) => acc + cur.intensity, 0);

    const rawHarmony = sumIntensity(branchHarmonies) + sumIntensity(stemRelations.filter(r => r.type === 'stem_combination'));
    const rawClash = sumIntensity(branchClashes) + sumIntensity(stemRelations.filter(r => r.type === 'stem_clash'));
    const rawPunishment = sumIntensity(branchPunishments) + sumIntensity(minorRelations);

    const totalHarmonyScore = Math.min(100.0, Math.round(rawHarmony * 100) / 100);
    const totalClashScore = Math.min(100.0, Math.round(rawClash * 100) / 100);
    const totalPunishmentScore = Math.min(100.0, Math.round(rawPunishment * 100) / 100);

    // 하위 호환용 계산식 (임의 선형 RSI 산식 폐기, Phase 5에서 전면 재설계 예정)
    const rawStability = 60.0 + (totalHarmonyScore * 0.4) - (totalClashScore * 0.45) - (totalPunishmentScore * 0.35);
    const overallStabilityScore = Math.max(0.0, Math.min(100.0, Math.round(rawStability * 100) / 100));

    const timeDependency: TimeDependencyInfo = {
      requires_hour: pillars.hour === null,
      time_dependency: pillars.hour === null ? 30.0 : 0.0,
      is_missing_hour: pillars.hour === null,
      notes: pillars.hour === null
        ? '시주 미상으로 연·월·일 3기둥 간의 합충형파해만 분석되었으며, 시주 관련 관계는 배제되었습니다.'
        : undefined,
    };

    if (pillars.hour === null) {
      notes.push('시주가 누락되었으나 3주 기준 관계 분석이 완전하게 완료되었습니다.');
    }

    const confidence = pillars.hour === null ? 80.0 : 100.0;

    const data: RelationshipOutput = {
      stem_relations: stemRelations,
      branch_harmonies: branchHarmonies,
      branch_clashes: branchClashes,
      branch_punishments: branchPunishments,
      minor_relations: minorRelations,
      interactions,
      summary: {
        total_harmony_score: totalHarmonyScore,
        total_clash_score: totalClashScore,
        total_punishment_score: totalPunishmentScore,
        overall_stability_score: overallStabilityScore,
        rsi_status: 'DEPRECATED_PENDING_PHASE_5',
      },
      time_dependency: timeDependency,
    };

    return {
      data,
      confidence,
      spec_gaps: spec_gaps.length > 0 ? spec_gaps : undefined,
      notes: notes.length > 0 ? notes : undefined,
    };
  }

  protected getFallbackData(input: RelationshipInput, errorReason: string): RelationshipOutput {
    return {
      stem_relations: [],
      branch_harmonies: [],
      branch_clashes: [],
      branch_punishments: [],
      minor_relations: [],
      interactions: [],
      summary: {
        total_harmony_score: 0,
        total_clash_score: 0,
        total_punishment_score: 0,
        overall_stability_score: 50,
        rsi_status: 'DEPRECATED_PENDING_PHASE_5',
      },
      time_dependency: {
        requires_hour: true,
        time_dependency: 100,
        is_missing_hour: true,
        notes: errorReason,
      },
    };
  }
}

