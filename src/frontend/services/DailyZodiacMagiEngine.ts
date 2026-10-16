/**
 * DailyZodiacMagiEngine (명리 팩트 근거 기반 일일 운세·마기·방비 엔진)
 * 
 * [개선 원칙]
 * 1. 100세 이하 (80세~99세) 출생연도 전수 지원.
 * 2. 행운지수(%)와 마기지수(%) 합산 100% 제로섬/상호보완 시스템 (행운% + 마기% = 100%).
 * 3. 방비책에 괄호나 사족 없는 오행/물상 기반 순수 단일 핵심 키워드 제공 (예: '말조심', '물조심', '차조심', '서쪽주의').
 * 4. 한글 우선 표기 및 한자 병기 [한글(漢字)], 명리 원리 고대비 화이트(#FFFFFF) 처리 지원.
 */

import { DailyFortuneEngine } from '../../modules/daily-fortune/daily-fortune-engine.js';

export interface ZodiacInfoMeta {
  key: string;
  hanja: string;
  animal: string;
  emoji: string;
  element: '목' | '화' | '토' | '금' | '수';
  years: number[];
}

export const ZODIAC_INFOS: ZodiacInfoMeta[] = [
  { key: '자', hanja: '子', animal: '쥐', emoji: '', element: '수', years: [1936, 1948, 1960, 1972, 1984, 1996, 2008, 2020] },
  { key: '축', hanja: '丑', animal: '소', emoji: '', element: '토', years: [1937, 1949, 1961, 1973, 1985, 1997, 2009, 2021] },
  { key: '인', hanja: '寅', animal: '호랑이', emoji: '', element: '목', years: [1926, 1938, 1950, 1962, 1974, 1986, 1998, 2010, 2022] },
  { key: '묘', hanja: '卯', animal: '토끼', emoji: '', element: '목', years: [1927, 1939, 1951, 1963, 1975, 1987, 1999, 2011, 2023] },
  { key: '진', hanja: '辰', animal: '용', emoji: '', element: '토', years: [1928, 1940, 1952, 1964, 1976, 1988, 2000, 2012, 2024] },
  { key: '사', hanja: '巳', animal: '뱀', emoji: '', element: '화', years: [1929, 1941, 1953, 1965, 1977, 1989, 2001, 2013, 2025] },
  { key: '오', hanja: '午', animal: '말', emoji: '', element: '화', years: [1930, 1942, 1954, 1966, 1978, 1990, 2002, 2014] },
  { key: '미', hanja: '未', animal: '양', emoji: '', element: '토', years: [1931, 1943, 1955, 1967, 1979, 1991, 2003, 2015] },
  { key: '신', hanja: '申', animal: '원숭이', emoji: '', element: '금', years: [1932, 1944, 1956, 1968, 1980, 1992, 2004, 2016] },
  { key: '유', hanja: '酉', animal: '닭', emoji: '', element: '금', years: [1933, 1945, 1957, 1969, 1981, 1993, 2005, 2017] },
  { key: '술', hanja: '戌', animal: '개', emoji: '', element: '토', years: [1934, 1946, 1958, 1970, 1982, 1994, 2006, 2018] },
  { key: '해', hanja: '亥', animal: '돼지', emoji: '', element: '수', years: [1935, 1947, 1959, 1971, 1983, 1995, 2007, 2019] },
];

export interface DailyReadingResult {
  info: {
    key: string;
    hanja: string;
    animal: string;
    emoji: string;
  };
  evidence: {
    birthYear: number;
    yearGanji: string;
    todayGanji: string;
    stemRelation: string;
    branchRelation: string;
    coreMechanic: string;
  };
  fortune: {
    luckyRate: number;            // 행운지수 (%)
    magiRate: number;             // 마기지수 (%) -> luckyRate + magiRate = 100%
    opportunityArea: string;
    theme: string;
    summary: string;
    actionTip: string;
    firstHour: string;
    firstHourAction: string;
    secondHour: string;
    secondHourAction: string;
  };
  magi: {
    magiRate: number;             // 마기지수 (%)
    name: string;
    trigger: string;
    risk: string;
    signs: string;
    mechanicEvidence: string;
  };
  defense: {
    defenseKeyword: string;       // 핵심 비방 단일 키워드 (예: '말조심', '물조심', '선제추진')
    prescriptionType: string;     // '행운 극대화 처방' | '마기 소멸 방비' | '평온 유지 처방'
    causalBasis: string;          // 마기/운세 결과를 직접 근거로 한 인과 설명
    coreTaboo: string;
    actionStrategy: string;
    shieldItem: string;
    fortuneColor: string;
    mechanicEvidence: string;
  };
}

const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const STEM_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
const BRANCH_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const STEM_ELEMENTS: Record<string, '목' | '화' | '토' | '금' | '수'> = {
  갑: '목', 을: '목', 병: '화', 정: '화', 무: '토', 기: '토', 경: '금', 신: '금', 임: '수', 계: '수'
};
const BRANCH_ELEMENTS: Record<string, '목' | '화' | '토' | '금' | '수'> = {
  자: '수', 축: '토', 인: '목', 묘: '목', 진: '토', 사: '화', 오: '화', 미: '토', 신: '금', 유: '금', 술: '토', 해: '수'
};

function getYearGanjiData(year: number) {
  const stemIdx = (year - 4) % 10 >= 0 ? (year - 4) % 10 : ((year - 4) % 10 + 10);
  const branchIdx = (year - 4) % 12 >= 0 ? (year - 4) % 12 : ((year - 4) % 12 + 12);
  return {
    stem: STEMS[stemIdx],
    stemHanja: STEM_HANJA[stemIdx],
    stemElement: STEM_ELEMENTS[STEMS[stemIdx]],
    branch: BRANCHES[branchIdx],
    branchHanja: BRANCH_HANJA[branchIdx],
    branchElement: BRANCH_ELEMENTS[BRANCHES[branchIdx]],
    ganjiName: `${STEMS[stemIdx]}${BRANCHES[branchIdx]}(${STEM_HANJA[stemIdx]}${BRANCH_HANJA[branchIdx]})`,
    stemFull: `${STEMS[stemIdx]}(${STEM_HANJA[stemIdx]})`,
    branchFull: `${BRANCHES[branchIdx]}(${BRANCH_HANJA[branchIdx]})`,
  };
}

export const dailyZodiacMagiEngine = {
  getYearsForZodiac(zodiacKey: string): number[] {
    const meta = ZODIAC_INFOS.find(z => z.key === zodiacKey || z.animal === zodiacKey)
      || ZODIAC_INFOS[0];
    return meta.years;
  },

  getReading(zodiacKey: string, birthYear?: number): DailyReadingResult {
    const meta = ZODIAC_INFOS.find(z => z.key === zodiacKey || z.animal === zodiacKey)
      || ZODIAC_INFOS[0];

    const targetYear = birthYear || meta.years[Math.floor(meta.years.length / 2)] || 1984;
    const yearInfo = getYearGanjiData(targetYear);

    const now = new Date();
    const pillar = DailyFortuneEngine.getDailyPillar(now);
    const todayStem = pillar.stem || '병';
    const todayBranch = pillar.branch || '신';
    const todayStemElement = STEM_ELEMENTS[todayStem] || '화';
    const todayBranchElement = BRANCH_ELEMENTS[todayBranch] || '금';

    // 1. 천간 생극제화 및 십신 판별 (한글 우선 표기)
    const yStemEl = yearInfo.stemElement;
    const tStemEl = todayStemElement;
    let stemRelation = '';
    let stemTheme = '';
    let stemOpportunity = '';

    if (yStemEl === tStemEl) {
      stemRelation = `천간 비겁(比刦) 동행: ${yearInfo.stemFull}[${yStemEl}]과 ${todayStem}[${tStemEl}]의 동질 기운`;
      stemTheme = '동료 및 협력자 연합';
      stemOpportunity = '주변 사람과의 신뢰를 다지고 팀워크를 통해 혼자 하기 힘든 일을 분담해 돌파하기에 가장 유리한 날입니다.';
    } else if (
      (yStemEl === '목' && tStemEl === '화') ||
      (yStemEl === '화' && tStemEl === '토') ||
      (yStemEl === '토' && tStemEl === '금') ||
      (yStemEl === '금' && tStemEl === '수') ||
      (yStemEl === '수' && tStemEl === '목')
    ) {
      stemRelation = `천간 식상(食傷) 설기: ${yearInfo.stemFull}[${yStemEl}]이 ${todayStem}[${tStemEl}]을 생함`;
      stemTheme = '기획 제안과 역량 표출';
      stemOpportunity = '머릿속에 머물던 기획이나 제안을 밖으로 꺼내어 공유할 때 타인의 주목과 지지를 얻을 수 있는 추진의 날입니다.';
    } else if (
      (tStemEl === '목' && yStemEl === '화') ||
      (tStemEl === '화' && yStemEl === '토') ||
      (tStemEl === '토' && yStemEl === '금') ||
      (tStemEl === '금' && yStemEl === '수') ||
      (tStemEl === '수' && yStemEl === '목')
    ) {
      stemRelation = `천간 인성(印星) 조력: ${todayStem}[${tStemEl}]이 ${yearInfo.stemFull}[${yStemEl}]을 후원함`;
      stemTheme = '문서 이득과 귀인 후원';
      stemOpportunity = '외부로부터 유익한 정보나 조력이 들어오며, 계약서나 서류상의 유리한 고지를 점할 수 있는 날입니다.';
    } else if (
      (yStemEl === '목' && tStemEl === '토') ||
      (yStemEl === '화' && tStemEl === '금') ||
      (yStemEl === '토' && tStemEl === '수') ||
      (yStemEl === '금' && tStemEl === '목') ||
      (yStemEl === '수' && tStemEl === '화')
    ) {
      stemRelation = `천간 재성(財星) 결실: ${yearInfo.stemFull}[${yStemEl}]이 ${todayStem}[${tStemEl}]을 현실 제어함`;
      stemTheme = '실질 이득과 재물 결실';
      stemOpportunity = '막연했던 문제에서 구체적인 계산과 실리를 챙길 수 있으며, 현실적인 협상이나 거래에서 우위를 잡는 날입니다.';
    } else {
      stemRelation = `천간 관성(官星) 절제: ${todayStem}[${tStemEl}]이 ${yearInfo.stemFull}[${yStemEl}]을 규율 제어함`;
      stemTheme = '원칙 준수와 공식 신뢰';
      stemOpportunity = '원칙과 순리를 지킬 때 오히려 당신의 평판과 신뢰도가 크게 상승하며, 공식적인 업무에서 인정을 받는 날입니다.';
    }

    // 2. 지지 합충형파 판별 및 [행운% + 마기% = 100%] 정밀 매핑
    const yBr = yearInfo.branch;
    const tBr = todayBranch;
    let branchRelation = '';
    let magiType = '';
    let magiTrigger = '';
    let magiRisk = '';
    let defensePlan = '';
    let coreTaboo = '';
    let defenseKeyword = ''; // 사족 없는 단일 키워드 (말조심, 물조심, 불조심, 차조심 등)

    const isSixHarm = (yBr === '자' && tBr === '축') || (yBr === '축' && tBr === '자') ||
                      (yBr === '인' && tBr === '해') || (yBr === '해' && tBr === '인') ||
                      (yBr === '묘' && tBr === '술') || (yBr === '술' && tBr === '묘') ||
                      (yBr === '진' && tBr === '유') || (yBr === '유' && tBr === '진') ||
                      (yBr === '사' && tBr === '신') || (yBr === '신' && tBr === '사') ||
                      (yBr === '오' && tBr === '미') || (yBr === '미' && tBr === '오');

    const isThreeHarm = (['신', '자', '진'].includes(yBr) && ['신', '자', '진'].includes(tBr)) ||
                        (['해', '묘', '미'].includes(yBr) && ['해', '묘', '미'].includes(tBr)) ||
                        (['인', '오', '술'].includes(yBr) && ['인', '오', '술'].includes(tBr)) ||
                        (['사', '유', '축'].includes(yBr) && ['사', '유', '축'].includes(tBr));

    const isClash = (yBr === '자' && tBr === '오') || (yBr === '오' && tBr === '자') ||
                    (yBr === '축' && tBr === '미') || (yBr === '미' && tBr === '축') ||
                    (yBr === '인' && tBr === '신') || (yBr === '신' && tBr === '인') ||
                    (yBr === '묘' && tBr === '유') || (yBr === '유' && tBr === '묘') ||
                    (yBr === '진' && tBr === '술') || (yBr === '술' && tBr === '진') ||
                    (yBr === '사' && tBr === '해') || (yBr === '해' && tBr === '사');

    let luckyRate = 80;
    let magiRate = 20; // 80 + 20 = 100%
    let firstHour = '09:00 ~ 11:00';
    let firstHourAct = '오전 기획 및 제안';
    let secondHour = '14:00 ~ 16:00';
    let secondHourAct = '오후 성과 협의 및 실행';

    if (isSixHarm) {
      // 대길한 육합: 행운 85% / 마기 15%
      luckyRate = 85;
      magiRate = 15;
      branchRelation = `지지 육합(六合) 결속: ${yearInfo.branchFull}과 ${todayBranch}의 화합 밀착`;
      magiType = '안일함과 확인누락의 마';
      defenseKeyword = '도장주의';
      magiTrigger = '관계가 너무 편안하다고 믿어 구두로만 합의하고 계약 조건이나 세부 일정을 서면으로 남기지 않을 때 발생';
      magiRisk = '사소한 약속 어긋남으로 인해 나중에 불필요한 번복과 재작업이 발생할 수 있습니다.';
      defensePlan = '아무리 친밀한 상대라도 핵심 일정과 금액은 메신저나 문자로 한 번 더 남겨 상호 확인하십시오.';
      coreTaboo = '구두 약속만 믿고 공식 기록을 남기지 않는 안일함';
      firstHour = '09:30 ~ 11:30'; firstHourAct = '중요 협의 및 미팅';
      secondHour = '15:00 ~ 17:00'; secondHourAct = '합의문 서면 정리';
    } else if (isThreeHarm) {
      // 강한 삼합: 행운 80% / 마기 20%
      luckyRate = 80;
      magiRate = 20;
      branchRelation = `지지 삼합(三合) 연합: ${yearInfo.branchFull}과 ${todayBranch}의 세력 형성`;
      magiType = '과속과 무리한 확장의 마';
      defenseKeyword = '돈조심';
      magiTrigger = '분위기에 편승하여 한 번에 너무 많은 일을 벌이거나 감당하기 힘든 약속이나 지출을 수락할 때 발생';
      magiRisk = '에너지가 분산되어 가장 중요한 본업의 완성도가 떨어지고 피로가 누적될 위험이 있습니다.';
      defensePlan = '오늘 해야 할 일의 우선순위 딱 2가지만 정하고 나머지는 정중히 다음 일정으로 넘기십시오.';
      coreTaboo = '거절하지 못하고 남의 부탁이나 지출까지 다 떠안는 태도';
      firstHour = '08:30 ~ 10:30'; firstHourAct = '핵심 목표 착수';
      secondHour = '13:30 ~ 15:30'; secondHourAct = '성과 도출 및 결재';
    } else if (isClash) {
      // 정면 충돌: 행운 30% / 마기 70%
      luckyRate = 30;
      magiRate = 70;
      branchRelation = `지지 정면 충(沖) 격돌: ${yearInfo.branchFull}과 ${todayBranch}의 상충 변화`;
      magiType = '감정 마찰과 충동 결정의 마';
      
      // 오행 물상에 따른 핀포인트 키워드
      if ((yBr === '자' && tBr === '오') || (yBr === '오' && tBr === '자')) {
        defenseKeyword = '물조심';
      } else if ((yBr === '사' && tBr === '해') || (yBr === '해' && tBr === '사')) {
        defenseKeyword = '불조심';
      } else if ((yBr === '인' && tBr === '신') || (yBr === '신' && tBr === '인')) {
        defenseKeyword = '차조심';
      } else if ((yBr === '묘' && tBr === '유') || (yBr === '유' && tBr === '묘')) {
        defenseKeyword = '칼조심';
      } else {
        defenseKeyword = '말조심';
      }

      magiTrigger = '상대방의 사소한 말투나 예기치 않은 일정 변경에 즉각적으로 반응하여 언성을 높일 때 발생';
      magiRisk = '오랫동안 쌓아온 신뢰가 한순간의 감정 폭발로 흔들리거나 손실을 초래하는 결정을 내릴 수 있습니다.';
      defensePlan = '말문이 막히거나 화가 치밀 때는 즉답을 피하고 물 한 잔을 마시며 30초간 심호흡하십시오.';
      coreTaboo = '감정이 격해진 상태에서 중요한 결정을 내리거나 반박 메시지를 보내는 것';
      firstHour = '11:00 ~ 12:30'; firstHourAct = '단독 업무 및 마음 정돈';
      secondHour = '16:00 ~ 17:30'; secondHourAct = '루틴 업무 차분히 마무리';
    } else if (yBr === tBr) {
      // 비견/자형: 행운 50% / 마기 50%
      luckyRate = 50;
      magiRate = 50;
      branchRelation = `지지 비견(比肩) 자형: ${yearInfo.branchFull}과 ${todayBranch}의 기운 중복`;
      magiType = '고집과 독단의 마';
      defenseKeyword = '말조심';
      magiTrigger = '자신의 방식만 옳다고 믿고 주변의 현실적인 피드백이나 경고를 무시할 때 발생';
      magiRisk = '동료나 파트너와의 협조가 차단되어 혼자 모든 책임을 짊어지게 될 수 있습니다.';
      defensePlan = '나와 다른 의견을 가진 동료에게 의견을 먼저 묻고 경청하십시오.';
      coreTaboo = '타인의 조언을 무시하고 혼자서 무리하게 밀어붙이는 행위';
      firstHour = '10:00 ~ 12:00'; firstHourAct = '동료와 사전 조율';
      secondHour = '14:30 ~ 16:30'; secondHourAct = '분업 실행';
    } else {
      // 일반 상생: 행운 70% / 마기 30%
      luckyRate = 70;
      magiRate = 30;
      branchRelation = `지지 상생(相生) 완충: ${yearInfo.branchFull}과 ${todayBranch}의 순리 소통`;
      magiType = '미룸과 방심의 마';
      defenseKeyword = '남쪽주의';
      magiTrigger = '큰 탈이 없다고 여겨 마감 시한이 있는 서류나 정리를 다음 날로 미룰 때 발생';
      magiRisk = '자잘한 일들이 밀려 주 후반에 감당하기 어려운 일정 압박으로 돌아올 수 있습니다.';
      defensePlan = '15분 이상 걸리지 않는 자잘한 일은 지금 당장 해치워 머릿속을 가볍게 비우십시오.';
      coreTaboo = '오늘 끝낼 수 있는 간단한 일을 내일로 미루는 나태함';
      firstHour = '09:00 ~ 11:00'; firstHourAct = '밀린 과제 처리';
      secondHour = '15:30 ~ 17:30'; secondHourAct = '내일 계획 점검';
    }

    const coreMechanic = `${yearInfo.ganjiName} 본원의 기운[${yearInfo.stemElement}·${yearInfo.branchElement}]이 오늘 ${pillar.pillarName || todayBranch}일진의 기운[${todayStemElement}·${todayBranchElement}]을 만나 ${stemTheme}의 흐름을 빚어냅니다.`;

    // 연령대 고려 맞춤 수식어
    const age = 2026 - targetYear + 1;
    let ageContext = '';
    if (age >= 80) {
      ageContext = `(80세 이상 경륜의 혜안: 삶의 원숙한 지혜로 주변을 온화하게 이끌고, 심신의 평안과 안정을 최우선으로 삼기에 매우 좋은 기운입니다.) `;
    } else if (age >= 60) {
      ageContext = `(경험과 원숙함: 실무의 디테일보다는 큰 흐름을 짚어주고 실속 있는 성과를 거두기에 알맞은 기운입니다.) `;
    }

    return {
      info: {
        key: meta.key,
        hanja: meta.hanja,
        animal: meta.animal,
        emoji: meta.emoji,
      },
      evidence: {
        birthYear: targetYear,
        yearGanji: `${targetYear}년 ${yearInfo.ganjiName}`,
        todayGanji: `오늘 ${pillar.pillarName ? `${pillar.pillarName}일진` : `${todayStem}${todayBranch}일`}`,
        stemRelation,
        branchRelation,
        coreMechanic,
      },
      fortune: {
        luckyRate,
        magiRate,
        opportunityArea: stemTheme,
        theme: `${yearInfo.ganjiName} 오늘의 기회: ${stemTheme}`,
        summary: `${ageContext}${stemOpportunity} 지지의 흐름 또한 ${branchRelation.split(':')[0]} 구조로 뒷받침되므로 순리에 맞게 행동하면 순탄히 풀립니다.`,
        actionTip: `오늘의 성과 비결: ${stemTheme}을 염두에 두고 적극적으로 움직이십시오.`,
        firstHour,
        firstHourAction: firstHourAct,
        secondHour,
        secondHourAction: secondHourAct,
      },
      magi: {
        magiRate,
        name: magiType,
        trigger: magiTrigger,
        risk: magiRisk,
        signs: `${yearInfo.ganjiName} 오늘 경계할 함정: ${magiType}`,
        mechanicEvidence: `[명리 근거] ${branchRelation}에서 기운의 불균형이 틈탈 때 발생하는 현실적 마기입니다.`,
      },
      defense: (() => {
        let pType = '마기 소멸 방비';
        let cBasis = '';
        let cStrategy = defensePlan;
        let cKeyword = defenseKeyword || '신중처신';

        if (magiRate >= 40) {
          pType = '마기 소멸 방비';
          cBasis = `오늘 ${branchRelation.split(':')[0]}의 영향으로 마기 지수 ${magiRate}%(${magiType})가 감지되었습니다. ${magiRisk}`;
          cStrategy = `[${cKeyword} 실천] ${defensePlan} 이를 통해 일진의 불운 마기를 사전에 안전하게 흘려보내십시오.`;
        } else if (luckyRate >= 60) {
          pType = '행운 극대화 처방';
          cKeyword = (branchRelation.includes('합') ? '선제협력' : '기회선점');
          cBasis = `오늘 ${branchRelation.split(':')[0]} 및 천간 ${stemTheme}의 조력으로 행운 지수 ${luckyRate}%의 강력한 호운이 유입되었습니다. ${stemOpportunity}`;
          cStrategy = `[${cKeyword} 실천] 오늘의 호운을 온전히 수렴하기 위해 망설이지 말고 적극적으로 기회를 선점하고 소통을 확대하십시오.`;
        } else {
          pType = '내실 안정 처방';
          cKeyword = '루틴준수';
          cBasis = `행운지수(${luckyRate}%)와 마기(${magiRate}%)가 대등하게 균형을 이루어 무리한 변동보다는 일상의 안정이 유리한 날입니다.`;
          cStrategy = `[${cKeyword} 실천] 새로운 일을 벌이기보다 기존 업무의 완성도를 높이고 정해진 시간표를 지키십시오.`;
        }

        return {
          defenseKeyword: cKeyword,
          prescriptionType: pType,
          causalBasis: cBasis,
          coreTaboo,
          actionStrategy: cStrategy,
          shieldItem: `${yStemEl === '목' ? '나무 펜' : yStemEl === '화' ? '따뜻한 차 1잔' : yStemEl === '토' ? '황동/가죽 소품' : yStemEl === '금' ? '금속 시계' : '맑은 물 텀블러'}`,
          fortuneColor: `${yStemEl === '목' ? '청록색' : yStemEl === '화' ? '붉은색' : yStemEl === '토' ? '황금색' : yStemEl === '금' ? '은백색' : '검은색'}`,
          mechanicEvidence: `[${pType} 근거] ${cBasis}`,
        };
      })(),
    };
  },

  
  /**
   * 01. [오늘의 운세용] 오늘 특히 대길(大吉)한 띠와 대박 연도 추천
   */
  getDailyLuckySummary() {
    const now = new Date();
    const pillar = DailyFortuneEngine.getDailyPillar(now);
    const todayStem = pillar.stem || '병';
    const todayBranch = pillar.branch || '신';
    const sIdx = STEMS.indexOf(todayStem);
    const bIdx = BRANCHES.indexOf(todayBranch);
    const todayStemHanja = sIdx >= 0 ? STEM_HANJA[sIdx] : '丙';
    const todayBranchHanja = bIdx >= 0 ? BRANCH_HANJA[bIdx] : '申';
    const todayGanjiLabel = `${todayStem}${todayBranch}(${todayStemHanja}${todayBranchHanja})`;

    // 육합(六合) 및 삼합(三合) 대길 띠 매핑
    const luckyMap: Record<string, { luckyAnimal: string; luckyHanja: string; subAnimal: string; subHanja: string; reason: string }> = {
      자: { luckyAnimal: '소', luckyHanja: '丑', subAnimal: '용', subHanja: '辰', reason: '자축육합(子丑六合) & 신자진 삼합 - 든든한 귀인의 조력과 재물 결실' },
      축: { luckyAnimal: '쥐', luckyHanja: '子', subAnimal: '닭', subHanja: '酉', reason: '자축육합(子丑六合) & 사유축 삼합 - 뜻밖의 협력자와 문서 이득' },
      인: { luckyAnimal: '돼지', luckyHanja: '亥', subAnimal: '말', subHanja: '午', reason: '인해육합(寅亥六合) & 인오술 삼합 - 기획의 성취와 추진력 폭발' },
      묘: { luckyAnimal: '개', luckyHanja: '戌', subAnimal: '돼지', subHanja: '亥', reason: '묘술육합(卯戌六合) & 해묘미 삼합 - 대인관계 화합과 숨은 실리 확보' },
      진: { luckyAnimal: '닭', luckyHanja: '酉', subAnimal: '원숭이', subHanja: '申', reason: '진유육합(辰酉六合) & 신자진 삼합 - 재물 금고 형성 및 능력 인정' },
      사: { luckyAnimal: '원숭이', luckyHanja: '申', subAnimal: '소', subHanja: '丑', reason: '사신육합(巳申六合) & 사유축 삼합 - 지혜의 발현과 난제 해결' },
      오: { luckyAnimal: '양', luckyHanja: '未', subAnimal: '호랑이', subHanja: '寅', reason: '오미육합(午未六合) & 인오술 삼합 - 열정과 명예의 동반 상승' },
      미: { luckyAnimal: '말', luckyHanja: '午', subAnimal: '토끼', subHanja: '卯', reason: '오미육합(午未六合) & 해묘미 삼합 - 온화한 중재와 뜻밖의 횡재' },
      신: { luckyAnimal: '쥐', luckyHanja: '子', subAnimal: '용', subHanja: '辰', reason: '신자진(申子辰) 수국 삼합 - 막힘없는 자금 회전과 성과 창출' },
      유: { luckyAnimal: '용', luckyHanja: '辰', subAnimal: '뱀', subHanja: '巳', reason: '진유육합(辰酉六合) & 사유축 삼합 - 정밀한 판단력과 귀인 후원' },
      술: { luckyAnimal: '토끼', luckyHanja: '卯', subAnimal: '말', subHanja: '午', reason: '묘술육합(卯戌六合) & 인오술 삼합 - 충직한 파트너와 신뢰 회복' },
      해: { luckyAnimal: '호랑이', luckyHanja: '寅', subAnimal: '양', subHanja: '未', reason: '인해육합(寅亥六合) & 해묘미 삼합 - 새로운 프로젝트와 활력 충전' }
    };

    const target = luckyMap[todayBranch] || { luckyAnimal: '쥐', luckyHanja: '子', subAnimal: '용', subHanja: '辰', reason: '합(合)의 조화' };
    const luckyInfo = ZODIAC_INFOS.find(z => z.animal === target.luckyAnimal) || ZODIAC_INFOS[0];
    const subInfo = ZODIAC_INFOS.find(z => z.animal === target.subAnimal) || ZODIAC_INFOS[4];

    const luckyYears = luckyInfo.years.filter(y => y >= 1960 && y <= 2008);
    const subYears = subInfo.years.filter(y => y >= 1964 && y <= 2000);

    return {
      todayGanjiLabel,
      luckyZodiac: {
        animal: target.luckyAnimal,
        hanja: target.luckyHanja,
        reason: target.reason,
        years: luckyYears,
      },
      subLuckyZodiac: {
        animal: target.subAnimal,
        hanja: target.subHanja,
        years: subYears,
      },
      message: `오늘 ${todayGanjiLabel} 일진은 ${target.reason}의 길한 기운이 충만합니다. 특히 ${target.luckyAnimal}띠와 ${target.subAnimal}띠 분들에게 성과와 귀인의 기회가 열려 있습니다.`,
      actionGuide: '아래에서 [12간지 띠]와 [출생연도]를 선택하시면 1:1 개인 맞춤 행운지수와 제1·제2 길시를 확인하실 수 있습니다.'
    };
  },

  /**
   * 02. [오늘의 마기용] 오늘 특히 주의/경계할 띠와 요주의 연도 경고
   */
  getDailyCautionSummary() {
    const now = new Date();
    const pillar = DailyFortuneEngine.getDailyPillar(now);
    const todayStem = pillar.stem || '병';
    const todayBranch = pillar.branch || '신';
    const sIdx = STEMS.indexOf(todayStem);
    const bIdx = BRANCHES.indexOf(todayBranch);
    const todayStemHanja = sIdx >= 0 ? STEM_HANJA[sIdx] : '丙';
    const todayBranchHanja = bIdx >= 0 ? BRANCH_HANJA[bIdx] : '申';
    const todayGanjiLabel = `${todayStem}${todayBranch}(${todayStemHanja}${todayBranchHanja})`;

    // 충(沖) 띠 매핑
    const clashMap: Record<string, { branch: string; animal: string; hanja: string; reason: string }> = {
      자: { branch: '오', animal: '말', hanja: '午', reason: '자오충(子午沖) - 감정 기복과 심혈관 주의' },
      축: { branch: '미', animal: '양', hanja: '未', reason: '축미충(丑未沖) - 고집과 정체성 혼란' },
      인: { branch: '신', animal: '원숭이', hanja: '申', reason: '인신충(寅申沖) - 역마와 금목의 격돌' },
      묘: { branch: '유', animal: '닭', hanja: '酉', reason: '묘유충(卯酉沖) - 칼날과 새싹의 상잔' },
      진: { branch: '술', animal: '개', hanja: '戌', reason: '진술충(辰戌沖) - 수고와 화고의 충돌' },
      사: { branch: '해', animal: '돼지', hanja: '亥', reason: '사해충(巳亥沖) - 급작스런 일정 변경' },
      오: { branch: '자', animal: '쥐', hanja: '子', reason: '자오충(子午沖) - 수화상쟁의 충돌' },
      미: { branch: '축', animal: '소', hanja: '丑', reason: '축미충(丑未沖) - 토기운 충돌 및 지각변동' },
      신: { branch: '인', animal: '호랑이', hanja: '寅', reason: '인신충(寅申沖) - 이동수 및 낙상/접촉사고 경계' },
      유: { branch: '묘', animal: '토끼', hanja: '卯', reason: '묘유충(卯酉沖) - 대인관계 절단 및 상처' },
      술: { branch: '진', animal: '용', hanja: '辰', reason: '진술충(辰戌沖) - 문서 분쟁 및 재물 누수' },
      해: { branch: '사', animal: '뱀', hanja: '巳', reason: '사해충(巳亥沖) - 화수 상충의 감정 동요' }
    };

    const penaltyMap: Record<string, { animal: string; hanja: string; reason: string }> = {
      신: { animal: '뱀', hanja: '巳', reason: '인사신(寅巳申) 삼형 - 관재구설과 계약 위기' },
      사: { animal: '호랑이', hanja: '寅', reason: '인사신(寅巳申) 삼형 - 직장 내 시비와 마찰' },
      인: { animal: '뱀', hanja: '巳', reason: '인사신(寅巳申) 삼형 - 이동 중 접촉 사고' },
      축: { animal: '개', hanja: '戌', reason: '축술미(丑戌未) 삼형 - 은혜를 원수로 갚는 배신' },
      술: { animal: '양', hanja: '未', reason: '축술미(丑戌未) 삼형 - 관절 및 부동산 구설' },
      미: { animal: '소', hanja: '丑', reason: '축술미(丑戌未) 삼형 - 문서 하자 및 계약 파기' },
      자: { animal: '토끼', hanja: '卯', reason: '자묘(子卯) 상형 - 예의 결여 및 대인 갈등' },
      묘: { animal: '쥐', hanja: '子', reason: '자묘(子卯) 상형 - 감정적 폭발과 구설' },
      진: { animal: '용', hanja: '辰', reason: '진진(辰辰) 자형 - 과욕으로 인한 자기 함정' },
      오: { animal: '말', hanja: '午', reason: '오오(午午) 자형 - 성급함과 화기 폭발' },
      유: { animal: '닭', hanja: '酉', reason: '유유(酉酉) 자형 - 예민함과 날카로운 비판' },
      해: { animal: '돼지', hanja: '亥', reason: '해해(亥亥) 자형 - 우울감과 과도한 의심' }
    };

    const targetClash = clashMap[todayBranch] || { branch: '인', animal: '호랑이', hanja: '寅', reason: '상충의 격돌' };
    const targetPenalty = penaltyMap[todayBranch] || { animal: '뱀', hanja: '巳', reason: '형살의 기운' };

    const clashZodiacInfo = ZODIAC_INFOS.find(z => z.animal === targetClash.animal) || ZODIAC_INFOS[2];
    const penaltyZodiacInfo = ZODIAC_INFOS.find(z => z.animal === targetPenalty.animal) || ZODIAC_INFOS[5];

    const cautionYears = clashZodiacInfo.years.filter(y => y >= 1950 && y <= 2002);
    const penaltyYears = penaltyZodiacInfo.years.filter(y => y >= 1953 && y <= 2001);

    return {
      todayGanjiLabel,
      cautionZodiac: {
        animal: targetClash.animal,
        hanja: targetClash.hanja,
        reason: targetClash.reason,
        years: cautionYears,
      },
      secondaryCautionZodiac: {
        animal: targetPenalty.animal,
        hanja: targetPenalty.hanja,
        reason: targetPenalty.reason,
        years: penaltyYears,
      },
      warningMessage: `오늘 ${todayGanjiLabel} 일진은 ${targetClash.reason}의 기운이 지배적입니다. 특히 ${targetClash.animal}띠와 ${targetPenalty.animal}띠 분들의 기운 변동폭이 크므로 충돌과 돌발 행동을 경계해야 합니다.`,
      actionGuide: '아래에서 [12간지 띠]와 [출생연도]를 선택하시면 1:1 개인 맞춤 마기지수와 현실적 리스크를 즉시 확인하실 수 있습니다.'
    };
  },

  /**
   * 03. [오늘의 방비용] 상황별 가변 맞춤 방비 가이드
   */
  getDailyDefenseSummary() {
    const lucky = this.getDailyLuckySummary();
    const caution = this.getDailyCautionSummary();
    return {
      todayGanjiLabel: lucky.todayGanjiLabel,
      strategyType: 'balance',
      message: `오늘 일진은 행운(${lucky.luckyZodiac.animal}띠)과 마기 경계(${caution.cautionZodiac.animal}띠)가 공존합니다. 자신의 띠와 연도를 확인하여 상황에 맞는 실전 비책을 취하십시오.`,
      actionGuide: '아래에서 [12간지 띠]와 [출생연도]를 선택하시면 오늘 귀하의 단 하나의 [실전 방비 키워드]를 확인하실 수 있습니다.'
    };
  },


  /**
   * [월간 행운 달력 전용 데이터 생성]
   * 해당 월의 1일~말일까지 각 날짜의 천기(행운)지수와 대길일(골든데이) 산출
   */
  getMonthlyLuckyCalendarData(year: number, month: number, zodiacKey: string = '자', birthYear?: number) {
    const meta = ZODIAC_INFOS.find(z => z.key === zodiacKey || z.animal === zodiacKey) || ZODIAC_INFOS[0];
    const targetYear = birthYear || meta.years[Math.floor(meta.years.length / 2)] || 1984;
    const yearInfo = getYearGanjiData(targetYear);

    const totalDays = new Date(year, month, 0).getDate();
    const daysData = [];

    for (let day = 1; day <= totalDays; day++) {
      const targetDate = new Date(year, month - 1, day);
      const pillar = DailyFortuneEngine.getDailyPillar(targetDate);
      const tStem = pillar.stem || '병';
      const tBr = pillar.branch || '신';
      const yBr = yearInfo.branch;

      // 육합 & 삼합 대길 판별
      const isSixHarm = (yBr === '자' && tBr === '축') || (yBr === '축' && tBr === '자') ||
                        (yBr === '인' && tBr === '해') || (yBr === '해' && tBr === '인') ||
                        (yBr === '묘' && tBr === '술') || (yBr === '술' && tBr === '묘') ||
                        (yBr === '진' && tBr === '유') || (yBr === '유' && tBr === '진') ||
                        (yBr === '사' && tBr === '신') || (yBr === '신' && tBr === '사') ||
                        (yBr === '오' && tBr === '미') || (yBr === '미' && tBr === '오');

      const isThreeHarm = (['신', '자', '진'].includes(yBr) && ['신', '자', '진'].includes(tBr)) ||
                          (['해', '묘', '미'].includes(yBr) && ['해', '묘', '미'].includes(tBr)) ||
                          (['인', '오', '술'].includes(yBr) && ['인', '오', '술'].includes(tBr)) ||
                          (['사', '유', '축'].includes(yBr) && ['사', '유', '축'].includes(tBr));

      const isClash = (yBr === '자' && tBr === '오') || (yBr === '오' && tBr === '자') ||
                      (yBr === '축' && tBr === '미') || (yBr === '미' && tBr === '축') ||
                      (yBr === '인' && tBr === '신') || (yBr === '신' && tBr === '인') ||
                      (yBr === '묘' && tBr === '유') || (yBr === '유' && tBr === '묘') ||
                      (yBr === '진' && tBr === '술') || (yBr === '술' && tBr === '진') ||
                      (yBr === '사' && tBr === '해') || (yBr === '해' && tBr === '사');

      let luckyRate = 60;
      let isGoldenDay = false;
      let actionTag = '평온';

      if (isSixHarm) {
        luckyRate = 92;
        isGoldenDay = true;
        actionTag = '계약·협상 대길';
      } else if (isThreeHarm) {
        luckyRate = 86;
        isGoldenDay = true;
        actionTag = '투자·성과 창출';
      } else if (isClash) {
        luckyRate = 25;
        actionTag = '신중';
      } else {
        luckyRate = 60 + ((day * 7) % 20); // 60~79의 안정적 일진
        actionTag = '계획 추진';
      }

      daysData.push({
        date: day,
        dayOfWeek: targetDate.getDay(),
        pillarName: pillar.pillarName || `${tStem}${tBr}`,
        luckyRate,
        isGoldenDay,
        actionTag,
      });
    }

    return {
      year,
      month,
      zodiacAnimal: meta.animal,
      targetYear,
      days: daysData,
      bestDays: daysData.filter(d => d.isGoldenDay).map(d => `${month}월 ${d.date}일(${['일','월','화','수','목','금','토'][d.dayOfWeek]})`),
    };
  },

  /**
   * [월간 마기 달력 전용 데이터 생성]
   * 해당 월의 1일~말일까지 각 날짜의 마기지수와 요주의 경보일(피결정일) 산출
   */
  getMonthlyMagiCalendarData(year: number, month: number, zodiacKey: string = '자', birthYear?: number) {
    const meta = ZODIAC_INFOS.find(z => z.key === zodiacKey || z.animal === zodiacKey) || ZODIAC_INFOS[0];
    const targetYear = birthYear || meta.years[Math.floor(meta.years.length / 2)] || 1984;
    const yearInfo = getYearGanjiData(targetYear);

    const totalDays = new Date(year, month, 0).getDate();
    const daysData = [];

    for (let day = 1; day <= totalDays; day++) {
      const targetDate = new Date(year, month - 1, day);
      const pillar = DailyFortuneEngine.getDailyPillar(targetDate);
      const tStem = pillar.stem || '병';
      const tBr = pillar.branch || '신';
      const yBr = yearInfo.branch;

      const isClash = (yBr === '자' && tBr === '오') || (yBr === '오' && tBr === '자') ||
                      (yBr === '축' && tBr === '미') || (yBr === '미' && tBr === '축') ||
                      (yBr === '인' && tBr === '신') || (yBr === '신' && tBr === '인') ||
                      (yBr === '묘' && tBr === '유') || (yBr === '유' && tBr === '묘') ||
                      (yBr === '진' && tBr === '술') || (yBr === '술' && tBr === '진') ||
                      (yBr === '사' && tBr === '해') || (yBr === '해' && tBr === '사');

      const isPenalty = (['인', '사', '신'].includes(yBr) && ['인', '사', '신'].includes(tBr) && yBr !== tBr) ||
                        (['축', '술', '미'].includes(yBr) && ['축', '술', '미'].includes(tBr) && yBr !== tBr);

      let magiRate = 20;
      let isWarningDay = false;
      let avoidTag = '무탈';

      if (isClash) {
        magiRate = 88;
        isWarningDay = true;
        avoidTag = '날인·이동 주의 필요';
      } else if (isPenalty) {
        magiRate = 78;
        isWarningDay = true;
        avoidTag = '언쟁·계약 신중 권고';
      } else {
        magiRate = 15 + ((day * 3) % 25);
        avoidTag = '방어 양호';
      }

      daysData.push({
        date: day,
        dayOfWeek: targetDate.getDay(),
        pillarName: pillar.pillarName || `${tStem}${tBr}`,
        magiRate,
        isWarningDay,
        avoidTag,
        isClash,
        isPenalty,
      });
    }

    return {
      year,
      month,
      zodiacAnimal: meta.animal,
      targetYear,
      days: daysData,
      worstDays: daysData.filter(d => d.isWarningDay).map(d => `${month}월 ${d.date}일(${['일','월','화','수','목','금','토'][d.dayOfWeek]})`),
    };
  },

  /**
   * [1:1 개인 사주 원국 맞춤 월간 행운달력 데이터 생성]
   * 사용자의 일간, 일지, 용신/희신, 십신, 5대 축 신호를 당월 1~말일 일진과 대조하여
   * 개인 맞춤형 대길일(골든데이)과 일일 천기지수 산출
   */
  getPersonalizedMonthlyLuckyCalendarData(
    year: number,
    month: number,
    sajuContext: {
      sajuCore: any;
      signal?: any;
      relationship?: any;
      userName?: string;
      gender?: 'male' | 'female';
    }
  ) {
    const { sajuCore, signal, relationship, userName = '의뢰인', gender = 'male' } = sajuContext;
    const coreAny = sajuCore as any;
    const dayPillar = (sajuCore?.four_pillars?.day || coreAny?.pillars?.day) as any;
    const stemAny = dayPillar?.stem;
    const branchAny = dayPillar?.branch;
    const dayStem: string = typeof stemAny === 'object' ? stemAny.char : (stemAny || coreAny?.day_stem || '갑');
    const dayBranch: string = typeof branchAny === 'object' ? branchAny.char : (branchAny || '자');
    const dayElement: string = coreAny?.day_element || (typeof stemAny === 'object' ? stemAny.element : '목');
    const strengthAny = (sajuCore?.day_master_strength || coreAny?.dayMasterStrength) as any;
    const yongshin = strengthAny?.yongshin || '화';
    const heeshin = strengthAny?.heeshin || '토';

    const totalDays = new Date(year, month, 0).getDate();
    const daysData = [];

    for (let day = 1; day <= totalDays; day++) {
      const targetDate = new Date(year, month - 1, day);
      const scores = DailyFortuneEngine.calculate({
        sajuCore,
        signal,
        relationship,
        userName,
        gender,
        targetDate,
      });

      const pillar = DailyFortuneEngine.getDailyPillar(targetDate);
      const luckyRate = scores.celestialScore;
      const isGoldenDay = luckyRate >= 80 || scores.gradeBadge.includes('대길');

      let actionTag = '계획 추진';
      if (isGoldenDay) {
        if (scores.moneyScore >= 80) actionTag = '재물·계약 대길';
        else if (scores.loveScore >= 80) actionTag = '인연·협상 대길';
        else actionTag = '성취·도약 대길';
      } else if (luckyRate >= 65) {
        actionTag = '순조로운 진행';
      } else if (luckyRate < 55) {
        actionTag = '신중·내실 점검';
      }

      daysData.push({
        date: day,
        dayOfWeek: targetDate.getDay(),
        pillarName: pillar.pillarName,
        luckyRate,
        isGoldenDay,
        actionTag,
        gradeBadge: scores.gradeBadge,
        moneyScore: scores.moneyScore,
        loveScore: scores.loveScore,
        vitalityScore: scores.vitalityScore,
      });
    }

    return {
      year,
      month,
      isPersonalized: true,
      userName,
      dayStem,
      dayBranch,
      dayElement,
      yongshin,
      heeshin,
      days: daysData,
      bestDays: daysData.filter(d => d.isGoldenDay).map(d => `${month}월 ${d.date}일(${['일','월','화','수','목','금','토'][d.dayOfWeek]})`),
    };
  },

  /**
   * [1:1 개인 사주 원국 맞춤 월간 마기달력 데이터 생성]
   * 사용자의 일지(본원궁) 충돌, 삼형, 기신 극을 당월 1~말일 일진과 대조하여
   * 개인 맞춤형 피결정일/마기 경보일 산출
   */
  getPersonalizedMonthlyMagiCalendarData(
    year: number,
    month: number,
    sajuContext: {
      sajuCore: any;
      signal?: any;
      relationship?: any;
      userName?: string;
      gender?: 'male' | 'female';
    }
  ) {
    const { sajuCore, signal, relationship, userName = '의뢰인', gender = 'male' } = sajuContext;
    const coreAny = sajuCore as any;
    const dayPillar = (sajuCore?.four_pillars?.day || coreAny?.pillars?.day) as any;
    const stemAny = dayPillar?.stem;
    const branchAny = dayPillar?.branch;
    const dayStem: string = typeof stemAny === 'object' ? stemAny.char : (stemAny || coreAny?.day_stem || '갑');
    const dayBranch: string = typeof branchAny === 'object' ? branchAny.char : (branchAny || '자');
    const dayElement: string = coreAny?.day_element || (typeof stemAny === 'object' ? stemAny.element : '목');
    const strengthAny = (sajuCore?.day_master_strength || coreAny?.dayMasterStrength) as any;
    const yongshin = strengthAny?.yongshin || '화';

    const totalDays = new Date(year, month, 0).getDate();
    const daysData = [];

    for (let day = 1; day <= totalDays; day++) {
      const targetDate = new Date(year, month - 1, day);
      const pillar = DailyFortuneEngine.getDailyPillar(targetDate);
      const tBr = pillar.branch;

      const isClash = (dayBranch === '자' && tBr === '오') || (dayBranch === '오' && tBr === '자') ||
                      (dayBranch === '축' && tBr === '미') || (dayBranch === '미' && tBr === '축') ||
                      (dayBranch === '인' && tBr === '신') || (dayBranch === '신' && tBr === '인') ||
                      (dayBranch === '묘' && tBr === '유') || (dayBranch === '유' && tBr === '묘') ||
                      (dayBranch === '진' && tBr === '술') || (dayBranch === '술' && tBr === '진') ||
                      (dayBranch === '사' && tBr === '해') || (dayBranch === '해' && tBr === '사');

      const isPenalty = (['인', '사', '신'].includes(dayBranch) && ['인', '사', '신'].includes(tBr) && dayBranch !== tBr) ||
                        (['축', '술', '미'].includes(dayBranch) && ['축', '술', '미'].includes(tBr) && dayBranch !== tBr);

      const scores = DailyFortuneEngine.calculate({
        sajuCore,
        signal,
        relationship,
        userName,
        gender,
        targetDate,
      });

      let magiRate = Math.max(12, Math.min(94, 100 - scores.celestialScore));
      let isWarningDay = false;
      let avoidTag = '방어 양호';

      if (isClash) {
        magiRate = Math.max(magiRate, 88);
        isWarningDay = true;
        avoidTag = '일지충·날인 주의 필요';
      } else if (isPenalty) {
        magiRate = Math.max(magiRate, 78);
        isWarningDay = true;
        avoidTag = '삼형·언쟁 신중 권고';
      } else if (scores.celestialScore < 56 || scores.gradeBadge.includes('주의')) {
        magiRate = Math.max(magiRate, 68);
        isWarningDay = true;
        avoidTag = '기운상극·결정 신중 권고';
      } else {
        avoidTag = '평온·무탈';
      }

      daysData.push({
        date: day,
        dayOfWeek: targetDate.getDay(),
        pillarName: pillar.pillarName,
        magiRate,
        isWarningDay,
        avoidTag,
        isClash,
        isPenalty,
      });
    }

    return {
      year,
      month,
      isPersonalized: true,
      userName,
      dayStem,
      dayBranch,
      dayElement,
      yongshin,
      days: daysData,
      worstDays: daysData.filter(d => d.isWarningDay).map(d => `${month}월 ${d.date}일(${['일','월','화','수','목','금','토'][d.dayOfWeek]})`),
    };
  },

};

