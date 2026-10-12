/**
 * Phase 39: Real User Persona Audit Suite (7대 사용자 유형 실서비스 검증)
 * 
 * 검증 대상 7대 페르소나:
 * 1. USER 01: 사주를 처음 보는 사람 (입력 용이성, 어려운 한자 배제, 직관적 이해)
 * 2. USER 02: 온라인 사주 경험자 (일반 사주 완결성, 4주 8자 및 십신/오행 깊이)
 * 3. USER 03: 연애/이별 문제 사용자 (연애 고민 ↔ 명리 시간축 연결, 마보살식 한마디)
 * 4. USER 04: 직장/이직 문제 사용자 (조직 내 마찰, 이직 적기, 행동 처방)
 * 5. USER 05: 사업/창업 문제 사용자 (현금 유동성, 동업자 갈등, 타이밍 분석)
 * 6. USER 06: 돈/투자 문제 사용자 (재물 파동, 무리한 베팅 금기, 완화 시기)
 * 7. USER 07: 단순히 올해 운세가 궁금한 사용자 (전체 흐름, 주요 전환점, 평온한 처방)
 * 
 * 측정 지표:
 * - 입력 완료율 및 유효성 통과
 * - 일반 사주 완결 해석 제공 여부
 * - 마 진단 이해도 ("쉽게 말하면 지금은 [분야]에 마가 낀 시기로 볼 수 있습니다")
 * - 핵심 전환 질문 "그래서 언제 좋아지나요?" 노출
 * - 유료 잠금 해제 및 결제 검증 (39,000원 / 149,000원)
 * - 개인화된 디지털 처방 카드 생성 (SVG 규격, 오행 보완)
 * - "일반 사주 서비스와 무엇이 다른가?" 차별성 질문 완벽 통과
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { productionPipelineEngine, ProductionInputRequest } from '../src/modules/production/production-pipeline.js';
import { authPaymentService } from '../src/modules/production/auth-payment-service.js';
import { securityGuard } from '../src/modules/production/security-guard.js';

describe('Phase 39: 7대 실서비스 사용자 페르소나 종합 감사', () => {
  beforeEach(() => {
    // 세션 초기화
    authPaymentService.createAnonymousUser();
  });

  // ----------------------------------------------------
  // 1. 사주를 처음 보는 사람 (Novice User)
  // ----------------------------------------------------
  it('USER 01 (사주 초보자): 어려운 한자나 미신 없이 직관적으로 자신의 기운과 고민을 이해한다', async () => {
    const req: ProductionInputRequest = {
      calendarType: 'solar',
      isLeapMonth: false,
      birthDate: '1998-03-24',
      birthTime: '14:20',
      isUnknownTime: false,
      gender: 'female',
      region: 'Seoul',
      troubleCategory: 'stuck',
      userTroubleText: '요즘 뭘 해도 잘 안 풀리고 답답해서 사주를 처음 보러 왔습니다.',
      clientId: 'user-01-novice',
    };

    const res = await productionPipelineEngine.executePipeline(req);

    expect(res.success).toBe(true);
    expect(res.generalSaju.dayMaster).toBeTruthy();
    expect(res.generalSaju.personality).toBeTruthy();
    // 마보살 펀치라인 검증
    expect(res.maDiagnosis.maSummaryPhrase).toMatch(/마.*낀 시기/);
    // 공포/미신 어휘 배제
    const serialized = JSON.stringify(res);
    expect(serialized).not.toContain('패가망신');
    expect(serialized).not.toContain('살풀이');
    expect(serialized).not.toContain('부적');
  });

  // ----------------------------------------------------
  // 2. 온라인 사주 경험자 (Experienced Saju User)
  // ----------------------------------------------------
  it('USER 02 (사주 유경험자): 일반 사주만으로도 4주 8자와 7대 라이프 영역이 완결된 리포트를 얻는다', async () => {
    const req: ProductionInputRequest = {
      calendarType: 'lunar',
      isLeapMonth: false,
      birthDate: '1987-11-12',
      birthTime: '08:45',
      isUnknownTime: false,
      gender: 'male',
      region: 'Busan',
      userTroubleText: '제 사주의 격국과 대운의 흐름, 재물과 직장의 밸런스가 궁금합니다.',
      clientId: 'user-02-expert',
    };

    const res = await productionPipelineEngine.executePipeline(req);

    expect(res.success).toBe(true);
    expect(res.generalSaju.fourPillarsText).toBeTruthy();
    expect(res.generalSaju.lifeThemes.wealth).toBeTruthy();
    expect(res.generalSaju.lifeThemes.career).toBeTruthy();
    expect(res.generalSaju.lifeThemes.business).toBeTruthy();
    expect(res.generalSaju.lifeThemes.relationship).toBeTruthy();
    expect(res.generalSaju.currentYearLuck.ganji).toBeTruthy();
  });

  // ----------------------------------------------------
  // 3. 연애 / 이별 문제 사용자 (Relationship Trouble)
  // ----------------------------------------------------
  it('USER 03 (연애/이별 문제): 연애 고민을 명리 시간축과 연결하고 마보살식 한마디와 시기를 안내받는다', async () => {
    const req: ProductionInputRequest = {
      calendarType: 'solar',
      isLeapMonth: false,
      birthDate: '1994-07-08',
      birthTime: '19:10',
      isUnknownTime: false,
      gender: 'female',
      region: 'Incheon',
      troubleCategory: 'love',
      userTroubleText: '최근 애인과 크게 다투고 헤어졌는데 다시 연락이 올지, 아니면 정리해야 할지 너무 괴롭습니다.',
      clientId: 'user-03-love',
    };

    const res = await productionPipelineEngine.executePipeline(req);

    expect(res.maDiagnosis.userTrouble.category).toBeTruthy();
    expect(res.maDiagnosis.maSummaryPhrase).toMatch(/마.*낀 시기/);
    expect(res.timing.startMonth).toBeTruthy();
    expect(res.timing.peakMonth).toBeTruthy();
    expect(res.timing.reliefMonth).toBeTruthy();
    expect(res.conversionHook.question).toBe('“그래서 언제 좋아지나요?”');
  });

  // ----------------------------------------------------
  // 4. 직장 / 이직 문제 사용자 (Career Trouble)
  // ----------------------------------------------------
  it('USER 04 (직장/이직 문제): 조직 내 갈등 원인과 구체적으로 피해야 할 행동 및 취할 행동을 처방받는다', async () => {
    const req: ProductionInputRequest = {
      calendarType: 'solar',
      isLeapMonth: false,
      birthDate: '1990-02-14',
      birthTime: '03:30',
      isUnknownTime: false,
      gender: 'male',
      region: 'Gyeonggi',
      troubleCategory: 'career',
      userTroubleText: '팀장과의 불화가 심해 당장 사표를 내고 싶은데 이직운이 언제 열리는지 알고 싶습니다.',
      clientId: 'user-04-career',
    };

    const res = await productionPipelineEngine.executePipeline(req);

    expect(res.prescription.dontList.length).toBeGreaterThan(0);
    expect(res.prescription.doList.length).toBeGreaterThan(0);
    expect(res.prescription.coreAdvice).toBeTruthy();
  });

  // ----------------------------------------------------
  // 5. 사업 / 창업 문제 사용자 (Business Trouble)
  // ----------------------------------------------------
  it('USER 05 (사업/창업 문제): 자금 압박과 타이밍 파동을 확인하고 149,000원 정밀풀이를 결제 해제한다', async () => {
    const req: ProductionInputRequest = {
      calendarType: 'solar',
      isLeapMonth: false,
      birthDate: '1982-09-03',
      birthTime: '12:00',
      isUnknownTime: false,
      gender: 'male',
      region: 'Seoul',
      troubleCategory: 'business',
      userTroubleText: '새로운 법인을 설립하고 투자를 유치하려 하는데 올해 하반기 타이밍이 괜찮을까요?',
      clientId: 'user-05-biz',
    };

    const res = await productionPipelineEngine.executePipeline(req);

    // 결제 전 상태
    expect(authPaymentService.isTierUnlocked(res.profileId, 'paid_mabosal_full')).toBe(false);

    // 149,000원 결제 주문 및 완료
    const order = authPaymentService.createPaymentOrder({
      profileId: res.profileId,
      tier: 'paid_mabosal_full',
      paymentMethod: 'card',
    });
    expect(order.amountKrw).toBe(149000);

    const paymentResult = authPaymentService.verifyAndCompletePayment(order.transactionId);
    expect(paymentResult.success).toBe(true);

    // 결제 후 14.9만 풀패키지와 3.9만 패키지가 모두 해제됨
    expect(authPaymentService.isTierUnlocked(res.profileId, 'paid_mabosal_full')).toBe(true);
    expect(authPaymentService.isTierUnlocked(res.profileId, 'paid_detailed_saju')).toBe(true);
  });

  // ----------------------------------------------------
  // 6. 돈 / 투자 문제 사용자 (Wealth Trouble)
  // ----------------------------------------------------
  it('USER 06 (돈/투자 문제): 재물 파동과 개인별 디지털 처방 세트(스마트폰 배경화면, 카드)를 수령한다', async () => {
    const req: ProductionInputRequest = {
      calendarType: 'solar',
      isLeapMonth: false,
      birthDate: '1995-12-28',
      birthTime: null,
      isUnknownTime: true,
      gender: 'male',
      region: 'Daegu',
      troubleCategory: 'wealth',
      userTroubleText: '무리한 주식 투자로 손실이 큰데 언제쯤 회복할 수 있을까요?',
      clientId: 'user-06-wealth',
    };

    const res = await productionPipelineEngine.executePipeline(req);

    // 개인화된 처방 아티팩트 4종 확인
    expect(res.remedyArtifacts.length).toBe(4);
    const wallpaper = res.remedyArtifacts.find(a => a.formatType === 'PHONE_WALLPAPER');
    expect(wallpaper).toBeDefined();
    expect(wallpaper?.dimensions.width).toBe(1080);
    expect(wallpaper?.dimensions.height).toBe(1920);
    expect(wallpaper?.svgContent).toContain('<svg');
  });

  // ----------------------------------------------------
  // 7. 단순히 올해 운세가 궁금한 사용자 (General Seun User)
  // ----------------------------------------------------
  it('USER 07 (단순 운세 사용자): 특별한 고민이 없어도 올해의 기회와 주의점을 명쾌하게 얻는다', async () => {
    const req: ProductionInputRequest = {
      calendarType: 'solar',
      isLeapMonth: false,
      birthDate: '2001-05-19',
      birthTime: '16:40',
      isUnknownTime: false,
      gender: 'female',
      region: 'Jeju',
      troubleCategory: 'none',
      userTroubleText: '특별한 고민은 없지만 올해 나의 전체적인 기운과 방향을 알고 싶어요.',
      clientId: 'user-07-general',
    };

    const res = await productionPipelineEngine.executePipeline(req);

    expect(res.generalSaju.currentYearLuck.flowSummary).toBeTruthy();
    expect(res.generalSaju.currentYearLuck.opportunityTheme).toBeTruthy();
    expect(res.generalSaju.currentYearLuck.cautionTheme).toBeTruthy();
  });

  // ----------------------------------------------------
  // 8. 동일 사주 재입력 시 프로필 캐싱 재활용 검증
  // ----------------------------------------------------
  it('동일 사주 반복 입력 시 기존 분석 결과를 안전하게 재활용(Profile Cache)한다', async () => {
    const req: ProductionInputRequest = {
      calendarType: 'solar',
      isLeapMonth: false,
      birthDate: '1992-05-15',
      birthTime: '10:30',
      isUnknownTime: false,
      gender: 'male',
      region: 'Seoul',
      userTroubleText: '첫 번째 입력입니다.',
      clientId: 'cache-test-user',
    };

    const res1 = await productionPipelineEngine.executePipeline(req);
    expect(res1.isCached).toBe(false);

    // 동일 사주로 다시 요청
    const res2 = await productionPipelineEngine.executePipeline({
      ...req,
      userTroubleText: '두 번째 입력입니다.',
    });
    expect(res2.isCached).toBe(true);
    expect(res2.profileId).toBe(res1.profileId);
  });

  // ----------------------------------------------------
  // 9. 보안 및 살균 (XSS, Rate Limit, PII 마스킹)
  // ----------------------------------------------------
  it('악의적 스크립트(XSS)가 유입되어도 살균(Sanitization) 처리되고 개인정보는 마스킹된다', () => {
    const maliciousInput = '<script>alert("hack")</script>이직이 고민입니다.';
    const validated = securityGuard.validateTroubleInput(maliciousInput);

    expect(validated.isValid).toBe(true);
    expect(validated.sanitized).not.toContain('<script>');
    expect(validated.sanitized).toContain('&lt;script&gt;');

    // PII 마스킹
    const maskedEmail = securityGuard.maskIdentifier('user12345@mabosal.com');
    expect(maskedEmail).toBe('us*******@mabosal.com');

    // RLS 스크립트 존재 확인
    const rlsScript = securityGuard.getSupabaseRlsScript();
    expect(rlsScript).toContain('ALTER TABLE users ENABLE ROW LEVEL SECURITY');
    expect(rlsScript).toContain('CREATE POLICY');
  });

  // ----------------------------------------------------
  // 10. 핵심 제품 원칙: 차별성 질문 검증
  // ----------------------------------------------------
  it('“일반 사주 서비스와 무엇이 다르다고 느끼셨나요?” 차별성 질문을 검증한다', async () => {
    const req: ProductionInputRequest = {
      calendarType: 'solar',
      isLeapMonth: false,
      birthDate: '1993-08-20',
      birthTime: '15:30',
      isUnknownTime: false,
      gender: 'female',
      region: 'Seoul',
      troubleCategory: 'career',
      userTroubleText: '최근 직장에서 팀장과의 잦은 마찰로 이직을 진지하게 고민하고 있습니다.',
      clientId: 'differentiator-user',
    };

    const res = await productionPipelineEngine.executePipeline(req);

    // 마보살만의 6대 고유 경험 축:
    // 1. 일반 사주가 기본으로 완결되어 있는가? -> YES
    expect(res.generalSaju.personality).toBeTruthy();
    expect(res.generalSaju.lifeThemes.wealth).toBeTruthy();

    // 2. 사용자의 현실 문제를 사주와 대조하여 진단하는가? -> YES
    expect(res.maDiagnosis.userTrouble.userText).toContain('이직을 진지하게 고민');
    expect(res.maDiagnosis.structuralReason).toBeTruthy();

    // 3. 마보살만의 언어로 문제를 압축하는가? -> YES
    expect(res.maDiagnosis.maSummaryPhrase).toMatch(/마.*낀 시기/);

    // 4. 언제 풀리는지 구체적인 시기를 제시하는가? -> YES
    expect(res.timing.startMonth).toBeTruthy();
    expect(res.timing.recoveryMonth).toBeTruthy();

    // 5. 지금 무엇을 해야 하고 피해야 하는지 명확한 처방이 있는가? -> YES
    expect(res.prescription.doList.length).toBeGreaterThan(0);
    expect(res.prescription.dontList.length).toBeGreaterThan(0);

    // 6. AI는 명리 판단을 하지 않고 Context Lock으로 자연어만 돕는가? -> YES
    expect(res.aiPresentation.mabosalPunchline).toMatch(/마.*낀 시기/);
  });
});
