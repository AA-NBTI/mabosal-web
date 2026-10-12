/**
 * MabosalIntegratedService: Phase 17~25 통합 총괄 서비스 Facade
 * 
 * 원칙:
 * 1. 기존 Phase 1~16의 핵심 계산 엔진의 결과를 100% 불변으로 유지합니다.
 * 2. 일반 사주풀이(Phase 17) + 현실 문제(Phase 19) + 마 진단(Phase 20) + 사용자 언어(Phase 21)
 *    + 시기 분석(Phase 22) + 처방(Phase 23) + 상품 구조(Phase 24) + 플랫폼 연결(Phase 25)
 *    을 하나의 완벽한 통합 파이프라인으로 관통합니다.
 */

import { MabosalSessionEngine } from '../phase13/mabosal-session.js';
import { MabosalSessionRequest } from '../phase13/phase13-types.js';
import { DualEnginePipeline } from './dual-engine-pipeline.js';
import { standardizeBirthDate } from './lunar-calendar.js';
import { PlatformAdapter } from './platform-adapter.js';
import { PrescriptionEngine } from './prescription-engine.js';
import { ProductCatalogService } from './product-system.js';
import { TimingAnalysisEngine } from './timing-analysis-engine.js';
import { 
  DualEngineResult, 
  PrescriptionReport, 
  ProductTier, 
  RawBirthInput, 
  StandardBirthDate, 
  TimingAnalysisReport, 
  UserFacingPresentation 
} from './types.js';
import { UserLanguagePresenter } from './user-language-presenter.js';

export interface IntegratedAnalysisRequest {
  birthInput: RawBirthInput;
  troubleText: string;
  tier?: ProductTier;
  sessionId?: string;
}

export interface IntegratedAnalysisResult {
  sessionId: string;
  tier: ProductTier;
  standardBirthDate: StandardBirthDate;
  fourPillarsText: string;
  isMissingHour: boolean;
  dualResult: DualEngineResult;
  presentation: UserFacingPresentation;
  timingReport: TimingAnalysisReport;
  prescription: PrescriptionReport;
  visibleSections: ReturnType<ProductCatalogService['getVisibleSections']>;
}

export class MabosalIntegratedService {
  private sessionEngine = new MabosalSessionEngine();
  private dualPipeline = new DualEnginePipeline();
  private presenter = new UserLanguagePresenter();
  private timingEngine = new TimingAnalysisEngine();
  private prescriptionEngine = new PrescriptionEngine();
  private productService = new ProductCatalogService();
  private platformAdapter = new PlatformAdapter();

  /**
   * 통합 사주 & 마보살 심층 분석 실행
   */
  public async analyze(request: IntegratedAnalysisRequest): Promise<IntegratedAnalysisResult> {
    const tier = request.tier || 'free_diagnosis';
    const sessionId = request.sessionId || `mbs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Phase 18: 출생정보 표준화 (음력/양력/윤달 변환 및 원천 보존)
    const standardDate = standardizeBirthDate(request.birthInput);

    // 2. 기존 기준 엔진(Phase 13) 안전 호출
    const sessionReq: MabosalSessionRequest = {
      sessionId,
      birthDate: standardDate.solar_date_string,
      birthTime: request.birthInput.birth_time,
      gender: request.birthInput.gender,
      region: request.birthInput.birth_city,
      depthMode: 'DEEP',
    };

    const sessionRes = this.sessionEngine.createSession(sessionReq);
    if (!sessionRes.success || !sessionRes.data) {
      throw new Error(`사주 엔진 분석 실패: ${sessionRes.userMessage || '오류 발생'}`);
    }

    const state = sessionRes.data;
    const fact = state.fact;
    const signalSet = state.signalSet;

    // 3. Phase 20: 일반 사주 + 마 진단 이중 파이프라인 실행
    const dualResult = this.dualPipeline.execute(
      fact,
      signalSet,
      request.troubleText
    );

    // 4. Phase 21: 사용자 언어 출력 엔진 (6단계 프리젠테이션)
    const presentation = this.presenter.present(dualResult);

    // 5. Phase 22: 시기 분석 엔진 고도화
    const timingReport = this.timingEngine.analyze(dualResult, fact);

    // 6. Phase 23: 마보살 행동 처방 & 디지털 부적 스펙
    const prescription = this.prescriptionEngine.generatePrescription(dualResult);

    // 7. Phase 24: 티어별 뷰 권한 계산
    const visibleSections = this.productService.getVisibleSections(tier);

    // 사주 4주 텍스트 포맷팅
    const p = fact.four_pillars;
    const fourPillarsText = `${p.year.stem}${p.year.branch}년 ${p.month.stem}${p.month.branch}월 ${p.day.stem}${p.day.branch}일 ${p.hour ? `${p.hour.stem}${p.hour.branch}시` : '시 미상'}`;

    const result: IntegratedAnalysisResult = {
      sessionId,
      tier,
      standardBirthDate: standardDate,
      fourPillarsText,
      isMissingHour: state.isMissingHour,
      dualResult,
      presentation,
      timingReport,
      prescription,
      visibleSections,
    };

    // 8. Phase 25: 플랫폼 세션 저장
    await this.platformAdapter.saveSession({
      sessionId,
      tier,
      isPaid: tier !== 'free_diagnosis',
      rawInput: request.birthInput,
      analysisOutput: result,
    });

    return result;
  }

  public getProductService(): ProductCatalogService {
    return this.productService;
  }

  public getPlatformAdapter(): PlatformAdapter {
    return this.platformAdapter;
  }
}
