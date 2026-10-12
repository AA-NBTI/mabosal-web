/**
 * Phase 9: Interaction / Confidence Engine (상호작용 및 종합 신뢰도 총괄 엔진)
 * 
 * 모듈 원칙:
 * INPUT (MaModuleEngineOutput + BoundaryOutput) → PROCESS → OUTPUT (InteractionConfidenceOutput)
 * 마 간 시너지/마찰 및 핵심 재물 리스크 공식 계산,
 * 종합 신뢰도 0~100 연속 점수 및 감점 내역을 산출합니다.
 */

import { BaseEngineModule } from '../../core/base-module.js';
import { BoundaryOutput } from '../boundary/boundary-engine.js';
import { MaModuleEngineOutput } from '../ma/ma-module-engine.js';
import { ConfidenceAssessment, ConfidenceEngine } from './confidence-engine.js';
import { InteractionEngine, InteractionOutput } from './interaction-engine.js';

export interface InteractionConfidenceInput {
  ma_output: MaModuleEngineOutput;
  boundary: BoundaryOutput;
}

export interface InteractionConfidenceOutput {
  interaction: InteractionOutput;
  confidence: ConfidenceAssessment;
}

export class InteractionConfidenceEngine extends BaseEngineModule<
  InteractionConfidenceInput,
  InteractionConfidenceOutput
> {
  protected readonly moduleId = 'interaction_confidence_engine';
  protected readonly moduleVersion = '1.0.0';
  protected readonly ruleVersion = '2026.1';
  protected readonly inputSchemaName = 'InteractionConfidenceInput';
  protected readonly outputSchemaName = 'InteractionConfidenceOutput';

  private interactionEngine = new InteractionEngine();
  private confidenceEngine = new ConfidenceEngine();

  protected validateInput(input: InteractionConfidenceInput): { isValid: boolean; reason?: string } {
    if (!input || !input.ma_output || !input.boundary) {
      return { isValid: false, reason: 'InteractionConfidenceInput ma_output 또는 boundary 누락' };
    }
    return { isValid: true };
  }

  protected processInternal(input: InteractionConfidenceInput): {
    data: InteractionConfidenceOutput;
    confidence?: number;
    spec_gaps?: string[];
    notes?: string[];
  } {
    const notes: string[] = [];
    const spec_gaps: string[] = [];

    // 1. 마 간 상호작용 분석
    const interaction = this.interactionEngine.analyze(input.ma_output);

    // 2. 전체 엔진 신뢰도 평가
    const confidenceAssessment = this.confidenceEngine.evaluate(input.boundary, input.ma_output);

    const data: InteractionConfidenceOutput = {
      interaction,
      confidence: confidenceAssessment,
    };

    return {
      data,
      confidence: confidenceAssessment.overallScore,
      spec_gaps: spec_gaps.length > 0 ? spec_gaps : undefined,
      notes: notes.length > 0 ? notes : undefined,
    };
  }

  protected getFallbackData(
    input: InteractionConfidenceInput,
    errorReason: string
  ): InteractionConfidenceOutput {
    return {
      interaction: {
        coreWealthRiskIndex: 0,
        interactionPairs: [],
        dominantSynergy: null,
        dominantFriction: null,
      },
      confidence: {
        overallScore: 50,
        confidenceGrade: '주의 (60점대 이하)',
        deductions: [{ factor: '엔진 장애', penalty: 50, note: errorReason }],
        isTimeMissing: true,
        isBoundaryIssue: false,
        summaryMessage: errorReason,
      },
    };
  }
}
