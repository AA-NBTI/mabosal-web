/**
 * Phase 5 STEP 2: 21개 Ma Activation Rule & Interaction Engine 정밀 검증 테스트
 */

import { describe, expect, it } from 'vitest';
import { FourPillars } from '../src/core/types.js';
import {
  CareerMaEvaluator,
  EvidenceLevel,
  MaActivationEngine,
  MaFactAdapter,
  MaInteractionEngine,
  MaModuleInputFact,
  MarriageMaEvaluator,
  RomanceMaEvaluator,
  SignalInteractionRecord,
  SocialMaEvaluator,
  SpouseProfileAdapter,
  STANDARD_MA_DEFINITIONS,
  StandardMaId,
  WealthMaEvaluator,
} from '../src/modules/ma/index.js';
import { RelationshipOutput } from '../src/modules/relationship/relationship-engine.js';
import { SajuCoreOutput } from '../src/modules/saju-core/saju-core-engine.js';

describe('Phase 5 STEP 2: 21 Ma Activation Rules & Interaction Tests', () => {
  // 기본 모의 사주 데이터 팩토리
  function createBaseFact(overrides?: Partial<MaModuleInputFact>): MaModuleInputFact {
    const defaultPillars: FourPillars = {
      year: { stem: '갑', branch: '자' },
      month: { stem: '병', branch: '인' },
      day: { stem: '무', branch: '진' },
      hour: { stem: '정', branch: '사' },
    };

    const mockSajuCore: SajuCoreOutput = {
      four_pillars: defaultPillars,
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
          stemTenGod: '정인',
          branchMainTenGod: '편인',
          hiddenStemsTenGods: [{ stem: '병', type: 'main', tenGod: '편인', ratio: 0.6 }],
        },
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
      flow_channels: {
        shiksang_saeng_jae: 30,
        gwan_in_saeng: 70,
        jae_saeng_gwan: 40,
        bi_geop_bunsan: 20,
      },
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
      fourPillars: defaultPillars,
      sajuCore: mockSajuCore,
      relationship: mockRelationship,
      spouseProfile: { profileType: 'traditional_male' },
      ...overrides,
    });
  }

  describe('1. 21개 Ma 모듈 전수 등록 및 독립 평가 실행', () => {
    it('MaActivationEngine이 21개 Ma를 전수 평가하고 모두 SignalEntity를 산출함', () => {
      const engine = new MaActivationEngine();
      const fact = createBaseFact();
      const signals = engine.evaluateAll(fact);

      expect(signals.size).toBe(21);

      // 20대 표준 Ma + 1개 확장 슬롯 확인
      const expectedIds: StandardMaId[] = [
        'ma_wealth', 'ma_business', 'ma_career', 'ma_asset', 'ma_social',
        'ma_romance', 'ma_marriage', 'ma_family', 'ma_children', 'ma_parents',
        'ma_health', 'ma_accident', 'ma_gossip', 'ma_document', 'ma_legal',
        'ma_movement', 'ma_exam', 'ma_fame', 'ma_noble', 'ma_home'
      ];

      for (const id of expectedIds) {
        const sig = signals.get(id);
        expect(sig).toBeDefined();
        expect(sig?.moduleId).toBe(id);
        expect(sig?.activation).toBeDefined();
        expect(sig?.qualitativeAxis).toBeDefined();
      }

      const ext = signals.get('ma_extension_slot');
      expect(ext).toBeDefined();
      expect(ext?.activation.state).toBe('DORMANT');
    });
  });

  describe('2. DOMINANT 조건 독립 판정 테스트', () => {
    it('재물마(ma_wealth) DOMINANT: 재격 형성 + 식상생재 유통 + 일간 유근 + 군겁쟁재 부존재', () => {
      const fact = createBaseFact();
      // 재격(월지 정재) + 식상생재 + 일간 유근
      fact.ten_gods.month.branchMainTenGod = '정재';
      fact.ten_gods.month.stemTenGod = '식신';
      fact.ten_gods.year.stemTenGod = '정재';
      fact.flow_channels = { shiksang_saeng_jae: 80, gwan_in_saeng: 30, jae_saeng_gwan: 20, bi_geop_bunsan: 10 };
      fact.day_master_strength.isDeukJi = true;

      const evaluator = new WealthMaEvaluator();
      const signal = evaluator.evaluate(fact);

      expect(signal.activation.state).toBe('DOMINANT');
      expect(signal.activation.certainty).toBe('PHASE5_CONFIRMED');
      expect(signal.activation.primaryCauses.some(c => c.includes('재격 형성'))).toBe(true);
    });

    it('직장마(ma_career) DOMINANT: 관성격 + 관인상생 + 상관견관 부존재', () => {
      const fact = createBaseFact();
      fact.ten_gods.month.branchMainTenGod = '정관';
      fact.ten_gods.month.stemTenGod = '정관';
      fact.ten_gods.hour = { stemTenGod: '정인', branchMainTenGod: '정인', hiddenStemsTenGods: [] };

      const evaluator = new CareerMaEvaluator();
      const signal = evaluator.evaluate(fact);

      expect(signal.activation.state).toBe('DOMINANT');
      expect(signal.activation.certainty).toBe('PHASE5_CONFIRMED');
      expect(signal.activation.primaryCauses.some(c => c.includes('관인상생'))).toBe(true);
    });

    it('인마(ma_social) DOMINANT: 건록 월령 장악 + 관성 통어 확보', () => {
      const fact = createBaseFact();
      fact.ten_gods.month.branchMainTenGod = '비견'; // 건록
      fact.ten_gods.year.stemTenGod = '정관';       // 관성 통어

      const evaluator = new SocialMaEvaluator();
      const signal = evaluator.evaluate(fact);

      expect(signal.activation.state).toBe('DOMINANT');
      expect(signal.activation.primaryCauses.some(c => c.includes('관성 통어'))).toBe(true);
    });

    it('결혼마(ma_marriage) DOMINANT: 일지 합국 안착 + 배우자성 통근 + 일지 피충 전무', () => {
      const fact = createBaseFact();
      fact.spouse_facts.isPalaceIntact = true;
      fact.spouse_facts.palaceHarmonies = [{ detected: true, category: 'BRANCH', type: 'six_harmony', name: '진유합', branches: ['진', '유'], positions: ['day', 'month'], priority: 'PRIMARY', baseScore: 80, intensity: 80, interaction: { status: 'ACTIVE', isMitigated: false } } as any];
      fact.spouse_facts.primaryStarRooted = true;
      fact.spouse_facts.palaceClashes = [];

      const evaluator = new MarriageMaEvaluator();
      const signal = evaluator.evaluate(fact);

      expect(signal.activation.state).toBe('DOMINANT');
      expect(signal.activation.primaryCauses.some(c => c.includes('일지 합국 안착'))).toBe(true);
    });
  });

  describe('3. OVERBURDENED 상태 테스트', () => {
    it('재물마 OVERBURDENED: 재성 투간 + 군겁쟁재 압력 심화 + 극약 사주', () => {
      const fact = createBaseFact();
      fact.ten_gods.year.stemTenGod = '정재';
      fact.flow_channels = { shiksang_saeng_jae: 20, gwan_in_saeng: 10, jae_saeng_gwan: 10, bi_geop_bunsan: 80 };
      fact.day_master_strength.classification = '극약';

      const evaluator = new WealthMaEvaluator();
      const signal = evaluator.evaluate(fact);

      expect(signal.activation.state).toBe('OVERBURDENED');
      expect(signal.activation.primaryCauses.some(c => c.includes('과열'))).toBe(true);
    });

    it('직장마 OVERBURDENED: 상관견관 정면 대치 무제 + 극약 사주', () => {
      const fact = createBaseFact();
      fact.ten_gods.year.stemTenGod = '정관';
      fact.ten_gods.month.stemTenGod = '상관';
      fact.ten_gods.hour = null; // 인성 부존재
      fact.day_master_strength.classification = '극약';

      const evaluator = new CareerMaEvaluator();
      const signal = evaluator.evaluate(fact);

      expect(signal.activation.state).toBe('OVERBURDENED');
    });

    it('인마 OVERBURDENED: 비겁 월령 장악 + 관성/식상 제어 결여 + 겁재 투간', () => {
      const fact = createBaseFact();
      fact.ten_gods.month.branchMainTenGod = '겁재';
      fact.ten_gods.year.stemTenGod = '겁재';
      fact.ten_gods.month.stemTenGod = '비견';
      if (fact.ten_gods.hour) fact.ten_gods.hour.stemTenGod = '비견';

      const evaluator = new SocialMaEvaluator();
      const signal = evaluator.evaluate(fact);

      expect(signal.activation.state).toBe('OVERBURDENED');
      expect(signal.activation.primaryCauses.some(c => c.includes('군겁쟁투'))).toBe(true);
    });
  });

  describe('4. 5대 Axis 직교성 및 비상쇄 테스트', () => {
    it('강한 본질 세력(Intensity=HIGH)과 인접 충돌(Volatility=HIGH)이 공존할 때 상쇄 없이 독립 보존', () => {
      const fact = createBaseFact();
      fact.ten_gods.month.branchMainTenGod = '정관'; // 관성 득령
      fact.ten_gods.month.stemTenGod = '정관';       // 투간
      // 인접 육충 추가
      fact.branch_clashes = [
        {
          detected: true,
          category: 'BRANCH',
          type: 'six_clash',
          name: '인신충',
          branches: ['인', '신'],
          positions: ['month', 'day'],
          clashCategory: '사생지충/역마충 (인신, 사해)',
          priority: 'PRIMARY',
          description: '역마 정면 충돌',
          intensity: 85,
          distance: 1,
          baseScore: 92,
          interaction: { status: 'ACTIVE', isMitigated: false },
        },
      ];

      const evaluator = new CareerMaEvaluator();
      const signal = evaluator.evaluate(fact);

      // 관성 자체는 득령/투간으로 강함
      expect(signal.qualitativeAxis.intensity).toBe('HIGH');
      // 축 간 상쇄 없이 각각 독립적으로 산출됨
      expect(signal.qualitativeAxis.pressure).toBeDefined();
      expect(signal.qualitativeAxis.opportunity).toBeDefined();
      expect(signal.qualitativeAxis.volatility).toBeDefined();
      expect(signal.qualitativeAxis.mitigation).toBeDefined();
    });
  });

  describe('5. PROVISIONAL 규칙의 핵심 Activation 차단 테스트', () => {
    it('건강마: missingElements와 충돌로 DOMINANT 조건을 형성하더라도 PROVISIONAL이므로 TRIGGERED로 강등 차단', () => {
      const fact = createBaseFact();
      fact.five_elements.missingElements = ['금', '수'];
      fact.branch_clashes = [
        {
          detected: true,
          category: 'BRANCH',
          type: 'six_clash',
          name: '자오충',
          branches: ['자', '오'],
          positions: ['year', 'month'],
          clashCategory: '왕지충 (자오, 묘유)',
          priority: 'PRIMARY',
          description: '수화 충돌',
          intensity: 80,
          distance: 1,
          baseScore: 92,
          interaction: { status: 'ACTIVE', isMitigated: false },
        },
      ];

      const engine = new MaActivationEngine();
      const signals = engine.evaluateAll(fact);
      const health = signals.get('ma_health');

      expect(health).toBeDefined();
      expect(health?.activation.certainty).toBe('PROVISIONAL');
      // PROVISIONAL 규칙은 DOMINANT 진입이 차단되어 TRIGGERED로 강등됨
      expect(health?.activation.state).toBe('TRIGGERED');
      expect(health?.activation.inhibitingFactors.some(f => f.includes('차단되었습니다'))).toBe(true);
    });

    it('연애마: 도화+식상+일지합으로 DOMINANT 조건을 만족하더라도 PROVISIONAL이므로 TRIGGERED로 차단', () => {
      const fact = createBaseFact();
      fact.four_pillars.year.branch = '자'; // 도화
      fact.ten_gods.year.stemTenGod = '상관';
      fact.spouse_facts.palaceHarmonies = [{ detected: true, category: 'BRANCH', type: 'six_harmony', name: '진유합', branches: ['진', '유'], positions: ['day', 'month'], priority: 'PRIMARY', baseScore: 80, intensity: 80, interaction: { status: 'ACTIVE', isMitigated: false } } as any];

      const evaluator = new RomanceMaEvaluator();
      const signal = evaluator.evaluate(fact);

      expect(signal.activation.certainty).toBe('PROVISIONAL');
      expect(signal.activation.state).toBe('TRIGGERED');
      expect(signal.activation.inhibitingFactors.some(f => f.includes('차단되었습니다'))).toBe(true);
    });
  });

  describe('6. 배우자 Zero-Gender Leakage 테스트', () => {
    it('결혼마와 연애마는 gender 변수 없이 오직 SpouseFactLayer만을 통해 평가됨', () => {
      const fact = createBaseFact();

      // fact 자체 및 spouse_facts에 gender 키가 일절 없음
      expect('gender' in (fact as any)).toBe(false);
      expect('gender' in (fact.spouse_facts as any)).toBe(false);

      const marriageEval = new MarriageMaEvaluator();
      const romanceEval = new RomanceMaEvaluator();

      const marriageSig = marriageEval.evaluate(fact);
      const romanceSig = romanceEval.evaluate(fact);

      expect(marriageSig.moduleId).toBe('ma_marriage');
      expect(romanceSig.moduleId).toBe('ma_romance');
      expect(marriageSig.referencedFacts.tenGods.includes(fact.spouse_facts.primarySpouseStar)).toBe(true);
    });
  });

  describe('7. Ma Interaction & evidenceLevel 테스트', () => {
    it('관인상생 상호작용 (직장 + 문서): DERIVED 레벨로 opportunity 강화', () => {
      const engine = new MaActivationEngine();
      const interactionEngine = new MaInteractionEngine();

      const fact = createBaseFact();
      fact.ten_gods.month.branchMainTenGod = '정관';
      fact.ten_gods.year.stemTenGod = '정인';

      const signals = engine.evaluateAll(fact);
      const records = interactionEngine.evaluateInteractions(signals);

      const careerDoc = records.find(r => r.sourceModuleId === 'ma_document' && r.targetModuleId === 'ma_career');
      expect(careerDoc).toBeDefined();
      expect(careerDoc?.evidenceLevel).toBe('DERIVED');
      expect(careerDoc?.interactionType).toBe('AMPLIFIED');

      // 적용
      interactionEngine.applyInteractions(signals, records);
      const career = signals.get('ma_career');
      expect(career?.qualitativeAxis.opportunity).not.toBe('LOW');
    });

    it('사고마 + 귀인마 상호작용: DERIVED 레벨로 mitigation 극대화', () => {
      const engine = new MaActivationEngine();
      const interactionEngine = new MaInteractionEngine();

      const fact = createBaseFact();
      // 사고마 촉발 (인접 육충)
      fact.branch_clashes = [
        {
          detected: true,
          category: 'BRANCH',
          type: 'six_clash',
          name: '인신충',
          branches: ['인', '신'],
          positions: ['month', 'day'],
          clashCategory: '사생지충/역마충 (인신, 사해)',
          priority: 'PRIMARY',
          description: '역마 충돌',
          intensity: 85,
          distance: 1,
          baseScore: 92,
          interaction: { status: 'ACTIVE', isMitigated: false },
        },
      ];
      // 귀인마 활성 (무토 일간의 천을귀인: 축, 미)
      fact.four_pillars.year.branch = '축';

      const signals = engine.evaluateAll(fact);
      const records = interactionEngine.evaluateInteractions(signals);

      const accidentNoble = records.find(r => r.sourceModuleId === 'ma_noble' && r.targetModuleId === 'ma_accident');
      expect(accidentNoble).toBeDefined();
      expect(accidentNoble?.evidenceLevel).toBe('DERIVED');
      expect(accidentNoble?.interactionType).toBe('MITIGATED');

      interactionEngine.applyInteractions(signals, records);
      const accident = signals.get('ma_accident');
      expect(accident?.qualitativeAxis.mitigation).toBe('VERY_HIGH');
      expect(accident?.activation.mitigatingFactors.some(f => f.includes('귀인마'))).toBe(true);
    });

    it('PROVISIONAL 상호작용은 핵심 activation.state를 절대 변경하지 않음', () => {
      const engine = new MaActivationEngine();
      const interactionEngine = new MaInteractionEngine();

      const fact = createBaseFact();
      // 재물마와 자산마 활성
      fact.ten_gods.year.stemTenGod = '정재';
      fact.four_pillars.month.branch = '진'; // 토 사묘고지

      const signals = engine.evaluateAll(fact);
      const assetBeforeState = signals.get('ma_asset')?.activation.state;

      const records = interactionEngine.evaluateInteractions(signals);
      const provisionalRecord = records.find(r => r.evidenceLevel === 'PROVISIONAL');

      if (provisionalRecord) {
        interactionEngine.applyInteractions(signals, records);
        const assetAfterState = signals.get('ma_asset')?.activation.state;
        expect(assetAfterState).toBe(assetBeforeState); // 상태 변경 없음
      }
    });
  });
});
