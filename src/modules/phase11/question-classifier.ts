/**
 * Phase 11 & Phase 12: Question Classifier
 * 
 * 원칙:
 * 1. 사용자의 자연어 질문을 10대 기본 유형 및 복합/모호/스트레스 질문으로 정확히 분류합니다.
 * 2. 질문 의도에 맞는 InterpretationTheme 후보군을 매핑합니다.
 * 3. 결정론적 규칙 기반 분석으로 언제나 일관된 분류 결과를 보장합니다.
 * 4. 스트레스 상황(모순 유도, 운명론 강요, 근거 압박, 공격성/선택 강요)을 탐지하여 방어 레이어로 연결합니다.
 */

import { InterpretationTheme } from '../phase6/phase6-types.js';
import {
  ConsultationDialogueContext,
  QuestionClassificationResult,
  QuestionIntentType,
} from './phase11-types.js';

export class QuestionClassifier {
  /**
   * 사용자 질문을 분석하여 의도 및 관련 테마를 분류합니다.
   */
  public classify(
    questionText: string,
    context?: ConsultationDialogueContext
  ): QuestionClassificationResult {
    const q = questionText.trim();
    const detectedKeywords: string[] = [];

    // 0. 방어(DEFENSE): 욕설, 선택 강요, 특정 금액/질병/날짜 강요 감지
    const abusiveKeywords = ['시발', '씨발', '개새', '병신', '닥쳐', '존나', '새끼', '꺼져'];
    const forceChoiceKeywords = ['무조건 하나만', '딱 하나만 골라', '하나만 골라', '선택해라', '둘 중 하나만'];
    const extremePredictKeywords = ['몇월 몇일에', '정확히 몇억', '어떤 병에 걸리', '언제 죽'];

    const hasAbusive = abusiveKeywords.some(k => q.includes(k));
    const hasForceChoice = forceChoiceKeywords.some(k => q.includes(k));
    const hasExtremePredict = extremePredictKeywords.some(k => q.includes(k));

    if (hasAbusive || hasForceChoice || hasExtremePredict) {
      return {
        rawQuestion: q,
        intentType: 'DEFENSE',
        primaryThemes: ['CAREER_ORGANIZATION', 'WEALTH_FLOW'],
        secondaryThemes: [],
        isComparison: hasForceChoice,
        isTemporal: false,
        isEvidenceRequest: false,
        isAmbiguous: false,
        detectedKeywords: ['방어·가이드라인위반'],
      };
    }

    // 1. 모순 유도 (CONTRADICTION) 감지
    const hasWhyAndCaution = (q.includes('왜') || q.includes('어째서')) &&
      (q.includes('조심') || q.includes('주의') || q.includes('경고'));
    const hasContradictionPhrases = [
      '모순', '말이 다른', '앞뒤가 안 맞', '좋다더니', '좋다면서', '있다고 했는데', '좋다고 했는데', '조심하라고', '주의하라고'
    ].some(k => q.includes(k));

    const isContradiction = hasWhyAndCaution || hasContradictionPhrases;

    if (isContradiction) {
      const themes: InterpretationTheme[] = context?.lastReferencedThemes && context.lastReferencedThemes.length > 0
        ? context.lastReferencedThemes
        : ['BUSINESS_VENTURE', 'RELATIONSHIP_BOND'];
      return {
        rawQuestion: q,
        intentType: 'CONTRADICTION',
        primaryThemes: themes,
        secondaryThemes: ['WEALTH_FLOW'],
        isComparison: false,
        isTemporal: false,
        isEvidenceRequest: false,
        isAmbiguous: false,
        detectedKeywords,
      };
    }

    // 2. 운명론 유도 (FATALISM_DEFENSE) 감지
    const fatalismKeywords = [
      '결국 실패하나요',
      '이혼하게 되나요',
      '사업하면 망하나요',
      '사고가 날 운명',
      '망할 운명',
      '절대 못 모으나요',
      '망하나요',
      '실패할 팔자',
      '망할 팔자',
      '이혼할 팔자',
    ];
    const isFatalism = fatalismKeywords.some(k => {
      if (q.includes(k)) {
        detectedKeywords.push(k);
        return true;
      }
      return false;
    });

    if (isFatalism) {
      let targetThemes: InterpretationTheme[] = ['CAREER_ORGANIZATION', 'WEALTH_FLOW'];
      if (q.includes('이혼')) targetThemes = ['RELATIONSHIP_BOND'];
      if (q.includes('사업') || q.includes('망하')) targetThemes = ['BUSINESS_VENTURE', 'WEALTH_FLOW'];
      if (q.includes('사고')) targetThemes = ['SAFETY_MOVEMENT'];

      return {
        rawQuestion: q,
        intentType: 'FATALISM_DEFENSE',
        primaryThemes: targetThemes,
        secondaryThemes: [],
        isComparison: false,
        isTemporal: false,
        isEvidenceRequest: false,
        isAmbiguous: false,
        detectedKeywords,
      };
    }

    // 3. 근거 질문 (EVIDENCE) 감지 (근거 압박 포함)
    const evidenceKeywords = [
      '왜',
      '근거',
      '이유',
      '어째서',
      '어떻게 알',
      '그렇게 해석',
      '그렇게 나오',
      '어디서 나온',
      '원천',
      '어느 기둥 때문',
      '어디에서 판단',
      '어디에 나와',
      '정확히 어떤 근거',
    ];
    const isEvidenceRequest = evidenceKeywords.some(k => {
      if (q.includes(k)) {
        detectedKeywords.push(k);
        return true;
      }
      return false;
    });

    if (isEvidenceRequest) {
      const previousThemes: InterpretationTheme[] = context?.lastReferencedThemes && context.lastReferencedThemes.length > 0
        ? context.lastReferencedThemes
        : ['CAREER_ORGANIZATION', 'WEALTH_FLOW'];
      return {
        rawQuestion: q,
        intentType: 'EVIDENCE',
        primaryThemes: previousThemes,
        secondaryThemes: [],
        isComparison: false,
        isTemporal: false,
        isEvidenceRequest: true,
        isAmbiguous: false,
        detectedKeywords,
      };
    }

    // 4. 비교 질문 (COMPARISON) 감지
    const comparisonKeywords = ['중 어느', '둘 중', '비교', '직장과 사업', '사업과 직장', '직장보다', '사업보다', '뭐가 더', '어떤 게 더'];
    const isComparison = comparisonKeywords.some(k => {
      if (q.includes(k)) {
        detectedKeywords.push(k);
        return true;
      }
      return false;
    });

    if (isComparison) {
      return {
        rawQuestion: q,
        intentType: 'COMPARISON',
        primaryThemes: ['CAREER_ORGANIZATION', 'BUSINESS_VENTURE'],
        secondaryThemes: ['WEALTH_FLOW'],
        isComparison: true,
        isTemporal: false,
        isEvidenceRequest: false,
        isAmbiguous: false,
        detectedKeywords,
      };
    }

    // 5. 시간축 질문 (TEMPORAL) 감지 (시간축 혼동 질문 포함)
    const temporalKeywords = [
      '현재 운', '대운', '세운', '월운', '올해', '내년', '운에서', '운의 흐름', '시기',
      '사주가 바뀐 건가요', '사주가 바뀌나요', '원국이 변하나요', '사주가 변하',
    ];
    const isTemporal = temporalKeywords.some(k => {
      if (q.includes(k)) {
        detectedKeywords.push(k);
        return true;
      }
      return false;
    });

    if (isTemporal) {
      return {
        rawQuestion: q,
        intentType: 'TEMPORAL',
        primaryThemes: ['CAREER_ORGANIZATION', 'WEALTH_FLOW'],
        secondaryThemes: ['SAFETY_MOVEMENT'],
        isComparison: false,
        isTemporal: true,
        isEvidenceRequest: false,
        isAmbiguous: false,
        detectedKeywords,
      };
    }

    // 6. 복합 질문 감지 (예: 사업 + 재물 + 건강 + 인간관계)
    const hasBusinessKw = ['사업', '창업', '장사', '독립'].some(k => q.includes(k));
    const hasWealthKw = ['돈', '재물', '벌', '모으', '부자', '수입'].some(k => q.includes(k));
    const hasHealthKw = ['건강', '스트레스', '피로', '체력', '신경'].some(k => q.includes(k));
    const hasRelKw = ['인간관계', '관계', '사람', '동업', '인연'].some(k => q.includes(k));

    const matchedThemes: InterpretationTheme[] = [];
    if (hasBusinessKw) matchedThemes.push('BUSINESS_VENTURE');
    if (hasWealthKw) matchedThemes.push('WEALTH_FLOW');
    if (hasHealthKw) matchedThemes.push('HEALTH_EQUILIBRIUM');
    if (hasRelKw) matchedThemes.push('RELATIONSHIP_BOND');

    if (matchedThemes.length >= 2) {
      return {
        rawQuestion: q,
        intentType: 'COMPLEX',
        primaryThemes: matchedThemes,
        secondaryThemes: [],
        isComparison: false,
        isTemporal: false,
        isEvidenceRequest: false,
        isAmbiguous: false,
        detectedKeywords: ['복합다중질문'],
      };
    }

    // 7. 모호한 질문 (AMBIGUOUS) 감지
    const ambiguousKeywords = [
      '앞으로 어떻게',
      '어떨까요',
      '잘 살 수',
      '인생이',
      '어떻게 될',
      '앞날',
      '운세가 어때',
      '제 인생은 어떤가요',
      '운이 좋은 편인가요',
      '뭐가 제일 중요한가요',
      '어떻게 살아야',
    ];
    const isAmbiguous = ambiguousKeywords.some(k => q.includes(k)) && q.length < 30;

    if (isAmbiguous) {
      return {
        rawQuestion: q,
        intentType: 'AMBIGUOUS',
        primaryThemes: ['CAREER_ORGANIZATION', 'WEALTH_FLOW'],
        secondaryThemes: ['RELATIONSHIP_BOND'],
        isComparison: false,
        isTemporal: false,
        isEvidenceRequest: false,
        isAmbiguous: true,
        detectedKeywords,
      };
    }

    // 8. 개별 테마 질문 분류 (도메인 고유 질문을 종합보다 먼저 판별)
    // 사업 (BUSINESS)
    if (['사업', '창업', '장사', '독립', '동업'].some(k => q.includes(k))) {
      return {
        rawQuestion: q,
        intentType: 'BUSINESS',
        primaryThemes: ['BUSINESS_VENTURE'],
        secondaryThemes: ['WEALTH_FLOW'],
        isComparison: false,
        isTemporal: false,
        isEvidenceRequest: false,
        isAmbiguous: false,
        detectedKeywords: ['사업·창업'],
      };
    }

    // 직장 (CAREER)
    if (['직장', '회사', '조직', '이직', '승진', '취업', '직무', '직장생활'].some(k => q.includes(k))) {
      return {
        rawQuestion: q,
        intentType: 'CAREER',
        primaryThemes: ['CAREER_ORGANIZATION'],
        secondaryThemes: ['WEALTH_FLOW'],
        isComparison: false,
        isTemporal: false,
        isEvidenceRequest: false,
        isAmbiguous: false,
        detectedKeywords: ['직장·조직'],
      };
    }

    // 재물 (WEALTH) - 반복 질문("돈을 잘 버는 사주인가요?", "재물운이 어떤가요?", "돈과 관련된 구조가 강한가요?", "제가 돈을 만드는 쪽인가요?")
    if (['돈', '모으', '버는', '재물', '자산', '부자', '금전', '수입', '돈을 잘', '재물운', '돈과 관련', '돈을 만'].some(k => q.includes(k))) {
      return {
        rawQuestion: q,
        intentType: 'WEALTH',
        primaryThemes: ['WEALTH_FLOW'],
        secondaryThemes: ['BUSINESS_VENTURE'],
        isComparison: false,
        isTemporal: false,
        isEvidenceRequest: false,
        isAmbiguous: false,
        detectedKeywords: ['재물·돈'],
      };
    }

    // 관계 (RELATIONSHIP)
    if (['배우자', '연애', '결혼', '남편', '아내', '이성', '인연', '사랑'].some(k => q.includes(k))) {
      return {
        rawQuestion: q,
        intentType: 'RELATIONSHIP',
        primaryThemes: ['RELATIONSHIP_BOND'],
        secondaryThemes: [],
        isComparison: false,
        isTemporal: false,
        isEvidenceRequest: false,
        isAmbiguous: false,
        detectedKeywords: ['배우자·연애'],
      };
    }

    // 건강 (HEALTH)
    if (['건강', '체력', '피로', '몸', '기혈', '오행'].some(k => q.includes(k))) {
      return {
        rawQuestion: q,
        intentType: 'HEALTH',
        primaryThemes: ['HEALTH_EQUILIBRIUM'],
        secondaryThemes: ['SAFETY_MOVEMENT'],
        isComparison: false,
        isTemporal: false,
        isEvidenceRequest: false,
        isAmbiguous: false,
        detectedKeywords: ['건강·기혈'],
      };
    }

    // 안전·이동 (SAFETY)
    if (['안전', '이동', '사고', '운전', '이사', '출장', '조심'].some(k => q.includes(k))) {
      return {
        rawQuestion: q,
        intentType: 'SAFETY',
        primaryThemes: ['SAFETY_MOVEMENT'],
        secondaryThemes: ['HEALTH_EQUILIBRIUM'],
        isComparison: false,
        isTemporal: false,
        isEvidenceRequest: false,
        isAmbiguous: false,
        detectedKeywords: ['안전·이동'],
      };
    }

    // 9. 종합 질문 (OVERALL) 감지
    const overallKeywords = ['한마디로', '종합', '전체적', '총평', '어떤 구조', '내 사주', '어떤 사주', '핵심은 무엇'];
    const isOverall = overallKeywords.some(k => {
      if (q.includes(k)) {
        detectedKeywords.push(k);
        return true;
      }
      return false;
    });

    if (isOverall) {
      return {
        rawQuestion: q,
        intentType: 'OVERALL',
        primaryThemes: ['CAREER_ORGANIZATION', 'WEALTH_FLOW', 'RELATIONSHIP_BOND'],
        secondaryThemes: [],
        isComparison: false,
        isTemporal: false,
        isEvidenceRequest: false,
        isAmbiguous: false,
        detectedKeywords,
      };
    }

    // 기본 매핑 (종합으로 수렴)
    return {
      rawQuestion: q,
      intentType: 'OVERALL',
      primaryThemes: ['CAREER_ORGANIZATION', 'WEALTH_FLOW'],
      secondaryThemes: ['RELATIONSHIP_BOND'],
      isComparison: false,
      isTemporal: false,
      isEvidenceRequest: false,
      isAmbiguous: true,
      detectedKeywords: ['기본종합'],
    };
  }
}
