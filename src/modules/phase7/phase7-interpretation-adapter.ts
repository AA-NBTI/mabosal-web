/**
 * Phase 7: Interpretation Adapter & Extension Layer
 * 
 * 원칙:
 * 1. Phase 1~6 FROZEN 코드는 절대 수정하지 않습니다.
 * 2. Phase 6에서 정의된 InterpretationTheme 6종 중 미생성된 2개 테마를 완성합니다:
 *    - BUSINESS_VENTURE (사업·독립적 실행)
 *    - HEALTH_EQUILIBRIUM (건강·기혈 균형)
 * 3. 기존 MaSignal, Second Relationship, Fact 중 해당 테마와 직접 연결된 데이터만 엄격히 참조합니다.
 * 4. 새로운 명리학 규칙을 창작하지 않으며, 숫자 점수나 가중평균을 일절 사용하지 않습니다.
 * 5. 모든 InterpretationNode는 7대 필수 필드를 100% 구비하며, certainty는 계속 PROVISIONAL을 유지합니다.
 * 6. 근거 부족 시 절대 임의/허위 해석을 날조하지 않고, 보수적 잠복 상태로 안전하게 처리합니다.
 */

import { MaModuleInputFact, MaSignalSet, RuleCertainty } from '../ma/ma-types.js';
import { InterpretationFactory } from '../phase6/interpretation-node.js';
import {
  InterpretationNode,
  Phase6Output,
  RSIAssessment,
  SecondRelationshipMatch,
  TimeModulatorSignal,
} from '../phase6/phase6-types.js';

export interface CompleteInterpretationsParams {
  fact: MaModuleInputFact;
  signalSet: MaSignalSet;
  secondRelationships: SecondRelationshipMatch[];
  rsi: RSIAssessment;
  existingInterpretations: InterpretationNode[];
  timeModulatorSignals?: TimeModulatorSignal[];
}

export class Phase7InterpretationAdapter {
  /**
   * Phase 6의 기존 4대 해석 노드에 누락된 2개 테마(BUSINESS_VENTURE, HEALTH_EQUILIBRIUM)를 연결하여
   * 6대 해석 테마를 완전체로 완성합니다.
   */
  public complete6Themes(params: CompleteInterpretationsParams): InterpretationNode[] {
    const {
      fact,
      signalSet,
      secondRelationships,
      rsi,
      existingInterpretations,
      timeModulatorSignals = [],
    } = params;

    const completedNodes: InterpretationNode[] = [...existingInterpretations];

    // 1. BUSINESS_VENTURE (사업·독립적 실행) 노드 연결 (기존에 없을 경우에만 생성)
    if (!completedNodes.some(n => n.theme === 'BUSINESS_VENTURE')) {
      const businessNode = this.buildBusinessVentureNode(
        fact,
        signalSet,
        secondRelationships,
        rsi,
        timeModulatorSignals
      );
      completedNodes.push(businessNode);
    }

    // 2. HEALTH_EQUILIBRIUM (건강·기혈 균형) 노드 연결 (기존에 없을 경우에만 생성)
    if (!completedNodes.some(n => n.theme === 'HEALTH_EQUILIBRIUM')) {
      const healthNode = this.buildHealthEquilibriumNode(
        fact,
        signalSet,
        secondRelationships,
        rsi,
        timeModulatorSignals
      );
      completedNodes.push(healthNode);
    }

    return completedNodes;
  }

  /**
   * BUSINESS_VENTURE 테마 해석 노드 생성
   * 참조 신호: ma_business(사업마), ma_wealth(재물마), ma_social(인마)
   */
  private buildBusinessVentureNode(
    fact: MaModuleInputFact,
    signalSet: MaSignalSet,
    secondRelationships: SecondRelationshipMatch[],
    rsi: RSIAssessment,
    timeModulatorSignals: TimeModulatorSignal[]
  ): InterpretationNode {
    const businessSig = signalSet.signals['ma_business'];
    const wealthSig = signalSet.signals['ma_wealth'];
    const socialSig = signalSet.signals['ma_social'];

    // 근거 신호 부재 시 (안전 방어: 허위 해석 금지)
    if (!businessSig) {
      return InterpretationFactory.createNode({
        interpretationId: 'interp_business_restricted',
        theme: 'BUSINESS_VENTURE',
        primaryVerdict: '해당 테마를 뒷받침할 사업 신호가 충분하지 않아 보수적 잠복 상태로 유지됨',
        derivedFromSignals: [],
        factReferences: {
          pillarsInvolved: ['day'],
          tenGods: [],
          relationshipsUsed: [],
        },
        structure: {
          conclusion: '사업 실행 동력 평가 제한 상태',
          basis: {
            signals: [],
            facts: [`일간:${fact.day_stem}`],
          },
          relationshipAndRSIImpact: {
            rsiBand: rsi.band,
            activeSecondRelationships: [],
            impactSummary: `RSI ${rsi.band} 하에서 사업적 격발 인자 미약`,
          },
          actionableCaution: {
            guideline: '무리한 독자 창업이나 사업 확장을 지양하고 기존 안정적 기반에 집중하십시오.',
          },
        },
        certainty: 'PROVISIONAL',
        provisionalNote: '사업 관련 Ma 신호 부재로 인한 제한적 해석 노드입니다.',
      });
    }

    // 2차 관계 필터링 (사업 및 재물 관련)
    const activeSRs = secondRelationships
      .filter(r => r.targetModuleId === 'ma_business' || r.sourceModuleId === 'ma_business' || r.targetModuleId === 'ma_wealth')
      .map(r => r.description);

    const isAmplified = secondRelationships.some(
      r => r.targetModuleId === 'ma_business' && r.action === 'AMPLIFIED'
    );
    const isConflicted = secondRelationships.some(
      r => r.targetModuleId === 'ma_business' && r.action === 'CONFLICTING'
    );

    // 시간축 필터링
    const temporalContext = timeModulatorSignals
      .filter(t => t.targetModuleId === 'ma_business' || t.targetModuleId === 'ma_wealth')
      .map(t => ({
        timeScope: t.timeScope,
        targetModuleId: t.targetModuleId,
        description: t.description,
      }));

    // 결론 도출 (기존 MaSignal 상태 기반, 신규 명리 규칙 없음)
    let verdict = '전문 역량 및 상업적 기회를 접목한 점진적 독립 사업 탐색 및 실행 국면';
    if (businessSig.activation.state === 'DOMINANT') {
      verdict = '식상생재 유통과 일간 감당력이 결합된 적극적 독자 사업 및 시장 개척 주도 흐름';
    } else if (businessSig.activation.state === 'OVERBURDENED' || isConflicted) {
      verdict = '무리한 확장 압력 대비 유동성 리스크 및 동업자 간 지분/권리 갈등 완충 관리 필요';
    } else if (businessSig.activation.state === 'ACTIVE' && isAmplified) {
      verdict = '네트워크 협업과 재물 흐름이 맞물린 실질적 사업 기회 확장 국면';
    } else if (businessSig.activation.state === 'DORMANT') {
      verdict = '독립적 창업·사업보다는 기존 조직 기반 또는 안정적 네트워크 환경 유지가 유리한 국면 (사업 실행 동력 잠복)';
    }

    const certainty: RuleCertainty = 'PROVISIONAL';

    return InterpretationFactory.createNode({
      interpretationId: 'interp_business_venture',
      theme: 'BUSINESS_VENTURE',
      primaryVerdict: verdict,
      derivedFromSignals: [
        'ma_business',
        ...(wealthSig?.activation.isActivated ? ['ma_wealth'] : []),
        ...(socialSig?.activation.isActivated ? ['ma_social'] : []),
      ],
      factReferences: {
        pillarsInvolved: [...businessSig.referencedFacts.pillarsInvolved],
        tenGods: [...businessSig.referencedFacts.tenGods],
        relationshipsUsed: [...businessSig.referencedFacts.relationshipsUsed],
      },
      structure: {
        conclusion: verdict,
        basis: {
          signals: ['ma_business', ...(wealthSig?.activation.isActivated ? ['ma_wealth'] : [])],
          facts: [
            `일간:${fact.day_stem}`,
            `일간감당력:${fact.day_master_strength.classification}`,
            `사업성관련십신:${businessSig.referencedFacts.tenGods.join(',') || '무'}`,
          ],
        },
        relationshipAndRSIImpact: {
          rsiBand: rsi.band,
          activeSecondRelationships: activeSRs,
          impactSummary: `RSI ${rsi.band} 하에서 사업 변동성 및 자원 유통 영향 점검`,
        },
        temporalContext: temporalContext.length > 0 ? temporalContext : undefined,
        actionableCaution: {
          guideline: businessSig.activation.state === 'OVERBURDENED' || isConflicted
            ? '무리한 차입 확장을 피하고, 동업 및 거래 계약 시 권리와 의무를 공증으로 명확히 하십시오.'
            : businessSig.activation.state === 'DOMINANT'
            ? '초기 과열 투자를 지양하고, 시장의 실제 수요 검증을 바탕으로 단계적으로 실행하십시오.'
            : '고위험 독자 창업보다는 본업 기반의 전문 역량과 준비 자금을 먼저 비축하십시오.',
        },
      },
      certainty,
      provisionalNote: '사업 운용 평가는 Phase 7 해석 어댑터에 기반한 잠정 모델(PROVISIONAL)을 참조합니다.',
    });
  }

  /**
   * HEALTH_EQUILIBRIUM 테마 해석 노드 생성
   * 참조 신호: ma_health(건강마), ma_accident(사고마), 원국 오행 편중(five_elements)
   */
  private buildHealthEquilibriumNode(
    fact: MaModuleInputFact,
    signalSet: MaSignalSet,
    secondRelationships: SecondRelationshipMatch[],
    rsi: RSIAssessment,
    timeModulatorSignals: TimeModulatorSignal[]
  ): InterpretationNode {
    const healthSig = signalSet.signals['ma_health'];
    const accidentSig = signalSet.signals['ma_accident'];

    // 근거 신호 부재 시 (안전 방어: 허위 해석 금지)
    if (!healthSig) {
      return InterpretationFactory.createNode({
        interpretationId: 'interp_health_restricted',
        theme: 'HEALTH_EQUILIBRIUM',
        primaryVerdict: '해당 테마를 뒷받침할 건강 신호가 충분하지 않아 보수적 잠복 상태로 유지됨',
        derivedFromSignals: [],
        factReferences: {
          pillarsInvolved: ['day'],
          tenGods: [],
          relationshipsUsed: [],
        },
        structure: {
          conclusion: '신체 오행 기운 균형 평가 제한 상태',
          basis: {
            signals: [],
            facts: [`일간:${fact.day_stem}`],
          },
          relationshipAndRSIImpact: {
            rsiBand: rsi.band,
            activeSecondRelationships: [],
            impactSummary: `RSI ${rsi.band} 하에서 특이 기혈 긴장 미감응`,
          },
          actionableCaution: {
            cautionType: 'HEALTH_EQUILIBRIUM',
            guideline: '일상적인 건강 관리 및 규칙적인 생활 습관을 유지하십시오. (의학적 판단 대체 불가)',
          },
        },
        certainty: 'PROVISIONAL',
        provisionalNote: '건강 관련 Ma 신호 부재로 인한 제한적 해석 노드입니다.',
      });
    }

    // 2차 관계 필터링 (건강 및 사고 관련)
    const activeSRs = secondRelationships
      .filter(r => r.targetModuleId === 'ma_health' || r.sourceModuleId === 'ma_health' || r.targetModuleId === 'ma_accident')
      .map(r => r.description);

    const isMitigated = secondRelationships.some(
      r => r.targetModuleId === 'ma_health' && r.action === 'MITIGATED'
    );

    // 시간축 필터링
    const temporalContext = timeModulatorSignals
      .filter(t => t.targetModuleId === 'ma_health' || t.targetModuleId === 'ma_accident')
      .map(t => ({
        timeScope: t.timeScope,
        targetModuleId: t.targetModuleId,
        description: t.description,
      }));

    // 결론 도출 (명리학적 오행 편중 및 기혈 균형 중심, 의학적 진단/확률 예측 절대 배제)
    let verdict = '신체 오행 기운의 급격한 이상 반응 미감응 상태 (일상적 생활 리듬 유지)';
    if (healthSig.activation.state === 'DOMINANT' || healthSig.activation.state === 'ACTIVE') {
      verdict = '기혈 순환 및 오행의 상호 생조에 기반한 안정적 신체 활력과 항상성 유지';
    } else if (healthSig.activation.state === 'OVERBURDENED') {
      verdict = '오행의 극단적 편중 또는 극설 과다에 따른 에너지 소모 집중 및 피로 회복 리듬 관리 필요';
    } else if (healthSig.activation.state === 'TRIGGERED') {
      verdict = '환절기 또는 특정 오행 기운의 중첩에 따른 일시적 체력 기복 주의';
    }

    const certainty: RuleCertainty = 'PROVISIONAL';

    // 오행 편중 정보 추출
    const dominantElement = fact.five_elements?.dominantElement || '균형';
    const missingOrWeak = fact.five_elements?.missingElements?.length
      ? fact.five_elements.missingElements.join(',')
      : (fact.five_elements?.weakestElement || '무');

    return InterpretationFactory.createNode({
      interpretationId: 'interp_health_equilibrium',
      theme: 'HEALTH_EQUILIBRIUM',
      primaryVerdict: verdict,
      derivedFromSignals: [
        'ma_health',
        ...(accidentSig?.activation.isActivated ? ['ma_accident'] : []),
      ],
      factReferences: {
        pillarsInvolved: [...healthSig.referencedFacts.pillarsInvolved],
        tenGods: [...healthSig.referencedFacts.tenGods],
        relationshipsUsed: [...healthSig.referencedFacts.relationshipsUsed],
      },
      structure: {
        conclusion: verdict,
        basis: {
          signals: ['ma_health'],
          facts: [
            `일간:${fact.day_stem}`,
            `오행편중과다:${dominantElement}`,
            `오행결핍:${missingOrWeak}`,
            `일간체력감당:${fact.day_master_strength.classification}`,
          ],
        },
        relationshipAndRSIImpact: {
          rsiBand: rsi.band,
          activeSecondRelationships: activeSRs,
          impactSummary: `RSI ${rsi.band} 하에서 기혈 항상성 및 완충력(${isMitigated ? '완충 개입' : '통상'}) 점검`,
        },
        temporalContext: temporalContext.length > 0 ? temporalContext : undefined,
        actionableCaution: {
          cautionType: 'HEALTH_EQUILIBRIUM',
          guideline:
            '충분한 수면과 영양 섭취를 통해 기초 활력을 유지하고 과로를 피하십시오. (본 내용은 명리학적 오행 기운 참고 자료이며, 의학적 판단 및 진단은 반드시 전문 의료기관을 이용하십시오.)',
        },
      },
      certainty,
      provisionalNote:
        '본 해석은 명리학적 오행 균형 상태를 점검하는 잠정 지표(PROVISIONAL)이며, 의학적 진단이나 치료를 대체하지 않습니다.',
    });
  }
}
