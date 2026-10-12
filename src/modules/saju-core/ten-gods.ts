/**
 * TenGodsEngine: 십신(十神) 판정 엔진
 * 
 * 일간(Day Master)을 기준으로 타 천간/지지의 오행 생극 및 음양을 비교하여
 * 비견, 겁재, 식신, 상관, 편재, 정재, 편관, 정관, 편인, 정인 도출
 */

import { HIDDEN_STEMS, STEM_INFO } from '../../core/constants.js';
import { EarthlyBranch, FiveElement, HeavenlyStem, TenGod, YinYang } from '../../core/types.js';

// 오행 상생: key가 value를 생함
export const ELEMENT_PRODUCES: Record<FiveElement, FiveElement> = {
  목: '화',
  화: '토',
  토: '금',
  금: '수',
  수: '목',
};

// 오행 상극: key가 value를 극함
export const ELEMENT_CONTROLS: Record<FiveElement, FiveElement> = {
  목: '토',
  토: '수',
  수: '화',
  화: '금',
  금: '목',
};

export class TenGodsEngine {
  /**
   * 일간과 대상 천간의 십신 판정
   */
  public getTenGodForStem(dayStem: HeavenlyStem, targetStem: HeavenlyStem): TenGod {
    const dayInfo = STEM_INFO[dayStem];
    const targetInfo = STEM_INFO[targetStem];

    const isSameYinYang = dayInfo.yinYang === targetInfo.yinYang;

    // 1. 비겁 (동일 오행)
    if (dayInfo.element === targetInfo.element) {
      return isSameYinYang ? '비견' : '겁재';
    }

    // 2. 식상 (일간이 대상 생함)
    if (ELEMENT_PRODUCES[dayInfo.element] === targetInfo.element) {
      return isSameYinYang ? '식신' : '상관';
    }

    // 3. 재성 (일간이 대상 극함)
    if (ELEMENT_CONTROLS[dayInfo.element] === targetInfo.element) {
      return isSameYinYang ? '편재' : '정재';
    }

    // 4. 관성 (대상이 일간 극함)
    if (ELEMENT_CONTROLS[targetInfo.element] === dayInfo.element) {
      return isSameYinYang ? '편관' : '정관';
    }

    // 5. 인성 (대상이 일간 생함)
    if (ELEMENT_PRODUCES[targetInfo.element] === dayInfo.element) {
      return isSameYinYang ? '편인' : '정인';
    }

    throw new Error(`십신 계산 불가: dayStem=${dayStem}, targetStem=${targetStem}`);
  }

  /**
   * 일간과 대상 지지(정기 기준)의 십신 판정 (명리학 표준: 지장간 정기의 음양오행 기준)
   */
  public getTenGodForBranchMain(dayStem: HeavenlyStem, branch: EarthlyBranch): TenGod {
    const mainStem = HIDDEN_STEMS[branch].main;
    return this.getTenGodForStem(dayStem, mainStem);
  }
}
