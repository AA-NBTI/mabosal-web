import { describe, it, expect } from 'vitest';
import {
  moduleRegistry,
  productCombiner,
  integratedAnalyzer,
  BaseModularEngine,
  ModularInput,
  ModularOutput,
} from '../src/modules/modular/index.js';
import { FourPillars } from '../src/core/types.js';

describe('Phase 60: Modular Product Architecture Test Suite', () => {

  const sampleInput: ModularInput = {
    birthDate: '1992-03-15',
    birthTime: '08:30',
    gender: 'male',
    userTroubleText: '3년간 만난 연인과 큰 다툼 후 헤어졌습니다. 다시 연락해도 될까요?',
    targetYear: 2026,
    targetMonth: 10,
  };

  // --------------------------------------------------------------------------
  // 1. 19개 표준 모듈 전수 단독 실행(Standalone) 및 파이프라인 검증
  // --------------------------------------------------------------------------
  describe('1. 각 모듈 단독 실행 (Input → Calc → Judgment → Explanation → Output)', () => {
    const allIds = moduleRegistry.getAllModuleIds();

    it('총 19개의 표준 모듈(Core 10개, Trouble 7개, Mabosal 2개)이 정상 등록되어 있다', () => {
      expect(allIds.length).toBe(19);
      expect(allIds).toContain('CORE_ORIGINAL');
      expect(allIds).toContain('TEN_GODS');
      expect(allIds).toContain('GEOKGUK');
      expect(allIds).toContain('STRENGTH');
      expect(allIds).toContain('EOKBU');
      expect(allIds).toContain('JOHU');
      expect(allIds).toContain('RELATION');
      expect(allIds).toContain('SINSAL');
      expect(allIds).toContain('DAEWUN');
      expect(allIds).toContain('SEUN');
      expect(allIds).toContain('MONEY');
      expect(allIds).toContain('BUSINESS');
      expect(allIds).toContain('JOB');
      expect(allIds).toContain('LOVE');
      expect(allIds).toContain('MARRIAGE');
      expect(allIds).toContain('RELATIONSHIP');
      expect(allIds).toContain('HEALTH');
      expect(allIds).toContain('MAGA_DIAGNOSIS');
      expect(allIds).toContain('PRESCRIPTION');
    });

    for (const modId of allIds) {
      it(`모듈 [${modId}]은 다른 모듈 없이 단독 실행되고 5단계 파이프라인 규격을 충족한다`, () => {
        const out = moduleRegistry.executeSingleModule(modId, sampleInput);

        expect(out.success).toBe(true);
        expect(out.moduleId).toBe(modId);
        expect(out.version).toBeDefined();

        // 파이프라인 구조 검증
        expect(out.calculation).toBeDefined();
        expect(out.calculation.rawMetrics).toBeDefined();
        expect(out.calculation.basis.length).toBeGreaterThan(0);
        expect(out.calculation.ruleId).toBeDefined();

        expect(out.judgment).toBeDefined();
        expect(out.judgment.verdict).toBeTruthy();

        expect(out.explanation).toBeDefined();
        expect(out.explanation.summary).toBeTruthy();
        expect(out.explanation.detailedNarrative).toBeTruthy();
        expect(out.explanation.keywords.length).toBeGreaterThan(0);

        expect(out.data).toBeDefined();
      });
    }
  });

  // --------------------------------------------------------------------------
  // 2. 단독 상품화 (SINGLE Tier) 검증
  // --------------------------------------------------------------------------
  describe('2. 개별 전문 모듈 단독 상품화 (SINGLE Tier)', () => {
    it('RELATION 단독 모듈 상품이 독립적으로 조립되고 가격 및 리포트가 생성된다', () => {
      const single = productCombiner.assembleSingle('RELATION', sampleInput);

      expect(single.tier).toBe('SINGLE');
      expect(single.totalModules).toBe(1);
      expect(single.moduleResults['RELATION']).toBeDefined();
      expect(single.customerSummaryReport).toContain('지지의 관계는');
    });

    it('SINSAL 단독 모듈 상품이 독립적으로 조립된다', () => {
      const single = productCombiner.assembleSingle('SINSAL', sampleInput);

      expect(single.tier).toBe('SINGLE');
      expect(single.moduleResults['SINSAL'].data.items.length).toBeGreaterThan(0);
      expect(single.customerSummaryReport).toContain('신살은');
    });
  });

  // --------------------------------------------------------------------------
  // 3. 2개 모듈 및 다중 모듈 조합 (COMBINATION Tier) 검증
  // --------------------------------------------------------------------------
  describe('3. 모듈 조합 상품화 (COMBINATION Tier)', () => {
    it('2개 모듈 조합 (RELATION + SINSAL)이 교차 분석과 함께 정상 조립된다', () => {
      const combo = productCombiner.assembleCombination(['RELATION', 'SINSAL'], sampleInput);

      expect(combo.tier).toBe('COMBINATION');
      expect(combo.totalModules).toBe(2);
      expect(combo.moduleResults['RELATION']).toBeDefined();
      expect(combo.moduleResults['SINSAL']).toBeDefined();
      expect(combo.integratedAnalysis).toBeDefined();
      expect(combo.customerSummaryReport).toContain('통합 교차 소견');
    });

    it('3개 모듈 조합 (CORE_ORIGINAL + RELATION + DAEWUN)이 정상 조립된다', () => {
      const combo = productCombiner.assembleCombination(
        ['CORE_ORIGINAL', 'RELATION', 'DAEWUN'],
        sampleInput
      );

      expect(combo.totalModules).toBe(3);
      expect(combo.moduleResults['CORE_ORIGINAL']).toBeDefined();
      expect(combo.moduleResults['RELATION']).toBeDefined();
      expect(combo.moduleResults['DAEWUN']).toBeDefined();
    });

    it('4개 모듈 비즈니스 조합 (BUSINESS + MONEY + DAEWUN + SEUN)이 정상 조립된다', () => {
      const combo = productCombiner.assembleCombination(
        ['BUSINESS', 'MONEY', 'DAEWUN', 'SEUN'],
        sampleInput
      );

      expect(combo.totalModules).toBe(4);
      expect(combo.moduleResults['BUSINESS']).toBeDefined();
      expect(combo.moduleResults['MONEY']).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 4. 현실 고민 결합 상품 (SAL Tier) 및 마 진단 검증
  // --------------------------------------------------------------------------
  describe('4. 현실 고민 결합 (SAL Tier) 및 마 진단', () => {
    it('연애 고민 결합 (LOVE + RELATION + SINSAL + SEUN)이 정상 조립되고 마 진단이 도출된다', () => {
      const sal = productCombiner.assembleSal(
        'LOVE',
        ['RELATION', 'SINSAL', 'SEUN'],
        sampleInput
      );

      expect(sal.tier).toBe('SAL');
      expect(sal.magaDiagnosis).toBeDefined();
      expect(sal.magaDiagnosis.category).toBe('연애 / 관계');
      expect(sal.magaDiagnosis.punchline).toContain('마가 낀 시기');
      expect(sal.packageName).toContain('살');
      expect(sal.customerSummaryReport).toContain('마(魔) 진단');
    });
  });

  // --------------------------------------------------------------------------
  // 5. 최고급 종합 솔루션 (PREMIUM Tier) 및 행동 처방 검증
  // --------------------------------------------------------------------------
  describe('5. 종합 분석 및 처방 (PREMIUM Tier)', () => {
    it('PREMIUM 티어는 전수 모듈 + 통합 분석 + 마 진단 + Do/Don’t 처방을 완벽히 포함한다', () => {
      const prem = productCombiner.assemblePremium(sampleInput, 'LOVE');

      expect(prem.tier).toBe('PREMIUM');
      expect(prem.totalModules).toBeGreaterThanOrEqual(12);
      expect(prem.prescription).toBeDefined();
      expect(prem.prescription.doList.length).toBeGreaterThan(0);
      expect(prem.prescription.dontList.length).toBeGreaterThan(0);
      expect(prem.prescription.timeline.coolingPeriod).toBeDefined();
      expect(prem.customerSummaryReport).toContain('마보살 프리미엄 통합 솔루션');
    });
  });

  // --------------------------------------------------------------------------
  // 6. 비계산 통합 분석기(Integrated Analyzer) 무결성 검증
  // --------------------------------------------------------------------------
  describe('6. 통합 분석기(Integrated Analyzer) 비계산 무결성', () => {
    it('통합 분석기는 모듈 결과를 취합하여 사슬 분석(Chain Analysis)을 도출한다', () => {
      const moduleResults = moduleRegistry.executeModules(
        ['CORE_ORIGINAL', 'STRENGTH', 'GEOKGUK', 'RELATION', 'SINSAL', 'DAEWUN', 'SEUN', 'LOVE'],
        sampleInput
      );

      const integrated = integratedAnalyzer.analyze(moduleResults);

      expect(integrated.crossImpactSummary).toBeDefined();
      expect(integrated.chainAnalysis.coreStructure).toContain('일간 경');
      expect(integrated.chainAnalysis.relationImpact).toBeDefined();
      expect(integrated.chainAnalysis.sinsalInfluence).toBeDefined();
      expect(integrated.chainAnalysis.luckActivation).toContain('세운');
      expect(integrated.chainAnalysis.troubleMapping).toContain('연애');
      expect(integrated.overallRiskLevel).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 7. 신규 모듈 플러그인 동적 등록 (OCP 비파괴 확장성) 검증
  // --------------------------------------------------------------------------
  describe('7. 신규 모듈 추가 시 기존 기능 비파괴 (OCP 플러그인 확장)', () => {
    class CustomAuraModule extends BaseModularEngine {
      public readonly moduleId = 'CUSTOM_AURA';
      public readonly moduleName = '커스텀 오라 에너지 모듈';
      public readonly category = 'CUSTOM' as const;
      public readonly version = 'CUSTOM-1.0';
      public readonly defaultPrice = 3000;

      protected calculate(input: ModularInput, pillars: FourPillars): ModularOutput['calculation'] {
        return {
          rawMetrics: { auraColor: '황금색 오로라' },
          basis: ['일간 본원의 빛 파장 분석'],
          ruleId: this.version,
        };
      }
      protected judge(): ModularOutput['judgment'] {
        return { verdict: '외유내강의 온화한 황금빛 오라 형성', indicators: {} };
      }
      protected explain(): ModularOutput['explanation'] {
        return {
          summary: '주변을 편안하게 만드는 치유의 빛을 지닙니다.',
          detailedNarrative: '따뜻한 공감 능력으로 대인관계의 매듭을 풉니다.',
          keywords: ['오라', '황금색'],
        };
      }
      protected buildOutputData() {
        return { auraColor: '황금색' };
      }
    }

    it('신규 모듈 등록 후 단독 및 조합 실행이 가능하며 기존 모듈에 영향을 주지 않는다', () => {
      const customMod = new CustomAuraModule();
      moduleRegistry.register(customMod);

      expect(moduleRegistry.get('CUSTOM_AURA')).toBeDefined();

      const out = moduleRegistry.executeSingleModule('CUSTOM_AURA', sampleInput);
      expect(out.success).toBe(true);
      expect(out.data.auraColor).toBe('황금색');

      // 신규 모듈과 기존 모듈 조합
      const combo = productCombiner.assembleCombination(
        ['RELATION', 'CUSTOM_AURA'],
        sampleInput
      );
      expect(combo.totalModules).toBe(2);
      expect(combo.moduleResults['CUSTOM_AURA']).toBeDefined();
      expect(combo.moduleResults['RELATION']).toBeDefined();
    });
  });
});
