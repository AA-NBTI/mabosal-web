/**
 * src/modules/modular/core-modules/geokguk-module.ts
 * 
 * GEOKGUK: 월령 기반 자평진전 정통 십대격 분류 단독 모듈
 * (Phase 58.2 Freeze: 양간 제왕지 양인격 vs 음간 월지 겁재 월겁격 엄격 분리)
 */

import { BaseModularEngine } from '../base-modular-engine.js';
import { ModularInput, ModularOutput } from '../types.js';
import { FourPillars, HeavenlyStem } from '../../../core/types.js';
import { classifyGeokguk, MYEONGLI_RULE_VERSIONS } from '../../../core/myeongli-rule-spec.js';

export class GeokgukModule extends BaseModularEngine {
  public readonly moduleId = 'GEOKGUK';
  public readonly moduleName = '월령 격국 분석 모듈';
  public readonly category = 'CORE' as const;
  public readonly version = MYEONGLI_RULE_VERSIONS.GEOKGUK;
  public readonly defaultPrice = 6000;

  protected calculate(input: ModularInput, pillars: FourPillars): ModularOutput['calculation'] {
    const openStems: HeavenlyStem[] = [pillars.year.stem, pillars.month.stem];
    if (pillars.hour) openStems.push(pillars.hour.stem);

    const result = classifyGeokguk(pillars.day.stem, pillars.month.branch, openStems);

    return {
      rawMetrics: {
        geokgukName: result.name,
        isSpecialPattern: result.isSpecialPattern,
        ruleId: result.ruleId,
        condition: result.condition,
        basisText: result.basis,
      },
      basis: [
        `월지 ${pillars.month.branch}의 지장간 본기를 일간 ${pillars.day.stem}과 대조하여 성립`,
        result.basis,
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
      verdict: `자평진전 정통 취격 기준 [${calc.rawMetrics.geokgukName}] 성립`,
      level: calc.rawMetrics.isSpecialPattern ? '특수격(건록/양인/월겁)' : '정격(식신/상관/재성/관성/인성)',
      indicators: {
        name: calc.rawMetrics.geokgukName,
        isSpecial: calc.rawMetrics.isSpecialPattern,
      },
    };
  }

  protected explain(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment']
  ): ModularOutput['explanation'] {
    const name = calc.rawMetrics.geokgukName;
    return {
      summary: `사회적 활동 무대와 성취의 틀을 결정하는 격국은 [${name}]에 해당합니다.`,
      detailedNarrative: `${calc.rawMetrics.condition} ${name}은 의뢰인이 사회와 교감하고 성취를 이뤄내는 핵심 무대이자 라이프스타일의 근본 형태입니다. 그릇의 모양을 이해하고 순응할 때 인생의 마찰을 줄이고 자신의 잠재력을 최대한 펼칠 수 있습니다.`,
      keywords: ['격국', name, '월령', '사회적성취'],
      actionableInsight: `${name}의 고유한 직무 적성과 가치를 바탕으로 진로와 협업의 룰을 정립하세요.`,
    };
  }

  protected buildOutputData(
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment'],
    explanation: ModularOutput['explanation']
  ) {
    return {
      name: calc.rawMetrics.geokgukName,
      isSpecialPattern: calc.rawMetrics.isSpecialPattern,
      basis: calc.rawMetrics.basisText,
      condition: calc.rawMetrics.condition,
      summary: explanation.summary,
    };
  }
}
