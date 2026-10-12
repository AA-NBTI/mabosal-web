/**
 * src/modules/product-output/common-result-builder.ts
 *
 * Phase 83: 공통 결과 데이터 빌더
 *
 *   기존 19개 모듈 → 통합 분석 → 사건 진단 → 시간축 → 처방 → [공통 결과 데이터]
 *
 * - 새 명리 계산을 하지 않는다. 기존 ProductGenerator 파이프라인을 한 번 실행해 결과를 보존한다.
 * - 상품별로 다시 계산하지 않는다 (상품은 이 공통 결과를 다른 깊이로 표현할 뿐).
 * - 연도별 흐름은 기존 연운 모듈(SEUN)을 연도만 바꿔 호출한다.
 */

import { ProductGenerator } from '../product-generator/product-generator.js';
import { moduleRegistry } from '../modular/module-registry.js';
import type { ModularInput } from '../modular/types.js';
import { buildResultScore } from './result-score-builder.js';
import type { CommonCaseInput, CommonResultData, YearFlow } from './types.js';

/** 기존 19개 기본 모듈 */
export const ALL_19_MODULES = [
  'CORE_ORIGINAL', 'TEN_GODS', 'GEOKGUK', 'STRENGTH', 'EOKBU', 'JOHU',
  'RELATION', 'SINSAL', 'DAEWUN', 'SEUN',
  'MONEY', 'BUSINESS', 'JOB', 'LOVE', 'MARRIAGE', 'RELATIONSHIP', 'HEALTH',
  'MAGA_DIAGNOSIS', 'PRESCRIPTION',
];

const FLOW_STATUS_KO: Record<string, string> = {
  PRESSURE: '압박',
  TRANSITION: '전환',
  RELIEF: '완화',
  OPPORTUNITY: '기회',
};

export function findInputGaps(input: CommonCaseInput): string[] {
  const gaps: string[] = [];
  if (!input.solarBirthDate) gaps.push('생년월일');
  if (!input.birthTime && !input.isUnknownTime) gaps.push('출생시간');
  if (!input.gender) gaps.push('성별');
  if (!input.calendarType) gaps.push('양력/음력');
  if (!input.birthRegion) gaps.push('출생지');
  if (!input.coreTrouble?.trim()) gaps.push('핵심 고민');
  if (!input.desiredQuestion?.trim()) gaps.push('원하는 질문');
  return gaps;
}

function joinAdditionalContext(input: CommonCaseInput): string {
  const parts: Array<[string, string | undefined]> = [
    ['직업', input.occupation],
    ['현재 상황', input.currentSituation],
    ['관계 상황', input.relationshipSituation],
    ['재정 상황', input.financialSituation],
    ['건강·생활 상황', input.healthLifeSituation],
    ['추가 설명', input.additionalContext],
  ];
  return parts
    .filter(([, v]) => !!v && v.trim())
    .map(([k, v]) => `${k}: ${v!.trim()}`)
    .join(' / ');
}

export function buildCommonResult(input: CommonCaseInput): CommonResultData {
  const inputGaps = findInputGaps(input);
  const now = new Date();
  const currentYear = now.getFullYear();
  const targetYear = input.targetYear ?? currentYear;
  const targetMonth = input.targetMonth ?? now.getMonth() + 1;
  const flowYears = input.flowYears && input.flowYears.length
    ? input.flowYears
    : [targetYear, targetYear + 1, targetYear + 2];

  const additionalContext = joinAdditionalContext(input);

  // 1. 기존 파이프라인을 19개 모듈 전체로 1회 실행 (재계산 아님: 동일 엔진 호출)
  const generator = new ProductGenerator();
  const source = generator.generateProduct(
    {
      birthDate: input.solarBirthDate,
      birthTime: input.birthTime,
      isUnknownTime: input.isUnknownTime,
      gender: input.gender,
      currentEvent: input.coreTrouble,
      userTrouble: input.coreTrouble,
      desiredQuestion: input.desiredQuestion,
      additionalContext: additionalContext || undefined,
      targetYear,
      targetMonth,
    },
    { insightDepth: 5, prescription: true, selectedModules: [...ALL_19_MODULES] }
  );

  const modules: Record<string, any> = {};
  for (const [id, out] of Object.entries(source.executedModules || {})) {
    modules[id] = (out as any)?.data ?? null;
  }

  // 2. 연도별 흐름: 기존 연운 모듈을 연도만 바꿔 호출
  const modularInput: ModularInput = {
    birthDate: input.solarBirthDate,
    birthTime: input.birthTime,
    isUnknownTime: input.isUnknownTime,
    gender: input.gender,
    targetYear,
    targetMonth,
    userTroubleText: [input.coreTrouble, additionalContext].filter(Boolean).join(' / '),
  };

  const timeAxis = source.timeAxisJudgment ?? null;
  const yearFlows: YearFlow[] = flowYears.map((year) => {
    const seunOut: any = moduleRegistry.executeModules(['SEUN'], { ...modularInput, targetYear: year })['SEUN'];
    const seun = seunOut?.data ?? null;
    const isCurrentYear = year === currentYear;
    const seunMonthly: any[] = Array.isArray(seun?.monthlyTimeline) ? seun.monthlyTimeline : [];

    const taMonthly: any[] = isCurrentYear && Array.isArray(timeAxis?.monthlyDynamicFlow)
      ? timeAxis.monthlyDynamicFlow
      : [];

    let monthly: YearFlow['monthly'];
    if (taMonthly.length) {
      monthly = taMonthly.map((m: any) => {
        const sm = seunMonthly.find((x: any) => x.month === m.month);
        return {
          month: m.month,
          label: `${m.month}월(${m.monthGanji})`,
          flow: FLOW_STATUS_KO[m.flowStatus] || String(m.flowStatus || ''),
          relationWithNatal: Array.isArray(m.relationWithNatal) ? m.relationWithNatal : [],
          basis: sm?.basis ?? null,
          advice: m.practicalAdvice ?? null,
        };
      });
    } else {
      monthly = seunMonthly.map((m: any) => ({
        month: m.month,
        label: String(m.name ?? `${m.month}월`),
        flow: String(m.flow ?? ''),
        relationWithNatal: null,
        basis: m.basis ?? null,
        advice: null,
      }));
    }

    // Phase 84: 실제 월별 판정 데이터 기반 동적 구간 추출 (고정 문구 완전 배제)
    const pressureMonths = monthly.filter((m) => m.flow === '압박');
    const reliefMonths = monthly.filter((m) => m.flow === '완화');
    const opportunityMonths = monthly.filter((m) => m.flow === '기회');

    const dynamicPeak = pressureMonths.length
      ? `${year}년 ${pressureMonths.map((m) => m.label).join(', ')} (압박 구간)`
      : `${year}년 특이 압박 구간 없음 (완만한 흐름)`;

    const dynamicRelief = reliefMonths.length
      ? `${year}년 ${reliefMonths.map((m) => m.label).join(', ')} (완화 구간)`
      : `${year}년 점진적 안정 국면`;

    const dynamicRecovery = opportunityMonths.length
      ? `${year}년 ${opportunityMonths.map((m) => m.label).join(', ')} (기회·회복 구간)`
      : `${year}년 하반기 회복 국면`;

    return {
      year,
      ganji: seun?.ganji ?? null,
      peakPeriod: dynamicPeak,
      reliefPeriod: dynamicRelief,
      recoveryPeriod: dynamicRecovery,
      summary: seun?.summary ?? null,
      monthly,
      relationsAvailable: taMonthly.length > 0,
      isCurrentYear,
    };
  });

  // 3. 점수
  const scores = buildResultScore({
    strength: modules['STRENGTH'] ?? null,
    event: source.eventDiagnosis ?? null,
    timeAxis,
  });

  return {
    input,
    inputGaps,
    generatedAt: new Date().toISOString(),
    modules,
    pillars: modules['CORE_ORIGINAL']?.pillars ?? null,
    classification: source.classification,
    integrated: source.integratedAnalysis ?? null,
    event: source.eventDiagnosis ?? null,
    evidence: source.evidenceResult ?? null,
    timeAxis,
    prescription: source.prescriptionSynthesis ?? null,
    yearFlows,
    scores,
    source,
  };
}
