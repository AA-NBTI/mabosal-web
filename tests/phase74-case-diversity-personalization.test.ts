/**
 * tests/phase74-case-diversity-personalization.test.ts
 * 
 * Phase 74: 실전 CASE 다양성·개인화 안정성 검증 테스트 스위트
 * 
 * 핵심 검증 목적:
 * 실전 입력 다양성에 따른 개인화와 데이터 연결 안정성
 * 
 * 4대 핵심 위험 검증:
 * - [위험 A] 동일 명식 · 다른 고민의 개인화 (연애, 직장, 사업/금전, 인간관계, 가족)
 * - [위험 B] 다른 명식 · 동일 고민의 개인화 (동일 이직 고민에 서로 다른 3대 명식 대응)
 * - [위험 C] 고민과 시간축의 연결 (원국, 대운, 세운, 대운×세운 데이터 보존)
 * - [위험 D] CASE 다양화 과정의 19대 데이터 무손실 보존성
 * 
 * 추가 검증:
 * - 복합 고민 (다중 사건 동시 제시 시 Secondary Domain 및 2차 사건 보존)
 * - 상품 출력 단계에서의 개인화 데이터 손실 방지 (Level 1, Level 3, Level 5)
 * - 고객 출력 안전성 및 한자 단독 노출 방지 (한글 우선 원칙)
 * - 결정론 10회 반복 무결성
 */

import { describe, it, expect } from 'vitest';
import {
  ProductGenerator,
  productEvaluator,
  ProductConfig,
  UserProblemInput,
  ProductGenerationResult,
} from '../src/modules/product-generator/index.js';
import { EventProblemClassifier } from '../src/modules/product-generator/problem-classifier.js';

describe('Phase 74: 실전 CASE 다양성·개인화 안정성 검증 Test Suite', () => {
  const generator = new ProductGenerator();
  const classifier = new EventProblemClassifier();

  // ==========================================================================
  // [위험 A] 동일 명식 · 다른 고민의 개인화 검증 (5대 고민)
  // ==========================================================================
  describe('1. 위험 A 검증: 동일 명식 · 다른 고민의 개인화 (5대 도메인)', () => {
    const basePillarsInput = {
      birthDate: '1990-05-15',
      birthTime: '12:00',
      gender: 'male' as const,
    };

    const concernCases = [
      {
        id: 'CASE A (연애)',
        domain: 'LOVE',
        currentConcern: '연인과 결별 후 재회 고민',
        currentEvent: '2년간 교제하던 연인과 사소한 다툼 끝에 헤어졌고 상대방이 연락을 받지 않습니다.',
        desiredQuestion: '왜 이런 일이 생겼고, 다시 연락이 닿아 재회할 수 있을지 알고 싶습니다.',
      },
      {
        id: 'CASE B (직장)',
        domain: 'JOB',
        currentConcern: '직장 상사 갈등 및 이직 타이밍',
        currentEvent: '새로 부임한 부서장의 업무 지시와 마찰이 심해 인사 평가에서 최하점을 받아 이직을 준비 중입니다.',
        desiredQuestion: '지금 바로 사직서를 내고 이직하는 것이 맞는지, 버티는 것이 맞는지 알고 싶습니다.',
      },
      {
        id: 'CASE C (사업/금전)',
        domain: 'BUSINESS',
        currentConcern: '거래처 대금 체납 및 자금 경색',
        currentEvent: '납품 거래처의 갑작스러운 부도로 대금이 묶여 회사 운영 자금과 직원 급여 지급이 위태롭습니다.',
        desiredQuestion: '손실을 막고 사업체를 방어하기 위해 법적 조치와 자금 조달 중 무엇을 우선해야 합니까?',
      },
      {
        id: 'CASE D (인간관계)',
        domain: 'RELATIONSHIP',
        currentConcern: '주변 동료의 구설과 배신',
        currentEvent: '오랫동안 신뢰했던 동료가 제 프로젝트 성과를 가로채고 왜곡된 소문을 퍼뜨려 고립되었습니다.',
        desiredQuestion: '오해를 풀기 위해 직접 맞서 대화해야 하는지, 거리를 두고 침묵해야 하는지 알고 싶습니다.',
      },
      {
        id: 'CASE E (가족)',
        domain: 'MARRIAGE',
        currentConcern: '부모 및 시댁/처가와의 갈등',
        currentEvent: '양가 부모님의 과도한 간섭과 재산 분할 문제로 집안 전체에 냉기류가 흐르고 부부 갈등까지 번졌습니다.',
        desiredQuestion: '가정의 평화를 지키고 갈등을 원만히 중재하려면 어떤 태도를 취해야 합니까?',
      },
    ];

    it('5개 서로 다른 고민에 대해 Primary Domain이 정확하고 독립적으로 분기되어야 한다', () => {
      const results = concernCases.map((c) => {
        return generator.generateProduct({
          ...basePillarsInput,
          currentEvent: c.currentEvent,
          userTrouble: c.currentConcern,
          desiredQuestion: c.desiredQuestion,
        });
      });

      expect(results[0].classification.primaryDomain).toBe('LOVE');
      expect(results[1].classification.primaryDomain).toBe('JOB');
      expect(results[2].classification.primaryDomain).toBe('BUSINESS');
      expect(results[3].classification.primaryDomain).toBe('RELATIONSHIP');
      expect(results[4].classification.primaryDomain).toBe('MARRIAGE');
    });

    it('동일 명식이라도 고민에 따라 사건 진단, 현실 해석, Do/Don\'t 처방이 100% 차별화되어야 한다', () => {
      const results = concernCases.map((c) => {
        return generator.generateProduct({
          ...basePillarsInput,
          currentEvent: c.currentEvent,
          userTrouble: c.currentConcern,
          desiredQuestion: c.desiredQuestion,
        });
      });

      // 5개 케이스의 핵심 사건 및 고객 질문 답변이 모두 달라야 함
      const whyNowAnswers = results.map(r => r.customerDeliverable?.answersTo7Questions.q1_whyNow);
      const uniqueWhyNow = new Set(whyNowAnswers);
      expect(uniqueWhyNow.size).toBe(5);

      // Do / Don't 처방도 고민별 맞춤으로 분기되어야 함
      const avoidList0 = results[0].prescriptionReport?.mustAvoid.join(' ') || '';
      const avoidList1 = results[1].prescriptionReport?.mustAvoid.join(' ') || '';
      const avoidList2 = results[2].prescriptionReport?.mustAvoid.join(' ') || '';

      expect(avoidList0).not.toBe(avoidList2);
      expect(avoidList2).toMatch(/계약|보증|지분/); // 사업 맞춤 Don't
    });

    it('동일 명식이므로 원천 사주팔자(CORE_ORIGINAL) 계산값은 5개 케이스에서 100% 동일해야 한다', () => {
      const results = concernCases.map((c) => {
        return generator.generateProduct({
          ...basePillarsInput,
          currentEvent: c.currentEvent,
          userTrouble: c.currentConcern,
          desiredQuestion: c.desiredQuestion,
        });
      });

      const dayStem0 = results[0].executedModules['CORE_ORIGINAL'].data.dayMaster.stem;
      for (let i = 1; i < results.length; i++) {
        expect(results[i].executedModules['CORE_ORIGINAL'].data.dayMaster.stem).toBe(dayStem0);
        expect(results[i].executedModules['CORE_ORIGINAL'].data.fourPillarsText).toBe(
          results[0].executedModules['CORE_ORIGINAL'].data.fourPillarsText
        );
      }
    });
  });

  // ==========================================================================
  // [위험 B] 다른 명식 · 동일 고민의 개인화 검증 (최소 3개 명식)
  // ==========================================================================
  describe('2. 위험 B 검증: 다른 명식 · 동일 고민의 개인화 (3대 명식)', () => {
    const commonTrouble = {
      currentConcern: '직장 상사와의 불화 및 이직 고민',
      currentEvent: '상사와 업무 방식 차이로 사사건건 부딪히고 있으며, 더 늦기 전에 다른 직장으로 이직해야 할지 고민입니다.',
      desiredQuestion: '직장을 옮기는 것이 좋을까요, 아니면 현재 직장에서 버티며 기회를 보아야 할까요?',
    };

    const differentPersons = [
      {
        id: '명식 1 (1988-12-10 여)',
        birthDate: '1988-12-10',
        birthTime: '14:00',
        gender: 'female' as const,
      },
      {
        id: '명식 2 (1995-05-20 남)',
        birthDate: '1995-05-20',
        birthTime: '18:30',
        gender: 'male' as const,
      },
      {
        id: '명식 3 (1982-04-05 남)',
        birthDate: '1982-04-05',
        birthTime: '06:00',
        gender: 'male' as const,
      },
    ];

    it('동일한 고민이라도 명식에 따라 명리 근거, 원국 지표, 오행 세력이 독립적으로 도출되어야 한다', () => {
      const results = differentPersons.map(p =>
        generator.generateProduct({
          ...p,
          ...commonTrouble,
        })
      );

      // 3개 모두 JOB 도메인
      results.forEach(r => expect(r.classification.primaryDomain).toBe('JOB'));

      // 그러나 일간과 4주 8자가 완전히 다름
      const pillarsTexts = results.map(r => r.executedModules['CORE_ORIGINAL'].data.fourPillarsText);
      const uniquePillars = new Set(pillarsTexts);
      expect(uniquePillars.size).toBe(3);

      // 명리 설명(Information & Interpretation)이 서로 다름
      const info0 = results[0].depthReport.sections[0].content;
      const info1 = results[1].depthReport.sections[0].content;
      const info2 = results[2].depthReport.sections[0].content;
      expect(info0).not.toBe(info1);
      expect(info1).not.toBe(info2);
    });

    it('명식의 지지 상호작용(충·형·원진 등)에 따라 현실 인과 해석이 차별화되어야 한다', () => {
      const results = differentPersons.map(p =>
        generator.generateProduct({
          ...p,
          ...commonTrouble,
        })
      );

      const cause0 = results[0].customerDeliverable?.sections.step3_myeongliCore;
      const cause1 = results[1].customerDeliverable?.sections.step3_myeongliCore;
      const cause2 = results[2].customerDeliverable?.sections.step3_myeongliCore;

      expect(cause0).toBeDefined();
      expect(cause1).toBeDefined();
      expect(cause2).toBeDefined();

      // 서로 다른 기운 충돌 메커니즘 반영 확인
      const uniqueCauses = new Set([cause0, cause1, cause2]);
      expect(uniqueCauses.size).toBe(3);
    });
  });

  // ==========================================================================
  // [위험 C] 고민과 시간축의 연결 검증 (원국, 대운, 세운)
  // ==========================================================================
  describe('3. 위험 C 검증: 고민과 시간축의 연결 및 보존 (NATAL, DAEWUN, SEUN)', () => {
    it('사건 발생 시점(eventDate)과 목표 연도(targetYear)가 시간축 모듈에 무손실 전달되어야 한다', () => {
      const result2024 = generator.generateProduct({
        birthDate: '1988-12-10',
        birthTime: '14:00',
        gender: 'female',
        currentEvent: '2024년 5월 거래처 부도 사태 발생',
        eventDate: '2024-05-20',
        targetYear: 2024,
      });

      const result2026 = generator.generateProduct({
        birthDate: '1988-12-10',
        birthTime: '14:00',
        gender: 'female',
        currentEvent: '2026년 하반기 신규 사업 진출 준비',
        eventDate: '2026-10-15',
        targetYear: 2026,
      });

      // 세운 모듈의 연도가 각각 정확히 설정되었는지 확인
      const seun2024 = result2024.executedModules['SEUN'];
      const seun2026 = result2026.executedModules['SEUN'];

      expect(seun2024.calculation.rawMetrics.targetYear).toBe(2024);
      expect(seun2026.calculation.rawMetrics.targetYear).toBe(2026);

      // 세운 간지도 서로 다름 (2024 갑진 vs 2026 병오)
      expect(seun2024.calculation.rawMetrics.yearGanji).not.toBe(seun2026.calculation.rawMetrics.yearGanji);
    });

    it('사건-모듈 매핑(eventMapping)에 시간축 컨텍스트(timeAxisContext)가 무손실 보존되어야 한다', () => {
      const res = generator.generateProduct(
        {
          birthDate: '1992-03-15',
          birthTime: '08:30',
          gender: 'male',
          currentEvent: '연인과 결별했습니다.',
          targetYear: 2024,
        },
        { insightDepth: 3, personalizedMapping: true }
      );

      expect(res.eventMapping).toBeDefined();
      const relationMapping = res.eventMapping?.mappings.find(m => m.moduleId === 'RELATION');
      if (relationMapping) {
        expect(relationMapping.timeAxisContext).toBeDefined();
        expect(relationMapping.timeAxisContext?.source).toBe('NATAL');
      }
    });
  });

  // ==========================================================================
  // [위험 D] CASE 다양화 과정의 19대 데이터 무손실 보존성 검증
  // ==========================================================================
  describe('4. 위험 D 검증: 19대 핵심 데이터 무손실 보존성 전수 확인', () => {
    it('입력부터 최종 고객 전달물까지 19대 핵심 데이터가 일체 누락 없이 패키징되어야 한다', () => {
      const res = generator.generateProduct(
        {
          birthDate: '1988-12-10',
          birthTime: '14:00',
          gender: 'female',
          currentEvent: '동업자와의 지분 분쟁 및 사업 위기',
          userTrouble: '거래처 부도로 현금 흐름이 막혀 폐업 위기입니다.',
          desiredQuestion: '손실을 막고 회사를 살리기 위해 어떻게 해야 합니까?',
          eventDate: '2024-05-20',
          targetYear: 2024,
        },
        { insightDepth: 5, prescription: true }
      );

      // 1. 원국 (pillars)
      expect(res.executedModules['CORE_ORIGINAL']?.data?.pillars).toBeDefined();

      // 2. 오행 (ohaeng)
      expect(res.executedModules['CORE_ORIGINAL']?.data?.ohaeng).toBeDefined();

      // 3. 십신 (tenGods)
      if (res.executedModules['TEN_GODS']) {
        expect(res.executedModules['TEN_GODS'].success).toBe(true);
      }

      // 4. 관계 (relation: 합충형파해)
      expect(res.executedModules['RELATION']?.success).toBe(true);

      // 5. 신살 (sinsal)
      expect(res.executedModules['SINSAL']?.success).toBe(true);

      // 6. 대운 (daewun)
      expect(res.executedModules['DAEWUN']?.success).toBe(true);

      // 7. 세운 (seun)
      expect(res.executedModules['SEUN']?.success).toBe(true);

      // 8. 시간축 보존
      expect(res.userProblem.eventDate).toBe('2024-05-20');
      expect(res.userProblem.targetYear).toBe(2024);

      // 9. 사건 (currentEvent, userTrouble)
      expect(res.userProblem.currentEvent).toContain('동업자와의 지분 분쟁');
      expect(res.userProblem.userTrouble).toContain('거래처 부도');

      // 10. 마·살 (magaDiagnosis)
      expect(res.magaDiagnosis).toBeDefined();

      // 11. 현실 해석 (caseProtocol & depthReport)
      expect(res.caseProtocol).toBeDefined();
      expect(res.depthReport.sections.length).toBeGreaterThanOrEqual(4);

      // 12. 환경 처방 (environmentGuidance)
      expect(res.customerDeliverable?.sections.step7_environmentPrescription).toBeDefined();

      // 13. 행동 처방 (mustDo, mustAvoid)
      expect(res.prescriptionReport?.mustDo.length).toBeGreaterThanOrEqual(1);
      expect(res.prescriptionReport?.mustAvoid.length).toBeGreaterThanOrEqual(1);

      // 14. 처방물 (remedyItems)
      expect(res.customerDeliverable?.sections.step9_remedyItems).toBeDefined();

      // 15. 상품 구성 (config)
      expect(res.config.insightDepth).toBe(5);

      // 16. 버전 정보 (trace)
      expect(res.trace).toBeDefined();
      expect(res.trace?.engineReleaseVersion).toBe('1.0.0');
      expect(res.trace?.productConfigVersion).toBe('2.0.0');

      // 17. 고객 전달물 (customerDeliverable)
      expect(res.customerDeliverable).toBeDefined();

      // 18. 7대 질문 직답
      expect(res.customerDeliverable?.answersTo7Questions.q1_whyNow).toBeDefined();

      // 19. 가격 정보 (pricing)
      expect(res.pricing.calculatedPrice).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // [복합 고민] 다중 사건 동시 제시 케이스 검증
  // ==========================================================================
  describe('5. 복합 고민 검증: 다중 사건 제시 시 2차 도메인 및 다중 사건 보존', () => {
    it('직장과 연애가 복합된 고민에서 Primary와 Secondary 도메인이 모두 식별되어야 한다', () => {
      const complexInput: UserProblemInput = {
        birthDate: '1992-03-15',
        birthTime: '08:30',
        gender: 'male',
        currentEvent: '최근 회사에서 퇴사 압박을 받고 있으며, 엎친 데 덮친 격으로 연인과도 결별했습니다.',
        userTrouble: '직장도 불안하고 연애도 끝나버려 마음이 무너져 내립니다. 무엇부터 해결해야 합니까?',
        desiredQuestion: '앞으로의 흐름과 우선순위로 대응해야 할 처방을 알고 싶습니다.',
      };

      const classification = classifier.classify(complexInput);

      // 1차 도메인은 JOB (또는 LOVE)
      expect(['JOB', 'LOVE']).toContain(classification.primaryDomain);

      // 2차 도메인에 다른 영역이 무손실 포함되어야 함
      if (classification.primaryDomain === 'JOB') {
        expect(classification.secondaryDomains).toContain('LOVE');
      } else {
        expect(classification.secondaryDomains).toContain('JOB');
      }

      // 추천 모듈에 양 도메인 관련 모듈이 모두 포함됨
      expect(classification.recommendedModules).toContain('JOB');
      expect(classification.recommendedModules).toContain('LOVE');
    });
  });

  // ==========================================================================
  // [상품 출력] 개인화 데이터의 계층적 보존 검증 (Level 1, 3, 5)
  // ==========================================================================
  describe('6. 상품 출력 검증: Level별 개인화 데이터 손실 방지', () => {
    it('Level 1, Level 3, Level 5 상품 모두에서 고객 고유 사건 내용이 무손실 유지되어야 한다', () => {
      const input: UserProblemInput = {
        birthDate: '1988-12-10',
        birthTime: '14:00',
        gender: 'female',
        currentEvent: '거래처 부도로 인한 긴급 채무 압박',
        desiredQuestion: '손실을 막을 수 있는 현실적 방법을 알려주세요.',
      };

      const prod1 = generator.generateProduct(input, { insightDepth: 1 });
      const prod3 = generator.generateProduct(input, { insightDepth: 3 });
      const prod5 = generator.generateProduct(input, { insightDepth: 5, prescription: true });

      // 세 등급 모두 고객의 사건과 질문을 무손실 유지
      expect(prod1.userProblem.currentEvent).toBe(input.currentEvent);
      expect(prod3.userProblem.currentEvent).toBe(input.currentEvent);
      expect(prod5.userProblem.currentEvent).toBe(input.currentEvent);

      // 고객 전달물의 1단계(지금 무슨 일이 생겼는가)에 사건이 온전히 반영됨
      expect(prod1.customerDeliverable?.sections.step1_currentEvent).toContain(input.currentEvent);
      expect(prod3.customerDeliverable?.sections.step1_currentEvent).toContain(input.currentEvent);
      expect(prod5.customerDeliverable?.sections.step1_currentEvent).toContain(input.currentEvent);

      // 깊이에 따른 정보량 증가
      expect(prod1.depthReport.sections.length).toBeLessThan(prod3.depthReport.sections.length);
      expect(prod3.depthReport.sections.length).toBeLessThan(prod5.depthReport.sections.length);
    });
  });

  // ==========================================================================
  // [고객 언어 & 안전성] 단독 한자 배제 및 금지 표현 차단 검증
  // ==========================================================================
  describe('7. 고객 언어 & 안전성 검증 (한자 단독 노출 방지 및 비결정론 가드)', () => {
    it('고객 전달물에 단독 한자가 노출되지 않고 한글 명칭이 우선되어야 한다', () => {
      const res = generator.generateProduct({
        birthDate: '1992-03-15',
        birthTime: '08:30',
        gender: 'male',
        currentEvent: '연인과 이별 후 극심한 우울과 방황',
      });

      const fullText = res.customerDeliverable!.fullFormattedText;

      // 정규식: 한자가 괄호 없이 한글 뒤나 단독으로 쓰인 케이스 검사
      // 괄호 안에 병기된 형태(예: '충(沖)', '목(木)')는 허용,
      // 그러나 한자만 덩그러니 홀로 놓인 문단은 없어야 함
      const lines = fullText.split('\n');
      for (const line of lines) {
        // 공백으로 단어 분리
        const words = line.trim().split(/\s+/);
        for (const word of words) {
          // 순수 한자로만 이루어진 2자 이상의 단어 (예: "寅申", "子午") 배제 확인
          if (/^[\u4E00-\u9FFF]{2,}$/.test(word)) {
            throw new Error(`한자 단독 노출 감지: "${word}" in line: "${line}"`);
          }
        }
      }
    });

    it('확정적 파국 예언("반드시 사고가 난다", "반드시 파산한다" 등)이 완전히 차단되어야 한다', () => {
      const sensitiveInputs: UserProblemInput[] = [
        {
          birthDate: '1982-04-05',
          birthTime: '06:00',
          gender: 'male',
          currentEvent: '코인 및 선물 투자로 10억 파산 위기',
          userTrouble: '전 재산을 잃고 사채 빚까지 져서 극단적 선택까지 생각 중입니다.',
        },
        {
          birthDate: '1986-08-15',
          birthTime: '16:00',
          gender: 'male',
          currentEvent: '암 의심 진단을 받고 정밀 검사 대기 중입니다.',
          userTrouble: '의사가 수술을 권유하는데 살 수 있을지 두렵습니다.',
        },
      ];

      for (const input of sensitiveInputs) {
        const res = generator.generateProduct(input, { insightDepth: 5, prescription: true });
        const text = res.customerDeliverable!.fullFormattedText;

        expect(text).not.toMatch(/반드시\s*(사고|파산|이혼|죽|병|실패)/);
        expect(text).not.toMatch(/무조건\s*(병|실패|망|파산)/);
        expect(text).not.toMatch(/100%\s*(망한다|헤어진다|성공한다|실패한다)/);
        expect(res.customerDeliverable?.safetyPassed).toBe(true);
      }
    });
  });

  // ==========================================================================
  // [결정론] 10회 반복 실행 무결성 검증
  // ==========================================================================
  describe('8. 결정론 10회 반복 실행 무결성 검증', () => {
    it('동일 입력에 대해 10회 반복 실행 시 고객 전달물과 trace가 100% 동일해야 한다', () => {
      const input: UserProblemInput = {
        birthDate: '1995-05-20',
        birthTime: '18:30',
        gender: 'male',
        currentEvent: '직장 상사 괴롭힘으로 이직 준비',
        desiredQuestion: '이직 성공 시기와 추천 전략을 알려주세요.',
      };

      const runs: string[] = [];
      const traceHashes: string[] = [];

      for (let i = 0; i < 10; i++) {
        const res = generator.generateProduct(input, { insightDepth: 4 });
        runs.push(res.customerDeliverable!.fullFormattedText);
        traceHashes.push(res.trace?.snapshotHash || '');
      }

      for (let i = 1; i < 10; i++) {
        expect(runs[i]).toBe(runs[0]);
        expect(traceHashes[i]).toBe(traceHashes[0]);
      }
    });
  });
});
