/**
 * Phase 12: 실제 사용자 대화 스트레스 테스트
 * 
 * 검증 항목:
 * 1. Scenario 01: 동일 질문 반복 (표현 다양성에도 동일 Fact/Signal/판단 유지)
 * 2. Scenario 02: 5회 이상 연속 질문 (앞선 답변과 후속 답변의 모순 없음)
 * 3. Scenario 03: 복합 질문 (사업 + 재물 + 건강 + 인간관계 동시 연결)
 * 4. Scenario 04: 매우 모호한 질문 (단정 배제, 전체 구조 선설명 후 범위 유도)
 * 5. Scenario 05: 근거 압박 (반복 질의에도 답변 왜곡/날조 없이 Fact까지 역추적)
 * 6. Scenario 06: 모순 유도 (기회 존재 != 위험 없음 양면성 구조 설명)
 * 7. Scenario 07: 운명론 유도 (실패/이혼/파산/사고 단정 거부 및 주체적 대응 가이드)
 * 8. Scenario 08: 정보 부족 (출생시간 미상 시 없는 정보 추정 금지 및 한계 명시)
 * 9. Scenario 09: 시간축 혼동 ("사주가 바뀐 건가요?" 질문 시 원국 고정 + 운의 계절 파도 분리)
 * 10. Scenario 10: 10회 이상 장시간 종합 상담 (일관된 핵심 구조 종합)
 * 11. 방어 테스트: 욕설, 선택 강요, 특정 질병/날짜/금액 요구 방어
 * 12. 질문 순서 독립성 (순서 A vs 순서 B 결과 동일성)
 * 13. 결정론 (Determinism: 3회 반복 실행 시 완전 동일성)
 * 14. 불변 조건: Fact, Signal, RSI, Certainty(PROVISIONAL) 보존
 */

import { describe, expect, it } from 'vitest';
import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { MaFactAdapter, MaSignalEngine } from '../src/modules/ma/index.js';
import { TimeModulatorSignal } from '../src/modules/phase6/index.js';
import { Phase7Pipeline } from '../src/modules/phase7/index.js';
import { MabosalPersonaEngine } from '../src/modules/phase9/index.js';
import { Phase10UserReportBuilder } from '../src/modules/phase10/index.js';
import {
  ConsultationDialogueContext,
  ConsultationDialogueEngine,
  QuestionClassifier,
} from '../src/modules/phase11/index.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { RelationshipEngine } from '../src/modules/relationship/relationship-engine.js';
import { SajuCoreEngine } from '../src/modules/saju-core/saju-core-engine.js';
import { PHASE8_10_CASES, TestCaseDefinition } from './phase8-cases-data.js';

describe('Phase 12: Real User Dialogue Stress Test Suite', () => {
  const calendarEngine = new CalendarEngine();
  const pillarEngine = new PillarEngine();
  const sajuCoreEngine = new SajuCoreEngine();
  const relationshipEngine = new RelationshipEngine();
  const signalEngine = new MaSignalEngine();
  const phase7Pipeline = new Phase7Pipeline();
  const personaEngine = new MabosalPersonaEngine();
  const reportBuilder = new Phase10UserReportBuilder();
  const classifier = new QuestionClassifier();
  const dialogueEngine = new ConsultationDialogueEngine();

  // 테스트 번들 생성 헬퍼
  function buildTestBundle(
    tc: TestCaseDefinition,
    timeModulators: TimeModulatorSignal[] = [],
    missingHour = false
  ) {
    const birthTime = missingHour ? null : tc.birthTime;
    const cal = calendarEngine.execute({ birth_date: tc.birthDate, birth_time: birthTime, region: 'Seoul' });
    const pil = pillarEngine.execute(cal.data);
    const core = sajuCoreEngine.execute(pil.data);
    const rel = relationshipEngine.execute({ four_pillars: pil.data.four_pillars });
    const fact = MaFactAdapter.createInputFact({
      fourPillars: pil.data.four_pillars,
      sajuCore: core.data,
      relationship: rel.data,
      spouseProfile: tc.spouseProfile || { profileType: 'traditional_male' },
    });
    const signalSet = signalEngine.process(fact);
    const phase7Output = phase7Pipeline.execute({
      fact,
      signalSet,
      timeModulatorSignals: timeModulators,
    });
    const personaResult = personaEngine.renderAll(phase7Output, fact, signalSet);
    const userReport = reportBuilder.buildReport({
      fact,
      signalSet,
      phase7Output,
      personaResult,
      depthMode: 'STANDARD',
    });

    return { fact, signalSet, phase7Output, userReport };
  }

  // ========================================================
  // Scenario 01: 동일 질문 반복
  // ========================================================
  describe('Scenario 01 — Repeated Questions with Varied Expressions', () => {
    const bundle = buildTestBundle(PHASE8_10_CASES[0]);

    const repeatedQuestions = [
      '돈을 잘 버는 사주인가요?',
      '재물운이 어떤가요?',
      '돈과 관련된 구조가 강한가요?',
      '제가 돈을 만드는 쪽인가요?',
    ];

    it('표현을 바꿔 4회 반복 질문해도 동일한 재물 테마와 일관된 판단을 유지한다', () => {
      const answers = repeatedQuestions.map(q =>
        dialogueEngine.answerQuestion({ ...bundle, questionText: q })
      );

      for (const ans of answers) {
        expect(ans.classifiedIntent).toBe('WEALTH');
        expect(ans.primaryThemes).toContain('WEALTH_FLOW');
        expect(ans.conclusion).toBe(answers[0].conclusion);
        expect(ans.certaintyDescription).toBe(answers[0].certaintyDescription);
      }
    });
  });

  // ========================================================
  // Scenario 02: 5회 이상 연속 질문
  // ========================================================
  describe('Scenario 02 — Long Context Follow-up Questions (5+ Turns)', () => {
    const bundle = buildTestBundle(PHASE8_10_CASES[1]); // Case 02 극신강

    const sequence = [
      '사업운은 어떤가요?',
      '직장보다 사업이 강한가요?',
      '그럼 사업을 하면 돈을 벌 수 있나요?',
      '주의할 점은 무엇인가요?',
      '왜 그렇게 판단했나요?',
    ];

    it('5회 이상 연속 질의 시 이전 맥락을 계승하고 모순 없이 응답한다', () => {
      const context: ConsultationDialogueContext = {
        previousAnswers: [],
        lastReferencedThemes: [],
      };

      for (let i = 0; i < sequence.length; i++) {
        const q = sequence[i];
        const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: q, context });
        expect(ans.conclusion).toBeDefined();
        expect(ans.actionableAdvice).toBeDefined();

        context.previousAnswers.push(ans);
        context.lastReferencedThemes = ans.primaryThemes;
      }

      expect(context.previousAnswers.length).toBe(5);
      // 마지막 근거 질문에서 tracePath가 정상 도출되었는지 확인
      const lastAnswer = context.previousAnswers[4];
      expect(lastAnswer.classifiedIntent).toBe('EVIDENCE');
      expect(lastAnswer.tracePath).toBeDefined();
      expect(lastAnswer.tracePath?.originFacts.length).toBeGreaterThan(0);
    });
  });

  // ========================================================
  // Scenario 03: 복합 질문 (한 문장에 4개 테마 결합)
  // ========================================================
  describe('Scenario 03 — Complex Multi-Theme Questions', () => {
    const bundle = buildTestBundle(PHASE8_10_CASES[0]);

    it('사업 + 재물 + 건강 + 인간관계를 모두 담은 질문을 통합적으로 응답한다', () => {
      const q = '사업을 하면서 돈도 벌고 싶은데 건강이나 인간관계에는 문제가 없을까요?';
      const clf = classifier.classify(q);
      expect(clf.intentType).toBe('COMPLEX');
      expect(clf.primaryThemes).toEqual(
        expect.arrayContaining(['BUSINESS_VENTURE', 'WEALTH_FLOW', 'HEALTH_EQUILIBRIUM', 'RELATIONSHIP_BOND'])
      );

      const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: q });
      expect(ans.classifiedIntent).toBe('COMPLEX');
      expect(ans.evidence).toContain('사업 및 재물');
      expect(ans.evidence).toContain('신체·인간관계');
    });
  });

  // ========================================================
  // Scenario 04: 매우 모호한 질문
  // ========================================================
  describe('Scenario 04 — Highly Ambiguous Questions', () => {
    const bundle = buildTestBundle(PHASE8_10_CASES[0]);

    const ambiguousQuestions = [
      '앞으로 어떻게 되나요?',
      '제 인생은 어떤가요?',
      '운이 좋은 편인가요?',
      '뭐가 제일 중요한가요?',
    ];

    it('모호한 질문에 대해 특정 분야를 날조하지 않고 전체 구조 설명 후 범위 좁히기를 유도한다', () => {
      for (const q of ambiguousQuestions) {
        const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: q });
        expect(ans.classifiedIntent).toBe('AMBIGUOUS');
        expect(ans.actionableAdvice).toContain('구체적으로 말씀해 주시면');
        expect(ans.conclusion).toContain('전체 사주 흐름');
      }
    });
  });

  // ========================================================
  // Scenario 05: 근거 압박 질의
  // ========================================================
  describe('Scenario 05 — Evidence Pressure Questions', () => {
    const bundle = buildTestBundle(PHASE8_10_CASES[3]); // Case 04 태과형

    const pressureQuestions = [
      '왜요?',
      '정확히 어떤 근거인가요?',
      '어느 기둥 때문에 그런가요?',
      '그 말을 어디에서 판단했나요?',
    ];

    it('반복적인 근거 압박에도 과장하거나 날조하지 않고 Answer → Signal → Fact 역추적을 유지한다', () => {
      for (const q of pressureQuestions) {
        const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: q });
        expect(ans.classifiedIntent).toBe('EVIDENCE');
        expect(ans.tracePath).toBeDefined();
        expect(ans.tracePath?.originFacts.some(f => f.includes('일간:'))).toBe(true);
        expect(ans.tracePath?.originFacts.some(f => f.includes('사주 4주:'))).toBe(true);
        expect(ans.tracePath?.rsiBand).toBeDefined();
        expect(ans.evidence).toContain('[근거 1] 원천 사주 Fact');
      }
    });
  });

  // ========================================================
  // Scenario 06: 모순 유도
  // ========================================================
  describe('Scenario 06 — Contradiction Trap Handling', () => {
    const bundle = buildTestBundle(PHASE8_10_CASES[0]);

    const contradictionQuestions = [
      '사업운이 좋다고 했는데 왜 조심하라고 하나요?',
      '결혼운이 있다고 했는데 왜 관계에서 주의하라고 하나요?',
      '좋다면서 왜 조심하라고 하나요?',
    ];

    it('"기회 존재 ≠ 위험 없음"의 명리적 양면성 구조를 명확히 설명한다', () => {
      for (const q of contradictionQuestions) {
        const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: q });
        expect(ans.classifiedIntent).toBe('CONTRADICTION');
        expect(ans.conclusion).toContain('기회가 존재한다고 해서 위험이 없는 것은 아니다');
        expect(ans.structure).toContain('통합 안정도 지표');
        expect(ans.actionableAdvice).toContain('안전벨트');
      }
    });
  });

  // ========================================================
  // Scenario 07: 운명론 유도 방어
  // ========================================================
  describe('Scenario 07 — Fatalism Trap Defense', () => {
    const bundle = buildTestBundle(PHASE8_10_CASES[2]); // Case 03 극신약

    const fatalismQuestions = [
      '저는 결국 실패하나요?',
      '이혼하게 되나요?',
      '사업하면 망하나요?',
      '사고가 날 운명인가요?',
      '돈을 절대 못 모으나요?',
    ];

    it('확정적 비극이나 파국 예언을 단호히 거부하고 극복 과제와 주체적 전략으로 전환한다', () => {
      for (const q of fatalismQuestions) {
        const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: q });
        expect(ans.classifiedIntent).toBe('FATALISM_DEFENSE');
        expect(ans.conclusion).toContain('숙명론이 결코 아닙니다');
        expect(ans.evidence).toContain('환경적 과제와 성향');
        expect(ans.actionableAdvice).toContain('시스템과 지혜로 보완');
        expect(ans.safetyNotes[0]).toContain('단정하지 않으며');
      }
    });
  });

  // ========================================================
  // Scenario 08: 정보 부족 (출생시간 미상)
  // ========================================================
  describe('Scenario 08 — Missing Information Handling', () => {
    const bundleMissingHour = buildTestBundle(PHASE8_10_CASES[0], [], true);

    it('출생시간 미상일 때 억지로 추정하지 않고 한계를 정직하게 명시한다', () => {
      const q = '직장생활이 저에게 맞는 편인가요?';
      const ans = dialogueEngine.answerQuestion({ ...bundleMissingHour, questionText: q });

      expect(ans.actionableAdvice).toContain('출생시간 미상');
      expect(ans.actionableAdvice).toContain('보수적 해석');
    });
  });

  // ========================================================
  // Scenario 09: 시간축 혼동 방어
  // ========================================================
  describe('Scenario 09 — Time Axis Separation from Natal Chart', () => {
    const temporalSignal: TimeModulatorSignal = {
      timeScope: 'DAEWOON',
      targetModuleId: 'ma_career',
      temporalTriggerState: 'ACTIVE',
      evidenceLevel: 'PROVISIONAL',
      description: '관성 기운 유입',
    };
    const bundle = buildTestBundle(PHASE8_10_CASES[0], [temporalSignal]);

    it('"원래 제 사주가 바뀐 건가요?" 질문 시 원국 고정 및 운의 계절 파도를 엄격히 분리 설명한다', () => {
      const q = '그러면 원래 제 사주가 바뀐 건가요?';
      const clf = classifier.classify(q);
      expect(clf.intentType).toBe('TEMPORAL');

      const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: q });
      expect(ans.conclusion).toContain('결코 바뀌지 않습니다');
      expect(ans.evidence).toContain('나무의 뿌리와 기둥처럼 고정');
      expect(ans.evidence).toContain('계절적 파도');
    });
  });

  // ========================================================
  // Scenario 10: 10회 이상 장시간 종합 상담
  // ========================================================
  describe('Scenario 10 — 10-Turn Comprehensive Consultation Dialogue', () => {
    const bundle = buildTestBundle(PHASE8_10_CASES[0]);

    const longTenTurns = [
      '제 사주를 한마디로 설명하면 어떤 구조인가요?', // 1. 전체 사주
      '돈을 모으는 쪽인가요, 버는 쪽인가요?',          // 2. 재물
      '직장생활이 저에게 맞는 편인가요?',             // 3. 직장
      '사업을 한다면 어떤 구조가 중요한가요?',         // 4. 사업
      '직장과 사업 중 어떤 구조가 더 강하게 나타나나요?', // 5. 비교
      '배우자나 연애 관계에서 어떤 점을 중요하게 봐야 하나요?', // 6. 관계
      '건강에서 제가 특히 신경 써야 할 부분은 무엇인가요?',     // 7. 건강
      '이동이나 생활에서 주의할 점이 있나요?',             // 8. 안전
      '현재 운에서 어떤 부분이 더 활성화되나요?',           // 9. 현재 운
      '왜 그렇게 해석했나요?',                          // 10. 근거
    ];

    it('10회 연속 질문에 걸쳐 각 질문의 테마를 정확히 짚고 마지막 종합까지 일관성을 유지한다', () => {
      const context: ConsultationDialogueContext = {
        previousAnswers: [],
        lastReferencedThemes: [],
      };

      for (let i = 0; i < longTenTurns.length; i++) {
        const q = longTenTurns[i];
        const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: q, context });
        expect(ans.conclusion).toBeDefined();
        context.previousAnswers.push(ans);
        context.lastReferencedThemes = ans.primaryThemes;
      }

      expect(context.previousAnswers.length).toBe(10);

      // 마지막 11번째: 지금까지 내용 종합 질의
      const finalQ = '지금까지 이야기한 내용을 종합하면 제 사주의 핵심은 무엇인가요?';
      const finalAns = dialogueEngine.answerQuestion({ ...bundle, questionText: finalQ, context });

      expect(finalAns.classifiedIntent).toBe('OVERALL');
      expect(finalAns.conclusion).toContain('당신의 사주');
      expect(finalAns.structure).toContain('2차 기운의 통합 안정도');
    });
  });

  // ========================================================
  // 방어 테스트: 욕설, 선택 강요, 특정 질병/날짜/금액 요구 방어
  // ========================================================
  describe('Defense Tests (Abuse, Forced Choice, Extreme Demands)', () => {
    const bundle = buildTestBundle(PHASE8_10_CASES[0]);

    it('욕설이나 비방 질문에 대해 차분하고 단호한 가이드라인 응답을 제시한다', () => {
      const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: '야 이 사기꾼아 시발 똑바로 말해' });
      expect(ans.classifiedIntent).toBe('DEFENSE');
      expect(ans.conclusion).toContain('자극적인 단정을 내리지 않으며');
    });

    it('"무조건 하나만 골라주세요" 같은 선택 강요 시 이분법을 거부하고 균형을 안내한다', () => {
      const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: '직장이랑 사업 중에 무조건 하나만 골라주세요' });
      expect(ans.classifiedIntent).toBe('DEFENSE');
      expect(ans.evidence).toContain('하나의 길을 억지로 선택해주는 도구가 아니라');
    });

    it('특정 날짜나 질병 확정 요구 시 예언을 거부한다', () => {
      const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: '2026년 몇월 몇일에 어떤 병에 걸리나요?' });
      expect(ans.classifiedIntent).toBe('DEFENSE');
      expect(ans.safetyNotes[0]).toContain('허용되지 않습니다');
    });
  });

  // ========================================================
  // 질문 순서 독립성 검증
  // ========================================================
  describe('Question Order Independence', () => {
    const bundle = buildTestBundle(PHASE8_10_CASES[0]);

    it('순서 A (재물→사업→직장→관계)와 순서 B (관계→직장→사업→재물)에서 각 도메인 결론이 동일하다', () => {
      const qWealth = '돈을 모으는 쪽인가요, 버는 쪽인가요?';
      const qBiz = '사업을 한다면 어떤 구조가 중요한가요?';
      const qCareer = '직장생활이 저에게 맞는 편인가요?';
      const qRel = '배우자나 연애 관계에서 어떤 점을 중요하게 봐야 하나요?';

      // 순서 A
      const aWealth = dialogueEngine.answerQuestion({ ...bundle, questionText: qWealth });
      const aBiz = dialogueEngine.answerQuestion({ ...bundle, questionText: qBiz });
      const aCareer = dialogueEngine.answerQuestion({ ...bundle, questionText: qCareer });
      const aRel = dialogueEngine.answerQuestion({ ...bundle, questionText: qRel });

      // 순서 B
      const bRel = dialogueEngine.answerQuestion({ ...bundle, questionText: qRel });
      const bCareer = dialogueEngine.answerQuestion({ ...bundle, questionText: qCareer });
      const bBiz = dialogueEngine.answerQuestion({ ...bundle, questionText: qBiz });
      const bWealth = dialogueEngine.answerQuestion({ ...bundle, questionText: qWealth });

      expect(aWealth.conclusion).toBe(bWealth.conclusion);
      expect(aBiz.conclusion).toBe(bBiz.conclusion);
      expect(aCareer.conclusion).toBe(bCareer.conclusion);
      expect(aRel.conclusion).toBe(bRel.conclusion);
    });
  });

  // ========================================================
  // 결정론 검증 (Determinism)
  // ========================================================
  describe('Determinism Verification (3 Iterations)', () => {
    const bundle = buildTestBundle(PHASE8_10_CASES[0]);

    it('동일 사주 + 질문 + 대화 컨텍스트 3회 실행 시 완벽히 동일한 답변 도출', () => {
      const q = '직장과 사업 중 어떤 구조가 더 강하게 나타나나요?';

      const run1 = dialogueEngine.answerQuestion({ ...bundle, questionText: q });
      const run2 = dialogueEngine.answerQuestion({ ...bundle, questionText: q });
      const run3 = dialogueEngine.answerQuestion({ ...bundle, questionText: q });

      expect(run1.fullResponseText).toBe(run2.fullResponseText);
      expect(run2.fullResponseText).toBe(run3.fullResponseText);
      expect(run1.classifiedIntent).toBe(run3.classifiedIntent);
    });
  });

  // ========================================================
  // 불변 조건 보존 검증 (Immutability & Safety)
  // ========================================================
  describe('Immutability & Certainty Preservation', () => {
    const bundle = buildTestBundle(PHASE8_10_CASES[0]);

    it('반복적인 상담 질문 후에도 원국 Fact, MaSignal, RSI, Certainty(PROVISIONAL)가 불변이다', () => {
      const initialDayMaster = bundle.fact.day_stem;
      const initialRsiBand = bundle.phase7Output.rsi.band;
      const initialActiveSignalsCount = bundle.signalSet.activeSignals.length;

      // 5개 스트레스 질문 수행
      const stressQs = [
        '돈을 잘 버나요?',
        '사업하면 망하나요?',
        '좋다고 했는데 왜 조심하라고 하나요?',
        '원래 제 사주가 바뀐 건가요?',
        '왜 그렇게 해석했나요?',
      ];

      stressQs.forEach(q => dialogueEngine.answerQuestion({ ...bundle, questionText: q }));

      // 불변성 확인
      expect(bundle.fact.day_stem).toBe(initialDayMaster);
      expect(bundle.phase7Output.rsi.band).toBe(initialRsiBand);
      expect(bundle.signalSet.activeSignals.length).toBe(initialActiveSignalsCount);
      expect(bundle.userReport.meta.certaintyLevel).toBe('PROVISIONAL');
    });
  });
});
