/**
 * src/modules/product-generator/pricing-engine.ts
 * 
 * Phase 61: 동적 가격 산정 엔진 (Pricing Engine)
 * 
 * "가격은 고정된 단계가 아니다."
 * 
 * 평가 요소 9가지:
 * 1. 분석 범위 (scopeScore)
 * 2. 모듈 수 (moduleCount)
 * 3. 개인화 정도 (personalizationLevel)
 * 4. 사건 연결 수준 (mappingDepth)
 * 5. 해석 깊이 (depthLevel: LEVEL 1 ~ 5)
 * 6. 시기 분석 (timingIncluded)
 * 7. 사례 설명 여부 (caseIncluded)
 * 8. 대응책 (responseGuidanceIncluded)
 * 9. 처방 제공 여부 (prescriptionIncluded)
 * 
 * ProductConfig의 설정을 기반으로 투명하고 유연하게 가격을 산정 및 검증한다.
 */

import { PricingFactors, ProductConfig } from './types.js';

export class PricingEngine {
  /**
   * ProductConfig를 기반으로 9대 요소를 정밀 평가하여 PricingFactors 및 최종 가격 산출
   */
  public evaluatePricing(config: ProductConfig): PricingFactors {
    const moduleCount = config.selectedModules.length;
    const depthLevel = config.insightDepth;

    // 1. 분석 범위 점수 (모듈 성격에 따른 가중치)
    let scopeScore = 0;
    for (const modId of config.selectedModules) {
      if (['MAGA_DIAGNOSIS', 'PRESCRIPTION'].includes(modId)) scopeScore += 25;
      else if (['RELATION', 'SINSAL', 'DAEWUN', 'SEUN'].includes(modId)) scopeScore += 15;
      else if (['MONEY', 'BUSINESS', 'JOB', 'LOVE', 'MARRIAGE', 'RELATIONSHIP', 'HEALTH'].includes(modId)) scopeScore += 20;
      else scopeScore += 10;
    }

    // 2. 개인화 수준 평가 (1~5)
    const personalizationLevel = config.personalizedMapping ? (depthLevel >= 4 ? 5 : 4) : Math.min(3, depthLevel);

    // 3. 사건 연결 수준 (1~5)
    const mappingDepth = config.personalizedMapping ? (depthLevel >= 3 ? depthLevel : 3) : 1;

    // 4. 기능 플래그
    const timingIncluded = config.timingAnalysis || config.selectedModules.includes('DAEWUN') || config.selectedModules.includes('SEUN');
    const caseIncluded = config.caseExplanation;
    const responseGuidanceIncluded = config.responseGuidance || depthLevel >= 4;
    const prescriptionIncluded = config.prescription || depthLevel >= 5 || config.selectedModules.includes('PRESCRIPTION');

    // 5. 기본 베이스 가격 계산 (비하드코딩 동적 산정)
    // - 모듈당 기본 비용
    const moduleCost = moduleCount * 3000;
    // - 해석 깊이별 가중 비용 (Level 1: 5,000 ~ Level 5: 35,000)
    const depthCost = [0, 5000, 12000, 22000, 35000, 55000][depthLevel] || 10000;
    // - 사건 연결 및 개인화 가중치
    const mappingCost = mappingDepth * 3500;
    // - 시기 분석 가산
    const timingCost = timingIncluded ? 8000 : 0;
    // - 현실 유사 사례 설명 프로토콜 가산
    const caseCost = caseIncluded ? 12000 : 0;
    // - 대응책 및 처방 가산
    const responseCost = responseGuidanceIncluded ? 7000 : 0;
    const prescriptionCost = prescriptionIncluded ? 15000 : 0;

    let rawCalculated = moduleCost + depthCost + mappingCost + timingCost + caseCost + responseCost + prescriptionCost;

    // 100원 단위 정밀 절사/조정 (상용 제품 가격 표준)
    let finalCalculatedPrice = Math.round(rawCalculated / 100) * 100;

    // ProductConfig에 명시적 price가 지정되어 있다면 이를 우선 존중하되, 계산 지표는 완벽히 보존
    const finalPrice = config.price !== undefined ? config.price : finalCalculatedPrice;

    return {
      scopeScore,
      moduleCount,
      personalizationLevel,
      mappingDepth,
      depthLevel,
      timingIncluded,
      caseIncluded,
      responseGuidanceIncluded,
      prescriptionIncluded,
      calculatedPrice: finalPrice,
    };
  }
}
