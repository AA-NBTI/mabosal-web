/**
 * RSI (Relationship Stability Index) Decision Matrix (Phase 6)
 * 
 * 원칙:
 * 1. 숫자 점수 및 가중평균 전면 배제: 순수 3대 정성 축(Cohesion × Tension × Resilience) 매트릭스 판정
 * 2. 명확한 판정 근거 및 예외 처리 조건 내장
 * 3. 확정도(certainty)는 초기 PROVISIONAL로 고정 (검증 전 승격 차단)
 */

import {
  CohesionLevel,
  ResilienceLevel,
  RSIMatrixResult,
  RSIBand,
  TensionLevel,
} from './phase6-types.js';

export interface EvaluateRSIParams {
  cohesion: CohesionLevel;
  tension: TensionLevel;
  resilience: ResilienceLevel;
  isDayMasterExtremeWeak?: boolean; // 예외 조건: 일간 극약 여부
}

export class RSIDecisionMatrix {
  /**
   * 3대 정성 축의 조합 논리에 따라 비선형 RSI Band를 평가합니다.
   */
  public static evaluate(params: EvaluateRSIParams): RSIMatrixResult {
    const { cohesion, tension, resilience, isDayMasterExtremeWeak } = params;

    let band: RSIBand = 'LATENT';
    let reasoning = '';
    let isExceptionApplied = false;

    // ---------------------------------------------------------
    // 1. TURBULENT 판정 우선 검토 (위험/과부하 경로)
    // ---------------------------------------------------------
    if (tension === 'CRITICAL' && (resilience === 'DEFICIENT' || resilience === 'PARTIAL')) {
      band = 'TURBULENT';
      reasoning = '정면 충돌/삼형의 강한 장력(CRITICAL)에 직면했으나 완충 탄력성(PARTIAL/DEFICIENT)이 부족하여 구조 균열 발생';
      return {
        cohesion,
        tension,
        resilience,
        band,
        reasoning,
        isExceptionApplied: false,
        certainty: 'PROVISIONAL',
      };
    }

    if (cohesion === 'FRAGILE' && tension === 'TENSE' && resilience === 'DEFICIENT') {
      band = 'TURBULENT';
      reasoning = '원국 구심점이 취약(FRAGILE)하고 완충이 전무한 상태에서 충형 마찰(TENSE) 발생으로 불안정 심화';
      return {
        cohesion,
        tension,
        resilience,
        band,
        reasoning,
        isExceptionApplied: false,
        certainty: 'PROVISIONAL',
      };
    }

    // ---------------------------------------------------------
    // 2. BALANCED_TENSION 판정 (건전한 긴장과 성취 동력)
    // ---------------------------------------------------------
    if ((tension === 'TENSE' || tension === 'CRITICAL') && resilience === 'HIGH' && cohesion !== 'FRAGILE') {
      band = 'BALANCED_TENSION';
      reasoning = '충돌/압박(Tension)이 강하나 일간의 근과 귀인/탐합망충(Resilience=HIGH)이 이를 완벽히 흡수하여 성취 동력으로 승화';
      return {
        cohesion,
        tension,
        resilience,
        band,
        reasoning,
        isExceptionApplied: false,
        certainty: 'PROVISIONAL',
      };
    }

    // ---------------------------------------------------------
    // 3. SERENE 판정 (평온·견고)
    // ---------------------------------------------------------
    if (cohesion === 'STABLE' && tension === 'LOW' && (resilience === 'HIGH' || resilience === 'PARTIAL')) {
      // 예외 조건 검사: 장력이 LOW라도 일간 극약 및 지지 고립 시 SERENE 진입 불가
      if (isDayMasterExtremeWeak) {
        band = 'LATENT';
        isExceptionApplied = true;
        reasoning = '원국 상생은 원활하나 일간 극약으로 인해 평온(SERENE)이 아닌 정체 대기(LATENT) 상태로 조정';
      } else {
        band = 'SERENE';
        reasoning = '원국의 상생 구심점이 견고(STABLE)하고 충형 장력이 전무(LOW)하여 구조적 평온과 안정이 유지됨';
      }

      return {
        cohesion,
        tension,
        resilience,
        band,
        reasoning,
        isExceptionApplied,
        certainty: 'PROVISIONAL',
      };
    }

    // ---------------------------------------------------------
    // 4. LATENT 판정 (기본 잠복/대기 상태)
    // ---------------------------------------------------------
    band = 'LATENT';
    reasoning = '뚜렷한 격발 인자나 강한 구심점이 미약하여 외부 운(대운/세운)의 시간축 자극을 기다리는 잠복 상태';

    return {
      cohesion,
      tension,
      resilience,
      band,
      reasoning,
      isExceptionApplied,
      certainty: 'PROVISIONAL',
    };
  }
}
