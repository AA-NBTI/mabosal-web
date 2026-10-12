/**
 * src/modules/prescription/remedy-item-generator.ts
 * 
 * Phase 70: 처방물 후보 생성기 (Remedy Item Generator)
 * 
 * 지침 5절 & 18절:
 * - 실제 물건 또는 디지털 상품으로 연결 가능한 처방 후보 별도 관리
 * - 부적, 이미지, 카드, 소품, 액세서리, 공간용품, 디지털 배경화면, 리마인더 카드, 맞춤형 처방서
 * - 절대 원칙:
 *   1. 처방물이 처방의 중심이 되어서는 안 됨 (환경/행동이 우선, 처방물은 보조 도구)
 *   2. 처방물 자체가 명리적 효능이나 운명의 변화를 보장한다고 표현하지 않음
 *   3. personalization (추천 색상, 방향, 키워드, 가이드 문구) 구조화
 */

import { FiveElement } from '../../core/types.js';
import { RemedyItem, PrescriptionCategory } from './types.js';

export interface RemedyItemGenContext {
  prescriptionId: string;
  category: PrescriptionCategory;
  targetElement?: FiveElement | string;
  basis: string[];
  mainTheme: string;
}

export class RemedyItemGenerator {
  /**
   * 보조적 처방물 후보 생성 (디지털 배경화면, 행동 카드, 상징 부적, 공간 소품 등)
   */
  public generateRemedyItems(ctx: RemedyItemGenContext): RemedyItem[] {
    const items: RemedyItem[] = [];
    const element = ctx.targetElement as FiveElement;

    // 1. 오행별 상징 색상 및 방향 매핑
    let color = '차분한 뉴트럴 톤';
    let direction = '중앙';
    let material = '도자기/자연석';
    let elementSymbol = '조화와 균형';

    switch (element) {
      case '목':
        color = '포레스트 그린 / 민트 계열';
        direction = '동쪽';
        material = '천연 원목 / 식물';
        elementSymbol = '생명력과 유연한 성장';
        break;
      case '화':
        color = '선명한 코랄 / 웜 레드 계열';
        direction = '남쪽';
        material = '조명 / 캔들 / 유리';
        elementSymbol = '명료한 직관과 열정';
        break;
      case '토':
        color = '따뜻한 베이지 / 샌드 옐로우';
        direction = '중앙 및 남서쪽';
        material = '황토 / 도자기 / 패브릭';
        elementSymbol = '흔들림 없는 신뢰와 포용';
        break;
      case '금':
        color = '순백색 / 메탈릭 실버 계열';
        direction = '서쪽 및 북서쪽';
        material = '스테인리스 / 황동 / 미니멀 메탈';
        elementSymbol = '단호한 결단력과 명확한 분별';
        break;
      case '수':
        color = '딥 네이비 / 차분한 미드나잇 블루';
        direction = '북쪽';
        material = '글래스 / 아쿠아 / 물';
        elementSymbol = '깊은 지혜와 감정의 정화';
        break;
    }

    // 1) 맞춤 처방 디지털 배경화면 (환경 처방 상기 지원)
    items.push({
      id: `REM-${ctx.prescriptionId}-WALLPAPER`,
      type: 'DIGITAL_WALLPAPER',
      title: `[디지털 처방] 마인드 클리어링 ${ctx.category} 스마트폰 배경화면`,
      purpose: `일상 속에서 ${elementSymbol}의 에너지를 시각적으로 상기시키고 심리적 평정을 유지하도록 돕는 보조 시각 장치입니다.`,
      linkedPrescriptionId: ctx.prescriptionId,
      linkedEvidence: ctx.basis,
      personalization: {
        recommendedColor: color,
        recommendedDirection: direction,
        keyword: `${ctx.mainTheme} 평정심`,
        textGuide: '호흡을 고르고, 사실에 집중하며, 성급한 결정을 유보하라.',
        symbol: elementSymbol,
      },
      safetyNotice: '본 처방물은 상징적 보조 수단이며 운명을 바꾸거나 효능을 보장하지 않습니다.',
    });

    // 2) 맞춤 처방 실천 카드 (행동 처방 반복 실행 리마인더)
    items.push({
      id: `REM-${ctx.prescriptionId}-CARD`,
      type: 'REMINDER_CARD',
      title: `[행동 리마인더] 3대 절대 원칙 데스크 카드`,
      purpose: `감정적 충동이나 불안이 엄습할 때 즉각 지갑이나 책상 앞에서 꺼내어 행동 원칙을 점검하는 휴대용 카드입니다.`,
      linkedPrescriptionId: ctx.prescriptionId,
      linkedEvidence: ctx.basis,
      personalization: {
        recommendedColor: color,
        keyword: '24시간 숙고의 법칙',
        textGuide: '1. 즉각 답하지 않는다. 2. 서면으로 확인한다. 3. 내면의 중심을 지킨다.',
      },
      safetyNotice: '본 처방물은 상징적 보조 수단이며 운명을 바꾸거나 효능을 보장하지 않습니다.',
    });

    // 3) 상징적 보조 부적 이미지 / 인쇄물
    items.push({
      id: `REM-${ctx.prescriptionId}-AMULET`,
      type: 'AMULET_IMAGE',
      title: `[상징 비보] ${ctx.category} 액운 소멸 및 조화 상징 부적`,
      purpose: `전통 비보(裨補) 사상에 착안하여 과열된 마·살 기운을 중화하는 상징적 문양을 담은 디지털/인쇄 부적입니다.`,
      linkedPrescriptionId: ctx.prescriptionId,
      linkedEvidence: ctx.basis,
      personalization: {
        recommendedColor: color,
        recommendedDirection: direction,
        recommendedMaterial: material,
        symbol: '태극 음양 중화 부호',
      },
      safetyNotice: '본 처방물은 상징적 보조 수단이며 초자연적 효능이나 운명의 변화를 보장하지 않습니다.',
    });

    return items;
  }
}

export const remedyItemGenerator = new RemedyItemGenerator();
