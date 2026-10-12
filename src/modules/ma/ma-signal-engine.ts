/**
 * Ma Signal 통합·검증 Engine (Phase 5 STEP 3)
 * 
 * 21개 Ma의 개별 평가 결과를 MaSignalSet으로 통합하고,
 * Fact → Signal 추적성 및 상호작용, 안전/불확실성 메타데이터를 총괄 검증하는 통합 엔진
 * 
 * 원칙:
 * 1. 21개 Ma 평가 결과의 완전한 통합 및 상태별 분류 보존
 * 2. 개별 Ma의 Activation 상태(state)는 상호작용에 의해 임의 변경되지 않음 (독립 판정 보존)
 * 3. 모든 Signal은 참조한 Phase 1~5 Fact의 추적성(Traceability)을 보존
 * 4. PROVISIONAL / OPEN 등급은 확정 사실과 엄격히 분리하여 안전 보고서에 명시
 * 5. 건강, 사고, 법률 주제에 대한 안전 가이드라인(safetyAlerts) 수집 및 제공
 */

import { MaActivationEngine } from './activation-engine.js';
import { MaInteractionEngine } from './interaction-engine.js';
import {
  MaId,
  MaModuleInputFact,
  MaSignalEntity,
  MaSignalSet,
  RuleCertainty,
  SignalTraceInfo,
} from './ma-types.js';

export class MaSignalEngine {
  private activationEngine = new MaActivationEngine();
  private interactionEngine = new MaInteractionEngine();

  /**
   * Phase 5 Fact를 주입받아 21개 Ma Signal을 도출하고 통합 SignalSet을 생성합니다.
   */
  public process(fact: MaModuleInputFact): MaSignalSet {
    // 1. 21개 Ma 개별 활성화 및 5축 독립 평가
    const rawSignalsMap = this.activationEngine.evaluateAll(fact);

    // 2. Ma 간 상호작용 도출 (원본 activation.state 불변 원칙 준수)
    const interactions = this.interactionEngine.evaluateInteractions(rawSignalsMap);

    // 3. 신호 객체 사전 및 상태별 리스트 분류
    const signals: Record<string, MaSignalEntity> = {};
    const dominantSignals: MaSignalEntity[] = [];
    const activeSignals: MaSignalEntity[] = [];
    const overburdenedSignals: MaSignalEntity[] = [];
    const triggeredSignals: MaSignalEntity[] = [];
    const dormantSignals: MaSignalEntity[] = [];
    const provisionalSignals: MaSignalEntity[] = [];
    const traceability: Record<string, SignalTraceInfo> = {};
    const safetyAlerts: MaSignalSet['safetyAlerts'] = [];

    let confirmedCount = 0;
    let phase5ConfirmedCount = 0;
    let provisionalCount = 0;
    let openCount = 0;

    for (const [id, signal] of rawSignalsMap.entries()) {
      signals[id] = signal;

      // 상태별 분류
      switch (signal.activation.state) {
        case 'DOMINANT':
          dominantSignals.push(signal);
          break;
        case 'ACTIVE':
          activeSignals.push(signal);
          break;
        case 'OVERBURDENED':
          overburdenedSignals.push(signal);
          break;
        case 'TRIGGERED':
          triggeredSignals.push(signal);
          break;
        case 'DORMANT':
          dormantSignals.push(signal);
          break;
      }

      // 확정도 집계 및 PROVISIONAL 분리
      const cert = signal.activation.certainty;
      if (cert === 'CONFIRMED') confirmedCount++;
      else if (cert === 'PHASE5_CONFIRMED') phase5ConfirmedCount++;
      else if (cert === 'PROVISIONAL') {
        provisionalCount++;
        provisionalSignals.push(signal);
      } else if (cert === 'OPEN') {
        openCount++;
        provisionalSignals.push(signal);
      }

      // 추적성(Traceability) 정보 구축
      const hasSpouseLayer = id === 'ma_marriage' || id === 'ma_romance';
      traceability[id] = {
        moduleId: id,
        ruleCertainty: cert,
        pillarsInvolved: [...signal.referencedFacts.pillarsInvolved],
        tenGods: [...signal.referencedFacts.tenGods],
        relationshipsUsed: [...signal.referencedFacts.relationshipsUsed],
        hasSpouseFactLayer: hasSpouseLayer,
        isProvisional: cert === 'PROVISIONAL' || cert === 'OPEN',
      };

      // 안전 가이드라인 수집
      if (signal.safetyGuideline && signal.safetyGuideline.isRestrictedTopic) {
        safetyAlerts.push({
          moduleId: id,
          cautionType: signal.safetyGuideline.cautionType,
          contextNote: signal.safetyGuideline.contextNote,
        });
      }
    }

    return {
      signals,
      dominantSignals,
      activeSignals,
      overburdenedSignals,
      triggeredSignals,
      dormantSignals,
      interactions,
      traceability,
      safetyAlerts,
      provisionalSignals,
      confirmedCount,
      phase5ConfirmedCount,
      provisionalCount,
      openCount,
    };
  }
}
