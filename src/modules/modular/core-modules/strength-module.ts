/**
 * src/modules/modular/core-modules/strength-module.ts
 * 
 * STRENGTH: 득령 40% + 득지 30% + 득세 30% 연속 점수 기반 일간 강약 단독 모듈
 */

import { BaseModularEngine } from '../base-modular-engine.js';
import { ModularInput, ModularOutput } from '../types.js';
import { FourPillars, HeavenlyStem, EarthlyBranch } from '../../../core/types.js';
import { calculateCanonicalStrength, MYEONGLI_RULE_VERSIONS } from '../../../core/myeongli-rule-spec.js';

export class StrengthModule extends BaseModularEngine {
  public readonly moduleId = 'STRENGTH';
  public readonly moduleName = '일간 강약 정량화 모듈';
  public readonly category = 'CORE' as const;
  public readonly version = MYEONGLI_RULE_VERSIONS.STRENGTH;
  public readonly defaultPrice = 5000;

  protected calculate(input: ModularInput, pillars: FourPillars): ModularOutput['calculation'] {
    const otherStems: HeavenlyStem[] = [pillars.year.stem, pillars.month.stem];
    if (pillars.hour) otherStems.push(pillars.hour.stem);

    const otherBranches: EarthlyBranch[] = [pillars.year.branch];
    if (pillars.hour) otherBranches.push(pillars.hour.branch);

    const res = calculateCanonicalStrength(
      pillars.day.stem,
      pillars.month.branch,
      pillars.day.branch,
      otherStems,
      otherBranches
    );

    return {
      rawMetrics: {
        score: res.score,
        status: res.status,
        deungryeong: res.deungryeong,
        deungji: res.deungji,
        deungse: res.deungse,
        deungryeongScore: res.deungryeongScore,
        deungJiScore: res.deungJiScore,
        deungSeScore: res.deungSeScore,
        calculationBasis: res.calculationBasis,
      },
      basis: [
        `월령 득령(得令) 40% + 일지 득지(得地) 30% + 타주 득세(得勢) 30% 마보살 정량화 모델`,
        res.calculationBasis,
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
      verdict: `일간 강약 종합 판정: [${calc.rawMetrics.status}] (${calc.rawMetrics.score}점)`,
      level: calc.rawMetrics.status,
      score: calc.rawMetrics.score,
      indicators: {
        status: calc.rawMetrics.status,
        deungryeong: calc.rawMetrics.deungryeong,
        deungji: calc.rawMetrics.deungji,
        deungse: calc.rawMetrics.deungse,
      },
    };
  }

  protected explain(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment']
  ): ModularOutput['explanation'] {
    const st = calc.rawMetrics.status;
    const score = calc.rawMetrics.score;
    const desc = st.includes('강')
      ? '일간의 자생력과 기운이 견고하여 외부 환경의 압박을 주도적으로 돌파하는 저력이 있습니다.'
      : st === '중화'
      ? '오행의 편중 없이 균형을 이루어 환경 적응력과 유연성이 뛰어난 안정적 구조입니다.'
      : '일간의 기운이 섬세하고 유연하여 주변의 조력(인성·비겁)과 지혜로운 완충을 통해 성취를 완성합니다.';

    return {
      summary: `일간의 환경 감당력은 [${st}](${score}점)으로 평가됩니다.`,
      detailedNarrative: `${desc} ${calc.rawMetrics.calculationBasis}`,
      keywords: ['강약', st, `${score}점`, '득령', '득지', '득세'],
      actionableInsight: st.includes('약')
        ? '혼자 모든 책임을 짊어지기보다는 신뢰할 수 있는 파트너와 인성의 지혜를 적극 활용하세요.'
        : '자신의 주도적인 결단력을 살리되, 독단을 피하고 타인의 피드백을 경청하세요.',
    };
  }

  protected buildOutputData(
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment'],
    explanation: ModularOutput['explanation']
  ) {
    return {
      status: calc.rawMetrics.status,
      score: calc.rawMetrics.score,
      breakdown: {
        deungryeong: calc.rawMetrics.deungryeong,
        deungji: calc.rawMetrics.deungji,
        deungse: calc.rawMetrics.deungse,
        deungryeongScore: calc.rawMetrics.deungryeongScore,
        deungJiScore: calc.rawMetrics.deungJiScore,
        deungSeScore: calc.rawMetrics.deungSeScore,
      },
      calculationBasis: calc.rawMetrics.calculationBasis,
      summary: explanation.summary,
    };
  }
}
