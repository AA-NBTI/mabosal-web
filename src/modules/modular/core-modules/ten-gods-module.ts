/**
 * src/modules/modular/core-modules/ten-gods-module.ts
 * 
 * TEN_GODS: 십신(비견·겁재·식신·상관·편재·정재·편관·정관·편인·정인) 단독 모듈
 */

import { BaseModularEngine } from '../base-modular-engine.js';
import { ModularInput, ModularOutput } from '../types.js';
import { FourPillars, HeavenlyStem, EarthlyBranch, TenGod } from '../../../core/types.js';
import { TenGodsEngine } from '../../saju-core/ten-gods.js';
import { MYEONGLI_RULE_VERSIONS } from '../../../core/myeongli-rule-spec.js';

export class TenGodsModule extends BaseModularEngine {
  public readonly moduleId = 'TEN_GODS';
  public readonly moduleName = '십신 심리 및 세력 모듈';
  public readonly category = 'CORE' as const;
  public readonly version = MYEONGLI_RULE_VERSIONS.TEN_GODS;
  public readonly defaultPrice = 5000;

  private engine = new TenGodsEngine();

  protected calculate(input: ModularInput, pillars: FourPillars): ModularOutput['calculation'] {
    const dayStem = pillars.day.stem;
    const tgCounts: Record<TenGod, number> = {
      비견: 0, 겁재: 0, 식신: 0, 상관: 0, 편재: 0,
      정재: 0, 편관: 0, 정관: 0, 편인: 0, 정인: 0,
    };

    const countStem = (s: HeavenlyStem) => tgCounts[this.engine.getTenGodForStem(dayStem, s)]++;
    const countBranch = (b: EarthlyBranch) => tgCounts[this.engine.getTenGodForBranchMain(dayStem, b)]++;

    countStem(pillars.year.stem);
    countStem(pillars.month.stem);
    // 일간 본인은 비견 기준
    tgCounts['비견']++;
    countBranch(pillars.year.branch);
    countBranch(pillars.month.branch);
    countBranch(pillars.day.branch);

    if (pillars.hour) {
      countStem(pillars.hour.stem);
      countBranch(pillars.hour.branch);
    }

    const fiveGodGroups = {
      비겁: tgCounts['비견'] + tgCounts['겁재'],
      식상: tgCounts['식신'] + tgCounts['상관'],
      재성: tgCounts['편재'] + tgCounts['정재'],
      관성: tgCounts['편관'] + tgCounts['정관'],
      인성: tgCounts['편인'] + tgCounts['정인'],
    };

    return {
      rawMetrics: {
        tenGodCounts: tgCounts,
        fiveGodGroups,
        pillarTenGods: {
          year: { stem: this.engine.getTenGodForStem(dayStem, pillars.year.stem), branch: this.engine.getTenGodForBranchMain(dayStem, pillars.year.branch) },
          month: { stem: this.engine.getTenGodForStem(dayStem, pillars.month.stem), branch: this.engine.getTenGodForBranchMain(dayStem, pillars.month.branch) },
          day: { stem: '비견', branch: this.engine.getTenGodForBranchMain(dayStem, pillars.day.branch) },
          hour: pillars.hour ? { stem: this.engine.getTenGodForStem(dayStem, pillars.hour.stem), branch: this.engine.getTenGodForBranchMain(dayStem, pillars.hour.branch) } : null,
        }
      },
      basis: [`일간 ${dayStem}을 기준으로 타 주 천간·지지 본기의 오행 생극제화 및 음양 관계 동적 연산`],
      ruleId: this.version,
    };
  }

  protected judge(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation']
  ): ModularOutput['judgment'] {
    const groups = calc.rawMetrics.fiveGodGroups as Record<string, number>;
    const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]);
    const dominantGroup = sorted[0][0];
    const lackingGroups = sorted.filter(([_, cnt]) => cnt === 0).map(([g]) => g);

    return {
      verdict: `${dominantGroup} 세력이 주도하는 사회적 심리 역동 구조`,
      indicators: {
        dominantGroup,
        lackingGroups,
        fiveGodGroups: groups,
      },
    };
  }

  protected explain(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment']
  ): ModularOutput['explanation'] {
    const dom = judgment.indicators.dominantGroup;
    const lack = judgment.indicators.lackingGroups.join(', ') || '전 영역 고루 분포';

    return {
      summary: `십신 역학에서 [${dom}]의 에너지가 가장 강하게 발현되며, [${lack}] 영역의 의식적 보완이 요구됩니다.`,
      detailedNarrative: `의뢰인의 십신 구조는 ${dom} 중심의 행동 패턴을 보입니다. 비겁은 주체성, 식상은 표현과 재능, 재성은 현실적 결실, 관성은 규율과 책임, 인성은 학문과 수용성을 뜻합니다. 주도적인 ${dom}의 힘을 적재적소에 발휘할 때 사회적 만족도가 극대화됩니다.`,
      keywords: ['십신', dom, '생극제화', '심리역학'],
      actionableInsight: `자신의 강점인 ${dom}의 기운을 바탕으로 활동 무대를 넓히고, ${lack}적인 요소를 타인과의 협력으로 메우세요.`,
    };
  }

  protected buildOutputData(
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment'],
    explanation: ModularOutput['explanation']
  ) {
    return {
      counts: calc.rawMetrics.tenGodCounts,
      groups: calc.rawMetrics.fiveGodGroups,
      pillars: calc.rawMetrics.pillarTenGods,
      dominantGroup: judgment.indicators.dominantGroup,
      lackingGroups: judgment.indicators.lackingGroups,
      summary: explanation.summary,
    };
  }
}
