/**
 * FiveElementsEngine: 오행 분포 및 편중도(Imbalance) 산출 모듈
 * 
 * 원칙:
 * 월령(월지)의 계절적 사령 가중치를 반영하여
 * 목·화·토·금·수 각 오행의 에너지 점수를 0~100 연속값으로 산출하고,
 * 오행 편중도(Imbalance) 지표를 보존합니다.
 */

import { STEM_INFO } from '../../core/constants.js';
import { EarthlyBranch, FiveElement, FourPillars, HeavenlyStem } from '../../core/types.js';
import { HIDDEN_STEMS_DETAIL } from './hidden-stems.js';

export interface ElementDistribution {
  element: FiveElement;
  rawScore: number;       // 가중치 합산 원점수
  percentage: number;     // 0.00 ~ 100.00 %
  count: number;          // 출현 천간/지지 개수
}

export interface FiveElementsAnalysis {
  distribution: Record<FiveElement, ElementDistribution>;
  dominantElement: FiveElement;       // 최강 오행
  weakestElement: FiveElement;        // 최약(또는 결핍) 오행
  missingElements: FiveElement[];     // 0%인 오행 목록
  imbalanceScore: number;             // 편중도 (0: 완전 균형 ~ 100: 극단 편고)
  calculationWeights: {
    monthBranchMultiplier: number;
    dayBranchMultiplier: number;
    otherBranchMultiplier: number;
    stemMultiplier: number;
  };
}

export class FiveElementsEngine {
  // 위치별 에너지 가중치
  private readonly WEIGHTS = {
    monthBranch: 3.0, // 월령의 계절 사령 가중치
    dayBranch: 1.5,   // 일지 가중치
    yearBranch: 1.0,  // 년지 가중치
    hourBranch: 1.0,  // 시지 가중치
    stem: 1.0,        // 천간 가중치
  };

  public calculate(pillars: FourPillars): FiveElementsAnalysis {
    const rawScores: Record<FiveElement, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
    const counts: Record<FiveElement, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };

    // 1. 천간 점수 가산
    const stems: (HeavenlyStem | null)[] = [
      pillars.year.stem,
      pillars.month.stem,
      pillars.day.stem,
      pillars.hour ? pillars.hour.stem : null,
    ];

    for (const stem of stems) {
      if (!stem) continue;
      const el = STEM_INFO[stem].element;
      rawScores[el] += this.WEIGHTS.stem;
      counts[el] += 1;
    }

    // 2. 지지(지장간 비율 기반) 점수 가산
    const branches: { pos: 'year' | 'month' | 'day' | 'hour'; branch: EarthlyBranch | null }[] = [
      { pos: 'month', branch: pillars.month.branch },
      { pos: 'day', branch: pillars.day.branch },
      { pos: 'year', branch: pillars.year.branch },
      { pos: 'hour', branch: pillars.hour ? pillars.hour.branch : null },
    ];

    for (const bItem of branches) {
      if (!bItem.branch) continue;
      const entries = HIDDEN_STEMS_DETAIL[bItem.branch];

      let branchMultiplier = this.WEIGHTS.yearBranch;
      if (bItem.pos === 'month') branchMultiplier = this.WEIGHTS.monthBranch;
      else if (bItem.pos === 'day') branchMultiplier = this.WEIGHTS.dayBranch;
      else if (bItem.pos === 'hour') branchMultiplier = this.WEIGHTS.hourBranch;

      for (const entry of entries) {
        const el = entry.element;
        // 지장간 일수 비율(ratio) × 지지 위치 가중치
        rawScores[el] += entry.ratio * branchMultiplier;
      }
      // 지지 본체 오행 개수 카운트
      const mainEntry = entries.find(e => e.type === 'main')!;
      counts[mainEntry.element] += 1;
    }

    // 3. 총합 및 백분율 정규화 (0~100%)
    const totalScore = Object.values(rawScores).reduce((a, b) => a + b, 0);

    const distribution: Record<FiveElement, ElementDistribution> = {} as any;
    const elements: FiveElement[] = ['목', '화', '토', '금', '수'];

    let maxScore = -1;
    let minScore = 999999;
    let dominantEl: FiveElement = '목';
    let weakestEl: FiveElement = '목';
    const missing: FiveElement[] = [];

    for (const el of elements) {
      const score = rawScores[el];
      const pct = totalScore > 0 ? (score / totalScore) * 100 : 20.0;
      const roundedPct = Math.round(pct * 100) / 100;

      distribution[el] = {
        element: el,
        rawScore: Math.round(score * 100) / 100,
        percentage: roundedPct,
        count: counts[el],
      };

      if (score > maxScore) {
        maxScore = score;
        dominantEl = el;
      }
      if (score < minScore) {
        minScore = score;
        weakestEl = el;
      }
      // 결핍 오행 판정: 원점수가 0이거나 0.05 미만인 경우만 결핍으로 처리 (지장간에 존재하는 오행의 결핍 오판 방지)
      if (score === 0 || score < 0.05) {
        missing.push(el);
      }
    }

    // 3-1. 100.00% 정규화 잔여 보정 (가장 큰 원점수 오행에 잔여값 가감)
    let currentPctSum = 0;
    for (const el of elements) {
      currentPctSum += distribution[el].percentage;
    }
    currentPctSum = Math.round(currentPctSum * 100) / 100;
    const remainder = Math.round((100.00 - currentPctSum) * 100) / 100;
    if (remainder !== 0 && dominantEl) {
      distribution[dominantEl].percentage = Math.round((distribution[dominantEl].percentage + remainder) * 100) / 100;
    }

    // 4. 편중도(Imbalance) 산출 (0~100 연속값)
    // 이상적인 균형은 각 오행 20% (표준편차 0)
    // 표준편차가 커질수록 편중도 증가 (최대 편차 약 40에 근접할 때 100점)
    let varianceSum = 0;
    for (const el of elements) {
      const diff = distribution[el].percentage - 20.0;
      varianceSum += diff * diff;
    }
    const standardDeviation = Math.sqrt(varianceSum / 5);
    // 표준편차 30 이상이면 극단적 편고 (100점 도달)
    const imbalanceScore = Math.min(100.0, Math.round((standardDeviation / 30) * 10000) / 100);

    return {
      distribution,
      dominantElement: dominantEl,
      weakestElement: weakestEl,
      missingElements: missing,
      imbalanceScore,
      calculationWeights: {
        monthBranchMultiplier: this.WEIGHTS.monthBranch,
        dayBranchMultiplier: this.WEIGHTS.dayBranch,
        otherBranchMultiplier: this.WEIGHTS.yearBranch,
        stemMultiplier: this.WEIGHTS.stem,
      },
    };
  }
}
