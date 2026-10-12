/**
 * src/modules/modular/trouble-modules/job-module.ts
 * 
 * JOB: 직장·이직·승진·퇴사·상사 갈등 현실 고민 단독 모듈
 */

import { BaseModularEngine } from '../base-modular-engine.js';
import { ModularInput, ModularOutput } from '../types.js';
import { FourPillars, FiveElement } from '../../../core/types.js';
import { STEM_INFO, BRANCH_INFO } from '../../../core/constants.js';

export class JobModule extends BaseModularEngine {
  public readonly moduleId = 'JOB';
  public readonly moduleName = '직장 및 이직 고민 모듈';
  public readonly category = 'TROUBLE' as const;
  public readonly version = 'TROUBLE-JOB-V1';
  public readonly defaultPrice = 8000;

  protected calculate(input: ModularInput, pillars: FourPillars): ModularOutput['calculation'] {
    const dayStem = pillars.day.stem;
    const myElem = STEM_INFO[dayStem].element;

    // 나를 극하는 오행 = 관성(官星: 직장, 조직, 상사)
    let officerElem: FiveElement;
    if (myElem === '목') officerElem = '금';
    else if (myElem === '화') officerElem = '수';
    else if (myElem === '토') officerElem = '목';
    else if (myElem === '금') officerElem = '화';
    else officerElem = '토';

    let officerCount = 0;
    const allStems = [pillars.year.stem, pillars.month.stem, ...(pillars.hour ? [pillars.hour.stem] : [])];
    const allBranches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, ...(pillars.hour ? [pillars.hour.branch] : [])];

    for (const s of allStems) if (STEM_INFO[s].element === officerElem) officerCount++;
    for (const b of allBranches) if (BRANCH_INFO[b].element === officerElem) officerCount++;

    return {
      rawMetrics: {
        officerElement: officerElem,
        officerCount,
        monthBranch: pillars.month.branch,
        userTroubleText: input.userTroubleText || '상사 마찰 및 이직 고민',
      },
      basis: [
        `일간 ${dayStem} 기준 조직 및 직장 운을 관장하는 관성(${officerElem}) 분석`,
        `원국 내 관성 ${officerCount}개 존재 및 상사 갈등 유발 인자 진단`,
      ],
      ruleId: this.version,
    };
  }

  protected judge(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation']
  ): ModularOutput['judgment'] {
    const cnt = calc.rawMetrics.officerCount;
    let verdict = '';
    let level = '';

    if (cnt === 0) {
      verdict = '조직의 획일적 규율에 얽매이기보다 자율성과 독립성이 보장되는 전문 직무로의 전환이 유리한 국면';
      level = '자율/독립 이직형';
    } else if (cnt <= 2) {
      verdict = '직장 내 역할과 책임이 견고하나 일시적인 상사 마찰로 피로감이 누적된 상태로, 경력을 완성한 뒤 계획적 이직이 권장되는 시기';
      level = '계획적 경력 점프';
    } else {
      verdict = '관살의 압박이 극심하여 번아웃과 조직 내 정서적 마찰이 심각한 상태로, 충동적 퇴사 대신 휴식과 내실 전환이 요구되는 국면';
      level = '과열 완화 및 충동 퇴사 주의';
    }

    return {
      verdict,
      level,
      indicators: {
        officerCount: cnt,
        officerElement: calc.rawMetrics.officerElement,
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
      summary: `직장운 진단: ${judgment.verdict}`,
      detailedNarrative: `직장 내 갈등은 본인의 역량 부족 때문이 아니라 조직의 관성 에너지와 본인의 표현 방식 간의 마찰에서 발생합니다. 감정에 휩쓸려 당장 사표를 던지는 것은 공백기의 불안을 가중시킵니다. 현재 포지션에서 실무적 포트폴리오를 단단히 정리하고, 운의 흐름이 완화되는 절기 전환기에 맞춰 확실한 오퍼를 잡고 이동하십시오.`,
      keywords: ['직장운', '이직', '상사마찰', '경력관리'],
      actionableInsight: '이직 준비는 비밀리에 철저히 문서화하며, 당장의 상사 마찰에는 감정을 섞지 말고 원칙대로만 응대하세요.',
    };
  }

  protected buildOutputData(
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment'],
    explanation: ModularOutput['explanation']
  ) {
    return {
      topic: 'JOB',
      officerElement: calc.rawMetrics.officerElement,
      officerCount: calc.rawMetrics.officerCount,
      verdict: judgment.verdict,
      level: judgment.level,
      summary: explanation.summary,
    };
  }
}
