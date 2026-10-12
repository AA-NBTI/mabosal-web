/**
 * Phase 23: 마보살 처방 시스템 (Prescription Engine)
 * 
 * 원칙:
 * 1. 처방은 단순한 긍정 문구나 공허한 위로가 아닙니다.
 * 2. 구조:
 *    현재 문제 -> 왜 발생했는가 -> 언제 약해지는가 -> 지금 피해야 할 행동 -> 지금 해야 할 행동 -> 좋은 시기에 취할 행동 -> 디지털 처방
 * 3. 처방은 반드시 명리적 근거(오행 조후, 십신, 합충)와 직접 연결됩니다.
 */

import { DualEngineResult, PrescriptionReport, DigitalRemedySpec } from './types.js';

export class PrescriptionEngine {
  /**
   * 이중 엔진 결과와 시기 분석을 바탕으로 구체적인 마보살 실천 처방 리포트 생성
   */
  public generatePrescription(dualResult: DualEngineResult): PrescriptionReport {
    const trouble = dualResult.user_trouble;
    const ma = dualResult.ma_signal;
    const saju = dualResult.general_saju;

    const rootCause = ma.structural_cause;
    const weakeningTimeline = ma.recovery_point;

    // 카테고리별 맞춤 피해야 할 행동 & 해야 할 행동
    const { avoid, take, strategic } = this.getPrescriptionActions(trouble.category, ma);

    // 디지털 처방(오행 보완 부적/카드/배경화면) 스펙 생성
    const digitalRemedy = this.generateDigitalRemedy(saju, trouble.category);

    return {
      current_trouble_summary: trouble.raw_text,
      root_cause: rootCause,
      weakening_timeline: weakeningTimeline,
      actions_to_avoid: avoid,
      actions_to_take: take,
      timing_strategic_action: strategic,
      digital_remedy: digitalRemedy,
    };
  }

  private getPrescriptionActions(category: string, ma: any): {
    avoid: string[];
    take: string[];
    strategic: string;
  } {
    switch (category) {
      case 'breakup':
        return {
          avoid: [
            '장문의 문자나 심야 감정적 연락으로 상대방을 압박하는 행위',
            '지인을 통해 상대방의 근황을 캐묻거나 SNS를 지속적으로 탐색하는 행동',
            '자신의 탓으로만 돌리며 자존감을 갉아먹는 자책',
          ],
          take: [
            '최소 4주간 연락을 멈추고 감정의 불길이 식을 수 있는 완충 기간 확보',
            '몸의 감각을 깨우는 운동과 규칙적인 식사로 신체 에너지 복원',
            '상대와의 관계에서 반복되었던 패턴을 객관적인 일기로 기록하여 분별력 확보',
          ],
          strategic: '가을(9월 이후) 감정의 파고가 가라앉고 상대방의 방어 기제가 누그러질 때, 부담 없는 가벼운 안부로 조심스럽게 대화를 재개하십시오.',
        };

      case 'marriage_block':
        return {
          avoid: [
            '주변의 시선이나 나이에 쫓겨 기준에 맞지 않는 타협적 만남 강행',
            '조건만을 따지며 상대방의 본질과 성품을 간과하는 조급함',
          ],
          take: [
            '자신이 진정으로 원하는 삶의 반려자 상을 3가지 핵심 가치로 압축 정의',
            '새로운 취미나 학습 모임 등 자연스러운 만남의 장소에 노출 빈도 확대',
          ],
          strategic: '원국의 배우자 기운이 안정되는 하반기에 소개나 주선을 적극 수용하십시오.',
        };

      case 'job_loss':
        return {
          avoid: [
            '자포자기 상태로 장기간 칩거하거나 충동적인 무직 연장',
            '전 직장 동료나 상사에 대한 험담 및 소셜미디어 상의 불만 표출',
          ],
          take: [
            '포트폴리오와 이력서를 직무 중심의 최신 성과 수치로 전면 재정비',
            '기상 시간과 활동 시간을 규칙적인 출퇴근 모드로 엄격히 고정',
            '단기 자격증 취득이나 전문 기술 역량 보완을 통한 경쟁력 강화',
          ],
          strategic: '8월 이후 본격적인 채용 시장의 이직 기운이 강해지므로, 7월까지 사전 준비를 100% 완료하고 타깃 기업에 집중 지원하십시오.',
        };

      case 'business_struggle':
        return {
          avoid: [
            '매출 부진을 메우기 위한 무리한 신규 대출이나 고위험 레버리지',
            '검증되지 않은 신규 마케팅 채널에 큰돈을 쏟아붓는 충동적 지출',
          ],
          take: [
            '고정비 지출을 즉시 30% 이상 슬림화하는 비상 경영 체제 가동',
            '기존 충성 고객과의 심층 인터뷰를 통한 서비스 본질 개선',
          ],
          strategic: '10월 이후 계약운이 돌아서므로, 그때까지 현금을 최대한 방어하며 핵심 상품 하나에 집중하십시오.',
        };

      case 'financial_drain':
        return {
          avoid: [
            '원금 회수를 위한 고위험 코인/레버리지 주식 물타기',
            '가까운 지인과의 금전 거래나 보증, 공동 투자 참여',
          ],
          take: [
            '모든 지출 명세를 통장 쪼개기로 통제하고 자동이체 계좌 분리',
            '소비 충동이 들 때 48시간 유예 규칙을 철저히 지키기',
          ],
          strategic: '올해 연말부터 자산 흐름의 누수가 잡히므로, 안정적인 정기 예금 및 적금 형태의 잠금 자산으로 전환하십시오.',
        };

      case 'people_conflict':
        return {
          avoid: [
            '오해를 풀기 위해 감정적으로 대면하여 맞불을 놓는 행동',
            '제3자에게 상대방의 험담을 전하여 전선을 넓히는 행위',
          ],
          take: [
            '모든 중요 업무와 약속은 메일과 문서 등 객관적 기록으로 남기기',
            '갈등 유발자와의 물리적 거리 두기 및 단답형 공적 대응 유지',
          ],
          strategic: '시간이 지나며 주변 사람들이 상황의 진실을 스스로 인지하게 되므로, 당당하고 침묵하는 품격을 지키십시오.',
        };

      default:
        return {
          avoid: ['과도한 음주나 수면 부족으로 체력의 리듬을 깨뜨리는 행위'],
          take: ['일일 루틴을 지키고 매일 30분의 온전한 명상과 독서 시간 확보'],
          strategic: '자신의 본업 역량을 연마하며 하반기 도약의 기회를 선점하십시오.',
        };
    }
  }

  private generateDigitalRemedy(saju: any, category: string): DigitalRemedySpec {
    const lacking = saju.five_elements.lacking;
    let remedyElement = '수(水)';
    let color = '#2B4C7E (심해 청색)';
    let meaning = '지혜와 차분한 정화의 기운으로 감정의 불길을 가라앉히는 상징';

    if (lacking.includes('목')) {
      remedyElement = '목(木)';
      color = '#2E7D32 (생명 청록)';
      meaning = '막힌 기운을 뚫고 솟아오르는 새로운 시작과 활력의 상징';
    } else if (lacking.includes('화')) {
      remedyElement = '화(火)';
      color = '#C62828 (온화한 주홍)';
      meaning = '냉기를 녹이고 밝은 열정과 표현력을 북돋우는 상징';
    } else if (lacking.includes('금')) {
      remedyElement = '금(金)';
      color = '#E0A96D (단단한 백금/황금)';
      meaning = '우유부단함을 끊어내고 단호한 분별력과 결실을 맺는 상징';
    } else if (lacking.includes('토')) {
      remedyElement = '토(土)';
      color = '#8D6E63 (중후한 황토)';
      meaning = '흔들리는 마음을 든든하게 받쳐주는 중심과 포용의 상징';
    }

    return {
      remedy_id: `remedy_${category}_${remedyElement}`,
      title: `마보살 ${remedyElement}기운 정화 디지털 처방 카드`,
      color_theme: color,
      recommended_usage: '스마트폰 잠금화면 또는 배경화면으로 설정하여 하루 시작과 끝에 시각적 안정감을 유지하세요.',
      symbolic_meaning: meaning,
      downloadable_url: `https://mabosal.com/assets/remedies/${remedyElement}.svg`,
    };
  }
}
