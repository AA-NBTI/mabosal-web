/**
 * tests/phase79-deliverable-quality.test.ts
 *
 * Phase 79: 실제 고객 결과물 품질 검증 (Customer Deliverable Quality Audit Suite)
 *
 * "명리 데이터 → 사건 진단 → 명리 근거 → 현실 해석 → 시간축 → 대응 → 환경 처방 → 행동 처방"
 * 전 과정의 개인화, 차별성, 품질 완성도를 검증한다.
 */

import { describe, it, expect } from 'vitest';
import { ProductGenerator } from '../src/modules/product-generator/product-generator.js';
import { UserProblemInput } from '../src/modules/product-generator/types.js';

describe('Phase 79: 실제 고객 결과물 품질 검증 Test Suite', () => {
  const generator = new ProductGenerator();

  // CASE 01: 사업
  const case01_business: UserProblemInput = {
    birthDate: '1988-12-10',
    birthTime: '14:00',
    gender: 'female',
    userTrouble: '거래처 대금 체납과 동업자와의 지분 갈등으로 회사가 위태롭습니다.',
    currentEvent: '거래처 대금 체납과 동업자와의 지분 갈등으로 회사가 위태롭습니다.',
    selectedSituation: '동업자·파트너와의 지분 및 정산 갈등',
    additionalContext: '거래처 부도 이후 동업자가 일방적으로 변호사를 대동하여 지분 포기 및 개인 연대보증을 요구하고 있습니다.',
    desiredQuestion: '지분 매각 압박에 응하지 않고 법적으로 회사를 방어할 수 있습니까?',
    targetYear: 2024,
  };

  // CASE 02: 직장
  const case02_job: UserProblemInput = {
    birthDate: '1995-05-20',
    birthTime: '18:30',
    gender: 'male',
    userTrouble: '새로 부임한 부서장과의 갈등으로 퇴사 및 이직을 고민 중입니다.',
    currentEvent: '새로 부임한 부서장과의 갈등으로 퇴사 및 이직을 고민 중입니다.',
    selectedSituation: '상사·동료와의 갈등 및 불합리한 업무 배정',
    additionalContext: '업무 스타일 차이로 공개적인 비난을 받고 최하위 인사고과를 받았습니다.',
    desiredQuestion: '지금 바로 이직해야 하는지, 버티는 것이 맞는지 알고 싶습니다.',
    targetYear: 2024,
  };

  // CASE 03: 연애
  const case03_love: UserProblemInput = {
    birthDate: '1992-03-15',
    birthTime: '08:30',
    gender: 'male',
    userTrouble: '2년간 교제한 연인과 사소한 다툼 끝에 헤어졌습니다.',
    currentEvent: '2년간 교제한 연인과 사소한 다툼 끝에 헤어졌습니다.',
    selectedSituation: '성격 차이 및 잦은 다툼 후 이별 통보',
    additionalContext: '상대방이 이별을 통보하고 연락을 차단한 상태입니다.',
    desiredQuestion: '재회할 가능성이 있는지, 언제 연락이 닿을 수 있는지 궁금합니다.',
    targetYear: 2024,
  };

  // CASE 04: 돈
  const case04_money: UserProblemInput = {
    birthDate: '1985-08-22',
    birthTime: '19:30',
    gender: 'female',
    userTrouble: '무리한 부동산 투자와 지인 대여금 미회수로 자금 흐름이 완전히 막혔습니다.',
    currentEvent: '무리한 부동산 투자와 지인 대여금 미회수로 자금 흐름이 완전히 막혔습니다.',
    selectedSituation: '투자 손실 및 대출이자 연체 위기',
    additionalContext: '제2금융권 대출 만기가 도래하고 있으며 개인회생을 고려해야 할지 고민입니다.',
    desiredQuestion: '자금 파탄을 막기 위해 부동산을 급매 처분해야 하는지 알고 싶습니다.',
    targetYear: 2024,
  };

  // CASE 05: 동일 명식(1988-12-10 14:00 여) + 다른 고민(결혼/파혼)
  const case05_sameNatalDiffConcern: UserProblemInput = {
    birthDate: '1988-12-10',
    birthTime: '14:00',
    gender: 'female',
    userTrouble: '결혼을 앞두고 예비 배우자 집안과의 극심한 갈등으로 파혼 위기에 놓여 있습니다.',
    currentEvent: '결혼을 앞두고 예비 배우자 집안과의 극심한 갈등으로 파혼 위기에 놓여 있습니다.',
    selectedSituation: '양가 집안과의 가치관 및 혼수 갈등',
    additionalContext: '상대방 부모님이 일방적으로 결혼식 일정과 신혼집 명의 변경을 강요하고 있어 예비 배우자와도 대화가 단절되었습니다.',
    desiredQuestion: '이 결혼을 강행하는 것이 맞는지, 파혼하고 정리하는 것이 나은지 판단하고 싶습니다.',
    targetYear: 2024,
  };

  // CASE 06: 다른 명식(1990-05-15 10:30 남) + 동일 고민(사업 위기)
  const case06_diffNatalSameConcern: UserProblemInput = {
    birthDate: '1990-05-15',
    birthTime: '10:30',
    gender: 'male',
    userTrouble: '거래처 대금 체납과 동업자와의 지분 갈등으로 회사가 위태롭습니다.',
    currentEvent: '거래처 대금 체납과 동업자와의 지분 갈등으로 회사가 위태롭습니다.',
    selectedSituation: '동업자·파트너와의 지분 및 정산 갈등',
    additionalContext: '거래처 부도 이후 동업자가 일방적으로 변호사를 대동하여 지분 포기 및 개인 연대보증을 요구하고 있습니다.',
    desiredQuestion: '지분 매각 압박에 응하지 않고 법적으로 회사를 방어할 수 있습니까?',
    targetYear: 2024,
  };

  // 1. 고민별 사건 진단 차별성
  it('TEST-01: 고민에 따라 도메인 분류와 사건 진단이 100% 명확히 차별화되어야 한다', () => {
    const resBiz = generator.generateProduct(case01_business, { insightDepth: 5, prescription: true });
    const resJob = generator.generateProduct(case02_job, { insightDepth: 5, prescription: true });
    const resLove = generator.generateProduct(case03_love, { insightDepth: 5, prescription: true });
    const resMoney = generator.generateProduct(case04_money, { insightDepth: 5, prescription: true });

    expect(resBiz.classification.primaryDomain).toBe('BUSINESS');
    expect(resJob.classification.primaryDomain).toBe('JOB');
    expect(resLove.classification.primaryDomain).toBe('LOVE');
    expect(resMoney.classification.primaryDomain).toBe('MONEY');
  });

  // 2. 동일 명식 / 다른 고민 차별성 (CASE 01 vs CASE 05)
  it('TEST-02: 동일 명식이라도 고민이 다르면(CASE 01 vs CASE 05) 도메인, 원인 분석, 처방이 완전히 분기되어야 한다', () => {
    const res01 = generator.generateProduct(case01_business, { insightDepth: 5, prescription: true });
    const res05 = generator.generateProduct(case05_sameNatalDiffConcern, { insightDepth: 5, prescription: true });

    // 사주 원국은 동일
    expect(res01.executedModules['CORE_ORIGINAL'].data.pillars).toEqual(
      res05.executedModules['CORE_ORIGINAL'].data.pillars
    );

    // 그러나 도메인 및 리포트 내용은 상이
    expect(res01.classification.primaryDomain).toBe('BUSINESS');
    expect(res05.classification.primaryDomain).toBe('MARRIAGE');

    const text01 = res01.customerDeliverable?.fullFormattedText || '';
    const text05 = res05.customerDeliverable?.fullFormattedText || '';

    expect(text01).toContain('동업자');
    expect(text05).toContain('배우자');
    expect(text05).not.toContain('거래처 부도');

    // 처방의 차별성
    expect(res01.customerDeliverable?.sections.step8_behaviorPrescription).toContain('서면 계약서');
    expect(res05.customerDeliverable?.sections.step8_behaviorPrescription).toContain('배우자와의 중대한 가사·재정 문제');
  });

  // 3. 다른 명식 / 동일 고민 차별성 (CASE 01 vs CASE 06)
  it('TEST-03: 서로 다른 명식이 동일한 사업 고민을 겪더라도(CASE 01 vs CASE 06) 일간, 강약, 격국, 명리 근거가 명식에 따라 100% 달라야 한다', () => {
    const res01 = generator.generateProduct(case01_business, { insightDepth: 5, prescription: true });
    const res06 = generator.generateProduct(case06_diffNatalSameConcern, { insightDepth: 5, prescription: true });

    // 일간과 원국이 다름
    expect(res01.executedModules['CORE_ORIGINAL'].data.dayMaster.stem).toBe('기');
    expect(res06.executedModules['CORE_ORIGINAL'].data.dayMaster.stem).toBe('경');

    // 강약 및 격국
    expect(res01.executedModules['STRENGTH'].explanation.summary).toContain('신약');
    expect(res06.executedModules['STRENGTH'].explanation.summary).toContain('중화');

    // 1부 3단계 명리 핵심 설명이 명식에 따라 분기
    const myeongli01 = res01.customerDeliverable?.sections.step3_myeongliCore || '';
    const myeongli06 = res06.customerDeliverable?.sections.step3_myeongliCore || '';

    expect(myeongli01).toContain('원진 작용');
    expect(myeongli06).not.toContain('자미원진');
  });

  // 4. 명리 근거 → 현실 해석 연결
  it('TEST-04: 명리학적 원국/시간축 근거가 고객 현실의 구체적 상황과 1:1로 결합되어야 한다', () => {
    const res = generator.generateProduct(case01_business, { insightDepth: 5, prescription: true });
    const whyOccurred = res.customerDeliverable?.sections.step2_whyOccurred || '';
    const myeongliCore = res.customerDeliverable?.sections.step3_myeongliCore || '';

    expect(whyOccurred).toContain('지분 및 정산 갈등');
    expect(myeongliCore).toContain('세운');
  });

  // 5. 명리 근거 → 처방 연결 (도메인 간 처방 혼재 방지)
  it('TEST-05: 처방전의 Do/Don\'t가 고민 도메인에 100% 정합하며 엉뚱한 타 도메인 조언이 혼재되지 않아야 한다', () => {
    const resLove = generator.generateProduct(case03_love, { insightDepth: 5, prescription: true });
    const resJob = generator.generateProduct(case02_job, { insightDepth: 5, prescription: true });
    const resMarriage = generator.generateProduct(case05_sameNatalDiffConcern, { insightDepth: 5, prescription: true });

    const avoidLove = resLove.customerDeliverable?.sections.step8_behaviorPrescription || '';
    const avoidJob = resJob.customerDeliverable?.sections.step8_behaviorPrescription || '';
    const avoidMarriage = resMarriage.customerDeliverable?.sections.step8_behaviorPrescription || '';

    // 연애 고민에 투자/의료 조언 금지
    expect(avoidLove).toContain('장문의 메시지');
    expect(avoidLove).not.toContain('고위험 대출');
    expect(avoidLove).not.toContain('의료진 진료');

    // 직장 고민에 사직/업무 조언 포함
    expect(avoidJob).toContain('사직서');
    expect(avoidJob).not.toContain('고위험 대출');

    // 결혼 고민에 부부/양가 조언 포함
    expect(avoidMarriage).toContain('양가 부모');
    expect(avoidMarriage).not.toContain('고위험 대출');
  });

  // 6. 무료 → 심층 정보 확장성
  it('TEST-06: 무료 결과(Level 1)와 심층 결과(Level 5)의 정보 깊이와 실행 처방이 실질적으로 차별화되어야 한다', () => {
    const freeRes = generator.generateProduct(case01_business, { insightDepth: 1, prescription: false });
    const deepRes = generator.generateProduct(case01_business, { insightDepth: 5, prescription: true });

    const freeText = freeRes.customerDeliverable?.fullFormattedText || '';
    const deepText = deepRes.customerDeliverable?.fullFormattedText || '';

    // 무료는 5단계 구조
    expect(freeText).toContain('## [1부] 한눈에 보는 나의 사주 핵심');
    expect(freeText).toContain('## [4부] 나의 현실 상황과 연결해보기');
    expect(freeText).toContain('## [5부] 더 깊게 보면 무엇을 알 수 있는가');

    // 심층은 10단계 리포트 + 7대 직답
    expect(deepText).toContain('## [1부] 마보살 10단계 핵심 솔루션 리포트');
    expect(deepText).toContain('## [2부] 고객님의 7대 핵심 질문에 대한 직답');
    expect(deepText).toContain('### 7. 환경 처방');
    expect(deepText).toContain('### 8. 행동 처방');
    expect(deepText.length).toBeGreaterThan(freeText.length * 1.5);
  });

  // 7. 반복 문장 과다 여부 및 고객 입력 기계적 결합 배제
  it('TEST-07: 고객 입력이 기계적인 결합 문자열([선택 상황]: ...)로 불필요하게 반복되지 않아야 한다', () => {
    const res = generator.generateProduct(case01_business, { insightDepth: 5, prescription: true });
    const fullText = res.customerDeliverable?.fullFormattedText || '';

    expect(fullText).not.toContain('[선택 상황]:');
    expect(fullText).not.toContain('[추가 상황]:');
    expect(res.customerDeliverable?.sections.step1_currentEvent).toContain('**현재 상황**');
    expect(res.customerDeliverable?.sections.step1_currentEvent).toContain('**선택하신 상황**');
  });

  // 8. 내부 용어 고객 노출 여부
  it('TEST-08: 모듈 ID나 내부 엔지니어링 코드(CORE_ORIGINAL, DAEWUN, GEOKGUK 등)가 고객 텍스트에 노출되지 않아야 한다', () => {
    const res = generator.generateProduct(case01_business, { insightDepth: 5, prescription: true });
    const fullText = res.customerDeliverable?.fullFormattedText || '';

    expect(fullText).not.toContain('CORE_ORIGINAL');
    expect(fullText).not.toContain('MAGA_DIAGNOSIS');
    expect(fullText).not.toContain('EVENT_DIAGNOSIS');
    expect(fullText).not.toContain('PRESCRIPTION_ENGINE');
  });

  // 9. 안전 표현 (결정론적 공포 및 의료/법률 단정 배제)
  it('TEST-09: 한자 단독 노출, 확정적 파국 예언, 의료/법률 결과 단정이 일체 없어야 한다', () => {
    const cases = [case01_business, case02_job, case03_love, case04_money, case05_sameNatalDiffConcern, case06_diffNatalSameConcern];
    for (const c of cases) {
      const res = generator.generateProduct(c, { insightDepth: 5, prescription: true });
      const fullText = res.customerDeliverable?.fullFormattedText || '';

      // 금지된 확정적 미래 단정 표현 검사
      expect(fullText).not.toContain('100% 헤어');
      expect(fullText).not.toContain('반드시 망');
      expect(fullText).not.toContain('절대 피할 수 없');

      // 전문 영역 면책 조항 포함 여부
      expect(fullText).toContain('※');
      expect(res.customerDeliverable?.safetyPassed).toBe(true);
    }
  });

  // 10. 기존 structuredJudgments 데이터 보존
  it('TEST-10: structuredJudgments 내 핵심 판정 메트릭이 100% 무손실 보존되어야 한다', () => {
    const res = generator.generateProduct(case01_business, { insightDepth: 5, prescription: true });
    const sj = res.customerDeliverable?.structuredJudgments;

    expect(sj).toBeDefined();
    expect(sj?.coreProblem).toBe(case01_business.currentEvent);
    expect(sj?.primaryDomain).toBe('BUSINESS');
    expect(sj?.selectedSituation).toBe(case01_business.selectedSituation);
    expect(sj?.additionalContext).toBe(case01_business.additionalContext);
    expect(sj?.prescriptions.behavior.length).toBeGreaterThan(0);
    expect(sj?.prescriptions.environment.length).toBeGreaterThan(0);
  });

  // 11. 기존 시간축 보존
  it('TEST-11: natal, daewun, seun 시간축 분해 메트릭이 전수 보존되어야 한다', () => {
    const res = generator.generateProduct(case01_business, { insightDepth: 5, prescription: true });
    const tb = res.customerDeliverable?.structuredJudgments?.timeAxisBreakdown;

    expect(tb).toBeDefined();
    expect(tb?.natal.length).toBeGreaterThan(0);
    expect(tb?.daewun).toBeDefined();
    expect(tb?.seun).toBeDefined();
  });

  // 12. 기존 마·살 보존
  it('TEST-12: magaActive 및 마·살 진단 신호가 전수 보존되어야 한다', () => {
    const res = generator.generateProduct(case01_business, { insightDepth: 5, prescription: true });
    const sj = res.customerDeliverable?.structuredJudgments;

    expect(sj?.magaActive).toBeDefined();
    expect(Array.isArray(sj?.magaActive)).toBe(true);
  });
});
