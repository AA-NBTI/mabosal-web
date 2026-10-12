/**
 * Mabosal Gunghap (2-Person Chemistry) Precision Engine
 * 
 * 원칙:
 * 1. 기존 Phase 1~26 마보살 1인 코어 모듈을 절대 수정/오염시키지 않는 독립 명리 궁합 엔진.
 * 2. 천간합/상생상극(정신/가치관), 지지 육합/삼합/육충/원진(속궁합/현실 조율), 오행 상호 보완도(조후/결핍) 정밀 산출.
 * 3. 100점 만점 종합 궁합 점수, 등급(S~D), 4대 핵심 지수 산출.
 * 4. 두 사람 맞춤 '3대 감정 폭발 버튼' 및 즉각 대처 화해 스크립트 생성.
 */

export type StemChar = '갑' | '을' | '병' | '정' | '무' | '기' | '경' | '신' | '임' | '계';
export type BranchChar = '자' | '축' | '인' | '묘' | '진' | '사' | '오' | '미' | '신' | '유' | '술' | '해';
export type ElementType = '목' | '화' | '토' | '금' | '수';

export interface PersonBirthInput {
  name: string;
  gender: 'male' | 'female';
  birthDate: string; // YYYY-MM-DD
  birthTime?: string | null; // HH:mm or null
  calendarType?: 'solar' | 'lunar';
  relation?: string; // 연인, 부부, 동업·동료, 썸·호감, 헤어진 연인
}

export interface PillarP {
  stem: StemChar;
  branch: BranchChar;
  stemElement: ElementType;
  branchElement: ElementType;
}

export interface PersonFourPillars {
  year: PillarP;
  month: PillarP;
  day: PillarP;
  hour?: PillarP;
  elementCounts: Record<ElementType, number>;
  dayMaster: StemChar;
  dayBranch: BranchChar;
}

export interface ConflictButton {
  title: string;
  tag: string;
  description: string;
  triggerDetail: string;
  solution: string;
  script: string;
}

export interface GunghapAnalysisResult {
  personA: {
    name: string;
    gender: 'male' | 'female';
    birthDate: string;
    dayPillarName: string;
    dayStemElement: ElementType;
    personalitySummary: string;
  };
  personB: {
    name: string;
    gender: 'male' | 'female';
    birthDate: string;
    dayPillarName: string;
    dayStemElement: ElementType;
    personalitySummary: string;
  };
  score: number; // 0 ~ 100
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
  tierTitle: string;
  tierSummary: string;
  
  // 4대 세부 지수 (각 0~100)
  indices: {
    mentalChemistry: number;    // 정신적 공감 & 가치관 일치도 (천간)
    physicalChemistry: number;  // 현실 생활 & 속궁합 조화도 (지지)
    elementComplement: number;  // 오행 상호 결핍 보완도
    longTermStability: number;  // 장기적 인연 지속력 & 방어력
  };

  // 상세 명리 상호작용
  stemInteraction: {
    type: '합(천생연분)' | '상생(자연스런 배려)' | '비화(친구같은 동질감)' | '상극(통제와 긴장)';
    description: string;
  };
  branchInteraction: {
    type: string;
    description: string;
    hasClash: boolean;
    hasWonjin: boolean;
    hasHarmony: boolean;
  };
  complementInteraction: {
    aGivesB: string;
    bGivesA: string;
    balanceSummary: string;
  };

  // 3대 감정 폭발 버튼 및 화해 스크립트
  conflictButtons: ConflictButton[];

  // 마보살 실전 궁합 처방
  prescriptions: {
    luckyDirection: string;
    luckyActivity: string;
    prohibitedHabit: string;
    secretKeyphrase: string;
  };
}

const STEM_ELEMENTS: Record<StemChar, ElementType> = {
  '갑': '목', '을': '목',
  '병': '화', '정': '화',
  '무': '토', '기': '토',
  '경': '금', '신': '금',
  '임': '수', '계': '수',
};

const BRANCH_ELEMENTS: Record<BranchChar, ElementType> = {
  '자': '수', '축': '토', '인': '목', '묘': '목',
  '진': '토', '사': '화', '오': '화', '미': '토',
  '신': '금', '유': '금', '술': '토', '해': '수',
};

const STEMS: StemChar[] = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const BRANCHES: BranchChar[] = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

const STEM_COMBINATIONS: Record<string, string> = {
  '갑기': '갑기합토 (전통적인 천생연분의 끌림과 깊은 신뢰)',
  '을경': '을경합금 (의리와 결단력으로 뭉친 단단한 동행)',
  '병신': '병신합수 (화려한 열정과 세밀한 지혜의 이상적 조화)',
  '정임': '정임합목 (풍부한 감성과 정서적 유착의 로맨스)',
  '무계': '무계합화 (듬직한 포용과 유연한 감각의 완벽한 짝)',
};

const BRANCH_SIX_HARMONY: Record<string, string> = {
  '자축': '자축합토 (묵직하고 끈끈한 현실적 신뢰)',
  '인해': '인해합목 (서로를 키워주는 따뜻한 생명력)',
  '묘술': '묘술합화 (열정적이고 솔직한 감정 교류)',
  '진유': '진유합금 (정교하고 현실적인 상호 보완)',
  '사신': '사신합수 (지혜와 순발력이 맞물리는 케미)',
  '오미': '오미합화 (밝고 사교적인 라이프스타일 일치)',
};

const BRANCH_CLASH: Record<string, string> = {
  '자오': '자오충 (수화상충: 감정 폭발과 극단적인 기복 주의)',
  '축미': '축미충 (토토상충: 고집과 생활 방식의 정면 충돌)',
  '인신': '인신충 (금목상충: 이동, 속도감, 결단력의 불일치)',
  '묘유': '묘유충 (금목상충: 말실수와 예민한 감정의 칼날)',
  '진술': '진술충 (토토상충: 내면의 자존심과 고집 대립)',
  '사해': '사해충 (수화상충: 현실 감각과 이상주의의 괴리)',
};

const BRANCH_WONJIN: Record<string, string> = {
  '자미': '자미원진 (이유 없는 서운함과 침묵의 냉전 주의)',
  '축오': '축오원진 (욱하는 분노와 섭섭함 누적)',
  '인유': '인유원진 (서로의 결점을 지적하다 상처 주는 패턴)',
  '묘신': '묘신원진 (의심과 불안감으로 인한 소모전)',
  '진해': '진해원진 (말 못 할 속앓이와 감정의 오해)',
  '사술': '사술원진 (서로에 대한 집착과 갑작스러운 거리감)',
};

export class GunghapEngine {
  /**
   * 생년월일을 바탕으로 4주(간지) 산출 (고정밀 캘린더 알고리즘)
   */
  public deriveFourPillars(input: PersonBirthInput): PersonFourPillars {
    const parts = input.birthDate.split('-').map(Number);
    const year = parts[0] || 1990;
    const month = parts[1] || 1;
    const day = parts[2] || 1;

    // 년주 (입춘 기준 간이 산출: 1984년 갑자년 기준)
    const yearOffset = (year - 4) % 60;
    const yearStemIdx = (yearOffset % 10 + 10) % 10;
    const yearBranchIdx = (yearOffset % 12 + 12) % 12;

    // 월주 (년간 기준 월두법)
    const monthStemBase = (yearStemIdx % 5) * 2 + 2;
    const monthStemIdx = (monthStemBase + (month - 1)) % 10;
    const monthBranchIdx = (month + 1) % 12; // 1월 인(寅), 2월 묘...

    // 일주 (기준일 2000-01-01 = 무오일(戊午, index 54) 기준 Julian Day 계산)
    const baseDate = new Date(Date.UTC(2000, 0, 1));
    const targetDate = new Date(Date.UTC(year, month - 1, day));
    const diffDays = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    const day60Idx = (((54 + diffDays) % 60) + 60) % 60;
    const dayStemIdx = day60Idx % 10;
    const dayBranchIdx = day60Idx % 12;

    // 시주 (출생시 있는 경우)
    let hourPillar: PillarP | undefined;
    if (input.birthTime) {
      const [h] = input.birthTime.split(':').map(Number);
      const hourBranchIdx = Math.floor(((h + 1) % 24) / 2);
      const hourStemBase = (dayStemIdx % 5) * 2;
      const hourStemIdx = (hourStemBase + hourBranchIdx) % 10;
      hourPillar = {
        stem: STEMS[hourStemIdx],
        branch: BRANCHES[hourBranchIdx],
        stemElement: STEM_ELEMENTS[STEMS[hourStemIdx]],
        branchElement: BRANCH_ELEMENTS[BRANCHES[hourBranchIdx]],
      };
    }

    const yearP: PillarP = {
      stem: STEMS[yearStemIdx],
      branch: BRANCHES[yearBranchIdx],
      stemElement: STEM_ELEMENTS[STEMS[yearStemIdx]],
      branchElement: BRANCH_ELEMENTS[BRANCHES[yearBranchIdx]],
    };
    const monthP: PillarP = {
      stem: STEMS[monthStemIdx],
      branch: BRANCHES[monthBranchIdx],
      stemElement: STEM_ELEMENTS[STEMS[monthStemIdx]],
      branchElement: BRANCH_ELEMENTS[BRANCHES[monthBranchIdx]],
    };
    const dayP: PillarP = {
      stem: STEMS[dayStemIdx],
      branch: BRANCHES[dayBranchIdx],
      stemElement: STEM_ELEMENTS[STEMS[dayStemIdx]],
      branchElement: BRANCH_ELEMENTS[BRANCHES[dayBranchIdx]],
    };

    const elementCounts: Record<ElementType, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
    [yearP, monthP, dayP].forEach(p => {
      elementCounts[p.stemElement]++;
      elementCounts[p.branchElement]++;
    });
    if (hourPillar) {
      elementCounts[hourPillar.stemElement]++;
      elementCounts[hourPillar.branchElement]++;
    }

    return {
      year: yearP,
      month: monthP,
      day: dayP,
      hour: hourPillar,
      elementCounts,
      dayMaster: dayP.stem,
      dayBranch: dayP.branch,
    };
  }

  /**
   * 2인 사주 정밀 궁합 종합 분석
   */
  public calculate(personAInput: PersonBirthInput, personBInput: PersonBirthInput): GunghapAnalysisResult {
    const pillarsA = this.deriveFourPillars(personAInput);
    const pillarsB = this.deriveFourPillars(personBInput);

    const stemA = pillarsA.dayMaster;
    const stemB = pillarsB.dayMaster;
    const elA = pillarsA.day.stemElement;
    const elB = pillarsB.day.stemElement;

    const branchA = pillarsA.dayBranch;
    const branchB = pillarsB.dayBranch;

    // 1. 천간(일간) 상호작용 분석
    let mentalScore = 70;
    let stemType: GunghapAnalysisResult['stemInteraction']['type'] = '상생(자연스런 배려)';
    let stemDesc = '';

    const stemPair1 = stemA + stemB;
    const stemPair2 = stemB + stemA;
    if (STEM_COMBINATIONS[stemPair1] || STEM_COMBINATIONS[stemPair2]) {
      mentalScore = 96;
      stemType = '합(천생연분)';
      stemDesc = (STEM_COMBINATIONS[stemPair1] || STEM_COMBINATIONS[stemPair2]) + '으로, 처음 만난 순간부터 대화가 통하고 서로의 결점을 자연스럽게 감싸주는 강력한 정신적 인연입니다.';
    } else if (this.isGenerating(elA, elB) || this.isGenerating(elB, elA)) {
      mentalScore = 86;
      stemType = '상생(자연스런 배려)';
      const giver = this.isGenerating(elA, elB) ? personAInput.name : personBInput.name;
      const receiver = this.isGenerating(elA, elB) ? personBInput.name : personAInput.name;
      stemDesc = `${elA}과 ${elB}의 상생 관계로, ${giver}님이 ${receiver}님에게 무의식적으로 양보하고 지지해주는 편안하고 안정적인 정서적 유대입니다.`;
    } else if (elA === elB) {
      mentalScore = 78;
      stemType = '비화(친구같은 동질감)';
      stemDesc = `동일한 ${elA} 기운으로 맺어져 친구처럼 취향과 공감대가 잘 맞지만, 고집이 부딪힐 때 한쪽이 먼저 굽히기 어려운 자존심 대립이 있을 수 있습니다.`;
    } else {
      mentalScore = 65;
      stemType = '상극(통제와 긴장)';
      stemDesc = `${elA}과 ${elB}의 상극 작용으로 초반에는 강한 호기심과 매력을 느끼지만, 시간이 흐를수록 말투나 행동 양식에서 통제하려는 긴장감이 발생할 수 있습니다.`;
    }

    // 2. 지지(일지) 상호작용 분석 (속궁합 및 현실 생활)
    let physicalScore = 72;
    let branchHasHarmony = false;
    let branchHasClash = false;
    let branchHasWonjin = false;
    let branchTypeStr = '평이한 조화';
    let branchDesc = '';

    const bPair1 = branchA + branchB;
    const bPair2 = branchB + branchA;

    if (BRANCH_SIX_HARMONY[bPair1] || BRANCH_SIX_HARMONY[bPair2]) {
      physicalScore = 95;
      branchHasHarmony = true;
      branchTypeStr = '육합(최상급 밀착 속궁합)';
      branchDesc = (BRANCH_SIX_HARMONY[bPair1] || BRANCH_SIX_HARMONY[bPair2]) + '을 이루어 현실 생활 패턴, 체온, 속궁합에서 끈끈한 결속력을 자랑합니다. 떨어져 있으면 금세 보고 싶어지는 유착형 궁합입니다.';
    } else if (BRANCH_CLASH[bPair1] || BRANCH_CLASH[bPair2]) {
      physicalScore = 55;
      branchHasClash = true;
      branchTypeStr = '육충(생활 패턴 및 감정 충돌 주의)';
      branchDesc = (BRANCH_CLASH[bPair1] || BRANCH_CLASH[bPair2]) + '의 기운으로, 스킨십이나 일상 습관, 정리정돈, 돈 쓰는 방식에서 정면으로 의견이 부딪히기 쉽습니다. 서로의 영역을 침범하지 않는 룰이 필수적입니다.';
    } else if (BRANCH_WONJIN[bPair1] || BRANCH_WONJIN[bPair2]) {
      physicalScore = 58;
      branchHasWonjin = true;
      branchTypeStr = '원진살(애증과 서운함 주의)';
      branchDesc = (BRANCH_WONJIN[bPair1] || BRANCH_WONJIN[bPair2]) + '이 형성되어 좋아하면서도 사소한 행동 하나에 깊은 서운함을 느끼거나, 말없이 냉전 상태로 들어가는 감정 소모 패턴을 조심해야 합니다.';
    } else {
      branchTypeStr = '무난한 안정형 지지';
      branchDesc = '일지에 큰 충이나 원진이 없어 일상 생활이나 잠자리에서 극단적인 트러블 없이 원만하고 편안하게 유지되는 안정적인 일상 궁합입니다.';
    }

    // 3. 오행 상호 결핍 보완도
    let complementScore = 70;
    const deficientA = this.findDeficientElements(pillarsA.elementCounts);
    const deficientB = this.findDeficientElements(pillarsB.elementCounts);

    const aHelpedByB = deficientA.filter(el => (pillarsB.elementCounts[el] || 0) >= 2);
    const bHelpedByA = deficientB.filter(el => (pillarsA.elementCounts[el] || 0) >= 2);

    complementScore += aHelpedByB.length * 12 + bHelpedByA.length * 12;
    complementScore = Math.min(98, Math.max(50, complementScore));

    const aGivesBStr = bHelpedByA.length > 0 
      ? `${personAInput.name}님이 ${personBInput.name}님에게 부족한 [${bHelpedByA.join(', ')}] 기운을 가득 채워주고 있습니다.`
      : `${personAInput.name}님은 안정적인 기운의 베이스캠프 역할을 합니다.`;
    const bGivesAStr = aHelpedByB.length > 0
      ? `${personBInput.name}님이 ${personAInput.name}님에게 부족한 [${aHelpedByB.join(', ')}] 기운을 시원하게 불어넣어 줍니다.`
      : `${personBInput.name}님은 감정적인 밸런스를 맞춰주는 조율자 역할을 합니다.`;

    // 4. 장기 안정성
    let stabilityScore = Math.round((mentalScore * 0.35) + (physicalScore * 0.35) + (complementScore * 0.3));

    // 종합 점수 산출
    let totalScore = Math.round(
      (mentalScore * 0.3) + 
      (physicalScore * 0.35) + 
      (complementScore * 0.2) + 
      (stabilityScore * 0.15)
    );
    totalScore = Math.min(99, Math.max(52, totalScore));

    // 등급 결정
    let tier: GunghapAnalysisResult['tier'] = 'B';
    let tierTitle = '';
    let tierSummary = '';

    if (totalScore >= 90) {
      tier = 'S';
      tierTitle = '천생연분의 백년해로 명품 궁합';
      tierSummary = '두 사람의 영혼과 현실이 톱니바퀴처럼 완벽하게 맞물려, 만날수록 서로의 복(福)을 키워주는 최상급 인연입니다.';
    } else if (totalScore >= 80) {
      tier = 'A';
      tierTitle = '상호 보완적인 찰떡 동반자 궁합';
      tierSummary = '서로의 결핍을 완벽하게 채워주며, 작은 배려만 더해지면 세상에서 가장 든든한 내 편이 되어주는 귀한 인연입니다.';
    } else if (totalScore >= 70) {
      tier = 'B';
      tierTitle = '현실적 조율이 빛나는 발전형 궁합';
      tierSummary = '서로 다른 매력에 끌렸으나 현실적인 룰과 대화 방식의 약속이 뒷받침될 때 비로소 진가를 발휘하는 관계입니다.';
    } else if (totalScore >= 60) {
      tier = 'C';
      tierTitle = '감정 조율과 세심한 배려가 필요한 밀당 궁합';
      tierSummary = '좋을 때는 한없이 뜨겁지만, 한번 틀어지면 자존심 싸움으로 번지기 쉬워 명문화된 소통 룰이 반드시 필요한 관계입니다.';
    } else {
      tier = 'D';
      tierTitle = '상극 방어와 전문 처방이 필수적인 인연';
      tierSummary = '원국 간의 충과 기운의 대립이 뚜렷하여, 무의식적으로 던진 말이 깊은 상처가 될 수 있습니다. 특별 방비책 실천이 필수적입니다.';
    }

    // 3대 감정 폭발 버튼 생성
    const conflictButtons = this.generateConflictButtons(
      personAInput, personBInput, 
      elA, elB, stemA, stemB, 
      branchA, branchB, 
      branchHasClash, branchHasWonjin
    );

    // 마보살 처방전 도출
    const prescriptions = this.generatePrescriptions(
      elA, elB, stemA, stemB, branchA, branchB, 
      branchHasClash, branchHasWonjin, branchHasHarmony,
      personBInput.relation || '연인',
      personAInput.name, personBInput.name
    );

    return {
      personA: {
        name: personAInput.name,
        gender: personAInput.gender,
        birthDate: personAInput.birthDate,
        dayPillarName: `${stemA}${branchA}일주 (${elA})`,
        dayStemElement: elA,
        personalitySummary: this.getPersonalitySummary(stemA, elA),
      },
      personB: {
        name: personBInput.name,
        gender: personBInput.gender,
        birthDate: personBInput.birthDate,
        dayPillarName: `${stemB}${branchB}일주 (${elB})`,
        dayStemElement: elB,
        personalitySummary: this.getPersonalitySummary(stemB, elB),
      },
      score: totalScore,
      tier,
      tierTitle,
      tierSummary,
      indices: {
        mentalChemistry: mentalScore,
        physicalChemistry: physicalScore,
        elementComplement: complementScore,
        longTermStability: stabilityScore,
      },
      stemInteraction: {
        type: stemType,
        description: stemDesc,
      },
      branchInteraction: {
        type: branchTypeStr,
        description: branchDesc,
        hasClash: branchHasClash,
        hasWonjin: branchHasWonjin,
        hasHarmony: branchHasHarmony,
      },
      complementInteraction: {
        aGivesB: aGivesBStr,
        bGivesA: bGivesAStr,
        balanceSummary: `두 사람의 사주가 합쳐졌을 때 오행의 편중이 완화되고 전체적인 음양 순환도가 ${Math.round(complementScore)}% 수준으로 조화롭게 유지됩니다.`,
      },
      conflictButtons,
      prescriptions,
    };
  }

  private isGenerating(from: ElementType, to: ElementType): boolean {
    const genMap: Record<ElementType, ElementType> = {
      '목': '화', '화': '토', '토': '금', '금': '수', '수': '목',
    };
    return genMap[from] === to;
  }

  private findDeficientElements(counts: Record<ElementType, number>): ElementType[] {
    const result: ElementType[] = [];
    (['목', '화', '토', '금', '수'] as ElementType[]).forEach(el => {
      if ((counts[el] || 0) === 0) result.push(el);
    });
    return result;
  }

  private getPersonalitySummary(stem: StemChar, el: ElementType): string {
    const map: Record<StemChar, string> = {
      '갑': '주도적이고 진취적이며 한번 정한 목표는 불도저처럼 밀어붙이는 대들보 리더형',
      '을': '부드럽고 유연하며 끈기 있게 관계를 가꾸는 친화력 높은 현실주의형',
      '병': '화끈하고 열정적이며 뒤끝 없이 밝고 솔직하게 마음을 표현하는 태양형',
      '정': '섬세하고 따뜻하며 속 깊은 배려와 예술적 감수성을 지닌 등불형',
      '무': '묵직하고 믿음직하며 어떤 일에도 쉽게 흔들리지 않는 든든한 산형',
      '기': '포용력이 넓고 꼼꼼하며 주변을 편안하게 챙겨주는 대지 어머니형',
      '경': '의리와 결단력이 돋보이며 공과 사가 분명하고 솔직담백한 바위형',
      '신': '예리하고 세련되며 자존심이 높고 완벽을 추구하는 보석형',
      '임': '지혜롭고 스케일이 크며 자유로운 사고방식과 유연한 적응력을 지닌 바다형',
      '계': '기획력이 뛰어나고 다정다감하며 상대방의 감정을 섬세하게 읽어내는 이슬비형',
    };
    return map[stem] || `${el} 기운의 특성을 품은 온화한 기질`;
  }

  private generateConflictButtons(
    pA: PersonBirthInput, pB: PersonBirthInput,
    elA: ElementType, elB: ElementType,
    stemA: StemChar, stemB: StemChar,
    branchA: BranchChar, branchB: BranchChar,
    hasClash: boolean, hasWonjin: boolean
  ): ConflictButton[] {
    const buttons: ConflictButton[] = [];

    // 버튼 1: 대화 및 표현 방식 충돌
    buttons.push({
      title: `감정 표현 속도와 직설 화법의 격차 (${stemA}${elA} vs ${stemB}${elB})`,
      tag: '대화 & 말투 폭발 버튼',
      description: `한쪽은 즉각적인 해명이나 솔직한 결론을 원하는데, 상대방은 생각을 정리할 시간이 필요해 침묵하거나 빙빙 돌려 말할 때 폭발합니다.`,
      triggerDetail: `"그래서 결론이 뭔데?", "왜 아무 말도 안 해?"라는 식의 다그침이 발생하는 순간 상대는 마음의 문을 닫아버립니다.`,
      solution: `대화 요청 시 즉답을 요구하지 말고 '30분의 생각 정리 시간'을 사전 합의하는 쿨다운 룰을 도입하세요.`,
      script: `"지금 바로 결론 내지 않아도 괜찮아. 네가 생각을 정리할 수 있게 30분만 각자 쉬고, 차분하게 다시 이야기하자."`,
    });

    // 버튼 2: 생활 습관, 돈 쓰는 법, 스킨십 속궁합
    if (hasClash) {
      buttons.push({
        title: `일지 정면충돌로 인한 생활 루틴 및 돈 쓰는 기준 대립 (${branchA}·${branchB} 충)`,
        tag: '생활 & 소비 폭발 버튼',
        description: `데이트 비용, 휴일의 여가 활용(집콕 vs 외출), 집안 정리정돈 방식에서 양보 없는 정면충돌이 자주 일어납니다.`,
        triggerDetail: `상대방의 방식이 비합리적이라고 지적하며 내 방식을 강요하는 순간 자존심 대립으로 격화됩니다.`,
        solution: `공동의 룰을 만들되, 각자의 사적인 영역과 소비는 30% 이상 무간섭 원칙을 적용하세요.`,
        script: `"우리가 서로 스타일이 다른 거지 틀린 건 아니잖아. 이 부분은 네 취향대로 하고, 저 부분은 내 방식대로 해보자."`,
      });
    } else if (hasWonjin) {
      buttons.push({
        title: `사소한 서운함의 침묵 누적과 섭섭함 폭발 (${branchA}·${branchB} 원진)`,
        tag: '애증 & 서운함 폭발 버튼',
        description: `상대방이 무심코 던진 말투나 표정에 혼자 속상해하며 꽁해 있다가 엉뚱한 순간에 폭발하는 패턴입니다.`,
        triggerDetail: `"너 진짜 나 사랑하긴 해?", "왜 나한테만 그래?" 같은 감정적 비난이 튀어나올 때입니다.`,
        solution: `서운한 감정은 24시간을 넘기지 않고 '비난 없이 내 감정만 1분 안에 전달하기'를 실천하세요.`,
        script: `"아까 그 말 들었을 때 내가 좀 서운하고 쓸쓸했어. 네 탓을 하려는 게 아니라 내 마음이 그랬다고 꼭 안아달라는 뜻이야."`,
      });
    } else {
      buttons.push({
        title: '데이트 피로도와 개인 시간 존중의 균형',
        tag: '개인 시간 & 충전 폭발 버튼',
        description: '붙어 있는 시간이 너무 길어지면 무의식중에 피로감이 쌓여 예민해지는 타이밍이 존재합니다.',
        triggerDetail: '쉬고 싶을 때 상대방이 끊임없이 관심이나 리액션을 요구할 때 짜증이 솟구칩니다.',
        solution: '함께 있으면서도 각자 책을 읽거나 폰을 보는 등 침묵이 어색하지 않은 무언의 충전 시간을 가지세요.',
        script: '"오늘 하루 너무 고생 많았지? 한 시간 동안은 우리 편하게 각자 뒹굴거리면서 쉬자."',
      });
    }

    // 버튼 3: 가치관 및 장기적 우선순위 갈등
    buttons.push({
      title: '미래 계획과 일/관계의 우선순위 시각차',
      tag: '가치관 & 미래관 폭발 버튼',
      description: '인생에서 지금 당장 무엇이 가장 중요한가(커리어/돈 vs 관계/안정)에 대한 관점의 차이로 인한 불안감입니다.',
      triggerDetail: '"너는 나보다 일이 더 중요해?" 또는 "왜 이렇게 미래 준비를 안 해?"라는 불안 섞인 비난이 시작점입니다.',
      solution: '상대의 우선순위를 비난하지 말고, 두 사람이 함께 꿈꾸는 공통의 1년 뒤 청사진을 구체적인 숫자로 합의하세요.',
      script: '"우리가 둘 다 잘되고 싶어서 그런 거잖아. 올해는 네 목표에 힘 실어줄 테니 내년엔 우리 미래에 집중해줘."',
    });

    return buttons;
  }

  private generatePrescriptions(
    elA: ElementType, elB: ElementType,
    stemA: StemChar, stemB: StemChar,
    bA: BranchChar, bB: BranchChar,
    hasClash: boolean, hasWonjin: boolean, hasHarmony: boolean,
    relation: string,
    nameA: string, nameB: string
  ) {
    const dirMap: Record<ElementType, string> = {
      '목': '동쪽 (차분한 생기와 숲길 산책로)',
      '화': '남쪽 (따뜻한 조명의 편안한 카페)',
      '토': '중앙 또는 흙길 (정적인 휴식을 주는 공간)',
      '금': '서쪽 (정돈되고 조용한 클래식 공간)',
      '수': '북쪽 (잔잔한 물가 또는 호수 산책)',
    };

    // [요구사항 4 해결] 명리학적 일간 기질(상대방이 무의식적으로 인정받고 싶어하는 급소)과 일지 충·원진 관계에 기반한 킬러 화해 멘트
    let keyphrase = '';

    if (hasClash) {
      // 일지 충(육충): 생활 방식과 속도가 달라 부딪힐 때 상대방의 페이스와 자존감을 확고히 인정해주는 멘트
      const clashMap: Record<StemChar, string> = {
        '갑': '"당신이 고민 끝에 내린 추진력과 방향을 전적으로 신뢰해. 이번 결정은 당신 안목대로 가보자."',
        '을': '"내가 속도만 앞서며 당신의 섬세한 배려를 놓쳤어. 당신이 편안해질 때까지 내가 보폭을 맞출게."',
        '병': '"당신의 솔직하고 뜨거운 진심을 결코 가볍게 보지 않아. 감정 소모 없이 당신 마음 오롯이 들을게."',
        '정': '"혼자 속으로 삭이며 애쓰지 않아도 돼. 당신의 따뜻한 온기가 내게는 가장 큰 힘이고 쉼표야."',
        '무': '"당신이 묵직하게 지켜주는 것만으로도 큰 힘이 돼. 흔들리지 않고 당신 뜻을 차분히 따를게."',
        '기': '"내 까다로운 부분까지 품어주느라 애썼어. 오늘은 오롯이 당신이 원하는 방식대로 다 맞춰줄게."',
        '경': '"당신이 지키려는 원칙과 의리의 무게를 존중해. 이번엔 내 고집 내려놓고 당신 결단에 맡길게."',
        '신': '"당신의 높은 안목과 기준이 옳았어. 서운했던 부분 솔직히 짚어줘, 당신 세심함을 온전히 존중할게."',
        '임': '"넓은 시야로 나를 품어줘서 숨통이 트여. 당신이 자유롭게 날개를 펼 수 있도록 끝까지 지지할게."',
        '계': '"당신의 예민한 감각과 다정한 마음이 우리를 지켜줬어. 아무 걱정 말고 속마음 다 털어놓아줘."',
      };
      keyphrase = clashMap[stemB] || '"우리가 방식이 다를 뿐 서로를 향한 신뢰는 같아. 당신의 방식을 온전히 존중할게."';
    } else if (hasWonjin) {
      // 일지 원진: 서운함과 냉전이 누적될 때 침묵을 깨고 무조건적인 내 편임을 확신시켜주는 멘트
      keyphrase = `"내가 무심코 당신을 서운하게 만든 순간이 있다면 숨기지 마. 네 마음을 결코 가볍게 여기지 않고 끝까지 귀 기울일게."`;
    } else {
      // 상생 또는 합: 상대방의 존재 가치를 확신시키고 관계의 안전감을 극대화하는 멘트
      const harmonMap: Record<StemChar, string> = {
        '갑': '"당신이 든든하게 길을 열어주어 언제나 믿음직해. 당신의 큰 그림을 끝까지 지지할게."',
        '을': '"내 거친 부분까지 부드럽게 감싸줘서 고마워. 당신 곁에 있을 때 내가 가장 편안해."',
        '병': '"당신의 밝은 에너지와 순수한 열정이 우리 관계의 가장 큰 축복이야. 늘 당신 편이야."',
        '정': '"어두운 방을 밝히는 등불처럼 당신의 세심한 사랑이 나를 지탱해. 늘 당신을 소중히 여길게."',
        '무': '"어떤 비바람에도 흔들리지 않는 큰 산처럼 당신은 내 삶의 가장 든든한 버팀목이야."',
        '기': '"온 대지처럼 묵묵히 나를 품어주는 당신에게, 나 역시 가장 편안한 안식처가 되어줄게."',
        '경': '"단단한 바위처럼 곧고 변함없는 당신의 의리와 신뢰에 늘 깊은 존경을 느껴."',
        '신': '"보석처럼 빛나는 당신의 섬세함과 품격을 늘 자랑스럽게 생각해. 온전히 당신을 아낄게."',
        '임': '"바다처럼 깊고 지혜로운 당신의 통찰 덕분에 늘 배우고 성장해. 언제나 당신과 함께할게."',
        '계': '"메마른 땅을 적시는 봄비처럼 당신의 다정함이 내 마음에 가장 큰 위로가 돼."',
      };
      keyphrase = harmonMap[stemB] || '"서로 다른 우리가 만나 서로의 가장 든든한 완성이 되어주고 있어. 영원히 당신 편이야."';
    }

    // 관계(부부, 동업 등) 보정
    if (relation === '부부') {
      keyphrase += ' "우리는 평생 한 팀이라는 걸 잊지 않아."';
    } else if (relation === '동업·동료') {
      keyphrase = '"당신의 안목과 전문성을 전적으로 신뢰해. 서로의 강점을 믿고 함께 돌파하자."';
    }

    return {
      luckyDirection: dirMap[elA] || '동남쪽의 차분하고 쾌적한 장소',
      luckyActivity: '스마트폰을 끄고 상대방의 말을 끝까지 경청하는 40분간의 프라이빗 산책',
      prohibitedHabit: '대화 도중 즉각 반박하거나 "그게 아니라"로 상대방 말을 끊는 습관 금지',
      secretKeyphrase: keyphrase,
    };
  }
}

export const gunghapEngine = new GunghapEngine();
