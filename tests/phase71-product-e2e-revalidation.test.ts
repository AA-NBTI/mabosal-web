/**
 * tests/phase71-product-e2e-revalidation.test.ts
 * 
 * Phase 71: 동적 상품 구조 변경 영향 재감사 및 E2E 검증 테스트 스위트
 * 
 * "상품은 고정된 단계가 아니다. 모듈은 고정하고, 상품은 조합한다."
 * 
 * 23대 정밀 검증 항목:
 * - PRODUCT-RE-01: 과거 상품 구조 잔존 검사 (고정 티어 하드코딩 제거 및 ProductConfig 중심 확인)
 * - PRODUCT-RE-02: ProductConfig 정합성 (10개 필드 무손실 반영 검증)
 * - PRODUCT-RE-03: 동적 모듈 선택 (문제 영역에 따른 맞춤 모듈 추천)
 * - PRODUCT-RE-04: 해석 깊이 차이 (LEVEL 1 ~ 5 계층적 리포트 실질적 차별화)
 * - PRODUCT-RE-05: 사건 진단 연결 (Phase 69 EventDiagnosisResult 연계)
 * - PRODUCT-RE-06: 마·살 연결 (Phase 68 MagaDiagnosisResult 연계)
 * - PRODUCT-RE-07: 처방 연결 (Phase 70 PrescriptionEngine 연계)
 * - PRODUCT-RE-08: 가격 독립성 (가격 변경이 명리·사건·마살·처방 결과에 영향 0)
 * - PRODUCT-RE-09: 점수 독립성 (처방 5종 점수 및 11개 평가 점수 독립 보존)
 * - PRODUCT-RE-10: 동일 명식 / 다른 문제 (사주 같으나 사업 vs 연애일 때 결과 분기)
 * - PRODUCT-RE-11: 다른 명식 / 동일 문제 (문제 같으나 사주 다를 때 근거 분기)
 * - PRODUCT-RE-12: 상품 구성 차별성 (동일 문제에서 Product A / B / C 실질적 가치 증가)
 * - PRODUCT-RE-13: 명리 원천 데이터 불변 (상품 설정/가격 변경 시 원천 계산 불변)
 * - PRODUCT-RE-14: HEALTH 안전성 (의료 면책 및 전문의 상담 권고)
 * - PRODUCT-RE-15: MONEY 안전성 (금융 면책 및 수익 보장 배제)
 * - PRODUCT-RE-16: BUSINESS 안전성 (계약 서면화 및 법률/세무 자문 권고)
 * - PRODUCT-RE-17: 결정론 (동일 입력 10회 반복 실행 100% 동일)
 * - PRODUCT-RE-18: CASE 01 E2E 실전 검증 (1992-03-15 연애 × 3 ProductConfigs)
 * - PRODUCT-RE-19: CASE 02 E2E 실전 검증 (1988-12-10 사업 × 3 ProductConfigs)
 * - PRODUCT-RE-20: CASE 03 E2E 실전 검증 (1995-05-20 직장 × 3 ProductConfigs)
 * - PRODUCT-RE-21: CASE 04 E2E 실전 검증 (1982-04-05 재물 × 3 ProductConfigs)
 * - PRODUCT-RE-22: CASE 05 E2E 실전 검증 (1986-08-15 건강 × 3 ProductConfigs)
 * - PRODUCT-RE-23: 전체 회귀 (19개 모듈 + 분석기 + 매퍼 + 진단엔진 + 상품생성기 통합)
 */

import { describe, it, expect } from 'vitest';
import {
  ProductGenerator,
  productEvaluator,
  ProductConfig,
  UserProblemInput,
  ProductGenerationResult,
} from '../src/modules/product-generator/index.js';
import { moduleRegistry } from '../src/modules/modular/module-registry.js';
import { IntegratedAnalyzer } from '../src/modules/modular/integrated-analyzer.js';

describe('Phase 71: 동적 상품 구조 변경 영향 재감사 및 E2E 검증 Test Suite', () => {
  const generator = new ProductGenerator();
  const analyzer = new IntegratedAnalyzer();

  // CASE 01 ~ 05 표준 사건 데이터
  const cases: {
    id: string;
    domain: 'LOVE' | 'BUSINESS' | 'JOB' | 'MONEY' | 'HEALTH';
    birthDate: string;
    birthTime: string;
    gender: 'male' | 'female';
    eventDate: string;
    currentConcern: string;
    eventDescription: string;
    desiredQuestion: string;
  }[] = [
    {
      id: 'CASE 01',
      domain: 'LOVE',
      birthDate: '1992-03-15',
      birthTime: '08:30',
      gender: 'male',
      eventDate: '2024-03-15',
      currentConcern: '연인과 결별했습니다.',
      eventDescription: '연인과 2년간 교제 끝에 성격 차이와 잦은 다툼으로 헤어졌습니다.',
      desiredQuestion: '왜 이런 이별을 겪어야 했고, 재회 가능성이 있는지 알고 싶습니다.',
    },
    {
      id: 'CASE 02',
      domain: 'BUSINESS',
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female',
      eventDate: '2024-05-20',
      currentConcern: '거래처 부도와 동업자 지분 분쟁입니다.',
      eventDescription: '주요 거래처가 연쇄 부도 처리되고 동업자가 지분 매각을 요구하며 회사가 폐업 위기입니다.',
      desiredQuestion: '손실을 막고 회사를 살리기 위해 어떻게 법적·재정적 방어를 해야 합니까?',
    },
    {
      id: 'CASE 03',
      domain: 'JOB',
      birthDate: '1995-05-20',
      birthTime: '18:30',
      gender: 'male',
      eventDate: '2025-02-10',
      currentConcern: '직장 상사 갈등과 인사 불이익입니다.',
      eventDescription: '새로 부임한 부서장과 업무 방식 차이로 갈등을 빚어 인사고과에서 최하점을 받았습니다.',
      desiredQuestion: '퇴사 후 이직을 하는 것이 나을지, 버티는 것이 나을지 타이밍을 알고 싶습니다.',
    },
    {
      id: 'CASE 04',
      domain: 'MONEY',
      birthDate: '1982-04-05',
      birthTime: '06:00',
      gender: 'male',
      eventDate: '2024-06-15',
      currentConcern: '무리한 투자 실패와 부채 증가입니다.',
      eventDescription: '부동산 갭투자와 레버리지 투자 실패로 막대한 이자 부담과 채무 압박에 시달리고 있습니다.',
      desiredQuestion: '현금 흐름을 회복하고 손실을 최소화할 수 있는 해결책은 무엇입니까?',
    },
    {
      id: 'CASE 05',
      domain: 'HEALTH',
      birthDate: '1986-08-15',
      birthTime: '16:00',
      gender: 'male',
      eventDate: '2024-08-01',
      currentConcern: '급격한 건강 악화 및 수술 권유입니다.',
      eventDescription: '극심한 허리 통증으로 병원을 찾았다가 척추 디스크 파열로 긴급 수술을 권유받았습니다.',
      desiredQuestion: '지금 바로 수술을 받는 것이 맞는지, 신체 회복 주기는 언제인지 알고 싶습니다.',
    },
  ];

  // 9절: 동적 3종 ProductConfig 생성 헬퍼
  function createDynamicConfigs(domain: string): {
    productA: Partial<ProductConfig>;
    productB: Partial<ProductConfig>;
    productC: Partial<ProductConfig>;
  } {
    // Product A: 최소 핵심 모듈, LEVEL 1, 기본 개인화, 처방 최소
    const productA: Partial<ProductConfig> = {
      productId: `PROD_DYN_${domain}_A`,
      productName: `[기본 분석] ${domain} 명리 기초 지표 리포트`,
      insightDepth: 1,
      selectedModules: ['CORE_ORIGINAL', 'TEN_GODS'],
      personalizedMapping: false,
      caseExplanation: false,
      timingAnalysis: false,
      responseGuidance: false,
      prescription: false,
      price: 19900,
    };

    // Product B: 핵심 모듈 + 시간축, LEVEL 3~4, 개인화 확대, 사건 연결
    const productB: Partial<ProductConfig> = {
      productId: `PROD_DYN_${domain}_B`,
      productName: `[집중 분석] ${domain} 위기 인과 규명 및 타이밍 로드맵`,
      insightDepth: 4,
      selectedModules: ['CORE_ORIGINAL', 'TEN_GODS', 'RELATION', 'DAEWUN', 'SEUN', domain as any],
      personalizedMapping: true,
      caseExplanation: true,
      timingAnalysis: true,
      responseGuidance: true,
      prescription: false,
      price: 59900,
    };

    // Product C: 전체 관련 모듈, LEVEL 5, 시간축, 사건/마·살 연결, 환경/행동 처방, 처방물, 우선순위
    const productC: Partial<ProductConfig> = {
      productId: `PROD_DYN_${domain}_C`,
      productName: `[프리미엄 종합] ${domain} 전면 진단 및 1:1 맞춤 행동 처방 솔루션`,
      insightDepth: 5,
      selectedModules: [
        'CORE_ORIGINAL',
        'TEN_GODS',
        'RELATION',
        'SINSAL',
        'DAEWUN',
        'SEUN',
        domain as any,
        'MAGA_DIAGNOSIS',
        'PRESCRIPTION',
      ],
      personalizedMapping: true,
      caseExplanation: true,
      timingAnalysis: true,
      responseGuidance: true,
      prescription: true,
      price: 149900,
    };

    return { productA, productB, productC };
  }

  // ==========================================================================
  // PRODUCT-RE-01: 과거 상품 구조 잔존 검사
  // ==========================================================================
  it('PRODUCT-RE-01: ProductGenerator는 고정 티어(FREE/39K/149K)에 의존하지 않고 ProductConfig 기반으로 동작해야 한다', () => {
    const c = cases[1];
    const arbitraryPrice = 47500;
    const result = generator.generateProduct(
      {
        birthDate: c.birthDate,
        birthTime: c.birthTime,
        gender: c.gender,
        currentEvent: c.currentConcern,
        userTrouble: c.eventDescription,
      },
      {
        productId: 'CUSTOM_TEST_001',
        insightDepth: 3,
        price: arbitraryPrice,
      }
    );

    expect(result.productId).toBe('CUSTOM_TEST_001');
    expect(result.pricing.calculatedPrice).toBe(arbitraryPrice);
    expect(result.config.insightDepth).toBe(3);
  });

  // ==========================================================================
  // PRODUCT-RE-02: ProductConfig 정합성
  // ==========================================================================
  it('PRODUCT-RE-02: ProductConfig의 10개 필드가 생성 결과에 무손실 반영되어야 한다', () => {
    const c = cases[0];
    const customConfig: ProductConfig = {
      productId: 'CFG_VERIFY_10',
      productName: '맞춤형 검증 상품',
      targetProblem: c.currentConcern,
      selectedModules: ['CORE_ORIGINAL', 'TEN_GODS', 'LOVE', 'PRESCRIPTION'],
      insightDepth: 5,
      caseExplanation: true,
      personalizedMapping: true,
      timingAnalysis: true,
      responseGuidance: true,
      prescription: true,
      price: 89000,
    };

    const result = generator.generateProduct(
      {
        birthDate: c.birthDate,
        birthTime: c.birthTime,
        gender: c.gender,
        currentEvent: c.currentConcern,
      },
      customConfig
    );

    expect(result.config.productId).toBe(customConfig.productId);
    expect(result.config.productName).toBe(customConfig.productName);
    expect(result.config.insightDepth).toBe(5);
    expect(result.config.caseExplanation).toBe(true);
    expect(result.config.personalizedMapping).toBe(true);
    expect(result.config.timingAnalysis).toBe(true);
    expect(result.config.responseGuidance).toBe(true);
    expect(result.config.prescription).toBe(true);
    expect(result.config.price).toBe(89000);
    expect(result.config.selectedModules).toEqual(customConfig.selectedModules);
  });

  // ==========================================================================
  // PRODUCT-RE-03: 동적 모듈 선택
  // ==========================================================================
  it('PRODUCT-RE-03: 문제 영역(BUSINESS, LOVE, HEALTH 등)에 따라 추천 모듈이 동적으로 달라져야 한다', () => {
    const bizRes = generator.generateProduct({
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female',
      currentEvent: '거래처 부도와 계약 파기 분쟁',
    });

    const loveRes = generator.generateProduct({
      birthDate: '1992-03-15',
      birthTime: '08:30',
      gender: 'male',
      currentEvent: '연인과 결별 및 이별 상처',
    });

    expect(bizRes.classification.primaryDomain).toBe('BUSINESS');
    expect(loveRes.classification.primaryDomain).toBe('LOVE');
    expect(bizRes.classification.recommendedModules).toContain('BUSINESS');
    expect(loveRes.classification.recommendedModules).toContain('LOVE');
    expect(bizRes.classification.recommendedModules).not.toEqual(loveRes.classification.recommendedModules);
  });

  // ==========================================================================
  // PRODUCT-RE-04: 해석 깊이 차이
  // ==========================================================================
  it('PRODUCT-RE-04: insightDepth(LEVEL 1~5)에 따라 리포트 섹션 및 콘텐츠가 실질적으로 계층화되어야 한다', () => {
    const c = cases[1];
    const userInput: UserProblemInput = {
      birthDate: c.birthDate,
      birthTime: c.birthTime,
      gender: c.gender,
      currentEvent: c.currentConcern,
      userTrouble: c.eventDescription,
    };

    const res1 = generator.generateProduct(userInput, { insightDepth: 1, prescription: false });
    const res3 = generator.generateProduct(userInput, { insightDepth: 3 });
    const res5 = generator.generateProduct(userInput, { insightDepth: 5 });

    expect(res1.depthReport.level).toBe(1);
    expect(res1.depthReport.sections.length).toBe(1);

    expect(res3.depthReport.level).toBe(3);
    expect(res3.depthReport.sections.length).toBe(3);

    expect(res5.depthReport.level).toBe(5);
    expect(res5.depthReport.sections.length).toBe(5);

    // 섹션 텍스트 총량 및 깊이가 단계적으로 증가해야 함
    expect(res5.depthReport.fullDocument.length).toBeGreaterThan(res3.depthReport.fullDocument.length);
    expect(res3.depthReport.fullDocument.length).toBeGreaterThan(res1.depthReport.fullDocument.length);
  });

  // ==========================================================================
  // PRODUCT-RE-05: 사건 진단 연결
  // ==========================================================================
  it('PRODUCT-RE-05: Level 3 이상에서 Phase 69 사건 진단 엔진이 유기적으로 연계되어야 한다', () => {
    const c = cases[1];
    const result = generator.generateProduct(
      {
        birthDate: c.birthDate,
        birthTime: c.birthTime,
        gender: c.gender,
        currentEvent: c.currentConcern,
        userTrouble: c.eventDescription,
      },
      { insightDepth: 4, personalizedMapping: true }
    );

    expect(result.eventDiagnosis).toBeDefined();
    expect(result.eventDiagnosis.eventDomain).toBe('BUSINESS');
    expect(result.eventDiagnosis.causalCandidates.length).toBeGreaterThan(0);
    expect(result.eventDiagnosis.timeAxisContext.length).toBeGreaterThan(0);
  });

  // ==========================================================================
  // PRODUCT-RE-06: 마·살 연결
  // ==========================================================================
  it('PRODUCT-RE-06: 동일 명식이라도 BUSINESS와 LOVE 문제에 따라 마·살 진단 카테고리와 타깃이 다르게 연결되어야 한다', () => {
    const c = cases[0]; // 1992-03-15

    const loveRes = generator.generateProduct(
      {
        birthDate: c.birthDate,
        birthTime: c.birthTime,
        gender: c.gender,
        currentEvent: '연인과 결별하여 극심한 상실감을 겪고 있습니다.',
      },
      { selectedModules: ['CORE_ORIGINAL', 'MAGA_DIAGNOSIS'], insightDepth: 3 }
    );

    const bizRes = generator.generateProduct(
      {
        birthDate: c.birthDate,
        birthTime: c.birthTime,
        gender: c.gender,
        currentEvent: '신규 창업 계약에서 동업자에게 배신당했습니다.',
      },
      { selectedModules: ['CORE_ORIGINAL', 'MAGA_DIAGNOSIS'], insightDepth: 3 }
    );

    expect(loveRes.classification.primaryDomain).toBe('LOVE');
    expect(bizRes.classification.primaryDomain).toBe('BUSINESS');
    expect(loveRes.magaDiagnosis).toBeDefined();
    expect(bizRes.magaDiagnosis).toBeDefined();
    expect(loveRes.magaDiagnosis.category).not.toBe(bizRes.magaDiagnosis.category);
    expect(loveRes.magaDiagnosis.punchline).not.toBe(bizRes.magaDiagnosis.punchline);
  });

  // ==========================================================================
  // PRODUCT-RE-07: 처방 연결
  // ==========================================================================
  it('PRODUCT-RE-07: Level 5 상품에서는 Phase 70 처방 엔진이 완전 연결되어 Do/Dont, 환경, 처방물이 제공되어야 한다', () => {
    const c = cases[1];
    const result = generator.generateProduct(
      {
        birthDate: c.birthDate,
        birthTime: c.birthTime,
        gender: c.gender,
        currentEvent: c.currentConcern,
        userTrouble: c.eventDescription,
      },
      { insightDepth: 5, prescription: true }
    );

    expect(result.prescriptionReport).toBeDefined();
    expect(result.prescriptionReport?.mustDo.length).toBeGreaterThanOrEqual(3);
    expect(result.prescriptionReport?.mustAvoid.length).toBeGreaterThanOrEqual(3);
    expect(result.prescriptionReport?.timingRoadmap).toBeDefined();
    expect(result.prescriptionReport?.safeguardNotice).toContain('법률');

    // Phase 70 환경 및 처방물 후보 확인
    expect(result.prescriptionReport?.environmentGuidance).toBeDefined();
    expect(result.prescriptionReport?.remedyItems).toBeDefined();
  });

  // ==========================================================================
  // PRODUCT-RE-08: 가격 독립성
  // ==========================================================================
  it('PRODUCT-RE-08: 가격만 변경했을 때 명리 진단, 사건 인과, 처방 내용은 100% 불변해야 한다', () => {
    const c = cases[1];
    const userInput: UserProblemInput = {
      birthDate: c.birthDate,
      birthTime: c.birthTime,
      gender: c.gender,
      currentEvent: c.currentConcern,
      userTrouble: c.eventDescription,
    };

    const resCheap = generator.generateProduct(userInput, { insightDepth: 4, price: 19900 });
    const resExpensive = generator.generateProduct(userInput, { insightDepth: 4, price: 149900 });

    expect(resCheap.pricing.calculatedPrice).toBe(19900);
    expect(resExpensive.pricing.calculatedPrice).toBe(149900);

    // 명리 결과 일치
    expect(resCheap.executedModules['CORE_ORIGINAL'].data.pillars).toEqual(
      resExpensive.executedModules['CORE_ORIGINAL'].data.pillars
    );
    // 리포트 내용 일치 (가격이 내용을 바꾸지 않음)
    expect(resCheap.depthReport.fullDocument).toBe(resExpensive.depthReport.fullDocument);
  });

  // ==========================================================================
  // PRODUCT-RE-09: 점수 독립성
  // ==========================================================================
  it('PRODUCT-RE-09: ProductEvaluator의 11대 평가 점수가 서로 종속되지 않고 독립적으로 평가되어야 한다', () => {
    const c = cases[1];
    const result = generator.generateProduct(
      {
        birthDate: c.birthDate,
        birthTime: c.birthTime,
        gender: c.gender,
        currentEvent: c.currentConcern,
        userTrouble: c.eventDescription,
      },
      { insightDepth: 5, prescription: true }
    );

    const scores = productEvaluator.evaluateProduct(result);

    expect(scores.myeongliAccuracy).toBeGreaterThanOrEqual(0);
    expect(scores.myeongliAccuracy).toBeLessThanOrEqual(100);

    expect(scores.problemDiagnosis).toBeGreaterThanOrEqual(0);
    expect(scores.personalization).toBeGreaterThanOrEqual(0);
    expect(scores.interpretationDepth).toBe(100);
    expect(scores.safety).toBeGreaterThanOrEqual(90);
    expect(scores.totalScore).toBeGreaterThan(800);
    expect(scores.averageScore).toBeGreaterThan(70);

    // 모든 점수가 단일한 고정 숫자로 획일화되지 않음을 확인
    const distinctScores = new Set([
      scores.myeongliAccuracy,
      scores.problemDiagnosis,
      scores.personalization,
      scores.interpretationDepth,
      scores.safety,
    ]);
    expect(distinctScores.size).toBeGreaterThan(1);
  });

  // ==========================================================================
  // PRODUCT-RE-10: 동일 명식 / 다른 문제
  // ==========================================================================
  it('PRODUCT-RE-10: 동일 명식이라도 BUSINESS와 LOVE 문제의 상품 분석과 권고 지침이 완전히 달라져야 한다', () => {
    const c = cases[0];
    const loveRes = generator.generateProduct(
      {
        birthDate: c.birthDate,
        birthTime: c.birthTime,
        gender: c.gender,
        currentEvent: '연인과의 이별과 재회 갈등',
      },
      { insightDepth: 4 }
    );

    const bizRes = generator.generateProduct(
      {
        birthDate: c.birthDate,
        birthTime: c.birthTime,
        gender: c.gender,
        currentEvent: '동업자 배임 및 지분 분쟁 소송',
      },
      { insightDepth: 4 }
    );

    expect(loveRes.classification.primaryDomain).toBe('LOVE');
    expect(bizRes.classification.primaryDomain).toBe('BUSINESS');
    expect(loveRes.productName).toContain('LOVE');
    expect(bizRes.productName).toContain('BUSINESS');
    expect(loveRes.depthReport.sections[2].content).not.toEqual(bizRes.depthReport.sections[2].content);
  });

  // ==========================================================================
  // PRODUCT-RE-11: 다른 명식 / 동일 문제
  // ==========================================================================
  it('PRODUCT-RE-11: 동일한 사업 분쟁이라도 명식이 다르면 명리적 근거와 상호작용 분석이 달라져야 한다', () => {
    const concern = '주요 거래처 부도와 동업자 지분 갈등';

    const res1 = generator.generateProduct(
      {
        birthDate: cases[0].birthDate, // 1992-03-15
        birthTime: cases[0].birthTime,
        gender: cases[0].gender,
        currentEvent: concern,
      },
      { insightDepth: 3 }
    );

    const res2 = generator.generateProduct(
      {
        birthDate: cases[1].birthDate, // 1988-12-10
        birthTime: cases[1].birthTime,
        gender: cases[1].gender,
        currentEvent: concern,
      },
      { insightDepth: 3 }
    );

    expect(res1.executedModules['CORE_ORIGINAL'].data.dayMaster).not.toEqual(
      res2.executedModules['CORE_ORIGINAL'].data.dayMaster
    );
    expect(res1.depthReport.sections[0].content).not.toEqual(res2.depthReport.sections[0].content);
  });

  // ==========================================================================
  // PRODUCT-RE-12: 상품 구성 차별성
  // ==========================================================================
  it('PRODUCT-RE-12: 동일 고객/문제에서 Product A, B, C는 정보량, 분석 깊이, 처방 범위가 실질적으로 증가해야 한다', () => {
    const c = cases[1];
    const configs = createDynamicConfigs('BUSINESS');

    const resA = generator.generateProduct(
      {
        birthDate: c.birthDate,
        birthTime: c.birthTime,
        gender: c.gender,
        currentEvent: c.currentConcern,
        userTrouble: c.eventDescription,
      },
      configs.productA
    );

    const resB = generator.generateProduct(
      {
        birthDate: c.birthDate,
        birthTime: c.birthTime,
        gender: c.gender,
        currentEvent: c.currentConcern,
        userTrouble: c.eventDescription,
      },
      configs.productB
    );

    const resC = generator.generateProduct(
      {
        birthDate: c.birthDate,
        birthTime: c.birthTime,
        gender: c.gender,
        currentEvent: c.currentConcern,
        userTrouble: c.eventDescription,
      },
      configs.productC
    );

    // 모듈 수 차이
    expect(resC.config.selectedModules.length).toBeGreaterThan(resB.config.selectedModules.length);
    expect(resB.config.selectedModules.length).toBeGreaterThan(resA.config.selectedModules.length);

    // 깊이 차이 (A: 1개 섹션, B: 4개 섹션, C: 5개 섹션)
    expect(resA.depthReport.sections.length).toBe(1);
    expect(resB.depthReport.sections.length).toBe(4);
    expect(resC.depthReport.sections.length).toBe(5);

    // C에는 완전한 처방 리포트 포함, A에는 처방 미포함
    expect(resA.prescriptionReport).toBeUndefined();
    expect(resC.prescriptionReport).toBeDefined();
    expect(resC.prescriptionReport?.environmentGuidance).toBeDefined();

    // 평가 점수도 레벨에 따라 합리적으로 차등
    const evalA = productEvaluator.evaluateProduct(resA);
    const evalC = productEvaluator.evaluateProduct(resC);
    expect(evalC.totalScore).toBeGreaterThan(evalA.totalScore);
  });

  // ==========================================================================
  // PRODUCT-RE-13: 명리 원천 데이터 불변
  // ==========================================================================
  it('PRODUCT-RE-13: 상품 설정(깊이, 가격, 구성)이 달라져도 일간, 오행, 충형 등 원천 명리 계산은 100% 동일해야 한다', () => {
    const c = cases[1];
    const userInput: UserProblemInput = {
      birthDate: c.birthDate,
      birthTime: c.birthTime,
      gender: c.gender,
      currentEvent: c.currentConcern,
    };

    const res1 = generator.generateProduct(userInput, { insightDepth: 1, price: 10000 });
    const res5 = generator.generateProduct(userInput, { insightDepth: 5, price: 150000 });

    const core1 = res1.executedModules['CORE_ORIGINAL'];
    const core5 = res5.executedModules['CORE_ORIGINAL'];

    expect(core1.data.dayMaster).toEqual(core5.data.dayMaster);
    expect(core1.data.ohaeng).toEqual(core5.data.ohaeng);
    expect(core1.data.pillars).toEqual(core5.data.pillars);
  });

  // ==========================================================================
  // PRODUCT-RE-14: HEALTH 안전성
  // ==========================================================================
  it('PRODUCT-RE-14: HEALTH 문제 상품에는 의학적 치료 불가 및 공인 전문의 상담 안내가 반드시 포함되어야 한다', () => {
    const c = cases[4]; // HEALTH
    const result = generator.generateProduct(
      {
        birthDate: c.birthDate,
        birthTime: c.birthTime,
        gender: c.gender,
        currentEvent: c.currentConcern,
        userTrouble: c.eventDescription,
      },
      { insightDepth: 5, prescription: true }
    );

    expect(result.classification.primaryDomain).toBe('HEALTH');
    expect(result.prescriptionReport?.safeguardNotice).toContain('의료');
    expect(result.prescriptionReport?.mustAvoid.some(a => a.includes('의료진') || a.includes('진료'))).toBe(true);
  });

  // ==========================================================================
  // PRODUCT-RE-15: MONEY 안전성
  // ==========================================================================
  it('PRODUCT-RE-15: MONEY 문제 상품에는 투자 원금 보장 배제 및 금융 리스크 분산 지침이 포함되어야 한다', () => {
    const c = cases[3]; // MONEY
    const result = generator.generateProduct(
      {
        birthDate: c.birthDate,
        birthTime: c.birthTime,
        gender: c.gender,
        currentEvent: c.currentConcern,
        userTrouble: c.eventDescription,
      },
      { insightDepth: 5, prescription: true }
    );

    expect(result.classification.primaryDomain).toBe('MONEY');
    expect(result.prescriptionReport?.safeguardNotice).toContain('금융');
    expect(result.prescriptionReport?.mustAvoid.some(a => a.includes('투자') || a.includes('대출'))).toBe(true);
  });

  // ==========================================================================
  // PRODUCT-RE-16: BUSINESS 안전성
  // ==========================================================================
  it('PRODUCT-RE-16: BUSINESS 문제 상품에는 서면 계약서 작성 및 법률/세무 자문 권고가 포함되어야 한다', () => {
    const c = cases[1]; // BUSINESS
    const result = generator.generateProduct(
      {
        birthDate: c.birthDate,
        birthTime: c.birthTime,
        gender: c.gender,
        currentEvent: c.currentConcern,
        userTrouble: c.eventDescription,
      },
      { insightDepth: 5, prescription: true }
    );

    expect(result.classification.primaryDomain).toBe('BUSINESS');
    expect(result.prescriptionReport?.safeguardNotice).toContain('법률');
    expect(result.prescriptionReport?.mustDo.some(d => d.includes('계약') || d.includes('서면') || d.includes('전문가'))).toBe(true);
  });

  // ==========================================================================
  // PRODUCT-RE-17: 결정론
  // ==========================================================================
  it('PRODUCT-RE-17: 동일한 입력과 ProductConfig를 10회 반복 실행해도 100% 동일한 결과가 도출되어야 한다', () => {
    const c = cases[1];
    const userInput: UserProblemInput = {
      birthDate: c.birthDate,
      birthTime: c.birthTime,
      gender: c.gender,
      currentEvent: c.currentConcern,
      userTrouble: c.eventDescription,
    };
    const config: Partial<ProductConfig> = { insightDepth: 4, price: 49000 };

    const baseline = generator.generateProduct(userInput, config);

    for (let i = 0; i < 9; i++) {
      const iter = generator.generateProduct(userInput, config);
      expect(iter.config.selectedModules).toEqual(baseline.config.selectedModules);
      expect(iter.depthReport.fullDocument).toBe(baseline.depthReport.fullDocument);
      expect(iter.pricing.calculatedPrice).toBe(baseline.pricing.calculatedPrice);
    }
  });

  // ==========================================================================
  // PRODUCT-RE-18: CASE 01 E2E 실전 검증 (1992-03-15 연애)
  // ==========================================================================
  it('PRODUCT-RE-18: CASE 01 (연애) 동적 3종 상품이 완벽히 생성 및 평가되어야 한다', () => {
    const c = cases[0];
    const configs = createDynamicConfigs('LOVE');

    const resA = generator.generateProduct({ birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender, currentEvent: c.currentConcern }, configs.productA);
    const resB = generator.generateProduct({ birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender, currentEvent: c.currentConcern }, configs.productB);
    const resC = generator.generateProduct({ birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender, currentEvent: c.currentConcern }, configs.productC);

    const evalA = productEvaluator.evaluateProduct(resA);
    const evalB = productEvaluator.evaluateProduct(resB);
    const evalC = productEvaluator.evaluateProduct(resC);

    expect(evalA.averageScore).toBeGreaterThan(65);
    expect(evalB.averageScore).toBeGreaterThan(75);
    expect(evalC.averageScore).toBeGreaterThan(85);
  });

  // ==========================================================================
  // PRODUCT-RE-19: CASE 02 E2E 실전 검증 (1988-12-10 사업)
  // ==========================================================================
  it('PRODUCT-RE-19: CASE 02 (사업) 동적 3종 상품이 완벽히 생성 및 평가되어야 한다', () => {
    const c = cases[1];
    const configs = createDynamicConfigs('BUSINESS');

    const resA = generator.generateProduct({ birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender, currentEvent: c.currentConcern }, configs.productA);
    const resB = generator.generateProduct({ birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender, currentEvent: c.currentConcern }, configs.productB);
    const resC = generator.generateProduct({ birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender, currentEvent: c.currentConcern }, configs.productC);

    const evalA = productEvaluator.evaluateProduct(resA);
    const evalB = productEvaluator.evaluateProduct(resB);
    const evalC = productEvaluator.evaluateProduct(resC);

    expect(evalA.averageScore).toBeGreaterThan(65);
    expect(evalB.averageScore).toBeGreaterThan(75);
    expect(evalC.averageScore).toBeGreaterThan(85);
  });

  // ==========================================================================
  // PRODUCT-RE-20: CASE 03 E2E 실전 검증 (1995-05-20 직장)
  // ==========================================================================
  it('PRODUCT-RE-20: CASE 03 (직장) 동적 3종 상품이 완벽히 생성 및 평가되어야 한다', () => {
    const c = cases[2];
    const configs = createDynamicConfigs('JOB');

    const resA = generator.generateProduct({ birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender, currentEvent: c.currentConcern }, configs.productA);
    const resB = generator.generateProduct({ birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender, currentEvent: c.currentConcern }, configs.productB);
    const resC = generator.generateProduct({ birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender, currentEvent: c.currentConcern }, configs.productC);

    const evalA = productEvaluator.evaluateProduct(resA);
    const evalB = productEvaluator.evaluateProduct(resB);
    const evalC = productEvaluator.evaluateProduct(resC);

    expect(evalA.averageScore).toBeGreaterThan(65);
    expect(evalB.averageScore).toBeGreaterThan(75);
    expect(evalC.averageScore).toBeGreaterThan(85);
  });

  // ==========================================================================
  // PRODUCT-RE-21: CASE 04 E2E 실전 검증 (1982-04-05 재물)
  // ==========================================================================
  it('PRODUCT-RE-21: CASE 04 (재물) 동적 3종 상품이 완벽히 생성 및 평가되어야 한다', () => {
    const c = cases[3];
    const configs = createDynamicConfigs('MONEY');

    const resA = generator.generateProduct({ birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender, currentEvent: c.currentConcern }, configs.productA);
    const resB = generator.generateProduct({ birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender, currentEvent: c.currentConcern }, configs.productB);
    const resC = generator.generateProduct({ birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender, currentEvent: c.currentConcern }, configs.productC);

    const evalA = productEvaluator.evaluateProduct(resA);
    const evalB = productEvaluator.evaluateProduct(resB);
    const evalC = productEvaluator.evaluateProduct(resC);

    expect(evalA.averageScore).toBeGreaterThan(65);
    expect(evalB.averageScore).toBeGreaterThan(75);
    expect(evalC.averageScore).toBeGreaterThan(85);
  });

  // ==========================================================================
  // PRODUCT-RE-22: CASE 05 E2E 실전 검증 (1986-08-15 건강)
  // ==========================================================================
  it('PRODUCT-RE-22: CASE 05 (건강) 동적 3종 상품이 완벽히 생성 및 평가되어야 한다', () => {
    const c = cases[4];
    const configs = createDynamicConfigs('HEALTH');

    const resA = generator.generateProduct({ birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender, currentEvent: c.currentConcern }, configs.productA);
    const resB = generator.generateProduct({ birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender, currentEvent: c.currentConcern }, configs.productB);
    const resC = generator.generateProduct({ birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender, currentEvent: c.currentConcern }, configs.productC);

    const evalA = productEvaluator.evaluateProduct(resA);
    const evalB = productEvaluator.evaluateProduct(resB);
    const evalC = productEvaluator.evaluateProduct(resC);

    expect(evalA.averageScore).toBeGreaterThan(65);
    expect(evalB.averageScore).toBeGreaterThan(75);
    expect(evalC.averageScore).toBeGreaterThan(85);
  });

  // ==========================================================================
  // PRODUCT-RE-23: 전체 회귀
  // ==========================================================================
  it('PRODUCT-RE-23: 19개 모듈, 통합 분석기, 사건 진단, 마살, 처방, 상품생성기가 완전 통합 실행되어야 한다', () => {
    const c = cases[1];
    const fullModules = moduleRegistry.getAllModuleIds();

    const fullResult = generator.generateProduct(
      {
        birthDate: c.birthDate,
        birthTime: c.birthTime,
        gender: c.gender,
        currentEvent: c.currentConcern,
        userTrouble: c.eventDescription,
      },
      {
        selectedModules: fullModules,
        insightDepth: 5,
        prescription: true,
      }
    );

    expect(fullResult.executedModules['PRESCRIPTION']).toBeDefined();
    expect(fullResult.executedModules['MAGA_DIAGNOSIS']).toBeDefined();
    expect(fullResult.integratedAnalysis).toBeDefined();
    expect(fullResult.depthReport.sections.length).toBe(5);
    expect(fullResult.pricing.calculatedPrice).toBeGreaterThan(50000);
  });
});
