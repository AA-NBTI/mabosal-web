/**
 * src/modules/prescription/environment-prescription.ts
 * 
 * Phase 70: 환경 처방 생성기 (Environment Prescription Generator)
 * 
 * 지침 3절 & 9절:
 * - 이용자가 생활하는 주변 조건을 현실적이고 구체적으로 조절
 * - 지원 범위: 공간, 방향, 색, 소재, 조명, 자연광, 책상/침대 배치, 활동 장소, 생활 시간, 업무/주거/관계 환경
 * - 특정 요소가 필요한 이유를 명리 근거(오행, 조후, 억부, 충형)와 반드시 연결
 */

import { FiveElement } from '../../core/types.js';
import { PrescriptionCategory } from './types.js';

export interface EnvironmentPrescriptionContext {
  targetElement?: FiveElement | string;
  category: PrescriptionCategory;
  clashesOrHarms?: string[];
  johuBalance?: string;
  roomType?: string;
}

export class EnvironmentPrescriptionGenerator {
  /**
   * 보완 오행 및 문제 영역에 따른 맞춤형 환경 처방 목록 생성
   */
  public generateEnvironmentActions(ctx: EnvironmentPrescriptionContext): string[] {
    const actions: string[] = [];
    const element = ctx.targetElement as FiveElement;

    // 1. 오행 및 조후 기반 기본 물리 환경 조율
    switch (element) {
      case '목':
        actions.push('업무 및 생활 공간의 동쪽 창가를 정돈하여 아침의 맑은 공기를 환기하십시오.');
        actions.push('책상이나 거실에 작은 관엽식물이나 목재 소재의 소품을 배치하여 생기를 불어넣으세요.');
        actions.push('초록빛이나 민트 계열의 차분한 색상을 포인트 소품(쿠션, 마우스패드)으로 활용하십시오.');
        break;
      case '화':
        actions.push('자연 채광이 풍부하게 들어오는 밝은 공간에서 오전 핵심 활동을 진행하십시오.');
        actions.push('지나치게 어둡거나 폐쇄적인 공간을 피하고, 3000K 전후의 따뜻한 톤 조명을 보완하세요.');
        actions.push('레드, 오렌지, 웜톤의 따뜻한 색상을 업무 데스크 주변 포인트로 두어 활동성을 자극하십시오.');
        break;
      case '토':
        actions.push('책상과 침대를 출입문과 마주 보지 않는 벽면 중심의 안정적인 위치로 재배치하십시오.');
        actions.push('베이지, 브라운, 옐로우 계열의 차분하고 묵직한 패브릭 소재를 활용하여 심리적 안정감을 높이세요.');
        actions.push('도자기 소품이나 흙 화분을 거실 중심부에 두어 흔들림 없는 중심 에너지를 형성하십시오.');
        break;
      case '금':
        actions.push('업무 공간의 불필요한 서류와 잡동사니를 정리하여 군더더기 없는 미니멀 환경을 조성하십시오.');
        actions.push('화이트, 실버, 연회색 계열의 단정하고 명확한 색상과 금속성 문구 소품을 배치하십시오.');
        actions.push('동선이 엉키지 않도록 생활 동선을 깔끔하게 구획하고 서랍 수납을 체계화하세요.');
        break;
      case '수':
        actions.push('[수(水) 기운 보완] 과열된 판단과 조급함을 식히기 위해 차분한 딥네이비·블루 계열의 서재나 조용한 작업 공간을 확보하십시오.');
        actions.push('[사색과 정화] 복잡한 생각과 신경 소모를 정화하기 위해 물이 흐르는 자연 산책로나 소음이 차단된 사색 환경을 주 활동 반경으로 두십시오.');
        actions.push('[조후 건조 완화] 체내와 환경의 조열(메마름)을 방어하기 위해 미온수를 규칙적으로 섭취하고 쾌적한 실내 공기와 적정 습도를 유지하십시오.');
        break;
      default:
        actions.push('생활 공간의 채광과 환기를 매일 아침 규칙적으로 실행하여 정체된 에너지를 순환시키십시오.');
        actions.push('책상 위 시야를 가리는 물건을 치우고 시선이 트이는 배치를 유지하십시오.');
    }

    // 2. 충·형·파·해 등 역동적 충돌 완충 환경 처방
    if (ctx.clashesOrHarms && ctx.clashesOrHarms.length > 0) {
      actions.push('[기운 충돌 완충] 외부 마찰과 대인 스트레스가 일상에 직접 충격을 주지 않도록, 타인의 시선과 방해가 차단되는 독립된 개인 집중 공간을 확보하십시오.');
    }

    // 3. 문제 도메인별 현실적 환경 처방 보강
    switch (ctx.category) {
      case 'MONEY':
        actions.push('지갑과 영수증, 통장 등 금융 관련 물품을 어수선한 곳에 두지 않고 북서쪽이나 안쪽 서랍에 정갈하게 보관하십시오.');
        break;
      case 'BUSINESS':
        actions.push('외부 협상이나 중요 미팅은 소음이 심하고 산만한 카페 대신, 사적인 대화가 보호되는 독립 회의실에서 진행하십시오.');
        break;
      case 'JOB':
        actions.push('업무 모니터 뒤편이나 파티션에 시선이 분산되지 않도록 시각적 차폐 요소를 두어 집중도를 극대화하십시오.');
        break;
      case 'LOVE':
      case 'MARRIAGE':
        actions.push('둘만의 대화 공간은 지나치게 밝은 형광등 대신 부드럽고 따뜻한 간접 조명을 활용하여 감정 대립을 완화하십시오.');
        break;
      case 'HEALTH':
        actions.push('침실에서 스마트폰과 전자기기를 멀리하고 완전한 암막 환경을 갖추어 멜라토닌 분비와 깊은 수면을 확보하십시오.');
        break;
      case 'RELATIONSHIP':
        actions.push('갈등이 예상되는 대화는 개방적이고 시야가 트인 야외 테라스나 산책로를 걸으며 진행하여 긴장을 풀도록 하세요.');
        break;
    }

    return actions.slice(0, 4); // 가장 현실적이고 명확한 상위 3~4개 채택
  }
}

export const environmentPrescriptionGenerator = new EnvironmentPrescriptionGenerator();
