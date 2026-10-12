/**
 * src/modules/modular/core-modules/core-original-module.ts
 * 
 * CORE_ORIGINAL: 원국 4주 8자, 일간 본질, 오행 분포 단독 모듈
 */

import { BaseModularEngine } from '../base-modular-engine.js';
import { ModularInput, ModularOutput } from '../types.js';
import { FourPillars, FiveElement } from '../../../core/types.js';
import { STEM_INFO, BRANCH_INFO } from '../../../core/constants.js';
import { MYEONGLI_RULE_VERSIONS } from '../../../core/myeongli-rule-spec.js';

export class CoreOriginalModule extends BaseModularEngine {
  public readonly moduleId = 'CORE_ORIGINAL';
  public readonly moduleName = '원국 및 일간 본질 모듈';
  public readonly category = 'CORE' as const;
  public readonly version = MYEONGLI_RULE_VERSIONS.CALENDAR;
  public readonly defaultPrice = 5000;

  protected calculate(input: ModularInput, pillars: FourPillars): ModularOutput['calculation'] {
    const ohaengCounts: Record<FiveElement, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
    const stems = [pillars.year.stem, pillars.month.stem, pillars.day.stem];
    const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch];
    if (pillars.hour) {
      stems.push(pillars.hour.stem);
      branches.push(pillars.hour.branch);
    }

    for (const s of stems) ohaengCounts[STEM_INFO[s].element]++;
    for (const b of branches) ohaengCounts[BRANCH_INFO[b].element]++;

    return {
      rawMetrics: {
        fourPillarsText: `${pillars.year.stem}${pillars.year.branch} ${pillars.month.stem}${pillars.month.branch} ${pillars.day.stem}${pillars.day.branch} ${pillars.hour ? pillars.hour.stem + pillars.hour.branch : '시미상'}`,
        dayStem: pillars.day.stem,
        dayElement: STEM_INFO[pillars.day.stem].element,
        dayYinYang: STEM_INFO[pillars.day.stem].yinYang,
        ohaengCounts,
        totalChars: stems.length + branches.length,
        pillars,
      },
      basis: [
        `천문 절기 기준 만세력 연/월/일/시주 도출`,
        `일간 ${pillars.day.stem}(${STEM_INFO[pillars.day.stem].element}/${STEM_INFO[pillars.day.stem].yinYang})을 명식의 본원 주체로 확정`,
      ],
      ruleId: this.version,
    };
  }

  protected judge(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation']
  ): ModularOutput['judgment'] {
    const counts = calc.rawMetrics.ohaengCounts as Record<FiveElement, number>;
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const dominant = sorted[0][0];
    const lacking = sorted.filter(([_, cnt]) => cnt === 0).map(([elem]) => elem);

    return {
      verdict: `일간 ${calc.rawMetrics.dayStem} (${calc.rawMetrics.dayElement}) 중심의 ${dominant} 주도 명식`,
      level: calc.rawMetrics.totalChars === 8 ? '완전 4주 8자' : '3주 6자',
      indicators: {
        dominantElement: dominant,
        lackingElements: lacking,
        dayMasterNature: `${calc.rawMetrics.dayStem} (${calc.rawMetrics.dayElement})`,
      },
    };
  }

  protected explain(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment']
  ): ModularOutput['explanation'] {
    const dStem = calc.rawMetrics.dayStem;
    const dElem = calc.rawMetrics.dayElement;
    const dominant = judgment.indicators.dominantElement;
    const lacking = judgment.indicators.lackingElements.join(', ') || '없음(골고루 분포)';

    return {
      summary: `의뢰인은 ${dStem}(${dElem})의 기운을 본원으로 타고났으며, 전체 기운 중 ${dominant}의 세력이 가장 왕성합니다.`,
      detailedNarrative: `태어난 연월일시의 기운인 ${calc.rawMetrics.fourPillarsText}를 분석하면, 본인의 생각과 지향점을 주도하는 일간은 '${dStem}'에 해당합니다. 오행 구성상 ${dominant} 기운이 뚜렷한 추진력의 엔진이 되며, 상대적으로 잠재된 ${lacking}의 가치를 일상에서 조율해 나갈 때 삶의 균형이 완성됩니다.`,
      keywords: ['원국', '일간', dStem, dElem, dominant],
      actionableInsight: `자신의 주도 오행인 ${dominant}의 강점을 살리되, 결핍된 ${lacking} 에너지를 환경과 습관으로 보완하세요.`,
    };
  }

  protected buildOutputData(
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment'],
    explanation: ModularOutput['explanation']
  ) {
    return {
      fourPillarsText: calc.rawMetrics.fourPillarsText,
      dayMaster: {
        stem: calc.rawMetrics.dayStem,
        element: calc.rawMetrics.dayElement,
        yinYang: calc.rawMetrics.dayYinYang,
      },
      ohaeng: {
        distribution: calc.rawMetrics.ohaengCounts,
        dominant: judgment.indicators.dominantElement,
        lacking: judgment.indicators.lackingElements,
      },
      pillars: calc.rawMetrics.pillars,
      summary: explanation.summary,
    };
  }
}
