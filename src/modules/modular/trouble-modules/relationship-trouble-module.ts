/**
 * src/modules/modular/trouble-modules/relationship-trouble-module.ts
 * 
 * RELATIONSHIP: 대인관계·친구·사회적 갈등·오해 현실 고민 단독 모듈
 */

import { BaseModularEngine } from '../base-modular-engine.js';
import { ModularInput, ModularOutput } from '../types.js';
import { FourPillars } from '../../../core/types.js';

export class RelationshipTroubleModule extends BaseModularEngine {
  public readonly moduleId = 'RELATIONSHIP';
  public readonly moduleName = '대인관계 및 대인 갈등 고민 모듈';
  public readonly category = 'TROUBLE' as const;
  public readonly version = 'TROUBLE-RELATIONSHIP-V1';
  public readonly defaultPrice = 8000;

  protected calculate(input: ModularInput, pillars: FourPillars): ModularOutput['calculation'] {
    return {
      rawMetrics: {
        yearBranch: pillars.year.branch,
        monthBranch: pillars.month.branch,
        userTroubleText: input.userTroubleText || '대인관계 마찰 및 오해 갈등',
      },
      basis: [
        `년지(외부 사회적 네트워크) 및 월지(직장·동료 환경) 간의 소통 채널 분석`,
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
      verdict: '타인의 시선과 평가에 과도하게 에너지를 소모하지 말고, 건강한 심리적 경계선을 그어야 하는 국면',
      level: '심리적 경계선 확립',
      indicators: {},
    };
  }

  protected explain(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment']
  ): ModularOutput['explanation'] {
    return {
      summary: `대인관계 진단: ${judgment.verdict}`,
      detailedNarrative: `모든 사람에게 좋은 사람이 되려 할 때 인간관계의 스트레스가 폭발합니다. 나를 해치는 관계나 무례한 사람에게는 단호하게 거리를 두고, 나를 진심으로 아끼는 소수의 인연에 집중하십시오.`,
      keywords: ['대인관계', '경계선', '소통'],
      actionableInsight: '거절하지 못해 끌려다니는 습관을 멈추고, 공적인 예의만 갖추되 사적 거리를 유지하세요.',
    };
  }

  protected buildOutputData(
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment'],
    explanation: ModularOutput['explanation']
  ) {
    return {
      topic: 'RELATIONSHIP',
      verdict: judgment.verdict,
      summary: explanation.summary,
    };
  }
}
