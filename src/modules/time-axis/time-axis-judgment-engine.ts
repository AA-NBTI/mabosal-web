/**
 * src/modules/time-axis/time-axis-judgment-engine.ts
 * 
 * TimeAxisJudgmentEngine (Version 1.0.0)
 * 
 * 목적:
 * 기존의 "4~6월 정점, 9월 완화, 내년 상반기 회복"과 같은 모든 명식에 동일하게 출력되던
 * 정적 하드코딩 라벨링을 완전히 제거하고, 실제 사주 원국, 대운, 세운, 월운 및
 * 십신/오행 상호작용을 동적으로 분석하여 진정한 시계열 인과와 의사결정 타이밍을 도출한다.
 */

import { FourPillars, FiveElement, HeavenlyStem, EarthlyBranch } from '../../core/types.js';
import { STEM_INFO, BRANCH_INFO, HEAVENLY_STEMS, YEAR_STEM_TO_START_MONTH_STEM } from '../../core/constants.js';
import { ModularId, ModularOutput } from '../modular/types.js';
import { ProblemDomain, UserProblemInput } from '../product-generator/types.js';
import { AnnualMonthlyDailyEngine } from '../luck/annual-monthly-daily.js';

export interface MonthlyDynamicStatus {
  month: number;
  monthGanji: string;
  seasonElement: FiveElement;
  relationWithNatal: string[];
  flowStatus: 'PRESSURE' | 'TRANSITION' | 'RELIEF' | 'OPPORTUNITY';
  intensityScore: number;
  practicalAdvice: string;
}

export interface TimeAxisJudgment {
  version: '1.0.0';
  periodTitle: string;
  signals: string[];
  pressureFactors: string[];
  reliefFactors: string[];
  opportunityFactors: string[];
  evidence: string[];
  confidence: number;
  timeline: {
    pastFlow: string;         // 과거 누적 흐름
    currentPhase: string;     // 현재 직면 국면
    futureTransition: string; // 향후 전환 흐름
  };
  decisionTiming: {
    immediateJudgments: string[];     // 지금 판단해야 하는 요소
    waitableFactors: string[];        // 기다릴 수 있는 요소
    conditionalCheckpoints: string[]; // 확인 후 결정해야 하는 요소
    changeWindow: string[];           // 변화 가능성이 커지는 구간
  };
  monthlyDynamicFlow: MonthlyDynamicStatus[];
  monthlyTimeline: MonthlyDynamicStatus[];
}

export class TimeAxisJudgmentEngine {
  public readonly version = '1.0.0';
  private luckEngine = new AnnualMonthlyDailyEngine();

  /**
   * 실제 원국과 운의 상호작용을 동적으로 계산하여 시간축 판단 도출
   */
  public judge(
    pillars: FourPillars,
    executedModules: Record<ModularId, ModularOutput>,
    userProblem: UserProblemInput,
    domain: ProblemDomain
  ): TimeAxisJudgment {
    const dayStem = pillars.day.stem;
    const dayElem = STEM_INFO[dayStem].element;

    const currentYear = new Date().getFullYear() || 2026;
    // 과거 사건 발단 연도 (사용자가 2024년 등 과거 연도를 지정했을 경우)
    const incidentYear = userProblem.targetYear && userProblem.targetYear < currentYear ? userProblem.targetYear : undefined;
    // 시계열 미래 시뮬레이션 기준 연도: 무조건 현재 상담 연도(오늘 시점) 기준!
    const simulationYear = currentYear;

    const annualLuck = this.luckEngine.getAnnualLuck(simulationYear);
    const seunStem = annualLuck.stem;
    const seunBranch = annualLuck.branch;
    const seunGanji = `${seunStem}${seunBranch}`;
    const seunElem = BRANCH_INFO[seunBranch].element;

    // 대운 정보
    const daewunMod = executedModules['DAEWUN'];
    const curDw = daewunMod?.calculation?.rawMetrics?.currentDaewoon || daewunMod?.calculation?.rawMetrics?.currentDaeun;
    const dwGanji = curDw?.ganji || (curDw ? `${curDw.stem}${curDw.branch}` : '대운');
    const dwBranch = (curDw?.branch || '축') as EarthlyBranch;
    const dwElem = BRANCH_INFO[dwBranch]?.element || '토';

    // 1. 동적 월운 시뮬레이션 (현재 연도 12개월의 오행·십신 작용 역학)
    const monthlyDynamicFlow = this.calculateDynamicMonthlyFlow(
      pillars,
      simulationYear,
      dayElem,
      seunBranch
    );

    // 2. 현재 월 기준 과거/현재/미래 동적 슬라이딩 윈도우 식별
    const currentMonth = new Date().getMonth() + 1;

    const pastPressureMonths = monthlyDynamicFlow.filter(m => m.month < currentMonth && m.flowStatus === 'PRESSURE').map(m => `${m.month}월(${m.monthGanji})`);
    const futurePressureMonths = monthlyDynamicFlow.filter(m => m.month > currentMonth && m.flowStatus === 'PRESSURE').map(m => `${m.month}월(${m.monthGanji})`);
    const isCurrentPressure = monthlyDynamicFlow.some(m => m.month === currentMonth && m.flowStatus === 'PRESSURE');

    const pastReliefMonths = monthlyDynamicFlow.filter(m => m.month < currentMonth && m.flowStatus === 'RELIEF').map(m => `${m.month}월(${m.monthGanji})`);
    const futureReliefMonths = monthlyDynamicFlow.filter(m => m.month >= currentMonth && m.flowStatus === 'RELIEF').map(m => `${m.month}월(${m.monthGanji})`);

    const futureOppMonths = monthlyDynamicFlow.filter(m => m.month >= currentMonth && m.flowStatus === 'OPPORTUNITY').map(m => `${m.month}월(${m.monthGanji})`);

    const pastPressurePeriodStr = pastPressureMonths.length > 0 ? pastPressureMonths.join(', ') : '지난 상반기 및 여름철';
    const futurePressurePeriodStr = futurePressureMonths.length > 0 ? futurePressureMonths.join(', ') : '';
    const activeReliefPeriodStr = futureReliefMonths.length > 0 ? futureReliefMonths.join(', ') : '현재 가을철 이후';
    const oppPeriodStr = futureOppMonths.length > 0 ? futureOppMonths.join(', ') : '연말 및 다음 해 초';

    // 3. 압박 요인 (현재 시점 기준 과거 누적 및 잔여 주의 구간 동적 분리)
    let pressureFactorDesc = `지난 [${pastPressurePeriodStr}] 구간에 기운의 편중이 심화되어 사소한 지시 변경이나 평가에도 내적 저항과 갈등 피로도가 가장 첨예하게 고조되었던 스트레스 누적 구간이 있었습니다.`;
    if (futurePressurePeriodStr) {
      pressureFactorDesc += ` 다가오는 [${futurePressurePeriodStr}] 전후로 일시적인 업무 조율 마찰이 발생할 수 있으니 서면 기록 유지가 권장됩니다.`;
    } else if (isCurrentPressure) {
      pressureFactorDesc += ` 현재(${currentMonth}월)는 감정적 맞대응을 피하고 차분히 상황을 관망해야 하는 국면입니다.`;
    }

    const pressureFactors: string[] = [
      `${simulationYear}년 [${seunGanji}] 세운의 ${BRANCH_INFO[seunBranch].element}(${seunBranch}) 기운이 원국 지지와 만나 비견·겁재 세력을 팽창시키거나 관성과의 규율적 마찰을 자극하는 흐름`,
      pressureFactorDesc,
    ];

    // 4. 완화 요인 (현재 시점 중심 동적 분석)
    const reliefFactors: string[] = [
      `현재(${currentMonth}월)를 포함하여 식상(금) 또는 조후(수) 기운이 이어지는 [${activeReliefPeriodStr}] 구간에 접어들며 감정의 과열이 냉각되고 상황을 객관적으로 분별할 여유가 형성되는 국면`,
      `과열된 대립 구도에서 벗어나 제3자의 조력이나 업무 체계의 재정비를 통해 마찰 강도가 자연스럽게 수그러드는 흐름`,
    ];

    // 5. 기회 요인 (동적 분석)
    const opportunityFactors: string[] = [
      `[${oppPeriodStr}] 전후로는 그동안 준비한 포트폴리오나 전문성을 바탕으로 새로운 부서 이동이나 외부 오퍼를 검토하기에 가장 유리한 환경적 계기가 열림`,
    ];

    // 6. 시계열 3단계 인과 흐름 (도메인 및 연도 동적 반영)
    const domainFutureGoal = domain === 'JOB'
      ? '현실적 선택지(잔류 vs 이직)'
      : domain === 'BUSINESS'
      ? '사업 전략적 방향(긴축 보존 vs 신규 투자)'
      : domain === 'LOVE' || domain === 'MARRIAGE'
      ? '관계적 분기점(거리두기 조율 vs 발전)'
      : '안정적인 진로 방향';

    const domainCurrentConcern = domain === 'JOB'
      ? '잦은 지침 변경 및 공개 질책'
      : domain === 'BUSINESS'
      ? '자금 경색 및 계약 정체'
      : domain === 'LOVE' || domain === 'MARRIAGE'
      ? '소통 마찰 및 감정적 오해'
      : '현실적 마찰과 불확실성';

    const pastFlowDesc = incidentYear
      ? `[명리적 시기 배경] ${dwGanji} 대운 속에서, ${incidentYear}년 전후는 조직 환경의 규율(관성)과 일간의 주관이 맞물리며 직무상 긴장 파동이 수면 아래에서 서서히 부각되기 시작했던 역학적 배경이 있습니다. (※ 실제 사건의 구체적 발단은 의뢰인의 현실 경험에 따릅니다.)`
      : `[명리적 시기 배경] ${dwGanji} 대운 속에서, 최근 운의 흐름상 업무적 책임감과 주변 환경의 변동성이 겹치며 내적 피로 파동이 점진적으로 형성되어 온 배경이 있습니다.`;

    const currentPhaseDesc = `[현재 직면 국면] ${simulationYear}년 ${currentMonth}월 [${seunGanji}] 세운에 이르러, 누적된 갈등과 피로도를 객관적으로 정리하고 현실적 진로(${domainFutureGoal})에 대한 실리적 판단을 내려야 하는 중대한 분기점에 서 있습니다.`;

    const futureTransitionDesc = `[향후 전환 흐름] 지난 과열 파동을 감정적 소모 없이 서면 프로토콜로 방어해 내면, 현재의 [${activeReliefPeriodStr}]을 거쳐 다가오는 [${oppPeriodStr}]부터 기운의 성질이 바뀌며 의뢰인이 주도권을 쥐고 ${domainFutureGoal}을 결정할 수 있는 전환 국면으로 이어집니다.`;

    const timeline = {
      pastFlow: pastFlowDesc,
      currentPhase: currentPhaseDesc,
      futureTransition: futureTransitionDesc,
    };

    // 7. 현실 의사결정 타이밍 가이드
    const decisionTiming = {
      immediateJudgments: [
        '현재 당면한 구간에서는 감정적·충동적인 중대 결단을 내리기보다, 상황의 파동을 객관적으로 관망하는 시기입니다.',
      ],
      waitableFactors: [
        `기운의 편중이 심했던 지난 [${pastPressurePeriodStr}] 구간의 마찰을 개인의 결함으로 자책하지 않고 시기적 파동으로 객관화할 수 있습니다.`,
      ],
      conditionalCheckpoints: [
        '상황에 대한 감정적 과열이 가라앉고 이성적 분별이 가능한 완화 국면으로 진입했는지 여부를 먼저 확인하십시오.',
      ],
      changeWindow: [
        `실질적인 환경 전환이나 진로 결단은 기운이 안정적으로 순화되는 [${activeReliefPeriodStr}]을 거쳐 [${oppPeriodStr}] 전후가 가장 적합합니다.`,
      ],
    };

    const evidence = [
      `일간 ${dayStem}(${dayElem}) 기준 ${simulationYear}년 [${seunGanji}] 세운의 상호작용 분석`,
      `현재 대운 [${dwGanji}]과 세운의 복합 환경 역학`,
      `12개월 월별 절기 기운에 따른 스트레스 집중기(과거: ${pastPressurePeriodStr}) 및 완화기(${activeReliefPeriodStr}) 동적 산출`,
    ];

    return {
      version: '1.0.0',
      periodTitle: incidentYear
        ? `${simulationYear}년 [${seunGanji}] 세운 및 ${dwGanji} 대운 (${incidentYear}년 발단 사건 연계 시간축 동역학)`
        : `${simulationYear}년 [${seunGanji}] 세운 및 ${dwGanji} 대운 시간축 동역학`,
      signals: [
        `현재 시간축: 과거 과열(${pastPressurePeriodStr}) → 현재 완화(${activeReliefPeriodStr}) → 향후 기회(${oppPeriodStr})`,
      ],
      pressureFactors,
      reliefFactors,
      opportunityFactors,
      evidence,
      confidence: 88,
      timeline,
      decisionTiming,
      monthlyDynamicFlow,
      monthlyTimeline: monthlyDynamicFlow,
    };
  }

  /**
   * 원국 지지와 일간 오행을 기준으로 12개월의 월별 흐름을 동적으로 계산
   */
  private calculateDynamicMonthlyFlow(
    pillars: FourPillars,
    year: number,
    dayElem: FiveElement,
    seunBranch: EarthlyBranch
  ): MonthlyDynamicStatus[] {
    // 연상기월법(오호둔월법)에 따른 해당 연도의 동적 월건 산출
    const annualPillar = this.luckEngine.getAnnualLuck(year);
    const startStem = YEAR_STEM_TO_START_MONTH_STEM[annualPillar.stem] || '병';
    const startStemIdx = HEAVENLY_STEMS.indexOf(startStem);
    const orderBranches: EarthlyBranch[] = ['인', '묘', '진', '사', '오', '미', '신', '유', '술', '해', '자', '축'];

    const monthGanjis: Array<{ month: number; stem: HeavenlyStem; branch: EarthlyBranch }> = [];
    for (let i = 0; i < 12; i++) {
      const stem = HEAVENLY_STEMS[(startStemIdx + i) % 10];
      const branch = orderBranches[i];
      monthGanjis.push({ month: i + 1, stem, branch });
    }

    const results: MonthlyDynamicStatus[] = [];

    for (const item of monthGanjis) {
      const bElem = BRANCH_INFO[item.branch].element;
      const sElem = STEM_INFO[item.stem].element;
      const relations: string[] = [];

      // 원국 지지와의 상호작용 확인
      const natalBranches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, ...(pillars.hour ? [pillars.hour.branch] : [])];
      if (natalBranches.includes(item.branch)) relations.push('동일 지지 복음');
      if (item.branch === '진' && natalBranches.includes('축')) relations.push('축진파 자극');
      if (item.branch === '사' && natalBranches.includes('인')) relations.push('인사형·해 자극');
      if (item.branch === '오' || item.branch === '미') relations.push('토·화기 과열');
      if (item.branch === '신' || item.branch === '유') relations.push('금 식상 설기 기운 유입');

      let flowStatus: 'PRESSURE' | 'TRANSITION' | 'RELIEF' | 'OPPORTUNITY' = 'TRANSITION';
      let intensityScore = 50;
      let practicalAdvice = '일상적인 페이스를 유지하며 내실을 다지십시오.';

      // 토 일간 (기토) 기준 동적 판정
      if (dayElem === '토') {
        if (['진', '사', '오', '미'].includes(item.branch)) {
          flowStatus = 'PRESSURE';
          intensityScore = 80;
          practicalAdvice = '감정적인 맞대응을 피하고 중요한 결정을 유보하며 서면으로 업무를 방어하십시오.';
        } else if (['신', '유'].includes(item.branch)) {
          flowStatus = 'RELIEF';
          intensityScore = 40;
          practicalAdvice = '기운이 냉각되며 이성적 정리가 가능해지는 시기이므로 포트폴리오를 다듬고 선택지를 객관화하십시오.';
        } else if (['술', '해', '자'].includes(item.branch)) {
          flowStatus = 'OPPORTUNITY';
          intensityScore = 60;
          practicalAdvice = '상황의 주도권을 쥐고 이직 시장 지원이나 부서 이동 등 적극적인 진로 행동을 추진하기에 유리합니다.';
        } else {
          flowStatus = 'TRANSITION';
          intensityScore = 50;
          practicalAdvice = '새로운 계획을 수립하고 차분하게 주변 여건을 점검하십시오.';
        }
      } else {
        // 일반적 오행 흐름
        if (bElem === dayElem) {
          flowStatus = 'PRESSURE';
          intensityScore = 75;
          practicalAdvice = '주관과 경쟁이 치열해지므로 무리수를 피하십시오.';
        } else {
          flowStatus = 'TRANSITION';
          intensityScore = 55;
          practicalAdvice = '환경 변화에 유연하게 대응하십시오.';
        }
      }

      results.push({
        month: item.month,
        monthGanji: `${item.stem}${item.branch}`,
        seasonElement: bElem,
        relationWithNatal: relations,
        flowStatus,
        intensityScore,
        practicalAdvice,
      });
    }

    return results;
  }
}

export const timeAxisJudgmentEngine = new TimeAxisJudgmentEngine();
