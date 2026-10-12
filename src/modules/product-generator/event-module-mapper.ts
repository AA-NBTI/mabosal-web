/**
 * src/modules/product-generator/event-module-mapper.ts
 * 
 * Phase 61: 사건-모듈 맵핑 엔진 (Event-Module Mapper)
 * 
 * 사용자가 겪고 있는 현실 사건과 개별 모듈에서 도출된
 * 명리학적 트리거(충·형·원진, 신살, 대운·세운, 십신 편중)를
 * 1:1로 정밀 연결하여 "왜 이 사건이 일어났는가"에 대한 인과 사슬을 생성한다.
 */

import { EventModuleMappingItem, EventModuleMappingResult, UserProblemInput } from './types.js';
import { ModularId, ModularOutput } from '../modular/types.js';
import { IntegratedAnalysisOutput } from '../modular/integrated-analyzer.js';

export class EventModuleMapper {
  /**
   * 사건과 실행된 모듈 결과들을 상호 매핑 (19개 모듈 전수 무손실 연결)
   */
  public mapEventToModules(
    userProblem: UserProblemInput,
    executedModules: Record<ModularId, ModularOutput>,
    integratedAnalysis?: IntegratedAnalysisOutput
  ): EventModuleMappingResult {
    const mappings: EventModuleMappingItem[] = [];

    // 1. RELATION 모듈 매핑 (정식 관계: 충·형·파·해·원진·합·천간합충·방합 13종 전수 무손실 검증)
    const relMod = executedModules['RELATION'];
    if (relMod && relMod.success) {
      const metrics = relMod.calculation.rawMetrics;
      const clashes: string[] = metrics?.clashes || [];
      const punishments: string[] = metrics?.punishments || [];
      const selfPunishments: string[] = metrics?.selfPunishments || [];
      const destructions: string[] = metrics?.destructions || [];
      const harms: string[] = metrics?.harms || [];
      const wonjins: string[] = metrics?.wonjins || [];
      const gwimuns: string[] = metrics?.gwimuns || [];
      const harmonies: string[] = metrics?.harmonies || [];
      const stemCombinations: string[] = metrics?.stemCombinations || [];
      const stemClashes: string[] = metrics?.stemClashes || [];
      const banghaps: string[] = metrics?.banghaps || [];

      // 13대 독립 관계 판정 반영 (해/원진/귀문/자형 절대 혼합 금지)
      const relationTriggers: string[] = [];
      if (stemCombinations.length > 0) relationTriggers.push(`천간합: ${stemCombinations.join(', ')}`);
      if (stemClashes.length > 0) relationTriggers.push(`천간충: ${stemClashes.join(', ')}`);
      if (banghaps.length > 0) relationTriggers.push(`방합: ${banghaps.join(', ')}`);
      if (clashes.length > 0) relationTriggers.push(`충: ${clashes.join(', ')}`);
      if (punishments.length > 0) relationTriggers.push(`형: ${punishments.join(', ')}`);
      if (selfPunishments.length > 0) relationTriggers.push(`자형: ${selfPunishments.join(', ')}`);
      if (destructions.length > 0) relationTriggers.push(`파: ${destructions.join(', ')}`);
      if (harms.length > 0) relationTriggers.push(`해: ${harms.join(', ')}`);
      if (wonjins.length > 0) relationTriggers.push(`원진: ${wonjins.join(', ')}`);
      if (gwimuns.length > 0) relationTriggers.push(`귀문관살: ${gwimuns.join(', ')}`);
      if (harmonies.length > 0) relationTriggers.push(`합: ${harmonies.join(', ')}`);

      let trigger = relationTriggers.length > 0 ? relationTriggers.join(' | ') : '지지 상호작용 내 안정적 조화 유지';
      let impact: 'CRITICAL' | 'MAJOR' | 'MODERATE' = clashes.length > 0 || punishments.length > 0 ? 'CRITICAL' : wonjins.length > 0 || harms.length > 0 || gwimuns.length > 0 ? 'MAJOR' : 'MODERATE';
      let explanation = `사용자가 겪은 사건("${userProblem.currentEvent}")과 맞물려 명리학적 상호작용 특성(${trigger})이 현실의 환경적 변동성을 자극했을 가능성에 주목할 수 있습니다. 단, 이것이 사건의 필연적 원인이라기보다는 변화에 대응해야 할 구조적 취약점을 의미합니다.`;

      mappings.push({
        moduleId: 'RELATION',
        myeongliTrigger: trigger,
        connectionToEvent: explanation,
        impactLevel: impact,
        rawMetrics: metrics,
        timeAxisContext: {
          relation: trigger,
          source: 'NATAL',
          year: userProblem.targetYear || 2026,
        },
      });
    }

    // 2. SINSAL 모듈 매핑 (신살 및 흉살 25종 전수 무손실 연결)
    const sinMod = executedModules['SINSAL'];
    if (sinMod && sinMod.success) {
      const challenging = sinMod.calculation.rawMetrics?.challenging || [];
      const auspicious = sinMod.calculation.rawMetrics?.auspicious || [];

      let trigger = challenging.length > 0
        ? `특수 신살 [${challenging.join(', ')}]의 긴장성 기류`
        : auspicious.length > 0
        ? `길신 [${auspicious.join(', ')}]의 조력 기운`
        : '안정적 신살 기운 형성';

      mappings.push({
        moduleId: 'SINSAL',
        myeongliTrigger: trigger,
        connectionToEvent: challenging.length > 0
          ? `돌발 변수나 심리적 긴장감을 자극할 수 있는 기운이 감지되므로, 조급한 결단을 경계하고 안전 중심의 대응이 유효한 시점입니다.`
          : `귀인과 길신의 완충 기운이 감돌아 위기 국면에서도 조력의 실마리를 찾을 수 있는 여지가 있습니다.`,
        impactLevel: challenging.length > 0 ? 'MAJOR' : 'MODERATE',
        rawMetrics: sinMod.calculation.rawMetrics,
      });
    }

    // 3. SEUN 모듈 매핑 (세운 및 시간축)
    const seunMod = executedModules['SEUN'];
    if (seunMod && seunMod.success) {
      const targetYear = seunMod.calculation.rawMetrics?.targetYear || seunMod.calculation.rawMetrics?.year || userProblem.targetYear || 2026;
      const pillar = seunMod.calculation.rawMetrics?.yearGanji || seunMod.calculation.rawMetrics?.pillar || '병오';

      mappings.push({
        moduleId: 'SEUN',
        myeongliTrigger: `${targetYear}년 [${pillar}] 세운의 에너지 흐름`,
        connectionToEvent: `세운의 기운이 활성화되는 시기와 맞물려 해당 사건의 체감 압박이 커진 것으로 해석할 수 있으며, 일시적인 과열기를 지나 차분히 냉각기를 가질 필요가 있습니다.`,
        impactLevel: 'CRITICAL',
        rawMetrics: seunMod.calculation.rawMetrics,
        timeAxisContext: {
          relation: '세운 상호작용',
          source: 'SEUN',
          year: targetYear,
          seun: pillar,
        },
      });
    }

    // 4. DAEWUN 모듈 매핑 (10년 대운 환경)
    const daewunMod = executedModules['DAEWUN'];
    if (daewunMod && daewunMod.success) {
      const curDw = daewunMod.calculation.rawMetrics?.currentDaewoon || daewunMod.calculation.rawMetrics?.currentDaeun;
      const ganzi = curDw?.ganji || (curDw ? `${curDw.stem}${curDw.branch}` : '대운');

      mappings.push({
        moduleId: 'DAEWUN',
        myeongliTrigger: `현재 [${ganzi}] 대운(10년 주기 환경 무대)의 기류 흐름`,
        connectionToEvent: `단순한 일회성 사건을 넘어 삶의 주기적 환경 변화 속에서 가치관과 생활 양식을 재정비하라는 신호로 이해하는 관점이 적합합니다.`,
        impactLevel: 'MAJOR',
        rawMetrics: daewunMod.calculation.rawMetrics,
        timeAxisContext: {
          relation: '대운 환경',
          source: 'DAEWUN',
          year: userProblem.targetYear || 2026,
          daewun: ganzi,
        },
      });
    }

    // 5. CORE 기초 명리 모듈 매핑
    const coreMod = executedModules['CORE_ORIGINAL'];
    if (coreMod && coreMod.success) {
      const dm = coreMod.data?.dayMaster;
      const oh = coreMod.data?.ohaeng;
      mappings.push({
        moduleId: 'CORE_ORIGINAL',
        myeongliTrigger: `일간 ${dm?.stem || '본원'}(${dm?.element || ''}) 중심 ${oh?.dominant || ''} 오행 주도 원국 구조`,
        connectionToEvent: `의뢰인의 본연적 기질과 기본 에너지 분포가 사건("${userProblem.currentEvent}")에 대응하는 기초적 행동 성향의 근간이 됩니다.`,
        impactLevel: 'MODERATE',
        rawMetrics: coreMod.calculation.rawMetrics,
      });
    }

    const tenMod = executedModules['TEN_GODS'];
    if (tenMod && tenMod.success) {
      mappings.push({
        moduleId: 'TEN_GODS',
        myeongliTrigger: `십신 구도: ${tenMod.judgment.verdict}`,
        connectionToEvent: `심리적 욕구와 사회적 인간관계의 패턴이 사건의 전개 방향에 구조적 영향을 미칩니다.`,
        impactLevel: 'MODERATE',
        rawMetrics: tenMod.calculation.rawMetrics,
      });
    }

    const geokMod = executedModules['GEOKGUK'];
    if (geokMod && geokMod.success) {
      mappings.push({
        moduleId: 'GEOKGUK',
        myeongliTrigger: `사회적 격국: ${geokMod.judgment.verdict}`,
        connectionToEvent: `사회적 무대에서의 본질적 지향점이 현재 사건 환경과 맞물려 정체성 및 진로 갈등을 촉발했을 수 있습니다.`,
        impactLevel: 'MODERATE',
        rawMetrics: geokMod.calculation.rawMetrics,
      });
    }

    const strMod = executedModules['STRENGTH'];
    if (strMod && strMod.success) {
      mappings.push({
        moduleId: 'STRENGTH',
        myeongliTrigger: `일간 강약: ${strMod.judgment.verdict}`,
        connectionToEvent: `현재 사건의 외부 스트레스를 감당할 내적 에너지 자생력의 척도를 제시합니다.`,
        impactLevel: 'MAJOR',
        rawMetrics: strMod.calculation.rawMetrics,
      });
    }

    const eokMod = executedModules['EOKBU'];
    if (eokMod && eokMod.success) {
      mappings.push({
        moduleId: 'EOKBU',
        myeongliTrigger: `억부 조율 기운: ${eokMod.judgment.verdict}`,
        connectionToEvent: `위기 극복을 위해 일상과 비즈니스에서 균형을 회복시켜 줄 조절 오행의 방향성을 나타냅니다.`,
        impactLevel: 'MODERATE',
        rawMetrics: eokMod.calculation.rawMetrics,
      });
    }

    const johuMod = executedModules['JOHU'];
    if (johuMod && johuMod.success) {
      mappings.push({
        moduleId: 'JOHU',
        myeongliTrigger: `조후 균형 상태: ${johuMod.judgment.verdict}`,
        connectionToEvent: `감정적 냉온(冷溫)의 편중이 사건을 대하는 심리적 여유와 인내심에 직접적 영향을 미칩니다.`,
        impactLevel: 'MODERATE',
        rawMetrics: johuMod.calculation.rawMetrics,
      });
    }

    // 6. TROUBLE 모듈 매핑 (MONEY, BUSINESS, JOB, LOVE 등 7종)
    const troubleKeys: ModularId[] = ['MONEY', 'BUSINESS', 'JOB', 'LOVE', 'MARRIAGE', 'RELATIONSHIP', 'HEALTH'];
    for (const key of troubleKeys) {
      const tMod = executedModules[key];
      if (tMod && tMod.success) {
        mappings.push({
          moduleId: key,
          myeongliTrigger: `${tMod.moduleName} 정밀 지표: ${tMod.judgment.verdict}`,
          connectionToEvent: `현실 고민인 "${userProblem.userTrouble}"과 관련하여, 해당 영역의 에너지 균형 상태를 점검하고 보수적으로 리스크를 관리할 지침을 제공합니다.`,
          impactLevel: 'CRITICAL',
          rawMetrics: tMod.calculation.rawMetrics,
        });
      }
    }

    // 7. MABOSAL 고유 모듈 매핑 (MAGA_DIAGNOSIS, PRESCRIPTION)
    const magaMod = executedModules['MAGA_DIAGNOSIS'];
    if (magaMod && magaMod.success) {
      mappings.push({
        moduleId: 'MAGA_DIAGNOSIS',
        myeongliTrigger: `마(魔) 진단 소견: ${magaMod.data?.punchline || magaMod.judgment.verdict}`,
        connectionToEvent: `사건을 왜곡하고 악화시키는 내면의 집착과 외부 장애의 근원적 실체를 식별합니다.`,
        impactLevel: 'CRITICAL',
        rawMetrics: magaMod.calculation.rawMetrics,
      });
    }

    const presMod = executedModules['PRESCRIPTION'];
    if (presMod && presMod.success) {
      mappings.push({
        moduleId: 'PRESCRIPTION',
        myeongliTrigger: `행동 처방 가이드: ${presMod.judgment.verdict}`,
        connectionToEvent: `사건 극복을 위해 즉시 실행해야 할 Do 목록과 절대 피해야 할 Don't 목록을 명확히 제시합니다.`,
        impactLevel: 'CRITICAL',
        rawMetrics: presMod.calculation.rawMetrics,
      });
    }

    // 종합 인과 사슬 합성: CRITICAL 및 MAJOR 수준의 명리학적 주요 상호작용 모듈을 모두 포괄
    // 특히 RELATION 모듈에 성립된 관계가 있으면 반드시 포함하여 고객이 명확히 확인할 수 있도록 보장
    const keyMappings = mappings.filter(m => 
      m.impactLevel === 'CRITICAL' || 
      (m.moduleId === 'RELATION' && m.myeongliTrigger !== '지지 상호작용 내 안정적 조화 유지') ||
      m.impactLevel === 'MAJOR'
    );
    const overallCausalSynthesis = `[사건-명리 분석 종합] 사용자의 사건 "${userProblem.currentEvent}"에 대해, 명리학적으로는 ` +
      (keyMappings.length > 0
        ? keyMappings.map(c => `[${c.moduleId}: ${c.myeongliTrigger}]`).join('과(와) ') + ' 등의 에너지 상호작용이 현실의 변동성을 자극했을 가능성에 주목할 수 있습니다. 단, 이는 사건을 결정짓는 절대적 원인이 아니며, 현재의 위기를 현명하게 관리하고 극복하기 위한 대응의 기준점으로 삼는 것이 바람직합니다.'
        : '다양한 환경적 요인이 누적된 전환기적 현상으로, 평정심을 유지하며 차분히 대응하는 전략이 요구됩니다.');

    return {
      coreEvent: userProblem.currentEvent,
      mappings,
      priorityMappings: keyMappings,
      overallCausalSynthesis,
      integratedAnalysis,
    };
  }
}
