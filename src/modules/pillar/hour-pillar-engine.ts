/**
 * HourPillarEngine: 시지 및 시주(Hour Pillar) 산출 엔진
 * 일상기시법 (五鼠遁時法) 적용
 * 
 * 원칙:
 * 출생시간이 없으면 절대로 임의의 시간을 채우지 않고 hour = null 로 유지합니다.
 */

import {
  DAY_STEM_TO_START_HOUR_STEM,
  EARTHLY_BRANCHES,
  HEAVENLY_STEMS,
} from '../../core/constants.js';
import { EarthlyBranch, HeavenlyStem, Pillar, TimeDependencyInfo } from '../../core/types.js';

export interface HourPillarResult {
  hourPillar: Pillar | null;
  timeDependency: TimeDependencyInfo;
  hourBranch: EarthlyBranch | null;
  hourRange: string | null;
  calculationMethod: string;
}

export class HourPillarEngine {
  /**
   * 일간과 시지에 따른 시주 산출
   * @param dayStem 일간
   * @param hourBranch 시지 (시간 미상 시 null)
   */
  public calculate(
    dayStem: HeavenlyStem,
    hourBranch: EarthlyBranch | null,
    hourRange: string | null = null
  ): HourPillarResult {
    // 1. 출생시간 미상인 경우
    if (!hourBranch) {
      return {
        hourPillar: null,
        timeDependency: {
          requires_hour: true,
          time_dependency: 80.0, // 시주 미상 시 시간 의존성 지표 높음
          is_missing_hour: true,
          notes: '출생시간이 제공되지 않아 시주를 null로 유지합니다. 시주 의존적 분석은 신뢰도가 조정됩니다.',
        },
        hourBranch: null,
        hourRange: null,
        calculationMethod: 'missing_hour',
      };
    }

    // 2. 지지 순서 인덱스 (자=0, 축=1, ..., 해=11)
    const branchIndex = EARTHLY_BRANCHES.indexOf(hourBranch);

    // 3. 일상기시법에 따른 자시의 천간 시작점
    const startStem = DAY_STEM_TO_START_HOUR_STEM[dayStem];
    const startStemIndex = HEAVENLY_STEMS.indexOf(startStem);

    // 4. 해당 시진의 천간 계산
    const hourStemIndex = (startStemIndex + branchIndex) % 10;
    const hourStem = HEAVENLY_STEMS[hourStemIndex];

    const hourPillar: Pillar = {
      stem: hourStem,
      branch: hourBranch,
      name: `${hourStem}${hourBranch}`,
    };

    return {
      hourPillar,
      timeDependency: {
        requires_hour: false,
        time_dependency: 0.0,
        is_missing_hour: false,
      },
      hourBranch,
      hourRange,
      calculationMethod: '五鼠遁時法 (일간 기준 자시 천간 순환)',
    };
  }
}
