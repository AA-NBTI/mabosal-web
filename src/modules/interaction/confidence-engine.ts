/**
 * ConfidenceEngine: 마보살 전체 파이프라인 종합 신뢰도 산출 엔진
 * 
 * 원칙:
 * 데이터 누락, 시간 경계 오차, 모듈 가용성을 종합하여
 * 0~100 연속 신뢰도 점수 및 감점 요인을 투명하게 산출합니다.
 */

import { BoundaryOutput } from '../boundary/boundary-engine.js';
import { MaModuleEngineOutput } from '../ma/ma-module-engine.js';

export interface ConfidenceDeduction {
  factor: string;
  penalty: number;
  note: string;
}

export interface ConfidenceAssessment {
  overallScore: number;     // 0 ~ 100 연속값
  confidenceGrade: '매우 높음 (90점대)' | '양호 (80점대)' | '시간의존적 (70점대)' | '주의 (60점대 이하)';
  deductions: ConfidenceDeduction[];
  isTimeMissing: boolean;
  isBoundaryIssue: boolean;
  summaryMessage: string;
}

export class ConfidenceEngine {
  public evaluate(
    boundary: BoundaryOutput,
    maOutput: MaModuleEngineOutput
  ): ConfidenceAssessment {
    let score = 100.0;
    const deductions: ConfidenceDeduction[] = [];

    // 1. 출생시간 누락 감점
    if (boundary.missing_hour.isMissingHour) {
      const penalty = 20.0;
      score -= penalty;
      deductions.push({
        factor: '출생시간 미상',
        penalty,
        note: '시주(時柱)가 결손되어 연·월·일 3기둥 기준 분석이 적용되었습니다.',
      });
    }

    // 2. 경계시간 민감도 감점
    if (boundary.boundary_simulation.hasBoundaryIssue) {
      const penalty = Math.round((boundary.boundary_simulation.boundarySensitivity * 0.15) * 100) / 100;
      score -= penalty;
      deductions.push({
        factor: '시주 경계시간 인접',
        penalty,
        note: `시진 경계에 근접하여 경계 민감도(${boundary.boundary_simulation.boundarySensitivity}점)에 따른 감점이 적용되었습니다.`,
      });
    }

    // 3. 마 모듈 가용성 감점 (오류로 격리된 마가 있는 경우)
    let degradedCount = 0;
    for (const [_, ma] of Object.entries(maOutput.ma_results)) {
      if (ma.presentation_band.includes('격리됨')) {
        degradedCount += 1;
      }
    }
    if (degradedCount > 0) {
      const penalty = degradedCount * 5.0;
      score -= penalty;
      deductions.push({
        factor: '일부 마 모듈 오류 격리',
        penalty,
        note: `${degradedCount}개 마 모듈이 결함 격리 처리되었습니다.`,
      });
    }

    const overallScore = Math.max(30.0, Math.min(100.0, Math.round(score * 100) / 100));

    let confidenceGrade: ConfidenceAssessment['confidenceGrade'] = '매우 높음 (90점대)';
    if (overallScore >= 90.0) confidenceGrade = '매우 높음 (90점대)';
    else if (overallScore >= 80.0) confidenceGrade = '양호 (80점대)';
    else if (overallScore >= 70.0) confidenceGrade = '시간의존적 (70점대)';
    else confidenceGrade = '주의 (60점대 이하)';

    const summaryMessage = deductions.length === 0
      ? '모든 데이터가 온전하고 경계 오차가 없어 분석 신뢰도가 매우 높습니다.'
      : `${deductions.map(d => d.factor).join(', ')} 요인으로 신뢰도가 ${overallScore}점(${confidenceGrade})으로 산출되었습니다.`;

    return {
      overallScore,
      confidenceGrade,
      deductions,
      isTimeMissing: boundary.missing_hour.isMissingHour,
      isBoundaryIssue: boundary.boundary_simulation.hasBoundaryIssue,
      summaryMessage,
    };
  }
}
