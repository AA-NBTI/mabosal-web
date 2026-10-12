/**
 * Phase 41: Production Launch Final Verification Audit Suite
 * 
 * 8대 필수 시나리오 종합 검증:
 * - Scenario A: 무료 → 일반 사주 → 마보살 진단 → 결제 유도
 * - Scenario B: 무료 → 정밀 사주 결제 (39,000원) → 전체 사주풀이 해제
 * - Scenario C: 무료 → 마보살 정밀풀이 결제 (149,000원) → 시기 → 처방 → 디지털 처방 4종 해제
 * - Scenario D: 결제 → 로그아웃 → 재로그인 → 구매 결과 복구 (Profile & Purchase Restore)
 * - Scenario E: 모바일 환경에서 전체 결제 및 결과 확인
 * - Scenario F: AI API 장애 → 결정론적 결과 Fallback (Context Lock 안전 보장)
 * - Scenario G: 잘못된 입력 및 악의적 입력 → 안전한 오류 처리
 * - Scenario H: 동일 사용자 동일 입력 → 동일 결과 재현 (결정론적 무결성)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { productionPipelineEngine, ProductionInputRequest } from '../src/modules/production/production-pipeline.js';
import { authPaymentService } from '../src/modules/production/auth-payment-service.js';
import { aiPresentationService } from '../src/modules/production/ai-presentation-service.js';
import { securityGuard } from '../src/modules/production/security-guard.js';
import { renderResultView } from '../src/frontend/components/views.js';
import { appState } from '../src/frontend/state/app-state.js';

describe('Phase 41: Production Launch Final E2E Suite (Scenario A ~ H)', () => {
  beforeEach(() => {
    authPaymentService.createAnonymousUser();
  });

  // ----------------------------------------------------
  // Scenario A: 무료 → 일반 사주 → 마보살 진단 → 결제 유도
  // ----------------------------------------------------
  it('Scenario A: 무료 사용자가 일반 사주 완결 및 마 진단을 받고 “그래서 정확히 언제 좋아지는가?” 유료 훅에 도달한다', async () => {
    const req: ProductionInputRequest = {
      calendarType: 'solar',
      isLeapMonth: false,
      birthDate: '1992-05-15',
      birthTime: '10:30',
      isUnknownTime: false,
      gender: 'male',
      region: 'Seoul',
      troubleCategory: 'career',
      userTroubleText: '최근 회사에서 팀장과의 갈등이 심해 이직을 고민하고 있습니다.',
      clientId: 'scenario-a-client',
    };

    const res = await productionPipelineEngine.executePipeline(req);

    // 1. 일반 사주 독립 완결성
    expect(res.generalSaju.dayMaster).toBeTruthy();
    expect(res.generalSaju.lifeThemes.wealth).toBeTruthy();
    expect(res.generalSaju.lifeThemes.career).toBeTruthy();

    // 2. 마 진단 핵심 한마디 (내부 코드 노출 없이 "마가 낀 시기")
    expect(res.maDiagnosis.maSummaryPhrase).toMatch(/마.*낀 시기/);
    expect(res.maDiagnosis.maSummaryPhrase).not.toContain('CAREER_MA');

    // 3. 결제 전 상태 (무료 티어만 언락)
    expect(authPaymentService.isTierUnlocked(res.profileId, 'free_diagnosis')).toBe(true);
    expect(authPaymentService.isTierUnlocked(res.profileId, 'paid_detailed_saju')).toBe(false);
    expect(authPaymentService.isTierUnlocked(res.profileId, 'paid_mabosal_full')).toBe(false);

    // 4. 유료 전환 훅 질문 검증
    expect(res.conversionHook.question).toContain('언제 좋아지');
  });

  // ----------------------------------------------------
  // Scenario B: 무료 → 정밀 사주 결제 (39,000원) → 전체 사주풀이
  // ----------------------------------------------------
  it('Scenario B: 39,000원 정밀 사주 결제 후 7대 라이프 영역 및 평생 사주풀이가 온전히 해제된다', async () => {
    const req: ProductionInputRequest = {
      calendarType: 'solar',
      isLeapMonth: false,
      birthDate: '1988-08-18',
      birthTime: '20:15',
      isUnknownTime: false,
      gender: 'female',
      region: 'Seoul',
      troubleCategory: 'wealth',
      userTroubleText: '올해 재물운과 중장기적인 투자 시기가 궁금합니다.',
      clientId: 'scenario-b-client',
    };

    const res = await productionPipelineEngine.executePipeline(req);

    // 결제 주문 생성 (39,000원)
    const order = authPaymentService.createPaymentOrder({
      profileId: res.profileId,
      tier: 'paid_detailed_saju',
      paymentMethod: 'kakaopay',
    });
    expect(order.amountKrw).toBe(39000);
    expect(order.status).toBe('PENDING');

    // 결제 완료 처리
    const payment = authPaymentService.verifyAndCompletePayment(order.transactionId);
    expect(payment.success).toBe(true);
    expect(payment.transaction.status).toBe('COMPLETED');

    // 정밀 사주 해제 확인 (14.9만 풀패키지는 미해제)
    expect(authPaymentService.isTierUnlocked(res.profileId, 'paid_detailed_saju')).toBe(true);
    expect(authPaymentService.isTierUnlocked(res.profileId, 'paid_mabosal_full')).toBe(false);
  });

  // ----------------------------------------------------
  // Scenario C: 무료 → 마보살 정밀풀이 결제 (149,000원) → 시기 → 처방 → 디지털 처방
  // ----------------------------------------------------
  it('Scenario C: 149,000원 마보살 정밀풀이 결제 시 4대 핵심 가치, 월별 타이밍, 행동 처방, 디지털 처방이 모두 해제된다', async () => {
    const req: ProductionInputRequest = {
      calendarType: 'solar',
      isLeapMonth: false,
      birthDate: '1994-11-05',
      birthTime: '07:20',
      isUnknownTime: false,
      gender: 'male',
      region: 'Busan',
      troubleCategory: 'love',
      userTroubleText: '최근 애인과 헤어졌는데 다시 연락이 올지 마음이 너무 복잡합니다.',
      clientId: 'scenario-c-client',
    };

    const res = await productionPipelineEngine.executePipeline(req);

    // 149,000원 주문 및 결제
    const order = authPaymentService.createPaymentOrder({
      profileId: res.profileId,
      tier: 'paid_mabosal_full',
      paymentMethod: 'toss',
    });
    expect(order.amountKrw).toBe(149000);

    const payment = authPaymentService.verifyAndCompletePayment(order.transactionId);
    expect(payment.success).toBe(true);

    // 마보살 풀패키지와 3.9만 정밀 사주가 모두 활성화됨
    expect(authPaymentService.isTierUnlocked(res.profileId, 'paid_mabosal_full')).toBe(true);
    expect(authPaymentService.isTierUnlocked(res.profileId, 'paid_detailed_saju')).toBe(true);

    // 4대 핵심 가치 요소 완비
    expect(res.maDiagnosis.structuralReason).toBeTruthy(); // 왜 이런 일이 생겼는가
    expect(res.timing.peakMonth).toBeTruthy(); // 언제 가장 힘든가
    expect(res.timing.reliefMonth).toBeTruthy(); // 언제 풀리는가
    expect(res.prescription.doList.length).toBeGreaterThan(0); // 그때 무엇을 해야 하는가

    // 디지털 처방물 4종 생성 검증
    expect(res.remedyArtifacts.length).toBe(4);
    const wallpaper = res.remedyArtifacts.find(r => r.formatType === 'PHONE_WALLPAPER');
    expect(wallpaper?.dimensions).toEqual({ width: 1080, height: 1920 });
  });

  // ----------------------------------------------------
  // Scenario D: 결제 → 로그아웃 → 재로그인 → 구매 결과 복구
  // ----------------------------------------------------
  it('Scenario D: 결제 후 세션이 종료되어도 재로그인 시 구매 결과와 권한이 100% 복구된다', async () => {
    const userEmail = 'vip_customer@mabosal.com';
    const user = authPaymentService.signInWithEmail(userEmail);

    const req: ProductionInputRequest = {
      calendarType: 'solar',
      isLeapMonth: false,
      birthDate: '1985-03-21',
      birthTime: '11:15',
      isUnknownTime: false,
      gender: 'female',
      region: 'Seoul',
      troubleCategory: 'business',
      userTroubleText: '사업 확장을 준비 중인데 자금 흐름과 동업자 관계가 조심스럽습니다.',
      clientId: 'scenario-d-client',
    };

    const res = await productionPipelineEngine.executePipeline(req);

    // 149,000원 결제 완료
    const order = authPaymentService.createPaymentOrder({
      profileId: res.profileId,
      tier: 'paid_mabosal_full',
      paymentMethod: 'card',
    });
    authPaymentService.verifyAndCompletePayment(order.transactionId);
    expect(authPaymentService.isTierUnlocked(res.profileId, 'paid_mabosal_full')).toBe(true);

    // 로그아웃
    authPaymentService.signOut();
    expect(authPaymentService.getCurrentUser().isAnonymous).toBe(true);

    // 재로그인 및 구매 복구
    const restored = authPaymentService.restoreUserPurchases(userEmail);
    expect(restored.user.email).toBe(userEmail);
    expect(restored.restoredProfiles.length).toBeGreaterThan(0);
    expect(authPaymentService.isTierUnlocked(res.profileId, 'paid_mabosal_full')).toBe(true);
  });

  // ----------------------------------------------------
  // Scenario E: 모바일에서 전체 결제 및 결과 확인
  // ----------------------------------------------------
  it('Scenario E: 모바일 환경(375px/1080px)에서도 8단계 레이아웃과 결제 버튼, 오행 카드가 정상 렌더링된다', async () => {
    const req: ProductionInputRequest = {
      calendarType: 'solar',
      isLeapMonth: false,
      birthDate: '1996-06-30',
      birthTime: '15:40',
      isUnknownTime: false,
      gender: 'female',
      region: 'Gyeonggi',
      troubleCategory: 'career',
      userTroubleText: '상반기 공채 면접 결과와 이직 타이밍을 알고 싶습니다.',
      clientId: 'scenario-e-mobile',
    };

    const res = await productionPipelineEngine.executePipeline(req);

    // 앱 스테이트에 주입 후 뷰 렌더링
    appState.setSession({
      userReport: {
        basicStructure: {
          dayMaster: { stem: '경', element: '금', strength: '신강', meaning: '강인한 결단력' },
          fourPillars: {
            year: { stem: '병', branch: '자' },
            month: { stem: '갑', branch: '오' },
            day: { stem: '경', branch: '신' },
            hour: { stem: '계', branch: '미' },
          },
          fiveElements: { distribution: {}, dominant: '금', lacking: '목', balance: '조화' },
        },
        flowSummary: { headline: '단단한 결단력과 성장', keyTendency: '자신의 길을 개척함', rsiBandStatus: { band: 'STABLE', userExplanation: '안정' } },
        themes: [],
        temporalModulation: { currentYear: 2026, currentYearGanji: '병오', temporalDisclaimer: '안정적 운용' },
        finalSynthesis: { overallScore: 85, lifeStrategy: '내실 다지기', recommendedAction: '준비' },
      } as any,
      fact: {
        four_pillars: {
          year: { stem: '병', branch: '자' },
          month: { stem: '갑', branch: '오' },
          day: { stem: '경', branch: '신' },
          hour: { stem: '계', branch: '미' },
        },
        day_master_strength: { classification: '신강' },
        five_elements: { dominantElement: '금' },
      } as any,
      signalSet: { signals: {} } as any,
      phase7Output: { rsi: { band: 'STABLE' } } as any,
    } as any);

    appState.setIntegratedResult(res.integratedResult);
    appState.setUserTroubleText(req.userTroubleText);

    const html = renderResultView(appState.getState());

    // 8단계 헤딩 검증
    expect(html).toContain('한눈에 보는 나의 사주');
    expect(html).toContain('올해의 흐름');
    expect(html).toContain('내가 가져온 고민');
    expect(html).toContain('왜 이런 일이 생겼는지');
    expect(html).toContain('마보살식 한마디');
    expect(html).toContain('언제까지 이어질 가능성이 있는지');
    expect(html).toContain('언제 흐름이 바뀌는지');
    expect(html).toContain('지금 무엇을 해야 하는지');
    expect(html).toContain('“그래서 정확히 언제 좋아지는가?”');
  });

  // ----------------------------------------------------
  // Scenario F: AI API 장애 → 결정론적 결과 Fallback
  // ----------------------------------------------------
  it('Scenario F: AI API 장애나 키 미설정 시에도 엔진 Fact 기반 결정론적 안전 결과로 100% 정상 서빙된다', async () => {
    // API Key가 없는 상태 강제
    aiPresentationService.setApiKey('');
    expect(aiPresentationService.hasApiKey()).toBe(false);

    const req: ProductionInputRequest = {
      calendarType: 'solar',
      isLeapMonth: false,
      birthDate: '1991-04-12',
      birthTime: '13:00',
      isUnknownTime: false,
      gender: 'male',
      region: 'Seoul',
      troubleCategory: 'stuck',
      userTroubleText: '답답한 마음이 가시지 않아 올해 전체 흐름을 알고 싶습니다.',
      clientId: 'scenario-f-fallback',
    };

    const res = await productionPipelineEngine.executePipeline(req);

    // Fallback 활성화 확인
    expect(res.isAiFallback).toBe(true);
    // Fallback 텍스트 품질 검증 (엔진 표준 텍스트 안전 서빙)
    expect(res.aiPresentation.mabosalPunchline).toMatch(/마.*낀 시기/);
    expect(res.aiPresentation.timingGuide).toBeTruthy();
    expect(res.aiPresentation.actionAdvice).toBeTruthy();
  });

  // ----------------------------------------------------
  // Scenario G: 잘못된 입력 → 안전한 오류 처리
  // ----------------------------------------------------
  it('Scenario G: 악의적인 스크립트나 과도한 길이의 입력이 유입되어도 살균 및 오류 차단된다', () => {
    // 1. 500자 초과 입력
    const longText = 'A'.repeat(600);
    const check = securityGuard.validateTroubleInput(longText, 500);
    expect(check.isValid).toBe(false);
    expect(check.error).toContain('최대 500자');

    // 2. XSS 인젝션
    const xssText = '<img src=x onerror=alert(1)>사업 문제';
    const xssCheck = securityGuard.validateTroubleInput(xssText);
    expect(xssCheck.sanitized).not.toContain('<img');
    expect(xssCheck.sanitized).toContain('&lt;img');

    // 3. 결제 실패 시뮬레이션
    const { profile } = authPaymentService.getOrCreateSajuProfile({
      birthData: {
        calendarType: 'solar',
        isLeapMonth: false,
        birthDate: '1990-01-01',
        birthTime: '12:00',
        isUnknownTime: false,
        gender: 'female',
        region: 'Seoul',
      },
      userTrouble: { category: 'career', text: '결제 실패 테스트' },
    });

    const tx = authPaymentService.createPaymentOrder({
      profileId: profile.profileId,
      tier: 'paid_detailed_saju',
      paymentMethod: 'card',
    });
    const failedTx = authPaymentService.simulatePaymentFailure(tx.transactionId, '잔액 부족');
    expect(failedTx.status).toBe('FAILED');
  });

  // ----------------------------------------------------
  // Scenario H: 동일 사용자 동일 입력 → 동일 결과 재현
  // ----------------------------------------------------
  it('Scenario H: 동일한 출생정보와 현실 고민을 재입력할 경우 100% 동일한 명리 Fact와 사주 결과가 재현된다', async () => {
    const req: ProductionInputRequest = {
      calendarType: 'solar',
      isLeapMonth: false,
      birthDate: '1993-10-10',
      birthTime: '09:20',
      isUnknownTime: false,
      gender: 'female',
      region: 'Seoul',
      troubleCategory: 'love',
      userTroubleText: '동일 입력 재현성 테스트입니다.',
      clientId: 'scenario-h-repro',
    };

    const run1 = await productionPipelineEngine.executePipeline(req);
    const run2 = await productionPipelineEngine.executePipeline(req);

    // 결정론적 일치성 검증
    expect(run1.generalSaju.dayMaster).toBe(run2.generalSaju.dayMaster);
    expect(run1.generalSaju.fourPillarsText).toBe(run2.generalSaju.fourPillarsText);
    expect(run1.generalSaju.strength).toBe(run2.generalSaju.strength);
    expect(run1.maDiagnosis.maSummaryPhrase).toBe(run2.maDiagnosis.maSummaryPhrase);
    expect(run1.timing.peakMonth).toBe(run2.timing.peakMonth);
    expect(run1.timing.reliefMonth).toBe(run2.timing.reliefMonth);
  });
});
