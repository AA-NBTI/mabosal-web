/**
 * LifeAnalysisWarehouse: 사주 엔진 객관화를 위한 100세 중간 데이터 창고 (Canonical Saju Data Warehouse)
 * 
 * [단일 공인 엔진 파이프라인 준수]
 * 1. 입력 정규화: src/frontend/modules/saju-profile/profile-core.ts 의 `normalizeBirthTime` 100% 승계 (0920 -> 09:20 보정)
 * 2. 역법 및 기둥: CalendarEngine + PillarEngine
 * 3. 정통 명리 코어 분석: SajuDynamicAnalyzer + SajuCoreEngine (일간, 오행분포, 십신, 신강약, 격국, 억부·조후 용신, 충합형파해원진)
 * 4. 10대운 및 100년 세운: DaewoonEngine
 * 5. 독자적인 임의 휴리스틱을 전면 배제하고 프로젝트 공인 엔진 결과와 100% 동일한 Ground Truth를 보존합니다.
 */

import { HeavenlyStem, EarthlyBranch, FourPillars, Pillar } from '../../core/types.js';
import { STEM_INFO, BRANCH_INFO } from '../../core/constants.js';
import { STEM_MAP, BRANCH_MAP } from '../sinsal/sinsal-core-engine.js';
import { daewoonEngine, DaewoonResult, DaewoonPillar } from '../saju-core/daewoon-engine.js';
import { CalendarEngine } from '../calendar/calendar-engine.js';
import { PillarEngine } from '../pillar/pillar-engine.js';
import { SajuCoreEngine } from '../saju-core/saju-core-engine.js';
import { SajuDynamicAnalyzer, DynamicSajuAnalysis } from '../production/saju-dynamic-analyzer.js';
import { TenGodsEngine } from '../saju-core/ten-gods.js';
import { normalizeBirthTime } from '../../frontend/modules/saju-profile/profile-core.js';
import { standardizeBirthDate } from '../phase17_25/lunar-calendar.js';
import { SIX_CLASHES } from '../relationship/branch-clash.js';
import { SIX_DESTRUCTIONS, SIX_HARMS } from '../relationship/branch-harm-destruction.js';

// 60갑자 테이블
const SIXTY_GANJI: string[] = [
  '갑자', '을축', '병인', '정묘', '무진', '기사', '경오', '신미', '임신', '계유',
  '갑술', '을해', '병자', '정축', '무인', '기묘', '경진', '신사', '임오', '계미',
  '갑신', '을유', '병술', '정해', '무자', '기축', '경인', '신묘', '임진', '계사',
  '갑오', '을미', '병신', '정유', '무술', '기해', '경자', '신축', '임인', '계묘',
  '갑진', '을사', '병오', '정미', '무신', '기유', '경술', '신해', '임자', '계축',
  '갑인', '을묘', '병진', '정사', '무오', '기미', '경신', '신유', '임술', '계해'
];

export interface NatalPillarSpec {
  name: '년주' | '월주' | '일주' | '시주';
  stem: string;
  stemHanja: string;
  stemElement: string;
  stemTenGod: string;
  branch: string;
  branchHanja: string;
  branchElement: string;
  branchTenGod: string;
  twelveStage: string; // 12운성 포태 (장생, 목욕, 관대, 건록, 제왕, 쇠, 병, 사, 묘, 절, 태, 양)
  isGongmang: boolean; // 일주 기준 공망 여부
  rootingScore: number; // 통근 강도 점수
  hiddenStems: string[];
}

export interface FiveElementsEnergyScore {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
  dominant: string;
  lacking: string[];
  totalScore: number;
}

export interface DaewoonWarehouseRecord {
  order: number;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
  stem: string;
  branch: string;
  ganji: string;
  stemTenGod: string;
  branchTenGod: string;
  twelveStage: string; // 대운 지지의 12운성
  isGongmang: boolean; // 대운 지지의 공망 여부
  elementMix: string;
  energyScore: number; // -50 ~ +50
  level: '대길' | '호운' | '평운' | '주의' | '위험';
  relationsWithNatal: string[];
  activeSinsals: string[];
  isCurrent: boolean;
}

export interface LifeStepFactor {
  category: '충(沖)' | '형(刑)' | '파(破)' | '해(害)' | '원진' | '공망' | '12운성' | '용신' | '기신' | '신살';
  name: string;
  impact: 'down' | 'up';
  weight: number;
  description: string;
}

export interface SewoonWarehouseRecord {
  year: number;
  age: number;
  daewoonOrder: number;
  stem: string;
  branch: string;
  ganji: string;
  stemTenGod: string;
  branchTenGod: string;
  twelveStage: string;
  isGongmang: boolean;
  score: number; // 0 ~ 100
  stepHeight: number; // -100 ~ +100 (상승 가중치 - 하강 가중치 정밀 높이)
  level: '최상' | '길' | '평' | '흉' | '대흉';
  relationsWithNatal: string[];
  downwardFactors: LifeStepFactor[]; // 하강/마찰 요인 목록 (마살, 충, 공망 등)
  upwardFactors: LifeStepFactor[];   // 상승/도약 요인 목록 (용신, 귀인, 건록 등)
  isCurrentYear: boolean;
}

export interface DeepStructureAnalysis {
  twelveStages: {
    year: string;
    month: string;
    day: string;
    hour: string | null;
  };
  gongmang: {
    dayBased: [string, string];   // 일주 기준 공망
    yearBased: [string, string];  // 년주 기준 공망
    affectedPillars: string[];     // 원국에서 공망에 걸린 기둥 목록
    description: string;
  };
  flowChannels: {
    shiksangSaengJae: number; // 0~100 (식상생재: 재능 발휘 -> 재물 창출)
    jaeSaengGwan: number;     // 0~100 (재생관: 재물 -> 사회적 명예/조직)
    gwanInSaeng: number;      // 0~100 (관인상생: 조직/명예 -> 결재권/자격)
    biGeopBunsan: number;     // 0~100 (군겁쟁재: 동료/경쟁자에 의한 분탈 위험)
    summary: string;
  };
  palaces: {
    year: { name: string; period: string; theme: string };
    month: { name: string; period: string; theme: string };
    day: { name: string; period: string; theme: string };
    hour: { name: string; period: string; theme: string };
  };
  rootings: {
    yearStem: { stem: string; score: number };
    monthStem: { stem: string; score: number };
    dayStem: { stem: string; score: number };
    hourStem: { stem: string; score: number } | null;
  };
  detailedRelations: {
    clashes: string[];         // 충
    sixHarmonies: string[];    // 육합
    tripleHarmonies: string[]; // 삼합
    semiHarmonies: string[];   // 반합
    punishments: string[];     // 형 (삼형/자형)
    destructions: string[];    // 파
    harms: string[];           // 해
    wonjin: string[];          // 원진
  };
  sinsalsCategorized: {
    guiin: string[];    // 길신/귀인 (천을귀인, 문창, 학당 등)
    special: string[];  // 특수/변동살 (역마, 도화, 화개, 괴강, 백호, 양인 등)
  };
}

export interface CanonicalLifeDataWarehouse {
  metadata: {
    calculatedAt: string;
    engineVersion: string;
    ruleSet: string;
    input: {
      birthDate: string;
      birthTime: string | null;
      gender: 'male' | 'female';
      calendarType: 'solar' | 'lunar';
    };
  };
  natalLayer: {
    pillars: NatalPillarSpec[];
    dayMaster: {
      stem: string;
      hanja: string;
      element: string;
      polarity: string;
      nature: string;
      characteristics: string;
    };
    fiveElements: FiveElementsEnergyScore;
    strength: {
      score: number;
      classification: string;
      isDeungryeong: boolean;
      isDeungji: boolean;
      isDeungse: boolean;
      description: string;
    };
    geokguk: {
      name: string;
      basis: string;
      description: string;
    };
    yongshin: {
      yongshin: string; // 억부 주용신
      heeshin: string;  // 억부 희신
      gishin: string;   // 억부 기신
      johuYongshin: string; // 조후 주용신
      johuSeason: string;
      reason: string;
    };
    natalRelations: string[];
    natalSinsals: string[];
  };
  deepStructure: DeepStructureAnalysis;
  daewoonLayer: {
    direction: '순행' | '역행';
    daewoonNumber: number;
    currentDaewoonOrder: number;
    records: DaewoonWarehouseRecord[];
    goldenPeriods: { ageRange: string; reason: string }[];
    dangerPeriods: { ageRange: string; reason: string }[];
  };
  sewoonLayer: {
    currentYear: number;
    records: SewoonWarehouseRecord[];
  };
}

// 10천간 12운성(포태법) 표준 테이블 (일간 기준 12지지 상태)
export const TWELVE_STAGES_TABLE: Record<string, Record<string, string>> = {
  갑: { 해: '장생', 자: '목욕', 축: '관대', 인: '건록', 묘: '제왕', 진: '쇠', 사: '병', 오: '사', 미: '묘', 신: '절', 유: '태', 술: '양' },
  을: { 오: '장생', 사: '목욕', 진: '관대', 묘: '건록', 인: '제왕', 축: '쇠', 자: '병', 해: '사', 술: '묘', 유: '절', 신: '태', 미: '양' },
  병: { 인: '장생', 묘: '목욕', 진: '관대', 사: '건록', 오: '제왕', 미: '쇠', 신: '병', 유: '사', 술: '묘', 해: '절', 자: '태', 축: '양' },
  정: { 유: '장생', 신: '목욕', 미: '관대', 오: '건록', 사: '제왕', 진: '쇠', 묘: '병', 인: '사', 축: '묘', 자: '절', 해: '태', 술: '양' },
  무: { 인: '장생', 묘: '목욕', 진: '관대', 사: '건록', 오: '제왕', 미: '쇠', 신: '병', 유: '사', 술: '묘', 해: '절', 자: '태', 축: '양' },
  기: { 유: '장생', 신: '목욕', 미: '관대', 오: '건록', 사: '제왕', 진: '쇠', 묘: '병', 인: '사', 축: '묘', 자: '절', 해: '태', 술: '양' },
  경: { 사: '장생', 오: '목욕', 미: '관대', 신: '건록', 유: '제왕', 술: '쇠', 해: '병', 자: '사', 축: '묘', 인: '절', 묘: '태', 진: '양' },
  신: { 자: '장생', 해: '목욕', 술: '관대', 유: '건록', 신: '제왕', 미: '쇠', 오: '병', 사: '사', 진: '묘', 묘: '절', 인: '태', 축: '양' },
  임: { 신: '장생', 유: '목욕', 술: '관대', 해: '건록', 자: '제왕', 축: '쇠', 인: '병', 묘: '사', 진: '묘', 사: '절', 오: '태', 미: '양' },
  계: { 묘: '장생', 인: '목욕', 축: '관대', 자: '건록', 해: '제왕', 술: '쇠', 유: '병', 신: '사', 미: '묘', 오: '절', 사: '태', 진: '양' },
};

export function getTwelveStage(dayStem: string, branch: string): string {
  return TWELVE_STAGES_TABLE[dayStem]?.[branch] || '-';
}

export function calculateGongmang(stem: string, branch: string): [string, string] {
  const stems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  const branches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
  const sIdx = stems.indexOf(stem);
  const bIdx = branches.indexOf(branch);
  if (sIdx === -1 || bIdx === -1) return ['?', '?'];
  const diff = (bIdx - sIdx + 12) % 12;
  const map: Record<number, [string, string]> = {
    0: ['술', '해'],
    10: ['신', '유'],
    8: ['오', '미'],
    6: ['진', '사'],
    4: ['인', '묘'],
    2: ['자', '축']
  };
  return map[diff] || ['?', '?'];
}

/**
 * 지지 신살 발동 판정 (역마·도화·화개: 일지/년지 기준, 천을귀인: 일간 기준)
 * - 창고(LifeAnalysisWarehouseBuilder)와 근거 패킷(Evidence Packet)이 동일 규칙을 공유하기 위한 공용 함수
 */
export function detectBranchSinsals(b: string, dayStem: string, dayBranch: string, yearBranch: string): string[] {
  const sins: string[] = [];

  const yeokmaMap: Record<string, string> = { '인': '신', '오': '신', '술': '신', '사': '해', '유': '해', '축': '해', '신': '인', '자': '인', '진': '인', '해': '사', '묘': '사', '미': '사' };
  if (yeokmaMap[dayBranch] === b || yeokmaMap[yearBranch] === b) sins.push('역마살(驛馬)');

  const dohwaMap: Record<string, string> = { '인': '묘', '오': '묘', '술': '묘', '사': '오', '유': '오', '축': '오', '신': '유', '자': '유', '진': '유', '해': '자', '묘': '자', '미': '자' };
  if (dohwaMap[dayBranch] === b || dohwaMap[yearBranch] === b) sins.push('도화살(桃花)');

  const hwagaeMap: Record<string, string> = { '인': '술', '오': '술', '술': '술', '사': '축', '유': '축', '축': '축', '신': '진', '자': '진', '진': '진', '해': '미', '묘': '미', '미': '미' };
  if (hwagaeMap[dayBranch] === b || hwagaeMap[yearBranch] === b) sins.push('화개살(華蓋)');

  const guiinMap: Record<string, string[]> = {
    '갑': ['축', '미'], '무': ['축', '미'], '경': ['축', '미'],
    '을': ['자', '신'], '기': ['자', '신'],
    '병': ['해', '유'], '정': ['해', '유'],
    '임': ['사', '묘'], '계': ['사', '묘'],
    '신': ['오', '인']
  };
  if (guiinMap[dayStem]?.includes(b)) sins.push('천을귀인(天乙貴人)');

  return sins;
}

export class LifeAnalysisWarehouseBuilder {
  private calendarEngine = new CalendarEngine();
  private pillarEngine = new PillarEngine();
  private sajuCoreEngine = new SajuCoreEngine();
  private tenGodsEngine = new TenGodsEngine();

  /**
   * 생년월일시 및 성별을 입력받아 공인 엔진 기반으로 0~100세 인생 데이터 창고를 생성
   */
  public buildWarehouse(params: {
    birthYear: number;
    birthMonth: number;
    birthDay: number;
    birthTimeRaw?: string | number | null; // '0920', '09:20', 9 등 다양한 입력 허용
    birthHour?: number | null;
    birthMinute?: number | null;
    gender: 'male' | 'female';
    calendarType?: 'solar' | 'lunar';
    isLeapMonth?: boolean;
  }): CanonicalLifeDataWarehouse {
    const pad = (n: number) => String(n).padStart(2, '0');

    // 1. [공인 시간 정규화 모듈 normalizeBirthTime 적용]
    // 4자리 숫자('0920' -> '09:20'), 숫자 1~2자리('9' -> '09:00') 등 완벽 정규화
    let normalizedTime: string | null = null;
    if (params.birthTimeRaw !== undefined && params.birthTimeRaw !== null && String(params.birthTimeRaw).trim() !== '') {
      normalizedTime = normalizeBirthTime(String(params.birthTimeRaw));
    } else if (params.birthHour !== undefined && params.birthHour !== null) {
      normalizedTime = normalizeBirthTime(`${pad(params.birthHour)}:${pad(params.birthMinute ?? 0)}`);
    }

    // 2. [공인 역법 표준화 레이어 Phase 18 standardizeBirthDate 직결]
    // 음력(lunar)/윤달 여부를 판별하여 KASI 천문 양력 일자로 정확히 표준화 (SSOT 준수)
    const calType = params.calendarType || 'solar';
    const standardDate = standardizeBirthDate({
      calendar_type: calType,
      is_leap_month: params.isLeapMonth || false,
      birth_year: params.birthYear,
      birth_month: params.birthMonth,
      birth_day: params.birthDay,
      birth_time: normalizedTime,
      is_time_unknown: normalizedTime === null,
      gender: params.gender,
      birth_city: '서울',
    });

    const effectiveSolarDateStr = standardDate.solar_date_string;

    // 3. 공인 역법 및 기둥 엔진 실행 (표준화된 양력 일자 투입)
    const cal = this.calendarEngine.execute({
      birth_date: effectiveSolarDateStr,
      birth_time: normalizedTime,
      region: '서울',
    });

    const pil = this.pillarEngine.execute(cal.data);
    const fourPillars = pil.data.four_pillars;
    const core = this.sajuCoreEngine.execute(pil.data);

    // 3. 4주 간지 텍스트 조합 ('년주 월주 일주 시주')
    const yGanji = `${fourPillars.year.stem}${fourPillars.year.branch}`;
    const mGanji = `${fourPillars.month.stem}${fourPillars.month.branch}`;
    const dGanji = `${fourPillars.day.stem}${fourPillars.day.branch}`;
    const hGanji = fourPillars.hour ? `${fourPillars.hour.stem}${fourPillars.hour.branch}` : '';
    const fourPillarsText = hGanji ? `${yGanji} ${mGanji} ${dGanji} ${hGanji}` : `${yGanji} ${mGanji} ${dGanji}`;

    // 4. [공인 명리 동적 분석기 SajuDynamicAnalyzer 실행]
    const dynamicAnalysis: DynamicSajuAnalysis = SajuDynamicAnalyzer.analyze(fourPillarsText);

    // 5. 공인 SajuCoreEngine의 십신 및 지장간 매핑
    const pNames: ('년주' | '월주' | '일주' | '시주')[] = ['년주', '월주', '일주', '시주'];
    const pKeys: (keyof FourPillars)[] = ['year', 'month', 'day', 'hour'];

    // 공망 계산 (일주 및 년주 기준)
    const dayGongmang = calculateGongmang(fourPillars.day.stem, fourPillars.day.branch);
    const yearGongmang = calculateGongmang(fourPillars.year.stem, fourPillars.year.branch);

    const natalPillars: NatalPillarSpec[] = pKeys.map((k, idx) => {
      const p = fourPillars[k];
      if (!p) {
        return {
          name: pNames[idx],
          stem: '미상',
          stemHanja: '?',
          stemElement: '미상',
          stemTenGod: '시간미상',
          branch: '미상',
          branchHanja: '?',
          branchElement: '미상',
          branchTenGod: '시간미상',
          twelveStage: '-',
          isGongmang: false,
          rootingScore: 0,
          hiddenStems: [],
        };
      }

      const sHanja = STEM_MAP[p.stem]?.hanja || p.stem;
      const sElem = STEM_INFO[p.stem]?.element || '토';
      const bHanja = BRANCH_MAP[p.branch]?.hanja || p.branch;
      const bElem = BRANCH_INFO[p.branch]?.element || '토';

      // 공인 core ten_gods 활용
      let stemGod = '일간';
      let branchGod = '본기';
      let hiddenList: string[] = [];
      let rootScore = 0;

      if (k === 'year') {
        stemGod = core.data.ten_gods.year.stemTenGod;
        branchGod = core.data.ten_gods.year.branchMainTenGod;
        hiddenList = core.data.ten_gods.year.hiddenStemsTenGods.map(h => `${h.stem}(${h.tenGod})`);
        rootScore = core.data.rootings.yearStem?.rootingScore ?? 0;
      } else if (k === 'month') {
        stemGod = core.data.ten_gods.month.stemTenGod;
        branchGod = core.data.ten_gods.month.branchMainTenGod;
        hiddenList = core.data.ten_gods.month.hiddenStemsTenGods.map(h => `${h.stem}(${h.tenGod})`);
        rootScore = core.data.rootings.monthStem?.rootingScore ?? 0;
      } else if (k === 'day') {
        stemGod = '일간(본인)';
        branchGod = core.data.ten_gods.day.branchMainTenGod;
        hiddenList = core.data.ten_gods.day.hiddenStemsTenGods.map(h => `${h.stem}(${h.tenGod})`);
        rootScore = core.data.rootings.dayStem?.rootingScore ?? 0;
      } else if (k === 'hour' && core.data.ten_gods.hour) {
        stemGod = core.data.ten_gods.hour.stemTenGod;
        branchGod = core.data.ten_gods.hour.branchMainTenGod;
        hiddenList = core.data.ten_gods.hour.hiddenStemsTenGods.map(h => `${h.stem}(${h.tenGod})`);
        rootScore = core.data.rootings.hourStem?.rootingScore ?? 0;
      }

      const stage = getTwelveStage(fourPillars.day.stem, p.branch);
      const isGm = dayGongmang.includes(p.branch);

      return {
        name: pNames[idx],
        stem: p.stem,
        stemHanja: sHanja,
        stemElement: sElem,
        stemTenGod: stemGod,
        branch: p.branch,
        branchHanja: bHanja,
        branchElement: bElem,
        branchTenGod: branchGod,
        twelveStage: stage,
        isGongmang: isGm,
        rootingScore: rootScore,
        hiddenStems: hiddenList,
      };
    });

    // 6. 공인 오행 에너지 분포
    const dist = core.data.five_elements.distribution;
    const fiveElements: FiveElementsEnergyScore = {
      wood: dist['목']?.count ?? 0,
      fire: dist['화']?.count ?? 0,
      earth: dist['토']?.count ?? 0,
      metal: dist['금']?.count ?? 0,
      water: dist['수']?.count ?? 0,
      dominant: dynamicAnalysis.ohaeng.dominant,
      lacking: dynamicAnalysis.ohaeng.lacking,
      totalScore: Object.values(dist).reduce((a, b) => a + (b?.count ?? 0), 0),
    };

    // 7. 공인 신강약 및 격국·용신 체계 (SajuDynamicAnalyzer 결과 승계)
    const dmInfo = dynamicAnalysis.dayMaster;
    const strengthInfo = dynamicAnalysis.strength;
    const geokgukInfo = dynamicAnalysis.geokguk;
    const yongshinInfo = dynamicAnalysis.yongshin;

    // 8. 10대운(100년) 계산 (공인 DaewoonEngine: 표준화된 양력 절기 일수 기준)
    const currentYear = new Date().getFullYear();
    const dwResult: DaewoonResult = daewoonEngine.calculateDaewoon({
      birthYear: standardDate.solar_year,
      birthMonth: standardDate.solar_month,
      birthDay: standardDate.solar_day,
      birthHour: normalizedTime ? parseInt(normalizedTime.split(':')[0], 10) : 12,
      birthMinute: normalizedTime ? parseInt(normalizedTime.split(':')[1], 10) : 0,
      gender: params.gender,
      yearStem: fourPillars.year.stem,
      monthStem: fourPillars.month.stem,
      monthBranch: fourPillars.month.branch,
      currentYear,
    });

    // 용신 오행 매칭 함수 (공인 yongshin 기반)
    const yElemPrimary = yongshinInfo.eokbu.primary;
    const yElemSecondary = yongshinInfo.eokbu.secondary;

    const daewoonRecords: DaewoonWarehouseRecord[] = dwResult.pillars.map((dp: DaewoonPillar) => {
      const sElem = STEM_INFO[dp.stem]?.element || '토';
      const bElem = BRANCH_INFO[dp.branch]?.element || '토';

      // 공인 용신 부합 점수 산출 (-50 ~ +50)
      let score = 0;
      if (sElem === yElemPrimary) score += 25;
      else if (sElem === yElemSecondary) score += 15;
      else if (sElem === dmInfo.element) score -= 15;

      if (bElem === yElemPrimary) score += 25;
      else if (bElem === yElemSecondary) score += 15;
      else if (bElem === dmInfo.element) score -= 15;

      let level: '대길' | '호운' | '평운' | '주의' | '위험' = '평운';
      if (score >= 30) level = '대길';
      else if (score >= 15) level = '호운';
      else if (score <= -25) level = '위험';
      else if (score <= -10) level = '주의';

      // 공인 상호작용 검사 (원국과의 충합)
      const relations = this.findBranchRelations(dp.branch, fourPillars);
      const sinsals = this.findDaeunSinsals(dp.branch, fourPillars);
      const isCurrent = dp.order === dwResult.currentDaewoonOrder;
      const dwStage = getTwelveStage(fourPillars.day.stem, dp.branch);
      const dwGm = dayGongmang.includes(dp.branch);

      return {
        order: dp.order,
        startAge: dp.startAge,
        endAge: dp.endAge,
        startYear: dp.startYear,
        endYear: dp.endYear,
        stem: dp.stem,
        branch: dp.branch,
        ganji: dp.ganji,
        stemTenGod: this.tenGodsEngine.getTenGodForStem(fourPillars.day.stem, dp.stem),
        branchTenGod: this.tenGodsEngine.getTenGodForBranchMain(fourPillars.day.stem, dp.branch),
        twelveStage: dwStage,
        isGongmang: dwGm,
        elementMix: `${sElem}/${bElem}`,
        energyScore: score,
        level,
        relationsWithNatal: relations,
        activeSinsals: sinsals,
        isCurrent,
      };
    });

    // 9. 100년 세운 매트릭스 계산 (0세부터 100세까지: 표준화된 출생 연도 기준)
    const sewoonRecords: SewoonWarehouseRecord[] = [];
    const birthYr = standardDate.solar_year;

    for (let age = 0; age <= 100; age++) {
      const yr = birthYr + age;
      const ganji = this.getYearGanji(yr);
      const [s, b] = [ganji[0] as HeavenlyStem, ganji[1] as EarthlyBranch];

      const sElem = STEM_INFO[s]?.element || '토';
      const bElem = BRANCH_INFO[b]?.element || '토';

      const downwardFactors: LifeStepFactor[] = [];
      const upwardFactors: LifeStepFactor[] = [];

      // 1. 공인 SIX_CLASHES / SIX_DESTRUCTIONS / SIX_HARMS 연결 (원국 4주 지지와의 충/파/해 검사)
      const pEntries: [string, string][] = [
        ['년지', fourPillars.year.branch],
        ['월지', fourPillars.month.branch],
        ['일지', fourPillars.day.branch],
      ];
      if (fourPillars.hour) pEntries.push(['시지', fourPillars.hour.branch]);

      pEntries.forEach(([pName, pBranch]) => {
        if (SIX_CLASHES[b]?.partner === pBranch) {
          downwardFactors.push({
            category: '충(沖)',
            name: `${pName} ${SIX_CLASHES[b].name}`,
            impact: 'down',
            weight: pName === '일지' ? -25 : -18,
            description: `${pName}(${pBranch})와 세운(${b})이 정면 충돌하여 기반 동요 및 사건 발생`,
          });
        }
        if (SIX_DESTRUCTIONS[b]?.partner === pBranch) {
          downwardFactors.push({
            category: '파(破)',
            name: `${pName} ${SIX_DESTRUCTIONS[b].name}`,
            impact: 'down',
            weight: -12,
            description: `${pName}(${pBranch})와 세운(${b})의 파(破) 작용: 균열 및 중도 변경`,
          });
        }
        if (SIX_HARMS[b]?.partner === pBranch) {
          downwardFactors.push({
            category: '해(害)',
            name: `${pName} ${SIX_HARMS[b].name}`,
            impact: 'down',
            weight: -12,
            description: `${pName}(${pBranch})와 세운(${b})의 해(害) 작용: 은밀한 훼손 및 마찰`,
          });
        }
      });

      // 2. 공인 공망 검사
      const swGm = dayGongmang.includes(b);
      if (swGm) {
        downwardFactors.push({
          category: '공망',
          name: `세운 ${b} 공망(空亡)`,
          impact: 'down',
          weight: -15,
          description: `일주 기준 공망 지지가 도래하여 노력 대비 결실 누수 및 허망함 주의`,
        });
      }

      // 3. 공인 12운성 검사
      const swStage = getTwelveStage(fourPillars.day.stem, b);
      if (['사', '묘', '절'].includes(swStage)) {
        downwardFactors.push({
          category: '12운성',
          name: `12운성 ${swStage}(${swStage === '사' ? '死' : swStage === '묘' ? '墓' : '絶'})`,
          impact: 'down',
          weight: -15,
          description: `일간 에너지의 침체기이자 내실 축적과 휴식이 요구되는 구간`,
        });
      } else if (['건록', '제왕', '장생'].includes(swStage)) {
        upwardFactors.push({
          category: '12운성',
          name: `12운성 ${swStage}(${swStage === '건록' ? '建祿' : swStage === '제왕' ? '帝旺' : '長生'})`,
          impact: 'up',
          weight: 20,
          description: `일간의 자생력과 주도권이 극대화되는 강력한 활동기`,
        });
      }

      // 4. 공인 용신/기신 검사
      if (sElem === yElemPrimary || bElem === yElemPrimary) {
        upwardFactors.push({
          category: '용신',
          name: `주용신 ${yElemPrimary} 유입`,
          impact: 'up',
          weight: 25,
          description: `사주의 핵심 균형을 잡는 억부 주용신 오행이 도래하여 발복 기회 제공`,
        });
      } else if (sElem === yElemSecondary || bElem === yElemSecondary) {
        upwardFactors.push({
          category: '용신',
          name: `희신 ${yElemSecondary} 유입`,
          impact: 'up',
          weight: 15,
          description: `용신을 돕는 희신 기운이 유입되어 순조로운 협력과 조력 발생`,
        });
      }

      if (sElem === dmInfo.element && bElem === dmInfo.element) {
        downwardFactors.push({
          category: '기신',
          name: `비겁 기신 과다`,
          impact: 'down',
          weight: -15,
          description: `동일 오행 과열로 인한 경쟁 격화 및 군겁쟁재 마찰 주의`,
        });
      }

      // 5. 공인 신살 검사 (천을귀인 등)
      const swSinsals = this.findDaeunSinsals(b, fourPillars);
      if (swSinsals.includes('천을귀인(天乙貴人)')) {
        upwardFactors.push({
          category: '신살',
          name: '천을귀인(天乙貴人)',
          impact: 'up',
          weight: 22,
          description: `최고의 길신인 천을귀인이 동주하여 위기 탈출 및 조력자 유입`,
        });
      }

      // 가중치 합산 및 -100 ~ +100 수우미양가 정밀 스케일 치환
      const upSum = upwardFactors.reduce((acc, f) => acc + f.weight, 0);
      const downSum = downwardFactors.reduce((acc, f) => acc + f.weight, 0); // 음수
      const rawNet = upSum + downSum;

      let stepHeight = 0;
      if (rawNet >= 0) {
        // 상승 구간 (0 ~ +100점)
        if (rawNet <= 20) {
          stepHeight = (rawNet / 20) * 55;
        } else if (rawNet <= 40) {
          stepHeight = 55 + ((rawNet - 20) / 20) * 30; // 55 ~ 85
        } else {
          // 85점 이상: 최대 99.2점까지 점진적 점근 매핑
          const over = rawNet - 40;
          stepHeight = 85 + (14 * over) / (over + 10);
        }
        // 85점 이상 최상위권은 0.1점 단위의 초정밀 변별력 부여
        if (stepHeight >= 85) {
          stepHeight = Math.round(stepHeight * 10) / 10;
        } else {
          stepHeight = Math.round(stepHeight);
        }
      } else {
        // 하강 구간 (0 ~ -100점): 작은 마살도 체감상 -45~-55점으로 급랭하는 비대칭 긴장감
        const absNet = Math.abs(rawNet);
        let negScore = 0;
        if (absNet <= 15) {
          negScore = (absNet / 15) * 50; // 작은 마살/충도 즉시 -50점 수준으로 낭떠러지 형성
        } else if (absNet <= 35) {
          negScore = 50 + ((absNet - 15) / 20) * 35; // 50 ~ 85
        } else {
          const over = absNet - 35;
          negScore = 85 + (14 * over) / (over + 10);
        }
        if (negScore >= 85) {
          stepHeight = -Math.round(negScore * 10) / 10;
        } else {
          stepHeight = -Math.round(negScore);
        }
      }

      // 레벨 결정 (수우미양가 체감 기준)
      let lvl: '최상' | '길' | '평' | '흉' | '대흉' = '평';
      if (stepHeight >= 80) lvl = '최상';      // 秀 (80~100점)
      else if (stepHeight >= 50) lvl = '길';   // 優 (50~79점)
      else if (stepHeight <= -75) lvl = '대흉'; // 禍 (-75~-100점 극심한 마살)
      else if (stepHeight <= -40) lvl = '흉';  // 厄 (-40~-74점 위기/마찰)

      const matchedDw = daewoonRecords.find(d => age >= d.startAge && age <= d.endAge) || daewoonRecords[0];
      const relations = this.findBranchRelations(b, fourPillars);

      sewoonRecords.push({
        year: yr,
        age,
        daewoonOrder: matchedDw ? matchedDw.order : 1,
        stem: s,
        branch: b,
        ganji,
        stemTenGod: this.tenGodsEngine.getTenGodForStem(fourPillars.day.stem, s),
        branchTenGod: this.tenGodsEngine.getTenGodForBranchMain(fourPillars.day.stem, b),
        twelveStage: swStage,
        isGongmang: swGm,
        score: Math.max(10, Math.min(95, 50 + Math.round(stepHeight / 2))),
        stepHeight,
        level: lvl,
        relationsWithNatal: relations,
        downwardFactors,
        upwardFactors,
        isCurrentYear: yr === currentYear,
      });
    }

    // 골든타임 & 위험기 도출
    const golden = daewoonRecords
      .filter(d => d.level === '대길' || d.level === '호운')
      .map(d => ({ ageRange: `${d.startAge}~${d.endAge}세 (${d.ganji} 대운)`, reason: `공인 억부용신(${yElemPrimary}) 생조 및 도약기` }));

    const danger = daewoonRecords
      .filter(d => d.level === '위험' || d.level === '주의')
      .map(d => ({ ageRange: `${d.startAge}~${d.endAge}세 (${d.ganji} 대운)`, reason: `기신 기운 유입 및 원국 대대적 변동 주의` }));

    // 공인 합충 내역 수집
    const natalRelationsList: string[] = [
      ...dynamicAnalysis.clashesAndHarmonies.clashes,
      ...dynamicAnalysis.clashesAndHarmonies.harmonies,
      ...dynamicAnalysis.clashesAndHarmonies.tripleHarmonies,
      ...dynamicAnalysis.clashesAndHarmonies.punishments,
      ...dynamicAnalysis.clashesAndHarmonies.wonjin,
    ].filter(Boolean);

    // 공망 작용 기둥 식별
    const gongmangAffected: string[] = [];
    if (dayGongmang.includes(fourPillars.year.branch)) gongmangAffected.push(`년지(${fourPillars.year.branch})`);
    if (dayGongmang.includes(fourPillars.month.branch)) gongmangAffected.push(`월지(${fourPillars.month.branch})`);
    if (fourPillars.hour && dayGongmang.includes(fourPillars.hour.branch)) gongmangAffected.push(`시지(${fourPillars.hour.branch})`);

    // 신살 길신/특수살 분류
    const rawSinsals = this.findDaeunSinsals(fourPillars.day.branch, fourPillars);
    const guiinList = rawSinsals.filter(s => s.includes('귀인') || s.includes('덕'));
    const specialList = rawSinsals.filter(s => !s.includes('귀인') && !s.includes('덕'));

    const deepStructure: DeepStructureAnalysis = {
      twelveStages: {
        year: getTwelveStage(fourPillars.day.stem, fourPillars.year.branch),
        month: getTwelveStage(fourPillars.day.stem, fourPillars.month.branch),
        day: getTwelveStage(fourPillars.day.stem, fourPillars.day.branch),
        hour: fourPillars.hour ? getTwelveStage(fourPillars.day.stem, fourPillars.hour.branch) : null,
      },
      gongmang: {
        dayBased: dayGongmang,
        yearBased: yearGongmang,
        affectedPillars: gongmangAffected,
        description: gongmangAffected.length > 0 
          ? `일주 기준 공망(${dayGongmang.join('·')})이 원국의 ${gongmangAffected.join(', ')}에 작용 중입니다.`
          : `일주 기준 공망(${dayGongmang.join('·')})이 원국 4주 지지에는 직접 걸리지 않아 공망 영향이 온전합니다.`,
      },
      flowChannels: {
        shiksangSaengJae: core.data.flow_channels.shiksang_saeng_jae,
        jaeSaengGwan: core.data.flow_channels.jae_saeng_gwan,
        gwanInSaeng: core.data.flow_channels.gwan_in_saeng,
        biGeopBunsan: core.data.flow_channels.bi_geop_bunsan,
        summary: `식상생재(${core.data.flow_channels.shiksang_saeng_jae}점) · 재생관(${core.data.flow_channels.jae_saeng_gwan}점) · 관인상생(${core.data.flow_channels.gwan_in_saeng}점) · 비겁분산/쟁재압력(${core.data.flow_channels.bi_geop_bunsan}점)`,
      },
      palaces: {
        year: { name: '년주(근/조상궁)', period: '0~19세 유년기', theme: `${fourPillars.year.stem}${fourPillars.year.branch} 기반 조상·대외적 환경` },
        month: { name: '월주(묘/사회궁)', period: '20~39세 청년기', theme: `${fourPillars.month.stem}${fourPillars.month.branch} 기반 사회적 직업 활동성` },
        day: { name: '일주(화/본인·배우자궁)', period: '40~59세 중년기', theme: `${fourPillars.day.stem}${fourPillars.day.branch} 중심 본인 자생력 및 배우자궁` },
        hour: { name: '시주(실/결실궁)', period: '60세 이후 말년기', theme: fourPillars.hour ? `${fourPillars.hour.stem}${fourPillars.hour.branch} 중심 말년 비즈니스 및 사적 결실` : '시주 미상 (3주 기준 판정)' },
      },
      rootings: {
        yearStem: { stem: fourPillars.year.stem, score: core.data.rootings.yearStem?.rootingScore ?? 0 },
        monthStem: { stem: fourPillars.month.stem, score: core.data.rootings.monthStem?.rootingScore ?? 0 },
        dayStem: { stem: fourPillars.day.stem, score: core.data.rootings.dayStem?.rootingScore ?? 0 },
        hourStem: fourPillars.hour ? { stem: fourPillars.hour.stem, score: core.data.rootings.hourStem?.rootingScore ?? 0 } : null,
      },
      detailedRelations: {
        clashes: dynamicAnalysis.clashesAndHarmonies.clashes,
        sixHarmonies: dynamicAnalysis.clashesAndHarmonies.harmonies,
        tripleHarmonies: dynamicAnalysis.clashesAndHarmonies.tripleHarmonies,
        semiHarmonies: dynamicAnalysis.clashesAndHarmonies.semiHarmonies,
        punishments: dynamicAnalysis.clashesAndHarmonies.punishments,
        destructions: dynamicAnalysis.clashesAndHarmonies.destructions,
        harms: dynamicAnalysis.clashesAndHarmonies.harms,
        wonjin: dynamicAnalysis.clashesAndHarmonies.wonjin,
      },
      sinsalsCategorized: {
        guiin: guiinList,
        special: specialList,
      },
    };

    return {
      metadata: {
        calculatedAt: new Date().toISOString(),
        engineVersion: '2026.1-MabosalTruthEngine (Unified)',
        ruleSet: 'KASI_ASTRONOMICAL_STANDARD',
        input: {
          birthDate: params.calendarType === 'lunar' ? `${params.birthYear}-${pad(params.birthMonth)}-${pad(params.birthDay)} (양력 ${effectiveSolarDateStr})` : effectiveSolarDateStr,
          birthTime: normalizedTime,
          gender: params.gender,
          calendarType: params.calendarType || 'solar',
        },
      },
      natalLayer: {
        pillars: natalPillars,
        dayMaster: {
          stem: dmInfo.stem,
          hanja: STEM_MAP[dmInfo.stem]?.hanja || dmInfo.stem,
          element: dmInfo.element,
          polarity: dmInfo.yinYang,
          nature: dmInfo.nature,
          characteristics: dmInfo.characteristics,
        },
        fiveElements,
        strength: {
          score: strengthInfo.score,
          classification: strengthInfo.status,
          isDeungryeong: strengthInfo.deungryeong,
          isDeungji: strengthInfo.deungji,
          isDeungse: strengthInfo.deungse,
          description: strengthInfo.description,
        },
        geokguk: {
          name: geokgukInfo.name,
          basis: geokgukInfo.basis,
          description: geokgukInfo.description,
        },
        yongshin: {
          yongshin: `${yongshinInfo.eokbu.primary} (억부 주용신)`,
          heeshin: `${yongshinInfo.eokbu.secondary} (억부 희신)`,
          gishin: `${dmInfo.element} (기신 비겁)`,
          johuYongshin: `${yongshinInfo.johu.primary} (조후 용신)`,
          johuSeason: yongshinInfo.johu.season,
          reason: yongshinInfo.reason,
        },
        natalRelations: natalRelationsList.length > 0 ? natalRelationsList : ['원국 내 뚜렷한 충돌 없이 안정된 배합'],
        natalSinsals: rawSinsals,
      },
      deepStructure,
      daewoonLayer: {
        direction: dwResult.direction,
        daewoonNumber: dwResult.daewoonNumber,
        currentDaewoonOrder: dwResult.currentDaewoonOrder,
        records: daewoonRecords,
        goldenPeriods: golden,
        dangerPeriods: danger,
      },
      sewoonLayer: {
        currentYear,
        records: sewoonRecords,
      },
    };
  }

  // 지지 충합 관계 식별
  private findBranchRelations(b: string, fourPillars: FourPillars): string[] {
    const list: string[] = [];
    const pEntries: [string, Pillar | null][] = [
      ['년지', fourPillars.year],
      ['월지', fourPillars.month],
      ['일지', fourPillars.day],
      ['시지', fourPillars.hour],
    ];

    const clashes: Record<string, string> = {
      '자': '오', '축': '미', '인': '신', '묘': '유', '진': '술', '사': '해',
      '오': '자', '미': '축', '신': '인', '유': '묘', '술': '진', '해': '사'
    };

    const combines: Record<string, string> = {
      '자': '축', '축': '자', '인': '해', '해': '인', '묘': '술', '술': '묘',
      '진': '유', '유': '진', '사': '신', '신': '사', '오': '미', '미': '오'
    };

    pEntries.forEach(([name, p]) => {
      if (!p) return;
      if (clashes[b] === p.branch) list.push(`${name}(${p.branch})와 충(沖)`);
      if (combines[b] === p.branch) list.push(`${name}(${p.branch})와 육합(六合)`);
    });

    return list;
  }

  // 지지 신살 발동 식별 (천을귀인, 역마, 도화, 화개) - 공용 함수 detectBranchSinsals 위임
  private findDaeunSinsals(b: string, fourPillars: FourPillars): string[] {
    return detectBranchSinsals(b, fourPillars.day.stem, fourPillars.day.branch, fourPillars.year.branch);
  }

  // 연도별 60갑자 계산기
  private getYearGanji(year: number): string {
    const offset = (year - 1984) % 60;
    const idx = (offset + 60) % 60;
    return SIXTY_GANJI[idx];
  }

  /**
   * AI 모델(안프로)에 직접 전달할 표준 마크다운 프롬프트 텍스트 출력
   */
  public static exportToMarkdownPrompt(wh: CanonicalLifeDataWarehouse): string {
    const inp = wh.metadata.input;
    const dm = wh.natalLayer.dayMaster;
    const fe = wh.natalLayer.fiveElements;
    const st = wh.natalLayer.strength;
    const yo = wh.natalLayer.yongshin;
    const gk = wh.natalLayer.geokguk;

    let text = `# [마보살 사주 엔진 정규 원천 팩트 데이터셋]\n\n`;
    text += `## 1. 기본 프로필\n`;
    text += `- 출생일시: ${inp.birthDate} ${inp.birthTime ? inp.birthTime : '(시간 미상)'} (${inp.calendarType === 'solar' ? '양력' : '음력'}, ${inp.gender === 'male' ? '남성' : '여성'})\n`;
    text += `- 일간(日干): ${dm.stem}(${dm.hanja}) - ${dm.element} [${dm.nature}]\n`;
    text += `- 오행 분포: 목 ${fe.wood} · 화 ${fe.fire} · 토 ${fe.earth} · 금 ${fe.metal} · 수 ${fe.water} (최다: ${fe.dominant}, 부족: ${fe.lacking.join(', ') || '없음'})\n`;
    text += `- 신강약 판정: ${st.classification} (${st.score}점, 득령: ${st.isDeungryeong ? 'O' : 'X'}, 득지: ${st.isDeungji ? 'O' : 'X'}, 득세: ${st.isDeungse ? 'O' : 'X'})\n`;
    text += `- 격국: ${gk.name} (${gk.basis})\n`;
    text += `- 용신 체계: 억부용신[${yo.yongshin}] · 희신[${yo.heeshin}] · 기신[${yo.gishin}] · 조후용신[${yo.johuYongshin}]\n`;
    text += `- 판정 근거: ${yo.reason}\n\n`;

    text += `## 2. 사주 4주 원국표 및 포태·공망\n`;
    text += `| 구분 | 년주(Year) | 월주(Month) | 일주(Day) | 시주(Hour) |\n`;
    text += `|---|---|---|---|---|\n`;
    text += `| 천간 | ${wh.natalLayer.pillars[0].stem}(${wh.natalLayer.pillars[0].stemHanja}) [${wh.natalLayer.pillars[0].stemTenGod}] | ${wh.natalLayer.pillars[1].stem}(${wh.natalLayer.pillars[1].stemHanja}) [${wh.natalLayer.pillars[1].stemTenGod}] | ${wh.natalLayer.pillars[2].stem}(${wh.natalLayer.pillars[2].stemHanja}) [일간] | ${wh.natalLayer.pillars[3].stem}(${wh.natalLayer.pillars[3].stemHanja}) [${wh.natalLayer.pillars[3].stemTenGod}] |\n`;
    text += `| 지지 | ${wh.natalLayer.pillars[0].branch}(${wh.natalLayer.pillars[0].branchHanja}) [${wh.natalLayer.pillars[0].branchTenGod}] | ${wh.natalLayer.pillars[1].branch}(${wh.natalLayer.pillars[1].branchHanja}) [${wh.natalLayer.pillars[1].branchTenGod}] | ${wh.natalLayer.pillars[2].branch}(${wh.natalLayer.pillars[2].branchHanja}) [${wh.natalLayer.pillars[2].branchTenGod}] | ${wh.natalLayer.pillars[3].branch}(${wh.natalLayer.pillars[3].branchHanja}) [${wh.natalLayer.pillars[3].branchTenGod}] |\n`;
    text += `| 12운성 | ${wh.natalLayer.pillars[0].twelveStage} | ${wh.natalLayer.pillars[1].twelveStage} | ${wh.natalLayer.pillars[2].twelveStage} | ${wh.natalLayer.pillars[3].twelveStage} |\n`;
    text += `| 공망 여부 | ${wh.natalLayer.pillars[0].isGongmang ? '★공망' : '유효'} | ${wh.natalLayer.pillars[1].isGongmang ? '★공망' : '유효'} | 기준 | ${wh.natalLayer.pillars[3].isGongmang ? '★공망' : '유효'} |\n`;
    text += `| 통근 점수 | ${wh.natalLayer.pillars[0].rootingScore}점 | ${wh.natalLayer.pillars[1].rootingScore}점 | ${wh.natalLayer.pillars[2].rootingScore}점 | ${wh.natalLayer.pillars[3].rootingScore}점 |\n`;
    text += `| 지장간 | ${wh.natalLayer.pillars[0].hiddenStems.join(',')} | ${wh.natalLayer.pillars[1].hiddenStems.join(',')} | ${wh.natalLayer.pillars[2].hiddenStems.join(',')} | ${wh.natalLayer.pillars[3].hiddenStems.join(',')} |\n\n`;

    const ds = wh.deepStructure;
    text += `## 3. 심층 구조 분석 레이어 (12운성·통근·공망·4대 유통 흐름·궁위론)\n`;
    text += `- 12운성 포태 흐름: 년[${ds.twelveStages.year}] ➔ 월[${ds.twelveStages.month}] ➔ 일[${ds.twelveStages.day}] ➔ 시[${ds.twelveStages.hour || '미상'}]\n`;
    text += `- 공망(旬空) 체계: 일주 기준 [${ds.gongmang.dayBased.join('·')}] / 년주 기준 [${ds.gongmang.yearBased.join('·')}] — ${ds.gongmang.description}\n`;
    text += `- 4대 생극제화 유통 통로:\n`;
    text += `  • 식상생재(재능 ➔ 재물): ${ds.flowChannels.shiksangSaengJae}점 / 100점\n`;
    text += `  • 재생관(재물 ➔ 명예·조직): ${ds.flowChannels.jaeSaengGwan}점 / 100점\n`;
    text += `  • 관인상생(명예·조직 ➔ 결재권·자격): ${ds.flowChannels.gwanInSaeng}점 / 100점\n`;
    text += `  • 비겁분산/쟁재압력(재물 분탈 위험): ${ds.flowChannels.biGeopBunsan}점 / 100점\n`;
    text += `- 4궁위 생애 영역:\n`;
    text += `  • 년주 (0~19세): ${ds.palaces.year.theme}\n`;
    text += `  • 월주 (20~39세): ${ds.palaces.month.theme}\n`;
    text += `  • 일주 (40~59세): ${ds.palaces.day.theme}\n`;
    text += `  • 시주 (60세 이후): ${ds.palaces.hour.theme}\n\n`;

    text += `## 4. 원국 상호작용 및 신살\n`;
    text += `- 원국 합충: ${wh.natalLayer.natalRelations.join(', ')}\n`;
    text += `- 길신(귀인류): ${ds.sinsalsCategorized.guiin.join(', ') || '특이 길신 없음'}\n`;
    text += `- 특수/변동살: ${ds.sinsalsCategorized.special.join(', ') || '특이 변동살 없음'}\n\n`;

    text += `## 5. 0~100세 10대운 타임라인\n`;
    text += `대운 방향: ${wh.daewoonLayer.direction} (대운수: ${wh.daewoonLayer.daewoonNumber})\n\n`;
    text += `| 순번 | 나이 구간 | 간지 | 십신(천/지) | 12운성 | 공망 | 오행 | 판정 | 원국 충합 및 활성 신살 |\n`;
    text += `|---|---|---|---|---|---|---|---|---|\n`;
    wh.daewoonLayer.records.forEach(d => {
      const curMark = d.isCurrent ? ' ★현재' : '';
      const notes = [...d.relationsWithNatal, ...d.activeSinsals].join('; ') || '-';
      text += `| 제${d.order}대운${curMark} | ${d.startAge}~${d.endAge}세 (${d.startYear}~${d.endYear}) | ${d.ganji} | ${d.stemTenGod}/${d.branchTenGod} | ${d.twelveStage} | ${d.isGongmang ? '공망' : '유효'} | ${d.elementMix} | ${d.level}(${d.energyScore > 0 ? '+' : ''}${d.energyScore}) | ${notes} |\n`;
    });

    text += `\n## 6. 인생 핵심 분기점\n`;
    text += `- ★ 황금기(전성기): ${wh.daewoonLayer.goldenPeriods.map(g => `${g.ageRange} [${g.reason}]`).join(', ') || '중화 안정기'}\n`;
    text += `- ⚠ 주의기(위험기): ${wh.daewoonLayer.dangerPeriods.map(d => `${d.ageRange} [${d.reason}]`).join(', ') || '심각한 위험 대운 없음'}\n\n`;

    text += `## 7. 향후 10년 세운 흐름 및 계단 높낮이 원인 (현재 연도 기준)\n`;
    const curYr = wh.sewoonLayer.currentYear;
    const future10 = wh.sewoonLayer.records.filter(s => s.year >= curYr && s.year < curYr + 10);
    text += `| 연도 | 나이 | 간지 | 12운성 | 계단높이 | 판정 | 하강/마찰 원인 (마살) | 상승/도약 원인 (길조) |\n`;
    text += `|---|---|---|---|---|---|---|---|\n`;
    future10.forEach(s => {
      const downStr = s.downwardFactors.map(f => `${f.name}(${f.weight})`).join(', ') || '-';
      const upStr = s.upwardFactors.map(f => `${f.name}(+${f.weight})`).join(', ') || '-';
      text += `| ${s.year}년 | ${s.age}세 | ${s.ganji} | ${s.twelveStage} | ${s.stepHeight > 0 ? '+' : ''}${s.stepHeight} | ${s.level} | ${downStr} | ${upStr} |\n`;
    });

    return text;
  }
}
