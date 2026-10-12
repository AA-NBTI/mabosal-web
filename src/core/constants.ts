import { EarthlyBranch, FiveElement, HeavenlyStem, TenGod, YinYang } from './types.js';

export const HEAVENLY_STEMS: HeavenlyStem[] = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
export const EARTHLY_BRANCHES: EarthlyBranch[] = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

// 60갑자 생성
export const SIXTY_GANJI: string[] = [];
for (let i = 0; i < 60; i++) {
  const stem = HEAVENLY_STEMS[i % 10];
  const branch = EARTHLY_BRANCHES[i % 12];
  SIXTY_GANJI.push(`${stem}${branch}`);
}

// 천간 오행 및 음양
export const STEM_INFO: Record<HeavenlyStem, { element: FiveElement; yinYang: YinYang }> = {
  갑: { element: '목', yinYang: '양' },
  을: { element: '목', yinYang: '음' },
  병: { element: '화', yinYang: '양' },
  정: { element: '화', yinYang: '음' },
  무: { element: '토', yinYang: '양' },
  기: { element: '토', yinYang: '음' },
  경: { element: '금', yinYang: '양' },
  신: { element: '금', yinYang: '음' },
  임: { element: '수', yinYang: '양' },
  계: { element: '수', yinYang: '음' },
};

// 지지 오행 및 음양
export const BRANCH_INFO: Record<EarthlyBranch, { element: FiveElement; yinYang: YinYang }> = {
  자: { element: '수', yinYang: '양' },
  축: { element: '토', yinYang: '음' },
  인: { element: '목', yinYang: '양' },
  묘: { element: '목', yinYang: '음' },
  진: { element: '토', yinYang: '양' },
  사: { element: '화', yinYang: '음' },
  오: { element: '화', yinYang: '양' },
  미: { element: '토', yinYang: '음' },
  신: { element: '금', yinYang: '양' },
  유: { element: '금', yinYang: '음' },
  술: { element: '토', yinYang: '양' },
  해: { element: '수', yinYang: '음' },
};

// 지장간 (여기, 중기, 정기)
export const HIDDEN_STEMS: Record<EarthlyBranch, { initial: HeavenlyStem; middle?: HeavenlyStem; main: HeavenlyStem }> = {
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

// 24절기 목록 (태양 황경 0도 춘분부터 순환, 명리학 1년의 시작은 입춘 = 인월)
export const SOLAR_TERMS = [
  '입춘', '우수', '경칩', '춘분', '청명', '곡우',
  '입하', '소만', '망종', '하지', '소서', '대서',
  '입추', '처서', '백로', '추분', '한로', '상강',
  '입동', '소설', '대설', '동지', '소한', '대한',
] as const;

export type SolarTermName = typeof SOLAR_TERMS[number];

// 명리학 월지(12월) 기준 12절(節) 매핑
// 인월: 입춘, 묘월: 경칩, 진월: 청명, 사월: 입하, 오월: 망종, 미월: 소서,
// 신월: 입추, 유월: 백로, 술월: 한로, 해월: 입동, 자월: 대설, 축월: 소한
export const MONTH_BRANCH_BY_SOLAR_TERM: Record<string, EarthlyBranch> = {
  입춘: '인',
  우수: '인',
  경칩: '묘',
  춘분: '묘',
  청명: '진',
  곡우: '진',
  입하: '사',
  소만: '사',
  망종: '오',
  하지: '오',
  소서: '미',
  대서: '미',
  입추: '신',
  처서: '신',
  백로: '유',
  추분: '유',
  한로: '술',
  상강: '술',
  입동: '해',
  소설: '해',
  대설: '자',
  동지: '자',
  소한: '축',
  대한: '축',
};

// 절(節) 기준 월지 결정용 (12절)
export const MAJOR_SOLAR_TERMS: { term: SolarTermName; branch: EarthlyBranch; monthOrder: number }[] = [
  { term: '입춘', branch: '인', monthOrder: 1 },
  { term: '경칩', branch: '묘', monthOrder: 2 },
  { term: '청명', branch: '진', monthOrder: 3 },
  { term: '입하', branch: '사', monthOrder: 4 },
  { term: '망종', branch: '오', monthOrder: 5 },
  { term: '소서', branch: '미', monthOrder: 6 },
  { term: '입추', branch: '신', monthOrder: 7 },
  { term: '백로', branch: '유', monthOrder: 8 },
  { term: '한로', branch: '술', monthOrder: 9 },
  { term: '입동', branch: '해', monthOrder: 10 },
  { term: '대설', branch: '자', monthOrder: 11 },
  { term: '소한', branch: '축', monthOrder: 12 },
];

/**
 * 오호둔월법 (五虎遁月法) - 연간에 따른 인월(1월) 천간 결정
 * 갑기년 -> 병인월 시작
 * 을경년 -> 무인월 시작
 * 병신년 -> 경인월 시작
 * 정임년 -> 임인월 시작
 * 무계년 -> 갑인월 시작
 */
export const YEAR_STEM_TO_START_MONTH_STEM: Record<HeavenlyStem, HeavenlyStem> = {
  갑: '병',
  기: '병',
  을: '무',
  경: '무',
  병: '경',
  신: '경',
  정: '임',
  임: '임',
  무: '갑',
  계: '갑',
};

/**
 * 오서둔시법 (五鼠遁時法) - 일간에 따른 자시(00시) 천간 결정
 * 갑기일 -> 갑자시 시작
 * 을경일 -> 병자시 시작
 * 병신일 -> 무자시 시작
 * 정임일 -> 경자시 시작
 * 무계일 -> 임자시 시작
 */
export const DAY_STEM_TO_START_HOUR_STEM: Record<HeavenlyStem, HeavenlyStem> = {
  갑: '갑',
  기: '갑',
  을: '병',
  경: '병',
  병: '무',
  신: '무',
  정: '경',
  임: '경',
  무: '임',
  계: '임',
};

// 12지지 시진 표준 구간 (표준시 기준)
// 자: 23:00~01:00, 축: 01:00~03:00, ..., 해: 21:00~23:00
export const HOUR_BRANCH_RANGES: { branch: EarthlyBranch; startHour: number; endHour: number }[] = [
  { branch: '자', startHour: 23, endHour: 1 },
  { branch: '축', startHour: 1, endHour: 3 },
  { branch: '인', startHour: 3, endHour: 5 },
  { branch: '묘', startHour: 5, endHour: 7 },
  { branch: '진', startHour: 7, endHour: 9 },
  { branch: '사', startHour: 9, endHour: 11 },
  { branch: '오', startHour: 11, endHour: 13 },
  { branch: '미', startHour: 13, endHour: 15 },
  { branch: '신', startHour: 15, endHour: 17 },
  { branch: '유', startHour: 17, endHour: 19 },
  { branch: '술', startHour: 19, endHour: 21 },
  { branch: '해', startHour: 21, endHour: 23 },
];
