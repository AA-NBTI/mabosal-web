/**
 * Phase 3: Saju Core Engine (명리 코어 분석 엔진)
 * 
 * 모듈 원칙:
 * INPUT (PillarOutput) → PROCESS → OUTPUT (SajuCoreOutput)
 * 천간, 지지, 오행, 지장간, 십신, 월령, 통근, 투출, 생극제화, 일간강약, 궁위를
 * 0~100 연속 점수 체계로 정밀 산출합니다.
 */

import { BaseEngineModule } from '../../core/base-module.js';
import { BRANCH_INFO, STEM_INFO } from '../../core/constants.js';
import {
  EarthlyBranch,
  FiveElement,
  FourPillars,
  HeavenlyStem,
  TenGod,
  TimeDependencyInfo,
} from '../../core/types.js';
import { PillarOutput } from '../pillar/pillar-engine.js';
import { FiveElementsAnalysis, FiveElementsEngine } from './five-elements.js';
import { HiddenStemEntry, HiddenStemsEngine } from './hidden-stems.js';
import { PalaceAnalysis, PalaceEngine } from './palace-engine.js';
import { EmergenceInfo, RootingEmergenceEngine, StemRootingInfo } from './rooting-emergence.js';
import { DayMasterStrengthResult, StrengthEngine } from './strength-engine.js';
import { TenGodsEngine } from './ten-gods.js';

export interface PillarTenGods {
  stemTenGod: TenGod;
  branchMainTenGod: TenGod;
  hiddenStemsTenGods: {
    stem: HeavenlyStem;
    type: 'initial' | 'middle' | 'main';
    tenGod: TenGod;
    ratio: number;
  }[];
}

export interface SajuCoreOutput {
  four_pillars: FourPillars;
  day_stem: HeavenlyStem;
  day_element: FiveElement;
  ten_gods: {
    year: PillarTenGods;
    month: PillarTenGods;
    day: {
      stemTenGod: '비견'; // 일간 자신
      branchMainTenGod: TenGod;
      hiddenStemsTenGods: PillarTenGods['hiddenStemsTenGods'];
    };
    hour: PillarTenGods | null;
  };
  five_elements: FiveElementsAnalysis;
  day_master_strength: DayMasterStrengthResult;
  rootings: {
    yearStem: StemRootingInfo;
    monthStem: StemRootingInfo;
    dayStem: StemRootingInfo; // 일간 통근 (득지 핵심)
    hourStem: StemRootingInfo | null;
  };
  emergences: EmergenceInfo[];
  palaces: PalaceAnalysis;
  flow_channels: {
    shiksang_saeng_jae: number; // 식상생재 점수 (0~100)
    gwan_in_saeng: number;       // 관인상생 점수 (0~100)
    jae_saeng_gwan: number;      // 재생관 점수 (0~100)
    bi_geop_bunsan: number;      // 비겁분산/군겁쟁재 압력 점수 (0~100)
  };
  time_dependency: TimeDependencyInfo;
}

export class SajuCoreEngine extends BaseEngineModule<PillarOutput, SajuCoreOutput> {
  protected readonly moduleId = 'saju_core_engine';
  protected readonly moduleVersion = '1.0.0';
  protected readonly ruleVersion = '2026.1';
  protected readonly inputSchemaName = 'PillarOutput';
  protected readonly outputSchemaName = 'SajuCoreOutput';

  private hiddenStemsEngine = new HiddenStemsEngine();
  private tenGodsEngine = new TenGodsEngine();
  private rootingEmergenceEngine = new RootingEmergenceEngine();
  private fiveElementsEngine = new FiveElementsEngine();
  private strengthEngine = new StrengthEngine();
  private palaceEngine = new PalaceEngine();

  protected validateInput(input: PillarOutput): { isValid: boolean; reason?: string } {
    if (!input || !input.four_pillars || !input.four_pillars.day || !input.four_pillars.month) {
      return { isValid: false, reason: 'PillarOutput four_pillars 필수 기둥이 누락되었습니다.' };
    }
    return { isValid: true };
  }

  protected processInternal(input: PillarOutput): {
    data: SajuCoreOutput;
    confidence?: number;
    spec_gaps?: string[];
    notes?: string[];
  } {
    const notes: string[] = [];
    const spec_gaps: string[] = [];
    const pillars = input.four_pillars;
    const dayStem = pillars.day.stem;
    const dayElement = STEM_INFO[dayStem].element;

    // 1. 십신 분석
    const makePillarTenGods = (stem: HeavenlyStem, branch: EarthlyBranch): PillarTenGods => {
      const stemTenGod = this.tenGodsEngine.getTenGodForStem(dayStem, stem);
      const branchMainTenGod = this.tenGodsEngine.getTenGodForBranchMain(dayStem, branch);
      const hiddenEntries = this.hiddenStemsEngine.getHiddenStems(branch).entries;

      const hiddenStemsTenGods = hiddenEntries.map(e => ({
        stem: e.stem,
        type: e.type,
        tenGod: this.tenGodsEngine.getTenGodForStem(dayStem, e.stem),
        ratio: e.ratio,
      }));

      return {
        stemTenGod,
        branchMainTenGod,
        hiddenStemsTenGods,
      };
    };

    const yearTenGods = makePillarTenGods(pillars.year.stem, pillars.year.branch);
    const monthTenGods = makePillarTenGods(pillars.month.stem, pillars.month.branch);
    const dayBranchHidden = this.hiddenStemsEngine.getHiddenStems(pillars.day.branch).entries.map(e => ({
      stem: e.stem,
      type: e.type,
      tenGod: this.tenGodsEngine.getTenGodForStem(dayStem, e.stem),
      ratio: e.ratio,
    }));
    const dayTenGods = {
      stemTenGod: '비견' as const,
      branchMainTenGod: this.tenGodsEngine.getTenGodForBranchMain(dayStem, pillars.day.branch),
      hiddenStemsTenGods: dayBranchHidden,
    };

    const hourTenGods = pillars.hour
      ? makePillarTenGods(pillars.hour.stem, pillars.hour.branch)
      : null;

    // 2. 오행 에너지 분포 및 편중도
    const fiveElementsAnalysis = this.fiveElementsEngine.calculate(pillars);

    // 3. 일간 강약 (득령, 득지, 득세)
    const dayMasterStrength = this.strengthEngine.calculate(pillars);

    // 4. 통근 및 투출
    const yearRooting = this.rootingEmergenceEngine.calculateRootingForStem(pillars.year.stem, 'year', pillars);
    const monthRooting = this.rootingEmergenceEngine.calculateRootingForStem(pillars.month.stem, 'month', pillars);
    const dayRooting = this.rootingEmergenceEngine.calculateRootingForStem(pillars.day.stem, 'day', pillars);
    const hourRooting = pillars.hour
      ? this.rootingEmergenceEngine.calculateRootingForStem(pillars.hour.stem, 'hour', pillars)
      : null;

    const emergences = this.rootingEmergenceEngine.calculateEmergences(pillars);

    // 5. 궁위 분석
    const palaces = this.palaceEngine.calculate(pillars);

    // 6. 생극제화 핵심 흐름 통로 계산 (0~100 연속값)
    // 십신 카운트 및 세력 기반 계산
    const allTenGods: TenGod[] = [
      yearTenGods.stemTenGod, yearTenGods.branchMainTenGod,
      monthTenGods.stemTenGod, monthTenGods.branchMainTenGod,
      dayTenGods.branchMainTenGod,
    ];
    if (hourTenGods) {
      allTenGods.push(hourTenGods.stemTenGod, hourTenGods.branchMainTenGod);
    }

    const countTenGod = (tgList: TenGod[]) => {
      const set = new Set(tgList);
      return allTenGods.filter(tg => set.has(tg)).length;
    };

    const shiksangCount = countTenGod(['식신', '상관']);
    const jaeseongCount = countTenGod(['편재', '정재']);
    const gwanseongCount = countTenGod(['편관', '정관']);
    const inseongCount = countTenGod(['편인', '정인']);
    const bigeopCount = countTenGod(['비견', '겁재']);

    // 식상생재: 식상과 재성이 공존할 때 흐름 원활
    const shiksangSaengJae = Math.min(100.0, Math.round(Math.min(shiksangCount, jaeseongCount) * 40.0 + (shiksangCount + jaeseongCount) * 10.0));
    // 관인상생: 관성과 인성이 공존할 때 흐름 원활
    const gwanInSaeng = Math.min(100.0, Math.round(Math.min(gwanseongCount, inseongCount) * 40.0 + (gwanseongCount + inseongCount) * 10.0));
    // 재생관: 재성과 관성이 공존할 때 흐름 원활
    const jaeSaengGwan = Math.min(100.0, Math.round(Math.min(jaeseongCount, gwanseongCount) * 40.0 + (jaeseongCount + gwanseongCount) * 10.0));
    // 비겁분산/쟁재 압력: 비겁이 재성에 비해 과다할 때
    const biGeopBunsan = Math.min(100.0, Math.round(bigeopCount >= 2 && jaeseongCount >= 1 ? (bigeopCount * 25.0) : 10.0));

    // 시간 의존도
    const timeDependency: TimeDependencyInfo = {
      requires_hour: pillars.hour === null,
      time_dependency: pillars.hour === null ? 35.0 : 0.0,
      is_missing_hour: pillars.hour === null,
      notes: pillars.hour === null
        ? '시주 미상으로 3기둥 기준 오행 및 강약이 산출되었으며 시주 반영 시 일부 점수가 변동될 수 있습니다.'
        : undefined,
    };

    if (pillars.hour === null) {
      notes.push('시주가 미상이나 3주(연/월/일) 기준 Saju Core 분석이 정상 수행되었습니다.');
    }

    const confidence = pillars.hour === null ? 80.0 : 100.0;

    const data: SajuCoreOutput = {
      four_pillars: pillars,
      day_stem: dayStem,
      day_element: dayElement,
      ten_gods: {
        year: yearTenGods,
        month: monthTenGods,
        day: dayTenGods,
        hour: hourTenGods,
      },
      five_elements: fiveElementsAnalysis,
      day_master_strength: dayMasterStrength,
      rootings: {
        yearStem: yearRooting,
        monthStem: monthRooting,
        dayStem: dayRooting,
        hourStem: hourRooting,
      },
      emergences,
      palaces,
      flow_channels: {
        shiksang_saeng_jae: shiksangSaengJae,
        gwan_in_saeng: gwanInSaeng,
        jae_saeng_gwan: jaeSaengGwan,
        bi_geop_bunsan: biGeopBunsan,
      },
      time_dependency: timeDependency,
    };

    return {
      data,
      confidence,
      spec_gaps: spec_gaps.length > 0 ? spec_gaps : undefined,
      notes: notes.length > 0 ? notes : undefined,
    };
  }

  protected getFallbackData(input: PillarOutput, errorReason: string): SajuCoreOutput {
    const dummyRooting: StemRootingInfo = {
      stem: '갑',
      position: 'day',
      rootingScore: 0,
      rootedBranches: [],
    };
    return {
      four_pillars: input.four_pillars,
      day_stem: '갑',
      day_element: '목',
      ten_gods: {} as any,
      five_elements: {} as any,
      day_master_strength: {} as any,
      rootings: {
        yearStem: dummyRooting,
        monthStem: dummyRooting,
        dayStem: dummyRooting,
        hourStem: null,
      },
      emergences: [],
      palaces: {} as any,
      flow_channels: {
        shiksang_saeng_jae: 0,
        gwan_in_saeng: 0,
        jae_saeng_gwan: 0,
        bi_geop_bunsan: 0,
      },
      time_dependency: {
        requires_hour: true,
        time_dependency: 100,
        is_missing_hour: true,
        notes: errorReason,
      },
    };
  }
}
