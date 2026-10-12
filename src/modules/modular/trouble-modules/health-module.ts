/**
 * src/modules/modular/trouble-modules/health-module.ts
 * 
 * HEALTH: 건강·수술·만성피로·심신 안정 현실 고민 단독 모듈
 * (원칙: 의료적 질병 단정 및 치료 처방 배제, 오행 밸런스 및 전문 의료기관 검진 권고)
 */

import { BaseModularEngine } from '../base-modular-engine.js';
import { ModularInput, ModularOutput } from '../types.js';
import { FourPillars, FiveElement } from '../../../core/types.js';
import { STEM_INFO, BRANCH_INFO } from '../../../core/constants.js';

export class HealthModule extends BaseModularEngine {
  public readonly moduleId = 'HEALTH';
  public readonly moduleName = '건강 및 심신 안정 고민 모듈';
  public readonly category = 'TROUBLE' as const;
  public readonly version = 'TROUBLE-HEALTH-V1';
  public readonly defaultPrice = 8000;

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

    const weakElem = (Object.entries(ohaengCounts) as [FiveElement, number][]).find(([_, cnt]) => cnt === 0)?.[0] || '수';

    return {
      rawMetrics: {
        ohaengCounts,
        weakestElement: weakElem,
        userTroubleText: input.userTroubleText || '건강 악화 및 수술/회복 고민',
      },
      basis: [
        `오행 에너지 편중도 및 결핍 기운(${weakElem}) 분석`,
        `사주 명리학적 신체 리듬 및 온난조습(溫暖燥濕) 밸런스 대조`,
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
      verdict: `신체 에너지의 과열과 소모를 방지하고, 결핍된 [${calc.rawMetrics.weakestElement}] 기운의 휴식을 보충해야 하는 국면`,
      level: '심신 안정 및 전문의 검진 권고',
      indicators: {
        weakestElement: calc.rawMetrics.weakestElement,
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
      summary: `건강운 진단: ${judgment.verdict}`,
      detailedNarrative: `명리학에서 건강은 오행 기운의 원활한 순환을 뜻합니다. 현재의 피로감과 불안은 무리한 스트레스와 신체 밸런스 불균형에서 발생합니다. 본 사주 분석은 의료적 진단이나 치료 처방을 대신할 수 없으므로, 증상이 있거나 수술을 앞두신 경우 반드시 전문 의료기관의 정밀 검진과 의사의 진단을 최우선으로 따르십시오. 일상에서는 충분한 수면과 가벼운 수분 섭취, 자연 속 휴식을 통해 면역력을 보살피십시오.`,
      keywords: ['건강운', '오행균형', '심신안정', '의료기관진료권고'],
      actionableInsight: '무리한 일정을 비우고 수면 리듬을 회복하며, 정기 검진을 통해 몸의 상태를 객관적으로 점검하세요.',
    };
  }

  protected buildOutputData(
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment'],
    explanation: ModularOutput['explanation']
  ) {
    return {
      topic: 'HEALTH',
      weakestElement: calc.rawMetrics.weakestElement,
      verdict: judgment.verdict,
      medicalDisclaimer: '본 결과는 전문 의료 행위를 대체하지 않으며 의료기관 전문의의 진단을 우선합니다.',
      summary: explanation.summary,
    };
  }
}
