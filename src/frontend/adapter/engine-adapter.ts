/**
 * Phase 14~26: Engine Adapter for Frontend
 * 
 * 원칙:
 * 1. 프론트엔드 UI 컴포넌트가 명리 연산을 직접 하지 않고, Phase 13 및 Phase 17~25 통합 엔진을 안전하게 호출합니다.
 * 2. 5단계 분석 프로세스 애니메이션을 연출하여 사용자 몰입감을 극대화합니다.
 * 3. 예외 발생 시 내부 스택 트레이스를 감추고 사용자 친화적인 메시지를 반환합니다.
 */

import { MabosalSessionEngine } from '../../modules/phase13/mabosal-session.js';
import { MabosalSessionRequest, MabosalSessionState } from '../../modules/phase13/phase13-types.js';
import { ConsultationAnswer } from '../../modules/phase11/phase11-types.js';
import { ReportDepthMode } from '../../modules/phase10/phase10-types.js';
import { appState } from '../state/app-state.js';
import { 
  MabosalIntegratedService, 
  IntegratedAnalysisRequest, 
  IntegratedAnalysisResult, 
  ProductTier 
} from '../../modules/phase17_25/index.js';
import { ProductGenerator } from '../../modules/product-generator/product-generator.js';
import { generateAllProductOutputs, CommonCaseInput } from '../../modules/product-output/index.js';
import { gunghapEngine, GunghapAnalysisResult, PersonBirthInput } from '../../modules/chemistry/gunghap-engine.js';

export class FrontendEngineAdapter {
  private sessionEngine = new MabosalSessionEngine();
  private integratedService = new MabosalIntegratedService();

  /**
   * 사용자 출생정보 분석 실행 (기존 Phase 14 호환 + Phase 17~25 통합 결과 자동 생성)
   */
  public async analyzeBirthInfo(request: MabosalSessionRequest): Promise<MabosalSessionState> {
    const steps = [
      '사주 4주와 일간의 고유 기운을 정밀하게 추출하고 있습니다...',
      '21개 마(Ma) 잠재 신호의 활성화 상태를 계산하고 있습니다...',
      '기운 간의 2차 상호작용과 RSI 안정도 밴드를 산출하고 있습니다...',
      '재물·직장·사업·관계 등 6대 핵심 삶의 영역을 조율하고 있습니다...',
      '마보살 페르소나의 맞춤형 최종 사주 리포트를 완성하고 있습니다...',
    ];

    appState.setLoading(true, steps[0]);

    for (let i = 0; i < steps.length; i++) {
      appState.setLoading(true, steps[i]);
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    const res = this.sessionEngine.createSession(request);

    if (!res.success || !res.data) {
      appState.setLoading(false);
      appState.setError(res.userMessage || '사주 분석 정보를 처리하는 중 문제가 발생했습니다.');
      appState.setView('analyze');
      throw new Error(res.userMessage);
    }

    const currentState = appState.getState();
    // 통합 분석도 병행 실행
    const integratedReq: IntegratedAnalysisRequest = {
      birthInput: {
        calendar_type: currentState.calendarType || 'solar',
        is_leap_month: currentState.isLeapMonth || false,
        birth_year: parseInt(request.birthDate.split('-')[0]),
        birth_month: parseInt(request.birthDate.split('-')[1]),
        birth_day: parseInt(request.birthDate.split('-')[2]),
        birth_time: request.birthTime || null,
        is_time_unknown: !request.birthTime,
        birth_city: request.region || '서울',
        gender: request.gender || currentState.gender || 'male',
      },
      troubleText: currentState.userTroubleText || '특별한 문제는 없고 올해 전체적인 운의 흐름을 보고 싶어요.',
      tier: currentState.selectedTier || 'free_diagnosis',
    };

    try {
      const integratedResult = await this.integratedService.analyze(integratedReq);
      appState.setIntegratedResult(integratedResult);
    } catch (e) {
      console.warn('통합 분석 파이프라인 소프트 실패(기본 세션 유지):', e);
    }

    appState.setSession(res.data);

    // Phase 82: 무결성 15대 섹션 산출물 생성
    try {
      const generator = new ProductGenerator();
      const product = generator.generateProduct({
        birthDate: request.birthDate,
        birthTime: request.birthTime || undefined,
        gender: (request.gender as any) || currentState.gender || 'male',
        currentEvent: currentState.userTroubleText || '올해 전반적인 흐름과 현실 조언',
        userTrouble: currentState.userTroubleText || '올해 전반적인 흐름과 현실 조언',
        targetYear: new Date().getFullYear(),
      }, { insightDepth: 5, prescription: true });
      appState.setLatestProduct(product);

      // Phase 83: 4단계 상품 출력 세트 생성
      const commonInput: CommonCaseInput = {
        solarBirthDate: request.birthDate,
        birthTime: request.birthTime || null,
        isUnknownTime: !request.birthTime,
        gender: (request.gender as any) || currentState.gender || 'male',
        calendarType: currentState.calendarType || 'solar',
        isLeapMonth: currentState.isLeapMonth || false,
        birthRegion: request.region || '서울',
        coreTrouble: currentState.userTroubleText || '올해 전반적인 운의 흐름과 기회를 알고 싶어요.',
        desiredQuestion: currentState.desiredQuestion || '앞으로 어떤 선택을 하는 것이 가장 유리할까요?',
        currentSituation: currentState.selectedSituation || undefined,
        additionalContext: currentState.additionalContext || undefined,
        targetYear: new Date().getFullYear(),
      };
      const productSet = generateAllProductOutputs(commonInput);
      appState.setProductOutputSet(productSet);
    } catch (err) {
      console.warn('ProductGenerator / Phase 83 생성 실패(기본 세션 유지):', err);
    }

    appState.setView('result');
    return res.data;
  }

  /**
   * Phase 17~25 통합 사주 & Phase 82 15대 섹션 무결성 분석 실행
   */
  public async analyzeIntegrated(req: IntegratedAnalysisRequest): Promise<IntegratedAnalysisResult> {
    const steps = [
      '사주 원국 4주 8자와 오행의 기운을 읽고 있습니다...',
      '대운과 세운 및 12개월 타이밍 흐름을 추적하고 있습니다...',
      '입력하신 현실 고민과 명리적 기운의 연결 고리를 분석하고 있습니다...',
      '행동·심리·환경 맞춤 처방을 정밀하게 합성하고 있습니다...',
      '당신만을 위한 최종 맞춤 리포트를 완성하고 있습니다...',
    ];

    appState.setLoading(true, steps[0]);
    for (let i = 0; i < steps.length; i++) {
      appState.setLoading(true, steps[i]);
      await new Promise(resolve => setTimeout(resolve, 180));
    }

    const integratedResult = await this.integratedService.analyze(req);
    appState.setIntegratedResult(integratedResult);

    // 기존 세션도 갱신
    const dateStr = integratedResult.standardBirthDate.solar_date_string;
    const sessionRes = this.sessionEngine.createSession({
      birthDate: dateStr,
      birthTime: req.birthInput.birth_time,
      gender: req.birthInput.gender,
      region: req.birthInput.birth_city,
      depthMode: 'DEEP',
    });

    if (sessionRes.success && sessionRes.data) {
      appState.setSession(sessionRes.data);
    }

    // Phase 82: 무결성 15대 섹션 산출물 생성
    try {
      const generator = new ProductGenerator();
      const product = generator.generateProduct({
        birthDate: dateStr,
        birthTime: req.birthInput.birth_time || undefined,
        gender: req.birthInput.gender,
        currentEvent: req.troubleText,
        userTrouble: req.troubleText,
        targetYear: new Date().getFullYear(),
      }, { insightDepth: 5, prescription: true });
      appState.setLatestProduct(product);

      // Phase 83: 4단계 상품 출력 세트 생성
      const currentState = appState.getState();
      const commonInput: CommonCaseInput = {
        solarBirthDate: dateStr,
        birthTime: req.birthInput.birth_time || null,
        isUnknownTime: !req.birthInput.birth_time,
        gender: req.birthInput.gender,
        calendarType: req.birthInput.calendar_type,
        isLeapMonth: req.birthInput.is_leap_month,
        birthRegion: req.birthInput.birth_city || '서울',
        coreTrouble: req.troubleText || currentState.userTroubleText || '올해 전반적인 운의 흐름과 기회를 알고 싶어요.',
        desiredQuestion: currentState.desiredQuestion || '앞으로 어떤 선택을 하는 것이 가장 유리할까요?',
        currentSituation: currentState.selectedSituation || undefined,
        additionalContext: currentState.additionalContext || undefined,
        targetYear: new Date().getFullYear(),
      };
      const productSet = generateAllProductOutputs(commonInput);
      appState.setProductOutputSet(productSet);
    } catch (err) {
      console.warn('ProductGenerator / Phase 83 생성 실패(기본 세션 유지):', err);
    }

    appState.setView('result');
    return integratedResult;
  }

  /**
   * 티어 업그레이드 및 결제 처리
   */
  public async upgradeTier(tier: ProductTier): Promise<void> {
    appState.setSelectedTier(tier);
    appState.setPaidUser(tier !== 'free_diagnosis');
    const current = appState.getState();
    if (current.integratedResult) {
      current.integratedResult.tier = tier;
      current.integratedResult.visibleSections = this.integratedService.getProductService().getVisibleSections(tier);
      appState.setIntegratedResult(current.integratedResult);
    }
  }

  public updateReportDepthMode(mode: ReportDepthMode): void {
    appState.setReportMode(mode);
    const session = appState.getState().sessionState;
    if (session) {
      const res = this.sessionEngine.createSession({
        ...session.request,
        depthMode: mode,
      });
      if (res.success && res.data) {
        res.data.dialogueContext = session.dialogueContext;
        appState.setSession(res.data);
      }
    }
  }

  public async askConsultation(
    session: MabosalSessionState,
    questionText: string
  ): Promise<ConsultationAnswer> {
    const res = this.sessionEngine.askQuestion(session, questionText);

    if (!res.success || !res.data) {
      throw new Error(res.userMessage || '상담 답변을 생성하는 중 일시적인 지연이 발생했습니다.');
    }

    return res.data;
  }

  public getTraceInfoForTheme(session: MabosalSessionState, themeName: string) {
    const item = session.userReport.themes.find(t => t.theme === themeName);
    const activeList = session.signalSet.activeSignals.concat(session.signalSet.dominantSignals);
    const signals = activeList.map(s => s.moduleId);
    const activationStates: Record<string, string> = {};
    activeList.forEach(s => {
      activationStates[s.moduleId] = s.activation.state;
    });

    const secondRelationships = session.phase7Output.secondRelationships.map(
      m => `${m.action}: ${m.sourceModuleId} ↔ ${m.targetModuleId}`
    );

    const originFacts = [
      `일간: ${session.fact.day_stem} (${session.fact.day_master_strength.classification})`,
      `주도 오행: ${session.fact.five_elements.dominantElement}`,
      `사주 4주: ${session.fact.four_pillars.year.stem}${session.fact.four_pillars.year.branch}년 ` +
      `${session.fact.four_pillars.month.stem}${session.fact.four_pillars.month.branch}월 ` +
      `${session.fact.four_pillars.day.stem}${session.fact.four_pillars.day.branch}일 ` +
      `${session.fact.four_pillars.hour ? session.fact.four_pillars.hour.stem + session.fact.four_pillars.hour.branch : '미상'}시`,
    ];

    return {
      title: item?.title || themeName,
      summary: item?.summary || '핵심 명리 구조 해석',
      signals,
      activationStates,
      secondRelationships,
      rsiBand: session.phase7Output.rsi.band,
      originFacts,
    };
  }

  /**
   * Phase 78: 무료 결과에서 상황 선택 후 Level 5 심층 분석 실행
   */
  public runDeepAnalysis(params: {
    selectedSituation?: string;
    additionalContext?: string;
    desiredQuestion?: string;
  }) {
    const currentState = appState.getState();
    const integrated = currentState.integratedResult;
    const birthDate = integrated?.standardBirthDate?.solar_date_string || '1988-12-10';
    const birthTime = (integrated?.standardBirthDate as any)?.birth_time || '14:00';
    const gender = currentState.gender || 'female';
    const troubleText = currentState.userTroubleText || '회사 운영 및 사업 위기';

    const generator = new ProductGenerator();
    const deepResult = generator.generateProduct({
      birthDate,
      birthTime,
      gender,
      currentEvent: troubleText,
      userTrouble: troubleText,
      selectedSituation: params.selectedSituation,
      additionalContext: params.additionalContext,
      desiredQuestion: params.desiredQuestion,
      targetYear: 2024,
    }, { insightDepth: 5, prescription: true });

    appState.setSelectedSituation(params.selectedSituation || '');
    appState.setAdditionalContext(params.additionalContext || '');
    appState.setDesiredQuestion(params.desiredQuestion || '');
    appState.setDeepResult(deepResult);
    return deepResult;
  }

  /**
   * 2인 정밀 궁합 모듈 연산 실행 (독립 GunghapEngine 연계)
   */
  public async analyzeGunghap(partnerInput?: Partial<PersonBirthInput & { relation?: string }>): Promise<GunghapAnalysisResult> {
    const currentState = appState.getState();
    const myName = currentState.userName || '나 (본인)';
    const myGender = currentState.gender || 'male';
    const myBirthDate = currentState.sessionState?.request?.birthDate || 
      currentState.integratedResult?.standardBirthDate?.solar_date_string || 
      '1992-05-15';
    const myBirthTime = currentState.sessionState?.request?.birthTime || null;

    const personA: PersonBirthInput = {
      name: myName,
      gender: myGender,
      birthDate: myBirthDate,
      birthTime: myBirthTime,
    };

    const partnerState = currentState.partnerInfo;
    const partnerName = partnerInput?.name || partnerState?.name || '상대방 (인연)';
    const partnerGender = (partnerInput?.gender || partnerState?.gender || (myGender === 'male' ? 'female' : 'male')) as 'male' | 'female';
    const partnerBirthDate = partnerInput?.birthDate || partnerState?.birthDate || '1993-08-20';
    const partnerBirthTime = partnerInput?.birthTime || (partnerState?.isHourUnknown ? null : partnerState?.birthTime) || '14:30';

    const personB: PersonBirthInput = {
      name: partnerName,
      gender: partnerGender,
      birthDate: partnerBirthDate,
      birthTime: partnerBirthTime,
    };

    const steps = [
      '두 사람의 사주 원국과 일간·일지 기운을 대조하고 있습니다...',
      '천간합·상생상극과 오행 결핍 보완 지수를 정밀 계산하고 있습니다...',
      '일지 속궁합과 육합·삼합·육충·원진살 상호작용을 심층 분석하고 있습니다...',
      '우리가 반복해서 부딪히는 3대 감정 폭발 버튼을 추출하고 있습니다...',
      '마보살 실전 화해 스크립트와 맞춤 궁합 리포트를 완성하고 있습니다...',
    ];

    appState.setLoading(true, steps[0]);
    for (let i = 0; i < steps.length; i++) {
      appState.setLoading(true, steps[i]);
      await new Promise(resolve => setTimeout(resolve, 140));
    }

    const result = gunghapEngine.calculate(personA, personB);
    appState.setGunghapResult(result);
    appState.setLoading(false);
    return result;
  }

}

export const frontendAdapter = new FrontendEngineAdapter();
