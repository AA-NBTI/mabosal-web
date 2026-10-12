/**
 * CandidateEngine: 출생시간 경계시 복수 후보(Candidate A, B, C / A1, A2, B1, B2) 생성 및 민감도 분석기
 * 
 * 원칙:
 * 1. 시진 경계(±15분 이내) 및 절기 경계(±120분 이내)일 경우 하나를 임의로 확정하지 않고 후보군을 명시적으로 생성합니다.
 * 2. 시진 경계 직후 15분 이내 -> 직전 시진을 Candidate B, 경계 직전 15분 이내 -> 다음 시진을 Candidate B로 배정합니다.
 * 3. 절기 경계 출생 시 연주·월주의 양쪽 가능성(입춘/절기 전후)을 후보로 생성하며, 시진 경계와 동시 발생 시 최대 4개 조합을 생성합니다.
 */

import { EARTHLY_BRANCHES } from '../../core/constants.js';
import {
  BoundaryAnalysisResult,
  EarthlyBranch,
  FourPillars,
  Pillar,
  PillarCandidate,
} from '../../core/types.js';
import { HourPillarEngine } from './hour-pillar-engine.js';

export interface SolarTermCandidateOptions {
  isNearSolarTermBoundary: boolean;
  diffMinutes: number;
  boundaryTermName?: string;
  alternativeYearPillar?: Pillar;
  alternativeMonthPillar?: Pillar;
}

export class CandidateEngine {
  private hourPillarEngine = new HourPillarEngine();

  /**
   * 경계 시간 분석 및 후보군 생성
   */
  public generateCandidates(
    yearPillar: FourPillars['year'],
    monthPillar: FourPillars['month'],
    dayPillar: FourPillars['day'],
    currentHourBranch: EarthlyBranch | null,
    isNearBoundary: boolean,
    diffMinutes: number = 0,
    hourRange: string | null = null,
    hourDirection?: 'after' | 'before',
    solarTermOptions?: SolarTermCandidateOptions
  ): BoundaryAnalysisResult {
    const currentHourPillar = currentHourBranch
      ? this.hourPillarEngine.calculate(dayPillar.stem, currentHourBranch).hourPillar
      : null;

    const hasHourIssue = Boolean(currentHourBranch && isNearBoundary);
    const hasTermIssue = Boolean(
      solarTermOptions?.isNearSolarTermBoundary &&
      (solarTermOptions.alternativeYearPillar || solarTermOptions.alternativeMonthPillar)
    );

    // 1. 시진 경계도 아니고 절기 경계도 아닌 경우 -> 단일 확정
    if (!hasHourIssue && !hasTermIssue) {
      const singlePillars: FourPillars = {
        year: yearPillar,
        month: monthPillar,
        day: dayPillar,
        hour: currentHourPillar,
      };

      return {
        has_boundary_issue: false,
        candidates: [
          {
            candidate_id: 'A',
            label: currentHourBranch ? `기준시주 (${currentHourBranch}시)` : '시간미상',
            pillars: singlePillars,
            probability: 100.0,
          },
        ],
        selected_candidate: 'A',
        selection_reason: currentHourBranch ? '경계 범위 밖 단일 확정 명식' : '출생시간 미상으로 3주 기준 분석',
        boundary_sensitivity: 0.0,
        confidence: currentHourBranch ? 100.0 : 75.0,
      };
    }

    // 2. 시진 후보 계산
    let hourCandidates: { branch: EarthlyBranch; pillar: Pillar | null; prob: number }[] = [];
    let hourSensitivity = 0;
    let hourDiff = diffMinutes;

    if (hasHourIssue && currentHourBranch) {
      const currentBranchIdx = EARTHLY_BRANCHES.indexOf(currentHourBranch);
      const prevBranchIdx = (currentBranchIdx - 1 + 12) % 12;
      const nextBranchIdx = (currentBranchIdx + 1) % 12;

      const branchA = currentHourBranch;
      // 경계 직후(after) -> 직전 시진, 경계 직전(before) -> 다음 시진
      const branchB = (hourDirection === 'after')
        ? EARTHLY_BRANCHES[prevBranchIdx]
        : EARTHLY_BRANCHES[nextBranchIdx];

      const hourPillarA = this.hourPillarEngine.calculate(dayPillar.stem, branchA).hourPillar;
      const hourPillarB = this.hourPillarEngine.calculate(dayPillar.stem, branchB).hourPillar;

      const probA = Math.round((50 + (diffMinutes / 15) * 35) * 100) / 100;
      const probB = Math.round((100 - probA) * 100) / 100;

      hourCandidates = [
        { branch: branchA, pillar: hourPillarA, prob: probA },
        { branch: branchB, pillar: hourPillarB, prob: probB },
      ];
      hourSensitivity = Math.max(0, Math.min(100, 100 - (diffMinutes / 15) * 60));
    } else {
      hourCandidates = [
        { branch: currentHourBranch ?? '자', pillar: currentHourPillar, prob: 100.0 },
      ];
    }

    // 3. 절기 후보 계산
    let termCandidates: { year: Pillar; month: Pillar; label: string; prob: number; termDiff: number }[] = [];
    let termSensitivity = 0;

    if (hasTermIssue && solarTermOptions) {
      const altYear = solarTermOptions.alternativeYearPillar ?? yearPillar;
      const altMonth = solarTermOptions.alternativeMonthPillar ?? monthPillar;
      const termDiff = solarTermOptions.diffMinutes ?? 0;

      const probA = Math.round((50 + (termDiff / 120) * 35) * 100) / 100;
      const probB = Math.round((100 - probA) * 100) / 100;

      termCandidates = [
        {
          year: yearPillar,
          month: monthPillar,
          label: `기준 절기 [${yearPillar.name}년 ${monthPillar.name}월]`,
          prob: probA,
          termDiff,
        },
        {
          year: altYear,
          month: altMonth,
          label: `대안 절기 [${altYear.name}년 ${altMonth.name}월]`,
          prob: probB,
          termDiff,
        },
      ];
      termSensitivity = Math.max(0, Math.min(100, 100 - (termDiff / 120) * 60));
    } else {
      termCandidates = [
        {
          year: yearPillar,
          month: monthPillar,
          label: `확정 절기 [${yearPillar.name}년 ${monthPillar.name}월]`,
          prob: 100.0,
          termDiff: 0,
        },
      ];
    }

    // 4. 후보 조합 결합 (Cartesian Product)
    const candidates: PillarCandidate[] = [];

    if (hasHourIssue && hasTermIssue) {
      // 4개 조합: A1, A2, B1, B2
      const termLabels = ['A', 'B'];
      for (let tIdx = 0; tIdx < termCandidates.length; tIdx++) {
        const tCand = termCandidates[tIdx];
        const tPrefix = termLabels[tIdx];
        for (let hIdx = 0; hIdx < hourCandidates.length; hIdx++) {
          const hCand = hourCandidates[hIdx];
          const candId = `${tPrefix}${hIdx + 1}`;
          const combinedProb = Math.round((tCand.prob * hCand.prob / 100) * 100) / 100;

          candidates.push({
            candidate_id: candId,
            label: `시나리오 ${candId} (${tCand.year.name}년 ${tCand.month.name}월 + ${hCand.branch}시)`,
            pillars: {
              year: tCand.year,
              month: tCand.month,
              day: dayPillar,
              hour: hCand.pillar,
            },
            probability: combinedProb,
            time_boundary_offset_minutes: Math.min(tCand.termDiff, hourDiff),
          });
        }
      }
    } else if (hasTermIssue) {
      // 절기 경계 단독: Candidate A, Candidate B
      candidates.push(
        {
          candidate_id: 'A',
          label: `시나리오 A (${termCandidates[0].year.name}년 ${termCandidates[0].month.name}월 적용)`,
          pillars: {
            year: termCandidates[0].year,
            month: termCandidates[0].month,
            day: dayPillar,
            hour: hourCandidates[0].pillar,
          },
          probability: termCandidates[0].prob,
          time_boundary_offset_minutes: termCandidates[0].termDiff,
        },
        {
          candidate_id: 'B',
          label: `시나리오 B (${termCandidates[1].year.name}년 ${termCandidates[1].month.name}월 적용)`,
          pillars: {
            year: termCandidates[1].year,
            month: termCandidates[1].month,
            day: dayPillar,
            hour: hourCandidates[0].pillar,
          },
          probability: termCandidates[1].prob,
          time_boundary_offset_minutes: termCandidates[1].termDiff,
        }
      );
    } else {
      // 시진 경계 단독: Candidate A, Candidate B
      candidates.push(
        {
          candidate_id: 'A',
          label: `시나리오 A (${hourCandidates[0].branch}시 적용)`,
          pillars: {
            year: yearPillar,
            month: monthPillar,
            day: dayPillar,
            hour: hourCandidates[0].pillar,
          },
          probability: hourCandidates[0].prob,
          time_boundary_offset_minutes: hourDiff,
        },
        {
          candidate_id: 'B',
          label: `시나리오 B (${hourCandidates[1].branch}시 적용)`,
          pillars: {
            year: yearPillar,
            month: monthPillar,
            day: dayPillar,
            hour: hourCandidates[1].pillar,
          },
          probability: hourCandidates[1].prob,
          time_boundary_offset_minutes: hourDiff,
        }
      );
    }

    const overallSensitivity = Math.max(hourSensitivity, termSensitivity);
    const confidence = Math.max(50, 100 - overallSensitivity * 0.4);

    let selectionReason = '';
    let consensusSummary = '';
    let differenceSummary = '';

    if (hasHourIssue && hasTermIssue) {
      selectionReason = `절기 경계(${solarTermOptions?.diffMinutes}분)와 시진 경계(${hourDiff}분)가 동시에 인접하여 최대 4개 시나리오 후보군을 보존합니다.`;
      consensusSummary = `일주(${dayPillar.name}) 1기둥은 100% 확정 유지됩니다.`;
      differenceSummary = `연주/월주([${termCandidates[0].year.name}년 ${termCandidates[0].month.name}월] ↔ [${termCandidates[1].year.name}년 ${termCandidates[1].month.name}월])와 시주([${hourCandidates[0].pillar?.name}] ↔ [${hourCandidates[1].pillar?.name}])가 복합 분기됩니다.`;
    } else if (hasTermIssue) {
      selectionReason = `절기 [${solarTermOptions?.boundaryTermName ?? '경계'}] 시각과 ${solarTermOptions?.diffMinutes}분 차이로 인접하여 연/월주 후보 A와 B를 모두 보존합니다.`;
      consensusSummary = `일주(${dayPillar.name}) 및 시주(${currentHourPillar ? currentHourPillar.name : '시간미상'})는 일치합니다.`;
      differenceSummary = `연주·월주가 [${termCandidates[0].year.name}년 ${termCandidates[0].month.name}월]과 [${termCandidates[1].year.name}년 ${termCandidates[1].month.name}월]로 분기됩니다.`;
    } else {
      selectionReason = `시진 경계시각(오차 ${hourDiff}분)에 근접하여 후보 A(${hourCandidates[0].branch}시)와 B(${hourCandidates[1].branch}시)를 모두 평가 대상으로 보존합니다.`;
      consensusSummary = `연주(${yearPillar.name}), 월주(${monthPillar.name}), 일주(${dayPillar.name}) 3기둥은 100% 일치합니다.`;
      differenceSummary = `시주가 ${hourCandidates[0].pillar?.name}과 ${hourCandidates[1].pillar?.name}로 분기됩니다.`;
    }

    return {
      has_boundary_issue: true,
      candidates,
      selected_candidate: null,
      selection_reason: selectionReason,
      consensus_summary: consensusSummary,
      difference_summary: differenceSummary,
      boundary_sensitivity: overallSensitivity,
      confidence,
    };
  }
}
