/**
 * Phase 50 Post-Calibration: 마보살 4단계 상품 서비스 레이어 (Mabosal 4-Tier Service)
 * 
 * 1단계: FREE — "나는 어떤 사람인가?"
 * 2단계: STANDARD — "내 인생의 구조가 어떻게 움직이는가?"
 * 3단계: SAL — "왜 지금 일이 꼬이고 있는가?"
 * 4단계: PREMIUM — "그래서 지금 무엇을 해야 하는가?"
 * 
 * 내부 정밀 데이터(internalData: scores, ruleIds, evidence, breakdown)와
 * 고객 자연어 출력(customerReport)을 완전 분리하여 독립 서비스 계층으로 제공.
 * 
 * 독립성 보장:
 * - SAL 데이터가 없어도 FREE, STANDARD는 100% 정상 작동.
 * - PREMIUM은 SAL 데이터가 있으면 최대로 활용하고, 없는 경우에도 기본 사주 기반으로 정상 작동.
 */

import { customerPresentationTranslator, TranslationContext } from './customer-presentation-translator.js';
import { SajuDynamicAnalyzer } from './saju-dynamic-analyzer.js';

export type ServiceTierLevel = 'FREE' | 'STANDARD' | 'SAL' | 'PREMIUM';

export interface LayerOutput {
  tier: ServiceTierLevel;
  title: string;
  coreQuestion: string;
  internalData: {
    scores: any;
    ruleIds: string[];
    calculationEvidence: any;
    timeAxis: any;
    relations: any;
    maImpactSummary?: any;
    candidate_period?: any;
  };
  customerReport: string;
  wordCount: number;
}

export interface FourTierServiceResult {
  free: LayerOutput;
  standard: LayerOutput;
  sal: LayerOutput;
  premium: LayerOutput;
}

export class Mabosal4TierService {
  /**
   * 4개 독립 서비스 계층 전체 생성
   */
  public generateAllTiers(ctx: TranslationContext): FourTierServiceResult {
    const saju = SajuDynamicAnalyzer.analyze(ctx.fourPillarsText || '임신 계묘 경인 경진');
    const sal = ctx.salDiagnosis;

    // ----------------------------------------------------
    // 1. FREE (무료 사주)
    // ----------------------------------------------------
    const freeText = customerPresentationTranslator.translateFreeReport(ctx);
    const freeLayer: LayerOutput = {
      tier: 'FREE',
      title: '무료 사주 진단',
      coreQuestion: '나는 어떤 사람인가?',
      internalData: {
        scores: {
          dayMaster: saju.dayMaster.name,
          strength: saju.strength.status,
          dominantElement: saju.ohaeng.dominantKorean,
          lackingElement: saju.ohaeng.lackingKorean,
          distribution: saju.ohaeng.distribution,
        },
        ruleIds: ['RULE_FREE_SAJU_FOUNDATION', `RULE_DAYMASTER_${saju.dayMaster.element.toUpperCase()}`],
        calculationEvidence: {
          basis: '원국 4주 8자 및 기본 오행 분포',
          sajuDetails: saju.dayMaster,
        },
        timeAxis: {
          currentYear: 2026,
          daewoonGanji: ctx.daewoonInfo?.currentDaewoon?.ganji || '진행',
        },
        relations: [],
      },
      customerReport: freeText,
      wordCount: freeText.length,
    };

    // ----------------------------------------------------
    // 2. STANDARD (일반 정밀 사주)
    // ----------------------------------------------------
    const standardText = customerPresentationTranslator.translateStandardReport(ctx);
    const standardLayer: LayerOutput = {
      tier: 'STANDARD',
      title: '일반 정밀 사주풀이',
      coreQuestion: '내 인생의 구조가 어떻게 움직이는가?',
      internalData: {
        scores: {
          dayMaster: saju.dayMaster.name,
          geokguk: saju.geokguk.name,
          strength: saju.strength.status,
          yongshin: saju.yongshin.primary,
          daewoonPillar: ctx.daewoonInfo?.currentDaewoon?.ganji || '대운',
          sewoonPillar: '丙午',
          monthPillar: ctx.monthlySchedule?.[0]?.ganji || '丁酉',
        },
        ruleIds: [
          'RULE_STANDARD_SAJU_FULL',
          'RULE_GEOKGUK_ANALYSIS',
          'RULE_DAEWOON_ANALYSIS',
          'RULE_SEWOON_ANALYSIS',
        ],
        calculationEvidence: {
          daewoonResult: ctx.daewoonInfo,
          monthlySchedule: ctx.monthlySchedule,
          yongshinReason: saju.yongshin.reason,
        },
        timeAxis: {
          daewoonStart: ctx.daewoonInfo?.currentDaewoon?.startDateTime || '2022-01-01',
          daewoonEnd: ctx.daewoonInfo?.currentDaewoon?.endDateTime || '2031-12-31',
        },
        relations: saju.clashesAndHarmonies.clashes.concat(saju.clashesAndHarmonies.harmonies),
      },
      customerReport: standardText,
      wordCount: standardText.length,
    };

    // ----------------------------------------------------
    // 3. SAL (살·충·형·파·해 적용 사주)
    // ----------------------------------------------------
    let salText = '';
    let salLayer: LayerOutput;

    if (sal) {
      salText = customerPresentationTranslator.translateSalReport(ctx);
      salLayer = {
        tier: 'SAL',
        title: '살·충·형·파·해 정밀 진단',
        coreQuestion: '왜 지금 일이 꼬이고 있는가?',
        internalData: {
          scores: {
            natalSinsalsCount: sal.natalSinsals.length,
            activeSinsalsCount: sal.activeSinsals.length,
            riskSignalsCount: sal.riskSignals.length,
            supportSignalsCount: sal.supportSignals.length,
            changeSignalsCount: sal.changeSignals.length,
          },
          ruleIds: sal.allResults?.flatMap((s: any) => s.ruleIds) || ['RULE_SAL_DIAGNOSIS'],
          calculationEvidence: sal.allResults?.map((s: any) => ({
            sinsalId: s.sinsalId,
            name: s.name,
            evidence: s.calculationEvidence,
          })) || [],
          timeAxis: {
            daewoonActivation: sal.activeSinsals?.filter((s: any) => s.activationByDaeun).map((s: any) => s.name) || [],
            seunActivation: sal.activeSinsals?.filter((s: any) => s.activationBySeun).map((s: any) => s.name) || [],
            monthActivation: sal.activeSinsals?.filter((s: any) => s.activationByMonth).map((s: any) => s.name) || [],
          },
          relations: sal.relationInteractions || [],
          maImpactSummary: sal.maImpactSummary || {},
        },
        customerReport: salText,
        wordCount: salText.length,
      };
    } else {
      // SAL 모듈이 없는 독립 실행 환경 fallback
      salText = `${standardText}\n\n[살진단 모듈 미연동 상태: 일반 사주 합충 분석을 기반으로 대체 리포트 제공]`;
      salLayer = {
        tier: 'SAL',
        title: '살·충·형·파·해 기본 진단',
        coreQuestion: '왜 지금 일이 꼬이고 있는가?',
        internalData: {
          scores: { natalSinsalsCount: 0, activeSinsalsCount: 0 },
          ruleIds: ['RULE_SAL_FALLBACK'],
          calculationEvidence: { note: 'SAL 모듈 독립 분리 실행 모드' },
          timeAxis: {},
          relations: saju.clashesAndHarmonies.clashes,
        },
        customerReport: salText,
        wordCount: salText.length,
      };
    }

    // ----------------------------------------------------
    // 4. PREMIUM (마보살 프리미엄 종합 처방)
    // ----------------------------------------------------
    const premiumText = customerPresentationTranslator.translatePremiumReport(ctx);
    const premiumLayer: LayerOutput = {
      tier: 'PREMIUM',
      title: '마보살 프리미엄 종합 처방 솔루션',
      coreQuestion: '그래서 지금 무엇을 해야 하는가?',
      internalData: {
        scores: {
          relevanceScore: sal?.eventConnection?.relevanceScore || 70,
          actionCandidates: ctx.actionCandidates?.map(c => ({
            ganji: c.ganji,
            totalActionScore: c.totalActionScore,
            decision: c.decision,
            threshold: c.actionThreshold,
          })) || [],
        },
        ruleIds: [
          'RULE_PREMIUM_SOLUTION_SYNTHESIS',
          sal?.eventConnection?.candidate_period?.ruleId || 'RULE_EVENT_CANDIDATE_PERIOD_ONLY',
          ...(sal?.riskSignals?.map((r: any) => r.ruleId) || []),
          ...(sal?.supportSignals?.map((s: any) => s.ruleId) || []),
        ],
        calculationEvidence: {
          samhapCalculation: ctx.samhapCalculation,
          prescriptionAdvice: sal?.prescriptionAdvice || '기본 처방 가이드',
        },
        timeAxis: {
          candidate_period: sal?.eventConnection?.candidate_period,
          currentPacingMonth: '丁酉',
          recommendedFutureMonth: '己亥',
        },
        relations: sal?.relationInteractions || saju.clashesAndHarmonies.clashes,
        maImpactSummary: sal?.maImpactSummary,
        candidate_period: sal?.eventConnection?.candidate_period,
      },
      customerReport: premiumText,
      wordCount: premiumText.length,
    };

    return {
      free: freeLayer,
      standard: standardLayer,
      sal: salLayer,
      premium: premiumLayer,
    };
  }
}

export const mabosal4TierService = new Mabosal4TierService();
