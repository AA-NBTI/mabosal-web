/**
 * tests/phase73-customer-e2e.test.ts
 * 
 * Phase 73: 실제 고객 입력 → 최종 결과물 E2E 정밀 검증 테스트 스위트
 * 
 * 검증 흐름:
 * 고객 입력 → 문제 분류 → 명리 계산 → 사건 진단 → 마·살 진단 → 처방 → 상품 조합 → 해석 → 최종 고객 결과물
 * 
 * 검증 항목:
 * - [E2E-01 ~ E2E-08] 고객 입력 처리 검증 (출생일, 출생시간, 고민, 사건, 사건일자, Primary/Secondary Domain, 핵심 의도)
 * - [E2E-09 ~ E2E-13] 사건 → 명리 연결 검증 (관련 모듈 인과, 원국 근거, 시간축 일치, 마·살 연결, 비인과 배제)
 * - [E2E-14 ~ E2E-20] 처방 연결 검증 (환경 처방, 행동 처방, 처방물, 명리 근거 연결, 사건 연결, 실행 가능성, 공포 조장 배제)
 * - [E2E-21 ~ E2E-25] 상품별 차별성 검증 (상품 A/B/C 차이, 가격 독립성, 모듈 추가 시 정보 증가, LEVEL 증가 시 깊이 증가)
 * - [7대 핵심 고객 질문 검증] 질문 1~7에 대한 직접적이고 명확한 응답 완결성
 * - [10단계 고객 결과 구조 검증] Section 6 권장 순서 무손실 패키징
 * - [고객 언어 및 판단 강도 검증] 명리 용어의 친절한 일상 언어 변환 및 명확한 판단 문구
 * - [안전성 및 금지 표현 검증] 확정적 파국 예언 차단 및 전문 영역 면책 고지
 * - [결정론 10회 반복 검증] 동일 조건 10회 실행 100% 동일 결과 및 스냅샷 해시 일치
 * - [CASE 01 ~ 05 실전 E2E 검증] 연애, 사업, 직장, 재물, 건강
 * - [동일 사주 / 다른 문제 & 다른 사주 / 동일 문제] 실질적 진단/처방 분기 검증
 * - [11대 점수 평가 검증] Section 11 핵심 항목별 100점 만점 검증
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

describe('Phase 73: 실제 고객 입력 → 최종 결과물 E2E 검증 Test Suite', () => {
  const generator = new ProductGenerator();
  const classifier = new EventProblemClassifier();

  // 실제 고객 언어로 작성된 실전 5대 CASE 시나리오
  const customerCases = [
    {
      caseId: 'CASE 01',
      domain: 'LOVE' as const,
      birthDate: '1992-03-15',
      birthTime: '08:30',
      gender: 'male' as const,
      eventDate: '2024-03-15',
      currentConcern: '최근 연인과 갑자기 헤어졌습니다.',
      currentEvent: '2년간 교제 끝에 사소한 다툼이 번져 상대방이 이별을 통보하고 연락을 차단했습니다.',
      desiredQuestion: '왜 이런 일이 반복되는지, 앞으로 연애가 다시 풀릴 가능성이 있는지 궁금합니다.',
    },
    {
      caseId: 'CASE 02',
      domain: 'BUSINESS' as const,
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female' as const,
      eventDate: '2024-05-20',
      currentConcern: '거래처 대금 체납과 동업자와의 지분 갈등으로 회사가 위태롭습니다.',
      currentEvent: '주요 거래처가 부도 처리되며 자금 회수가 막히고, 동업자가 일방적으로 지분 분할을 요구하고 있습니다.',
      desiredQuestion: '손실을 막고 사업을 지키기 위해 지금 당장 어떤 결정을 내려야 하는지 알고 싶습니다.',
    },
    {
      caseId: 'CASE 03',
      domain: 'JOB' as const,
      birthDate: '1995-05-20',
      birthTime: '18:30',
      gender: 'male' as const,
      eventDate: '2025-02-10',
      currentConcern: '새로 온 직장 상사와의 극심한 불화로 퇴사를 고민 중입니다.',
      currentEvent: '업무 스타일 차이로 공개적인 비난을 받고 인사고과에서 최하점을 받아 좌천 위기입니다.',
      desiredQuestion: '지금 퇴사하고 이직하는 것이 맞는지, 아니면 버티며 기회를 보아야 하는지 알고 싶습니다.',
    },
    {
      caseId: 'CASE 04',
      domain: 'MONEY' as const,
      birthDate: '1982-04-05',
      birthTime: '06:00',
      gender: 'male' as const,
      eventDate: '2024-06-15',
      currentConcern: '무리한 투자 실패로 빚이 늘어나 생활이 어렵습니다.',
      currentEvent: '지인의 권유로 시작한 무리한 레버리지 투자로 원금을 모두 잃고 채무 압박에 시달리고 있습니다.',
      desiredQuestion: '현금 흐름을 회복하고 손실을 최소화할 수 있는 현실적 대책이 무엇인지 알고 싶습니다.',
    },
    {
      caseId: 'CASE 05',
      domain: 'HEALTH' as const,
      birthDate: '1986-08-15',
      birthTime: '16:00',
      gender: 'male' as const,
      eventDate: '2024-08-01',
      currentConcern: '극심한 피로와 통증으로 병원에서 수술을 권유받았습니다.',
      currentEvent: '만성 허리 통증이 악화되어 정밀 검사 결과 척추 디스크 파열 진단과 긴급 수술 소견을 받았습니다.',
      desiredQuestion: '지금 바로 수술을 받는 것이 맞는지, 신체 기력이 언제쯤 회복될지 알고 싶습니다.',
    },
  ];

  // ==========================================================================
  // 1. 고객 입력 처리 검증 (E2E-01 ~ E2E-08)
  // ==========================================================================
  describe('1. 고객 입력 처리 검증 (E2E-01 ~ E2E-08)', () => {
    it('E2E-01 & E2E-02: 출생정보 및 출생시간 정상 인식 (평탄화 및 중첩 객체 모두 무손실 인식)', () => {
      // 평탄화 입력
      const resFlat = generator.generateProduct({
        birthDate: '1992-03-15',
        birthTime: '08:30',
        gender: 'male',
        currentEvent: '최근 연인과 결별했습니다.',
      });
      expect(resFlat.userProblem.birthDate).toBe('1992-03-15');
      expect(resFlat.userProblem.birthTime).toBe('08:30');
      expect(resFlat.userProblem.gender).toBe('male');

      // 중첩 birthData 입력
      const resNested = generator.generateProduct({
        birthData: {
          birthDate: '1988-12-10',
          birthTime: '14:00',
          gender: 'female',
        },
        currentEvent: '사업 위기 및 파트너 충돌',
      });
      expect(resNested.userProblem.birthDate).toBe('1988-12-10');
      expect(resNested.userProblem.birthTime).toBe('14:00');
      expect(resNested.userProblem.gender).toBe('female');
    });

    it('E2E-03 ~ E2E-05: 현재 고민, 사건 내용, 사건 날짜 정상 추출', () => {
      const input: UserProblemInput = {
        birthDate: '1995-05-20',
        birthTime: '18:30',
        gender: 'male',
        currentEvent: '새로 온 직장 상사와의 극심한 불화로 퇴사를 고민 중입니다.',
        userTrouble: '업무 스타일 차이로 공개적인 비난을 받고 인사고과에서 최하점을 받아 좌천 위기입니다.',
        eventDate: '2025-02-10',
      };
      const res = generator.generateProduct(input);
      expect(res.userProblem.currentEvent).toContain('새로 온 직장 상사와의 극심한 불화');
      expect(res.userProblem.userTrouble).toContain('업무 스타일 차이로 공개적인 비난');
      expect(res.userProblem.eventDate).toBe('2025-02-10');
    });

    it('E2E-06 & E2E-07: Primary Domain 정확성 및 Secondary Domain 정상 추출', () => {
      for (const c of customerCases) {
        const classification = classifier.classify({
          currentEvent: c.currentEvent,
          userTrouble: c.currentConcern,
          desiredQuestion: c.desiredQuestion,
        });
        expect(classification.primaryDomain).toBe(c.domain);
        // 부가 도메인 확인
        expect(Array.isArray(classification.secondaryDomains)).toBe(true);
      }
    });

    it('E2E-08: 고객 질문의 핵심 의도 보존', () => {
      const c = customerCases[0];
      const res = generator.generateProduct({
        birthDate: c.birthDate,
        birthTime: c.birthTime,
        gender: c.gender,
        currentEvent: c.currentEvent,
        desiredQuestion: c.desiredQuestion,
      });
      expect(res.userProblem.desiredQuestion).toBe(c.desiredQuestion);
      expect(res.customerDeliverable?.answersTo7Questions.q1_whyNow).toBeDefined();
      expect(res.customerDeliverable?.sections.step1_currentEvent).toContain(c.desiredQuestion);
    });
  });

  // ==========================================================================
  // 2. 사건 → 명리 연결 검증 (E2E-09 ~ E2E-13)
  // ==========================================================================
  describe('2. 사건 → 명리 연결 검증 (E2E-09 ~ E2E-13)', () => {
    it('E2E-09: 사건과 관련 없는 모듈이 핵심 원인으로 선택되지 않는가', () => {
      const loveRes = generator.generateProduct({
        birthDate: customerCases[0].birthDate,
        birthTime: customerCases[0].birthTime,
        gender: customerCases[0].gender,
        currentEvent: customerCases[0].currentEvent,
        desiredQuestion: customerCases[0].desiredQuestion,
      });
      // 연애 문제에서 핵심 추천 모듈에 RELATION, LOVE, SINSAL 등이 포함되어야 함
      expect(loveRes.config.selectedModules).toContain('RELATION');
      expect(loveRes.config.selectedModules).toContain('LOVE');
      expect(loveRes.classification.primaryDomain).toBe('LOVE');
    });

    it('E2E-10: 관련 명리 근거가 실제 원국에 존재하는가', () => {
      const res = generator.generateProduct({
        birthDate: '1992-03-15',
        birthTime: '08:30',
        gender: 'male',
        currentEvent: customerCases[0].currentEvent,
      });
      const coreMod = res.executedModules['CORE_ORIGINAL'];
      expect(coreMod.success).toBe(true);
      expect(coreMod.data.pillars).toBeDefined();
      expect(coreMod.data.pillars.day.stem).toBeDefined();
      expect(coreMod.data.pillars.day.branch).toBeDefined();
    });

    it('E2E-11: 대운/세운 시점이 실제 사건 시점과 일치하는가', () => {
      const res = generator.generateProduct({
        birthDate: '1988-12-10',
        birthTime: '14:00',
        gender: 'female',
        currentEvent: customerCases[1].currentEvent,
        eventDate: '2024-05-20',
        targetYear: 2024,
      });
      const seunMod = res.executedModules['SEUN'];
      if (seunMod) {
        expect(seunMod.calculation.rawMetrics?.targetYear).toBe(2024);
      }
      expect(res.userProblem.eventDate).toBe('2024-05-20');
    });

    it('E2E-12: 마·살이 사건과 연결되는가', () => {
      const res = generator.generateProduct({
        birthDate: '1988-12-10',
        birthTime: '14:00',
        gender: 'female',
        currentEvent: customerCases[1].currentEvent,
      });
      expect(res.magaDiagnosis).toBeDefined();
      expect(res.customerDeliverable?.sections.step4_magaCaution).toBeDefined();
    });

    it('E2E-13: 근거 없는 인과관계를 만들어내지 않는가', () => {
      const res = generator.generateProduct({
        birthDate: customerCases[2].birthDate,
        birthTime: customerCases[2].birthTime,
        gender: customerCases[2].gender,
        currentEvent: customerCases[2].currentEvent,
      });
      // 단정적 표현 대신 구조적 취약점 및 환경적 촉발 요인으로 설명하는지 검증
      expect(res.customerDeliverable?.sections.step3_myeongliCore).not.toMatch(/반드시\s*망한다|100%\s*파국/);
      expect(res.customerDeliverable?.sections.step3_myeongliCore).toContain('기운');
    });
  });

  // ==========================================================================
  // 3. 고객 결과 구조 및 고객 언어 검증 (Section 6, 7, 8)
  // ==========================================================================
  describe('3. 고객 결과 구조 및 고객 언어 검증 (Section 6, 7, 8)', () => {
    it('권장 10단계 고객 결과 구조 무손실 구성 확인', () => {
      const res = generator.generateProduct({
        birthDate: customerCases[0].birthDate,
        birthTime: customerCases[0].birthTime,
        gender: customerCases[0].gender,
        currentEvent: customerCases[0].currentEvent,
      });
      const sections = res.customerDeliverable!.sections;
      expect(sections.step1_currentEvent).toBeDefined();
      expect(sections.step2_whyOccurred).toBeDefined();
      expect(sections.step3_myeongliCore).toBeDefined();
      expect(sections.step4_magaCaution).toBeDefined();
      expect(sections.step5_futureFlow).toBeDefined();
      expect(sections.step6_whatToChange).toBeDefined();
      expect(sections.step7_environmentPrescription).toBeDefined();
      expect(sections.step8_behaviorPrescription).toBeDefined();
      expect(sections.step9_remedyItems).toBeDefined();
      expect(sections.step10_finalSummary).toBeDefined();
    });

    it('고객 언어 검증: 내부 명리 용어를 날것으로 나열하지 않고 자연스러운 일상어로 번역', () => {
      const res = generator.generateProduct({
        birthDate: customerCases[0].birthDate,
        birthTime: customerCases[0].birthTime,
        gender: customerCases[0].gender,
        currentEvent: customerCases[0].currentEvent,
      });
      const myeongliText = res.customerDeliverable!.sections.step3_myeongliCore;
      // 일반 고객이 이해할 수 있는 자연어 설명 확인
      expect(myeongliText).toMatch(/관계|기운|시기|환경/);
    });

    it('판단 강도 검증: 명리학적 근거 기반 명확한 판단 문구 사용 및 확정적 미래 단정 배제', () => {
      const res = generator.generateProduct({
        birthDate: customerCases[1].birthDate,
        birthTime: customerCases[1].birthTime,
        gender: customerCases[1].gender,
        currentEvent: customerCases[1].currentEvent,
      });
      expect(res.customerDeliverable?.verdictStrength).toMatch(/주의가 필요하며|관리하는 것이 좋습니다|강하게/);
      expect(res.customerDeliverable?.fullFormattedText).not.toMatch(/100%\s*망한다|반드시\s*사고/);
    });
  });

  // ==========================================================================
  // 4. 처방 연결 검증 (E2E-14 ~ E2E-20)
  // ==========================================================================
  describe('4. 처방 연결 검증 (E2E-14 ~ E2E-20)', () => {
    it('E2E-14 & E2E-15 & E2E-16: 환경 처방, 행동 처방, 처방물 연결 확인', () => {
      const res = generator.generateProduct(
        {
          birthDate: customerCases[0].birthDate,
          birthTime: customerCases[0].birthTime,
          gender: customerCases[0].gender,
          currentEvent: customerCases[0].currentEvent,
        },
        { insightDepth: 5, prescription: true }
      );
      // 환경 처방
      expect(res.customerDeliverable?.sections.step7_environmentPrescription).toContain('공간 및 환경');
      // 행동 처방
      expect(res.customerDeliverable?.sections.step8_behaviorPrescription).toContain('핵심 행동 수칙');
      // 처방물
      expect(res.customerDeliverable?.sections.step9_remedyItems).toContain('상징적 보조 처방물');
    });

    it('E2E-17 & E2E-18: 처방과 명리 근거 및 사건의 연결성', () => {
      const res = generator.generateProduct({
        birthDate: customerCases[1].birthDate,
        birthTime: customerCases[1].birthTime,
        gender: customerCases[1].gender,
        currentEvent: customerCases[1].currentEvent,
      });
      // 비즈니스 사건 맞춤 Don't 포함 확인
      const mustAvoidText = res.prescriptionReport?.mustAvoid.join(' ');
      expect(mustAvoidText).toMatch(/계약|보증|지분|실사/);
    });

    it('E2E-19 & E2E-20: 실행 가능성 및 과도한 공포 조장 배제', () => {
      const res = generator.generateProduct({
        birthDate: customerCases[3].birthDate,
        birthTime: customerCases[3].birthTime,
        gender: customerCases[3].gender,
        currentEvent: customerCases[3].currentEvent,
      });
      // 공포 조장 배제 및 일상적 실천 항목 존재 확인
      expect(res.customerDeliverable?.safetyPassed).toBe(true);
      expect(res.prescriptionReport?.mustDo.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ==========================================================================
  // 5. 상품별 차별성 검증 (E2E-21 ~ E2E-25)
  // ==========================================================================
  describe('5. 상품별 차별성 검증 (E2E-21 ~ E2E-25)', () => {
    it('E2E-21 & E2E-22: 상품 A, B, C 간의 실질적 정보량 및 섹션 차별성', () => {
      const c = customerCases[0];

      // 상품 A (LEVEL 1: 기본 정보)
      const prodA = generator.generateProduct(
        { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender, currentEvent: c.currentEvent },
        { insightDepth: 1, caseExplanation: false, timingAnalysis: false, responseGuidance: false, prescription: false }
      );

      // 상품 B (LEVEL 3: 사건 인과 분석)
      const prodB = generator.generateProduct(
        { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender, currentEvent: c.currentEvent },
        { insightDepth: 3, caseExplanation: true, timingAnalysis: false, responseGuidance: false, prescription: false }
      );

      // 상품 C (LEVEL 5: 종합 처방 패키지)
      const prodC = generator.generateProduct(
        { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender, currentEvent: c.currentEvent },
        { insightDepth: 5, caseExplanation: true, timingAnalysis: true, responseGuidance: true, prescription: true }
      );

      // A < B < C 섹션 수 및 전체 리포트 길이 증가 확인
      expect(prodA.depthReport.sections.length).toBeLessThan(prodB.depthReport.sections.length);
      expect(prodB.depthReport.sections.length).toBeLessThan(prodC.depthReport.sections.length);
      expect(prodA.depthReport.fullDocument.length).toBeLessThan(prodB.depthReport.fullDocument.length);
      expect(prodB.depthReport.fullDocument.length).toBeLessThan(prodC.depthReport.fullDocument.length);
    });

    it('E2E-23: 가격만 변경했을 때 명리·진단·처방 불변', () => {
      const c = customerCases[0];
      const prodPrice1 = generator.generateProduct(
        { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender, currentEvent: c.currentEvent },
        { insightDepth: 4, price: 39000 }
      );
      const prodPrice2 = generator.generateProduct(
        { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender, currentEvent: c.currentEvent },
        { insightDepth: 4, price: 99000 }
      );

      // 가격 필드만 다르고, 모든 진단 텍스트는 100% 동일
      expect(prodPrice1.config.price).toBe(39000);
      expect(prodPrice2.config.price).toBe(99000);
      expect(prodPrice1.customerDeliverable?.sections.step3_myeongliCore).toBe(
        prodPrice2.customerDeliverable?.sections.step3_myeongliCore
      );
      expect(prodPrice1.depthReport.fullDocument).toBe(prodPrice2.depthReport.fullDocument);
    });

    it('E2E-24 & E2E-25: 모듈 추가 및 LEVEL 증가 시 깊이 순증', () => {
      const c = customerCases[1];
      const level2 = generator.generateProduct(
        { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender, currentEvent: c.currentEvent },
        { insightDepth: 2 }
      );
      const level4 = generator.generateProduct(
        { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender, currentEvent: c.currentEvent },
        { insightDepth: 4 }
      );
      expect(level4.depthReport.sections.length).toBeGreaterThan(level2.depthReport.sections.length);
      expect(level4.depthReport.fullDocument.length).toBeGreaterThan(level2.depthReport.fullDocument.length);
    });
  });

  // ==========================================================================
  // 6. 7대 핵심 고객 질문에 대한 답변 완결성 (Section 12)
  // ==========================================================================
  describe('6. 7대 핵심 고객 질문에 대한 직답 완결성 (Section 12)', () => {
    it('7개 고객 질문에 대해 누락 없이 구체적인 답변을 제공하는가', () => {
      const res = generator.generateProduct({
        birthDate: customerCases[0].birthDate,
        birthTime: customerCases[0].birthTime,
        gender: customerCases[0].gender,
        currentEvent: customerCases[0].currentEvent,
        desiredQuestion: customerCases[0].desiredQuestion,
      });

      const q = res.customerDeliverable!.answersTo7Questions;

      // 질문 1: "왜 지금 이런 일이 생겼습니까?"
      expect(q.q1_whyNow).toBeDefined();
      expect(q.q1_whyNow).toContain('왜 지금 이런 일이 생겼습니까?');

      // 질문 2: "명리적으로 무엇이 문제입니까?"
      expect(q.q2_myeongliIssue).toBeDefined();
      expect(q.q2_myeongliIssue).toContain('명리적으로 무엇이 문제입니까?');

      // 질문 3: "언제까지 관리해야 합니까?"
      expect(q.q3_timingPeriod).toBeDefined();
      expect(q.q3_timingPeriod).toContain('언제까지 관리해야 합니까?');

      // 질문 4: "제가 무엇을 하면 됩니까?"
      expect(q.q4_actionToDo).toBeDefined();
      expect(q.q4_actionToDo).toContain('제가 무엇을 하면 됩니까?');

      // 질문 5: "환경을 어떻게 바꾸면 됩니까?"
      expect(q.q5_environmentChange).toBeDefined();
      expect(q.q5_environmentChange).toContain('환경을 어떻게 바꾸면 됩니까?');

      // 질문 6: "이 문제를 줄이기 위해 어떤 처방이 필요합니까?"
      expect(q.q6_prescriptionNeeded).toBeDefined();
      expect(q.q6_prescriptionNeeded).toContain('어떤 처방이 필요합니까?');

      // 질문 7: "앞으로 무엇을 조심해야 합니까?"
      expect(q.q7_cautionToWatch).toBeDefined();
      expect(q.q7_cautionToWatch).toContain('무엇을 조심해야 합니까?');
    });
  });

  // ==========================================================================
  // 7. 안전성 및 면책 공지 검증 (Section 14)
  // ==========================================================================
  describe('7. 안전성 및 면책 공지 검증 (Section 14)', () => {
    it('금지된 단정적 표현이 일체 존재하지 않고 면책 고지가 준수되는가', () => {
      for (const c of customerCases) {
        const res = generator.generateProduct({
          birthDate: c.birthDate,
          birthTime: c.birthTime,
          gender: c.gender,
          currentEvent: c.currentEvent,
          desiredQuestion: c.desiredQuestion,
        });

        const fullText = res.customerDeliverable!.fullFormattedText;

        // 금지 표현 차단
        expect(fullText).not.toMatch(/죽는다/);
        expect(fullText).not.toMatch(/반드시\s*사고/);
        expect(fullText).not.toMatch(/무조건\s*병에/);
        expect(fullText).not.toMatch(/투자하면\s*반드시\s*돈을\s*번다/);
        expect(fullText).not.toMatch(/이\s*처방을\s*하면\s*운명이\s*바뀐다/);
        expect(fullText).not.toMatch(/부적을\s*사용하면\s*문제가\s*해결된다/);

        // 상징 처방물 안전 원칙 명시
        expect(fullText).toContain('초자연적 효능이나 운명의 변화를 보장하지 않습니다');

        // safetyPassed 플래그 통과
        expect(res.customerDeliverable?.safetyPassed).toBe(true);
      }
    });
  });

  // ==========================================================================
  // 8. 결정론 10회 반복 검증 (Section 15)
  // ==========================================================================
  describe('8. 결정론 10회 반복 검증 (Section 15)', () => {
    it('동일 고객 입력 + 동일 ProductConfig 10회 실행 시 100% 동일 결과 보장', () => {
      const c = customerCases[0];
      const runs: string[] = [];

      for (let i = 0; i < 10; i++) {
        const res = generator.generateProduct(
          {
            birthDate: c.birthDate,
            birthTime: c.birthTime,
            gender: c.gender,
            currentEvent: c.currentEvent,
            desiredQuestion: c.desiredQuestion,
          },
          {
            productId: 'PROD_TEST_DETERMINISTIC',
            insightDepth: 5,
            price: 59000,
          }
        );
        runs.push(res.customerDeliverable!.fullFormattedText);
      }

      // 첫 번째 결과와 나머지 9회 결과가 문자 단위로 100% 일치
      for (let i = 1; i < 10; i++) {
        expect(runs[i]).toBe(runs[0]);
      }
    });
  });

  // ==========================================================================
  // 9. CASE 01 ~ CASE 05 실전 E2E 종합 검증 (Section 16)
  // ==========================================================================
  describe('9. CASE 01 ~ CASE 05 실전 E2E 종합 검증 (Section 16)', () => {
    customerCases.forEach((c) => {
      it(`E2E 실전 검증: ${c.caseId} (${c.domain})`, () => {
        const res = generator.generateProduct({
          birthDate: c.birthDate,
          birthTime: c.birthTime,
          gender: c.gender,
          currentEvent: c.currentEvent,
          userTrouble: c.currentConcern,
          desiredQuestion: c.desiredQuestion,
          eventDate: c.eventDate,
        });

        // 1. 도메인 분류 정확성
        expect(res.classification.primaryDomain).toBe(c.domain);

        // 2. 고객 전달 문서 생성 확인
        expect(res.customerDeliverable).toBeDefined();
        expect(res.customerDeliverable?.sections.step1_currentEvent).toContain(c.currentEvent);

        // 3. 7개 질문 응답 완결성
        expect(res.customerDeliverable?.answersTo7Questions.q1_whyNow).toBeDefined();
        expect(res.customerDeliverable?.answersTo7Questions.q4_actionToDo).toBeDefined();

        // 4. 안전성
        expect(res.customerDeliverable?.safetyPassed).toBe(true);

        // 5. 평가 점수 판정
        const evaluation = productEvaluator.evaluateProduct(res);
        expect(evaluation.myeongliAccuracy).toBe(100);
        expect(evaluation.personalization).toBe(100);
        expect(evaluation.customerResultQuality).toBe(100);
        expect(evaluation.safety).toBe(100);
      });
    });
  });

  // ==========================================================================
  // 10. 동일 사주 / 다른 문제 & 다른 사주 / 동일 문제 검증 (Section 17, 18)
  // ==========================================================================
  describe('10. 교차 분기 검증 (동일 사주/다른 문제 & 다른 사주/동일 문제)', () => {
    it('동일 사주에 서로 다른 문제(LOVE vs BUSINESS vs JOB) 입력 시 결과 실질적 분기', () => {
      const birthData = {
        birthDate: '1990-05-15',
        birthTime: '12:00',
        gender: 'male' as const,
      };

      const loveRes = generator.generateProduct({
        ...birthData,
        currentEvent: '최근 연인과 크게 다투고 이별을 통보받았습니다.',
        desiredQuestion: '다시 연락이 올 수 있을지 알고 싶습니다.',
      });

      const bizRes = generator.generateProduct({
        ...birthData,
        currentEvent: '동업자와의 지분 문제로 법적 분쟁을 준비하고 있습니다.',
        desiredQuestion: '손실을 막고 회사를 지킬 수 있을지 알고 싶습니다.',
      });

      const jobRes = generator.generateProduct({
        ...birthData,
        currentEvent: '직장 상사와의 마찰로 인사 평가 불이익을 당했습니다.',
        desiredQuestion: '지금 이직을 준비하는 것이 맞을지 알고 싶습니다.',
      });

      // 1. 도메인 분기
      expect(loveRes.classification.primaryDomain).toBe('LOVE');
      expect(bizRes.classification.primaryDomain).toBe('BUSINESS');
      expect(jobRes.classification.primaryDomain).toBe('JOB');

      // 2. 처방 및 권장 Don't 실질적 분기
      const loveAvoid = loveRes.prescriptionReport?.mustAvoid.join(' ') || '';
      const bizAvoid = bizRes.prescriptionReport?.mustAvoid.join(' ') || '';
      expect(loveAvoid).not.toBe(bizAvoid);
      expect(bizAvoid).toMatch(/계약|보증|지분/);

      // 3. 질문 응답 텍스트 분기
      expect(loveRes.customerDeliverable?.answersTo7Questions.q1_whyNow).not.toBe(
        bizRes.customerDeliverable?.answersTo7Questions.q1_whyNow
      );
    });

    it('서로 다른 사주에 동일한 문제(LOVE) 입력 시 명리 근거 분기', () => {
      const personA = generator.generateProduct({
        birthDate: '1985-02-10',
        birthTime: '09:00',
        gender: 'male',
        currentEvent: '연인과 결별했습니다. 재회가 가능할까요?',
      });

      const personB = generator.generateProduct({
        birthDate: '1998-11-25',
        birthTime: '20:30',
        gender: 'female',
        currentEvent: '연인과 결별했습니다. 재회가 가능할까요?',
      });

      expect(personA.classification.primaryDomain).toBe('LOVE');
      expect(personB.classification.primaryDomain).toBe('LOVE');

      // 원국 데이터가 다르므로 명리 지표 내용이 달라짐
      const infoA = personA.depthReport.sections[0].content;
      const infoB = personB.depthReport.sections[0].content;
      expect(infoA).not.toBe(infoB);
    });
  });

  // ==========================================================================
  // 11. 최종 고객 결과물 11대 평가 지표 검증 (Section 11)
  // ==========================================================================
  describe('11. 최종 고객 결과물 11대 평가 지표 검증 (Section 11)', () => {
    it('핵심 항목(명리 정확성, 사건 연결성, 개인화, 처방 품질, 고객 이해도, 안전성) 100점 만점 판정', () => {
      const res = generator.generateProduct(
        {
          birthDate: customerCases[0].birthDate,
          birthTime: customerCases[0].birthTime,
          gender: customerCases[0].gender,
          currentEvent: customerCases[0].currentEvent,
          desiredQuestion: customerCases[0].desiredQuestion,
        },
        { insightDepth: 5, prescription: true }
      );

      const evaluation = productEvaluator.evaluateProduct(res);

      expect(evaluation.myeongliAccuracy).toBe(100);
      expect(evaluation.problemDiagnosis).toBe(100);
      expect(evaluation.personalization).toBe(100);
      expect(evaluation.prescriptionQuality).toBe(100);
      expect(evaluation.customerResultQuality).toBe(100);
      expect(evaluation.safety).toBe(100);
      expect(evaluation.feasibility).toBe(100);
      expect(evaluation.averageScore).toBeGreaterThanOrEqual(95);
    });
  });
});
