/**
 * Phase 5 STEP 3: Ma Signal 통합·검증 Engine 정밀 테스트
 */

import { describe, expect, it } from 'vitest';
import { FourPillars } from '../src/core/types.js';
import {
  MaFactAdapter,
  MaModuleInputFact,
  MaSignalEngine,
  MaSignalSet,
  RuleCertainty,
  StandardMaId,
} from '../src/modules/ma/index.js';
import { RelationshipOutput } from '../src/modules/relationship/relationship-engine.js';
import { SajuCoreOutput } from '../src/modules/saju-core/saju-core-engine.js';

describe('Phase 5 STEP 3: Ma Signal Integration & Verification Engine Tests', () => {
  function createTestFact(overrides?: Partial<MaModuleInputFact>): MaModuleInputFact {
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

    return MaFactAdapter.createInputFact({
      fourPillars: pillars,
      sajuCore: mockSajuCore,
      relationship: mockRelationship,
      spouseProfile: { profileType: 'traditional_male' },
      ...overrides,
    });
  }

  describe('1. 21개 Ma 통합 및 MaSignalSet 완결성', () => {
    it('MaSignalEngine.process가 21개 Ma를 완전하게 통합하여 MaSignalSet을 생성함', () => {
      const engine = new MaSignalEngine();
      const fact = createTestFact();
      const signalSet: MaSignalSet = engine.process(fact);

      expect(signalSet).toBeDefined();
      expect(Object.keys(signalSet.signals).length).toBe(21);

      // 상태별 분류 리스트 무결성
      const totalSignalsInLists =
        signalSet.dominantSignals.length +
        signalSet.activeSignals.length +
        signalSet.overburdenedSignals.length +
        signalSet.triggeredSignals.length +
        signalSet.dormantSignals.length;

      expect(totalSignalsInLists).toBe(21);
      expect(Array.isArray(signalSet.interactions)).toBe(true);
      expect(Array.isArray(signalSet.safetyAlerts)).toBe(true);
      expect(Array.isArray(signalSet.provisionalSignals)).toBe(true);
    });
  });

  describe('2. Fact → Signal 추적성(Traceability) 테스트', () => {
    it('모든 Signal의 Fact 추적 메타데이터가 완벽히 보존됨', () => {
      const engine = new MaSignalEngine();
      const fact = createTestFact();
      const signalSet = engine.process(fact);

      for (const [id, signal] of Object.entries(signalSet.signals)) {
        const trace = signalSet.traceability[id];
        expect(trace).toBeDefined();
        expect(trace.moduleId).toBe(id);
        expect(trace.ruleCertainty).toBe(signal.activation.certainty);
        expect(trace.pillarsInvolved.length).toBeGreaterThan(0);
        expect(Array.isArray(trace.tenGods)).toBe(true);
        expect(Array.isArray(trace.relationshipsUsed)).toBe(true);

        if (id === 'ma_marriage' || id === 'ma_romance') {
          expect(trace.hasSpouseFactLayer).toBe(true);
        }
      }
    });
  });

  describe('3. Interaction 독립성 테스트 (상호작용에 의한 Activation 상태 불변 원칙)', () => {
    it('상호작용(Interaction)이 발생하더라도 개별 Ma의 원래 activation.state는 임의 변경되지 않음', () => {
      const engine = new MaSignalEngine();
      const fact = createTestFact();
      // 직장마와 문서마가 동시에 활성화되어 관인상생 상호작용 발생 유도
      fact.ten_gods.month.branchMainTenGod = '정관';
      fact.ten_gods.year.stemTenGod = '정인';

      const signalSet = engine.process(fact);

      // 상호작용 목록에 관인상생 기록 확인
      const synergy = signalSet.interactions.find(
        r => r.sourceModuleId === 'ma_document' && r.targetModuleId === 'ma_career'
      );
      expect(synergy).toBeDefined();

      // 원래 Ma의 상태가 유지되는지 확인 (상호작용이 있다고 강제로 DOMINANT 등으로 왜곡되지 않음)
      const career = signalSet.signals['ma_career'];
      expect(['ACTIVE', 'DOMINANT', 'TRIGGERED']).toContain(career.activation.state);
    });
  });

  describe('4. Rule Certainty 및 PROVISIONAL/OPEN 격리 테스트', () => {
    it('확정도 카운트 합계가 21개와 정확히 일치함', () => {
      const engine = new MaSignalEngine();
      const fact = createTestFact();
      const signalSet = engine.process(fact);

      const totalCertainty =
        signalSet.confirmedCount +
        signalSet.phase5ConfirmedCount +
        signalSet.provisionalCount +
        signalSet.openCount;

      expect(totalCertainty).toBe(21);
      expect(signalSet.provisionalSignals.length).toBe(signalSet.provisionalCount + signalSet.openCount);
    });

    it('건강마, 자산마, 재판마, 명예마, 집마, 연애마는 provisionalSignals에 격리됨', () => {
      const engine = new MaSignalEngine();
      const fact = createTestFact();
      const signalSet = engine.process(fact);

      const provisionalIds = signalSet.provisionalSignals.map(s => s.moduleId);
      expect(provisionalIds).toContain('ma_health');
      expect(provisionalIds).toContain('ma_asset');
      expect(provisionalIds).toContain('ma_fame');
      expect(provisionalIds).toContain('ma_legal');
      expect(provisionalIds).toContain('ma_home');
      expect(provisionalIds).toContain('ma_romance');

      // 이들은 확정 사실처럼 취급되지 않고 PROVISIONAL로 표시됨
      for (const sig of signalSet.provisionalSignals) {
        expect(sig.activation.certainty).toBe('PROVISIONAL');
        // DOMINANT 상태로 승격될 수 없음 (TRIGGERED 또는 ACTIVE로 방어됨)
        expect(sig.activation.state).not.toBe('DOMINANT');
      }
    });
  });

  describe('5. 안전(Safety) 및 불확실성 가이드라인 리포트 테스트', () => {
    it('건강마, 사고마, 재판마에 대한 안전 알림(safetyAlerts)이 반드시 수집됨', () => {
      const engine = new MaSignalEngine();
      const fact = createTestFact();
      const signalSet = engine.process(fact);

      expect(signalSet.safetyAlerts.length).toBeGreaterThanOrEqual(3);

      const healthAlert = signalSet.safetyAlerts.find(a => a.moduleId === 'ma_health');
      const accidentAlert = signalSet.safetyAlerts.find(a => a.moduleId === 'ma_accident');
      const legalAlert = signalSet.safetyAlerts.find(a => a.moduleId === 'ma_legal');

      expect(healthAlert).toBeDefined();
      expect(healthAlert?.cautionType).toBe('HEALTH_EQUILIBRIUM');

      expect(accidentAlert).toBeDefined();
      expect(accidentAlert?.cautionType).toBe('ACCIDENT_TENSION');

      expect(legalAlert).toBeDefined();
      expect(legalAlert?.cautionType).toBe('LEGAL_DISPUTE');
    });
  });
});
