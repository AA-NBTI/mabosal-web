/**
 * src/modules/modular/product-combiner.ts
 * 
 * Phase 60: 모듈 조합 기반 상품 어셈블러 (Product Combiner)
 * 
 * 6대 상품 계층 지원:
 * 1. FREE: 표준 사주 기본 분석 (CORE_ORIGINAL, STRENGTH)
 * 2. STANDARD: 표준 명리 심화 분석 (CORE_ORIGINAL, TEN_GODS, GEOKGUK, STRENGTH, EOKBU, JOHU, RELATION, DAEWUN, SEUN)
 * 3. SINGLE: 개별 전문 모듈 1개 단독 상품 (예: RELATION, SINSAL 등)
 * 4. COMBINATION: 2개 이상 전문 모듈 자유 조합 상품 (예: RELATION + SINSAL, CORE_ORIGINAL + DAEWUN)
 * 5. SAL: 현실 고민 + 관련 명리 모듈 결합 상품 (예: LOVE + RELATION + SINSAL + SEUN)
 * 6. PREMIUM: 종합 전수 모듈 + 통합 분석 + 마 진단 + 처방
 */

import { moduleRegistry, ModuleRegistry } from './module-registry.js';
import { integratedAnalyzer, IntegratedAnalyzer } from './integrated-analyzer.js';
import {
  ModularId,
  ModularInput,
  ModularOutput,
  ProductTierLevel,
  ProductPackageDefinition,
  ProductAssemblyResult,
} from './types.js';

export class ProductCombiner {
  constructor(
    private registry: ModuleRegistry = moduleRegistry,
    private analyzer: IntegratedAnalyzer = integratedAnalyzer
  ) {}

  /**
   * 사전 정의된 표준 패키지 카탈로그
   */
  public getStandardPackages(): ProductPackageDefinition[] {
    return [
      {
        packageId: 'PKG_FREE_BASIC',
        packageName: '무료 사주 기본 진단',
        tier: 'FREE',
        price: 0,
        description: '일간의 본질과 오행 분포, 일간 강약 지표를 확인하는 기초 진단',
        requiredModuleIds: ['CORE_ORIGINAL', 'STRENGTH'],
      },
      {
        packageId: 'PKG_STANDARD_FULL',
        packageName: '정통 명리 심화 사주풀이',
        tier: 'STANDARD',
        price: 39000,
        description: '격국, 십신, 억부·조후 용신, 10년 대운 및 세운 흐름을 망라하는 정통 명리 분석서',
        requiredModuleIds: [
          'CORE_ORIGINAL',
          'TEN_GODS',
          'GEOKGUK',
          'STRENGTH',
          'EOKBU',
          'JOHU',
          'RELATION',
          'DAEWUN',
          'SEUN',
        ],
      },
      {
        packageId: 'PKG_SAL_RELATION_CRISIS',
        packageName: '살·충·형·파·해 현실 고민 진단',
        tier: 'SAL',
        price: 79000,
        description: '현실 고민과 합충형파해 및 신살의 결합으로 현재 위기의 원인을 밝히는 진단',
        requiredModuleIds: ['RELATION', 'SINSAL', 'SEUN'],
      },
      {
        packageId: 'PKG_PREMIUM_FULL_SOLUTION',
        packageName: '마보살 프리미엄 통합 처방 솔루션',
        tier: 'PREMIUM',
        price: 149000,
        description: '전수 명리 모듈 + 통합 분석 + 마(魔) 진단 + Do/Don’t 실천 처방의 최고급 솔루션',
        requiredModuleIds: [
          'CORE_ORIGINAL',
          'TEN_GODS',
          'GEOKGUK',
          'STRENGTH',
          'EOKBU',
          'JOHU',
          'RELATION',
          'SINSAL',
          'DAEWUN',
          'SEUN',
          'MAGA_DIAGNOSIS',
          'PRESCRIPTION',
        ],
      },
    ];
  }

  /**
   * 단일 모듈 단독 상품 실행 (SINGLE Tier)
   */
  public assembleSingle(moduleId: ModularId, input: ModularInput): ProductAssemblyResult {
    const modResult = this.registry.executeSingleModule(moduleId, input);
    const modMap: Record<ModularId, ModularOutput> = { [moduleId]: modResult };

    return {
      packageId: `PKG_SINGLE_${moduleId}`,
      packageName: `[단독 전문] ${modResult.moduleName}`,
      tier: 'SINGLE',
      totalModules: 1,
      moduleResults: modMap,
      customerSummaryReport: modResult.explanation.detailedNarrative,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * 임의의 복수 모듈 조합 상품 실행 (COMBINATION Tier)
   * 예: ['RELATION', 'SINSAL'] or ['CORE_ORIGINAL', 'RELATION', 'DAEWUN']
   */
  public assembleCombination(
    moduleIds: ModularId[],
    input: ModularInput,
    customName?: string
  ): ProductAssemblyResult {
    if (moduleIds.length === 0) {
      throw new Error('조합할 모듈이 최소 1개 이상 지정되어야 합니다.');
    }
    if (moduleIds.length === 1) {
      return this.assembleSingle(moduleIds[0], input);
    }

    const moduleResults = this.registry.executeModules(moduleIds, input);
    const integrated = this.analyzer.analyze(moduleResults);

    const summaries = Object.values(moduleResults).map(m => `[${m.moduleName}]\n${m.explanation.summary}`);
    const fullNarrative = `${summaries.join('\n\n')}\n\n[통합 교차 소견]\n${integrated.crossImpactSummary}\n${integrated.chainAnalysis.crossSynthesis}`;

    return {
      packageId: `PKG_COMBINATION_${moduleIds.join('_')}`,
      packageName: customName || `[전문 조합] ${moduleIds.join(' + ')} 분석`,
      tier: 'COMBINATION',
      totalModules: moduleIds.length,
      moduleResults,
      integratedAnalysis: integrated,
      customerSummaryReport: fullNarrative,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * 현실 고민 결합 상품 실행 (SAL Tier)
   * 예: 고민 카테고리에 맞는 모듈 + RELATION + SINSAL + SEUN
   */
  public assembleSal(
    troubleModuleId: ModularId,
    relationModuleIds: ModularId[],
    input: ModularInput
  ): ProductAssemblyResult {
    const allIds = Array.from(new Set([troubleModuleId, ...relationModuleIds, 'MAGA_DIAGNOSIS']));
    const moduleResults = this.registry.executeModules(allIds, input);
    const integrated = this.analyzer.analyze(moduleResults);
    const maga = moduleResults['MAGA_DIAGNOSIS']?.data;

    const narrative = `[살(煞)진단 - 현실 고민 정밀 분석]\n${moduleResults[troubleModuleId]?.explanation.detailedNarrative || ''}\n\n[살·충·형 작용]\n${moduleResults['RELATION']?.explanation.summary || ''}\n\n[마보살 마(魔) 진단]\n${maga?.punchline || ''}\n원인: ${maga?.rootCause || ''}`;

    return {
      packageId: `PKG_SAL_${troubleModuleId}`,
      packageName: `[살(煞)진단] ${moduleResults[troubleModuleId]?.moduleName || '현실 고민'} 정밀 분석`,
      tier: 'SAL',
      totalModules: allIds.length,
      moduleResults,
      integratedAnalysis: integrated,
      magaDiagnosis: maga,
      customerSummaryReport: narrative,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * 최고급 종합 처방 솔루션 실행 (PREMIUM Tier)
   */
  public assemblePremium(input: ModularInput, troubleModuleId?: ModularId): ProductAssemblyResult {
    const pkg = this.getStandardPackages().find(p => p.tier === 'PREMIUM')!;
    const ids = [...pkg.requiredModuleIds];
    if (troubleModuleId && !ids.includes(troubleModuleId)) {
      ids.push(troubleModuleId);
    }

    const moduleResults = this.registry.executeModules(ids, input);
    const integrated = this.analyzer.analyze(moduleResults);
    const maga = moduleResults['MAGA_DIAGNOSIS']?.data;
    const prescription = moduleResults['PRESCRIPTION']?.data;

    const narrative = `[마보살 프리미엄 통합 솔루션]
1. 원국 및 사회적 무대: ${moduleResults['CORE_ORIGINAL']?.explanation.summary} / ${moduleResults['GEOKGUK']?.explanation.summary}
2. 기운의 흐름과 시간축: ${moduleResults['DAEWUN']?.explanation.summary} / ${moduleResults['SEUN']?.explanation.summary}
3. 현실 위기 원인 및 마(魔) 진단: ${maga?.punchline} (${maga?.rootCause})
4. 마보살 행동 처방 (Do & Don't):
   - 반드시 할 것: ${prescription?.doList?.join(', ')}
   - 절대 피할 것: ${prescription?.dontList?.join(', ')}
   - 대응 시기: ${prescription?.timeline?.coolingPeriod} 침묵 유지 후 ${prescription?.timeline?.easingPeriod} 소통 모색`;

    return {
      packageId: pkg.packageId,
      packageName: pkg.packageName,
      tier: 'PREMIUM',
      totalModules: ids.length,
      moduleResults,
      integratedAnalysis: integrated,
      magaDiagnosis: maga,
      prescription,
      customerSummaryReport: narrative,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * 표준 패키지 ID로 일괄 어셈블
   */
  public assemblePackage(packageId: string, input: ModularInput): ProductAssemblyResult {
    const pkg = this.getStandardPackages().find(p => p.packageId === packageId);
    if (!pkg) {
      throw new Error(`[ProductCombiner] 알 수 없는 패키지 ID: ${packageId}`);
    }

    if (pkg.tier === 'FREE') {
      const results = this.registry.executeModules(pkg.requiredModuleIds, input);
      return {
        packageId: pkg.packageId,
        packageName: pkg.packageName,
        tier: 'FREE',
        totalModules: pkg.requiredModuleIds.length,
        moduleResults: results,
        customerSummaryReport: Object.values(results).map(r => r.explanation.summary).join('\n\n'),
        generatedAt: new Date().toISOString(),
      };
    }

    if (pkg.tier === 'STANDARD') {
      const results = this.registry.executeModules(pkg.requiredModuleIds, input);
      return {
        packageId: pkg.packageId,
        packageName: pkg.packageName,
        tier: 'STANDARD',
        totalModules: pkg.requiredModuleIds.length,
        moduleResults: results,
        customerSummaryReport: Object.values(results).map(r => r.explanation.summary).join('\n\n'),
        generatedAt: new Date().toISOString(),
      };
    }

    if (pkg.tier === 'PREMIUM') {
      return this.assemblePremium(input);
    }

    return this.assembleCombination(pkg.requiredModuleIds, input, pkg.packageName);
  }
}

export const productCombiner = new ProductCombiner();
