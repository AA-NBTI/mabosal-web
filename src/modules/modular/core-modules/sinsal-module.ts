/**
 * src/modules/modular/core-modules/sinsal-module.ts
 * 
 * SINSAL: 12신살 및 특수 길신·흉살 단독 모듈
 */

import { BaseModularEngine } from '../base-modular-engine.js';
import { ModularInput, ModularOutput } from '../types.js';
import { FourPillars } from '../../../core/types.js';
import { SinsalCoreEngine } from '../../sinsal/sinsal-core-engine.js';
import { MYEONGLI_RULE_VERSIONS } from '../../../core/myeongli-rule-spec.js';

export class SinsalModule extends BaseModularEngine {
  public readonly moduleId = 'SINSAL';
  public readonly moduleName = '신살 및 길흉 특수성 모듈';
  public readonly category = 'CORE' as const;
  public readonly version = MYEONGLI_RULE_VERSIONS.SINSAL;
  public readonly defaultPrice = 7000;

  private sinsalEngine = new SinsalCoreEngine();

  protected calculate(input: ModularInput, pillars: FourPillars): ModularOutput['calculation'] {
    const rawResults = this.sinsalEngine.calculateNatalSinsals(pillars);
    const activeResults = rawResults.filter(r => r.presentInNatal);

    const auspicious = activeResults
      .filter(r => r.supportScore > r.riskScore || r.name.includes('귀인') || r.name.includes('덕'))
      .map(r => r.name);
    const challenging = activeResults
      .filter(r => r.riskScore >= r.supportScore && !r.name.includes('귀인') && !r.name.includes('덕'))
      .map(r => r.name);

    return {
      rawMetrics: {
        totalSinsalCount: activeResults.length,
        items: activeResults.map(i => ({
          id: i.sinsalId,
          name: i.name,
          category: i.category,
          locations: i.natalLocations,
          riskScore: i.riskScore,
          supportScore: i.supportScore,
          basis: i.calculationBasis,
        })),
        auspicious,
        challenging,
      },
      basis: [
        `년지 및 일지 기준 12신살 체계 연산`,
        `천을귀인·문창·백호·괴강·현침·원진·귀문관 등 25종 신살 전수 검출`,
      ],
      ruleId: this.version,
    };
  }

  protected judge(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation']
  ): ModularOutput['judgment'] {
    const items = calc.rawMetrics.items;
    const hasNoble = items.some((i: any) => i.name.includes('천을귀인') || i.name.includes('귀인'));
    const hasDynamic = items.some((i: any) => i.name.includes('역마') || i.name.includes('도화'));

    let verdict = '특수 잠재 기운이 감도는 신살 구성';
    if (hasNoble) verdict = '위기 시 조력을 얻는 귀인(貴人)의 보살핌이 깃든 명식';
    else if (hasDynamic) verdict = '대중적 매력과 역동적 이동성을 품은 활동형 명식';

    return {
      verdict,
      level: calc.rawMetrics.auspicious.length >= calc.rawMetrics.challenging.length ? '길상 우세' : '조율 필요',
      indicators: {
        auspicious: calc.rawMetrics.auspicious,
        challenging: calc.rawMetrics.challenging,
      },
    };
  }

  protected explain(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment']
  ): ModularOutput['explanation'] {
    const aus = calc.rawMetrics.auspicious.join(', ') || '잠재';
    const ch = calc.rawMetrics.challenging.join(', ') || '없음';

    return {
      summary: `신살 분석 결과: [길신: ${aus}]과 [주의살: ${ch}]이 형성되어 있습니다.`,
      detailedNarrative: `신살은 사주 8자의 고유한 성격적 매력과 특수한 환경적 이벤트를 촉발하는 촉매제입니다. 길신(${aus})은 어려움 속에서도 돌파구를 열어주는 후원자가 되며, 주의를 요하는 신살(${ch})은 감정적 과열이나 충동적 결정을 경계하라는 삶의 신호등 역할을 합니다.`,
      keywords: ['신살', ...calc.rawMetrics.auspicious, ...calc.rawMetrics.challenging],
      actionableInsight: `자신에게 있는 길신의 품격을 믿고 당당하게 전진하되, 주의 신살의 경고를 새겨 신중한 언행을 유지하세요.`,
    };
  }

  protected buildOutputData(
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment'],
    explanation: ModularOutput['explanation']
  ) {
    return {
      items: calc.rawMetrics.items,
      auspicious: calc.rawMetrics.auspicious,
      challenging: calc.rawMetrics.challenging,
      summary: explanation.summary,
    };
  }
}
