/**
 * src/modules/modular/core-modules/eokbu-module.ts
 * 
 * EOKBU: 일간 강약 및 오행 세력 균형 기반 억부 용신·희신·기신 단독 모듈
 */

import { BaseModularEngine } from '../base-modular-engine.js';
import { ModularInput, ModularOutput } from '../types.js';
import { FourPillars, FiveElement } from '../../../core/types.js';
import { calculateCanonicalStrength, MYEONGLI_RULE_VERSIONS } from '../../../core/myeongli-rule-spec.js';
import { STEM_INFO } from '../../../core/constants.js';

export class EokbuModule extends BaseModularEngine {
  public readonly moduleId = 'EOKBU';
  public readonly moduleName = '억부 용신 분석 모듈';
  public readonly category = 'CORE' as const;
  public readonly version = MYEONGLI_RULE_VERSIONS.EOKBU;
  public readonly defaultPrice = 6000;

  protected calculate(input: ModularInput, pillars: FourPillars): ModularOutput['calculation'] {
    const dayStem = pillars.day.stem;
    const myElem = STEM_INFO[dayStem].element;

    const strength = calculateCanonicalStrength(
      dayStem,
      pillars.month.branch,
      pillars.day.branch,
      [pillars.year.stem, pillars.month.stem, ...(pillars.hour ? [pillars.hour.stem] : [])],
      [pillars.year.branch, ...(pillars.hour ? [pillars.hour.branch] : [])]
    );

    const isWeak = strength.score < 50.0;
    let yongsin: FiveElement;
    let heesin: FiveElement;
    let gisin: FiveElement;
    let reason = '';

    if (isWeak) {
      // 신약: 인성(용신) + 비겁(희신), 관성(기신)
      if (myElem === '목') { yongsin = '수'; heesin = '목'; gisin = '금'; }
      else if (myElem === '화') { yongsin = '목'; heesin = '화'; gisin = '수'; }
      else if (myElem === '토') { yongsin = '화'; heesin = '토'; gisin = '목'; }
      else if (myElem === '금') { yongsin = '토'; heesin = '금'; gisin = '화'; }
      else { yongsin = '금'; heesin = '수'; gisin = '토'; }
      reason = `일간이 ${strength.status}(${strength.score}점)으로 유연하여, 나를 돕는 인성(${yongsin})을 주용신으로 삼고 비겁(${heesin})을 희신으로 취합니다.`;
    } else {
      // 신강: 식상/재성/관성으로 설기·소모·극제
      if (myElem === '목') { yongsin = '화'; heesin = '토'; gisin = '수'; }
      else if (myElem === '화') { yongsin = '토'; heesin = '금'; gisin = '목'; }
      else if (myElem === '토') { yongsin = '금'; heesin = '수'; gisin = '화'; }
      else if (myElem === '금') { yongsin = '수'; heesin = '목'; gisin = '토'; }
      else { yongsin = '목'; heesin = '화'; gisin = '금'; }
      reason = `일간이 ${strength.status}(${strength.score}점)으로 견고하여, 기운을 원활히 유통하는 식상·재성(${yongsin})을 용신으로 삼습니다.`;
    }

    return {
      rawMetrics: {
        yongsin,
        heesin,
        gisin,
        dayMasterElement: myElem,
        strengthScore: strength.score,
        strengthStatus: strength.status,
        reason,
      },
      basis: [
        `일간 강약 척도(${strength.status}, ${strength.score}점) 기반 억부(抑扶: 강자는 억누르고 약자는 돕는다) 명리 법칙 적용`,
        reason,
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
      verdict: `억부 용신: [${calc.rawMetrics.yongsin}] / 희신: [${calc.rawMetrics.heesin}] / 기신: [${calc.rawMetrics.gisin}]`,
      level: calc.rawMetrics.strengthStatus,
      indicators: {
        yongsin: calc.rawMetrics.yongsin,
        heesin: calc.rawMetrics.heesin,
        gisin: calc.rawMetrics.gisin,
      },
    };
  }

  protected explain(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment']
  ): ModularOutput['explanation'] {
    const y = calc.rawMetrics.yongsin;
    const h = calc.rawMetrics.heesin;
    const g = calc.rawMetrics.gisin;

    return {
      summary: `삶의 균형과 발전을 이끄는 억부 핵심 에너지는 [용신: ${y}, 희신: ${h}]이며, 과도한 [기신: ${g}]의 유입을 경계해야 합니다.`,
      detailedNarrative: `${calc.rawMetrics.reason} 용신(${y})은 위기 돌파와 성과의 열쇠이며, 희신(${h})은 이를 든든하게 받쳐주는 보조 에너지입니다. 대운이나 세운에서 ${y}와 ${h}의 기운을 만날 때 사회적·현실적 도약이 가속화됩니다.`,
      keywords: ['억부용신', y, h, g, '오행균형'],
      actionableInsight: `자신의 용신인 ${y}의 색상, 방위, 직무 스타일(학습·통찰·협력 등)을 생활 속에 적극 도입하세요.`,
    };
  }

  protected buildOutputData(
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment'],
    explanation: ModularOutput['explanation']
  ) {
    return {
      yongsin: calc.rawMetrics.yongsin,
      heesin: calc.rawMetrics.heesin,
      gisin: calc.rawMetrics.gisin,
      reason: calc.rawMetrics.reason,
      ruleVersion: this.version,
      summary: explanation.summary,
    };
  }
}
