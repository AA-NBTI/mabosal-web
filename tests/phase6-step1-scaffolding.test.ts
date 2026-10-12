/**
 * Phase 6 STEP 1: Second Relationship, RSI Matrix, TimeModulator & InterpretationNode 테스트
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
  InterpretationFactory,
  InterpretationNode,
  RSIDecisionMatrix,
  SecondRelationshipAction,
  SecondRelationshipEngine,
  TimeModulatorGuard,
  TimeModulatorSignal,
} from '../src/modules/phase6/index.js';
import { RelationshipOutput } from '../src/modules/relationship/relationship-engine.js';
import { SajuCoreOutput } from '../src/modules/saju-core/saju-core-engine.js';

describe('Phase 6 STEP 1: Core Architecture & Interface Verification', () => {
  function createSampleSignalSet(): MaSignalSet {
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

    const inputFact: MaModuleInputFact = MaFactAdapter.createInputFact({
      fourPillars: pillars,
      sajuCore: mockSajuCore,
      relationship: mockRelationship,
    });

    const signalEngine = new MaSignalEngine();
    return signalEngine.process(inputFact);
  }

  describe('1. Second Relationship Layer 4대 작용 및 불변성 검증', () => {
    it('Amplified, Conflicting, Mitigated, Transferred 4대 액션 인터페이스 및 PROVISIONAL 격리', () => {
      const signalSet = createSampleSignalSet();

      // 문서마와 직장마를 의도적으로 활성화
      signalSet.signals['ma_document'].activation.isActivated = true;
      signalSet.signals['ma_career'].activation.isActivated = true;

      const engine = new SecondRelationshipEngine();
      const matches = engine.evaluate(signalSet);

      const amplified = matches.find(m => m.action === 'AMPLIFIED');
      expect(amplified).toBeDefined();
      expect(amplified?.action).toBe('AMPLIFIED');
      expect(amplified?.evidenceLevel).toBe('PROVISIONAL');
      expect(amplified?.certainty).toBe('PROVISIONAL');
      expect(amplified?.isAppliedToCoreState).toBe(false);
      expect(amplified?.primaryBasis.length).toBeGreaterThan(0);
    });

    it('2차 관계 도출이 원본 MaSignalSet의 activation.state를 절대 변경하지 않음', () => {
      const signalSet = createSampleSignalSet();
      const originalCareerState = signalSet.signals['ma_career'].activation.state;

      const engine = new SecondRelationshipEngine();
      engine.evaluate(signalSet);

      expect(signalSet.signals['ma_career'].activation.state).toBe(originalCareerState);
    });
  });

  describe('2. RSI Decision Matrix 정성 판정 및 예외 조건 검증', () => {
    it('SERENE 판정: STABLE 응집도 + LOW 장력 + HIGH 탄력성', () => {
      const assessment = RSIDecisionMatrix.evaluate({
        cohesion: 'STABLE',
        tension: 'LOW',
        resilience: 'HIGH',
      });

      expect(assessment.band).toBe('SERENE');
      expect(assessment.certainty).toBe('PROVISIONAL');
      expect(assessment.isExceptionApplied).toBe(false);
    });

    it('SERENE 예외 조건: LOW 장력이라도 일간 극약 시 LATENT로 강등', () => {
      const assessment = RSIDecisionMatrix.evaluate({
        cohesion: 'STABLE',
        tension: 'LOW',
        resilience: 'HIGH',
        isDayMasterExtremeWeak: true,
      });

      expect(assessment.band).toBe('LATENT');
      expect(assessment.isExceptionApplied).toBe(true);
      expect(assessment.reasoning).toContain('일간 극약');
    });

    it('BALANCED_TENSION 판정: CRITICAL/TENSE 장력이라도 HIGH 탄력성이 흡수', () => {
      const assessment = RSIDecisionMatrix.evaluate({
        cohesion: 'STABLE',
        tension: 'CRITICAL',
        resilience: 'HIGH',
      });

      expect(assessment.band).toBe('BALANCED_TENSION');
      expect(assessment.reasoning).toContain('성취 동력');
    });

    it('TURBULENT 판정: CRITICAL 장력에 DEFICIENT/PARTIAL 탄력성 결합', () => {
      const assessment = RSIDecisionMatrix.evaluate({
        cohesion: 'STABLE',
        tension: 'CRITICAL',
        resilience: 'DEFICIENT',
      });

      expect(assessment.band).toBe('TURBULENT');
      expect(assessment.reasoning).toContain('구조 균열');
    });

    it('LATENT 판정: FRAGILE 응집도 + LOW 장력 + DEFICIENT 탄력성', () => {
      const assessment = RSIDecisionMatrix.evaluate({
        cohesion: 'FRAGILE',
        tension: 'LOW',
        resilience: 'DEFICIENT',
      });

      expect(assessment.band).toBe('LATENT');
      expect(assessment.reasoning).toContain('잠복');
    });
  });

  describe('3. Rule Certainty 초기 PROVISIONAL 격리 검증', () => {
    it('Phase 6 신규 2차 관계 및 RSI 평가는 자동으로 PHASE6_CONFIRMED로 승격되지 않고 PROVISIONAL을 유지함', () => {
      const rsiResult = RSIDecisionMatrix.evaluate({
        cohesion: 'STABLE',
        tension: 'LOW',
        resilience: 'HIGH',
      });
      expect(rsiResult.certainty).toBe('PROVISIONAL');
      expect(rsiResult.certainty).not.toBe('CONFIRMED');

      const signalSet = createSampleSignalSet();
      const relEngine = new SecondRelationshipEngine();
      const matches = relEngine.evaluate(signalSet);
      for (const m of matches) {
        expect(m.certainty).toBe('PROVISIONAL');
        expect(m.evidenceLevel).toBe('PROVISIONAL');
      }
    });
  });

  describe('4. TimeModulatorSignal 원국 불변성 검증', () => {
    it('시간축 신호 생성 시 원국의 MaSignalSet 상태가 100% 불변 보존됨', () => {
      const signalSet = createSampleSignalSet();

      // 원본 상태 스냅샷 기록
      const snapshot = new Map<string, string>();
      for (const [id, sig] of Object.entries(signalSet.signals)) {
        snapshot.set(id, sig.activation.state);
      }

      // 시간축 모듈레이터 신호 독립 생성
      const timeSignal: TimeModulatorSignal = TimeModulatorGuard.createSignal({
        timeScope: 'DAEWOON',
        targetModuleId: 'ma_career',
        temporalTriggerState: 'ACTIVE',
        description: '대운 관성 기운 유입으로 10년간 직장 환경 활성화',
      });

      expect(timeSignal.timeScope).toBe('DAEWOON');
      expect(timeSignal.targetModuleId).toBe('ma_career');
      expect(timeSignal.evidenceLevel).toBe('PROVISIONAL');

      // 원본 불변성 검증
      const isImmutabilityPreserved = TimeModulatorGuard.verifyOriginalSignalImmutability(signalSet, snapshot);
      expect(isImmutabilityPreserved).toBe(true);
    });
  });

  describe('5. InterpretationNode Fact Traceability 검증', () => {
    it('InterpretationNode는 원천 Fact 레퍼런스를 보존하고 PROVISIONAL 시 고지 문구를 필수 탑재함', () => {
      const node: InterpretationNode = InterpretationFactory.createNode({
        interpretationId: 'interp_career_001',
        theme: 'CAREER_ORGANIZATION',
        primaryVerdict: '안정적인 조직 진속 및 공인 자격 획득 기회',
        derivedFromSignals: ['ma_career', 'ma_document'],
        factReferences: {
          pillarsInvolved: ['month', 'year'],
          tenGods: ['정관', '정인'],
          relationshipsUsed: ['관인상생'],
          isSpouseFactReferenced: false,
        },
        certainty: 'PROVISIONAL',
      });

      expect(node.interpretationId).toBe('interp_career_001');
      expect(node.theme).toBe('CAREER_ORGANIZATION');
      expect(node.factReferences.tenGods).toEqual(['정관', '정인']);
      expect(node.factReferences.relationshipsUsed).toEqual(['관인상생']);
      expect(node.certainty).toBe('PROVISIONAL');
      expect(node.provisionalNote).toBeDefined();
      expect(node.provisionalNote).toContain('보조 참고 지표');
    });
  });
});
