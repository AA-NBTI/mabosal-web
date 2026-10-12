/**
 * Phase 6: Boundary / Missing Data Engine (경계시간 및 누락데이터 분석 총괄 엔진)
 * 
 * 모듈 원칙:
 * INPUT (PillarOutput + SajuCoreOutput) → PROCESS → OUTPUT (BoundaryOutput)
 * 출생시간 미상 시 임의 주입 없이 3주 분석 및 시간 의존도 식별,
 * 경계시간 시 복수 후보 시뮬레이션 및 Consensus/Difference 분리 출력을 수행합니다.
 */

import { BaseEngineModule } from '../../core/base-module.js';
import { PillarOutput } from '../pillar/pillar-engine.js';
import { SajuCoreOutput } from '../saju-core/saju-core-engine.js';
import { BoundarySimulationEngine, BoundarySimulationResult } from './boundary-simulation-engine.js';
import { MissingHourAssessment, MissingHourEngine } from './missing-hour-engine.js';

export interface BoundaryInput {
  pillar_output: PillarOutput;
  saju_core_output: SajuCoreOutput;
}

export interface BoundaryOutput {
  missing_hour: MissingHourAssessment;
  boundary_simulation: BoundarySimulationResult;
  overall_confidence: number; // 0 ~ 100
  is_boundary_sensitive: boolean;
  user_report: {
    summary: string;
    guidance: string;
    consensus: string[];
    differences: string[];
  };
}

export class BoundaryEngine extends BaseEngineModule<BoundaryInput, BoundaryOutput> {
  protected readonly moduleId = 'boundary_engine';
  protected readonly moduleVersion = '1.0.0';
  protected readonly ruleVersion = '2026.1';
  protected readonly inputSchemaName = 'BoundaryInput';
  protected readonly outputSchemaName = 'BoundaryOutput';

  private missingHourEngine = new MissingHourEngine();
  private simulationEngine = new BoundarySimulationEngine();

  protected validateInput(input: BoundaryInput): { isValid: boolean; reason?: string } {
    if (!input || !input.pillar_output || !input.saju_core_output) {
      return { isValid: false, reason: 'BoundaryInput 필수 필드 누락' };
    }
    return { isValid: true };
  }

  protected processInternal(input: BoundaryInput): {
    data: BoundaryOutput;
    confidence?: number;
    spec_gaps?: string[];
    notes?: string[];
  } {
    const notes: string[] = [];
    const spec_gaps: string[] = [];
    const pil = input.pillar_output;
    const core = input.saju_core_output;

    const isMissingHour = pil.hour_result.timeDependency.is_missing_hour;
    const isNearBoundary = pil.boundary_analysis.has_boundary_issue;
    const diffMinutes = pil.hour_result.hourBranch ? (pil.boundary_analysis.candidates[0]?.time_boundary_offset_minutes ?? 0) : 0;

    // 1. 출생시간 미상 평가
    const missingHourAssessment = this.missingHourEngine.assess(
      isMissingHour,
      core.day_master_strength,
      core.five_elements
    );

    // 2. 경계시간 복수 후보 시뮬레이션
    const simulationResult = this.simulationEngine.simulate(
      pil.boundary_analysis.candidates,
      pil,
      isNearBoundary,
      diffMinutes
    );

    // 3. 종합 신뢰도 산출
    let overallConfidence = 100.0;
    if (isMissingHour) {
      overallConfidence = missingHourAssessment.confidence;
      notes.push('출생시간 미상에 따라 종합 신뢰도가 조정되었습니다.');
    } else if (isNearBoundary) {
      overallConfidence = simulationResult.confidence;
      notes.push(`경계시간(${diffMinutes}분 오차)에 따라 종합 신뢰도가 조정되었습니다.`);
    }

    const isBoundarySensitive = simulationResult.boundarySensitivity >= 60.0;

    const userReport = {
      summary: isMissingHour
        ? '출생시간이 제공되지 않아 연·월·일 3기둥을 중심으로 분석을 진행했습니다.'
        : isNearBoundary
        ? simulationResult.executiveSummary
        : '정확한 출생시간에 기반하여 4기둥 전체가 안정적으로 확정되었습니다.',
      guidance: missingHourAssessment.userGuidanceMessage,
      consensus: simulationResult.consensusItems,
      differences: simulationResult.differenceItems,
    };

    const data: BoundaryOutput = {
      missing_hour: missingHourAssessment,
      boundary_simulation: simulationResult,
      overall_confidence: Math.round(overallConfidence * 100) / 100,
      is_boundary_sensitive: isBoundarySensitive,
      user_report: userReport,
    };

    return {
      data,
      confidence: overallConfidence,
      spec_gaps: spec_gaps.length > 0 ? spec_gaps : undefined,
      notes: notes.length > 0 ? notes : undefined,
    };
  }

  protected getFallbackData(input: BoundaryInput, errorReason: string): BoundaryOutput {
    return {
      missing_hour: {
        isMissingHour: true,
        timeDependencyScore: 100,
        confidence: 0,
        sensitiveAreas: [],
        userGuidanceMessage: errorReason,
      },
      boundary_simulation: {
        hasBoundaryIssue: false,
        candidates: [],
        boundarySensitivity: 0,
        confidence: 0,
        consensusItems: [],
        differenceItems: [],
        executiveSummary: errorReason,
      },
      overall_confidence: 0,
      is_boundary_sensitive: false,
      user_report: {
        summary: errorReason,
        guidance: '',
        consensus: [],
        differences: [],
      },
    };
  }
}
