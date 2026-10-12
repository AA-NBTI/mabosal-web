/**
 * tests/phase61-product-generation.test.ts
 * 
 * Phase 61: 마보살 상품 생성 아키텍처(Product Generation Layer) 테스트 스위트
 * 
 * 검증 항목:
 * 1. A. 단일 모듈 상품 생성 (RELATION, SINSAL, MONEY, BUSINESS)
 * 2. B. 조합 상품 동적 생성
 *    - MONEY + DAEWUN + SEUN
 *    - BUSINESS + RELATION + SINSAL
 *    - LOVE + RELATION + DAEWUN + SEUN
 * 3. C. 결과 깊이 레이어 (LEVEL 1 ~ 5 상호 차별성 및 누적 구조)
 * 4. D. 가격 독립성 (ProductConfig 변경만으로 가격 및 상품 구성 제어)
 * 5. E. CASE 01 ~ 05 실제 현실 고민 입력 기반 동적 상품 생성 및 완성도/가격 평가
 */

import { describe, it, expect } from 'vitest';
import {
  ProductGenerator,
  EventProblemClassifier,
  EventModuleMapper,
  CaseExplanationEngine,
  PricingEngine,
  UserProblemInput,
  ProductConfig,
} from '../src/modules/product-generator/index.js';

describe('Phase 61: Product Generation Layer Test Suite', () => {
  const generator = new ProductGenerator();
  const classifier = new EventProblemClassifier();
  const pricingEngine = new PricingEngine();

  // --------------------------------------------------------------------------
  // 1. 단일 모듈 상품 생성 검증 (A)
  // --------------------------------------------------------------------------
  describe('1. 단일 모듈 상품 생성', () => {
    const baseInput: UserProblemInput = {
      birthDate: '1992-03-15',
      birthTime: '08:30',
      gender: 'male',
      currentEvent: '모듈 단독 검증',
      userTrouble: '단일 명리 작용 분석',
    };

    it('RELATION 단일 모듈 상품을 정상 생성한다', () => {
      const res = generator.generateProduct(baseInput, {
        productId: 'PROD_SINGLE_RELATION',
        productName: '[단독] 합·충·형·파·해 정밀 분석',
        selectedModules: ['RELATION'],
        insightDepth: 1,
      });

      expect(res.executedModules['RELATION']).toBeDefined();
      expect(res.executedModules['RELATION'].success).toBe(true);
      expect(res.depthReport.sections.length).toBe(1); // LEVEL 1: 1개 섹션
      expect(res.pricing.calculatedPrice).toBeGreaterThan(0);
    });

    it('SINSAL 단일 모듈 상품을 정상 생성한다', () => {
      const res = generator.generateProduct(baseInput, {
        productId: 'PROD_SINGLE_SINSAL',
        productName: '[단독] 12신살 및 특수 길흉살 분석',
        selectedModules: ['SINSAL'],
        insightDepth: 1,
      });

      expect(res.executedModules['SINSAL']).toBeDefined();
      expect(res.executedModules['SINSAL'].success).toBe(true);
      expect(res.depthReport.fullDocument).toContain('신살');
    });

    it('MONEY 단일 모듈 상품을 정상 생성한다', () => {
      const res = generator.generateProduct(baseInput, {
        productId: 'PROD_SINGLE_MONEY',
        productName: '[단독] 재물 현금흐름 정밀 진단',
        selectedModules: ['MONEY'],
        insightDepth: 2,
      });

      expect(res.executedModules['MONEY']).toBeDefined();
      expect(res.executedModules['MONEY'].success).toBe(true);
      expect(res.depthReport.sections.length).toBe(2);
    });

    it('BUSINESS 단일 모듈 상품을 정상 생성한다', () => {
      const res = generator.generateProduct(baseInput, {
        productId: 'PROD_SINGLE_BUSINESS',
        productName: '[단독] 사업 리스크 및 파트너십 진단',
        selectedModules: ['BUSINESS'],
        insightDepth: 2,
      });

      expect(res.executedModules['BUSINESS']).toBeDefined();
      expect(res.executedModules['BUSINESS'].success).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 2. 조합 상품 동적 생성 검증 (B)
  // --------------------------------------------------------------------------
  describe('2. 조합 상품 동적 생성', () => {
    it('조합 [MONEY + DAEWUN + SEUN] 상품이 정상 생성된다', () => {
      const input: UserProblemInput = {
        birthDate: '1982-04-05',
        birthTime: '06:00',
        gender: 'male',
        currentEvent: '올해 계속 돈이 새고 있습니다',
        userTrouble: '재정적 누수와 현금 흐름 악화',
      };

      const res = generator.generateProduct(input, {
        productId: 'PROD_COMB_MONEY_FLOW',
        productName: '[재물 타임라인] 재물 + 대운 + 세운 복합 분석',
        selectedModules: ['MONEY', 'DAEWUN', 'SEUN'],
        insightDepth: 3,
      });

      expect(res.executedModules['MONEY']).toBeDefined();
      expect(res.executedModules['DAEWUN']).toBeDefined();
      expect(res.executedModules['SEUN']).toBeDefined();
      expect(res.config.selectedModules.length).toBe(3);
      expect(res.eventMapping).toBeDefined();
      expect(res.eventMapping?.mappings.some(m => m.moduleId === 'MONEY')).toBe(true);
    });

    it('조합 [BUSINESS + RELATION + SINSAL] 상품이 정상 생성된다', () => {
      const input: UserProblemInput = {
        birthDate: '1988-12-10',
        birthTime: '14:00',
        gender: 'female',
        currentEvent: '사업 파트너와 계속 충돌합니다',
        userTrouble: '동업자와의 갈등 및 배임 우려',
      };

      const res = generator.generateProduct(input, {
        productId: 'PROD_COMB_PARTNER_CONFLICT',
        productName: '[사업 갈등] 파트너십 + 충형 + 살 분석',
        selectedModules: ['BUSINESS', 'RELATION', 'SINSAL'],
        insightDepth: 3,
      });

      expect(res.executedModules['BUSINESS']).toBeDefined();
      expect(res.executedModules['RELATION']).toBeDefined();
      expect(res.executedModules['SINSAL']).toBeDefined();
      expect(res.depthReport.fullDocument).toContain('인과 연결');
    });

    it('조합 [LOVE + RELATION + DAEWUN + SEUN] 상품이 정상 생성된다', () => {
      const input: UserProblemInput = {
        birthDate: '1992-03-15',
        birthTime: '08:30',
        gender: 'male',
        currentEvent: '연인과의 갑작스런 결별',
        userTrouble: '재회 시기 및 관계 회복 가능성',
      };

      const res = generator.generateProduct(input, {
        productId: 'PROD_COMB_LOVE_TIMING',
        productName: '[연애 운명] 연애 + 관계작용 + 대운 + 세운 복합 분석',
        selectedModules: ['LOVE', 'RELATION', 'DAEWUN', 'SEUN'],
        insightDepth: 4,
      });

      expect(res.executedModules['LOVE']).toBeDefined();
      expect(res.executedModules['RELATION']).toBeDefined();
      expect(res.executedModules['DAEWUN']).toBeDefined();
      expect(res.executedModules['SEUN']).toBeDefined();
      expect(res.depthReport.sections.length).toBe(4);
    });
  });

  // --------------------------------------------------------------------------
  // 3. 결과 깊이 레이어 (InsightDepth) 검증 (C)
  // --------------------------------------------------------------------------
  describe('3. 결과 깊이 레이어 (InsightDepth LEVEL 1 ~ 5)', () => {
    const testInput: UserProblemInput = {
      birthDate: '1992-03-15',
      birthTime: '08:30',
      gender: 'male',
      currentEvent: '갑작스런 결별 통보',
      userTrouble: '상대방의 마음이 왜 닫혔는지 궁금함',
    };
    const testModules = ['LOVE', 'RELATION', 'SEUN'];

    it('동일한 모듈 조합에서 LEVEL 1 ~ 5가 서로 다른 결과를 생성한다', () => {
      const l1 = generator.generateProduct(testInput, { selectedModules: testModules, insightDepth: 1 });
      const l2 = generator.generateProduct(testInput, { selectedModules: testModules, insightDepth: 2 });
      const l3 = generator.generateProduct(testInput, { selectedModules: testModules, insightDepth: 3 });
      const l4 = generator.generateProduct(testInput, { selectedModules: testModules, insightDepth: 4 });
      const l5 = generator.generateProduct(testInput, { selectedModules: testModules, insightDepth: 5 });

      // 섹션 수 증가 확인
      expect(l1.depthReport.sections.length).toBe(1);
      expect(l2.depthReport.sections.length).toBe(2);
      expect(l3.depthReport.sections.length).toBe(3);
      expect(l4.depthReport.sections.length).toBe(4);
      expect(l5.depthReport.sections.length).toBe(5);

      // 텍스트 길이의 누적 증가 확인
      expect(l1.depthReport.fullDocument.length).toBeLessThan(l2.depthReport.fullDocument.length);
      expect(l2.depthReport.fullDocument.length).toBeLessThan(l3.depthReport.fullDocument.length);
      expect(l3.depthReport.fullDocument.length).toBeLessThan(l4.depthReport.fullDocument.length);
      expect(l4.depthReport.fullDocument.length).toBeLessThan(l5.depthReport.fullDocument.length);

      // 내용 고유성 확인
      expect(l1.depthReport.fullDocument).not.toContain('상황별 리스크 완화책');
      expect(l4.depthReport.fullDocument).toContain('상황별 리스크 완화책');
      expect(l5.depthReport.fullDocument).toContain('개인 맞춤 행동 처방');
      expect(l5.prescriptionReport).toBeDefined();
      expect(l5.prescriptionReport?.mustDo.length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // 4. 가격 독립성 검증 (D)
  // --------------------------------------------------------------------------
  describe('4. 가격 독립성 (ProductConfig 기반)', () => {
    it('모듈 코드 수정 없이 ProductConfig의 price를 지정하면 해당 가격이 유지된다', () => {
      const input: UserProblemInput = {
        birthDate: '1988-12-10',
        gender: 'female',
        currentEvent: '사업 위기',
        userTrouble: '구조조정',
      };

      const customPriceProduct = generator.generateProduct(input, {
        productId: 'PROD_CUSTOM_PRICE',
        selectedModules: ['BUSINESS', 'RELATION'],
        insightDepth: 3,
        price: 39900, // 관리자 지정 가격
      });

      expect(customPriceProduct.config.price).toBe(39900);
      expect(customPriceProduct.pricing.calculatedPrice).toBe(39900);
    });

    it('price 미지정 시 9대 평가 요소를 바탕으로 동적 가격이 공정하게 산출된다', () => {
      const input: UserProblemInput = {
        birthDate: '1988-12-10',
        gender: 'female',
        currentEvent: '사업 위기',
        userTrouble: '구조조정',
      };

      const lowTier = generator.generateProduct(input, {
        selectedModules: ['BUSINESS'],
        insightDepth: 1,
      });

      const highTier = generator.generateProduct(input, {
        selectedModules: ['BUSINESS', 'MONEY', 'RELATION', 'SINSAL', 'DAEWUN', 'SEUN', 'PRESCRIPTION'],
        insightDepth: 5,
        caseExplanation: true,
        personalizedMapping: true,
        timingAnalysis: true,
        prescription: true,
      });

      expect(lowTier.pricing.calculatedPrice).toBeLessThan(highTier.pricing.calculatedPrice);
      expect(highTier.pricing.moduleCount).toBe(7);
      expect(highTier.pricing.depthLevel).toBe(5);
    });
  });

  // --------------------------------------------------------------------------
  // 5. CASE 01 ~ 05 실제 현실 고민 입력 기반 동적 상품 생성 (E)
  // --------------------------------------------------------------------------
  describe('5. 실제 CASE 01 ~ 05 동적 상품 생성 및 품질 검증', () => {
    it('CASE 01 (연애 결별): LOVE 중심 동적 상품이 생성되고 8단계 프로토콜이 적용된다', () => {
      const case01: UserProblemInput = {
        birthDate: '1992-03-15',
        birthTime: '08:30',
        gender: 'male',
        targetDomain: 'LOVE',
        currentEvent: '연인에게 갑작스런 결별 통보를 받았습니다',
        userTrouble: '상대방의 마음이 돌아올 수 있는지, 재회 시기가 언제인지 알고 싶습니다',
        desiredQuestion: '왜 이 시점에 파국을 맞았으며 어떻게 대처해야 합니까?',
      };

      const res = generator.generateProduct(case01, {
        insightDepth: 5,
        price: 59000,
      });

      expect(res.classification.primaryDomain).toBe('LOVE');
      expect(res.executedModules['LOVE']).toBeDefined();
      expect(res.executedModules['RELATION']).toBeDefined();
      expect(res.caseProtocol).toBeDefined();
      expect(res.caseProtocol?.similarRealWorldCase).toContain('연인들');
      expect(res.caseProtocol?.riskAwareness).toContain('장문의 글');
      expect(res.prescriptionReport?.safeguardNotice).toBeDefined();
    });

    it('CASE 02 (사업 부도/위기): BUSINESS 중심 동적 상품이 생성되고 구조조정 가이드가 도출된다', () => {
      const case02: UserProblemInput = {
        birthDate: '1988-12-10',
        birthTime: '14:00',
        gender: 'female',
        targetDomain: 'BUSINESS',
        currentEvent: '동업자와의 갈등과 거래처 부도로 사업이 파탄 직전입니다',
        userTrouble: '회사를 살릴 수 있을지, 법적 분쟁을 어떻게 피해야 할지 막막합니다',
        desiredQuestion: '손실을 최소화하고 생존할 수 있는 방안을 알려주세요',
      };

      const res = generator.generateProduct(case02, {
        insightDepth: 5,
        price: 89000,
      });

      expect(res.classification.primaryDomain).toBe('BUSINESS');
      expect(res.executedModules['BUSINESS']).toBeDefined();
      expect(res.executedModules['MONEY']).toBeDefined();
      expect(res.caseProtocol?.similarRealWorldCase).toContain('스타트업');
      expect(res.caseProtocol?.mitigation).toContain('고정비');
    });

    it('CASE 03 (직장 이직/승진 갈등): JOB 중심 동적 상품이 생성된다', () => {
      const case03: UserProblemInput = {
        birthDate: '1995-05-20',
        birthTime: '18:30',
        gender: 'male',
        targetDomain: 'JOB',
        currentEvent: '상사의 극심한 괴롭힘과 인사 고과 불이익으로 퇴사 충동이 큽니다',
        userTrouble: '당장 사표를 내도 이직에 문제가 없을지 불안합니다',
        desiredQuestion: '언제 움직이는 것이 가장 안전합니까?',
      };

      const res = generator.generateProduct(case03, {
        insightDepth: 4,
        price: 49000,
      });

      expect(res.classification.primaryDomain).toBe('JOB');
      expect(res.executedModules['JOB']).toBeDefined();
      expect(res.caseProtocol?.riskAwareness).toContain('충동적인 사직서');
    });

    it('CASE 04 (투자 손실/재물 위기): MONEY 중심 동적 상품이 생성되고 금융 가드가 작동한다', () => {
      const case04: UserProblemInput = {
        birthDate: '1982-04-05',
        birthTime: '06:00',
        gender: 'male',
        targetDomain: 'MONEY',
        currentEvent: '무리한 레버리지 투자로 빚이 급증하고 현금이 완전 고갈되었습니다',
        userTrouble: '원금을 만회하려 물타기를 더 해야 할지 고민입니다',
        desiredQuestion: '재물운이 언제 다시 회복됩니까?',
      };

      const res = generator.generateProduct(case04, {
        insightDepth: 5,
        price: 69000,
      });

      expect(res.classification.primaryDomain).toBe('MONEY');
      expect(res.executedModules['MONEY']).toBeDefined();
      expect(res.caseProtocol?.riskAwareness).toContain('물타기');
      expect(res.caseProtocol?.mitigation).toContain('현금 보유');
    });

    it('CASE 05 (수술/건강 위기): HEALTH 중심 동적 상품이 생성되고 의료 가드가 작동한다', () => {
      const case05: UserProblemInput = {
        birthDate: '1986-08-15',
        birthTime: '16:00',
        gender: 'male',
        targetDomain: 'HEALTH',
        currentEvent: '급격한 기력 저하로 병원에서 큰 수술을 권유받았습니다',
        userTrouble: '수술을 받는 것이 맞는지, 올해를 무사히 넘길 수 있을지 두렵습니다',
        desiredQuestion: '신체 취약 장부와 회복 시기를 알고 싶습니다',
      };

      const res = generator.generateProduct(case05, {
        insightDepth: 5,
        price: 59000,
      });

      expect(res.classification.primaryDomain).toBe('HEALTH');
      expect(res.executedModules['HEALTH']).toBeDefined();
      expect(res.caseProtocol?.riskAwareness).toContain('의료기관');
      expect(res.prescriptionReport?.safeguardNotice).toContain('의료 질환에 대한 치료');
    });
  });
});
