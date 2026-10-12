/**
 * HiddenStemsEngine: 지장간 분해 및 월률분야 산출 모듈 (Phase 58.2 Freeze)
 * 
 * [절대 원칙: 지장간 ≠ 월률분야]
 * 1. 지장간 (Pure Hidden Stems): 각 지지가 품고 있는 고유한 천간 성분 (초기, 중기, 정기)
 * 2. 월률분야 (Month Command Division): 월령(월지)에 국한하여 당령/사령하는 30일 기준 일수 배분
 *    - 인신사해 (생지): 여기 7일(23.33%), 중기 7일(23.33%), 정기 16일(53.34%)
 *    - 자묘유 (왕지): 여기 10일(33.33%), 정기 20일(66.67%)
 *    - 오 (왕지 특수): 여기 병 10일(33.33%), 중기 기 9일(30.00%), 정기 정 11일(36.67%)
 *    - 진술축미 (고지): 여기 9일(30.00%), 중기 3일(10.00%), 정기 18일(60.00%)
 */

import { EarthlyBranch, FiveElement, HeavenlyStem } from '../../core/types.js';
import { 
  PURE_HIDDEN_STEMS, 
  MONTH_COMMAND_DIVISION_TABLE, 
  MYEONGLI_RULE_VERSIONS 
} from '../../core/myeongli-rule-spec.js';
import type {
  PureHiddenStemEntry,
  MonthCommandStemRatio
} from '../../core/myeongli-rule-spec.js';

export { PURE_HIDDEN_STEMS, MONTH_COMMAND_DIVISION_TABLE };
export type { PureHiddenStemEntry, MonthCommandStemRatio };

export interface HiddenStemEntry extends MonthCommandStemRatio {}

export interface BranchHiddenStems {
  branch: EarthlyBranch;
  entries: HiddenStemEntry[];
  mainStem: HeavenlyStem;
}

// 기존 모듈 호환성 유지용 별칭 (Single Source of Truth: MONTH_COMMAND_DIVISION_TABLE)
export const HIDDEN_STEMS_DETAIL = MONTH_COMMAND_DIVISION_TABLE;

export class HiddenStemsEngine {
  public readonly ruleVersion = MYEONGLI_RULE_VERSIONS.HIDDEN_STEM;

  /**
   * 일반 지지의 순수 지장간 조회 (월률분야 일수 배분 미적용)
   */
  public getPureHiddenStems(branch: EarthlyBranch): PureHiddenStemEntry {
    return PURE_HIDDEN_STEMS[branch];
  }

  /**
   * 월령 지지의 월률분야 및 지장간 상세 조회 (하위 호환)
   */
  public getHiddenStems(branch: EarthlyBranch): BranchHiddenStems {
    const entries = MONTH_COMMAND_DIVISION_TABLE[branch];
    const mainEntry = entries.find(e => e.type === 'main')!;
    return {
      branch,
      entries,
      mainStem: mainEntry.stem,
    };
  }
}
