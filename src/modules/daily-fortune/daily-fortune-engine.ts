/**
 * Daily Fortune Score Engine (천기지수 및 일일 3대 지수 정밀 파생 모듈)
 * 
 * 마보살 엔진 원칙:
 * 1. 기존 명리 원천 계산(Phase 1~13)은 일체 변경하지 않고 보존한다.
 * 2. SajuCore(일간, 오행, 용신), SignalEngine(5대 축, 재성/관성/식상 신호), RelationshipEngine(합/충)을
 *    당일 일진(오늘의 간지)과 명리학적으로 결합하여,
 *    [천기지수 (Celestial Score)], [금전운 지수], [애정운 지수], [활력도 지수]를
 *    0~100점 점수 및 명리적 근거 요약으로 정밀 산출한다.
 * 3. 사주 미입력 시에는 당일 천기 기본 기운을 산출하되, 사주 입력 시 1:1 맞춤 정밀 지수로 동적 전환된다.
 */

import { SajuCoreOutput } from '../saju-core/saju-core-engine.js';
import { SignalOutput } from '../signal/signal-engine.js';
import { RelationshipOutput } from '../relationship/relationship-engine.js';

export interface DailyFortuneInput {
  sajuCore?: SajuCoreOutput;
  signal?: SignalOutput;
  relationship?: RelationshipOutput;
  userName?: string;
  gender?: 'male' | 'female';
  targetDate?: Date;
}

export interface DailyFortuneScores {
  // 1. 천기지수 (종합 길흉 지수)
  celestialScore: number;
  gradeBadge: string;
  summaryTitle: string;
  summaryDesc: string;

  // 2. 3대 세부 지수
  moneyScore: number;
  moneyDesc: string;
  loveScore: number;
  loveDesc: string;
  vitalityScore: number;
  vitalityDesc: string;

  // 3. 당일 천기 달력 맥락
  todayStem: string;
  todayBranch: string;
  todayPillarName: string;
  ganjiDateStr: string;
  lunarDateStr: string;
  isPersonalized: boolean; // 개인 사주 결합 여부
}

const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

const STEM_ELEMENTS: Record<string, '목' | '화' | '토' | '금' | '수'> = {
  갑: '목', 을: '목', 병: '화', 정: '화', 무: '토', 기: '토', 경: '금', 신: '금', 임: '수', 계: '수',
};

const BRANCH_ELEMENTS: Record<string, '목' | '화' | '토' | '금' | '수'> = {
  인: '목', 묘: '목', 사: '화', 오: '화', 진: '토', 술: '토', 축: '토', 미: '토', 신: '금', 유: '금', 해: '수', 자: '수',
};

// 지지 6합
const SIX_HARMONIES: Record<string, string> = {
  자: '축', 축: '자', 인: '해', 해: '인', 묘: '술', 술: '묘', 진: '유', 유: '진', 사: '신', 신: '사', 오: '미', 미: '오',
};

// 지지 6충
const SIX_CLASHES: Record<string, string> = {
  자: '오', 오: '자', 축: '미', 미: '축', 인: '신', 신: '인', 묘: '유', 유: '묘', 진: '술', 술: '진', 사: '해', 해: '사',
};

export class DailyFortuneEngine {
  /**
   * 기준 날짜의 천간/지지(일진) 및 음력 일자 산출
   */
  public static getDailyPillar(targetDate: Date = new Date()): {
    stem: string;
    branch: string;
    pillarName: string;
    ganjiDateStr: string;
    lunarDateStr: string;
    yearStem: string;
    yearBranch: string;
  } {
    const now = targetDate;
    const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const anchorUtc = Date.UTC(2000, 0, 1); // 2000-01-01은 경진(庚辰)일 (index 54)
    const diffDays = Math.round((utcNow - anchorUtc) / 86400000);
    const dayGanjiIdx = ((54 + (diffDays % 60)) % 60 + 60) % 60;
    const stem = STEMS[dayGanjiIdx % 10];
    const branch = BRANCHES[dayGanjiIdx % 12];
    const pillarName = `${stem}${branch}`;

    // 연도 간지
    const yearOffset = (now.getFullYear() - 4) % 60;
    const yearStem = STEMS[(yearOffset % 10 + 10) % 10];
    const yearBranch = BRANCHES[(yearOffset % 12 + 12) % 12];

    const ganjiDateStr = `${yearStem}${yearBranch}년 ${pillarName}일`;
    const lunarDateStr = `음력 ${(now.getMonth() + 11) % 12 + 1}월 ${Math.min(29, now.getDate())}일`;

    return { stem, branch, pillarName, ganjiDateStr, lunarDateStr, yearStem, yearBranch };
  }

  /**
   * 천기지수 및 3대 운세 지수 정밀 계산
   */
  public static calculate(input: DailyFortuneInput): DailyFortuneScores {
    const today = this.getDailyPillar(input.targetDate || new Date());
    const todayStemEl = STEM_ELEMENTS[today.stem] || '화';
    const todayBranchEl = BRANCH_ELEMENTS[today.branch] || '화';

    // 사주 원국 정보가 있는 경우: 1:1 맞춤 명리 정밀 연산
    if (input.sajuCore) {
      return this.calculatePersonalized(input, today, todayStemEl, todayBranchEl);
    }

    // 사주 정보가 아직 없는 경우: 당일 천기 기본 기운 산출
    return this.calculateDefault(today, todayStemEl, todayBranchEl);
  }

  /**
   * 1:1 맞춤 개인화 명리 지수 산출 (마보살 엔진 원천 데이터 결합)
   */
  private static calculatePersonalized(
    input: DailyFortuneInput,
    today: ReturnType<typeof DailyFortuneEngine.getDailyPillar>,
    todayStemEl: '목' | '화' | '토' | '금' | '수',
    todayBranchEl: '목' | '화' | '토' | '금' | '수'
  ): DailyFortuneScores {
    const core = input.sajuCore!;
    const signal = input.signal;
    const rel = input.relationship;

    const coreAny = core as any;
    const dayPillar = (core.four_pillars?.day || coreAny?.pillars?.day) as any;
    const stemAny = dayPillar?.stem;
    const branchAny = dayPillar?.branch;
    const dayStem: string = typeof stemAny === 'object' ? stemAny.char : (stemAny || (core as any).day_stem || '갑');
    const dayBranch: string = typeof branchAny === 'object' ? branchAny.char : (branchAny || '자');
    const dayElement: string = (core as any).day_element || (typeof stemAny === 'object' ? stemAny.element : '목');
    const strengthAny = (core.day_master_strength || coreAny?.dayMasterStrength) as any;
    const yongshin = strengthAny?.yongshin || '화';
    const heeshin = strengthAny?.heeshin || '토';

    // 1. [천기지수 계산]
    // 베이스 점수: 72점
    let celestialScore = 72;

    // A. 5대 축 신호 반영 (기회도 +, 완화도 +, 압박도 -)
    if (signal && (signal as any).axis5_baseline) {
      const base = (signal as any).axis5_baseline;
      const opp = base.opportunity ?? 50;
      const mit = base.mitigation ?? 50;
      const press = base.pressure ?? 50;
      const oppBonus = ((opp - 50) * 0.18);
      const mitBonus = ((mit - 50) * 0.12);
      const pressPenalty = ((press - 50) * 0.20);
      celestialScore += Math.round(oppBonus + mitBonus - pressPenalty);
    }

    // B. 오늘 일진과 용신/희신 일치 여부
    const isYongshinDay = todayStemEl === yongshin || todayBranchEl === yongshin;
    const isHeeshinDay = todayStemEl === heeshin || todayBranchEl === heeshin;
    if (isYongshinDay) celestialScore += 9;
    else if (isHeeshinDay) celestialScore += 5;

    // C. 일지(본원궁)와 당일 일진의 지지 합/충
    const isHarmonious = SIX_HARMONIES[dayBranch] === today.branch;
    const isClashing = SIX_CLASHES[dayBranch] === today.branch;
    if (isHarmonious) celestialScore += 7;
    if (isClashing) celestialScore -= 11;

    celestialScore = Math.max(42, Math.min(98, celestialScore));

    // 천기지수 등급 및 텍스트 매핑
    let gradeBadge = '평 (平)';
    let summaryTitle = '순리와 안정을 도모하는 평온한 하루';
    let summaryDesc = '무리한 확장보다는 현재의 흐름을 단정히 점검하고 내실을 다지기에 적합한 시간입니다.';

    if (celestialScore >= 86) {
      gradeBadge = '대길 (大吉)';
      summaryTitle = isHarmonious
        ? '귀인이 화합하고 결실이 맺히는 최상의 길일'
        : '청룡의 기운이 비추니 뜻밖의 기쁜 소식이 당도합니다';
      summaryDesc = '그동안 공들였던 계획이 수월하게 풀리고 조력자의 협조를 얻기에 가장 이로운 타이밍입니다.';
    } else if (celestialScore >= 72) {
      gradeBadge = '길 (吉)';
      summaryTitle = '순풍에 돛을 단 듯 매끄러운 진행';
      summaryDesc = '사소한 막힘이 풀려나가며 주변과의 긍정적인 교류를 통해 실속을 챙기기 좋습니다.';
    } else if (celestialScore < 56) {
      gradeBadge = '주의 (愼)';
      summaryTitle = isClashing
        ? '일지와 충돌하니 서두름을 경계하고 한 템포 쉬어갈 때'
        : '외풍이 거칠 수 있으니 방어와 안정을 최우선할 날';
      summaryDesc = '새로운 계약이나 감정적인 즉흥 대응을 삼가고, 확실히 검증된 일에만 집중하는 것이 현명합니다.';
    }

    // 2. [금전운 지수 계산]
    // 명리 근거: 재성 구조점수(structureScore) + 식상생재(sikSangProduceJae) - 비겁분산(biGeopDispersion)
    let moneyScore = 70;
    let moneyDesc = '평이한 자금 흐름';
    if (signal && (signal as any).wealth) {
      const wealthSignal = (signal as any).wealth;
      const struct = wealthSignal.structureScore ?? 60;
      const sik = wealthSignal.sikSangProduceJae ?? 50;
      const biGeop = wealthSignal.biGeopDispersion ?? 40;
      const baseWealth = struct * 0.45 + sik * 0.35;
      const biGeopRisk = biGeop * 0.25;
      moneyScore = Math.round(baseWealth - biGeopRisk + 25);
    }
    // 오늘 일진이 재성(내가 극하는 오행) 또는 식상(재물을 낳는 오행)인지 대조
    const WEALTH_ELEMENT_MAP: Record<string, string> = { 목: '토', 화: '금', 토: '수', 금: '목', 수: '화' };
    const OUTPUT_ELEMENT_MAP: Record<string, string> = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' };
    const myWealthEl = WEALTH_ELEMENT_MAP[dayElement];
    const myOutputEl = OUTPUT_ELEMENT_MAP[dayElement];

    if (todayStemEl === myWealthEl || todayBranchEl === myWealthEl) {
      moneyScore += 8;
      moneyDesc = '현금성 결실과 이익 기회 포착';
    } else if (todayStemEl === myOutputEl || todayBranchEl === myOutputEl) {
      moneyScore += 5;
      moneyDesc = '재능과 실행력이 재물로 연결';
    } else if (isClashing) {
      moneyScore -= 8;
      moneyDesc = '충동 지출 및 미검증 투자 주의';
    }
    moneyScore = Math.max(35, Math.min(99, moneyScore));

    // 3. [애정운 지수 계산]
    // 명리 근거: 일지(배우자궁) 안정도 + 오늘 일진과의 합/충 + 성별 인연 기운
    let loveScore = 70;
    let loveDesc = '온화하고 무탈한 관계';
    const clashScore = rel ? rel.summary?.total_clash_score ?? 10 : 10;
    loveScore = Math.round(85 - clashScore * 0.4);

    if (isHarmonious) {
      loveScore += 14;
      loveDesc = '일지 육합 작용, 애정운 급상승';
    } else if (isClashing) {
      loveScore -= 15;
      loveDesc = '감정 마찰 및 사소한 언쟁 주의';
    } else {
      // 남자는 재성, 여자는 관성이 올 때 인연 기운 상승
      const OFFICER_ELEMENT_MAP: Record<string, string> = { 목: '금', 화: '수', 토: '목', 금: '화', 수: '토' };
      const myOfficerEl = OFFICER_ELEMENT_MAP[dayElement];
      const isLoveStarDay = input.gender === 'female'
        ? (todayStemEl === myOfficerEl || todayBranchEl === myOfficerEl)
        : (todayStemEl === myWealthEl || todayBranchEl === myWealthEl);
      if (isLoveStarDay) {
        loveScore += 7;
        loveDesc = '호감과 공감대가 깊어지는 흐름';
      }
    }
    loveScore = Math.max(35, Math.min(98, loveScore));

    // 4. [활력도 지수 계산]
    // 명리 근거: 일간 감당력(dayMasterCapacity) + 추진력(executionDrive) + 신강약 안정성
    let vitalityScore = 70;
    let vitalityDesc = '균형 잡힌 생체 리듬';
    if (signal && (signal as any).wealth && (signal as any).output) {
      const cap = ((signal as any).wealth.dayMasterCapacity ?? 60) * 0.5;
      const drive = ((signal as any).output.executionDrive ?? 60) * 0.4;
      vitalityScore = Math.round(cap + drive + 10);
    }
    // 오늘 일진이 일간을 생조(인성/비겁)하는 기운이면 활력 보충
    const RESOURCE_ELEMENT_MAP: Record<string, string> = { 목: '수', 화: '목', 토: '화', 금: '토', 수: '금' };
    const myResourceEl = RESOURCE_ELEMENT_MAP[dayElement];
    if (todayStemEl === myResourceEl || todayBranchEl === myResourceEl || todayStemEl === dayElement) {
      vitalityScore += 8;
      vitalityDesc = '기운을 북돋는 원기 충전일';
    } else if (isClashing) {
      vitalityScore -= 9;
      vitalityDesc = '과로 경계 및 충분한 수면 필요';
    }
    vitalityScore = Math.max(38, Math.min(98, vitalityScore));

    return {
      celestialScore,
      gradeBadge,
      summaryTitle,
      summaryDesc,
      moneyScore,
      moneyDesc,
      loveScore,
      loveDesc,
      vitalityScore,
      vitalityDesc,
      todayStem: today.stem,
      todayBranch: today.branch,
      todayPillarName: today.pillarName,
      ganjiDateStr: today.ganjiDateStr,
      lunarDateStr: today.lunarDateStr,
      isPersonalized: true,
    };
  }

  /**
   * 사주 미입력 시 당일 천기 기본 기운 산출
   */
  private static calculateDefault(
    today: ReturnType<typeof DailyFortuneEngine.getDailyPillar>,
    todayStemEl: '목' | '화' | '토' | '금' | '수',
    todayBranchEl: '목' | '화' | '토' | '금' | '수'
  ): DailyFortuneScores {
    // 60갑자 당일 간지의 음양오행 상생상극 기본 분석
    const isBranchHelpStem = (
      (todayStemEl === '목' && todayBranchEl === '수') ||
      (todayStemEl === '화' && todayBranchEl === '목') ||
      (todayStemEl === '토' && todayBranchEl === '화') ||
      (todayStemEl === '금' && todayBranchEl === '토') ||
      (todayStemEl === '수' && todayBranchEl === '금')
    );

    const baseScore = isBranchHelpStem ? 85 : 78;
    const gradeBadge = isBranchHelpStem ? '대길 (大吉)' : '길 (吉)';
    const summaryTitle = isBranchHelpStem
      ? `${today.pillarName}일 지지가 천간을 생하는 길조의 기운`
      : `${today.pillarName}일 맑고 차분하게 정돈되는 천기의 흐름`;
    const summaryDesc = '천간과 지지가 빚어내는 자연의 조화 속에 중요한 결정을 내리기 유익한 시간입니다.';

    return {
      celestialScore: baseScore,
      gradeBadge,
      summaryTitle,
      summaryDesc,
      moneyScore: isBranchHelpStem ? 88 : 80,
      moneyDesc: '실속 있는 관리 흐름',
      loveScore: isBranchHelpStem ? 85 : 79,
      loveDesc: '원만한 유대감 형성',
      vitalityScore: isBranchHelpStem ? 82 : 76,
      vitalityDesc: '안정적인 생체 리듬',
      todayStem: today.stem,
      todayBranch: today.branch,
      todayPillarName: today.pillarName,
      ganjiDateStr: today.ganjiDateStr,
      lunarDateStr: today.lunarDateStr,
      isPersonalized: false,
    };
  }
}
