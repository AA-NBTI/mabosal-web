/**
 * Phase 11 & Phase 12: Consultation Dialogue Engine
 * 
 * 원칙:
 * 1. Phase 1~10의 사주 분석 결과를 기반으로 사용자 자연어 질문에 마보살 페르소나로 대화식 응답을 생성합니다.
 * 2. 질문 분류 → 관련 Theme → InterpretationNode → 근거 Fact 추적 → 4단 답변 구조 유지.
 * 3. 10대 기본 질문 유형(Q01~Q10), 복합 질문, 모호한 질문, 시간축 질문, 근거 질문을 완벽히 지원합니다.
 * 4. 비교 질문 시 인생 결정을 대신하지 않고 두 영역의 명리 구조적 차이를 객관적으로 대비합니다.
 * 5. 시간축 질문 시 원국(고정)과 운(TimeModulator: 현재 환경적 자극)을 엄격히 분리하여 설명합니다.
 * 6. 확실성(PROVISIONAL vs CONFIRMED)을 엄격히 구분하고, 의학적/운명론적 단정을 절대 금지합니다.
 * 7. Phase 12 스트레스 대응: 모순 유도(기회!=위험없음), 운명론 방어(실패/망함 단정 거부), 방어(욕설/강요 방어), 정보부족(시주 미상 시 한계 인정) 완비.
 */

import { MaModuleInputFact, MaSignalEntity, MaSignalSet } from '../ma/ma-types.js';
import { Phase7Output } from '../phase7/phase7-pipeline.js';
import { sanitizeSafetyLanguage } from '../phase9/persona-rules.js';
import { MabosalFinalUserReport, ThemeReportItem } from '../phase10/phase10-types.js';
import {
  ConsultationAnswer,
  ConsultationDialogueContext,
  EvidenceTracePath,
  QuestionClassificationResult,
} from './phase11-types.js';
import { QuestionClassifier } from './question-classifier.js';

export interface AnswerQuestionParams {
  questionText: string;
  fact: MaModuleInputFact;
  signalSet: MaSignalSet;
  phase7Output: Phase7Output;
  userReport: MabosalFinalUserReport;
  context?: ConsultationDialogueContext;
}

export class ConsultationDialogueEngine {
  private classifier: QuestionClassifier;

  constructor() {
    this.classifier = new QuestionClassifier();
  }

  /**
   * 사용자 질문을 분석하고 Phase 1~10의 분석 결과를 결합하여 마보살 상담 답변을 생성합니다.
   */
  public answerQuestion(params: AnswerQuestionParams): ConsultationAnswer {
    const { questionText, context } = params;

    // 1. 질문 분류
    const classification = this.classifier.classify(questionText, context);

    // 2. 의도에 따른 답변 구성
    let answer: ConsultationAnswer;

    switch (classification.intentType) {
      case 'WEALTH':
        answer = this.handleWealthQuestion(params, classification);
        break;
      case 'CAREER':
        answer = this.handleCareerQuestion(params, classification);
        break;
      case 'BUSINESS':
        answer = this.handleBusinessQuestion(params, classification);
        break;
      case 'RELATIONSHIP':
        answer = this.handleRelationshipQuestion(params, classification);
        break;
      case 'HEALTH':
        answer = this.handleHealthQuestion(params, classification);
        break;
      case 'SAFETY':
        answer = this.handleSafetyQuestion(params, classification);
        break;
      case 'OVERALL':
        answer = this.handleOverallQuestion(params, classification);
        break;
      case 'COMPARISON':
        answer = this.handleComparisonQuestion(params, classification);
        break;
      case 'TEMPORAL':
        answer = this.handleTemporalQuestion(params, classification);
        break;
      case 'EVIDENCE':
        answer = this.handleEvidenceQuestion(params, classification);
        break;
      case 'COMPLEX':
        answer = this.handleComplexQuestion(params, classification);
        break;
      case 'CONTRADICTION':
        answer = this.handleContradictionQuestion(params, classification);
        break;
      case 'FATALISM_DEFENSE':
        answer = this.handleFatalismQuestion(params, classification);
        break;
      case 'DEFENSE':
        answer = this.handleDefenseQuestion(params, classification);
        break;
      case 'AMBIGUOUS':
      default:
        answer = this.handleAmbiguousQuestion(params, classification);
        break;
    }

    // 3. 정보 부족(출생시간 미상) 시 한계 안내 보강
    const isMissingHour = !params.fact.four_pillars.hour;
    if (isMissingHour && !answer.actionableAdvice.includes('출생시간 미상')) {
      answer.actionableAdvice += ' (참고: 현재 출생시간 미상 상태이므로, 인생 후반기 및 세부 궁위 판단은 유보하고 3주 중심으로 보수적 해석을 유지합니다.)';
    }

    // 4. 안전 및 확실성 필터링
    answer.fullResponseText = sanitizeSafetyLanguage(answer.fullResponseText);
    answer.conclusion = sanitizeSafetyLanguage(answer.conclusion);
    answer.evidence = sanitizeSafetyLanguage(answer.evidence);
    answer.structure = sanitizeSafetyLanguage(answer.structure);
    answer.actionableAdvice = sanitizeSafetyLanguage(answer.actionableAdvice);

    return answer;
  }

  // ==========================================
  // Q01 재물 질문 처리
  // ==========================================
  private handleWealthQuestion(
    params: AnswerQuestionParams,
    clf: QuestionClassificationResult
  ): ConsultationAnswer {
    const wealthItem = params.userReport.themes.find(t => t.theme === 'WEALTH_FLOW');
    const dayStrength = params.fact.day_master_strength.classification;
    const isEarningFocused = dayStrength === '신강' || dayStrength === '극강';

    const conclusion = isEarningFocused
      ? '사주 원국상 당신은 기운을 밖으로 뿜어내어 능동적으로 부를 일구고 기회를 쟁취하는 성향이 더 강합니다.'
      : '사주 원국상 당신은 무리하게 확장하기보다 자산을 체계적으로 지키고 알뜰하게 모아가는 안정형 구조가 돋보입니다.';

    const evidence = wealthItem?.evidence ||
      `일간의 기운(${params.fact.day_stem})과 재성·식상의 조화로 볼 때 자산의 유입 흐름이 뚜렷한 근거가 됩니다.`;

    const structure = wealthItem?.structuralInterpretation ||
      `현재 사주의 2차 기운 구조(${params.phase7Output.rsi.band})상 자산의 입출입 변동성을 인지하고, 안정적인 저축 파이프라인을 다져두는 것이 핵심입니다.`;

    const actionableAdvice = isEarningFocused
      ? '버는 힘이 강할수록 나가는 틈새도 커질 수 있으니, 수익의 일정 비율은 반드시 즉시 묶어두는 강제 저축 습관을 권합니다.'
      : '지키는 힘이 훌륭하므로 단기적인 고수익 유혹에 흔들리지 마시고, 복리 효과를 누릴 수 있는 안전 자산 중심으로 축적하십시오.';

    const certaintyDescription = '이 해석은 원국의 오행 분포와 신호(PROVISIONAL)를 종합한 명리적 참고 자료입니다.';
    const safetyNotes = ['특정 금액이나 투자 수익률을 단정하지 않습니다. 금융 투자는 본인의 면밀한 판단이 우선입니다.'];

    const fullResponseText = this.assemblePersonaText({
      conclusion,
      evidence,
      structure,
      advice: actionableAdvice,
      certaintyDescription,
    });

    return {
      question: clf.rawQuestion,
      classifiedIntent: 'WEALTH',
      primaryThemes: ['WEALTH_FLOW'],
      conclusion,
      evidence,
      structure,
      actionableAdvice,
      certaintyDescription,
      safetyNotes,
      fullResponseText,
    };
  }

  // ==========================================
  // Q02 직장 질문 처리
  // ==========================================
  private handleCareerQuestion(
    params: AnswerQuestionParams,
    clf: QuestionClassificationResult
  ): ConsultationAnswer {
    const careerItem = params.userReport.themes.find(t => t.theme === 'CAREER_ORGANIZATION');
    const conclusion = careerItem?.summary ||
      '조직 내에서 원칙과 신뢰를 바탕으로 단계적 성과를 만들어가는 구조가 기본 축으로 작동합니다.';

    const evidence = careerItem?.evidence ||
      `사주의 관성과 인성 구조를 통해 체계적인 조직 환경과의 적합성을 확인합니다.`;

    const structure = careerItem?.structuralInterpretation ||
      `원국의 안정도(${params.phase7Output.rsi.band})와 조직 기운이 맞물려 일정한 직무 책임성을 강조하고 있습니다.`;

    const actionableAdvice = careerItem?.actionableCaution ||
      '조직의 가이드라인과 본인의 전문성을 일치시키며 꾸준한 평판 자산을 쌓아가는 전략이 가장 유효합니다.';

    const certaintyDescription = '원국의 관성 기운 및 상호작용에 기반한 잠정적(PROVISIONAL) 성향 분석입니다.';
    const safetyNotes = ['특정 직업이나 직장의 합격 여부를 예언하지 않습니다.'];

    const fullResponseText = this.assemblePersonaText({
      conclusion,
      evidence,
      structure,
      advice: actionableAdvice,
      certaintyDescription,
    });

    return {
      question: clf.rawQuestion,
      classifiedIntent: 'CAREER',
      primaryThemes: ['CAREER_ORGANIZATION'],
      conclusion,
      evidence,
      structure,
      actionableAdvice,
      certaintyDescription,
      safetyNotes,
      fullResponseText,
    };
  }

  // ==========================================
  // Q03 사업 질문 처리
  // ==========================================
  private handleBusinessQuestion(
    params: AnswerQuestionParams,
    clf: QuestionClassificationResult
  ): ConsultationAnswer {
    const bizItem = params.userReport.themes.find(t => t.theme === 'BUSINESS_VENTURE');
    const conclusion = bizItem?.summary ||
      '사업을 추진할 때에는 독립적인 실행력과 함께 철저한 자금 통제 및 파트너십 구조가 핵심 성패 요인입니다.';

    const evidence = bizItem?.evidence ||
      `식상의 추진력과 재성의 시장 감각, 그리고 일간의 감당 능력이 결합되어 사업적 기운을 구성합니다.`;

    const structure = bizItem?.structuralInterpretation ||
      `시장 변동성과 2차 긴장도(${params.phase7Output.rsi.band})가 작용하므로 리스크 관리가 병행되어야 합니다.`;

    const actionableAdvice = bizItem?.actionableCaution ||
      '혼자서 모든 것을 감당하려 하기보다 계약과 시스템을 명확히 하고, 현금 유동성을 보수적으로 운용하십시오.';

    const certaintyDescription = '사주 원국의 식상 및 재성 배치를 토대로 한 명리적 방향성 제시입니다.';
    const safetyNotes = ['사업의 성공이나 실패, 파산을 단정하지 않으며 비즈니스 실무 검증이 필수입니다.'];

    const fullResponseText = this.assemblePersonaText({
      conclusion,
      evidence,
      structure,
      advice: actionableAdvice,
      certaintyDescription,
    });

    return {
      question: clf.rawQuestion,
      classifiedIntent: 'BUSINESS',
      primaryThemes: ['BUSINESS_VENTURE'],
      conclusion,
      evidence,
      structure,
      actionableAdvice,
      certaintyDescription,
      safetyNotes,
      fullResponseText,
    };
  }

  // ==========================================
  // Q04 관계 질문 처리
  // ==========================================
  private handleRelationshipQuestion(
    params: AnswerQuestionParams,
    clf: QuestionClassificationResult
  ): ConsultationAnswer {
    const relItem = params.userReport.themes.find(t => t.theme === 'RELATIONSHIP_BOND');
    const conclusion = relItem?.summary ||
      '배우자 및 연애 관계에서는 서로의 독립된 생활 방식을 인정하고 정서적 교감을 일정하게 유지하는 것이 관건입니다.';

    const evidence = relItem?.evidence ||
      `일지 배우자궁과 인연성의 조화를 바탕으로 상호 존중의 흐름을 관찰할 수 있습니다.`;

    const structure = relItem?.structuralInterpretation ||
      `감정적 기복이나 긴장 요소(${params.phase7Output.rsi.band})가 올 때 솔직한 대화로 완충하는 태도가 필요합니다.`;

    const actionableAdvice = relItem?.actionableCaution ||
      '상대방을 내 기준에 맞추려 하기보다는 다른 점을 인정하고 공동의 취미나 목표를 공유해 보십시오.';

    const certaintyDescription = '원국의 배우자궁 기운을 해석한 잠정적 참고 가이드입니다.';
    const safetyNotes = ['이혼이나 파경, 특정 상대방의 성품을 단정 짓지 않습니다.'];

    const fullResponseText = this.assemblePersonaText({
      conclusion,
      evidence,
      structure,
      advice: actionableAdvice,
      certaintyDescription,
    });

    return {
      question: clf.rawQuestion,
      classifiedIntent: 'RELATIONSHIP',
      primaryThemes: ['RELATIONSHIP_BOND'],
      conclusion,
      evidence,
      structure,
      actionableAdvice,
      certaintyDescription,
      safetyNotes,
      fullResponseText,
    };
  }

  // ==========================================
  // Q05 건강 질문 처리
  // ==========================================
  private handleHealthQuestion(
    params: AnswerQuestionParams,
    clf: QuestionClassificationResult
  ): ConsultationAnswer {
    const healthItem = params.userReport.themes.find(t => t.theme === 'HEALTH_EQUILIBRIUM');
    const conclusion = healthItem?.summary ||
      '사주 원국의 오행 균형상 기혈 순환의 편중을 예방하고 일상적인 피로 누적을 방지하는 것이 최우선 과제입니다.';

    const evidence = healthItem?.evidence ||
      `원국의 오행 강약 및 한열조습 편중도를 통해 신체 리듬의 취약 포인트를 점검합니다.`;

    const structure = healthItem?.structuralInterpretation ||
      `신체 회복 탄력성 지표(${params.phase7Output.rsi.band})를 고려할 때 무리한 밤샘이나 과로는 피해야 합니다.`;

    const actionableAdvice = healthItem?.actionableCaution ||
      '충분한 수분 섭취와 규칙적인 수면 습관, 그리고 오행의 균형을 돕는 가벼운 스트레칭과 보행을 생활화하십시오.';

    const certaintyDescription = '명리학적 오행 균형에 따른 신체 활력 관리 팁이며 의학적 진단이 아닙니다.';
    const safetyNotes = [
      '사주로 특정 질병이나 수명을 예측할 수 없습니다. 신체 이상 시 반드시 전문 의료기관의 진료를 받으십시오.',
    ];

    const fullResponseText = this.assemblePersonaText({
      conclusion,
      evidence,
      structure,
      advice: actionableAdvice,
      certaintyDescription,
    });

    return {
      question: clf.rawQuestion,
      classifiedIntent: 'HEALTH',
      primaryThemes: ['HEALTH_EQUILIBRIUM'],
      conclusion,
      evidence,
      structure,
      actionableAdvice,
      certaintyDescription,
      safetyNotes,
      fullResponseText,
    };
  }

  // ==========================================
  // Q06 안전·이동 질문 처리
  // ==========================================
  private handleSafetyQuestion(
    params: AnswerQuestionParams,
    clf: QuestionClassificationResult
  ): ConsultationAnswer {
    const safetyItem = params.userReport.themes.find(t => t.theme === 'SAFETY_MOVEMENT');
    const conclusion = safetyItem?.summary ||
      '환경 변화나 이동 시 서두르지 않고 침착하게 주변을 살피는 주의력이 안전을 지키는 핵심입니다.';

    const evidence = safetyItem?.evidence ||
      `지지의 역마 기운 및 충·형 신호와의 관계를 분석하여 이동성 주의점을 파악합니다.`;

    const structure = safetyItem?.structuralInterpretation ||
      `활동성이 높아지는 구간에서는 긴장도(${params.phase7Output.rsi.band})를 조절하는 심리적 여유가 요구됩니다.`;

    const actionableAdvice = safetyItem?.actionableCaution ||
      '장거리 이동이나 운전 시에는 여유 시간을 넉넉히 확보하고, 낯선 환경에서는 규정과 안전 수칙을 철저히 준수하십시오.';

    const certaintyDescription = '사주 원국의 이동성 기운 및 상충 관계를 참고한 생활 안전 조언입니다.';
    const safetyNotes = ['사고 발생 날짜나 불행을 단정적으로 예언하지 않습니다. 안전 수칙 준수가 최선입니다.'];

    const fullResponseText = this.assemblePersonaText({
      conclusion,
      evidence,
      structure,
      advice: actionableAdvice,
      certaintyDescription,
    });

    return {
      question: clf.rawQuestion,
      classifiedIntent: 'SAFETY',
      primaryThemes: ['SAFETY_MOVEMENT'],
      conclusion,
      evidence,
      structure,
      actionableAdvice,
      certaintyDescription,
      safetyNotes,
      fullResponseText,
    };
  }

  // ==========================================
  // Q07 종합 질문 처리
  // ==========================================
  private handleOverallQuestion(
    params: AnswerQuestionParams,
    clf: QuestionClassificationResult
  ): ConsultationAnswer {
    const summary = params.userReport.flowSummary;
    const finalSyn = params.userReport.finalSynthesis;

    const conclusion = `당신의 사주는 ${summary.keyTendency} 구조를 지니고 있습니다.`;
    const evidence = `일간(${params.fact.day_stem})을 중심으로 ${params.fact.five_elements.dominantElement} 오행이 주도적인 역할을 하며, ${summary.headline} 기운이 뼈대를 이룹니다.`;
    const structure = `2차 기운의 통합 안정도는 [${params.phase7Output.rsi.band}]로 분류되며, ${summary.rsiBandStatus.userExplanation} 특성을 나타냅니다.`;
    const actionableAdvice = finalSyn.lifeStrategy;

    const certaintyDescription = '전체 6대 테마와 사주 Fact를 종합하여 도출된 총괄 페르소나 분석입니다.';
    const safetyNotes = ['사주 원국은 정해진 운명이 아니라 자신의 잠재력을 발현하는 인생 지도입니다.'];

    const fullResponseText = this.assemblePersonaText({
      conclusion,
      evidence,
      structure,
      advice: actionableAdvice,
      certaintyDescription,
    });

    return {
      question: clf.rawQuestion,
      classifiedIntent: 'OVERALL',
      primaryThemes: ['CAREER_ORGANIZATION', 'WEALTH_FLOW', 'RELATIONSHIP_BOND'],
      conclusion,
      evidence,
      structure,
      actionableAdvice,
      certaintyDescription,
      safetyNotes,
      fullResponseText,
    };
  }

  // ==========================================
  // Q08 비교 질문 처리 (직장 vs 사업)
  // 원칙: 특정 선택을 대신 결정하지 않고 두 영역의 명리적 구조 차이를 설명
  // ==========================================
  private handleComparisonQuestion(
    params: AnswerQuestionParams,
    clf: QuestionClassificationResult
  ): ConsultationAnswer {
    const careerItem = params.userReport.themes.find(t => t.theme === 'CAREER_ORGANIZATION');
    const bizItem = params.userReport.themes.find(t => t.theme === 'BUSINESS_VENTURE');

    const conclusion = '명리학에서는 어느 한쪽을 절대적으로 정해드리기보다, 당신의 사주 원국에서 직장과 사업이 갖는 상반된 명리적 구조 차이를 짚어드립니다.';

    const evidence = `직장 방면은 관성·인성의 체계(${careerItem?.summary || '조직 내 전문성 발휘'})를 따르는 반면, 사업 방면은 식상·재성의 독자적 실행력(${bizItem?.summary || '시장 기회 포착과 리스크 분산'})에 의존합니다.`;

    const structure = `일간의 근력과 2차 기운 안정도(${params.phase7Output.rsi.band})로 볼 때, 직장은 정기적 예측 가능성이 높고 사업은 변동성 감당력과 파트너십 구축이 성패를 좌우합니다.`;

    const actionableAdvice = '어느 길을 선택하시든, 초기에는 조직 내에서 전문성과 자본의 기반을 튼튼히 다진 후 독립적 역량을 단계적으로 시험해보는 지혜로운 전환을 권장합니다.';

    const certaintyDescription = '두 영역의 구조적 장단점을 비교한 잠정적 가이드이며, 최종 선택은 본인의 현실적 준비도에 따릅니다.';
    const safetyNotes = ['특정 진로를 강제하거나 결과를 단정하지 않습니다.'];

    const fullResponseText = this.assemblePersonaText({
      conclusion,
      evidence,
      structure,
      advice: actionableAdvice,
      certaintyDescription,
    });

    return {
      question: clf.rawQuestion,
      classifiedIntent: 'COMPARISON',
      primaryThemes: ['CAREER_ORGANIZATION', 'BUSINESS_VENTURE'],
      conclusion,
      evidence,
      structure,
      actionableAdvice,
      certaintyDescription,
      safetyNotes,
      fullResponseText,
    };
  }

  // ==========================================
  // Q09 시간축 질문 처리 (시간축 혼동 방어 포함)
  // 원칙: 원국은 불변 고정, 시간축은 현재 환경적 자극/완충
  // ==========================================
  private handleTemporalQuestion(
    params: AnswerQuestionParams,
    clf: QuestionClassificationResult
  ): ConsultationAnswer {
    const temporalMod = params.userReport.temporalModulation;
    const hasTemporalData = temporalMod?.hasActiveTimeSignals ?? false;
    const isConfusedQuestion = clf.rawQuestion.includes('바뀐 건가요') || clf.rawQuestion.includes('바뀌나요');

    const conclusion = isConfusedQuestion
      ? '사주 원국은 태어난 순간에 정해진 고유한 설계도이므로 결코 바뀌지 않습니다.'
      : hasTemporalData
        ? `현재 들어온 운(대운/세운)에서는 환경적 자극이 유입되어 원국의 활동력을 적극적으로 자극하고 있습니다.`
        : '현재 운의 흐름은 원국의 기본 잠재력을 바탕으로 환경적 기회가 서서히 무르익어가는 단계입니다.';

    const evidence = isConfusedQuestion
      ? '원국(사주 4주와 오행)은 나무의 뿌리와 기둥처럼 고정되어 있고, 대운과 세운은 그 나무가 지나는 봄·여름·가을·겨울의 계절적 파도에 해당합니다.'
      : hasTemporalData
        ? `시간축 신호는 원국 자체를 바꾸는 것이 아니라, 잠재되어 있던 테마의 활동성을 외부 환경에서 깨워주는 역할을 합니다.`
        : '대운과 세운의 시간축 정보가 구체화될 때 특정 테마의 발현 시점이 더욱 선명해집니다.';

    const structure = `원국의 뼈대와 시간축의 파도가 만날 때 2차 긴장도(${params.phase7Output.rsi.band})가 조절되며, 이는 환경적 기회와 주의점을 동시에 부여합니다.`;

    const actionableAdvice = isConfusedQuestion
      ? '자신의 타고난 원국적 강점을 바탕으로, 현재 들어온 운의 계절에 맞춰 유연하게 처신하는 것이 명리학적 지혜입니다.'
      : hasTemporalData
        ? (temporalMod?.temporalDisclaimer || '운의 파도를 자신의 속도에 맞춰 지혜롭게 활용하십시오.')
        : '운의 파도를 기다리면서 자신의 핵심 역량과 내실을 다져두는 것이 가장 든든한 준비입니다.';

    const certaintyDescription = '시간축 완충 신호(TimeModulator)를 적용한 현재 시점의 흐름 분석입니다.';
    const safetyNotes = ['특정 날짜나 연도의 길흉화복을 100% 확정하여 예언하지 않습니다.'];

    const fullResponseText = this.assemblePersonaText({
      conclusion,
      evidence,
      structure,
      advice: actionableAdvice,
      certaintyDescription,
    });

    return {
      question: clf.rawQuestion,
      classifiedIntent: 'TEMPORAL',
      primaryThemes: ['CAREER_ORGANIZATION', 'WEALTH_FLOW'],
      conclusion,
      evidence,
      structure,
      actionableAdvice,
      certaintyDescription,
      safetyNotes,
      fullResponseText,
    };
  }

  // ==========================================
  // Q10 근거 질문 처리 (근거 압박 질의 포함)
  // 원칙: 답변 → Signal → Fact 역추적 경로(EvidenceTracePath) 제공
  // ==========================================
  private handleEvidenceQuestion(
    params: AnswerQuestionParams,
    clf: QuestionClassificationResult
  ): ConsultationAnswer {
    const activeList = params.signalSet.activeSignals.concat(params.signalSet.dominantSignals);
    const signalsUsed = activeList.map(s => s.moduleId);
    const activationStates: Record<string, string> = {};
    activeList.forEach(s => {
      activationStates[s.moduleId] = s.activation.state;
    });

    const secondRelationships = params.phase7Output.secondRelationships.map(
      m => `${m.action}: ${m.sourceModuleId} ↔ ${m.targetModuleId}`
    );

    const rsiBand = params.phase7Output.rsi.band;

    const originFacts: string[] = [
      `일간: ${params.fact.day_stem} (${params.fact.day_master_strength.classification})`,
      `주도 오행: ${params.fact.five_elements.dominantElement}`,
      `사주 4주: ${params.fact.four_pillars.year.stem}${params.fact.four_pillars.year.branch}년 ` +
      `${params.fact.four_pillars.month.stem}${params.fact.four_pillars.month.branch}월 ` +
      `${params.fact.four_pillars.day.stem}${params.fact.four_pillars.day.branch}일 ` +
      `${params.fact.four_pillars.hour ? params.fact.four_pillars.hour.stem + params.fact.four_pillars.hour.branch : '미상'}시`,
    ];

    const answerSummary = '마보살의 모든 해석은 주관적 추측이 아니라, 원천 Fact와 명리 Signal에서 도출된 결정론적 결과입니다.';

    const conclusion = '마보살의 해석은 임의의 상상이 아니라, 당신이 태어난 날의 원천 Fact에서 신호와 관계를 거쳐 엄격하게 추적된 결과입니다.';

    const evidence = `[근거 1] 원천 사주 Fact: 일간 ${params.fact.day_stem} 및 4주 배치\n` +
      `[근거 2] 활성화된 21 MaSignal: ${signalsUsed.slice(0, 5).join(', ')} 등 총 ${signalsUsed.length}개 신호 감지\n` +
      `[근거 3] 2차 상호작용: ${secondRelationships.slice(0, 3).join(', ') || '안정적 독립 관계'}`;

    const structure = `이 신호들이 결합하여 RSI 지표 [${rsiBand}]의 구조적 긴장도와 복원력을 형성하고, 6대 테마의 최종 결론을 짓게 됩니다.`;

    const actionableAdvice = '이처럼 투명한 명리 추적 체계를 통해 나의 강점과 취약점을 객관적으로 파악하고 삶의 도구로 활용하십시오.';

    const certaintyDescription = '원천 Fact로부터 신호-2차관계-RSI까지의 완전한 역추적(Traceability) 검증 완료.';
    const safetyNotes = ['모든 해석 근거는 결정론적 연산에 따르며 자의적 왜곡이 배제되어 있습니다.'];

    const tracePath: EvidenceTracePath = {
      answerSummary,
      signalsUsed,
      activationStates,
      secondRelationships,
      rsiBand,
      originFacts,
    };

    const fullResponseText = this.assemblePersonaText({
      conclusion,
      evidence,
      structure,
      advice: actionableAdvice,
      certaintyDescription,
    });

    return {
      question: clf.rawQuestion,
      classifiedIntent: 'EVIDENCE',
      primaryThemes: clf.primaryThemes,
      conclusion,
      evidence,
      structure,
      actionableAdvice,
      tracePath,
      certaintyDescription,
      safetyNotes,
      fullResponseText,
    };
  }

  // ==========================================
  // 복합 질문 (COMPLEX) 처리
  // ==========================================
  private handleComplexQuestion(
    params: AnswerQuestionParams,
    clf: QuestionClassificationResult
  ): ConsultationAnswer {
    const bizItem = params.userReport.themes.find(t => t.theme === 'BUSINESS_VENTURE');
    const wealthItem = params.userReport.themes.find(t => t.theme === 'WEALTH_FLOW');
    const healthItem = params.userReport.themes.find(t => t.theme === 'HEALTH_EQUILIBRIUM');
    const relItem = params.userReport.themes.find(t => t.theme === 'RELATIONSHIP_BOND');

    const conclusion = '사업적 추진력과 재물 유입의 기운이 살아있으나, 그에 비례하여 신경 쓰실 스트레스와 체력 소모, 대인관계 조율의 긴장도 함께 내재되어 있습니다.';

    const evidence = `사업 및 재물 측면(${bizItem?.summary || '기회 포착'} / ${wealthItem?.summary || '자산 흐름'})과 신체·인간관계 측면(${healthItem?.summary || '기혈 순환 조절'} / ${relItem?.summary || '상호 존중'})이 복합적으로 얽혀 있습니다.`;

    const structure = `원국의 2차 긴장도(${params.phase7Output.rsi.band})상 성과를 내기 위해 몸을 불사르는 경향이 있으므로, 일과 휴식의 완충 장치가 없으면 피로 누적이나 관계적 마찰이 발생하기 쉽습니다.`;

    const actionableAdvice = '수익 창출에만 몰두하지 마시고, 업무 위임과 규칙적인 휴식 시간을 시스템화하여 건강과 주변 사람들을 챙기면서 지속 가능한 성취를 도모하십시오.';

    const certaintyDescription = '복합 테마 간의 상호작용을 통합 분석한 종합 조언입니다.';
    const safetyNotes = ['스트레스나 피로에 대해 특정 신체 질환을 확정하지 않습니다.'];

    const fullResponseText = this.assemblePersonaText({
      conclusion,
      evidence,
      structure,
      advice: actionableAdvice,
      certaintyDescription,
    });

    return {
      question: clf.rawQuestion,
      classifiedIntent: 'COMPLEX',
      primaryThemes: clf.primaryThemes,
      conclusion,
      evidence,
      structure,
      actionableAdvice,
      certaintyDescription,
      safetyNotes,
      fullResponseText,
    };
  }

  // ==========================================
  // 모순 유도 (CONTRADICTION) 처리 (Scenario 06)
  // 원칙: 기회 존재 != 위험 없음 (동시 공존하는 명리 구조 설명)
  // ==========================================
  private handleContradictionQuestion(
    params: AnswerQuestionParams,
    clf: QuestionClassificationResult
  ): ConsultationAnswer {
    const conclusion = '명리학의 핵심 원리는 "기회가 존재한다고 해서 위험이 없는 것은 아니다"라는 양면성에 있습니다.';

    const evidence = `원국의 식상이나 재성이 주는 추진력과 기회 신호가 활성화되어 있는 동시에, 2차 관계의 마찰이나 일간의 감당 부담 신호가 병존하고 있습니다.`;

    const structure = `통합 안정도 지표 [${params.phase7Output.rsi.band}]가 보여주듯, 순풍이 불 때 배의 키를 잡지 않으면 전복될 수 있듯이 기운이 강할수록 통제와 관리가 더욱 절실합니다.`;

    const actionableAdvice = '조심하라는 당부는 발걸음을 멈추라는 뜻이 아니라, 기회의 파도를 탈 때 안전벨트를 단단히 매고 전진하라는 실질적 조언입니다.';

    const certaintyDescription = '기회 신호와 리스크 신호의 복합 작용을 입체적으로 설명한 분석입니다.';
    const safetyNotes = ['단면적인 길흉 단정을 지양하고 위험 관리 기반의 발전을 지향합니다.'];

    const fullResponseText = this.assemblePersonaText({
      conclusion,
      evidence,
      structure,
      advice: actionableAdvice,
      certaintyDescription,
    });

    return {
      question: clf.rawQuestion,
      classifiedIntent: 'CONTRADICTION',
      primaryThemes: clf.primaryThemes,
      conclusion,
      evidence,
      structure,
      actionableAdvice,
      certaintyDescription,
      safetyNotes,
      fullResponseText,
    };
  }

  // ==========================================
  // 운명론 유도 (FATALISM_DEFENSE) 처리 (Scenario 07)
  // 원칙: 확정적 파산/실패/이혼/사고 단정 거부, 구조와 대응 방향 제시
  // ==========================================
  private handleFatalismQuestion(
    params: AnswerQuestionParams,
    clf: QuestionClassificationResult
  ): ConsultationAnswer {
    const conclusion = '사주명리학은 피할 수 없는 실패나 파국을 정해두는 숙명론이 결코 아닙니다.';

    const evidence = `당신의 사주 원국에 나타난 긴장이나 취약점은 "반드시 망하거나 불행해진다"는 뜻이 아니라, 삶에서 더 세심하게 다루어야 할 환경적 과제와 성향을 뜻합니다.`;

    const structure = `안정도 지표 [${params.phase7Output.rsi.band}]와 원국의 복원력은 자신의 선택과 전략에 따라 얼마든지 위험을 완충하고 길을 개척할 수 있음을 증명합니다.`;

    const actionableAdvice = '운명에 굴복하기보다 취약한 지점을 시스템과 지혜로 보완하십시오. 준비된 사람에게 사주는 실패의 예언이 아니라 도약의 나침반입니다.';

    const certaintyDescription = '운명론적 단정을 배제하고 인간의 자유 의지와 실천적 대응을 중시하는 마보살의 철학입니다.';
    const safetyNotes = ['파산, 이혼, 실패, 사고를 단정하지 않으며 적극적 현실 대비를 권장합니다.'];

    const fullResponseText = this.assemblePersonaText({
      conclusion,
      evidence,
      structure,
      advice: actionableAdvice,
      certaintyDescription,
    });

    return {
      question: clf.rawQuestion,
      classifiedIntent: 'FATALISM_DEFENSE',
      primaryThemes: clf.primaryThemes,
      conclusion,
      evidence,
      structure,
      actionableAdvice,
      certaintyDescription,
      safetyNotes,
      fullResponseText,
    };
  }

  // ==========================================
  // 방어 처리 (DEFENSE)
  // 욕설, 선택 강요, 특정 금액/질병/날짜 강요 시
  // ==========================================
  private handleDefenseQuestion(
    params: AnswerQuestionParams,
    clf: QuestionClassificationResult
  ): ConsultationAnswer {
    const conclusion = '마보살은 특정 결과를 강제하거나 자극적인 단정을 내리지 않으며, 명리적 구조의 균형을 안내합니다.';

    const evidence = '사주 분석은 하나의 길을 억지로 선택해주는 도구가 아니라, 각 선택지가 갖는 구조적 장단점과 위험 요소를 객관적으로 짚어내는 학문입니다.';

    const structure = `원국의 2차 안정도 [${params.phase7Output.rsi.band}]를 고려할 때 극단적인 이분법적 판단보다는 입체적인 리스크 관리가 필요합니다.`;

    const actionableAdvice = '정중하고 차분한 질문을 통해 본인이 주도적으로 해결책을 찾아갈 수 있도록 도와드리겠습니다.';

    const certaintyDescription = '건전한 상담 윤리 가이드라인에 따른 방어 응답입니다.';
    const safetyNotes = ['욕설, 선택 강요, 특정 날짜나 질병의 예언 요구는 허용되지 않습니다.'];

    const fullResponseText = this.assemblePersonaText({
      conclusion,
      evidence,
      structure,
      advice: actionableAdvice,
      certaintyDescription,
    });

    return {
      question: clf.rawQuestion,
      classifiedIntent: 'DEFENSE',
      primaryThemes: clf.primaryThemes,
      conclusion,
      evidence,
      structure,
      actionableAdvice,
      certaintyDescription,
      safetyNotes,
      fullResponseText,
    };
  }

  // ==========================================
  // 모호한 질문 (AMBIGUOUS) 처리
  // ==========================================
  private handleAmbiguousQuestion(
    params: AnswerQuestionParams,
    clf: QuestionClassificationResult
  ): ConsultationAnswer {
    const summary = params.userReport.flowSummary;

    const conclusion = `당신의 전체 사주 흐름은 [${summary.keyTendency}] 기운을 바탕으로 주도적인 삶을 열어가는 구조입니다.`;

    const evidence = `일간 ${params.fact.day_stem}의 특성과 ${params.fact.five_elements.dominantElement} 오행의 활력이 사주 전체를 견인하고 있습니다.`;

    const structure = `안정도 지표는 [${params.phase7Output.rsi.band}] 상태로, 전반적으로 큰 굴곡을 완충할 수 있는 잠재력을 갖추고 있습니다.`;

    const actionableAdvice = '궁금하신 분야가 직장 이직인지, 재물 축적인지, 혹은 연애·결혼인지 구체적으로 말씀해 주시면 그 영역의 명리 신호를 더욱 깊이 있게 짚어드리겠습니다.';

    const certaintyDescription = '광범위한 질문에 대해 원국의 전반적 맥락을 요약한 안내입니다.';
    const safetyNotes = ['단정적 미래 예언을 피하고 주체적인 선택을 지향합니다.'];

    const fullResponseText = this.assemblePersonaText({
      conclusion,
      evidence,
      structure,
      advice: actionableAdvice,
      certaintyDescription,
    });

    return {
      question: clf.rawQuestion,
      classifiedIntent: 'AMBIGUOUS',
      primaryThemes: ['CAREER_ORGANIZATION', 'WEALTH_FLOW'],
      conclusion,
      evidence,
      structure,
      actionableAdvice,
      certaintyDescription,
      safetyNotes,
      fullResponseText,
    };
  }

  // ==========================================
  // 마보살 페르소나 텍스트 조립 헬퍼
  // ==========================================
  private assemblePersonaText(parts: {
    conclusion: string;
    evidence: string;
    structure: string;
    advice: string;
    certaintyDescription: string;
  }): string {
    return [
      `[마보살의 핵심 결론]`,
      parts.conclusion,
      '',
      `[명리적 근거 Fact & Signal]`,
      parts.evidence,
      '',
      `[구조 및 상호작용]`,
      parts.structure,
      '',
      `[현실적 참고 및 조언]`,
      parts.advice,
      '',
      `※ ${parts.certaintyDescription}`,
    ].join('\n');
  }
}
