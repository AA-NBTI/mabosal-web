/**
 * Phase 7 Pipeline Engine (6대 Interpretation Theme 완성)
 * 
 * 원칙:
 * 1. Phase 1~6 FROZEN 파이프라인을 그대로 실행하여 기본 4대 테마와 Second Relationship, RSI를 산출합니다.
 * 2. Phase 7 Interpretation Adapter를 통해 누락된 2개 테마(BUSINESS_VENTURE, HEALTH_EQUILIBRIUM)를 확장 연결하여
 *    총 6대 테마를 온전하게 완성합니다.
 * 3. 원본 Fact 및 MaSignalSet에 대한 불변성을 재검증합니다.
 */

import { MaModuleInputFact, MaSignalSet } from '../ma/ma-types.js';
import { ExecutePhase6Params, Phase6Pipeline } from '../phase6/phase6-pipeline.js';
import { InterpretationNode, Phase6Output, TimeModulatorSignal } from '../phase6/phase6-types.js';
import { TimeModulatorGuard } from '../phase6/time-modulator.js';
import { Phase7InterpretationAdapter } from './phase7-interpretation-adapter.js';

export interface Phase7Output extends Phase6Output {
  interpretations: InterpretationNode[]; // 6대 테마 완전체
}

export class Phase7Pipeline {
  private phase6Pipeline = new Phase6Pipeline();
  private interpretationAdapter = new Phase7InterpretationAdapter();

  /**
   * P1~P6 파이프라인을 온전히 실행한 후, Phase 7 어댑터를 통해 6대 테마 전체를 완성합니다.
   */
  public execute(params: ExecutePhase6Params): Phase7Output {
    const { fact, signalSet, timeModulatorSignals = [] } = params;

    // 1. 원본 스냅샷 기록 (Phase 7 전체 전후 불변성 검증용)
    const snapshotStateMap = new Map<string, string>();
    for (const [id, signal] of Object.entries(signalSet.signals)) {
      snapshotStateMap.set(id, signal.activation.state);
    }

    // 2. Phase 6 Frozen Pipeline 실행 (Second Relationship → RSI → 기본 4대 Interpretation)
    const phase6Output = this.phase6Pipeline.execute(params);

    // 3. Phase 7 Interpretation Adapter 실행 (BUSINESS_VENTURE, HEALTH_EQUILIBRIUM 연결 → 6대 테마 완성)
    const completedInterpretations = this.interpretationAdapter.complete6Themes({
      fact,
      signalSet,
      secondRelationships: phase6Output.secondRelationships,
      rsi: phase6Output.rsi,
      existingInterpretations: phase6Output.interpretations,
      timeModulatorSignals,
    });

    // 4. 불변성 재검증
    const immutabilityVerified = TimeModulatorGuard.verifyOriginalSignalImmutability(
      signalSet,
      snapshotStateMap
    );

    if (!immutabilityVerified) {
      throw new Error('[Phase 7 Pipeline Error] 원본 MaSignalSet이 변조되었습니다. 불변 원칙 위반!');
    }

    return {
      ...phase6Output,
      interpretations: completedInterpretations,
      immutabilityVerified,
    };
  }
}
