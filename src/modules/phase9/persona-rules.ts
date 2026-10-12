/**
 * Phase 9: Persona Rules & Dictionary Helper
 * 
 * 원칙:
 * 1. 단정적 공포 및 운명 확정 표현 금지
 * 2. 어려운 명리 용어는 대중 친화적 해설을 병기
 * 3. 확실성(RuleCertainty)의 투명한 자연어 변환
 */

import { RuleCertainty } from '../ma/ma-types.js';
import { InterpretationTheme } from '../phase6/phase6-types.js';

export const THEME_TITLE_MAP: Record<InterpretationTheme, string> = {
  WEALTH_FLOW: '재물과 자산의 흐름',
  CAREER_ORGANIZATION: '직장과 사회적 성취',
  BUSINESS_VENTURE: '독립 사업과 실행 기회',
  RELATIONSHIP_BOND: '애정과 배우자 관계',
  HEALTH_EQUILIBRIUM: '신체 기혈과 오행 균형',
  SAFETY_MOVEMENT: '이동과 안전 관리',
};

/**
 * 내부 RuleCertainty를 사용자 친화적인 자연어로 변환
 */
export function formatCertaintyToNaturalLanguage(certainty: RuleCertainty): string {
  switch (certainty) {
    case 'CONFIRMED':
      return '원국의 기본 구조에서 확인되는 내용입니다.';
    case 'PHASE5_CONFIRMED':
      return '현재 마보살의 핵심 신호 분석에서 확인되는 흐름입니다.';
    case 'PROVISIONAL':
      return '현재 구조를 바탕으로 참고할 수 있는 해석입니다.';
    case 'OPEN':
      return '외부 운이나 환경 변화에 따라 추가적으로 관찰할 수 있는 영역입니다.';
    default:
      return '현재 구조를 바탕으로 참고할 수 있는 해석입니다.';
  }
}

/**
 * 어려운 명리학 용어 대중적 풀이 사전
 */
export const SAJU_TERM_DICTIONARY: Record<string, string> = {
  식상생재: '자신의 재능과 활동력(식상)을 바탕으로 경제적 결실(재물)을 맺는 흐름',
  관인상생: '조직의 권한과 자격(관성)을 인정받아 자신의 지적 자산과 권리(인성)로 축적하는 구조',
  상관견관: '기존 규율이나 조직의 틀에 대한 비판적 시각과 마찰',
  군겁쟁재: '주변 동료나 경쟁자와 이익을 두고 마찰하거나 분산될 수 있는 환경',
  식신제살: '전문 기술이나 지혜로 어려운 난관과 압박을 슬기롭게 해결해 나가는 힘',
  자오충: '수(水)와 화(火) 기운이 정면으로 부딪쳐 빠른 변화와 변동을 일으키는 작용',
  인신충: '새로운 시작과 결실의 기운이 부딪치며 활동성과 이동이 급격해지는 작용',
  사해충: '생각과 이상의 차이로 인해 활동 반경이 넓어지며 변화를 겪는 작용',
  사유축: '금(金) 기운의 결속력이 강해져 원칙과 결실을 단단하게 다지는 작용',
  신자진: '수(水) 기운의 유통력이 확장되어 유연한 교류와 지혜로운 흐름이 강화되는 작용',
};

/**
 * 텍스트에 포함된 명리 용어에 쉬운 풀이를 덧붙이는 함수
 */
export function explainSajuTerms(text: string): string {
  let result = text;
  for (const [term, explanation] of Object.entries(SAJU_TERM_DICTIONARY)) {
    if (result.includes(term) && !result.includes(`(${term}:`)) {
      result = result.replace(new RegExp(term, 'g'), `${term}(${explanation})`);
    }
  }
  return result;
}

/**
 * 안전 언어 검증기 (공포 마케팅, 질병 단정, 사고 예언 필터)
 */
export function sanitizeSafetyLanguage(text: string): string {
  let sanitized = text;

  // 단정적 공포 및 확정 표현 완화
  sanitized = sanitized.replace(/반드시 (망합니다|깨집니다|발병합니다|사고가 납니다)/g, '변동에 유의하시는 것이 현명합니다');
  sanitized = sanitized.replace(/(절대적 파산|필연적 이혼)/g, '신중한 관리가 필요한 시기');

  // 의료 단정 방어
  sanitized = sanitized.replace(/(암|치매|뇌졸중|당뇨병|간경화)에 걸립니다/g, '해당 오행 계통의 피로도가 누적될 수 있습니다');
  sanitized = sanitized.replace(/치료 처방/g, '생활 속 휴식 습관');

  return sanitized;
}
