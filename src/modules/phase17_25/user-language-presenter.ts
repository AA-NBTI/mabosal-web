/**
 * Phase 21: 사용자 언어 출력 엔진 (User Language Presenter)
 * 
 * 원칙:
 * 1. 내부 명칭(MA_TYPE, MA_LEVEL, ACTIVATION_STATE 등)을 절대 기계적으로 노출하지 않습니다.
 * 2. 자연스러운 프리미엄 상담 문장으로 변환합니다.
 * 3. 6단계 엄격한 출력 순서:
 *    [1. 현재 상황] -> [2. 명리적 해석] -> [3. 마보살식 진단] -> [4. 기간] -> [5. 기회] -> [6. 행동 처방]
 */

import { DualEngineResult, UserFacingPresentation } from './types.js';

export class UserLanguagePresenter {
  /**
   * 이중 엔진 결과를 받아 6단계 완성형 사용자 언어 프레젠테이션으로 변환
   */
  public present(result: DualEngineResult): UserFacingPresentation {
    const trouble = result.user_trouble;
    const ma = result.ma_signal;
    const saju = result.general_saju;

    // 1. 현재 상황 (공감과 문제 확인)
    const step1 = this.renderCurrentSituation(trouble);

    // 2. 명리적 해석 (사주 원국과 현재 운의 연결)
    const step2 = this.renderSajuInsight(trouble, ma, saju);

    // 3. 마보살식 진단 (자연스러운 한국어 압축)
    const step3 = this.renderMabosalDiagnosis(trouble, ma);

    // 4. 기간 (발생 시점과 완화 시점)
    const step4 = this.renderPeriod(ma);

    // 5. 기회 (흐름 반전의 시점)
    const step5 = this.renderOpportunity(trouble, ma, saju);

    // 6. 행동 처방 (구체적 실천 지침)
    const step6 = this.renderActionPrescription(trouble, ma);

    return {
      step1_current_situation: step1,
      step2_saju_insight: step2,
      step3_mabosal_diagnosis: step3,
      step4_period: step4,
      step5_opportunity: step5,
      step6_action_prescription: step6,
    };
  }

  private renderCurrentSituation(trouble: any) {
    if (trouble.category === 'general_fortune') {
      return {
        heading: '현재 상황 점검',
        empathy_summary: '특별한 큰 문제보다는 올해 전반적인 삶의 방향성과 나아갈 최적의 시기를 신중하게 살피고 계십니다.',
      };
    }

    return {
      heading: '현재 겪고 계신 현실의 문제',
      empathy_summary: `"${trouble.raw_text}"라는 마음의 짐을 안고 찾아오셨습니다. 혼자만의 탓이 아니며, 누구나 인생에서 특정 운의 굴곡을 지날 때 경험할 수 있는 버거운 현실임을 깊이 공감합니다.`,
    };
  }

  private renderSajuInsight(trouble: any, ma: any, saju: any) {
    const dmName = saju.day_master.name;
    const cause = ma.structural_cause;

    return {
      heading: '명리학적 배경과 근거',
      structural_explanation: `타고난 일간 ${dmName}의 기운과 현재 세운의 흐름이 맞물리면서, ${cause}. 이는 본인의 능력이나 인품의 부족이 아니라, 외부 환경의 압력과 내부 감정의 파고가 일치한 명리적 시점 때문입니다.`,
      underlying_energy: `주도 오행인 ${saju.five_elements.dominant}의 작용과 현재 운의 기운이 충돌하며 에너지의 불균형이 현실의 사건으로 표면화된 것입니다.`,
    };
  }

  private renderMabosalDiagnosis(trouble: any, ma: any) {
    if (ma.activation_state === 'DORMANT' || trouble.category === 'general_fortune') {
      return {
        heading: '마보살 진단',
        compressed_diagnosis: '현재 특별히 얽혀 있는 마(魔)는 없으며, 본래 가진 강점을 순조롭게 발휘할 수 있는 평온한 흐름입니다.',
        diagnosis_detail: '외부의 심각한 방해보다는 내실을 다지고 목표를 향해 꾸준히 축적해 나가는 자세가 결실을 맺습니다.',
      };
    }

    const domainKr: Record<string, string> = {
      relationship: '연애와 감정 관계',
      marriage: '결혼과 배우자 인연',
      workplace: '직장과 사회적 자리',
      business: '사업과 계약 관계',
      wealth: '재물과 금전 흐름',
      interpersonal: '인간관계와 평판',
      general_stagnation: '일의 진행과 일상',
      custom_domain: '지금 직면한 문제',
    };

    const targetLabel = domainKr[ma.domain] || '해당 영역';

    return {
      heading: '마보살 진단',
      compressed_diagnosis: `쉽게 말하면 지금은 ${targetLabel}에 마(魔)가 낀 시기로 볼 수 있습니다.`,
      diagnosis_detail: '마란 영구적인 불행이 아니라, 흐름이 꼬이고 판단이 흐려지기 쉬운 일시적 정체 신호입니다. 이 시기에는 억지로 힘을 주어 밀어붙일수록 매듭이 더 팽팽하게 꼬이게 됩니다.',
    };
  }

  private renderPeriod(ma: any) {
    return {
      heading: '시기의 흐름과 지속 기간',
      onset_time: `이 불안정한 파동은 ${ma.active_months_range}에 가장 뚜렷하게 체감됩니다.`,
      peak_time: '감정이나 상황의 충돌이 가장 날카로워지는 정점 구간을 지나고 있습니다.',
      easing_time: `그 흐름은 ${ma.recovery_point}에 이르러 자연스럽게 완화되고 풀리기 시작합니다.`,
    };
  }

  private renderOpportunity(trouble: any, ma: any, saju: any) {
    return {
      heading: '반전의 기회와 호운의 시점',
      breakthrough_moment: `${ma.recovery_point}를 기점으로 막혔던 기운이 돌아서며 새로운 기회가 열립니다.`,
      positive_signs: [
        '상대방 혹은 주변 환경의 태도가 누그러지고 협상의 여지가 생김',
        '스스로의 마음이 차분해지고 상황을 객관적으로 조망할 수 있는 통찰력 회복',
        '귀인의 조언이나 새로운 대안이 자연스럽게 유입됨',
      ],
    };
  }

  private renderActionPrescription(trouble: any, ma: any) {
    if (ma.activation_state === 'DORMANT') {
      return {
        heading: '권장 실천 지침',
        immediate_action: '지금은 무리하게 계획을 바꾸지 말고 기존에 준비해오던 일을 일관성 있게 밀고 나가십시오.',
        future_strategy: '하반기 수확의 결실을 염두에 두고 세부적인 실행 계획을 꼼꼼히 점검하십시오.',
      };
    }

    return {
      heading: '현실적 행동 처방',
      immediate_action: '지금은 억지로 결론을 내리거나 감정적인 담판을 짓지 마십시오. 무리한 설득이나 충동적 결정을 피하고 한 발짝 물러서는 것이 최선의 방어입니다.',
      future_strategy: '흐름이 풀리는 시점까지 자신의 중심을 지키고, 기운이 호전될 때 정중하고 명확한 방식으로 대화나 협상을 재개하십시오.',
    };
  }
}
