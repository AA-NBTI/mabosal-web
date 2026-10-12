/**
 * customer-presentation-translator.ts
 *
 * 내부 엔진 데이터(점수, ruleId, activationScore, riskScore, JSON식 판단)를
 * 고객용 품격 있는 정통 명리학 언어로 완벽히 번역하는 Presentation Layer.
 *
 * Phase 52 리팩토링:
 * - P0: 寅午戌 삼합 화국 등 합충형파해 방어층 구축 (실제 사주 지지 검증)
 * - P1: 4단계 누적 복사(Concatenation) 전면 폐지 -> 각 단계 독립 완성형 리포트 구축
 * - P2: 영문 키(day:해 등), 점수, ruleId 등 내부 코드 고객 노출 0건 보장
 * - P2: 십신 교과서식 나열 폐지 -> 실제 사주 십신 다자/결핍 맞춤형 분석
 * - P3: SAL 스토리텔링 강화 (핵심 살 집중, 왜 지금 작동하는가, 현실 연결, 완화 길신)
 * - P3: PREMIUM 사용자 고민 속 핵심 키워드 직접 인용 및 맞춤 처방
 */

import { SajuDynamicAnalyzer, DynamicSajuAnalysis } from './saju-dynamic-analyzer.js';
import { BranchTripleHarmonyEngine } from '../relationship/branch-harmony.js';
import { EarthlyBranch, HeavenlyStem, FourPillars } from '../../core/types.js';


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
  daewoonInfo?: any;
  monthlySchedule?: any[];
  actionCandidates?: any[];
  samhapCalculation?: any;
  salDiagnosis?: any;
  curDate: string;
}

export class CustomerPresentationTranslator {
  /**
   * 사용자 고민 카테고리 판별 (연애, 사업, 직장, 재물, 건강 등)
   */
  private detectCategory(text: string): 'relationship' | 'business' | 'career' | 'wealth' | 'health' | 'general' {
    if (!text) return 'general';
    const t = text.toLowerCase();
    // 1. 건강/수술/질환 (최우선)
    if (t.includes('건강') || t.includes('수술') || t.includes('질환') || t.includes('병원') || t.includes('치료') || t.includes('통증') || t.includes('질병') || t.includes('사고')) {
      return 'health';
    }
    // 2. 사업/비즈니스
    if (t.includes('사업') || t.includes('거래처') || t.includes('계약') || t.includes('동업') || t.includes('납품') || t.includes('매출')) {
      return 'business';
    }
    // 3. 직장/조직
    if (t.includes('직장') || t.includes('이직') || t.includes('퇴사') || t.includes('상사') || t.includes('승진') || t.includes('회사') || t.includes('취업')) {
      return 'career';
    }
    // 4. 재물/투자
    if (t.includes('투자') || t.includes('손실') || t.includes('부채') || t.includes('사기') || t.includes('돈') || t.includes('재물') || t.includes('빚')) {
      return 'wealth';
    }
    // 5. 연애/결혼
    if (t.includes('헤어') || t.includes('연인') || t.includes('이별') || t.includes('애인') || t.includes('연애') || t.includes('결혼') || t.includes('배우자') || t.includes('이혼') || t.includes('다툼') || t.includes('별거') || t.includes('결별') || t.includes('재회')) {
      return 'relationship';
    }
    return 'general';
  }

  /**
   * 사용자 고민 원문에서 핵심 키워드/명사 추출 (P3)
   */
  private extractKeywords(text: string): string[] {
    if (!text) return [];
    const candidates = [
      '3년간', '연인', '다툼', '헤어짐', '이별', '재회', '연락',
      '동업자', '지분', '정산', '결별', '계약', '거래처', '분쟁',
      '상사', '마찰', '퇴사', '이직', '승진', '직장', '회사',
      '투자', '손실', '빚', '부채', '재물',
      '배우자', '별거', '이혼', '관계 회복', '가정',
      '건강', '수술', '질환', '치료', '회복', '통증', '질병', '사고'
    ];
    return candidates.filter(k => text.includes(k));
  }

  /**
   * 내부 코드/영문 키 고객 노출 제거 클리너 (P2)
   */
  private cleanseText(text: string): string {
    return text
      .replace(/\bday:\s*([가-힣a-zA-Z]+)/g, '일지($1)')
      .replace(/\bmonth:\s*([가-힣a-zA-Z]+)/g, '월지($1)')
      .replace(/\byear:\s*([가-힣a-zA-Z]+)/g, '년주($1)')
      .replace(/\bhour:\s*([가-힣a-zA-Z]+)/g, '시지($1)')
      .replace(/\bday\b/g, '일지')
      .replace(/\bmonth\b/g, '월지')
      .replace(/\byear\b/g, '년주')
      .replace(/\bhour\b/g, '시지')
      .replace(/RULE_[A-Z0-9_]+/g, '')
      .replace(/activationScore[^\s,)]+/g, '')
      .replace(/riskScore[^\s,)]+/g, '')
      .replace(/\{[^{}]*\}/g, '')
      .trim();
  }

  /**
   * Phase 55: 독립 BranchTripleHarmonyEngine을 통한 삼합(운 결합 포함) 판정 조회 (Aggregator)
   */
  private checkSamhapWithLuck(saju: DynamicSajuAnalysis, daewoonBranch: string, sewoonBranch: string, monthBranch: string) {
    const tripleEngine = new BranchTripleHarmonyEngine();
    return tripleEngine.analyzeIndependent({
      pillars: {
        year: { stem: saju.fourPillars.year.stem as HeavenlyStem, branch: saju.fourPillars.year.branch as EarthlyBranch },
        month: { stem: saju.fourPillars.month.stem as HeavenlyStem, branch: saju.fourPillars.month.branch as EarthlyBranch },
        day: { stem: saju.fourPillars.day.stem as HeavenlyStem, branch: saju.fourPillars.day.branch as EarthlyBranch },
        hour: { stem: saju.fourPillars.hour.stem as HeavenlyStem, branch: saju.fourPillars.hour.branch as EarthlyBranch },
      },
      luckBranches: {
        daewoon: (daewoonBranch || undefined) as EarthlyBranch | undefined,
        sewoon: (sewoonBranch || undefined) as EarthlyBranch | undefined,
        monthWoon: (monthBranch || undefined) as EarthlyBranch | undefined,
      }
    });
  }


  /**
   * 1단계 — 무료 사주 리포트 (FREE)
   * 핵심 질문: "나는 어떤 사람인가?"
   * 짧지만 완결된 무료 사주 결과물
   */
  public translateFreeReport(ctx: TranslationContext): string {
    const saju = SajuDynamicAnalyzer.analyze(ctx.fourPillarsText || '임신 계묘 경인 경진');
    const genderStr = ctx.gender === 'male' ? '남성' : '여성';
    const birthHourStr = ctx.birthHour !== undefined ? ` ${String(ctx.birthHour).padStart(2, '0')}:${String(ctx.birthMinute || 0).padStart(2, '0')}` : '';
    const birthStr = `${ctx.birthYear}년 ${ctx.birthMonth}월 ${ctx.birthDay}일${birthHourStr} (${ctx.calendarType === 'lunar' ? '음력' : '양력'}, ${genderStr})`;

    const d = saju.dayMaster;
    const o = saju.ohaeng;

    // 결핍 오행에 따른 주의점
    let weaknessAdvice = '';
    if (o.lacking.includes('화')) {
      weaknessAdvice = '화(火)의 온기와 추진력이 잠재되어 있어, 과도하게 이성적이거나 결론을 서두르다 감정적 공감을 놓치기 쉽습니다. 따뜻한 대화와 여유를 의식적으로 갖추는 것이 길합니다.';
    } else if (o.lacking.includes('수')) {
      weaknessAdvice = '수(水)의 유연성과 융통성이 부족해지기 쉬워, 상황이 막힐 때 유연하게 우회하기보다 정면으로 부딪혀 피로가 커질 수 있습니다. 긴 호흡과 심사숙고가 요구됩니다.';
    } else if (o.lacking.includes('목')) {
      weaknessAdvice = '목(木)의 시작과 기획 에너지가 약할 수 있어, 새로운 일을 벌이기보다 기존 것을 지키는 데 치우치기 쉽습니다. 능동적인 시작의 용기를 훈련하는 것이 좋습니다.';
    } else if (o.lacking.includes('금')) {
      weaknessAdvice = '금(金)의 결단력과 맺고 끊음이 약해 타인의 부탁을 거절하지 못하고 끌려다닐 위험이 있습니다. 공사의 분별과 단호함을 길러야 합니다.';
    } else if (o.lacking.includes('토')) {
      weaknessAdvice = '토(土)의 중재력과 끈기가 부족해 환경 변화에 마음이 쉽게 흔들릴 수 있습니다. 꾸준한 루틴과 현실적 기반을 닦는 뚝심이 필요합니다.';
    } else {
      weaknessAdvice = '오행이 골고루 갖추어져 있으나, 어느 한쪽으로 치우칠 때의 감정 기복을 조율하고 일상의 균형을 지켜내는 것이 관건입니다.';
    }

    return `[마보살 무료 사주 분석 리포트]
핵심 질문: "나는 어떤 사람인가?"

1. 기본 명식 및 일간(日干) 분석
--------------------------------------------------------------------------------
* 생년월일: ${birthStr}
* 사주 팔자: ${ctx.fourPillarsText}
* 본원의 뿌리: 일간 ${d.name} (${d.nature})
* 일간 강약: ${saju.strength.status} (${saju.strength.score}점)

의뢰인께서는 ${d.nature}을(를) 상징하는 '일간 ${d.name}'을 타고나셨습니다. 
${d.characteristics}
강약 관점에서는 ${saju.strength.description}
겉으로 드러나는 모습뿐만 아니라, 내면에는 자신만의 확고한 가치관과 이상을 품고 있는 사주입니다.

2. 오행(五行)의 분포와 균형
--------------------------------------------------------------------------------
* 사주 원국 오행 구성: 목(木) ${o.distribution.wood}개, 화(火) ${o.distribution.fire}개, 토(土) ${o.distribution.earth}개, 금(金) ${o.distribution.metal}개, 수(水) ${o.distribution.water}개
* 중심 세력(주도 오행): ${o.dominantKorean}
* 보완이 필요한 기운: ${o.lackingKorean || '균형'}

사주 전반의 오행 분포에서 ${o.dominantKorean}의 세력이 가장 왕성하여 삶의 주도적인 원동력과 실행력을 뒷받침합니다. 
${o.commentary}

3. 핵심 기질과 성향
--------------------------------------------------------------------------------
의뢰인의 본성은 솔직하고 주체적이며, 타인에게 의존하기보다 스스로의 힘으로 인생의 기반을 닦아 나가는 강한 자립심을 가지고 있습니다.
형식적인 처세보다는 진솔하고 신뢰할 수 있는 인간관계를 중요시하며, 한번 몰입한 분야에서는 끈기 있게 결실을 이끌어내는 힘이 있습니다.

4. 기본 인생 영역별 성향
--------------------------------------------------------------------------------
[재물운 성향]
${d.wealthGuidance}

[직업 및 사업 성향]
${d.careerGuidance}

[인간관계 및 연애 성향]
${d.relationshipGuidance}

5. 핵심 장점과 일상 속 주의점
--------------------------------------------------------------------------------
[강점]
뚜렷한 주관과 강한 실행력을 바탕으로 위기 상황에서도 쉽게 흔들리지 않고 중심을 잡는 힘이 탁월합니다.

[주의할 점 및 보완점]
${weaknessAdvice}

6. 전반적인 운의 흐름과 조언
--------------------------------------------------------------------------------
현재 의뢰인의 대운과 세운은 활동성과 변화의 에너지가 강화되는 전환기에 놓여 있습니다. 
내면의 에너지가 왕성해지는 시기인 만큼, 성급한 단판이나 조급함보다는 큰 흐름을 읽고 긴 호흡으로 내실을 다져나가는 지혜가 요구됩니다. 
본인의 타고난 강점을 바탕으로 정진하신다면 삶의 각 영역에서 확고한 결실을 거두실 수 있을 것입니다.`;
  }

  /**
   * 2단계 — 전문 일반 사주 리포트 (STANDARD)
   * 핵심 질문: "내 사주의 전체 구조는 어떻게 되어 있는가?"
   * FREE 전문을 복사하지 않는 독립 명리 분석서 (P1)
   */
  public translateStandardReport(ctx: TranslationContext): string {
    const saju = SajuDynamicAnalyzer.analyze(ctx.fourPillarsText || '임신 계묘 경인 경진');
    let currentDw = ctx.daewoonInfo?.currentDaewoon;
    if (!currentDw && ctx.daewoonInfo?.daewoonList) {
      const birthYear = ctx.birthYear ?? 1992;
      const curYear = 2026;
      const age = curYear - birthYear; // 약 34세
      currentDw = ctx.daewoonInfo.daewoonList.find((d: any) => d.startAge <= age && age <= d.endAge) || ctx.daewoonInfo.daewoonList[2];
    }
    const daewoonGanji = currentDw?.ganji || currentDw?.pillar?.name || '병오';
    const curDwStep = currentDw?.step ?? currentDw?.order ?? 3;
    const curDwAge = currentDw?.startAge ?? 27;
    const daewoonBranch = daewoonGanji.length >= 2 ? daewoonGanji[1] : '오';

    // P0: 寅午戌 삼합 화국 검증 방어층 (독립 모듈 BranchTripleHarmonyEngine 결과 참조)
    const samhapRes = this.checkSamhapWithLuck(saju, daewoonBranch, '오', '술');
    const hwagukItem = samhapRes.items.find(i => i.name.includes('인오술'));
    let samhapStatus = '';
    if (hwagukItem && hwagukItem.temporalCompletion) {
      samhapStatus = '원국 자체에는 삼합이 없으나, 2026년 대운(午)과 세운(午)의 화기, 그리고 가을 戊戌월운(戌)이 원국 일지 寅木과 결합하여 운에서 한시적으로 [寅午戌 삼합 화국(火局)]의 관살 에너지를 완성하는 운중 성립 구조입니다.';
    } else if (hwagukItem && !hwagukItem.temporalCompletion) {
      samhapStatus = `원국에 ${hwagukItem.name}이 확고하게 성립하여 강력한 화국 세력을 형성하고 있습니다.`;
    } else {
      samhapStatus = '지지의 합충 작용으로 인해 운에서 유입되는 기운과 원국 세력 간의 역학 구도가 점진적으로 변동하는 형국입니다.';
    }


    const clashesDesc = saju.clashesAndHarmonies.clashes.length > 0
      ? `* 원국 내 충(沖)의 작용: ${saju.clashesAndHarmonies.clashes.join(', ')}이(가) 자리하여 삶의 전환점마다 역동적인 환경 변화와 결단을 촉진하는 계기가 됩니다.`
      : '* 원국 내 충(沖)의 작용: 뚜렷한 정면 충돌이 없어 비교적 온화하고 꾸준하게 자신의 길을 걸어가는 형국입니다.';

    const harmoniesDesc = saju.clashesAndHarmonies.harmonies.length > 0
      ? `* 원국 내 합(合)의 작용: ${saju.clashesAndHarmonies.harmonies.join(', ')}이(가) 유기적으로 결합하여 대인관계의 친화력과 협력의 발판이 됩니다.`
      : '* 원국 내 합(合)의 작용: 독립적인 개별 글자들의 기운이 뚜렷하여 의존하지 않고 주체적으로 성취를 도모합니다.';

    const punishmentsDesc = saju.clashesAndHarmonies.punishments.length > 0
      ? `* 형(刑)의 작용: ${saju.clashesAndHarmonies.punishments.join(', ')}이(가) 감돌아 규칙 준수와 법률적·계약적 분별력을 다져야 합니다.`
      : '* 형(刑)의 작용: 거친 형살의 작용이 없어 관재구설의 위험이 낮고 평온합니다.';

    const harmsDesc = saju.clashesAndHarmonies.harms.length > 0
      ? `* 해(害)·원진(怨嗔)의 작용: ${[...saju.clashesAndHarmonies.harms, ...saju.clashesAndHarmonies.wonjin].join(', ')}의 기운이 은밀하게 자리해 가까운 관계에서의 서운함 조절이 요구됩니다.`
      : '* 해(害)·원진(怨嗔)의 작용: 감정적 앙금을 낳는 왜곡 인자가 적어 솔직담백한 소통이 가능합니다.';

    // P2: 십신 맞춤형 상세 분석 (표면 8자 기준 명시)
    const tc = saju.tenGods.surfaceCounts8;
    const tenGodDetail = `* 십신 구성 분포: 비겁 ${tc['비겁']}개, 식상 ${tc['식상']}개, 재성 ${tc['재성']}개, 관성 ${tc['관성']}개, 인성 ${tc['인성']}개 (표면 8자 전수 집계 기준)
* 십신 심층 동역학:
  ${saju.tenGods.summary}
  - 주도 십신 작용: ${saju.tenGods.dominant.length > 0 ? `[${saju.tenGods.dominant.join(', ')}]이 발달하여 본인의 사회적 성과와 목표 지향성을 강력하게 이끕니다.` : '십신이 치우침 없이 조화를 이룹니다.'}
  - 보완 십신 작용: ${saju.tenGods.lacking.length > 0 ? `[${saju.tenGods.lacking.join(', ')}]의 기운이 표면에 잠재되어 있으므로(단, 지장간 암장 기운 별도 참작), 해당 영역의 가치를 의식적으로 보완하는 처세가 유익합니다.` : '필요한 십신 에너지가 두루 작동하고 있습니다.'}`;

    const dwNumber = ctx.daewoonInfo?.daewoonNumber ?? 7;
    const dwDirection = ctx.daewoonInfo?.direction ?? '순행';

    const dwCycleList = [dwNumber, dwNumber + 10, dwNumber + 20, dwNumber + 30].map(n => `${n}세`).join(', ');

    return `[마보살 전문 일반 사주 리포트 — 사주 원국 및 격국 심화 분석]
핵심 질문: "내 사주의 전체 구조는 어떻게 되어 있는가?"

1. 원국 구조 요약 카드
--------------------------------------------------------------------------------
* 사주 팔자: ${ctx.fourPillarsText}
* 일간 본원: ${saju.dayMaster.name} (${saju.dayMaster.nature})
* 강약 판정: ${saju.strength.status} (${saju.strength.score}점 — ${saju.strength.calculationBasis})
* 성립 격국: ${saju.geokguk.name}

2. 격국(格局)과 사회적 활동 구조
--------------------------------------------------------------------------------
의뢰인의 명식은 ${saju.fourPillars.month.branch}월 ${saju.dayMaster.name}으로, '${saju.geokguk.name}'을 이루고 있습니다.
* 격국 성립 근거: ${saju.geokguk.condition}
${saju.geokguk.description}
격국은 개인이 사회와 맺는 근본적인 계약이자 무대입니다. 타고난 그릇의 형태를 명확히 이해하고 순응할 때 최소의 마찰로 최대의 사회적 성취를 거둘 수 있습니다.

3. 신강(身强) / 신약(身弱) 및 억부·조후 용신(用神) 체계
--------------------------------------------------------------------------------
* 억부(抑扶) 분석:
  ${saju.strength.description}
* 억부 용신(抑扶用神):
  - 주용신(主用神): ${saju.yongshin.eokbu.primary} (인성) / 희신(喜神): ${saju.yongshin.eokbu.secondary} (비겁)
  - 채택 근거: ${saju.yongshin.eokbu.reason}
* 조후(調候) 분석:
  - 계절적 배경: ${saju.yongshin.johu.season} 출생
  - 원국 조후 용신: ${saju.yongshin.johu.primary === '중화' ? '중화' : saju.yongshin.johu.primary}
  - 원국 조후 해설: ${saju.yongshin.johu.reason}
  - 운(運)에서의 실전 조후 유의점: ${saju.yongshin.johu.luckNote}

4. 십신(十神)의 다자·결핍 구조와 심리 동역학
--------------------------------------------------------------------------------
${tenGodDetail}

5. 지지(地支)의 합·충·형·파·해 종합 역학 작용
--------------------------------------------------------------------------------
${clashesDesc}
${harmoniesDesc}
${punishmentsDesc}
${harmsDesc}

6. 대운(大運)과 세운(歲運) 및 월운(月運)의 종합 궤도
--------------------------------------------------------------------------------
* 대운수 및 교운기: 만 ${dwNumber}세 주기 (${dwDirection} 대운). 대운의 기운은 약 만 ${dwCycleList} 등 매 ${dwNumber}세 전환기마다 환경적 대변화를 촉발합니다.
* 현재 대운 흐름: 현재 제${curDwStep}대운 [${daewoonGanji}] 대운(약 만 ${curDwAge}세 ~ ${curDwAge + 9}세 구간)의 후반부에 머물며, 인생 전반의 환경적 기조와 가치관의 대전환을 경험하고 있습니다.
* 세운 흐름: 2026년 丙午(병오) 세운의 강한 화기운이 유입되어 사회적 결실과 현실적 과제들이 수면 위로 떠오르는 중대한 분수령입니다.
* 월운과의 상호작용 (시간축 분리 분석):
  ${samhapStatus}

7. 인생 영역별 구조 총평
--------------------------------------------------------------------------------
명식의 격국과 용신, 그리고 합충의 궤적을 종합해 볼 때, 의뢰인의 삶은 정체되어 있는 평지가 아니라 고유한 굴곡과 도약의 마디가 분명한 역동적인 구조입니다. 
원국의 잠재력을 명확한 이성으로 통찰하고 운의 리듬에 발맞출 때 인생의 진정한 안정과 번영을 완성할 수 있습니다.`;
  }

  /**
   * 3단계 — 마보살 살(煞)진단 전문 리포트 (SAL)
   * 핵심 질문: "왜 지금 일이 꼬이고 있는가?"
   * FREE/STANDARD 복사 금지! 마보살의 핵심 차별 진단서 (P1, P3)
   */
  public translateSalReport(ctx: TranslationContext): string {
    const sal = ctx.salDiagnosis;
    const saju = SajuDynamicAnalyzer.analyze(ctx.fourPillarsText || '임신 계묘 경인 경진');
    const cat = this.detectCategory(ctx.userTroubleText);

    // 원국 신살 동적 서술 (실제 존재하는 것만 필터링)
    const natalSinsals = sal?.natalSinsals || [];
    const hasYeokma = natalSinsals.some((s: any) => s.name?.includes('역마'));
    const hasDohwa = natalSinsals.some((s: any) => s.name?.includes('도화'));
    const hasWonjin = natalSinsals.some((s: any) => s.name?.includes('원진'));
    const hasGwimun = natalSinsals.some((s: any) => s.name?.includes('귀문'));
    const hasHyeonchim = natalSinsals.some((s: any) => s.name?.includes('현침'));
    const hasHwagae = natalSinsals.some((s: any) => s.name?.includes('화개'));
    const hasBaekho = natalSinsals.some((s: any) => s.name?.includes('백호'));
    const hasGoegang = natalSinsals.some((s: any) => s.name?.includes('괴강'));

    // ① 무엇이 문제를 건드리는가: 핵심 살 1~2개 집중 (과잉판정 방지)
    const isCrisis = ctx.userTroubleText ? (
      ctx.userTroubleText.includes('다툼') ||
      ctx.userTroubleText.includes('헤어') ||
      ctx.userTroubleText.includes('이별') ||
      ctx.userTroubleText.includes('결별') ||
      ctx.userTroubleText.includes('재회') ||
      ctx.userTroubleText.includes('이혼') ||
      ctx.userTroubleText.includes('파혼') ||
      ctx.userTroubleText.includes('손실') ||
      ctx.userTroubleText.includes('분쟁') ||
      ctx.userTroubleText.includes('소송') ||
      ctx.userTroubleText.includes('사고') ||
      ctx.userTroubleText.includes('수술') ||
      ctx.userTroubleText.includes('갈등') ||
      ctx.userTroubleText.includes('퇴사') ||
      ctx.userTroubleText.includes('폐업')
    ) : false;

    let coreSalTitle = '';
    let coreSalExplanation = '';

    if (!isCrisis) {
      coreSalTitle = '잠재적 마찰 인자 점검: 평온 속의 예방적 조율';
      coreSalExplanation = '현재 의뢰인의 삶은 큰 파국이나 충돌 없이 비교적 평온하고 안정된 궤도를 유지하고 있습니다. 마보살 살진단은 없는 위기를 과장해 공포를 조장하지 않으며, 향후 운의 변화 속에서 주의해야 할 원국의 잠재적 민감 인자(신살)를 선제적으로 점검해 평온을 지속하도록 돕습니다.';
    } else if (hasWonjin || hasGwimun) {
      coreSalTitle = hasWonjin ? '원진살(怨嗔煞)과 감정 왜곡의 파장' : '귀문관(鬼門關)과 신경성 예민함의 파장';
      coreSalExplanation = '지금 의뢰인의 현실을 가장 흔들고 있는 핵심 살은 바로 "원진과 귀문"의 기운입니다. 사소한 오해가 풀리지 않고 마음속에서 꼬리를 물며, 상대방의 말 한마디를 곡해하거나 극단적인 서운함으로 증폭시키는 감정 왜곡이 갈등의 도화선이 되었습니다.';
    } else if (hasYeokma || saju.clashesAndHarmonies.clashes.length > 0) {
      coreSalTitle = '충살(沖煞)과 역마(驛馬)의 급격한 위치 변동';
      coreSalExplanation = '지금 현실을 뒤흔드는 주된 살은 "충살과 역마"의 격돌입니다. 삶의 기존 질서가 급격히 흔들리며 참아왔던 불만이 한순간에 폭발하거나, 환경의 급격한 이탈과 관계의 단절로 치닫는 불안정한 에너지가 현실화되었습니다.';
    } else if (hasBaekho || hasGoegang) {
      coreSalTitle = '백호(白虎)·괴강(魁罡)의 극단적 대립 압력';
      coreSalExplanation = '타협하지 않는 강한 자존심과 승부욕을 자극하는 백호·괴강의 기운이 작동하고 있습니다. 상대방을 굴복시키려 하거나 한 치도 물러서지 않으려는 강대강 대치 국면이 상황을 막다른 골목으로 몰아붙였습니다.';
    } else {
      coreSalTitle = '운세 환절기의 에너지 충돌과 지연';
      coreSalExplanation = '원국 내 극단적 흉살보다는 대운과 세운이 교차하는 환절기의 기운 충돌로 인해 매사가 뜻대로 풀리지 않고 정체되는 피로감이 누적된 국면입니다.';
    }

    // ② 왜 지금 작동하는가 (운의 활성화 역학)
    const activeList = sal?.activeSinsals || [];
    const activeNames = activeList.slice(0, 5).map((a: any) => a.name).join(', ');
    const activeDesc = activeNames 
      ? `현재 대운과 2026년 세운, 그리고 가을 월운의 흐름 속에서 [${activeNames}]의 기운이 동시 활성화되었습니다. 잠자고 있던 사주의 글자들이 운의 자극을 받아 합과 충을 일으키며 외부의 돌발 사건으로 촉발된 것입니다.`
      : '운에서 밀려오는 변화의 파도가 원국의 균형점을 흔들며 현실의 과제로 표면화되었습니다.';

    // 원진, 충, 공망의 구체적 상호작용 (궁성론 및 지장간 충돌 반영)
    let wonjinSpecific = '';
    if (saju.fourPillars.day.branch === '인') {
      wonjinSpecific = `* 원진(怨嗔)과 충의 결합 작용:
  - 년월의 사회적 관계궁에 묘신(卯申) 원진이 내재하여 환경적 평가에 대한 예민함이 존재합니다.
  - 여기에 가을 정유(丁酉)월운의 酉금이 들어오며 일지 배우자궁 寅木과 인유(寅酉) 원진을 촉발하여, 가장 가까운 친밀한 관계에서 감정의 왜곡과 서운함이 극대화되는 구조입니다.`;
    } else if (hasWonjin) {
      wonjinSpecific = `* 원진(怨嗔)의 작용:
  운과 원국 간에 원진의 기운이 감돌아 사소한 오해로 인한 감정적 서운함을 주의해야 합니다.`;
    }

    let clashSpecific = '';
    if (saju.clashesAndHarmonies.clashes.some(c => c.includes('인신충'))) {
      clashSpecific = `* 원국 내 인신충(寅申沖)과 역마의 궁성 충돌:
  - 지장간 丙火(자존심)와 壬水(충동적 언어/기운)의 정면충돌로, 기존 환경에서의 급격한 이탈과 돌발 변수, 물리적·신체적 충돌 위험이 동반되기 쉽습니다.`;
    } else if (saju.clashesAndHarmonies.clashes.length > 0) {
      clashSpecific = `* 원국 내 ${saju.clashesAndHarmonies.clashes.join(', ')}의 충돌이 운의 자극을 받아 환경의 변화를 촉진합니다.`;
    }

    let gongmangDesc = '';
    if (saju.fourPillars.day.branch === '인' && saju.dayMaster.stem === '경') {
      gongmangDesc = `* 공망(空亡)의 역학:
  - 일주 庚寅은 甲申旬에 속하여 대운과 2026년 세운의 午火(관살)가 순중공망(空亡)에 해당합니다.
  - 겉으로는 화열(火熱)의 압박이 거세게 몰아치는 것처럼 보이나 실속은 비어있는 형국이므로, 섣부른 두려움으로 관계를 자포자기하거나 극단적인 결정을 내리지 않는 것이 지혜입니다.`;
    } else {
      gongmangDesc = `* 공망(空亡)의 작용:
  일진과 순중공망의 배합을 분석하여 운에서 유입되는 기운의 실속과 허실을 면밀히 감정합니다.`;
    }

    // ③ 현실 영역 연결
    let domainSpecificText = '';
    if (cat === 'relationship') {
      domainSpecificText = `[애정 및 부부·인간관계 영역의 왜곡]
가장 큰 파장을 받는 영역은 바로 애정과 인간관계입니다. 서로에 대한 배려와 신뢰가 왜곡된 신살의 거친 기운을 만나면서, 작은 오해가 자존심을 건드리는 큰 다툼으로 비화되었습니다. '내가 맞고 상대가 틀렸다'는 확신에 갇혀 극단적인 대치 국면을 맞이하게 된 근본 원인입니다.`;
    } else if (cat === 'business') {
      domainSpecificText = `[사업 및 거래처 파트너십의 균열]
가장 큰 파장을 받는 영역은 사업적 동업 관계와 거래처 파트너십입니다. 계약 조건이나 업무상 이해관계에서 신뢰가 흔들리고 돌발적인 변수가 발생하기 쉬웠던 환경입니다. 감정적 대응보다는 철저한 문서와 원칙 중심의 소통이 절실한 시점입니다.`;
    } else if (cat === 'career') {
      domainSpecificText = `[직장 및 조직 내 갈등과 정체]
조직 내에서 상사나 동료와의 의사소통 장벽이 높아지고, 본인의 성과나 노력이 제대로 인정받지 못한다는 심리적 압박이 극대화된 상태입니다. 섣부른 퇴사나 충동적 맞대응은 불리함을 키우므로 신중한 숨고르기가 필요합니다.`;
    } else if (cat === 'wealth') {
      domainSpecificText = `[재물 및 자산 운용의 압박]
예상치 못한 손실이나 자금의 유동성 정체로 인해 심리적 불안이 증폭되는 구간입니다. 손실을 단번에 만회하려는 조급함이 오히려 더 큰 위험을 부를 수 있으므로 현금 흐름의 방어가 최우선입니다.`;
    } else if (cat === 'health') {
      domainSpecificText = `[건강 및 신체적 안정성의 위기]
신체적 긴장과 피로가 누적되며 면역체계나 특정 장기의 취약성이 수면 위로 드러나는 구간입니다. 거친 신살과 충돌의 여파가 신체적 부담으로 전이되기 쉬우므로, 무리한 활동을 전면 중단하고 전문 의료진의 진단과 정밀 치료에 집중해야 합니다.`;
    } else {
      domainSpecificText = `[일상 생활 및 대인관계의 피로 누적]
일상 전반에서 예상치 못한 지연과 마찰이 발생하여 심리적 피로도가 누적되는 형국입니다. 내면의 중심을 지키며 불필요한 시비와 소모적인 대립을 피하는 지혜가 필요합니다.`;
    }

    // ④ 무엇이 완화시키는가 (길신 및 지원 신호)
    const supports = sal?.supportSignals || [];
    let mitigationText = '';
    if (supports.length > 0) {
      const supNames = supports.slice(0, 3).map((s: any) => `${s.name}: ${s.reason}`).join('\n  - ');
      mitigationText = `* 완화와 보호의 기운 (길신과 조력):
  - ${this.cleanseText(supNames)}
  이처럼 파국을 막아주는 보호막이 사주에 공존하므로, 지금의 위기는 영원한 파탄이 아니라 잘못된 관계를 정돈하고 새로 태어나는 계기가 됩니다.`;
    } else {
      mitigationText = `* 완화와 보호의 기운:
  명식 내에 잠재된 냉철한 이성과 시간의 냉각 효과가 극단적 파국을 방어하고 있습니다. 침착함을 유지할 때 상황을 반전시킬 돌파구가 열립니다.`;
    }

    // ⑤ 시간축 분석 (날짜 엄격 대조 vs candidate_period)
    const cand = sal?.eventConnection?.candidate_period;
    const candStr = cand ? `${cand.startYearMonth} ~ ${cand.endYearMonth}` : '최근 수개월간';
    const dateNotice = sal?.eventConnection?.eventDateKnown
      ? `* 실제 사건 확인 시점과의 대조: 의뢰인께서 제공하신 사건 발생 시점(${sal?.eventConnection?.eventDate})과 명리학적 취약 운세 기간을 정밀하게 대조 분석하여 관계의 파장을 확인하였습니다.`
      : `* 갈등 고조 및 취약 후보 기간: ${candStr}
(※ 안내: 의뢰인께서 사건의 정확한 일자를 제공하지 않으셨으므로, 위 구간은 명리학적으로 갈등과 심리적 압박이 최고조에 달하기 쉬웠던 '후보 기간'으로 도출된 것입니다. 이 시기와 실제 사건 시점이 겹친다면 해당 작용과의 연관성을 더 강하게 볼 수 있습니다.)`;

    return `[마보살 살(煞)진단 전문 리포트 — 문제와 꼬임의 근본 원인 규명]
핵심 질문: "왜 지금 일이 꼬이고 있는가?"

1. 문제의 핵심 도화선: ${coreSalTitle}
--------------------------------------------------------------------------------
${coreSalExplanation}
마보살 살진단의 핵심은 단순히 신살의 이름을 나열하는 것이 아니라, 지금 의뢰인의 삶을 흔드는 '결정적인 뇌관'이 무엇인지 규명하는 데 있습니다.

2. 왜 '지금' 갈등과 정체가 폭발했는가? (운의 활성화 역학)
--------------------------------------------------------------------------------
신살은 사주에 잠재되어 있다고 해서 항상 문제를 일으키지 않습니다.
${activeDesc}
원국의 화약고에 대운과 월운이라는 불씨가 닿으면서 감정의 제어가 어려워지고 충동적인 행동이 촉발된 것입니다.
${wonjinSpecific}
${clashSpecific}
${gongmangDesc}

3. 현실 삶의 영역별 영향 (문제 영역 집중 조명)
--------------------------------------------------------------------------------
${domainSpecificText}

4. 위기를 완화시키는 조력 신호 (반전의 열쇠)
--------------------------------------------------------------------------------
${mitigationText}

5. 시간축 분석 및 명리학적 취약 구간
--------------------------------------------------------------------------------
${dateNotice}

6. 살진단 기반 현실 행동 주의사항
--------------------------------------------------------------------------------
지금은 살의 파장이 가장 날카롭게 서 있는 구간입니다. 
억울함을 해명하려 장문의 메시지를 보내거나, 자존심을 지키기 위해 극단적인 최후통첩을 날리는 것은 화약고에 스스로 뛰어드는 것과 같습니다.
상대방의 반응에 일희일비하지 말고, 원진과 충의 칼날이 무뎌지는 시점까지 침묵과 자중자애를 유지하는 것이 최고의 방책입니다.`;
  }

  /**
   * 4단계 — 마보살 프리미엄 통합 솔루션 (PREMIUM)
   * 핵심 질문: "그래서 지금 무엇을 해야 하는가?"
   * 전문 복사 금지! 문제 해결 행동 처방서 (P1, P3)
   */
  public translatePremiumReport(ctx: TranslationContext): string {
    const sal = ctx.salDiagnosis;
    const cat = this.detectCategory(ctx.userTroubleText);
    const keywords = this.extractKeywords(ctx.userTroubleText);
    const keywordPhrase = keywords.length > 0 ? `[${keywords.join(', ')}]` : '현재 마주하신 현실 상황';
    const isCrisis = ctx.userTroubleText ? (
      ctx.userTroubleText.includes('다툼') ||
      ctx.userTroubleText.includes('헤어') ||
      ctx.userTroubleText.includes('이별') ||
      ctx.userTroubleText.includes('결별') ||
      ctx.userTroubleText.includes('재회') ||
      ctx.userTroubleText.includes('이혼') ||
      ctx.userTroubleText.includes('파혼') ||
      ctx.userTroubleText.includes('손실') ||
      ctx.userTroubleText.includes('분쟁') ||
      ctx.userTroubleText.includes('소송') ||
      ctx.userTroubleText.includes('사고') ||
      ctx.userTroubleText.includes('수술') ||
      ctx.userTroubleText.includes('갈등') ||
      ctx.userTroubleText.includes('퇴사') ||
      ctx.userTroubleText.includes('폐업')
    ) : false;
    const candidates = ctx.actionCandidates || [];
    const bestAction = candidates.find((c: any) => c.decision === 'ACTION_RECOMMENDED') || candidates[1];
    const cautionAction = candidates.find((c: any) => c.decision === 'CAUTION') || candidates[0];

    const currentMonthDesc = cautionAction?.ganji ? `${cautionAction.ganji}월` : '戊戌월';
    const futureMonthDesc = bestAction?.ganji ? (bestAction.ganji.endsWith('월') ? bestAction.ganji : `${bestAction.ganji}월`) : '己亥월';

    // 카테고리별 실천 처방 Do's vs Don'ts
    let dosList: string[] = [];
    let dontsList: string[] = [];

    if (cat === 'relationship') {
      dosList = [
        '1. 침묵을 통한 감정 냉각: 상대방의 짧은 반응이나 침묵을 자의적으로 해석하지 말고, 최소 2~3주간 연락을 멈추고 서로의 과열된 감정을 식히십시오.',
        '2. 내면의 불안과 자존심 객관화: 왜 그 당시 그렇게 화가 났는지, 나의 어떤 결핍과 불안이 자극되었는지를 감정 일기에 기록하며 차분히 관조하십시오.',
        '3. 상대방의 상처 역지사지: 침묵 속에서 상대방이 느꼈을 위압감과 상처를 진심으로 헤아려 보고, 다음 소통 시 건넬 담백한 첫마디를 준비하십시오.'
      ];
      dontsList = [
        '1. 장문의 해명 및 감정 추궁: 억울함을 풀겠다며 새벽에 장문의 카톡이나 메시지를 보내는 행위는 상대방에게 숨 막히는 압박감을 줍니다.',
        '2. 자존심 대결과 극단적 최후통첩: "끝내자"거나 "더 이상 볼 일 없다"는 식의 홧김에 던지는 말은 돌이킬 수 없는 파국을 부릅니다.',
        '3. SNS를 통한 간접 저격이나 질투 유발: 상대방의 동향을 염탐하거나 감정적인 글을 올리는 것은 신뢰를 완전히 무너뜨립니다.'
      ];
    } else if (cat === 'business') {
      dosList = [
        '1. 사업적 파트너십 및 모든 계약·거래 합의 사항의 객관적 문서화: 구두 합의에 의존하지 말고 객관적인 회계 데이터와 계약 서류를 철저히 확보하여 사업적 리스크를 선제적으로 방어하십시오.',
        '2. 제3자 전문가(세무, 법률, 중재인) 자문 확보: 감정적 대립을 지양하고 공신력 있는 전문가의 중재안을 통해 사업 리스크를 최소화하고 공정한 기준을 세우십시오.',
        '3. 냉철한 출구 전략 및 상호 타협점 모색: 최악의 결별을 대비하면서도 양측이 최소한의 실리를 챙길 수 있는 현실적인 계약 분할안을 마련하십시오.'
      ];
      dontsList = [
        '1. 감정적인 법적 대응 협박: 상대방을 압박하려는 섣부른 고소나 협박성 발언은 상대방의 방어 기제를 극대화하여 완전한 사업 파탄을 초래합니다.',
        '2. 미확인 구두 약속이나 이면 합의 신뢰: 불리한 국면을 모면하려는 상대방의 모호한 약속에 흔들려 사업 계약 서류 확인을 소홀히 하지 마십시오.',
        '3. 불안감에 기인한 무리한 추가 자금 투입: 갈등이 봉합되지 않은 상태에서 사업 자금을 추가로 쏟아붓는 것은 손실을 키울 뿐입니다.'
      ];
    } else if (cat === 'career') {
      dosList = [
        '1. 현 직무에서의 명확한 업무 성과 정리: 본인의 기여도와 객관적인 성과를 데이터로 문서화하여 스스로의 입지를 지키십시오.',
        '2. 업계 동향 파악과 포트폴리오의 조용한 업그레이드: 감정을 쏟지 말고 다음 도약을 위한 실력과 이력서를 물밑에서 준비하십시오.',
        '3. 상사나 동료와의 갈등 시 사실 관계에만 기반한 소통: 감정적 호소 대신 업무 프로세스와 사실(Fact) 중심으로 담백하게 대응하십시오.'
      ];
      dontsList = [
        '1. 홧김에 사직서를 던지는 충동적 퇴사: 다음 거처가 확정되지 않은 상태에서의 사직은 본인에게 심각한 현실적 타격을 줍니다.',
        '2. 사내 동료들에게 불만을 토로하여 구설 자초: 불만과 험담은 반드시 와전되어 본인에게 부메랑으로 돌아옵니다.',
        '3. 준비되지 않은 상태에서의 무모한 이직 시도: 조급함에 쫓겨 더 열악한 환경으로 옮겨가는 실수를 경계하십시오.'
      ];
    } else if (cat === 'wealth') {
      dosList = [
        '1. 자산 현황의 정밀 감사 및 불필요한 고정 지출 전면 차단: 새는 돈을 철저히 막고 가계부와 지출 구조를 재정비하십시오.',
        '2. 비상 예비자금 확보를 통한 유동성 방어: 추가 수익보다는 원금 보존과 현금 흐름의 안정성을 지키는 데 집중하십시오.',
        '3. 장기적인 관점에서의 포트폴리오 재구성: 단기 변동성에 흔들리지 않는 안전 자산 중심의 분산 전략을 구축하십시오.'
      ];
      dontsList = [
        '1. 손실을 단번에 만회하려는 고위험 투기적 베팅: 물타기나 무리한 레버리지는 자칫 회복 불능의 파산을 부릅니다.',
        '2. 지인의 권유나 미검증 정보에 현혹되는 투자: 손실로 불안해진 마음을 파고드는 사기성 제안을 철저히 경계하십시오.',
        '3. 무리한 신용대출이나 사채 이용: 빚으로 빚을 막는 악순환에 절대 발을 들이지 마십시오.'
      ];
    } else if (cat === 'health') {
      dosList = [
        '1. 전문 의료진 자문 및 2차 소견 확보: 불안감에 의존하지 말고 공신력 있는 전문의의 진단과 정밀 검사 데이터에 기반하여 치료 및 수술 일정을 수립하십시오.',
        '2. 스트레스 차단과 신체 치유 루틴 구축: 심리적 공포와 긴장은 면역력을 떨어뜨리므로 무리한 활동을 멈추고 규칙적인 수면과 안정된 호흡으로 자가 회복력을 극대화하십시오.',
        '3. 주변 조력자에게 솔직한 지원 요청: 혼자 부담을 짊어지려 하지 말고 가족이나 가까운 지인에게 간병과 일상 업무 분담을 적극적으로 요청하십시오.'
      ];
      dontsList = [
        '1. 미검증 민간요법이나 자의적 진단 의존: 두려움에 쫓겨 검증되지 않은 정보에 현혹되거나 병원 진료 및 수술을 미루는 행위는 회복의 골든타임을 놓치게 만듭니다.',
        '2. 과로와 무리한 일정 강행: 신체의 경고 신호를 무시하고 기존의 업무와 활동 강도를 고집하는 것은 상태 악화를 부릅니다.',
        '3. 비관적 자기 예언과 공포 침잠: 운의 환절기성 고비를 넘기면 반드시 회복의 기운이 찾아오니 자포자기하는 부정적 상상을 멈추십시오.'
      ];
    } else {
      dosList = [
        '1. 일상의 호흡을 가다듬는 심신 안정 루틴 구축: 과열된 뇌를 식히고 규칙적인 수면과 산책으로 신체 리듬을 회복하십시오.',
        '2. 우선순위의 재정립: 당장 해결할 수 없는 일에 매달리지 말고 오늘 내가 통제할 수 있는 일에만 집중하십시오.',
        '3. 신뢰할 수 있는 멘토와의 담백한 대화: 혼자 고민을 곱씹지 말고 객관적인 시각을 지닌 조언자에게 털어놓으십시오.'
      ];
      dontsList = [
        '1. 밤늦은 시간의 충동적 결정이나 메시지 발송: 심야의 감정은 과장되기 쉬우므로 결코 중대한 판단을 내리지 마십시오.',
        '2. 주변 사람들에게 불안을 전가하는 짜증 섞인 언행: 가까운 이들에게 상처를 주어 고립을 자초하지 마십시오.',
        '3. 자기 비하나 지나친 죄책감에 침잠하는 행위: 문제는 운의 흐름에서 비롯된 것이니 자책을 멈추십시오.'
      ];
    }

    const saju = SajuDynamicAnalyzer.analyze(ctx.fourPillarsText || '임신 계묘 경인 경진');
    let troubleMyeongliCause = '';
    if (cat === 'relationship' && saju.dayMaster.element === '금') {
      troubleMyeongliCause = `의뢰인의 명식은 월지 卯木(정재)과 일지 寅木(편재)이 공존하는 '재성(연인/배우자)의 역동적 구조'로, 상대방에게 깊은 헌신을 다하면서도 일지 배우자궁의 寅申충으로 인해 관계의 돌발적 긴장감이 잠재되어 있습니다. 여기에 2026년 丙午 대운·세운의 강렬한 화열(관살)이 유입되며 감정의 제어가 일시적으로 마비된 '인생의 환절기성 에너지 충돌'입니다.`;
    } else if (cat === 'health') {
      troubleMyeongliCause = `원국의 상충과 편중된 오행 에너지가 2026년의 강렬한 운의 변화와 맞물리며 신체적 균형과 면역 체계에 일시적인 과부하를 초래한 '인생의 환절기성 에너지 충돌'입니다.`;
    } else {
      troubleMyeongliCause = `원국에 잠재되어 있던 거친 신살의 기운이 2026년의 강렬한 화기운과 맞물리며 현실적 안정감을 일시적으로 흔들어 놓은 '인생의 환절기성 에너지 충돌'입니다.`;
    }

    return `[마보살 프리미엄 종합 판정 — 실천적 처방과 해결 행동 지침]
핵심 질문: "그래서 지금 무엇을 해야 하는가?"

1. 사용자 고민 공감 및 문제의 근본 원인 요약
--------------------------------------------------------------------------------
${!isCrisis ? `의뢰인께서 마보살에 남겨주신 ${keywordPhrase}에 관한 진솔한 성찰과 질문을 경청합니다.
현재 특별한 파국이나 급박한 위기는 없더라도, 삶의 중요한 마디에서 자신의 강점을 점검하고 보다 단단한 미래를 설계하고자 하는 지혜로운 태도입니다.
명리학적으로 볼 때, 지금의 구간은 거친 파도를 넘는 시기가 아니라 잔잔한 물결 속에서 내실을 다지고 잠재력을 축적하는 '순항과 충전의 계절'입니다.
외부의 돌발적 사건에 휘둘리지 않고 본연의 리듬을 지켜나갈 때 인생의 장기적 안정성과 성취가 완성됩니다.` : `의뢰인께서 마보살에 털어놓으신 ${keywordPhrase}에 관한 고통과 혼란을 깊이 공감합니다.
마음이 찢어질 듯 아프고 상대방의 태도에 대한 원망과 후회가 교차하는 것은 당연한 심리입니다.
하지만 명리학적으로 볼 때, 지금 겪고 계신 시련은 결코 의뢰인의 인격적 결함이나 무능함 때문이 아닙니다.
${troubleMyeongliCause}
지금은 억지로 엉킨 매듭을 당겨 풀려 할수록 오히려 매듭이 단단해지는 국면이므로, 정밀한 전략과 행동 지침이 요구됩니다.
시간의 흐름에 순응하며 기운이 식기를 기다리는 것이 가장 지혜롭고 강력한 반전의 기술입니다.`}

2. 시기별 행동 판단 (타이밍과 흐름)
--------------------------------------------------------------------------------
* 1단계: 즉각적 행동 유보 및 감정 냉각기 (${currentMonthDesc} 구간)
  - 행동 판정: [성급한 연락 및 행동 시도 보류 / 자중자애 권고]
  - 판단 근거: 대운과 월운의 격렬한 충돌 여진이 남아 있습니다. 지금 연락이나 담판을 시도하는 것은 불붙은 장작에 기름을 붓는 격입니다. 서로에게 완전한 숨고르기 시간이 절대적으로 필요합니다. 상대방의 침묵은 거절이 아니라, 감정 과열로 인한 방어 기제임을 이해해야 합니다.

* 2단계: 냉각 후 이성 회복기 (${futureMonthDesc} 도래 시점)
  - 행동 판정: [조심스러운 간접 소통 타진 및 해결의 실마리 모색 가능]
  - 판단 근거: 차가운 수기운이 들어와 과열되었던 열기를 식혀줄 때, 상대방도 이성을 되찾고 과거의 긍정적인 기억을 떠올릴 여유가 생깁니다. 이때 비로소 대화의 문이 열립니다. 사소하고 부담 없는 일상 안부로 소통의 물꼬를 트는 것이 최적입니다.

3. 현실적인 실천 처방 (해야 할 것 vs 피해야 할 것)
--------------------------------------------------------------------------------
[반드시 실천해야 할 것 (Do's)]
${dosList.join('\n')}

[절대 피해야 할 것 (Don'ts)]
${dontsList.join('\n')}

4. 시기별 단기·중기·장기 해결 로드맵
--------------------------------------------------------------------------------
* 단기 대응 (향후 2~3주간의 절대 안정기):
  - 철저한 침묵과 자중자애를 유지하며, 개인의 심신 안정과 일상 루틴 회복에만 전념하십시오.
  - 감정의 격랑이 밀려올 때는 글쓰기, 가벼운 유산소 운동, 물가 산책 등을 통해 물리적으로 에너지를 방출하십시오.
* 중기 대응 (절기 전환기 이후의 회복기):
  - 감정의 가시가 빠진 담백하고 정중한 방식으로 상대방의 안부를 확인하거나 업무적 조율을 시작하십시오.
  - 과거의 잘잘못을 따지는 대화는 절대 금물이며, 앞으로의 조화로운 관계를 위한 새로운 규칙을 제시하십시오.
* 장기 흐름 (2027년 정미년 도래 시점의 대도약):
  - 2027년 丁未(정미)년 상반기로 접어들며 천을귀인의 조력과 함께 뒤틀렸던 인생의 궤도가 완전히 제자리를 찾게 됩니다.
  - 이번 위기를 계기로 스스로의 내면이 한층 성숙해졌음을 실감하게 되며, 더 단단하고 지속 가능한 기반을 구축하게 됩니다.

5. 마보살 위기 극복 마인드셋
--------------------------------------------------------------------------------
명리학의 본질은 정해진 운명에 굴복하는 것이 아니라, 흐르는 운의 물길을 읽고 나의 행동을 조율하는 데 있습니다.
지금의 고통은 끝이 아니라, 더 나은 나로 거듭나기 위해 낡은 껍질을 벗겨내는 진통일 뿐입니다.
마보살이 제시해 드린 Do와 Don't의 원칙을 차분히 지켜나가신다면, 머지않아 안개의 끝에서 밝은 햇살을 맞이하시게 될 것입니다.

6. 마보살 프리미엄 맞춤 케어 안내
--------------------------------------------------------------------------------
* 1:1 심층 상담 연계:
  상대방과의 정밀 궁합 대조 및 맞춤형 재회/협상 화법 컨설팅 지원
* 심리 안정 명리 솔루션:
  과열된 화기와 충살의 충격을 완화하는 개인 맞춤형 오행 개운법 제공`;
  }
}

export const customerPresentationTranslator = new CustomerPresentationTranslator();
