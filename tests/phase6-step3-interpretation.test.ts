/**
 * Phase 6 STEP 3: Interpretation Engine, 4-Step Structure & Traceability 테스트
 */

import { describe, expect, it } from 'vitest';
import { FourPillars } from '../src/core/types.js';
import {
  MaFactAdapter,
  MaModuleInputFact,
  MaSignalEngine,
  MaSignalSet,
} from '../src/modules/ma/index.js';
import {
  InterpretationEngine,
  InterpretationFactory,
  InterpretationNode,
  Phase6Pipeline,
  RSIEngine,
  SecondRelationshipEngine,
} from '../src/modules/phase6/index.js';
import { RelationshipOutput } from '../src/modules/relationship/relationship-engine.js';
import { SajuCoreOutput } from '../src/modules/saju-core/saju-core-engine.js';

describe('Phase 6 STEP 3: Interpretation Engine & 4-Step Structure Tests', () => {
  function createTestContext(): { fact: MaModuleInputFact; signalSet: MaSignalSet } {
    const pillars: FourPillars = {
      year: { stem: '갑', branch: '자' },
      month: { stem: '병', branch: '인' },
      day: { stem: '무', branch: '진' },
      hour: { stem: '정', branch: '사' },
    };

    const mockSajuCore: SajuCoreOutput = {
      four_pillars: pillars,
      day_stem: '무',
      day_element: '토',
      ten_gods: {
        year: { stemTenGod: '편관', branchMainTenGod: '정재', hiddenStemsTenGods: [] },
        month: { stemTenGod: '편인', branchMainTenGod: '편관', hiddenStemsTenGods: [] },
        day: { stemTenGod: '비견', branchMainTenGod: '비견', hiddenStemsTenGods: [] },
        hour: { stemTenGod: '정인', branchMainTenGod: '편인', hiddenStemsTenGods: [] },
      },
      five_elements: {
        distribution: {
          목: { element: '목', rawScore: 25, percentage: 25, count: 2 },
          화: { element: '화', rawScore: 35, percentage: 35, count: 2 },
          토: { element: '토', rawScore: 25, percentage: 25, count: 2 },
          금: { element: '금', rawScore: 0, percentage: 0, count: 0 },
          수: { element: '수', rawScore: 15, percentage: 15, count: 1 },
        },
        dominantElement: '화',
        weakestElement: '금',
        missingElements: ['금'],
        imbalanceScore: 30,
        calculationWeights: { monthBranchMultiplier: 3, dayBranchMultiplier: 1.5, otherBranchMultiplier: 1, stemMultiplier: 1 },
      },
      day_master_strength: {
        dayStem: '무',
        dayElement: '토',
        deukRyeongScore: 30,
        deukJiScore: 70,
        deukSeScore: 60,
        totalStrengthScore: 55,
        classification: '중화신강',
        isDeukRyeong: false,
        isDeukJi: true,
        isDeukSe: true,
      },
      rootings: {
        yearStem: { stem: '갑', position: 'year', rootingScore: 70, rootedBranches: [] },
        monthStem: { stem: '병', position: 'month', rootingScore: 80, rootedBranches: [] },
        dayStem: { stem: '무', position: 'day', rootingScore: 85, rootedBranches: [] },
        hourStem: { stem: '정', position: 'hour', rootingScore: 60, rootedBranches: [] },
      },
      emergences: [],
      palaces: {} as any,
      flow_channels: { shiksang_saeng_jae: 30, gwan_in_saeng: 70, jae_saeng_gwan: 40, bi_geop_bunsan: 20 },
      time_dependency: { requires_hour: false, time_dependency: 20, is_missing_hour: false },
    };

    const mockRelationship: RelationshipOutput = {
      stem_relations: [],
      branch_harmonies: [],
      branch_clashes: [],
      branch_punishments: [],
      minor_relations: [],
      interactions: [],
      summary: { total_harmony_score: 0, total_clash_score: 0, total_punishment_score: 0, overall_stability_score: 80, rsi_status: 'DEPRECATED_PENDING_PHASE_5' },
      time_dependency: { requires_hour: false, time_dependency: 20, is_missing_hour: false },
    };

    const fact: MaModuleInputFact = MaFactAdapter.createInputFact({
      fourPillars: pillars,
      sajuCore: mockSajuCore,
      relationship: mockRelationship,
    });

    const signalEngine = new MaSignalEngine();
    const signalSet = signalEngine.process(fact);

    return { fact, signalSet };
  }

  describe('1. InterpretationNode 생성 및 4단계 구조화 검증', () => {
    it('InterpretationEngine이 테마별 노드를 생성하고, 4단계 내부 구조(결론/근거/2차관계및RSI/주의)를 보유함', () => {
      const { fact, signalSet } = createTestContext();

      const pipeline = new Phase6Pipeline();
      const output = pipeline.execute({ fact, signalSet });

      expect(output.interpretations.length).toBeGreaterThanOrEqual(4);

      for (const node of output.interpretations) {
        expect(node.interpretationId).toBeDefined();
        expect(node.theme).toBeDefined();
        expect(node.primaryVerdict).toBeDefined();
        expect(node.derivedFromSignals.length).toBeGreaterThan(0);
        expect(node.factReferences).toBeDefined();

        // 4단계 구조화 섹션 검증
        const s = node.structure;
        expect(s).toBeDefined();
        expect(s.conclusion).toBe(node.primaryVerdict);
        expect(s.basis.signals.length).toBeGreaterThan(0);
        expect(s.relationshipAndRSIImpact.rsiBand).toBe(output.rsi.band);
        expect(s.actionableCaution.guideline.length).toBeGreaterThan(0);
      }
    });
  });

  describe('2. Fact → Signal → Second Relationship → RSI → Interpretation 전체 추적성 검증', () => {
    it('모든 해석 노드는 원천 Fact(궁위, 십신, 관계)까지 완전 역추적 가능함', () => {
      const { fact, signalSet } = createTestContext();
      const pipeline = new Phase6Pipeline();
      const output = pipeline.execute({ fact, signalSet });

      const careerNode = output.interpretations.find(n => n.theme === 'CAREER_ORGANIZATION');
      expect(careerNode).toBeDefined();
      expect(careerNode?.derivedFromSignals).toContain('ma_career');
      expect(careerNode?.factReferences.tenGods).toContain('정관');

      const wealthNode = output.interpretations.find(n => n.theme === 'WEALTH_FLOW');
      expect(wealthNode).toBeDefined();
      expect(wealthNode?.derivedFromSignals).toContain('ma_wealth');

      const relNode = output.interpretations.find(n => n.theme === 'RELATIONSHIP_BOND');
      expect(relNode).toBeDefined();
      expect(relNode?.factReferences.isSpouseFactReferenced).toBe(true);

      const safetyNode = output.interpretations.find(n => n.theme === 'SAFETY_MOVEMENT');
      expect(safetyNode).toBeDefined();
      expect(safetyNode?.structure.actionableCaution.cautionType).toBe('ACCIDENT_TENSION');
    });

    it('factReferences 누락 시 InterpretationFactory가 에러를 발생시켜 역추적 결함을 원천 차단함', () => {
      expect(() => {
        InterpretationFactory.createNode({
          interpretationId: 'invalid_node',
          theme: 'CAREER_ORGANIZATION',
          primaryVerdict: '근거 없는 결론',
          derivedFromSignals: ['ma_career'],
          factReferences: {
            pillarsInvolved: [],
            tenGods: [],
            relationshipsUsed: [],
          },
          certainty: 'PROVISIONAL',
        });
      }).toThrow(/factReferences가 누락되었습니다/);
    });
  });

  describe('3. Certainty Isolation (확정도 격리 및 PROVISIONAL 고지문 검증)', () => {
    it('모든 Phase 6 해석 노드는 PROVISIONAL이며 확정 단정형이 아닌 보조 안내문(provisionalNote)을 탑재함', () => {
      const { fact, signalSet } = createTestContext();
      const pipeline = new Phase6Pipeline();
      const output = pipeline.execute({ fact, signalSet });

      for (const node of output.interpretations) {
        expect(node.certainty).toBe('PROVISIONAL');
        expect(node.certainty).not.toBe('CONFIRMED');
        expect((node.certainty as any)).not.toBe('PHASE6_CONFIRMED');
        expect(node.provisionalNote).toBeDefined();
        expect(node.provisionalNote?.length).toBeGreaterThan(0);
      }
    });

    it('Phase 5 원천 신호의 확정도는 PHASE5_CONFIRMED로 온전히 보존되고 Phase 6 해석과 섞이지 않음', () => {
      const { fact, signalSet } = createTestContext();
      const pipeline = new Phase6Pipeline();
      const output = pipeline.execute({ fact, signalSet });

      // Phase 5 신호 확정도 검사 (변경 없음)
      const careerSig = signalSet.signals['ma_career'];
      expect(careerSig.activation.certainty).toBe('PHASE5_CONFIRMED');

      // Phase 6 해석 노드 확정도 검사 (PROVISIONAL)
      const careerNode = output.interpretations.find(n => n.theme === 'CAREER_ORGANIZATION');
      expect(careerNode?.certainty).toBe('PROVISIONAL');
    });
  });

  describe('4. 원본 MaSignalSet 불변성 재검증', () => {
    it('해석 파이프라인 전체 완료 후에도 원본 MaSignalSet의 ActivationState 및 축 데이터는 읽기 전용으로 보존됨', () => {
      const { fact, signalSet } = createTestContext();

      // 스냅샷
      const beforeSnapshot = new Map<string, string>();
      for (const [id, sig] of Object.entries(signalSet.signals)) {
        beforeSnapshot.set(id, sig.activation.state);
      }

      const pipeline = new Phase6Pipeline();
      const output = pipeline.execute({ fact, signalSet });

      expect(output.immutabilityVerified).toBe(true);

      for (const [id, sig] of Object.entries(signalSet.signals)) {
        expect(sig.activation.state).toBe(beforeSnapshot.get(id));
      }
    });
  });
});
