/**
 * src/modules/modular/mabosal-modules/prescription-module.ts
 * 
 * PRESCRIPTION: 마 진단 결과를 기반으로 한 구체적 행동 처방 단독 모듈
 * (Do's, Don'ts, 시기별 로드맵, 강화 오행, 관계 조율, 고위험 영역 단정 배제)
 */

import { BaseModularEngine } from '../base-modular-engine.js';
import { ModularInput, ModularOutput } from '../types.js';
import { FourPillars, FiveElement } from '../../../core/types.js';
import { STEM_INFO } from '../../../core/constants.js';
import { prescriptionEngine } from '../../prescription/prescription-engine.js';

export class PrescriptionModule extends BaseModularEngine {
  public readonly moduleId = 'PRESCRIPTION';
  public readonly moduleName = '마보살 맞춤 행동 처방 모듈';
  public readonly category = 'MABOSAL' as const;
  public readonly version = 'MABOSAL-PRESCRIPTION-V1';
  public readonly defaultPrice = 12000;

  protected calculate(input: ModularInput, pillars: FourPillars): ModularOutput['calculation'] {
    const dayStem = pillars.day.stem;
    const myElem = STEM_INFO[dayStem].element;

    // 결핍 또는 조화 오행 (기본 수/금/토)
    const remedyElement: FiveElement = (myElem === '화' || myElem === '토') ? '수' : '금';

    // Phase 70 PrescriptionEngine 연동
    const prescriptionResult = prescriptionEngine.generatePrescription({
      pillars,
      targetYear: input.targetYear,
      userEvent: {
        currentConcern: input.userTroubleText || '현실적인 문제 해결과 마음의 안정',
      },
    });

    const doList = prescriptionResult.customerResult.behaviorSummary.length >= 3
      ? prescriptionResult.customerResult.behaviorSummary.slice(0, 3)
      : [
          '철저한 침묵과 자중자애를 유지하며 감정적 냉각기 갖기',
          '일상 루틴(수면, 식사, 가벼운 유산소 운동)을 회복하여 심신 체력 다지기',
          '상대방이나 타인의 반응에 일희일비하지 않고 나의 내면을 객관화하기',
        ];

    const dontList = [
      '새벽 시간대 장문의 해명 메시지나 즉흥적인 담판 시도',
      '자존심 대결로 인한 극단적 최후통첩이나 일방적 결별/퇴사 선언',
      '초조함을 달래기 위한 무리한 대출, 투기성 투자, 과도한 지출 확대',
    ];

    const timeline = {
      coolingPeriod: prescriptionResult.timeAxisSummary.intensive[0] || '향후 2~3주간 (절대 안정 및 행동 보류기)',
      easingPeriod: prescriptionResult.timeAxisSummary.seun[0] || '절기 전환기 이후 (조심스러운 간접 소통 및 수습기)',
      recoveryPeriod: prescriptionResult.timeAxisSummary.daewun[0] || '내년 상반기 도래 시점 (완전한 회복 및 대도약기)',
    };

    return {
      rawMetrics: {
        remedyElement,
        doList,
        dontList,
        timeline,
        medicalSafetyNotice: prescriptionResult.customerResult.safetyNotice || '본 처방은 심리 및 행동 지침이며, 의료·법률·투자의 전문적 판단은 해당 공인 전문가의 자문을 우선합니다.',
        prescriptionResult,
      },
      basis: [
        `사주 원국 및 마(魔) 과열 구간의 기운을 완충하는 오행 처방(${remedyElement})`,
        `심리적 안정 및 현실적 파국 방어를 위한 단계별 Do & Don't 수칙`,
        ...prescriptionResult.topPrescriptions.flatMap(p => p.basis).slice(0, 2),
      ],
      ruleId: this.version,
    };
  }

  protected judge(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation']
  ): ModularOutput['judgment'] {
    return {
      verdict: `반드시 실천해야 할 Do's 3가지 및 절대 피해야 할 Don'ts 3가지 확정`,
      level: '즉각 실천 처방',
      indicators: {
        remedyElement: calc.rawMetrics.remedyElement,
        coolingPeriod: calc.rawMetrics.timeline.coolingPeriod,
      },
    };
  }

  protected explain(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment']
  ): ModularOutput['explanation'] {
    return {
      summary: `마보살 행동 처방전: 즉각적 담판을 멈추고 3대 실천 수칙(Do)과 3대 금기 수칙(Don't)을 엄수하십시오.`,
      detailedNarrative: `운의 파도가 거셀 때는 노를 젓는 것이 아니라 닻을 내리는 것이 지혜입니다. 
[반드시 할 것(Do's)]: ${calc.rawMetrics.doList.join(' / ')}
[절대 피해야 할 것(Don'ts)]: ${calc.rawMetrics.dontList.join(' / ')}
시기별로는 ${calc.rawMetrics.timeline.coolingPeriod} 동안 침묵을 지키고, ${calc.rawMetrics.timeline.easingPeriod}부터 물꼬를 트십시오. ${calc.rawMetrics.medicalSafetyNotice}`,
      keywords: ['처방', 'Do', 'Dont', calc.rawMetrics.remedyElement, '로드맵'],
      actionableInsight: '지금 당장 상대방을 설득하려 하지 말고, 나의 일상 루틴과 내면의 평정을 회복하는 데 집중하세요.',
    };
  }

  protected buildOutputData(
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment'],
    explanation: ModularOutput['explanation']
  ) {
    return {
      remedyElement: calc.rawMetrics.remedyElement,
      doList: calc.rawMetrics.doList,
      dontList: calc.rawMetrics.dontList,
      timeline: calc.rawMetrics.timeline,
      safetyDisclaimer: calc.rawMetrics.medicalSafetyNotice,
      summary: explanation.summary,
      prescriptionResult: calc.rawMetrics.prescriptionResult,
    };
  }
}
