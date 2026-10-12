/**
 * Phase 14: Validation Engine Types
 * 마보살 검증 체계 타입 정의
 * 
 * 명세서 요구사항 (Section 17):
 * 1. 기본 테스트 12종:
 *    T01 균형형, T02 일간 극강, T03 일간 극약, T04 재성 과다,
 *    T05 비겁 과다, T06 관성 과다, T07 식상 과다, T08 인성 과다,
 *    T09 합 강함, T10 충 강함, T11 형·파·해 복합, T12 출생시간 경계
 * 2. 운 테스트 8종 (L01 ~ L08)
 * 3. 경계 테스트 5종 (B01 ~ B05)
 * 4. 모듈 불변량 테스트 (0≤점수≤100, 가중치합 100%, 멱등성/결정론성)
 */

export interface BenchmarkCase {
  id: string; // T01 ~ T12, L01 ~ L08, B01 ~ B05
  name: string;
  description: string;
  category: 'core_12' | 'luck_8' | 'boundary_5';
  input: {
    birthDate: string;
    birthTime: string | null;
    gender?: 'male' | 'female';
    targetDate?: string;
  };
  expectedProperties: {
    dominantTenGod?: string;
    dominantElement?: string;
    strengthCategory?: 'strong' | 'weak' | 'balanced' | 'extreme_strong' | 'extreme_weak';
    requiresBoundaryAnalysis?: boolean;
    expectedTopMaPrefix?: string;
  };
}

export interface InvariantCheckResult {
  invariantName: string;
  passed: boolean;
  details: string;
}

export interface TestCaseResult {
  caseId: string;
  caseName: string;
  passed: boolean;
  scoreRangeValid: boolean; // 0 <= score <= 100
  executionTimeMs: number;
  message?: string;
  topMa?: string;
  topScore?: number;
}

export interface ValidationSuiteReport {
  timestamp: string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  allPassed: boolean;
  benchmarkResults: TestCaseResult[];
  invariantResults: InvariantCheckResult[];
}
