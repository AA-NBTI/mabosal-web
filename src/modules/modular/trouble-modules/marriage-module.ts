/**
 * src/modules/modular/trouble-modules/marriage-module.ts
 * 
 * MARRIAGE: 결혼·부부 갈등·별거·가정 안정 현실 고민 단독 모듈
 */

import { BaseModularEngine } from '../base-modular-engine.js';
import { ModularInput, ModularOutput } from '../types.js';
import { FourPillars } from '../../../core/types.js';
import { BRANCH_INFO } from '../../../core/constants.js';

export class MarriageModule extends BaseModularEngine {
  public readonly moduleId = 'MARRIAGE';
  public readonly moduleName = '결혼 및 부부·가정 고민 모듈';
  public readonly category = 'TROUBLE' as const;
  public readonly version = 'TROUBLE-MARRIAGE-V1';
  public readonly defaultPrice = 8000;

  protected calculate(input: ModularInput, pillars: FourPillars): ModularOutput['calculation'] {
    const dayBranch = pillars.day.branch;
    const isStable = ['진', '술', '축', '미'].includes(dayBranch); // 포용적인 토 기운

    return {
      rawMetrics: {
        dayBranch,
        dayBranchElement: BRANCH_INFO[dayBranch].element,
        isStable,
        userTroubleText: input.userTroubleText || '부부 갈등 및 별거/가정 고민',
      },
      basis: [
        `일지 배우자궁(${dayBranch})의 환경적 결합도 및 오행 완충력 분석`,
        `대운 및 세운의 가정 환경 충돌 요인 대조`,
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
      verdict: `배우자궁(${calc.rawMetrics.dayBranch})의 에너지를 조율하여 감정 대립을 낮추고 현실적 생활 공간과 원칙을 재정립해야 하는 국면`,
      level: '가정 안정 및 공간 분리',
      indicators: {
        spousePalace: calc.rawMetrics.dayBranch,
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
      summary: `부부/결혼운 진단: ${judgment.verdict}`,
      detailedNarrative: `부부 관계의 위기는 상대를 내 기준에 맞추려 강요할 때 폭발합니다. 일지 배우자궁의 긴장감이 높을 때는 물리적으로 적당한 거리감을 두고 서로의 사생활과 휴식을 존중하는 것이 관계를 치유하는 명약입니다.`,
      keywords: ['결혼운', '부부관계', '가정안정'],
      actionableInsight: '말꼬리를 잡는 말다툼을 멈추고, 가사 분담과 재정 원칙 등 현실적인 규칙부터 합의하세요.',
    };
  }

  protected buildOutputData(
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment'],
    explanation: ModularOutput['explanation']
  ) {
    return {
      topic: 'MARRIAGE',
      spousePalace: calc.rawMetrics.dayBranch,
      verdict: judgment.verdict,
      summary: explanation.summary,
    };
  }
}
