/**
 * 마보살 엔진 코어 타입 정의 (v1.0)
 * 점수 표준: 0~100 연속값 (반올림 금지, 조기 압축 금지)
 */

export type HeavenlyStem = '갑' | '을' | '병' | '정' | '무' | '기' | '경' | '신' | '임' | '계';
export type EarthlyBranch = '자' | '축' | '인' | '묘' | '진' | '사' | '오' | '미' | '신' | '유' | '술' | '해';

export type FiveElement = '목' | '화' | '토' | '금' | '수';
export type YinYang = '양' | '음';

export type TenGod =
  | '비견' | '겁재'
  | '식신' | '상관'
  | '편재' | '정재'
  | '편관' | '정관'
  | '편인' | '정인';

export interface Pillar {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  name?: string; // e.g. "갑자"
}

export interface FourPillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null; // 출생시간 미상인 경우 반드시 null 유지
}

/**
 * 5대 내부 점수 축 (모두 0~100 연속 부동소수점 유지)
 */
export interface Score5Axis {
  intensity: number;   // 작용 강도
  pressure: number;    // 압박
  opportunity: number; // 기회
  volatility: number;  // 변동
  mitigation: number;  // 완화
}

/**
 * 모듈 상태
 */
export type ModuleStatus = 'active' | 'unavailable' | 'degraded';

/**
 * 모듈 공통 메타데이터
 */
export interface ModuleMetadata {
  module_id: string;
  module_version: string;
  rule_version: string;
  input_schema?: string;
  output_schema?: string;
  status: ModuleStatus;
  confidence: number; // 0.00 ~ 100.00
}

/**
 * 모듈 공통 실행 결과 래퍼
 */
export interface EngineResult<T> {
  metadata: ModuleMetadata;
  data: T;
  spec_gaps?: string[];
  notes?: string[];
}

/**
 * 시간/경계 관련 신뢰도 및 시간의존도 정보
 */
export interface TimeDependencyInfo {
  requires_hour: boolean;
  time_dependency: number; // 0~100 (시간에 따라 결과가 얼마나 크게 변하는지)
  is_missing_hour: boolean;
  notes?: string;
}

/**
 * 경계시간 후보
 */
export interface PillarCandidate {
  candidate_id: 'A' | 'B' | 'C' | 'A1' | 'A2' | 'B1' | 'B2' | string;
  label: string;
  pillars: FourPillars;
  probability?: number; // 0~100
  time_boundary_offset_minutes?: number; // 경계와의 거리(분)
}

export interface BoundaryAnalysisResult {
  has_boundary_issue: boolean;
  candidates: PillarCandidate[];
  selected_candidate: 'A' | 'B' | 'C' | 'A1' | 'A2' | 'B1' | 'B2' | string | null;
  selection_reason?: string;
  consensus_summary?: string;
  difference_summary?: string;
  boundary_sensitivity: number; // 0~100
  confidence: number;           // 0~100
}
