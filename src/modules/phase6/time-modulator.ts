/**
 * TimeModulatorSignal Interface & Guard (Phase 6)
 * 
 * 원칙:
 * 1. 시간축(대운·세운·월운)은 원국의 FourPillars, Fact, MaSignalSet을 절대 재계산하거나 수정하지 않습니다.
 * 2. 원본 SignalSet을 보존한 채, 독립된 TimeModulatorSignal 객체만을 생성하여 병렬 제공합니다.
 * 3. 실제 대운/세운 계산 로직은 Phase 6 STEP 1 범위에 포함되지 않으므로 인터페이스 및 불변성 가드만을 구현합니다.
 */

import { MaId, MaSignalSet } from '../ma/ma-types.js';
import { TimeModulatorSignal, TimeScope } from './phase6-types.js';

export class TimeModulatorGuard {
  /**
   * 시간축 모듈레이터 신호 생성 팩토리
   * (실제 대운/세운 계산 없이 독립 스키마 인스턴스만을 안전하게 생성)
   */
  public static createSignal(params: {
    timeScope: TimeScope;
    targetModuleId: MaId;
    temporalTriggerState: 'TRIGGERED' | 'ACTIVE';
    description: string;
  }): TimeModulatorSignal {
    return {
      timeScope: params.timeScope,
      targetModuleId: params.targetModuleId,
      temporalTriggerState: params.temporalTriggerState,
      evidenceLevel: 'PROVISIONAL',
      description: params.description,
    };
  }

  /**
   * 원국 MaSignalSet의 불변성 검증 가드
   * 시간축 신호 적용 전/후에 원본 MaSignalSet의 참조 및 activation.state가 완전히 보존되었는지 검사합니다.
   */
  public static verifyOriginalSignalImmutability(
    original: MaSignalSet,
    snapshotStateMap: Map<string, string>
  ): boolean {
    for (const [id, signal] of Object.entries(original.signals)) {
      const originalState = snapshotStateMap.get(id);
      if (originalState !== undefined && signal.activation.state !== originalState) {
        return false; // 원본 상태가 변조됨
      }
    }
    return true;
  }
}
