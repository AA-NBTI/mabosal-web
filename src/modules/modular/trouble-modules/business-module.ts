/**
 * src/modules/modular/trouble-modules/business-module.ts
 * 
 * BUSINESS: 사업·창업·거래처·동업 현실 고민 단독 모듈
 */

import { BaseModularEngine } from '../base-modular-engine.js';
import { ModularInput, ModularOutput } from '../types.js';
import { FourPillars, FiveElement } from '../../../core/types.js';
import { STEM_INFO, BRANCH_INFO } from '../../../core/constants.js';

export class BusinessModule extends BaseModularEngine {
  public readonly moduleId = 'BUSINESS';
  public readonly moduleName = '사업 및 창업 고민 모듈';
  public readonly category = 'TROUBLE' as const;
  public readonly version = 'TROUBLE-BUSINESS-V1';
  public readonly defaultPrice = 8000;

  protected calculate(input: ModularInput, pillars: FourPillars): ModularOutput['calculation'] {
    const dayStem = pillars.day.stem;
    const myElem = STEM_INFO[dayStem].element;

    // 식상(내가 생함) = 사업 추진력, 재성(내가 극함) = 사업 결실
    let outputElem: FiveElement;
    if (myElem === '목') outputElem = '화';
    else if (myElem === '화') outputElem = '토';
    else if (myElem === '토') outputElem = '금';
    else if (myElem === '금') outputElem = '수';
    else outputElem = '목';

    const hasClashWithMonth = ['인신', '신인', '사해', '해사', '자오', '오자', '묘유', '유묘'].includes(
      `${pillars.day.branch}${pillars.month.branch}`
    );

    return {
      rawMetrics: {
        dayMaster: dayStem,
        outputElement: outputElem,
        hasClashWithMonth,
        userTroubleText: input.userTroubleText || '사업 확장 및 동업 분쟁 고민',
      },
      basis: [
        `월지(사회적 활동궁)와 일지(본인궁) 간의 합충 작용 분석`,
        `식상(${outputElem})의 추진력 및 동업자(비겁) 지분 배분 구조 검증`,
      ],
      ruleId: this.version,
    };
  }

  protected judge(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation']
  ): ModularOutput['judgment'] {
    const hasClash = calc.rawMetrics.hasClashWithMonth;
    const verdict = hasClash
      ? '사회궁과 본인궁의 충돌로 인해 동업 계약 및 거래처 간 법적·지분 갈등이 최고조에 달한 위기 국면'
      : '사업의 체질 개선과 시스템 정비가 요구되는 안정 성장 및 내실 다지기 국면';

    return {
      verdict,
      level: hasClash ? '계약/동업 주의보' : '안정 성장형',
      indicators: {
        hasClashWithMonth: hasClash,
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
      summary: `사업운 진단: ${judgment.verdict}`,
      detailedNarrative: `사업은 신뢰와 계약의 결합체입니다. 현재 마주하신 동업자나 거래처와의 갈등은 감정의 문제가 아니라 계약과 지분의 모호함에서 불거졌을 가능성이 높습니다. 독단적인 법적 담판을 서두르기보다 공인된 전문가를 통해 지분과 정산 구조를 명확히 문서화하고 감정 소모를 차단하십시오.`,
      keywords: ['사업운', '동업', '계약', '지분정산'],
      actionableInsight: '구두 약속을 배제하고 모든 합의 사항을 서면 계약서와 객관적 회계 자료로 정리하세요.',
    };
  }

  protected buildOutputData(
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment'],
    explanation: ModularOutput['explanation']
  ) {
    return {
      topic: 'BUSINESS',
      verdict: judgment.verdict,
      level: judgment.level,
      summary: explanation.summary,
    };
  }
}
