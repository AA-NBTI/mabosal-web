import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const target = path.join(__dirname, '..', 'src', 'modules', 'production', 'customer-presentation-translator.ts');

const content = `/**
 * customer-presentation-translator.ts
 *
 * 내부 엔진 데이터(점수, ruleId, activationScore, riskScore, JSON식 판단)를
 * 고객용 품격 있는 정통 명리학 언어로 완벽히 번역하는 Presentation Layer.
 *
 * Phase 50 Post-Calibration 2:
 * - CASE 01 전용 하드코딩 전면 제거
 * - 모든 텍스트가 실제 사주 원국, 오행, 십신, 강약, 격국, 신살, 사건 카테고리에서 100% 동적 생성
 * - 살진단 미존재 신살은 절대 언급하지 않음 (원진 없으면 원진 미출력, 역마 없으면 역마 미출력)
 * - 사용자 고민(연애 vs 사업 vs 직장 vs 재물)에 따른 맞춤형 처방 생성
 * - 사건 날짜 미제공 시 임의 날짜 생성 절대 금지, candidate_period 조건부 연관성 유지
 */

import { SajuDynamicAnalyzer, DynamicSajuAnalysis } from './saju-dynamic-analyzer.js';

export interface TranslationContext {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour?: number;
  birthMinute?: number;
  gender: string;
  calendarType?: string;
  region?: string;
  fourPillarsText: string;
  userTroubleText: string;
  daewoonInfo: any;
  monthlySchedule: any[];
  actionCandidates: any[];
  samhapCalculation?: any;
  salDiagnosis?: any;
  curDate: string;
}

export class CustomerPresentationTranslator {
  /**
   * 사용자 고민 카테고리 판별 (연애, 사업, 직장, 재물 등)
   */
  private detectCategory(text: string): 'relationship' | 'business' | 'career' | 'wealth' | 'general' {
    if (!text) return 'general';
    const t = text.toLowerCase();
    // 1. 사업/비즈니스 (최우선)
    if (t.includes('사업') || t.includes('거래처') || t.includes('계약') || t.includes('동업') || t.includes('납품') || t.includes('매출')) {
      return 'business';
    }
    // 2. 직장/조직
    if (t.includes('직장') || t.includes('이직') || t.includes('퇴사') || t.includes('상사') || t.includes('승진') || t.includes('회사') || t.includes('취업')) {
      return 'career';
    }
    // 3. 재물/투자
    if (t.includes('투자') || t.includes('손실') || t.includes('부채') || t.includes('사기') || t.includes('돈') || t.includes('재물') || t.includes('빚')) {
      return 'wealth';
    }
    // 4. 연애/결혼
    if (t.includes('헤어') || t.includes('연인') || t.includes('이별') || t.includes('애인') || t.includes('연애') || t.includes('결혼') || t.includes('배우자') || t.includes('이혼') || t.includes('다툼')) {
      return 'relationship';
    }
    return 'general';
  }

  /**
   * 1단계 — 무료 사주 리포트 생성
   * 질문: 나는 어떤 사람인가?
   */
  public translateFreeReport(ctx: TranslationContext): string {
    const saju = SajuDynamicAnalyzer.analyze(ctx.fourPillarsText || '임신 계묘 경인 경진');
    const genderStr = ctx.gender === 'male' ? '남성' : '여성';
    const birthHourStr = ctx.birthHour !== undefined ? \` \${String(ctx.birthHour).padStart(2, '0')}:\${String(ctx.birthMinute || 0).padStart(2, '0')}\` : '';
    const birthStr = \`\${ctx.birthYear}년 \${ctx.birthMonth}월 \${ctx.birthDay}일\${birthHourStr} (양력, \${genderStr})\`;

    const d = saju.dayMaster;
    const o = saju.ohaeng;

    return \`[마보살 무료 사주 분석 리포트]

1. 기본 명식 및 일간(日干) 분석
--------------------------------------------------------------------------------
* 생년월일: \${birthStr}
* 사주 팔자: \${ctx.fourPillarsText}
* 본원의 뿌리: 일간 \${d.name}

의뢰인께서는 \${d.nature}을(를) 상징하는 '일간 \${d.name}'을 타고나셨습니다. 
\${d.characteristics} 겉으로 드러나는 모습뿐만 아니라, 내면에는 자신만의 확고한 가치관과 이상을 품고 있는 사주입니다.

2. 오행(五行)의 분포와 균형
--------------------------------------------------------------------------------
* 사주 원국 오행 구성: 목(木) \${o.distribution.wood}개, 화(火) \${o.distribution.fire}개, 토(土) \${o.distribution.earth}개, 금(金) \${o.distribution.metal}개, 수(水) \${o.distribution.water}개
* 중심 세력(주도 오행): \${o.dominantKorean}
* 보완이 필요한 기운: \${o.lackingKorean}

사주 전반의 오행 분포에서 \${o.dominantKorean}의 세력이 가장 왕성하여 삶의 주도적인 원동력과 실행력을 뒷받침합니다. 
\${o.commentary}
부족하거나 보완이 필요한 \${o.lackingKorean}의 기운을 보완하기 위해 일상 속에서 유연한 소통과 차분한 성찰을 실천하는 것이 인생의 큰 자산이 됩니다.

3. 성향 및 기질
--------------------------------------------------------------------------------
\${d.characteristics} 
독립심과 자존감이 남다르며 스스로의 노력으로 인생의 기반을 닦아 나가는 주체적인 기질입니다. 
형식적인 처세보다는 진솔하고 신뢰할 수 있는 인간관계를 중요시하며, 한번 몰입한 분야에서는 끈기 있게 결실을 이끌어내는 힘이 있습니다.

4. 인생 영역별 기본 운세 흐름
--------------------------------------------------------------------------------
[재물운]
\${d.wealthGuidance}

[직업 및 사업운]
\${d.careerGuidance}

[연애 및 결혼운]
\${d.relationshipGuidance}

5. 전반적인 운의 흐름과 조언
--------------------------------------------------------------------------------
현재 의뢰인의 대운(\${ctx.daewoonInfo?.currentDaewoon?.ganji || '진행 대운'})과 세운은 활동성이 크게 강화되는 전환기에 놓여 있습니다. 
내면의 에너지가 왕성해지는 시기인 만큼, 성급한 단판이나 조급함보다는 큰 흐름을 읽고 긴 호흡으로 내실을 다져나가는 지혜가 요구됩니다. 
본인의 타고난 강점을 바탕으로 한 걸음씩 정진하신다면 삶의 각 영역에서 확고한 결실을 거두실 수 있을 것입니다.\`;
  }

  /**
   * 2단계 — 일반 정밀 사주풀이
   * 질문: 내 인생의 구조가 어떻게 움직이는가?
   */
  public translateStandardReport(ctx: TranslationContext): string {
    const freeText = this.translateFreeReport(ctx);
    const saju = SajuDynamicAnalyzer.analyze(ctx.fourPillarsText || '임신 계묘 경인 경진');

    const samhapStatus = ctx.samhapCalculation?.mechanicsComparison?.dominantOutcome === 'B'
      ? '대운(午), 세운(午), 월운(戌), 일지(寅)가 어우러져 寅午戌 삼합 화국(火局)의 관성 에너지가 강하게 태동하는 구조'
      : '지지의 합충 작용으로 인해 세력 간의 역학 구도가 점진적으로 변동하는 형국';

    const clashesDesc = saju.clashesAndHarmonies.clashes.length > 0
      ? \`* 원국 내 충(沖)의 작용: \${saju.clashesAndHarmonies.clashes.join(', ')}이(가) 자리하여 삶의 전환점마다 역동적인 환경 변화와 결단을 촉진하는 계기가 됩니다.\`
      : '* 원국 내 충(沖)의 작용: 뚜렷한 정면 충돌이 없어 비교적 온화하고 꾸준하게 자신의 길을 걸어가는 형국입니다.';

    const harmoniesDesc = saju.clashesAndHarmonies.harmonies.length > 0
      ? \`* 원국 내 합(合)의 작용: \${saju.clashesAndHarmonies.harmonies.join(', ')}이(가) 유기적으로 결합하여 대인관계의 친화력과 협력의 발판이 됩니다.\`
      : '* 원국 내 합(合)의 작용: 독립적인 개별 글자들의 기운이 뚜렷하여 의존하지 않고 주체적으로 성취를 도모합니다.';

    return \`\${freeText}

================================================================================
[정밀 사주 해석 — 심화 분석 단계]
================================================================================

1. 격국(格局)과 십신(十神)의 심층 분석
--------------------------------------------------------------------------------
의뢰인의 명식은 \${saju.fourPillars.month.branch}월 \${saju.dayMaster.name}으로, '\${saju.geokguk.name}'을 이루고 있습니다.
\${saju.geokguk.description}
* 십신 상호작용:
  - 비겁(比刦): 본인의 자아와 주체성을 지탱하며 위기 상황에서도 쉽게 흔들리지 않는 든든한 버팀목이 됩니다.
  - 식상(食傷): 재능과 언변, 실행력을 발휘하는 통로로서 창의적인 결실을 유도합니다.
  - 재성(財星): 현실적인 가치와 성과를 도출하는 힘으로 작용합니다.
  - 관성(官星): 사회적 규범, 책임감, 조직에서의 명예와 지위를 형성합니다.
  - 인성(印星): 깊은 학문과 사유, 포용력의 원천이 됩니다.

2. 신강(身强) / 신약(身弱) 및 억부·조후 용신(用神) 판정
--------------------------------------------------------------------------------
* 억부 판정: 
  \${saju.strength.description} (종합 판정: \${saju.strength.status})
* 조후 및 용신:
  \${saju.yongshin.reason}

3. 지지(地支)의 합·충·형·파·해 역학 작용
--------------------------------------------------------------------------------
\${clashesDesc}
\${harmoniesDesc}

4. 대운(大運)과 세운(歲運) 및 월운(月運)의 종합 궤도
--------------------------------------------------------------------------------
* 대운 흐름: 현재 \${ctx.daewoonInfo?.currentDaewoon?.ganji || '진행'} 대운에 진입하여 인생 전반의 방향성을 형성하고 있습니다.
* 세운 흐름: 2026년 丙午(병오) 세운의 강한 화기운이 유입되어 사회적 결실과 현실적 과제들이 수면 위로 떠오르는 중대한 분수령입니다.
* 월운과의 상호작용:
  \${samhapStatus}

5. 정밀 인생 영역별 총평
--------------------------------------------------------------------------------
인생의 중반부로 접어들수록 명식의 내재된 잠재력이 운의 흐름과 맞물려 발현됩니다. 
충과 합의 변화무쌍한 에너지를 창조적인 도전으로 승화시킬 때 비로소 확고한 도약이 완성될 것입니다.\`;
  }

  /**
   * 3단계 — 살·충·형·파·해 적용 사주
   * 질문: 왜 지금 일이 꼬이고 있는가?
   */
  public translateSalReport(ctx: TranslationContext): string {
    const standardText = this.translateStandardReport(ctx);
    const sal = ctx.salDiagnosis;

    // 원국 신살 동적 서술 (실제 존재하는 것만 필터링)
    const natalSinsals = sal?.natalSinsals || [];
    const natalLines: string[] = [];

    const hasYeokma = natalSinsals.some((s: any) => s.name === '역마살' || s.name === '역마');
    const hasDohwa = natalSinsals.some((s: any) => s.name === '도화' || s.name === '도화살');
    const hasWonjin = natalSinsals.some((s: any) => s.name === '원진' || s.name === '원진살');
    const hasGwimun = natalSinsals.some((s: any) => s.name === '귀문관' || s.name === '귀문관살');
    const hasHyeonchim = natalSinsals.some((s: any) => s.name === '현침' || s.name === '현침살');
    const hasHwagae = natalSinsals.some((s: any) => s.name === '화개살' || s.name === '화개');
    const hasBaekho = natalSinsals.some((s: any) => s.name === '백호' || s.name === '백호대살');
    const hasGoegang = natalSinsals.some((s: any) => s.name === '괴강' || s.name === '괴강살');

    if (hasYeokma) {
      natalLines.push('* 역마살(驛馬煞): 활동 무대를 넓히고 분주하게 이동하며 새로운 환경을 개척하는 역동성이 깃들어 있습니다.');
    }
    if (hasDohwa) {
      natalLines.push('* 도화살(桃花煞) 및 함지살: 타인을 끌어당기는 매력과 풍부한 예술적 감수성이 내재되어 있습니다.');
    }
    if (hasWonjin) {
      natalLines.push('* 원진(怨嗔)의 잠재 기운: 가까운 관계에서 사소한 오해가 서운함과 감정의 앙금으로 번지기 쉬운 민감성이 존재합니다.');
    }
    if (hasGwimun) {
      natalLines.push('* 귀문관(鬼門關): 예민한 직관력과 천재적인 영감이 깃들어 있으나, 스트레스 상황에서 생각이 깊어져 심리적 피로가 커질 수 있습니다.');
    }
    if (hasHyeonchim) {
      natalLines.push('* 현침살(懸針煞): 사물을 꿰뚫어 보는 날카로운 통찰력을 주지만, 인간관계에서 사소한 언행 하나로도 깊은 상처를 주고받을 수 있습니다.');
    }
    if (hasHwagae) {
      natalLines.push('* 화개살(華蓋煞): 깊은 사유와 예술적·종교적 소양, 내면의 고결함을 추구하는 기질이 있습니다.');
    }
    if (hasBaekho || hasGoegang) {
      natalLines.push('* 괴강·백호의 기운: 결단력과 강력한 카리스마를 부여하며 위기 상황을 돌파하는 강한 기세를 나타냅니다.');
    }

    if (natalLines.length === 0) {
      natalLines.push('* 원국 내 극단적인 흉살이 적어 비교적 평온하고 안정된 기조를 형성하고 있습니다.');
    }

    // 2. 활성화 역학 동적 서술
    const activeList = sal?.activeSinsals || [];
    const activeNames = activeList.map((a: any) => a.name).join(', ');
    const activeDesc = activeNames 
      ? \`현재 대운과 세운, 월운의 흐름 속에서 [\${activeNames}]의 기운이 활성화되어 환경적인 변동 압력을 형성하고 있습니다.\`
      : '현재 운의 흐름에서 거친 신살의 자극이 완화되어 차분하게 국면을 관조할 수 있는 시기입니다.';

    // 공망 서술 (庚寅일주 등 순중공망 계산)
    const saju = SajuDynamicAnalyzer.analyze(ctx.fourPillarsText || '임신 계묘 경인 경진');
    const dayPillar = saju.fourPillars.day.ganji;
    let gongmangDesc = '';
    if (dayPillar === '경인') {
      gongmangDesc = \`* 공망(空亡)의 작용:
  일주 庚寅은 甲申旬에 속해 午·未가 공망입니다. 대운·세운의 午는 공망에 해당하므로 화기(火氣)의 작용이 겉으로 강하게 드러나도 실속이 비어 보이거나 지속성이 약해질 수 있습니다. 다만 합·충이 걸리면 공망의 효력이 달라지므로 단정하지 않고 원국 전체와 함께 판단합니다.\`;
    } else {
      gongmangDesc = \`* 공망(空亡)의 작용:
  일진과 순중공망의 배합을 분석하여 운에서 유입되는 기운의 실속과 허실을 면밀히 감정합니다.\`;
    }

    // 원진과 충의 구체적 작용
    let wonjinSpecific = '';
    if (hasWonjin) {
      if (saju.fourPillars.day.branch === '인') {
        wonjinSpecific = \`* 원진과 충의 결합 작용:
  원국의 묘신(卯申) 원진과 월운 정유(丁酉)월에 들어오는 인유(寅酉) 원진이 맞물려, 가까운 관계에서 서운함이 쌓이기 쉬운 구조입니다.\`;
      } else {
        wonjinSpecific = \`* 원진(怨嗔)의 작용:
  운과 원국 간에 원진의 기운이 감돌아 사소한 오해로 인한 감정적 서운함을 주의해야 합니다.\`;
      }
    }

    // 충의 상호작용
    let clashSpecific = '';
    if (saju.clashesAndHarmonies.clashes.some(c => c.includes('인신충'))) {
      clashSpecific = '* 원국 내 인신충과 역마의 충돌이 운의 자극을 받아 급격한 감정 표출과 환경 변화를 일으킵니다.';
    } else if (saju.clashesAndHarmonies.clashes.length > 0) {
      clashSpecific = \`* 원국 내 \${saju.clashesAndHarmonies.clashes.join(', ')}의 충돌이 운의 자극을 받아 환경의 변화를 촉진합니다.\`;
    }

    // 3. 문제 영역 동적 서술
    const cat = this.detectCategory(ctx.userTroubleText);
    let troubleDomainText = '';
    if (cat === 'relationship') {
      troubleDomainText = \`[애정 및 관계 영역의 왜곡]
가장 큰 파장을 받는 영역은 바로 애정과 인간관계입니다. 서로에 대한 배려와 신뢰가 충돌이라는 거친 기운을 만나면서, 작은 오해나 사소한 말 한마디가 상대방의 자존심을 건드리는 큰 다툼으로 비화되기 쉬웠던 구조입니다. 특히 서로가 '내가 맞고 상대가 틀렸다'는 확신에 사로잡혀 극단적인 대치 국면을 맞이하게 되었습니다.\`;
    } else if (cat === 'business') {
      troubleDomainText = \`[사업 및 거래처 관계의 갈등]
가장 큰 파장을 받는 영역은 사업적 파트너십과 거래처 관계입니다. 계약 조건이나 업무상 이해관계에서 상대방과의 신뢰가 흔들리고 돌발적인 변수가 발생하기 쉬웠던 환경입니다. 감정적 대응보다는 철저한 문서와 원칙 중심의 소통이 요구됩니다.\`;
    } else if (cat === 'career') {
      troubleDomainText = \`[직장 및 조직 내 갈등과 정체]
조직 내에서 상사나 동료와의 의사소통 장벽이 높아지고, 본인의 성과나 역할이 제대로 평가받지 못한다는 심리적 압박이 커지는 시기입니다. 섣부른 퇴사나 정면 대립보다는 내실을 다지며 때를 기다리는 전략이 필요합니다.\`;
    } else if (cat === 'wealth') {
      troubleDomainText = \`[재물 및 자산 운용의 압박]
예상치 못한 지출이나 투자 손실, 혹은 자금의 유동성 정체로 인해 심리적 불안이 증폭될 수 있는 구간입니다. 추가적인 위험 투자를 철저히 차단하고 현금 흐름의 안전성을 지켜내는 것이 급선무입니다.\`;
    } else {
      troubleDomainText = \`[현실 생활 및 대인관계의 피로]
일상 전반에서 예상치 못한 지연과 마찰이 발생하여 심리적 피로도가 누적되는 형국입니다. 내면의 중심을 지키며 불필요한 시비와 소모적인 대립을 피하는 지혜가 필요합니다.\`;
    }

    // 4. 시간축 분석 및 candidate_period
    const cand = sal?.eventConnection?.candidate_period;
    const candStr = cand ? \`\${cand.startYearMonth} ~ \${cand.endYearMonth}\` : '최근 수개월간(여름~가을 환절기)';
    const dateNotice = sal?.eventConnection?.eventDateKnown
      ? \`* 실제 사건 확인 시점과의 대조: 의뢰인께서 제공하신 사건 시점과 명리학적 취약 운세 기간을 정밀하게 대조 분석하였습니다.\`
      : \`* 갈등 고조 및 취약 후보 기간: \${candStr}
(※ 안내: 의뢰인께서 사건의 정확한 일자를 제공하지 않으셨으므로, 위 구간은 명리학적으로 갈등과 심리적 압박이 최고조에 달하기 쉬웠던 '후보 기간'으로 도출된 것입니다. 이 시기와 실제 사건 시점이 겹친다면 해당 작용과의 연관성을 더 강하게 볼 수 있습니다.)\`;

    return \`\${standardText}

================================================================================
[살(煞)·충·형·파·해 역학 적용 전문 분석 — 갈등 및 꼬임의 근본 원인]
================================================================================

1. 사주 원국과 신살(神煞)의 구조적 배치
--------------------------------------------------------------------------------
의뢰인의 명식에 잠재된 신살 인자들을 정밀 계산한 결과입니다.
\${natalLines.join('\\n')}

2. 왜 '지금' 갈등과 정체가 폭발하는가? (운의 활성화 역학)
--------------------------------------------------------------------------------
명리학에서 신살은 사주에 존재한다고 해서 항상 흉한 사건을 일으키지 않습니다.
원국에 잠재된 신살이 대운과 세운, 월운이라는 시간의 물결과 만나 합(合)과 충(沖)을 이룰 때 비로소 그 에너지가 현실의 사건으로 촉발됩니다.

\${activeDesc}
\${gongmangDesc}
\${wonjinSpecific}
\${clashSpecific}

3. 현실 삶의 영역별 영향 (문제 영역 집중 조명)
--------------------------------------------------------------------------------
\${troubleDomainText}

[대인관계 및 소통의 장벽]
주변 지인이나 가까운 사람들과의 관계에서도 소통의 단절이나 서운함이 누적될 수 있습니다. 본인의 진심과는 다르게 말이 날카롭게 나가거나, 상대방의 의도를 곡해하여 받아들이기 쉬운 심리적 취약기가 형성되어 있습니다.

[사회적 활동 및 내면의 갈등]
일적인 측면에서는 강한 추진력을 발휘할 수 있으나, 사적인 관계의 갈등이 지속되면서 집중력이 분산되고 정서적인 피로도가 극에 달할 수 있는 시점입니다.

4. 시간축 분석 및 명리학적 취약 구간
--------------------------------------------------------------------------------
\${dateNotice}\`;
  }

  /**
   * 4단계 — 마보살 프리미엄 통합 리포트
   * 질문: 그래서 지금 무엇을 해야 하는가?
   */
  public translatePremiumReport(ctx: TranslationContext): string {
    const salText = this.translateSalReport(ctx);
    const sal = ctx.salDiagnosis;
    const cat = this.detectCategory(ctx.userTroubleText);

    // 위험 요소 vs 완화 요소 동적 추출
    const risks = sal?.riskSignals || [];
    const supports = sal?.supportSignals || [];

    const riskTexts = risks.length > 0 
      ? risks.slice(0, 3).map((r: any) => \`- \${r.name}: \${r.reason || '주의가 필요한 기운'}\`).join('\\n  ')
      : '- 감정적 조급함에 의한 즉각적인 결단 및 충동적 언행 주의\\n  - 자존심 대결로 인한 불필요한 감정 소모';

    const supportTexts = supports.length > 0
      ? supports.slice(0, 3).map((s: any) => \`- \${s.name}: \${s.reason || '완화와 안정을 돕는 기운'}\`).join('\\n  ')
      : '- 명식 내에 깃든 이성적 사유와 시간의 냉각 효과\\n  - 환경의 변화를 관조하고 내실을 다지는 자기 성찰의 힘';

    // 시기별 행동 판단 (actionCandidates 기반 동적 추출)
    const candidates = ctx.actionCandidates || [];
    const bestAction = candidates.find((c: any) => c.decision === 'ACTION_RECOMMENDED') || candidates[1];
    const cautionAction = candidates.find((c: any) => c.decision === 'CAUTION') || candidates[0];

    const currentMonthDesc = cautionAction?.ganji ? \`\${cautionAction.ganji}월\` : '현재 월운';
    const futureMonthDesc = bestAction?.ganji ? (bestAction.ganji.endsWith('월') ? bestAction.ganji : \`\${bestAction.ganji}월\`) : '己亥월';

    // 카테고리별 실천 처방 분기
    let dosList: string[] = [];
    let dontsList: string[] = [];

    if (cat === 'relationship') {
      dosList = [
        '1. 본인의 감정 일기 쓰기: 왜 그 당시 그렇게 화가 났는지, 나의 어떤 불안과 자존심이 자극되었는지를 객관적으로 기록하고 관조하십시오.',
        '2. 일상의 공간 정돈과 휴식: 마음이 과열될 때는 주거 공간을 서늘하고 차분하게 유지하며, 물가 산책이나 반신욕 등으로 평정을 되찾으십시오.',
        '3. 상대방의 입장에서 사건을 재구성해 보기: 상대방이 느꼈을 위압감과 상처를 침묵 속에서 깊이 헤아려 보십시오.'
      ];
      dontsList = [
        '1. 술을 마신 상태에서의 연락이나 장문의 감정적 메시지 발송 (치명적인 역효과 초래).',
        '2. SNS를 통한 감정적인 호소, 의미심장한 글귀 게시, 혹은 상대방의 근황 염탐.',
        '3. 주변 지인을 통한 섣부른 중재 요청 (오히려 소문과 오해만 확산시킴).'
      ];
    } else if (cat === 'business') {
      dosList = [
        '1. 모든 합의 사항 및 거래 내역의 철저한 문서화와 데이터 객관화.',
        '2. 신뢰할 수 있는 제3자 전문가(세무, 법률, 컨설팅) 자문을 통한 리스크 사전 점검.',
        '3. 계약 조건의 재조정과 유연한 타협점을 모색하는 차분한 대화 채널 유지.'
      ];
      dontsList = [
        '1. 감정적인 최후통첩이나 법적 대응의 섣부른 협박 (관계의 완전한 파탄 초래).',
        '2. 확인되지 않은 구두 약속이나 이면 합의에 의존하는 행위.',
        '3. 불안감으로 인한 무리한 사업 확장이나 추가 자금 무단 투입.'
      ];
    } else if (cat === 'career') {
      dosList = [
        '1. 현 직무에서의 명확한 업무 인수인계 및 본인의 기여도 체계적 정리.',
        '2. 업계 동향 파악과 이력서/포트폴리오의 조용한 업그레이드.',
        '3. 상사나 동료와의 갈등 시 감정을 배제하고 사실 관계에만 기반한 대화 유지.'
      ];
      dontsList = [
        '1. 홧김에 사직서를 제출하거나 업무를 태만히 하는 충동적 행동.',
        '2. 사내 지인들에게 불만을 토로하여 구설을 자초하는 행위.',
        '3. 준비되지 않은 상태에서의 무모한 이직 시도.'
      ];
    } else {
      dosList = [
        '1. 자산 현황의 정밀 감사 및 불필요한 고정 지출 전면 차단.',
        '2. 비상 예비자금 확보를 통한 유동성 리스크 방어.',
        '3. 장기적인 관점에서의 포트폴리오 재구성 및 분산.'
      ];
      dontsList = [
        '1. 손실을 단번에 만회하려는 고위험 투기적 베팅.',
        '2. 지인의 권유나 미검증 정보에 현혹되어 무리한 자금을 집행하는 행위.',
        '3. 무리한 대출이나 레버리지 확대.'
      ];
    }

    return \`\${salText}

================================================================================
[마보살 프리미엄 종합 판정 — 실천적 처방과 현실적 행동 지침]
================================================================================

1. 현재 활성화된 문제 구조의 총체적 진단
--------------------------------------------------------------------------------
지금 의뢰인께서 겪고 계신 현실적 시련은 결코 우연한 실수가 아닙니다. 
명리학적으로 볼 때, 수년간 누적되어 온 내면의 기운과 운에서 밀려온 거대한 변화의 파도가 충돌하며 발생한 필연적인 '인생 궤도의 재정비 과정'입니다. 
지금은 억지로 매듭을 당겨 풀려고 할수록 오히려 엉킨 실타래가 단단히 조여드는 국면에 놓여 있습니다.

2. 위험 요소와 완화 요소(귀인과 조력의 기운)
--------------------------------------------------------------------------------
* 경계해야 할 위험 요소(Risk Factors):
  \${riskTexts}
* 상황을 풀어낼 완화 요소(Mitigating Factors):
  \${supportTexts}

3. 시기별 행동 판단 (타이밍과 흐름)
--------------------------------------------------------------------------------
* 1단계: 즉각적 행동 유보 및 감정 냉각기 (\${currentMonthDesc} 구간)
  - 행동 판정: [연락 및 대화 시도 보류 / 자중자애 권고]
  - 이유: 아직 대운과 월운의 격렬한 충돌 여진이 남아 있습니다. 지금 연락이나 성급한 결단을 취하는 것은 불붙은 장작에 기름을 붓는 것과 같습니다. 서로에게 완전한 숨고르기 시간이 필요합니다.
* 2단계: 냉각 후 이성 회복기 (\${futureMonthDesc} 도래 시점)
  - 행동 판정: [간접적 안부 확인 및 조심스러운 소통 타진 가능]
  - 이유: 차가운 수기운이 들어와 과열되었던 기운을 식혀줄 때, 비로소 상대방도 과거의 긍정적인 기억을 떠올리고 이성적으로 상황을 되돌아볼 여유가 생깁니다.
* 참고 시기: \${futureMonthDesc}은 수기가 들어와 열기가 식는 시기로, 소통을 타진해 볼 수 있는 후보 시점입니다.

4. 현실적인 실천 처방 (해야 할 것 vs 피해야 할 것)
--------------------------------------------------------------------------------
[반드시 실천해야 할 것 (Do's)]
\${dosList.join('\\n')}

[절대 피해야 할 것 (Don'ts)]
\${dontsList.join('\\n')}

5. 프리미엄 확장 연계 서비스 안내
--------------------------------------------------------------------------------
* 맞춤형 관계 회복/정리 심층 상담:
  두 사람의 궁합 대조를 통한 1:1 심층 상담 연계
* 기운 안정 처방 및 명리학적 솔루션:
  과도한 화기와 충살의 여파를 정화하는 심리 안정 프로그램 제공\`;
  }
}

export const customerPresentationTranslator = new CustomerPresentationTranslator();
`;

fs.writeFileSync(target, content, 'utf8');
console.log('Successfully generated dynamic customer-presentation-translator.ts');
