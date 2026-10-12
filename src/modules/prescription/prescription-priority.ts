/**
 * src/modules/prescription/prescription-priority.ts
 * 
 * Phase 70: 처방 점수 산정 및 우선순위 엔진 (Prescription Priority & Scoring Engine)
 * 
 * 지침 7절, 12절, 13절, 14절:
 * - 처방마다 100점 기준으로 5대 독립 점수 평가:
 *   1. evidenceScore (명리 근거 충실도)
 *   2. relevanceScore (현재 사건 관련성)
 *   3. feasibilityScore (현실 실행 가능성)
 *   4. priorityScore (종합 가중 우선순위 점수)
 *   5. confidenceScore (판정 신뢰도 점수)
 * - 원칙: 명리적 근거가 강하다 ≠ 실행 효과가 보장된다
 * - 실행 가능성이 낮은 처방은 우선순위를 하향 조정
 * - 4단계 강도 산정 (RECOMMENDED, STRONGLY_RECOMMENDED, PRIORITY_RESPONSE, INTENSIVE_CARE)
 */

import { Prescription, PrescriptionIntensity, PrescriptionPriority } from './types.js';

export interface ScoreCalculationInput {
  basisCount: number;
  hasRootClashOrHarm: boolean;
  hasYongsinOrHeesin: boolean;
  hasMaga: boolean;
  isCurrentDomainDirectMatch: boolean;
  isSubEventDirectMatch: boolean;
  environmentCount: number;
  behaviorCount: number;
  timeAxisOverlapped: boolean; // 원국 + 대운 + 세운 중첩 여부
}

export class PrescriptionPriorityEngine {
  /**
   * 5대 독립 점수 및 종합 우선순위 계산
   */
  public calculateScores(input: ScoreCalculationInput): {
    evidenceScore: number;
    relevanceScore: number;
    feasibilityScore: number;
    priorityScore: number;
    confidenceScore: number;
    intensity: PrescriptionIntensity;
    priority: PrescriptionPriority;
  } {
    // 1. evidenceScore (0~100): 명리 근거 충실도 (억부, 조후, 오행, 충형, 대세운)
    let evidenceScore = Math.min(100, 30 + input.basisCount * 15);
    if (input.hasYongsinOrHeesin) evidenceScore = Math.min(100, evidenceScore + 15);
    if (input.hasRootClashOrHarm) evidenceScore = Math.min(100, evidenceScore + 10);
    if (input.timeAxisOverlapped) evidenceScore = Math.min(100, evidenceScore + 10);

    // 2. relevanceScore (0~100): 현재 사건/고민과의 직접 관련성
    let relevanceScore = 40;
    if (input.isCurrentDomainDirectMatch) relevanceScore += 35;
    if (input.isSubEventDirectMatch) relevanceScore += 15;
    if (input.hasMaga) relevanceScore += 10;
    relevanceScore = Math.min(100, Math.max(0, relevanceScore));

    // 3. feasibilityScore (0~100): 현실에서의 구체적 실행 용이성
    // 환경 조치와 행동 조치가 구체적이고 과도하지 않을 때 높은 점수
    let feasibilityScore = 70;
    if (input.environmentCount >= 2 && input.environmentCount <= 4) feasibilityScore += 15;
    if (input.behaviorCount >= 2 && input.behaviorCount <= 4) feasibilityScore += 15;
    feasibilityScore = Math.min(100, Math.max(0, feasibilityScore));

    // 4. confidenceScore (0~100): 신뢰도
    const confidenceScore = Math.round(
      Math.min(100, evidenceScore * 0.5 + relevanceScore * 0.3 + (input.basisCount >= 2 ? 20 : 10))
    );

    // 5. priorityScore (0~100): 종합 가중 우선순위
    // 실행 불가능한 처방을 거르고, 현실 문제 해결 기여도를 최우선 반영
    const priorityScore = Math.round(
      evidenceScore * 0.25 +
      relevanceScore * 0.35 +
      feasibilityScore * 0.25 +
      confidenceScore * 0.15
    );

    // 6. 처방의 강도 (intensity) 산출 (14절)
    let intensity: PrescriptionIntensity = 'RECOMMENDED';
    if (input.timeAxisOverlapped && relevanceScore >= 80 && evidenceScore >= 75) {
      intensity = 'INTENSIVE_CARE'; // 4단계: 복수 근거와 사건 중첩
    } else if (relevanceScore >= 75 && priorityScore >= 75) {
      intensity = 'PRIORITY_RESPONSE'; // 3단계: 현재 문제 직접 연결 우선 대응
    } else if (relevanceScore >= 60 || priorityScore >= 65) {
      intensity = 'STRONGLY_RECOMMENDED'; // 2단계: 의도적 변경 필요 적극 권장
    } else {
      intensity = 'RECOMMENDED'; // 1단계: 가벼운 일상 권장
    }

    // 7. 우선순위 레벨 (HIGH, MEDIUM, LOW)
    let priority: PrescriptionPriority = 'MEDIUM';
    if (priorityScore >= 75) priority = 'HIGH';
    else if (priorityScore < 55) priority = 'LOW';

    return {
      evidenceScore,
      relevanceScore,
      feasibilityScore,
      priorityScore,
      confidenceScore,
      intensity,
      priority,
    };
  }

  /**
   * 처방 리스트 정렬 및 중복 제거
   */
  public sortAndDeduplicate(prescriptions: Prescription[]): Prescription[] {
    // 1. 중복 제거 (title 또는 targetProblem 기준 고득점 우선 유지)
    const seen = new Set<string>();
    const deduplicated: Prescription[] = [];

    // 1차: priorityScore 기준 내림차순 정렬
    const sorted = [...prescriptions].sort((a, b) => b.priorityScore - a.priorityScore);

    for (const p of sorted) {
      const key = `${p.category}-${p.title.trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(p);
      }
    }

    return deduplicated;
  }
}

export const prescriptionPriorityEngine = new PrescriptionPriorityEngine();
