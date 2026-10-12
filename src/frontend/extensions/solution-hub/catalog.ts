import type { Partner, SolutionItem, VerticalConfig } from './types.js';

/**
 * 버티컬 / 파트너 / 솔루션 카탈로그 (데이터)
 * 새 버티컬이나 솔루션은 이 파일의 기본 데이터 또는 관리자 화면을 통해 확장됩니다.
 *
 * 주의: 실제 제휴 계약 전이므로 솔루션은 isSample=true, url 은 비어 있거나 데모용입니다.
 * 실제 파트너가 확정되면 url 을 채우고 isSample 을 제거합니다.
 */

export const VERTICALS: VerticalConfig[] = [
  { id: 'finance', label: '경제 · 재테크', moduleId: 'solution_finance', icon: 'savings', maxCards: 2 },
  { id: 'career', label: '커리어 · 창업', moduleId: 'solution_career', icon: 'work', maxCards: 2 },
  { id: 'home', label: '부동산 · 공간', moduleId: 'solution_home', icon: 'home', maxCards: 2 },
  { id: 'mind', label: '정서 · 마음 돌봄', moduleId: 'solution_mind', icon: 'spa', maxCards: 2 },
  { id: 'body', label: '건강 · 체질', moduleId: 'solution_body', icon: 'self_improvement', maxCards: 1 },
  { id: 'legal', label: '법률 · 분쟁', moduleId: 'solution_legal', icon: 'gavel', maxCards: 1 },
];

export const INITIAL_PARTNERS: Partner[] = [
  { id: 'sample-finance', name: '머니 인사이트 랩', verticalId: 'finance', settlement: 'CPS', active: true },
  { id: 'sample-career', name: '커리어 피봇 연구소', verticalId: 'career', settlement: 'CPS', active: true },
  { id: 'sample-home', name: '스페이스 큐레이터', verticalId: 'home', settlement: 'CPS', active: true },
  { id: 'sample-mind', name: '마음의 숲 심리센터', verticalId: 'mind', settlement: 'FLAT', active: true },
];

export const INITIAL_SOLUTIONS: SolutionItem[] = [
  // 1. 경제 / 재테크
  {
    id: 'sample-finance-spending-check',
    partnerId: 'sample-finance',
    title: '지출 점검 체크리스트',
    oneLine: '고정지출과 새는 돈을 30분 안에 점검하는 엑셀 템플릿',
    url: '',
    matchTags: [{ tag: 'money.loss', minLevel: 1 }],
    reasonTemplate: '{ma} 신호의 압박이 감지되어 지출과 현금 흐름을 먼저 점검하도록 추천합니다.',
    priority: 10,
    isSample: true,
    cooldownDays: 7,
  },
  {
    id: 'sample-finance-keep-gain',
    partnerId: 'sample-finance',
    title: '들어온 돈을 지키는 기초 자산 가이드',
    oneLine: '수입이 늘어나는 시기에 먼저 해두면 좋은 세무/통장 쪼개기',
    url: '',
    matchTags: [{ tag: 'money.gain', minLevel: 1 }],
    reasonTemplate: '{ma} 신호의 기회가 나타나 들어온 재물 흐름을 안전하게 축적하도록 안내합니다.',
    priority: 8,
    isSample: true,
    cooldownDays: 7,
  },

  // 2. 커리어 / 이직 / 창업
  {
    id: 'sample-career-pivot',
    partnerId: 'sample-career',
    title: '이직 타이밍 & 직무 역량 진단 리포트',
    oneLine: '성급한 이직을 막고 내 가치를 극대화하는 커리어 전환 가이드',
    url: '',
    matchTags: [
      { tag: 'career.change', minLevel: 1 },
      { tag: 'career.transition', minLevel: 1 },
    ],
    reasonTemplate: '{ma} 신호의 이동/변동성이 나타나 섣부른 퇴사 대신 전략적 이직을 제안합니다.',
    priority: 10,
    isSample: true,
    cooldownDays: 7,
  },
  {
    id: 'sample-career-side',
    partnerId: 'sample-career',
    title: '퇴근 후 무자본 1인 부업/창업 로드맵',
    oneLine: '본업을 지키며 리스크 없이 시작하는 스마트 스토어·지식창업 코칭',
    url: '',
    matchTags: [
      { tag: 'career.promotion', minLevel: 1 },
      { tag: 'money.gain', minLevel: 1 },
    ],
    reasonTemplate: '{ma} 신호의 추진력이 감지되어 다각화된 수익 파이프라인 개설을 안내합니다.',
    priority: 7,
    isSample: true,
    cooldownDays: 7,
  },

  // 3. 부동산 / 주거 / 공간
  {
    id: 'sample-home-checklist',
    partnerId: 'sample-home',
    title: '전월세 & 부동산 계약 안심 체크리스트',
    oneLine: '등기부등본 확인법과 깡통전세/사기 예방 특약 문구 총정리',
    url: '',
    matchTags: [
      { tag: 'home.move', minLevel: 1 },
      { tag: 'home.asset', minLevel: 1 },
      { tag: 'home.contract', minLevel: 1 },
    ],
    reasonTemplate: '{ma} 신호의 주거 변동이 감지되어 문서 계약 시 손실을 예방하도록 추천합니다.',
    priority: 10,
    isSample: true,
    cooldownDays: 7,
  },
  {
    id: 'sample-home-space',
    partnerId: 'sample-home',
    title: '운을 부르는 공간 정리 & 풍수 인테리어',
    oneLine: '답답한 기운을 환기하고 집중력을 높이는 방 배치 솔루션',
    url: '',
    matchTags: [{ tag: 'home.move', minLevel: 1 }],
    reasonTemplate: '{ma} 신호의 영향으로 생활 환경의 기운을 재정비하는 방법을 안내합니다.',
    priority: 6,
    isSample: true,
    cooldownDays: 7,
  },

  // 4. 정서 / 마음 돌봄
  {
    id: 'sample-mind-reset',
    partnerId: 'sample-mind',
    title: '마음 환기 10분 오디오 프로그램',
    oneLine: '호흡과 이완으로 칠살/갈등으로 인한 긴장과 불안을 가라앉히는 음원',
    url: '',
    matchTags: [{ tag: 'mind.stress', minLevel: 1 }],
    reasonTemplate: '{ma} 신호의 심리적 부담이 감지되어 마음을 차분히 돌보는 가이드를 연결합니다.',
    priority: 10,
    isSample: true,
    cooldownDays: 3,
  },
];

const CUSTOM_SOLUTIONS_KEY = 'mabosal_custom_solutions';
const CUSTOM_PARTNERS_KEY = 'mabosal_custom_partners';

/** 등록된 모든 솔루션(기본 + 관리자 등록) 조회 */
export function getAllSolutions(): SolutionItem[] {
  if (typeof localStorage === 'undefined') return [...INITIAL_SOLUTIONS];
  try {
    const raw = localStorage.getItem(CUSTOM_SOLUTIONS_KEY);
    const custom: SolutionItem[] = raw ? JSON.parse(raw) : [];
    return [...INITIAL_SOLUTIONS, ...custom];
  } catch {
    return [...INITIAL_SOLUTIONS];
  }
}

/** 신규 솔루션 동적 추가 */
export function addCustomSolution(sol: SolutionItem): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(CUSTOM_SOLUTIONS_KEY);
    const list: SolutionItem[] = raw ? JSON.parse(raw) : [];
    list.unshift(sol);
    localStorage.setItem(CUSTOM_SOLUTIONS_KEY, JSON.stringify(list));
  } catch {}
}

/** 등록된 모든 파트너 조회 */
export function getAllPartners(): Partner[] {
  if (typeof localStorage === 'undefined') return [...INITIAL_PARTNERS];
  try {
    const raw = localStorage.getItem(CUSTOM_PARTNERS_KEY);
    const custom: Partner[] = raw ? JSON.parse(raw) : [];
    return [...INITIAL_PARTNERS, ...custom];
  } catch {
    return [...INITIAL_PARTNERS];
  }
}

/** 신규 파트너 동적 추가 */
export function addCustomPartner(partner: Partner): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(CUSTOM_PARTNERS_KEY);
    const list: Partner[] = raw ? JSON.parse(raw) : [];
    list.push(partner);
    localStorage.setItem(CUSTOM_PARTNERS_KEY, JSON.stringify(list));
  } catch {}
}

// 하위 호환성 유지용 상수 export
export const PARTNERS = INITIAL_PARTNERS;
export const SOLUTIONS = INITIAL_SOLUTIONS;
