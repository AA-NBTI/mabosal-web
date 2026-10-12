/**
 * RSI Engine (Relationship Stability Index Engine - Phase 6)
 * 
 * 원칙:
 * 1. Phase 1~4 Fact와 Phase 5 MaSignalSet을 연결하여 Cohesion / Tension / Resilience를 정성 산출합니다.
 * 2. RSIDecisionMatrix를 통해 비선형 4대 밴드(SERENE, BALANCED_TENSION, TURBULENT, LATENT)를 결정합니다.
 * 3. 숫자 점수, 가중평균, 임의의 비율 계산은 전면 배제합니다.
 * 4. 결과는 certainty: 'PROVISIONAL', evidenceLevel: 'PROVISIONAL'로 엄격 격리합니다.
 * 5. 원천 Fact 및 Signal에 대한 완벽한 Traceability를 제공합니다.
 */

import { MaModuleInputFact, MaSignalSet } from '../ma/ma-types.js';
import {
  CohesionLevel,
  ResilienceLevel,
  RSIAssessment,
  TensionLevel,
} from './phase6-types.js';
import { RSIDecisionMatrix } from './rsi-matrix.js';

export class RSIEngine {
  /**
   * Phase 1~4 원국 Fact 및 Phase 5 SignalSet을 바탕으로 RSI를 정성 평가합니다.
   * 원본 데이터는 절대 변경되지 않습니다.
   */
  public evaluate(fact: MaModuleInputFact, signalSet: MaSignalSet): RSIAssessment {
    const cohesion = this.deriveCohesion(fact, signalSet);
    const tension = this.deriveTension(fact, signalSet);
    const resilience = this.deriveResilience(fact, signalSet);

    const isDayMasterExtremeWeak = fact.day_master_strength.classification === '극약';

    const matrixResult = RSIDecisionMatrix.evaluate({
      cohesion,
      tension,
      resilience,
      isDayMasterExtremeWeak,
    });

    // Traceability 구축
    const derivedFromSignals: string[] = [];
    if (signalSet.signals['ma_accident']?.activation.isActivated) derivedFromSignals.push('ma_accident');
    if (signalSet.signals['ma_gossip']?.activation.isActivated) derivedFromSignals.push('ma_gossip');
    if (signalSet.signals['ma_noble']?.activation.isActivated) derivedFromSignals.push('ma_noble');
    if (signalSet.signals['ma_career']?.activation.isActivated) derivedFromSignals.push('ma_career');
    if (signalSet.signals['ma_wealth']?.activation.isActivated) derivedFromSignals.push('ma_wealth');

    const derivedFromFacts: string[] = [
      `일간강약:${fact.day_master_strength.classification}`,
      `득지여부:${fact.day_master_strength.isDeukJi}`,
      `지지충:${fact.branch_clashes.map(c => c.name).join(',') || '무'}`,
      `지지합:${fact.branch_harmonies.map(h => h.name).join(',') || '무'}`,
      `형살:${fact.branch_punishments.map(p => p.name).join(',') || '무'}`,
    ];

    return {
      cohesion: matrixResult.cohesion,
      tension: matrixResult.tension,
      resilience: matrixResult.resilience,
      band: matrixResult.band,
      reasoning: matrixResult.reasoning,
      isExceptionApplied: matrixResult.isExceptionApplied,
      certainty: 'PROVISIONAL',
      evidenceLevel: 'PROVISIONAL',
      phaseOrigin: 'PHASE_6',
      derivedFromSignals,
      derivedFromFacts,
    };
  }

  /**
   * 구조 응집도 (Cohesion) 정성 도출:
   * 합국(삼합/방합/육합), 상생 유통, 구심점 여부 평가
   */
  private deriveCohesion(fact: MaModuleInputFact, signalSet: MaSignalSet): CohesionLevel {
    const hasHarmonies = fact.branch_harmonies.length > 0;
    const hasSmoothFlow = fact.flow_channels ? fact.flow_channels.gwan_in_saeng > 50 || fact.flow_channels.shiksang_saeng_jae > 50 : false;
    const hasExtremeMissing = fact.five_elements.missingElements.length >= 2;

    if (hasExtremeMissing && !hasHarmonies) {
      return 'FRAGILE';
    }

    if (hasHarmonies && (hasSmoothFlow || fact.day_master_strength.isDeukRyeong)) {
      return 'STABLE';
    }

    if (hasHarmonies || hasSmoothFlow) {
      return 'MODERATE';
    }

    return 'FRAGILE';
  }

  /**
   * 동적 장력 (Tension) 정성 도출:
   * 인접 육충, 완전 삼형살, 극살 대치, 사고/구설마 과열 여부 평가
   */
  private deriveTension(fact: MaModuleInputFact, signalSet: MaSignalSet): TensionLevel {
    const hasAdjacentClash = fact.branch_clashes.some(c => c.distance === 1);
    const hasPunishment = fact.branch_punishments.length > 0;
    const isAccidentOverburdened = signalSet.signals['ma_accident']?.activation.state === 'OVERBURDENED';
    const isGossipOverburdened = signalSet.signals['ma_gossip']?.activation.state === 'OVERBURDENED';

    if (hasAdjacentClash || hasPunishment || isAccidentOverburdened || isGossipOverburdened) {
      return 'CRITICAL';
    }

    const hasAnyClash = fact.branch_clashes.length > 0;
    const hasMinorRelation = fact.minor_relations.length > 0;
    const isConflictActive = signalSet.signals['ma_gossip']?.activation.isActivated;

    if (hasAnyClash || hasMinorRelation || isConflictActive) {
      return 'TENSE';
    }

    return 'LOW';
  }

  /**
   * 완충 탄력성 (Resilience) 정성 도출:
   * 일간 득지(근), 탐합망충 완화, 천을귀인(귀인마), 인성 보호 여부 평가
   */
  private deriveResilience(fact: MaModuleInputFact, signalSet: MaSignalSet): ResilienceLevel {
    const isDayRooted = fact.day_master_strength.isDeukJi || fact.rootings.dayStem.rootingScore >= 50;
    const isNobleActive = signalSet.signals['ma_noble']?.activation.isActivated;
    const hasMitigation = fact.branch_clashes.some(c => c.interaction.isMitigated);

    if (fact.day_master_strength.classification === '극약' && !hasMitigation && !isNobleActive) {
      return 'DEFICIENT';
    }

    if (isDayRooted && (isNobleActive || hasMitigation)) {
      return 'HIGH';
    }

    if (isDayRooted || isNobleActive || hasMitigation) {
      return 'PARTIAL';
    }

    return 'DEFICIENT';
  }
}
