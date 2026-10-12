/**
 * DaewoonEngine: 대운(大運) 산출 엔진
 * 
 * 원리:
 * - 양남음녀(陽男陰女): 순행 (월주에서 60갑자 다음 순서로 진행)
 * - 음남양녀(陰男陽女): 역행 (월주에서 60갑자 이전 순서로 진행)
 * - 대운수: 출생일시부터 순행은 다음 절(節), 역행은 이전 절(節)까지의 일수 / 3 (1~10세)
 */

import { EARTHLY_BRANCHES, HEAVENLY_STEMS, SIXTY_GANJI, STEM_INFO } from '../../core/constants.js';
import { EarthlyBranch, HeavenlyStem, Pillar } from '../../core/types.js';
import { getSurroundingSolarTerms } from '../calendar/solar-term-engine.js';

export type Gender = 'male' | 'female';

export interface SingleDaewoon {
  step: number;          // 대운 순번 (1, 2, 3...)
  startAge: number;      // 대운 시작 나이 (한국 나이 기준)
  endAge: number;        // 대운 종료 나이
  startYear: number;     // 시작 연도
  endYear: number;       // 종료 연도
  pillar: Pillar;        // 대운 간지 (예: 갑자)
}

export interface DaewoonResult {
  isForward: boolean;    // 순행(true) or 역행(false)
  directionReason: string;
  daewoonNumber: number; // 대운수 (1 ~ 10)
  targetMajorTerm: {
    name: string;
    exactDateTimeKST: string;
    diffDays: number;
  };
  daewoonList: SingleDaewoon[];
}

export class DaewoonEngine {
  /**
   * 대운 산출
   */
  public calculate(
    yearStem: HeavenlyStem,
    monthPillar: Pillar,
    birthUtcDate: Date,
    birthYear: number,
    gender: Gender = 'male'
  ): DaewoonResult {
    // 1. 년간의 음양 확인
    const yearStemYinYang = STEM_INFO[yearStem].yinYang; // '양' or '음'

    // 2. 순행 / 역행 판정 (양남음녀 순행, 음남양녀 역행)
    let isForward = false;
    if (gender === 'male') {
      isForward = yearStemYinYang === '양';
    } else {
      isForward = yearStemYinYang === '음';
    }

    const directionReason = `${gender === 'male' ? '남성' : '여성'} / 년간 ${yearStem}(${yearStemYinYang}) → ${isForward ? '순행' : '역행'}`;

    // 3. 대운수 계산 (다음 절 또는 이전 절과의 일수 차이 / 3)
    const terms = getSurroundingSolarTerms(birthUtcDate);
    // 순행이면 다음 절(nextMajorTerm), 역행이면 이전 절(previousMajorTerm) - 12절(節) 기준 정통 산출
    const targetTerm = isForward ? (terms.nextMajorTerm || terms.nextTerm) : terms.previousMajorTerm;

    const diffMillis = Math.abs(birthUtcDate.getTime() - targetTerm.exactDateTimeUTC.getTime());
    const diffDays = diffMillis / (24 * 3600 * 1000);

    // 3일 = 1년, 1일 = 4개월. 전통적으로 3으로 나눈 후 반올림하여 1~10의 정수 대운수를 취함
    let daewoonNumber = Math.round(diffDays / 3);
    if (daewoonNumber < 1) daewoonNumber = 1;
    if (daewoonNumber > 10) daewoonNumber = 10;

    // 4. 월주 기준 60갑자 순행/역행 리스트 10개 대운 생성
    const monthGanjiName = monthPillar.name || `${monthPillar.stem}${monthPillar.branch}`;
    const startIdx = SIXTY_GANJI.indexOf(monthGanjiName);

    const daewoonList: SingleDaewoon[] = [];
    for (let step = 1; step <= 10; step++) {
      const ganjiIdx = isForward
        ? (startIdx + step) % 60
        : (startIdx - step + 60) % 60;

      const ganjiName = SIXTY_GANJI[ganjiIdx];
      const stem = ganjiName[0] as HeavenlyStem;
      const branch = ganjiName[1] as EarthlyBranch;

      const startAge = (step - 1) * 10 + daewoonNumber;
      const endAge = startAge + 9;
      const startYear = birthYear + startAge - 1;
      const endYear = startYear + 9;

      daewoonList.push({
        step,
        startAge,
        endAge,
        startYear,
        endYear,
        pillar: {
          stem,
          branch,
          name: ganjiName,
        },
      });
    }

    return {
      isForward,
      directionReason,
      daewoonNumber,
      targetMajorTerm: {
        name: targetTerm.termName,
        exactDateTimeKST: targetTerm.kst.formatted,
        diffDays: Math.round(diffDays * 100) / 100,
      },
      daewoonList,
    };
  }
}
