/**
 * Phase 5 STEP 1: Fact Adapter, SpouseFactLayer & Ma Signal Schema 정밀 검증 테스트
 */

import { describe, expect, it } from 'vitest';
import { FourPillars } from '../src/core/types.js';
import {
  ActivationState,
  createDefaultActivationEvaluation,
  createDefaultQualitative5Axis,
  createMaSignalEntity,
  EvidenceLevel,
  MaActivationEvaluation,
  MaFactAdapter,
  MaModuleInputFact,
  Qualitative5Axis,
  RuleCertainty,
  SpouseFactLayer,
  SpouseProfile,
  SpouseProfileAdapter,
  STANDARD_MA_DEFINITIONS,
  StandardMaId,
} from '../src/modules/ma/index.js';
import { RelationshipOutput } from '../src/modules/relationship/relationship-engine.js';
import { SajuCoreOutput } from '../src/modules/saju-core/saju-core-engine.js';

describe('Phase 5 STEP 1: Interface & Fact Adapter Verification', () => {
  // 샘플 FourPillars (갑자년 병인월 무진일 임술시)
  const sampleFourPillars: FourPillars = {
    year: { stem: '갑', branch: '자' },
    month: { stem: '병', branch: '인' },
    day: { stem: '무', branch: '진' },
    hour: { stem: '임', branch: '술' },
  };

  // 모의 SajuCoreOutput
  const mockSajuCore: SajuCoreOutput = {
    four_pillars: sampleFourPillars,
    day_stem: '무',
    day_element: '토',
    ten_gods: {
      year: {
        stemTenGod: '편관',
        branchMainTenGod: '정재',
        hiddenStemsTenGods: [{ stem: '임', type: 'main', tenGod: '편재', ratio: 1.0 }],
      },
      month: {
        stemTenGod: '편인',
        branchMainTenGod: '편관',
        hiddenStemsTenGods: [{ stem: '갑', type: 'main', tenGod: '편관', ratio: 1.0 }],
      },
      day: {
        stemTenGod: '비견',
        branchMainTenGod: '비견',
        hiddenStemsTenGods: [{ stem: '무', type: 'main', tenGod: '비견', ratio: 0.6 }],
      },
      hour: {
        stemTenGod: '편재',
        branchMainTenGod: '비견',
        hiddenStemsTenGods: [{ stem: '무', type: 'main', tenGod: '비견', ratio: 0.6 }],
      },
    },
    five_elements: {
      distribution: {
        목: { element: '목', rawScore: 20, percentage: 20, count: 2 },
        화: { element: '화', rawScore: 15, percentage: 15, count: 1 },
        토: { element: '토', rawScore: 35, percentage: 35, count: 3 },
        금: { element: '금', rawScore: 0, percentage: 0, count: 0 },
        수: { element: '수', rawScore: 30, percentage: 30, count: 2 },
      },
      dominantElement: '토',
      weakestElement: '금',
      missingElements: ['금'],
      imbalanceScore: 35,
      calculationWeights: {
        monthBranchMultiplier: 3.0,
        dayBranchMultiplier: 1.5,
        otherBranchMultiplier: 1.0,
        stemMultiplier: 1.0,
      },
    },
    day_master_strength: {
      dayStem: '무',
      dayElement: '토',
      deukRyeongScore: 20,
      deukJiScore: 70,
      deukSeScore: 60,
      totalStrengthScore: 55,
      classification: '중화신강',
      isDeukRyeong: false,
      isDeukJi: true,
      isDeukSe: true,
    },
    rootings: {
      yearStem: { stem: '갑', position: 'year', rootingScore: 80, rootedBranches: [] },
      monthStem: { stem: '병', position: 'month', rootingScore: 60, rootedBranches: [] },
      dayStem: { stem: '무', position: 'day', rootingScore: 85, rootedBranches: [] },
      hourStem: { stem: '임', position: 'hour', rootingScore: 50, rootedBranches: [] },
    },
    emergences: [],
    palaces: {} as any,
    flow_channels: {
      shiksang_saeng_jae: 40,
      gwan_in_saeng: 60,
      jae_saeng_gwan: 50,
      bi_geop_bunsan: 30,
    },
    time_dependency: {
      requires_hour: false,
      time_dependency: 20,
      is_missing_hour: false,
    },
  };

  // 모의 RelationshipOutput (진술충 발생 케이스: 일지 진토 - 시지 술토 충)
  const mockRelationshipWithClash: RelationshipOutput = {
    stem_relations: [],
    branch_harmonies: [],
    branch_clashes: [
      {
        detected: true,
        category: 'BRANCH',
        type: 'six_clash',
        name: '진술충',
        branches: ['진', '술'],
        positions: ['day', 'hour'],
        clashCategory: '사묘지충/붕충 (진술, 축미)',
        priority: 'PRIMARY',
        description: '토오행 붕충',
        intensity: 85,
        distance: 1,
        baseScore: 92,
        interaction: { status: 'ACTIVE', isMitigated: false },
      },
    ],
    branch_punishments: [],
    minor_relations: [],
    interactions: [],
    summary: {
      total_harmony_score: 0,
      total_clash_score: 85,
      total_punishment_score: 0,
      overall_stability_score: 40,
      rsi_status: 'DEPRECATED_PENDING_PHASE_5',
    },
    time_dependency: {
      requires_hour: false,
      time_dependency: 20,
      is_missing_hour: false,
    },
  };

  describe('1. Zero-Gender Leakage & SpouseProfileAdapter', () => {
    it('전통 남명 프로필 매핑: 제1배우자성=정재, 제2배우자성=편재', () => {
      const spouseFacts = SpouseProfileAdapter.createSpouseFactLayer({
        fourPillars: sampleFourPillars,
        sajuCore: mockSajuCore,
        relationship: mockRelationshipWithClash,
        profile: { profileType: 'traditional_male' },
      });

      expect(spouseFacts.primarySpouseStar).toBe('정재');
      expect(spouseFacts.secondarySpouseStar).toBe('편재');
      expect(spouseFacts.spousePalaceBranch).toBe('진');
      expect(spouseFacts.spousePalaceElement).toBe('토');
      // gender 속성이 절대 존재하지 않아야 함
      expect('gender' in spouseFacts).toBe(false);
    });

    it('전통 여명 프로필 매핑: 제1배우자성=정관, 제2배우자성=편관', () => {
      const spouseFacts = SpouseProfileAdapter.createSpouseFactLayer({
        fourPillars: sampleFourPillars,
        sajuCore: mockSajuCore,
        relationship: mockRelationshipWithClash,
        profile: { profileType: 'traditional_female' },
      });

      expect(spouseFacts.primarySpouseStar).toBe('정관');
      expect(spouseFacts.secondarySpouseStar).toBe('편관');
      expect('gender' in spouseFacts).toBe(false);
    });

    it('궁위 중심(palace_centered) 프로필: 일지 본기 십신 기준 매핑', () => {
      const spouseFacts = SpouseProfileAdapter.createSpouseFactLayer({
        fourPillars: sampleFourPillars,
        sajuCore: mockSajuCore,
        relationship: mockRelationshipWithClash,
        profile: { profileType: 'palace_centered' },
      });

      // mockSajuCore의 일지 본기 십신은 '비견'
      expect(spouseFacts.primarySpouseStar).toBe('비견');
      expect(spouseFacts.secondarySpouseStar).toBe('겁재'); // 비견의 반대 십신
    });

    it('배우자궁 충 감지 및 손상 판정: 진술충으로 인한 palaceClashes 감지 및 isPalaceIntact=false', () => {
      const spouseFacts = SpouseProfileAdapter.createSpouseFactLayer({
        fourPillars: sampleFourPillars,
        sajuCore: mockSajuCore,
        relationship: mockRelationshipWithClash,
        profile: { profileType: 'traditional_male' },
      });

      expect(spouseFacts.palaceClashes.length).toBeGreaterThan(0);
      expect(spouseFacts.palaceClashes[0].name).toBe('진술충');
      expect(spouseFacts.isPalaceIntact).toBe(false);
    });

    it('배우자궁 무충 시 isPalaceIntact=true 판정', () => {
      const noClashRelationship: RelationshipOutput = {
        ...mockRelationshipWithClash,
        branch_clashes: [],
      };

      const spouseFacts = SpouseProfileAdapter.createSpouseFactLayer({
        fourPillars: sampleFourPillars,
        sajuCore: mockSajuCore,
        relationship: noClashRelationship,
        profile: { profileType: 'traditional_male' },
      });

      expect(spouseFacts.palaceClashes.length).toBe(0);
      expect(spouseFacts.isPalaceIntact).toBe(true);
    });
  });

  describe('2. MaFactAdapter 생성 및 Zero-Gender 검증', () => {
    it('Phase 1~4 데이터를 결합하여 MaModuleInputFact를 무결하게 생성', () => {
      const inputFact = MaFactAdapter.createInputFact({
        fourPillars: sampleFourPillars,
        sajuCore: mockSajuCore,
        relationship: mockRelationshipWithClash,
      });

      expect(inputFact.four_pillars).toBe(sampleFourPillars);
      expect(inputFact.day_stem).toBe('무');
      expect(inputFact.day_element).toBe('토');
      expect(inputFact.five_elements.dominantElement).toBe('토');
      expect(inputFact.day_master_strength.classification).toBe('중화신강');
      expect(inputFact.branch_clashes.length).toBe(1);
      expect(inputFact.spouse_facts.primarySpouseStar).toBe('정재');

      // Gender 누출 여부 전수 검사
      expect('gender' in (inputFact as any)).toBe(false);
      expect('gender' in (inputFact.spouse_facts as any)).toBe(false);
    });
  });

  describe('3. PROVISIONAL 가드 및 Activation 차단 검증', () => {
    it('isActivationRuleAllowed: CONFIRMED와 PHASE5_CONFIRMED만 허용, PROVISIONAL과 OPEN은 차단', () => {
      expect(MaFactAdapter.isActivationRuleAllowed('CONFIRMED')).toBe(true);
      expect(MaFactAdapter.isActivationRuleAllowed('PHASE5_CONFIRMED')).toBe(true);
      expect(MaFactAdapter.isActivationRuleAllowed('PROVISIONAL')).toBe(false);
      expect(MaFactAdapter.isActivationRuleAllowed('OPEN')).toBe(false);
    });

    it('PROVISIONAL 상호작용은 핵심 활성화 경로에서 차단', () => {
      expect(MaFactAdapter.isInteractionAllowedForActivation('CONFIRMED')).toBe(true);
      expect(MaFactAdapter.isInteractionAllowedForActivation('DERIVED')).toBe(true);
      expect(MaFactAdapter.isInteractionAllowedForActivation('PROVISIONAL')).toBe(false);
    });

    it('validateActivationEvaluation: PROVISIONAL 규칙으로 DOMINANT/ACTIVE 시도시 TRIGGERED로 강등 및 차단 사유 기록', () => {
      const invalidEval: MaActivationEvaluation = {
        state: 'DOMINANT',
        isActivated: true,
        primaryCauses: ['임의 가설에 근거한 조건'],
        inhibitingFactors: [],
        mitigatingFactors: [],
        certainty: 'PROVISIONAL',
      };

      const guarded = MaFactAdapter.validateActivationEvaluation(invalidEval);
      expect(guarded.state).toBe('TRIGGERED');
      expect(guarded.inhibitingFactors.some(f => f.includes('차단되었습니다'))).toBe(true);
    });

    it('PHASE5_CONFIRMED 규칙의 DOMINANT 판정은 온전히 보존', () => {
      const validEval: MaActivationEvaluation = {
        state: 'DOMINANT',
        isActivated: true,
        primaryCauses: ['득령+통근+투간+상생 구조 완비'],
        inhibitingFactors: [],
        mitigatingFactors: [],
        certainty: 'PHASE5_CONFIRMED',
      };

      const guarded = MaFactAdapter.validateActivationEvaluation(validEval);
      expect(guarded.state).toBe('DOMINANT');
      expect(guarded.inhibitingFactors.length).toBe(0);
    });
  });

  describe('4. 21개 Ma Signal Schema & Qualitative5Axis 검증', () => {
    it('20대 표준 Ma 레지스트리 전수 등록 및 정렬 순서 유효성 확인', () => {
      const expectedIds: StandardMaId[] = [
        'ma_wealth', 'ma_business', 'ma_career', 'ma_asset', 'ma_social',
        'ma_romance', 'ma_marriage', 'ma_family', 'ma_children', 'ma_parents',
        'ma_health', 'ma_accident', 'ma_gossip', 'ma_document', 'ma_legal',
        'ma_movement', 'ma_exam', 'ma_fame', 'ma_noble', 'ma_home'
      ];

      for (let i = 0; i < expectedIds.length; i++) {
        const id = expectedIds[i];
        const def = STANDARD_MA_DEFINITIONS[id];
        expect(def).toBeDefined();
        expect(def.moduleId).toBe(id);
        expect(def.order).toBe(i + 1);
        expect(def.defaultCertainty).toBe('PHASE5_CONFIRMED');
      }
    });

    it('건강마, 사고마, 재판마의 안전 가이드라인(safetyGuideline) 내장 확인', () => {
      const healthDef = STANDARD_MA_DEFINITIONS.ma_health;
      const accidentDef = STANDARD_MA_DEFINITIONS.ma_accident;
      const legalDef = STANDARD_MA_DEFINITIONS.ma_legal;

      expect(healthDef.safetyCaution).toBe('HEALTH_EQUILIBRIUM');
      expect(accidentDef.safetyCaution).toBe('ACCIDENT_TENSION');
      expect(legalDef.safetyCaution).toBe('LEGAL_DISPUTE');

      const healthSignal = createMaSignalEntity({
        moduleId: 'ma_health',
        activation: createDefaultActivationEvaluation(),
        qualitativeAxis: createDefaultQualitative5Axis(),
      });

      expect(healthSignal.safetyGuideline).toBeDefined();
      expect(healthSignal.safetyGuideline?.cautionType).toBe('HEALTH_EQUILIBRIUM');
      expect(healthSignal.safetyGuideline?.isRestrictedTopic).toBe(true);
    });

    it('Qualitative5Axis 5대 축의 독립성 및 QualitativeLevel 유효성', () => {
      const axis: Qualitative5Axis = {
        intensity: 'HIGH',
        pressure: 'LOW',
        opportunity: 'VERY_HIGH',
        volatility: 'MODERATE',
        mitigation: 'HIGH',
      };

      expect(axis.intensity).toBe('HIGH');
      expect(axis.pressure).toBe('LOW');
      expect(axis.opportunity).toBe('VERY_HIGH');
      expect(axis.volatility).toBe('MODERATE');
      expect(axis.mitigation).toBe('HIGH');
    });
  });
});
