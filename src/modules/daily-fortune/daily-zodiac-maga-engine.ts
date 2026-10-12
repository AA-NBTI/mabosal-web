/**
 * Daily Zodiac Maga Engine (오늘의 띠별 운세 × 마기 주의 × 방비 행동 엔진)
 * 
 * 원칙:
 * 1. [오늘의 운세 — 기회와 활용]: 오늘 활용할 만한 기회, 유리한 행동, 관계·일·재물의 참고 흐름 (비회원 완전 오픈)
 * 2. [오늘의 마기 — 주의할 조건]: 불행을 예언하지 않고, 실수나 갈등이 커질 수 있는 상황과 행동 패턴 경보 (회원 전용)
 * 3. [오늘의 방비 — 실제 행동]: 오늘 당장 할 수 있는 명확한 단 하나의 실행 행동 제시 (회원 전용 + 완료 체크)
 * 4. 명리 분석 근거: 오늘 일진(日辰)과 각 띠/출생연도 간지의 합·충·오행 생극에 기반하여 1:1:1 세트로 도출.
 */

import { DailyFortuneEngine } from './daily-fortune-engine.js';

export interface ZodiacInfo {
  key: string;
  name: string;
  branchChar: string;
  element: '목' | '화' | '토' | '금' | '수';
  icon: string;
  years: number[];
}

export interface DailyZodiacFortuneResult {
  zodiacKey: string;
  zodiacName: string;
  birthYear: number;
  yearGanji: string;
  todayPillarName: string;
  todayGanjiDateStr: string;
  relationType: '육합(화합)' | '삼합(추진)' | '상생(순풍)' | '충(전환/주의)' | '형/원진(조정)' | '비겁(경쟁/동행)';
  
  // 1. 오늘의 운세 (기회와 활용) - 비회원 무료 오픈
  opportunity: {
    field: '일·업무' | '재물·계약' | '인간관계' | '학습·성장';
    title: string;
    description: string;
    keyAction: string;
  };

  // 2. 오늘의 마기 (주의할 조건) - 회원 전용 잠금
  magaCaution: {
    magaType: '성급함의 마' | '확인누락의 마' | '감정마찰의 마' | '소모지출의 마' | '독단고립의 마' | '미룸회피의 마';
    title: string;
    description: string;
    triggerPattern: string; // 실수나 갈등이 커질 수 있는 조건
  };

  // 3. 오늘의 방비 (실제 행동) - 회원 전용 잠금 & 완료 체크
  defenseAction: {
    actionId: string;
    actionText: string; // 오늘 할 행동 하나
    verificationTip: string; // 완료 판단 기준
  };
}

export const ZODIAC_LIST: ZodiacInfo[] = [
  { key: 'rat', name: '쥐띠', branchChar: '자', element: '수', icon: 'pest_control_rodent', years: [1948, 1960, 1972, 1984, 1996, 2008, 2020] },
  { key: 'ox', name: '소띠', branchChar: '축', element: '토', icon: 'agriculture', years: [1949, 1961, 1973, 1985, 1997, 2009, 2021] },
  { key: 'tiger', name: '호랑이띠', branchChar: '인', element: '목', icon: 'pets', years: [1950, 1962, 1974, 1986, 1998, 2010, 2022] },
  { key: 'rabbit', name: '토끼띠', branchChar: '묘', element: '목', icon: 'cruelty_free', years: [1951, 1963, 1975, 1987, 1999, 2011, 2023] },
  { key: 'dragon', name: '용띠', branchChar: '진', element: '토', icon: 'water_lux', years: [1952, 1964, 1976, 1988, 2000, 2012, 2024] },
  { key: 'snake', name: '뱀띠', branchChar: '사', element: '화', icon: 'gesture', years: [1953, 1965, 1977, 1989, 2001, 2013, 2025] },
  { key: 'horse', name: '말띠', branchChar: '오', element: '화', icon: 'sprint', years: [1954, 1966, 1978, 1990, 2002, 2014, 2026] },
  { key: 'sheep', name: '양띠', branchChar: '미', element: '토', icon: 'nature', years: [1955, 1967, 1979, 1991, 2003, 2015, 2027] },
  { key: 'monkey', name: '원숭이띠', branchChar: '신', element: '금', icon: 'smart_toy', years: [1956, 1968, 1980, 1992, 2004, 2016, 2028] },
  { key: 'rooster', name: '닭띠', branchChar: '유', element: '금', icon: 'alarm', years: [1957, 1969, 1981, 1993, 2005, 2017, 2029] },
  { key: 'dog', name: '개띠', branchChar: '술', element: '토', icon: 'sound_detection_dog_barking', years: [1958, 1970, 1982, 1994, 2006, 2018, 2030] },
  { key: 'pig', name: '돼지띠', branchChar: '해', element: '수', icon: 'savings', years: [1959, 1971, 1983, 1995, 2007, 2019, 2031] },
];

const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

const SIX_HARMONIES: Record<string, string> = {
  자: '축', 축: '자', 인: '해', 해: '인', 묘: '술', 술: '묘', 진: '유', 유: '진', 사: '신', 신: '사', 오: '미', 미: '오',
};

const SIX_CLASHES: Record<string, string> = {
  자: '오', 오: '자', 축: '미', 미: '축', 인: '신', 신: '인', 묘: '유', 유: '묘', 진: '술', 술: '진', 사: '해', 해: '사',
};

const THREE_HARMONIES: Record<string, string[]> = {
  해: ['묘', '미'], 묘: ['해', '미'], 미: ['해', '묘'], // 목국
  인: ['오', '술'], 오: ['인', '술'], 술: ['인', '오'], // 화국
  사: ['유', '축'], 유: ['사', '축'], 축: ['사', '유'], // 금국
  신: ['자', '진'], 자: ['신', '진'], 진: ['신', '자'], // 수국
};

export class DailyZodiacMagaEngine {
  /**
   * 특정 연도의 60갑자 간지 문자열 계산 (예: 1984 -> '갑자(甲子)')
   */
  public static getYearGanji(year: number): string {
    const offset = (year - 4) % 60;
    const stem = STEMS[(offset % 10 + 10) % 10];
    const branch = BRANCHES[(offset % 12 + 12) % 12];
    return `${stem}${branch}년생`;
  }

  /**
   * 띠와 출생연도에 따른 [오늘의 운세 × 오늘의 마기 × 오늘의 방비] 산출
   */
  public static calculate(
    zodiacKey: string,
    birthYear: number,
    targetDate: Date = new Date()
  ): DailyZodiacFortuneResult {
    const zodiac = ZODIAC_LIST.find((z) => z.key === zodiacKey) || ZODIAC_LIST[0];
    const today = DailyFortuneEngine.getDailyPillar(targetDate);
    const yearGanji = this.getYearGanji(birthYear);

    // 1. 오늘 일진 지지와 띠 지지의 명리 관계 분석
    const zBranch = zodiac.branchChar;
    const tBranch = today.branch;

    let relationType: DailyZodiacFortuneResult['relationType'] = '상생(순풍)';
    if (SIX_HARMONIES[zBranch] === tBranch) {
      relationType = '육합(화합)';
    } else if (THREE_HARMONIES[zBranch]?.includes(tBranch)) {
      relationType = '삼합(추진)';
    } else if (SIX_CLASHES[zBranch] === tBranch) {
      relationType = '충(전환/주의)';
    } else if (zBranch === tBranch) {
      relationType = '비겁(경쟁/동행)';
    }

    // 2. [기회 1개], [마기 1개], [방비 1개] 1:1:1 세트 생성
    const { opportunity, magaCaution, defenseAction } = this.deriveTrio(
      zodiac,
      birthYear,
      relationType,
      today
    );

    return {
      zodiacKey: zodiac.key,
      zodiacName: zodiac.name,
      birthYear,
      yearGanji,
      todayPillarName: today.pillarName,
      todayGanjiDateStr: today.ganjiDateStr,
      relationType,
      opportunity,
      magaCaution,
      defenseAction,
    };
  }

  /**
   * 명리 관계에 따른 [기회 × 마기 × 방비] 세트 파생
   */
  private static deriveTrio(
    zodiac: ZodiacInfo,
    birthYear: number,
    relation: DailyZodiacFortuneResult['relationType'],
    today: ReturnType<typeof DailyFortuneEngine.getDailyPillar>
  ): {
    opportunity: DailyZodiacFortuneResult['opportunity'];
    magaCaution: DailyZodiacFortuneResult['magaCaution'];
    defenseAction: DailyZodiacFortuneResult['defenseAction'];
  } {
    // 연도 시드(결과의 다양성 및 일관성)
    const seed = (birthYear + today.pillarName.charCodeAt(0)) % 4;

    if (relation === '육합(화합)') {
      return {
        opportunity: {
          field: '인간관계',
          title: '오해를 풀고 든든한 조력자를 얻기 유리한 날',
          description: '서로 다른 이해관계가 부드럽게 맞물리는 흐름입니다. 평소 다가가기 어려웠던 파트너나 동료에게 먼저 손을 내밀면 뜻밖의 화합을 이룹니다.',
          keyAction: '중요한 협의나 제안을 오늘 꺼내어 공감대를 형성하세요.',
        },
        magaCaution: {
          magaType: '독단고립의 마',
          title: '분위기에 취해 경계심을 너무 일찍 푸는 방심',
          description: '상대가 호의를 보인다고 해서 확인해야 할 핵심 계약 조건이나 원칙을 두루뭉술하게 넘어갈 위험이 있습니다.',
          triggerPattern: '호의적인 분위기 속에서 세부 약속 조항을 구두로만 넘기려 할 때',
        },
        defenseAction: {
          actionId: `def_yak_${birthYear}`,
          actionText: '호의적인 대화 후에도 합의된 핵심 내용 1줄을 메신저나 문자로 재확인하기',
          verificationTip: '상대방에게 요약 텍스트를 남겼는지 확인하세요.',
        },
      };
    }

    if (relation === '삼합(추진)') {
      return {
        opportunity: {
          field: '일·업무',
          title: '정체되었던 프로젝트나 실행을 강하게 밀어붙이기 좋은 기회',
          description: '주변의 힘과 자원이 하나의 목표로 응집되는 날입니다. 미뤄왔던 의사결정을 내리고 추진하면 기대 이상의 속도가 붙습니다.',
          keyAction: '우선순위가 가장 높은 핵심 과제에 오전 시간을 집중 투자하세요.',
        },
        magaCaution: {
          magaType: '성급함의 마',
          title: '속도에 취해 동료의 보폭을 살피지 않는 조급증',
          description: '내 생각의 진행 속도가 너무 빨라 주변 사람들의 이해 속도를 기다려주지 못하고 혼자 앞서가다 불필요한 마찰을 낳을 수 있습니다.',
          triggerPattern: '동료가 머뭇거리거나 질문할 때 답답함을 느끼며 말을 자르려 할 때',
        },
        defenseAction: {
          actionId: `def_speed_${birthYear}`,
          actionText: '지시나 설명 후 "이해 안 되거나 걸리는 부분 있나요?"라고 먼저 1번 묻기',
          verificationTip: '상대방의 답변을 끝까지 경청했는지 확인하세요.',
        },
      };
    }

    if (relation === '충(전환/주의)') {
      return {
        opportunity: {
          field: '학습·성장',
          title: '기존의 비효율적인 관행을 과감히 털어내고 전환점을 만들 기회',
          description: '변화의 파도가 들어오는 날입니다. 과거의 고집을 내려놓고 새로운 방식이나 피드백을 수용하면 체질을 획기적으로 개선할 수 있습니다.',
          keyAction: '문제가 반복되던 업무 루틴을 새로운 방식으로 바꿔 시도해보세요.',
        },
        magaCaution: {
          magaType: '감정마찰의 마',
          title: '예상치 못한 피드백에 즉각 방어적으로 맞서는 충동',
          description: '내 계획과 다른 돌발 변수가 생겼을 때, 상황보다 사람을 탓하며 날 선 말을 내뱉을 위험이 도사리고 있습니다.',
          triggerPattern: '반대 의견이나 지적을 듣는 순간 가슴이 답답해지며 즉각 반박하고 싶을 때',
        },
        defenseAction: {
          actionId: `def_calm_${birthYear}`,
          actionText: '지적이나 돌발 상황 발생 시 바로 말하지 말고 5초간 심호흡 후 답하기',
          verificationTip: '첫 반응을 5초 뒤로 늦췄는지 체크하세요.',
        },
      };
    }

    if (relation === '비겁(경쟁/동행)') {
      return {
        opportunity: {
          field: '재물·계약',
          title: '동료들과 함께 분업하여 실속을 나누기 좋은 협업의 날',
          description: '혼자 모든 것을 감당하려 하기보다 뜻이 맞는 사람과 역할을 분담할 때 훨씬 큰 실리와 안정성을 확보할 수 있습니다.',
          keyAction: '신뢰할 수 있는 파트너에게 일정 부분 권한을 위임해보세요.',
        },
        magaCaution: {
          magaType: '소모지출의 마',
          title: '체면이나 자존심 때문에 불필요한 비용이나 약속을 떠안는 패턴',
          description: '타인의 시선을 의식하여 거절하지 못하고 과도한 비용을 지출하거나 감당하기 힘든 부탁을 수락할 우려가 있습니다.',
          triggerPattern: '무리한 부탁이나 모임 결제 상황에서 분위기에 휩쓸려 나설 때',
        },
        defenseAction: {
          actionId: `def_refuse_${birthYear}`,
          actionText: '오늘 갑작스러운 지출이나 부탁 요청이 오면 "일정/예산 확인 후 내일 말씀드릴게요"로 1회 보류하기',
          verificationTip: '즉답을 피하고 한 번 걸러냈는지 확인하세요.',
        },
      };
    }

    // 기본 상생(순풍) 흐름
    const defaultVariations = [
      {
        opp: {
          field: '일·업무' as const,
          title: '중요한 업무의 우선순위를 깔끔히 정리하기 좋은 날',
          description: '복잡했던 머릿속이 명쾌해지고 본질이 보이는 시간입니다. 산더미 같은 일 중 가장 중요한 1가지를 골라내기 유리합니다.',
          keyAction: '오전 일과 시작 전 오늘 반드시 끝낼 1가지 핵심 과제를 메모하세요.',
        },
        maga: {
          magaType: '확인누락의 마' as const,
          title: '지시가 모호한 상황에서 임의로 넘겨짚고 진행하는 실수',
          description: '상대방의 의도를 명확히 확인하지 않고 "알아서 잘 되겠지"라며 짐작으로 일처리를 하다가 후반부에 재작업을 할 수 있습니다.',
          triggerPattern: '상대방의 지시나 메일에서 불분명한 단어가 있는데 그냥 닫으려 할 때',
        },
        defense: {
          actionId: `def_check_${birthYear}`,
          actionText: '애매한 지시나 요청 사항은 메신저로 핵심 질문 1개를 던져 명확히 하기',
          verificationTip: '모호한 점을 질문으로 확인했는지 체크하세요.',
        },
      },
      {
        opp: {
          field: '재물·계약' as const,
          title: '불필요한 고정 지출을 점검하고 알짜 실속을 챙길 기회',
          description: '차분하게 재정 상태를 들여다보기 좋은 날입니다. 잊고 있던 구독료나 누수되던 지출을 잡아내어 알토란 같은 보탬을 만듭니다.',
          keyAction: '최근 일주일간의 카드 사용 내역을 3분간 훑어보세요.',
        },
        maga: {
          magaType: '미룸회피의 마' as const,
          title: '귀찮다는 이유로 서류나 결제 기한을 내일로 미루는 습관',
          description: '사소한 행정 처리나 정산 작업을 미루다 나중에 가산금이나 복잡한 절차를 겪게 될 수 있습니다.',
          triggerPattern: '간단히 처리할 수 있는 신청이나 납부를 "나중에 해야지"라며 닫을 때',
        },
        defense: {
          actionId: `def_today_${birthYear}`,
          actionText: '5분 안에 끝낼 수 있는 미결 서류나 정산 1건을 점심 직후 즉시 해치우기',
          verificationTip: '미뤄둔 1건을 완료 처리했는지 체크하세요.',
        },
      },
    ];

    const pick = defaultVariations[seed % defaultVariations.length];
    return {
      opportunity: pick.opp,
      magaCaution: pick.maga,
      defenseAction: pick.defense,
    };
  }
}
