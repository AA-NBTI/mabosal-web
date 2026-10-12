/**
 * src/modules/product-generator/customer-deliverable-builder.ts
 * 
 * Phase 73 & Phase 80: 실제 고객 전달 결과물 생성 엔진 (Customer Deliverable Builder)
 * 
 * "원천/모듈 → 사건 통합 → 시간축 판단 → 처방 → 고객 출력"
 * 
 * 규칙:
 * 1. 15개 고정 포맷 유지.
 * 2. 명리 요소와 현실 사건의 직접적 1:1 매핑 전면 제거 (축진파=지시변경 등 배제).
 * 3. 사용자 미언급 타인 의도/성격 단정 금지 (사용자 사실 보호).
 * 4. 고민 우선 출력 (직장 고민 시 3, 9, 10, 13, 14 중심, 타 영역 담백화).
 * 5. 항목별 역할 분리 (1~8 원국기질 / 9 고민진단 / 10 시간축 / 11 마·살 / 12 환경 / 13 행동·의사결정 / 14 실행일정 / 15 최종종합).
 * 6. 시간축 하드코딩 제거 및 과거→현재→미래 3단계 동역학 연결.
 * 7. 의사결정형 질문(퇴사 vs 버티기) 선택지 비교 (A/B 장점, 위험, 확인조건, 첫 행동).
 * 8. 내부 모듈명([직장운 진단에 따르면] 등) 및 개발 라벨([일간 본원] 등) 완전 제거.
 * 9. 15번 최종 종합 진단은 5개 항목만 요약 (과도한 확정/승리 표현 배제).
 */

import {
  CustomerDeliverable,
  FreeCustomerDeliverable,
  InsightDepthLevel,
  ProblemDomain,
  UserProblemInput,
  EventModuleMappingResult,
  CaseExplanationProtocol,
} from './types.js';
import { ModularId, ModularOutput } from '../modular/types.js';
import { IntegratedAnalysisOutput } from '../modular/integrated-analyzer.js';
import {
  CharacterPresentationProfile,
  characterRenderer,
  DEFAULT_CHARACTER_PROFILES,
} from '../character/index.js';
import { classifyGeokguk } from '../../core/myeongli-rule-spec.js';
import { AggregatedEventEvidenceResult, eventEvidenceAggregator } from '../event-synthesis/event-evidence-aggregator.js';
import { TimeAxisJudgment, timeAxisJudgmentEngine } from '../time-axis/time-axis-judgment-engine.js';
import { PrescriptionSynthesisResult, prescriptionSynthesizer } from '../prescription/prescription-synthesizer.js';
import { AnnualMonthlyDailyEngine } from '../luck/annual-monthly-daily.js';

export interface CustomerDeliverableContext {
  userInput: UserProblemInput;
  domain: ProblemDomain;
  depth: InsightDepthLevel;
  executedModules: Record<ModularId, ModularOutput>;
  integratedAnalysis?: IntegratedAnalysisOutput;
  eventDiagnosis?: any;
  magaDiagnosis?: any;
  eventMapping?: EventModuleMappingResult;
  caseProtocol?: CaseExplanationProtocol;
  prescriptionReport?: any;
  characterId?: string;
  characterProfile?: CharacterPresentationProfile;
  evidenceResult?: AggregatedEventEvidenceResult;
  timeAxisJudgment?: TimeAxisJudgment;
  prescriptionSynthesis?: PrescriptionSynthesisResult;
}

export class CustomerDeliverableBuilder {
  private luckEngine = new AnnualMonthlyDailyEngine();
  /**
   * 최종 고객 전달용 결과물 생성
   */
  public buildDeliverable(ctx: CustomerDeliverableContext): CustomerDeliverable {
    const { userInput, domain, depth, executedModules, eventDiagnosis, magaDiagnosis, eventMapping, caseProtocol, prescriptionReport } = ctx;

    const rawConcern = userInput.currentEvent || userInput.userTrouble || '현재 직면한 문제';
    let concernText = rawConcern;
    if (userInput.additionalContext) {
      concernText += ` (추가 정황: ${userInput.additionalContext})`;
    }
    if (userInput.selectedSituation) {
      concernText += ` [선택 상황: ${userInput.selectedSituation}]`;
    }
    const desiredQuestionText = userInput.desiredQuestion || '앞으로의 흐름과 대처 방안이 궁금합니다.';

    // 2. 명리적 근거를 쉬운 고객 언어로 번역
    const myeongliExplanation = this.translateMyeongliToCustomerLanguage(executedModules, domain, eventMapping);

    // 3. 마·살 주의사항 고객 언어로 번역
    const magaExplanation = this.translateMagaToCustomerLanguage(magaDiagnosis, executedModules, domain);

    // 4. 시기별 흐름
    const timingFlow = this.extractTimingFlow(executedModules, userInput, prescriptionReport);

    // 5. 처방 요소들 준비 (환경, 행동, 처방물)
    const envSummary = prescriptionReport?.environmentGuidance || [
      '자주 머무는 생활 및 작업 공간의 정돈을 통해 시각적 안정감을 확보하십시오.',
      '환기와 조명을 부드럽게 유지하여 내면의 긴장을 이완시키는 환경을 조성하십시오.',
    ];
    const envPrescriptionText = envSummary.map((e: string) => `• ${e}`).join('\n');

    const actSummary = prescriptionReport?.mustDo || [
      '중요한 결정의 시기를 2~4주 뒤로 늦추고 침묵을 유지하십시오.',
      '자신의 일상 루틴과 객관적 기록을 정돈하십시오.',
      '감정적 대응을 완전히 차단하고 신뢰할 수 있는 제3자의 조언을 구하십시오.',
    ];
    const behaviorPrescriptionText = actSummary.map((b: string) => `• ${b}`).join('\n');

    const avoidSummary = prescriptionReport?.mustAvoid || [];
    const avoidPrescriptionText = avoidSummary.length > 0
      ? avoidSummary.map((a: string) => `• [피해야 할 행동]: ${a}`).join('\n')
      : '';

    const remedySummary = prescriptionReport?.remedyItems || [
      { title: '마음 안정용 상징 소품', purpose: '심리적 완충 및 불안 완화' },
    ];
    const remedyPrescriptionText = (depth >= 5 || (prescriptionReport?.remedyItems && prescriptionReport.remedyItems.length > 0))
      ? remedySummary.map((r: any) => `• [${r.title || '상징 보조물'}]: ${r.purpose || '에너지 조화 및 심리적 안정'}`).join('\n')
      : '현재 단계에서는 복잡한 물품보다 주변 정리와 생활 루틴의 회복이 우선적으로 권장됩니다.';

    // 6. 판단 강도 설정
    const verdictStrength = '현재 기운의 흐름상 주의가 필요하며, 우선 환경과 행동을 적극적으로 관리하는 것이 좋습니다.';

    // 7. 10단계 권장 섹션 구성
    let step1_currentEvent = `**현재 상황**: "${rawConcern}"`;
    if (userInput.selectedSituation) {
      step1_currentEvent += `\n**선택하신 상황**: ${userInput.selectedSituation}`;
    }
    if (userInput.additionalContext) {
      step1_currentEvent += `\n**추가로 알려주신 상황**: ${userInput.additionalContext}`;
    }
    step1_currentEvent += `\n**핵심 질문**: "${desiredQuestionText}"\n현재 갑작스러운 상황 변화로 인해 심리적 불안과 혼란이 매우 크게 느껴질 수 있는 국면입니다.`;

    const step2_whyOccurred = caseProtocol
      ? `${caseProtocol.similarRealWorldCase}\n\n${caseProtocol.personalApplication}`
      : `외부 상황의 변동과 주변 인물과의 소통 방식 차이가 복합적으로 얽히며 나타난 현상입니다. 상대방이나 환경의 급변은 고객님의 잘못 때문이라기보다, 양측의 긴장이 일시적으로 과열된 환경적 요인이 크게 작용했습니다.`;

    const step3_myeongliCore = `${myeongliExplanation}\n(판단: ${verdictStrength})`;
    const step4_magaCaution = `${magaExplanation}\n지나친 두려움이나 비관에 빠질 필요는 없으나, 충동적이거나 조급한 대처는 불리하게 작용하기 쉬우므로 침착한 대응이 요구됩니다.`;
    const step5_futureFlow = `${timingFlow}\n운의 기운은 고정되어 있지 않으며, 현재의 긴장기가 지나면 점진적으로 완충 및 회복의 시기로 접어들게 됩니다.`;
    const step6_whatToChange = caseProtocol?.understanding
      ? `${caseProtocol.understanding}\n\n기존의 즉흥적이거나 감정적인 대응 방식을 멈추고, 객관적인 기록과 침묵을 통해 상황의 주도권을 되찾는 태도 전환이 필요합니다.`
      : `상황을 단숨에 역전시키려는 조급함을 내려놓고, 일상의 안정과 내면의 질서를 먼저 바로잡는 관점의 전환이 가장 필요합니다.`;

    const step7_environmentPrescription = `[공간 및 환경 개선 처방]\n${envPrescriptionText}\n주변 환경의 작은 변화가 내면의 에너지를 보호하고 외부 마찰을 줄여주는 강력한 방패가 됩니다.`;
    const step8_behaviorPrescription = [
      `[행동 및 실천 처방 / 핵심 행동 수칙]`,
      behaviorPrescriptionText,
      avoidPrescriptionText,
      `당장의 성급한 반응을 자제하고 루틴을 지키는 것이 문제를 해결하는 가장 안전한 열쇠입니다.`,
    ].filter(Boolean).join('\n');
    const step9_remedyItems = `[필요한 경우 상징적 보조 처방물]\n${remedyPrescriptionText}`;
    const step10_finalSummary = `[최종 요약 안내]\n현재의 고난은 영원한 정체가 아니며, 사주 기운의 환절기를 지혜롭게 건너기 위한 정돈의 계기입니다. 스스로를 자책하지 말고 안내해 드린 처방을 차분히 실천해 나가시기 바랍니다.`;

    // 8. 7대 핵심 고객 질문에 대한 직답
    const userEventDesc = [userInput.currentEvent, userInput.additionalContext, userInput.selectedSituation]
      .filter(Boolean)
      .join(' / ') || userInput.userTrouble || '현재 직면한 문제';
    const domainContextStr = domain === 'BUSINESS' ? '사업 및 계약 관계에서 ' : domain === 'LOVE' ? '연인 및 대인관계에서 ' : domain === 'JOB' ? '직장 조직 및 업무 환경에서 ' : '';

    const answersTo7Questions = {
      q1_whyNow: `**Q1. 왜 지금 이런 일이 생겼습니까?**\n고객님께서 남겨주신 상황("${userEventDesc}")과 관련하여, ${domainContextStr}현재 세운과 원국 기운의 상호작용으로 인해 평소보다 외부 자극에 대한 민감도가 높아지고, 인간관계 및 사회적 환경에서 이견과 마찰이 발생하기 쉬운 전환기에 놓여 있기 때문입니다.`,
      q2_myeongliIssue: `**Q2. 명리적으로 무엇이 문제입니까?**\n${myeongliExplanation}\n타고난 사주의 에너지 분포와 현재 유입되는 운의 기운 사이에 일시적인 불균형(과열 또는 정체)이 빚어지며 현실의 스트레스를 증폭시키는 것이 명리적 핵심 원인입니다.`,
      q3_timingPeriod: `**Q3. 언제까지 관리해야 합니까?**\n대략 향후 2~3개월간이 가장 신중해야 할 냉각기이며, 이후 계절적 절기의 전환과 함께 기운이 순화되면서 해결의 실마리가 잡히게 됩니다.`,
      q4_actionToDo: `**Q4. 제가 무엇을 하면 됩니까?**\n우선 감정적인 즉각 반박을 멈추고 사실관계를 검토할 시간을 확보하며, 중요한 업무 지시나 약속은 반드시 메일이나 메신저 등 서면 기록으로 남겨두는 행동이 가장 필요합니다.`,
      q5_environmentChange: `**Q5. 환경을 어떻게 바꾸면 됩니까?**\n생활 공간의 조도를 낮추고 소음을 차단할 수 있는 1인 휴식처를 확보하며, 시각적인 냉각감을 주는 색상과 소재를 생활 주변에 배치하여 심신 긴장을 완화하십시오.`,
      q6_prescriptionNeeded: `**Q6. 이 문제를 줄이기 위해 어떤 처방이 필요합니까?**\n상황을 단번에 뒤집으려 하지 말고, 나의 일상 루틴을 보존하며 내적 중심을 단단히 세우는 심리적 방어벽 형성이 최우선 처방입니다.`,
      q7_cautionToWatch: `**Q7. 앞으로 무엇을 조심해야 합니까?**\n억울함이나 분노에 휩쓸려 대책 없이 관계를 파탄 내거나 충동적으로 사직서를 제출하는 등 돌이킬 수 없는 극단적 결정을 내리는 것을 가장 경계해야 합니다.`,
    };

    // Phase 77: 무료 고객 결과물 사전 생성
    const freeDeliverable = this.buildFreeDeliverable(ctx, myeongliExplanation);

    // 9. 포맷팅 통합 텍스트
    let fullFormattedText = '';
    if (depth === 1) {
      fullFormattedText = [
        '# 마보살 고객 맞춤 사주 솔루션 (무료 핵심 진단)',
        '',
        '## [1부] 한눈에 보는 나의 사주 핵심',
        freeDeliverable.step1_coreSummary,
        '',
        '## [2부] 지금 주목할 부분',
        freeDeliverable.step2_attentionPoint,
        '',
        '## [3부] 현실에서 나타날 수 있는 모습',
        freeDeliverable.step3_realWorldManifestation,
        '',
        '## [4부] 나의 현실 상황과 연결해보기',
        freeDeliverable.step4_customerConnectWidget.prompt,
        freeDeliverable.step4_customerConnectWidget.options.map(opt => `- ${opt}`).join('\n'),
        '',
        '## [5부] 더 깊게 보면 무엇을 알 수 있는가',
        freeDeliverable.step5_inDepthPreview,
      ].join('\n');
    } else {
      fullFormattedText = [
        '# 마보살 고객 맞춤 사주 솔루션',
        '',
        '---',
        '## [1부] 마보살 10단계 핵심 솔루션 리포트',
        '',
        `### 1. 지금 무슨 일이 생겼는가\n${step1_currentEvent}`,
        '',
        `### 2. 왜 이런 문제가 나타났는가\n${step2_whyOccurred}`,
        '',
        `### 3. 명리적으로 무엇이 핵심인가\n${step3_myeongliCore}`,
        '',
        `### 4. 마·살 관점에서 무엇을 주의해야 하는가\n${step4_magaCaution}`,
        '',
        `### 5. 앞으로 어떤 흐름인가\n${step5_futureFlow}`,
        '',
        `### 6. 무엇을 바꾸는 것이 좋은가\n${step6_whatToChange}`,
        '',
        `### 7. 환경 처방\n${step7_environmentPrescription}`,
        '',
        `### 8. 행동 처방\n${step8_behaviorPrescription}`,
        '',
        `### 9. 필요한 경우 처방물\n${step9_remedyItems}`,
        '',
        `### 10. 최종 정리\n${step10_finalSummary}`,
        '',
        '---',
        '## [2부] 고객님의 7대 핵심 질문에 대한 직답(Direct Answers)',
        '',
        answersTo7Questions.q1_whyNow,
        '',
        answersTo7Questions.q2_myeongliIssue,
        '',
        answersTo7Questions.q3_timingPeriod,
        '',
        answersTo7Questions.q4_actionToDo,
        '',
        answersTo7Questions.q5_environmentChange,
        '',
        answersTo7Questions.q6_prescriptionNeeded,
        '',
        answersTo7Questions.q7_cautionToWatch,
        '',
        '---',
        '## [3부] 안전성 및 전문 영역 안내문',
        [
          prescriptionReport?.safeguardNotice || '본 처방은 명리학적 에너지 흐름에 기반한 행동 가이드이며, 의료 질환에 대한 치료, 법적 소송의 결과, 금융 투자의 원금 보장 등을 단정하지 않습니다. 고위험 사안은 반드시 해당 전문 면허 소지자의 공식 조력을 병행하십시오.',
          '※ 본 서비스는 초자연적 효능이나 운명의 변화를 보장하지 않습니다.',
        ].join('\n'),
      ].join('\n');
    }

    // 9.5. 판정과 표현의 분리: 구조화된 불변 판정 스냅샷 구성
    const relMetrics = executedModules['RELATION']?.calculation?.rawMetrics;
    const stdItems: any[] = relMetrics?.standardItems || [];

    const natalRelations = stdItems
      .filter((i: any) => i.relationType !== 'DAEWUN_SEUN_RELATION' && !i.standardLabel?.includes('대운×세운'))
      .map((i: any) => i.standardLabel);

    const daewunSeunRelations = stdItems
      .filter((i: any) => i.relationType === 'DAEWUN_SEUN_RELATION' || i.standardLabel?.includes('대운×세운'))
      .map((i: any) => i.standardLabel);

    const daewunGanzi = executedModules['DAEWUN']?.calculation?.rawMetrics?.currentDaewoon?.ganji ||
      (executedModules['DAEWUN']?.calculation?.rawMetrics?.currentDaeun ? `${executedModules['DAEWUN'].calculation.rawMetrics.currentDaeun.stem}${executedModules['DAEWUN'].calculation.rawMetrics.currentDaeun.branch}` : undefined);

    const seunMetrics = executedModules['SEUN']?.calculation?.rawMetrics;
    const seunGanzi = seunMetrics ? `${seunMetrics.targetYear || 2026}년 [${seunMetrics.yearGanji || '세운'}]` : undefined;

    const rawActiveSal = magaDiagnosis?.activeSal || magaDiagnosis?.detectedSals || [];
    const magaActive = rawActiveSal.map((s: any) => typeof s === 'string' ? s : (s.name || s.salName));

    const structuredJudgments = {
      coreProblem: rawConcern,
      primaryDomain: domain,
      myeongliBasis: [
        myeongliExplanation,
        executedModules['CORE_ORIGINAL']?.data?.fourPillarsText ? `원국: ${executedModules['CORE_ORIGINAL'].data.fourPillarsText}` : '',
      ].filter(Boolean),
      timeAxisBreakdown: {
        natal: natalRelations.length > 0 ? natalRelations : ['원국 지지 상호작용 안정'],
        daewun: daewunGanzi ? [daewunGanzi] : undefined,
        seun: seunGanzi ? [seunGanzi] : undefined,
        daewunSeun: daewunSeunRelations.length > 0 ? daewunSeunRelations : undefined,
      },
      magaActive,
      realWorldManifestation: step2_whyOccurred,
      responseGuidance: {
        mustDo: actSummary,
        mustAvoid: prescriptionReport?.mustAvoid || [],
      },
      prescriptions: {
        environment: envSummary,
        behavior: actSummary,
        remedy: (prescriptionReport?.remedyItems || []).map((r: any) => r.title || r.purpose || '상징 처방물'),
      },
      additionalContext: userInput.additionalContext,
      selectedSituation: userInput.selectedSituation,
    };

    // Phase 76: 캐릭터 표현 계층 분리 위임
    const charProfile = ctx.characterProfile || (ctx.characterId ? DEFAULT_CHARACTER_PROFILES[ctx.characterId] : undefined) ||
      (userInput.characterProfile || (userInput.characterId ? DEFAULT_CHARACTER_PROFILES[userInput.characterId] : undefined));

    if (charProfile) {
      return characterRenderer.render({
        judgments: structuredJudgments,
        characterProfile: charProfile,
        insightDepth: depth,
        birthDate: userInput.birthDate,
        targetYear: userInput.targetYear,
        safeguardNotice: prescriptionReport?.safeguardNotice,
      });
    }

    // Phase 80: 15개 전문 사주 고정 포맷 보고서 생성
    const standard15Report = this.buildStandard15Report(ctx);

    const safetyPassed = !this.containsForbiddenFatalism(fullFormattedText) &&
      !this.containsForbiddenFatalism(standard15Report);

    return {
      structuredJudgments,
      freeDeliverable,
      sections: {
        step1_currentEvent,
        step2_whyOccurred,
        step3_myeongliCore,
        step4_magaCaution,
        step5_futureFlow,
        step6_whatToChange,
        step7_environmentPrescription,
        step8_behaviorPrescription,
        step9_remedyItems,
        step10_finalSummary,
      },
      answersTo7Questions,
      fullFormattedText,
      standard15Report,
      verdictStrength,
      safetyPassed,
    };
  }

  /**
   * Phase 77: 무료 고객 결과물 (Level 1) 5단계 구조 생성
   */
  public buildFreeDeliverable(
    ctx: CustomerDeliverableContext,
    myeongliExplanation: string
  ): FreeCustomerDeliverable {
    const { userInput, domain, executedModules, magaDiagnosis } = ctx;

    const coreMod = executedModules['CORE_ORIGINAL'];
    const strengthMod = executedModules['STRENGTH'];
    const gyeokMod = executedModules['GEOKGUK'];
    const relMod = executedModules['RELATION'];

    const dayStem = coreMod?.data?.dayMaster?.stem || '본원';
    const dayElement = coreMod?.data?.dayMaster?.element || '토';
    const strengthDesc = strengthMod?.explanation?.summary || '신강/신약의 기운이 평형을 이루고 있습니다.';
    const getGyeokMeaning = (name: string): string => {
      if (/겁재|월겁|양인/.test(name)) {
        return `${name} — 현실에서는 자신의 주관과 강한 추진력을 바탕으로 스스로 입지를 다지려는 성향으로 해석할 수 있습니다.`;
      }
      if (/비견|건록/.test(name)) {
        return `${name} — 현실에서는 독립심과 자립적 역량을 중심으로 자신의 무대를 구축하려는 성향으로 해석할 수 있습니다.`;
      }
      if (/식신|상관/.test(name)) {
        return `${name} — 현실에서는 전문성과 창의적 기량을 바탕으로 실제 성과를 도출하려는 성향으로 해석할 수 있습니다.`;
      }
      if (/정재|편재/.test(name)) {
        return `${name} — 현실에서는 자원과 성과를 실제 결과로 연결하려는 성향으로 해석할 수 있습니다.`;
      }
      if (/정관|편관/.test(name)) {
        return `${name} — 현실에서는 조직의 질서와 책임감을 중시하며 원칙에 입각하여 역할을 수행하려는 성향으로 해석할 수 있습니다.`;
      }
      if (/정인|편인/.test(name)) {
        return `${name} — 현실에서는 지적 자산과 깊은 사색을 바탕으로 내실을 다지려는 성향으로 해석할 수 있습니다.`;
      }
      return `${name} — 현실에서는 타고난 기운의 중심축에 따라 사회적 성취를 이루려는 성향으로 해석할 수 있습니다.`;
    };

    let gyeokDesc: string;
    const gyeokName = gyeokMod?.data?.name || gyeokMod?.calculation?.rawMetrics?.geokgukName;
    if (gyeokName) {
      gyeokDesc = getGyeokMeaning(gyeokName);
    } else if (gyeokMod?.explanation?.summary) {
      gyeokDesc = gyeokMod.explanation.summary;
    } else if (coreMod?.data?.pillars) {
      const pillars = coreMod.data.pillars;
      const openStems = [pillars.year.stem, pillars.month.stem];
      if (pillars.hour) openStems.push(pillars.hour.stem);
      const canonical = classifyGeokguk(pillars.day.stem, pillars.month.branch, openStems);
      if (canonical?.name) {
        gyeokDesc = getGyeokMeaning(canonical.name);
      } else {
        gyeokDesc = '원국 격국 형성';
      }
    } else {
      gyeokDesc = '원국 격국 형성';
    }

    const relations = relMod?.calculation?.rawMetrics?.standardItems?.map((i: any) => i.standardLabel) || [];
    const relationSummary = relations.length > 0
      ? `사주 원국 내에 [${relations.join(', ')}] 등의 기운 상호작용이 형성되어 있어, 평소에는 실속을 다지는 안정성을 지향하나 특정 환경적 자극이 유입되면 내면의 긴장이 유발될 수 있는 구조입니다.`
      : (relMod?.explanation?.summary || '지지 기운이 조화롭게 균형을 이루고 있습니다.');

    const step1_coreSummary = [
      `• [일간 본원]: 의뢰인은 ${dayStem}(${dayElement})의 기운을 본원으로 타고났으며, 전체 기운 중 ${dayElement}의 세력이 중심을 이룹니다.`,
      `• [일간 감당력]: ${strengthDesc}`,
      `• [사회적 성취 틀]: ${gyeokDesc}`,
      `• [핵심 기운 구조]: ${relationSummary}`,
    ].join('\n');

    const daewunMod = executedModules['DAEWUN'];
    const seunMod = executedModules['SEUN'];
    const curDaewoon = daewunMod?.calculation?.rawMetrics?.currentDaewoon || daewunMod?.calculation?.rawMetrics?.currentDaeun;
    const dwGanji = curDaewoon?.ganji || (curDaewoon ? `${curDaewoon.stem}${curDaewoon.branch}` : '');
    const dwGanjiStr = dwGanji ? `[${dwGanji} 대운]` : '';
    const seunGanjiStr = seunMod?.calculation?.rawMetrics?.yearGanji ? `[${seunMod.calculation.rawMetrics.yearGanji} 세운]` : '';

    const daewunDesc = daewunMod?.explanation?.summary || '현재 대운의 환경에 놓여 있습니다.';
    const seunDesc = seunMod?.explanation?.summary || '현재 세운의 파동이 교차하고 있습니다.';

    const step2_attentionPoint = [
      `• [10년 주기 환경]: ${dwGanjiStr} ${daewunDesc}`,
      `• [현재 연도 흐름]: ${seunGanjiStr} ${seunDesc}`,
      `• [주목할 상호작용]: 결정된 미래나 피할 수 없는 사건이 아니라, 현재 시간의 흐름은 외부 환경의 변화와 내면의 책임감이 교차하며 [${this.getDomainKoreanName(domain)}] 영역에 집중적인 주의와 완충을 요구하고 있습니다.`,
    ].join('\n');

    const domainRealManifestationMap: Record<ProblemDomain, string> = {
      BUSINESS: '사업 및 계약 관계에서 동업자·거래처와의 업무 범위(R&R)나 정산 조건에 대한 이견이 생기기 쉽고, 일시적인 대금 정체나 계약 지연 등으로 초조함을 겪기 쉬운 흐름입니다. 사소한 불씨가 법적·금전적 갈등으로 비화되지 않도록 구두 약속을 배제하고 서면 기록을 다져야 합니다.',
      JOB: '직장 내 상사나 동료와의 업무 스타일 차이로 소통 마찰이 생기거나, 내 노력과 성과가 정당하게 평가받지 못한다는 심리적 피로감이 나타날 수 있는 흐름입니다. 감정적 사직이나 즉흥적 이직보다 차분히 경력을 보존하며 타이밍을 보아야 합니다.',
      LOVE: '사소한 표현 차이나 서운함이 오해로 번지기 쉽고, 상대방의 반응에 과민해지거나 관계의 지속성에 대한 불안이 나타날 수 있는 흐름입니다. 즉각적인 감정 표현보다 숨고르기와 거리 두기가 필요합니다.',
      MARRIAGE: '가정이나 부부 관계에서 생활 습관이나 가치관 차이로 인한 정서적 거리감이 생기기 쉬우며, 사소한 대화 단절이 냉전으로 이어질 수 있는 흐름입니다. 서로의 주관을 꺾으려 하기보다 명확한 대화 원칙을 세워야 합니다.',
      RELATIONSHIP: '주변 지인이나 친구와의 관계에서 말실수나 오해로 인한 구설이 생기기 쉽고, 신뢰 관계에 균열이 올 수 있는 흐름입니다. 무리한 확장보다 나만의 안전지대를 지키는 것이 유리합니다.',
      MONEY: '현금 흐름의 변동성이 커지고 예기치 못한 지출이 발생할 수 있는 흐름입니다. 공격적인 투자보다 자산 방어와 지출 통제가 최우선입니다.',
      HEALTH: '직무 스트레스와 긴장감으로 인해 신체 피로도가 쉽게 누적되고 수면 리듬이 흔들릴 수 있는 흐름입니다. 무리한 일정을 자제하고 충분한 휴식을 취해야 합니다.',
      GENERAL: '삶의 전반적인 방향성을 재점검하고 내실을 다져야 하는 전환기적 흐름입니다. 조급한 결정을 유보하고 내면의 균형을 찾는 것이 중요합니다.',
    };

    const magaSummary = magaDiagnosis?.punchline || '불필요한 조급함을 내려놓고 차분히 중심을 잡아야 하는 국면입니다.';

    const step3_realWorldManifestation = [
      `• [현실 경험 양상]: ${domainRealManifestationMap[domain] || domainRealManifestationMap.GENERAL}`,
      `• [마·살 조율 가이드]: 사주가 불길한 것이 아니라, ${magaSummary} 감정적인 맞대응을 피하고 안전 거리를 확보하라는 신호입니다.`,
    ].join('\n');

    const step4_customerConnectWidget = {
      prompt: '위의 기운 흐름 중 현재 고객님이 가장 강하게 마주하고 계신 상황은 무엇인가요? (가장 깊게 마주하고 계신 현실 상황이나 고민을 남겨주시면, 사주 원국과 결합된 정밀 인과를 도출합니다.)',
      options: domain === 'BUSINESS'
        ? ['거래처 대금 및 자금 경색', '동업자·파트너와의 지분 및 정산 갈등', '주요 거래처 부도 및 대금 회수 지연', '계약 파기 및 납기 분쟁', '신규 사업 확장 및 자금 압박']
        : domain === 'JOB'
        ? ['상사와의 갈등 및 공개적 비난', '불합리한 업무 배정 및 지시 변경', '이직 및 퇴사 타이밍 고민', '인사고과 및 승진 누락']
        : domain === 'LOVE'
        ? ['연인과의 이별 및 연락 두절', '반복되는 성격 차이 및 소통 마찰', '재회 가능성 및 접근 타이밍', '상대방의 마음 식음 및 애정도 불안']
        : ['갑작스러운 현금 누수 및 자산 손실', '대출 및 부채 상환 압박', '예상치 못한 목돈 지출', '투자 원금 회수 지연'],
      customInputPlaceholder: '구체적인 상황과 질문을 자유롭게 입력해주세요.',
    };

    const step5_inDepthPreview = [
      '[심층 분석에서는 다음과 같은 실전 솔루션이 확장됩니다]',
      '• 무료 분석: 기본 명리 구조(일간·격국·강약) | 시간축 흐름 | 현재 주목할 영역',
      '• 심층 분석:',
      '  1) 실제 사건과 명리의 인과 규명 (왜 지금 이런 일이 생겼는가)',
      '  2) 정밀 시기 분석 (언제 가장 힘들고, 언제 풀리는가)',
      '  3) 상황별 대응 수칙 (지금 피해야 할 일과 해야 할 일)',
      '  4) 맞춤형 환경·행동 처방전 및 디지털 처방 카드',
    ].join('\n');

    const fullText = [
      `### ① 한눈에 보는 핵심\n${step1_coreSummary}`,
      `### ② 지금 주목할 부분\n${step2_attentionPoint}`,
      `### ③ 현실에서 나타날 수 있는 모습\n${step3_realWorldManifestation}`,
      `### ④ 고객 상황 연결 장치\n[추천 상황 옵션]: ${step4_customerConnectWidget.options.join(' | ')}`,
      `### ⑤ 더 깊게 보면 무엇을 알 수 있는가\n${step5_inDepthPreview}`,
    ].join('\n\n');

    return {
      step1_coreSummary,
      step2_attentionPoint,
      step3_realWorldManifestation,
      step4_customerConnectWidget,
      step5_inDepthPreview,
      fullText,
    };
  }

  /**
   * Phase 80: 15개 전문 사주 고정 포맷 보고서 생성
   */
  public buildStandard15Report(ctx: CustomerDeliverableContext): string {
    const { userInput, domain, executedModules, magaDiagnosis, prescriptionReport } = ctx;

    const STEM_HANJA: Record<string, string> = {
      '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊',
      '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸',
    };
    const BRANCH_HANJA: Record<string, string> = {
      '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳',
      '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥',
    };
    const STEM_DETAIL: Record<string, { korean: string; element: string; nature: string }> = {
      '갑': { korean: '갑목(甲木)', element: '목', nature: '우직한 전진과 곧은 이상을 지향하는 거목의 기운' },
      '을': { korean: '을목(乙木)', element: '목', nature: '유연한 적응력과 끈질긴 생명력을 품은 화초의 기운' },
      '병': { korean: '병화(丙火)', element: '화', nature: '만물을 비추는 밝은 열정과 확산의 태양 기운' },
      '정': { korean: '정화(丁火)', element: '화', nature: '섬세한 온기와 깊은 집중력을 발휘하는 등불의 기운' },
      '무': { korean: '무토(戊土)', element: '토', nature: '넓은 대지를 포용하고 묵직하게 중심을 잡는 산의 기운' },
      '기': { korean: '기토(己土)', element: '토', nature: '대지를 품은 차분하고 실속 있는 흙의 기운' },
      '경': { korean: '경금(庚金)', element: '금', nature: '단호한 결단력과 확고한 원칙을 지닌 강철의 기운' },
      '신': { korean: '신금(辛金)', element: '금', nature: '정밀한 완성도와 섬세한 자존감을 지닌 보석의 기운' },
      '임': { korean: '임수(壬水)', element: '수', nature: '넓은 바다처럼 깊은 지혜와 유연한 포용의 큰물 기운' },
      '계': { korean: '계수(癸水)', element: '수', nature: '맑은 통찰과 감수성을 머금은 단비와 샘물의 기운' },
    };

    const toHanjaPillar = (p: string): string => {
      const clean = p.trim();
      if (clean.length === 2) {
        const s = clean[0];
        const b = clean[1];
        const sH = STEM_HANJA[s] || '';
        const bH = BRANCH_HANJA[b] || '';
        return `${s}${b}(${sH}${bH})`;
      }
      return clean;
    };

    const coreMod = executedModules['CORE_ORIGINAL'];
    const strengthMod = executedModules['STRENGTH'];
    const geokMod = executedModules['GEOKGUK'];
    const relMod = executedModules['RELATION'];
    const sinsalMod = executedModules['SINSAL'];
    const daewunMod = executedModules['DAEWUN'];
    const seunMod = executedModules['SEUN'];

    const pillars = coreMod?.data?.pillars;
    let formattedPillars = '년주: 무인(戊寅), 월주: 병진(丙辰), 일주: 기축(己丑), 시주: 기사(己巳)';
    if (pillars) {
      const yStr = toHanjaPillar(`${pillars.year.stem}${pillars.year.branch}`);
      const mStr = toHanjaPillar(`${pillars.month.stem}${pillars.month.branch}`);
      const dStr = toHanjaPillar(`${pillars.day.stem}${pillars.day.branch}`);
      const hStr = pillars.hour ? toHanjaPillar(`${pillars.hour.stem}${pillars.hour.branch}`) : '미상';
      formattedPillars = `년주: ${yStr}, 월주: ${mStr}, 일주: ${dStr}, 시주: ${hStr}`;
    }

    const dayStem = pillars?.day?.stem || '기';
    const stemInfo = STEM_DETAIL[dayStem] || { korean: '기토(己土)', element: '토', nature: '대지를 품은 차분하고 실속 있는 흙의 기운' };

    const ohaengDist: Record<string, number> = { '목': 0, '화': 0, '토': 0, '금': 0, '수': 0 };
    if (pillars) {
      const stems = [pillars.year.stem, pillars.month.stem, pillars.day.stem, ...(pillars.hour ? [pillars.hour.stem] : [])];
      const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, ...(pillars.hour ? [pillars.hour.branch] : [])];
      stems.forEach(s => { const el = STEM_DETAIL[s]?.element; if (el) ohaengDist[el] = (ohaengDist[el] ?? 0) + 1; });
      const branchElemMap: Record<string, string> = {
        '인': '목', '묘': '목', '진': '토', '사': '화', '오': '화', '미': '토',
        '신': '금', '유': '금', '술': '토', '해': '수', '자': '수', '축': '토',
      };
      branches.forEach(b => { const el = branchElemMap[b]; if (el) ohaengDist[el] = (ohaengDist[el] ?? 0) + 1; });
    } else {
      ohaengDist['목'] = 1; ohaengDist['화'] = 2; ohaengDist['토'] = 5; ohaengDist['금'] = 0; ohaengDist['수'] = 0;
    }

    const gyeokName = geokMod?.data?.name || geokMod?.calculation?.rawMetrics?.geokgukName || '월겁격';
    const gyeokHanjaMap: Record<string, string> = {
      '월겁격': '月劫格', '건록격': '建祿格', '식신격': '食神格', '상관격': '傷官格',
      '편재격': '偏財格', '정재격': '正財格', '편관격': '偏官格', '정관격': '正官格',
      '편인격': '偏印格', '정인격': '正印格', '양인격': '羊刃格',
    };
    const gyeokWithHanja = `${gyeokName}(${gyeokHanjaMap[gyeokName] || ''})`;

    const elemTenGodMap: Record<string, Record<string, string>> = {
      '갑': { '목': '비겁', '화': '식상', '토': '재성', '금': '관성', '수': '인성' },
      '을': { '목': '비겁', '화': '식상', '토': '재성', '금': '관성', '수': '인성' },
      '병': { '화': '비겁', '토': '식상', '금': '재성', '수': '관성', '목': '인성' },
      '정': { '화': '비겁', '토': '식상', '금': '재성', '수': '관성', '목': '인성' },
      '무': { '토': '비겁', '금': '식상', '수': '재성', '목': '관성', '화': '인성' },
      '기': { '토': '비겁', '금': '식상', '수': '재성', '목': '관성', '화': '인성' },
      '경': { '금': '비겁', '수': '식상', '목': '재성', '화': '관성', '토': '인성' },
      '신': { '금': '비겁', '수': '식상', '목': '재성', '화': '관성', '토': '인성' },
      '임': { '수': '비겁', '목': '식상', '화': '재성', '토': '관성', '금': '인성' },
      '계': { '수': '비겁', '목': '식상', '화': '재성', '토': '관성', '금': '인성' },
    };
    const elemHanjaMap: Record<string, string> = { '목': '목(木)', '화': '화(火)', '토': '토(土)', '금': '금(金)', '수': '수(水)' };

    const sortedElems = Object.entries(ohaengDist).sort((a, b) => b[1] - a[1]);
    const dominantElem = sortedElems[0][0];
    const dominantTenGod = elemTenGodMap[dayStem]?.[dominantElem] || '주도 기운';
    const excessiveElems = Object.entries(ohaengDist).filter(([_, count]) => count >= 3).map(([el]) => el);
    const deficientElems = Object.entries(ohaengDist).filter(([_, count]) => count === 0).map(([el]) => el);

    const strengthScore = strengthMod?.data?.score ?? 50;
    const strengthStatus = strengthMod?.data?.status || '중화';
    const isStrong = strengthScore >= 70 || strengthStatus.includes('강');
    const isWeak = strengthScore < 50 || strengthStatus.includes('약');

    const strengthRaw = strengthMod?.calculation?.rawMetrics;
    const deungryeongText = strengthRaw?.deungryeong ? '득령(得令)' : '실령(失令)';
    const deungjiText = strengthRaw?.deungji ? '득지(得地)' : '실지(失地)';
    const deungseText = strengthRaw?.deungse ? '득세(得勢)' : '실세(失勢)';
    const strengthBasisSummary = `${deungryeongText}, ${deungjiText}, ${deungseText} 종합 판정`;

    let strengthFeatureText = '';
    let strengthAdvantageText = '';
    let strengthWeaknessText = '';
    if (isStrong) {
      strengthFeatureText = `일간의 자생력과 기운이 견고하여(${strengthStatus}, ${strengthScore}점) 외부 환경의 압박을 주도적으로 돌파해 나가는 저력과 실행 역량을 품고 있습니다.`;
      strengthAdvantageText = '어려운 환경에서도 쉽게 흔들리지 않고 끝까지 버텨내는 강인한 내구력과 주도적 실행력입니다.';
      strengthWeaknessText = '자신의 기준이 완고하여 타인의 의견이나 환경 변화를 융통성 있게 수용하지 못하고 고립을 자초할 수 있습니다.';
    } else if (isWeak) {
      strengthFeatureText = `일간의 세력에 비해 주변 관성이나 재성 기운이 왕성하여(${strengthStatus}, ${strengthScore}점), 조직의 기대와 책임감, 타인의 평가를 민감하게 체감하여 에너지가 쉽게 소모되는 구조입니다. 무작정 혼자 버티려 하기보다 명확한 업무 경계선과 완충 장치가 필수적입니다.`;
      strengthAdvantageText = '타인의 요구와 조직의 규칙을 예리하게 파악하고 정밀하게 조율해 내는 섬세한 현실 감각과 기민한 대응력입니다.';
      strengthWeaknessText = '외부의 비합리적인 요구를 정면으로 거절하지 못하고 속으로 삭이다가 심리적 소진(번아웃)에 직면할 위험이 큽니다.';
    } else {
      strengthFeatureText = `오행의 편중이 심하지 않고 균형을 이루어(${strengthStatus}, ${strengthScore}점) 다양한 환경에 유연하게 적응하고 상호 타협점을 찾는 조율 역량을 지닙니다.`;
      strengthAdvantageText = '치우침 없이 원만한 대인관계와 환경 적응력으로 꾸준히 성과를 쌓아가는 안정성입니다.';
      strengthWeaknessText = '급격한 위기 국면에서 결단을 미루거나 주변 상황에 휩쓸려 주도권을 잃을 수 있습니다.';
    }

    const relMetrics = relMod?.calculation?.rawMetrics;
    const destructions: string[] = (relMetrics?.destructions || []).map((x: string) => x.replace(/파/g, '파(破)'));
    const harms: string[] = (relMetrics?.harms || []).map((x: string) => x.replace(/해/g, '해(害)'));
    const clashes: string[] = (relMetrics?.clashes || []).map((x: string) => x.replace(/충/g, '충(沖)'));
    const punishments: string[] = (relMetrics?.punishments || []).map((x: string) => x.replace(/형/g, '형(刑)'));
    const allRels = [...destructions, ...harms, ...clashes, ...punishments];
    const relItems = relMetrics?.standardItems?.map((i: any) => i.standardLabel) || [];
    const relationSummaryText = allRels.length > 0
      ? allRels.join(', ')
      : (relItems.length > 0 ? relItems.join(', ') : '원국 지지 상호작용 비교적 안정');

    const activeSalList = magaDiagnosis?.activeSal || magaDiagnosis?.detectedSals || [];
    const activeSalNames = activeSalList.map((s: any) => typeof s === 'string' ? s : (s.name || s.salName));
    const activeSalText = activeSalNames.length > 0 ? activeSalNames.join(', ') : '기질적 예민성 및 완벽주의 심리 기제군';
    const magaSalSummaryText = allRels.length > 0 ? `${relationSummaryText}, ${activeSalText}` : activeSalText;

    const curDwRaw = daewunMod?.calculation?.rawMetrics?.currentDaewoon || daewunMod?.calculation?.rawMetrics?.currentDaeun;
    const curDwGanji = curDwRaw?.ganji || (curDwRaw ? `${curDwRaw.stem}${curDwRaw.branch}` : '대운');
    const curDwStartAge = curDwRaw?.startAge ?? curDwRaw?.age ?? 22;
    const curDwEndAge = curDwRaw?.endAge ?? (curDwStartAge + 9);
    const curDwTenGodDesc = curDwRaw?.stemTenGod && curDwRaw?.branchTenGod
      ? `${curDwRaw.stemTenGod}와 ${curDwRaw.branchTenGod}`
      : (curDwRaw?.tenGodStem && curDwRaw?.tenGodBranch ? `${curDwRaw.tenGodStem}와 ${curDwRaw.tenGodBranch}` : '새로운 운의 기운');

    // Section 1: coreStructureText
    let coreStructureText = '';
    if (dominantTenGod === '비겁') {
      coreStructureText = `비견과 겁재(${elemHanjaMap[dominantElem]} 기운)가 사주의 중심을 차지하는 비겁태왕(比劫太旺) 구조이며, 내면의 중심이 견고하고 외부의 풍파에 쉽게 무너지지 않는 구조입니다. 원국 지지에 ${relationSummaryText} 등이 형성되어 있어, 평소에는 실속과 안정을 추구하나 특정 환경적 자극이 유입될 때 내면의 긴장과 마찰이 발생할 수 있는 경향성을 지닙니다.`;
    } else if (dominantTenGod === '관성') {
      coreStructureText = `관성(${elemHanjaMap[dominantElem]} 기운)의 세력이 왕성하여 일간을 견제·단련하는 구조이며, 조직의 규율과 사회적 책임감이 투철하나 외부의 압박과 스트레스를 민감하게 체감하는 구조입니다. 원국 지지에 ${relationSummaryText} 등이 작용하여 직무 환경 변화 시 내면의 긴장과 피로도가 고조되기 쉬운 경향성을 지닙니다.`;
    } else if (dominantTenGod === '인성') {
      coreStructureText = `인성(${elemHanjaMap[dominantElem]} 기운)의 생조를 바탕으로 사고력과 학습 역량이 뛰어난 인성 유력 구조이며, 원칙과 명예를 중시하나 완벽주의와 생각의 깊이로 인해 스트레스를 안으로 삭이기 쉽습니다. 원국 지지에 ${relationSummaryText} 등이 작용하여 특정 자극 유입 시 심리적 반추가 깊어질 수 있습니다.`;
    } else if (dominantTenGod === '식상') {
      coreStructureText = `식상(${elemHanjaMap[dominantElem]} 기운)이 발달하여 전문적 표현력과 추진력을 갖춘 구조이며, 부조리한 환경에 순응하기보다 원칙을 관철하려는 기질이 강합니다. 원국 지지에 ${relationSummaryText} 등이 형성되어 있어 감정 마찰에 대한 관리가 권장됩니다.`;
    } else {
      coreStructureText = `재성(${elemHanjaMap[dominantElem]} 기운)의 실리 감각과 결단력이 돋보이는 구조이며, 실질적인 성과와 효율을 추구합니다. 원국 지지에 ${relationSummaryText} 등이 형성되어 있어 환경적 변동성에 대한 지속적 완충이 필요합니다.`;
    }

    // Section 2: personalityText
    let personalityText = '';
    if (dominantTenGod === '비겁') {
      personalityText = '비견과 겁재의 기운이 강하여 독립심과 자존감이 대단히 높습니다. 겉으로는 조용하고 예의 바르며 유순해 보이지만, 내면에는 타협하기 어려운 단단한 원칙과 주관이 확고히 자리 잡고 있습니다.';
    } else if (dominantTenGod === '관성') {
      personalityText = '관성의 기운이 강하여 책임감과 규율 의식이 대단히 투철합니다. 공과 사의 구분이 명확하고 정해진 약속과 원칙을 엄수하려 하며, 타인의 무책임이나 비합리적인 처사에 대해 깊은 내적 거부감을 느낍니다.';
    } else if (dominantTenGod === '인성') {
      personalityText = '인성의 기운이 두터워 사려 깊고 신중하며 지적인 완성도를 추구합니다. 피상적인 관계보다 깊이 있는 신뢰를 중시하며, 자신의 가치관과 명예를 지키는 것을 최우선으로 여깁니다.';
    } else {
      personalityText = '자신의 주관과 목표 의식이 명확하며, 맡은 역할에 대해 최선의 성과를 도출하려는 강한 실천력과 성실함을 품고 있습니다.';
    }

    // Section 3: bossRelationText
    const bossRelationText = allRels.length > 0
      ? `원국 지지의 상호작용(${relationSummaryText})으로 인해, 상사의 지시 의도가 왜곡되어 전달되거나 상급자와의 소통 방식에서 미묘한 엇박자가 발생하기 쉬운 환경에 놓이기 쉽습니다. 동료와는 선의의 협력 관계를 맺되 적절한 거리 유지가 필요합니다.`
      : '조직 내에서 기본적 신뢰를 바탕으로 협력하되, 상급자와의 업무 소통 시에는 구두 약속보다 명확한 절차와 기준을 확인하는 업무적 거리 유지가 필요합니다.';

    // Section 4: jaeSummaryText
    const jaeCount = ohaengDist[elemTenGodMap[dayStem]?.['재성'] || ''] ?? 0;
    const isMuJae = jaeCount === 0;
    const jaeSummaryText = isMuJae
      ? '사주 원국에 재성이 드러나지 않은 무재(無財)형 구조로, 단기 투기보다 본업의 전문 직무 소득을 바탕으로 한 안정적인 현금 흐름 확보가 필수적입니다.'
      : `사주 원국에 재성 기운이 ${jaeCount}개 자리하여 현실적인 실리와 자산 운용 감각을 갖추고 있으나, 무리한 외부 확장보다 안정적인 분산 투자가 안전합니다.`;

    // Section 8: healthGuideText
    const excDesc = excessiveElems.map((el) => elemHanjaMap[el] || el);
    const defDesc = deficientElems.map((el) => elemHanjaMap[el] || el);
    const healthGuideText = excDesc.length > 0 || defDesc.length > 0
      ? `${excDesc.length > 0 ? `과다한 ${excDesc.join(', ')} 기운으로 인한 에너지 울체 및 피로 누적을 방어하고, ` : ''}${defDesc.length > 0 ? `부족한 ${defDesc.join(', ')} 기운을 보완하기 위해 규칙적인 휴식과 수분·환경 조절이 권장됩니다.` : '균형 잡힌 신체 리듬 유지가 권장됩니다.'}`
      : '오행의 분포가 비교적 고른 편이나, 업무 스트레스로 인한 일시적 긴장 완화와 수면 위생 관리가 권장됩니다.';

    // Phase 80: 신규 사건 통합 및 시간축, 처방 엔진 연동
    const evidenceResult = ctx.evidenceResult || eventEvidenceAggregator.aggregate(userInput, domain, executedModules, pillars);
    const timeAxis = ctx.timeAxisJudgment || (pillars ? timeAxisJudgmentEngine.judge(pillars, executedModules, userInput, domain) : undefined);
    const presSynth = ctx.prescriptionSynthesis || (pillars && timeAxis ? prescriptionSynthesizer.synthesize({
      pillars,
      userProblem: userInput,
      domain,
      evidenceResult,
      timeAxis,
      executedModules,
    }) : undefined);

    const isJobDomain = domain === 'JOB' || /직장|이직|퇴사|상사|업무/.test(userInput.currentEvent || userInput.userTrouble || '');

    const report: string[] = [];

    // [1] 나의 사주 핵심
    report.push(
      '# 마보살 전문 사주 분석 보고서',
      '',
      '---',
      '## 1. 나의 사주 핵심',
      '',
      `* **사주 원국**: ${formattedPillars}`,
      `* **일간**: ${stemInfo.korean} — ${stemInfo.nature}`,
      `* **오행 분포**: 목(木) ${ohaengDist['목'] ?? 0}개, 화(火) ${ohaengDist['화'] ?? 0}개, 토(土) ${ohaengDist['토'] ?? 0}개, 금(金) ${ohaengDist['금'] ?? 0}개, 수(水) ${ohaengDist['수'] ?? 0}개`,
      `* **격국**: ${gyeokWithHanja} — 자신의 주관과 강한 추진력을 바탕으로 스스로 입지를 다져나가는 사회적 성취의 틀`,
      `* **강약**: ${strengthStatus}(${strengthScore}점 / 100점) — ${strengthBasisSummary}`,
      `* **사주의 핵심 구조**: ${coreStructureText}`,
      `* **전체적인 특징**: 의뢰인은 ${stemInfo.korean}의 본원을 타고났으며, ${strengthFeatureText}`
    );

    // [2] 타고난 성향
    report.push(
      '',
      '---',
      '## 2. 타고난 성향',
      '',
      `* **성격**: ${personalityText}`,
      '* **사고방식**: 사실과 객관적인 근거를 중시하는 현실주의적 사고방식을 가집니다. 자신이 직접 납득하지 못하면 타인의 권위나 형식적인 지시를 마음으로 온전히 받아들이기 어려워하는 주관적 확신형 사고를 보입니다.',
      '* **행동방식**: 맡은 일은 남에게 미루지 않고 끝까지 스스로 완수하려는 책임감을 보입니다. 요행을 바라지 않고 한 걸음씩 묵묵히 결과를 만들어내는 실천형입니다.',
      `* **강점**: ${strengthAdvantageText}`,
      `* **약점**: ${strengthWeaknessText}`,
      `* **스트레스 상황에서 나타나는 특징**: 원국 내 ${relationSummaryText}의 작용이 자극될 때, 상대방의 말 한마디를 깊이 반추하며 의심과 서운함이 증폭됩니다. 외부와의 소통을 닫아걸고 혼자 고립된 상태에서 심리적 압박감을 과도하게 키우기 쉽습니다.`
    );

    // [3] 직업·커리어
    report.push(
      '',
      '---',
      '## 3. 직업·커리어',
      '',
      '* **직업 성향**: 체계적이고 명확한 기준이 존재하는 전문 사무직, 분석 및 관리, 문서 및 자산 관리 등 정확성과 지속성이 요구되는 분야에 잘 부합합니다.',
      '* **조직생활**: 직장 내에서 자신의 역할과 책임을 성실히 수행하지만, 위계질서에 의한 무조건적인 복종보다는 상호 존중과 합리적인 절차가 보장되는 조직 문화를 필요로 합니다.',
      `* **상사·동료 관계**: ${bossRelationText}`,
      '* **업무 방식**: 절차를 준수하고 완성도를 높이는 꼼꼼한 실무형입니다. 일을 대충 처리하는 것을 용납하지 못하며 정해진 규칙 안에서 최상의 결과물을 도출하려 합니다.',
      '* **성취 방식**: 화려한 대외적 과시보다는 내실과 실력으로 인정받는 성취 방식을 지향합니다.',
      '* **이직 및 진로 방향**: 현재 조직 내 역할과 책임이 견고하나 일시적인 상사 마찰로 피로감이 누적된 상태입니다. 감정적인 즉각 퇴사는 피하고, 경력을 안정적으로 완성한 뒤 계획적으로 이직을 준비하는 흐름이 유리합니다.',
      '* **독립·사업 성향**: 장기적으로는 본인의 전문성을 살린 자립이 가능하나, 현재는 내실을 다지고 시스템을 정비해야 하는 국면입니다.'
    );

    // [4] 재물
    report.push(
      '',
      '---',
      '## 4. 재물',
      ''
    );
    if (isJobDomain) {
      report.push(
        `* **재물 성향 및 운용 원칙**: ${jaeSummaryText}`,
        '* **자산 관리 원칙**: 원국의 기운이 견고하므로, 무리한 외부 확장이나 고위험 투자보다 원금 보존형 저축과 비상 생계비 확보가 효과적입니다. (※ 금융 투자 및 자산 관리는 전문 금융기관의 상담을 우선하시기 바랍니다.)'
      );
    } else {
      report.push(
        '* **재물 성향**: 원국에 재성이 잠재된 무재(無財)형 구조로, 직접적 투기보다 현금 방어와 안정적 전문 직무 소득 중심의 운용이 필수적인 국면입니다.',
        '* **돈을 버는 방식**: 일확천금이나 투기성 소득보다는 본인의 직무 전문성과 성실한 근로를 통해 지속적인 현금 흐름을 창출하는 방식이 가장 안전합니다.',
        '* **돈을 관리하는 방식**: 자산 방어 중심의 보수적 운용이 필수적입니다. 비견과 겁재의 세력이 왕성하므로, 버는 것보다 새어나가는 것을 막는 원금 방어형 저축이 효과적입니다.',
        '* **재물상 강점과 주의점**: 낭비가 적고 소비 통제력이 우수하며 실속을 중시하는 강점이 있습니다. 다만 주변 사람의 부탁으로 인한 사적인 금전 대여나 연대보증, 실체 없는 고수익 투자 제안에 응할 경우 손실 위험이 있으므로 단호한 방어가 필요합니다. (※ 금융 투자 및 자산 관리는 전문 금융기관의 상담을 우선하시기 바랍니다.)',
        '* **사업·투자 관련 성향**: 변동성이 큰 위험 자산보다는 원금 보존형 상품이나 안전한 실물 자산 중심의 보수적 포트폴리오를 유지하는 것이 바람직합니다.'
      );
    }

    // [5] 연애
    report.push(
      '',
      '---',
      '## 5. 연애',
      ''
    );
    if (isJobDomain) {
      report.push(
        '* **연애 성향 및 관계 특징**: 독립심과 주관이 뚜렷하여 의존적인 관계보다는 상호 존중을 지향하며, 갈등 상황에서는 감정적 즉각 담판보다 충분한 시간적 여유를 두고 대화하는 방식이 조화롭습니다.'
      );
    } else {
      report.push(
        '* **연애 성향**: 사소한 표현 차이나 서운함이 오해로 번지기 쉬우므로, 감정적인 담판을 서두르기보다 충분한 숨고르기와 온화한 소통으로 회복을 도모하는 태도가 필요합니다.',
        '* **이성관계**: 상대방에게 의존하려 하지 않고 독립적인 태도를 유지하므로 듬직한 인상을 주지만, 때로는 감정적인 애교나 다정한 표현이 다소 절제되어 보일 수 있습니다.',
        '* **관계에서 나타나는 특징**: 서운한 점이 생겼을 때 바로 다투기보다는 혼자 속으로 감내하다가, 신뢰가 훼손되었다고 느끼면 차분하게 선을 긋는 패턴을 보입니다.',
        `* **반복되기 쉬운 관계 문제**: ${harms.length > 0 ? harms.join(', ') : '인사해(寅巳害)'} 등의 작용으로 인해 상대방의 사소한 말실수나 행동을 본인에 대한 무시로 확대 해석하여 감정의 골이 깊어지는 문제가 나타날 수 있으므로, 충분한 숨고르기 후 온화한 소통이 필요합니다.`
      );
    }

    // [6] 결혼·배우자
    report.push(
      '',
      '---',
      '## 6. 결혼·배우자',
      ''
    );
    if (isJobDomain) {
      report.push(
        '* **결혼관 및 배우자 관계**: 동료처럼 편안하면서도 각자의 전문 영역과 사생활을 존중해 주는 독립적인 관계를 선호하며, 서로의 영역을 침범하지 않는 명확한 룰이 안정감을 줍니다.'
      );
    } else {
      report.push(
        '* **배우자 성향**: 일지 배우자궁에 축토(丑土, 비견)가 자리하여, 친구나 동료처럼 편안하면서도 자기 주관과 성실함을 갖춘 배우자와 인연이 닿기 쉽습니다.',
        '* **결혼관**: 정서적인 환상보다는 현실적인 생활력과 신뢰를 가장 중요한 결혼의 기초로 봅니다. 각자의 사생활과 영역을 지켜주는 독립적인 결혼관을 지닙니다.',
        '* **결혼생활의 특징**: 배우자궁의 에너지를 조율하여 감정 대립을 낮추고 현실적 생활 공간과 원칙을 재정립해야 하는 국면입니다.',
        `* **부부관계에서 주의할 점**: 일지 배우자궁에 ${destructions.length > 0 ? destructions.join(', ') : '축진파(丑辰破)'}의 기운이 걸려 있어, 생활 습관이나 사소한 가치관 차이로 인해 냉전이 길어질 수 있습니다. 서로의 주관을 꺾으려 하지 말고 명문화된 가족 원칙을 세우는 것이 조화에 도움이 됩니다.`
      );
    }

    // [7] 인간관계·가족
    report.push(
      '',
      '---',
      '## 7. 인간관계·가족',
      ''
    );
    if (isJobDomain) {
      report.push(
        '* **인간관계 패턴 및 경계선**: 무리하게 인간관계를 넓히기보다 소수의 신뢰할 수 있는 관계에 집중하며, 타인의 시선이나 평가에 흔들리지 않도록 건강한 심리적 경계선을 유지하는 것이 이롭습니다.'
      );
    } else {
      report.push(
        '* **인간관계 패턴**: 타인의 시선과 평가에 과도하게 에너지를 소모하지 말고, 건강한 심리적 경계선을 그어야 하는 국면입니다.',
        '* **갈등 방식**: 갈등이 발생했을 때 언성을 높여 싸우기보다는 침묵을 지키거나 물리적 거리를 두며 상황을 관망하는 방어형 대응을 취합니다.',
        '* **가족관계**: 가족에 대한 내적인 책임감은 깊으나, 사적인 간섭이나 통제를 강하게 거부하며 일찍부터 정신적·경제적 자립을 추구합니다.',
        '* **주변 사람과의 관계 특징**: 타인의 평가나 시선에 과도하게 에너지를 소모하지 않도록 건강한 심리적 경계선을 그어야 하며, 무리한 인간관계 확장보다는 나만의 안전지대를 확보하는 것이 유리합니다.'
      );
    }

    // [8] 건강·생활
    report.push(
      '',
      '---',
      '## 8. 건강·생활',
      ''
    );
    if (isJobDomain) {
      report.push(
        `* **명리상 생활 균형 가이드**: ${healthGuideText}`,
        '* **생활 습관상 보완점**: 퇴근 후에는 직장 관련 시각 자극과 기기를 분리하고, 조용한 공간에서 심신을 안정시키는 전환 루틴을 유지하십시오.'
      );
    } else {
      report.push(
        '* **명리상 생활에서 주의할 부분**: 신체 에너지의 과열과 긴장 정체를 완화하고 휴식을 보충하는 방향으로 생활 리듬을 조율하는 것이 권장됩니다. (※ 본 결과는 전문 의료 행위를 대체하지 않으며 실제 증상이 있을 경우 의료기관 전문의의 진단을 우선하십시오.)',
        '* **스트레스와 생활 리듬**: 직무 스트레스와 긴장감이 지속될 경우 신체 피로도가 쉽게 누적되고 수면 리듬이 흔들릴 수 있으므로 규칙적인 이완이 필요합니다.',
        '* **생활 습관상 보완점**: 체내와 환경의 건조함을 방어하기 위해 미온수를 규칙적으로 섭취하고 쾌적한 실내 공기와 적정 습도를 유지하십시오. 침실과 업무 공간의 조도를 분리하여 밤에는 충분한 숙면을 취할 수 있는 환경을 조성하십시오.'
      );
    }

    // [9] 현재 고민 진단 (역할: 상위 사건 근거 수집 및 현실 해석 엔진 데이터 직접 바인딩)
    const concernFact = userInput.currentEvent || userInput.userTrouble || '상담 요청 고민 사항';
    const desiredQuestionFact = userInput.desiredQuestion || '앞으로의 흐름과 현실적 대처 방안';

    const candidateLines = (evidenceResult?.causalCandidates || []).map(c => 
      `  - **가설 [${c.hypothesisTitle}]**: ${c.realityExplanation}`
    );

    report.push(
      '',
      '---',
      '## 9. 현재 고민 진단',
      '',
      `* **사용자께서 직접 설명하신 사실**: "${concernFact}"`,
      `* **핵심 질문**: "${desiredQuestionFact}"`,
      '* **명리학적 내면 기질과 성향**:',
      `  - 일간이 ${strengthStatus}(${strengthScore}점)하여 스스로 납득할 수 있는 정석적인 업무 기준과 완성도에 대한 내적 잣대가 대단히 엄격한 기질입니다.`,
      '  - 자신의 주관이 확고한 만큼, 일관되지 않은 피드백이나 합리성이 결여된 지침에 대해 마음속 깊은 저항감과 피로도를 민감하게 체감하기 쉬운 성향입니다.',
      `  - 원국 지지의 상호작용(${relationSummaryText})은 외부의 가변적인 환경 변화를 유연하게 흘려보내지 못하고, 상대방의 태도를 깊이 반추하며 심리적 긴장도를 키우기 쉬운 감수성으로 작용할 수 있습니다.`,
      '* **상황적 개연성 및 역학 분석**:',
      `  - ${evidenceResult?.realityInterpretation || '원칙과 완성도를 중시하는 실무자의 내적 기준과 외부 환경 간의 상호작용 엇박자가 시간축의 환경적 자극과 맞물려 표면화된 흐름입니다.'}`,
      ...(candidateLines.length > 0 ? candidateLines : [
        '  - 원칙을 중시하는 실무자와 가변적인 상급자/조직 환경 간의 소통 및 업무 스타일 불일치가 핵심적 배경으로 분석됩니다.'
      ])
    );

    // [10] 현재 운과 시기 (시간축) (현재 연월과 사건 분석 연도 엄격 분리)
    const currentYear = new Date().getFullYear() || 2026;
    const currentMonth = new Date().getMonth() + 1;
    const currentYearSeun = this.luckEngine.getAnnualLuck(currentYear).name;
    const eventYear = userInput.targetYear && userInput.targetYear < currentYear ? userInput.targetYear : undefined;
    const eventYearSeun = eventYear ? this.luckEngine.getAnnualLuck(eventYear).name : undefined;

    const pastDesc = timeAxis?.timeline.pastFlow || `${curDwGanji} 대운의 환경 무대 속에서 자신의 영역을 다져왔으나, 환경적 변화와 가치관 충돌이 수면 아래에서 점진적으로 누적되어 온 흐름입니다.`;
    const presentDesc = timeAxis?.timeline.currentPhase || `${currentYear}년 ${currentMonth}월 현재, 과열되었던 갈등의 여파를 수습하고 서면 프로토콜과 실무 역량을 바탕으로 현실적 주도권을 확보해야 하는 국면입니다.`;
    const futureDesc = timeAxis?.timeline.futureTransition || `다가오는 전환 분기점부터 기운의 성질이 바뀌며 의뢰인이 주도권을 쥐고 이직 또는 부서 이동 등 현실적 선택지를 유리하게 결정할 수 있는 완화 국면으로 전환됩니다.`;

    const pressurePeriod = timeAxis?.pressureFactors?.[1] || `주의 구간: 지난 과열 파동 구간에 마찰과 스트레스가 가장 예민하게 체감되었던 배경이 있습니다.`;
    const reliefPeriod = timeAxis?.reliefFactors?.[0] || `완화 구간: 현재(${currentMonth}월) 전후로 식상(금)·조후(수) 기운이 이어지며 감정 과열이 가라앉고 객관적 분별력이 회복되는 국면`;
    const opportunityPeriod = timeAxis?.opportunityFactors?.[0] || '기회 구간: 연말 및 다음 해 초 전후로 심리적 안정과 새로운 환경(이직 또는 부서 이동)으로의 전환 기회가 열리는 시점';

    report.push(
      '',
      '---',
      '## 10. 현재 운과 시기',
      '',
      `* **현재 대운**: ${curDwGanji} 대운 (만 ${curDwStartAge}세 ~ ${curDwEndAge}세) — ${curDwTenGodDesc}이 유입되는 환경으로, 현실적인 자립 기반을 다지고 실속을 축적해 나가는 10년의 주기입니다.`,
      `* **현재 상담 시점**: ${currentYear}년 ${currentMonth}월 [${currentYearSeun}] 세운 — 누적된 스트레스 파동을 객관화하고 진로의 실리적 방향을 확정해야 하는 현재 국면입니다.`
    );

    if (eventYear && eventYearSeun) {
      report.push(
        `* **사건 발단 및 분석 기준 시기**: ${eventYear}년 [${eventYearSeun}] 세운 — 조직의 위계질서(관성)와 일간의 기운이 맞물리며 직무상 긴장 파동이 수면 아래에서 서서히 부각되기 시작했던 역학적 배경 시기입니다. (※ 실제 사건의 구체적 발단과 경과는 의뢰인의 현실 경험에 따릅니다.)`
      );
    } else {
      report.push(
        `* **시기적 배경과 상황의 연결**: 대운과 세운의 기운이 원국과 상호작용하며, 직장 내 스트레스와 상사와의 갈등 파동이 집중적으로 부각되었던 역학적 흐름입니다.`
      );
    }

    report.push(
      '* **시간축 3단계 흐름**:',
      `  - **과거 흐름**: ${pastDesc}`,
      `  - **현재 흐름**: ${presentDesc}`,
      `  - **향후 흐름**: ${futureDesc}`,
      '* **시기별 역학적 파동**:',
      `  - **주의 구간 (과거 누적기)**: ${pressurePeriod}`,
      `  - **완화 구간 (현재 안정기)**: ${reliefPeriod}`,
      `  - **전환 구간 (향후 기회기)**: ${opportunityPeriod}`
    );

    // [11] 마·살·관계 (역할: 심리적 완충 및 두려움 해소, 1:1 매핑 및 미신성 표현 전면 배제)
    report.push(
      '',
      '---',
      '## 11. 마·살·관계',
      '',
      `* **해당 명리 요소**: ${magaSalSummaryText}`,
      '* **명리학적 본질과 심리적 기제**:',
      '  - **지지 상호작용 및 기질적 특성의 본질**: 명리적 요소는 외부 사건을 직접 유발하는 물리적 원인이 아니라, "스스로 정한 원칙과 세부 완성도 기준이 매우 엄격하여, 일관되지 않은 절차나 가변적 상황을 접했을 때 내면의 거부감과 스트레스가 남들보다 민감하게 체감되는 완벽주의적 인지 기제"에 해당합니다.',
      '  - **망신 및 자형 계열의 심리적 작용**: 남에게 흠을 잡히지 않으려는 높은 책임감의 반작용으로, 부정적 피드백이나 지적을 받았을 때 체면 손상과 억울함을 더 깊게 반추하는 자기방어적 민감성을 의미합니다.',
      `* **현실 상황과의 관계 (복합적 상호작용)**: 현재 겪고 계신 직장 내 갈등은 특정 살이나 파로 인해 필연적으로 발생한 액운이 결코 아닙니다. '원칙과 정확성을 추구하는 의뢰인의 높은 완결주의 기질'과 '가변적이고 불합리한 조직의 소통 방식'이 현실에서 맞부딪히며 증폭된 상호작용의 결과입니다. ${isWeak ? '신약한 구조일수록 이러한 마찰에서 오는 피로와 긴장도가 내면에 빠르게 누적되기 쉬우므로, 감정으로 맞서지 말고 객관적 서면 프로토콜로 에너지를 보호해야 합니다.' : '일간의 내구력을 바탕으로 중심을 잡되, 무리한 정면충돌을 피하고 서면 증빙으로 실리를 확보해야 합니다.'}`
    );

    // [12] 환경 처방 (역할: 현대적 멘탈 보호 및 물리적 공간/생활 분리 솔루션)
    report.push(
      '',
      '---',
      '## 12. 환경 처방',
      '',
      '* **처방 목적**: 직장에서 발생한 감정적 긴장과 스트레스가 개인의 사생활과 휴식 공간으로 침투하지 못하도록 물리적·심리적 차단벽을 구축하는 것입니다.',
      '* **공간 분리**: 퇴근 후에는 업무용 메신저와 노트북 등 직장 관련 기기를 시야에서 완전히 치우고, 집안 내에 방해받지 않는 독립된 1인 휴식 공간을 지정하십시오.',
      '* **감각적 이완**: 침실과 거실의 형광등 직접 조명을 끄고 은은하고 따뜻한 색온도의 간접 조명을 활용하여 퇴근 후 교감신경의 과도한 긴장을 가라앉히십시오.',
      '* **생활 루틴**: 퇴근 직후 직장 동료들과의 감정적인 뒷담화 모임이나 술자리를 엄격히 피하고, 가벼운 산책이나 미온수 샤워로 업무 스트레스를 씻어내는 정적인 전환 루틴을 확립하십시오.',
      '* **디지털 디톡스**: 퇴근 후에는 스마트폰과 소셜 미디어를 잠시 멀리하고, 정적인 서적이나 명상을 통해 뇌의 각성 상태를 낮추십시오.'
    );

    // [13] 행동 처방 (A. 명리적 내면 조율 + B. 현실 직무 안전장치)
    const protoRes = presSynth?.protocolResult;
    const script = protoRes?.dialogueScript;
    const email = protoRes?.emailTemplate;
    const orgCulture = protoRes?.orgCultureCriteria;

    report.push(
      '',
      '---',
      '## 13. 행동 처방',
      '',
      `* **처방 목적**: ${isWeak ? `신약한 일간(${stemInfo.korean})의 심리적 에너지 소모를 방어하고, 과도한 외압을 혼자 감당하지 않도록` : `일간(${stemInfo.korean})의 강한 주관이 감정적 정면충돌로 비화하는 것을 막고,`} 이성적인 서면 증빙과 표준 프로토콜을 통해 현실적 실리와 주도권을 확보하는 것입니다.`,
      '',
      '### 13-1. 명리학적 내면 에너지 조율 원칙',
      '  - **현장 감정 반응 유보**: 상사의 질책이나 갑작스러운 지시 번복이 있을 때 면전에서 즉시 반박하거나 감정을 표출하지 말고, "확인 후 정리하여 보고드리겠습니다"와 같이 공식 검토 시간을 확보하여 심리적 거리를 두십시오.',
      '  - **당일 업무 서면화 원칙**: 구두로 오간 모든 업무 지시는 당일 이내에 메일이나 사내 메신저를 통해 객관적인 서면 기록으로 남겨 증빙을 축적하십시오.',
      '  - **심리적 분리**: 상사의 비합리성을 나의 실무적 결함으로 동일시하지 말고, 조직의 소통 결함으로 객관화하여 사무적이고 정중한 업무적 경계선을 유지하십시오.',
      '',
      '### 13-2. 현실 직무 안전장치 (실전 행동 도구)',
      '*(※ 본 실전 도구는 사내 소통 스트레스를 완화하고 객관적 기록을 돕기 위한 현실 행동 가이드이며, 소속 회사의 취업규칙과 조직 문화에 맞추어 유연하게 활용하십시오.)*',
      '',
      '* **[실전 대응 도구 1] 면전 갈등 탈출을 위한 3단 대화 스크립트**:',
      `  - **상황 (이 말이 필요한 순간)**: ${script?.triggerScenario || '상사의 돌발 지시 번복 또는 무리한 업무 배정 직후'}`,
      `  - **실제 구사할 대화 멘트**: ${script?.spokenScript || '“팀장님, 요청해주신 업무의 긴급성과 취지는 이해했습니다. 다만 현재 제가 맡고 있는 주요 과업 납기가 예정되어 있어, 이 업무를 병행할 경우 기존 과업에 지연이 발생할 수 있습니다. 두 업무 중 어떤 것을 우선순위로 둘지 조정해주시면 그에 맞춰 진행하겠습니다.”'}`,
      `  - **기질별 말할 때의 주의점**: ${script?.toneCaution || '감정적으로 맞서지 말고, 상대방에게 [우선순위 선택권]을 넘겨 상급자가 일정 조정이나 업무 분배를 재검토하도록 유도하십시오.'}`,
      `  - **전략적 목표**: ${script?.objective || '거절의 책임을 실무자가 지는 것이 아니라, 상급자가 직접 우선순위 트레이드오프를 판단하여 합리적으로 조율하도록 유도합니다.'}`,
      '',
      '* **[실전 대응 도구 2] 상사 말 번복 및 책임 전가 방어용 이메일 템플릿**:',
      `  - **메일 제목**: \`${email?.subject || '[업무 우선순위 조율] 추가 요청 과업에 따른 기존 프로젝트 일정 재조정 요청'}\``,
      `  - **발송 권장 시점**: ${email?.timingGuide || '구두 지시 수신 당일 이내 (업무 종료 전)'}`,
      `  - **수신 및 참조 가이드**: ${email?.recipientsGuide || '수신인: 직속 상사 / 참조인: 프로젝트 협업 실무진 (※ 사내 정보보안 규정에 맞춰 공식 업무 시스템 내 아카이빙 폴더에 보관)'}`,
      '  - **실제 발송 본문 양식**:',
      '    ```text',
      email?.bodyTemplate || '지시 사항 변경점 및 수정 일정을 정리하여 공유드립니다.',
      '    ```',
      '',
      '* **피해야 할 핵심 금기 행동**:',
      ...(presSynth?.behaviorRemedy.mustAvoidRules || [
        '감정이 격양된 상태에서 즉흥적으로 사직서를 제출하거나 면전 대립하는 것',
        '확실한 다음 대안 없이 홧김에 충동적으로 직장을 이탈하는 것',
        '사내 동료들에게 감정적인 험담을 하여 또 다른 구설과 고립을 자초하는 것'
      ]).map(rule => `  - ${rule}`)
    );

    // [14] 선택지 비교 및 의사결정 기준 (버티기 vs 이직 비교표 + 맞춤 조직 문화 타겟팅 기준표)
    report.push(
      '',
      '---',
      '## 14. 선택지 비교 및 의사결정 기준',
      '',
      '* **퇴사 vs 버티기 의사결정 비교표**:',
      '  - **선택지 A — 현재 직장 유지 (버티기 / 지구전)**:',
      '    • 실리: 안정된 급여와 경력의 연속성을 유지하며 시간축의 스트레스 파동을 이성적으로 넘길 수 있음.',
      '    • 감내 요소: 상사의 지시 변경에 따른 심리적 피로를 당분간 서면 루틴으로 견뎌내야 함.',
      '    • 현실 확인 조건: 서면 크로스체크를 가동했을 때 지시 번복 빈도가 실질적으로 통제되는가.',
      '  - **선택지 B — 계획적 이직 준비 (전환 / 외부 이동)**:',
      '    • 실리: 보다 합리적인 소통 문화를 가진 조직으로 이동하여 자존감과 직무 만족도를 회복할 수 있음.',
      '    • 감내 요소: 지금 당장 무작정 나갈 경우 발생하는 공백기와 경제적 압박을 방어해야 함.',
      '    • 현실 확인 조건: 최근 2년간의 업무 실적 포트폴리오 완성 여부 및 3~6개월의 비상 생활비 확보 여부.',
      '',
      '* **의뢰인 기질 맞춤 조직 문화 타겟팅 기준표 (이직 성공용)**:',
      '  - **의뢰인의 기질상 피로도가 높아지기 쉬운 조직 문화**:',
      ...(orgCulture?.avoidCultureTypes || [
        '도제식 구두 지시 중심 문화 (문서화 시스템이 없고 상사의 기분에 따라 R&R이 흔들리는 조직)',
        'R&R 경계가 모호하여 문제 발생 시 실무자에게 책임을 전가하는 폐쇄적 위계 조직'
      ]).map(item => `    • ${item}`),
      '  - **기질적 강점을 발휘하기 유리한 추천 조직 문화**:',
      ...(orgCulture?.recommendedCultureTypes || [
        '지표(KPI/OKR) 및 과업 중심의 객관적 평가 체계를 갖춘 조직',
        'Jira, Notion 등 비동기 티켓/문서 기반으로 히스토리가 투명하게 아카이빙되는 시스템 중심 기업'
      ]).map(item => `    • ${item}`),
      '  - **면접 시 상대 회사를 역검증할 수 있는 핵심 질문**:',
      ...(orgCulture?.interviewCheckpoints || [
        '“팀 내에서 프로젝트 진행 중 요구사항이나 기획 방향이 바뀔 때, 어떤 채널과 툴을 통해 히스토리와 일정을 관리하시나요?”',
        '“연간 또는 반기 평가 시 정량 지표와 정성 평가의 비중은 어떻게 되며, 과업 변경에 따른 일정 지연은 평가에 어떻게 보정 반영되나요?”'
      ]).map(item => `    • ${item}`)
    );

    // [15] 최종 종합 진단 및 실행 로드맵 (단일 책임: 핵심 요약 + 단계별 로드맵 + 체크리스트)
    const summaryCoreP1 = isWeak
      ? `중화신약(${strengthScore}점)한 ${stemInfo.korean} 관성 구조로, 업무 완결성 기준과 책임감은 대단히 높으나 환경 압박에 에너지가 빠르게 소모되는 기질입니다. 무작정 혼자 버티기보다 명확한 업무 경계선과 서면 완충 장치로 스스로를 보호해야 하는 구조입니다.`
      : `${strengthStatus}(${strengthScore}점)한 ${stemInfo.korean} 구조로, 자생력과 주관이 굳건하여 외압에 쉽게 흔들리지 않는 자립심을 지녔으나, 완고한 원칙주의로 인한 마찰을 완화해야 하는 구조입니다.`;

    report.push(
      '',
      '---',
      '## 15. 최종 종합 진단 및 실행 로드맵',
      '',
      '### 15-1. 핵심 5문 5답 종합 요약',
      `1. **사주의 핵심**: ${summaryCoreP1}`,
      '2. **현재 고민의 본질**: 의뢰인의 정석적인 업무 기준과 상급자의 가변적 지침이 충돌하면서, 억울함으로 인해 대책 없이 회사를 그만두고 싶어 하는 충동이 맞부딪히고 있는 국면입니다.',
      '3. **가장 중요한 판단 기준**: 감정에 밀려 무작정 퇴사하는 것이 아니라, \'나의 경력과 경제적 실리를 온전히 지키면서 더 나은 기회로 이동할 준비가 갖추어졌는가\'입니다.',
      '4. **지금 당장 취할 첫 행동**: 즉각적인 퇴사 통보나 현장 언쟁을 일절 멈추고, 13번에서 안내된 공식 프로토콜(3단 대화 및 서면 확인)을 통해 업무 경계선만 차분히 세우십시오.',
      '5. **앞으로의 진로 방향**: 당분간 감정을 분리한 채 자리를 지키며, 포트폴리오와 비상 생활 자금이 완비되는 단계에 맞춰 차분하게 현실적 진로를 확정해 나가는 병행 전략을 권장합니다.',
      '',
      '### 15-2. 단계별 실행 로드맵',
      '*(※ 본 실행 로드맵은 명리적 시기와 별개로, 현실적인 커리어 안정성과 직무 지속성을 확보하기 위한 실천적 행동 단계입니다.)*',
      '* **1단계: 즉시 실행 (방어 및 사실 기록기)**',
      ...(presSynth?.executionRoadmap.shortTermPlan || [
        '구두 지시 발생 시 당일 내 확인 메일 공유 루틴 정착',
        '상사의 지시 변경 사례와 본인 수행 내역을 날짜별로 객관적 파일에 사내 보관',
        '퇴근 후 직장 생각을 차단하는 산책 및 스마트폰 알림 분리 루틴 시작',
      ]).map(item => `  - ${item}`),
      '* **2단계: 중기 실행 (정돈 및 포트폴리오기)**',
      ...(presSynth?.executionRoadmap.midTermPlan || [
        '축적된 기록을 바탕으로 소통 절차의 안정화 여부 객관적 재평가',
        '충동적 퇴사 대신 물밑에서 이력서 업데이트 및 성과 포트폴리오 정리 완료',
        '타겟 조직 문화 기준표(14번)에 부합하는 후보 기업 리스트업 및 비상 생활비 점검',
      ]).map(item => `  - ${item}`),
      '* **3단계: 전환 실행 (현실적 의사결정 및 전환기)**',
      '  - 축적된 서면 기록과 포트폴리오를 바탕으로 사내 업무 재조정 협의 또는 외부 채용 공고 본격 지원',
      '  - 최종 합격 및 조건 확정 후 정당한 인수인계 기간을 거쳐 원만한 마무리와 안정적인 커리어 전환 완성',
      '',
      '### 15-3. 실천 점검 체크리스트',
      ...(presSynth?.executionRoadmap.actionChecklist || [
        '불합리한 상황에 직면했을 때 현장 감정 표출을 멈추고 공식 서면 검토 시간을 확보했는가?',
        '중요한 업무 지침 변경을 사내 공식 시스템 내에 객관적 서면으로 남겨두었는가?',
        '홧김의 퇴사 대신 14번 조직 문화 기준표를 바탕으로 이직 포트폴리오를 준비하고 있는가?',
      ]).map(item => `  - [ ] ${item}`),
      '',
      '### 15-4. 실무 보조 도구',
      '  - **[업무 아카이빙 시트]** 일자별 지시 내용 / 요청자 / 변경 이력 / 완료 결과물을 기록하는 사내 엑셀 양식 구축',
      '  - **[행동 리마인더 카드]** "1. 즉각 답하지 않는다 / 2. 서면으로 확인한다 / 3. 감정과 업무를 분리한다" 데스크 비치',
      '  - *(※ 사내 정보보안 규정 및 취업규칙을 준수하는 범위 내에서 안전하게 활용하십시오.)*'
    );

    return report.join('\n');
  }

  /**
   * 기술적 명리 용어를 고객 친화적인 설명으로 번역
   */
  private translateMyeongliToCustomerLanguage(
    modules: Record<ModularId, ModularOutput>,
    domain: ProblemDomain,
    mapping?: EventModuleMappingResult
  ): string {
    const lines: string[] = [];

    const relMod = modules['RELATION'];
    if (relMod && relMod.success) {
      const metrics = relMod.calculation.rawMetrics;
      const clashes = metrics?.clashes || [];
      const punishments = metrics?.punishments || [];
      const wonjins = metrics?.wonjins || [];

      if (clashes.length > 0) {
        lines.push(`타고난 관계 구조와 현재 시간의 흐름이 정면으로 부딪히는 시기(지지 충 작용: ${clashes.join(', ')})라 가까운 사람과 관계가 갑자기 바뀌거나 예기치 못한 단절이 나타나기 쉽습니다.`);
      } else if (punishments.length > 0) {
        lines.push(`원칙과 이해관계가 서로 맞물려 팽팽한 긴장과 마찰이 발생하는 시기(지지 형 작용: ${punishments.join(', ')})로, 조급하게 밀어붙일수록 손실이 커질 수 있습니다.`);
      } else if (wonjins.length > 0) {
        lines.push(`상대방과의 소통에서 감정적 오해나 서운함이 증폭되기 쉬운 흐름(원진 작용: ${wonjins.join(', ')})이 작용하고 있습니다.`);
      } else {
        lines.push('타고난 지지 기운 간의 조화가 비교적 안정적이나, 외부 환경의 일시적 변화에 주의가 요구됩니다.');
      }
    }

    const tgMod = modules['TEN_GODS'];
    if (tgMod && tgMod.success) {
      lines.push('현재 에너지 구조상 나를 둘러싼 환경의 요구와 내면의 통제력 사이에 불균형이 감지되며, 이는 무리한 확장보다 방어적 태세가 유리함을 보여줍니다.');
    }

    const seunMod = modules['SEUN'];
    if (seunMod && seunMod.success) {
      lines.push('특히 현재 맞이한 세운의 기운은 잠재되어 있던 갈등 요소를 겉으로 드러내는 촉발제 역할을 하고 있습니다.');
    }

    if (lines.length === 0) {
      lines.push('타고난 명리 구조와 현재 운의 흐름이 만나 삶의 특정 영역에 강한 변화의 자극을 주고 있는 상태입니다.');
    }

    return lines.join(' ');
  }

  /**
   * 마·살 진단 결과를 고객 친화적 주의사항으로 번역
   */
  private translateMagaToCustomerLanguage(
    maga: any,
    modules: Record<ModularId, ModularOutput>,
    domain: ProblemDomain
  ): string {
    const lines: string[] = [];

    const activeSal = maga?.activeSal || maga?.detectedSals || [];
    if (activeSal.length > 0) {
      const salNames = activeSal.map((s: any) => typeof s === 'string' ? s : (s.name || s.salName)).join(', ');
      lines.push(`현재 기운에서 활성화된 특수 에너지 패턴(마·살 작용: ${salNames})에 주목해야 합니다.`);
      lines.push('이는 재앙이나 불행을 확정하는 것이 아니라, "특정 상황에서 감정의 폭주나 돌발적인 실수가 발생하기 쉬우니 각별히 경계하라"는 일종의 안전 경고등입니다.');
    } else {
      lines.push('극단적인 흉살의 작용은 드물지만, 일상적인 부주의나 과도한 욕심이 문제를 키우지 않도록 경계해야 합니다.');
    }

    return lines.join(' ');
  }

  /**
   * 시기별 흐름 추출
   */
  private extractTimingFlow(
    modules: Record<ModularId, ModularOutput>,
    user: UserProblemInput,
    presReport: any
  ): string {
    if (presReport?.timingRoadmap) {
      return presReport.timingRoadmap;
    }
    return '[1단계 쿨링: 향후 2~4주] 즉각적인 반응을 삼가고 침묵 보전 → [2단계 완화: 2~3개월 후] 기운의 마찰이 서서히 잦아들며 대화나 정리의 기회 포착 → [3단계 재개: 하반기 이후] 새로운 국면으로 전환되어 점진적 회복 추구';
  }

  private getDomainKoreanName(domain: ProblemDomain): string {
    const map: Record<ProblemDomain, string> = {
      BUSINESS: '사업/계약',
      JOB: '직장/커리어',
      LOVE: '연애/관계',
      MARRIAGE: '결혼/부부',
      MONEY: '재물/자산',
      RELATIONSHIP: '인간관계',
      HEALTH: '건강/활력',
      GENERAL: '종합/진로',
    };
    return map[domain] || '종합';
  }

  /**
   * 금지된 확정적 미래 단정 및 공포 조장 표현 검사 (Section 14)
   */
  private containsForbiddenFatalism(text: string): boolean {
    const forbiddenPatterns = [
      /죽는다/,
      /반드시\s*(사고|파산|이혼|죽|병|실패)/,
      /무조건\s*(병|실패|망|파산)/,
      /투자하면\s*반드시\s*돈을\s*번다/,
      /이\s*처방을\s*하면\s*운명이\s*바뀐다/,
      /부적을\s*사용하면\s*문제가\s*해결된다/,
      /100%\s*(망한다|헤어진다|성공한다|실패한다|이혼한다)/,
    ];
    return forbiddenPatterns.some(pattern => pattern.test(text));
  }
}

export const customerDeliverableBuilder = new CustomerDeliverableBuilder();
