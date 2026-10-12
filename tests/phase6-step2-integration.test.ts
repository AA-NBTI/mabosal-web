/**
 * Phase 6 STEP 2: Second Relationship, RSI Integration, Traceability & Immutability 테스트
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
  Phase6Output,
  Phase6Pipeline,
  RSIEngine,
  SecondRelationshipEngine,
} from '../src/modules/phase6/index.js';
import { RelationshipOutput } from '../src/modules/relationship/relationship-engine.js';
import { SajuCoreOutput } from '../src/modules/saju-core/saju-core-engine.js';

describe('Phase 6 STEP 2: Second Relationship & RSI Integration Tests', () => {
  function createTestEnvironment(overrides?: {
    fourPillars?: FourPillars;
    sajuCore?: Partial<SajuCoreOutput>;
    relationship?: Partial<RelationshipOutput>;
  }): { fact: MaModuleInputFact; signalSet: MaSignalSet } {
    const pillars: FourPillars = overrides?.fourPillars ?? {
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
      ...overrides?.sajuCore,
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
      ...overrides?.relationship,
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

  describe('1. Second Relationship Engine 실제 연결 및 4대 작용 검증', () => {
    it('Phase 5 MaSignalSet을 입력으로 받아 Amplified, Conflicting, Mitigated, Transferred를 정밀 검출', () => {
      const { signalSet } = createTestEnvironment();

      // 인위적으로 4대 관계 조건 신호 활성화
      signalSet.signals['ma_document'].activation.isActivated = true;
      signalSet.signals['ma_career'].activation.isActivated = true;
      signalSet.signals['ma_gossip'].activation.isActivated = true;
      signalSet.signals['ma_noble'].activation.isActivated = true;
      signalSet.signals['ma_accident'].activation.isActivated = true;
      signalSet.signals['ma_business'].activation.isActivated = true;
      signalSet.signals['ma_asset'].activation.isActivated = true;

      const engine = new SecondRelationshipEngine();
      const matches = engine.evaluate(signalSet);

      const actions = matches.map(m => m.action);
      expect(actions).toContain('AMPLIFIED');
      expect(actions).toContain('CONFLICTING');
      expect(actions).toContain('MITIGATED');
      expect(actions).toContain('TRANSFERRED');

      // 모든 관계의 확정도 및 불변성 플래그 검증
      for (const m of matches) {
        expect(m.phaseOrigin).toBe('PHASE_6');
        expect(m.certainty).toBe('PROVISIONAL');
        expect(m.evidenceLevel).toBe('PROVISIONAL');
        expect(m.isAppliedToCoreState).toBe(false);
        expect(m.signalsInvolved.length).toBe(2);
      }
    });
  });

  describe('2. RSI Engine 실제 입력 흐름 연결 및 정성 4대 밴드 검증', () => {
    it('정성 3대 축(Cohesion, Tension, Resilience)을 도출하고 비선형 Decision Matrix를 통해 RSI Band 산출', () => {
      const { fact, signalSet } = createTestEnvironment();

      const rsiEngine = new RSIEngine();
      const rsi = rsiEngine.evaluate(fact, signalSet);

      expect(['STABLE', 'MODERATE', 'FRAGILE']).toContain(rsi.cohesion);
      expect(['LOW', 'TENSE', 'CRITICAL']).toContain(rsi.tension);
      expect(['HIGH', 'PARTIAL', 'DEFICIENT']).toContain(rsi.resilience);
      expect(['SERENE', 'BALANCED_TENSION', 'TURBULENT', 'LATENT']).toContain(rsi.band);

      // 숫자 점수나 가중평균이 일절 포함되지 않음 검증
      expect((rsi as any).score).toBeUndefined();
      expect((rsi as any).numericScore).toBeUndefined();

      // 확정도 및 출처 검증
      expect(rsi.certainty).toBe('PROVISIONAL');
      expect(rsi.evidenceLevel).toBe('PROVISIONAL');
      expect(rsi.phaseOrigin).toBe('PHASE_6');
    });

    it('인접 육충 및 삼형살 직면 시 Tension=CRITICAL 및 TURBULENT 밴드 전이 검증', () => {
      const { fact, signalSet } = createTestEnvironment({
        relationship: {
          branch_clashes: [
            {
              detected: true,
              category: 'BRANCH',
              type: 'six_clash',
              name: '자오충',
              branches: ['자', '오'],
              positions: ['year', 'month'],
              clashCategory: '왕지충 (자오, 묘유)',
              priority: 'PRIMARY',
              description: '정면 수화 충돌',
              intensity: 90,
              distance: 1, // 인접
              baseScore: 92,
              interaction: { status: 'ACTIVE', isMitigated: false },
            },
          ],
        },
      });

      const rsiEngine = new RSIEngine();
      const rsi = rsiEngine.evaluate(fact, signalSet);

      expect(rsi.tension).toBe('CRITICAL');
      expect(['TURBULENT', 'BALANCED_TENSION']).toContain(rsi.band);
    });
  });

  describe('3. 고정 처리 순서 및 원본 MaSignalSet 불변성(Immutability) 검증', () => {
    it('Phase6Pipeline 실행 시 P5 MaSignalSet의 ActivationState가 단 1개도 변경되지 않음', () => {
      const { fact, signalSet } = createTestEnvironment();

      // 실행 전 상태 스냅샷
      const beforeSnapshot = new Map<string, string>();
      for (const [id, sig] of Object.entries(signalSet.signals)) {
        beforeSnapshot.set(id, sig.activation.state);
      }

      const pipeline = new Phase6Pipeline();
      const output: Phase6Output = pipeline.execute({ fact, signalSet });

      expect(output.immutabilityVerified).toBe(true);
      expect(output.secondRelationships).toBeDefined();
      expect(output.rsi).toBeDefined();

      // 실행 후 상태 비교
      for (const [id, sig] of Object.entries(signalSet.signals)) {
        expect(sig.activation.state).toBe(beforeSnapshot.get(id));
      }
    });
  });

  describe('4. Traceability (원천 신호 및 Fact 역추적성) 전수 검증', () => {
    it('SecondRelationship 및 RSI 결과가 어떤 MaSignal과 어떤 Fact에서 유래했는지 완벽히 추적 가능함', () => {
      const { fact, signalSet } = createTestEnvironment();
      signalSet.signals['ma_document'].activation.isActivated = true;
      signalSet.signals['ma_career'].activation.isActivated = true;

      const pipeline = new Phase6Pipeline();
      const output = pipeline.execute({ fact, signalSet });

      // 1. Second Relationship Traceability
      for (const rel of output.secondRelationships) {
        expect(rel.sourceModuleId).toBeDefined();
        expect(rel.targetModuleId).toBeDefined();
        expect(rel.signalsInvolved).toEqual([rel.sourceModuleId, rel.targetModuleId]);
        expect(rel.primaryBasis.length).toBeGreaterThan(0);
        expect(rel.phaseOrigin).toBe('PHASE_6');
      }

      // 2. RSI Traceability
      expect(output.rsi.derivedFromFacts.length).toBeGreaterThan(0);
      expect(output.rsi.reasoning.length).toBeGreaterThan(0);
      expect(output.rsi.phaseOrigin).toBe('PHASE_6');
    });
  });

  describe('5. PROVISIONAL 격리 검증', () => {
    it('Phase 6의 모든 산출물은 자동으로 PHASE6_CONFIRMED로 승격되지 않고 PROVISIONAL을 엄격 유지함', () => {
      const { fact, signalSet } = createTestEnvironment();
      const pipeline = new Phase6Pipeline();
      const output = pipeline.execute({ fact, signalSet });

      expect(output.rsi.certainty).toBe('PROVISIONAL');
      expect(output.rsi.certainty).not.toBe('CONFIRMED');
      expect((output.rsi.certainty as any)).not.toBe('PHASE6_CONFIRMED');

      for (const rel of output.secondRelationships) {
        expect(rel.certainty).toBe('PROVISIONAL');
        expect(rel.evidenceLevel).toBe('PROVISIONAL');
      }
    });
  });
});
