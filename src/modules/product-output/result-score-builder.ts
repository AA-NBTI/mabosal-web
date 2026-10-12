/**
 * src/modules/product-output/result-score-builder.ts
 *
 * Phase 83: 기본 점수 (ResultScore) 구성
 *
 * 원칙: 엔진이 실제로 산출한 값만 숫자로 노출한다.
 * - COMPUTED      : 엔진 정량 산출값 (일간 강약 점수, 사건 영향 강도 등)
 * - RULE_DERIVED  : 엔진 규칙값에서 파생 (월별 흐름 상태 값의 평균)
 * - NOT_AVAILABLE : 근거 없음 → value = null (숫자를 만들지 않음)
 */

import type { ResultScore, ScoreEntry } from './types.js';

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function na(key: string, label: string, reason: string): ScoreEntry {
  return { key, label, value: null, max: 100, status: 'NOT_AVAILABLE', basis: reason };
}

function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export interface ScoreSource {
  strength: any | null; // 일간 강약 결과 data
  event: any | null;    // 사건 진단 결과
  timeAxis: any | null; // 시간축 판단 결과
}

export function buildResultScore(src: ScoreSource): ResultScore {
  const { strength, event, timeAxis } = src;

  // 현재 고민 영향 강도 (사건 진단 엔진 산출)
  const currentIssue: ScoreEntry = isNum(event?.intensityScore)
    ? {
        key: 'currentIssue',
        label: '현재 고민 영향 강도',
        value: round1(event.intensityScore),
        max: 100,
        status: 'COMPUTED',
        basis: '명리 구조가 현재 고민에 미치는 영향의 강도입니다.',
      }
    : na('currentIssue', '현재 고민 영향 강도', '사건 진단 결과가 없어 산출하지 않았습니다.');

  // 올해 시기 압박 강도 (월별 흐름 상태 규칙값의 평균)
  const monthly: any[] = Array.isArray(timeAxis?.monthlyDynamicFlow) ? timeAxis.monthlyDynamicFlow : [];
  const monthlyVals = monthly.map((m) => m?.intensityScore).filter(isNum);
  const timing: ScoreEntry = monthlyVals.length
    ? {
        key: 'timing',
        label: '올해 시기 압박 강도(월평균)',
        value: round1(monthlyVals.reduce((a, b) => a + b, 0) / monthlyVals.length),
        max: 100,
        status: 'RULE_DERIVED',
        basis: `올해 ${monthlyVals.length}개월의 월별 흐름 상태 값을 평균한 값입니다. 높을수록 압박 구간이 많습니다.`,
      }
    : na('timing', '올해 시기 압박 강도(월평균)', '월별 흐름 결과가 없어 산출하지 않았습니다.');

  const extras: ScoreEntry[] = [];

  if (isNum(strength?.score)) {
    extras.push({
      key: 'dayMasterStrength',
      label: '일간 강약 점수',
      value: round1(strength.score),
      max: 100,
      status: 'COMPUTED',
      basis: `득령·득지·득세를 가중 합산한 정량 점수입니다${strength.status ? ` (판정: ${strength.status})` : ''}.`,
    });
  }
  if (isNum(event?.relevanceScore)) {
    extras.push({
      key: 'issueRelevance',
      label: '고민과 명리 구조의 관련성',
      value: round1(event.relevanceScore),
      max: 100,
      status: 'COMPUTED',
      basis: '입력한 고민이 원국 구조와 얼마나 맞닿아 있는지를 나타냅니다.',
    });
  }
  if (isNum(event?.evidenceScore)) {
    extras.push({
      key: 'evidenceDepth',
      label: '명리 근거 충실도',
      value: round1(event.evidenceScore),
      max: 100,
      status: 'COMPUTED',
      basis: '진단에 사용된 명리 근거가 얼마나 확보되었는지를 나타냅니다.',
    });
  }

  const noLogic = '엔진에 이 항목의 점수 산출 로직이 없어 숫자를 만들지 않았습니다.';
  return {
    overall: na('overall', '종합 흐름', noLogic),
    career: na('career', '직업', noLogic),
    money: na('money', '재물', noLogic),
    relationship: na('relationship', '관계', noLogic),
    currentIssue,
    timing,
    prescription: na('prescription', '처방 적합도', noLogic),
    extras,
  };
}

/** ResultScore 를 표시 순서대로 평탄화 */
export function flattenScores(s: ResultScore): ScoreEntry[] {
  return [s.overall, s.career, s.money, s.relationship, s.currentIssue, s.timing, s.prescription, ...s.extras];
}
