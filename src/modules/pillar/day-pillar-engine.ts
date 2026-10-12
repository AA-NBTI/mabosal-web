/**
 * DayPillarEngine: 기준일(Anchor) 기반 일주(Day Pillar) 산출 엔진
 * CivilDayBoundary와 SajuDayBoundary를 명시적으로 분리 보존
 */

import { EARTHLY_BRANCHES, HEAVENLY_STEMS, SIXTY_GANJI } from '../../core/constants.js';
import { Pillar } from '../../core/types.js';

export interface DayPillarResult {
  dayPillar: Pillar;
  civilDate: string;        // 양력 달력상 날짜 (YYYY-MM-DD)
  sajuDate: string;         // 사주 일진 적용 날짜 (23시 이후 익일 전환 등 반영)
  anchorDate: string;       // 기준일 (2000-01-01)
  anchorGanjiIndex: number; // 54 (무오, 戊午)
  diffDaysFromAnchor: number;
  ganjiIndex: number;       // 0~59
}

export class DayPillarEngine {
  // 기준일: 2000년 1월 1일 = 무오(戊午)일 (인덱스 54)
  public readonly ANCHOR_DATE_STR = '2000-01-01';
  public readonly ANCHOR_GANJI_INDEX = 54; // 무(4), 오(6) -> 60갑자 중 54번째 (0-indexed)

  /**
   * 사주 일진 계산
   * @param civilDate 양력 역법 날짜 (YYYY-MM-DD)
   * @param sajuDate 사주 경계가 적용된 날짜 (YYYY-MM-DD)
   */
  public calculate(civilDate: string, sajuDate: string): DayPillarResult {
    const [aY, aM, aD] = this.ANCHOR_DATE_STR.split('-').map(Number);
    const anchorUtc = Date.UTC(aY, aM - 1, aD);

    const [tY, tM, tD] = sajuDate.split('-').map(Number);
    const targetUtc = Date.UTC(tY, tM - 1, tD);

    // 날짜 간 차이 일수 계산 (정수)
    const diffDays = Math.round((targetUtc - anchorUtc) / (24 * 3600 * 1000));

    // 60갑자 인덱스 순환
    const ganjiIndex = ((this.ANCHOR_GANJI_INDEX + (diffDays % 60)) % 60 + 60) % 60;

    const stemIndex = ganjiIndex % 10;
    const branchIndex = ganjiIndex % 12;

    const stem = HEAVENLY_STEMS[stemIndex];
    const branch = EARTHLY_BRANCHES[branchIndex];

    return {
      dayPillar: {
        stem,
        branch,
        name: `${stem}${branch}`,
      },
      civilDate,
      sajuDate,
      anchorDate: this.ANCHOR_DATE_STR,
      anchorGanjiIndex: this.ANCHOR_GANJI_INDEX,
      diffDaysFromAnchor: diffDays,
      ganjiIndex,
    };
  }
}
