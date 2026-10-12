/**
 * BoundarySimulationEngine: 경계시간 복수 후보(Candidate A, B, C) 전체 시뮬레이션 및 교차 분석 엔진
 * 
 * 원칙:
 * 후보 각각에 대해 Core 및 Relationship 엔진을 독립 실행하고,
 * Consensus(공통점)와 Difference(차이점), BoundarySensitivity(민감도), Confidence를 산출합니다.
 */

import { FourPillars, PillarCandidate } from '../../core/types.js';
import { PillarOutput } from '../pillar/pillar-engine.js';
import { RelationshipEngine, RelationshipOutput } from '../relationship/relationship-engine.js';
import { SajuCoreEngine, SajuCoreOutput } from '../saju-core/saju-core-engine.js';

export interface CandidateSimulationDetail {
  candidate_id: 'A' | 'B' | 'C' | 'A1' | 'A2' | 'B1' | 'B2' | string;
  label: string;
  hourPillarName: string;
  probability?: number;
  coreOutput: SajuCoreOutput;
  relationshipOutput: RelationshipOutput;
  strengthScore: number;
  dominantElement: string;
  harmonyCount: number;
  clashCount: number;
}

export interface BoundarySimulationResult {
  hasBoundaryIssue: boolean;
  candidates: CandidateSimulationDetail[];
  boundarySensitivity: number; // 0 ~ 100 연속값 (점수 격차가 크고 경계에 가까울수록 상승)
  confidence: number;          // 0 ~ 100
  consensusItems: string[];    // 시간에 상관없이 공통적인 결과
  differenceItems: string[];   // 시간에 따라 달라지는 결과
  executiveSummary: string;
}

export class BoundarySimulationEngine {
  private sajuCoreEngine = new SajuCoreEngine();
  private relationshipEngine = new RelationshipEngine();

  public simulate(
    candidates: PillarCandidate[],
    basePillarOutput: PillarOutput,
    isNearBoundary: boolean,
    diffMinutes: number = 0
  ): BoundarySimulationResult {
    if (!isNearBoundary || candidates.length <= 1) {
      return {
        hasBoundaryIssue: false,
        candidates: [],
        boundarySensitivity: 0.0,
        confidence: 100.0,
        consensusItems: ['단일 시주로 모든 영역이 안정적으로 확정되었습니다.'],
        differenceItems: [],
        executiveSummary: '경계시간 문제가 없는 단일 확정 명식입니다.',
      };
    }

    // 각 후보별 전체 파이프라인 독립 실행
    const simulations: CandidateSimulationDetail[] = [];

    for (const cand of candidates) {
      const simulatedPillars: FourPillars = {
        year: cand.pillars.year,
        month: cand.pillars.month,
        day: cand.pillars.day,
        hour: cand.pillars.hour,
      };

      const simulatedPillarOutput: PillarOutput = {
        ...basePillarOutput,
        four_pillars: simulatedPillars,
      };

      const coreRes = this.sajuCoreEngine.execute(simulatedPillarOutput);
      const relRes = this.relationshipEngine.execute({ four_pillars: simulatedPillars });

      simulations.push({
        candidate_id: cand.candidate_id,
        label: cand.label,
        hourPillarName: cand.pillars.hour ? cand.pillars.hour.name || `${cand.pillars.hour.stem}${cand.pillars.hour.branch}` : '미상',
        probability: cand.probability,
        coreOutput: coreRes.data,
        relationshipOutput: relRes.data,
        strengthScore: coreRes.data.day_master_strength.totalStrengthScore,
        dominantElement: coreRes.data.five_elements.dominantElement,
        harmonyCount: relRes.data.branch_harmonies.length + relRes.data.stem_relations.filter(r => r.type === 'stem_combination').length,
        clashCount: relRes.data.branch_clashes.length + relRes.data.stem_relations.filter(r => r.type === 'stem_clash').length,
      });
    }

    // 후보 A vs 후보 B 비교 분석
    const a = simulations[0];
    const b = simulations[1];

    const consensusItems: string[] = [
      `연주(${a.coreOutput.four_pillars.year.name}), 월주(${a.coreOutput.four_pillars.month.name}), 일주(${a.coreOutput.four_pillars.day.name})의 본질적 기틀은 100% 동일합니다.`,
      `주요 격국 및 일간(${a.coreOutput.day_stem})의 기본 오행(${a.coreOutput.day_element}) 속성은 공유됩니다.`,
    ];

    const differenceItems: string[] = [];

    // 1. 일간 강약 점수 차이
    const strengthDiff = Math.abs(a.strengthScore - b.strengthScore);
    if (strengthDiff >= 5.0) {
      differenceItems.push(
        `일간 강약: 후보 A는 ${a.strengthScore}점(${a.coreOutput.day_master_strength.classification}), 후보 B는 ${b.strengthScore}점(${b.coreOutput.day_master_strength.classification})으로 약 ${strengthDiff.toFixed(2)}점 격차 발생`
      );
    } else {
      consensusItems.push(`일간 강약 수준은 두 후보 모두 ${a.coreOutput.day_master_strength.classification} 계열로 일치합니다.`);
    }

    // 2. 최강 오행 비교
    if (a.dominantElement !== b.dominantElement) {
      differenceItems.push(`최강 오행: 후보 A는 ${a.dominantElement}, 후보 B는 ${b.dominantElement}로 변화`);
    } else {
      consensusItems.push(`최강 오행은 두 후보 모두 [${a.dominantElement}]로 변함없습니다.`);
    }

    // 3. 충/합 관계 비교
    if (a.clashCount !== b.clashCount || a.harmonyCount !== b.harmonyCount) {
      differenceItems.push(
        `관계 변동: 후보 A(합 ${a.harmonyCount}개 / 충 ${a.clashCount}개) vs 후보 B(합 ${b.harmonyCount}개 / 충 ${b.clashCount}개)`
      );
    }

    // 경계 민감도 지표 (0~100 연속값)
    // 시간 경계 오차가 작을수록(diffMinutes가 0에 가까울수록) + 엔진 점수 차이(strengthDiff)가 클수록 민감도 극대화
    const proximityScore = Math.max(0, 100 - (diffMinutes / 15) * 60); // 0분=100, 15분=40
    const divergenceScore = Math.min(100, strengthDiff * 3.5);
    const boundarySensitivity = Math.min(100.0, Math.round((proximityScore * 0.6 + divergenceScore * 0.4) * 100) / 100);

    const confidence = Math.max(50.0, Math.round((100.0 - boundarySensitivity * 0.35) * 100) / 100);

    const executiveSummary =
      `경계 시각(오차 ${diffMinutes}분)에 해당하여 ${a.label}와 ${b.label}를 독립 시뮬레이션했습니다. ` +
      `공통 결과 ${consensusItems.length}건, 시주 의존 분기 결과 ${differenceItems.length}건을 도출하였으며, ` +
      `경계 민감도는 ${boundarySensitivity.toFixed(2)}점, 신뢰도는 ${confidence.toFixed(2)}점입니다.`;

    return {
      hasBoundaryIssue: true,
      candidates: simulations,
      boundarySensitivity,
      confidence,
      consensusItems,
      differenceItems,
      executiveSummary,
    };
  }
}
