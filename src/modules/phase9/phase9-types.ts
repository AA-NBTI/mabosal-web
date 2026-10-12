/**
 * Phase 9: Natural Language & Mabosal Persona Types
 * 
 * 원칙:
 * 1. Phase 1~8의 명리 계산, Signal, RSI, InterpretationNode는 불변 보존합니다.
 * 2. Phase 9는 판단 엔진이 아니라 표현(Presentation) 엔진입니다.
 * 3. 6대 Theme별 자연어 해석과 마보살 페르소나 문체 렌더링 규격을 정의합니다.
 */

import { InterpretationNode, InterpretationTheme } from '../phase6/phase6-types.js';

/**
 * 6대 테마별 렌더링된 자연어 해석 노드
 */
export interface RenderedThemeInterpretation {
  theme: InterpretationTheme;
  title: string;              // 친근하고 명확한 한글 테마명
  summary: string;            // ① 한줄 결론: 사용자가 가장 먼저 이해하는 핵심 해석
  evidence: string;           // ② 근거 설명: 어떤 Fact와 MaSignal 때문에 도출되었는지 해설
  interpretation: string;     // ③ 관계·구조 해석: Second Relationship과 RSI의 구조적 영향 풀이
  caution: string;            // ④ 현실적 조언: 사용자가 일상에서 실천할 수 있는 현실적 가이드
  sourceReferences: {         // 원천 추적 메타데이터 보존
    pillars: string[];
    tenGods: string[];
    signals: string[];
  };
  certainty: string;          // 확정도 자연어 설명 (CONFIRMED, PHASE5_CONFIRMED, PROVISIONAL의 한글화)
  provisionalNote?: string;   // 잠정 지표 안내 문구
  rawNode: InterpretationNode; // 원천 노드 무결성 보존
}

/**
 * 마보살 페르소나 전체 렌더링 결과
 */
export interface MabosalPersonaRenderResult {
  overviewGreeting: string;                         // 마보살의 정중하고 따뜻한 전체 총평 인사
  themeInterpretations: Record<InterpretationTheme, RenderedThemeInterpretation>;
  orderedThemes: RenderedThemeInterpretation[];      // 6대 테마 순서 보장 배열
  overallToneAndAdvice: string;                     // 전체적인 삶의 태도 및 조화 방향 조언
  certaintyIsolationVerified: boolean;              // 확실성 계층 격리 검증 플래그
}
