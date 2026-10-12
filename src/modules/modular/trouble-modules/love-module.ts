/**
 * src/modules/modular/trouble-modules/love-module.ts
 * 
 * LOVE: 연애·이별·재회·연인 갈등 현실 고민 단독 모듈
 */

import { BaseModularEngine } from '../base-modular-engine.js';
import { ModularInput, ModularOutput } from '../types.js';
import { FourPillars, FiveElement } from '../../../core/types.js';
import { STEM_INFO, BRANCH_INFO } from '../../../core/constants.js';

export class LoveModule extends BaseModularEngine {
  public readonly moduleId = 'LOVE';
  public readonly moduleName = '연애 및 이별·재회 고민 모듈';
  public readonly category = 'TROUBLE' as const;
  public readonly version = 'TROUBLE-LOVE-V1';
  public readonly defaultPrice = 8000;

  protected calculate(input: ModularInput, pillars: FourPillars): ModularOutput['calculation'] {
    const dayStem = pillars.day.stem;
    const isMale = input.gender === 'male';
    const myElem = STEM_INFO[dayStem].element;

    // 남성: 재성(내가 극함), 여성: 관성(나를 극함)
    let partnerElem: FiveElement;
    if (isMale) {
      if (myElem === '목') partnerElem = '토';
      else if (myElem === '화') partnerElem = '금';
      else if (myElem === '토') partnerElem = '수';
      else if (myElem === '금') partnerElem = '목';
      else partnerElem = '화';
    } else {
      if (myElem === '목') partnerElem = '금';
      else if (myElem === '화') partnerElem = '수';
      else if (myElem === '토') partnerElem = '목';
      else if (myElem === '금') partnerElem = '화';
      else partnerElem = '토';
    }

    // 일지(배우자궁/연인궁)와의 충돌 검사
    const dayBranch = pillars.day.branch;
    const hasClashWithYear = ['자오', '오자', '축미', '미축', '인신', '신인', '묘유', '유묘', '진술', '술진', '사해', '해사'].includes(
      `${dayBranch}${pillars.year.branch}`
    );

    return {
      rawMetrics: {
        partnerElement: partnerElem,
        dayBranch,
        hasClashWithYear,
        gender: input.gender,
        userTroubleText: input.userTroubleText || '연인과의 다툼 및 이별/재회 고민',
      },
      basis: [
        `성별(${input.gender}) 및 일간(${dayStem}) 기준 이성 인연성(${partnerElem}) 분석`,
        `일지 배우자궁(${dayBranch})의 충돌 여부 및 과열 에너지 진단`,
      ],
      ruleId: this.version,
    };
  }

  protected judge(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation']
  ): ModularOutput['judgment'] {
    const hasClash = calc.rawMetrics.hasClashWithYear;
    const verdict = hasClash
      ? '일지 연인궁에 충돌과 긴장감이 작용하여 즉각적 연락이나 감정적 담판은 파국을 부르는 냉각 필수 국면'
      : '오해와 사소한 서운함이 누적되어 거리가 벌어진 상태로, 충분한 숨고르기 후 온화한 소통으로 회복 가능한 국면';

    return {
      verdict,
      level: hasClash ? '냉각기 필수 (즉시 연락 금지)' : '이성적 대화 모색 가능',
      indicators: {
        partnerElement: calc.rawMetrics.partnerElement,
        hasClashWithYear: hasClash,
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
      summary: `연애운 진단: ${judgment.verdict}`,
      detailedNarrative: `이별과 갈등의 고통 속에서 가장 피해야 할 것은 '초조함에 장문의 메시지를 보내거나 자존심 대결을 펼치는 일'입니다. 지금은 불붙은 장작에 부채질을 하는 형국입니다. 최소 2~3주간 일체의 연락을 멈추고 서로의 감정이 식기를 기다려야 합니다. 상대방의 침묵은 거절이 아니라 감정적 방어기제임을 이해하십시오.`,
      keywords: ['연애운', '재회', '이별', '냉각기'],
      actionableInsight: '새벽 감정 연락이나 SNS 염탐을 멈추고, 일상의 루틴을 회복하며 차분히 다음 대화의 기회를 기다리세요.',
    };
  }

  protected buildOutputData(
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment'],
    explanation: ModularOutput['explanation']
  ) {
    return {
      topic: 'LOVE',
      partnerElement: calc.rawMetrics.partnerElement,
      verdict: judgment.verdict,
      level: judgment.level,
      summary: explanation.summary,
    };
  }
}
