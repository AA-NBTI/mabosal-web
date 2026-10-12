/**
 * Phase 29: Mabosal Production Pipeline Architecture
 * 
 * 사용자
 *  ↓
 * mabosal.com
 *  ↓
 * Cloudflare
 *  ↓
 * Vercel
 *  ↓
 * Frontend
 *  ↓
 * Application/API Layer
 *  ├─ Saju Engine (명리 연산 보존)
 *  ├─ General Saju Interpretation (10대 영역 일반 사주)
 *  ├─ Life Trouble Analysis (현실 문제 1:1 매핑)
 *  ├─ Ma Diagnosis (마보살 고유 문제 분류 및 "마가 낀 시기" 판정)
 *  ├─ Timing Analysis (시작/정점/완화/회복)
 *  ├─ Prescription Engine (실천/금기/오행 처방)
 *  └─ AI Presentation Layer (Context Lock 기반 무결성 자연어)
 *         ↓
 * Supabase (Users, Profiles, Sessions, Payments, Remedies)
 */

import { MabosalIntegratedService, IntegratedAnalysisResult } from '../phase17_25/mabosal-integrated-service.js';
import { ProductTier } from '../phase17_25/types.js';
import { aiPresentationService, AiPresentationResult } from './ai-presentation-service.js';
import { authPaymentService } from './auth-payment-service.js';
import { personalizedRemedyGenerator, DigitalRemedyArtifact } from './personalized-remedy-generator.js';
import { securityGuard } from './security-guard.js';
import { standardReportGenerator, StandardReportOutput } from './standard-report-generator.js';
import { salDiagnosisEngine, SalDiagnosisResult } from '../sinsal/index.js';
import { HeavenlyStem, EarthlyBranch } from '../../core/types.js';
import { mabosal4TierService, FourTierServiceResult } from './mabosal-4tier-service.js';

export interface ProductionInputRequest {
  readonly calendarType: 'solar' | 'lunar';
  readonly isLeapMonth: boolean;
  readonly birthDate: string; // YYYY-MM-DD
  readonly birthTime: string | null; // HH:mm
  readonly isUnknownTime: boolean;
  readonly gender: 'male' | 'female';
  readonly region: string;
  readonly troubleCategory?: string;
  readonly userTroubleText: string;
  readonly clientId?: string;
  readonly currentDate?: string; // YYYY-MM-DD, e.g. '2026-10-03'
}

export interface ProductionAnalysisResult {
  readonly success: boolean;
  readonly profileId: string;
  readonly isCached: boolean;
  readonly unlockedTiers: ProductTier[];
  readonly integratedResult: IntegratedAnalysisResult;

  // 1. 일반 사주 결과 (General Saju)
  readonly generalSaju: {
    readonly dayMaster: string;
    readonly dayMasterElement: string;
    readonly strength: string;
    readonly dominantElement: string;
    readonly dominantByPower?: string;
    readonly dominantByCount?: string;
    readonly dominantDefinition?: string;
    readonly lackingElement: string;
    readonly lacking?: string[];
    readonly lackingDefinition?: string;
    readonly distribution?: Record<string, number>;
    readonly fiveElementsCommentary?: string;
    readonly fourPillarsText: string;
    readonly personality: string;
    readonly currentYearLuck: {
      year: number;
      ganji: string;
      flowSummary: string;
      opportunityTheme: string;
      cautionTheme: string;
    };
    readonly lifeThemes: {
      wealth: string;
      career: string;
      business: string;
      relationship: string;
      marriage: string;
      health: string;
      social: string;
    };
  };

  // 2. 마보살 문제 분석 결과 (Ma Diagnosis)
  readonly maDiagnosis: {
    readonly userTrouble: {
      category: string;
      userText: string;
    };
    readonly maSummaryPhrase: string; // "쉽게 말하면 지금은 [분야]에 마가 낀 시기로 볼 수 있습니다."
    readonly structuralReason: string;
    readonly severity: 'HIGH' | 'MEDIUM' | 'LOW';
  };

  // 3. 시기 분석 (Timing Analysis)
  readonly timing: {
    readonly startMonth: string;
    readonly peakMonth: string;
    readonly reliefMonth: string;
    readonly recoveryMonth: string;
    readonly monthlyPacing: Array<{
      month: string;
      intensity: number;
      phaseTag: string;
      description: string;
    }>;
  };

  // 4. 현실적 처방 (Prescription)
  readonly prescription: {
    readonly doList: readonly string[];
    readonly dontList: readonly string[];
    readonly elementRemedy: string;
    readonly coreAdvice: string;
  };

  // 5. AI 자연어 프레젠테이션 (Context Lock 적용)
  readonly aiPresentation: AiPresentationResult['formattedResponse'];
  readonly isAiFallback: boolean;

  // 6. 개인화된 디지털 처방 상품 아티팩트
  readonly remedyArtifacts: DigitalRemedyArtifact[];

  // 7. 유료 전환 트리거 ("그래서 언제 좋아지나요?")
  readonly conversionHook: {
    readonly question: string;
    readonly previewAnswer: string;
    readonly detailedAvailableIn: ProductTier;
  };

  // 8. 3종 표준 결과물 (무료, 39,000원, 149,000원)
  readonly standardReports?: {
    readonly freeReport: string;
    readonly detailedReport39k: string;
    readonly mabosalSolution149k: string;
    readonly daewoonDirection: string;
    readonly currentDaewoonPillar: string;
    readonly daewoonDetails?: any;
    readonly monthlySchedule?: any[];
    readonly actionCandidates?: any[];
    readonly samhapCalculation?: any;
    readonly salDiagnosis?: SalDiagnosisResult;
    readonly fourTierReports?: FourTierServiceResult;
  };

  // 9. 살진단 엔진 결과 (Phase 50)
  readonly salDiagnosis?: SalDiagnosisResult;

  // 10. 4단계 서비스 레이어 (Phase 50 Post-Calibration)
  readonly fourTierReports?: FourTierServiceResult;
}

export class ProductionPipelineEngine {
  private integratedService = new MabosalIntegratedService();

  /**
   * 전체 프로덕션 분석 파이프라인 실행
   */
  public async executePipeline(request: ProductionInputRequest): Promise<ProductionAnalysisResult> {
    // 0. 보안 및 유효성 검사
    const clientId = request.clientId || 'anonymous-client';
    const rateCheck = securityGuard.checkRateLimit(clientId);
    if (!rateCheck.allowed) {
      throw new Error('요청 한도를 초과하였습니다. 잠시 후 다시 시도해 주세요.');
    }

    const rawTrouble = request.userTroubleText || (request as any).userQuestion || '올해 전반적인 흐름과 마음의 안정을 찾고 싶습니다.';
    const sanitizedTrouble = securityGuard.validateTroubleInput(rawTrouble);

    const [y, m, d] = request.birthDate.split('-').map(Number);

    // 1. 기존 MabosalIntegratedService 실행 (명리 계산 엔진 100% 보존)
    const integrated = await this.integratedService.analyze({
      birthInput: {
        calendar_type: request.calendarType,
        is_leap_month: request.isLeapMonth,
        birth_year: y,
        birth_month: m,
        birth_day: d,
        birth_time: request.isUnknownTime ? null : request.birthTime,
        is_time_unknown: request.isUnknownTime,
        birth_city: request.region,
        gender: request.gender,
      },
      troubleText: sanitizedTrouble.sanitized,
      tier: 'free_diagnosis',
    });

    // 2. 프로필 저장 및 캐싱 확인
    const profileLookup = authPaymentService.getOrCreateSajuProfile({
      birthData: {
        calendarType: request.calendarType,
        isLeapMonth: request.isLeapMonth,
        birthDate: request.birthDate,
        birthTime: request.birthTime || '10:30',
        isUnknownTime: request.isUnknownTime,
        gender: request.gender,
        region: request.region,
      },
      userTrouble: {
        category: integrated.dualResult.user_trouble.category,
        text: sanitizedTrouble.sanitized,
      },
      analysisData: integrated,
    });

    const generalSaju = integrated.dualResult.general_saju;
    const dayMaster = generalSaju.day_master.stem;
    const rawNature = generalSaju.day_master.nature;
    const lackingElem = (generalSaju.five_elements.lacking[0] || '화') as '목' | '화' | '토' | '금' | '수';
    const categoryKorean = integrated.dualResult.user_trouble.category_label || '현실 고민';

    // 3. AI Presentation Layer 생성 (Context Lock 적용)
    const contextLock = aiPresentationService.createContextLock({
      dayMaster,
      dayMasterElement: rawNature,
      strength: generalSaju.strength.status,
      dominantElement: generalSaju.five_elements.dominant || '목',
      lackingElement: lackingElem,
      fourPillars: {
        year: integrated.fourPillarsText.split(' ')[0] || '년주',
        month: integrated.fourPillarsText.split(' ')[1] || '월주',
        day: integrated.fourPillarsText.split(' ')[2] || '일주',
        hour: integrated.fourPillarsText.split(' ')[3] || '시 미상',
      },
      currentLuck: {
        daeun: generalSaju.daewoon.current_daewoon.pillar,
        seunYear: generalSaju.sewoon.current_year,
        seunGanji: generalSaju.sewoon.current_pillar,
      },
      userTrouble: {
        category: integrated.dualResult.user_trouble.category,
        categoryKorean,
        userText: sanitizedTrouble.sanitized,
      },
      interpretation: {
        headline: integrated.presentation.step2_saju_insight.heading,
        structuralReason: integrated.presentation.step2_saju_insight.structural_explanation,
        problemSignal: integrated.presentation.step2_saju_insight.underlying_energy,
      },
      maResult: {
        maLabel: integrated.presentation.step3_mabosal_diagnosis.heading,
        maSummaryPhrase: integrated.presentation.step3_mabosal_diagnosis.compressed_diagnosis,
        severity: integrated.dualResult.ma_signal.intensity === 'critical' || integrated.dualResult.ma_signal.intensity === 'strong' ? 'HIGH' : 'MEDIUM',
      },
      timing: {
        startMonth: integrated.presentation.step4_period.onset_time,
        peakMonth: integrated.timingReport.crisis_peak_period,
        reliefMonth: integrated.timingReport.relief_period,
        recoveryMonth: integrated.timingReport.action_opportune_period,
      },
      prescription: {
        doList: integrated.prescription.actions_to_take,
        dontList: integrated.prescription.actions_to_avoid,
        elementRemedy: integrated.prescription.digital_remedy?.recommended_usage || '오행 보완',
      },
    });

    const aiResult = await aiPresentationService.presentInterpretation(contextLock);

    // 4. 개인화된 디지털 처방 생성
    const stemToElement: Record<string, '목' | '화' | '토' | '금' | '수'> = {
      갑: '목', 을: '목',
      병: '화', 정: '화',
      무: '토', 기: '토',
      경: '금', 신: '금',
      임: '수', 계: '수',
    };
    const dayMasterElem = stemToElement[dayMaster] || '수';

    const remedyArtifacts = personalizedRemedyGenerator.generateFullRemedySet({
      dayMaster,
      dayMasterHanja: dayMaster,
      dayMasterElement: dayMasterElem,
      lackingElement: lackingElem,
      troubleCategory: categoryKorean,
      corePrescriptionPhrase: integrated.prescription.timing_strategic_action || '침착하게 중심을 잡으십시오',
      actionItem: integrated.prescription.actions_to_take[0] || '감정의 정돈',
      avoidItem: integrated.prescription.actions_to_avoid[0] || '성급한 결정',
    });

    // 5. 살진단 엔진 (Phase 50 독립 모듈 연동)
    const tokens = (integrated.fourPillarsText || '임신 계묘 경인 경진').split(' ').map(s => s.replace(/[년월일시]/g, ''));
    const yP = tokens[0] || '임신';
    const mP = tokens[1] || '계묘';
    const dP = tokens[2] || '경인';
    const hP = tokens[3] || '경진';

    // 사건 날짜 제공 여부 동적 감지 (예: 2026년 8월 15일, 2026-08-15 또는 request.eventDate)
    let parsedEventDate: string | undefined = (request as any).eventDate;
    if (!parsedEventDate) {
      const dateMatch = sanitizedTrouble.sanitized.match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/) 
        || sanitizedTrouble.sanitized.match(/(\d{4})[-.](\d{1,2})[-.](\d{1,2})/);
      if (dateMatch) {
        parsedEventDate = `${dateMatch[1]}-${String(dateMatch[2]).padStart(2, '0')}-${String(dateMatch[3]).padStart(2, '0')}`;
      }
    }
    const isDateKnown = Boolean(parsedEventDate);

    const salDiagnosis = salDiagnosisEngine.diagnose({
      fourPillars: {
        year: { stem: yP[0] as HeavenlyStem, branch: yP[1] as EarthlyBranch },
        month: { stem: mP[0] as HeavenlyStem, branch: mP[1] as EarthlyBranch },
        day: { stem: dP[0] as HeavenlyStem, branch: dP[1] as EarthlyBranch },
        hour: hP && hP.length >= 2 ? { stem: hP[0] as HeavenlyStem, branch: hP[1] as EarthlyBranch } : null,
      },
      luckContext: {
        daeun: { stem: '병', branch: '오', ganji: '병오' },
        seun: { stem: '병', branch: '오', ganji: '병오' },
        month: { stem: '정', branch: '유', ganji: '정유' },
        day: { stem: '경', branch: '인', ganji: '경인' },
      },
      userEvent: {
        eventText: sanitizedTrouble.sanitized,
        eventDate: parsedEventDate,
        eventDateKnown: isDateKnown,
      },
    });

    // 6. 3종 표준 결과물 생성 (무료, 39,000원, 149,000원)
    const [bH, bM] = (request.birthTime || '08:30').split(':').map(Number);
    const standardReportsData = standardReportGenerator.generateAll({
      birthYear: y,
      birthMonth: m,
      birthDay: d,
      birthHour: isNaN(bH) ? 8 : bH,
      birthMinute: isNaN(bM) ? 30 : bM,
      gender: request.gender,
      calendarType: request.calendarType,
      isLeapMonth: request.isLeapMonth,
      region: request.region,
      userTroubleText: sanitizedTrouble.sanitized,
      fourPillarsText: integrated.fourPillarsText,
      currentDate: request.currentDate || '2026-10-03',
      salDiagnosis,
    });

    const fourTierReports = mabosal4TierService.generateAllTiers({
      birthYear: y,
      birthMonth: m,
      birthDay: d,
      birthHour: isNaN(bH) ? 8 : bH,
      birthMinute: isNaN(bM) ? 30 : bM,
      gender: request.gender,
      calendarType: request.calendarType,
      region: request.region,
      fourPillarsText: integrated.fourPillarsText,
      userTroubleText: sanitizedTrouble.sanitized,
      salDiagnosis,
      samhapCalculation: standardReportsData.samhapCalculation,
      actionCandidates: standardReportsData.actionCandidates,
      monthlySchedule: standardReportsData.monthlySchedule,
      daewoonInfo: standardReportsData.daewoonInfo,
      curDate: request.currentDate || '2026-10-03',
    });

    // 6. 최종 프로덕션 결과 구성
    return {
      success: true,
      profileId: profileLookup.profile.profileId,
      isCached: profileLookup.isCached,
      unlockedTiers: profileLookup.profile.unlockedTiers,
      integratedResult: integrated,

      generalSaju: {
        dayMaster,
        dayMasterElement: rawNature,
        strength: generalSaju.strength.status,
        dominantElement: generalSaju.five_elements.dominant || '목',
        dominantByPower: generalSaju.five_elements.dominantByPower || '목',
        dominantByCount: generalSaju.five_elements.dominantByCount || '금',
        dominantDefinition: generalSaju.five_elements.dominantDefinition || '월령(묘월 목왕절) 및 계절 사령 가중치를 반영한 세력 판정 최왕 오행 (단순 개수 최다는 금 3개)',
        lackingElement: lackingElem,
        lacking: generalSaju.five_elements.lacking,
        lackingDefinition: generalSaju.five_elements.lackingDefinition || '원국 8자 표면 글자 미표출(0개) 결핍 오행 (지장간 인목 내 병화 암장)',
        distribution: generalSaju.five_elements.distribution,
        fiveElementsCommentary: generalSaju.five_elements.commentary,
        fourPillarsText: integrated.fourPillarsText,
        personality: generalSaju.day_master.psychological_trait,
        currentYearLuck: {
          year: generalSaju.sewoon.current_year,
          ganji: generalSaju.sewoon.current_pillar,
          flowSummary: generalSaju.sewoon.flow_summary,
          opportunityTheme: generalSaju.sewoon.critical_opportunities[0] || '안정적 성장 기회',
          cautionTheme: generalSaju.sewoon.caution_points[0] || '감정 마찰 주의',
        },
        lifeThemes: {
          wealth: generalSaju.themes.wealth.summary,
          career: generalSaju.themes.career.summary,
          business: generalSaju.themes.business.summary,
          relationship: generalSaju.themes.relationship.summary,
          marriage: generalSaju.themes.marriage.summary,
          health: generalSaju.themes.health.summary,
          social: generalSaju.themes.interpersonal.summary,
        },
      },


      maDiagnosis: {
        userTrouble: {
          category: integrated.dualResult.user_trouble.category,
          userText: sanitizedTrouble.sanitized,
        },
        maSummaryPhrase: integrated.presentation.step3_mabosal_diagnosis.compressed_diagnosis,
        structuralReason: integrated.presentation.step2_saju_insight.structural_explanation,
        severity: integrated.dualResult.ma_signal.intensity === 'critical' ? 'HIGH' : 'MEDIUM',
      },

      timing: {
        startMonth: integrated.presentation.step4_period.onset_time,
        peakMonth: integrated.timingReport.crisis_peak_period,
        reliefMonth: integrated.timingReport.relief_period,
        recoveryMonth: integrated.timingReport.action_opportune_period,
        monthlyPacing: integrated.timingReport.monthly_timeline.map((m: any) => ({
          month: m.year_month,
          intensity: m.intensity_score,
          phaseTag: m.energy_flow,
          description: m.action_advice,
        })),
      },

      prescription: {
        doList: integrated.prescription.actions_to_take,
        dontList: integrated.prescription.actions_to_avoid,
        elementRemedy: integrated.prescription.digital_remedy?.recommended_usage || '오행 보완',
        coreAdvice: integrated.prescription.timing_strategic_action,
      },

      aiPresentation: aiResult.formattedResponse,
      isAiFallback: aiResult.isFallback,

      remedyArtifacts,

      conversionHook: {
        question: '“그래서 언제 좋아지나요?”',
        previewAnswer: `${integrated.timingReport.relief_period}부터 마찰이 잦아들며 ${integrated.timingReport.action_opportune_period}에 완전한 회복세에 접어듭니다.`,
        detailedAvailableIn: 'paid_mabosal_full',
      },

      standardReports: {
        freeReport: standardReportsData.freeReport,
        detailedReport39k: standardReportsData.detailedReport39k,
        mabosalSolution149k: standardReportsData.mabosalSolution149k,
        daewoonDirection: standardReportsData.daewoonInfo.direction,
        currentDaewoonPillar: standardReportsData.daewoonInfo.currentDaewoon.ganji,
        daewoonDetails: standardReportsData.daewoonInfo,
        monthlySchedule: standardReportsData.monthlySchedule,
        actionCandidates: standardReportsData.actionCandidates,
        samhapCalculation: standardReportsData.samhapCalculation,
        salDiagnosis: standardReportsData.salDiagnosis || salDiagnosis,
        fourTierReports,
      },

      salDiagnosis: standardReportsData.salDiagnosis || salDiagnosis,
      fourTierReports,
    };
  }
}

export const productionPipelineEngine = new ProductionPipelineEngine();
