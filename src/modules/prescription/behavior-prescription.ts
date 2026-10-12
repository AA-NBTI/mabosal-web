/**
 * src/modules/prescription/behavior-prescription.ts
 * 
 * Phase 70: 행동 처방 생성기 (Behavior Prescription Generator)
 * 
 * 지침 4절 & 10절:
 * - 이용자가 실제로 하는 구체적 행동(시작, 중단, 회피, 강화, 시기 조절, 의사결정, 대화 방식)을 조절
 * - 나쁜 예: "인간관계를 조심하세요", "돈을 아끼세요" 배제!
 * - 좋은 예:
 *   "구두 합의보다 문서화 우선"
 *   "중요한 계약은 즉시 결정하지 않고 최소 24시간 재검토 절차 두기"
 *   "감정적 상태에서 협상하거나 최후통첩을 보내는 행동 즉시 중단"
 */

import { PrescriptionCategory } from './types.js';

export interface BehaviorPrescriptionContext {
  category: PrescriptionCategory;
  subType?: string;
  hasClashOrHarm?: boolean;
  hasRobWealthOrKill?: boolean; // 겁재, 칠살, 편관 등 고위험 십신 활성화
  currentEvent?: string;
}

export class BehaviorPrescriptionGenerator {
  /**
   * 문제 유형 및 명리 역학에 따른 구체적 행동 지침 목록 생성
   */
  public generateBehaviorActions(ctx: BehaviorPrescriptionContext): string[] {
    const actions: string[] = [];

    // 1. 도메인별 현실적 구체 행동 처방 (도메인 고유 핵심 실천을 1순위로 배치)
    switch (ctx.category) {
      case 'MONEY':
        actions.push('신규 투자나 대규모 지출 제안을 받았을 때는 그 자리에서 승낙하지 말고 최소 3일간의 서류 실사 및 재검토를 거치십시오.');
        actions.push('지인 간의 금전 대여나 연대보증을 정중히 거절하고, 불가피할 경우 법적 공증과 차용증을 반드시 작성하십시오.');
        actions.push('현금 흐름의 안전성을 위해 고위험 레버리지 상품 투자를 중단하고 비상 유동성을 확보하세요.');
        break;

      case 'BUSINESS':
        actions.push('모든 동업 및 거래 합의는 구두 약속을 배제하고 업무 범위(R&R)와 정산 방식을 명시한 서면 계약서로 체결하십시오.');
        actions.push('중요한 사업 계약 협상 시에는 단독으로 판단하지 말고 세무사·변호사 등 공인 전문가의 자문을 필히 동반하세요.');
        actions.push('무리한 사세 확장이나 대출을 통한 신규 사업 착수를 유보하고, 기존 고정비 절감과 핵심 내실 다지기에 집중하십시오.');
        break;

      case 'JOB':
        actions.push('상사나 동료와의 업무상 이견은 감정적인 반박 대신 데이터와 사실에 기반한 정량적 보고서 형태로 전달하십시오.');
        actions.push('순간적인 분노나 억울함으로 충동적 사직서를 제출하지 말고, 이직 제안의 구체적 계약 조건이 확정될 때까지 현 위치를 유지하세요.');
        actions.push('본인의 업무 성과와 타임라인을 주간 단위로 명확히 기록해 두어 향후 평가나 분쟁 시 객관적 근거로 활용하십시오.');
        break;

      case 'LOVE':
        actions.push('상대방의 사소한 연락 지연이나 말투에 과민하게 반응하지 말고, 나의 독립적인 일과 취미에 몰입하는 시간을 확보하십시오.');
        actions.push('갈등 상황에서는 과거의 잘못을 소환하여 비난하지 말고, 현재 느끼는 감정과 원하는 해결책만 간결하게 표현하세요.');
        actions.push('상대방을 통제하거나 집착하려는 시도를 멈추고, 서로의 사생활과 개인 시간을 존중하는 심리적 거리를 유지하십시오.');
        break;

      case 'MARRIAGE':
        actions.push('배우자와의 중대한 가사·재정 문제는 피로가 누적된 평일 밤 대신, 충분히 휴식을 취한 주말 오전에 협의하십시오.');
        actions.push('일방적인 요구 대신 상대방의 입장 1가지를 먼저 인정해 주는 양보적 대화 화법(I-Message)을 실천하세요.');
        actions.push('양가 가족이나 외부인의 개입을 최소화하고, 부부 두 사람만의 합의를 최우선으로 존중하십시오.');
        break;

      case 'RELATIONSHIP':
        actions.push('내 삶의 에너지를 갉아먹는 관계에 무리하게 맞춰주지 말고, 정중하지만 단호한 거절(Boundaries) 연습을 시작하십시오.');
        actions.push('주변 사람들의 부탁을 즉각 수락하지 말고 "일정을 확인해 보고 말씀드리겠습니다"라는 완충 멘트를 사용하세요.');
        actions.push('타인의 험담이나 사내 정치에 관여하지 말고 객관적 중립 위치를 철저히 지키십시오.');
        break;

      case 'HEALTH':
        actions.push('통증이나 피로 신호가 올 때 진통제에만 의존하지 말고 빠른 시일 내에 공인 의료기관의 정밀 검진을 예약하십시오.');
        actions.push('취침 전 1시간 동안 스마트폰 사용을 중단하고 가벼운 스트레칭과 복식호흡으로 자율신경을 안정시키세요.');
        actions.push('불규칙한 야식과 폭식을 멈추고, 매일 정해진 시간에 30분 이상의 규칙적인 유산소 보행을 실천하십시오.');
        break;

      default: // LIFE
        actions.push('하루 10분씩 조용히 명상하거나 하루 일과를 정리하는 일기 쓰기를 통해 내면의 감정을 객관화하십시오.');
        actions.push('불필요한 SNS 소비와 타인과의 비교를 줄이고, 나만의 소소한 성취 루틴을 하나씩 완성해 나가세요.');
    }

    // 2. 역동적 충돌(충/형/해) 및 감정 격화 공통 행동 처방: 24시간 룰 및 냉각기
    if (ctx.hasClashOrHarm) {
      actions.push('감정이 고조되거나 자존심이 상했을 때 즉각적인 결론이나 최후통첩을 내리지 말고 충분한 감정 검토와 유예 시간을 두십시오.');
      actions.push('새벽 시간대나 늦은 밤에 장문의 해명·항의 메시지를 즉흥적으로 발송하는 행동을 즉시 멈추세요.');
    }

    // 3. 비겁 과다/겁재 과열 시 재산/동업 리스크 방어
    if (ctx.hasRobWealthOrKill && ctx.category !== 'MONEY' && ctx.category !== 'BUSINESS') {
      actions.push('가까운 지인과의 사적인 돈거래나 명의 대여를 단호히 차단하십시오.');
    }

    return actions.slice(0, 4); // 가장 핵심적인 실행 행동 상위 3~4개 채택
  }
}

export const behaviorPrescriptionGenerator = new BehaviorPrescriptionGenerator();
