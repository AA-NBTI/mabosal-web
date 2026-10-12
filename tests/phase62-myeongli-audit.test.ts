/**
 * tests/phase62-myeongli-audit.test.ts
 * 
 * Phase 62: 상품 생성 실전 명리 검증 및 오류 수정 감사 스위트
 * 
 * 검증 항목:
 * 1. 동일 사주 / 다른 사건 입력 시 동적 모듈 및 해석 차별화 (지시서 11절)
 * 2. LEVEL 1 ~ 5 실질적 정보 깊이 및 의사결정 가치 계층화 (지시서 10절)
 * 3. LEVEL 5 상품의 PRESCRIPTION 모듈 필수 포함 검증 (지시서 6절)
 * 4. 비정식 관계(자해 등) 원천 차단 및 정식 명리 관계만 맵핑 (지시서 5절)
 * 5. 의료(HEALTH) 및 금융/사업(MONEY/BUSINESS) 단정 배제 안전성 (지시서 7, 8절)
 * 6. 단일 / 복수 / 프리미엄 모듈 조합 독립성 (지시서 12절)
 * 7. 가격 계산의 일관성 및 비하드코딩 독립성 (지시서 9절)
 */

import { describe, it, expect } from 'vitest';
import {
  ProductGenerator,
  UserProblemInput,
  ProblemDomain,
} from '../src/modules/product-generator/index.js';

describe('Phase 62: 실전 명리 감사 및 상품 생성 무결성 검증', () => {
  const generator = new ProductGenerator();

  // --------------------------------------------------------------------------
  // 1. 동일 사주 / 다른 문제 검증 (지시서 11절 핵심)
  // --------------------------------------------------------------------------
  describe('1. 동일 사주 / 다른 사건 입력 시 동적 차별화 검증', () => {
    const commonBirth = {
      birthDate: '1992-03-15',
      birthTime: '08:30',
      gender: 'male' as const,
    };

    it('동일 사주에서 연애, 사업, 직장, 재물 문제를 각각 넣으면 서로 다른 모듈과 보고서가 생성된다', () => {
      // 1) 연애 문제
      const loveInput: UserProblemInput = {
        ...commonBirth,
        targetDomain: 'LOVE',
        currentEvent: '연인과 결별하여 마음이 찢어집니다',
        userTrouble: '재회 타이밍과 상대방 심리를 알고 싶습니다',
      };
      const loveRes = generator.generateProduct(loveInput, { insightDepth: 5 });

      // 2) 사업 문제
      const bizInput: UserProblemInput = {
        ...commonBirth,
        targetDomain: 'BUSINESS',
        currentEvent: '거래처 결제 지연으로 회사 자금이 막혔습니다',
        userTrouble: '계약 해지 리스크와 파트너 갈등을 어떻게 해결할지 고민입니다',
      };
      const bizRes = generator.generateProduct(bizInput, { insightDepth: 5 });

      // 3) 직장 문제
      const jobInput: UserProblemInput = {
        ...commonBirth,
        targetDomain: 'JOB',
        currentEvent: '팀장과의 노선 차이로 업무 배제와 승진 탈락을 겪었습니다',
        userTrouble: '지금 당장 이직하는 것이 유리한지 알고 싶습니다',
      };
      const jobRes = generator.generateProduct(jobInput, { insightDepth: 5 });

      // 4) 재물 문제
      const moneyInput: UserProblemInput = {
        ...commonBirth,
        targetDomain: 'MONEY',
        currentEvent: '무리한 주식 레버리지 투자로 원금 70%가 손실되었습니다',
        userTrouble: '추가 대출로 물타기를 해야 할지 손절해야 할지 갈림길입니다',
      };
      const moneyRes = generator.generateProduct(moneyInput, { insightDepth: 5 });

      // A. 도메인 분류 차별화 확인
      expect(loveRes.classification.primaryDomain).toBe('LOVE');
      expect(bizRes.classification.primaryDomain).toBe('BUSINESS');
      expect(jobRes.classification.primaryDomain).toBe('JOB');
      expect(moneyRes.classification.primaryDomain).toBe('MONEY');

      // B. 실행 모듈 차별화 확인
      expect(loveRes.config.selectedModules).toContain('LOVE');
      expect(loveRes.config.selectedModules).not.toContain('BUSINESS');

      expect(bizRes.config.selectedModules).toContain('BUSINESS');
      expect(bizRes.config.selectedModules).not.toContain('LOVE');

      expect(jobRes.config.selectedModules).toContain('JOB');
      expect(moneyRes.config.selectedModules).toContain('MONEY');

      // C. 사건 설명 프로토콜 차별화 확인
      expect(loveRes.caseProtocol?.similarRealWorldCase).toContain('연인');
      expect(bizRes.caseProtocol?.similarRealWorldCase).toContain('기업');
      expect(jobRes.caseProtocol?.similarRealWorldCase).toContain('직장');
      expect(moneyRes.caseProtocol?.similarRealWorldCase).toContain('자산');

      // D. 전체 보고서 텍스트 상이성 확인
      expect(loveRes.depthReport.fullDocument).not.toEqual(bizRes.depthReport.fullDocument);
      expect(bizRes.depthReport.fullDocument).not.toEqual(moneyRes.depthReport.fullDocument);
    });
  });

  // --------------------------------------------------------------------------
  // 2. 결과 깊이 계층화 및 의사결정 가치 검증 (지시서 10절)
  // --------------------------------------------------------------------------
  describe('2. LEVEL 1 ~ 5 실질적 정보 깊이 및 의사결정 가치 검증', () => {
    const input: UserProblemInput = {
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female',
      currentEvent: '동업자와의 갈등 및 계약 마찰',
      userTrouble: '사업을 분리하고 독립해야 할지 고민입니다',
    };

    it('LEVEL 1 ~ 5가 단순 길이 증가가 아닌 정보의 종류와 의사결정 지침을 누적 확장한다', () => {
      const l1 = generator.generateProduct(input, { insightDepth: 1, selectedModules: ['BUSINESS', 'RELATION'] });
      const l2 = generator.generateProduct(input, { insightDepth: 2, selectedModules: ['BUSINESS', 'RELATION'] });
      const l3 = generator.generateProduct(input, { insightDepth: 3, selectedModules: ['BUSINESS', 'RELATION'] });
      const l4 = generator.generateProduct(input, { insightDepth: 4, selectedModules: ['BUSINESS', 'RELATION', 'SEUN'] });
      const l5 = generator.generateProduct(input, { insightDepth: 5, selectedModules: ['BUSINESS', 'RELATION', 'SEUN'] });

      // LEVEL 1: 순수 팩트 지표만 포함
      expect(l1.depthReport.sections.length).toBe(1);
      expect(l1.depthReport.sections[0].title).toContain('기본 지표');
      expect(l1.eventMapping).toBeUndefined();

      // LEVEL 2: 명리 작용의 보편적 의미 포함
      expect(l2.depthReport.sections.length).toBe(2);
      expect(l2.depthReport.sections[1].title).toContain('상호작용의 의미');

      // LEVEL 3: 사용자 사건과의 1:1 인과 연결 및 현실 사례 포함
      expect(l3.depthReport.sections.length).toBe(3);
      expect(l3.depthReport.sections[2].title).toContain('현실 사건과의 인과 연결');
      expect(l3.eventMapping).toBeDefined();

      // LEVEL 4: 시기별 타이밍과 상황별 리스크 완화책 포함
      expect(l4.depthReport.sections.length).toBe(4);
      expect(l4.depthReport.sections[3].title).toContain('대응 지침');
      expect(l4.depthReport.fullDocument).toContain('상황별 리스크 완화책');

      // LEVEL 5: 맞춤 행동 처방(Do/Don't)과 심신 안정화 포함
      expect(l5.depthReport.sections.length).toBe(5);
      expect(l5.depthReport.sections[4].title).toContain('맞춤 행동 처방');
      expect(l5.prescriptionReport).toBeDefined();
      expect(l5.prescriptionReport?.mustDo.length).toBeGreaterThan(0);
      expect(l5.prescriptionReport?.mustAvoid.length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // 3. LEVEL 5 처방 필수 연결 검증 (지시서 6절)
  // --------------------------------------------------------------------------
  describe('3. LEVEL 5 상품의 PRESCRIPTION 모듈 필수 포함 검증', () => {
    it('사용자가 모듈 목록에서 PRESCRIPTION을 명시하지 않아도 LEVEL 5면 자동으로 포함된다', () => {
      const input: UserProblemInput = {
        birthDate: '1986-08-15',
        birthTime: '16:00',
        gender: 'male',
        currentEvent: '수술 및 건강 악화',
        userTrouble: '올해 건강 위기를 무사히 넘길 수 있을지 두렵습니다',
      };

      // selectedModules에 PRESCRIPTION을 넣지 않고 LEVEL 5로 호출
      const res = generator.generateProduct(input, {
        selectedModules: ['HEALTH', 'RELATION'],
        insightDepth: 5,
      });

      expect(res.config.selectedModules).toContain('PRESCRIPTION');
      expect(res.executedModules['PRESCRIPTION']).toBeDefined();
      expect(res.executedModules['PRESCRIPTION'].success).toBe(true);
      expect(res.prescriptionReport).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 4. 비정식 관계 배제 및 정식 명리 사실 검증 (지시서 3절, 5절)
  // --------------------------------------------------------------------------
  describe('4. 비정식 관계(자해 등) 원천 배제 및 정식 관계 검증', () => {
    it('CASE 02 (1988-12-10 己亥일주)에서 비정식 관계 자해(子亥)가 절대 생성되지 않는다', () => {
      const case02: UserProblemInput = {
        birthDate: '1988-12-10',
        birthTime: '14:00',
        gender: 'female',
        targetDomain: 'BUSINESS',
        currentEvent: '동업자와의 갈등 및 거래처 부도',
        userTrouble: '회사 생존 및 구조조정 방안',
      };

      const res = generator.generateProduct(case02, { insightDepth: 5 });

      // 전체 산출 문서 및 맵핑에서 비정식 명칭 '자해'가 없음을 엄격히 검증
      expect(res.depthReport.fullDocument).not.toContain('자해(');
      expect(res.depthReport.fullDocument).not.toContain('자해(子亥)');
      if (res.eventMapping) {
        for (const item of res.eventMapping.mappings) {
          expect(item.myeongliTrigger).not.toContain('자해');
        }
      }
    });

    it('사건-명리 맵핑에서 인과 비약 단정 표현이 배제된다', () => {
      const input: UserProblemInput = {
        birthDate: '1992-03-15',
        birthTime: '08:30',
        gender: 'male',
        targetDomain: 'LOVE',
        currentEvent: '연인과의 이별',
        userTrouble: '재회 가능성',
      };

      const res = generator.generateProduct(input, { insightDepth: 3 });
      expect(res.eventMapping?.overallCausalSynthesis).not.toContain('필연적 결과입니다');
      expect(res.eventMapping?.overallCausalSynthesis).toContain('대응의 기준점');
    });
  });

  // --------------------------------------------------------------------------
  // 5. 의료 및 금융/사업 안전성 가드 검증 (지시서 7절, 8절)
  // --------------------------------------------------------------------------
  describe('5. 고위험 영역 안전성 및 단정 배제 검증', () => {
    it('HEALTH 상품은 질병 부위/수술 성공을 단정하지 않고 의료 전문가 상담을 최우선 권고한다', () => {
      const healthInput: UserProblemInput = {
        birthDate: '1986-08-15',
        birthTime: '16:00',
        gender: 'male',
        targetDomain: 'HEALTH',
        currentEvent: '병원에서 암 또는 중대 질환 수술 권유',
        userTrouble: '수술이 성공할지, 치료가 잘 될지 알고 싶습니다',
      };

      const res = generator.generateProduct(healthInput, { insightDepth: 5 });
      const fullText = res.depthReport.fullDocument;

      // 금지 표현 미포함 확인
      expect(fullText).not.toContain('토가 부족해서 해당 부위에 염증');
      expect(fullText).not.toContain('수술이 반드시 성공');
      expect(fullText).not.toContain('치료가 완치');

      // 허용 안전 표현 확인
      expect(fullText).toContain('의료 전문가의 진단');
      expect(res.prescriptionReport?.safeguardNotice).toContain('의료 질환에 대한 치료');
    });

    it('MONEY/BUSINESS 상품은 수익 보장이나 확정 손실을 단정하지 않는다', () => {
      const moneyInput: UserProblemInput = {
        birthDate: '1982-04-05',
        gender: 'male',
        targetDomain: 'MONEY',
        currentEvent: '투자 위기',
        userTrouble: '원금 회복 가능 여부',
      };

      const res = generator.generateProduct(moneyInput, { insightDepth: 5 });
      const fullText = res.depthReport.fullDocument;

      expect(fullText).not.toContain('반드시 돈을 번다');
      expect(fullText).not.toContain('반드시 회복한다');
      expect(fullText).toContain('보수적인 대응');
      expect(res.prescriptionReport?.safeguardNotice).toContain('금융 투자의 원금 보장 등을 단정하지 않습니다');
    });
  });

  // --------------------------------------------------------------------------
  // 6. 모듈 조합 독립성 검증 (지시서 12절)
  // --------------------------------------------------------------------------
  describe('6. 단일 / 복수 / 프리미엄 모듈 조합 검증', () => {
    const input: UserProblemInput = {
      birthDate: '1982-04-05',
      gender: 'male',
      currentEvent: '재물 관리 점검',
      userTrouble: '자산 현황 파악',
    };

    it('단일 모듈 [MONEY]이 독립적으로 상품화된다', () => {
      const res = generator.generateProduct(input, { selectedModules: ['MONEY'], insightDepth: 1 });
      expect(Object.keys(res.executedModules)).toEqual(['MONEY']);
      expect(res.pricing.calculatedPrice).toBeGreaterThan(0);
    });

    it('복수 모듈 [MONEY + DAEWUN + SEUN + RELATION]이 정상 조합된다', () => {
      const res = generator.generateProduct(input, {
        selectedModules: ['MONEY', 'DAEWUN', 'SEUN', 'RELATION'],
        insightDepth: 3,
      });
      expect(Object.keys(res.executedModules).length).toBe(4);
      expect(res.executedModules['MONEY']).toBeDefined();
      expect(res.executedModules['RELATION']).toBeDefined();
    });

    it('프리미엄 7개 모듈 조합이 정상 조합된다', () => {
      const res = generator.generateProduct(input, {
        selectedModules: ['MONEY', 'RELATION', 'SINSAL', 'DAEWUN', 'SEUN', 'MAGA_DIAGNOSIS', 'PRESCRIPTION'],
        insightDepth: 5,
      });
      expect(Object.keys(res.executedModules).length).toBe(7);
      expect(res.depthReport.sections.length).toBe(5);
    });
  });

  // --------------------------------------------------------------------------
  // 7. 가격 엔진 계산 일관성 검증 (지시서 9절)
  // --------------------------------------------------------------------------
  describe('7. 가격 엔진 계산 일관성 검증 (PRICE-CALCULATION)', () => {
    it('모듈 수와 해석 깊이에 따라 가격 계산이 일관되게 증가한다', () => {
      const input: UserProblemInput = { birthDate: '1992-03-15', gender: 'male', currentEvent: '테스트', userTrouble: '테스트' };

      const p1 = generator.generateProduct(input, { selectedModules: ['RELATION'], insightDepth: 1 });
      const p2 = generator.generateProduct(input, { selectedModules: ['RELATION'], insightDepth: 3 });
      const p3 = generator.generateProduct(input, { selectedModules: ['RELATION', 'SINSAL', 'DAEWUN', 'SEUN'], insightDepth: 3 });
      const p4 = generator.generateProduct(input, { selectedModules: ['RELATION', 'SINSAL', 'DAEWUN', 'SEUN'], insightDepth: 5 });

      expect(p1.pricing.calculatedPrice).toBeLessThan(p2.pricing.calculatedPrice);
      expect(p2.pricing.calculatedPrice).toBeLessThan(p3.pricing.calculatedPrice);
      expect(p3.pricing.calculatedPrice).toBeLessThan(p4.pricing.calculatedPrice);
    });

    it('관리자 지정 가격(price)이 주어지면 계산 가격과 관계없이 지정 가격을 유지한다', () => {
      const input: UserProblemInput = { birthDate: '1992-03-15', gender: 'male', currentEvent: '테스트', userTrouble: '테스트' };
      const customRes = generator.generateProduct(input, { price: 29900 });
      expect(customRes.pricing.calculatedPrice).toBe(29900);
      expect(customRes.config.price).toBe(29900);
    });
  });
});
