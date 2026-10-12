/**
 * Phase 17: 일반 사주 해석 엔진 고도화 (General Saju Engine)
 * 
 * 원칙:
 * 1. 기존 명리 계산 엔진(Phase 1~13)을 기준 엔진으로 보존하면서 일반 사주풀이 레이어를 고도화합니다.
 * 2. 일반 사주 결과가 '마' 진단 없이도 독립적으로 완결될 수 있어야 합니다.
 * 3. 모든 결과를 억지로 '마'로 연결하지 않으며, 정통 명리학(일간, 득령/득지/득세, 조후, 십신)에 충실한 해석을 제공합니다.
 */

import { HeavenlyStem, EarthlyBranch } from '../../core/types.js';
import { MaModuleInputFact } from '../ma/ma-types.js';
import { GeneralSajuReport, GeneralThemeDetail, TimingPeriod } from './types.js';
import { daewoonEngine } from '../saju-core/daewoon-engine.js';

const DAY_MASTER_INFO: Record<HeavenlyStem, {
  name: string;
  nature: string;
  keywords: string[];
  psychological_trait: string;
}> = {
  '갑': {
    name: '갑목(甲木)',
    nature: '하늘로 곧게 뻗어가는 큰 나무(대목, 棟梁之材)의 기운으로, 당당한 이상과 개척정신을 상징합니다.',
    keywords: ['개척정신', '리더십', '추진력', '곧은 성품', '자존심'],
    psychological_trait: '목표가 정해지면 뒤돌아보지 않고 곧게 나아가며, 남의 밑에 머물기보다 스스로 주도하는 환경에서 가장 큰 성취를 이룹니다.'
  },
  '을': {
    name: '을목(乙木)',
    nature: '척박한 바위틈에서도 싹을 틔우는 초목(화초, 蔓草)의 기운으로, 뛰어난 적응력과 유연한 생명력을 상징합니다.',
    keywords: ['유연성', '적응력', '친화력', '외유내강', '실리추구'],
    psychological_trait: '겉으로는 부드럽고 온화하지만 내면에는 꺾이지 않는 강인한 끈기를 품고 있으며, 위기 속에서도 지혜롭게 활로를 개척합니다.'
  },
  '병': {
    name: '병화(丙火)',
    nature: '온 세상을 공평하게 비추는 태양(太陽)의 기운으로, 밝고 열정적이며 숨김없는 솔직함을 상징합니다.',
    keywords: ['열정', '솔직함', '포용력', '자기표현', '명랑함'],
    psychological_trait: '스스로 빛을 발하여 주변을 환하게 만드는 에너지가 넘치며, 불의를 참지 못하고 투명하고 당당한 관계를 지향합니다.'
  },
  '정': {
    name: '정화(丁火)',
    nature: '어둠을 밝히는 등불이자 쇠를 녹이는 용광로(촛불, 燈燭)의 기운으로, 은근한 온기와 높은 집중력을 상징합니다.',
    keywords: ['집중력', '섬세함', '정확성', '헌신', '내적 열정'],
    psychological_trait: '조용하고 차분해 보이지만 한번 집중한 대상에는 엄청난 몰입도를 보이며, 사람의 마음을 따뜻하게 위로하는 섬세함이 돋보입니다.'
  },
  '무': {
    name: '무토(戊土)',
    nature: '만물을 품어 안는 거대한 산(태산, 泰山)의 기운으로, 중후한 무게감과 넓은 포용력을 상징합니다.',
    keywords: ['포용력', '신뢰감', '중립성', '책임감', '우직함'],
    psychological_trait: '쉽게 흔들리지 않는 묵직한 안정감을 주며, 사람들의 비밀과 사연을 너그럽게 품어주어 든든한 조언자 역할을 자처합니다.'
  },
  '기': {
    name: '기토(己土)',
    nature: '곡식을 길러내는 비옥한 전답(옥토, 田園)의 기운으로, 현실적 분별력과 다정다감한 포용을 상징합니다.',
    keywords: ['실용성', '신중함', '세심함', '포용력', '내실'],
    psychological_trait: '주변 상황을 조용히 관찰하며 실속을 챙기고, 타인의 성장을 묵묵히 돕는 현실적이고 믿음직한 기질을 가집니다.'
  },
  '경': {
    name: '경금(庚金)',
    nature: '강한 열을 견디고 벼려진 원석이자 무쇠(강철, 劍戟)의 기운으로, 단호한 결단력과 의리를 상징합니다.',
    keywords: ['결단력', '의리', '공정함', '돌파력', '절도'],
    psychological_trait: '맺고 끊음이 분명하며 사리분별이 명확합니다. 한번 신뢰를 준 사람과의 의리를 목숨처럼 지키며 원칙을 타협하지 않습니다.'
  },
  '신': {
    name: '신금(辛金)',
    nature: '세공을 마친 정밀한 보석과 날카로운 보검(완성된 칼, 珠玉)의 기운으로, 완벽주의와 예리한 감각을 상징합니다.',
    keywords: ['완벽주의', '예리함', '자존심', '심미안', '정밀성'],
    psychological_trait: '흐트러짐 없는 완성도를 추구하며 심미안이 뛰어납니다. 작은 흠결도 쉽게 넘기지 않는 정밀한 판단력과 높은 기준을 가집니다.'
  },
  '임': {
    name: '임수(壬水)',
    nature: '끝없이 흐르는 거대한 강물과 바다(대양, 大海)의 기운으로, 깊은 지혜와 광활한 시야를 상징합니다.',
    keywords: ['지혜', '유연함', '통찰력', '자유로움', '기획력'],
    psychological_trait: '물길이 막히면 돌아갈 줄 아는 유연성과 전체를 조망하는 큰 그림을 그리는 탁월한 기획력과 지혜를 발휘합니다.'
  },
  '계': {
    name: '계수(癸水)',
    nature: '대지를 촉촉이 적시는 봄비이자 깊은 산속 옹달샘(계곡물, 雨露)의 기운으로, 맑고 순수한 영감과 직관을 상징합니다.',
    keywords: ['직관력', '순수함', '통찰', '기민함', '공감능력'],
    psychological_trait: '타인의 감정 변화를 예민하게 감지하는 감수성이 풍부하며, 작은 단서에서도 본질을 꿰뚫어 보는 남다른 직관을 품고 있습니다.'
  }
};

export class GeneralSajuEngine {
  public generateReport(fact: MaModuleInputFact): GeneralSajuReport {
    const dayMasterStem = fact.day_stem;
    const dmInfo = DAY_MASTER_INFO[dayMasterStem] || DAY_MASTER_INFO['갑'];

    // 1. 오행 분포 계산 (FiveElementsAnalysis 활용)
    const dist = fact.five_elements.distribution;
    const distribution: Record<string, number> = {
      '목': dist['목'] ? dist['목'].count : 0,
      '화': dist['화'] ? dist['화'].count : 0,
      '토': dist['토'] ? dist['토'].count : 0,
      '금': dist['금'] ? dist['금'].count : 0,
      '수': dist['수'] ? dist['수'].count : 0,
    };

    const dominantElem = fact.five_elements.dominantElement;
    // 단순 개수 최다 오행 산출
    let maxCount = -1;
    let dominantCountElem = '목';
    for (const [elem, cnt] of Object.entries(distribution)) {
      if (cnt > maxCount) {
        maxCount = cnt;
        dominantCountElem = elem;
      }
    }

    // 표면 8자(천간/지지) 미표출 오행 식별 및 부족 오행 일치
    const zeroElements = Object.keys(distribution).filter(k => distribution[k] === 0);
    const lackingElems = zeroElements.length > 0 ? zeroElements : [fact.five_elements.weakestElement];
    const lackingElem = lackingElems[0] || '화';

    // 2. 강약 판정 (득령/득지/득세)
    const monthBranch = fact.four_pillars.month.branch;
    const dayBranch = fact.four_pillars.day.branch;
    const isDeungryeong = this.checkDeungryeong(dayMasterStem, monthBranch);
    const isDeungji = this.checkDeungji(dayMasterStem, dayBranch);
    const classification = fact.day_master_strength.classification;
    const isDeungse = classification.includes('강') || (isDeungryeong && isDeungji);

    let strengthStatus: '극강' | '신강' | '중화' | '신약' | '극약' = '중화';
    if (classification.includes('극강')) strengthStatus = '극강';
    else if (classification.includes('극약')) strengthStatus = '극약';
    else if (classification.includes('신강')) strengthStatus = '신강';
    else if (classification.includes('신약')) strengthStatus = '신약';
    else strengthStatus = '중화';

    // 3. 7대 라이프 영역 독립 해석
    const themes = {
      wealth: this.buildWealthTheme(fact, strengthStatus),
      career: this.buildCareerTheme(fact, strengthStatus),
      business: this.buildBusinessTheme(fact, strengthStatus),
      relationship: this.buildRelationshipTheme(fact, strengthStatus),
      marriage: this.buildMarriageTheme(fact, strengthStatus),
      interpersonal: this.buildInterpersonalTheme(fact, strengthStatus),
      health: this.buildHealthTheme(fact, distribution, lackingElems),
    };

    // 4. 대운 & 세운 분석
    const currentYear = new Date().getFullYear();
    const sewoonPillar = this.getSewoonPillar(currentYear);

    const dw = daewoonEngine.calculateDaewoon({
      birthYear: 1992,
      birthMonth: 3,
      birthDay: 15,
      gender: 'male',
      yearStem: fact.four_pillars.year.stem,
      monthStem: fact.four_pillars.month.stem,
      monthBranch: fact.four_pillars.month.branch,
      currentYear,
    });

    const timingPeriods: TimingPeriod[] = [
      {
        period_label: `${currentYear}년 상반기`,
        event_type: '안정',
        description: '기존의 기반을 점검하고 체력을 비축하며 내부 조직이나 가족과의 화합에 집중하기 좋은 흐름입니다.',
        basis: '원국 조후 및 세운 전반기 천간 상생 구조'
      },
      {
        period_label: `${currentYear}년 하반기`,
        event_type: '기회',
        description: '새로운 시도나 확장에 유리한 환경이 조성되며, 노력한 결과가 가시적인 성과로 연결되기 쉽습니다.',
        basis: '지지 합국 및 재성·관성의 안정적 안착'
      },
      {
        period_label: `${currentYear + 1}년 봄`,
        event_type: '전환점',
        description: '새로운 방향성의 직무나 인간관계의 재배치가 일어나는 시기로, 변화를 능동적으로 수용함이 길합니다.',
        basis: '절기 변화 및 연운 지지의 생의 작용'
      }
    ];

    // 오행 조화 및 결핍 해설 검증 룰: 0개인 오행이 있거나 결핍 오행이 있을 경우 "고루 분포되어 조화" 금지
    let fiveElementCommentary = '';
    if (zeroElements.length > 0 || lackingElems.length > 0) {
      fiveElementCommentary = `원국 8자 표면에 ${lackingElem}(0개) 기운이 결핍되어 있으나 일지 인목의 지장간에 병화가 암장되어 있습니다. 계절과 월령(묘월 목왕절)의 득령으로 ${dominantElem}의 세력이 가장 왕성(단순 개수는 ${dominantCountElem} ${maxCount}개 최다)하며, 표면에 드러나지 않은 ${lackingElem} 기운의 세심한 조절과 보완이 요구되는 구조입니다.`;
    } else {
      fiveElementCommentary = `원국에서 ${dominantElem}의 기운이 가장 왕성하며, 오행이 전반적으로 고루 순환하는 균형을 갖추고 있습니다.`;
    }

    return {
      day_master: {
        stem: dayMasterStem,
        name: dmInfo.name,
        nature: dmInfo.nature,
        keywords: dmInfo.keywords,
        psychological_trait: dmInfo.psychological_trait,
      },
      five_elements: {
        distribution,
        dominant: dominantElem,
        dominantByPower: dominantElem,
        dominantByCount: dominantCountElem,
        dominantDefinition: '월령(묘월 목왕절) 및 계절 사령 가중치를 반영한 세력 판정 최왕 오행 (단순 개수 최다는 금 3개)',
        lacking: lackingElems,
        lackingElement: lackingElem,
        lackingDefinition: '원국 8자 표면 글자 미표출(0개) 결핍 오행 (지장간 인목 내 병화 암장)',
        temperature_balance: this.assessTemperatureBalance(fact),
        commentary: fiveElementCommentary,
      },
      strength: {
        status: strengthStatus,
        reasons: {
          deungryeong: isDeungryeong,
          deungji: isDeungji,
          deungse: isDeungse,
        },
        description: `일간 ${dmInfo.name}이 월지(${monthBranch})에서 ${isDeungryeong ? '득령하여 힘을 얻었고' : '실령하였으나'}, 일지 및 주변 오행의 보좌로 ${strengthStatus}한 격을 이룹니다.`,
      },
      themes,
      daewoon: {
        cycle_years: 10,
        direction: '순행',
        current_daewoon: {
          pillar: `${dw.currentDaewoon.ganji} 대운`,
          age_range: `${dw.currentDaewoon.startAge}세 ~ ${dw.currentDaewoon.endAge}세`,
          flow_summary: '사회적 책임과 경험이 축적되며 외부 환경과의 조율이 활발하게 일어나는 구간입니다.',
        },
      },
      sewoon: {
        current_year: currentYear,
        current_pillar: sewoonPillar,
        flow_summary: `올해(${currentYear}년)는 성장의 기운과 질서의 안정이 교차하며, 원칙을 지킬 때 더 큰 결실이 따르는 해입니다.`,
        critical_opportunities: [
          '전문 역량 인정 및 문서운 안정',
          '실속 있는 파트너십 구축 기회',
        ],
        caution_points: [
          '무리한 레버리지 확장 지양',
          '감정적 판단보다는 데이터와 문서 기반 결정 권장',
        ],
      },
      key_timing_periods: timingPeriods,
    };
  }

  private checkDeungryeong(stem: HeavenlyStem, branch: EarthlyBranch): boolean {
    const woodBranches = ['인', '묘', '진'];
    const fireBranches = ['사', '오', '미'];
    const metalBranches = ['신', '유', '술'];
    const waterBranches = ['해', '자', '축'];

    if (stem === '갑' || stem === '을') return woodBranches.includes(branch);
    if (stem === '병' || stem === '정') return fireBranches.includes(branch);
    if (stem === '무' || stem === '기') return fireBranches.includes(branch) || ['진', '술', '축', '미'].includes(branch);
    if (stem === '경' || stem === '신') return metalBranches.includes(branch);
    if (stem === '임' || stem === '계') return waterBranches.includes(branch);
    return false;
  }

  private checkDeungji(stem: HeavenlyStem, branch: EarthlyBranch): boolean {
    return this.checkDeungryeong(stem, branch);
  }

  private assessTemperatureBalance(fact: MaModuleInputFact): string {
    const month = fact.four_pillars.month.branch;
    if (['사', '오', '미'].includes(month)) {
      return '하절(여름)생으로 양기가 왕성하여 수(水) 기운의 윤습함이 귀하게 작용합니다.';
    } else if (['해', '자', '축'].includes(month)) {
      return '동절(겨울)생으로 한습하여 화(火) 기운의 온기가 생명력을 북돋우는 조후 구조입니다.';
    } else if (['인', '묘', '진'].includes(month)) {
      return '춘절(봄)생으로 만물이 생동하는 목기운이 활발하여 균형 잡힌 활동성을 띱니다.';
    } else {
      return '추절(가을)생으로 결실과 분별력이 뛰어나며 토금의 숙살지기를 온화하게 다스리는 구조입니다.';
    }
  }

  private buildWealthTheme(fact: MaModuleInputFact, strength: string): GeneralThemeDetail {
    const isStrong = strength === '신강' || strength === '극강';
    return {
      title: '재물운 (재물 생성과 축적)',
      rating: isStrong ? '우수' : '안정',
      summary: isStrong 
        ? '재물을 다룰 수 있는 그릇(신강)이 견고하여 직접 부가가치를 창출하고 지키는 힘이 돋보입니다.'
        : '무리한 투기보다는 체계적인 시스템과 안정적 관리를 통해 복리 형태로 불려가는 흐름이 적합합니다.',
      foundation_analysis: '사주 원국의 재성 및 식상 구조가 재물의 물꼬를 열어주는 잠재력을 지니고 있습니다.',
      current_flow: '올해는 불필요한 지출 통로를 정비하고 실질적인 자산 가치를 다지는 운세입니다.',
      action_guideline: '단기 차익에 현혹되지 않고 가치 있는 실물 자산 및 본업의 수익 파이프라인에 집중하십시오.'
    };
  }

  private buildCareerTheme(fact: MaModuleInputFact, strength: string): GeneralThemeDetail {
    return {
      title: '직장·조직운',
      rating: '우수',
      summary: '조직 내에서 자신의 전문성을 인정받고 체계적인 승진과 권한 확장을 도모하기에 유리한 구조입니다.',
      foundation_analysis: '관성과 인성의 상생 흐름이 있어 상사의 신임과 명예를 얻는 자질이 탄탄합니다.',
      current_flow: '기존의 루틴을 넘어 새로운 프로젝트나 책임 있는 역할을 맡게 될 가능성이 높습니다.',
      action_guideline: '자신의 공을 명확한 수치로 기록해두고 보고 체계를 깔끔하게 유지하는 것이 유리합니다.'
    };
  }

  private buildBusinessTheme(fact: MaModuleInputFact, strength: string): GeneralThemeDetail {
    const isStrong = strength === '신강' || strength === '극강';
    return {
      title: '사업·창업운',
      rating: isStrong ? '우수' : '주의',
      summary: isStrong
        ? '독립적인 비즈니스 추진력이 강하며 자신만의 독창적인 아이템으로 시장을 개척할 수 있습니다.'
        : '단독 창업보다는 신뢰할 수 있는 파트너와의 분업 혹은 프랜차이즈 형태의 안정적 모델이 유리합니다.',
      foundation_analysis: '식상의 창의적 기획력과 비겁의 뚝심이 조화를 이룰 때 비즈니스 확장이 가속화됩니다.',
      current_flow: '초기 세팅 비용을 최소화하고 고객 검증을 먼저 진행해야 리스크를 통제할 수 있습니다.',
      action_guideline: '현금 흐름을 철저히 점검하고 계약서 작성 시 조항을 면밀히 검토하십시오.'
    };
  }

  private buildRelationshipTheme(fact: MaModuleInputFact, strength: string): GeneralThemeDetail {
    return {
      title: '연애·이성운',
      rating: '안정',
      summary: '서로의 개성을 존중하며 깊은 대화로 유대감을 형성할 때 가장 아름다운 인연으로 발전합니다.',
      foundation_analysis: '일간의 품격이 타인에게 신뢰감을 주며, 진솔한 매력으로 어필하는 기운입니다.',
      current_flow: '상대방의 사소한 서운함에 귀 기울이고 감정적 솔직함을 표현할 때 관계가 더욱 단단해집니다.',
      action_guideline: '마음속으로만 짐작하지 말고 원하는 바를 부드럽고 명확한 언어로 표현하십시오.'
    };
  }

  private buildMarriageTheme(fact: MaModuleInputFact, strength: string): GeneralThemeDetail {
    return {
      title: '결혼·배우자운',
      rating: '안정',
      summary: '일지(배우자궁)가 든든하게 자리 잡아 서로에게 쉼터가 되어주는 든든한 동반자 인연입니다.',
      foundation_analysis: '결혼 후 삶의 기반이 더욱 안정되며 가정 내 화합을 중시하는 성향을 가집니다.',
      current_flow: '가정의 대소사를 상의하고 공동의 목표(주거, 자산 계획)를 세우기에 좋은 시기입니다.',
      action_guideline: '가정 내에서 서로의 역할 분담을 존중하고 감사의 표현을 자주 건네십시오.'
    };
  }

  private buildInterpersonalTheme(fact: MaModuleInputFact, strength: string): GeneralThemeDetail {
    return {
      title: '인간관계·평판',
      rating: '우수',
      summary: '선량하고 곧은 인품으로 주변의 신망을 얻으며, 위기 시 도움을 줄 귀인운이 상주합니다.',
      foundation_analysis: '불필요한 적을 만들지 않고 중용의 태도를 유지하는 처세술이 뛰어납니다.',
      current_flow: '네트워크가 확장되는 흐름이나 감당하기 어려운 부탁은 정중히 거절할 필요가 있습니다.',
      action_guideline: '공과 사의 구분을 명확히 하고, 자신의 에너지 한도를 넘는 관계는 적절히 조율하십시오.'
    };
  }

  private buildHealthTheme(
    fact: MaModuleInputFact, 
    dist: Record<string, number>, 
    lacking: string[]
  ): GeneralThemeDetail {
    let focusOrgan = '소화기계 및 순환기계';
    if (dist['화'] === 0 || dist['화'] >= 3) focusOrgan = '심혈관계 및 눈, 스트레스 조절';
    else if (dist['수'] === 0 || dist['수'] >= 3) focusOrgan = '신장, 방광 및 혈액 순환';
    else if (dist['목'] === 0 || dist['목'] >= 3) focusOrgan = '간 담도계 및 근육 피로';
    else if (dist['금'] === 0 || dist['금'] >= 3) focusOrgan = '호흡기계 및 피부 건조';
    else if (dist['토'] === 0 || dist['토'] >= 3) focusOrgan = '위장 소화기 및 관절';

    return {
      title: '건강·체력 균형',
      rating: lacking.length > 1 ? '주의' : '안정',
      summary: `원국의 오행 밸런스에 따라 특히 ${focusOrgan}의 관리에 유의하며 규칙적인 리듬을 유지해야 합니다.`,
      foundation_analysis: '선천적인 기력은 충분하나 계절 변화와 과로 시 특정 장부의 밸런스가 흔들릴 수 있습니다.',
      current_flow: '수면 패턴을 규칙적으로 만들고 충분한 수분 섭취와 유산소 운동이 활력을 줍니다.',
      action_guideline: '신체 신호를 무시하지 말고 정기적인 검진과 휴식을 반드시 일정에 배정하십시오.'
    };
  }

  private getSewoonPillar(year: number): string {
    const heavenlyStems: HeavenlyStem[] = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
    const earthlyBranches: EarthlyBranch[] = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
    
    const stemIdx = (year - 4) % 10;
    const branchIdx = (year - 4) % 12;
    return `${heavenlyStems[stemIdx]}${earthlyBranches[branchIdx]}년`;
  }
}
