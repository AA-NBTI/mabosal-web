/**
 * src/modules/product-generator/product-generator.ts
 * 
 * Phase 61: 마보살 상품 생성 레이어 총괄 엔진 (Product Generator)
 * 
 * "모듈은 고정하고, 상품은 조합한다."
 * 
 * 파이프라인:
 * 1. USER INPUT 수신
 * 2. EVENT / PROBLEM CLASSIFICATION (사건/문제 분류)
 * 3. MODULE SELECTION (설정 기반 또는 자동 추천 모듈 선택)
 * 4. MODULE EXECUTION (기존 Phase 60 모듈 레지스트리 비계산 실행)
 * 5. EVENT-MODULE MAPPING (사건-명리 인과 맵핑)
 * 6. INTERPRETATION DEPTH (LEVEL 1 ~ 5 깊이별 리포트 계층화)
 * 7. CASE / REAL-WORLD EXPLANATION (마보살 전용 8단계 사건 설명 프로토콜)
 * 8. PRESCRIPTION (행동 처방 및 Do/Don't 가드)
 * 9. PRODUCT OUTPUT (통합 리포트 패키징)
 * 10. PRICE (9대 요소 기반 동적 가격 확정)
 */

import {
  InsightDepthLevel,
  ProductConfig,
  ProductGenerationResult,
  ProductOutputSection,
  UserProblemInput,
} from './types.js';
import { EventProblemClassifier } from './problem-classifier.js';
import { EventModuleMapper } from './event-module-mapper.js';
import { CaseExplanationEngine } from './case-explanation-engine.js';
import { PricingEngine } from './pricing-engine.js';
import { moduleRegistry } from '../modular/module-registry.js';
import { ModularId, ModularInput, ModularOutput } from '../modular/types.js';
import { IntegratedAnalyzer, integratedAnalyzer } from '../modular/integrated-analyzer.js';
import { eventDiagnosisEngine } from '../event-diagnosis/index.js';
import { prescriptionEngine, prescriptionSafetyGuard } from '../prescription/index.js';
import { versionRegistry } from '../../core/version-registry.js';
import { customerDeliverableBuilder } from './customer-deliverable-builder.js';
import { classifyGeokguk } from '../../core/myeongli-rule-spec.js';
import { eventEvidenceAggregator } from '../event-synthesis/event-evidence-aggregator.js';
import { timeAxisJudgmentEngine } from '../time-axis/time-axis-judgment-engine.js';
import { prescriptionSynthesizer } from '../prescription/prescription-synthesizer.js';
import { outputValidator } from './output-validator.js';

export class ProductGenerator {
  private classifier = new EventProblemClassifier();
  private mapper = new EventModuleMapper();
  private caseEngine = new CaseExplanationEngine();
  private pricingEngine = new PricingEngine();
  private analyzer = integratedAnalyzer;
  private deliverableBuilder = customerDeliverableBuilder;

  /**
   * 사용자 사건/문제 입력과 ProductConfig를 수신하여 최종 상품을 생성
   */
  public generateProduct(
    userInput: UserProblemInput,
    customConfig?: Partial<ProductConfig>
  ): ProductGenerationResult {
    // ------------------------------------------------------------------------
    // 0. INPUT NORMALIZATION (평탄화 및 중첩 birthData 모두 지원 + Phase 77 추가 상황 결합)
    // ------------------------------------------------------------------------
    const rawCurrentEvent = userInput.currentEvent || (userInput as any).concern || userInput.userTrouble || '';
    const rawUserTrouble = userInput.userTrouble || (userInput as any).concern || userInput.currentEvent || '';

    const normalizedInput: UserProblemInput = {
      birthDate: userInput.birthDate || userInput.birthData?.birthDate || '',
      birthTime: userInput.birthTime !== undefined ? userInput.birthTime : (userInput.birthData?.birthTime ?? null),
      isUnknownTime: userInput.isUnknownTime ?? userInput.birthData?.isUnknownTime,
      gender: userInput.gender || userInput.birthData?.gender || 'male',
      currentEvent: rawCurrentEvent,
      userTrouble: rawUserTrouble,
      additionalContext: userInput.additionalContext,
      selectedSituation: userInput.selectedSituation,
      desiredQuestion: userInput.desiredQuestion,
      targetDomain: userInput.targetDomain,
      eventDate: userInput.eventDate,
      targetYear: userInput.targetYear || 2026,
      targetMonth: userInput.targetMonth || 10,
      characterId: userInput.characterId,
      characterProfile: userInput.characterProfile,
    };

    // ------------------------------------------------------------------------
    // 1. EVENT / PROBLEM CLASSIFICATION
    // ------------------------------------------------------------------------
    const classification = this.classifier.classify(normalizedInput);

    // ------------------------------------------------------------------------
    // 2. MODULE SELECTION
    // ------------------------------------------------------------------------
    const depth: InsightDepthLevel = customConfig?.insightDepth || 3;
    const isPrescriptionRequired = customConfig?.prescription ?? (depth >= 5);

    let selectedModules: ModularId[] =
      customConfig?.selectedModules && customConfig.selectedModules.length > 0
        ? [...customConfig.selectedModules]
        : [...classification.recommendedModules];

    if (isPrescriptionRequired && !selectedModules.includes('PRESCRIPTION')) {
      selectedModules.push('PRESCRIPTION');
    }

    // Config 조립
    const config: ProductConfig = {
      productId: customConfig?.productId || `PROD_DYN_${Date.now()}`,
      productName: customConfig?.productName || `[맞춤 솔루션] ${classification.primaryDomain} 위기 분석 및 처방`,
      targetProblem: normalizedInput.currentEvent,
      selectedModules,
      insightDepth: depth,
      caseExplanation: customConfig?.caseExplanation ?? (depth >= 3),
      personalizedMapping: customConfig?.personalizedMapping ?? (depth >= 3),
      timingAnalysis: customConfig?.timingAnalysis ?? (depth >= 4),
      responseGuidance: customConfig?.responseGuidance ?? (depth >= 4),
      prescription: customConfig?.prescription ?? (depth >= 5),
      characterId: customConfig?.characterId || normalizedInput.characterId,
      characterProfile: customConfig?.characterProfile || normalizedInput.characterProfile,
      price: customConfig?.price,
    };

    // ------------------------------------------------------------------------
    // 3. MODULE EXECUTION (기존 Phase 60 독립 모듈 비계산 호출)
    // ------------------------------------------------------------------------
    const modularInput: ModularInput = {
      birthDate: normalizedInput.birthDate!,
      birthTime: normalizedInput.birthTime,
      isUnknownTime: normalizedInput.isUnknownTime,
      gender: normalizedInput.gender!,
      targetYear: normalizedInput.targetYear || 2026,
      targetMonth: normalizedInput.targetMonth || 10,
      userTroubleText: [
        normalizedInput.currentEvent,
        normalizedInput.userTrouble,
        normalizedInput.selectedSituation,
        normalizedInput.additionalContext,
      ].filter(Boolean).join(' / '),
    };

    const executedModules = moduleRegistry.executeModules(selectedModules, modularInput);

    // ------------------------------------------------------------------------
    // 3.5. INTEGRATED ANALYSIS (모듈 비계산 취합 기반 교차 역학 분석)
    // ------------------------------------------------------------------------
    const pillars = executedModules['CORE_ORIGINAL']?.data?.pillars;

    // ------------------------------------------------------------------------
    // 3.5. INTEGRATED ANALYSIS (모듈 비계산 취합 기반 교차 역학 분석 - Version 1.1.0)
    // ------------------------------------------------------------------------
    const integratedAnalysis = this.analyzer.analyze(
      executedModules,
      normalizedInput,
      classification.primaryDomain,
      pillars
    );

    // ------------------------------------------------------------------------
    // 3.6. SYNTHESIS LAYERS (사건 증거 취합, 시간축 판단, 맞춤 처방 종합 - Phase 80)
    // ------------------------------------------------------------------------
    const evidenceResult = eventEvidenceAggregator.aggregate(
      normalizedInput,
      classification.primaryDomain,
      executedModules,
      pillars
    );

    const timeAxisJudgment = pillars
      ? timeAxisJudgmentEngine.judge(
          pillars,
          executedModules,
          normalizedInput,
          classification.primaryDomain
        )
      : undefined;

    const prescriptionSynthesis = (pillars && timeAxisJudgment)
      ? prescriptionSynthesizer.synthesize({
          pillars,
          userProblem: normalizedInput,
          domain: classification.primaryDomain,
          evidenceResult,
          timeAxis: timeAxisJudgment,
          executedModules,
        })
      : undefined;

    // ------------------------------------------------------------------------
    // 4. EVENT-MODULE MAPPING (LEVEL 3 이상 또는 설정 활성화 시)
    // ------------------------------------------------------------------------
    const eventMapping = config.personalizedMapping
      ? this.mapper.mapEventToModules(normalizedInput, executedModules, integratedAnalysis)
      : undefined;

    // ------------------------------------------------------------------------
    // 4.5. EVENT DIAGNOSIS (Phase 69 사건 진단 엔진 연계)
    // ------------------------------------------------------------------------
    let eventDiagnosis: any = undefined;
    if (config.personalizedMapping || depth >= 3) {
      try {
        eventDiagnosis = eventDiagnosisEngine.diagnoseEvent({
          userEvent: {
            birthData: {
              birthDate: normalizedInput.birthDate!,
              birthTime: normalizedInput.birthTime,
              gender: normalizedInput.gender!,
            },
            currentConcern: normalizedInput.currentEvent,
            eventDescription: normalizedInput.userTrouble || normalizedInput.currentEvent,
            desiredQuestion: normalizedInput.desiredQuestion,
            eventDate: normalizedInput.eventDate,
            targetDomain: classification.primaryDomain,
          },
          integratedAnalysis,
          executedModules,
        });
      } catch (e) {
        // Safe fallback
      }
    }

    // ------------------------------------------------------------------------
    // 5. CASE / REAL-WORLD EXPLANATION (설정 활성화 시 8단계 프로토콜)
    // ------------------------------------------------------------------------
    const caseProtocol = config.caseExplanation
      ? this.caseEngine.generateProtocol(classification.primaryDomain, normalizedInput, executedModules)
      : undefined;

    // ------------------------------------------------------------------------
    // 6. INTERPRETATION DEPTH에 따른 리포트 섹션 빌드
    // ------------------------------------------------------------------------
    const depthReport = this.buildDepthReport(depth, executedModules, eventMapping, caseProtocol, normalizedInput);

    // ------------------------------------------------------------------------
    // 7. PRESCRIPTION (LEVEL 4 이상 대응, LEVEL 5 맞춤 처방)
    // ------------------------------------------------------------------------
    let prescriptionReport: ProductGenerationResult['prescriptionReport'] = undefined;
    if (config.prescription || depth >= 3 || selectedModules.includes('PRESCRIPTION')) {
      const presMod = executedModules['PRESCRIPTION'];
      const presData = presMod?.data;

      // Phase 70 PrescriptionEngine 연동 (도메인 및 사건 진단과 완전 연결)
      let presResult = presData?.prescriptionResult;
      if (!presResult || presResult.domain !== classification.primaryDomain) {
        presResult = prescriptionEngine.generatePrescription({
          integratedAnalysis,
          eventDiagnosis,
          moduleResults: executedModules,
          pillars: executedModules['CORE_ORIGINAL']?.data?.pillars,
          userEvent: {
            currentConcern: normalizedInput.currentEvent,
            eventDescription: normalizedInput.userTrouble || normalizedInput.currentEvent,
            targetDomain: classification.primaryDomain,
          },
          targetYear: normalizedInput.targetYear,
        });
      }

      const domainSafety = prescriptionSafetyGuard.getDomainSafetyDisclaimer(classification.primaryDomain);

      // 도메인별 현실적 Don'ts 목록 구성 (도메인 간 처방 혼재 방지)
      let domainAvoidList: string[];
      if (classification.primaryDomain === 'HEALTH') {
        domainAvoidList = [
          '자의적 판단으로 의료진 진료를 미루거나 검증되지 않은 민간요법에 의존하는 일',
          '신체적 통증 신호를 무시하고 과도한 야근이나 무리한 운동을 강행하는 일',
          '조급함에 완치만을 요구하며 전문의 지시나 치료 일정을 임의 중단하는 일',
        ];
      } else if (classification.primaryDomain === 'MONEY') {
        domainAvoidList = [
          '손실을 단숨에 만회하려 고위험 대출이나 무리한 물타기 투자를 감행하는 일',
          '지인의 말이나 미확인 정보만 믿고 담보나 차용증 없이 투자 및 대여하는 일',
          '초조함을 달래기 위해 고정 지출을 늘리거나 단기 레버리지 상품에 몰입하는 일',
        ];
      } else if (classification.primaryDomain === 'BUSINESS') {
        domainAvoidList = [
          '구두 합의나 감정적 신뢰만으로 서면 계약서 작성 및 법적 실사를 생략하는 일',
          '상대방의 일방적 압박에 밀려 충분한 검토 없는 지분 양도나 연대보증에 서명하는 일',
          '조급한 사세 확장을 위해 무리한 고정비 증가나 감당하기 힘든 자금 압박을 자초하는 일',
        ];
      } else if (classification.primaryDomain === 'JOB') {
        domainAvoidList = [
          '감정이 격양된 상태에서 즉흥적으로 사직서를 제출하거나 면전에서 대립하는 일',
          '객관적 업무 성과 증빙 없이 감정적인 억울함만으로 인사 부서나 상부에 항의하는 일',
          '이직처가 확정되지 않은 상태에서 충동적으로 공백기를 자초하는 무리한 퇴사',
        ];
      } else if (classification.primaryDomain === 'LOVE') {
        domainAvoidList = [
          '조급함에 상대방에게 장문의 메시지를 반복해서 보내거나 거주지/직장으로 찾아가는 일',
          '지인이나 SNS를 통해 상대방의 동향을 캐묻고 불필요한 감정 자극을 유발하는 일',
          '자존심 때문에 진심을 숨기고 즉흥적인 단절이나 냉소적 태도로 대화를 파탄 내는 일',
        ];
      } else if (classification.primaryDomain === 'MARRIAGE') {
        domainAvoidList = [
          '부부 간의 갈등 상황에 양가 부모나 친척을 즉각 개입시켜 판을 키우는 일',
          '감정이 격양된 상태에서 섣부르게 이혼이나 파혼, 별거를 최후통첩으로 내세우는 일',
          '과거의 묵은 상처나 금전 문제를 현안과 결부시켜 비난의 범위를 무한정 확대하는 일',
        ];
      } else if (classification.primaryDomain === 'RELATIONSHIP') {
        domainAvoidList = [
          '사실관계가 확인되지 않은 소문이나 구설에 대해 즉각적인 감정적 해명이나 반박을 쏟아내는 일',
          '갈등 당사자를 배제하고 주변 인물들과 편을 가르며 사태를 진영 싸움으로 확대하는 일',
          '상대방의 공격적 태도에 맞서 동일한 수위의 인신공격이나 비방으로 맞대응하는 일',
        ];
      } else {
        domainAvoidList = [
          '불안감에 쫓겨 충분한 사전 검토 없이 중요한 진로를 즉흥적으로 변경하는 일',
          '주변의 성공 사례나 타인의 시선에 조급해져 본인의 페이스를 잃고 무리수를 두는 일',
          '한 번의 실패나 정체기에 좌절하여 기존의 일상 루틴과 건강 관리를 포기하는 일',
        ];
      }

      prescriptionReport = {
        mustDo: presResult?.customerResult?.behaviorSummary?.slice(0, 3) || presData?.doList || [
          '중요한 결정의 시기를 2~4주 뒤로 늦추고 침묵을 유지하십시오.',
          '자신의 일상 루틴과 객관적 기록(일기, 회계 장부, 실적 증빙)을 정돈하십시오.',
          '감정적 대응을 완전히 차단하고 신뢰할 수 있는 제3자의 조언을 구하십시오.',
        ],
        mustAvoid: domainAvoidList,
        timingRoadmap: presData?.timeline
          ? `[1단계 쿨링] ${presData.timeline.coolingPeriod} 침묵 및 보전 → [2단계 완화] ${presData.timeline.easingPeriod} 완충 및 소통 모색 → [3단계 재개] ${presData.timeline.actionPeriod || presData.timeline.recoveryPeriod || '회복 및 정상화'} 정상화 추진`
          : '향후 1~2개월간은 완전한 수축과 보전의 시기이며, 이후 점진적인 환경 완화기에 맞춰 재도약을 도모해야 합니다.',
        safeguardNotice: `${domainSafety} 본 처방은 명리학적 에너지 흐름에 기반한 행동 가이드이며, 의료 질환에 대한 치료, 법적 소송의 결과, 금융 투자의 원금 보장 등을 단정하지 않습니다. 고위험 사안은 반드시 해당 전문 면허 소지자의 공식 조력을 병행하십시오.`,
        environmentGuidance: depth >= 4 ? presResult?.customerResult?.environmentSummary : undefined,
        remedyItems: depth >= 5 ? presResult?.customerResult?.remedyItemsSummary : undefined,
        prescriptionResult: depth >= 5 ? presResult : undefined,
      };
    }

    // ------------------------------------------------------------------------
    // 8. DYNAMIC PRICING (9대 요소 기반 평가)
    // ------------------------------------------------------------------------
    const pricing = this.pricingEngine.evaluatePricing(config);
    config.price = pricing.calculatedPrice;

    // ------------------------------------------------------------------------
    // 8.5. CUSTOMER DELIVERABLE (Phase 73 10단계 권장 섹션 및 7대 고객 질문 직답 생성)
    // ------------------------------------------------------------------------
    const deliverableContext = {
      userInput: normalizedInput,
      domain: classification.primaryDomain,
      depth,
      executedModules,
      integratedAnalysis,
      eventDiagnosis,
      magaDiagnosis: executedModules['MAGA_DIAGNOSIS']?.data,
      eventMapping,
      caseProtocol,
      prescriptionReport,
      characterId: config.characterId,
      characterProfile: config.characterProfile,
      evidenceResult,
      timeAxisJudgment,
      prescriptionSynthesis,
    };

    const customerDeliverable = this.deliverableBuilder.buildDeliverable(deliverableContext);

    // ------------------------------------------------------------------------
    // 8.8. OUTPUT VALIDATION (Phase 82 고객 전달 결과물 최종 무결성 감사)
    // ------------------------------------------------------------------------
    const validationResult = outputValidator.validate(customerDeliverable, deliverableContext);
    if (!validationResult.isValid) {
      console.warn('[OutputValidator] Deliverable integrity violations detected:', validationResult.errors);
    }

    // ------------------------------------------------------------------------
    // 9. EXECUTION TRACE (Phase 72 버전 추적성 및 실행 재현성 스냅샷)
    // ------------------------------------------------------------------------
    const trace = versionRegistry.createExecutionTrace({
      input: normalizedInput,
      config,
      domain: classification.primaryDomain,
    });

    return {
      productId: config.productId,
      productName: config.productName,
      config,
      userProblem: normalizedInput,
      classification,
      executedModules,
      integratedAnalysis,
      eventMapping,
      caseProtocol,
      depthReport,
      magaDiagnosis: executedModules['MAGA_DIAGNOSIS']?.data,
      eventDiagnosis,
      prescriptionReport,
      pricing,
      trace,
      customerDeliverable,
      evidenceResult,
      timeAxisJudgment,
      prescriptionSynthesis,
      validationResult,
      generatedAt: new Date().toISOString(),
    };
  }

  // --------------------------------------------------------------------------
  // 결과 깊이별 섹션 및 통합 문서 빌더
  // --------------------------------------------------------------------------
  private buildDepthReport(
    depth: InsightDepthLevel,
    modules: Record<ModularId, ModularOutput>,
    mapping?: ProductGenerationResult['eventMapping'],
    protocol?: ProductGenerationResult['caseProtocol'],
    user?: UserProblemInput
  ): ProductGenerationResult['depthReport'] {
    const sections: ProductOutputSection[] = [];

    // [LEVEL 1 — INFORMATION] 명리적 정보 제공 (Phase 77: 고객 중심 5단계 재설계)
    const coreMod = modules['CORE_ORIGINAL'];
    const strengthMod = modules['STRENGTH'];
    const gyeokMod = modules['GEOKGUK'];
    const relMod = modules['RELATION'];
    const sinsalMod = modules['SINSAL'];
    const daewunMod = modules['DAEWUN'];
    const seunMod = modules['SEUN'];
    const magaMod = modules['MAGA_DIAGNOSIS'];

    let gyeokSummary = gyeokMod?.explanation?.summary;
    if (!gyeokSummary && coreMod?.data?.pillars) {
      const pillars = coreMod.data.pillars;
      const openStems = [pillars.year.stem, pillars.month.stem];
      if (pillars.hour) openStems.push(pillars.hour.stem);
      const canonical = classifyGeokguk(pillars.day.stem, pillars.month.branch, openStems);
      if (canonical?.name) {
        gyeokSummary = `사회적 활동 무대와 성취의 틀을 결정하는 격국은 [${canonical.name}]에 해당합니다.`;
      }
    }
    if (!gyeokSummary) {
      gyeokSummary = '원국 격국 형성';
    }

    const coreSummary = [
      `• [일간 본원과 오행]: 의뢰인은 ${coreMod?.data?.dayMaster?.stem || '본원'}(${coreMod?.data?.dayMaster?.element || '토'})의 기운을 타고났으며, 전체 기운 중 ${coreMod?.data?.fiveElements?.dominantElement || coreMod?.data?.dayMaster?.element || '토'}의 세력이 왕성합니다.`,
      `• [일간 환경 감당력]: ${strengthMod?.explanation?.summary || '일간 강약 균형'}`,
      `• [사회적 성취 틀]: ${gyeokSummary}`,
      `• [원국 기운 상호작용]: ${relMod?.explanation?.summary || '지지 조화'}`,
      sinsalMod?.explanation?.summary ? `• [신살 및 특수성]: ${sinsalMod.explanation.summary}` : '',
    ].filter(Boolean).join('\n');

    const attentionPoint = [
      `• [10년 주기 대운 흐름]: ${daewunMod?.explanation?.summary || '대운 환경'}`,
      `• [현재 연도 세운 동역학]: ${seunMod?.explanation?.summary || '세운 환경'}`,
      `• [시간축 작용점]: 현재 시간축은 환경적 자극과 내면의 책임감이 교차하는 시기로, 특정 영역에 대한 집중적인 주의가 요구됩니다. (단정적 미래 예측 배제)`,
    ].join('\n');

    const realWorldManifestation = [
      `• [현실 경험 양상]: 외부 상황의 변화나 대인 소통에서 사소한 이견이 확대되기 쉽고, 일시적인 정체나 스트레스를 체감하기 쉬운 흐름입니다.`,
      `• [마·살 조율]: ${magaMod?.explanation?.summary || '사주가 불길한 것이 아니라, 특정 시기에 기운이 엉키기 쉬우니 조급한 결정을 유보하라는 신호입니다.'}`,
    ].join('\n');

    const customerConnect = [
      `[💡 나의 현실 상황과 연결해보기]`,
      `위의 기운 흐름 중 현재 가장 깊게 마주하고 계신 현실 상황이나 고민을 남겨주시면, 사주 원국과 1:1로 결합된 정밀 인과를 도출합니다.`,
      `• 추천 상황: 거래처 대금 및 자금 경색 | 동업자·파트너 갈등 | 직장 내 소통 마찰 | 연애 및 결별 불안`,
      `• 직접 입력: 구체적인 상황과 질문을 추가하여 심층 분석으로 확장하세요.`,
    ].join('\n');

    const inDepthPreview = [
      `[🔍 심층 분석에서 확장되는 핵심 내용]`,
      `• 무료 분석: 기본 명리 구조(일간·격국·강약) | 시간축 흐름 | 현재 주목할 영역`,
      `• 심층 분석:`,
      `  1) 실제 사건과 명리의 1:1 인과 규명 (왜 지금 이런 일이 생겼는가)`,
      `  2) 정밀 시기 분석 (언제 가장 힘들고, 언제 풀리는가)`,
      `  3) 상황별 대응 수칙 (지금 피해야 할 일과 해야 할 일)`,
      `  4) 맞춤형 환경·행동 처방전 및 디지털 처방 카드`,
    ].join('\n');

    const moduleIndexRef = `[원천 분석 모듈 참조]: ${Object.values(modules).map(m => m.moduleName).join(', ')}`;

    const level1FullContent = [
      `### ① 한눈에 보는 핵심\n${coreSummary}`,
      `### ② 지금 주목할 부분\n${attentionPoint}`,
      `### ③ 현실에서 나타날 수 있는 모습\n${realWorldManifestation}`,
      `### ④ 고객 상황 연결 장치\n${customerConnect}`,
      `### ⑤ 더 깊게 보면 무엇을 알 수 있는가\n${inDepthPreview}`,
      moduleIndexRef,
    ].join('\n\n');

    sections.push({
      title: '1. 사주 핵심 기본 지표와 현실 흐름 (Information)',
      depthRequired: 1,
      content: level1FullContent,
    });

    // [LEVEL 2 — INTERPRETATION] 정보 + 의미 설명
    if (depth >= 2) {
      const interpretLines: string[] = [];
      if (modules['RELATION']) {
        interpretLines.push(`- 지지 상호작용의 의미: ${modules['RELATION'].judgment.verdict}. 이는 내면의 가치관과 외부 환경 간의 역동적 마찰을 시사합니다.`);
      }
      if (modules['SINSAL']) {
        interpretLines.push(`- 신살 배치의 의미: ${modules['SINSAL'].judgment.verdict}. 숨겨진 잠재력과 돌발 변수가 공존함을 의미합니다.`);
      }
      if (modules['DAEWUN'] || modules['SEUN']) {
        interpretLines.push(`- 시간축의 흐름: 현재 운의 기류는 환경의 급격한 전환을 요구하고 있습니다.`);
      }
      sections.push({
        title: '2. 명리학적 본질과 상호작용의 의미 (Interpretation)',
        depthRequired: 2,
        content: interpretLines.join('\n\n'),
      });
    }

    // [LEVEL 3 — CAUSE] 정보 + 의미 + 현재 사건과의 연결
    if (depth >= 3) {
      let causeText = mapping ? mapping.overallCausalSynthesis : '현재 사건과 명리 구조가 유기적으로 맞물려 있습니다.';
      if (protocol) {
        causeText += `\n\n[현실 사례 비교]:\n${protocol.similarRealWorldCase}\n\n[위험 착각 인지]:\n${protocol.riskAwareness}`;
      }
      sections.push({
        title: '3. 현실 사건과의 인과 연결 및 원인 규명 (Cause)',
        depthRequired: 3,
        content: causeText,
      });
    }

    // [LEVEL 4 — RESPONSE] 정보 + 의미 + 원인 + 시기 + 대응
    if (depth >= 4) {
      let responseText = protocol
        ? `[상황별 리스크 완화책]:\n${protocol.mitigation}\n\n[원리적 이해와 태도]:\n${protocol.understanding}`
        : '지금은 무리한 확장을 멈추고 현상을 보전하는 소극적 방어가 가장 효과적인 대응책입니다.';

      if (modules['SEUN']) {
        responseText += `\n\n[시기별 활성 타이밍]:\n2026년 세운의 절정기에는 감정적 분출이 극에 달하므로 2~3개월간 충동적 결단을 유보해야 합니다.`;
      }

      sections.push({
        title: '4. 시기별 위험 활성도 및 상황별 대응 지침 (Response)',
        depthRequired: 4,
        content: responseText,
      });
    }

    // [LEVEL 5 — PRESCRIPTION] 정보 + 의미 + 원인 + 시기 + 대응 + 개인 맞춤 처방
    if (depth >= 5) {
      let presText = protocol
        ? `[개인 맞춤 행동 처방]:\n${protocol.prescription}\n\n[심리적·환경적 안정화]:\n${protocol.stabilization}`
        : '자신의 루틴을 정비하고 감정싸움에 말려들지 않는 것이 가장 강력한 개운(開運) 처방입니다.';

      const presMod = modules['PRESCRIPTION'];
      const pResult = presMod?.data?.prescriptionResult;
      if (pResult?.customerResult) {
        const cRes = pResult.customerResult;
        if (cRes.environmentSummary?.length) {
          presText += `\n\n[공간 및 환경 개선 처방]:\n${cRes.environmentSummary.map((e: string) => `• ${e}`).join('\n')}`;
        }
        if (cRes.behaviorSummary?.length) {
          presText += `\n\n[행동 3대 실천 수칙]:\n${cRes.behaviorSummary.map((b: string) => `• ${b}`).join('\n')}`;
        }
        if (cRes.remedyItemsSummary?.length) {
          presText += `\n\n[상징적 보조 처방물 후보]:\n${cRes.remedyItemsSummary.map((r: any) => `• ${r.title}: ${r.purpose}`).join('\n')}`;
        }
      }

      sections.push({
        title: '5. 마보살 1:1 맞춤 행동 처방 및 최종 안정화 (Prescription)',
        depthRequired: 5,
        content: presText,
      });
    }

    const depthNames = [
      '',
      'LEVEL 1 — INFORMATION (정보 제공)',
      'LEVEL 2 — INTERPRETATION (의미 해석)',
      'LEVEL 3 — CAUSE (사건 인과 규명)',
      'LEVEL 4 — RESPONSE (시기 및 대응 지침)',
      'LEVEL 5 — PRESCRIPTION (맞춤 행동 처방)',
    ];

    const fullDocument = sections
      .map(s => `### ${s.title}\n${s.content}`)
      .join('\n\n---\n\n');

    return {
      level: depth,
      levelName: depthNames[depth] || `LEVEL ${depth}`,
      sections,
      fullDocument,
    };
  }
}
