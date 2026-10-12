/**
 * Phase 11: Consultation Dialogue Engine Types
 * 
 * 원칙:
 * 1. Phase 1~10의 명리 판단 결과와 리포트를 소비하여, 사용자의 자연어 질문에 마보살 페르소나로 대화합니다.
 * 2. 10대 기본 질문 유형, 복합 질문, 모호한 질문, 시간축 질문, 근거 질문을 지원합니다.
 * 3. 4단계 답변 구조 [결론 → 근거 → 구조 → 현실적 조언]을 유지합니다.
 * 4. 근거 질문(Q10) 시: 답변 → Signal → Fact 완전 역추적 경로를 제공합니다.
 * 5. 비교 질문(Q08) 시: 일방적 결정을 내리지 않고 명리적 구조 차이를 객관적으로 설명합니다.
 */

import { InterpretationTheme } from '../phase6/phase6-types.js';

export type QuestionIntentType =
  | 'WEALTH'          // Q01 재물: 돈을 버는 쪽 vs 모으는 쪽, 재정 흐름
  | 'CAREER'          // Q02 직장: 직장생활 적합성, 조직 내 역할
  | 'BUSINESS'        // Q03 사업: 독립 사업, 창업 시 중요 구조
  | 'RELATIONSHIP'    // Q04 관계: 연애, 결혼, 배우자 관계 핵심
  | 'HEALTH'          // Q05 건강: 신경 써야 할 신체 기혈 및 오행 균형
  | 'SAFETY'          // Q06 안전: 이동, 운전, 생활 속 주의점
  | 'OVERALL'         // Q07 종합: 사주 전체 구조의 한마디 요약
  | 'COMPARISON'      // Q08 비교: 직장 vs 사업 등 구조 차이 비교
  | 'TEMPORAL'        // Q09 시간축: 현재 운(대운/세운/월운)에서의 활성화
  | 'EVIDENCE'        // Q10 근거: "왜 그렇게 해석했나요?" 역추적 질의
  | 'COMPLEX'         // 복합 질문: 2개 이상의 테마가 결합된 질문
  | 'AMBIGUOUS'       // 모호한 질문: "앞으로 어떻게 될까요?" 등 광범위한 질문
  | 'CONTRADICTION'   // 모순 유도: "좋다고 했는데 왜 조심하라고 하나요?" 등 양면성 질의
  | 'FATALISM_DEFENSE'// 운명론 유도: "결국 실패하나요?", "망하나요?" 등 단정 요구 방어
  | 'DEFENSE';        // 공격적 질문/선택 강요/비윤리적 질의 방어

/**
 * 사용자 질문 의도 분류 결과
 */
export interface QuestionClassificationResult {
  rawQuestion: string;
  intentType: QuestionIntentType;
  primaryThemes: InterpretationTheme[];
  secondaryThemes: InterpretationTheme[];
  isComparison: boolean;
  isTemporal: boolean;
  isEvidenceRequest: boolean;
  isAmbiguous: boolean;
  detectedKeywords: string[];
}

/**
 * 근거 역추적 경로 규격 (Q10용)
 */
export interface EvidenceTracePath {
  answerSummary: string;
  signalsUsed: string[];
  activationStates: Record<string, string>;
  secondRelationships: string[];
  rsiBand: string;
  originFacts: string[];
}

/**
 * 마보살 상담 대화 최종 답변
 */
export interface ConsultationAnswer {
  question: string;
  classifiedIntent: QuestionIntentType;
  primaryThemes: InterpretationTheme[];
  conclusion: string;           // ① 직관적인 한줄 결론
  evidence: string;             // ② 원천 사주 Fact 및 MaSignal 근거 설명
  structure: string;            // ③ 2차 관계 및 RSI 안정도 구조 해석
  actionableAdvice: string;     // ④ 현실적 조언 및 행동 가이드
  tracePath?: EvidenceTracePath; // Q10 근거 질문 시 필수 탑재
  certaintyDescription: string; // 확정도 자연어 설명 (PROVISIONAL 등)
  safetyNotes: string[];        // 안전 가이드라인 (의료기관 안내 등)
  fullResponseText: string;     // 마보살 페르소나 완결 대화문
}

/**
 * 대화 세션 컨텍스트 (연속 질문 일관성 유지용)
 */
export interface ConsultationDialogueContext {
  previousAnswers: ConsultationAnswer[];
  lastReferencedThemes: InterpretationTheme[];
}
