/**
 * YearBoundaryEngine: 입춘 기준 연주(Year Pillar) 산출 엔진
 */

import { EARTHLY_BRANCHES, HEAVENLY_STEMS } from '../../core/constants.js';
import { Pillar } from '../../core/types.js';

export interface YearBoundaryResult {
  sajuYear: number;
  yearPillar: Pillar;
  ipchunDateTimeKST: string;
  isBeforeIpchun: boolean;
}

export class YearBoundaryEngine {
  /**
   * 입춘 기준 연간/연지 계산
   * 서기 4년 = 갑자년 (0, 0)
   */
  public calculate(sajuYear: number, ipchunDateTimeKST: string, isBeforeIpchun: boolean): YearBoundaryResult {
    // 0년(BC 1년) 등 음수 연도 안전 처리
    const offset = sajuYear - 4;
    const stemIndex = ((offset % 10) + 10) % 10;
    const branchIndex = ((offset % 12) + 12) % 12;

    const stem = HEAVENLY_STEMS[stemIndex];
    const branch = EARTHLY_BRANCHES[branchIndex];

    return {
      sajuYear,
      yearPillar: {
        stem,
        branch,
        name: `${stem}${branch}`,
      },
      ipchunDateTimeKST,
      isBeforeIpchun,
    };
  }
}
