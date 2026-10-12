/**
 * tests/phase72-versioning-reproducibility.test.ts
 * 
 * Phase 72: 버전 관리·실행 재현성 Freeze 정밀 검증 테스트 스위트
 * 
 * "하나의 Engine Version으로 모든 것을 관리하지 않는다."
 * 
 * 4대 독립 버전 체계:
 * 1. Engine Release Version (1.0.0)
 * 2. Module Version (19개 모듈 각각 1.0.0, FROZEN)
 * 3. Rule Spec Version (1.0.0)
 * 4. ProductConfig Version (2.0.0)
 * 
 * 15대 필수 검증 항목 (Section 10) 및 4대 독립 변경 검증 (Section 11):
 * - VERSION-01: 동일 입력 → 동일 Engine Version
 * - VERSION-02: 동일 입력 → 동일 Rule Spec Version
 * - VERSION-03: 동일 입력 → 동일 Module Versions
 * - VERSION-04: 동일 ProductConfig → 동일 ProductConfig Version
 * - VERSION-05: 동일 입력 + 동일 모든 버전 → 동일 핵심 진단 결과
 * - VERSION-06: 동일 입력 + 동일 모든 버전 → 동일 처방 결과
 * - VERSION-07: 동일 입력 + 동일 모든 버전 → 동일 상품 출력
 * - VERSION-08: 동일 입력 + 가격만 변경 → 명리 진단 불변
 * - VERSION-09: 동일 입력 + 가격만 변경 → 처방 불변
 * - VERSION-10: 동일 입력 + ProductConfig 변경 → ProductConfig Version / config 반영
 * - VERSION-11: 명리 Rule 변경 → Rule Spec Version 변경
 * - VERSION-12: 모듈 로직 변경 → 해당 Module Version 변경
 * - VERSION-13: 구조적 엔진 변경 → Engine Release Version 변경
 * - VERSION-14: 이전 ExecutionTrace 기록 기반 당시 실행 조건 및 호환성 식별
 * - VERSION-15: 10회 반복 실행 → 100% 동일 핵심 결과 및 해시 일치
 * - VERSION-16: 19개 독립 모듈의 FROZEN 상태 및 버전 레지스트리 무손실 등록 검증
 * - VERSION-17: Input Hash 결정론 및 무결성 (공백/키순서 무관 SHA-256 일치)
 * - VERSION-18: 4대 버전 변경의 상호 완전 독립성 (A: Rule, B: Module, C: Config, D: Engine)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  versionRegistry,
  VersionRegistry,
  FROZEN_ENGINE_RELEASE_VERSION,
  FROZEN_RULE_SPEC_VERSION,
  FROZEN_PRODUCT_CONFIG_VERSION,
  INITIAL_19_MODULE_VERSIONS,
} from '../src/core/version-registry.js';
import { ProductGenerator, UserProblemInput, ProductConfig } from '../src/modules/product-generator/index.js';

describe('Phase 72: 버전 관리·실행 재현성 Freeze Test Suite', () => {
  const generator = new ProductGenerator();

  const standardInput: UserProblemInput = {
    birthDate: '1988-12-10',
    birthTime: '14:00',
    gender: 'female',
    currentEvent: '주요 거래처 부도와 동업자 지분 분쟁입니다.',
    userTrouble: '거래처 연쇄 부도로 자금줄이 막히고 동업자가 지분 매각을 요구하며 갈등 중입니다.',
    targetDomain: 'BUSINESS',
    targetYear: 2026,
  };

  const standardConfig: Partial<ProductConfig> = {
    productId: 'PROD_TEST_PHASE72',
    insightDepth: 5,
    selectedModules: ['CORE_ORIGINAL', 'TEN_GODS', 'RELATION', 'BUSINESS', 'MAGA_DIAGNOSIS', 'PRESCRIPTION'],
    prescription: true,
    price: 89000,
  };

  beforeEach(() => {
    // 각 테스트 실행 전 항상 동결 기본 버전으로 초기화
    versionRegistry.resetToFrozenDefaults();
  });

  // ==========================================================================
  // VERSION-01: 동일 입력 → 동일 Engine Version
  // ==========================================================================
  it('VERSION-01: 동일 입력을 실행했을 때 동일한 Engine Release Version(1.0.0)이 기록되어야 한다', () => {
    const res1 = generator.generateProduct(standardInput, standardConfig);
    const res2 = generator.generateProduct(standardInput, standardConfig);

    expect(res1.trace?.engineReleaseVersion).toBe(FROZEN_ENGINE_RELEASE_VERSION);
    expect(res2.trace?.engineReleaseVersion).toBe(FROZEN_ENGINE_RELEASE_VERSION);
    expect(res1.trace?.engineReleaseVersion).toBe(res2.trace?.engineReleaseVersion);
  });

  // ==========================================================================
  // VERSION-02: 동일 입력 → 동일 Rule Spec Version
  // ==========================================================================
  it('VERSION-02: 동일 입력을 실행했을 때 동일한 Rule Spec Version(1.0.0)이 기록되어야 한다', () => {
    const res1 = generator.generateProduct(standardInput, standardConfig);
    const res2 = generator.generateProduct(standardInput, standardConfig);

    expect(res1.trace?.ruleSpecVersion).toBe(FROZEN_RULE_SPEC_VERSION);
    expect(res2.trace?.ruleSpecVersion).toBe(FROZEN_RULE_SPEC_VERSION);
    expect(res1.trace?.ruleSpecVersion).toBe(res2.trace?.ruleSpecVersion);
  });

  // ==========================================================================
  // VERSION-03: 동일 입력 → 동일 Module Versions
  // ==========================================================================
  it('VERSION-03: 동일 입력을 실행했을 때 실행된 모듈들의 버전이 동일하게 기록되어야 한다', () => {
    const res1 = generator.generateProduct(standardInput, standardConfig);
    const res2 = generator.generateProduct(standardInput, standardConfig);

    expect(res1.trace?.moduleVersions).toBeDefined();
    expect(res2.trace?.moduleVersions).toBeDefined();
    expect(res1.trace?.moduleVersions).toEqual(res2.trace?.moduleVersions);
    expect(res1.trace?.moduleVersions['CORE_ORIGINAL']).toBe('1.0.0');
    expect(res1.trace?.moduleVersions['RELATION']).toBe('1.0.0');
  });

  // ==========================================================================
  // VERSION-04: 동일 ProductConfig → 동일 ProductConfig Version
  // ==========================================================================
  it('VERSION-04: 동일 ProductConfig를 실행했을 때 동일한 ProductConfig Version(2.0.0)이 기록되어야 한다', () => {
    const res1 = generator.generateProduct(standardInput, standardConfig);
    const res2 = generator.generateProduct(standardInput, standardConfig);

    expect(res1.trace?.productConfigVersion).toBe(FROZEN_PRODUCT_CONFIG_VERSION);
    expect(res2.trace?.productConfigVersion).toBe(FROZEN_PRODUCT_CONFIG_VERSION);
    expect(res1.trace?.productConfigVersion).toBe(res2.trace?.productConfigVersion);
  });

  // ==========================================================================
  // VERSION-05: 동일 입력 + 동일 모든 버전 → 동일 핵심 진단 결과
  // ==========================================================================
  it('VERSION-05: 동일 입력 및 동일 버전 환경에서 원국 일간, 격국, 관계 및 사건 진단 결과가 100% 동일해야 한다', () => {
    const res1 = generator.generateProduct(standardInput, standardConfig);
    const res2 = generator.generateProduct(standardInput, standardConfig);

    expect(res1.executedModules['CORE_ORIGINAL'].data.dayMaster).toEqual(
      res2.executedModules['CORE_ORIGINAL'].data.dayMaster
    );
    expect(res1.classification.primaryDomain).toBe(res2.classification.primaryDomain);
    expect(res1.magaDiagnosis?.punchline).toBe(res2.magaDiagnosis?.punchline);
  });

  // ==========================================================================
  // VERSION-06: 동일 입력 + 동일 모든 버전 → 동일 처방 결과
  // ==========================================================================
  it('VERSION-06: 동일 입력 및 동일 버전 환경에서 처방 보고서(Do/Dont/로드맵/환경)가 100% 동일해야 한다', () => {
    const res1 = generator.generateProduct(standardInput, standardConfig);
    const res2 = generator.generateProduct(standardInput, standardConfig);

    expect(res1.prescriptionReport?.mustDo).toEqual(res2.prescriptionReport?.mustDo);
    expect(res1.prescriptionReport?.mustAvoid).toEqual(res2.prescriptionReport?.mustAvoid);
    expect(res1.prescriptionReport?.timingRoadmap).toEqual(res2.prescriptionReport?.timingRoadmap);
    expect(res1.prescriptionReport?.environmentGuidance).toEqual(res2.prescriptionReport?.environmentGuidance);
  });

  // ==========================================================================
  // VERSION-07: 동일 입력 + 동일 모든 버전 → 동일 상품 출력
  // ==========================================================================
  it('VERSION-07: 동일 입력 및 동일 버전 환경에서 depthReport 전체 리포트 텍스트가 100% 동일해야 한다', () => {
    const res1 = generator.generateProduct(standardInput, standardConfig);
    const res2 = generator.generateProduct(standardInput, standardConfig);

    expect(res1.depthReport.fullDocument).toBe(res2.depthReport.fullDocument);
    expect(res1.depthReport.sections.length).toBe(res2.depthReport.sections.length);
  });

  // ==========================================================================
  // VERSION-08: 동일 입력 + 가격만 변경 → 명리 진단 불변
  // ==========================================================================
  it('VERSION-08: 동일 입력에서 가격만 변경(39000 vs 149000)되어도 명리 원천 계산 및 일간, 오행은 불변해야 한다', () => {
    const resCheap = generator.generateProduct(standardInput, { ...standardConfig, price: 39000 });
    const resExp = generator.generateProduct(standardInput, { ...standardConfig, price: 149000 });

    expect(resCheap.pricing.calculatedPrice).toBe(39000);
    expect(resExp.pricing.calculatedPrice).toBe(149000);

    expect(resCheap.executedModules['CORE_ORIGINAL'].data).toEqual(
      resExp.executedModules['CORE_ORIGINAL'].data
    );
    expect(resCheap.executedModules['RELATION'].judgment).toEqual(
      resExp.executedModules['RELATION'].judgment
    );
  });

  // ==========================================================================
  // VERSION-09: 동일 입력 + 가격만 변경 → 처방 불변
  // ==========================================================================
  it('VERSION-09: 동일 입력에서 가격만 변경되어도 처방 Do/Dont 및 환경 개선 지침은 불변해야 한다', () => {
    const resCheap = generator.generateProduct(standardInput, { ...standardConfig, price: 29000 });
    const resExp = generator.generateProduct(standardInput, { ...standardConfig, price: 99000 });

    expect(resCheap.prescriptionReport?.mustDo).toEqual(resExp.prescriptionReport?.mustDo);
    expect(resCheap.prescriptionReport?.mustAvoid).toEqual(resExp.prescriptionReport?.mustAvoid);
  });

  // ==========================================================================
  // VERSION-10: 동일 입력 + ProductConfig 변경 → ProductConfig Version 변경
  // ==========================================================================
  it('VERSION-10: 상품 구성 아키텍처 규칙이 변경되어 ProductConfig Version을 상향하면 Trace에 즉시 반영되어야 한다', () => {
    versionRegistry.setProductConfigVersion('2.1.0');

    const result = generator.generateProduct(standardInput, standardConfig);
    expect(result.trace?.productConfigVersion).toBe('2.1.0');
    expect(result.trace?.engineReleaseVersion).toBe('1.0.0'); // 다른 버전은 불변
    expect(result.trace?.ruleSpecVersion).toBe('1.0.0');
  });

  // ==========================================================================
  // VERSION-11: 명리 Rule 변경 → Rule Spec Version 변경
  // ==========================================================================
  it('VERSION-11: 명리 규칙 명세가 갱신되어 Rule Spec Version이 변경되면 독립적으로 Trace에 기록되어야 한다', () => {
    versionRegistry.setRuleSpecVersion('1.0.1');

    const result = generator.generateProduct(standardInput, standardConfig);
    expect(result.trace?.ruleSpecVersion).toBe('1.0.1');
    expect(result.trace?.engineReleaseVersion).toBe('1.0.0');
    expect(result.trace?.productConfigVersion).toBe('2.0.0');
  });

  // ==========================================================================
  // VERSION-12: 모듈 로직 변경 → 해당 Module Version 변경
  // ==========================================================================
  it('VERSION-12: 특정 모듈(예: RELATION) 로직이 변경되면 해당 모듈 버전만 갱신되고 다른 모듈은 1.0.0을 유지해야 한다', () => {
    versionRegistry.setModuleVersion('RELATION', '1.1.0', 'ACTIVE', '지지 관계 정밀 가중치 패치');

    const result = generator.generateProduct(standardInput, standardConfig);
    expect(result.trace?.moduleVersions['RELATION']).toBe('1.1.0');
    expect(result.trace?.moduleVersions['CORE_ORIGINAL']).toBe('1.0.0');
    expect(result.trace?.moduleVersions['BUSINESS']).toBe('1.0.0');
  });

  // ==========================================================================
  // VERSION-13: 구조적 엔진 변경 → Engine Release Version 변경
  // ==========================================================================
  it('VERSION-13: 시스템 전체의 메이저 릴리스가 발생하면 Engine Release Version이 독립 갱신되어야 한다', () => {
    versionRegistry.setEngineReleaseVersion('2.0.0');

    const result = generator.generateProduct(standardInput, standardConfig);
    expect(result.trace?.engineReleaseVersion).toBe('2.0.0');
    expect(result.trace?.ruleSpecVersion).toBe('1.0.0');
    expect(result.trace?.productConfigVersion).toBe('2.0.0');
  });

  // ==========================================================================
  // VERSION-14: 이전 ExecutionTrace 기록 기반 당시 실행 조건 및 호환성 식별
  // ==========================================================================
  it('VERSION-14: 과거 ExecutionTrace와 현재 엔진 간의 버전 차이를 정확히 식별(verifyTraceCompatibility)할 수 있어야 한다', () => {
    const historicalTrace = versionRegistry.createExecutionTrace({
      input: standardInput,
      config: standardConfig,
      domain: 'BUSINESS',
    });

    // 1) 변경 전: 완벽 호환
    const check1 = versionRegistry.verifyTraceCompatibility(historicalTrace);
    expect(check1.isCompatible).toBe(true);
    expect(check1.diffs.length).toBe(0);

    // 2) 엔진 및 룰 버전 변경 후: 불일치 원인 정확히 식별
    versionRegistry.setEngineReleaseVersion('1.1.0');
    versionRegistry.setModuleVersion('RELATION', '1.2.0');

    const check2 = versionRegistry.verifyTraceCompatibility(historicalTrace);
    expect(check2.isCompatible).toBe(false);
    expect(check2.diffs.some(d => d.includes('Engine Release Version'))).toBe(true);
    expect(check2.diffs.some(d => d.includes('RELATION'))).toBe(true);
  });

  // ==========================================================================
  // VERSION-15: 10회 반복 실행 → 100% 동일 핵심 결과 및 해시 일치
  // ==========================================================================
  it('VERSION-15: 동일한 입력으로 10회 반복 실행 시 입력 해시(inputHash) 및 최종 결과가 100% 동일해야 한다', () => {
    const baseline = generator.generateProduct(standardInput, standardConfig);

    for (let i = 0; i < 9; i++) {
      const iter = generator.generateProduct(standardInput, standardConfig);
      expect(iter.trace?.inputHash).toBe(baseline.trace?.inputHash);
      expect(iter.trace?.engineReleaseVersion).toBe(baseline.trace?.engineReleaseVersion);
      expect(iter.trace?.ruleSpecVersion).toBe(baseline.trace?.ruleSpecVersion);
      expect(iter.depthReport.fullDocument).toBe(baseline.depthReport.fullDocument);
      expect(iter.pricing.calculatedPrice).toBe(baseline.pricing.calculatedPrice);
    }
  });

  // ==========================================================================
  // VERSION-16: 19개 독립 모듈의 FROZEN 상태 및 버전 레지스트리 무손실 등록
  // ==========================================================================
  it('VERSION-16: 19개 독립 모듈이 모두 등록되어 있고 초기 상태가 FROZEN 및 1.0.0이어야 한다', () => {
    const allModules = versionRegistry.getAllModuleEntries();
    expect(Object.keys(allModules).length).toBe(19);

    for (const [id, entry] of Object.entries(allModules)) {
      expect(entry.version).toBe('1.0.0');
      expect(entry.status).toBe('FROZEN');
      expect(entry.moduleId).toBe(id);
    }
  });

  // ==========================================================================
  // VERSION-17: Input Hash 결정론 및 무결성 (SHA-256)
  // ==========================================================================
  it('VERSION-17: Input Hash는 객체 키 순서가 바뀌거나 여백이 있어도 동일한 해시를 생성해야 한다', () => {
    const hash1 = versionRegistry.computeInputHash(
      { birthDate: '1988-12-10', birthTime: '14:00', gender: 'female', currentEvent: '사업 위기' },
      { insightDepth: 5, selectedModules: ['CORE_ORIGINAL', 'BUSINESS'] }
    );

    // 순서 변경 및 여백 포함
    const hash2 = versionRegistry.computeInputHash(
      { currentEvent: '사업 위기 ', gender: 'female', birthTime: '14:00', birthDate: '1988-12-10' },
      { selectedModules: ['BUSINESS', 'CORE_ORIGINAL'], insightDepth: 5 }
    );

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 64자리 16진수 문자열
  });

  // ==========================================================================
  // VERSION-18: 4대 버전 변경의 상호 완전 독립성
  // ==========================================================================
  it('VERSION-18: Engine, Rule, Module, ProductConfig의 4대 버전은 한 버전을 변경해도 다른 버전에 영향을 주지 않아야 한다', () => {
    const initialInfo = versionRegistry.getEngineVersionInfo();

    // A. Rule Spec 변경
    versionRegistry.setRuleSpecVersion('1.0.5');
    expect(versionRegistry.getRuleSpecVersion()).toBe('1.0.5');
    expect(versionRegistry.getEngineReleaseVersion()).toBe(initialInfo.engineReleaseVersion);
    expect(versionRegistry.getProductConfigVersion()).toBe(initialInfo.productConfigVersion);

    // B. Module 변경
    versionRegistry.setModuleVersion('MAGA_DIAGNOSIS', '1.3.0');
    expect(versionRegistry.getModuleVersion('MAGA_DIAGNOSIS')).toBe('1.3.0');
    expect(versionRegistry.getModuleVersion('PRESCRIPTION')).toBe('1.0.0');
    expect(versionRegistry.getEngineReleaseVersion()).toBe(initialInfo.engineReleaseVersion);

    // C. ProductConfig 변경
    versionRegistry.setProductConfigVersion('2.2.0');
    expect(versionRegistry.getProductConfigVersion()).toBe('2.2.0');
    expect(versionRegistry.getEngineReleaseVersion()).toBe(initialInfo.engineReleaseVersion);

    // D. Engine Release 변경
    versionRegistry.setEngineReleaseVersion('3.0.0');
    expect(versionRegistry.getEngineReleaseVersion()).toBe('3.0.0');
    expect(versionRegistry.getRuleSpecVersion()).toBe('1.0.5'); // 이전에 변경된 Rule 유지
    expect(versionRegistry.getProductConfigVersion()).toBe('2.2.0');
  });
});
