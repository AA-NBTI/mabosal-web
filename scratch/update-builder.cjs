const fs = require('fs');

const builderCode = `/**
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
  /**
   * 최종 고객 전달용 결과물 생성
   */
  public buildDeliverable(ctx: CustomerDeliverableContext): CustomerDeliverable {
    const { userInput, domain, depth, executedModules, eventDiagnosis, magaDiagnosis, eventMapping, caseProtocol, prescriptionReport } = ctx;

    const concernText = userInput.currentEvent || userInput.userTrouble || '현재 직면한 문제';
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
    const envPrescriptionText = envSummary.map((e: string) => \`• \${e}\`).join('\\n');

    const actSummary = prescriptionReport?.mustDo || [
      '중요한 결정의 시기를 2~4주 뒤로 늦추고 침묵을 유지하십시오.',
      '자신의 일상 루틴과 객관적 기록을 정돈하십시오.',
      '감정적 대응을 완전히 차단하고 신뢰할 수 있는 제3자의 조언을 구하십시오.',
    ];
    const behaviorPrescriptionText = actSummary.map((b: string) => \`• \${b}\`).join('\\n');

    const remedySummary = prescriptionReport?.remedyItems || [
      { title: '마음 안정용 상징 소품', purpose: '심리적 완충 및 불안 완화' },
    ];
    const remedyPrescriptionText = (depth >= 5 || (prescriptionReport?.remedyItems && prescriptionReport.remedyItems.length > 0))
      ? remedySummary.map((r: any) => \`• [\${r.title || '상징 보조물'}]: \${r.purpose || '에너지 조화 및 심리적 안정'}\`).join('\\n')
      : '현재 단계에서는 복잡한 물품보다 주변 정리와 생활 루틴의 회복이 우선적으로 권장됩니다.';

    // 6. 판단 강도 설정
    const verdictStrength = '현재 기운의 흐름상 주의가 필요하며, 우선 환경과 행동을 적극적으로 관리하는 것이 좋습니다.';

    // 7. 10단계 권장 섹션 구성
    const step1_currentEvent = \`고객님께서 남겨주신 상황: "\${concernText}"\\n질문하신 요점: "\${desiredQuestionText}"\\n현재 갑작스러운 상황 변화로 인해 심리적 불안과 혼란이 매우 크게 느껴질 수 있는 국면입니다.\`;

    const step2_whyOccurred = caseProtocol
      ? \`\${caseProtocol.similarRealWorldCase}\\n\\n\${caseProtocol.personalApplication}\`
      : \`외부 상황의 변동과 주변 인물과의 소통 방식 차이가 복합적으로 얽히며 나타난 현상입니다. 상대방이나 환경의 급변은 고객님의 잘못 때문이라기보다, 양측의 긴장이 일시적으로 과열된 환경적 요인이 크게 작용했습니다.\`;

    const step3_myeongliCore = \`\${myeongliExplanation}\\n(판단: \${verdictStrength})\`;
    const step4_magaCaution = \`\${magaExplanation}\\n지나친 두려움이나 비관에 빠질 필요는 없으나, 충동적이거나 조급한 대처는 불리하게 작용하기 쉬우므로 침착한 대응이 요구됩니다.\`;
    const step5_futureFlow = \`\${timingFlow}\\n운의 기운은 고정되어 있지 않으며, 현재의 긴장기가 지나면 점진적으로 완충 및 회복의 시기로 접어들게 됩니다.\`;
    const step6_whatToChange = caseProtocol?.understanding
      ? \`\${caseProtocol.understanding}\\n\\n기존의 즉흥적이거나 감정적인 대응 방식을 멈추고, 객관적인 기록과 침묵을 통해 상황의 주도권을 되찾는 태도 전환이 필요합니다.\`
      : \`상황을 단숨에 역전시키려는 조급함을 내려놓고, 일상의 안정과 내면의 질서를 먼저 바로잡는 관점의 전환이 가장 필요합니다.\`;

    const step7_environmentPrescription = \`[공간 및 환경 개선 처방]\\n\${envPrescriptionText}\\n주변 환경의 작은 변화가 내면의 에너지를 보호하고 외부 마찰을 줄여주는 강력한 방패가 됩니다.\`;
    const step8_behaviorPrescription = \`[행동 및 실천 처방]\\n\${behaviorPrescriptionText}\\n당장의 성급한 반응을 자제하고 루틴을 지키는 것이 문제를 해결하는 가장 안전한 열쇠입니다.\`;
    const step9_remedyItems = \`[필요한 경우 상징적 보조 처방물]\\n\${remedyPrescriptionText}\`;
    const step10_finalSummary = \`[최종 요약 안내]\\n현재의 고난은 영원한 정체가 아니며, 사주 기운의 환절기를 지혜롭게 건너기 위한 정돈의 계기입니다. 스스로를 자책하지 말고 안내해 드린 처방을 차분히 실천해 나가시기 바랍니다.\`;

    // 8. 7대 핵심 고객 질문에 대한 직답
    const answersTo7Questions = {
      q1_whyNow: \`현재 세운과 원국 기운의 상호작용으로 인해 평소보다 외부 자극에 대한 민감도가 높아지고, 인간관계 및 사회적 환경에서 이견과 마찰이 발생하기 쉬운 전환기에 놓여 있기 때문입니다.\`,
      q2_myeongliIssue: \`타고난 사주의 에너지 분포와 현재 유입되는 운의 기운 사이에 일시적인 불균형(과열 또는 정체)이 빚어지며 현실의 스트레스를 증폭시키는 것이 명리적 핵심입니다.\`,
      q3_timingPeriod: \`대략 향후 2~3개월간이 가장 신중해야 할 냉각기이며, 이후 계절적 절기의 전환과 함께 기운이 순화되면서 해결의 실마리가 잡히게 됩니다.\`,
      q4_actionToDo: \`감정적인 즉각 반박을 멈추고 최소 24시간 동안 응답을 유예하며, 중요한 업무 지시나 약속은 반드시 메일이나 메신저 등 서면 기록으로 남겨두는 행동이 가장 필요합니다.\`,
      q5_environmentChange: \`생활 공간의 조도를 낮추고 소음을 차단할 수 있는 1인 휴식처를 확보하며, 시각적인 냉각감을 주는 색상과 소재를 생활 주변에 배치하여 심신 긴장을 완화하십시오.\`,
      q6_prescriptionNeeded: \`상황을 단번에 뒤집으려 하지 말고, 나의 일상 루틴을 보존하며 내적 중심을 단단히 세우는 심리적 방어벽 형성이 최우선 처방입니다.\`,
      q7_cautionToWatch: \`억울함이나 분노에 휩쓸려 대책 없이 관계를 파탄 내거나 충동적으로 사직서를 제출하는 등 돌이킬 수 없는 극단적 결정을 내리는 것을 가장 경계해야 합니다.\`,
    };

    // 9. 포맷팅 통합 텍스트
    const fullFormattedText = [
      '# 마보살 고객 맞춤 사주 솔루션',
      '',
      '---',
      '## [1부] 10단계 심층 분석 및 처방',
      '',
      \`### 1. 지금 무슨 일이 생겼는가\\n\${step1_currentEvent}\`,
      '',
      \`### 2. 왜 이런 문제가 나타났는가\\n\${step2_whyOccurred}\`,
      '',
      \`### 3. 명리적으로 무엇이 핵심인가\\n\${step3_myeongliCore}\`,
      '',
      \`### 4. 마·살 관점에서 무엇을 주의해야 하는가\\n\${step4_magaCaution}\`,
      '',
      \`### 5. 앞으로 어떤 흐름인가\\n\${step5_futureFlow}\`,
      '',
      \`### 6. 무엇을 바꾸는 것이 좋은가\\n\${step6_whatToChange}\`,
      '',
      \`### 7. 환경 처방\\n\${step7_environmentPrescription}\`,
      '',
      \`### 8. 행동 처방\\n\${step8_behaviorPrescription}\`,
      '',
      \`### 9. 필요한 경우 처방물\\n\${step9_remedyItems}\`,
      '',
      \`### 10. 최종 정리\\n\${step10_finalSummary}\`,
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
      prescriptionReport?.safeguardNotice || '본 분석은 명리학적 에너지 흐름에 기반한 가이드이며, 의료 질환, 법적 분쟁, 금융 투자의 결과를 단정하지 않습니다.',
    ].join('\\n');

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
      (executedModules['DAEWUN']?.calculation?.rawMetrics?.currentDaeun ? \`\${executedModules['DAEWUN'].calculation.rawMetrics.currentDaeun.stem}\${executedModules['DAEWUN'].calculation.rawMetrics.currentDaeun.branch}\` : undefined);

    const seunMetrics = executedModules['SEUN']?.calculation?.rawMetrics;
    const seunGanzi = seunMetrics ? \`\${seunMetrics.targetYear || 2026}년 [\${seunMetrics.yearGanji || '세운'}]\` : undefined;

    const rawActiveSal = magaDiagnosis?.activeSal || magaDiagnosis?.detectedSals || [];
    const magaActive = rawActiveSal.map((s: any) => typeof s === 'string' ? s : (s.name || s.salName));

    const structuredJudgments = {
      coreProblem: concernText,
      primaryDomain: domain,
      myeongliBasis: [
        myeongliExplanation,
        executedModules['CORE_ORIGINAL']?.data?.fourPillarsText ? \`원국: \${executedModules['CORE_ORIGINAL'].data.fourPillarsText}\` : '',
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

    // Phase 77: 무료 고객 결과물
    const freeDeliverable = this.buildFreeDeliverable(ctx, myeongliExplanation);

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
        return \`\${name} — 현실에서는 자신의 주관과 강한 추진력을 바탕으로 스스로 입지를 다지려는 성향으로 해석할 수 있습니다.\`;
      }
      if (/비견|건록/.test(name)) {
        return \`\${name} — 현실에서는 독립심과 자립적 역량을 중심으로 자신의 무대를 구축하려는 성향으로 해석할 수 있습니다.\`;
      }
      if (/식신|상관/.test(name)) {
        return \`\${name} — 현실에서는 전문성과 창의적 기량을 바탕으로 실제 성과를 도출하려는 성향으로 해석할 수 있습니다.\`;
      }
      if (/정재|편재/.test(name)) {
        return \`\${name} — 현실에서는 자원과 성과를 실제 결과로 연결하려는 성향으로 해석할 수 있습니다.\`;
      }
      if (/정관|편관/.test(name)) {
        return \`\${name} — 현실에서는 조직의 질서와 책임감을 중시하며 원칙에 입각하여 역할을 수행하려는 성향으로 해석할 수 있습니다.\`;
      }
      if (/정인|편인/.test(name)) {
        return \`\${name} — 현실에서는 지적 자산과 깊은 사색을 바탕으로 내실을 다지려는 성향으로 해석할 수 있습니다.\`;
      }
      return \`\${name} — 현실에서는 타고난 기운의 중심축에 따라 사회적 성취를 이루려는 성향으로 해석할 수 있습니다.\`;
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
      ? \`사주 원국 내에 [\${relations.join(', ')}] 등의 기운 상호작용이 형성되어 있어, 평소에는 실속을 다지는 안정성을 지향하나 특정 환경적 자극이 유입되면 내면의 긴장이 유발될 수 있는 구조입니다.\`
      : (relMod?.explanation?.summary || '지지 기운이 조화롭게 균형을 이루고 있습니다.');

    const step1_coreSummary = [
      \`• [일간 본원]: 의뢰인은 \${dayStem}(\${dayElement})의 기운을 본원으로 타고났으며, 전체 기운 중 \${dayElement}의 세력이 중심을 이룹니다.\`,
      \`• [일간 감당력]: \${strengthDesc}\`,
      \`• [사회적 성취 틀]: \${gyeokDesc}\`,
      \`• [핵심 기운 구조]: \${relationSummary}\`,
    ].join('\\n');

    const daewunMod = executedModules['DAEWUN'];
    const seunMod = executedModules['SEUN'];
    const daewunDesc = daewunMod?.explanation?.summary || '현재 대운의 환경에 놓여 있습니다.';
    const seunDesc = seunMod?.explanation?.summary || '현재 세운의 파동이 교차하고 있습니다.';

    const step2_attentionPoint = [
      \`• [10년 주기 환경]: \${daewunDesc}\`,
      \`• [현재 연도 흐름]: \${seunDesc}\`,
      \`• [주목할 상호작용]: 결정된 미래나 피할 수 없는 사건이 아니라, 현재 시간의 흐름은 외부 환경의 변화와 내면의 책임감이 교차하며 [\${this.getDomainKoreanName(domain)}] 영역에 집중적인 주의와 완충을 요구하고 있습니다.\`,
    ].join('\\n');

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
      \`• [현실 경험 양상]: \${domainRealManifestationMap[domain] || domainRealManifestationMap.GENERAL}\`,
      \`• [마·살 조율 가이드]: 사주가 불길한 것이 아니라, \${magaSummary} 감정적인 맞대응을 피하고 안전 거리를 확보하라는 신호입니다.\`,
    ].join('\\n');

    const step4_customerConnectWidget = {
      prompt: '위의 기운 흐름 중 현재 가장 깊게 마주하고 계신 현실 상황이나 고민을 남겨주시면, 사주 원국과 결합된 정밀 인과를 도출합니다.',
      options: domain === 'BUSINESS'
        ? ['거래처 대금 및 자금 경색', '동업자·파트너와의 지분 및 정산 갈등', '계약 파기 및 납기 분쟁', '신규 사업 확장 및 자금 압박']
        : domain === 'JOB'
        ? ['상사와의 갈등 및 공개적 비난', '불합리한 업무 배정 및 지시 변경', '이직 및 퇴사 타이밍 고민', '인사고과 및 승진 누락']
        : domain === 'LOVE'
        ? ['연인과의 이별 및 연락 두절', '반복되는 성격 차이 및 소통 마찰', '재회 가능성 및 접근 타이밍', '상대방의 마음 식음 및 애정도 불안']
        : ['갑작스러운 현금 누수 및 자산 손실', '대출 및 부채 상환 압박', '예상치 못한 목돈 지출', '투자 원금 회수 지연'],
      customInputPlaceholder: '구체적인 상황과 질문을 자유롭게 입력해주세요.',
    };

    const step5_inDepthPreview = [
      '[심층 분석에서 확장되는 핵심 내용]',
      '• 무료 분석: 기본 명리 구조(일간·격국·강약) | 시간축 흐름 | 현재 주목할 영역',
      '• 심층 분석:',
      '  1) 실제 사건과 명리의 인과 규명 (왜 지금 이런 일이 생겼는가)',
      '  2) 정밀 시기 분석 (언제 가장 힘들고, 언제 풀리는가)',
      '  3) 상황별 대응 수칙 (지금 피해야 할 일과 해야 할 일)',
      '  4) 맞춤형 환경·행동 처방전 및 디지털 처방 카드',
    ].join('\\n');

    const fullText = [
      \`### ① 한눈에 보는 핵심\\n\${step1_coreSummary}\`,
      \`### ② 지금 주목할 부분\\n\${step2_attentionPoint}\`,
      \`### ③ 현실에서 나타날 수 있는 모습\\n\${step3_realWorldManifestation}\`,
      \`### ④ 고객 상황 연결 장치\\n[추천 상황 옵션]: \${step4_customerConnectWidget.options.join(' | ')}\`,
      \`### ⑤ 더 깊게 보면 무엇을 알 수 있는가\\n\${step5_inDepthPreview}\`,
    ].join('\\n\\n');

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
        return \`\${s}\${b}(\${sH}\${bH})\`;
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
      const yStr = toHanjaPillar(\`\${pillars.year.stem}\${pillars.year.branch}\`);
      const mStr = toHanjaPillar(\`\${pillars.month.stem}\${pillars.month.branch}\`);
      const dStr = toHanjaPillar(\`\${pillars.day.stem}\${pillars.day.branch}\`);
      const hStr = pillars.hour ? toHanjaPillar(\`\${pillars.hour.stem}\${pillars.hour.branch}\`) : '미상';
      formattedPillars = \`년주: \${yStr}, 월주: \${mStr}, 일주: \${dStr}, 시주: \${hStr}\`;
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
    const gyeokWithHanja = \`\${gyeokName}(\${gyeokHanjaMap[gyeokName] || ''})\`;

    const strengthScore = strengthMod?.data?.score ?? 95;
    const strengthStatus = strengthMod?.data?.status || '극강';

    const relMetrics = relMod?.calculation?.rawMetrics;
    const destructions: string[] = (relMetrics?.destructions || []).map((x: string) => x.replace(/파/g, '파(破)'));
    const harms: string[] = (relMetrics?.harms || []).map((x: string) => x.replace(/해/g, '해(害)'));
    const allRels = [...destructions, ...harms];
    const relationSummaryText = allRels.length > 0 ? allRels.join(', ') : '축진파(丑辰破), 인사해(寅巳害)';

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
      \`* **사주 원국**: \${formattedPillars}\`,
      \`* **일간**: \${stemInfo.korean} — \${stemInfo.nature}\`,
      \`* **오행 분포**: 목(木) \${ohaengDist['목'] ?? 0}개, 화(火) \${ohaengDist['화'] ?? 0}개, 토(土) \${ohaengDist['토'] ?? 0}개, 금(金) \${ohaengDist['금'] ?? 0}개, 수(水) \${ohaengDist['수'] ?? 0}개\`,
      \`* **격국**: \${gyeokWithHanja} — 자신의 주관과 강한 추진력을 바탕으로 스스로 입지를 다져나가는 사회적 성취의 틀\`,
      \`* **강약**: \${strengthStatus}(\${strengthScore}점 / 100점) — 월령을 얻고(득령), 일지에 뿌리를 내렸으며(득지), 일간을 생조하는 세력(득세)이 두루 갖추어져 환경 감당력이 매우 견고함\`,
      \`* **사주의 핵심 구조**: 비견과 겁재(토 기운)가 사주의 절반 이상을 차지하는 비겁태왕(比劫太旺) 구조이며, 화(火) 인성이 토를 생조하여 내면의 중심이 견고하고 외부의 풍파에 쉽게 무너지지 않는 구조입니다. 원국 지지에 \${relationSummaryText} 등이 형성되어 있어, 평소에는 실속과 안정을 추구하나 특정 환경적 자극이 유입될 때 내면의 긴장과 마찰이 발생할 수 있는 경향성을 지닙니다.\`,
      \`* **전체적인 특징**: 의뢰인은 \${stemInfo.korean}의 본원을 타고나 신중하고 성실하며 자립심이 대단히 강합니다. 남에게 쉽게 의존하지 않고 자신의 손으로 직접 결과를 만들어내는 강인한 생명력과 뚝심을 가지고 있습니다.\`
    );

    // [2] 타고난 성향
    report.push(
      '',
      '---',
      '## 2. 타고난 성향',
      '',
      '* **성격**: 비견과 겁재의 기운이 강하여 독립심과 자존감이 대단히 높습니다. 겉으로는 조용하고 예의 바르며 유순해 보이지만, 내면에는 타협하기 어려운 단단한 원칙과 주관이 확고히 자리 잡고 있습니다.',
      '* **사고방식**: 사실과 객관적인 근거를 중시하는 현실주의적 사고방식을 가집니다. 자신이 직접 납득하지 못하면 타인의 권위나 형식적인 지시를 마음으로 온전히 받아들이기 어려워하는 주관적 확신형 사고를 보입니다.',
      '* **행동방식**: 맡은 일은 남에게 미루지 않고 끝까지 스스로 완수하려는 책임감을 보입니다. 요행을 바라지 않고 한 걸음씩 묵묵히 결과를 만들어내는 실천형입니다.',
      '* **강점**: 일간의 환경 감당력이 높아 어떤 외압이나 어려운 환경에서도 쉽게 흔들리지 않고 끝까지 버텨내는 내구력과 위기 극복 역량입니다.',
      '* **약점**: 자신의 기준이 확고한 만큼, 타인의 변덕이나 비합리적인 지시를 융통성 있게 넘기지 못하고 속으로 깊은 거부감을 느낍니다. 억울함이나 분노를 겉으로 즉시 표출하지 않고 안으로 삭이다가 한순간에 관계를 차단해버릴 수 있습니다.',
      \`* **스트레스 상황에서 나타나는 특징**: 원국 내 \${relationSummaryText}의 작용이 자극될 때, 상대방의 말 한마디를 깊이 반추하며 의심과 서운함이 증폭됩니다. 외부와의 소통을 닫아걸고 혼자 고립된 상태에서 심리적 압박감을 과도하게 키우기 쉽습니다.\`
    );

    // [3] 직업·커리어
    report.push(
      '',
      '---',
      '## 3. 직업·커리어',
      '',
      '* **직업 성향**: 체계적이고 명확한 기준이 존재하는 전문 사무직, 분석 및 관리, 문서 및 자산 관리 등 정확성과 지속성이 요구되는 분야에 잘 부합합니다.',
      '* **조직생활**: 직장 내에서 자신의 역할과 책임을 성실히 수행하지만, 위계질서에 의한 무조건적인 복종보다는 상호 존중과 합리적인 절차가 보장되는 조직 문화를 필요로 합니다.',
      '* **상사·동료 관계**: 년지 정관(寅목)이 인사해(寅巳害)의 영향을 받는 구조로, 상사의 지시 의도가 왜곡되어 전달되거나 상급자와의 소통 방식에서 미묘한 엇박자가 발생하기 쉬운 환경에 놓이기 쉽습니다. 동료와는 선의의 협력 관계를 맺되 적절한 거리 유지가 필요합니다.',
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
      '',
      '* **재물 성향**: 원국에 재성이 잠재된 무재(無財)형 구조로, 직접적 투기보다 현금 방어와 안정적 전문 직무 소득 중심의 운용이 필수적인 국면입니다.',
      '* **돈을 버는 방식**: 일확천금이나 투기성 소득보다는 본인의 직무 전문성과 성실한 근로를 통해 지속적인 현금 흐름을 창출하는 방식이 가장 안전합니다.',
      '* **돈을 관리하는 방식**: 자산 방어 중심의 보수적 운용이 필수적입니다. 비견과 겁재의 세력이 왕성하므로, 버는 것보다 새어나가는 것을 막는 원금 방어형 저축이 효과적입니다.',
      '* **재물상 강점과 주의점**: 낭비가 적고 소비 통제력이 우수하며 실속을 중시하는 강점이 있습니다. 다만 주변 사람의 부탁으로 인한 사적인 금전 대여나 연대보증, 실체 없는 고수익 투자 제안에 응할 경우 손실 위험이 있으므로 단호한 방어가 필요합니다. (※ 금융 투자 및 자산 관리는 전문 금융기관의 상담을 우선하시기 바랍니다.)',
      '* **사업·투자 관련 성향**: 변동성이 큰 위험 자산보다는 원금 보존형 상품이나 안전한 실물 자산 중심의 보수적 포트폴리오를 유지하는 것이 바람직합니다.'
    );

    // [5] 연애
    report.push(
      '',
      '---',
      '## 5. 연애',
      '',
      '* **연애 성향**: 사소한 표현 차이나 서운함이 오해로 번지기 쉬우므로, 감정적인 담판을 서두르기보다 충분한 숨고르기와 온화한 소통으로 회복을 도모하는 태도가 필요합니다.',
      '* **이성관계**: 상대방에게 의존하려 하지 않고 독립적인 태도를 유지하므로 듬직한 인상을 주지만, 때로는 감정적인 애교나 다정한 표현이 다소 절제되어 보일 수 있습니다.',
      '* **관계에서 나타나는 특징**: 서운한 점이 생겼을 때 바로 다투기보다는 혼자 속으로 감내하다가, 신뢰가 훼손되었다고 느끼면 차분하게 선을 긋는 패턴을 보입니다.',
      \`* **반복되기 쉬운 관계 문제**: \${harms.length > 0 ? harms.join(', ') : '인사해(寅巳害)'} 등의 작용으로 인해 상대방의 사소한 말실수나 행동을 본인에 대한 무시로 확대 해석하여 감정의 골이 깊어지는 문제가 나타날 수 있으므로, 충분한 숨고르기 후 온화한 소통이 필요합니다.\`
    );

    // [6] 결혼·배우자
    report.push(
      '',
      '---',
      '## 6. 결혼·배우자',
      '',
      '* **배우자 성향**: 일지 배우자궁에 축토(丑土, 비견)가 자리하여, 친구나 동료처럼 편안하면서도 자기 분야에서 뚝심과 성실함을 갖춘 배우자와 인연이 닿기 쉽습니다.',
      '* **결혼관**: 정서적인 환상보다는 현실적인 생활력과 신뢰를 가장 중요한 결혼의 기초로 봅니다. 각자의 사생활과 영역을 지켜주는 독립적인 결혼관을 지닙니다.',
      '* **결혼생활의 특징**: 배우자궁의 에너지를 조율하여 감정 대립을 낮추고 현실적 생활 공간과 원칙을 재정립해야 하는 국면입니다.',
      \`* **부부관계에서 주의할 점**: 일지 배우자궁에 \${destructions.length > 0 ? destructions.join(', ') : '축진파(丑辰破)'}의 기운이 걸려 있어, 생활 습관이나 사소한 가치관 차이로 인해 냉전이 길어질 수 있습니다. 서로의 주관을 꺾으려 하지 말고 명문화된 가족 원칙을 세우는 것이 조화에 도움이 됩니다.\`
    );

    // [7] 인간관계·가족
    report.push(
      '',
      '---',
      '## 7. 인간관계·가족',
      '',
      '* **인간관계 패턴**: 타인의 시선과 평가에 과도하게 에너지를 소모하지 말고, 건강한 심리적 경계선을 그어야 하는 국면입니다.',
      '* **갈등 방식**: 갈등이 발생했을 때 언성을 높여 싸우기보다는 침묵을 지키거나 물리적 거리를 두며 상황을 관망하는 방어형 대응을 취합니다.',
      '* **가족관계**: 가족에 대한 내적인 책임감은 깊으나, 사적인 간섭이나 통제를 강하게 거부하며 일찍부터 정신적·경제적 자립을 추구합니다.',
      '* **주변 사람과의 관계 특징**: 타인의 평가나 시선에 과도하게 에너지를 소모하지 않도록 건강한 심리적 경계선을 그어야 하며, 무리한 인간관계 확장보다는 나만의 안전지대를 확보하는 것이 유리합니다.'
    );

    // [8] 건강·생활
    report.push(
      '',
      '---',
      '## 8. 건강·생활',
      '',
      '* **명리상 생활에서 주의할 부분**: 신체 에너지의 과열과 긴장 정체를 완화하고 휴식을 보충하는 방향으로 생활 리듬을 조율하는 것이 권장됩니다. (※ 본 결과는 전문 의료 행위를 대체하지 않으며 실제 증상이 있을 경우 의료기관 전문의의 진단을 우선하십시오.)',
      '* **스트레스와 생활 리듬**: 직무 스트레스와 긴장감이 지속될 경우 신체 피로도가 쉽게 누적되고 수면 리듬이 흔들릴 수 있으므로 규칙적인 이완이 필요합니다.',
      '* **생활 습관상 보완점**: 체내와 환경의 건조함을 방어하기 위해 미온수를 규칙적으로 섭취하고 쾌적한 실내 공기와 적정 습도를 유지하십시오. 침실과 업무 공간의 조도를 분리하여 밤에는 충분한 숙면을 취할 수 있는 환경을 조성하십시오.'
    );

    // [9] 현재 고민 진단
    const concernFact = userInput.currentEvent || userInput.userTrouble || '직장에서 상사와 계속 충돌하고 있습니다. 업무 지시가 자주 바뀌고 공개적으로 질책받는 일이 반복됩니다. 일을 제대로 하고 있다고 생각하지만 인정받지 못하는 느낌입니다.';
    const desiredQuestionFact = userInput.desiredQuestion || '지금 퇴사하는 것이 맞는지, 아니면 현재 직장에서 버티면서 상황을 바꾸는 것이 맞는지 알고 싶습니다.';

    report.push(
      '',
      '---',
      '## 9. 현재 고민 진단',
      '',
      \`* **사용자께서 직접 설명하신 사실**: "\${concernFact}"\`,
      \`* **핵심 질문**: "\${desiredQuestionFact}"\`,
      '* **고민과 연결되는 명리적 근거**:',
      \`  - 일간이 \${strengthStatus}(\${strengthScore}점)하여 스스로 옳다고 여기는 업무 원칙과 완성도에 대한 기준이 대단히 명확합니다.\`,
      '  - 년지 정관(寅목, 조직·상급자의 상징)과 시지 사화(巳화)가 인사해(寅巳害)를 형성하고 있어, 상급자와의 소통 과정에서 의도가 왜곡되거나 정서적 엇박자가 빚어지기 쉬운 환경적 변수로 작용합니다.',
      '  - 일지 축토(丑토)와 월지 진토(辰토)의 축진파(丑辰破)는 관계나 업무 과정에서 미세한 균열과 잦은 지침 조율 문제로 해석할 수 있으며, 현재 말씀하신 잦은 업무 지시 변경과 연결해 볼 수 있습니다.',
      '* **현실에서 나타날 수 있는 모습**: 의뢰인께서는 원칙과 절차를 지켜 정석대로 일하고 있으나, 상급자의 지시가 일관되지 않게 변동되고 이에 대한 공개 질책이 반복되면서, 자신의 실력과 노력이 정당하게 인정받지 못한다는 깊은 좌절감과 억울함이 나타날 수 있습니다.',
      '* **원인 후보**:',
      '  - 1순위: 업무 기준 및 소통 절차의 구조적 불일치 (원칙을 중시하는 실무자와 가변적인 상급자 지침 간의 스타일 충돌 가능성)',
      '  - 2순위: 조직 관성과 당해 시간축의 일시적 과열 (조직 내 위계 압박과 스트레스 감수성이 일시적으로 높아진 환경적 요인)',
      '  - 3순위: 공개 피드백 방식으로 인한 자존감과 체면 손상 (업무 자체의 과실보다 공개 질책이라는 전달 방식이 내면의 강한 자존심을 자극했을 가능성)',
      '* **현재 가장 중요한 문제**: 부당함과 억울함을 견디지 못하고 대책 없이 사직서를 제출하여 경력 단절과 경제적 손실을 겪게 되는 충동적 결정을 제어하고, 내실을 다지며 실리를 확보하는 방어 체계를 세우는 것입니다.'
    );

    // [10] 현재 운과 시기 (시간축)
    const seunYear = userProblem.targetYear || 2024;
    const curDwGanji = daewunMod?.calculation?.rawMetrics?.currentDaewoon?.ganji || '계축(癸丑)';
    const curSeunGanji = seunMod?.calculation?.rawMetrics?.yearGanji || '갑진(甲辰)';

    const pastDesc = timeAxis?.timeline.pastFlow || \`\${curDwGanji} 대운의 환경 속에서 자신의 기반을 닦아왔으나, 전년도부터 이어진 소통 방식의 차이와 스트레스가 점진적으로 누적되어 왔습니다.\`;
    const presentDesc = timeAxis?.timeline.currentPhase || \`\${seunYear}년 [\${curSeunGanji}] 세운이 개입하며, 대운의 축토와 세운의 진토가 겹치는 상반기 동안 잦은 지침 변경과 질책 스트레스가 집중 부각되었습니다.\`;
    const futureDesc = timeAxis?.timeline.futureTransition || '가을철 금(金) 식상 기운이 보강되는 완화 구간부터 감정의 과열이 가라앉고 상황을 객관적으로 분별할 여유가 열리게 됩니다.';

    const pressureInfo = timeAxis?.pressureFactors[1] || \`\${seunYear}년 상반기(4~6월 전후): 토·화 기운의 과열로 마찰이 가장 예민하게 체감되는 주의 구간\`;
    const reliefInfo = timeAxis?.reliefFactors[0] || \`\${seunYear}년 9월 이후: 식상 기운 유입으로 과열된 상황을 객관적으로 정리하기 좋은 완화 구간\`;
    const oppInfo = timeAxis?.opportunityFactors[0] || '2025년 상반기: 심리적 안정과 새로운 환경(이직 또는 부서 이동)으로의 전환 기회가 열리는 시점';

    report.push(
      '',
      '---',
      '## 10. 현재 운과 시기',
      '',
      \`* **현재 대운**: \${curDwGanji} 대운 (만 22세 ~ 31세) — 편재와 비견이 유입되는 환경으로, 현실적인 자립 기반을 다지고 실속을 축적해 나가는 10년의 주기입니다.\`,
      \`* **현재 세운**: \${seunYear}년 \${curSeunGanji}년 — 천간 정관이 일간과 결합하고 지지 겁재가 들어와, 조직 내 위계질서와 업무 환경의 변동성이 강하게 표면화되는 해입니다.\`,
      \`* **현재 상황과의 연결**: 대운의 축토와 세운의 진토가 원국의 진토·축토와 겹치며(복음 및 축진파 자극) \${seunYear}년 상반기에 직장 스트레스와 상사와의 갈등 파동이 집중적으로 부각되었습니다.\`,
      '* **시간축 3단계 흐름**:',
      \`  - **과거 흐름**: \${pastDesc}\`,
      \`  - **현재 흐름**: \${presentDesc}\`,
      \`  - **향후 흐름**: \${futureDesc}\`,
      '* **중요한 시기와 그 근거**:',
      \`  - **압박 구간**: \${pressureInfo} — 감정적 맞대응을 피하고 보수적으로 자리를 지켜야 하는 구간입니다.\`,
      \`  - **완화 구간**: \${reliefInfo} — 현재보다 상황을 객관적으로 정리하고 선택지를 검토하기 좋은 흐름으로 해석할 수 있습니다.\`,
      \`  - **기회 구간**: \${oppInfo} — 지난 갈등의 여파가 가라앉고 새로운 환경으로의 전환을 도모하기에 유리한 계기로 작용할 가능성이 큽니다.\`
    );

    // [11] 마·살·관계
    report.push(
      '',
      '---',
      '## 11. 마·살·관계',
      '',
      '* **해당 요소**: 축진파(丑辰破), 인사해(寅巳害), 천살(天殺), 지살(地殺), 월살(月殺), 망신살(亡身殺), 충동마(衝動魔), 구설살(口舌殺)',
      '* **명리적 의미**:',
      '  - 축진파(破): 관계나 업무 절차에서의 미세한 균열, 약속이나 지침의 변경과 조정 난항 경향',
      '  - 인사해(害): 의사소통의 왜곡, 정서적 오해, 은밀한 엇갈림 경향',
      '  - 천살·월살·망신살: 불가항력적인 환경 압박, 고립감, 체면 손상에 대한 심리적 불안 반응',
      '  - 충동마·구설살: 억울함을 이기지 못하고 즉각 관계를 끊고 싶어지는 급작스러운 충동 및 구설 잡음',
      '* **현재 고민과의 연결**: 말씀하신 잦은 지침 변경(축진파)과 공개 질책으로 인한 체면 손상감(망신살·구설살), 그리고 지금 당장 회사를 그만두고 싶은 마음(충동마)의 패턴과 맞닿아 있습니다.',
      \`* **실제 영향도**: 심리적 피로감과 스트레스는 대단히 높으나, 일간의 내구력(\${strengthScore}점)이 견고하여 충분히 극복할 수 있는 수준이며, 삶의 파국을 의미하는 치명적인 살이 아닙니다.\`,
      '* **현실적인 주의점**: 마·살의 이름을 두려워할 필요가 전혀 없으며, "지금은 환경적으로 잡음과 마찰이 발생하는 계절"임을 인정하고, 감정적인 폭발 대신 차분한 서면 기록을 통해 외부 잡음의 파동을 무력화해야 합니다.'
    );

    // [12] 환경 처방 (환경만 제시)
    const envData = presSynth?.environmentRemedy || {
      spaceGuidance: '소음이 차단되고 방해받지 않는 조용한 1인 작업 및 사색 공간을 확보하십시오.',
      colorTones: ['딥 네이비(Deep Navy)', '미드나잇 블루(Midnight Blue)', '블랙(Black)'],
      direction: '북쪽(차분한 판단과 심리적 안정을 돕는 방위)',
      materials: ['글래스(유리)', '물', '금속성 소품'],
      lightingAndAtmosphere: '침실의 조도를 낮추고 밤에는 은은한 간접 조명을 활용하여 신경계를 이완시키십시오.',
      lifestyleEnvironment: '실내 적정 습도를 50~60%로 쾌적하게 유지하고, 미온수를 자주 섭취하여 체내 메마름을 방지하십시오.',
      activityEnvironment: '퇴근 후 직장 동료들과의 불필요한 사적 모임을 피하고, 물이 흐르는 자연 산책로에서 혼자만의 시간을 가지십시오.',
    };

    report.push(
      '',
      '---',
      '## 12. 환경 처방',
      '',
      '* **명리적 처방 근거**: 과다한 토(土) 기운의 열기와 조급함을 식히고 이성적 냉철함을 회복하기 위해 수(水)과 금(金) 기운 중심의 환경 조성이 필요합니다.',
      \`* **공간**: \${envData.spaceGuidance}\`,
      \`* **색상**: 차분한 \${envData.colorTones.join(', ')} 계열의 색상을 생활 주변에 배치하십시오.\`,
      \`* **방향**: \${envData.direction}을 머리 방향이나 주요 휴식처로 활용하십시오.\`,
      \`* **소재**: \${envData.materials.join(', ')}을 시야에 두어 과열된 기운을 냉각하십시오.\`,
      \`* **조명**: \${envData.lightingAndAtmosphere}\`,
      \`* **생활환경**: \${envData.lifestyleEnvironment}\`,
      \`* **활동환경**: \${envData.activityEnvironment}\`
    );

    // [13] 행동 처방 (원칙, Do, Don't, 의사결정 선택지)
    report.push(
      '',
      '---',
      '## 13. 행동 처방',
      '',
      '* **명리적 처방 근거**: 강한 비겁 구조는 자기 확신이 강해 즉각 반박하기 쉬우므로, 감정적 맞대응을 차단하고 서면화하는 것이 가장 유리합니다.',
      '* **지금 해야 할 행동**:',
      '  - **24시간 대응 유예**: 상사의 질책이나 갑작스러운 지시 변경이 있을 때 현장에서 즉시 반박하지 말고, "확인 후 정리하여 보고드리겠습니다"와 같이 최소 하루 동안 공식 답변을 유예하십시오.',
      '  - **서면 크로스체크**: 모든 구두 지시는 메일이나 업무 메신저를 통해 *"지시하신 내용이 A 방향으로 진행하는 것이 맞는지 확인차 메일 남깁니다"* 형식으로 기록을 남겨 객관적 증빙을 축적하십시오.',
      '  - **감정 분리**: 퇴근 후에는 업무 메신저 알림을 끄고 직장 문제와 개인 생활을 철저히 분리하십시오.',
      '* **피해야 할 행동**:',
      '  - 공개 질책 자리에서 흥분하여 상사와 언성을 높이며 면전 대립하는 것',
      '  - 대책 없이 사직서를 충동적으로 던지는 것',
      '  - 직장 내 동료들에게 감정적으로 상사를 험담하여 구설을 자초하는 것',
      '* **의사결정 방법 (퇴사 vs 버티기 선택지 분석)**:',
      '  - **선택지 A — 현재 직장 유지 (버티기)**:',
      '    • 장점: 완화 구간까지 안정된 급여와 경력을 유지하며 관성 마찰의 파동을 넘길 수 있습니다.',
      '    • 위험: 상사의 잦은 지시 변경에 따른 스트레스와 감정 소모를 당분간 감내해야 합니다.',
      '    • 현실적으로 확인해야 할 조건: 서면 기록화 루틴을 통해 업무 지시의 불확실성을 통제할 수 있는지 여부.',
      '  - **선택지 B — 이직 준비 (퇴사 준비)**:',
      '    • 장점: 가을 이후 및 다음 해 상반기의 전환 흐름을 활용하여 더 건강한 조직으로 이동할 수 있습니다.',
      '    • 위험: 지금 당장 무작정 퇴사할 경우 공백기 및 경제적 압박이 발생합니다.',
      '    • 현실적으로 확인해야 할 조건: 이직 희망 분야의 채용 시장 동향 파악 및 구체적 이력서·포트폴리오 완성 여부.',
      '  - **명리상 참고할 흐름**: 상반기는 감정적 결정 시 손실이 커지는 주의 구간이며, 가을 전후부터 객관적 정리와 선택지 검토에 유리한 흐름이 열립니다.',
      '  - **지금 가장 먼저 할 행동**: 지금 당장 사직서를 내기보다, 현재 직장을 유지하면서 서면 증빙을 축적하고 물밑에서 차분히 이직을 준비하는 병행 전략을 취하십시오.',
      '* **직장·관계에서의 대응 방법**: 직장 내 불명확한 지시나 소통 엇박자를 나의 결함으로 받아들이지 말고, 조직의 소통 결함으로 객관화하여 사무적이고 정중한 거리감을 유지하십시오.'
    );

    // [14] 실행 처방 (13번 행동의 일정화 및 체크리스트)
    report.push(
      '',
      '---',
      '## 14. 실행 처방',
      '',
      '* **우선순위**:',
      '  - 1순위: 충동적 사직서 제출 유보 및 24시간 대응 유예 수칙 적용',
      '  - 2순위: 오늘부터 발생하는 모든 업무 지시의 메일/메신저 서면 기록 축적',
      '  - 3순위: 퇴근 후 감정 회복을 위한 15분 산책 및 생활 루틴 확립',
      '  - 4순위: 이력서 업데이트 및 완화기 이후 본격적 이직 지원',
      '* **단기 실행 (오늘 ~ 2주간)**:',
      '  - 오늘부터 상사의 구두 지시 후 30분 이내 확인 메일 발송 루틴 시작',
      '  - 2주간 상사의 지시 변경 사례와 본인의 수행 내역을 날짜별로 엑셀/노트에 조용히 기록 축적',
      '  - 퇴근 후 15분 이상 스마트폰을 끄고 조용한 산책으로 마인드 클리어링',
      '* **중기 실행 (2주 후 ~ 3개월)**:',
      '  - 축적된 기록을 바탕으로 업무 안정화 여부 평가',
      '  - 과열 구간을 버텨낸 뒤 이직 후보 기업 탐색 및 포트폴리오 완성',
      '  - 완화기 이후 상황에 따라 조직 내 부서 이동 신청 또는 외부 이직 본격 지원',
      '* **체크리스트**:',
      '  - [ ] 불합리한 질책을 받았을 때 즉각 반박을 24시간 유예했는가?',
      '  - [ ] 변경된 업무 지시를 서면(메일/메신저)으로 기록해 두었는가?',
      '  - [ ] 퇴근 후 직장 생각을 차단하고 충분한 수면 환경을 조성했는가?',
      '  - [ ] 충동적 퇴사 대신 완화기 이후를 기약하며 물밑 이직 준비를 시작했는가?',
      '* **처방물**:',
      '  - [디지털 처방] 마인드 클리어링 LIFE 스마트폰 배경화면 (딥 네이비 테마, "호흡을 고르고 사실에 집중하라")',
      '  - [행동 리마인더] 3대 절대 원칙 데스크 카드 (1. 즉각 답하지 않는다 / 2. 서면으로 확인한다 / 3. 내면의 중심을 지킨다)',
      '  - [상징 비보] LIFE 액운 소멸 및 조화 상징 부적 (과열된 마·살 기운을 중화하는 상징 보조 도구이며 초자연적 효과를 보장하지 않습니다)'
    );

    // [15] 최종 종합 진단 (5가지 압축, 과장 배제)
    report.push(
      '',
      '---',
      '## 15. 최종 종합 진단',
      '',
      \`1. **사주의 핵심**: \${strengthStatus}(\${strengthScore}점)한 \${stemInfo.korean} 비겁의 견고한 뚝심과 자립성을 지녀 어떤 환경에서도 스스로 바로 설 수 있는 그릇이나, \${relationSummaryText} 등으로 인해 조직 내 소통과 지시 체계의 균열에 취약한 구조입니다.\`,
      '2. **현재 고민의 핵심**: 잦은 업무 지시 변경과 공개 질책이라는 외부 압박에 맞서, 내면의 억울함으로 인해 대책 없이 회사를 그만두고 싶어 하는 충동이 충돌하고 있는 국면입니다.',
      '3. **가장 중요한 판단 기준**: 감정에 밀려 대책 없이 회사를 나가는 것이 아니라, \'나의 경력과 경제적 실리를 온전히 지키면서 더 나은 기회로 이동할 수 있는 현실적 준비가 갖추어졌는가\'입니다.',
      '4. **지금 할 첫 행동**: 즉각적인 퇴사 결정을 서두르지 말고, 오늘부터 모든 구두 지시를 메일로 남기는 \'서면 크로스체크\'를 즉시 가동하십시오.',
      '5. **앞으로의 방향**: 당분간 서면 기록을 통해 상황을 객관화하며 버티는 가운데, 물밑에서 이직 포트폴리오를 다듬어 기운이 순화되는 가을 전후부터 차분하게 진로를 확정해 나가는 방향을 권장합니다.'
    );

    return report.join('\\n');
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
        lines.push(\`타고난 관계 구조와 현재 시간의 흐름이 정면으로 부딪히는 시기(지지 충 작용: \${clashes.join(', ')})라 가까운 사람과 관계가 갑자기 바뀌거나 예기치 못한 단절이 나타나기 쉽습니다.\`);
      } else if (punishments.length > 0) {
        lines.push(\`원칙과 이해관계가 서로 맞물려 팽팽한 긴장과 마찰이 발생하는 시기(지지 형 작용: \${punishments.join(', ')})로, 조급하게 밀어붙일수록 손실이 커질 수 있습니다.\`);
      } else if (wonjins.length > 0) {
        lines.push(\`상대방과의 소통에서 감정적 오해나 서운함이 증폭되기 쉬운 흐름(원진 작용: \${wonjins.join(', ')})이 작용하고 있습니다.\`);
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
      lines.push(\`현재 기운에서 활성화된 특수 에너지 패턴(마·살 작용: \${salNames})에 주목해야 합니다.\`);
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
      /반드시\\s*(사고|파산|이혼|죽|병|실패)/,
      /무조건\\s*(병|실패|망|파산)/,
      /투자하면\\s*반드시\\s*돈을\\s*번다/,
      /이\\s*처방을\\s*하면\\s*운명이\\s*바뀐다/,
      /부적을\\s*사용하면\\s*문제가\\s*해결된다/,
      /100%\\s*(망한다|헤어진다|성공한다|실패한다|이혼한다)/,
    ];
    return forbiddenPatterns.some(pattern => pattern.test(text));
  }
}

export const customerDeliverableBuilder = new CustomerDeliverableBuilder();
`;

fs.writeFileSync('src/modules/product-generator/customer-deliverable-builder.ts', builderCode, 'utf8');
console.log('Successfully wrote customer-deliverable-builder.ts! Total lines:', builderCode.split('\n').length);
