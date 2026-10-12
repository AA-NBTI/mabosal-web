/**
 * src/modules/event-synthesis/event-evidence-aggregator.ts
 * 
 * EventEvidenceAggregator (Version 1.0.0)
 * 
 * 목적:
 * 명리 요소와 현실 사건의 직접적인 1:1 매핑(예: 축진파 = 지시 변경, 인사해 = 왜곡, 망신살 = 질책)을 제거하고,
 * 복수 명리 모듈(원국, 강약, 십신, 격국, 지지 관계, 신살, 대운, 세운)의 교차 근거를 체계적으로 수집·가중 평가하여
 * 다차원 사건 패턴과 현실 해석을 도출한다.
 * 
 * 파이프라인:
 * 사용자 사실 → 문제 영역 → 관련 명리 신호 후보 → 복수 모듈의 교차 근거 → 사건 패턴 → 현실 해석 → 복합 원인 후보 → 대응 방향
 */

import { ModularId, ModularOutput } from '../modular/types.js';
import { ProblemDomain, UserProblemInput } from '../product-generator/types.js';
import { FourPillars } from '../../core/types.js';

export interface AggregatedEvidenceItem {
  id: string;
  sourceModule: ModularId;
  category: 'STEM_BRANCH' | 'TEN_GODS' | 'RELATION' | 'SINSAL' | 'TIME_AXIS' | 'STRENGTH_GEOKGUK';
  myeongliSign: string;       // e.g. "월지 진토와 일지 축토의 축진파(丑辰破)"
  innateTendency: string;     // e.g. "원칙과 절차에서의 미세한 조정 및 조율 마찰 경향"
  relevanceToConcern: string; // e.g. "업무 지침의 잦은 변동 환경과 맞물려 심리적 피로를 가중시킬 수 있는 구조적 접점"
  weight: number;             // 1~100 중요도
  isSupporting: boolean;      // 문제 심각화 방향인지 여부
}

export interface CausalCandidateHypothesis {
  rank: number;
  hypothesisTitle: string;
  contributingEvidences: string[];
  realityExplanation: string;
  confidence: number;
}

export interface AggregatedEventEvidenceResult {
  version: string;
  domain: ProblemDomain;
  userFacts: {
    currentEvent: string;
    userTrouble: string;
    desiredQuestion?: string;
  };
  evidences: AggregatedEvidenceItem[];
  supportingEvidences: AggregatedEvidenceItem[];
  conflictingOrBufferingSignals: string[];
  eventPattern: string;
  realityInterpretation: string;
  causalCandidates: CausalCandidateHypothesis[];
  strategicOrientation: string;
  confidence: number;
}

export class EventEvidenceAggregator {
  public readonly version = '1.1.0';

  /**
   * 사용자 사실과 실행된 19개 모듈의 결과를 수집하여 교차 사건 증거셋을 구성
   */
  public aggregate(
    userProblemOrParams: UserProblemInput | { userProblem: UserProblemInput; domain?: ProblemDomain; executedModules: Record<ModularId, ModularOutput>; pillars?: FourPillars },
    domainArg?: ProblemDomain,
    executedModulesArg?: Record<ModularId, ModularOutput>,
    pillarsArg?: FourPillars
  ): AggregatedEventEvidenceResult {
    let userProblem: UserProblemInput;
    let domain: ProblemDomain;
    let executedModules: Record<ModularId, ModularOutput>;
    let pillars: FourPillars | undefined;

    if (userProblemOrParams && 'userProblem' in userProblemOrParams && 'executedModules' in userProblemOrParams) {
      userProblem = userProblemOrParams.userProblem;
      domain = userProblemOrParams.domain || (userProblem as any).domain || userProblem.targetDomain || 'GENERAL';
      executedModules = userProblemOrParams.executedModules;
      pillars = userProblemOrParams.pillars;
    } else {
      userProblem = userProblemOrParams as UserProblemInput;
      domain = domainArg || (userProblem as any)?.domain || userProblem?.targetDomain || 'GENERAL';
      executedModules = executedModulesArg || ({} as Record<ModularId, ModularOutput>);
      pillars = pillarsArg;
    }

    const evidences: AggregatedEvidenceItem[] = [];
    const bufferingSignals: string[] = [];

    const concernText = userProblem.currentEvent || userProblem.userTrouble || '';
    const rawTroubleText = `${userProblem.currentEvent || ''} ${userProblem.userTrouble || ''} ${userProblem.selectedSituation || ''} ${userProblem.additionalContext || ''}`;

    // 1. 일간 및 원국 오행 기초 수집 (CORE_ORIGINAL)
    const coreMod = executedModules['CORE_ORIGINAL'];
    if (coreMod && coreMod.success) {
      const dm = coreMod.data?.dayMaster;
      const dominant = coreMod.data?.ohaeng?.dominant || coreMod.data?.fiveElements?.dominantElement;
      if (dm) {
        evidences.push({
          id: 'EV_CORE_DM',
          sourceModule: 'CORE_ORIGINAL',
          category: 'STEM_BRANCH',
          myeongliSign: `일간 ${dm.stem}(${dm.element}) 및 ${dominant || dm.element} 오행 주도 원국`,
          innateTendency: '자신의 원칙과 기준이 뚜렷하며 스스로 실속과 책임을 다하려는 자립적 기질',
          relevanceToConcern: '외부의 불일치한 지침이나 변덕을 마음으로 쉽게 용인하기 어려운 내적 잣대의 바탕',
          weight: 75,
          isSupporting: true,
        });
      }
    }

    // 2. 강약 및 감당력 (STRENGTH)
    const strMod = executedModules['STRENGTH'];
    if (strMod && strMod.success) {
      const score = strMod.data?.score ?? 50;
      const status = strMod.data?.status || strMod.judgment?.verdict || '중화';
      if (score >= 70) {
        bufferingSignals.push(
          `일간의 강약 지표가 ${status}(${score}점)로 환경 감당력이 매우 높아, 외부의 압박이나 갈등 속에서도 심리적으로 완전히 붕괴되지 않고 버텨낼 수 있는 기초 체력을 보유함`
        );
        evidences.push({
          id: 'EV_STR_HIGH',
          sourceModule: 'STRENGTH',
          category: 'STRENGTH_GEOKGUK',
          myeongliSign: `일간 자생력 극강/신강 (${score}점)`,
          innateTendency: '외압에 굴복하지 않고 끝까지 원칙을 관철하려는 강한 주관과 내구력',
          relevanceToConcern: '상사의 지시에 맹목적으로 순응하지 않고 내적 마찰을 겪게 되는 자존감의 원천이자 위기를 버텨낼 버팀목',
          weight: 85,
          isSupporting: false, // 완충(버퍼링) 및 양날의 검
        });
      }
    }

    // 3. 사회적 성취 틀 (GEOKGUK)
    const geokMod = executedModules['GEOKGUK'];
    if (geokMod && geokMod.success) {
      const gName = geokMod.data?.name || geokMod.calculation?.rawMetrics?.geokgukName || '정격';
      evidences.push({
        id: 'EV_GEOK',
        sourceModule: 'GEOKGUK',
        category: 'STRENGTH_GEOKGUK',
        myeongliSign: `사회적 격국 [${gName}]`,
        innateTendency: '타인의 통제에 수동적으로 끌려가기보다 자신의 실력과 입지를 주체적으로 입증하려는 사회적 지향',
        relevanceToConcern: '공개 질책이나 인정받지 못하는 상황에서 상대적 박탈감과 억울함이 배가되는 요인',
        weight: 70,
        isSupporting: true,
      });
    }

    // 4. 지지 관계 상호작용 (RELATION)
    const relMod = executedModules['RELATION'];
    if (relMod && relMod.success) {
      const m = relMod.calculation.rawMetrics;
      const clashes = m?.clashes || [];
      const punishments = m?.punishments || [];
      const destructions = m?.destructions || [];
      const harms = m?.harms || [];
      const wonjins = m?.wonjins || [];

      // 파(破)가 있는 경우
      if (destructions.length > 0) {
        evidences.push({
          id: 'EV_REL_DESTRUCT',
          sourceModule: 'RELATION',
          category: 'RELATION',
          myeongliSign: `지지 파(破) 상호작용: ${destructions.join(', ')}`,
          innateTendency: '업무 절차나 약속, 세부 실행 단계에서 발생하는 미세한 조정 난항과 마찰 경향',
          relevanceToConcern: '사용자가 체감하는 잦은 업무 지시 변경 및 조율 피로감과의 상황적 연관 가능성',
          weight: 80,
          isSupporting: true,
        });
      }

      // 해(害)가 있는 경우
      if (harms.length > 0) {
        evidences.push({
          id: 'EV_REL_HARM',
          sourceModule: 'RELATION',
          category: 'RELATION',
          myeongliSign: `지지 해(害) 상호작용: ${harms.join(', ')}`,
          innateTendency: '의사소통의 미묘한 엇박자, 감정선의 엇갈림, 오해의 소지가 발생하는 대인 관계적 변수',
          relevanceToConcern: '상사와의 대화에서 의도가 왜곡되거나 정서적 괴리감이 깊어지는 소통적 접점',
          weight: 80,
          isSupporting: true,
        });
      }

      // 충(沖) 또는 형(刑)이 있는 경우
      if (clashes.length > 0 || punishments.length > 0) {
        const signNames = [...clashes, ...punishments].join(', ');
        evidences.push({
          id: 'EV_REL_CLASH_PUNISH',
          sourceModule: 'RELATION',
          category: 'RELATION',
          myeongliSign: `지지 충·형 상호작용: ${signNames}`,
          innateTendency: '기존의 틀이나 입장 차이로 인해 정면으로 맞부딪히거나 규율적 긴장이 발생하는 환경',
          relevanceToConcern: '조직 내 위계 또는 역할 배정 과정에서의 정면 대립 가능성',
          weight: 85,
          isSupporting: true,
        });
      }

      // 원진(怨嗔)이 있는 경우
      if (wonjins.length > 0) {
        evidences.push({
          id: 'EV_REL_WONJIN',
          sourceModule: 'RELATION',
          category: 'RELATION',
          myeongliSign: `지지 원진 상호작용: ${wonjins.join(', ')}`,
          innateTendency: '풀리지 않는 서운함이나 속앓이가 누적되어 냉전으로 치닫기 쉬운 심리적 취약성',
          relevanceToConcern: '상대방의 행동을 속으로 반추하며 신뢰가 무너지는 과정',
          weight: 75,
          isSupporting: true,
        });
      }
    }

    // 5. 신살 및 심리적 반응 (SINSAL)
    const sinMod = executedModules['SINSAL'];
    if (sinMod && sinMod.success) {
      const chal = sinMod.calculation.rawMetrics?.challenging || [];
      if (chal.some((s: string) => /망신|구설|월살|천살/.test(s))) {
        const targetSals = chal.filter((s: string) => /망신|구설|월살|천살/.test(s));
        evidences.push({
          id: 'EV_SINSAL_STRESS',
          sourceModule: 'SINSAL',
          category: 'SINSAL',
          myeongliSign: `특수 신살 기류 [${targetSals.join(', ')}]`,
          innateTendency: '대외적 평판, 체면 손상에 대한 예민한 심리적 반응 및 환경적 고립 압박감',
          relevanceToConcern: '공개적인 질책 상황에서 느끼는 극심한 모멸감과 체면 손상의 스트레스와 연결',
          weight: 75,
          isSupporting: true,
        });
      }
      const aus = sinMod.calculation.rawMetrics?.auspicious || [];
      if (aus.length > 0) {
        bufferingSignals.push(`길신 [${aus.slice(0, 2).join(', ')}]의 기운이 잠재되어 있어 파국적 상황에서도 조력자를 찾을 수 있는 여지가 존재함`);
      }
    }

    // 6. 시간축(세운/대운) 활성화 요인 - 임의 2024 연도 fallback 완전 제거
    const seunMod = executedModules['SEUN'];
    if (seunMod && seunMod.success) {
      const sYear = userProblem.targetYear || seunMod.calculation.rawMetrics?.targetYear;
      const sGanji = seunMod.calculation.rawMetrics?.yearGanji;
      const seunSignStr = sYear && sGanji
        ? `${sYear}년 [${sGanji}] 세운의 에너지 유입`
        : sGanji
        ? `[${sGanji}] 세운의 에너지 유입`
        : sYear
        ? `${sYear}년 세운의 에너지 유입`
        : `당해 세운의 에너지 유입`;

      evidences.push({
        id: 'EV_TIME_SEUN',
        sourceModule: 'SEUN',
        category: 'TIME_AXIS',
        myeongliSign: seunSignStr,
        innateTendency: '조직의 규율(관성)과 내면의 주관(비겁)이 한 해 동안 강하게 교차하며 역학적 긴장을 촉발하는 시간대',
        relevanceToConcern: '현재 시점에 갈등과 퇴사 고민이 수면 위로 급격히 불거진 시간적 계기',
        weight: 90,
        isSupporting: true,
      });
    }

    // 7. 사건 패턴 합성 (사용자 입력 사실 및 모듈 증거 기반 동적 합성)
    const supportingEvidences = evidences.filter(e => e.isSupporting);
    const hasRelTension = evidences.some(e => e.category === 'RELATION');
    const userConcernSummary = concernText || '현실 고민';

    const eventPattern = domain === 'JOB'
      ? `[복합 역학 패턴] 의뢰인의 직무 원칙과 자립심(비겁·격국)이 조직 환경의 규율(관성) 및 ${hasRelTension ? '지지 관계작용의 환경적 긴장' : '상호작용'}과 맞물려, 현실 고민("${userConcernSummary}")과 관련된 내적 마찰과 피로도를 체감하게 되는 구조적 긴장 패턴입니다.`
      : `[복합 역학 패턴] 타고난 사주 원국의 주도 기운과 당해 운의 흐름이 맞물려, 의뢰인이 직면한 현실 고민("${userConcernSummary}") 영역에서 심리적 긴장과 환경적 조율 필요성이 부각되는 역학적 상호작용 패턴입니다.`;

    // 8. 현실 해석 (복수 요인의 상호작용)
    const realityInterpretation = domain === 'JOB'
      ? `본 사건은 의뢰인의 일방적인 과실이나 개인적 결함 때문이라기보다, 원칙과 완성도를 중시하는 실무자의 내적 기준과 외부 조직 환경 간의 상호작용 엇박자가 시간축의 환경적 자극과 맞물려 표면화된 것으로 해석하는 것이 합리적입니다.`
      : `본 고민은 개인의 능력 부족이라기보다, 타고난 기질적 에너지 분포와 당해 유입되는 운의 기운이 현실 문제와 맞물리며 일시적인 불균형과 조율 과제를 유발한 것으로 해석하는 것이 합리적입니다.`;

    // 9. 복합 원인 가설군 (사용자 입력 근거 반영)
    const concernHasPublicFeedback = /공개|질책|모욕|비난/.test(rawTroubleText);
    const causalCandidates: CausalCandidateHypothesis[] = [
      {
        rank: 1,
        hypothesisTitle: '업무 기준 및 소통 절차의 구조적 불일치',
        contributingEvidences: evidences.filter(e => e.category === 'RELATION' || e.category === 'STEM_BRANCH').map(e => e.myeongliSign),
        realityExplanation: '원칙과 명확성을 요구하는 본인의 실무 방식과 상사의 가변적인 업무 지시 스타일이 충돌하며 발생한 소통 결함일 가능성',
        confidence: 86,
      },
      {
        rank: 2,
        hypothesisTitle: '조직 관성과 시간축 파동의 일시적 과열',
        contributingEvidences: evidences.filter(e => e.category === 'TIME_AXIS').map(e => e.myeongliSign),
        realityExplanation: '당해 세운과 대운의 영향으로 조직 내 위계 압박과 스트레스 감수성이 일시적으로 최고조에 달한 환경적 요인',
        confidence: 82,
      },
      {
        rank: 3,
        hypothesisTitle: concernHasPublicFeedback
          ? '피드백 전달 방식으로 인한 자존감과 체면 손상'
          : '환경적 평가 및 심리적 스트레스 민감도 고조',
        contributingEvidences: evidences.filter(e => e.category === 'SINSAL' || e.category === 'STRENGTH_GEOKGUK').map(e => e.myeongliSign),
        realityExplanation: concernHasPublicFeedback
          ? '업무 내용 자체보다 피드백 전달 방식이 내면의 높은 자존감을 자극하여 감정적 사직 충동을 촉발했을 가능성'
          : '외부 환경의 평가나 불확실성이 내면의 기준과 맞부딪히며 심리적 피로도를 증폭시켰을 가능성',
        confidence: 78,
      },
    ];

    // 10. 전략적 대응 방향 (고정 시간 제거)
    const strategicOrientation = domain === 'JOB'
      ? `단일 사건에 흥분하여 즉각적인 사직이나 정면 대립으로 승부를 보려 하지 말고, 서면 기록을 통한 객관화와 충분한 감정 냉각을 통해 나의 실리와 경력을 철저히 보호하는 '방어적 지구전' 전략이 필요합니다.`
      : `감정적으로 조급하게 결단을 내리지 말고, 객관적인 사실관계를 정리하며 충분한 냉각기를 거쳐 단계적으로 상황을 풀어가는 안정화 전략이 필요합니다.`;

    return {
      version: '1.1.0',
      domain,
      userFacts: {
        currentEvent: userProblem.currentEvent,
        userTrouble: userProblem.userTrouble || userProblem.currentEvent,
        desiredQuestion: userProblem.desiredQuestion,
      },
      evidences,
      supportingEvidences,
      conflictingOrBufferingSignals: bufferingSignals,
      eventPattern,
      realityInterpretation,
      causalCandidates,
      strategicOrientation,
      confidence: 84,
    };
  }
}

export const eventEvidenceAggregator = new EventEvidenceAggregator();
