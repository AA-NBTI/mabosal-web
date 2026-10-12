/**
 * Phase 14: Validation Engine Tests
 * 검증 체계 및 불변량 종합 테스트
 */

import { describe, it, expect } from 'vitest';
import { ValidationEngine } from '../src/modules/validation/validation-engine.js';
import {
  CORE_12_BENCHMARKS,
  LUCK_8_BENCHMARKS,
  BOUNDARY_5_BENCHMARKS,
} from '../src/modules/validation/benchmark-cases.js';

describe('Phase 14: Validation Engine Tests', () => {
  const valEngine = new ValidationEngine();

  it('명세서 Section 17 기본 12종 명식 (T01~T12) 전수 검증이 100% 성공해야 한다', () => {
    const report = valEngine.execute({
      targetCases: CORE_12_BENCHMARKS,
      runInvariantChecks: true,
    }).data;

    expect(report.totalCases).toBe(12);
    expect(report.passedCases).toBe(12);
    expect(report.failedCases).toBe(0);
    expect(report.allPassed).toBe(true);

    // 개별 케이스 점수 범위 검증
    for (const r of report.benchmarkResults) {
      expect(r.passed).toBe(true);
      expect(r.scoreRangeValid).toBe(true);
      expect(r.topScore).toBeGreaterThanOrEqual(0.0);
      expect(r.topScore).toBeLessThanOrEqual(100.0);
    }
  });

  it('시스템 핵심 불변량(결정론성, 맛/캐릭터 불변성, 점수한계값)이 전수 통과해야 한다', () => {
    const invariants = valEngine.checkSystemInvariants();
    expect(invariants.length).toBeGreaterThanOrEqual(3);

    for (const inv of invariants) {
      expect(inv.passed).toBe(true);
    }
  });

  it('운 테스트 8종 (L01~L08) 및 경계 테스트 5종 (B01~B05)이 정상 실행되어야 한다', () => {
    const luckReport = valEngine.execute({
      targetCases: LUCK_8_BENCHMARKS,
      runInvariantChecks: false,
    }).data;

    expect(luckReport.totalCases).toBe(8);
    expect(luckReport.passedCases).toBe(8);

    const boundReport = valEngine.execute({
      targetCases: BOUNDARY_5_BENCHMARKS,
      runInvariantChecks: false,
    }).data;

    expect(boundReport.totalCases).toBe(5);
    expect(boundReport.passedCases).toBe(5);
  });
});
