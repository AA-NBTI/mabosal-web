/**
 * saju-dynamic-analyzer.ts
 * 
 * 임의의 사주 정보(간지 텍스트 또는 생년월일시)로부터
 * 일간, 오행 분포, 십신, 강약, 격국, 용신, 원국 내 합충을 100% 동적으로 계산하는 엔진.
 */

import { HeavenlyStem, EarthlyBranch, FourPillars } from '../../core/types.js';
import { 
  calculateCanonicalStrength, 
  classifyGeokguk, 
  PURE_HIDDEN_STEMS,
  MYEONGLI_RULE_VERSIONS 
} from '../../core/myeongli-rule-spec.js';
import { BranchClashEngine } from '../relationship/branch-clash.js';
import { 
  BranchSixHarmonyEngine, 
  BranchTripleHarmonyEngine, 
  BranchSemiHarmonyEngine 
} from '../relationship/branch-harmony.js';
import { BranchPunishmentEngine } from '../relationship/branch-punishment.js';
import { 
  BranchDestructionEngine, 
  BranchHarmEngine, 
  BranchWonjinEngine 
} from '../relationship/branch-harm-destruction.js';


export interface DynamicOhaengDistribution {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

export interface DynamicSajuAnalysis {
  fourPillars: {
    year: { stem: string; branch: string; ganji: string };
    month: { stem: string; branch: string; ganji: string };
    day: { stem: string; branch: string; ganji: string };
    hour: { stem: string; branch: string; ganji: string };
  };
  dayMaster: {
    stem: string;
    element: '목' | '화' | '토' | '금' | '수';
    yinYang: '양' | '음';
    name: string;
    nature: string;
    characteristics: string;
    careerGuidance: string;
    wealthGuidance: string;
    relationshipGuidance: string;
  };
  ohaeng: {
    distribution: DynamicOhaengDistribution;
    dominant: '목' | '화' | '토' | '금' | '수';
    dominantKorean: string;
    lacking: ('목' | '화' | '토' | '금' | '수')[];
    lackingKorean: string;
    commentary: string;
  };
  strength: {
    status: '극강' | '신강' | '중화신강' | '중화' | '중화신약' | '신약' | '극약';
    score: number;
    deungryeong: boolean; // 득령 (월지)
    deungji: boolean;    // 득지 (일지)
    deungse: boolean;    // 득세 (기타 세력)
    deungryeongScore: number;
    deungJiScore: number;
    deungSeScore: number;
    description: string;
    calculationBasis: string;
  };
  geokguk: {
    name: string;
    basis: string;
    condition: string;
    description: string;
  };
  tenGods: {
    counts: Record<'비겁' | '식상' | '재성' | '관성' | '인성', number>; // 표면 8자 기준
    surfaceCounts8: Record<'비겁' | '식상' | '재성' | '관성' | '인성', number>;
    hiddenCounts: Record<'비겁' | '식상' | '재성' | '관성' | '인성', number>;
    dominant: string[];
    lacking: string[];
    summary: string;
  };
  yongshin: {
    ruleId: string;
    primary: '목' | '화' | '토' | '금' | '수';
    secondary: '목' | '화' | '토' | '금' | '수';
    tertiary?: '목' | '화' | '토' | '금' | '수';
    eokbu: {
      ruleId: string;
      primary: '목' | '화' | '토' | '금' | '수';
      secondary: '목' | '화' | '토' | '금' | '수';
      tertiary?: '목' | '화' | '토' | '금' | '수';
      reason: string;
    };
    johu: {
      ruleId: string;
      season: string;
      primary: '목' | '화' | '토' | '금' | '수' | '중화';
      secondary?: '목' | '화' | '토' | '금' | '수';
      tertiary?: '목' | '화' | '토' | '금' | '수';
      reason: string;
      luckNote: string;
    };
    reason: string;
  };
  clashesAndHarmonies: {
    clashes: string[];
    harmonies: string[];
    tripleHarmonies: string[];
    semiHarmonies: string[];
    punishments: string[]; // 형(刑)
    destructions: string[]; // 파(破)
    harms: string[];        // 해(害)
    wonjin: string[];       // 원진(怨嗔)
    relationsSummary: string;
  };

}

const STEM_INFO: Record<string, { element: '목' | '화' | '토' | '금' | '수'; yinYang: '양' | '음'; name: string; nature: string; char: string; career: string; wealth: string; rel: string }> = {
  '갑': {
    element: '목',
    yinYang: '양',
    name: '갑목(甲木)',
    nature: '우뚝 솟은 큰 나무나 거목',
    char: '강직하고 진취적이며 개척자적 리더십을 갖추고 있습니다. 굽히지 않는 자존심과 꿋꿋한 기상을 지닙니다.',
    career: '기획, 경영, 연구개발, 전문직, 독립 사업 등 스스로 영역을 개척하는 분야에 강점이 있습니다.',
    wealth: '스스로의 힘으로 터를 닦아 점진적으로 부를 축적하는 자수성가형 재복입니다.',
    rel: '솔직하고 주도적인 관계를 선호하며, 한번 믿음을 주면 의리를 다하는 듬직한 동반자가 됩니다.'
  },
  '을': {
    element: '목',
    yinYang: '음',
    name: '을목(乙木)',
    nature: '바람에 유연하게 흔들리면서도 끈질기게 생명력을 이어가는 화초나 넝쿨',
    char: '적응력과 친화력이 뛰어나며 현실 감각이 탁월합니다. 유연하고 부드러우면서도 내면의 생존력이 대단합니다.',
    career: '교육, 어학, 디자인, 마케팅, 서비스, 네트워크 기반 비즈니스에서 탁월한 수완을 발휘합니다.',
    wealth: '환경 변화에 발맞추어 유연하게 재물을 융통하고 알뜰하게 실속을 챙기는 재복입니다.',
    rel: '다정다감하고 배려심이 깊으며, 상대방의 감정을 섬세하게 헤아릴 줄 아는 온화한 동반자입니다.'
  },
  '병': {
    element: '화',
    yinYang: '양',
    name: '병화(丙火)',
    nature: '세상을 환하게 비추는 태양',
    char: '열정적이고 솔직담백하며 매사에 적극적입니다. 뒤끝이 없고 대범하며 주위를 밝히는 에너지를 지닙니다.',
    career: '방송, 언론, 홍보, IT, 무역, 예술 등 대중 앞에 서거나 영향력을 전파하는 분야에 적합합니다.',
    wealth: '스케일이 크고 추진력이 강하여 기회를 포착하는 감각이 뛰어나나 지출 관리도 중요합니다.',
    rel: '화끈하고 열정적인 사랑을 하며, 감정을 숨기지 않고 진심을 숨김없이 표현합니다.'
  },
  '정': {
    element: '화',
    yinYang: '음',
    name: '정화(丁火)',
    nature: '어둠을 밝히는 은은한 등불이자 만물을 제련하는 모닥불',
    char: '섬세하고 예의 바르며 내면의 집중력과 온기를 품고 있습니다. 통찰력이 깊고 조용한 끈기를 발휘합니다.',
    career: '전문 연구, 정밀 기술, 금융/회계, 상담, 기획, 학문 등 디테일과 깊이가 요구되는 분야에 능합니다.',
    wealth: '한 걸음씩 계획적으로 재물을 모으고 불필요한 낭비를 줄이는 안정적인 재복입니다.',
    rel: '깊은 정과 배려로 상대를 묵묵히 지켜주며, 시간이 흐를수록 신뢰가 두터워지는 관계를 만듭니다.'
  },
  '무': {
    element: '토',
    yinYang: '양',
    name: '무토(戊土)',
    nature: '웅장한 산맥이나 드넓은 대지',
    char: '포용력이 넓고 묵직하며 신용을 목숨처럼 여깁니다. 사소한 일에 동요하지 않는 든든한 신뢰감을 줍니다.',
    career: '부동산, 건설, 공공기관, 금융, 자산관리, 총괄 관리자 등 중심을 잡고 운영하는 직무에 적합합니다.',
    wealth: '기반을 튼튼히 닦아 큰 규모의 자산을 안정적으로 유지하고 운용하는 대기만성형 재복입니다.',
    rel: '듬직하고 변함없는 모습으로 상대에게 안정감을 주며, 믿음직스러운 버팀목이 되어줍니다.'
  },
  '기': {
    element: '토',
    yinYang: '음',
    name: '기토(己土)',
    nature: '곡식을 길러내는 비옥한 전원 흙',
    char: '온화하고 실용적이며 수용성이 뛰어납니다. 타인을 잘 품어주고 다재다능하며 내실을 중시합니다.',
    career: '행정, 인사, 교육, 복지, 중개, 유통 등 사람과 자원을 조화롭게 연결하는 영역에 강합니다.',
    wealth: '무리한 투기를 지양하고 꾸준한 수익원을 다각화하여 알차게 모으는 알부자형 재복입니다.',
    rel: '따뜻하고 정성스러운 태도로 상대를 챙기며 가정적이고 평화로운 안식처를 지향합니다.'
  },
  '경': {
    element: '금',
    yinYang: '양',
    name: '경금(庚金)',
    nature: '단단한 원석이나 거대한 강철, 바위',
    char: '결단력이 있고 의리가 두터우며 맺고 끊음이 확실합니다. 옳지 못한 일에 타협하지 않는 뚝심이 있습니다.',
    career: '사법, 군경, 금융, 제조업, 기술 엔지니어링, 결단과 원칙이 필요한 전문 직무에 최적입니다.',
    wealth: '목표를 정하면 저돌적인 실행력으로 결실을 맺으며, 큰 판을 짜서 승부하는 기질이 있습니다.',
    rel: '담백하고 솔직한 소통을 중시하며, 말보다는 행동으로 묵직한 신뢰를 보여주는 스타일입니다.'
  },
  '신': {
    element: '금',
    yinYang: '음',
    name: '신금(辛金)',
    nature: '정밀하게 세공된 보석이자 예리한 칼날',
    char: '자존심이 높고 감각이 매우 섬세하며 완벽을 추구합니다. 총명하고 세련되며 시비분별이 정확합니다.',
    career: '정밀 의료, IT 소프트웨어, 법률, 디자인, 보석/귀금속, 전문 감사 등 고도의 정밀 분야에 능합니다.',
    wealth: '가치 있는 곳에 정확하게 집중 투자하며 실속 없이 흩어지는 낭비를 엄격히 방어합니다.',
    rel: '눈높이가 높고 섬세한 교감을 중시하며, 서로의 품격과 영역을 존중해 줄 때 깊은 사랑을 나눕니다.'
  },
  '임': {
    element: '수',
    yinYang: '양',
    name: '임수(壬水)',
    nature: '도도하게 흐르는 거대한 바다와 큰 강',
    char: '도량이 넓고 지혜로우며 융통성이 탁월합니다. 어떤 그릇에도 담길 수 있는 유연함과 큰 포부를 품습니다.',
    career: '무역, 물류, 해운, 외교, 기획, 투자, 대형 프로젝트 운영 등 글로벌하고 역동적인 무대에 맞습니다.',
    wealth: '자금의 흐름을 읽는 혜안이 탁월하여 자본의 순환을 통해 큰 부를 일구는 스케일이 있습니다.',
    rel: '자유롭고 넓은 마음으로 상대를 품어주며, 속박하기보다는 존중과 신뢰의 연대를 지향합니다.'
  },
  '계': {
    element: '수',
    yinYang: '음',
    name: '계수(癸水)',
    nature: '만물을 적셔주는 봄비이자 맑은 옹달샘, 이슬',
    char: '총명하고 직관력이 뛰어나며 배려심과 감수성이 풍부합니다. 조용하지만 깊이 있게 침투하는 지혜가 있습니다.',
    career: '학술, 연구, 심리, 예술, 종교/철학, 컨설팅 등 정신적 가치와 영감을 다루는 분야에 탁월합니다.',
    wealth: '티끌 모아 태산을 이루듯 꼼꼼하게 관리하며 지혜와 지식으로 부가가치를 창출합니다.',
    rel: '다정하고 깊은 공감 능력을 발휘하며, 정서적 유대감과 정신적 교감을 나누는 사랑을 추구합니다.'
  }
};

const BRANCH_ELEM: Record<string, '목' | '화' | '토' | '금' | '수'> = {
  '인': '목', '묘': '목',
  '사': '화', '오': '화',
  '진': '토', '술': '토', '축': '토', '미': '토',
  '신': '금', '유': '금',
  '해': '수', '자': '수'
};

const STEM_ELEM: Record<string, '목' | '화' | '토' | '금' | '수'> = {
  '갑': '목', '을': '목',
  '병': '화', '정': '화',
  '무': '토', '기': '토',
  '경': '금', '신': '금',
  '임': '수', '계': '수'
};

export class SajuDynamicAnalyzer {
  public static analyze(fourPillarsText: string): DynamicSajuAnalysis {
    const rawTokens = fourPillarsText.trim().split(/\s+/);
    // 기본 파싱: '임신 계묘 경인 경진' 형태
    const yearStr = rawTokens[0] || '임신';
    const monthStr = rawTokens[1] || '계묘';
    const dayStr = rawTokens[2] || '경인';
    const hourStr = rawTokens[3] || '경진';

    const pYear = { stem: yearStr[0] || '임', branch: yearStr[1] || '신', ganji: yearStr };
    const pMonth = { stem: monthStr[0] || '계', branch: monthStr[1] || '묘', ganji: monthStr };
    const pDay = { stem: dayStr[0] || '경', branch: dayStr[1] || '인', ganji: dayStr };
    const pHour = { stem: hourStr[0] || '경', branch: hourStr[1] || '진', ganji: hourStr };

    const dayStem = pDay.stem;
    const stemMeta = STEM_INFO[dayStem] || STEM_INFO['경'];

    // 1. 오행 분포 계산 (8자 전체)
    const dist: DynamicOhaengDistribution = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    const allStems = [pYear.stem, pMonth.stem, pDay.stem, pHour.stem];
    const allBranches = [pYear.branch, pMonth.branch, pDay.branch, pHour.branch];

    for (const s of allStems) {
      const e = STEM_ELEM[s];
      if (e === '목') dist.wood++;
      else if (e === '화') dist.fire++;
      else if (e === '토') dist.earth++;
      else if (e === '금') dist.metal++;
      else if (e === '수') dist.water++;
    }

    for (const b of allBranches) {
      const e = BRANCH_ELEM[b];
      if (e === '목') dist.wood++;
      else if (e === '화') dist.fire++;
      else if (e === '토') dist.earth++;
      else if (e === '금') dist.metal++;
      else if (e === '수') dist.water++;
    }

    // 주도 오행 & 부족 오행 판정
    const entries: [('목' | '화' | '토' | '금' | '수'), number][] = [
      ['목', dist.wood],
      ['화', dist.fire],
      ['토', dist.earth],
      ['금', dist.metal],
      ['수', dist.water],
    ];

    entries.sort((a, b) => b[1] - a[1]);
    const dominant = entries[0][0];
    const lacking = entries.filter(e => e[1] === 0).map(e => e[0]);
    if (lacking.length === 0) {
      lacking.push(entries[entries.length - 1][0]);
    }

    const elemK: Record<string, string> = { '목': '목(木)', '화': '화(火)', '토': '토(土)', '금': '금(金)', '수': '수(水)' };

    // 2. 신강 / 신약 판정 (마보살 정량화 모델 단일 모듈 연동: 득령 40%, 득지 30%, 득세 30%)
    const otherStems = [pYear.stem as HeavenlyStem, pMonth.stem as HeavenlyStem, pHour.stem as HeavenlyStem];
    const otherBranches = [pYear.branch as EarthlyBranch, pHour.branch as EarthlyBranch];
    const canonicalStrength = calculateCanonicalStrength(
      dayStem as HeavenlyStem,
      pMonth.branch as EarthlyBranch,
      pDay.branch as EarthlyBranch,
      otherStems,
      otherBranches
    );

    const deungryeongScore = canonicalStrength.deungryeongScore;
    const deungJiScore = canonicalStrength.deungJiScore;
    const deungSeScore = canonicalStrength.deungSeScore;
    const deungryeong = canonicalStrength.deungryeong;
    const deungji = canonicalStrength.deungji;
    const deungse = canonicalStrength.deungse;
    const score = canonicalStrength.score;
    const status = canonicalStrength.status;
    const calculationBasis = canonicalStrength.calculationBasis;
    const strengthDesc = canonicalStrength.description;

    // 3. 격국 판정 (월령 본기 십대격 정통 분류 단일 모듈 연동)
    const openStems = [pYear.stem as HeavenlyStem, pMonth.stem as HeavenlyStem, pHour.stem as HeavenlyStem];
    const canonicalGeokguk = classifyGeokguk(
      dayStem as HeavenlyStem,
      pMonth.branch as EarthlyBranch,
      openStems
    );
    const geokgukName = canonicalGeokguk.name;
    const geokgukCondition = canonicalGeokguk.condition;
    const geokgukDesc = canonicalGeokguk.description;

    // 4. 용신 판정 (억부와 조후 완전 분리 및 V1 규칙 태깅)
    let eokbuPrimary: '목' | '화' | '토' | '금' | '수' = '토';
    let eokbuSecondary: '목' | '화' | '토' | '금' | '수' = '금';
    let eokbuTertiary: '목' | '화' | '토' | '금' | '수' = '수'; // 기신
    let eokbuReason = '';

    const myElem = stemMeta.element;
    if (status === '신강' || status === '극강' || status === '중화신강') {
      if (myElem === '금') { eokbuPrimary = '화'; eokbuSecondary = '수'; eokbuTertiary = '토'; }
      else if (myElem === '목') { eokbuPrimary = '화'; eokbuSecondary = '금'; eokbuTertiary = '수'; }
      else if (myElem === '화') { eokbuPrimary = '토'; eokbuSecondary = '금'; eokbuTertiary = '목'; }
      else if (myElem === '토') { eokbuPrimary = '금'; eokbuSecondary = '수'; eokbuTertiary = '화'; }
      else { eokbuPrimary = '목'; eokbuSecondary = '화'; eokbuTertiary = '금'; }
      eokbuReason = `신강한 일간의 기운을 조율하기 위해 극제하는 관성 또는 설기하는 식상을 억부 용신으로 삼습니다.`;
    } else {
      if (myElem === '금') { eokbuPrimary = '토'; eokbuSecondary = '금'; eokbuTertiary = '화'; }
      else if (myElem === '목') { eokbuPrimary = '수'; eokbuSecondary = '목'; eokbuTertiary = '금'; }
      else if (myElem === '화') { eokbuPrimary = '목'; eokbuSecondary = '화'; eokbuTertiary = '수'; }
      else if (myElem === '토') { eokbuPrimary = '화'; eokbuSecondary = '토'; eokbuTertiary = '목'; }
      else { eokbuPrimary = '금'; eokbuSecondary = '수'; eokbuTertiary = '토'; }
      eokbuReason = `신약한 일간을 생조하고 태왕한 설기와 재성을 다스리기 위해 인성(${elemK[eokbuPrimary]})을 용신으로, 비겁(${elemK[eokbuSecondary]})을 희신으로 삼습니다.`;
    }

    // 조후 용신 (계절적 한난조습 및 일간 특성)
    let johuSeason = '춘절(봄)';
    let johuPrimary: '목' | '화' | '토' | '금' | '수' | '중화' = '화';
    let johuSecondary: '목' | '화' | '토' | '금' | '수' | undefined = undefined;
    let johuTertiary: '목' | '화' | '토' | '금' | '수' | undefined = undefined;
    let johuReason = '';
    let johuLuckNote = '';

    if (['인', '묘', '진'].includes(pMonth.branch)) {
      johuSeason = '춘절(봄)';
      johuPrimary = '화';
      johuSecondary = '목';
      johuTertiary = '금';
      if (myElem === '금') {
        johuReason = '궁통보감 춘월경금론에 의거하여, 봄철의 한랭한 수기를 녹이고 목을 배양하기 위해 따뜻한 丙火의 조후가 원국의 생명력을 살리는 필수 요소입니다.';
        johuLuckNote = '원국 자체는 표면에 화(火)가 없어 丙火 온기를 갈망하나, 2026년 丙午 대운 및 세운에서는 화기(火氣)가 극도로 태과해지므로 운의 관점에서는 과열된 열기를 식혀주는 수기(水氣)의 윤습함이 실전 조후 완충제가 됩니다.';
      } else {
        johuReason = '봄철의 목기를 따스하게 북돋우기 위해 화(火)의 조후가 조화를 돕습니다.';
        johuLuckNote = '운의 흐름에 따라 화열과 수기의 균형을 맞추는 것이 중요합니다.';
      }
    } else if (['사', '오', '미'].includes(pMonth.branch)) {
      johuSeason = '하절(여름)';
      johuPrimary = '수';
      johuSecondary = '금';
      johuTertiary = '화';
      johuReason = '여름철의 극심한 화열과 조열함을 식히기 위해 수(水)의 윤택함이 가장 시급한 조후 용신입니다.';
      johuLuckNote = '수기운이 들어올 때 정서적 안정과 문제 해결의 실마리가 열립니다.';
    } else if (['해', '자', '축'].includes(pMonth.branch)) {
      johuSeason = '동절(겨울)';
      johuPrimary = '화';
      johuSecondary = '목';
      johuTertiary = '수';
      johuReason = '겨울철의 한습하고 얼어붙은 대지를 녹이기 위해 화(火)의 따뜻한 온기가 절대적인 조후 용신입니다.';
      johuLuckNote = '화기운이 동반될 때 얼어붙었던 운세의 물꼬가 풀립니다.';
    } else {
      johuSeason = '추절(가을)';
      johuPrimary = '화';
      johuSecondary = '목';
      johuTertiary = '금';
      johuReason = '가을철의 숙살지기를 다스리고 조화롭게 이끌기 위해 화(火)와 수(水)의 적절한 온습 조율이 요구됩니다.';
      johuLuckNote = '한난의 치우침을 보완하는 시기에 안정성이 증대됩니다.';
    }

    // 5. 십신 동적 계산
    const getTenGodGroup = (targetElem: '목' | '화' | '토' | '금' | '수'): '비겁' | '식상' | '재성' | '관성' | '인성' => {
      if (myElem === targetElem) return '비겁';
      if ((myElem === '목' && targetElem === '화') || (myElem === '화' && targetElem === '토') || (myElem === '토' && targetElem === '금') || (myElem === '금' && targetElem === '수') || (myElem === '수' && targetElem === '목')) {
        return '식상';
      }
      if ((myElem === '목' && targetElem === '토') || (myElem === '화' && targetElem === '금') || (myElem === '토' && targetElem === '수') || (myElem === '금' && targetElem === '목') || (myElem === '수' && targetElem === '화')) {
        return '재성';
      }
      if ((targetElem === '목' && myElem === '토') || (targetElem === '화' && myElem === '금') || (targetElem === '토' && myElem === '수') || (targetElem === '금' && myElem === '목') || (targetElem === '수' && myElem === '화')) {
        return '관성';
      }
      return '인성';
    };

    // 표면 8자 기준 집계 (천간 4자 + 지지 본기 4자 = 8자 전수)
    const surfaceCounts8: Record<'비겁' | '식상' | '재성' | '관성' | '인성', number> = {
      '비겁': 0, '식상': 0, '재성': 0, '관성': 0, '인성': 0
    };

    // 천간 4자 (일간 포함)
    [pYear.stem, pMonth.stem, pDay.stem, pHour.stem].forEach(st => {
      if (STEM_INFO[st]) {
        const grp = getTenGodGroup(STEM_INFO[st].element);
        surfaceCounts8[grp]++;
      }
    });

    // 지지 본기 4자 (PURE_HIDDEN_STEMS 단일 소스 참조)
    [pYear.branch, pMonth.branch, pDay.branch, pHour.branch].forEach(br => {
      const pure = PURE_HIDDEN_STEMS[br as EarthlyBranch];
      if (pure && STEM_INFO[pure.main]) {
        const grp = getTenGodGroup(STEM_INFO[pure.main].element);
        surfaceCounts8[grp]++;
      }
    });

    // 지장간 전체 포함 십신 집계 (초기, 중기, 정기)
    const hiddenCounts: Record<'비겁' | '식상' | '재성' | '관성' | '인성', number> = {
      '비겁': 0, '식상': 0, '재성': 0, '관성': 0, '인성': 0
    };
    [pYear.branch, pMonth.branch, pDay.branch, pHour.branch].forEach(br => {
      const pure = PURE_HIDDEN_STEMS[br as EarthlyBranch];
      if (pure) {
        const stems = [pure.initial, pure.middle, pure.main].filter(Boolean) as HeavenlyStem[];
        stems.forEach(st => {
          if (STEM_INFO[st]) {
            hiddenCounts[getTenGodGroup(STEM_INFO[st].element)]++;
          }
        });
      }
    });

    // 고객용 표면 다자/결핍 (surfaceCounts8 기준)
    const dominantTenGods = (Object.keys(surfaceCounts8) as ('비겁' | '식상' | '재성' | '관성' | '인성')[])
      .filter(k => surfaceCounts8[k] >= 2)
      .sort((a, b) => surfaceCounts8[b] - surfaceCounts8[a]);

    const lackingTenGods = (Object.keys(surfaceCounts8) as ('비겁' | '식상' | '재성' | '관성' | '인성')[])
      .filter(k => surfaceCounts8[k] === 0);

    let tenSummary = `일간 ${stemMeta.name}을 중심으로 십신이 골고루 조화를 이루고 있습니다.`;
    if (dominantTenGods.length > 0 && lackingTenGods.length > 0) {
      tenSummary = `표면 명식(8자)에서 [${dominantTenGods.join(', ')}]의 세력이 주도적인 동력으로 작용하며, 표면상 결핍된 [${lackingTenGods.join(', ')}]의 기운을 보완할 때 인생의 안정성이 극대화됩니다. (단, 지장간에 암장된 기운의 잠재적 영향력 별도 감안)`;
    } else if (dominantTenGods.length > 0) {
      tenSummary = `표면 명식(8자)에서 [${dominantTenGods.join(', ')}]의 기운이 뚜렷하게 발달하여 본인의 주체적인 재능과 성과 창출을 견인합니다.`;
    }

    // 6. 독립 모듈들을 통한 합/충/형/파/해/원진/삼합/반합 분석 (Aggregator 역할)
    const pillarsObj: FourPillars = {
      year: { stem: pYear.stem as HeavenlyStem, branch: pYear.branch as EarthlyBranch },
      month: { stem: pMonth.stem as HeavenlyStem, branch: pMonth.branch as EarthlyBranch },
      day: { stem: pDay.stem as HeavenlyStem, branch: pDay.branch as EarthlyBranch },
      hour: { stem: pHour.stem as HeavenlyStem, branch: pHour.branch as EarthlyBranch },
    };

    const BRANCH_HANJA: Record<string, string> = {
      자: '子', 축: '丑', 인: '寅', 묘: '卯', 진: '辰', 사: '巳',
      오: '午', 미: '未', 신: '申', 유: '酉', 술: '戌', 해: '亥'
    };

    const CLASH_CANONICAL_HANJA: Record<string, string> = {

      '자오충': '子午沖', '축미충': '丑未沖', '인신충': '寅申沖',
      '묘유충': '卯酉沖', '진술충': '辰戌沖', '사해충': '巳亥沖',
    };
    const YUKHAP_CANONICAL_HANJA: Record<string, string> = {
      '자축합': '子丑合', '인해합': '寅亥合', '묘술합': '卯戌合',
      '진유합': '辰酉合', '사신합': '巳申合', '오미합': '午未合',
    };
    const PUNISH_CANONICAL_HANJA: Record<string, string> = {
      '인사형': '寅巳刑', '사신형': '巳申刑', '인신형': '寅申刑',
      '축술형': '丑戌刑', '술미형': '戌未刑', '축미형': '丑未刑',
      '자묘형': '子卯刑',
    };
    const DEST_CANONICAL_HANJA: Record<string, string> = {
      '자유파': '子酉破', '오묘파': '卯午破', '묘오파': '卯午破',
      '축진파': '丑辰破', '사신파': '巳申破', '인해파': '寅亥破', '술미파': '戌未破',
    };
    const HARM_CANONICAL_HANJA: Record<string, string> = {
      '자미해': '子未害', '축오해': '丑午害', '인사해': '寅巳害',
      '묘진해': '卯辰害', '신해해': '申亥害', '유술해': '酉戌害',
    };
    const WONJIN_CANONICAL_HANJA: Record<string, string> = {
      '자미 원진': '子未怨嗔', '축오 원진': '丑午怨嗔', '인유 원진': '寅酉怨嗔',
      '묘신 원진': '卯申怨嗔', '진해 원진': '辰亥怨嗔', '사술 원진': '巳戌怨嗔',
      '자미원진': '子未怨嗔', '축오원진': '丑午怨嗔', '인유원진': '寅酉怨嗔',
      '묘신원진': '卯申怨嗔', '진해원진': '辰亥怨嗔', '사술원진': '巳戌怨嗔',
    };

    const clashEngine = new BranchClashEngine();
    const sixHarmonyEngine = new BranchSixHarmonyEngine();
    const tripleHarmonyEngine = new BranchTripleHarmonyEngine();
    const semiHarmonyEngine = new BranchSemiHarmonyEngine();
    const punishmentEngine = new BranchPunishmentEngine();
    const destructionEngine = new BranchDestructionEngine();
    const harmEngine = new BranchHarmEngine();
    const wonjinEngine = new BranchWonjinEngine();

    const clashRes = clashEngine.analyzeIndependent({ pillars: pillarsObj });
    const sixHapRes = sixHarmonyEngine.analyzeIndependent({ pillars: pillarsObj });
    const tripleRes = tripleHarmonyEngine.analyzeIndependent({ pillars: pillarsObj });
    const semiRes = semiHarmonyEngine.analyzeIndependent({ pillars: pillarsObj });
    const punishRes = punishmentEngine.analyzeIndependent({ pillars: pillarsObj });
    const destRes = destructionEngine.analyzeIndependent({ pillars: pillarsObj });
    const harmRes = harmEngine.analyzeIndependent({ pillars: pillarsObj });
    const wonjinRes = wonjinEngine.analyzeIndependent({ pillars: pillarsObj });

    const clashes = clashRes.items.map(i => `${i.name}(${CLASH_CANONICAL_HANJA[i.name] || i.branches.map(b => BRANCH_HANJA[b] || b).join('') + '沖'})`);
    const harmonies = sixHapRes.items.map(i => {
      const baseName = i.name.replace('토', '').replace('목', '').replace('화', '').replace('금', '').replace('수', '');
      return `${baseName}(${YUKHAP_CANONICAL_HANJA[baseName] || i.branches.map(b => BRANCH_HANJA[b] || b).join('') + '合'})`;
    });
    const tripleHarmonies = tripleRes.items.map(i => i.name);
    const semiHarmonies = semiRes.items.map(i => i.name);
    const punishments = punishRes.items.map(i => {
      if (i.name.includes('자형')) {
        const b = i.branches[0];
        const h = BRANCH_HANJA[b] || b;
        return `${b}${b}자형(${h}${h}自刑)`;
      }
      return `${i.name}(${PUNISH_CANONICAL_HANJA[i.name] || i.branches.map(b => BRANCH_HANJA[b] || b).join('') + '刑'})`;
    });
    const destructions = destRes.items.map(i => `${i.name}(${DEST_CANONICAL_HANJA[i.name] || i.branches.map(b => BRANCH_HANJA[b] || b).join('') + '破'})`);
    const harms = harmRes.items.map(i => `${i.name}(${HARM_CANONICAL_HANJA[i.name] || i.branches.map(b => BRANCH_HANJA[b] || b).join('') + '害'})`);
    const wonjin = wonjinRes.items.map(i => {
      const trimmedName = i.name.replace(' ', '');
      return `${trimmedName}(${WONJIN_CANONICAL_HANJA[i.name] || WONJIN_CANONICAL_HANJA[trimmedName] || i.branches.map(b => BRANCH_HANJA[b] || b).join('') + '怨嗔'})`;
    });



    return {
      fourPillars: {
        year: pYear,
        month: pMonth,
        day: pDay,
        hour: pHour,
      },
      dayMaster: {
        stem: dayStem,
        element: stemMeta.element,
        yinYang: stemMeta.yinYang,
        name: stemMeta.name,
        nature: stemMeta.nature,
        characteristics: stemMeta.char,
        careerGuidance: stemMeta.career,
        wealthGuidance: stemMeta.wealth,
        relationshipGuidance: stemMeta.rel,
      },
      ohaeng: {
        distribution: dist,
        dominant,
        dominantKorean: elemK[dominant] || dominant,
        lacking,
        lackingKorean: lacking.map(l => elemK[l] || l).join(', '),
        commentary: `오행 중 ${elemK[dominant]}의 기운이 가장 왕성하여 성취와 추진의 동력이 되며, 상대적으로 잠재된 ${lacking.map(l => elemK[l]).join(', ')}의 기운을 보완할 때 삶의 조화와 균형이 완성됩니다.`
      },
      strength: {
        status,
        score,
        deungryeong,
        deungji,
        deungse,
        deungryeongScore,
        deungJiScore,
        deungSeScore,
        description: strengthDesc,
        calculationBasis
      },
      geokguk: {
        name: geokgukName,
        basis: `월지 ${pMonth.branch}의 지장간 본기 에너지에 기반함`,
        condition: geokgukCondition,
        description: geokgukDesc
      },
      tenGods: {
        counts: surfaceCounts8,
        surfaceCounts8,
        hiddenCounts,
        dominant: dominantTenGods,
        lacking: lackingTenGods,
        summary: tenSummary
      },
      yongshin: {
        ruleId: MYEONGLI_RULE_VERSIONS.EOKBU,
        primary: eokbuPrimary,
        secondary: eokbuSecondary,
        tertiary: eokbuTertiary,
        eokbu: {
          ruleId: MYEONGLI_RULE_VERSIONS.EOKBU,
          primary: eokbuPrimary,
          secondary: eokbuSecondary,
          tertiary: eokbuTertiary,
          reason: eokbuReason
        },
        johu: {
          ruleId: MYEONGLI_RULE_VERSIONS.JOHU,
          season: johuSeason,
          primary: johuPrimary,
          secondary: johuSecondary,
          tertiary: johuTertiary,
          reason: johuReason,
          luckNote: johuLuckNote
        },
        reason: `[억부 용신] ${elemK[eokbuPrimary]}(용신) / ${elemK[eokbuSecondary]}(희신) / ${elemK[eokbuTertiary]}(기신) — ${eokbuReason} | [조후 용신] ${(johuPrimary as string) === '중화' ? '중화' : elemK[johuPrimary]} — ${johuReason}`
      },
      clashesAndHarmonies: {
        clashes,
        harmonies,
        tripleHarmonies,
        semiHarmonies,
        punishments,
        destructions,
        harms,
        wonjin,

        relationsSummary: clashes.length > 0 
          ? `원국 내에 ${clashes.join(', ')}의 역동성이 감돌아 환경의 급변과 도전 속에서 큰 결실을 맺는 원동력이 됩니다.`
          : '원국 지지 간에 거친 충돌이 적어 온화하고 안정적인 삶의 기반을 다져가는 구조입니다.'
      }
    };
  }
}
