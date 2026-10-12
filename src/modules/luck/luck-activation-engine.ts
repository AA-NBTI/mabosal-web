/**
 * LuckActivationEngine: 운 활성화(Activation) 모델 엔진
 * 
 * 원칙:
 * 운은 원국을 재계산하는 것이 아니라 원국의 잠재 신호를 활성화합니다.
 * Activation = 대운 40% + 세운 30% + 월운 20% + 일운 10%
 * Final Intensity = Base Intensity × (0.70 + Activation × 0.30)
 * 동일 방향 중첩 보너스 및 반대 방향 상쇄 관계 계산
 */

import { BRANCH_INFO, STEM_INFO } from '../../core/constants.js';
import { EarthlyBranch, FiveElement, FourPillars, HeavenlyStem, Pillar, TenGod } from '../../core/types.js';
import { SIX_CLASHES } from '../relationship/branch-clash.js';
import { SIX_HARMONIES } from '../relationship/branch-harmony.js';
import { TenGodsEngine } from '../saju-core/ten-gods.js';

export interface SingleLuckInfluence {
  pillar: Pillar;
  weight: number;              // 0.40, 0.30, 0.20, 0.10
  stemTenGod: TenGod;
  branchTenGod: TenGod;
  stemElement: FiveElement;
  branchElement: FiveElement;
  rawActivationScore: number;  // 0 ~ 100
  clashesWithOrigin: string[]; // 원국 지지와의 충
  harmoniesWithOrigin: string[]; // 원국 지지와의 합
}

export interface LuckActivationResult {
  targetDateStr: string;
  daewoon: SingleLuckInfluence;
  sewoon: SingleLuckInfluence;
  wolwoon: SingleLuckInfluence;
  ilwoon: SingleLuckInfluence;
  totalActivationScore: number; // 0 ~ 100 연속값 (Current Activation)
  overlapBonus: number;         // 동일 방향 중첩 보너스 (가산점)
  cancellationPenalty: number;  // 반대 방향 상쇄 감점
  finalActivationScore: number; // 보정 후 최종 활성 점수 (0 ~ 100)
  activeTenGodTheme: string;    // 주 활성화 십신 테마 (예: "재성 활성화", "관성 압박")
  volatilityTrigger: boolean;   // 일운/세운에 의한 단기 촉발 여부
  clashTriggerCount: number;    // 운에서 발생한 충의 개수
  harmonyTriggerCount: number;  // 운에서 발생한 합의 개수
}

export class LuckActivationEngine {
  private tenGodsEngine = new TenGodsEngine();

  /**
   * 운 활성화 종합 분석
   */
  public evaluate(
    pillars: FourPillars,
    daewoonPillar: Pillar,
    sewoonPillar: Pillar,
    wolwoonPillar: Pillar,
    ilwoonPillar: Pillar,
    targetDateStr: string,
    targetTheme?: '재성' | '관성' | '인성' | '식상' | '비겁'
  ): LuckActivationResult {
    const dayStem = pillars.day.stem;
    const originBranches = [pillars.year.branch, pillars.month.branch, pillars.day.branch];
    if (pillars.hour) originBranches.push(pillars.hour.branch);

    const getTenGodCategory = (tg: TenGod): string => {
      if (tg === '비견' || tg === '겁재') return '비겁';
      if (tg === '식신' || tg === '상관') return '식상';
      if (tg === '편재' || tg === '정재') return '재성';
      if (tg === '편관' || tg === '정관') return '관성';
      return '인성';
    };

    // 단일 운 분석 헬퍼
    const analyzeInfluence = (p: Pillar, weight: number): SingleLuckInfluence => {
      const stemTenGod = this.tenGodsEngine.getTenGodForStem(dayStem, p.stem);
      const branchTenGod = this.tenGodsEngine.getTenGodForBranchMain(dayStem, p.branch);
      const stemElement = STEM_INFO[p.stem].element;
      const branchElement = BRANCH_INFO[p.branch].element;

      const clashes: string[] = [];
      const harmonies: string[] = [];

      for (const ob of originBranches) {
        if (SIX_CLASHES[p.branch] && SIX_CLASHES[p.branch].partner === ob) {
          clashes.push(`${p.branch}${ob}충`);
        }
        if (SIX_HARMONIES[p.branch] && SIX_HARMONIES[p.branch].partner === ob) {
          harmonies.push(`${p.branch}${ob}합`);
        }
      }

      // 기본 활성도: 타겟 테마(예: 재성)와의 일치도 및 합충 작용력
      let rawScore = 50.0;
      if (targetTheme) {
        if (getTenGodCategory(stemTenGod) === targetTheme || getTenGodCategory(branchTenGod) === targetTheme) {
          rawScore += 35.0;
        }
      }
      if (clashes.length > 0) rawScore += 15.0; // 충은 격발 작용
      if (harmonies.length > 0) rawScore += 10.0; // 합은 밀착 작용

      return {
        pillar: p,
        weight,
        stemTenGod,
        branchTenGod,
        stemElement,
        branchElement,
        rawActivationScore: Math.min(100.0, rawScore),
        clashesWithOrigin: clashes,
        harmoniesWithOrigin: harmonies,
      };
    };

    const daewoon = analyzeInfluence(daewoonPillar, 0.40);
    const sewoon = analyzeInfluence(sewoonPillar, 0.30);
    const wolwoon = analyzeInfluence(wolwoonPillar, 0.20);
    const ilwoon = analyzeInfluence(ilwoonPillar, 0.10);

    // 1. 가중합 활성화 점수 (Current Activation)
    const currentActivation =
      daewoon.rawActivationScore * daewoon.weight +
      sewoon.rawActivationScore * sewoon.weight +
      wolwoon.rawActivationScore * wolwoon.weight +
      ilwoon.rawActivationScore * ilwoon.weight;

    // 2. 중첩 보너스 및 상쇄 감점
    const catDae = getTenGodCategory(daewoon.stemTenGod);
    const catSe = getTenGodCategory(sewoon.stemTenGod);
    const catWol = getTenGodCategory(wolwoon.stemTenGod);

    let overlapBonus = 0.0;
    let cancellationPenalty = 0.0;

    // 대운과 세운이 같은 십신 방향일 때 중첩 보너스 (L05)
    if (catDae === catSe) {
      overlapBonus += 15.0;
      if (catDae === catWol) {
        overlapBonus += 10.0; // 대운-세운-월운 3중 중첩
      }
    }

    // 대운과 세운이 상극 관계일 때 상쇄 감점 (L06)
    const isControlling = (a: string, b: string) => {
      return (
        (a === '비겁' && b === '재성') || (b === '비겁' && a === '재성') ||
        (a === '재성' && b === '인성') || (b === '재성' && a === '인성') ||
        (a === '인성' && b === '식상') || (b === '인성' && a === '식상') ||
        (a === '식상' && b === '관성') || (b === '식상' && a === '관성') ||
        (a === '관성' && b === '비겁') || (b === '관성' && a === '비겁')
      );
    };

    if (isControlling(catDae, catSe)) {
      cancellationPenalty += 12.0;
    }

    const finalActivationScore = Math.max(
      0.0,
      Math.min(100.0, Math.round((currentActivation + overlapBonus - cancellationPenalty) * 100) / 100)
    );

    // 충 및 합 카운트
    const totalClashes =
      daewoon.clashesWithOrigin.length +
      sewoon.clashesWithOrigin.length +
      wolwoon.clashesWithOrigin.length +
      ilwoon.clashesWithOrigin.length;

    const totalHarmonies =
      daewoon.harmoniesWithOrigin.length +
      sewoon.harmoniesWithOrigin.length +
      wolwoon.harmoniesWithOrigin.length +
      ilwoon.harmoniesWithOrigin.length;

    const volatilityTrigger = ilwoon.clashesWithOrigin.length > 0 || ilwoon.rawActivationScore >= 75.0;

    return {
      targetDateStr,
      daewoon,
      sewoon,
      wolwoon,
      ilwoon,
      totalActivationScore: Math.round(currentActivation * 100) / 100,
      overlapBonus,
      cancellationPenalty,
      finalActivationScore,
      activeTenGodTheme: `${catDae} 및 ${catSe} 복합 활성`,
      volatilityTrigger,
      clashTriggerCount: totalClashes,
      harmonyTriggerCount: totalHarmonies,
    };
  }

  /**
   * Final Intensity 계산 공식 (명세서 7번)
   * Final Intensity = Base Intensity × (0.70 + Activation × 0.30)
   */
  public calculateFinalIntensity(baseIntensity: number, activationScore: number): number {
    const activationRatio = activationScore / 100.0;
    const finalIntensity = baseIntensity * (0.70 + activationRatio * 0.30);
    return Math.max(0.0, Math.min(100.0, Math.round(finalIntensity * 100) / 100));
  }
}
