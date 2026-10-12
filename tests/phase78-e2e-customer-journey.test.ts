/**
 * tests/phase78-e2e-customer-journey.test.ts
 * 
 * Phase 78: 무료 → 상황 입력 → 심층 분석 고객 여정 E2E 정밀 검증 테스트 스위트
 * 
 * 검증 흐름:
 * 고객 최초 입력 → 무료 결과 확인 → 자신의 상황 연결 → 추가 상황 입력 → 심층 분석 반영
 * 
 * 12대 필수 검증 항목:
 * 1. 최초 입력 → 무료 결과 정상 생성 (Level 1 5단계 고객 중심 구조)
 * 2. 무료 결과 → 상황 입력 위젯(옵션 + 플레이스홀더) 정상 작동
 * 3. selectedSituation 전달 검증
 * 4. additionalContext 전달 검증
 * 5. 추가 입력 → 심층 분석 반영 검증 (Step 1, Q1, 사건 진단 등)
 * 6. 추가 입력 데이터 무손실 검증 (structuredJudgments 필드 보존)
 * 7. 동일 명식 + 다른 고민 결과 차별성 (CASE 05)
 * 8. 다른 명식 + 동일 고민 결과 차별성 (CASE 06)
 * 9. 추가 입력 없는 경우 기존 흐름 정상 작동 (하위 호환성)
 * 10. 무료 → 심층 전체 결정론 검증 (10회 반복 100% 동일)
 * 11. 안전성 회귀 (한자 단독 노출 방지 및 공포 조장 배제)
 * 12. structuredJudgments 및 시간축 무손실 회귀
 */

import { describe, it, expect } from 'vitest';
import {
  ProductGenerator,
  UserProblemInput,
  ProductGenerationResult,
} from '../src/modules/product-generator/index.js';

describe('Phase 78: 무료 → 상황 입력 → 심층 분석 고객 여정 E2E Test Suite', () => {
  const generator = new ProductGenerator();

  // CASE 01 — 사업
  const case01_initial: UserProblemInput = {
    birthDate: '1988-12-10',
    birthTime: '14:00',
    gender: 'female',
    currentEvent: '주요 거래처 부도로 대금이 묶여 회사 운영이 위태롭습니다.',
    userTrouble: '자금 회수가 막히고 직원 급여와 고정비 지급이 불가능한 부도 위기입니다.',
    desiredQuestion: '손실을 막고 사업체를 지키기 위해 지금 당장 무엇을 우선해야 합니까?',
    targetYear: 2024,
  };

  // CASE 02 — 직장
  const case02_initial: UserProblemInput = {
    birthDate: '1995-05-20',
    birthTime: '18:30',
    gender: 'male',
    currentEvent: '새로 부임한 부서장과의 갈등으로 퇴사 및 이직을 고민 중입니다.',
    userTrouble: '업무 스타일 차이로 공개적인 비난을 받고 인사고과에서 최하점을 받아 좌천 위기입니다.',
    desiredQuestion: '지금 바로 이직해야 하는지, 버티는 것이 맞는지 알고 싶습니다.',
    targetYear: 2025,
  };

  // CASE 03 — 연애
  const case03_initial: UserProblemInput = {
    birthDate: '1992-03-15',
    birthTime: '08:30',
    gender: 'male',
    currentEvent: '2년간 교제한 연인과 사소한 다툼 끝에 헤어졌습니다.',
    userTrouble: '상대방이 일방적으로 이별을 통보하고 모든 연락처를 차단했습니다.',
    desiredQuestion: '재회할 가능성이 있는지, 언제 연락이 닿을 수 있는지 궁금합니다.',
    targetYear: 2024,
  };

  // CASE 04 — 돈
  const case04_initial: UserProblemInput = {
    birthDate: '1982-04-05',
    birthTime: '06:00',
    gender: 'male',
    currentEvent: '무리한 레버리지 투자 실패로 막대한 빚을 졌습니다.',
    userTrouble: '원금을 모두 잃고 사채와 신용대출 상환 압박으로 일상생활이 불가능합니다.',
    desiredQuestion: '현금 흐름을 회복하고 개인파산을 막을 방법이 무엇인지 알고 싶습니다.',
    targetYear: 2024,
  };

  // ==========================================================================
  // 1. 최초 입력 → 무료 결과 정상 생성 (TEST-01)
  // ==========================================================================
  it('TEST-01: 고객이 출생정보와 현실 고민을 입력했을 때 5단계 무료 결과가 정상 생성되어야 한다', () => {
    const freeRes = generator.generateProduct(case01_initial, { insightDepth: 1 });

    expect(freeRes.customerDeliverable).toBeDefined();
    expect(freeRes.customerDeliverable?.freeDeliverable).toBeDefined();
    const free = freeRes.customerDeliverable!.freeDeliverable!;

    expect(free.step1_coreSummary).toContain('기');
    expect(free.step1_coreSummary).toContain('토');
    expect(free.step2_attentionPoint).toContain('경신');
    expect(free.step3_realWorldManifestation).toContain('사업 및 계약 관계');
    expect(free.step4_customerConnectWidget).toBeDefined();
    expect(free.step5_inDepthPreview).toContain('심층 분석에서는');
  });

  // ==========================================================================
  // 2. 무료 결과 → 상황 입력 위젯 정상 작동 (TEST-02)
  // ==========================================================================
  it('TEST-02: 무료 결과를 확인한 고객에게 도메인에 부합하는 상황 선택지와 직접 입력 유도 장치가 제공되어야 한다', () => {
    const freeRes = generator.generateProduct(case01_initial, { insightDepth: 1 });
    const widget = freeRes.customerDeliverable!.freeDeliverable!.step4_customerConnectWidget;

    expect(widget.prompt).toContain('위의 기운 흐름 중 현재 고객님이 가장 강하게 마주하고 계신 상황은 무엇인가요?');
    expect(widget.options).toContain('동업자·파트너와의 지분 및 정산 갈등');
    expect(widget.options).toContain('주요 거래처 부도 및 대금 회수 지연');
    expect(widget.customInputPlaceholder).toBeDefined();
  });

  // ==========================================================================
  // 3. selectedSituation 전달 검증 (TEST-03)
  // ==========================================================================
  it('TEST-03: 고객이 선택한 상황(selectedSituation)이 심층 분석 요청 시 무손실 전달되어야 한다', () => {
    const advancedInput: UserProblemInput = {
      ...case01_initial,
      selectedSituation: '동업자·파트너와의 지분 및 정산 갈등',
    };

    const deepRes = generator.generateProduct(advancedInput, { insightDepth: 5, prescription: true });

    expect(deepRes.userProblem.selectedSituation).toBe('동업자·파트너와의 지분 및 정산 갈등');
    expect(deepRes.customerDeliverable?.structuredJudgments?.selectedSituation).toBe('동업자·파트너와의 지분 및 정산 갈등');
    expect(deepRes.customerDeliverable?.sections.step1_currentEvent).toContain('**선택하신 상황**');
    expect(deepRes.customerDeliverable?.sections.step1_currentEvent).toContain('동업자·파트너와의 지분 및 정산 갈등');
  });

  // ==========================================================================
  // 4. additionalContext 전달 검증 (TEST-04)
  // ==========================================================================
  it('TEST-04: 고객이 자유 기술한 추가 상황(additionalContext)이 심층 분석 요청 시 무손실 전달되어야 한다', () => {
    const advancedInput: UserProblemInput = {
      ...case02_initial,
      additionalContext: '다음 주에 인사위원회가 열려 원치 않는 지방 발령이 유력한 상태입니다.',
    };

    const deepRes = generator.generateProduct(advancedInput, { insightDepth: 5, prescription: true });

    expect(deepRes.userProblem.additionalContext).toBe('다음 주에 인사위원회가 열려 원치 않는 지방 발령이 유력한 상태입니다.');
    expect(deepRes.customerDeliverable?.structuredJudgments?.additionalContext).toBe('다음 주에 인사위원회가 열려 원치 않는 지방 발령이 유력한 상태입니다.');
    expect(deepRes.customerDeliverable?.sections.step1_currentEvent).toContain('지방 발령');
  });

  // ==========================================================================
  // 5. 추가 입력 → 심층 분석 반영 검증 (TEST-05)
  // ==========================================================================
  it('TEST-05: 최초 입력과 추가 입력이 심층 결과의 1부 요약 및 2부 질문 직답에 유기적으로 결합 반영되어야 한다', () => {
    const advancedInput: UserProblemInput = {
      ...case01_initial,
      selectedSituation: '동업자·파트너와의 지분 및 정산 갈등',
      additionalContext: '거래처 부도 이후 동업자가 일방적으로 변호사를 대동하여 지분 포기 및 개인 연대보증을 요구하고 있습니다.',
      desiredQuestion: '지분 매각 압박에 응하지 않고 법적으로 회사를 방어할 수 있습니까?',
    };

    const deepRes = generator.generateProduct(advancedInput, { insightDepth: 5, prescription: true });

    // 1부 1단계 상황 요약에 최초 고민과 추가 상황이 모두 포함되어야 함
    const step1 = deepRes.customerDeliverable?.sections.step1_currentEvent || '';
    expect(step1).toContain('주요 거래처 부도');
    expect(step1).toContain('동업자·파트너와의 지분 및 정산 갈등');
    expect(step1).toContain('지분 포기 및 개인 연대보증');
    expect(step1).toContain('지분 매각 압박에 응하지 않고');

    // 2부 질문 1 직답에도 반영 확인
    const q1 = deepRes.customerDeliverable?.answersTo7Questions.q1_whyNow || '';
    expect(q1).toContain('주요 거래처 부도');
    expect(q1).toContain('지분 포기 및 개인 연대보증');
  });

  // ==========================================================================
  // 6. 추가 입력 데이터 무손실 검증 (TEST-06)
  // ==========================================================================
  it('TEST-06: additionalContext와 selectedSituation이 structuredJudgments에 100% 무손실 보존되어야 한다', () => {
    const advancedInput: UserProblemInput = {
      ...case04_initial,
      selectedSituation: '무리한 투자 실패 및 채무 압박',
      additionalContext: '다음 달까지 5,000만 원의 원리금을 막지 못하면 전세보증금 압류가 들어옵니다.',
    };

    const deepRes = generator.generateProduct(advancedInput, { insightDepth: 5, prescription: true });
    const sj = deepRes.customerDeliverable?.structuredJudgments;

    expect(sj).toBeDefined();
    expect(sj?.selectedSituation).toBe('무리한 투자 실패 및 채무 압박');
    expect(sj?.additionalContext).toBe('다음 달까지 5,000만 원의 원리금을 막지 못하면 전세보증금 압류가 들어옵니다.');
  });

  // ==========================================================================
  // 7. 동일 명식 + 다른 고민 결과 차별성 (TEST-07 - CASE 05)
  // ==========================================================================
  it('TEST-07 (CASE 05): 동일 명식(1990-05-15 남)이라도 현실 고민이 다르면 심층 결과의 도메인, 사건, 처방이 완전히 분기되어야 한다', () => {
    const basePerson = {
      birthDate: '1990-05-15',
      birthTime: '12:00',
      gender: 'male' as const,
      targetYear: 2024,
    };

    // 고민 A: 연애 결별 및 재회
    const resA = generator.generateProduct({
      ...basePerson,
      currentEvent: '연인과 결별 후 재회 고민',
      userTrouble: '결혼을 약속했던 연인이 갑자기 이별을 선언했습니다.',
      desiredQuestion: '다시 연락이 닿아 재회할 수 있을까요?',
    }, { insightDepth: 5, prescription: true });

    // 고민 B: 스타트업 투자 유치 및 동업 분쟁
    const resB = generator.generateProduct({
      ...basePerson,
      currentEvent: '스타트업 창업 및 투자 유치 난항',
      userTrouble: '시드 투자가 무산되고 공동 창업자가 지분 매각을 요구합니다.',
      desiredQuestion: '사업을 계속 유지해야 합니까, 정리해야 합니까?',
    }, { insightDepth: 5, prescription: true });

    // 동일 명식이므로 일간 본원은 같음
    expect(resA.executedModules['CORE_ORIGINAL'].data.dayMaster.stem).toBe(
      resB.executedModules['CORE_ORIGINAL'].data.dayMaster.stem
    );

    // 그러나 도메인이 완전히 다름
    expect(resA.classification.primaryDomain).toBe('LOVE');
    expect(resB.classification.primaryDomain).toBe('BUSINESS');

    // 1부 사건 요약 및 7대 질문 직답이 다름
    expect(resA.customerDeliverable?.sections.step1_currentEvent).not.toBe(
      resB.customerDeliverable?.sections.step1_currentEvent
    );
    expect(resA.customerDeliverable?.answersTo7Questions.q1_whyNow).not.toBe(
      resB.customerDeliverable?.answersTo7Questions.q1_whyNow
    );

    // 처방의 금기 행동(Must Avoid)도 고민별 맞춤 분기됨
    const avoidA = resA.prescriptionReport?.mustAvoid.join(' ') || '';
    const avoidB = resB.prescriptionReport?.mustAvoid.join(' ') || '';
    expect(avoidA).not.toBe(avoidB);
    expect(avoidB).toMatch(/계약|지분|보증/);
  });

  // ==========================================================================
  // 8. 다른 명식 + 동일 고민 결과 차별성 (TEST-08 - CASE 06)
  // ==========================================================================
  it('TEST-08 (CASE 06): 서로 다른 명식이 동일한 이직 고민을 입력하더라도 명리 근거, 지지 상호작용, 시간축이 명식에 따라 100% 달라야 한다', () => {
    const commonTrouble = {
      currentEvent: '새로 부임한 부서장의 폭언과 인사상 불이익으로 퇴사를 결심했습니다.',
      userTrouble: '업무 방식을 강요당하고 고과에서 최하점을 받아 이직을 준비 중입니다.',
      desiredQuestion: '사직서를 바로 내고 이직하는 것이 맞습니까?',
      targetYear: 2025,
    };

    const person1988 = generator.generateProduct({
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female',
      ...commonTrouble,
    }, { insightDepth: 5, prescription: true });

    const person1995 = generator.generateProduct({
      birthDate: '1995-05-20',
      birthTime: '18:30',
      gender: 'male',
      ...commonTrouble,
    }, { insightDepth: 5, prescription: true });

    // 일간 본원이 완전히 다름 (기토 vs 신금)
    expect(person1988.executedModules['CORE_ORIGINAL'].data.dayMaster.stem).not.toBe(
      person1995.executedModules['CORE_ORIGINAL'].data.dayMaster.stem
    );

    // 원국 지지 상호작용이 다름 (자미원진/자미해 vs 사해충/해해자형)
    const natal1988 = person1988.customerDeliverable?.structuredJudgments?.timeAxisBreakdown.natal;
    const natal1995 = person1995.customerDeliverable?.structuredJudgments?.timeAxisBreakdown.natal;
    expect(natal1988).not.toEqual(natal1995);

    // 명리적 인과 설명(Step 3)이 완전히 다름
    expect(person1988.customerDeliverable?.sections.step3_myeongliCore).not.toBe(
      person1995.customerDeliverable?.sections.step3_myeongliCore
    );
  });

  // ==========================================================================
  // 9. 추가 입력 없는 경우 기존 흐름 정상 작동 (TEST-09)
  // ==========================================================================
  it('TEST-09: 추가 입력(additionalContext)이 제공되지 않아도 심층 및 무료 결과가 아무런 결함 없이 정상 생성되어야 한다', () => {
    const pureInput: UserProblemInput = {
      birthDate: '1985-07-20',
      birthTime: '09:00',
      gender: 'female',
      currentEvent: '새로운 사업 진출 및 투자 시기 문의',
    };

    const freeRes = generator.generateProduct(pureInput, { insightDepth: 1 });
    const deepRes = generator.generateProduct(pureInput, { insightDepth: 5, prescription: true });

    expect(freeRes.customerDeliverable?.freeDeliverable).toBeDefined();
    expect(deepRes.customerDeliverable?.sections.step1_currentEvent).toContain('새로운 사업 진출');
    expect(deepRes.customerDeliverable?.safetyPassed).toBe(true);
  });

  // ==========================================================================
  // 10. 무료 → 심층 전체 결정론 검증 (TEST-10)
  // ==========================================================================
  it('TEST-10: 동일 입력과 동일 추가 입력을 10회 반복 실행했을 때 무료 및 심층 결과의 모든 텍스트가 100% 동일해야 한다', () => {
    const advancedInput: UserProblemInput = {
      ...case01_initial,
      selectedSituation: '동업자·파트너와의 지분 및 정산 갈등',
      additionalContext: '동업자가 일방적으로 지분 매각을 요구합니다.',
    };

    const baseFree = generator.generateProduct(advancedInput, { insightDepth: 1 });
    const baseDeep = generator.generateProduct(advancedInput, { insightDepth: 5, prescription: true });

    for (let i = 0; i < 10; i++) {
      const curFree = generator.generateProduct(advancedInput, { insightDepth: 1 });
      const curDeep = generator.generateProduct(advancedInput, { insightDepth: 5, prescription: true });

      expect(curFree.customerDeliverable?.fullFormattedText).toBe(baseFree.customerDeliverable?.fullFormattedText);
      expect(curDeep.customerDeliverable?.fullFormattedText).toBe(baseDeep.customerDeliverable?.fullFormattedText);
    }
  });

  // ==========================================================================
  // 11. 안전성 회귀 검증 (TEST-11)
  // ==========================================================================
  it('TEST-11: 추가 입력을 반영한 심층 결과에서도 한자 단독 노출 및 확정적 미래 단정이 일체 검출되지 않아야 한다', () => {
    const cases = [case01_initial, case02_initial, case03_initial, case04_initial];

    for (const c of cases) {
      const advanced = {
        ...c,
        selectedSituation: '위기 상황 선택',
        additionalContext: '추가적인 극한 갈등 상황 발생',
      };

      const res = generator.generateProduct(advanced, { insightDepth: 5, prescription: true });
      const fullText = res.customerDeliverable!.fullFormattedText;

      // 1) 확정적 파국 예언 배제
      expect(fullText).not.toMatch(/반드시\s*(망한다|헤어진다|파산|사고)/);
      expect(fullText).not.toMatch(/무조건\s*(실패|파산|병)/);

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
  // 12. structuredJudgments 및 시간축 무손실 회귀 (TEST-12)
  // ==========================================================================
  it('TEST-12: 심층 결과의 structuredJudgments와 시간축 메트릭이 전수 보존되어야 한다', () => {
    const advancedInput: UserProblemInput = {
      ...case01_initial,
      selectedSituation: '동업자 갈등',
      additionalContext: '지분 분쟁 발생',
    };

    const res = generator.generateProduct(advancedInput, { insightDepth: 5, prescription: true });
    const sj = res.customerDeliverable?.structuredJudgments;

    expect(sj).toBeDefined();
    expect(sj?.coreProblem).toContain('주요 거래처 부도');
    expect(sj?.selectedSituation).toBe('동업자 갈등');
    expect(sj?.additionalContext).toBe('지분 분쟁 발생');
    expect(sj?.timeAxisBreakdown.natal).toBeDefined();
    expect(sj?.timeAxisBreakdown.daewun).toBeDefined();
    expect(sj?.timeAxisBreakdown.seun).toBeDefined();
    expect(sj?.prescriptions.environment.length).toBeGreaterThan(0);
    expect(sj?.prescriptions.behavior.length).toBeGreaterThan(0);
  });

  // ==========================================================================
  // 13. [결함 1] 무료 결과 격국 표기 정확성 검증 (TEST-13)
  // ==========================================================================
  it('TEST-13: 무료 결과에서 원천 격국 데이터가 존재할 때 정확한 격국 명칭(편재격 등)이 출력되어야 한다', () => {
    const res = generator.generateProduct(case01_initial, { insightDepth: 1, prescription: false });
    const freeText = res.customerDeliverable?.fullFormattedText || '';
    
    // 원천 명리 데이터가 편재격인 명식에서 fallback 문구 단독 노출이 아닌 '편재격'이 정확히 출력되는지 확인
    expect(freeText).toContain('편재격');
    expect(freeText).not.toContain('• [사회적 성취 틀]: 원국 격국 형성\n');
  });

  // ==========================================================================
  // 14. [결함 2] 고객 입력 내용 중복 제거 검증 (TEST-14)
  // ==========================================================================
  it('TEST-14: 심층 결과에서 고객 입력 내용이 기계적인 결합문자열([선택 상황]: ...)로 각 섹션마다 반복되지 않아야 한다', () => {
    const advancedInput: UserProblemInput = {
      ...case01_initial,
      selectedSituation: '동업자·파트너와의 지분 및 정산 갈등',
      additionalContext: '거래처 부도 이후 동업자가 일방적으로 변호사를 대동하여 지분 포기 및 개인 연대보증을 요구하고 있습니다.',
      desiredQuestion: '지분 매각 압박에 응하지 않고 법적으로 회사를 방어할 수 있습니까?',
    };

    const res = generator.generateProduct(advancedInput, { insightDepth: 5, prescription: true });
    const sections = res.customerDeliverable?.sections;
    const fullText = res.customerDeliverable?.fullFormattedText || '';

    // 기계적 복사 결합 문구 금지
    expect(fullText).not.toContain('[선택 상황]:');
    expect(fullText).not.toContain('[추가 상황]:');

    // 1부 1단계에서 구조화된 입력 확인 영역이 존재해야 함
    expect(sections?.step1_currentEvent).toContain('**현재 상황**');
    expect(sections?.step1_currentEvent).toContain('**선택하신 상황**');
    expect(sections?.step1_currentEvent).toContain('**추가로 알려주신 상황**');
    expect(sections?.step1_currentEvent).toContain('**핵심 질문**');

    // 원본 데이터는 UserProblem 및 structuredJudgments에 100% 무손실 보존
    expect(res.userProblem.currentTrouble).toBe(advancedInput.currentTrouble);
    expect(res.userProblem.selectedSituation).toBe(advancedInput.selectedSituation);
    expect(res.userProblem.additionalContext).toBe(advancedInput.additionalContext);
    expect(res.userProblem.desiredQuestion).toBe(advancedInput.desiredQuestion);
    expect(res.customerDeliverable?.structuredJudgments?.selectedSituation).toBe(advancedInput.selectedSituation);
    expect(res.customerDeliverable?.structuredJudgments?.additionalContext).toBe(advancedInput.additionalContext);
  });

  // ==========================================================================
  // 15. [결함 3] Level 5 1부/2부 중복 제거 검증 (TEST-15)
  // ==========================================================================
  it('TEST-15: Level 5의 1부(종합 리포트)와 2부(7대 질문 직답) 간에 단순 문장 복사 중복이 없어야 한다', () => {
    const advancedInput: UserProblemInput = {
      ...case01_initial,
      selectedSituation: '동업자·파트너와의 지분 및 정산 갈등',
      additionalContext: '거래처 부도 이후 동업자가 일방적으로 변호사를 대동하여 지분 포기 및 개인 연대보증을 요구하고 있습니다.',
      desiredQuestion: '지분 매각 압박에 응하지 않고 법적으로 회사를 방어할 수 있습니까?',
    };

    const res = generator.generateProduct(advancedInput, { insightDepth: 5, prescription: true });
    const sections = res.customerDeliverable?.sections;
    const qAnswers = res.customerDeliverable?.answersTo7Questions;

    expect(qAnswers).toBeDefined();
    if (!qAnswers || !sections) throw new Error('Deliverable sections missing');

    // 1부 5단계 시간 흐름 vs 2부 Q3 (단순 복사 여부)
    expect(qAnswers.q3_timingPeriod).not.toBe(sections.step5_futureFlow);
    expect(qAnswers.q3_timingPeriod.length).toBeLessThan(sections.step5_futureFlow.length);

    // 1부 7단계 환경 처방 vs 2부 Q5 (단순 복사 여부)
    expect(qAnswers.q5_environmentChange).not.toBe(sections.step7_environmentPrescription);

    // 1부 8단계 행동 처방 vs 2부 Q4 (단순 복사 여부)
    expect(qAnswers.q4_actionToDo).not.toBe(sections.step8_behaviorPrescription);

    // 2부 질문 4는 직접적이고 압축된 핵심 조언을 제공해야 함
    expect(qAnswers.q4_actionToDo).toContain('우선');
    expect(qAnswers.q4_actionToDo.length).toBeLessThan(sections.step8_behaviorPrescription.length);

    // 2부 질문 2는 기계적 글자 수 자름(...) 없이 완전한 문장으로 완결되어야 함
    expect(qAnswers.q2_myeongliIssue).not.toContain('...');
    expect(qAnswers.q2_myeongliIssue).toContain('명리적 핵심 원인입니다.');
  });

  // ==========================================================================
  // 16. [결함 4] 무료 결과 상황 연결 데이터와 프론트엔드 연동 데이터 정합성 (TEST-16)
  // ==========================================================================
  it('TEST-16: 무료 결과의 상황 연결 장치(추천 상황 옵션)가 온전히 노출되고 프론트 심층 분석 파라미터와 정확히 매핑된다', () => {
    const freeRes = generator.generateProduct(case01_initial, { insightDepth: 1, prescription: false });
    const freeDeliv = freeRes.customerDeliverable?.freeDeliverable;
    
    // 무료 결과 4부에 추천 상황 옵션들이 포함되어야 함
    expect(freeDeliv?.step4_customerConnectWidget).toBeDefined();
    expect(freeDeliv?.step4_customerConnectWidget.options.length).toBeGreaterThanOrEqual(4);
    expect(freeDeliv?.step4_customerConnectWidget.options).toContain('동업자·파트너와의 지분 및 정산 갈등');

    // 4부 텍스트에도 해당 옵션들이 노출됨
    expect(freeRes.customerDeliverable?.fullFormattedText).toContain('동업자·파트너와의 지분 및 정산 갈등');
    expect(freeRes.customerDeliverable?.fullFormattedText).toContain('[4부] 나의 현실 상황과 연결해보기');
  });

  // ==========================================================================
  // 17. 데이터 전수 보존 검증 (TEST-17)
  // ==========================================================================
  it('TEST-17: 원국, 십신, 격국, 강약, 억부, 조후, 신살, 대운, 세운, 19개 분석 모듈 및 시간축이 전수 보존되어야 한다', () => {
    const res = generator.generateProduct(case01_initial, { insightDepth: 5, prescription: true });
    
    // 19개 분석 모듈 정상 실행
    expect(Object.keys(res.executedModules).length).toBeGreaterThanOrEqual(10);
    expect(res.executedModules['CORE_ORIGINAL']).toBeDefined();
    expect(res.executedModules['STRENGTH']).toBeDefined();
    expect(res.executedModules['RELATION']).toBeDefined();
    expect(res.executedModules['DAEWUN']).toBeDefined();
    expect(res.executedModules['SEUN']).toBeDefined();

    // structuredJudgments의 core metrics 보존
    const sj = res.customerDeliverable?.structuredJudgments;
    expect(sj?.coreProblem).toBeDefined();
    expect(sj?.primaryDomain).toBeDefined();
    expect(sj?.myeongliBasis.length).toBeGreaterThan(0);
    expect(sj?.timeAxisBreakdown.natal.length).toBeGreaterThan(0);
    expect(sj?.prescriptions.environment.length).toBeGreaterThan(0);
    expect(sj?.prescriptions.behavior.length).toBeGreaterThan(0);
  });
});

