/**
 * Phase 6 Pipeline Engine
 * 
 * 처리 순서 고정:
 * P1~P4 Fact → P5 MaSignalSet → Second Relationship → RSI → Interpretation 입력
 * 
 * 원칙:
 * 1. Phase 6 결과가 P1~P5 원본을 역으로 변경하지 않음 (불변성 강제 검증).
 * 2. 모든 Phase 6 산출물은 certainty: 'PROVISIONAL', evidenceLevel: 'PROVISIONAL'을 유지.
 */

import { MaModuleInputFact, MaSignalSet } from '../ma/ma-types.js';
import { InterpretationEngine } from './interpretation-engine.js';
import { Phase6Output, TimeModulatorSignal } from './phase6-types.js';
import { RSIEngine } from './rsi-engine.js';
import { SecondRelationshipEngine } from './second-relationship.js';
import { TimeModulatorGuard } from './time-modulator.js';

export interface ExecutePhase6Params {
  fact: MaModuleInputFact;
  signalSet: MaSignalSet;
  timeModulatorSignals?: TimeModulatorSignal[];
}

export class Phase6Pipeline {
  private secondRelationshipEngine = new SecondRelationshipEngine();
  private rsiEngine = new RSIEngine();
  private interpretationEngine = new InterpretationEngine();

  /**
   * 고정된 순서로 2차 관계, RSI, TimeModulatorSignal, InterpretationNode를 실행하고 원본 불변성을 검증합니다.
   * 처리 순서: P1~P4 Fact → P5 MaSignalSet → Second Relationship → RSI → TimeModulatorSignal → InterpretationNode
   */
  public execute(params: ExecutePhase6Params): Phase6Output {
    const { fact, signalSet, timeModulatorSignals = [] } = params;

    // 1. 원본 MaSignalSet 상태 스냅샷 저장 (불변성 검사용)
    const snapshotStateMap = new Map<string, string>();
    for (const [id, signal] of Object.entries(signalSet.signals)) {
      snapshotStateMap.set(id, signal.activation.state);
    }

    // 2. Second Relationship Layer 실행 (Signal ↔ Signal 연쇄 탐지)
    const secondRelationships = this.secondRelationshipEngine.evaluate(signalSet);

    // 3. Non-Linear RSI Engine 실행 (정성 3대 축 및 매트릭스 판정 - 시간축 미개입 순수 원국 안정도)
    const rsi = this.rsiEngine.evaluate(fact, signalSet);

    // 4. Interpretation Engine 실행 (TimeModulatorSignal을 전달하여 시점 의미 보조)
    const interpretations = this.interpretationEngine.generateInterpretations({
      fact,
      signalSet,
      secondRelationships,
      rsi,
      timeModulatorSignals,
    });

    // 5. 원본 불변성 검증 (Phase 6 연산 및 시간축이 P5 MaSignalSet을 변경했는지 여부)
    const immutabilityVerified = TimeModulatorGuard.verifyOriginalSignalImmutability(
      signalSet,
      snapshotStateMap
    );

    if (!immutabilityVerified) {
      throw new Error('[Phase 6 Pipeline Error] 원본 MaSignalSet이 변조되었습니다. 원본 불변 원칙 위반!');
    }

    return {
      secondRelationships,
      rsi,
      interpretations,
      immutabilityVerified,
      timeModulatorSignals: timeModulatorSignals.length > 0 ? timeModulatorSignals : undefined,
    };
  }
}
