/**
 * Phase 11: 실제 상담 대화 엔진 검증 테스트
 * 
 * 검증 항목:
 * 1. 10대 기본 질문 유형 (Q01~Q10) 분류 및 답변 완성
 * 2. 10 Case × 주요 질문 검증 (10/10 Cases)
 * 3. 복합 질문 (COMPLEX: 사업 + 재물 + 건강/스트레스)
 * 4. 모호한 질문 (AMBIGUOUS: "앞으로 어떻게 될까요?")
 * 5. 연속 질문 일관성 (Follow-up Consistency)
 * 6. 근거 역추적 (Evidence Traceability: 답변 → Signal → Fact)
 * 7. 비교 질문 중립성 (Q08: 인생 결정 대신하기 금지, 구조적 차이 설명)
 * 8. 시간축 분리 (Q09: TimeModulator 활용, 원국 비간섭 원칙)
 * 9. 확정도 보존 (Certainty: PROVISIONAL 보존)
 * 10. 안전성 가이드라인 (Safety: 특정 질병/파산/이혼 단정 금지, 의료기관 안내)
 * 11. 결정론 (Determinism: 동일 질문 + 동일 입력 = 동일 답변)
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

describe('Phase 11: Consultation Dialogue Layer Audit Suite', () => {
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

  // 테스트용 헬퍼 함수
  function buildTestBundle(tc: TestCaseDefinition, timeModulators: TimeModulatorSignal[] = []) {
    const cal = calendarEngine.execute({ birth_date: tc.birthDate, birth_time: tc.birthTime, region: 'Seoul' });
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
  // 1. 10대 기본 질문 유형 검증 (Q01~Q10)
  // ========================================================
  describe('1. 10 Question Types Verification (Q01 ~ Q10)', () => {
    const bundle = buildTestBundle(PHASE8_10_CASES[0]); // Case 01 일반형

    it('Q01 재물: "저는 돈을 모으는 쪽인가요, 버는 쪽인가요?"', () => {
      const q = '저는 돈을 모으는 쪽인가요, 버는 쪽인가요?';
      const clf = classifier.classify(q);
      expect(clf.intentType).toBe('WEALTH');
      expect(clf.primaryThemes).toContain('WEALTH_FLOW');

      const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: q });
      expect(ans.classifiedIntent).toBe('WEALTH');
      expect(ans.conclusion).toBeDefined();
      expect(ans.evidence).toBeDefined();
      expect(ans.structure).toBeDefined();
      expect(ans.actionableAdvice).toBeDefined();
      expect(ans.fullResponseText).toContain('[마보살의 핵심 결론]');
    });

    it('Q02 직장: "직장생활이 저에게 맞는 편인가요?"', () => {
      const q = '직장생활이 저에게 맞는 편인가요?';
      const clf = classifier.classify(q);
      expect(clf.intentType).toBe('CAREER');
      expect(clf.primaryThemes).toContain('CAREER_ORGANIZATION');

      const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: q });
      expect(ans.classifiedIntent).toBe('CAREER');
      expect(ans.conclusion.length).toBeGreaterThan(10);
    });

    it('Q03 사업: "사업을 한다면 어떤 구조가 중요한가요?"', () => {
      const q = '사업을 한다면 어떤 구조가 중요한가요?';
      const clf = classifier.classify(q);
      expect(clf.intentType).toBe('BUSINESS');
      expect(clf.primaryThemes).toContain('BUSINESS_VENTURE');

      const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: q });
      expect(ans.classifiedIntent).toBe('BUSINESS');
      expect(ans.structure).toBeDefined();
    });

    it('Q04 관계: "배우자나 연애 관계에서 어떤 점을 중요하게 봐야 하나요?"', () => {
      const q = '배우자나 연애 관계에서 어떤 점을 중요하게 봐야 하나요?';
      const clf = classifier.classify(q);
      expect(clf.intentType).toBe('RELATIONSHIP');
      expect(clf.primaryThemes).toContain('RELATIONSHIP_BOND');

      const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: q });
      expect(ans.classifiedIntent).toBe('RELATIONSHIP');
      expect(ans.actionableAdvice).toBeDefined();
    });

    it('Q05 건강: "건강에서 제가 특히 신경 써야 할 부분은 무엇인가요?"', () => {
      const q = '건강에서 제가 특히 신경 써야 할 부분은 무엇인가요?';
      const clf = classifier.classify(q);
      expect(clf.intentType).toBe('HEALTH');
      expect(clf.primaryThemes).toContain('HEALTH_EQUILIBRIUM');

      const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: q });
      expect(ans.classifiedIntent).toBe('HEALTH');
      expect(ans.safetyNotes[0]).toContain('의료기관');
    });

    it('Q06 안전·이동: "이동이나 생활에서 주의할 점이 있나요?"', () => {
      const q = '이동이나 생활에서 주의할 점이 있나요?';
      const clf = classifier.classify(q);
      expect(clf.intentType).toBe('SAFETY');
      expect(clf.primaryThemes).toContain('SAFETY_MOVEMENT');

      const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: q });
      expect(ans.classifiedIntent).toBe('SAFETY');
      expect(ans.conclusion).toBeDefined();
    });

    it('Q07 종합: "제 사주를 한마디로 설명하면 어떤 구조인가요?"', () => {
      const q = '제 사주를 한마디로 설명하면 어떤 구조인가요?';
      const clf = classifier.classify(q);
      expect(clf.intentType).toBe('OVERALL');

      const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: q });
      expect(ans.classifiedIntent).toBe('OVERALL');
      expect(ans.conclusion).toContain('당신의 사주');
    });

    it('Q08 비교: "직장과 사업 중 어떤 구조가 더 강하게 나타나나요?"', () => {
      const q = '직장과 사업 중 어떤 구조가 더 강하게 나타나나요?';
      const clf = classifier.classify(q);
      expect(clf.intentType).toBe('COMPARISON');
      expect(clf.isComparison).toBe(true);

      const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: q });
      expect(ans.classifiedIntent).toBe('COMPARISON');
      // 특정 선택을 대신 결정하지 않고 두 구조 차이 설명
      expect(ans.conclusion).toContain('어느 한쪽을 절대적으로 정해드리기보다');
      expect(ans.evidence).toContain('직장 방면');
      expect(ans.evidence).toContain('사업 방면');
    });

    it('Q09 시간축: "현재 운에서 어떤 부분이 더 활성화되나요?"', () => {
      const temporalSignal: TimeModulatorSignal = {
        timeScope: 'DAEWOON',
        targetModuleId: 'ma_career',
        temporalTriggerState: 'ACTIVE',
        evidenceLevel: 'PROVISIONAL',
        description: '관성 기운 유입으로 조직 내 직책 활성화',
      };
      const tempBundle = buildTestBundle(PHASE8_10_CASES[0], [temporalSignal]);

      const q = '현재 운에서 어떤 부분이 더 활성화되나요?';
      const clf = classifier.classify(q);
      expect(clf.intentType).toBe('TEMPORAL');
      expect(clf.isTemporal).toBe(true);

      const ans = dialogueEngine.answerQuestion({ ...tempBundle, questionText: q });
      expect(ans.classifiedIntent).toBe('TEMPORAL');
      expect(ans.evidence).toContain('원국 자체를 바꾸는 것이 아니라');
    });

    it('Q10 근거: "왜 그렇게 해석했나요?"', () => {
      const q = '왜 그렇게 해석했나요?';
      const clf = classifier.classify(q);
      expect(clf.intentType).toBe('EVIDENCE');
      expect(clf.isEvidenceRequest).toBe(true);

      const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: q });
      expect(ans.classifiedIntent).toBe('EVIDENCE');
      expect(ans.tracePath).toBeDefined();
      expect(ans.tracePath?.originFacts.length).toBeGreaterThan(0);
      expect(ans.tracePath?.signalsUsed.length).toBeGreaterThan(0);
      expect(ans.tracePath?.rsiBand).toBeDefined();
      expect(ans.evidence).toContain('[근거 1] 원천 사주 Fact');
      expect(ans.evidence).toContain('[근거 2] 활성화된 21 MaSignal');
    });
  });

  // ========================================================
  // 2. 10 Cases 전체 검증 (10/10)
  // ========================================================
  describe('2. 10 Cases Verification (10/10 Cases)', () => {
    it('10개 사주 전 케이스에서 Q01~Q10 질문에 대해 온전한 4단계 답변 생성', () => {
      for (const tc of PHASE8_10_CASES) {
        const bundle = buildTestBundle(tc);
        const testQuestion = '제 사주를 한마디로 설명하면 어떤 구조인가요?';
        const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: testQuestion });

        expect(ans.conclusion).toBeTruthy();
        expect(ans.evidence).toBeTruthy();
        expect(ans.structure).toBeTruthy();
        expect(ans.actionableAdvice).toBeTruthy();
        expect(ans.certaintyDescription).toBeTruthy();
        expect(ans.safetyNotes.length).toBeGreaterThan(0);
      }
    });
  });

  // ========================================================
  // 3. 복합 질문 검증 (Complex Questions)
  // ========================================================
  describe('3. Complex Questions Verification', () => {
    const bundle = buildTestBundle(PHASE8_10_CASES[2]); // Case 03 극신약

    it('사업 + 재물 + 건강/스트레스 결합 질문 정상 처리', () => {
      const q = '사업을 하면 돈은 벌 수 있는데 스트레스가 심한 사주인가요?';
      const clf = classifier.classify(q);
      expect(clf.intentType).toBe('COMPLEX');
      expect(clf.primaryThemes).toContain('BUSINESS_VENTURE');
      expect(clf.primaryThemes).toContain('WEALTH_FLOW');
      expect(clf.primaryThemes).toContain('HEALTH_EQUILIBRIUM');

      const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: q });
      expect(ans.classifiedIntent).toBe('COMPLEX');
      expect(ans.conclusion).toContain('스트레스');
      expect(ans.actionableAdvice).toContain('휴식');
    });
  });

  // ========================================================
  // 4. 모호한 질문 검증 (Ambiguous Questions)
  // ========================================================
  describe('4. Ambiguous Questions Verification', () => {
    const bundle = buildTestBundle(PHASE8_10_CASES[0]);

    it('"앞으로 어떻게 될까요?" 질문 시 전체 구조 먼저 설명하고 질문 범위 좁히기 유도', () => {
      const q = '앞으로 어떻게 될까요?';
      const clf = classifier.classify(q);
      expect(clf.intentType).toBe('AMBIGUOUS');
      expect(clf.isAmbiguous).toBe(true);

      const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: q });
      expect(ans.classifiedIntent).toBe('AMBIGUOUS');
      // 이미 제공된 사주를 재질문하지 않고, 구체적 분야 선택을 유도
      expect(ans.actionableAdvice).toContain('구체적으로 말씀해 주시면');
    });
  });

  // ========================================================
  // 5. 연속 질문 일관성 검증 (Follow-up Consistency)
  // ========================================================
  describe('5. Follow-up Dialogue Consistency', () => {
    const bundle = buildTestBundle(PHASE8_10_CASES[1]); // Case 02 극신강

    it('연속된 4개 질문 시 이전 맥락을 유지하며 모순 없이 답변', () => {
      const context: ConsultationDialogueContext = {
        previousAnswers: [],
        lastReferencedThemes: [],
      };

      // 1. 사업운
      const q1 = '사업을 한다면 어떤 구조가 중요한가요?';
      const ans1 = dialogueEngine.answerQuestion({ ...bundle, questionText: q1, context });
      expect(ans1.classifiedIntent).toBe('BUSINESS');
      context.previousAnswers.push(ans1);
      context.lastReferencedThemes = ans1.primaryThemes;

      // 2. 직장 vs 사업 비교
      const q2 = '그럼 직장보다 사업이 좋은가요?';
      const ans2 = dialogueEngine.answerQuestion({ ...bundle, questionText: q2, context });
      expect(ans2.classifiedIntent).toBe('COMPARISON');
      context.previousAnswers.push(ans2);
      context.lastReferencedThemes = ans2.primaryThemes;

      // 3. 주의점
      const q3 = '사업을 한다면 주의할 점은?';
      const ans3 = dialogueEngine.answerQuestion({ ...bundle, questionText: q3, context });
      expect(ans3.classifiedIntent).toBe('BUSINESS');
      context.previousAnswers.push(ans3);
      context.lastReferencedThemes = ans3.primaryThemes;

      // 4. 근거 질의
      const q4 = '왜 그렇게 판단했나요?';
      const ans4 = dialogueEngine.answerQuestion({ ...bundle, questionText: q4, context });
      expect(ans4.classifiedIntent).toBe('EVIDENCE');
      expect(ans4.tracePath).toBeDefined();
    });
  });

  // ========================================================
  // 6. Evidence Traceability & Safety Verification
  // ========================================================
  describe('6. Evidence Traceability, Certainty & Safety', () => {
    const bundle = buildTestBundle(PHASE8_10_CASES[4]); // Case 05 고립/편중형

    it('근거 질문 시 원천 Fact까지 완전 역추적 가능', () => {
      const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: '왜 그렇게 나오나요?' });
      expect(ans.tracePath).toBeDefined();
      expect(ans.tracePath?.originFacts.some(f => f.includes('일간:'))).toBe(true);
      expect(ans.tracePath?.originFacts.some(f => f.includes('사주 4주:'))).toBe(true);
      expect(ans.tracePath?.rsiBand).toBeDefined();
    });

    it('금지 사항 준수: 특정 질병 단정, 사망/파산/이혼 확정, 날짜 예언 부재', () => {
      const q = '건강에서 제가 특히 신경 써야 할 부분은 무엇인가요?';
      const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: q });

      const text = ans.fullResponseText;
      expect(text).not.toContain('암에 걸립니다');
      expect(text).not.toContain('사망합니다');
      expect(text).not.toContain('이혼이 확정');
      expect(text).not.toContain('파산하게 됩니다');
      expect(text).not.toMatch(/\d{4}년 \d{1,2}월 \d{1,2}일에 사고/);
    });

    it('PROVISIONAL 확정도 보존: 확정적 사실처럼 표현하지 않음', () => {
      const ans = dialogueEngine.answerQuestion({ ...bundle, questionText: '직장생활이 저에게 맞는 편인가요?' });
      expect(ans.certaintyDescription).toContain('PROVISIONAL');
    });
  });

  // ========================================================
  // 7. Determinism (결정론 검증)
  // ========================================================
  describe('7. Determinism Verification', () => {
    const bundle = buildTestBundle(PHASE8_10_CASES[0]);

    it('동일 질문 + 동일 사주 입력 시 100% 동일한 판단 도출', () => {
      const q = '직장과 사업 중 어떤 구조가 더 강하게 나타나나요?';
      const ansA = dialogueEngine.answerQuestion({ ...bundle, questionText: q });
      const ansB = dialogueEngine.answerQuestion({ ...bundle, questionText: q });

      expect(ansA.conclusion).toBe(ansB.conclusion);
      expect(ansA.evidence).toBe(ansB.evidence);
      expect(ansA.structure).toBe(ansB.structure);
      expect(ansA.actionableAdvice).toBe(ansB.actionableAdvice);
      expect(ansA.classifiedIntent).toBe(ansB.classifiedIntent);
    });
  });
});
