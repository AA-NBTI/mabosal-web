/**
 * MABOSAL Myeongli Rule Specification (Phase 58.2 Freeze)
 * 
 * [절대 원칙]
 * 1. 명리 원천 규칙 (전통 자평 명리 및 천문 역법)
 * 2. 마보살이 선택한 계산 규칙 (단일 Source of Truth)
 * 3. 마보살의 해석/점수 규칙 (정량화 모델 0~100 연속 척도)
 * 
 * 전통 명리학의 학파 차이를 "유일한 정답"이라 호도하지 않으며,
 * "마보살 엔진은 다음 확정 규칙을 채택한다"로 정의하여 일관성을 보장합니다.
 */

import { EarthlyBranch, FiveElement, HeavenlyStem, TenGod, YinYang } from './types.js';
import { STEM_INFO, BRANCH_INFO } from './constants.js';

// ============================================================================
// 1. 규칙 버전 관리 (Rule Versions)
// ============================================================================
export const MYEONGLI_RULE_VERSIONS = {
  CALENDAR: 'CALENDAR-V1',
  HIDDEN_STEM: 'HIDDEN-STEM-V1',
  TEN_GODS: 'TEN-GODS-V1',
  GEOKGUK: 'GEOKGUK-V1',
  YANGIN_WOLGEOP: 'YANGIN-WOLGEOP-V1',
  STRENGTH: 'STRENGTH-V1',
  EOKBU: 'EOKBU-V1',
  JOHU: 'JOHU-V1',
  DAEWUN: 'DAEWUN-V1',
  RELATION: 'RELATION-V1',
  SINSAL: 'SINSAL-V1',
} as const;

// ============================================================================
// 2. 지장간 (Hidden Stems) 단일 Source of Truth
// (월률분야와 철저히 분리: 각 지지 자체에 내재된 천간 목록)
// ============================================================================
export interface PureHiddenStemEntry {
  initial: HeavenlyStem;
  middle?: HeavenlyStem;
  main: HeavenlyStem;
}

export const PURE_HIDDEN_STEMS: Record<EarthlyBranch, PureHiddenStemEntry> = {
  자: { initial: '임', main: '계' },
  축: { initial: '계', middle: '신', main: '기' },
  인: { initial: '무', middle: '병', main: '갑' },
  묘: { initial: '갑', main: '을' },
  진: { initial: '을', middle: '계', main: '무' },
  사: { initial: '무', middle: '경', main: '병' },
  오: { initial: '병', middle: '기', main: '정' },
  미: { initial: '정', middle: '을', main: '기' },
  신: { initial: '무', middle: '임', main: '경' },
  유: { initial: '경', main: '신' },
  술: { initial: '신', middle: '정', main: '무' },
  해: { initial: '무', middle: '갑', main: '임' },
};

// ============================================================================
// 3. 월률분야 (Month Command Division - 사령 및 일수 배분)
// 월지의 계절적 당령/사령 일수 배분 (30일 기준). 오직 월령(월지)에만 적용함.
// ============================================================================
export interface MonthCommandStemRatio {
  stem: HeavenlyStem;
  element: FiveElement;
  days: number;
  ratio: number;
  type: 'initial' | 'middle' | 'main';
}

export const MONTH_COMMAND_DIVISION_TABLE: Record<EarthlyBranch, MonthCommandStemRatio[]> = {
  자: [
    { stem: '임', element: '수', days: 10, ratio: 10 / 30, type: 'initial' },
    { stem: '계', element: '수', days: 20, ratio: 20 / 30, type: 'main' },
  ],
  축: [
    { stem: '계', element: '수', days: 9, ratio: 9 / 30, type: 'initial' },
    { stem: '신', element: '금', days: 3, ratio: 3 / 30, type: 'middle' },
    { stem: '기', element: '토', days: 18, ratio: 18 / 30, type: 'main' },
  ],
  인: [
    { stem: '무', element: '토', days: 7, ratio: 7 / 30, type: 'initial' },
    { stem: '병', element: '화', days: 7, ratio: 7 / 30, type: 'middle' },
    { stem: '갑', element: '목', days: 16, ratio: 16 / 30, type: 'main' },
  ],
  묘: [
    { stem: '갑', element: '목', days: 10, ratio: 10 / 30, type: 'initial' },
    { stem: '을', element: '목', days: 20, ratio: 20 / 30, type: 'main' },
  ],
  진: [
    { stem: '을', element: '목', days: 9, ratio: 9 / 30, type: 'initial' },
    { stem: '계', element: '수', days: 3, ratio: 3 / 30, type: 'middle' },
    { stem: '무', element: '토', days: 18, ratio: 18 / 30, type: 'main' },
  ],
  사: [
    { stem: '무', element: '토', days: 7, ratio: 7 / 30, type: 'initial' },
    { stem: '경', element: '금', days: 7, ratio: 7 / 30, type: 'middle' },
    { stem: '병', element: '화', days: 16, ratio: 16 / 30, type: 'main' },
  ],
  오: [
    { stem: '병', element: '화', days: 10, ratio: 10 / 30, type: 'initial' },
    { stem: '기', element: '토', days: 9, ratio: 9 / 30, type: 'middle' },
    { stem: '정', element: '화', days: 11, ratio: 11 / 30, type: 'main' },
  ],
  미: [
    { stem: '정', element: '화', days: 9, ratio: 9 / 30, type: 'initial' },
    { stem: '을', element: '목', days: 3, ratio: 3 / 30, type: 'middle' },
    { stem: '기', element: '토', days: 18, ratio: 18 / 30, type: 'main' },
  ],
  신: [
    { stem: '무', element: '토', days: 7, ratio: 7 / 30, type: 'initial' },
    { stem: '임', element: '수', days: 7, ratio: 7 / 30, type: 'middle' },
    { stem: '경', element: '금', days: 16, ratio: 16 / 30, type: 'main' },
  ],
  유: [
    { stem: '경', element: '금', days: 10, ratio: 10 / 30, type: 'initial' },
    { stem: '신', element: '금', days: 20, ratio: 20 / 30, type: 'main' },
  ],
  술: [
    { stem: '신', element: '금', days: 9, ratio: 9 / 30, type: 'initial' },
    { stem: '정', element: '화', days: 3, ratio: 3 / 30, type: 'middle' },
    { stem: '무', element: '토', days: 18, ratio: 18 / 30, type: 'main' },
  ],
  해: [
    { stem: '무', element: '토', days: 7, ratio: 7 / 30, type: 'initial' },
    { stem: '갑', element: '목', days: 7, ratio: 7 / 30, type: 'middle' },
    { stem: '임', element: '수', days: 16, ratio: 16 / 30, type: 'main' },
  ],
};

// ============================================================================
// 4. 건록 / 양인 / 월겁 분류 엔진 (자평진전 정통 십대격 체계)
// ============================================================================
export interface GeokgukClassificationResult {
  ruleId: string;
  name: string;
  basis: string;
  condition: string;
  description: string;
  isSpecialPattern: boolean; // 건록, 양인, 월겁 여부
}

/**
 * 양인격 전용 성립 지지 매핑 (양간의 제왕지)
 * - 갑목: 묘(卯)
 * - 병화/무토: 오(午)
 * - 경금: 유(酉)
 * - 임수: 자(子)
 */
export const YANG_STEM_YANGIN_BRANCHES: Record<HeavenlyStem, EarthlyBranch | null> = {
  갑: '묘',
  병: '오',
  무: '오',
  경: '유',
  임: '자',
  을: null,
  정: null,
  기: null,
  신: null,
  계: null,
};

/**
 * 정통 월령 기준 십대격 취격기
 */
export function classifyGeokguk(
  dayStem: HeavenlyStem,
  monthBranch: EarthlyBranch,
  openStems: HeavenlyStem[] = []
): GeokgukClassificationResult {
  const dayInfo = STEM_INFO[dayStem];
  const monthMainStem = PURE_HIDDEN_STEMS[monthBranch].main;
  const monthMainInfo = STEM_INFO[monthMainStem];

  const myElem = dayInfo.element;
  const mElem = monthMainInfo.element;
  const isSameYinYang = dayInfo.yinYang === monthMainInfo.yinYang;

  let geokgukName = '정관격';
  let isSpecial = false;

  // 1. 비견 / 겁재 (동일 오행)
  if (myElem === mElem) {
    isSpecial = true;
    if (isSameYinYang) {
      // 동일 음양 비견 = 건록격
      geokgukName = '건록격';
    } else {
      // 상이 음양 겁재
      // 규칙: 오직 양간(甲丙戊庚壬)이 제왕지를 만난 경우에만 '양인격' 취격
      const expectedYanginBranch = YANG_STEM_YANGIN_BRANCHES[dayStem];
      if (dayInfo.yinYang === '양' && expectedYanginBranch === monthBranch) {
        geokgukName = '양인격';
      } else {
        // 음간(乙丁己辛癸)의 겁재 또는 제왕지 외 겁재 = 월겁격(겁재격)
        geokgukName = '월겁격';
      }
    }
  } else if (
    (myElem === '목' && mElem === '화') ||
    (myElem === '화' && mElem === '토') ||
    (myElem === '토' && mElem === '금') ||
    (myElem === '금' && mElem === '수') ||
    (myElem === '수' && mElem === '목')
  ) {
    geokgukName = isSameYinYang ? '식신격' : '상관격';
  } else if (
    (myElem === '목' && mElem === '토') ||
    (myElem === '화' && mElem === '금') ||
    (myElem === '토' && mElem === '수') ||
    (myElem === '금' && mElem === '목') ||
    (myElem === '수' && mElem === '화')
  ) {
    geokgukName = isSameYinYang ? '편재격' : '정재격';
  } else if (
    (mElem === '목' && myElem === '토') ||
    (mElem === '화' && myElem === '금') ||
    (mElem === '토' && myElem === '수') ||
    (mElem === '금' && myElem === '목') ||
    (mElem === '수' && myElem === '화')
  ) {
    geokgukName = isSameYinYang ? '편관격' : '정관격';
  } else {
    geokgukName = isSameYinYang ? '편인격' : '정인격';
  }

  const isEmerged = openStems.includes(monthMainStem);
  const jiType = ['자', '오', '묘', '유'].includes(monthBranch)
    ? '사왕지(子午卯酉) 고유의 순수한 기운'
    : ['인', '신', '사', '해'].includes(monthBranch)
    ? '사생지(寅申巳亥)의 역동적 본기 기운'
    : '사고지(辰戌丑未)의 포용적 본기 기운';

  const condition = `월지 ${monthBranch}의 지장간 본기(${monthMainStem})가 일간(${dayStem})과 형성하는 오행·음양 관계에 기반하며, ${jiType}에 의거하여 정격으로 취격되었습니다.${isEmerged ? ` (천간 투출로 기운 강화)` : ''}`;
  const description = `월지 ${monthBranch}의 기운을 바탕으로 ${geokgukName}이 정립되어, 삶의 사회적 목표와 활동 반경을 명확하게 설정하는 틀을 형성합니다.`;

  return {
    ruleId: MYEONGLI_RULE_VERSIONS.GEOKGUK,
    name: geokgukName,
    basis: `월지 ${monthBranch} 본기 ${monthMainStem}(${monthMainInfo.element}/${monthMainInfo.yinYang})`,
    condition,
    description,
    isSpecialPattern: isSpecial,
  };
}

// ============================================================================
// 5. 강약 (Strength) 정량화 모델 (득령 40% + 득지 30% + 득세 30%)
// 마보살 자체 정량화 모델: 0~100 연속 점수 체계
// ============================================================================
export interface MasterStrengthCalculationResult {
  ruleId: string;
  score: number; // 0 ~ 100
  status: '극강' | '신강' | '중화신강' | '중화' | '중화신약' | '신약' | '극약';
  deungryeong: boolean;
  deungji: boolean;
  deungse: boolean;
  deungryeongScore: number;
  deungJiScore: number;
  deungSeScore: number;
  calculationBasis: string;
  description: string;
}

export function calculateCanonicalStrength(
  dayStem: HeavenlyStem,
  monthBranch: EarthlyBranch,
  dayBranch: EarthlyBranch,
  otherStems: HeavenlyStem[], // 년간, 월간, 시간
  otherBranches: EarthlyBranch[] // 년지, 시지
): MasterStrengthCalculationResult {
  const dayInfo = STEM_INFO[dayStem];
  const myElem = dayInfo.element;

  const isHelper = (e: FiveElement) => {
    if (e === myElem) return true; // 비겁
    // 인성
    if (myElem === '목' && e === '수') return true;
    if (myElem === '화' && e === '목') return true;
    if (myElem === '토' && e === '화') return true;
    if (myElem === '금' && e === '토') return true;
    if (myElem === '수' && e === '금') return true;
    return false;
  };

  // 1. 득령 (40%): 월지 오행
  const monthBranchElem = BRANCH_INFO[monthBranch].element;
  let deungryeongScore = 15.0;
  if (monthBranchElem === myElem) deungryeongScore = 100.0;
  else if (isHelper(monthBranchElem)) deungryeongScore = 85.0;
  const deungryeong = deungryeongScore >= 70.0;

  // 2. 득지 (30%): 일지 오행
  const dayBranchElem = BRANCH_INFO[dayBranch].element;
  let deungJiScore = 10.0;
  if (dayBranchElem === myElem) deungJiScore = 100.0;
  else if (isHelper(dayBranchElem)) deungJiScore = 80.0;
  const deungji = deungJiScore >= 70.0;

  // 3. 득세 (30%): 년간(1.0), 월간(1.2), 년지(0.8), 시간(1.0), 시지(0.8) 총 4.8
  const weightsStems = [1.0, 1.2, 1.0]; // 년간, 월간, 시간
  const weightsBranches = [0.8, 0.8];   // 년지, 시지
  let helperPower = 0.0;
  let totalPower = 4.8;

  otherStems.forEach((s, idx) => {
    if (s && STEM_INFO[s] && isHelper(STEM_INFO[s].element)) {
      helperPower += weightsStems[idx] || 1.0;
    }
  });
  otherBranches.forEach((b, idx) => {
    if (b && BRANCH_INFO[b] && isHelper(BRANCH_INFO[b].element)) {
      helperPower += weightsBranches[idx] || 0.8;
    }
  });

  const deungSeScore = Math.round((helperPower / totalPower) * 10000) / 100;
  const deungse = deungSeScore >= 50.0;

  // 최종 점수: 득령 40% + 득지 30% + 득세 30%
  const score = Math.round(((deungryeongScore * 0.40) + (deungJiScore * 0.30) + (deungSeScore * 0.30)) * 100) / 100;

  let status: MasterStrengthCalculationResult['status'] = '중화';
  if (score >= 85.0) status = '극강';
  else if (score >= 65.0) status = '신강';
  else if (score >= 53.0) status = '중화신강';
  else if (score >= 47.0) status = '중화';
  else if (score >= 35.0) status = '중화신약';
  else if (score >= 15.0) status = '신약';
  else status = '극약';

  const calculationBasis = `월령 가중치 40%(${deungryeongScore}점 -> ${(deungryeongScore * 0.4).toFixed(1)}점) + 득지 30%(${deungJiScore}점 -> ${(deungJiScore * 0.3).toFixed(1)}점) + 득세 30%(${deungSeScore}점 -> ${(deungSeScore * 0.3).toFixed(1)}점) = 최종 점수 ${score}점 (신약 판정 기준: 15~35점 구간)`;
  const desc = status.includes('강')
    ? '일간의 뿌리와 기운이 견고하여 외부 환경의 압박을 주도적으로 돌파하는 자생력을 지닙니다.'
    : status === '중화'
    ? '기운의 치우침 없이 음양오행의 흐름이 고르게 조화를 이루는 안정적 중화의 명식입니다.'
    : '일간의 기운이 유연하고 섬세하여 주변의 조력(인성·비겁)과 지혜로운 완충을 통해 큰 성취를 이룹니다.';

  return {
    ruleId: MYEONGLI_RULE_VERSIONS.STRENGTH,
    score,
    status,
    deungryeong,
    deungji,
    deungse,
    deungryeongScore,
    deungJiScore,
    deungSeScore,
    calculationBasis,
    description: desc,
  };
}

// ============================================================================
// 6. 억부 / 조후 용신 분리 규격
// ============================================================================
export interface EokbuYongshinResult {
  ruleId: string;
  primary: FiveElement;
  secondary: FiveElement;
  tertiary?: FiveElement;
  reason: string;
}

export interface JohuYongshinResult {
  ruleId: string;
  season: string;
  primary: FiveElement | '중화';
  secondary?: FiveElement;
  tertiary?: FiveElement;
  reason: string;
  luckNote: string;
}

export interface DualYongshinResult {
  eokbu: EokbuYongshinResult;
  johu: JohuYongshinResult;
}

// ============================================================================
// 7. 대운 (Daewun) 규격 (대운수와 대운 번호 분리)
// ============================================================================
export interface CanonicalDaewunPillar {
  order: number;       // 제N대운 번호 (1, 2, 3...)
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  ganji: string;
  startAge: number;    // 만 시작 나이 (대운수 기준)
  endAge: number;      // 만 종료 나이
}

export interface CanonicalDaewunResult {
  ruleId: string;
  direction: '순행' | '역행';
  daewoonNumber: number; // 대운수 (만 1~10세 주기)
  targetTermName: string;
  targetTermDateTimeKST: string;
  elapsedDays: number;
  pillars: CanonicalDaewunPillar[];
  currentDaewoonOrder: number; // 현재 대운 번호
  currentDaewoon: CanonicalDaewunPillar;
}
