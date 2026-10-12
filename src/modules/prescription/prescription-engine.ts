/**
 * src/modules/prescription/prescription-engine.ts
 * 
 * Phase 70: 마보살 처방 엔진 (Prescription Engine)
 * 
 * "명리 근거 → 문제 진단 → 보완/조절 필요 요소 → 환경 처방 + 행동 처방 + 처방물 후보 → 기대 목적"
 * 
 * 핵심 원칙:
 * 1. 명리 근거(basis[]) 없는 처방 생성 차단
 * 2. 용신/희신 및 원천 명리 결과 재계산 금지 (기존 모듈 결과 온전히 승계)
 * 3. 환경 처방과 행동 처방이 중심, 처방물은 상징적 보조 수단
 * 4. 5대 독립 점수 보존 (evidence, relevance, feasibility, priority, confidence)
 * 5. 비결정론 및 안전 가드 완벽 준수 (의료/금융/투자/법률 전문성 보장 배제)
 * 6. "지금 가장 먼저 바꿀 3가지" 중심의 고객 친화적 우선순위 출력
 */

import { FourPillars, FiveElement } from '../../core/types.js';
import {
  Prescription,
  PrescriptionCategory,
  PrescriptionCustomerResult,
  PrescriptionInput,
  PrescriptionResult,
  RemedyItem,
} from './types.js';
import { environmentPrescriptionGenerator } from './environment-prescription.js';
import { behaviorPrescriptionGenerator } from './behavior-prescription.js';
import { remedyItemGenerator } from './remedy-item-generator.js';
import { prescriptionPriorityEngine } from './prescription-priority.js';
import { prescriptionSafetyGuard } from './safety-guard.js';
import { MagaDiagnosisResultItem } from '../ma/maga-diagnosis-engine.js';

export class PrescriptionEngine {
  /**
   * 통합 분석, 마·살 진단, 사건 진단 결과를 받아 구체적이고 실행 가능한 맞춤 처방전 생성
   */
  public generatePrescription(input: PrescriptionInput): PrescriptionResult {
    // 1. 도메인 및 세부 유형 식별
    const domain: PrescriptionCategory =
      input.eventDiagnosis?.eventDomain ||
      (input.userEvent && 'targetDomain' in input.userEvent ? (input.userEvent.targetDomain as PrescriptionCategory) : undefined) ||
      'LIFE';

    const subType = input.eventDiagnosis?.eventSubType || '일반 문제';
    const concernText =
      input.eventDiagnosis?.userEvent.currentConcern ||
      input.userEvent?.currentConcern ||
      '현재 직면한 문제와 환경적 혼란';

    // 2. 명리 원천 분석 데이터 추출 (재계산 없음)
    const moduleResults = input.moduleResults || input.integratedAnalysis?.moduleResults || {};
    const eokbuMod = moduleResults['EOKBU'];
    const johuMod = moduleResults['JOHU'];
    const coreMod = moduleResults['CORE_ORIGINAL'];
    const relationMod = moduleResults['RELATION'];
    const sinsalMod = moduleResults['SINSAL'];
    const daewunMod = moduleResults['DAEWUN'];
    const seunMod = moduleResults['SEUN'];

    // 용신 / 희신 추출 (기존 결과 승계)
    const yongsinElement: FiveElement =
      (eokbuMod?.data?.yongsin?.element as FiveElement) ||
      (johuMod?.data?.johuElement as FiveElement) ||
      '수';
    const heesinElement: FiveElement =
      (eokbuMod?.data?.heesin?.element as FiveElement) || '금';

    // 충·형·파·해·원진 추출
    const clashes: string[] = relationMod?.data?.clashes || [];
    const punishments: string[] = relationMod?.data?.punishments || [];
    const harms: string[] = relationMod?.data?.harms || [];
    const wonjins: string[] = relationMod?.data?.wonjins || [];
    const allClashHarmRels = [...clashes, ...punishments, ...harms, ...wonjins];

    // 마·살 진단 결과 목록 추출
    let magaItems: MagaDiagnosisResultItem[] = [];
    if (input.magaDiagnosis) {
      if ('items' in input.magaDiagnosis && Array.isArray(input.magaDiagnosis.items)) {
        magaItems = input.magaDiagnosis.items;
      } else if (Array.isArray(input.magaDiagnosis)) {
        magaItems = input.magaDiagnosis;
      }
    }

    // 대운 / 세운 시간축 정보 추출
    const currentDaewunGanji = daewunMod?.data?.currentDaewun?.ganji || daewunMod?.data?.targetDaewun?.ganji || '갑인';
    const currentSeunGanji = seunMod?.data?.seun?.seunGanji || '갑진';

    // 3. 후보 처방 생성 파이프라인
    const candidatePrescriptions: Prescription[] = [];

    // [처방 1]: 오행 및 조후 보완 처방 (Eokbu & Johu)
    const pres1Basis = [
      `사주 억부(抑扶) 및 조후(調候) 분석: 보완 희망 오행 [${yongsinElement}(${this.getElementMeaning(yongsinElement)})]`,
      `오행 에너지 불균형 해소를 통한 심신 평정 유지`,
    ];
    const pres1Env = environmentPrescriptionGenerator.generateEnvironmentActions({
      targetElement: yongsinElement,
      category: domain,
      clashesOrHarms: allClashHarmRels,
    });
    const pres1Beh = behaviorPrescriptionGenerator.generateBehaviorActions({
      category: domain,
      subType,
      hasClashOrHarm: allClashHarmRels.length > 0,
    });
    const pres1Scores = prescriptionPriorityEngine.calculateScores({
      basisCount: pres1Basis.length,
      hasRootClashOrHarm: allClashHarmRels.length > 0,
      hasYongsinOrHeesin: true,
      hasMaga: false,
      isCurrentDomainDirectMatch: true,
      isSubEventDirectMatch: false,
      environmentCount: pres1Env.length,
      behaviorCount: pres1Beh.length,
      timeAxisOverlapped: false,
    });

    const pres1: Prescription = {
      prescriptionId: `PRES-EOKBU-${domain}`,
      category: domain,
      title: `[기운 보완] 부족한 ${yongsinElement}(${this.getElementMeaning(yongsinElement)}) 기운을 채우는 환경 및 루틴 정돈`,
      basis: pres1Basis,
      targetProblem: `${domain} 영역의 기운 불균형과 심리적 소진`,
      targetElement: yongsinElement,
      environmentActions: pres1Env,
      behaviorActions: pres1Beh,
      remedyItems: remedyItemGenerator.generateRemedyItems({
        prescriptionId: `PRES-EOKBU-${domain}`,
        category: domain,
        targetElement: yongsinElement,
        basis: pres1Basis,
        mainTheme: `${yongsinElement} 기운 보완`,
      }),
      expectedPurpose: `부족한 ${yongsinElement} 에너지를 보완하여 환경적 지지 기반을 다지고 일상 회복 탄력성을 강화합니다.`,
      priority: pres1Scores.priority,
      intensity: pres1Scores.intensity,
      confidence: pres1Scores.confidenceScore / 100,
      evidenceScore: pres1Scores.evidenceScore,
      relevanceScore: pres1Scores.relevanceScore,
      feasibilityScore: pres1Scores.feasibilityScore,
      priorityScore: pres1Scores.priorityScore,
      confidenceScore: pres1Scores.confidenceScore,
      timeAxisContext: {
        generalEnvironment: '사계절 일상 공간의 규칙적인 환기와 채광 정돈',
        daewunBehavior: `${currentDaewunGanji} 대운 기간 동안 ${yongsinElement} 중심의 생활 습관 유지`,
        seunCaution: `${currentSeunGanji} 세운의 급격한 변화에 휩쓸리지 않도록 기초 체력 유지`,
      },
      explanationStructured: {
        why: `원국의 억부와 조후 구조상 ${yongsinElement}의 기운을 보완할 때 내면의 결단력과 환경적 안정이 극대화됩니다.`,
        what: `생활 공간의 색상, 조명, 채광을 조율하고 즉흥적인 감정 폭발을 방지하는 감정 숙고 규칙을 적용합니다.`,
        how: `오전 핵심 시간대에 집중 활동을 배치하고, 책상 위 동선을 단순화하여 잡념을 차단하십시오.`,
        purpose: `심리적 안정감 회복 및 현재 문제에 대한 냉철한 객관성 확보`,
      },
      safetyFlags: [],
    };
    candidatePrescriptions.push(pres1);

    // [처방 2]: 충·형·파·해 및 시간축 역동성 완충 처방 (Relation & Time Axis)
    if (allClashHarmRels.length > 0 || input.eventDiagnosis?.timeAxisContext?.length) {
      const targetRel = allClashHarmRels[0] || '지지의 역동적 상호작용';
      const pres2Basis = [
        `명리 관계 충돌 구조: ${allClashHarmRels.join(', ') || '지지 충형'}`,
        `현재 ${currentDaewunGanji} 대운 및 ${currentSeunGanji} 세운의 교차 작용에 따른 돌발 변수 방어`,
      ];
      const pres2Env = [
        '소음과 시각적 자극이 차단된 독립된 1인 완충 공간(차분한 스탠드 조명)을 조성하십시오.',
        '중요 대화나 미팅 시 혼잡한 공개 장소를 피하고 정돈된 비공개 회의실을 활용하세요.',
      ];
      const pres2Beh = [
        '상대방과의 충돌이나 돌발 상황 발생 시 즉각 맞대응하지 말고 충분한 침묵과 냉각기를 유지하십시오.',
        '구두로 오간 모든 협의 사항은 당일 중 메일이나 메신저로 텍스트화하여 상호 확인을 거치십시오.',
        '감정이 격양된 상태에서 계약서 서명, 사직서 제출, 결별 선언 등 중대 의사결정을 절대 내리지 마세요.',
      ];
      const pres2Scores = prescriptionPriorityEngine.calculateScores({
        basisCount: pres2Basis.length,
        hasRootClashOrHarm: true,
        hasYongsinOrHeesin: false,
        hasMaga: false,
        isCurrentDomainDirectMatch: true,
        isSubEventDirectMatch: true,
        environmentCount: pres2Env.length,
        behaviorCount: pres2Beh.length,
        timeAxisOverlapped: true,
      });

      const pres2: Prescription = {
        prescriptionId: `PRES-RELATION-${domain}`,
        category: domain,
        title: `[충돌 완충] ${targetRel}의 돌발 파동을 흡수하는 감정 유예 및 서면화 행동 처방`,
        basis: pres2Basis,
        targetProblem: `${subType}로 인한 대립 격화 및 충동적 파국 방어`,
        targetRelation: targetRel,
        environmentActions: pres2Env,
        behaviorActions: pres2Beh,
        remedyItems: remedyItemGenerator.generateRemedyItems({
          prescriptionId: `PRES-RELATION-${domain}`,
          category: domain,
          targetElement: heesinElement,
          basis: pres2Basis,
          mainTheme: '충돌 완충 및 서면화',
        }),
        expectedPurpose: `돌발 충돌 시 충동적인 파국을 방지하고 법적·감정적 리스크를 선제적으로 차단합니다.`,
        priority: pres2Scores.priority,
        intensity: pres2Scores.intensity,
        confidence: pres2Scores.confidenceScore / 100,
        evidenceScore: pres2Scores.evidenceScore,
        relevanceScore: pres2Scores.relevanceScore,
        feasibilityScore: pres2Scores.feasibilityScore,
        priorityScore: pres2Scores.priorityScore,
        confidenceScore: pres2Scores.confidenceScore,
        timeAxisContext: {
          generalEnvironment: '정서적 자극을 줄여주는 차분한 서재 환경 조성',
          daewunBehavior: `${currentDaewunGanji} 대운 동안 계약 및 인간관계 문서화 철저`,
          seunCaution: `${currentSeunGanji} 세운의 충돌 파동이 큰 시기에는 정면 승부를 피하고 우회 전략 수립`,
          intensivePeriod: '합충 변화가 집중되는 절기 전후 2주간 집중 관리',
        },
        explanationStructured: {
          why: `${targetRel} 등의 충돌 구조가 활성화될 때는 사소한 오해가 급격한 분쟁으로 확대되기 쉽습니다.`,
          what: `소음과 감정 자극을 차단하는 환경을 구축하고, 중대한 의사결정의 실행을 유예하고 검토하는 행동을 취합니다.`,
          how: `중요 제안을 받았을 때 "내일까지 서류를 검토하고 답변드리겠습니다"라는 표준 대응 문구를 활용하십시오.`,
          purpose: `급격한 충돌 에너지 완화 및 돌이킬 수 없는 손실 사전 방지`,
        },
        safetyFlags: [],
      };
      candidatePrescriptions.push(pres2);
    }

    // [처방 3]: 마·살(Maga) 및 사건(Event) 직접 대응 처방
    const topMaga = magaItems.length > 0 ? magaItems[0] : undefined;
    const magaName = topMaga ? topMaga.magaName : '심리적 불안과 초조';
    const pres3Basis = [
      topMaga
        ? `사주 마·살(魔·煞) 정밀 진단: [${magaName}] 활성화`
        : `사주 명리 사건 진단 연계: [${subType}] 관련 취약 구조 및 오행 불균형`,
      `실제 사용자 사건: "${concernText}"의 현실적 극복 지침`,
    ];
    if (topMaga?.evidence?.length) {
      pres3Basis.push(...topMaga.evidence.slice(0, 2));
    }

    const pres3Env = environmentPrescriptionGenerator.generateEnvironmentActions({
      targetElement: yongsinElement,
      category: domain,
      clashesOrHarms: allClashHarmRels,
    });
    const pres3Beh = behaviorPrescriptionGenerator.generateBehaviorActions({
      category: domain,
      subType,
      hasClashOrHarm: allClashHarmRels.length > 0,
      hasRobWealthOrKill: true,
      currentEvent: concernText,
    });
    const pres3Scores = prescriptionPriorityEngine.calculateScores({
      basisCount: pres3Basis.length,
      hasRootClashOrHarm: allClashHarmRels.length > 0,
      hasYongsinOrHeesin: true,
      hasMaga: !!topMaga,
      isCurrentDomainDirectMatch: true,
      isSubEventDirectMatch: true,
      environmentCount: pres3Env.length,
      behaviorCount: pres3Beh.length,
      timeAxisOverlapped: !!(topMaga && allClashHarmRels.length > 0),
    });

    const pres3: Prescription = {
      prescriptionId: `PRES-MAGA-${domain}`,
      category: domain,
      title: `[사건 대응] ${magaName}을 제어하고 ${subType}을 극복하는 집중 관리 행동 처방`,
      basis: pres3Basis,
      targetProblem: concernText,
      targetMaga: magaName,
      targetElement: yongsinElement,
      environmentActions: pres3Env,
      behaviorActions: pres3Beh,
      remedyItems: remedyItemGenerator.generateRemedyItems({
        prescriptionId: `PRES-MAGA-${domain}`,
        category: domain,
        targetElement: yongsinElement,
        basis: pres3Basis,
        mainTheme: `${magaName} 제어 및 현실 방어`,
      }),
      expectedPurpose: `${concernText}로 인한 현실적 위기 요인을 최소화하고 단계적 정상화 경로를 확보합니다.`,
      priority: pres3Scores.priority,
      intensity: pres3Scores.intensity,
      confidence: pres3Scores.confidenceScore / 100,
      evidenceScore: pres3Scores.evidenceScore,
      relevanceScore: pres3Scores.relevanceScore,
      feasibilityScore: pres3Scores.feasibilityScore,
      priorityScore: pres3Scores.priorityScore,
      confidenceScore: pres3Scores.confidenceScore,
      timeAxisContext: {
        generalEnvironment: '과열된 자극을 배제하고 단정한 생활 환경 유지',
        daewunBehavior: '무리한 외연 확장보다 실속과 내부 방어 체계 구축',
        seunCaution: '단기 이익을 노린 투기적 판단이나 감정적 대립 절대 금지',
        intensivePeriod: '현재 직면한 분쟁이나 불안이 최고조에 달한 기간 동안 집중 준수',
      },
      explanationStructured: {
        why: `명리적으로 ${magaName}의 작용이 활성화되어 동일한 유형의 실수가 반복되기 쉬운 국면입니다.`,
        what: `자신을 보호할 수 있는 실질적인 계약 및 관계적 안전장치를 마련하고 일상의 규칙성을 복원합니다.`,
        how: `독단적인 결정을 피하고 전문가나 신뢰할 수 있는 제3자의 조언을 거치는 2중 확인 절차를 밟으십시오.`,
        purpose: `사건으로 인한 2차 피해 방지 및 장기적인 주도권 탈환`,
      },
      safetyFlags: [],
    };
    candidatePrescriptions.push(pres3);

    // [처방 4]: 도메인 특화 세부 생활 처방 (생활 습관 및 리스크 방어)
    const pres4Basis = [
      `사주 원국 명리 체질 및 십신(十神) 성향에 맞춘 ${domain} 라이프스타일 가이드`,
      `과열된 오행 기운의 이완 및 일상적 에너지 재생`,
    ];
    const pres4Env = [
      '침실과 업무 공간의 조도를 분리하여 밤에는 멜라토닌 분비와 완전한 수면을 보장하십시오.',
      '활동 반경에 자연을 접할 수 있는 산책로나 녹지 공간을 포함시켜 스트레스를 해소하세요.',
    ];
    const pres4Beh = [
      '매일 취침 전 30분간 전자기기를 끄고 따뜻한 차나 명상을 통해 마음의 중심을 잡으십시오.',
      '스스로를 자책하거나 타인을 원망하는 반추 사고를 멈추고, 오늘 내가 통제할 수 있는 일 3가지만 적고 실천하세요.',
    ];
    const pres4Scores = prescriptionPriorityEngine.calculateScores({
      basisCount: pres4Basis.length,
      hasRootClashOrHarm: false,
      hasYongsinOrHeesin: true,
      hasMaga: false,
      isCurrentDomainDirectMatch: true,
      isSubEventDirectMatch: false,
      environmentCount: pres4Env.length,
      behaviorCount: pres4Beh.length,
      timeAxisOverlapped: false,
    });

    const pres4: Prescription = {
      prescriptionId: `PRES-LIFE-${domain}`,
      category: domain,
      title: `[일상 회복] 심신 소진을 막고 내면의 회복력을 높이는 데일리 라이프 처방`,
      basis: pres4Basis,
      targetProblem: `지속적인 스트레스와 피로로 인한 판단력 저하`,
      environmentActions: pres4Env,
      behaviorActions: pres4Beh,
      remedyItems: remedyItemGenerator.generateRemedyItems({
        prescriptionId: `PRES-LIFE-${domain}`,
        category: domain,
        targetElement: yongsinElement,
        basis: pres4Basis,
        mainTheme: '일상 평정 회복',
      }),
      expectedPurpose: `신체 활력과 뇌 피로를 회복하여 다음 기회를 준비할 수 있는 내적 에너지를 축적합니다.`,
      priority: pres4Scores.priority,
      intensity: pres4Scores.intensity,
      confidence: pres4Scores.confidenceScore / 100,
      evidenceScore: pres4Scores.evidenceScore,
      relevanceScore: pres4Scores.relevanceScore,
      feasibilityScore: pres4Scores.feasibilityScore,
      priorityScore: pres4Scores.priorityScore,
      confidenceScore: pres4Scores.confidenceScore,
      timeAxisContext: {
        generalEnvironment: '청결하고 환기가 잘 되는 수면 공간 유지',
        daewunBehavior: '장기적 건강과 정신 건강을 1순위 자산으로 관리',
      },
      explanationStructured: {
        why: `원국의 에너지가 소모된 상태에서는 어떤 훌륭한 전략도 지속하기 어렵습니다.`,
        what: `완전한 수면 환경을 조성하고 감정 반추를 멈추는 데일리 루틴을 확립합니다.`,
        how: `취침 전 스마트폰을 머리맡에서 치우고, 하루 15분 이상 햇볕을 쬐며 산책하십시오.`,
        purpose: `일상의 통제감 회복 및 만성 피로 완화`,
      },
      safetyFlags: [],
    };
    candidatePrescriptions.push(pres4);

    // 4. 안전성 검증 및 금지 사항 필터링 (SafetyGuard)
    const validPrescriptions: Prescription[] = [];
    const safetyNotes: string[] = [];
    const collectedFlags = new Set<string>();

    for (const p of candidatePrescriptions) {
      const vResult = prescriptionSafetyGuard.validatePrescription(p);
      if (vResult.isValid) {
        p.safetyFlags = vResult.safetyFlags;
        vResult.safetyFlags.forEach(f => collectedFlags.add(f));
        validPrescriptions.push(p);
      } else {
        safetyNotes.push(`처방 [${p.title}] 배제: ${vResult.warnings.join(', ')}`);
      }
    }

    // 5. 정렬 및 중복 제거
    const sortedDeduplicated = prescriptionPriorityEngine.sortAndDeduplicate(validPrescriptions);

    // 6. 상위 3대 핵심 처방 선정 ("지금 가장 먼저 바꿀 것 3가지")
    const top3 = sortedDeduplicated.slice(0, 3);

    // 7. 고객용 결과 구조 생성 (Section 19)
    const envSummary: string[] = [];
    const behSummary: string[] = [];
    const remedySummary: RemedyItem[] = [];

    top3.forEach(p => {
      p.environmentActions.forEach(a => {
        if (!envSummary.includes(a)) envSummary.push(a);
      });
      p.behaviorActions.forEach(a => {
        if (!behSummary.includes(a)) behSummary.push(a);
      });
      p.remedyItems.forEach(r => {
        if (!remedySummary.some(existing => existing.type === r.type)) {
          remedySummary.push(r);
        }
      });
    });

    const whyThisHappened =
      top3.length > 0
        ? top3.map(p => `• [${p.title.split(']')[0].replace('[', '')}]: ${p.basis.join(' / ')}`).join('\n')
        : '명리적 기운의 급격한 편중과 환경적 자극의 중첩';

    const customerResult: PrescriptionCustomerResult = {
      currentProblem: concernText,
      whyThisHappened,
      coreDiagnosis: `현재 직면한 [${domain} - ${subType}] 문제는 개인의 역량 부족이 아니라, 사주 기운의 일시적 과열과 환경적 충돌이 맞물려 발생한 현상입니다.`,
      top3Prescriptions: top3,
      environmentSummary: envSummary.slice(0, 4),
      behaviorSummary: behSummary.slice(0, 4),
      remedyItemsSummary: remedySummary.slice(0, 3),
      expectedTransformation: `환경의 불필요한 자극을 줄이고 감정적인 대응을 유예하고 차분히 검토함으로써, 손실을 방어하고 맑은 이성으로 국면을 유리하게 전환시킬 수 있습니다.`,
      safetyNotice: prescriptionSafetyGuard.getDomainSafetyDisclaimer(domain),
    };

    // 8. 시간축 요약
    const timeAxisSummary = {
      general: top3.map(p => p.timeAxisContext?.generalEnvironment).filter(Boolean) as string[],
      daewun: top3.map(p => p.timeAxisContext?.daewunBehavior).filter(Boolean) as string[],
      seun: top3.map(p => p.timeAxisContext?.seunCaution).filter(Boolean) as string[],
      intensive: top3.map(p => p.timeAxisContext?.intensivePeriod).filter(Boolean) as string[],
    };

    return {
      resultId: `PRES-RES-${Date.now().toString(36)}`,
      domain,
      subType,
      totalPrescriptions: sortedDeduplicated.length,
      prescriptions: sortedDeduplicated,
      topPrescriptions: top3,
      customerResult,
      timeAxisSummary,
      safetyVerification: {
        isSafe: true,
        flags: Array.from(collectedFlags),
        notes: safetyNotes,
      },
    };
  }

  private getElementMeaning(elem: FiveElement): string {
    switch (elem) {
      case '목': return '성장과 유연성';
      case '화': return '열정과 명료한 직관';
      case '토': return '포용과 흔들림 없는 중심';
      case '금': return '결단과 명확한 분별력';
      case '수': return '지혜와 감정의 정화';
      default: return '조화와 균형';
    }
  }
}

export const prescriptionEngine = new PrescriptionEngine();
