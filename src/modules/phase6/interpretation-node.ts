/**
 * InterpretationNode Factory & Validation (Phase 6)
 * 
 * 원칙:
 * 1. Fact → Signal → Interpretation의 역추적성(Traceability)을 보장합니다.
 * 2. 원국 팩트(factReferences)와 엔진의 해석(primaryVerdict)을 명확히 구분합니다.
 * 3. certainty가 PROVISIONAL 또는 OPEN일 경우 provisionalNote를 의무적으로 기록합니다.
 */

import { TenGod } from '../../core/types.js';
import { MaId, RuleCertainty } from '../ma/ma-types.js';
import {
  InterpretationNode,
  InterpretationStructure,
  InterpretationTheme,
} from './phase6-types.js';

export interface CreateInterpretationParams {
  interpretationId: string;
  theme: InterpretationTheme;
  primaryVerdict: string;
  derivedFromSignals: MaId[];
  factReferences: {
    pillarsInvolved: ('year' | 'month' | 'day' | 'hour')[];
    tenGods: TenGod[];
    relationshipsUsed: string[];
    isSpouseFactReferenced?: boolean;
  };
  structure?: Partial<InterpretationStructure>;
  certainty: RuleCertainty;
  provisionalNote?: string;
}

export class InterpretationFactory {
  /**
   * 명리 사실 근거와 확정도가 투명하게 결합된 InterpretationNode를 생성합니다.
   */
  public static createNode(params: CreateInterpretationParams): InterpretationNode {
    // 확정도 규칙 검증: factReferences가 비어 있으면 안 됨
    if (
      !params.factReferences ||
      (params.factReferences.pillarsInvolved.length === 0 &&
        params.factReferences.tenGods.length === 0 &&
        params.factReferences.relationshipsUsed.length === 0)
    ) {
      throw new Error(
        `[Interpretation Error] ${params.interpretationId}: factReferences가 누락되었습니다. 원천 Fact 역추적 필수!`
      );
    }

    const isProvisional = params.certainty === 'PROVISIONAL' || params.certainty === 'OPEN';

    let note = params.provisionalNote;
    if (isProvisional && !note) {
      note = `본 해석은 잠정적 규칙(${params.certainty})에 기반한 보조 참고 지표입니다 (확정 단정 금지).`;
    }

    // 4단계 구조 조립 (결론 / 근거 / 2차 관계 및 RSI 영향 / 주의 및 대응)
    const structure: InterpretationStructure = {
      conclusion: params.structure?.conclusion ?? params.primaryVerdict,
      basis: {
        signals: params.structure?.basis?.signals ?? [...params.derivedFromSignals],
        facts: params.structure?.basis?.facts ?? [
          ...params.factReferences.tenGods.map(t => `십신:${t}`),
          ...params.factReferences.relationshipsUsed.map(r => `관계:${r}`),
        ],
      },
        relationshipAndRSIImpact: {
        rsiBand: params.structure?.relationshipAndRSIImpact?.rsiBand ?? 'LATENT',
        activeSecondRelationships: params.structure?.relationshipAndRSIImpact?.activeSecondRelationships ?? [],
        impactSummary:
          params.structure?.relationshipAndRSIImpact?.impactSummary ??
          '2차 관계 및 RSI 안정도 정성 영향 반영',
      },
      temporalContext: params.structure?.temporalContext,
      actionableCaution: {
        cautionType: params.structure?.actionableCaution?.cautionType,
        guideline:
          params.structure?.actionableCaution?.guideline ??
          '원국 기운의 흐름에 맞춰 주체적으로 대응하십시오.',
      },
    };

    return {
      interpretationId: params.interpretationId,
      theme: params.theme,
      primaryVerdict: params.primaryVerdict,
      derivedFromSignals: [...params.derivedFromSignals],
      factReferences: {
        pillarsInvolved: [...params.factReferences.pillarsInvolved],
        tenGods: [...params.factReferences.tenGods],
        relationshipsUsed: [...params.factReferences.relationshipsUsed],
        isSpouseFactReferenced: params.factReferences.isSpouseFactReferenced ?? false,
      },
      structure,
      certainty: params.certainty,
      provisionalNote: note,
    };
  }
}
