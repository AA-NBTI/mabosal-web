/**
 * Interpretation Engine (Phase 6 STEP 3)
 * 
 * 입력 순서 고정:
 * P1~P4 Fact → P5 MaSignalSet → Second Relationship → RSI → InterpretationNode
 * 
 * 원칙:
 * 1. 기존 Fact와 Signal을 읽기 전용(Read-Only)으로만 소비하며 절대 수정하지 않습니다.
 * 2. 모든 해석은 원천 Fact(천간, 지지, 십신, 관계)까지 완전 역추적 가능해야 합니다.
 * 3. 각 InterpretationNode는 내부적으로 4단계 구조를 갖습니다:
 *    [1. 결론] → [2. 근거 Fact/Signal] → [3. 2차 관계 및 RSI 영향] → [4. 주의 또는 대응 방향]
 * 4. 확정도: Phase 6 해석 규칙은 초기 PROVISIONAL로 격리하며, 단정형 표현을 금지합니다.
 * 5. 최종 캐릭터 말투 및 문체는 다음 단계(STEP 4)로 분리하고, 본 단계에서는 구조화된 내용만 생성합니다.
 */

import { MaModuleInputFact, MaSignalSet, RuleCertainty } from '../ma/ma-types.js';
import { InterpretationFactory } from './interpretation-node.js';
import {
  InterpretationNode,
  InterpretationTheme,
  RSIAssessment,
  SecondRelationshipMatch,
  TimeModulatorSignal,
} from './phase6-types.js';

export interface GenerateInterpretationParams {
  fact: MaModuleInputFact;
  signalSet: MaSignalSet;
  secondRelationships: SecondRelationshipMatch[];
  rsi: RSIAssessment;
  timeModulatorSignals?: TimeModulatorSignal[];
}

export class InterpretationEngine {
  /**
   * P1~P4 Fact, P5 SignalSet, 2차 관계, RSI, TimeModulatorSignal을 취합하여 테마별 InterpretationNode 배열을 생성합니다.
   * 원본 데이터는 절대 변경되지 않으며, 시간축 신호는 오직 해석 보조 컨텍스트(temporalContext)로만 활용됩니다.
   */
  public generateInterpretations(params: GenerateInterpretationParams): InterpretationNode[] {
    const { fact, signalSet, secondRelationships, rsi, timeModulatorSignals = [] } = params;
    const nodes: InterpretationNode[] = [];

    // 1. 커리어·조직 성취 (CAREER_ORGANIZATION)
    const careerInterp = this.interpretCareer(fact, signalSet, secondRelationships, rsi, timeModulatorSignals);
    if (careerInterp) nodes.push(careerInterp);

    // 2. 재물·자산 흐름 (WEALTH_FLOW)
    const wealthInterp = this.interpretWealth(fact, signalSet, secondRelationships, rsi, timeModulatorSignals);
    if (wealthInterp) nodes.push(wealthInterp);

    // 3. 관계·결혼·유대 (RELATIONSHIP_BOND)
    const relationInterp = this.interpretRelationship(fact, signalSet, secondRelationships, rsi, timeModulatorSignals);
    if (relationInterp) nodes.push(relationInterp);

    // 4. 안전·사고·법률 (SAFETY_MOVEMENT)
    const safetyInterp = this.interpretSafety(fact, signalSet, secondRelationships, rsi, timeModulatorSignals);
    if (safetyInterp) nodes.push(safetyInterp);

    return nodes;
  }

  /**
   * 커리어·조직 성취 해석
   */
  private interpretCareer(
    fact: MaModuleInputFact,
    signalSet: MaSignalSet,
    secondRelationships: SecondRelationshipMatch[],
    rsi: RSIAssessment,
    timeModulatorSignals: TimeModulatorSignal[]
  ): InterpretationNode | null {
    const careerSig = signalSet.signals['ma_career'];
    const docSig = signalSet.signals['ma_document'];
    if (!careerSig) return null;

    const activeSRs = secondRelationships
      .filter(r => r.targetModuleId === 'ma_career' || r.sourceModuleId === 'ma_career')
      .map(r => r.description);

    const isAmplified = secondRelationships.some(r => r.targetModuleId === 'ma_career' && r.action === 'AMPLIFIED');
    const isConflicted = secondRelationships.some(r => r.targetModuleId === 'ma_career' && r.action === 'CONFLICTING');

    // 시간축 신호 필터링 (CAREER 관련 모듈)
    const temporalContext = timeModulatorSignals
      .filter(t => t.targetModuleId === 'ma_career' || t.targetModuleId === 'ma_document')
      .map(t => ({
        timeScope: t.timeScope,
        targetModuleId: t.targetModuleId,
        description: t.description,
      }));

    let verdict = '조직 내 역할 수행 및 통상적 업무 흐름 유지';
    if (careerSig.activation.state === 'DOMINANT') {
      verdict = '관성격 청기 및 관인상생에 따른 주도적 직무 권한 및 공인 자격 확보';
    } else if (careerSig.activation.state === 'OVERBURDENED' || isConflicted) {
      verdict = '상관견관 또는 조직 내 마찰로 인한 직무 압박 가중 및 완충 전략 필요';
    } else if (careerSig.activation.state === 'ACTIVE' && isAmplified) {
      verdict = '문서 자격과 연계된 안정적 직무 기회 및 전문성 확장 국면';
    }

    const certainty: RuleCertainty = 'PROVISIONAL';

    return InterpretationFactory.createNode({
      interpretationId: 'interp_career',
      theme: 'CAREER_ORGANIZATION',
      primaryVerdict: verdict,
      derivedFromSignals: ['ma_career', ...(docSig?.activation.isActivated ? ['ma_document'] : [])],
      factReferences: {
        pillarsInvolved: [...careerSig.referencedFacts.pillarsInvolved],
        tenGods: [...careerSig.referencedFacts.tenGods],
        relationshipsUsed: [...careerSig.referencedFacts.relationshipsUsed],
      },
      structure: {
        conclusion: verdict,
        basis: {
          signals: ['ma_career', ...(docSig?.activation.isActivated ? ['ma_document'] : [])],
          facts: [`일간:${fact.day_stem}`, `격국:${fact.ten_gods.month.branchMainTenGod}격`],
        },
        relationshipAndRSIImpact: {
          rsiBand: rsi.band,
          activeSecondRelationships: activeSRs,
          impactSummary: `RSI ${rsi.band} 상태 및 2차 관계(${activeSRs.length}건) 정성 영향`,
        },
        temporalContext: temporalContext.length > 0 ? temporalContext : undefined,
        actionableCaution: {
          guideline: isConflicted
            ? '조직 내 발언과 규율 준수에 유의하고 문서 결재 라인을 엄격히 점검하십시오.'
            : '주어진 직무 권한을 바탕으로 차분하게 전문 역량을 축적하십시오.',
        },
      },
      certainty,
      provisionalNote: '본 해석은 2차 관계 및 비선형 RSI 연계 잠정 모델(PROVISIONAL)을 참조합니다.',
    });
  }

  /**
   * 재물·자산 흐름 해석
   */
  private interpretWealth(
    fact: MaModuleInputFact,
    signalSet: MaSignalSet,
    secondRelationships: SecondRelationshipMatch[],
    rsi: RSIAssessment,
    timeModulatorSignals: TimeModulatorSignal[]
  ): InterpretationNode | null {
    const wealthSig = signalSet.signals['ma_wealth'];
    const assetSig = signalSet.signals['ma_asset'];
    if (!wealthSig) return null;

    const activeSRs = secondRelationships
      .filter(r => r.targetModuleId === 'ma_wealth' || r.sourceModuleId === 'ma_wealth' || r.targetModuleId === 'ma_asset')
      .map(r => r.description);

    const temporalContext = timeModulatorSignals
      .filter(t => t.targetModuleId === 'ma_wealth' || t.targetModuleId === 'ma_asset')
      .map(t => ({
        timeScope: t.timeScope,
        targetModuleId: t.targetModuleId,
        description: t.description,
      }));

    let verdict = '유동 재물과 고정 자산의 완만한 순환 국면';
    if (wealthSig.activation.state === 'DOMINANT') {
      verdict = '식상생재 유통과 일간 감당력이 결합된 생산적 재물 성취 흐름';
    } else if (wealthSig.activation.state === 'OVERBURDENED') {
      verdict = '재성 과다 및 군겁쟁재 압력에 따른 유동성 관리 주의 국면';
    }

    return InterpretationFactory.createNode({
      interpretationId: 'interp_wealth',
      theme: 'WEALTH_FLOW',
      primaryVerdict: verdict,
      derivedFromSignals: ['ma_wealth', ...(assetSig?.activation.isActivated ? ['ma_asset'] : [])],
      factReferences: {
        pillarsInvolved: [...wealthSig.referencedFacts.pillarsInvolved],
        tenGods: [...wealthSig.referencedFacts.tenGods],
        relationshipsUsed: [...wealthSig.referencedFacts.relationshipsUsed],
      },
      structure: {
        conclusion: verdict,
        basis: {
          signals: ['ma_wealth'],
          facts: [`재성투간:${wealthSig.referencedFacts.tenGods.join(',')}`],
        },
        relationshipAndRSIImpact: {
          rsiBand: rsi.band,
          activeSecondRelationships: activeSRs,
          impactSummary: `RSI ${rsi.band} 하에서 자산 창고화 및 전이 작용 점검`,
        },
        temporalContext: temporalContext.length > 0 ? temporalContext : undefined,
        actionableCaution: {
          guideline: wealthSig.activation.state === 'OVERBURDENED'
            ? '무리한 확장보다는 현금 유동성을 보수적으로 확보하고 동업 갈등을 경계하십시오.'
            : '생산적 활동을 통해 발생한 유동 이익을 안전한 실물 자산으로 단계적 치환하십시오.',
        },
      },
      certainty: 'PROVISIONAL',
      provisionalNote: '재물마와 자산마의 2차 전이 모델은 실무 잠정 규칙(PROVISIONAL)을 따릅니다.',
    });
  }

  /**
   * 관계·결혼·유대 해석
   */
  private interpretRelationship(
    fact: MaModuleInputFact,
    signalSet: MaSignalSet,
    secondRelationships: SecondRelationshipMatch[],
    rsi: RSIAssessment,
    timeModulatorSignals: TimeModulatorSignal[]
  ): InterpretationNode | null {
    const marriageSig = signalSet.signals['ma_marriage'];
    if (!marriageSig) return null;

    const temporalContext = timeModulatorSignals
      .filter(t => t.targetModuleId === 'ma_marriage' || t.targetModuleId === 'ma_romance')
      .map(t => ({
        timeScope: t.timeScope,
        targetModuleId: t.targetModuleId,
        description: t.description,
      }));

    let verdict = '배우자궁 및 대인 관계의 평온한 상호작용 유지';
    if (marriageSig.activation.state === 'DOMINANT') {
      verdict = '일지 합국 안착 및 배우자성 통근으로 인한 견고한 동반자적 결합력';
    } else if (marriageSig.activation.state === 'OVERBURDENED') {
      verdict = '일지 충파 및 긴장 요인에 따른 감정적 소통과 신중한 대화 필요';
    }

    return InterpretationFactory.createNode({
      interpretationId: 'interp_relationship',
      theme: 'RELATIONSHIP_BOND',
      primaryVerdict: verdict,
      derivedFromSignals: ['ma_marriage'],
      factReferences: {
        pillarsInvolved: ['day'],
        tenGods: [fact.spouse_facts.primarySpouseStar],
        relationshipsUsed: ['배우자궁안착'],
        isSpouseFactReferenced: true,
      },
      structure: {
        conclusion: verdict,
        basis: {
          signals: ['ma_marriage'],
          facts: [`일지:${fact.spouse_facts.spousePalaceBranch}`, `배우자성:${fact.spouse_facts.primarySpouseStar}`],
        },
        relationshipAndRSIImpact: {
          rsiBand: rsi.band,
          activeSecondRelationships: [],
          impactSummary: `RSI ${rsi.band} 안정도 연계 배우자궁 무결성 점검`,
        },
        temporalContext: temporalContext.length > 0 ? temporalContext : undefined,
        actionableCaution: {
          guideline: '상대방의 입장을 먼저 수용하고 감정적 대립 상황에서 즉각적 판단을 유보하십시오.',
        },
      },
      certainty: 'PROVISIONAL',
      provisionalNote: '배우자 관계 해석은 정성적 궁위 분석에 기반한 잠정 지표(PROVISIONAL)입니다.',
    });
  }

  /**
   * 안전·사고·법률 해석
   */
  private interpretSafety(
    fact: MaModuleInputFact,
    signalSet: MaSignalSet,
    secondRelationships: SecondRelationshipMatch[],
    rsi: RSIAssessment,
    timeModulatorSignals: TimeModulatorSignal[]
  ): InterpretationNode | null {
    const accidentSig = signalSet.signals['ma_accident'];
    const nobleSig = signalSet.signals['ma_noble'];
    if (!accidentSig) return null;

    const isMitigatedByNoble = secondRelationships.some(
      r => r.targetModuleId === 'ma_accident' && r.action === 'MITIGATED'
    );

    const temporalContext = timeModulatorSignals
      .filter(t => t.targetModuleId === 'ma_accident' || t.targetModuleId === 'ma_legal')
      .map(t => ({
        timeScope: t.timeScope,
        targetModuleId: t.targetModuleId,
        description: t.description,
      }));

    let verdict = '신체 및 이동 상의 일상적 안전 균형 유지';
    if (accidentSig.activation.state === 'DOMINANT' || accidentSig.activation.state === 'OVERBURDENED') {
      verdict = isMitigatedByNoble
        ? '사생지 충돌 장력이 존재하나 귀인 완충에 의해 위험이 크게 분산 및 감쇄됨'
        : '충형살 집중 및 장력 가중으로 이동 및 급격한 물리적 활동 시 각별한 주의 요망';
    }

    return InterpretationFactory.createNode({
      interpretationId: 'interp_safety',
      theme: 'SAFETY_MOVEMENT',
      primaryVerdict: verdict,
      derivedFromSignals: ['ma_accident', ...(nobleSig?.activation.isActivated ? ['ma_noble'] : [])],
      factReferences: {
        pillarsInvolved: [...accidentSig.referencedFacts.pillarsInvolved],
        tenGods: [...accidentSig.referencedFacts.tenGods],
        relationshipsUsed: [...accidentSig.referencedFacts.relationshipsUsed],
      },
      structure: {
        conclusion: verdict,
        basis: {
          signals: ['ma_accident'],
          facts: [`지지충:${fact.branch_clashes.map(c => c.name).join(',') || '무'}`],
        },
        relationshipAndRSIImpact: {
          rsiBand: rsi.band,
          activeSecondRelationships: isMitigatedByNoble ? ['귀인마 완충 개입'] : [],
          impactSummary: `RSI ${rsi.band} 하에서 물리적 장력 분산 여부 점검`,
        },
        temporalContext: temporalContext.length > 0 ? temporalContext : undefined,
        actionableCaution: {
          cautionType: 'ACCIDENT_TENSION',
          guideline:
            '무리한 장거리 야간 운전이나 위험한 레저 활동을 삼가고, 사전 안전 점검을 생활화하십시오. (의료/법률 단정 금지)',
        },
      },
      certainty: 'PROVISIONAL',
      provisionalNote: '본 해석은 명리학적 긴장도 점검 지표이며, 의학적/법적 직접 판단을 대체하지 않습니다.',
    });
  }
}
