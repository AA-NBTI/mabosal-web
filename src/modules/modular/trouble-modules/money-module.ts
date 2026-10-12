/**
 * src/modules/modular/trouble-modules/money-module.ts
 * 
 * MONEY: 재물·투자·부채·손실 현실 고민 단독 모듈
 */

import { BaseModularEngine } from '../base-modular-engine.js';
import { ModularInput, ModularOutput } from '../types.js';
import { FourPillars, FiveElement } from '../../../core/types.js';
import { STEM_INFO, BRANCH_INFO } from '../../../core/constants.js';

export class MoneyModule extends BaseModularEngine {
  public readonly moduleId = 'MONEY';
  public readonly moduleName = '재물 및 투자 고민 모듈';
  public readonly category = 'TROUBLE' as const;
  public readonly version = 'TROUBLE-MONEY-V1';
  public readonly defaultPrice = 8000;

  protected calculate(input: ModularInput, pillars: FourPillars): ModularOutput['calculation'] {
    const dayStem = pillars.day.stem;
    const myElem = STEM_INFO[dayStem].element;

    // 내가 극하는 오행 = 재성(財星)
    let wealthElem: FiveElement;
    if (myElem === '목') wealthElem = '토';
    else if (myElem === '화') wealthElem = '금';
    else if (myElem === '토') wealthElem = '수';
    else if (myElem === '금') wealthElem = '목';
    else wealthElem = '화';

    // 사주 원국 내 재성 글자 수 세기
    let wealthCharCount = 0;
    const allStems = [pillars.year.stem, pillars.month.stem, ...(pillars.hour ? [pillars.hour.stem] : [])];
    const allBranches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, ...(pillars.hour ? [pillars.hour.branch] : [])];

    for (const s of allStems) if (STEM_INFO[s].element === wealthElem) wealthCharCount++;
    for (const b of allBranches) if (BRANCH_INFO[b].element === wealthElem) wealthCharCount++;

    return {
      rawMetrics: {
        wealthElement: wealthElem,
        wealthCharCount,
        hasRootInDayBranch: BRANCH_INFO[pillars.day.branch].element === wealthElem,
        userTroubleText: input.userTroubleText || '재정적 압박과 투자 손실 고민',
      },
      basis: [
        `일간 ${dayStem}(${myElem}) 기준 재성(${wealthElem}) 오행 세력 분석`,
        `원국 내 재성 글자 ${wealthCharCount}개 보유 여부 및 시간축 흐름 대조`,
      ],
      ruleId: this.version,
    };
  }

  protected judge(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation']
  ): ModularOutput['judgment'] {
    const cnt = calc.rawMetrics.wealthCharCount;
    let verdict = '';
    let level = '';

    if (cnt === 0) {
      verdict = '원국에 재성이 잠재된 무재(無財)형 구조로, 직접적 투기보다 현금 방어와 안정적 전문 직무 소득 중심의 운용이 필수적인 국면';
      level = '자산 방어/보수적 운용';
    } else if (cnt <= 2) {
      verdict = '재성이 적절히 안착된 실속형 구조로, 무리한 레버리지 투자를 피하고 단계적으로 자산을 불려가는 단계';
      level = '균형 자산 형성';
    } else {
      verdict = '재성이 과다하거나 군겁쟁재(群劫爭財)의 압력이 발생하는 국면으로, 공격적 투자 실패 및 자금 유출 방어가 급선무인 시기';
      level = '자금 유출 경계/리스크 차단';
    }

    return {
      verdict,
      level,
      indicators: {
        wealthCharCount: cnt,
        wealthElement: calc.rawMetrics.wealthElement,
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
      summary: `재물운 진단: ${judgment.verdict}`,
      detailedNarrative: `의뢰인의 재물운은 ${calc.rawMetrics.wealthElement}의 기운을 다스리는 방식으로 작동합니다. 현재 마주하신 재정적 고민은 단기적 일확천금을 노리는 조급함에서 비롯되었을 가능성이 큽니다. 지금은 빚이나 손실을 단번에 만회하려 하기보다는, 지출 통로를 원천 봉쇄하고 현금 유동성을 확보하는 보수적 수성이 최선의 반전 전략입니다.`,
      keywords: ['재물운', '투자', calc.rawMetrics.wealthElement, judgment.level || '자산관리'],
      actionableInsight: '무리한 대출이나 추가 투자를 즉시 중단하고, 고정 지출을 다이어트하며 확정적 수입 기반을 다지세요.',
    };
  }

  protected buildOutputData(
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment'],
    explanation: ModularOutput['explanation']
  ) {
    return {
      topic: 'MONEY',
      wealthElement: calc.rawMetrics.wealthElement,
      wealthCount: calc.rawMetrics.wealthCharCount,
      verdict: judgment.verdict,
      level: judgment.level,
      summary: explanation.summary,
    };
  }
}
