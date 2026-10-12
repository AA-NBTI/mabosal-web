/**
 * src/modules/modular/core-modules/daewun-module.ts
 * 
 * DAEWUN: 10년 주기 대운(대운수, 순행/역행, 대운 기둥, 현재 대운) 단독 모듈
 */

import { BaseModularEngine } from '../base-modular-engine.js';
import { ModularInput, ModularOutput } from '../types.js';
import { FourPillars } from '../../../core/types.js';
import { DaewoonEngine as CoreDaewoonEngine } from '../../saju-core/daewoon-engine.js';
import { MYEONGLI_RULE_VERSIONS } from '../../../core/myeongli-rule-spec.js';

export class DaewunModule extends BaseModularEngine {
  public readonly moduleId = 'DAEWUN';
  public readonly moduleName = '10년 주기 대운 모듈';
  public readonly category = 'CORE' as const;
  public readonly version = MYEONGLI_RULE_VERSIONS.DAEWUN;
  public readonly defaultPrice = 7000;

  private daewoonEngine = new CoreDaewoonEngine();

  protected calculate(input: ModularInput, pillars: FourPillars): ModularOutput['calculation'] {
    const [y, m, d] = input.birthDate.split('-').map(Number);
    const [h, min] = (input.birthTime || '12:00').split(':').map(Number);

    const dw = this.daewoonEngine.calculateDaewoon({
      gender: input.gender,
      birthYear: y,
      birthMonth: m,
      birthDay: d,
      birthHour: isNaN(h) ? 12 : h,
      birthMinute: isNaN(min) ? 0 : min,
      yearStem: pillars.year.stem,
      monthStem: pillars.month.stem,
      monthBranch: pillars.month.branch,
      currentYear: input.targetYear || 2026,
    });

    return {
      rawMetrics: {
        daewoonNumber: dw.daewoonNumber,
        direction: dw.direction,
        currentDaewoonOrder: dw.currentDaewoonOrder,
        currentDaewoon: dw.currentDaewoon,
        nextDaewoon: dw.nextDaewoon,
        pillars: dw.pillars.map(p => ({
          order: p.order,
          ganji: p.ganji,
          startAge: p.startAge,
          endAge: p.endAge,
        })),
      },
      basis: [
        `한국천문연구원(KASI) 역서 및 천문력 12절기 입절 시각 정밀 시간차 기준`,
        `양남음녀(순행) / 음남양녀(역행) 판정 및 대운수 ${dw.daewoonNumber} 산출`,
      ],
      ruleId: this.version,
    };
  }

  protected judge(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation']
  ): ModularOutput['judgment'] {
    const cur = calc.rawMetrics.currentDaewoon;
    return {
      verdict: `현재 제${calc.rawMetrics.currentDaewoonOrder}대운 [${cur.ganji}] 대운 (만 ${cur.startAge}세 ~ ${cur.endAge}세) 진행 중`,
      level: `만 ${calc.rawMetrics.daewoonNumber}세 주기 (${calc.rawMetrics.direction})`,
      indicators: {
        currentOrder: calc.rawMetrics.currentDaewoonOrder,
        currentGanji: cur.ganji,
        daewoonNumber: calc.rawMetrics.daewoonNumber,
        direction: calc.rawMetrics.direction,
      },
    };
  }

  protected explain(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment']
  ): ModularOutput['explanation'] {
    const cur = calc.rawMetrics.currentDaewoon;
    const nxt = calc.rawMetrics.nextDaewoon;

    return {
      summary: `대운 주기: 만 ${calc.rawMetrics.daewoonNumber}세 단위 (${calc.rawMetrics.direction}). 현재는 [${cur.ganji}] 대운의 환경에 놓여 있습니다.`,
      detailedNarrative: `대운은 10년간 삶의 기저를 지배하는 거대한 계절적 기후와 같습니다. 현재 의뢰인은 제${calc.rawMetrics.currentDaewoonOrder}대운인 [${cur.ganji}] 대운(만 ${cur.startAge}세~${cur.endAge}세)을 지나고 있으며, 다가오는 대운은 [${nxt ? nxt.ganji : '차기'}] 대운입니다. 대운의 흐름에 맞춰 장기적인 인생 전략을 수립할 때 지속 가능한 안정이 구축됩니다.`,
      keywords: ['대운', cur.ganji, `대운수 ${calc.rawMetrics.daewoonNumber}`, calc.rawMetrics.direction],
      actionableInsight: `현재 [${cur.ganji}] 대운의 핵심 과제를 충실히 이행하며, 다음 대운의 전환기에 대비해 씨앗을 뿌리세요.`,
    };
  }

  protected buildOutputData(
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment'],
    explanation: ModularOutput['explanation']
  ) {
    return {
      daewoonNumber: calc.rawMetrics.daewoonNumber,
      direction: calc.rawMetrics.direction,
      currentOrder: calc.rawMetrics.currentDaewoonOrder,
      currentGanji: calc.rawMetrics.currentDaewoon.ganji,
      currentDaewoon: calc.rawMetrics.currentDaewoon,
      nextDaewoon: calc.rawMetrics.nextDaewoon,
      allPillars: calc.rawMetrics.pillars,
      summary: explanation.summary,
    };
  }
}
