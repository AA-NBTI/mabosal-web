/**
 * src/modules/prescription/lucky-codex.ts
 * 
 * Phase 70: 행운 처방 코드 모듈 (Lucky Codex Prescription Engine)
 * 
 * 명리학적 정통 원리:
 * 1. 행운의 색 (五色): 오행(木·火·土·金·水) 고유 파장과 조후 보완 색채
 * 2. 행운의 방위 (方位): 십이지지 24방위학 (東 寅·卯, 南 巳·午, 西 申·酉, 北 亥·子, 간방 辰·戌·丑·未)
 * 3. 행운의 수 (하도·낙서 數):
 *    - 木: 3, 8 (天三生木 地八成之)
 *    - 火: 2, 7 (地二生火 天七成之)
 *    - 土: 5, 10 (天五生土 地十成之)
 *    - 金: 4, 9 (地四生金 天九成之)
 *    - 水: 1, 6 (天一生水 地六成之)
 * 4. 지혜의 한 줄: 의뢰인의 십신/오행 균형에 최적화된 당일 실천 행동 지침
 */

import { FiveElement } from '../../core/types.js';

export interface LuckyColorInfo {
  name: string;
  palette: string[];
  hex: string;
  stylingTip: string;
}

export interface LuckyDirectionInfo {
  name: string;
  branch: string;
  angleDescription: string;
  actionTip: string;
}

export interface LuckyCodexResult {
  targetElement: FiveElement;
  elementHanja: string;
  elementTitle: string;
  luckyColor: LuckyColorInfo;
  luckyDirection: LuckyDirectionInfo;
  luckyNumbers: string;
  primaryNumber: number;
  secondaryNumber: number;
  wiseQuote: string;
}

export interface LuckyCodexOptions {
  seedIndex?: number;
  customContext?: string;
}

const ELEMENT_CODEX_DATA: Record<FiveElement, {
  hanja: string;
  title: string;
  color: LuckyColorInfo;
  direction: LuckyDirectionInfo;
  numbers: string;
  primaryNum: number;
  secondaryNum: number;
  quotes: string[];
}> = {
  목: {
    hanja: '木',
    title: '생명과 성장의 청룡 기운',
    color: {
      name: '포레스트 그린',
      palette: ['에메랄드 그린', '민트', '올리브'],
      hex: '#34d399',
      stylingTip: '초록빛 소품이나 식물, 목재 소재 액세서리로 생기를 더하십시오.',
    },
    direction: {
      name: '동방 (東)',
      branch: '寅 · 卯',
      angleDescription: '정동쪽 및 동북방',
      actionTip: '아침 동쪽 창가를 환기하고 동쪽을 바라보며 중요한 기획을 구상하세요.',
    },
    numbers: '3 과 8',
    primaryNum: 3,
    secondaryNum: 8,
    quotes: [
      '새로운 씨앗을 뿌리듯, 망설이던 배움과 시작에 과감히 첫발을 내디딜 때입니다.',
      '가지가 유연해야 부러지지 않듯, 원칙을 지키되 상대의 의견을 품는 유연성을 발휘하세요.',
      '아침 동쪽의 맑은 공기를 마시며 하루를 계획하면 막힌 기운이 시원하게 트입니다.',
    ],
  },
  화: {
    hanja: '火',
    title: '열정과 명료함의 주작 기운',
    color: {
      name: '크림슨 레드',
      palette: ['선명한 코랄', '버건디', '웜 오렌지'],
      hex: '#f87171',
      stylingTip: '레드 포인트 넥타이, 스카프, 웜톤 조명으로 에너지를 끌어올리세요.',
    },
    direction: {
      name: '남방 (南)',
      branch: '巳 · 午',
      angleDescription: '정남쪽',
      actionTip: '자연 채광이 풍부한 남향 공간에서 대외 미팅과 발표를 진행하십시오.',
    },
    numbers: '2 와 7',
    primaryNum: 2,
    secondaryNum: 7,
    quotes: [
      '가슴속에 품었던 열정과 아이디어를 적극적으로 세상에 공표하기에 최적의 날입니다.',
      '환한 조명 아래서 대화하고 감정을 솔직하게 표현할 때 귀인의 눈에 띕니다.',
      '불꽃이 지나치면 타버리니, 행동은 빠르게 하되 감정의 완급 조절을 잊지 마세요.',
    ],
  },
  토: {
    hanja: '土',
    title: '포용과 신용의 황룡 기운',
    color: {
      name: '샴페인 골드',
      palette: ['샌드 옐로우', '웜 베이지', '앰버'],
      hex: '#f2ca50',
      stylingTip: '골드 액세서리나 베이지·카멜 톤의 안정적인 패션 스타일링을 권장합니다.',
    },
    direction: {
      name: '동남방 (辰) 및 중앙',
      branch: '辰 · 戌 · 丑 · 未',
      angleDescription: '동남방 및 내면의 중심',
      actionTip: '책상과 침대를 문과 마주 보지 않는 안정적인 벽면 중심에 배치하십시오.',
    },
    numbers: '5 와 10',
    primaryNum: 5,
    secondaryNum: 10,
    quotes: [
      '주저하던 계약이나 마음속으로 망설이던 중요한 제안을 건네기에 최적의 타이밍입니다.',
      '흔들리지 않는 대지처럼 내실을 다지고 신뢰를 지킬 때 커다란 재물운이 모여듭니다.',
      '급격한 변화보다 이미 손에 쥔 것을 철저히 검토하고 지키는 것이 이익을 극대화합니다.',
    ],
  },
  금: {
    hanja: '金',
    title: '결단과 의리의 백호 기운',
    color: {
      name: '메탈릭 실버',
      palette: ['퓨어 화이트', '라이트 그레이', '플래티넘'],
      hex: '#bec6dd',
      stylingTip: '메탈 시계나 실버 주얼리, 깔끔한 화이트 셔츠로 선명한 인상을 주십시오.',
    },
    direction: {
      name: '서방 (西)',
      branch: '申 · 酉',
      angleDescription: '정서쪽 및 서북방',
      actionTip: '서쪽 수납함을 미니멀하게 정리하고 군더더기 없는 동선을 확보하세요.',
    },
    numbers: '4 와 9',
    primaryNum: 4,
    secondaryNum: 9,
    quotes: [
      '미뤄두었던 불필요한 인간관계나 잡무를 과감하게 정리정돈할 수 있는 결단의 날입니다.',
      '군더더기 없는 명확한 기준과 기록이 뜻밖의 손실을 철저하게 방어해 줍니다.',
      '차가운 이성으로 상황을 객관화하면 복잡하게 얽혔던 문제의 해답이 명쾌하게 보입니다.',
    ],
  },
  수: {
    hanja: '水',
    title: '지혜와 유연함의 현무 기운',
    color: {
      name: '미드나잇 딥네이비',
      palette: ['오션 블루', '사파이어', '차콜 블랙'],
      hex: '#38bdf8',
      stylingTip: '네이비 계열의 차분한 의상이나 블루 톤 포인트로 이성을 북돋우십시오.',
    },
    direction: {
      name: '북방 (北)',
      branch: '亥 · 子',
      angleDescription: '정북쪽',
      actionTip: '침대 머리를 북쪽에 두거나 물가 산책로를 걸으며 심리적 안정을 찾으세요.',
    },
    numbers: '1 과 6',
    primaryNum: 1,
    secondaryNum: 6,
    quotes: [
      '고요한 호수처럼 마음을 가라앉히고 한 수 앞을 내다보는 지혜를 발휘할 시간입니다.',
      '물처럼 유연하게 장애물을 우회하며, 조급한 언쟁을 피하고 차분히 경청하십시오.',
      '미온수를 자주 마시고 조용한 사색의 시간을 가질 때 흐트러진 직관이 예리해집니다.',
    ],
  },
};

/**
 * 목표 오행(용신/희신 또는 결핍 오행)에 따른 맞춤형 LUCKY CODEX 산출
 */
export function calculateLuckyCodex(
  targetElement?: FiveElement | string,
  options?: LuckyCodexOptions
): LuckyCodexResult {
  // 기본값은 사주 조율의 중심인 '토'
  let elem: FiveElement = '토';
  if (targetElement && (targetElement in ELEMENT_CODEX_DATA)) {
    elem = targetElement as FiveElement;
  } else if (typeof targetElement === 'string') {
    const candidates: { elem: FiveElement; idx: number }[] = [];
    const elements: FiveElement[] = ['목', '화', '토', '금', '수'];
    for (const e of elements) {
      const idx = targetElement.indexOf(e);
      if (idx !== -1) {
        candidates.push({ elem: e, idx });
      }
    }
    if (candidates.length > 0) {
      candidates.sort((a, b) => a.idx - b.idx);
      elem = candidates[0].elem;
    }
  }

  const data = ELEMENT_CODEX_DATA[elem];
  const quotes = data.quotes;
  const quoteIdx = options?.seedIndex !== undefined
    ? Math.abs(options.seedIndex) % quotes.length
    : 0;

  return {
    targetElement: elem,
    elementHanja: data.hanja,
    elementTitle: data.title,
    luckyColor: data.color,
    luckyDirection: data.direction,
    luckyNumbers: data.numbers,
    primaryNumber: data.primaryNum,
    secondaryNumber: data.secondaryNum,
    wiseQuote: quotes[quoteIdx],
  };
}

/**
 * 의뢰인의 용신 및 일진을 고려한 당일 실시간 행운 코드 생성
 */
export function getDailyLuckyCodex(
  userYongshin?: FiveElement | string,
  dayBranch?: string
): LuckyCodexResult {
  let targetElem: FiveElement = '토';

  if (userYongshin) {
    targetElem = calculateLuckyCodex(userYongshin).targetElement;
  } else if (dayBranch) {
    // 당일 지지에 따른 길신 기운 보정
    if (['인', '묘'].includes(dayBranch)) targetElem = '수'; // 목을 생하는 수
    else if (['사', '오'].includes(dayBranch)) targetElem = '토'; // 화기를 설기하는 토
    else if (['신', '유'].includes(dayBranch)) targetElem = '토'; // 금을 생하는 토
    else if (['해', '자'].includes(dayBranch)) targetElem = '금'; // 수를 생하는 금
    else targetElem = '화'; // 진술축미 토를 생하는 화
  }

  const daySeed = new Date().getDate();
  return calculateLuckyCodex(targetElem, { seedIndex: daySeed });
}
