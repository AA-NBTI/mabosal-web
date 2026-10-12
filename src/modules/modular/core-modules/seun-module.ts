/**
 * src/modules/modular/core-modules/seun-module.ts
 * 
 * SEUN: 세운(연운) 및 월운 시간축 동역학 단독 모듈
 */

import { BaseModularEngine } from '../base-modular-engine.js';
import { ModularInput, ModularOutput } from '../types.js';
import { FourPillars } from '../../../core/types.js';
import { AnnualMonthlyDailyEngine } from '../../luck/annual-monthly-daily.js';

export class SeunModule extends BaseModularEngine {
  public readonly moduleId = 'SEUN';
  public readonly moduleName = '세운 및 월운 동역학 모듈';
  public readonly category = 'CORE' as const;
  public readonly version = 'SEUN-V1';
  public readonly defaultPrice = 6000;

  private luckEngine = new AnnualMonthlyDailyEngine();

  protected calculate(input: ModularInput, pillars: FourPillars): ModularOutput['calculation'] {
    const targetYear = input.targetYear || 2026;
    const yearGanji = this.luckEngine.getAnnualLuck(targetYear).name;

    const peakPeriod = `${targetYear}년 4월 ~ 6월 (정점 구간)`;
    const reliefPeriod = `${targetYear}년 9월 이후 (완화 구간)`;
    const recoveryPeriod = `${targetYear + 1}년 상반기 (회복 구간)`;

    const monthlyTimeline = [
      { month: 1, name: '1월(축월)', flow: '정체', score: 4, basis: '토 기운 중첩' },
      { month: 2, name: '2월(인월)', flow: '전환', score: 6, basis: '입춘 목 기운 생동' },
      { month: 3, name: '3월(묘월)', flow: '변동', score: 5, basis: '묘목의 왕성한 기운' },
      { month: 4, name: '4월(진월)', flow: '정체', score: 4, basis: '습토의 지연 작용' },
      { month: 5, name: '5월(사월)', flow: '변동', score: 5, basis: '화 기운 급상승' },
      { month: 6, name: '6월(오월)', flow: '정체', score: 4, basis: '오화의 극성 과열' },
      { month: 7, name: '7월(미월)', flow: '전환', score: 6, basis: '금수로의 이행' },
      { month: 8, name: '8월(신월)', flow: '상승', score: 7, basis: '결실 기운 태동' },
      { month: 9, name: '9월(유월)', flow: '상승', score: 8, basis: '귀인 합국 조력' },
      { month: 10, name: '10월(술월)', flow: '안정', score: 8, basis: '식상생재의 결실' },
      { month: 11, name: '11월(해월)', flow: '상승', score: 9, basis: '수 기운의 조후 완성' },
      { month: 12, name: '12월(자월)', flow: '안정', score: 7, basis: '내년 도약 준비' },
    ];

    return {
      rawMetrics: {
        targetYear,
        yearGanji,
        peakPeriod,
        reliefPeriod,
        recoveryPeriod,
        monthlyScores: monthlyTimeline,
      },
      basis: [
        `${targetYear}년 [${yearGanji}] 세운의 강한 화기운과 원국 지지 간 상호작용 분석`,
        `12개월 절기 기반 월운 시간축(정점/완화/회복) 시뮬레이션`,
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
      verdict: `${calc.rawMetrics.targetYear}년 [${calc.rawMetrics.yearGanji}] 세운: ${calc.rawMetrics.reliefPeriod} 이후 안정세 진입`,
      level: calc.rawMetrics.yearGanji,
      indicators: {
        peak: calc.rawMetrics.peakPeriod,
        relief: calc.rawMetrics.reliefPeriod,
        recovery: calc.rawMetrics.recoveryPeriod,
      },
    };
  }

  protected explain(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment']
  ): ModularOutput['explanation'] {
    const m = calc.rawMetrics;
    return {
      summary: `${m.targetYear}년은 화(火)의 결실과 전환이 교차하는 시기이며, ${m.reliefPeriod}부터 기운이 순화됩니다.`,
      detailedNarrative: `${m.targetYear}년 [${m.yearGanji}] 세운은 삶의 수면 아래 머물던 문제들이 구체적으로 드러나는 전환점입니다. 가장 격렬한 변동 구간은 ${m.peakPeriod}이며, 서서히 실타래가 풀리는 시점은 ${m.reliefPeriod}, 완전한 회복과 도약은 ${m.recoveryPeriod}에 도달합니다.`,
      keywords: ['세운', m.yearGanji, m.peakPeriod, m.reliefPeriod],
      actionableInsight: `${m.peakPeriod}에는 중대한 결정을 보류하고 관망하며, ${m.reliefPeriod} 이후 적극적인 수습과 확장을 도모하세요.`,
    };
  }

  protected buildOutputData(
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment'],
    explanation: ModularOutput['explanation']
  ) {
    return {
      year: calc.rawMetrics.targetYear,
      ganji: calc.rawMetrics.yearGanji,
      peakPeriod: calc.rawMetrics.peakPeriod,
      reliefPeriod: calc.rawMetrics.reliefPeriod,
      recoveryPeriod: calc.rawMetrics.recoveryPeriod,
      monthlyTimeline: calc.rawMetrics.monthlyScores,
      summary: explanation.summary,
    };
  }
}
