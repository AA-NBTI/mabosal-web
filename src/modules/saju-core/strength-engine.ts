/**
 * StrengthEngine: 일간 강약(신강/신약) 산출 엔진 (Phase 58.2 Freeze)
 * 
 * 원칙 (마보살 정량화 모델):
 * 득령(得令) 40%, 득지(得地) 30%, 득세(得勢) 30%의 체계로
 * 0~100 연속 점수로 일간 감당력을 산출합니다 (단일 모듈 공통 연동).
 */

import { STEM_INFO } from '../../core/constants.js';
import { FiveElement, FourPillars, HeavenlyStem } from '../../core/types.js';
import { 
  calculateCanonicalStrength, 
  MYEONGLI_RULE_VERSIONS 
} from '../../core/myeongli-rule-spec.js';

export interface DayMasterStrengthResult {
  dayStem: HeavenlyStem;
  dayElement: FiveElement;
  deukRyeongScore: number; // 0 ~ 100 (득령 점수, 월령 지원)
  deukJiScore: number;     // 0 ~ 100 (득지 점수, 일지 지원)
  deukSeScore: number;     // 0 ~ 100 (득세 점수, 타 주 비겁/인성 세력)
  totalStrengthScore: number; // 0 ~ 100 연속값 (50: 중화)
  classification: '극강' | '신강' | '중화신강' | '중화' | '중화신약' | '신약' | '극약';
  isDeukRyeong: boolean;
  isDeukJi: boolean;
  isDeukSe: boolean;
  ruleVersion?: string;
}

export class StrengthEngine {
  public readonly ruleVersion = MYEONGLI_RULE_VERSIONS.STRENGTH;
  private readonly WEIGHT_DEUK_RYEONG = 0.40;
  private readonly WEIGHT_DEUK_JI = 0.30;
  private readonly WEIGHT_DEUK_SE = 0.30;

  /**
   * 일간 강약 계산 (단일 정량화 공식 기반)
   */
  public calculate(pillars: FourPillars): DayMasterStrengthResult {
    const dayStem = pillars.day.stem;
    const dayElement = STEM_INFO[dayStem].element;

    const otherStems: HeavenlyStem[] = [pillars.year.stem, pillars.month.stem];
    if (pillars.hour) {
      otherStems.push(pillars.hour.stem);
    }
    const otherBranches = [pillars.year.branch];
    if (pillars.hour) {
      otherBranches.push(pillars.hour.branch);
    }

    const canonical = calculateCanonicalStrength(
      dayStem,
      pillars.month.branch,
      pillars.day.branch,
      otherStems,
      otherBranches
    );

    return {
      dayStem,
      dayElement,
      deukRyeongScore: Math.round(canonical.deungryeongScore * 100) / 100,
      deukJiScore: Math.round(canonical.deungJiScore * 100) / 100,
      deukSeScore: Math.round(canonical.deungSeScore * 100) / 100,
      totalStrengthScore: Math.round(canonical.score * 100) / 100,
      classification: canonical.status,
      isDeukRyeong: canonical.deungryeong,
      isDeukJi: canonical.deungji,
      isDeukSe: canonical.deungse,
      ruleVersion: this.ruleVersion,
    };
  }
}
