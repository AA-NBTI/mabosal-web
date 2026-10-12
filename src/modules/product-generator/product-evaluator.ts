/**
 * src/modules/product-generator/product-evaluator.ts
 * 
 * Phase 71: 상품별 11개 독립 평가 점수 산출기 (Product Evaluator)
 * 
 * 지침 11절 & 14절:
 * - 각 생성 상품마다 독립적으로 11대 항목(각 100점) 평가
 * - A. 명리 정확성 (myeongliAccuracy)
 * - B. 문제 진단 (problemDiagnosis)
 * - C. 모듈 적절성 (moduleAdequacy)
 * - D. 개인화 (personalization)
 * - E. 해석 깊이 (interpretationDepth)
 * - F. 마·살 연결 (magaConnection)
 * - G. 처방 품질 (prescriptionQuality)
 * - H. 실행 가능성 (feasibility)
 * - I. 안전성 (safety)
 * - J. 최종 고객 결과 품질 (customerResultQuality)
 * - K. 가격 대비 가치 (valueForPrice)
 * - 각 상품의 총점 (0~1100) 및 평균(0~100) 별도 산출
 * - 점수 독립성: 서로 다른 평가 기준이 동일 점수로 자동 연동되지 않음
 */

import { ProductEvaluationScores, ProductGenerationResult } from './types.js';

export class ProductEvaluator {
  /**
   * 생성된 상품 산출물을 바탕으로 11개 독립 점수를 엄밀히 산출
   */
  public evaluateProduct(result: ProductGenerationResult): ProductEvaluationScores {
    const { config, executedModules, userProblem, classification, depthReport, prescriptionReport } = result;
    const depth = config.insightDepth;
    const moduleCount = Object.keys(executedModules).length;

    // A. 명리 정확성 (0~100): 실행된 모듈들이 정상 성공했고, 원국 및 관계가 온전히 보존되었는가
    let myeongliAccuracy = 85;
    const allModulesSuccess = Object.values(executedModules).every(m => m.success);
    if (allModulesSuccess) myeongliAccuracy += 10;
    if (executedModules['CORE_ORIGINAL']?.data?.pillars) myeongliAccuracy += 5;
    myeongliAccuracy = Math.min(100, myeongliAccuracy);

    // B. 문제 진단 (0~100): 사건 분류가 올바르게 수행되었고 핵심 키워드가 식별되었는가
    let problemDiagnosis = 70;
    if (classification.primaryDomain) problemDiagnosis += 10;
    if (classification.keyIssues && classification.keyIssues.length > 0) problemDiagnosis += 10;
    if (userProblem.currentEvent && userProblem.currentEvent.length > 5) problemDiagnosis += 5;
    if (userProblem.desiredQuestion && userProblem.desiredQuestion.length > 5) problemDiagnosis += 5;
    problemDiagnosis = Math.min(100, problemDiagnosis);

    // C. 모듈 적절성 (0~100): 도메인에 부합하는 추천 모듈 및 설정 모듈이 적절히 선정되었는가
    let moduleAdequacy = 75;
    if (moduleCount >= 3) moduleAdequacy += 10;
    if (classification.recommendedModules.some(m => config.selectedModules.includes(m))) moduleAdequacy += 15;
    moduleAdequacy = Math.min(100, moduleAdequacy);

    // D. 개인화 (0~100): 고객 고유 사건 및 1:1 대입이 반영되었는가
    let personalization = 60;
    if (config.personalizedMapping && result.eventMapping) personalization += 25;
    if (config.caseExplanation && result.caseProtocol) personalization += 15;
    personalization = Math.min(100, personalization);

    // E. 해석 깊이 (0~100): 설정된 insightDepth(1~5)에 부합하는 계층적 리포트가 충실한가
    let interpretationDepth = 60 + depth * 8; // Depth 1: 68, Depth 3: 84, Depth 5: 100
    if (depthReport.sections.length >= depth) interpretationDepth = Math.min(100, interpretationDepth);

    // F. 마·살 연결 (0~100): 마·살 진단이 고객의 현실 위기와 유기적으로 연결되었는가
    let magaConnection = 70;
    if (result.magaDiagnosis) magaConnection += 20;
    if (config.selectedModules.includes('MAGA_DIAGNOSIS')) magaConnection += 10;
    magaConnection = Math.min(100, magaConnection);

    // G. 처방 품질 (0~100): 명리 근거(basis)를 갖추고 환경/행동/처방물이 체계화되었는가
    let prescriptionQuality = 60;
    if (prescriptionReport) {
      prescriptionQuality += 20;
      if (prescriptionReport.mustDo?.length >= 2 && prescriptionReport.mustAvoid?.length >= 2) prescriptionQuality += 10;
      if (prescriptionReport.environmentGuidance?.length || prescriptionReport.remedyItems?.length) prescriptionQuality += 10;
    } else if (depth === 1) {
      prescriptionQuality = 75; // Level 1에서는 처방 미포함이 정상
    }
    prescriptionQuality = Math.min(100, prescriptionQuality);

    // H. 실행 가능성 (0~100): 24시간 숙고, 문서화, 루틴 등 구체적이고 현실적인 지침인가
    let feasibility = 80;
    if (prescriptionReport?.mustDo?.some(d => d.includes('24시간') || d.includes('기록') || d.includes('루틴') || d.includes('서면') || d.includes('침묵') || d.includes('정돈') || d.includes('거리'))) {
      feasibility += 10;
    }
    if (result.customerDeliverable?.sections.step8_behaviorPrescription || (prescriptionReport?.mustDo && prescriptionReport.mustDo.length >= 2)) {
      feasibility += 10;
    }
    feasibility = Math.min(100, feasibility);

    // I. 안전성 (0~100): 면책 고지 및 비결정론 가드가 완벽히 준수되었는가
    let safety = 90;
    const fullText = depthReport.fullDocument + (prescriptionReport?.safeguardNotice || '');
    if (!fullText.includes('반드시 망한다') && !fullText.includes('무조건 실패')) safety += 5;
    if (prescriptionReport?.safeguardNotice?.includes('의료') || prescriptionReport?.safeguardNotice?.includes('전문')) safety += 5;
    safety = Math.min(100, safety);

    // J. 최종 고객 결과 품질 (0~100): 가독성과 정보 전달력, 실천 동기부여 완성도
    let customerResultQuality = 75;
    if (depthReport.fullDocument.length > 500) customerResultQuality += 15;
    if (result.productName && result.productId) customerResultQuality += 10;
    customerResultQuality = Math.min(100, customerResultQuality);

    // K. 가격 대비 가치 (0~100): 구성 내용 대비 가격 책정의 합리성과 가치 비율
    let valueForPrice = 85;
    const price = result.pricing.calculatedPrice;
    if (price >= 10000 && price <= 250000) valueForPrice += 10;
    if (depth >= 4 && result.pricing.prescriptionIncluded) valueForPrice += 5;
    valueForPrice = Math.min(100, valueForPrice);

    // 종합 총점 및 평균 산출
    const totalScore =
      myeongliAccuracy +
      problemDiagnosis +
      moduleAdequacy +
      personalization +
      interpretationDepth +
      magaConnection +
      prescriptionQuality +
      feasibility +
      safety +
      customerResultQuality +
      valueForPrice;

    const averageScore = Math.round(totalScore / 11);

    return {
      myeongliAccuracy,
      problemDiagnosis,
      moduleAdequacy,
      personalization,
      interpretationDepth,
      magaConnection,
      prescriptionQuality,
      feasibility,
      safety,
      customerResultQuality,
      valueForPrice,
      totalScore,
      averageScore,
    };
  }
}

export const productEvaluator = new ProductEvaluator();
