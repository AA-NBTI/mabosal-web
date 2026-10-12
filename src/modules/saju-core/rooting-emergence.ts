/**
 * RootingEmergenceEngine: 통근(通根) 및 투출(透出) 분석 모듈
 * 
 * 원칙:
 * 모든 통근/투출 점수는 0~100 연속값으로 보존합니다.
 */

import { BRANCH_INFO, STEM_INFO } from '../../core/constants.js';
import { EarthlyBranch, FourPillars, HeavenlyStem } from '../../core/types.js';
import { HIDDEN_STEMS_DETAIL, HiddenStemEntry } from './hidden-stems.js';

export interface StemRootingInfo {
  stem: HeavenlyStem;
  position: 'year' | 'month' | 'day' | 'hour';
  rootingScore: number; // 0 ~ 100
  rootedBranches: {
    position: 'year' | 'month' | 'day' | 'hour';
    branch: EarthlyBranch;
    rootType: 'main' | 'middle' | 'initial';
    weight: number;
  }[];
}

export interface EmergenceInfo {
  sourceBranch: EarthlyBranch;
  sourcePosition: 'year' | 'month' | 'day' | 'hour';
  hiddenStem: HeavenlyStem;
  hiddenType: 'main' | 'middle' | 'initial';
  emergedTo: {
    position: 'year' | 'month' | 'hour';
    stem: HeavenlyStem;
  }[];
  isEmerged: boolean;
  emergenceStrength: number; // 0 ~ 100
}

export class RootingEmergenceEngine {
  // 지지 위치별 통근 기여 가중치 (총합 100)
  // 시주 미상 시(시지=null)에는 월지 45%, 일지 35%, 년지 20%로 정규화
  private readonly POSITION_WEIGHTS_4_PILLARS = {
    month: 40.0,
    day: 30.0,
    year: 15.0,
    hour: 15.0,
  };

  private readonly POSITION_WEIGHTS_3_PILLARS = {
    month: 47.0,
    day: 33.0,
    year: 20.0,
    hour: 0.0,
  };

  // 지장간 정기/중기/여기 통근 계수
  private readonly HIDDEN_TYPE_COEFF = {
    main: 1.0,
    middle: 0.6,
    initial: 0.4,
  };

  /**
   * 4기둥 내 특정 천간의 통근 점수 및 통근 지지 분석
   */
  public calculateRootingForStem(
    stem: HeavenlyStem,
    stemPosition: 'year' | 'month' | 'day' | 'hour',
    pillars: FourPillars
  ): StemRootingInfo {
    const stemElement = STEM_INFO[stem].element;
    const hasHour = pillars.hour !== null;
    const weights = hasHour ? this.POSITION_WEIGHTS_4_PILLARS : this.POSITION_WEIGHTS_3_PILLARS;

    const branches: { pos: 'year' | 'month' | 'day' | 'hour'; branch: EarthlyBranch | null }[] = [
      { pos: 'month', branch: pillars.month.branch },
      { pos: 'day', branch: pillars.day.branch },
      { pos: 'year', branch: pillars.year.branch },
      { pos: 'hour', branch: pillars.hour ? pillars.hour.branch : null },
    ];

    let totalScore = 0.0;
    const rootedBranches: StemRootingInfo['rootedBranches'] = [];

    for (const item of branches) {
      if (!item.branch) continue;

      const entries = HIDDEN_STEMS_DETAIL[item.branch];
      // 동일 오행 지장간 탐색
      let bestMatch: HiddenStemEntry | null = null;
      for (const entry of entries) {
        if (entry.element === stemElement) {
          if (!bestMatch || this.HIDDEN_TYPE_COEFF[entry.type] > this.HIDDEN_TYPE_COEFF[bestMatch.type]) {
            bestMatch = entry;
          }
        }
      }

      if (bestMatch) {
        const posWeight = weights[item.pos];
        const coeff = this.HIDDEN_TYPE_COEFF[bestMatch.type];
        const rootStrength = posWeight * coeff;
        totalScore += rootStrength;

        rootedBranches.push({
          position: item.pos,
          branch: item.branch,
          rootType: bestMatch.type,
          weight: Math.round(rootStrength * 100) / 100,
        });
      }
    }

    return {
      stem,
      position: stemPosition,
      rootingScore: Math.min(100.0, Math.round(totalScore * 100) / 100),
      rootedBranches,
    };
  }

  /**
   * 4기둥 전체 지지의 천간 투출(Emergence) 분석
   */
  public calculateEmergences(pillars: FourPillars): EmergenceInfo[] {
    const emergences: EmergenceInfo[] = [];

    const stemPositions: { pos: 'year' | 'month' | 'hour'; stem: HeavenlyStem | null }[] = [
      { pos: 'year', stem: pillars.year.stem },
      { pos: 'month', stem: pillars.month.stem },
      { pos: 'hour', stem: pillars.hour ? pillars.hour.stem : null },
    ];

    const branchPositions: { pos: 'year' | 'month' | 'day' | 'hour'; branch: EarthlyBranch | null }[] = [
      { pos: 'month', branch: pillars.month.branch },
      { pos: 'day', branch: pillars.day.branch },
      { pos: 'year', branch: pillars.year.branch },
      { pos: 'hour', branch: pillars.hour ? pillars.hour.branch : null },
    ];

    for (const bItem of branchPositions) {
      if (!bItem.branch) continue;

      const entries = HIDDEN_STEMS_DETAIL[bItem.branch];
      for (const entry of entries) {
        const matches: { position: 'year' | 'month' | 'hour'; stem: HeavenlyStem }[] = [];

        for (const sItem of stemPositions) {
          if (sItem.stem && STEM_INFO[sItem.stem].element === entry.element) {
            matches.push({ position: sItem.pos, stem: sItem.stem });
          }
        }

        const isEmerged = matches.length > 0;
        let strength = 0.0;
        if (isEmerged) {
          // 정기 투출은 100, 중기는 70, 여기는 50 기본 강도
          const baseStrength = entry.type === 'main' ? 100.0 : entry.type === 'middle' ? 70.0 : 50.0;
          // 월지 지장간 투출이면 보너스 1.2배 (최대 100)
          const multiplier = bItem.pos === 'month' ? 1.2 : 1.0;
          strength = Math.min(100.0, Math.round(baseStrength * multiplier * 100) / 100);
        }

        emergences.push({
          sourceBranch: bItem.branch,
          sourcePosition: bItem.pos,
          hiddenStem: entry.stem,
          hiddenType: entry.type,
          emergedTo: matches,
          isEmerged,
          emergenceStrength: strength,
        });
      }
    }

    return emergences;
  }
}
