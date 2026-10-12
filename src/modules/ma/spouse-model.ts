/**
 * Spouse Model & Profile Adapter (Phase 5)
 * 
 * 원칙:
 * 1. Zero-Gender Leakage: Ma Engine 내부와 Fact 레이어에는 'gender' 파라미터나 필드가 일절 존재하지 않습니다.
 * 2. 상위 레이어에서 주입한 SpouseProfile을 기반으로 순수한 명리학적 궁위(일지)와 성(배우자성) 사실인 SpouseFactLayer를 생성합니다.
 * 3. 전통적 남/여 프로필, 궁위 중심 프로필, 커스텀 프로필을 유연하게 지원합니다.
 */

import { BRANCH_INFO, STEM_INFO } from '../../core/constants.js';
import { EarthlyBranch, FiveElement, FourPillars, HeavenlyStem, TenGod } from '../../core/types.js';
import { BranchClashMatch } from '../relationship/branch-clash.js';
import { BranchHarmonyMatch } from '../relationship/branch-harmony.js';
import { RelationshipOutput } from '../relationship/relationship-engine.js';
import { SajuCoreOutput } from '../saju-core/saju-core-engine.js';
import { SpouseFactLayer } from './ma-types.js';

export type SpouseProfileType =
  | 'traditional_male'   // 전통 명리 남명 기준: 제1 배우자성 정재, 제2 배우자성 편재
  | 'traditional_female' // 전통 명리 여명 기준: 제1 배우자성 정관, 제2 배우자성 편관
  | 'palace_centered'    // 일지 궁위 중심: 일지 정기(본기) 십신을 기준 배우자성으로 채택
  | 'custom';            // 사용자/도메인 정의 커스텀 십신 설정

export interface SpouseProfile {
  profileType: SpouseProfileType;
  customPrimaryStar?: TenGod;
  customSecondaryStar?: TenGod;
}

export interface CreateSpouseFactLayerParams {
  fourPillars: FourPillars;
  sajuCore: SajuCoreOutput;
  relationship: RelationshipOutput;
  profile: SpouseProfile;
}

export class SpouseProfileAdapter {
  /**
   * 상위 프로필 설정을 사주 원국 사실 및 관계 분석과 결합하여 SpouseFactLayer를 생성합니다.
   * 성별(gender) 변수는 어디에도 입력되거나 누출되지 않습니다.
   */
  public static createSpouseFactLayer(params: CreateSpouseFactLayerParams): SpouseFactLayer {
    const { fourPillars, sajuCore, relationship, profile } = params;

    // 1. 배우자궁(일지) 사실 추출
    const spousePalaceBranch: EarthlyBranch = fourPillars.day.branch;
    const spousePalaceElement: FiveElement = BRANCH_INFO[spousePalaceBranch].element;

    // 2. 배우자궁(일지) 관여 충/합 분석
    const palaceClashes = relationship.branch_clashes.filter((clash: BranchClashMatch) => {
      return (
        clash.positions.includes('day') ||
        clash.branches.includes(spousePalaceBranch)
      );
    });

    const palaceHarmonies = relationship.branch_harmonies.filter((harmony: BranchHarmonyMatch) => {
      return (
        harmony.branches.includes(spousePalaceBranch) ||
        (harmony.positions && harmony.positions.includes('day'))
      );
    });

    const isPalaceIntact = palaceClashes.length === 0;

    // 3. 프로필에 따른 제1/제2 배우자성 결정
    let primarySpouseStar: TenGod = '정재';
    let secondarySpouseStar: TenGod = '편재';

    switch (profile.profileType) {
      case 'traditional_male':
        primarySpouseStar = '정재';
        secondarySpouseStar = '편재';
        break;

      case 'traditional_female':
        primarySpouseStar = '정관';
        secondarySpouseStar = '편관';
        break;

      case 'palace_centered': {
        const dayBranchMainStar = sajuCore.ten_gods.day.branchMainTenGod;
        primarySpouseStar = dayBranchMainStar;
        secondarySpouseStar = this.getOppositeTenGod(dayBranchMainStar);
        break;
      }

      case 'custom':
        primarySpouseStar = profile.customPrimaryStar ?? '정재';
        secondarySpouseStar = profile.customSecondaryStar ?? '편재';
        break;
    }

    // 4. 배우자성의 투간(Emergence) 및 통근(Rooting) 분석
    let primaryStarEmergence = false;
    let primaryStarRooted = false;
    let primaryStarRootingScore = 0;

    // 천간에 primarySpouseStar가 투간되어 있는지 확인
    const candidateStems: { stem: HeavenlyStem; pos: 'year' | 'month' | 'hour'; star: TenGod }[] = [
      { stem: fourPillars.year.stem, pos: 'year', star: sajuCore.ten_gods.year.stemTenGod },
      { stem: fourPillars.month.stem, pos: 'month', star: sajuCore.ten_gods.month.stemTenGod },
    ];
    if (fourPillars.hour && sajuCore.ten_gods.hour) {
      candidateStems.push({ stem: fourPillars.hour.stem, pos: 'hour', star: sajuCore.ten_gods.hour.stemTenGod });
    }

    for (const cand of candidateStems) {
      if (cand.star === primarySpouseStar) {
        primaryStarEmergence = true;
        // 통근 점수 확인
        let stemRooting = null;
        if (cand.pos === 'year') stemRooting = sajuCore.rootings.yearStem;
        else if (cand.pos === 'month') stemRooting = sajuCore.rootings.monthStem;
        else if (cand.pos === 'hour') stemRooting = sajuCore.rootings.hourStem;

        if (stemRooting && stemRooting.rootingScore > 0) {
          primaryStarRooted = true;
          if (stemRooting.rootingScore > primaryStarRootingScore) {
            primaryStarRootingScore = stemRooting.rootingScore;
          }
        }
      }
    }

    // 천간에 투간되지 않았더라도 지지에 지장간 정기로서 존재하는지 확인
    if (!primaryStarEmergence) {
      const branches: { branch: EarthlyBranch; mainStar: TenGod }[] = [
        { branch: fourPillars.year.branch, mainStar: sajuCore.ten_gods.year.branchMainTenGod },
        { branch: fourPillars.month.branch, mainStar: sajuCore.ten_gods.month.branchMainTenGod },
        { branch: fourPillars.day.branch, mainStar: sajuCore.ten_gods.day.branchMainTenGod },
      ];
      if (fourPillars.hour && sajuCore.ten_gods.hour) {
        branches.push({ branch: fourPillars.hour.branch, mainStar: sajuCore.ten_gods.hour.branchMainTenGod });
      }

      for (const b of branches) {
        if (b.mainStar === primarySpouseStar) {
          primaryStarRooted = true;
          if (primaryStarRootingScore < 30) {
            primaryStarRootingScore = 30; // 지지에 본기로 존재하는 기본 근
          }
        }
      }
    }

    return {
      spousePalaceBranch,
      spousePalaceElement,
      palaceClashes,
      palaceHarmonies,
      isPalaceIntact,
      primarySpouseStar,
      secondarySpouseStar,
      primaryStarEmergence,
      primaryStarRooted,
      primaryStarRootingScore,
    };
  }

  /**
   * 정/편 짝 십신 반환 헬퍼
   */
  private static getOppositeTenGod(star: TenGod): TenGod {
    const pairs: Record<TenGod, TenGod> = {
      '비견': '겁재',
      '겁재': '비견',
      '식신': '상관',
      '상관': '식신',
      '편재': '정재',
      '정재': '편재',
      '편관': '정관',
      '정관': '편관',
      '편인': '정인',
      '정인': '편인',
    };
    return pairs[star] ?? star;
  }
}
