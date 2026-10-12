/**
 * tests/phase77-free-deliverable-redesign.test.ts
 * 
 * Phase 77: 무료 고객 결과물 재설계 검증 테스트 스위트
 * 
 * 원칙:
 * 1. 무료 결과의 정보 선택·배치·표현 구조를 고객 중심으로 재설계
 * 2. 5대 핵심 구조 검증:
 *    ① 한눈에 보는 핵심
 *    ② 지금 주목할 부분
 *    ③ 현실에서 나타날 수 있는 모습
 *    ④ 고객 상황 연결 장치
 *    ⑤ 더 깊게 보면 무엇을 알 수 있는가
 * 3. 내부 모듈명([사업 및 창업 고민 모듈] 등) 나열 배제
 * 4. 명리 데이터 및 structuredJudgments 100% 무손실 보존
 * 5. 마·살 현실적 조율 의미 설명 및 공포 유발 금지
 * 6. 환경·행동 처방 명리 근거 연결 개선
 * 7. 추가 상황 입력 데이터가 다음 단계(심층 분석)로 무손실 전달
 * 
 * 최소 3개 이상 서로 다른 도메인 실전 CASE 검증 (BUSINESS, JOB, LOVE, MONEY)
 */

import { describe, it, expect } from 'vitest';
import {
  ProductGenerator,
  UserProblemInput,
  ProductGenerationResult,
} from '../src/modules/product-generator/index.js';

describe('Phase 77: 무료 고객 결과물 재설계 Test Suite', () => {
  const generator = new ProductGenerator();

  // 실전 4대 CASE
  const caseBusiness: UserProblemInput = {
    birthDate: '1988-12-10',
    birthTime: '14:00',
    gender: 'female',
    userTrouble: '거래처 대금 체납과 동업자와의 지분 갈등으로 회사가 위태롭습니다.',
    currentEvent: '주요 거래처 부도로 대금이 묶이고 동업자와 지분 분쟁이 발생했습니다.',
    desiredQuestion: '손실을 최소화하고 회사를 지키기 위해 지금 당장 어떤 결정을 내려야 합니까?',
    targetYear: 2024,
  };

  const caseJob: UserProblemInput = {
    birthDate: '1995-05-20',
    birthTime: '18:30',
    gender: 'male',
    userTrouble: '새로 부임한 부서장과의 갈등으로 퇴사 및 이직을 고민 중입니다.',
    currentEvent: '업무 스타일 차이로 공개적인 비난을 받고 최하위 인사고과를 받았습니다.',
    desiredQuestion: '지금 바로 이직해야 하는지, 버티는 것이 맞는지 알고 싶습니다.',
    targetYear: 2025,
  };

  const caseLove: UserProblemInput = {
    birthDate: '1992-03-15',
    birthTime: '08:30',
    gender: 'male',
    userTrouble: '2년간 교제한 연인과 사소한 다툼 끝에 헤어졌습니다.',
    currentEvent: '상대방이 이별을 통보하고 연락을 차단한 상태입니다.',
    desiredQuestion: '재회할 가능성이 있는지, 언제 연락이 닿을 수 있는지 궁금합니다.',
    targetYear: 2024,
  };

  const caseMoney: UserProblemInput = {
    birthDate: '1982-04-05',
    birthTime: '06:00',
    gender: 'male',
    userTrouble: '무리한 레버리지 투자 실패로 막대한 빚을 졌습니다.',
    currentEvent: '지인의 권유로 시작한 코인 투자 실패로 원금을 모두 잃고 채무 압박이 심합니다.',
    desiredQuestion: '현금 흐름을 회복하고 개인파산을 막을 방법이 무엇인지 알고 싶습니다.',
    targetYear: 2024,
  };

  // ==========================================================================
  // 1. 무료 결과의 핵심 정보 우선순위 확인 (TEST-01)
  // ==========================================================================
  it('TEST-01: 무료 결과(Level 1)는 모듈명 나열이 아닌 5단계 고객 중심 구조로 생성되어야 한다', () => {
    const res = generator.generateProduct(caseBusiness, { insightDepth: 1 });
    const fullText = res.customerDeliverable?.fullFormattedText || '';
    const depthDoc = res.depthReport.fullDocument;

    // 5대 핵심 단계 소제목이 순서대로 존재해야 함
    expect(fullText).toContain('## [1부] 한눈에 보는 나의 사주 핵심');
    expect(fullText).toContain('## [2부] 지금 주목할 부분');
    expect(fullText).toContain('## [3부] 현실에서 나타날 수 있는 모습');
    expect(fullText).toContain('## [4부] 나의 현실 상황과 연결해보기');
    expect(fullText).toContain('## [5부] 더 깊게 보면 무엇을 알 수 있는가');

    // depthReport 역시 5단계 구조로 정리되어야 함
    expect(depthDoc).toContain('### ① 한눈에 보는 핵심');
    expect(depthDoc).toContain('### ② 지금 주목할 부분');
    expect(depthDoc).toContain('### ③ 현실에서 나타날 수 있는 모습');
    expect(depthDoc).toContain('### ④ 고객 상황 연결 장치');
    expect(depthDoc).toContain('### ⑤ 더 깊게 보면 무엇을 알 수 있는가');

    // 모듈명 태그 나열(예: "• [사업 및 창업 고민 모듈]:")이 본문에 무차별 노출되지 않아야 함
    expect(fullText).not.toContain('[사업 및 창업 고민 모듈]');
    expect(fullText).not.toContain('[직장 및 이직 고민 모듈]');
    expect(depthDoc).not.toContain('• [사업 및 창업 고민 모듈]:');
  });

  // ==========================================================================
  // 2. 고객 고민과 관련된 영역이 정상적으로 반영되는지 확인 (TEST-02)
  // ==========================================================================
  it('TEST-02: 서로 다른 3개 이상 CASE에서 도메인별 현실 해석과 주목 영역이 차별화되어 반영되어야 한다', () => {
    const resBiz = generator.generateProduct(caseBusiness, { insightDepth: 1 });
    const resJob = generator.generateProduct(caseJob, { insightDepth: 1 });
    const resLove = generator.generateProduct(caseLove, { insightDepth: 1 });

    const textBiz = resBiz.customerDeliverable?.freeDeliverable?.step3_realWorldManifestation || '';
    const textJob = resJob.customerDeliverable?.freeDeliverable?.step3_realWorldManifestation || '';
    const textLove = resLove.customerDeliverable?.freeDeliverable?.step3_realWorldManifestation || '';

    // 사업 도메인 현실 언어 포함
    expect(textBiz).toMatch(/동업자|거래처|계약|정산|대금/);
    // 직장 도메인 현실 언어 포함
    expect(textJob).toMatch(/직장|상사|동료|성과|이직/);
    // 연애 도메인 현실 언어 포함
    expect(textLove).toMatch(/연애|관계|서운함|오해|담판/);

    // 3개 케이스의 현실 서술이 상호 달라야 함
    expect(textBiz).not.toBe(textJob);
    expect(textJob).not.toBe(textLove);
  });

  // ==========================================================================
  // 3. 고객 고민과 관련성이 낮은 정보가 핵심 영역을 압도하지 않는지 확인 (TEST-03)
  // ==========================================================================
  it('TEST-03: 사업 고민 케이스의 핵심 현실 설명에 무관한 연애/결혼 조언이 혼재되지 않아야 한다', () => {
    const resBiz = generator.generateProduct(caseBusiness, { insightDepth: 1 });
    const manifestation = resBiz.customerDeliverable?.freeDeliverable?.step3_realWorldManifestation || '';

    expect(manifestation).toContain('사업 및 계약 관계');
    expect(manifestation).not.toContain('데이트');
    expect(manifestation).not.toContain('배우자 선택');
  });

  // ==========================================================================
  // 4. 명리 근거 → 현실 해석 연결 유지 (TEST-04)
  // ==========================================================================
  it('TEST-04: 일간 본원, 오행 분포, 격국, 지지 상호작용 등 명리 근거가 현실 설명과 유기적으로 연결되어야 한다', () => {
    const resBiz = generator.generateProduct(caseBusiness, { insightDepth: 1 });
    const free = resBiz.customerDeliverable?.freeDeliverable;

    // 1부 일간 및 원국 지표 검증
    expect(free?.step1_coreSummary).toContain('기');
    expect(free?.step1_coreSummary).toContain('토');
    expect(free?.step1_coreSummary).toContain('편재격');
    // 지지 관계 보존 검증 (자미해, 자미원진 등)
    expect(free?.step1_coreSummary).toMatch(/자미원진|자미해|자진반합/);

    // 2부 시간축 연결 검증
    expect(free?.step2_attentionPoint).toContain('경신');
  });

  // ==========================================================================
  // 5. 무료 결과의 고객 입력 장치 정상 작동 (TEST-05)
  // ==========================================================================
  it('TEST-05: 무료 결과에 상황 선택 옵션과 자유 입력 안내가 포함된 위젯이 정상 작동해야 한다', () => {
    const resBiz = generator.generateProduct(caseBusiness, { insightDepth: 1 });
    const widget = resBiz.customerDeliverable?.freeDeliverable?.step4_customerConnectWidget;

    expect(widget).toBeDefined();
    expect(widget?.prompt).toContain('위의 기운 흐름 중');
    expect(widget?.options.length).toBeGreaterThanOrEqual(3);
    expect(widget?.options.join(' ')).toMatch(/거래처|동업자|계약|자금/);
    expect(widget?.customInputPlaceholder).toBeDefined();
  });

  // ==========================================================================
  // 6. 입력된 고객 상황이 기존 분석 데이터와 함께 다음 단계로 전달됨 (TEST-06)
  // ==========================================================================
  it('TEST-06: 고객이 추가한 상황(additionalContext, selectedSituation)이 심층 분석(Level 5)으로 무손실 전달되어야 한다', () => {
    // 1단계 무료 결과 확인 후 상황을 추가 입력한 시나리오
    const advancedInput: UserProblemInput = {
      ...caseBusiness,
      selectedSituation: '동업자·파트너와의 지분 및 정산 갈등',
      additionalContext: '어제 동업자가 일방적으로 변호사를 대동해 지분 포기 각서를 요구했습니다.',
      desiredQuestion: '지분을 포기하지 않고 법적으로 대응할 때 승산이 있는지 알고 싶습니다.',
    };

    const inDepthRes = generator.generateProduct(advancedInput, { insightDepth: 5, prescription: true });

    // 정규화된 입력에 추가 상황이 보존되어야 함
    expect(inDepthRes.userProblem.selectedSituation).toBe('동업자·파트너와의 지분 및 정산 갈등');
    expect(inDepthRes.userProblem.additionalContext).toContain('지분 포기 각서');
    expect(inDepthRes.userProblem.currentEvent).toBe(caseBusiness.currentEvent);

    // 심층 리포트 1부에 추가 입력 상황이 반영되어야 함
    expect(inDepthRes.customerDeliverable?.sections.step1_currentEvent).toContain('지분 포기 각서');
    expect(inDepthRes.customerDeliverable?.answersTo7Questions.q1_whyNow).toContain('지분 포기 각서');
  });

  // ==========================================================================
  // 7. 추가 입력 없이도 무료 결과 정상 생성 (TEST-07)
  // ==========================================================================
  it('TEST-07: additionalContext가 없는 기본 입력에서도 무료 결과가 무결하게 생성되어야 한다', () => {
    const pureInput: UserProblemInput = {
      birthDate: '1990-01-01',
      birthTime: '12:00',
      gender: 'male',
      currentEvent: '올해 전반적인 운세 흐름이 궁금합니다.',
    };

    const res = generator.generateProduct(pureInput, { insightDepth: 1 });
    expect(res.customerDeliverable).toBeDefined();
    expect(res.customerDeliverable?.freeDeliverable).toBeDefined();
    expect(res.customerDeliverable?.freeDeliverable?.step1_coreSummary).toContain('일간');
    expect(res.customerDeliverable?.safetyPassed).toBe(true);
  });

  // ==========================================================================
  // 8. structuredJudgments 데이터 손실 없음 (TEST-08)
  // ==========================================================================
  it('TEST-08: Level 1 무료 결과 생성 시에도 structuredJudgments의 7대 핵심 판정 데이터가 무손실 보존되어야 한다', () => {
    const res = generator.generateProduct(caseBusiness, { insightDepth: 1 });
    const sj = res.customerDeliverable?.structuredJudgments;

    expect(sj).toBeDefined();
    expect(sj?.coreProblem).toBe(caseBusiness.currentEvent);
    expect(sj?.primaryDomain).toBe('BUSINESS');
    expect(sj?.myeongliBasis.length).toBeGreaterThan(0);
    expect(sj?.timeAxisBreakdown.natal).toBeDefined();
    expect(sj?.responseGuidance.mustDo.length).toBeGreaterThan(0);
    expect(sj?.responseGuidance.mustAvoid.length).toBeGreaterThan(0);
    expect(sj?.prescriptions.environment.length).toBeGreaterThan(0);
  });

  // ==========================================================================
  // 9. 시간축 데이터 손실 없음 (TEST-09)
  // ==========================================================================
  it('TEST-09: Level 1 무료 결과에서도 원국, 대운, 세운 시간축 메트릭이 100% 보존되어야 한다', () => {
    const res = generator.generateProduct(caseBusiness, { insightDepth: 1 });

    expect(res.executedModules['CORE_ORIGINAL']).toBeDefined();
    expect(res.executedModules['DAEWUN']).toBeDefined();
    expect(res.executedModules['SEUN']).toBeDefined();

    const seunYear = res.executedModules['SEUN'].calculation.rawMetrics.targetYear;
    expect(seunYear).toBe(2024);
  });

  // ==========================================================================
  // 10. 기존 안전성 규칙 유지 (TEST-10)
  // ==========================================================================
  it('TEST-10: 무료 결과 포맷 문서에서 한자 단독 노출 및 공포 조장/확정적 파국 표현이 일체 검출되지 않아야 한다', () => {
    const testCases = [caseBusiness, caseJob, caseLove, caseMoney];

    for (const tc of testCases) {
      const res = generator.generateProduct(tc, { insightDepth: 1 });
      const fullText = res.customerDeliverable!.fullFormattedText;

      // 1) 확정적 파국 예언 배제
      expect(fullText).not.toMatch(/반드시\s*(망한다|헤어진다|파산|사고)/);
      expect(fullText).not.toMatch(/무조건\s*(실패|파산|병)/);
      expect(fullText).not.toMatch(/100%\s*(망한다|헤어진다)/);

      // 2) 2자 이상 한자 단독 노출 방지
      const lines = fullText.split('\n');
      for (const line of lines) {
        const words = line.trim().split(/\s+/);
        for (const word of words) {
          if (/^[\u4E00-\u9FFF]{2,}$/.test(word)) {
            throw new Error(`한자 단독 노출 감지: "${word}" (줄: ${line})`);
          }
        }
      }

      expect(res.customerDeliverable?.safetyPassed).toBe(true);
    }
  });

  // ==========================================================================
  // 11. 기존 고객 출력 회귀 무결성 (TEST-11)
  // ==========================================================================
  it('TEST-11: Level 5 심층 상품 요청 시 기존 10단계 핵심 솔루션과 7대 직답이 완벽하게 생성되어야 한다', () => {
    const res = generator.generateProduct(caseBusiness, { insightDepth: 5, prescription: true });

    expect(res.depthReport.sections.length).toBe(5);
    expect(res.customerDeliverable?.sections.step1_currentEvent).toBeDefined();
    expect(res.customerDeliverable?.sections.step7_environmentPrescription).toBeDefined();
    expect(res.customerDeliverable?.sections.step8_behaviorPrescription).toBeDefined();
    expect(res.customerDeliverable?.sections.step10_finalSummary).toBeDefined();
    expect(res.customerDeliverable?.answersTo7Questions.q1_whyNow).toBeDefined();
    expect(res.customerDeliverable?.answersTo7Questions.q7_cautionToWatch).toBeDefined();

    // 개선된 환경 처방 문구: 명리적 이유(오행 보완, 기운 충돌 완충 등)가 명시되어야 함
    const envText = res.customerDeliverable?.sections.step7_environmentPrescription || '';
    expect(envText).toMatch(/기운|완충|보완|공간/);
    expect(envText).not.toContain('정수기를 가까이 두어'); // 무맥락 정수기 문구 배제 확인
  });

  // ==========================================================================
  // 12. 동일 입력에서 핵심 판정 동일 (결정론) (TEST-12)
  // ==========================================================================
  it('TEST-12: 동일 입력을 10회 반복 실행했을 때 무료 결과 및 심층 결과의 판정 텍스트가 100% 동일해야 한다', () => {
    const firstFree = generator.generateProduct(caseBusiness, { insightDepth: 1 });
    const firstDeep = generator.generateProduct(caseBusiness, { insightDepth: 5, prescription: true });

    for (let i = 0; i < 10; i++) {
      const iterFree = generator.generateProduct(caseBusiness, { insightDepth: 1 });
      const iterDeep = generator.generateProduct(caseBusiness, { insightDepth: 5, prescription: true });

      // 무료 결과 동일성
      expect(iterFree.customerDeliverable?.fullFormattedText).toBe(firstFree.customerDeliverable?.fullFormattedText);
      expect(iterFree.customerDeliverable?.freeDeliverable?.step1_coreSummary).toBe(
        firstFree.customerDeliverable?.freeDeliverable?.step1_coreSummary
      );

      // 심층 결과 동일성
      expect(iterDeep.customerDeliverable?.fullFormattedText).toBe(firstDeep.customerDeliverable?.fullFormattedText);
      expect(iterDeep.customerDeliverable?.structuredJudgments?.coreProblem).toBe(
        firstDeep.customerDeliverable?.structuredJudgments?.coreProblem
      );
    }
  });
});
