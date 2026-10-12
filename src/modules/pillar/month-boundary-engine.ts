/**
 * MonthBoundaryEngine: 절기 기준 월주(Month Pillar) 산출 엔진
 * 연상기월법 (五虎遁月法) 적용
 */

import {
  EARTHLY_BRANCHES,
  HEAVENLY_STEMS,
  MAJOR_SOLAR_TERMS,
  YEAR_STEM_TO_START_MONTH_STEM,
} from '../../core/constants.js';
import { EarthlyBranch, HeavenlyStem, Pillar } from '../../core/types.js';

export interface MonthBoundaryResult {
  monthPillar: Pillar;
  termName: string;
  termDateTimeKST: string;
  monthBranch: EarthlyBranch;
  monthOrder: number; // 1(인) ~ 12(축)
}

export class MonthBoundaryEngine {
  // 인월(1월)부터 축월(12월)까지의 지지 순서
  private readonly MONTH_BRANCH_ORDER: EarthlyBranch[] = [
    '인', '묘', '진', '사', '오', '미',
    '신', '유', '술', '해', '자', '축',
  ];

  /**
   * 연간과 절기에 따른 월주 산출
   */
  public calculate(
    yearStem: HeavenlyStem,
    majorTermName: string,
    majorTermDateTimeKST: string,
    monthBranch: EarthlyBranch
  ): MonthBoundaryResult {
    // 1. 월지 순서 오프셋 (인=0, 묘=1, ..., 축=11)
    const branchOffset = this.MONTH_BRANCH_ORDER.indexOf(monthBranch);
    const safeBranchOffset = branchOffset >= 0 ? branchOffset : 0;

    // 2. 연상기월법에 따른 인월의 천간 시작점
    const startStem = YEAR_STEM_TO_START_MONTH_STEM[yearStem];
    const startStemIndex = HEAVENLY_STEMS.indexOf(startStem);

    // 3. 해당 월의 천간 계산
    const monthStemIndex = (startStemIndex + safeBranchOffset) % 10;
    const monthStem = HEAVENLY_STEMS[monthStemIndex];

    return {
      monthPillar: {
        stem: monthStem,
        branch: monthBranch,
        name: `${monthStem}${monthBranch}`,
      },
      termName: majorTermName,
      termDateTimeKST: majorTermDateTimeKST,
      monthBranch,
      monthOrder: safeBranchOffset + 1,
    };
  }
}
